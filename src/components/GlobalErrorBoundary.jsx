import React from 'react'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log for debugging
    console.error('️ Error de aplicación capturado por GlobalErrorBoundary:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const msg = (this.state.error && this.state.error.message) || 'Error inesperado'
      return (
        <div className="App">
          <div className="error-overlay">
            <h2>️ Error de aplicación</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{msg}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={this.handleRetry}>
                Reintentar
              </button>
              <button className="btn" style={{ marginLeft: 8 }} onClick={() => window.location.reload()}>
                Recargar
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default GlobalErrorBoundary

