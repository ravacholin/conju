import React, { useEffect, useState } from 'react'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'

export default function ErrorInsights() {
  const [topErrors, setTopErrors] = useState([])
  const settings = useSettings()

  // Mapeo de tipos de error a iconos y descripciones
  const errorTypeMapping = {
    'conjugation': {
      icon: '/diana.png', // Usando diana como placeholder para errores de conjugación
      label: 'Conjugación',
      description: 'Forma verbal incorrecta'
    },
    'accent': {
      icon: '/enie.png', // Usando enie para errores de acentos
      label: 'Acentuación',
      description: 'Acentos faltantes o incorrectos'
    },
    'spelling': {
      icon: '/books.png', // Usando books para errores de ortografía
      label: 'Ortografía',
      description: 'Errores de escritura'
    },
    'stem': {
      icon: '/diana.png',
      label: 'Raíz Verbal',
      description: 'Cambios en la raíz del verbo'
    },
    'ending': {
      icon: '/diana.png',
      label: 'Terminación',
      description: 'Terminaciones verbales incorrectas'
    },
    'irregular': {
      icon: '/diana.png',
      label: 'Irregular',
      description: 'Formas irregulares'
    },
    'default': {
      icon: '/diana.png',
      label: 'Otro',
      description: 'Otros tipos de error'
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const uid = getCurrentUserId()
        const attempts = await getAttemptsByUser(uid)
        const recent = attempts.slice(-500)
        const freq = new Map()
        recent.forEach(a => (a.errorTags || []).forEach(t => freq.set(t, (freq.get(t) || 0) + 1)))
        const top = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5)
        setTopErrors(top)
      } catch {}
    })()
  }, [])

  const startMicroDrill = async (tag) => {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const recent = attempts.slice(-300).filter(a => (a.errorTags || []).includes(tag))
      if (recent.length === 0) return
      const freq = new Map()
      recent.forEach(a => {
        const key = `${a.mood}|${a.tense}`
        freq.set(key, (freq.get(key) || 0) + 1)
      })
      const topCombos = Array.from(freq.entries())
        .sort((a,b)=>b[1]-a[1])
        .slice(0,3)
        .map(([k]) => { const [mood,tense]=k.split('|'); return { mood, tense } })
      if (topCombos.length === 0) return
      settings.set({ practiceMode: 'mixed', currentBlock: { combos: topCombos, itemsRemaining: 5 } })
      window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { errorTag: tag, size: 5 } } }))
    } catch {}
  }

  const getErrorInfo = (tag) => {
    return errorTypeMapping[tag] || errorTypeMapping.default
  }

  if (topErrors.length === 0) {
    return (
      <div className="error-insights empty">
        <div className="empty-state">
          <img src="/books.png" alt="Sin errores" className="empty-icon" />
          <p className="empty-title">¡Excelente trabajo!</p>
          <p className="empty-description">No hay errores recurrentes detectados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="error-insights">
      <div className="error-grid">
        {topErrors.map(([tag, count]) => {
          const errorInfo = getErrorInfo(tag)
          return (
            <div key={tag} className="error-card">
              <div className="error-header">
                <img src={errorInfo.icon} alt={errorInfo.label} className="error-icon" />
                <div className="error-info">
                  <h4 className="error-label">{errorInfo.label}</h4>
                  <p className="error-description">{errorInfo.description}</p>
                </div>
              </div>
              
              <div className="error-stats">
                <div className="error-count">
                  <span className="count-value">{count}</span>
                  <span className="count-label">veces</span>
                </div>
              </div>
              
              <button 
                className="error-practice-btn"
                onClick={() => startMicroDrill(tag)}
                title={`Practicar ${errorInfo.label.toLowerCase()}`}
              >
                <img src="/play.png" alt="Practicar" className="btn-icon" />
                <span>Practicar</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

