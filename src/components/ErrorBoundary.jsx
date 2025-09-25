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
        <div >
          <h2>Se produjo un error en la UI</h2>
          <p>Por favor recarga la página. Si persiste, revisa la consola.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre >
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

