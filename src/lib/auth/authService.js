// Authentication service for Spanish Conjugator

const API_BASE = import.meta.env.VITE_PROGRESS_SYNC_URL || 'https://conju.onrender.com/api'

class AuthService {
  constructor() {
    this.token = null
    this.user = null
    this.account = null
    this.loadFromStorage()
  }

  // Storage management
  loadFromStorage() {
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

    return data
  }

  async loginWithGoogle(googleData) {
    const deviceName = this.getDeviceName()

    const response = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...googleData,
        deviceName
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

    return data
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

    const data = await response.json()

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
}

// Export singleton instance
export const authService = new AuthService()
export default authService