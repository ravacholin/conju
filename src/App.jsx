import { useState, useEffect } from 'react'
import { useSettings } from './state/settings.js'
import { verbs } from './data/verbs.js'
import { chooseNext } from './lib/generator.js'
import { getTensesForMood, getTenseLabel } from './lib/verbLabels.js'
import Drill from './features/drill/Drill.jsx'
import './App.css'

function App() {
  const [currentMode, setCurrentMode] = useState('onboarding') // 'onboarding', 'drill', 'settings'
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: dialect, 2: level, 3: practice mode
  const settings = useSettings()

  const generateNextItem = () => {
    // Get all forms from all verbs
    const allForms = []
    verbs.forEach(verb => {
      verb.paradigms.forEach(paradigm => {
        if (paradigm.regionTags.includes(settings.region)) {
          paradigm.forms.forEach(form => {
            allForms.push({
              lemma: verb.lemma,
              ...form
            })
          })
        }
      })
    })
    
    const nextForm = chooseNext({ forms: allForms, history })
    
    if (nextForm) {
      // Force a new object to ensure React detects the change
      const newItem = {
        id: Date.now(), // Unique identifier to force re-render
        lemma: nextForm.lemma,
        mood: nextForm.mood,
        tense: nextForm.tense,
        person: nextForm.person,
        form: { ...nextForm } // Create new form object
      }
      setCurrentItem(newItem)
    }
  }

  // Initialize first item when settings are ready
  useEffect(() => {
    if (currentMode === 'drill' && settings.region) {
      // Always generate a new item when entering drill mode or when practice settings change
      generateNextItem()
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense])

  const handleDrillResult = (result) => {
    // Update history
    const key = `${currentItem.mood}:${currentItem.tense}:${currentItem.person}:${currentItem.form.value}`
    setHistory(prev => ({
      ...prev,
      [key]: {
        seen: (prev[key]?.seen || 0) + 1,
        correct: (prev[key]?.correct || 0) + (result.correct ? 1 : 0)
      }
    }))

    // Generate next item immediately (user controls timing with "Continue" button)
    generateNextItem()
  }

  const startPractice = () => {
    setCurrentMode('drill')
  }

  const selectDialect = (dialect) => {
    switch (dialect) {
      case 'rioplatense':
        settings.set({
          useVoseo: true,
          useTuteo: false,
          useVosotros: false,
          strict: true,
          region: 'rioplatense'
        })
        break
      case 'la_general':
        settings.set({
          useTuteo: true,
          useVoseo: false,
          useVosotros: false,
          strict: true,
          region: 'la_general'
        })
        break
      case 'peninsular':
        settings.set({
          useTuteo: true,
          useVoseo: false,
          useVosotros: true,
          strict: true,
          region: 'peninsular'
        })
        break
      case 'both':
        settings.set({
          useTuteo: true,
          useVoseo: true,
          useVosotros: true,
          strict: false,
          region: 'la_general'
        })
        break
    }
    setOnboardingStep(2) // Move to level selection
  }

  const selectLevel = (level) => {
    settings.set({ level })
    setOnboardingStep(3) // Move to practice mode selection
  }

  const selectPracticeMode = (mode) => {
    if (mode === 'mixed') {
      settings.set({ 
        practiceMode: 'mixed',
        specificMood: null,
        specificTense: null
      })
      startPractice()
    } else {
      settings.set({ practiceMode: 'specific' })
      setOnboardingStep(4) // Move to mood selection
    }
  }

  const selectMood = (mood) => {
    settings.set({ specificMood: mood })
    setOnboardingStep(5) // Move to tense selection
  }

  const selectTense = (tense) => {
    settings.set({ specificTense: tense })
    startPractice()
  }

  if (currentMode === 'onboarding') {
    return (
      <div className="app">
        <div className="onboarding">
          <div className="onboarding-content">
            <h1>Entrenador de Conjugación Española</h1>
            
            {/* Step 1: Dialect Selection */}
            {onboardingStep === 1 && (
              <>
                <div className="step-indicator">Paso 1 de 3</div>
                <h2>Selecciona tu variedad de español:</h2>
                
                <div className="dialect-options">
                  <div className="dialect-card" onClick={() => selectDialect('rioplatense')}>
                    <h3>Español Rioplatense</h3>
                    <p>Argentina, Uruguay</p>
                    <p className="example">vos tenés, vos hablás</p>
                  </div>
                  
                  <div className="dialect-card" onClick={() => selectDialect('la_general')}>
                    <h3>Latino Americano General</h3>
                    <p>La mayoría de América Latina</p>
                    <p className="example">tú tienes, tú hablas</p>
                  </div>
                  
                  <div className="dialect-card" onClick={() => selectDialect('peninsular')}>
                    <h3>Español Peninsular</h3>
                    <p>España</p>
                    <p className="example">tú tienes, vosotros tenéis</p>
                  </div>
                  
                  <div className="dialect-card" onClick={() => selectDialect('both')}>
                    <h3>Ambas Formas</h3>
                    <p>Acepta tú y vos</p>
                    <p className="example">tú tienes / vos tenés</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Level Selection */}
            {onboardingStep === 2 && (
              <>
                <div className="step-indicator">Paso 2 de 3</div>
                <h2>¿Cuál es tu nivel de español?</h2>
                <p>Selecciona tu nivel según el Marco Común Europeo de Referencia (MCER):</p>
                
                <div className="level-options">
                  <div className="level-card" onClick={() => selectLevel('A1')}>
                    <h3>A1 - Principiante</h3>
                    <p>Recién empiezas con el español</p>
                  </div>
                  
                  <div className="level-card" onClick={() => selectLevel('A2')}>
                    <h3>A2 - Elemental</h3>
                    <p>Conoces lo básico</p>
                  </div>
                  
                  <div className="level-card" onClick={() => selectLevel('B1')}>
                    <h3>B1 - Intermedio</h3>
                    <p>Puedes comunicarte en situaciones familiares</p>
                  </div>
                  
                  <div className="level-card" onClick={() => selectLevel('B2')}>
                    <h3>B2 - Intermedio Alto</h3>
                    <p>Te comunicas con fluidez</p>
                  </div>
                  
                  <div className="level-card" onClick={() => selectLevel('C1')}>
                    <h3>C1 - Avanzado</h3>
                    <p>Usas el español con eficacia</p>
                  </div>
                  
                  <div className="level-card" onClick={() => selectLevel('C2')}>
                    <h3>C2 - Superior</h3>
                    <p>Dominio casi nativo</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Practice Mode Selection */}
            {onboardingStep === 3 && (
              <>
                <div className="step-indicator">Paso 3 de 3</div>
                <h2>¿Cómo quieres practicar?</h2>
                
                <div className="practice-mode-options">
                  <div className="mode-card" onClick={() => selectPracticeMode('mixed')}>
                    <h3>🎲 Práctica Mixta</h3>
                    <p>Mezcla de todos los tiempos y modos</p>
                    <p className="example">Variedad completa para práctica general</p>
                  </div>
                  
                  <div className="mode-card" onClick={() => selectPracticeMode('specific')}>
                    <h3>🎯 Práctica Específica</h3>
                    <p>Enfócate en un tiempo/modo específico</p>
                    <p className="example">Ideal para dominar formas particulares</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Mood Selection (only for specific practice) */}
            {onboardingStep === 4 && (
              <>
                <div className="step-indicator">Configuración Específica</div>
                <h2>Selecciona el modo verbal:</h2>
                
                <div className="mood-options">
                  <div className="selection-card" onClick={() => selectMood('indicative')}>
                    <h3>Indicativo</h3>
                    <p>Hechos y realidades</p>
                  </div>
                  
                  <div className="selection-card" onClick={() => selectMood('subjunctive')}>
                    <h3>Subjuntivo</h3>
                    <p>Dudas, deseos, emociones</p>
                  </div>
                  
                  <div className="selection-card" onClick={() => selectMood('imperative')}>
                    <h3>Imperativo</h3>
                    <p>Órdenes y mandatos</p>
                  </div>
                  
                  <div className="selection-card" onClick={() => selectMood('conditional')}>
                    <h3>Condicional</h3>
                    <p>Situaciones hipotéticas</p>
                  </div>
                  
                  <div className="selection-card" onClick={() => selectMood('nonfinite')}>
                    <h3>No finito</h3>
                    <p>Infinitivo, gerundio, participio</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Tense Selection (only for specific practice) */}
            {onboardingStep === 5 && (
              <>
                <div className="step-indicator">Configuración Específica</div>
                <h2>Selecciona el tiempo verbal:</h2>
                
                <div className="tense-options">
                  {getTensesForMood(settings.specificMood).map(tense => (
                    <div key={tense} className="selection-card" onClick={() => selectTense(tense)}>
                      <h3>{getTenseLabel(tense)}</h3>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (currentMode === 'drill') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Conjugación Española</h1>
          <div className="header-controls">
            <button 
              className="settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ Configuración
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-content">
              <h3>Configuración</h3>
              <div className="setting-group">
                <label>Variedad de español:</label>
                <select 
                  value={
                    settings.region === 'rioplatense' && settings.useVoseo && !settings.useTuteo ? 'rioplatense' :
                    settings.region === 'peninsular' && settings.useVosotros ? 'peninsular' :
                    !settings.strict && settings.useTuteo && settings.useVoseo ? 'both' :
                    'la_general'
                  }
                  onChange={(e) => selectDialect(e.target.value)}
                  className="setting-select"
                >
                  <option value="rioplatense">Español Rioplatense</option>
                  <option value="la_general">Latino Americano General</option>
                  <option value="peninsular">Español Peninsular</option>
                  <option value="both">Ambas Formas</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Nivel MCER:</label>
                <select 
                  value={settings.level}
                  onChange={(e) => settings.set({ level: e.target.value })}
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
                <label>Modo de práctica:</label>
                <select 
                  value={settings.practiceMode}
                  onChange={(e) => {
                    settings.set({ 
                      practiceMode: e.target.value,
                      specificMood: null,
                      specificTense: null
                    })
                    if (e.target.value === 'mixed') {
                      generateNextItem()
                    }
                  }}
                  className="setting-select"
                >
                  <option value="mixed">Práctica mixta (todos los tiempos)</option>
                  <option value="specific">Práctica específica</option>
                </select>
              </div>

              {settings.practiceMode === 'specific' && (
                <>
                  <div className="setting-group">
                    <label>Modo verbal:</label>
                    <select 
                      value={settings.specificMood || ''}
                      onChange={(e) => {
                        settings.set({ 
                          specificMood: e.target.value || null,
                          specificTense: null
                        })
                      }}
                      className="setting-select"
                    >
                      <option value="">Seleccionar modo...</option>
                      <option value="indicative">Indicativo</option>
                      <option value="subjunctive">Subjuntivo</option>
                      <option value="imperative">Imperativo</option>
                      <option value="conditional">Condicional</option>
                      <option value="nonfinite">No finito</option>
                    </select>
                  </div>

                  {settings.specificMood && (
                    <div className="setting-group">
                      <label>Tiempo verbal:</label>
                      <select 
                        value={settings.specificTense || ''}
                        onChange={(e) => {
                          settings.set({ specificTense: e.target.value || null })
                        }}
                        className="setting-select"
                      >
                        <option value="">Seleccionar tiempo...</option>
                        {getTensesForMood(settings.specificMood).map(tense => (
                          <option key={tense} value={tense}>
                            {getTenseLabel(tense)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {settings.specificMood && settings.specificTense && (
                    <div className="setting-group">
                      <button 
                        className="start-specific-practice"
                        onClick={() => {
                          generateNextItem()
                          setShowSettings(false)
                        }}
                      >
                        🎯 Comenzar Práctica Específica
                      </button>
                    </div>
                  )}
                </>
              )}
              
              <button 
                className="close-settings"
                onClick={() => setShowSettings(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <main className="app-main">
          {currentItem ? (
            <Drill 
              item={currentItem}
              onResult={handleDrillResult}
              settings={settings}
            />
          ) : (
            <div className="loading">Cargando próxima conjugación...</div>
          )}
        </main>
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="app">
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default App