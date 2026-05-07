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

  useEffect(() => {
    const handleAuthLogin = () => {
      setLoading(false)
      onSuccess?.()
      onClose()
      setFormData({ email: '', password: '', name: '' })
    }

    const handleGoogleError = (event) => {
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
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }, [formData])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await authService.register(formData.email, formData.password, formData.name || null)
      } else {
        await authService.login(formData.email, formData.password)
      }

      authService.emitLoginEvent()
      onSuccess?.()
      onClose()
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
        setError('Google OAuth no está configurado. Usá email y contraseña.')
        setLoading(false)
        return
      }

      const result = await authService.triggerGoogleSignIn()

      if (!result) {
        setError('Google OAuth no está disponible. Probá con email y contraseña.')
        setLoading(false)
      }
    } catch (err) {
      setError('Error con Google OAuth. Probá con email y contraseña.')
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
          <div className="auth-modal-title-group">
            <span className="auth-modal-tag">VERB/OS</span>
            <h2>{mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="auth-modal-content">
          <p className="auth-description">
            {mode === 'login'
              ? 'Accedé a tu progreso desde cualquier dispositivo'
              : 'Sincronizá tu progreso en todos tus dispositivos'
            }
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="google-login-btn"
            disabled={loading || !authService.isGoogleAvailable()}
            title={!authService.isGoogleAvailable() ? 'Google OAuth no configurado' : ''}
          >
            <svg className="google-icon" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {authService.isGoogleAvailable() ? 'Continuar con Google' : 'Google OAuth (no configurado)'}
          </button>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">NOMBRE <span className="form-optional">(opcional)</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">CONTRASEÑA</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'PROCESANDO...' : (mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA')}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <p>
                ¿Sin cuenta?{' '}
                <button type="button" onClick={switchMode} className="link-btn">Creá una acá</button>
              </p>
            ) : (
              <p>
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={switchMode} className="link-btn">Iniciá sesión</button>
              </p>
            )}
          </div>

          <div className="auth-benefits">
            <div className="auth-benefits__label">POR QUÉ CREAR CUENTA</div>
            <ul>
              <li>Sincronización entre dispositivos</li>
              <li>Backup automático de progreso</li>
              <li>Historial completo de aprendizaje</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
