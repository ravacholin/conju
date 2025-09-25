import React, { Component } from 'react'

/**
 * Error boundary específico para componentes de progreso
 * Evita que un error en un componente crashee toda la sección
 */
class SafeComponent extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`SafeComponent caught error in ${this.props.name || 'Unknown'}:`, error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1rem',
          border: '1px solid #f87171',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#dc2626'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>
            ⚠️ Error en {this.props.name || 'componente'}
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            No se pudo cargar esta sección. Los demás datos siguen disponibles.
          </p>
          <button 
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Reintentar
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                Detalles técnicos
              </summary>
              <pre style={{
                fontSize: '0.75rem',
                backgroundColor: '#111827',
                color: '#e5e7eb',
                padding: '0.5rem',
                borderRadius: '4px',
                marginTop: '0.5rem',
                overflow: 'auto'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default SafeComponent