import React, { useMemo, useState } from 'react'
import { toggleExpertMode, setExpertModeSettings } from '../../lib/progress/expertMode.js'
import './expert-mode-panel.css'

const PROFILES = [
  {
    key: 'balanced',
    label: 'Equilibrado',
    description: 'Parametros recomendados para la mayoría de usuarios.',
    overrides: {}
  },
  {
    key: 'focused',
    label: 'Enfoque intensivo',
    description: 'Intervalos más cortos y retención objetivo más alta.',
    overrides: {
      srs: { EASE_START: 2.7, FUZZ_RATIO: 0.08, FIRST_STEPS: [1, 2] },
      fsrs: { REQUEST_RETENTION: 0.95 },
      customIntervals: [1, 2, 3, 5, 9, 15, 30, 60]
    }
  },
  {
    key: 'gentle',
    label: 'Ritmo suave',
    description: 'Intervalos más largos y menor presión.',
    overrides: {
      srs: { EASE_START: 2.4, EASE_MIN: 1.15, FUZZ_RATIO: 0.15 },
      fsrs: { REQUEST_RETENTION: 0.88 },
      customIntervals: [1, 3, 7, 14, 28, 60]
    }
  }
]

function resolveProfile(settings) {
  if (!settings) return 'balanced'
  if (!settings.enabled) return 'balanced'
  const custom = settings.overrides?.customIntervals
  if (!custom) return 'balanced'
  if (custom.length === PROFILES[1].overrides.customIntervals.length && custom.every((value, idx) => value === PROFILES[1].overrides.customIntervals[idx])) {
    return 'focused'
  }
  if (custom.length === (PROFILES[2].overrides.customIntervals || []).length && custom.every((value, idx) => value === PROFILES[2].overrides.customIntervals[idx])) {
    return 'gentle'
  }
  return 'balanced'
}

export default function ExpertModePanel({ settings }) {
  const [updating, setUpdating] = useState(false)
  const currentProfile = useMemo(() => resolveProfile(settings), [settings])

  if (!settings) {
    return null
  }

  const handleToggle = async () => {
    try {
      setUpdating(true)
      await toggleExpertMode(undefined, !settings.enabled)
    } catch (error) {
      console.error('No se pudo actualizar el modo experto', error)
    } finally {
      setUpdating(false)
    }
  }

  const applyProfile = async (profileKey) => {
    const profile = PROFILES.find(p => p.key === profileKey)
    if (!profile) return
    try {
      setUpdating(true)
      await setExpertModeSettings(undefined, {
        enabled: true,
        overrides: profile.overrides
      })
    } catch (error) {
      console.error('No se pudo aplicar el perfil experto', error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <section className="dashboard-section expert-mode">
      <div className="expert-header">
        <h2>
          <img src="/icons/brain.png" alt="Modo experto" className="section-icon" />
          Modo experto SRS
        </h2>
        <label className="expert-toggle">
          <span>{settings.enabled ? 'Activado' : 'Desactivado'}</span>
          <input type="checkbox" checked={settings.enabled} onChange={handleToggle} disabled={updating} />
        </label>
      </div>

      <p className="expert-description">
        Ajusta los parámetros del sistema SRS para adaptarlo a tu estilo de estudio. Úsalo solo si te sientes cómodo configurando algoritmos de repaso.
      </p>

      {settings.enabled && (
        <div className="expert-content">
          <div className="expert-profiles">
            <h3>Perfiles rápidos</h3>
            <div className="expert-profile-grid">
              {PROFILES.map(profile => (
                <button
                  key={profile.key}
                  type="button"
                  className={`expert-profile ${currentProfile === profile.key ? 'active' : ''}`}
                  onClick={() => applyProfile(profile.key)}
                  disabled={updating}
                >
                  <strong>{profile.label}</strong>
                  <span>{profile.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="expert-summary">
            <h3>Parámetros actuales</h3>
            <dl>
              <div>
                <dt>Ease inicial</dt>
                <dd>{settings.overrides?.srs?.EASE_START ?? '—'}</dd>
              </div>
              <div>
                <dt>Retención FSRS objetivo</dt>
                <dd>{Math.round((settings.overrides?.fsrs?.REQUEST_RETENTION ?? 0) * 100)}%</dd>
              </div>
              <div>
                <dt>Intervalos personalizados</dt>
                <dd>
                  {Array.isArray(settings.overrides?.customIntervals)
                    ? settings.overrides.customIntervals.join(', ')
                    : 'Predeterminados'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {!settings.enabled && (
        <p className="expert-helper">Activa el modo experto para desbloquear perfiles y ajustes avanzados del algoritmo.</p>
      )}
    </section>
  )
}
