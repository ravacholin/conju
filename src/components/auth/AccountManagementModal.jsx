import React, { useEffect, useMemo, useState } from 'react'
import authService from '../../lib/auth/authService.js'
import './AccountManagementModal.css'

export default function AccountManagementModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [account, setAccount] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [initialName, setInitialName] = useState('')

  useEffect(() => {
    if (!isOpen) return

    let isCancelled = false
    const fetchAccount = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await authService.getAccountInfo()
        if (isCancelled) return
        const nextAccount = data?.account || authService.getAccount()
        setAccount(nextAccount)
        const name = nextAccount?.name || ''
        setDisplayName(name)
        setInitialName(name)
      } catch (err) {
        if (isCancelled) return
        setError(err.message || 'No se pudo cargar tu cuenta')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchAccount()

    return () => {
      isCancelled = true
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  const canSave = useMemo(() => {
    return displayName.trim() !== initialName.trim()
  }, [displayName, initialName])

  const handleSubmit = async (event) => {
    event?.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await authService.updateAccountProfile({ name: displayName.trim() })
      setAccount(updated)
      setInitialName(updated?.name || '')
      setSuccess('Nombre actualizado correctamente')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cuenta')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(event) => event.stopPropagation()}>
        <header className="account-modal__header">
          <h2>Configuración de la cuenta</h2>
          <button className="account-modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="account-modal__body">
          {loading ? (
            <p className="account-modal__status">Cargando información de tu cuenta…</p>
          ) : (
            <form onSubmit={handleSubmit} className="account-modal__form">
              <label className="account-modal__label">
                Nombre para mostrar
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Tu nombre"
                  className="account-modal__input"
                />
              </label>

              <label className="account-modal__label">
                Correo electrónico
                <input
                  type="text"
                  value={account?.email || ''}
                  disabled
                  className="account-modal__input account-modal__input--readonly"
                />
              </label>

              {error && <p className="account-modal__error">️ {error}</p>}
              {success && <p className="account-modal__success">✅ {success}</p>}

              <div className="account-modal__actions">
                <button type="button" className="account-modal__button secondary" onClick={onClose}>
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="account-modal__button primary"
                  disabled={!canSave || saving}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
