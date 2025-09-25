import React, { useEffect, useState } from 'react'
import authService from '../../lib/auth/authService.js'
import './DeviceManagerModal.css'

function DeviceItem({ device, isCurrent, onRename, onRemove, pendingId }) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(device.device_name || '')

  useEffect(() => {
    setNewName(device.device_name || '')
  }, [device.device_name])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!newName.trim()) return
    onRename(device.id, newName.trim())
    setEditing(false)
  }

  return (
    <div className={`device-card${isCurrent ? ' device-card--current' : ''}`}>
      <div className="device-card__info">
        {editing ? (
          <form onSubmit={handleSubmit} className="device-card__form">
            <input
              className="device-card__input"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nombre del dispositivo"
              autoFocus
            />
            <div className="device-card__form-actions">
              <button type="submit" className="device-card__button primary" disabled={pendingId === device.id}>
                Guardar
              </button>
              <button type="button" className="device-card__button secondary" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="device-card__title">
              <h3>{device.device_name || 'Dispositivo sin nombre'}</h3>
              {isCurrent && <span className="device-card__badge">Este dispositivo</span>}
            </div>
            <p className="device-card__meta">Último acceso: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Desconocido'}</p>
            <p className="device-card__meta">Registrado: {device.created_at ? new Date(device.created_at).toLocaleString() : 'Desconocido'}</p>
          </>
        )}
      </div>

      {!editing && (
        <div className="device-card__actions">
          <button
            type="button"
            className="device-card__button secondary"
            onClick={() => setEditing(true)}
            disabled={pendingId === device.id}
          >
            Cambiar nombre
          </button>
          <button
            type="button"
            className="device-card__button danger"
            onClick={() => onRemove(device.id)}
            disabled={isCurrent || pendingId === device.id}
            title={isCurrent ? 'No puedes revocar el dispositivo actual' : undefined}
          >
            Revocar acceso
          </button>
        </div>
      )}
    </div>
  )
}

export default function DeviceManagerModal({ isOpen, onClose, currentDeviceId }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState(null)

  const loadDevices = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await authService.listDevices()
      setDevices(list)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los dispositivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    loadDevices()
    const handler = () => loadDevices()
    window.addEventListener('account-updated', handler)
    return () => {
      window.removeEventListener('account-updated', handler)
      setError('')
      setPendingId(null)
    }
  }, [isOpen])

  const handleRename = async (deviceId, newName) => {
    try {
      setPendingId(deviceId)
      await authService.renameDevice(deviceId, newName)
      await loadDevices()
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el nombre del dispositivo')
    } finally {
      setPendingId(null)
    }
  }

  const handleRemove = async (deviceId) => {
    const confirmed = window.confirm('¿Revocar el acceso de este dispositivo? Podrá volver a iniciar sesión más tarde.')
    if (!confirmed) return

    try {
      setPendingId(deviceId)
      await authService.revokeDevice(deviceId)
      await loadDevices()
    } catch (err) {
      setError(err.message || 'No se pudo revocar el dispositivo')
    } finally {
      setPendingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="device-modal-overlay" onClick={onClose}>
      <div className="device-modal" onClick={(event) => event.stopPropagation()}>
        <header className="device-modal__header">
          <h2>Dispositivos autorizados</h2>
          <button className="device-modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="device-modal__body">
          {error && <p className="device-modal__error">️ {error}</p>}
          {loading ? (
            <p className="device-modal__status">Cargando dispositivos…</p>
          ) : devices.length === 0 ? (
            <p className="device-modal__status">No hay otros dispositivos conectados a tu cuenta.</p>
          ) : (
            <div className="device-modal__list">
              {devices.map((device) => (
                <DeviceItem
                  key={device.id}
                  device={device}
                  isCurrent={device.id === currentDeviceId}
                  onRename={handleRename}
                  onRemove={handleRemove}
                  pendingId={pendingId}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="device-modal__footer">
          <button type="button" className="device-modal__button" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}
