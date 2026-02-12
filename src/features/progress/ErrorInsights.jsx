import React, { useEffect, useState } from 'react'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { useSettings } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { emitProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'

export default function ErrorInsights({ onNavigateToDrill }) {
  const [topErrors, setTopErrors] = useState([])
  const settings = useSettings()
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)

  // Mapeo de tipos de error a iconos y descripciones
  // Usando las etiquetas del clasificador (ERROR_TAGS)
  const errorTypeMapping = {
    'persona_equivocada': {
      icon: '/diana.png',
      label: 'Persona Incorrecta',
      description: 'Conjugación para persona diferente'
    },
    'terminación_verbal': {
      icon: '/books.png', 
      label: 'Terminación Verbal',
      description: 'Terminación errónea'
    },
    'raíz_irregular': {
      icon: '/diana.png',
      label: 'Raíz Irregular',
      description: 'Error en la raíz'
    },
    'acentuación': {
      icon: '/enie.png',
      label: 'Acentuación',
      description: 'Acentuación incorrecta'
    },
    'pronombres_clíticos': {
      icon: '/books.png',
      label: 'Pronombres Clíticos',
      description: 'Clíticos usados incorrectamente'
    },
    'ortografía_g/gu': {
      icon: '/books.png',
      label: 'Ortografía G/GU',
      description: 'Ortografía g/gu incorrecta'
    },
    'ortografía_c/qu': {
      icon: '/books.png',
      label: 'Ortografía C/QU',
      description: 'Ortografía c/qu incorrecta'
    },
    'ortografía_z/c': {
      icon: '/books.png',
      label: 'Ortografía Z/C',
      description: 'Ortografía z/c incorrecta'
    },
    'concordancia_número': {
      icon: '/diana.png',
      label: 'Concordancia',
      description: 'Concordancia de número incorrecta'
    },
    'modo_equivocado': {
      icon: '/diana.png',
      label: 'Modo Incorrecto',
      description: 'Uso de modo verbal incorrecto'
    },
    'default': {
      icon: '/diana.png',
      label: 'Otro Error',
      description: 'Error no clasificado específicamente'
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
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const startMicroDrill = async (tag) => {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const recent = attempts.slice(-300).filter(a => (a.errorTags || []).includes(tag))
      if (recent.length === 0) {
        // Fallback: if no recent attempts for this error, still navigate to drill
        if (typeof onNavigateToDrill === 'function') onNavigateToDrill()
        return
      }
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
      settings.set({ practiceMode: 'mixed' })
      setDrillRuntimeContext({ currentBlock: { combos: topCombos, itemsRemaining: 5 } })
      // If we're in the Progress page, explicitly navigate to Drill
      if (typeof onNavigateToDrill === 'function') {
        onNavigateToDrill()
      } else {
        // Backward-compat: dispatch for when handled from DrillMode overlay
        emitProgressEvent(PROGRESS_EVENTS.NAVIGATE, { micro: { errorTag: tag, size: 5 } })
      }
    } catch { /* Navigation error ignored */ }
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
                <img src="/play.png" alt="Practicá" className="btn-icon" />
                <span>Practicá</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
