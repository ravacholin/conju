import React from 'react';
import { createLogger } from '../../lib/utils/logger.js';

const logger = createLogger('DrillErrorBoundary');

class DrillErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error('Drill crashed', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        // Optional: Trigger a reload of the drill if needed, or just re-render children
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    handleGoHome = () => {
        if (this.props.onHome) {
            this.props.onHome();
        } else {
            window.location.href = '/';
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="drill-error-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-primary)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ marginBottom: '1rem' }}>Algo salió mal en la práctica</h2>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                        No te preocupes, tu progreso hasta ahora está guardado.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Intentar de nuevo
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Volver al inicio
                        </button>
                    </div>
                    {import.meta.env.DEV && (
                        <pre style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: '#00000033',
                            borderRadius: '4px',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'auto',
                            fontSize: '0.8rem'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default DrillErrorBoundary;
