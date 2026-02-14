import React, { useState, useEffect, useRef } from 'react'
import authService from '../../lib/auth/authService.js'
import { useSyncStatus } from '../../hooks/useSyncStatus.js'
import AuthModal from './AuthModal.jsx'
import AccountManagementModal from './AccountManagementModal.jsx'
import DeviceManagerModal from './DeviceManagerModal.jsx'
import './AccountButton.css'

function SyncBadge({ syncStatus }) {
  const { isSyncing, lastSyncTime, syncError, isOnline, syncEnabled, isLocalSync } = syncStatus

  if (isSyncing) {
    return <span className="acct-sync-badge acct-sync-badge--syncing">SYNC...</span>
  }
  if (syncError) {
    return <span className="acct-sync-badge acct-sync-badge--error">ERROR</span>
  }
  if (!isOnline) {
    return <span className="acct-sync-badge acct-sync-badge--offline">OFFLINE</span>
  }
  if (isLocalSync || !syncEnabled) {
    return <span className="acct-sync-badge acct-sync-badge--local">LOCAL</span>
  }
  if (lastSyncTime) {
    const mins = Math.floor((Date.now() - lastSyncTime.getTime()) / 60000)
    if (mins < 1) return <span className="acct-sync-badge acct-sync-badge--ok">OK</span>
    if (mins < 60) return <span className="acct-sync-badge acct-sync-badge--ok">{mins}m</span>
    return <span className="acct-sync-badge acct-sync-badge--stale">{Math.floor(mins / 60)}h</span>
  }
  return <span className="acct-sync-badge acct-sync-badge--unknown">--</span>
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

  // Close dropdown on click outside
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

  const handleLogin = () => {
    setShowAuthModal(true)
    setShowDropdown(false)
  }

  const handleLogout = async () => {
    await authService.logout()
    setShowDropdown(false)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  const handleSync = () => {
    window.dispatchEvent(new CustomEvent('trigger-sync'))
    setSyncTriggered(true)
    setTimeout(() => setSyncTriggered(false), 3000)
  }

  const getDisplayName = () => {
    if (account?.name) return account.name
    if (account?.email) return account.email.split('@')[0]
    return 'Usuario'
  }

  const getInitial = () => getDisplayName().charAt(0).toUpperCase()

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={handleLogin}
          className="acct-login-btn"
          title="Iniciar sesión para sincronizar entre dispositivos"
        >
          INICIAR SESIÓN
        </button>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    )
  }

  return (
    <div className="acct-container">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`acct-trigger ${showDropdown ? 'acct-trigger--open' : ''}`}
        title={getDisplayName()}
      >
        <span className="acct-avatar">{getInitial()}</span>
        <SyncBadge syncStatus={syncStatus} />
      </button>

      {showDropdown && (
        <div className="acct-dropdown" ref={dropdownRef}>
          {/* User info header */}
          <div className="acct-dropdown__header">
            <div className="acct-dropdown__avatar">{getInitial()}</div>
            <div className="acct-dropdown__user-info">
              <div className="acct-dropdown__name">{getDisplayName()}</div>
              <div className="acct-dropdown__email">{account?.email}</div>
            </div>
          </div>

          <div className="acct-dropdown__divider" />

          {/* Sync status section */}
          <div className="acct-dropdown__section">
            <div className="acct-dropdown__section-label">SINCRONIZACIÓN</div>
            <div className="acct-dropdown__sync-status">
              <div className="acct-dropdown__sync-row">
                <span className="acct-dropdown__sync-label">Estado</span>
                <span className={`acct-dropdown__sync-value ${
                  syncStatus.isSyncing ? 'syncing' :
                  syncStatus.syncError ? 'error' :
                  !syncStatus.isOnline ? 'offline' : 'ok'
                }`}>
                  {syncStatus.isSyncing ? 'Sincronizando...' :
                   syncStatus.syncError ? 'Error' :
                   !syncStatus.isOnline ? 'Sin conexión' :
                   syncStatus.isLocalSync ? 'Solo local' : 'Conectado'}
                </span>
              </div>
              <div className="acct-dropdown__sync-row">
                <span className="acct-dropdown__sync-label">Última sync</span>
                <span className="acct-dropdown__sync-value">
                  {formatLastSync(syncStatus.lastSyncTime)}
                </span>
              </div>
              {syncStatus.syncError && (
                <div className="acct-dropdown__sync-error">
                  {syncStatus.syncError}
                </div>
              )}
            </div>
            <button
              className="acct-dropdown__action-btn"
              onClick={handleSync}
              disabled={syncStatus.isSyncing || syncTriggered}
            >
              {syncStatus.isSyncing ? 'SINCRONIZANDO...' :
               syncTriggered ? 'ENVIADO' : 'SINCRONIZAR AHORA'}
            </button>
          </div>

          <div className="acct-dropdown__divider" />

          {/* Account actions */}
          <div className="acct-dropdown__section">
            <button
              className="acct-dropdown__menu-item"
              onClick={() => { setShowDropdown(false); setShowAccountModal(true) }}
            >
              <span className="acct-dropdown__menu-icon">&#9881;</span>
              Gestionar cuenta
            </button>
            <button
              className="acct-dropdown__menu-item"
              onClick={() => { setShowDropdown(false); setShowDeviceModal(true) }}
            >
              <span className="acct-dropdown__menu-icon">&#9744;</span>
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
