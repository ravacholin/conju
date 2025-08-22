import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

function QuickSwitchPanel({ 
  settings, 
  onApply, 
  onClose,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood 
}) {
  const handleMoodChange = (mood) => {
    settings.set({ specificMood: mood || null, specificTense: null })
  }

  const handleTenseChange = (tense) => {
    settings.set({ specificTense: tense || null })
  }

  const handleVerbTypeChange = (verbType) => {
    settings.set({ verbType })
  }

  const handleApply = () => {
    // Set practice mode to specific when using quick switch
    if (settings.specificMood || settings.specificTense) {
      settings.set({ practiceMode: 'specific' })
    }
    onApply()
  }

  return (
    <div className="quick-switch-panel">
      <div className="setting-group">
        <label>Modo verbal:</label>
        <select
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
          <label>Tiempo verbal:</label>
          <select
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
        <label>Tipo de verbos:</label>
        <select
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