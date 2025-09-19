// Google OAuth integration for Spanish Conjugator

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-abcdefg.apps.googleusercontent.com'

// Google Identity Services library loading
let isGoogleLibLoaded = false
let googleLibPromise = null

function loadGoogleLibrary() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google OAuth requires a browser environment'))
  }

  if (googleLibPromise) return googleLibPromise

  googleLibPromise = new Promise((resolve, reject) => {
    if (isGoogleLibLoaded) {
      resolve(window.google)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      isGoogleLibLoaded = true
      resolve(window.google)
    }

    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services'))
    }

    document.head.appendChild(script)
  })

  return googleLibPromise
}

// Initialize Google OAuth
export async function initializeGoogleAuth() {
  try {
    const google = await loadGoogleLibrary()

    if (!google?.accounts?.id) {
      throw new Error('Google Identity Services not available')
    }

    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    })

    console.log('✅ Google OAuth initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Google OAuth:', error)
    return false
  }
}

// Handle Google OAuth response
function handleGoogleResponse(response) {
  try {
    // Decode the JWT token from Google
    const payload = parseJWT(response.credential)

    if (!payload) {
      throw new Error('Invalid Google token')
    }

    // Extract user information
    const googleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    }

    console.log('📥 Google user data received:', {
      email: googleUser.email,
      name: googleUser.name,
      verified: googleUser.emailVerified
    })

    // Dispatch custom event with user data
    window.dispatchEvent(new CustomEvent('google-auth-success', {
      detail: googleUser
    }))

  } catch (error) {
    console.error('❌ Google auth response error:', error)
    window.dispatchEvent(new CustomEvent('google-auth-error', {
      detail: { error: error.message }
    }))
  }
}

// Parse JWT token (simple base64 decode)
function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

// Show Google Sign-In button
export async function showGoogleSignIn(element) {
  try {
    const google = await loadGoogleLibrary()

    if (!google?.accounts?.id) {
      throw new Error('Google Identity Services not available')
    }

    // Render the Google Sign-In button
    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left'
    })

    return true
  } catch (error) {
    console.error('❌ Failed to render Google Sign-In button:', error)
    return false
  }
}

// Trigger Google Sign-In popup
export async function triggerGoogleSignIn() {
  try {
    const google = await loadGoogleLibrary()

    if (!google?.accounts?.id) {
      throw new Error('Google Identity Services not available')
    }

    // Use popup method instead of One Tap - more reliable
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('Google One Tap blocked, trying alternative method')
        // Create invisible button and click it
        const tempDiv = document.createElement('div')
        tempDiv.style.display = 'none'
        document.body.appendChild(tempDiv)

        google.accounts.id.renderButton(tempDiv, {
          theme: 'outline',
          size: 'large'
        })

        // Trigger click programmatically
        setTimeout(() => {
          const button = tempDiv.querySelector('[role="button"]')
          if (button) button.click()
          document.body.removeChild(tempDiv)
        }, 100)
      }
    })

    return true
  } catch (error) {
    console.error('❌ Failed to trigger Google Sign-In:', error)
    // Don't throw error, just log it
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('google-auth-error', {
        detail: { error: 'Google OAuth no está disponible en este momento. Prueba con email y contraseña.' }
      }))
    }
    return false
  }
}

// Configuration check
export function isGoogleAuthConfigured() {
  return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== '123456789-abcdefg.apps.googleusercontent.com'
}

// Device name helper
export function getDeviceName() {
  try {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('mobile') || userAgent.includes('android')) {
      return 'Mobile Device'
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return 'Tablet'
    } else if (userAgent.includes('mac')) {
      return 'Mac'
    } else if (userAgent.includes('windows')) {
      return 'Windows PC'
    } else if (userAgent.includes('linux')) {
      return 'Linux PC'
    } else {
      return 'Unknown Device'
    }
  } catch (error) {
    return 'Unknown Device'
  }
}

export default {
  initializeGoogleAuth,
  showGoogleSignIn,
  triggerGoogleSignIn,
  isGoogleAuthConfigured,
  getDeviceName
}
