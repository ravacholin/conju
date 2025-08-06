import { useState, useEffect } from 'react'
import { useSettings } from './state/settings.js'
import { verbs } from './data/verbs.js'
import { chooseNext } from './lib/generator.js'
import { getTensesForMood, getTenseLabel, getMoodLabel } from './lib/verbLabels.js'
import gates from './data/curriculum.json'
import Drill from './features/drill/Drill.jsx'
import { useResponsive } from './lib/mobileDetection.js'
import { testNonfiniteVerbs } from './lib/testNonfinite.js'
import { comprehensiveVerbTest, testSpecificCategories } from './lib/comprehensiveTest.js'
import { cleanDuplicateVerbs, addMissingForms, validateVerbStructure } from './lib/cleanDuplicateVerbs.js'
import { generateImprovementReport } from './lib/bugFixes.js'
import { testNonfiniteSelection } from './lib/testNonfiniteSelection.js'
import { debugGerundioIssue } from './lib/debugGerundioIssue.js'
import { fixGerundioIssue } from './lib/fixGerundioIssue.js'
import { testGerundioDirect } from './lib/testGerundioDirect.js'
import './App.css'

function App() {
  console.log('Curriculum gates imported:', gates)
  console.log('Total gates:', gates.length)
  console.log('Sample gates:', gates.slice(0, 5))
  
  // Test verb availability on app load
  useEffect(() => {
    console.log('=== RUNNING COMPREHENSIVE APP DIAGNOSTICS ===')
    
    // Validate verb structure
    validateVerbStructure()
    
    // Test verb availability
    testNonfiniteVerbs()
    comprehensiveVerbTest()
    testSpecificCategories()
    
    // Check for duplicates
    cleanDuplicateVerbs()
    
    // Generate improvement report
    generateImprovementReport()
    
    // Test nonfinite selection specifically
    testNonfiniteSelection()
    
    // Debug gerundio issue specifically
    debugGerundioIssue()
    
    // Fix gerundio issue
    fixGerundioIssue()
    
    // Test gerundio directly
    testGerundioDirect()
    
    console.log('=== DIAGNOSTICS COMPLETE ===')
  }, [])
  
  const [currentMode, setCurrentMode] = useState('onboarding') // 'onboarding', 'drill', 'settings'
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: dialect, 2: level, 3: practice mode, 4: mood/tense, 5: verb type
  const settings = useSettings()
  const { isMobile } = useResponsive()

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
    
    console.log(`Generating next item with ${allForms.length} total forms`)
    const nextForm = chooseNext({ forms: allForms, history })
    
    if (nextForm && nextForm.mood && nextForm.tense) {
      // Force a new object to ensure React detects the change
      const newItem = {
        id: Date.now(), // Unique identifier to force re-render
        lemma: nextForm.lemma,
        mood: nextForm.mood,
        tense: nextForm.tense,
        person: nextForm.person,
        form: { ...nextForm }, // Create new form object
        settings: { ...settings } // Include settings for grading
      }
      setCurrentItem(newItem)
    } else {
      console.error('❌ No valid form found! This might indicate a bug in the generator or insufficient verbs.')
      console.error('Current settings:', settings)
      console.error('Available forms count:', allForms.length)
      
      // Show a user-friendly error instead of infinite retry
      setCurrentItem({
        id: Date.now(),
        error: true,
        message: 'No hay suficientes verbos disponibles para esta combinación. Por favor, intenta con diferentes configuraciones.'
      })
    }
  }

  // Initialize first item when settings are ready
  useEffect(() => {
    if (currentMode === 'drill' && settings.region && !currentItem) {
      // Only generate a new item when entering drill mode or when practice settings change AND there's no current item
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
    // NO generar siguiente item automáticamente
  }

  const handleContinue = () => {
    // Generate next item when user clicks "Continue"
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
    setOnboardingStep(4) // Go to practice mode selection
  }

  const selectPracticeMode = (mode) => {
    settings.set({ practiceMode: mode })
    if (mode === 'mixed') {
      setOnboardingStep(5) // Go to verb type selection for mixed practice
    } else {
      // For specific practice without level, set to C2 to show all forms
      if (!settings.level) {
        settings.set({ level: 'C2' })
      }
      setOnboardingStep(5) // Go to mood selection for specific practice
    }
  }

  const selectMood = (mood) => {
    console.log('selectMood called with:', mood)
    console.log('Current settings:', settings)
    settings.set({ specificMood: mood })
    console.log('After setting specificMood:', settings)
    
    if (settings.level) {
      setOnboardingStep(6) // Go to tense selection for level-specific practice
    } else {
      setOnboardingStep(5) // Go to tense selection for general practice
    }
  }

  const selectTense = (tense) => {
    settings.set({ specificTense: tense })
    if (settings.level) {
      setOnboardingStep(7) // Go to verb type selection for level-specific practice
    } else {
      setOnboardingStep(6) // Go to verb type selection for general practice
    }
  }

  const selectVerbType = (verbType) => {
    settings.set({ verbType })
    startPractice()
  }

  // Function to go back in the onboarding flow
  const goBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1)
    }
  }

  // Function to get available moods for a specific level
  const getAvailableMoodsForLevel = (level) => {
    console.log('getAvailableMoodsForLevel called with level:', level)
    
    // Special case for ALL level - show all moods
    if (level === 'ALL') {
      return ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
    }
    
    const levelGates = gates.filter(g => g.level === level)
    console.log('Level gates found:', levelGates)
    const moods = [...new Set(levelGates.map(g => g.mood))]
    console.log('Available moods for level', level, ':', moods)
    return moods
  }

  // Function to get available tenses for a specific level and mood
  const getAvailableTensesForLevelAndMood = (level, mood) => {
    // Special case for ALL level - show all tenses for the mood
    if (level === 'ALL') {
      const allTenses = {
        'indicative': ['pres', 'pretPerf', 'pretIndef', 'impf', 'plusc', 'fut', 'futPerf'],
        'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
        'imperative': ['impAff', 'impNeg'],
        'conditional': ['cond', 'condPerf'],
        'nonfinite': ['ger', 'part']
      }
      return allTenses[mood] || ['pres']
    }
    
    const levelGates = gates.filter(g => g.level === level && g.mood === mood)
    const tenses = levelGates.map(g => g.tense)
    return tenses
  }

  // Function to get mood description
  const getMoodDescription = (mood) => {
    const descriptions = {
      'indicative': 'Hechos y realidades',
      'subjunctive': 'Dudas, deseos, emociones',
      'imperative': 'Órdenes y mandatos',
      'conditional': 'Situaciones hipotéticas',
      'nonfinite': 'Participios y gerundios'
    }
    return descriptions[mood] || ''
  }

  if (currentMode === 'onboarding') {
    return (
      <div className="App">
        <div className={`onboarding ${isMobile ? 'mobile-layout' : ''}`}>
          <h1>Conjugador para practicar español</h1>
            
            {/* Step 1: Dialect Selection */}
            {onboardingStep === 1 && (
              <>
                <div className="step-indicator">Paso 1 de 6</div>
                <h2>Selecciona tu variedad de español:</h2>
                
                <div className="options-grid">
                  <div className="option-card" onClick={() => selectDialect('rioplatense')}>
                    <h3>Español Rioplatense</h3>
                    <p>Argentina, Uruguay</p>
                    <p className="example">vos tenés, vos hablás</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('la_general')}>
                    <h3>Latino Americano General</h3>
                    <p>La mayoría de América Latina</p>
                    <p className="example">tú tienes, tú hablas</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('peninsular')}>
                    <h3>Español Peninsular</h3>
                    <p>España</p>
                    <p className="example">tú tienes, vosotros tenéis</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('both')}>
                    <h3>Ambas Formas</h3>
                    <p>Acepta tú y vos</p>
                    <p className="example">tú tienes / vos tenés</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Level Selection or Specific Forms */}
            {onboardingStep === 2 && (
              <>
                <div className="step-indicator">Paso 2 de 6</div>
                <h2>¿Qué quieres practicar?</h2>
                <p>Elige tu nivel MCER o trabaja formas específicas:</p>
                
                <div className="options-grid">
                  <div className="option-card" onClick={() => setOnboardingStep(3)}>
                    <h3>📚 Por Nivel MCER</h3>
                    <p>Practica según tu nivel de español</p>
                    <p className="example">A1, A2, B1, B2, C1, C2</p>
                  </div>
                  
                  <div className="option-card" onClick={() => {
                    console.log('Formas Específicas clicked - setting practiceMode to specific')
                    settings.set({ practiceMode: 'specific', level: 'C2' })
                    console.log('Settings after setting practiceMode:', settings)
                    setOnboardingStep(5)
                  }}>
                    <h3>🎯 Formas Específicas</h3>
                    <p>Elige un tiempo o modo específico</p>
                    <p className="example">Presente, subjuntivo, imperativo, etc.</p>
                  </div>
                </div>
                
                <button onClick={goBack} className="back-btn">
                  ← Volver atrás
                </button>
              </>
            )}

            {/* Step 3: Level Selection */}
            {onboardingStep === 3 && (
              <>
                <div className="step-indicator">Paso 3 de 6</div>
                <h2>¿Cuál es tu nivel de español?</h2>
                <p>Selecciona tu nivel según el Marco Común Europeo de Referencia (MCER):</p>
                
                <div className="options-grid">
                  <div className="option-card" onClick={() => selectLevel('A1')}>
                    <h3>A1 - Principiante</h3>
                    <p>Recién empiezas con el español</p>
                    <p className="example">Indicativo: Presente</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('A2')}>
                    <h3>A2 - Elemental</h3>
                    <p>Conoces lo básico</p>
                    <p className="example">Indicativo: Pretéritos, Futuro | Imperativo: Afirmativo</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('B1')}>
                    <h3>B1 - Intermedio</h3>
                    <p>Puedes comunicarte en situaciones familiares</p>
                    <p className="example">Pluscuamperfecto, Futuro compuesto, Subjuntivo presente, Condicional</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('B2')}>
                    <h3>B2 - Intermedio Alto</h3>
                    <p>Te comunicas con fluidez</p>
                    <p className="example">Subjuntivo imperfecto/pluscuamperfecto, Condicional compuesto</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('C1')}>
                    <h3>C1 - Avanzado</h3>
                    <p>Usas el español con eficacia</p>
                    <p className="example">Todas las formas (solo irregulares en básicos)</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('C2')}>
                    <h3>C2 - Superior</h3>
                    <p>Dominio casi nativo</p>
                    <p className="example">Todas las formas verbales</p>
                  </div>
                </div>
                
                <button onClick={goBack} className="back-btn">
                  ← Volver atrás
                </button>
              </>
            )}

            {/* Step 4: Practice Mode Selection (after level selection) or Mood Selection (from main menu) */}
            {onboardingStep === 4 && (
              <>
                <div className="step-indicator">Paso 4 de 6</div>
                {(() => {
                  console.log('Step 4 - Current settings:', {
                    level: settings.level,
                    practiceMode: settings.practiceMode
                  })
                  
                  if (settings.level) {
                    // Coming from level selection - show practice mode
                    return (
                      <>
                        <h2>¿Cómo quieres practicar?</h2>
                        <p>Elige el tipo de práctica para tu nivel {settings.level}:</p>
                        
                        <div className="options-grid">
                          <div className="option-card" onClick={() => selectPracticeMode('mixed')}>
                            <h3>🎲 Práctica Mixta</h3>
                            <p>Mezcla de todos los tiempos y modos de tu nivel</p>
                            <p className="example">Variedad completa para práctica general</p>
                          </div>
                          
                                                <div className="option-card" onClick={() => {
                        settings.set({ practiceMode: 'specific' })
                        // Don't change level if it's already set from previous selection
                        setOnboardingStep(5)
                      }}>
                        <h3>🎯 Formas Específicas</h3>
                        <p>Enfócate en un tiempo/modo específico de tu nivel</p>
                        <p className="example">Ideal para dominar formas particulares</p>
                      </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else {
                    return null
                  }
                })()}
              </>
            )}

            {/* Step 5: Practice Mode Selection or Mood/Tense Selection */}
            {onboardingStep === 5 && (
              <>
                <div className="step-indicator">Paso 5 de 6</div>
                {(() => {
                  console.log('Step 5 - Current settings:', {
                    level: settings.level,
                    practiceMode: settings.practiceMode,
                    specificMood: settings.specificMood
                  })
                  
                  if (settings.level && settings.practiceMode === 'mixed') {
                    // Mixed practice from level - go directly to verb type selection
                    return (
                      <>
                        <h2>Selecciona el tipo de verbos:</h2>
                        <p>Práctica mixta para nivel {settings.level}:</p>
                        
                        <div className="options-grid">
                          <div className="option-card" onClick={() => selectVerbType('all')}>
                            <h3>📚 Todos los Verbos</h3>
                            <p>Regulares e irregulares</p>
                            <p className="example">Práctica completa</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectVerbType('regular')}>
                            <h3>📖 Verbos Regulares</h3>
                            <p>Solo verbos que siguen las reglas</p>
                            <p className="example">hablar, comer, vivir</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectVerbType('irregular')}>
                            <h3>🎯 Verbos Irregulares</h3>
                            <p>Solo verbos con cambios especiales</p>
                            <p className="example">ser, estar, tener, ir</p>
                          </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else if (settings.level && settings.practiceMode === 'specific') {
                    // Specific practice from level - show filtered moods
                    console.log('=== STEP 5 DEBUG ===')
                    console.log('Settings:', { level: settings.level, practiceMode: settings.practiceMode })
                    const availableMoods = getAvailableMoodsForLevel(settings.level)
                    console.log('Available moods for level', settings.level, ':', availableMoods)
                    return (
                      <>
                        <h2>Selecciona el modo verbal:</h2>
                        {settings.level === 'C2' || settings.level === 'ALL' ? (
                          <p>Modos disponibles (todas las formas):</p>
                        ) : (
                          <p>Modos disponibles para nivel {settings.level}:</p>
                        )}
                        
                        <div className="options-grid">
                          {availableMoods.map(mood => (
                            <div key={mood} className="option-card" onClick={() => selectMood(mood)}>
                              <h3>{getMoodLabel(mood)}</h3>
                              <p>{getMoodDescription(mood)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else if (!settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
                    // Coming from main menu - show tense selection
                    console.log('Showing tense selection for mood:', settings.specificMood)
                    return (
                      <>
                        <h2>Selecciona el tiempo verbal:</h2>
                        
                        <div className="options-grid">
                          {getTensesForMood(settings.specificMood).map(tense => (
                            <div key={tense} className="option-card" onClick={() => selectTense(tense)}>
                              <h3>{getTenseLabel(tense)}</h3>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else if (!settings.level && settings.practiceMode === 'specific') {
                    // Coming from forms specific without level - show mood selection
                    console.log('Showing mood selection for forms specific without level')
                    return (
                      <>
                        <h2>Selecciona el modo verbal:</h2>
                        
                        <div className="options-grid">
                          <div className="option-card" onClick={() => selectMood('indicative')}>
                            <h3>Indicativo</h3>
                            <p>Hechos y realidades</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectMood('subjunctive')}>
                            <h3>Subjuntivo</h3>
                            <p>Dudas, deseos, emociones</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectMood('imperative')}>
                            <h3>Imperativo</h3>
                            <p>Órdenes y mandatos</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectMood('conditional')}>
                            <h3>Condicional</h3>
                            <p>Situaciones hipotéticas</p>
                          </div>
                          
                          <div className="option-card" onClick={() => selectMood('nonfinite')}>
                            <h3>Formas no conjugadas</h3>
                            <p>Participios y gerundios</p>
                          </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else {
                    console.log('No condition matched in step 5')
                    return null
                  }
                })()}
              </>
            )}

            {/* Step 6: Tense Selection (for specific practice from level) or Verb Type Selection */}
            {onboardingStep === 6 && (
              <>
                <div className="step-indicator">Paso 6 de 6</div>
                {(() => {
                  if (settings.level) {
                    // Coming from level selection - show filtered tenses
                    return (
                      <>
                        <h2>Selecciona el tiempo verbal:</h2>
                        {settings.level === 'C2' || settings.level === 'ALL' ? (
                          <p>Tiempos disponibles para {getMoodLabel(settings.specificMood)} (todas las formas):</p>
                        ) : (
                          <p>Tiempos disponibles para {getMoodLabel(settings.specificMood)} en nivel {settings.level}:</p>
                        )}
                        
                        <div className="options-grid">
                          {getAvailableTensesForLevelAndMood(settings.level, settings.specificMood).map(tense => (
                            <div key={tense} className="option-card" onClick={() => selectTense(tense)}>
                              <h3>{getTenseLabel(tense)}</h3>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          ← Volver atrás
                        </button>
                      </>
                    )
                  } else {
                    return null
                  }
                })()}
              </>
            )}

            {/* Step 7: Verb Type Selection (for specific practice from level) */}
            {onboardingStep === 7 && settings.level && (
              <>
                <div className="step-indicator">Paso 7 de 7</div>
                <h2>Selecciona el tipo de verbos:</h2>
                
                <div className="options-grid">
                  <div className="option-card" onClick={() => selectVerbType('all')}>
                    <h3>📚 Todos los Verbos</h3>
                    <p>Regulares e irregulares</p>
                    <p className="example">Práctica completa</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectVerbType('regular')}>
                    <h3>📖 Verbos Regulares</h3>
                    <p>Solo verbos que siguen las reglas</p>
                    <p className="example">hablar, comer, vivir</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectVerbType('irregular')}>
                    <h3>🎯 Verbos Irregulares</h3>
                    <p>Solo verbos con cambios especiales</p>
                    <p className="example">ser, estar, tener, ir</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
    )
  }

  if (currentMode === 'drill') {
    return (
      <div className="App">
        <header className="header">
          <div></div>
          <button 
            onClick={() => {
              setCurrentMode('onboarding')
              setOnboardingStep(1)
            }}
            className="back-to-menu-btn"
          >
            🏠 Volver al menú
          </button>
        </header>

        {showSettings && (
          <div className="settings-panel">
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
                <label title="Elige si quieres practicar con todos los tiempos o enfocarte en uno específico">Modo de práctica:</label>
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

              <div className="setting-group">
                <label title="Elige si quieres practicar con ambos pronombres (tú y vos) o solo uno">Práctica de pronombres:</label>
                <select 
                  value={settings.practicePronoun}
                  onChange={(e) => {
                    settings.set({ practicePronoun: e.target.value })
                    generateNextItem()
                  }}
                  className="setting-select"
                >
                  <option value="both">Ambos (tú y vos)</option>
                  <option value="tu_only">Solo tú</option>
                  <option value="vos_only">Solo vos</option>
                </select>
              </div>

              <div className="setting-group">
                <label title="Elige el tipo de verbos a practicar">Tipo de verbos:</label>
                <select 
                  value={settings.verbType}
                  onChange={(e) => {
                    settings.set({ verbType: e.target.value })
                    generateNextItem()
                  }}
                  className="setting-select"
                >
                  <option value="all">Todos (regulares e irregulares)</option>
                  <option value="regular">Solo regulares</option>
                  <option value="irregular">Solo irregulares</option>
                </select>
              </div>

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
                className="btn btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Cerrar
              </button>
            </div>
        )}

        <main className={`main-content ${isMobile ? 'mobile-layout' : ''}`}>
          {currentItem ? (
            <Drill 
              currentItem={currentItem}
              onResult={handleDrillResult}
              onContinue={handleContinue}
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
    <div className="App">
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default App