/**
 * Simple but robust router for the Spanish Conjugator app
 * Replaces manual History API management with a centralized solution
 */

class Router {
  constructor() {
    this.currentRoute = null
    this.listeners = new Set()
    this.isNavigating = false
    
    // Bind methods to maintain context
    this.handlePopState = this.handlePopState.bind(this)
    
    // Initialize
    this.init()
  }

  init() {
    // Listen for browser back/forward events
    window.addEventListener('popstate', this.handlePopState)
    
    // Parse initial route from URL
    this.currentRoute = this.parseCurrentURL()
  }

  /**
   * Parse the current URL to extract route information
   */
  parseCurrentURL() {
    try {
      const params = new URLSearchParams(window.location.search || '')
      const mode = params.get('mode') || 'onboarding'
      const step = parseInt(params.get('step'), 10) || null
      
      return {
        mode: ['onboarding', 'drill', 'learning', 'progress'].includes(mode) ? mode : 'onboarding',
        step: step && step >= 1 && step <= 8 ? step : null,
        timestamp: Date.now()
      }
    } catch (error) {
      console.warn('Error parsing URL:', error)
      return { mode: 'onboarding', step: null, timestamp: Date.now() }
    }
  }

  /**
   * Navigate to a new route
   */
  navigate(route, options = {}) {
    if (this.isNavigating) return Promise.resolve()
    
    try {
      this.isNavigating = true
      
      const newRoute = {
        mode: route.mode || 'onboarding',
        step: route.step || null,
        timestamp: Date.now(),
        ...route
      }

      // Validate route
      if (!['onboarding', 'drill', 'learning', 'progress'].includes(newRoute.mode)) {
        console.warn('Invalid route mode:', newRoute.mode)
        newRoute.mode = 'onboarding'
      }

      // Update browser history
      const historyState = { 
        appNav: true, 
        ...newRoute
      }

      const url = this.buildURL(newRoute)
      
      if (options.replace) {
        window.history.replaceState(historyState, '', url)
      } else {
        window.history.pushState(historyState, '', url)
      }

      // Update current route and notify listeners
      this.currentRoute = newRoute
      this.notifyListeners(newRoute, 'navigate')
      
      return Promise.resolve()
    } catch (error) {
      console.error('Navigation error:', error)
      return Promise.reject(error)
    } finally {
      this.isNavigating = false
    }
  }

  /**
   * Handle browser back/forward events
   */
  handlePopState(event) {
    console.group(' Router PopState')
    console.log('History event state:', event.state)
    
    try {
      const state = event.state || window.history.state || {}
      
      if (state && state.appNav) {
        // Valid app navigation state
        const route = {
          mode: state.mode || 'onboarding',
          step: state.step || null,
          timestamp: state.timestamp || Date.now()
        }
        
        console.log(' Valid app navigation state found:', route)
        this.currentRoute = route
        this.notifyListeners(route, 'popstate')
      } else {
        // No valid state, parse from URL
        console.log(' No valid state, parsing from URL')
        const route = this.parseCurrentURL()
        this.currentRoute = route
        this.notifyListeners(route, 'popstate')
      }
    } catch (error) {
      console.error('Error handling popstate:', error)
      // Fallback to default route
      const fallbackRoute = { mode: 'onboarding', step: null, timestamp: Date.now() }
      this.currentRoute = fallbackRoute
      this.notifyListeners(fallbackRoute, 'popstate')
    }
    
    console.groupEnd()
  }

  /**
   * Build URL from route object
   */
  buildURL(route) {
    const params = new URLSearchParams()
    params.set('mode', route.mode)
    if (route.step) {
      params.set('step', route.step.toString())
    }
    return `?${params.toString()}`
  }

  /**
   * Subscribe to route changes
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Router listener must be a function')
    }
    
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of route changes
   */
  notifyListeners(route, type) {
    this.listeners.forEach(listener => {
      try {
        listener(route, type)
      } catch (error) {
        console.error('Router listener error:', error)
      }
    })
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return { ...this.currentRoute }
  }

  /**
   * Check if currently on a specific route
   */
  isCurrentRoute(mode, step = null) {
    return this.currentRoute?.mode === mode && 
           (step === null || this.currentRoute?.step === step)
  }

  /**
   * Navigate back in history
   */
  back() {
    try {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        // Fallback to home
        this.navigate({ mode: 'onboarding', step: 2 })
      }
    } catch (error) {
      console.error('Error navigating back:', error)
      // Fallback navigation
      this.navigate({ mode: 'onboarding', step: 2 })
    }
  }

  /**
   * Cleanup when router is no longer needed
   */
  destroy() {
    window.removeEventListener('popstate', this.handlePopState)
    this.listeners.clear()
  }
}

// Create singleton instance
const router = new Router()

export default router