/**
 * Simple but robust router for the Spanish Conjugator app
 * Replaces manual History API management with a centralized solution
 */
import {
  DEFAULT_ROUTE,
  ROUTES,
  buildRouteURL,
  normalizeRoute,
  parseRouteFromURL
} from './routeContract.js'

const debug = (method, ...args) => {
  if (!import.meta.env?.DEV) return

  const fn = console[method]
  if (typeof fn === 'function') {
    fn(...args)
  }
}

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

    // Ensure history state is initialized for the current route
    this.ensureHistoryState()
  }

  /**
   * Parse the current URL to extract route information
   * Supports both pathname-based routes (/progress, /drill) and legacy query strings (?mode=progress)
   */
  parseCurrentURL() {
    try {
      return parseRouteFromURL({
        pathname: window.location.pathname || '/',
        search: window.location.search || ''
      })
    } catch (error) {
      debug('warn', 'Error parsing URL:', error)
      return normalizeRoute(DEFAULT_ROUTE)
    }
  }

  /**
   * Navigate to a new route
   */
  navigate(route, options = {}) {
    if (this.isNavigating) return Promise.resolve()

    try {
      // Safety timeout to prevent infinite lock
      setTimeout(() => {
        if (this.isNavigating) {
          console.warn('Router: Navigation timed out, forcing reset')
          this.isNavigating = false
        }
      }, 2000)

      this.isNavigating = true

      const newRoute = normalizeRoute(route)

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
    debug('group', '🔙 Router PopState')
    debug('log', 'History event state:', event.state)

    try {
      const state = event.state || window.history.state || {}

      if (state && state.appNav) {
        // Valid app navigation state
        const route = normalizeRoute(state)

        debug('log', '📋 Valid app navigation state found:', route)
        this.currentRoute = route
        this.notifyListeners(route, 'popstate')
      } else {
        // No valid state, parse from URL
        debug('log', '📋 No valid state, parsing from URL')
        const route = this.parseCurrentURL()
        this.currentRoute = route
        this.notifyListeners(route, 'popstate')
      }
    } catch (error) {
      console.error('Error handling popstate:', error)
      // Fallback to default route
      const fallbackRoute = normalizeRoute(DEFAULT_ROUTE)
      this.currentRoute = fallbackRoute
      this.notifyListeners(fallbackRoute, 'popstate')
    }

    debug('groupEnd')
  }

  /**
   * Build URL from route object
   * Uses pathname-based routing for clean URLs (/progress, /drill/3)
   */
  buildURL(route) {
    return buildRouteURL(route)
  }

  /**
   * Ensure history state is initialized for the current route
   */
  ensureHistoryState() {
    try {
      const state = window.history.state || {}
      const expectedUrl = this.buildURL(this.currentRoute)
      const currentPath = window.location.pathname || '/'
      const hasLegacySearch = Boolean(window.location.search)
      const needsCanonicalUrl = currentPath !== expectedUrl || hasLegacySearch

      if (state && state.appNav && !needsCanonicalUrl) {
        return
      }

      const historyState = {
        appNav: true,
        ...this.currentRoute
      }

      window.history.replaceState(historyState, '', expectedUrl)
    } catch (error) {
      debug('warn', 'Error ensuring history state:', error)
    }
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
        this.navigate(ROUTES.homeMenu())
      }
    } catch (error) {
      console.error('Error navigating back:', error)
      // Fallback navigation
      this.navigate(ROUTES.homeMenu())
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
