import { useState, useEffect, useCallback } from 'react'
import authService from '../../lib/auth/authService.js'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  useEffect(() => {
    authService.initializeGoogleAuth()
  }, [])

  // Listen for auth events
  useEffect(() => {
    const handleAuthLogin = () => {
      console.log('🔵 AuthModal: Received auth-login event')
      setLoading(false)
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({ email: '', password: '', name: '' })
    }

    const handleGoogleError = (event) => {
      console.log('🔴 AuthModal: Received google-auth-error event:', event.detail)
      setLoading(false)
      setError(event.detail.error || 'Error con Google OAuth')
    }

    window.addEventListener('auth-login', handleAuthLogin)
    window.addEventListener('google-auth-error', handleGoogleError)

    return () => {
      window.removeEventListener('auth-login', handleAuthLogin)
      window.removeEventListener('google-auth-error', handleGoogleError)
    }
  }, [onSuccess, onClose])

  const handleInputChange = useCallback((e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }, [formData])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await authService.register(
          formData.email,
          formData.password,
          formData.name || null
        )
      } else {
        await authService.login(
          formData.email,
          formData.password
        )
      }

      authService.emitLoginEvent()
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({ email: '', password: '', name: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [mode, formData, onSuccess, onClose])

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      if (!authService.isGoogleAvailable()) {
        setError('Google OAuth no está configurado. Usa email y contraseña.')
        setLoading(false)
        return
      }

      console.log('🔵 Iniciando Google Sign-In...')
      const result = await authService.triggerGoogleSignIn()

      if (!result) {
        setError('Google OAuth no está disponible. Prueba con email y contraseña.')
        setLoading(false)
        return
      }

      // Keep loading state, will be handled by event listeners
      console.log('🔵 Google Sign-In triggered successfully')

    } catch (error) {
      console.error('🔴 Google login error:', error)
      setError('Error con Google OAuth. Prueba con email y contraseña.')
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? '🔐 Iniciar Sesión' : '📝 Crear Cuenta'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="auth-modal-content">
          <p className="auth-description">
            {mode === 'login'
              ? 'Accedé a tu progreso desde cualquier dispositivo'
              : 'Sincronizá tu progreso en todos tus dispositivos'
            }
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Nombre (opcional)</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? '⏳ Procesando...' : (mode === 'login' ? '🔓 Iniciar Sesión' : '🎯 Crear Cuenta')}
            </button>
          </form>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="google-login-btn"
            disabled={loading || !authService.isGoogleAvailable()}
            title={!authService.isGoogleAvailable() ? 'Google OAuth no configurado' : ''}
          >
            🌐 {authService.isGoogleAvailable() ? 'Continuar con Google' : 'Google OAuth (no configurado)'}
          </button>

          <div className="auth-switch">
            {mode === 'login' ? (
              <p>
                ¿No tenés cuenta?{' '}
                <button type="button" onClick={switchMode} className="link-btn">
                  Creá una acá
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={switchMode} className="link-btn">
                  Iniciá sesión
                </button>
              </p>
            )}
          </div>

          <div className="auth-benefits">
            <h4>✨ Beneficios de tener cuenta:</h4>
            <ul>
              <li>📱 Sincronización entre dispositivos</li>
              <li>☁️ Backup automático de tu progreso</li>
              <li>📊 Historial completo de aprendizaje</li>
              <li>🎯 Recomendaciones personalizadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
