import React from 'react'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

function QuickSwitchPanel({ 
  settings, 
  onApply, 
  onClose,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  onDialectChange
}) {
  const getDialectValue = () => {
    if (settings.region === 'rioplatense' && settings.useVoseo && !settings.useTuteo) return 'rioplatense'
    if (settings.region === 'peninsular' && settings.useVosotros) return 'peninsular'
    if (settings.strict === false && settings.useTuteo && settings.useVoseo && settings.useVosotros) return 'both'
    return 'la_general'
  }

  const applyDialectLocally = (dialect) => {
    const variantUpdates = {
      rioplatense: {
        useVoseo: true,
        useTuteo: false,
        useVosotros: false,
        strict: true,
        region: 'rioplatense',
        practicePronoun: 'all'
      },
      peninsular: {
        useTuteo: true,
        useVoseo: false,
        useVosotros: true,
        strict: true,
        region: 'peninsular',
        practicePronoun: 'both'
      },
      both: {
        useTuteo: true,
        useVoseo: true,
        useVosotros: true,
        strict: false,
        region: 'la_general',
        practicePronoun: 'all'
      },
      la_general: {
        useTuteo: true,
        useVoseo: false,
        useVosotros: false,
        strict: true,
        region: 'la_general',
        practicePronoun: 'both'
      }
    }

    settings.set(variantUpdates[dialect] || variantUpdates.la_general)
  }

  const handleDialectChange = (dialect) => {
    if (typeof onDialectChange === 'function') {
      onDialectChange(dialect, { preserveFilters: true })
    } else {
      applyDialectLocally(dialect)
    }
  }

  const handleMoodChange = (mood) => {
    // Reset tense when mood changes, and ensure practice mode goes back to mixed
    settings.set({
      specificMood: mood || null,
      specificTense: null,
      practiceMode: 'mixed' // Reset to mixed mode until both mood and tense are selected
    })
  }

  const handleTenseChange = (tense) => {
    settings.set({
      specificTense: tense || null,
      // Reset to mixed mode if tense is cleared
      practiceMode: (settings.specificMood && tense) ? 'specific' : 'mixed'
    })
  }

  const handleVerbTypeChange = (verbType) => {
    settings.set({ verbType })
  }

  const handleApply = () => {
    // Only set practice mode to specific when BOTH mood and tense are selected
    if (settings.specificMood && settings.specificTense) {
      settings.set({ practiceMode: 'specific' })
    } else {
      // Ensure we stay in mixed mode if selection is incomplete
      settings.set({ practiceMode: 'mixed' })
    }
    onApply()
  }

  return (
    <div className="quick-switch-panel">
      <div className="setting-group">
        <label htmlFor="variant-select">Variantes:</label>
        <select
          id="variant-select"
          className="setting-select"
          value={getDialectValue()}
          onChange={(e) => handleDialectChange(e.target.value)}
        >
          <option value="rioplatense">Vos</option>
          <option value="la_general">Tú</option>
          <option value="peninsular">Tú y vosotros</option>
          <option value="both">Todos</option>
        </select>
      </div>

      <div className="setting-group">
        <label htmlFor="mood-select">Modo verbal:</label>
        <select
          id="mood-select"
          className="setting-select"
          value={settings.specificMood || ''}
          onChange={(e) => handleMoodChange(e.target.value)}
        >
          <option value="">Seleccioná modo...</option>
          {(settings.level ? getAvailableMoodsForLevel(settings.level) : ['indicative','subjunctive','imperative','conditional','nonfinite']).map(m => (
            <option key={m} value={m}>{getMoodLabel(m)}</option>
          ))}
        </select>
      </div>

      {settings.specificMood && (
        <div className="setting-group">
          <label htmlFor="tense-select">Tiempo verbal:</label>
          <select
            id="tense-select"
            className="setting-select"
            value={settings.specificTense || ''}
            onChange={(e) => handleTenseChange(e.target.value)}
          >
            <option value="">Seleccioná tiempo...</option>
            {(settings.level
              ? getAvailableTensesForLevelAndMood(settings.level, settings.specificMood)
              : getTensesForMood(settings.specificMood)
            ).map(t => (
              <option key={t} value={t}>{getTenseLabel(t)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="setting-group">
        <label htmlFor="verb-type-select">Tipo de verbos:</label>
        <select
          id="verb-type-select"
          className="setting-select"
          value={settings.verbType}
          onChange={(e) => handleVerbTypeChange(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="regular">Regulares</option>
          <option value="irregular">Irregulares</option>
        </select>
      </div>

      <div className="setting-group">
        {settings.specificMood && !settings.specificTense && (
          <div className="validation-message">
            Seleccioná un tiempo verbal para practicar modo específico
          </div>
        )}
        <button className="btn" onClick={handleApply}>
          Aplicar
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default QuickSwitchPanel
