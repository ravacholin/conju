import React, { useState, useEffect } from 'react'
import authService from '../../lib/auth/authService.js'
import AuthModal from './AuthModal.jsx'
import AccountManagementModal from './AccountManagementModal.jsx'
import DeviceManagerModal from './DeviceManagerModal.jsx'
import './AccountButton.css'

export default function AccountButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)

  useEffect(() => {
    // Initial state
    setIsAuthenticated(authService.isAuthenticated())
    setUser(authService.getUser())
    setAccount(authService.getAccount())

    // Listen for auth changes
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

  const handleLogin = () => {
    setShowAuthModal(true)
    setShowDropdown(false)
  }

  const handleLogout = async () => {
    await authService.logout()
    setShowDropdown(false)
  }

  const handleAuthSuccess = (result) => {
    console.log('✅ Autenticación exitosa:', result)
    setShowAuthModal(false)
  }

  const getDisplayName = () => {
    if (account?.name) return account.name
    if (account?.email) return account.email.split('@')[0]
    return 'Usuario'
  }

  const getDeviceName = () => {
    return user?.deviceName || 'Dispositivo actual'
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={handleLogin}
          className="account-login-btn"
          title="Iniciar sesión para sincronizar entre dispositivos"
        >
          <img src="/icons/user.png" alt="" className="menu-icon-small" /> Iniciar Sesión
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
    <>
      <div className="account-dropdown-container">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="account-button"
          title={`${getDisplayName()} - ${getDeviceName()}`}
        >
          <div className="account-avatar">
            {getDisplayName().charAt(0).toUpperCase()}
          </div>
          <div className="account-info">
            <div className="account-name">{getDisplayName()}</div>
            <div className="device-name">{getDeviceName()}</div>
          </div>
          <div className="dropdown-arrow">
            {showDropdown ? '▲' : '▼'}
          </div>
        </button>

        {showDropdown && (
          <div className="account-dropdown">
            <div className="dropdown-header">
              <div className="account-details">
                <div className="account-email">{account?.email}</div>
                <div className="sync-status">✅ Cuenta sincronizada</div>
              </div>
            </div>

            <div className="dropdown-divider" />

            <div className="dropdown-section">
              <div className="section-title"><img src="/icons/sparks.png" alt="" className="menu-icon-small" /> Sincronización</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  // Trigger sync
                  window.dispatchEvent(new CustomEvent('trigger-sync'))
                  setShowDropdown(false)
                }}
              >
                <img src="/icons/sparks.png" alt="" className="menu-icon-small" /> Sincronizar ahora
              </button>
            </div>

            <div className="dropdown-divider" />

            <div className="dropdown-section">
              <div className="section-title"><img src="/icons/robot.png" alt="" className="menu-icon-small" /> Cuenta</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowDropdown(false)
                  setShowAccountModal(true)
                }}
              >
                <img src="/icons/user.png" alt="" className="menu-icon-small" /> Gestionar cuenta
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowDropdown(false)
                  setShowDeviceModal(true)
                }}
              >
                <img src="/icons/bolt.png" alt="" className="menu-icon-small" /> Mis dispositivos
              </button>
            </div>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item logout-item"
              onClick={handleLogout}
            >
              <img src="/icons/bolt.png" alt="" className="menu-icon-small" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
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
    </>
  )
}
