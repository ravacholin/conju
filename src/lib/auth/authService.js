// Authentication service for Spanish Conjugator

import {
  initializeGoogleAuth,
  triggerGoogleSignIn,
  isGoogleAuthConfigured
} from './googleAuth.js'
import { getSyncApiBase, getSyncConfigDebug } from '../config/syncConfig.js'

// Use intelligent environment detection for sync URL
const API_BASE = getSyncApiBase()

class AuthService {
  constructor() {
    this.token = null
    this.user = null
    this.account = null
    this.googleInitPromise = null
    this.googleListenersAttached = false
    this.postLoginMigrationPromise = null
    this.lastMigratedAnonymousId = null
    this.loadFromStorage()
    this.setupGoogleEventListeners()

    // Debug sync configuration on initialization
    console.log('🔧 AuthService initialized with sync config:', getSyncConfigDebug())
  }

  // Storage management
  loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const user = localStorage.getItem('auth_user')
      const account = localStorage.getItem('auth_account')

      if (token && user && account) {
        this.token = token
        this.user = JSON.parse(user)
        this.account = JSON.parse(account)
      }
    } catch (error) {
      console.warn('Failed to load auth from storage:', error)
      this.clearAuth()
    }
  }

  saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      if (this.token && this.user && this.account) {
        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('auth_user', JSON.stringify(this.user))
        localStorage.setItem('auth_account', JSON.stringify(this.account))
      }
    } catch (error) {
      console.warn('Failed to save auth to storage:', error)
    }
  }

  clearAuth() {
    this.token = null
    this.user = null
    this.account = null
    this.postLoginMigrationPromise = null
    this.lastMigratedAnonymousId = null

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_account')
    } catch (error) {
      console.warn('Failed to clear auth storage:', error)
    }

    // Clear sync configuration to prevent cross-user data leaks
    try {
      // Import dynamically to avoid circular dependency
      import('../progress/userManager.js').then(({ clearSyncAuthToken }) => {
        clearSyncAuthToken()
      }).catch(() => {
        // Silent fail if userManager is not available
      })
    } catch (error) {
      console.warn('Could not clear sync token on logout:', error)
    }
  }

  // Authentication methods
  async register(email, password, name = null) {
    const deviceName = this.getDeviceName()

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        name,
        deviceName
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    this.token = data.token
    this.user = data.user
    this.account = data.account
    this.saveToStorage()

    await this.ensureAnonymousProgressMigration()

    return data
  }

  async login(email, password) {
    const deviceName = this.getDeviceName()

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        deviceName
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    this.token = data.token
    this.user = data.user
    this.account = data.account
    this.saveToStorage()

    await this.ensureAnonymousProgressMigration()

    return data
  }

  async loginWithGoogle(googleData) {
    const deviceName = this.getDeviceName()

    if (!googleData?.credential) {
      throw new Error('Google credential required')
    }

    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credential: googleData.credential,
        deviceName,
        profile: googleData.profile || null
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Google login failed')
    }

    this.token = data.token
    this.user = data.user
    this.account = data.account
    this.saveToStorage()

    await this.ensureAnonymousProgressMigration()

    return data
  }

  async logout() {
    this.clearAuth()

    // Emit logout event for components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-logout'))
    }
  }

  // Account management
  async getAccountInfo() {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth()
      }
      throw new Error(data.error || 'Failed to get account info')
    }

    if (data?.account) {
      this.account = data.account
      this.saveToStorage()
      this.emitAccountUpdated()
    }

    return data
  }

  async updateAccountProfile(updates = {}) {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/account`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(updates)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update account')
    }

    if (data?.account) {
      this.account = data.account
      this.saveToStorage()
      this.emitAccountUpdated()
    }

    return data.account
  }

  async listDevices() {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/devices`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load devices')
    }

    return data.devices || []
  }

  async renameDevice(deviceId, deviceName) {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/devices/${deviceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ deviceName })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to rename device')
    }

    if (Array.isArray(data.devices)) {
      if (this.user?.deviceId === deviceId && data.device) {
        this.user = {
          ...this.user,
          deviceName: data.device.device_name || deviceName
        }
        this.saveToStorage()
      }
      this.emitAccountUpdated()
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-sync'))
    }

    return data.devices || []
  }

  async revokeDevice(deviceId) {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to revoke device')
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-sync'))
    }

    this.emitAccountUpdated()

    return data.devices || []
  }

  async getMergedData() {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/data/merged`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth()
      }
      throw new Error(data.error || 'Failed to get merged data')
    }

    return data
  }

  async migrateAnonymousAccount(anonymousUserId) {
    if (!this.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE}/auth/migrate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        anonymousUserId
      })
    })

    let data = {}
    try {
      data = await response.json()
    } catch {
      data = {}
    }

    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        error: data.error || 'Anonymous user not found or already linked'
      }
    }

    if (!response.ok) {
      throw new Error(data.error || 'Migration failed')
    }

    return data
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token && !!this.user && !!this.account
  }

  getToken() {
    return this.token
  }

  getUser() {
    return this.user
  }

  getAccount() {
    return this.account
  }

  getUserId() {
    return this.user?.id || null
  }

  getDeviceName() {
    try {
      const ua = navigator.userAgent
      let deviceName = 'Unknown Device'

      if (/iPhone|iPad|iPod/.test(ua)) {
        deviceName = 'iOS Device'
      } else if (/Android/.test(ua)) {
        deviceName = 'Android Device'
      } else if (/Macintosh|Mac OS X/.test(ua)) {
        deviceName = 'Mac'
      } else if (/Windows/.test(ua)) {
        deviceName = 'Windows PC'
      } else if (/Linux/.test(ua)) {
        deviceName = 'Linux PC'
      }

      return deviceName
    } catch {
      return 'Unknown Device'
    }
  }

  // Event handlers for auth state changes
  onAuthChange(callback) {
    if (typeof window === 'undefined') return

    const handleAuthChange = () => callback(this.isAuthenticated())

    window.addEventListener('auth-login', handleAuthChange)
    window.addEventListener('auth-logout', handleAuthChange)

    // Return cleanup function
    return () => {
      window.removeEventListener('auth-login', handleAuthChange)
      window.removeEventListener('auth-logout', handleAuthChange)
    }
  }

  // Emit login event
  emitLoginEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-login'))
    }
  }

  emitAccountUpdated() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('account-updated'))
    }
  }

  // Google OAuth methods
  async initializeGoogleAuth() {
    if (typeof window === 'undefined') {
      return false
    }

    this.setupGoogleEventListeners()

    if (!this.googleInitPromise) {
      this.googleInitPromise = (async () => {
        const initialized = await initializeGoogleAuth()

        if (!initialized) {
          this.googleInitPromise = null
          console.warn('⚠️ Google OAuth initialization was not successful')
        } else {
          console.log('✅ Google OAuth initialized in AuthService')
        }

        return initialized
      })().catch((error) => {
        this.googleInitPromise = null
        console.warn('⚠️ Failed to initialize Google OAuth:', error?.message || error)
        return false
      })
    }

    return this.googleInitPromise
  }

  setupGoogleEventListeners() {
    if (typeof window === 'undefined' || this.googleListenersAttached) return

    // Listen for Google auth success
    window.addEventListener('google-auth-success', async (event) => {
      const googleUser = event.detail
      try {
        console.log('🔵 Processing Google auth success event:', googleUser)
        await this.processGoogleLogin(googleUser)

        // Emit login event after successful processing
        this.emitLoginEvent()

        console.log('✅ Google authentication completed successfully')
      } catch (error) {
        console.error('❌ Failed to process Google login:', error)
        // Emit error event
        window.dispatchEvent(new CustomEvent('google-auth-error', {
          detail: { error: error.message }
        }))
      }
    })

    // Listen for Google auth errors
    window.addEventListener('google-auth-error', (event) => {
      const error = event.detail.error
      console.error('Google auth error:', error)
    })

    this.googleListenersAttached = true
  }

  async processGoogleLogin(googleUser) {
    try {
      const deviceName = this.getDeviceName()

      if (!googleUser?.credential) {
        throw new Error('Google ID token missing from response')
      }

      const data = {
        credential: googleUser.credential,
        deviceName,
        profile: {
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          emailVerified: googleUser.emailVerified === true
        }
      }

      console.log('🔵 Sending Google login request to server:', {
        email: googleUser.email,
        name: googleUser.name,
        deviceName: data.deviceName,
        emailVerified: googleUser.emailVerified
      })

      const response = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Google login failed')
      }

      // Store auth data
      this.token = result.token
      this.user = result.user
      this.account = result.account
      this.saveToStorage()

      await this.ensureAnonymousProgressMigration()

      console.log('✅ Google login successful:', {
        email: this.account.email,
        name: this.account.name,
        device: this.user.deviceName,
        token: this.token ? 'Present' : 'Missing'
      })

      return result
    } catch (error) {
      console.error('❌ Google login processing error:', error)
      throw error
    }
  }

  async ensureAnonymousProgressMigration() {
    if (!this.token) {
      return null
    }

    if (this.postLoginMigrationPromise) {
      return this.postLoginMigrationPromise
    }

    this.postLoginMigrationPromise = (async () => {
      try {
        const module = await import('../progress/userManager.js')
        const getProgressUserId = module?.getCurrentUserId

        if (typeof getProgressUserId !== 'function') {
          return null
        }

        const anonymousUserId = getProgressUserId()
        if (!anonymousUserId) {
          return null
        }

        if (this.lastMigratedAnonymousId === anonymousUserId) {
          return null
        }

        const authenticatedUserId = this.user?.id || null
        if (anonymousUserId === authenticatedUserId) {
          this.lastMigratedAnonymousId = anonymousUserId
          return null
        }

        // 1. Migrar en el servidor (vincula usuario anónimo a la cuenta)
        const migrationResult = await this.migrateAnonymousAccount(anonymousUserId)

        if (migrationResult?.status === 404) {
          console.info('Anonymous progress already linked to an account or not found', {
            anonymousUserId
          })
        } else if (migrationResult) {
          console.log('✅ Anonymous progress linked to authenticated account on server', {
            anonymousUserId
          })
        }

        // 2. CRÍTICO: Migrar datos locales en IndexedDB del userId anónimo al autenticado
        let localMigrationResult = null
        let validationResult = null
        try {
          console.log('🔄 Iniciando migración local de IndexedDB...')
          const databaseModule = await import('../progress/database.js')
          const { migrateUserIdInLocalDB, validateUserIdMigration, revertUserIdMigration } = databaseModule

          if (typeof migrateUserIdInLocalDB === 'function') {
            // Ejecutar migración
            localMigrationResult = await migrateUserIdInLocalDB(anonymousUserId, authenticatedUserId)
            console.log('✅ Migración local de IndexedDB completada:', localMigrationResult)

            // Validar que la migración fue exitosa
            if (typeof validateUserIdMigration === 'function') {
              validationResult = await validateUserIdMigration(anonymousUserId, authenticatedUserId)
              console.log('🔍 Resultado de validación:', validationResult)

              if (!validationResult.valid) {
                console.error('❌ Validación de migración falló. Intentando revertir...')

                // Intentar revertir la migración
                if (typeof revertUserIdMigration === 'function') {
                  try {
                    await revertUserIdMigration(authenticatedUserId, anonymousUserId)
                    console.log('✅ Migración revertida exitosamente')
                    localMigrationResult = {
                      error: 'migration_validation_failed',
                      reverted: true,
                      validationResult
                    }
                  } catch (revertError) {
                    console.error('❌ Error crítico: no se pudo revertir migración:', revertError)
                    localMigrationResult = {
                      error: 'migration_validation_failed_and_revert_failed',
                      validationResult,
                      revertError: revertError.message
                    }
                  }
                }
              } else {
                console.log('✅ Migración validada exitosamente')
                localMigrationResult = { ...localMigrationResult, validated: true, validationResult }
              }
            }
          } else {
            console.warn('⚠️ Función migrateUserIdInLocalDB no encontrada')
          }
        } catch (localError) {
          console.error('❌ Error en migración local de IndexedDB:', localError)
          localMigrationResult = { error: localError.message }
        }

        // 3. Actualizar el sistema de progreso para usar el nuevo userId 
        // Fix: Treat "no rows migrated" case as success - still call setCurrentUserId
        if (localMigrationResult && !localMigrationResult.error && validationResult?.valid) {
          try {
            console.log('🔄 Actualizando sistema de progreso con nuevo userId...')
            const progressModule = await import('../progress/index.js')
            const { setCurrentUserId } = progressModule

            if (typeof setCurrentUserId === 'function') {
              const updateSuccess = setCurrentUserId(authenticatedUserId)
              if (updateSuccess) {
                console.log('✅ Sistema de progreso actualizado con nuevo userId')
              } else {
                console.warn('⚠️ No se pudo actualizar userId en sistema de progreso')
              }
            }
          } catch (progressError) {
            console.warn('⚠️ Error actualizando sistema de progreso:', progressError.message)
          }
        } else if (localMigrationResult && !localMigrationResult.error && 
                   validationResult && 
                   validationResult.totalRemaining === 0 && 
                   validationResult.totalNew === 0) {
          // Special case: no rows to migrate (fresh device)
          // Treat as success and still update the progress system
          try {
            console.log('🔄 Actualizando sistema de progreso con nuevo userId (no data to migrate)...')
            const progressModule = await import('../progress/index.js')
            const { setCurrentUserId } = progressModule

            if (typeof setCurrentUserId === 'function') {
              const updateSuccess = setCurrentUserId(authenticatedUserId)
              if (updateSuccess) {
                console.log('✅ Sistema de progreso actualizado con nuevo userId (no data case)')
              } else {
                console.warn('⚠️ No se pudo actualizar userId en sistema de progreso (no data case)')
              }
            }
          } catch (progressError) {
            console.warn('⚠️ Error actualizando sistema de progreso (no data case):', progressError.message)
          }
        } else {
          console.warn('⚠️ Saltando actualización de sistema de progreso - migración no exitosa')
        }

        this.lastMigratedAnonymousId = anonymousUserId

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('progress:migration-complete', {
            detail: {
              anonymousUserId,
              authenticatedUserId,
              serverMigration: migrationResult,
              localMigration: localMigrationResult
            }
          }))
        }

        return {
          serverMigration: migrationResult,
          localMigration: localMigrationResult,
          anonymousUserId,
          authenticatedUserId
        }
      } catch (error) {
        console.warn('⚠️ Failed to migrate anonymous progress:', error?.message || error)
        return null
      } finally {
        this.postLoginMigrationPromise = null
      }
    })()

    return this.postLoginMigrationPromise
  }

  async triggerGoogleSignIn() {
    try {
      if (!isGoogleAuthConfigured()) {
        throw new Error('Google OAuth no está configurado correctamente')
      }

      const initialized = await this.initializeGoogleAuth()

      if (!initialized) {
        throw new Error('Google OAuth no está disponible en este dispositivo')
      }

      return await triggerGoogleSignIn()
    } catch (error) {
      console.error('Failed to trigger Google Sign-In:', error)
      throw error
    }
  }

  isLoggedIn() {
    return !!this.token
  }

  isGoogleAvailable() {
    return isGoogleAuthConfigured()
  }
}

// Export singleton instance
export const authService = new AuthService()

// Expose authService globally for debugging
if (typeof window !== 'undefined') {
  window.authService = authService
}

export default authService
