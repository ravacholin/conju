import React, { useState, useEffect, useRef } from 'react'
import authService from '../../lib/auth/authService.js'
import { useSyncStatus } from '../../hooks/useSyncStatus.js'
import AuthModal from './AuthModal.jsx'
import AccountManagementModal from './AccountManagementModal.jsx'
import DeviceManagerModal from './DeviceManagerModal.jsx'
import './AccountButton.css'

function syncStateLabel(syncStatus) {
  const { isSyncing, syncError, isOnline, isLocalSync, syncEnabled, lastSyncTime } = syncStatus
  if (isSyncing)  return { text: 'SYNC...', cls: 'syncing' }
  if (syncError)  return { text: 'ERROR',   cls: 'error' }
  if (!isOnline)  return { text: 'OFFLINE', cls: 'offline' }
  if (isLocalSync || !syncEnabled) return { text: 'LOCAL', cls: 'local' }
  if (lastSyncTime) {
    const mins = Math.floor((Date.now() - lastSyncTime.getTime()) / 60000)
    if (mins < 1)  return { text: 'OK',        cls: 'ok' }
    if (mins < 60) return { text: `${mins}m`,   cls: 'ok' }
    return           { text: `${Math.floor(mins/60)}h`, cls: 'stale' }
  }
  return { text: '--', cls: 'unknown' }
}

function formatLastSync(lastSyncTime) {
  if (!lastSyncTime) return 'Nunca'
  const mins = Math.floor((Date.now() - lastSyncTime.getTime()) / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

export default function AccountButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [syncTriggered, setSyncTriggered] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const syncStatus = useSyncStatus()

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
    setUser(authService.getUser())
    setAccount(authService.getAccount())

    const cleanup = authService.onAuthChange((authenticated) => {
      setIsAuthenticated(authenticated)
      setUser(authService.getUser())
      setAccount(authService.getAccount())
    })

    const handleAccountUpdated = () => {
      setAccount(authService.getAccount())
      setUser(authService.getUser())
    }

    window.addEventListener('account-updated', handleAccountUpdated)
    return () => {
      cleanup?.()
      window.removeEventListener('account-updated', handleAccountUpdated)
    }
  }, [])

  useEffect(() => {
    if (!showDropdown) return
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const handleLogin = () => { setShowAuthModal(true); setShowDropdown(false) }
  const handleLogout = async () => { await authService.logout(); setShowDropdown(false) }
  const handleAuthSuccess = () => setShowAuthModal(false)

  const handleSync = () => {
    window.dispatchEvent(new CustomEvent('trigger-sync'))
    setSyncTriggered(true)
    setTimeout(() => setSyncTriggered(false), 3000)
  }

  const getDisplayName = () => {
    if (account?.name) return account.name.split(' ')[0]
    if (account?.email) return account.email.split('@')[0]
    return 'cuenta'
  }

  const getInitial = () => getDisplayName().charAt(0).toUpperCase()

  const sync = syncStateLabel(syncStatus)

  /* ─── Unauthenticated ─── */
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={handleLogin}
          className="acct-login-btn"
          title="Iniciá sesión para sincronizar tu progreso entre dispositivos"
        >
          <span className="acct-login-label">SINCRONIZAR</span>
          <span className="acct-login-arrow">→</span>
        </button>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    )
  }

  /* ─── Authenticated ─── */
  return (
    <div className="acct-container">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`acct-trigger${showDropdown ? ' acct-trigger--open' : ''}`}
        title={`${getDisplayName()} — sync: ${sync.text}`}
      >
        <span className="acct-initial">{getInitial()}</span>
        <span className="acct-name">{getDisplayName()}</span>
        <span className={`acct-status acct-status--${sync.cls}`}>{sync.text}</span>
      </button>

      {showDropdown && (
        <div className="acct-dropdown" ref={dropdownRef}>

          {/* User header */}
          <div className="acct-dropdown__header">
            <span className="acct-dropdown__avatar">{getInitial()}</span>
            <div className="acct-dropdown__user-info">
              <div className="acct-dropdown__name">{getDisplayName()}</div>
              <div className="acct-dropdown__email">{account?.email}</div>
            </div>
          </div>

          <div className="acct-dropdown__divider" />

          {/* Sync section */}
          <div className="acct-dropdown__section">
            <div className="acct-dropdown__section-label">SINCRONIZACIÓN</div>
            <div className="acct-dropdown__sync-grid">
              <span className="acct-dropdown__sync-key">Estado</span>
              <span className={`acct-dropdown__sync-val ${sync.cls}`}>
                {syncStatus.isSyncing ? 'Sincronizando' :
                 syncStatus.syncError ? 'Error' :
                 !syncStatus.isOnline ? 'Sin conexión' :
                 syncStatus.isLocalSync ? 'Solo local' : 'Conectado'}
              </span>
              <span className="acct-dropdown__sync-key">Última sync</span>
              <span className="acct-dropdown__sync-val">
                {formatLastSync(syncStatus.lastSyncTime)}
              </span>
            </div>
            {syncStatus.syncError && (
              <div className="acct-dropdown__sync-error">{syncStatus.syncError}</div>
            )}
            <button
              className="acct-dropdown__sync-btn"
              onClick={handleSync}
              disabled={syncStatus.isSyncing || syncTriggered}
            >
              {syncStatus.isSyncing ? 'SINCRONIZANDO...' :
               syncTriggered ? 'ENVIADO ✓' : 'SINCRONIZAR AHORA'}
            </button>
          </div>

          <div className="acct-dropdown__divider" />

          {/* Menu items */}
          <div className="acct-dropdown__section acct-dropdown__section--menu">
            <button
              className="acct-dropdown__menu-item"
              onClick={() => { setShowDropdown(false); setShowAccountModal(true) }}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Gestionar cuenta
            </button>
            <button
              className="acct-dropdown__menu-item"
              onClick={() => { setShowDropdown(false); setShowDeviceModal(true) }}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="10" y="6" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Mis dispositivos
            </button>
          </div>

          <div className="acct-dropdown__divider" />

          <button
            className="acct-dropdown__menu-item acct-dropdown__menu-item--danger"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <AccountManagementModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
      <DeviceManagerModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        currentDeviceId={user?.deviceId}
      />
    </div>
  )
}
