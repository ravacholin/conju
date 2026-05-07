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
      rioplatense: { useVoseo: true, useTuteo: false, useVosotros: false, strict: true, region: 'rioplatense', practicePronoun: 'all' },
      peninsular:  { useTuteo: true, useVoseo: false, useVosotros: true,  strict: true, region: 'peninsular',  practicePronoun: 'both' },
      both:        { useTuteo: true, useVoseo: true,  useVosotros: true,  strict: false, region: 'la_general', practicePronoun: 'all' },
      la_general:  { useTuteo: true, useVoseo: false, useVosotros: false, strict: true, region: 'la_general',  practicePronoun: 'both' }
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
    settings.set({ specificMood: mood || null, specificTense: null, practiceMode: 'mixed' })
  }

  const handleTenseChange = (tense) => {
    settings.set({
      specificTense: tense || null,
      practiceMode: (settings.specificMood && tense) ? 'specific' : 'mixed'
    })
  }

  const handleVerbTypeChange = (verbType) => {
    settings.set({ verbType })
  }

  const handleApply = () => {
    if (settings.specificMood && settings.specificTense) {
      settings.set({ practiceMode: 'specific' })
    } else {
      settings.set({ practiceMode: 'mixed' })
    }
    onApply()
  }

  return (
    <div className="quick-switch-panel">
      <div className="vd-qs-body">

        <div className="vd-qs-row">
          <label className="vd-qs-label" htmlFor="qs-variant">VARIANTE</label>
          <select
            id="qs-variant"
            className="vd-qs-select"
            value={getDialectValue()}
            onChange={(e) => handleDialectChange(e.target.value)}
          >
            <option value="rioplatense">Vos (Río de la Plata)</option>
            <option value="la_general">Tú (América Latina)</option>
            <option value="peninsular">Tú y vosotros (España)</option>
            <option value="both">Todos</option>
          </select>
        </div>

        <div className="vd-qs-row">
          <label className="vd-qs-label" htmlFor="qs-mood">MODO VERBAL</label>
          <select
            id="qs-mood"
            className="vd-qs-select"
            value={settings.specificMood || ''}
            onChange={(e) => handleMoodChange(e.target.value)}
          >
            <option value="">Todos los modos</option>
            {(settings.level ? getAvailableMoodsForLevel(settings.level) : ['indicative','subjunctive','imperative','conditional','nonfinite']).map(m => (
              <option key={m} value={m}>{getMoodLabel(m)}</option>
            ))}
          </select>
        </div>

        {settings.specificMood && (
          <div className="vd-qs-row">
            <label className="vd-qs-label" htmlFor="qs-tense">TIEMPO</label>
            <select
              id="qs-tense"
              className="vd-qs-select"
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

        <div className="vd-qs-row">
          <label className="vd-qs-label" htmlFor="qs-verbtype">VERBOS</label>
          <select
            id="qs-verbtype"
            className="vd-qs-select"
            value={settings.verbType}
            onChange={(e) => handleVerbTypeChange(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="regular">Solo regulares</option>
            <option value="irregular">Solo irregulares</option>
          </select>
        </div>

      </div>

      {settings.specificMood && !settings.specificTense && (
        <div className="vd-qs-hint">
          Seleccioná un tiempo para practicar modo específico
        </div>
      )}

      <div className="vd-qs-actions">
        <button className="btn" onClick={handleApply}>Aplicar</button>
        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

export default QuickSwitchPanel
