function SettingsPanel({ 
  settings, 
  onClose, 
  onDialectChange, 
  onLevelChange, 
  onPracticeModeChange,
  onPronounPracticeChange,
  onVerbTypeChange,
  onStartSpecificPractice 
}) {
  const getDialectValue = () => {
    if (settings.region === 'rioplatense' && settings.useVoseo && !settings.useTuteo) return 'rioplatense'
    if (settings.region === 'peninsular' && settings.useVosotros) return 'peninsular'
    if (!settings.strict && settings.useTuteo && settings.useVoseo) return 'both'
    return 'la_general'
  }

  const handleVerbTypeChange = (verbType) => {
    onVerbTypeChange(verbType, verbType !== 'irregular' ? null : settings.selectedFamily)
  }

  const handleFamilyChange = (family) => {
    settings.set({ selectedFamily: family || null })
  }

  const handleRareBoostChange = (value) => {
    const list = value.split(',').map(s=>s.trim()).filter(Boolean)
    settings.set({ c2RareBoostLemmas: list })
  }

  return (
    <div className="settings-panel">
      <h3>Configuración</h3>
      
      <div className="setting-group">
        <label>Variante:</label>
        <select 
          value={getDialectValue()}
          onChange={(e) => onDialectChange(e.target.value)}
          className="setting-select"
        >
          <option value="rioplatense">Solo vos (sin tú ni vosotros)</option>
          <option value="la_general">Solo tú (sin vos ni vosotros)</option>
          <option value="peninsular">España: tú y vosotros (sin vos)</option>
          <option value="both">Todos: tú, vos y vosotros</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label>Nivel MCER:</label>
        <select 
          value={settings.level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="setting-select"
        >
          <option value="A1">A1 - Principiante</option>
          <option value="A2">A2 - Elemental</option>
          <option value="B1">B1 - Intermedio</option>
          <option value="B2">B2 - Intermedio Alto</option>
          <option value="C1">C1 - Avanzado</option>
          <option value="C2">C2 - Superior</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label title="Elige si quieres practicar con todos los tiempos o enfocarte en uno específico">Modo de práctica:</label>
        <select 
          value={settings.practiceMode}
          onChange={(e) => onPracticeModeChange(e.target.value)}
          className="setting-select"
        >
          <option value="mixed">Práctica mixta (todos los tiempos)</option>
          <option value="specific">Práctica específica</option>
        </select>
      </div>

      <div className="setting-group">
        <label title="Elige si quieres practicar con ambos pronombres (tú y vos) o solo uno">Práctica de pronombres:</label>
        <select 
          value={settings.practicePronoun}
          onChange={(e) => onPronounPracticeChange(e.target.value)}
          className="setting-select"
        >
          <option value="both">Ambos (tú y vos)</option>
          <option value="tu_only">Solo tú</option>
          <option value="vos_only">Solo vos</option>
        </select>
      </div>

      {(settings.level === 'C1' || settings.level === 'C2') && (
        <>
          <div className="setting-group">
            <label>Registro jurídico (Futuro de Subjuntivo):</label>
            <div className="radio-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.enableFuturoSubjRead} 
                  onChange={(e) => settings.set({ enableFuturoSubjRead: e.target.checked })} 
                /> Lectura C1/C2
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.enableFuturoSubjProd} 
                  onChange={(e) => settings.set({ enableFuturoSubjProd: e.target.checked })} 
                /> Producción C2
              </label>
            </div>
          </div>
          
          {settings.level === 'C2' && (
            <div className="setting-group">
              <label>Conmutación (C2):</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.enableC2Conmutacion} 
                    onChange={(e) => settings.set({ enableC2Conmutacion: e.target.checked })} 
                  /> Alternar tratamiento por ítem
                </label>
              </div>
            </div>
          )}
        </>
      )}

      <div className="setting-group">
        <label title="Elige el tipo de verbos a practicar">Tipo de verbos:</label>
        <select 
          value={settings.verbType}
          onChange={(e) => handleVerbTypeChange(e.target.value)}
          className="setting-select"
        >
          <option value="all">Todos (regulares e irregulares)</option>
          <option value="regular">Solo regulares</option>
          <option value="irregular">Solo irregulares</option>
        </select>
      </div>

      {settings.verbType === 'irregular' && (
        <div className="setting-group">
          <label title="Elige una familia específica de verbos irregulares">Familia de irregulares:</label>
          <select 
            value={settings.selectedFamily || ''}
            onChange={(e) => handleFamilyChange(e.target.value)}
            className="setting-select"
          >
            <option value="">Todas las familias</option>
            <optgroup label="── Grupos Principales (Presente) ──">
              <option value="STEM_CHANGES">Verbos que Diptongan (pensar, volver, pedir)</option>
              <option value="FIRST_PERSON_IRREGULAR">Irregulares en YO (tengo, conozco, salgo)</option>
            </optgroup>
            <optgroup label="── Familias Específicas ──">
              <option value="G_VERBS">Irregulares en YO (tener, conocer, vencer)</option>
              <option value="DIPHT_E_IE">Diptongación e→ie (pensar, cerrar)</option>
              <option value="DIPHT_O_UE">Diptongación o→ue (volver, poder)</option>
              <option value="E_I_IR">e→i verbos -ir (pedir, servir)</option>
              <option value="UIR_Y">-uir inserción y (construir, huir)</option>
              <option value="PRET_UV">Pretérito -uv- (andar, estar, tener)</option>
              <option value="PRET_U">Pretérito -u- (poder, poner, saber)</option>
              <option value="PRET_J">Pretérito -j- (decir, traer, conducir)</option>
            </optgroup>
          </select>
        </div>
      )}

      {settings.level === 'C2' && (
        <div className="setting-group">
          <label>Rarezas C2 (lista separada por comas):</label>
          <input
            type="text"
            className="setting-input"
            defaultValue={(settings.c2RareBoostLemmas||[]).join(',')}
            onBlur={(e) => handleRareBoostChange(e.target.value)}
            placeholder="argüir, delinquir, henchir, ..."
          />
        </div>
      )}

      <div className="setting-group">
        <label title="Muestra el pronombre para facilitar el aprendizaje temprano">Mostrar pronombres:</label>
        <div className="radio-group">
          <label>
            <input 
              type="radio" 
              name="showPronouns" 
              value="true"
              checked={settings.showPronouns === true}
              onChange={() => settings.set({ showPronouns: true })}
            />
            Sí (para principiantes)
          </label>
          <label>
            <input 
              type="radio" 
              name="showPronouns" 
              value="false"
              checked={settings.showPronouns === false}
              onChange={() => settings.set({ showPronouns: false })}
            />
            No (solo la forma verbal)
          </label>
        </div>
      </div>

      {settings.practiceMode === 'specific' && (
        <>
          {settings.specificMood && settings.specificTense && (
            <div className="setting-group">
              <button 
                className="start-specific-practice"
                onClick={onStartSpecificPractice}
              >
                <img src="/diana.png" alt="Diana" className="option-icon" /> Comenzar Práctica Específica
              </button>
            </div>
          )}
        </>
      )}
      
      <button 
        className="btn btn-secondary"
        onClick={onClose}
      >
        Cerrar
      </button>
    </div>
  )
}

export default SettingsPanel
