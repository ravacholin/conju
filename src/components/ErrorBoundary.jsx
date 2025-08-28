import React, { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log for debugging; could be sent to analytics in production
    console.error('Unhandled render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#e11d48' }}>
          <h2>Se produjo un error en la UI</h2>
          <p>Por favor recarga la página. Si persiste, revisa la consola.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#e5e7eb', padding: '1rem', borderRadius: 8 }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

