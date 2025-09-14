import React, { useEffect, useState } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'info', duration = 1600, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), Math.max(400, duration - 180))
    const t2 = setTimeout(() => {
      if (onClose) onClose()
    }, Math.max(700, duration))
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [duration, onClose])

  if (!message) return null
  return (
    <div className={`toast-container ${visible ? 'in' : 'out'}`} role="status" aria-live="polite">
      <div className={`toast toast-${type}`} onClick={onClose}>
        {message}
      </div>
    </div>
  )
}
