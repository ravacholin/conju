import React from 'react'
import { useSettings, PRACTICE_MODES } from '../../state/settings.js'
import { getLevelDescription } from '../../lib/levels/userLevelProfile.js'
import ClickableCard from '../shared/ClickableCard.jsx'

function PracticeModeSelector({ className = '' }) {
  const settings = useSettings()
  const { levelPracticeMode, userLevel } = settings

  const handleModeChange = (mode) => {
    settings.setLevelPracticeMode(mode)
  }

  const modes = [
    {
      id: PRACTICE_MODES.BY_LEVEL,
      title: 'Por mi nivel',
      description: `Solo contenido de ${userLevel} y anteriores`,
      icon: '/icons/trophy.png',
      benefits: [
        'Contenido apropiado para tu nivel',
        'Progresión gradual',
        'No te abruma con formas avanzadas'
      ],
      recommended: true
    },
    {
      id: PRACTICE_MODES.BY_TOPIC,
      title: 'Por tema específico',
      description: 'Todos los tiempos y formas disponibles',
      icon: '/icons/books.png',
      benefits: [
        'Acceso completo a todo el contenido',
        'Explorar formas avanzadas',
        'Práctica especializada por tema'
      ],
      recommended: false
    }
  ]

  return (
    <div className={`practice-mode-selector ${className}`}>
      <div className="mode-selector-header">
        <h3>Modo de práctica</h3>
        <div className="current-level-info">
          Tu nivel: <span className="level-badge-small">{userLevel}</span>
          <span className="level-description">{getLevelDescription(userLevel)}</span>
        </div>
      </div>

      <div className="mode-options">
        {modes.map((mode) => (
          <ClickableCard
            key={mode.id}
            className={`mode-option ${levelPracticeMode === mode.id ? 'active' : ''}`}
            onClick={() => handleModeChange(mode.id)}
            title={`Cambiar a ${mode.title}`}
          >
            <div className="mode-header">
              <img src={mode.icon} alt="" className="mode-icon" />
              <div className="mode-info">
                <div className="mode-title">
                  {mode.title}
                  {mode.recommended && <span className="recommended-badge">Recomendado</span>}
                </div>
                <div className="mode-description">{mode.description}</div>
              </div>
              <div className="mode-status">
                {levelPracticeMode === mode.id && (
                  <div className="active-indicator" />
                )}
              </div>
            </div>

            <div className="mode-benefits">
              {mode.benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <div className="benefit-dot" />
                  <div className="benefit-text">{benefit}</div>
                </div>
              ))}
            </div>

            {mode.id === PRACTICE_MODES.BY_TOPIC && userLevel < 'B2' && (
              <div className="mode-warning">
                <img src="/icons/lightbulb.png" alt="" className="warning-icon" />
                <div className="warning-text">
                  Incluye contenido avanzado para tu nivel actual
                </div>
              </div>
            )}
          </ClickableCard>
        ))}
      </div>

      <div className="mode-selector-footer">
        <div className="toggle-shortcut">
          <span className="shortcut-text">Cambio rápido:</span>
          <ClickableCard
            className="toggle-button"
            onClick={settings.togglePracticeMode}
            title="Alternar modo de práctica"
          >
            <img src="/icons/refresh.png" alt="" className="toggle-icon" />
            Alternar
          </ClickableCard>
        </div>
      </div>
    </div>
  )
}

export default PracticeModeSelector