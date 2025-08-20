import { useState, useEffect, useMemo, useRef } from 'react'
import { useSettings } from './state/settings.js'
import { verbs } from './data/verbs.js'
import { chooseNext } from './lib/core/generator.js'
import { warmupCaches, getCacheStats } from './lib/core/optimizedCache.js'
import { getTensesForMood, getTenseLabel, getMoodLabel } from './lib/utils/verbLabels.js'
import { getFamiliesForMood, getFamiliesForTense, getFamilyById } from './lib/data/irregularFamilies.js'
import { getSimplifiedGroupsForMood, getSimplifiedGroupsForTense, shouldUseSimplifiedGroupingForMood, shouldUseSimplifiedGrouping, expandSimplifiedGroup } from './lib/data/simplifiedFamilyGroups.js'
import { LEVELS } from './lib/data/levels.js'
import gates from './data/curriculum.json'
import Drill from './features/drill/Drill.jsx'

import './App.css'
import enieIcon from '/enie.png'

/**
 * Componente accesible para elementos interactivos
 * 
 * Este componente reemplaza los <div> con onClick por elementos que cumplen
 * con estándares de accesibilidad WCAG:
 * 
 * - Navegación por teclado (Tab para enfocar, Enter/Espacio para activar)
 * - Roles ARIA apropiados para lectores de pantalla 
 * - Etiquetas aria-label descriptivas
 * - tabIndex=0 para incluir en el orden de tabulación
 * 
 * @param {string} className - Clases CSS a aplicar
 * @param {function} onClick - Función a ejecutar al hacer clic o presionar Enter/Espacio
 * @param {ReactNode} children - Contenido del elemento
 * @param {string} title - Título descriptivo para aria-label y title
 * @param {string} role - Rol ARIA (por defecto "button")
 */
function ClickableCard({ className, onClick, children, title, role = "button", ...props }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <div
      className={className}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={0}
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </div>
  )
}

// Helper function to get allowed lemmas from level configuration
function getAllowedLemmasForLevel(level) {
  const levelConfig = LEVELS[level]
  if (!levelConfig || !levelConfig.verbPacks) {
    return null // No restriction
  }
  
  const allowedLemmas = new Set()
  levelConfig.verbPacks.forEach(pack => {
    pack.lemmas.forEach(lemma => allowedLemmas.add(lemma))
  })
  
  return allowedLemmas
}

function App() {
  
  // Initialize app state
  useEffect(() => {
    // Ensure Resistance mode is off on app load
    settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
    
    // Warm up performance caches
    warmupCaches()
    
    // Log cache stats in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('📊 Cache Stats:', getCacheStats())
      }, 1000)
    }
  }, [])
  
  const [currentMode, setCurrentMode] = useState('onboarding') // 'onboarding', 'drill', 'settings'
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: dialect, 2: level, 3: practice mode, 4: mood/tense, 5: verb type, 6: family selection
  const settings = useSettings()
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const handlingPopRef = useRef(false)
  const lastPushedRef = useRef({ mode: null, step: null })
  
  // Close all top panels and deactivate auxiliary functions
  const closeTopPanelsAndFeatures = () => {
    setShowQuickSwitch(false)
    setShowChallenges(false)
    setShowAccentKeys(false)
    setShowGames(false)
    settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
    settings.set({ reverseActive: false, doubleActive: false })
  }

  const allFormsForRegion = useMemo(() => {
    if (!settings.region) return []
    const acc = []
    const existingKey = new Set()
    const lemmaToParticiple = new Map()
    const subjPresByLemma = new Map() // lemma -> Map(person -> value)
    const lemmaEnding = new Map() // lemma -> ending ('ar'|'er'|'ir')
    for (const verb of verbs) {
      for (const paradigm of verb.paradigms) {
        if (!paradigm.regionTags.includes(settings.region)) continue
        for (const form of paradigm.forms) {
          acc.push({ lemma: verb.lemma, ...form })
          existingKey.add(`${verb.lemma}|${form.mood}|${form.tense}|${form.person}`)
          if (form.mood === 'nonfinite' && form.tense === 'part') {
            lemmaToParticiple.set(verb.lemma, form.value)
          }
          if (form.mood === 'subjunctive' && form.tense === 'subjPres') {
            if (!subjPresByLemma.has(verb.lemma)) subjPresByLemma.set(verb.lemma, new Map())
            subjPresByLemma.get(verb.lemma).set(form.person, form.value)
          }
        }
        // cache lemma ending once
        if (!lemmaEnding.has(verb.lemma)) {
          if (verb.lemma.endsWith('ar')) lemmaEnding.set(verb.lemma, 'ar')
          else if (verb.lemma.endsWith('er')) lemmaEnding.set(verb.lemma, 'er')
          else if (verb.lemma.endsWith('ir')) lemmaEnding.set(verb.lemma, 'ir')
        }
      }
    }
    // Generate compound forms for all verbs that have a participle (ensures full availability across perfect tenses)
    const persons = ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p']
    const aux = {
      indicative: {
        pretPerf: { '1s':'he','2s_tu':'has','2s_vos':'has','3s':'ha','1p':'hemos','2p_vosotros':'habéis','3p':'han' },
        plusc:    { '1s':'había','2s_tu':'habías','2s_vos':'habías','3s':'había','1p':'habíamos','2p_vosotros':'habíais','3p':'habían' },
        futPerf:  { '1s':'habré','2s_tu':'habrás','2s_vos':'habrás','3s':'habrá','1p':'habremos','2p_vosotros':'habréis','3p':'habrán' }
      },
      conditional: {
        condPerf: { '1s':'habría','2s_tu':'habrías','2s_vos':'habrías','3s':'habría','1p':'habríamos','2p_vosotros':'habríais','3p':'habrían' }
      },
      subjunctive: {
        subjPerf:  { '1s':'haya','2s_tu':'hayas','2s_vos':'hayas','3s':'haya','1p':'hayamos','2p_vosotros':'hayáis','3p':'hayan' },
        subjPlusc:{ '1s':'hubiera','2s_tu':'hubieras','2s_vos':'hubieras','3s':'hubiera','1p':'hubiéramos','2p_vosotros':'hubierais','3p':'hubieran' }
      }
    }
    lemmaToParticiple.forEach((part, lemma) => {
      // Indicative perfects
      ;(['pretPerf','plusc','futPerf']).forEach(tense => {
        persons.forEach(p => {
          const key = `${lemma}|indicative|${tense}|${p}`
          if (!existingKey.has(key)) {
            acc.push({ lemma, mood:'indicative', tense, person: p, value: `${aux.indicative[tense][p]} ${part}` })
            existingKey.add(key)
          }
        })
      })
      // Conditional perfect
      persons.forEach(p => {
        const key = `${lemma}|conditional|condPerf|${p}`
        if (!existingKey.has(key)) {
          acc.push({ lemma, mood:'conditional', tense:'condPerf', person: p, value: `${aux.conditional.condPerf[p]} ${part}` })
          existingKey.add(key)
        }
      })
      // Subjunctive perfects
      ;(['subjPerf','subjPlusc']).forEach(tense => {
        persons.forEach(p => {
          const key = `${lemma}|subjunctive|${tense}|${p}`
          if (!existingKey.has(key)) {
            acc.push({ lemma, mood:'subjunctive', tense, person: p, value: `${aux.subjunctive[tense][p]} ${part}` })
            existingKey.add(key)
          }
        })
      })
    })

    // Generate imperative forms from subjunctive present when missing
    const subjPersons = ['2s_tu','2s_vos','3s','1p','2p_vosotros','3p']
    verbs.forEach(verb => {
      const lemma = verb.lemma
      const subj = subjPresByLemma.get(lemma)
      if (!subj) return
      // Affirmative from subjunctive (except special 2s forms)
      // 3s, 1p, 3p use subjunctive directly
      ;(['3s','1p','3p']).forEach(p => {
        const key = `${lemma}|imperative|impAff|${p}`
        if (!existingKey.has(key)) {
          const v = subj.get(p)
          if (v) {
            acc.push({ lemma, mood: 'imperative', tense: 'impAff', person: p, value: v })
            existingKey.add(key)
          }
        }
      })
      // 2p_vosotros affirmative from infinitive: -ar→ad, -er→ed, -ir→id
      const ending = lemmaEnding.get(lemma)
      if (ending) {
        const vosotrosKey = `${lemma}|imperative|impAff|2p_vosotros`
        if (!existingKey.has(vosotrosKey)) {
          let v = ''
          if (ending === 'ar') v = lemma.replace(/ar$/, 'ad')
          else if (ending === 'er') v = lemma.replace(/er$/, 'ed')
          else if (ending === 'ir') v = lemma.replace(/ir$/, 'id')
          if (v) {
            acc.push({ lemma, mood: 'imperative', tense: 'impAff', person: '2p_vosotros', value: v })
            existingKey.add(vosotrosKey)
          }
        }
      }
      // Negative imperative for all persons = 'no ' + subjunctive present
      subjPersons.forEach(p => {
        const key = `${lemma}|imperative|impNeg|${p}`
        if (!existingKey.has(key)) {
          const v = subj.get(p)
          if (v) {
            acc.push({ lemma, mood: 'imperative', tense: 'impNeg', person: p, value: `no ${v}` })
            existingKey.add(key)
          }
        }
      })

      // Ensure 2s_vos affirmative exists (voseo regular), with special case for 'ir' → 'andá'
      const keyVos = `${lemma}|imperative|impAff|2s_vos`
      if (!existingKey.has(keyVos)) {
        let vvos = ''
        if (lemma === 'ir') {
          vvos = 'andá'
        } else {
          const end = lemmaEnding.get(lemma)
          if (end === 'ar') vvos = lemma.replace(/ar$/, 'á')
          else if (end === 'er') vvos = lemma.replace(/er$/, 'é')
          else if (end === 'ir') vvos = lemma.replace(/ir$/, 'í')
        }
        if (vvos) {
          acc.push({ lemma, mood: 'imperative', tense: 'impAff', person: '2s_vos', value: vvos })
          existingKey.add(keyVos)
        }
      }
    })
    return acc
  }, [settings.region])

  // History integration: make mobile back gesture act like in-app back
  useEffect(() => {
    // Seed initial state
    try {
      window.history.replaceState({ app: true, mode: currentMode, step: onboardingStep }, '')
    } catch {}
    const onPop = (e) => {
      const st = e.state
      if (st && st.app) {
        handlingPopRef.current = true
        // Apply app state from history snapshot
        setShowSettings(false)
        setCurrentItem(null)
        closeTopPanelsAndFeatures()
        setCurrentMode(st.mode || 'onboarding')
        setOnboardingStep(st.step || 2)
        // Small delay to re-enable pushing
        setTimeout(() => { handlingPopRef.current = false }, 0)
      } else {
        // Prevent exiting the app: re-push current state
        try { window.history.pushState({ app: true, mode: currentMode, step: onboardingStep }, '') } catch {}
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Push state on app navigation changes
  useEffect(() => {
    if (handlingPopRef.current) return
    const cur = { mode: currentMode, step: onboardingStep }
    const last = lastPushedRef.current
    if (last.mode === cur.mode && last.step === cur.step) return
    try {
      window.history.pushState({ app: true, mode: cur.mode, step: cur.step }, '')
      lastPushedRef.current = cur
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, onboardingStep])

  // Helpers to build blocks for mixed practice per level
  const pickRandom = (arr, n) => {
    const a = [...arr]
    const out = []
    while (a.length && out.length < n) {
      const i = Math.floor(Math.random() * a.length)
      out.push(a.splice(i,1)[0])
    }
    return out
  }
  const combosForLevelMixed = (level) => {
    // Simplificado: no forzar tiempos por nivel; usar todos los de curriculum
    const allowed = gates.filter(g => g.level === level).map(g => ({ mood: g.mood, tense: g.tense }))
    return allowed.length ? pickRandom(allowed, Math.min(4, allowed.length)) : []
  }
  const blockSizeForLevel = (level) => {
    if (level === 'A1') return 8
    if (level === 'A2') return 8
    if (level === 'B1') return 12
    if (level === 'B2') return 12
    if (level === 'C1') return 16
    if (level === 'C2') return 20
    return 10
  }

  const generateNextItem = (itemToExclude = null) => {
    console.log('🎯 GENERATE NEXT ITEM - Starting with settings:', {
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      itemToExclude: itemToExclude?.lemma
    })
    
    const nextForm = chooseNext({ forms: allFormsForRegion, history, currentItem: itemToExclude })
    
    console.log('🎯 GENERATE NEXT ITEM - chooseNext returned:', nextForm ? {
      lemma: nextForm.lemma,
      mood: nextForm.mood,
      tense: nextForm.tense,
      person: nextForm.person
    } : null)
    
    if (nextForm && nextForm.mood && nextForm.tense) {
      // Force a new object to ensure React detects the change
      const newItem = {
        id: Date.now(), // Unique identifier to force re-render
        lemma: nextForm.lemma,
        mood: nextForm.mood,
        tense: nextForm.tense,
        person: nextForm.person,
        form: {
          value: nextForm.value || nextForm.form, // Handle both 'value' and 'form' fields from database
          lemma: nextForm.lemma,
          mood: nextForm.mood,
          tense: nextForm.tense,
          person: nextForm.person,
          alt: nextForm.alt || [], // Alternative forms if any
          accepts: nextForm.accepts || {} // Accepted variants (tu/vos/vosotros)
        },
        settings: { 
          ...settings,
          // CRITICAL FIX: Auto-activate dialect-specific settings based on form person
          useVoseo: settings.useVoseo || nextForm.person?.includes('vos') || nextForm.person === '2s_vos',
          useTuteo: settings.useTuteo || nextForm.person?.includes('tu') || nextForm.person === '2s_tu',
          useVosotros: settings.useVosotros || nextForm.person?.includes('vosotros') || nextForm.person === '2p_vosotros'
        } // Include settings for grading
      }
      
      // Debug logging for voseo item generation
      if (settings.useVoseo || nextForm.person?.includes('vos') || (nextForm.accepts && nextForm.accepts.vos)) {
        console.log('🔧 VOSEO DEBUG - Item generation:')
        console.log('  NextForm from generator:', nextForm)
        console.log('  Settings passed:', settings)
        console.log('  Generated item form:', newItem.form)
        console.log('  useVoseo setting:', settings.useVoseo)
        console.log('  Person:', nextForm.person)
        console.log('  Accepts:', nextForm.accepts)
      }
          // SOLUCIÓN BULLETPROOF: Modo doble con verificación FINAL
          if (useSettings.getState().doubleActive) {
            try {
              const lvl = useSettings.getState().level || 'B1'
              
              // 1. Obtener todas las formas disponibles para el nivel
              const levelForms = allFormsForRegion.filter(f => {
                const allowedMoods = getAvailableMoodsForLevel(lvl)
                const allowedTenses = getAvailableTensesForLevelAndMood(lvl, f.mood)
                return allowedMoods.includes(f.mood) && allowedTenses.includes(f.tense)
              })
              
              // 2. Agrupar formas por verbo (lemma)
              const formsByVerb = new Map()
              for (const f of levelForms) {
                if (!formsByVerb.has(f.lemma)) {
                  formsByVerb.set(f.lemma, [])
                }
                formsByVerb.get(f.lemma).push(f)
              }
              
              // 3. Encontrar verbos que tengan al menos 2 formas con diferentes combinaciones mood+tense
              const validVerbs = []
              for (const [lemma, forms] of formsByVerb.entries()) {
                const uniqueCombos = new Set()
                for (const form of forms) {
                  uniqueCombos.add(`${form.mood}|${form.tense}`)
                }
                if (uniqueCombos.size >= 2) {
                  validVerbs.push({ lemma, forms, uniqueCombos: uniqueCombos.size })
                }
              }
              
              // 4. Seleccionar un verbo aleatorio de los válidos
              if (validVerbs.length > 0) {
                // Ordenar por cantidad de combinaciones únicas (preferir verbos con más variedad)
                validVerbs.sort((a, b) => b.uniqueCombos - a.uniqueCombos)
                
                // Tomar uno de los primeros verbos (con más variedad)
                const selectedVerb = validVerbs[Math.floor(Math.random() * Math.min(3, validVerbs.length))]
                const verbForms = selectedVerb.forms
                
                // 5. Crear mapa de combinaciones únicas mood+tense para este verbo
                const uniqueCombos = new Map()
                for (const f of verbForms) {
                  const key = `${f.mood}|${f.tense}`
                  if (!uniqueCombos.has(key)) {
                    uniqueCombos.set(key, [])
                  }
                  uniqueCombos.get(key).push(f)
                }
                
                // 6. Seleccionar dos combinaciones diferentes
                const comboKeys = Array.from(uniqueCombos.keys())
                if (comboKeys.length >= 2) {
                  // Mezclar las combinaciones
                  for (let i = comboKeys.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                    ;[comboKeys[i], comboKeys[j]] = [comboKeys[j], comboKeys[i]]
                  }
                  
                  // Tomar las primeras dos combinaciones distintas
                  const firstCombo = comboKeys[0]
                  const secondCombo = comboKeys[1]
                  
                  // 7. Obtener formas de cada combinación (del mismo verbo)
                  const firstForms = uniqueCombos.get(firstCombo)
                  const secondForms = uniqueCombos.get(secondCombo)
                  
                  if (firstForms && secondForms) {
                    // Seleccionar formas aleatorias de cada combinación
                    const firstForm = firstForms[Math.floor(Math.random() * firstForms.length)]
                    const secondForm = secondForms[Math.floor(Math.random() * secondForms.length)]
                    
                    // VERIFICACIÓN FINAL: asegurar que sean del MISMO VERBO y DIFERENTES combinaciones
                    if (firstForm.lemma === secondForm.lemma && 
                        (firstForm.mood !== secondForm.mood || firstForm.tense !== secondForm.tense)) {
                      
                      // Actualizar el item principal
                      newItem.lemma = firstForm.lemma
                      newItem.mood = firstForm.mood
                      newItem.tense = firstForm.tense
                      newItem.person = firstForm.person
                      newItem.form = {
                        value: firstForm.value || firstForm.form,
                        lemma: firstForm.lemma,
                        mood: firstForm.mood,
                        tense: firstForm.tense,
                        person: firstForm.person,
                        alt: firstForm.alt || [],
                        accepts: firstForm.accepts || {}
                      }
                      
                      // Agregar la segunda forma
                      newItem.secondForm = {
                        value: secondForm.value || secondForm.form,
                        lemma: secondForm.lemma,
                        mood: secondForm.mood,
                        tense: secondForm.tense,
                        person: secondForm.person,
                        alt: secondForm.alt || [],
                        accepts: secondForm.accepts || {}
                      }
                    } else {
                      // FALLBACK DE EMERGENCIA: buscar otro verbo válido
                      const fallbackVerb = validVerbs.find(v => v.lemma !== selectedVerb.lemma)
                      if (fallbackVerb) {
                        // Recursivamente intentar con otro verbo
                        setTimeout(() => generateNextItem(), 100)
                        return
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('Double mode pairing error:', e)
            }
          }
      setCurrentItem(newItem)
    } else {
      console.error('❌ No valid form found! Settings:', {
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        level: settings.level,
        useVoseo: settings.useVoseo,
        allFormsCount: allFormsForRegion.length
      })
      
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
    console.log('🔧 USEEFFECT DEBUG - Checking drill init conditions:', {
      currentMode,
      region: settings.region,
      currentItem: !!currentItem,
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      conditionMet: currentMode === 'drill' && settings.region && !currentItem && 
        settings.practiceMode && settings.verbType && 
        (settings.practiceMode === 'mixed' || (settings.specificMood && settings.specificTense))
    })
    
    if (currentMode === 'drill' && settings.region && !currentItem && 
        settings.practiceMode && settings.verbType && 
        (settings.practiceMode === 'mixed' || (settings.specificMood && settings.specificTense))) {
      // Scroll to top when entering drill mode
      window.scrollTo(0, 0)
      
      console.log('🔧 DRILL INIT - Generating first item with settings:', {
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      })
      
      // Only generate a new item when entering drill mode or when practice settings change AND there's no current item
      generateNextItem()
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily])

  const handleDrillResult = (result) => {
    // Only update history if it's not an accent error
    if (!result.isAccentError) {
      const key = `${currentItem.mood}:${currentItem.tense}:${currentItem.person}:${currentItem.form.value}`
      setHistory(prev => ({
        ...prev,
        [key]: {
          seen: (prev[key]?.seen || 0) + 1,
          correct: (prev[key]?.correct || 0) + (result.correct ? 1 : 0)
        }
      }))
    }
    // NO generar siguiente item automáticamente
  }

  const handleContinue = () => {
    // Generate next item when user clicks "Continue"
    // Decrement block counter if active
    const s = useSettings.getState()
    if (s.currentBlock && typeof s.currentBlock.itemsRemaining === 'number') {
      const n = s.currentBlock.itemsRemaining - 1
      if (n <= 0) {
        // End block
        settings.set({ currentBlock: null })
      } else {
        settings.set({ currentBlock: { ...s.currentBlock, itemsRemaining: n } })
      }
    }
    generateNextItem(currentItem)
  }

  const startPractice = () => {
    // Clear history when starting new practice
    setHistory({})
    setCurrentItem(null)
    // Cerrar paneles y desactivar funciones auxiliares
    closeTopPanelsAndFeatures()
    
    // Scroll to top when starting practice
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setCurrentMode('drill')
  }

  const selectDialect = (dialect) => {
    // Al elegir variedad, aseguramos que todos los paneles superiores estén cerrados
    closeTopPanelsAndFeatures()
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
          region: 'la_general',
          practicePronoun: 'all' // Agregar soporte para todas las formas
        })
        break
    }
    setOnboardingStep(2) // Move to level selection
  }

  const selectLevel = (level) => {
    // Al elegir nivel, cerramos paneles y funciones auxiliares
    closeTopPanelsAndFeatures()
    // Apply level-specific policies
    const updates = { level }
    if (level === 'A1') {
      updates.strict = false
      updates.accentTolerance = 'accept'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'off'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'none'
      updates.perItemMs = null
      updates.medianTargetMs = null
      updates.showPronouns = true
      updates.practicePronoun = 'both'
      // Use level-based verb packs
      updates.allowedLemmas = getAllowedLemmasForLevel('A1')
    } else if (level === 'A2') {
      updates.strict = false
      updates.accentTolerance = 'warn'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'off'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'soft'
      updates.perItemMs = 8000
      updates.medianTargetMs = null
      updates.showPronouns = true
      updates.allowedLemmas = getAllowedLemmasForLevel('A2')
    } else if (level === 'B1') {
      updates.strict = true
      updates.accentTolerance = 'warn'
      updates.requireDieresis = false
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'low'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 0
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = false
      updates.timeMode = 'soft'
      updates.perItemMs = 6000
      updates.medianTargetMs = 3000
      updates.allowedLemmas = getAllowedLemmasForLevel('B1')
    } else if (level === 'B2') {
      updates.strict = true
      updates.accentTolerance = 'strict'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = false
      updates.cliticStrictness = 'low'
      updates.impSubjVariantMode = 'accept_both'
      updates.cliticsPercent = 10
      updates.neutralizePronoun = false
      updates.rotateSecondPerson = true
      updates.timeMode = 'strict'
      updates.perItemMs = 5000
      updates.medianTargetMs = 2500
      updates.allowedLemmas = getAllowedLemmasForLevel('B2')
    } else if (level === 'C1') {
      updates.strict = true
      updates.accentTolerance = 'warn'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = true
      updates.cliticStrictness = 'high'
      updates.cliticsPercent = 30
      updates.neutralizePronoun = true
      updates.rotateSecondPerson = false
      updates.timeMode = 'strict'
      updates.perItemMs = 3500
      updates.medianTargetMs = 1800
      updates.enableFuturoSubjRead = true
      updates.enableFuturoSubjProd = false
      updates.enableC2Conmutacion = false
      updates.allowedLemmas = getAllowedLemmasForLevel('C1')
    } else if (level === 'C2') {
      updates.strict = true
      updates.accentTolerance = 'strict'
      updates.requireDieresis = true
      updates.blockNonNormativeSpelling = true
      updates.cliticStrictness = 'high'
      updates.cliticsPercent = 60
      updates.neutralizePronoun = true
      updates.rotateSecondPerson = true
      updates.timeMode = 'strict'
      updates.perItemMs = 2500
      updates.medianTargetMs = 1200
      updates.enableFuturoSubjRead = true
      updates.enableFuturoSubjProd = true
      updates.enableC2Conmutacion = true
      updates.burstSize = 16
      // Rare but alive families to boost in C2 (can be edited in settings UI later)
      updates.c2RareBoostLemmas = ['argüir','delinquir','henchir','agorar','cocer','esparcir','distinguir','tañer']
      updates.allowedLemmas = getAllowedLemmasForLevel('C2')
    }
    settings.set(updates)
    setOnboardingStep(4) // Go to practice mode selection
  }

  const selectPracticeMode = (mode) => {
    // Al elegir modo de práctica desde onboarding, cerramos paneles
    closeTopPanelsAndFeatures()
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
    // Cerrar paneles al fijar modo
    closeTopPanelsAndFeatures()
    settings.set({ specificMood: mood })
    
    // Clear history when changing mood
    setHistory({})
    setCurrentItem(null)
    
    if (settings.level) {
      setOnboardingStep(6) // Go to tense selection for level-specific practice
    } else {
      setOnboardingStep(5) // Go to tense selection for general practice
    }
  }

  const selectTense = (tense) => {
    // Cerrar paneles al fijar tiempo
    closeTopPanelsAndFeatures()
    settings.set({ specificTense: tense })
    
    // Clear history when changing tense
    setHistory({})
    setCurrentItem(null)
    
    if (settings.level) {
      setOnboardingStep(7) // Go to verb type selection for level-specific practice
    } else {
      setOnboardingStep(6) // Go to verb type selection for general practice
    }
  }

  const selectVerbType = (verbType) => {
    // Cerrar paneles al fijar tipo de verbo
    closeTopPanelsAndFeatures()
    
    if (verbType === 'irregular') {
      // Check if only one family is available for the current tense
      const tense = settings.specificTense
      const availableFamilies = tense ? getFamiliesForTense(tense) : []
      
      if (availableFamilies.length === 1) {
        // Only one family available - auto-select it and start practice
        const singleFamily = availableFamilies[0]
        const updates = { verbType, selectedFamily: singleFamily.id }
        
        // Initialize mixed-practice blocks per level
        const lvl = settings.level
        if (settings.practiceMode === 'mixed' && lvl) {
          const combos = combosForLevelMixed(lvl)
          updates.currentBlock = { combos, itemsRemaining: blockSizeForLevel(lvl) }
        } else {
          updates.currentBlock = null
        }
        settings.set(updates)
        
        // Clear history when changing verb type
        setHistory({})
        setCurrentItem(null)
        
        startPractice()
      } else if (availableFamilies.length === 0) {
        // No specific families for this tense (compound tenses) - auto-select "all irregulars"
        const updates = { verbType, selectedFamily: null }
        
        // Initialize mixed-practice blocks per level
        const lvl = settings.level
        if (settings.practiceMode === 'mixed' && lvl) {
          const combos = combosForLevelMixed(lvl)
          updates.currentBlock = { combos, itemsRemaining: blockSizeForLevel(lvl) }
        } else {
          updates.currentBlock = null
        }
        settings.set(updates)
        
        // Clear history when changing verb type
        setHistory({})
        setCurrentItem(null)
        
        startPractice()
      } else {
        // Multiple families available - show family selection
        settings.set({ verbType })
        setOnboardingStep(getNextStep() + 1) // Go to family selection
      }
    } else {
      // Para regulares y todos, continuar como antes
      const updates = { verbType, selectedFamily: null }
      // Initialize mixed-practice blocks per level
      const lvl = settings.level
      if (settings.practiceMode === 'mixed' && lvl) {
        const combos = combosForLevelMixed(lvl)
        updates.currentBlock = { combos, itemsRemaining: blockSizeForLevel(lvl) }
      } else {
        updates.currentBlock = null
      }
      settings.set(updates)
      
      // Clear history when changing verb type
      setHistory({})
      setCurrentItem(null)
      
      startPractice()
    }
  }
  
  const selectFamily = (familyId) => {
    // Cerrar paneles al fijar familia
    closeTopPanelsAndFeatures()
    console.log('🔧 FAMILY DEBUG - selectFamily called with:', familyId)
    console.log('🔧 FAMILY DEBUG - Current settings before update:', {
      verbType: settings.verbType,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      selectedFamily: settings.selectedFamily
    })
    const updates = { selectedFamily: familyId }
    
    // Initialize mixed-practice blocks per level
    const lvl = settings.level
    if (settings.practiceMode === 'mixed' && lvl) {
      const combos = combosForLevelMixed(lvl)
      updates.currentBlock = { combos, itemsRemaining: blockSizeForLevel(lvl) }
    } else {
      updates.currentBlock = null
    }
    settings.set(updates)
    
    // Clear history when changing family
    setHistory({})
    setCurrentItem(null)
    
    startPractice()
  }
  
  // Helper function to get next step number
  const getNextStep = () => {
    if (settings.level && settings.practiceMode === 'mixed') return 5
    if (settings.level && settings.practiceMode === 'specific') return 7
    if (!settings.level && settings.practiceMode === 'specific') return 6
    return 5
  }

  // Function to go back in the onboarding flow
  const goBack = () => {
    if (onboardingStep > 1) {
      // Special case: if we're in step 5 and came from "Por tema", go directly to main menu
      if (onboardingStep === 5 && settings.cameFromTema) {
        setOnboardingStep(2) // Go directly to main menu: "¿Qué querés practicar?"
        return
      }
      
      // Special case: if we're in step 6 and came from "Por tema", go back to step 5
      if (onboardingStep === 6 && settings.cameFromTema) {
        setOnboardingStep(5)
        return
      }
      
      // Default behavior: go back one step
      setOnboardingStep(onboardingStep - 1)
    }
    
    // Scroll to top when navigating back
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    // Go back to settings
    setShowSettings(true)
  }

  const handleHome = () => {
    // Scroll to top when returning to menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setCurrentMode('onboarding')
    setOnboardingStep(1)
    setCurrentItem(null)
    setHistory({})
    closeTopPanelsAndFeatures()
  }

  // Function to get available moods for a specific level
  const getAvailableMoodsForLevel = (level) => {
    // Special case for ALL level - show all moods
    if (level === 'ALL') {
      return ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
    }
    
    const levelGates = gates.filter(g => g.level === level)
    const moods = [...new Set(levelGates.map(g => g.mood))]
    return moods
  }

  // Function to get available tenses for a specific level and mood
  const getAvailableTensesForLevelAndMood = (level, mood) => {
    // Special case for ALL level - show all tenses for the mood
    if (level === 'ALL') {
      const allTenses = {
        'indicative': ['pres', 'pretPerf', 'pretIndef', 'impf', 'plusc', 'fut', 'futPerf'],
        'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
        'imperative': ['impAff', 'impNeg', 'impMixed'],
        'conditional': ['cond', 'condPerf'],
        'nonfinite': ['ger', 'part', 'nonfiniteMixed']
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

  // Function to get conjugation examples
  const getConjugationExample = (mood, tense) => {
    const examples = {
      // Indicativo
      'indicative_pres': 'hablo, hablas, habla',
      'indicative_pretIndef': 'hablé, hablaste, habló',
      'indicative_impf': 'hablaba, hablabas, hablaba',
      'indicative_fut': 'hablaré, hablarás, hablará',
      'indicative_pretPerf': 'he hablado, has hablado, ha hablado',
      'indicative_plusc': 'había hablado, habías hablado, había hablado',
      'indicative_futPerf': 'habré hablado, habrás hablado, habrá hablado',
      
      // Subjuntivo
      'subjunctive_subjPres': 'hable, hables, hable',
      'subjunctive_subjImpf': 'hablara, hablaras, hablara',
      'subjunctive_subjPerf': 'haya hablado, hayas hablado, haya hablado',
      'subjunctive_subjPlusc': 'hubiera hablado, hubieras hablado, hubiera hablado',
      
      // Imperativo - ahora incluye variantes dialectales
      'imperative_impAff': settings.useVoseo ? 'hablá, hable, hablen' : 'habla, hable, hablen',
      'imperative_impNeg': settings.useVoseo ? 'no hables, no hable, no hablen' : 'no hables, no hable, no hablen',
      'imperative_impMixed': settings.useVoseo ? 'hablá / no hables, hable / no hable' : 'habla / no hables, hable / no hable',
      
      // Condicional
      'conditional_cond': 'hablaría, hablarías, hablaría',
      'conditional_condPerf': 'habría hablado, habrías hablado, habría hablado',
      
      // Formas no conjugadas
      'nonfinite_ger': 'hablando',
      'nonfinite_part': 'hablado',
      'nonfinite_nonfiniteMixed': 'hablando / hablado'
    }
    
    const key = `${mood}_${tense}`
    return examples[key] || ''
  }

  // Compact samples per mood using hablar - now dynamic based on level
  const getModeSamples = (mood) => {
    // Get available tenses for the current level and mood
    const availableTenses = getAvailableTensesForLevelAndMood(settings.level, mood)
    
    // If no specific level, show all tenses for the mood
    if (!settings.level) {
      const allTenses = {
        'indicative': ['pres','pretIndef','impf','fut'],
        'subjunctive': ['subjPres','subjImpf'],
        'imperative': ['impAff','impNeg'],
        'conditional': ['cond'],
        'nonfinite': ['ger','part']
      }
      const tenses = allTenses[mood] || []
      return getSamplesFromTenses(mood, tenses)
    }
    
    // If we have a level, always show only the tenses available for that level
    // This applies whether it's 'mixed' or 'specific' practice mode
    return getSamplesFromTenses(mood, availableTenses)
  }
  
  // Helper function to get samples from a list of tenses
  const getSamplesFromTenses = (mood, tenses) => {
    // Define the order of learning for each mood (simple tenses first, no compound tenses)
    const learningOrder = {
      'indicative': ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf'],
      'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
      'imperative': ['impAff', 'impNeg'], // Exclude impMixed to avoid repetition
      'conditional': ['cond', 'condPerf'],
      'nonfinite': ['ger', 'part'] // Exclude nonfiniteMixed to avoid repetition
    }
    
    // Define which tenses are compound (should not appear in subtitles)
    const compoundTenses = ['pretPerf', 'plusc', 'futPerf', 'subjPerf', 'subjPlusc', 'condPerf']
    
    // Check if there are compound tenses available
    const hasCompoundTenses = tenses.some(t => compoundTenses.includes(t))
    
    // Filter out compound tenses and mixed forms for subtitles
    const simpleTenses = tenses.filter(t => {
      // Exclude compound tenses
      if (compoundTenses.includes(t)) return false
      // Exclude mixed forms for subtitles
      if (t.includes('Mixed')) return false
      return true
    })
    
    // Sort tenses according to learning order
    const sortedTenses = simpleTenses.sort((a, b) => {
      const order = learningOrder[mood] || []
      const aIndex = order.indexOf(a)
      const bIndex = order.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    
    const singleOf = (m, t) => {
      const s = getConjugationExample(m, t)
      if (!s) return ''
      // tomar solo la primera forma de cada tiempo (antes de la primera coma o slash)
      const parts = s.split(',').map(x=>x.trim())
      let pick = parts[0] || ''
      // Para imperativo ya tenemos la forma correcta según la variante en getConjugationExample
      // Solo tomamos la primera forma (2s) para el ejemplo
      if (m === 'imperative') {
        pick = parts[0] || ''
      }
      // si hubiera barras, tomar el primer segmento
      return pick.split('/')[0].trim()
    }
    
    const samples = sortedTenses.map(t => singleOf(mood, t)).filter(Boolean)
    const result = samples.join(' · ')
    
    // Add " · etc." if there are compound tenses available
    return hasCompoundTenses && result ? `${result} · etc.` : result
  }

  if (currentMode === 'onboarding') {
    return (
      <div className="App">
        <div className="onboarding">
                      <ClickableCard className="app-logo" onClick={handleHome} title="Ir al menú ¿Qué querés practicar?">
                        <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
                      </ClickableCard>
                      { showQuickSwitch || showChallenges || showAccentKeys || showGames ? closeTopPanelsAndFeatures() : null }
            
            {/* Step 1: Dialect Selection */}
            {onboardingStep === 1 && (
              <>
                <div className="options-grid dialect-selection">
                  <ClickableCard className="option-card" onClick={() => selectDialect('rioplatense')} title="Seleccionar dialecto rioplatense (vos)">
                    <h3><img src="/vos.png" alt="Vos" className="option-icon" /></h3>
                    <p>Argentina, Uruguay, etc.</p>
                    <p className="example">vos tenés, vos hablás</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectDialect('la_general')} title="Seleccionar dialecto latinoamericano general (tú)">
                    <h3><img src="/tu.png" alt="Tú" className="option-icon" /></h3>
                    <p>México, Perú, Cuba, etc.</p>
                    <p className="example">tú tienes, tú hablas</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectDialect('peninsular')} title="Seleccionar dialecto peninsular (tú y vosotros)">
                    <h3>
                      <img src="/tu.png" alt="Tú" className="option-icon" />
                      <img src="/vosotros.png" alt="Vosotros" className="option-icon" />
                    </h3>
                    <p>España, etc.</p>
                    <p className="example">tú tienes, vosotros tenéis</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectDialect('both')} title="Seleccionar todos los dialectos (tú, vos y vosotros)">
                    <h3>
                      <img src="/tu.png" alt="Tú" className="option-icon" />
                      <img src="/vos.png" alt="Vos" className="option-icon" />
                      <img src="/vosotros.png" alt="Vosotros" className="option-icon" />
                    </h3>
                    <p>México, Argentina, España, etc.</p>
                    <p className="example">tú tienes / vos tenés / vosotros tenéis</p>
                  </ClickableCard>
                </div>
              </>
            )}

            {/* Step 2: Level Selection or Specific Forms */}
            {onboardingStep === 2 && (
              <>
                <div className="options-grid menu-section">
                  <div className="option-card featured" onClick={() => setOnboardingStep(3)}>
                    <h3><img src="/books.png" alt="Libros" className="option-icon" /> Por nivel</h3>
                    <p className="example">A1, A2, B1, B2, C1, C2</p>
                  </div>
                  
                  <div className="option-card" onClick={() => {
                    // Formas específicas con inventario completo pero verbos progresivos (empezar con básicos)
                    settings.set({ practiceMode: 'specific', level: 'ALL', cameFromTema: true })
                    settings.set({
                      strict: true,
                      accentTolerance: 'warn',
                      requireDieresis: false,
                      blockNonNormativeSpelling: false,
                      cliticStrictness: 'low',
                      cliticsPercent: 0,
                      neutralizePronoun: false,
                      rotateSecondPerson: false,
                      timeMode: 'soft',
                      perItemMs: 6000,
                      medianTargetMs: 3000,
                      // Verbos básicos para empezar (progresión futura automática)
                      allowedLemmas: new Set([
                        'ser','estar','tener','haber','ir','ver','venir','poder','querer','hacer',
                        'decir','poner','dar','vivir','comer','hablar','saber','salir','llevar','pasar',
                        'deber','seguir','encontrar','llamar','trabajar','estudiar','comprar','vender',
                        'escribir','leer','abrir','cerrar','entrar','salir','empezar','terminar'
                      ])
                    })
                    setOnboardingStep(5)
                  }}>
                    <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Por tema</h3>
                    <p className="example">Presente, subjuntivo, imperativo, etc.</p>
                  </div>
                </div>
                
                <button onClick={goBack} className="back-btn">
                  <img src="/back.png" alt="Volver" className="back-icon" />
                </button>
              </>
            )}

            {/* Step 3: Level Selection */}
            {onboardingStep === 3 && (
              <>
                <div className="options-grid">
                  <ClickableCard className="option-card" onClick={() => selectLevel('A1')} title="Seleccionar nivel A1 - Principiante">
                    <h3><img src="/a1.png" alt="A1" className="option-icon" /> Principiante</h3>
                    <p>Te presentás, describís personas y rutinas, pedís y das datos básicos.</p>
                    <p className="example">Indicativo: Presente</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectLevel('A2')} title="Seleccionar nivel A2 - Elemental">
                    <h3><img src="/a2.png" alt="A2" className="option-icon" /> Elemental</h3>
                    <p>Contás experiencias y planes, seguís instrucciones y resolvés gestiones simples.</p>
                    <p className="example">Indicativo: Pretéritos, Futuro | Imperativo: Afirmativo</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectLevel('B1')} title="Seleccionar nivel B1 - Intermedio">
                    <h3><img src="/B1.png" alt="B1" className="option-icon" /> Intermedio</h3>
                    <p>Narrás con orden, comparás pasados, explicás causas y fundamentás opiniones.</p>
                    <p className="example">Pluscuamperfecto, Futuro compuesto, Subjuntivo presente, Condicional</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectLevel('B2')} title="Seleccionar nivel B2 - Intermedio alto">
                    <h3><img src="/b2.png" alt="B2" className="option-icon" /> Intermedio alto</h3>
                    <p>Argumentás con matices, manejás hipótesis y concesiones, pedís y das aclaraciones complejas.</p>
                    <p className="example">Subjuntivo imperfecto/pluscuamperfecto, Condicional compuesto</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectLevel('C1')} title="Seleccionar nivel C1 - Avanzado">
                    <h3><img src="/c1.png" alt="C1" className="option-icon" /> Avanzado</h3>
                    <p>Producís discursos precisos y cohesionados, adaptás registro y reformulás con naturalidad.</p>
                    <p className="example">Todas las formas verbales</p>
                  </ClickableCard>
                  
                  <ClickableCard className="option-card" onClick={() => selectLevel('C2')} title="Seleccionar nivel C2 - Superior">
                    <h3><img src="/c2.png" alt="C2" className="option-icon" /> Superior</h3>
                    <p>Usás recursos idiomáticos y tonos variados con dominio casi nativo.</p>
                    <p className="example">Todas las formas verbales</p>
                  </ClickableCard>
                </div>
                
                <button onClick={goBack} className="back-btn">
                  <img src="/back.png" alt="Volver" className="back-icon" />
                </button>
              </>
            )}

            {/* Step 4: Practice Mode Selection (after level selection) or Mood Selection (from main menu) */}
            {onboardingStep === 4 && (
              <>
                {(() => {
                  if (settings.level) {
                    // Coming from level selection - show practice mode
                    return (
                      <>
                        <div className="options-grid">
                          <div className="option-card" onClick={() => selectPracticeMode('mixed')}>
                            <h3><img src="/dice.png" alt="Dado" className="option-icon" /> Práctica Mixta</h3>
                            <p>Mezclá todos los tiempos y modos de tu nivel</p>
                            <p className="example">Variedad completa para práctica general</p>
                          </div>
                          
                                                <div className="option-card" onClick={() => {
                        settings.set({ practiceMode: 'specific' })
                        // Don't change level if it's already set from previous selection
                        setOnboardingStep(5)
                      }}>
                        <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Formas Específicas</h3>
                        <p>Enfocate en un tiempo/modo específico de tu nivel</p>
                        <p className="example">Ideal para dominar formas particulares</p>
                      </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
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
                {(() => {
                  if (settings.level && settings.practiceMode === 'mixed') {
                    // Mixed practice from level - go directly to verb type selection
                    return (
                      <>
                        <div className="options-grid">
                          <ClickableCard className="option-card" onClick={() => selectVerbType('all')} title="Seleccionar todos los tipos de verbos">
                            <h3><img src="/books.png" alt="Libros" className="option-icon" /> Todos los Verbos</h3>
                            <p>Regulares e irregulares</p>
                            <p className="example">Práctica completa</p>
                          </ClickableCard>
                          
                          <ClickableCard className="option-card" onClick={() => selectVerbType('regular')} title="Seleccionar solo verbos regulares">
                            <h3><img src="/openbook.png" alt="Libro Abierto" className="option-icon" /> Verbos Regulares</h3>
                            <p>Solo verbos que siguen las reglas</p>
                            <p className="example">hablar, comer, vivir</p>
                          </ClickableCard>
                          
                          <ClickableCard className="option-card" onClick={() => selectVerbType('irregular')} title="Seleccionar solo verbos irregulares">
                            <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Verbos Irregulares</h3>
                            <p>Solo verbos con cambios especiales</p>
                            <p className="example">ser, estar, tener, ir</p>
                          </ClickableCard>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
                        </button>
                      </>
                    )
                  } else if (settings.level && settings.practiceMode === 'specific') {
                    // Specific practice from level - show filtered moods
                    const availableMoods = getAvailableMoodsForLevel(settings.level)
                    return (
                      <>
                        <div className="options-grid">
                          {availableMoods.map(mood => (
                            <div key={mood} className="option-card compact" onClick={() => selectMood(mood)}>
                              <h3>{getMoodLabel(mood)}</h3>
                              <p className="conjugation-example">{getModeSamples(mood)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
                        </button>
                      </>
                    )
                  } else if (!settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
                    // Coming from main menu - show tense selection
                    return (
                      <>
                        <div className="options-grid">
                          {getTensesForMood(settings.specificMood).map(tense => (
                            <div key={tense} className="option-card compact" onClick={() => selectTense(tense)}>
                              <h3>{getTenseLabel(tense)}</h3>
                              <p className="conjugation-example">{getConjugationExample(settings.specificMood, tense)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
                        </button>
                      </>
                    )
                  } else if (!settings.level && settings.practiceMode === 'specific') {
                    // Coming from forms specific without level - show mood selection
                    return (
                      <>
                        <div className="options-grid">
                          <div className="option-card compact" onClick={() => selectMood('indicative')}>
                            <h3>Indicativo</h3>
                            <p className="conjugation-example">{getModeSamples('indicative')}</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectMood('subjunctive')}>
                            <h3>Subjuntivo</h3>
                            <p className="conjugation-example">{getModeSamples('subjunctive')}</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectMood('imperative')}>
                            <h3>Imperativo</h3>
                            <p className="conjugation-example">{getModeSamples('imperative')}</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectMood('conditional')}>
                            <h3>Condicional</h3>
                            <p className="conjugation-example">{getModeSamples('conditional')}</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectMood('nonfinite')}>
                            <h3>Formas no conjugadas</h3>
                            <p className="conjugation-example">{getModeSamples('nonfinite')}</p>
                          </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
                        </button>
                      </>
                    )
                  } else {
                    return null
                  }
                })()}
              </>
            )}

            {/* Step 6: Family Selection (when irregular verbs are chosen from mixed practice) OR Tense Selection */}
            {onboardingStep === 6 && (
              <>
                {(() => {
                  if (settings.verbType === 'irregular' && settings.level && settings.practiceMode === 'mixed') {
                    // Show family selection for irregular verbs from mixed practice
                    return (
                      <>
                        <div className="options-grid">
                          {/* All irregulars option */}
                          <div className="option-card featured" onClick={() => selectFamily(null)}>
                            <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
                            <p>Todas las familias juntas</p>
                            <p className="example">Máxima variedad</p>
                          </div>

                          {/* Show simplified groups for mixed practice */}
                          <div className="option-card compact" onClick={() => selectFamily('STEM_CHANGES')}>
                            <h3>Verbos que Diptongan</h3>
                            <p className="hint">Cambios de raíz: e→ie, o→ue, e→i</p>
                            <p className="conjugation-example">pensar→pienso, volver→vuelvo, pedir→pido</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectFamily('FIRST_PERSON_IRREGULAR')}>
                            <h3>Irregulares en YO</h3>
                            <p className="hint">1ª persona irregular que afecta el subjuntivo</p>
                            <p className="conjugation-example">tengo, conozco, salgo, protejo</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectFamily('PRET_UV')}>
                            <h3>Pretérito -uv-</h3>
                            <p className="conjugation-example">andar, estar, tener</p>
                          </div>
                          
                          <div className="option-card compact" onClick={() => selectFamily('PRET_J')}>
                            <h3>Pretérito -j-</h3>
                            <p className="conjugation-example">decir, traer</p>
                          </div>
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
                        </button>
                      </>
                    )
                  } else if (settings.level) {
                    // Coming from level selection - show filtered tenses
                    return (
                      <>
                        <div className="options-grid">
                          {getAvailableTensesForLevelAndMood(settings.level, settings.specificMood).map(tense => (
                            <div key={tense} className="option-card compact" onClick={() => selectTense(tense)}>
                              <h3>{getTenseLabel(tense)}</h3>
                              <p className="conjugation-example">{getConjugationExample(settings.specificMood, tense)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <button onClick={goBack} className="back-btn">
                          <img src="/back.png" alt="Volver" className="back-icon" />
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
                <div className="options-grid">
                  <div className="option-card" onClick={() => selectVerbType('all')}>
                    <h3><img src="/books.png" alt="Libros" className="option-icon" /> Todos los Verbos</h3>
                    <p>Regulares e irregulares</p>
                    <p className="example">Práctica completa</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectVerbType('regular')}>
                    <h3><img src="/openbook.png" alt="Libro Abierto" className="option-icon" /> Verbos Regulares</h3>
                    <p>Solo verbos que siguen las reglas</p>
                    <p className="example">hablar, comer, vivir</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectVerbType('irregular')}>
                    <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Verbos Irregulares</h3>
                    <p>Solo verbos con cambios especiales</p>
                    <p className="example">ser, estar, tener, ir</p>
                  </div>
                </div>
                
                <button onClick={goBack} className="back-btn">
                  <img src="/back.png" alt="Volver" className="back-icon" />
                </button>
              </>
            )}

            {/* Step 8: Family Selection (when irregular verbs are chosen) */}
            {onboardingStep === 8 && settings.verbType === 'irregular' && (
              <>
                <div className="options-grid">
                  {/* All irregulars option */}
                  <div className="option-card featured" onClick={() => selectFamily(null)}>
                    <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
                    <p>Todas las familias juntas</p>
                    <p className="example">Máxima variedad</p>
                  </div>

                  {/* Show simplified groups for present tenses, full families for others */}
                  {(() => {
                    const mood = settings.specificMood
                    const tense = settings.specificTense
                    
                    // Use simplified grouping for supported tenses (present, preterite)
                    if (tense && shouldUseSimplifiedGrouping(tense)) {
                      const simplifiedGroups = getSimplifiedGroupsForTense(tense)
                      return simplifiedGroups.map(group => (
                        <div key={group.id} className="option-card compact" onClick={() => selectFamily(group.id)}>
                          <h3>{group.name}</h3>
                          <p className="hint">{group.explanation}</p>
                          <p className="conjugation-example">{group.description}</p>
                        </div>
                      ))
                    } else if (mood && shouldUseSimplifiedGroupingForMood(mood) && !tense) {
                      // For mood selection without specific tense, show all relevant groups
                      const simplifiedGroups = getSimplifiedGroupsForMood(mood)
                      return simplifiedGroups.map(group => (
                        <div key={group.id} className="option-card compact" onClick={() => selectFamily(group.id)}>
                          <h3>{group.name}</h3>
                          <p className="hint">{group.explanation}</p>
                          <p className="conjugation-example">{group.description}</p>
                        </div>
                      ))
                    } else {
                      // Use families for specific tense, or fallback to mood families
                      const availableFamilies = tense
                        ? getFamiliesForTense(tense)
                        : mood
                        ? getFamiliesForMood(mood)
                        : Object.values({
                            'G_VERBS': { id: 'G_VERBS', name: 'Irregulares en YO', description: 'tener, poner, salir, conocer, vencer' },
                            'UIR_Y': { id: 'UIR_Y', name: '-uir (inserción y)', description: 'construir, huir' },
                            'PRET_UV': { id: 'PRET_UV', name: 'Pretérito -uv-', description: 'andar, estar, tener' },
                            'PRET_U': { id: 'PRET_U', name: 'Pretérito -u-', description: 'poder, poner, saber' },
                            'PRET_J': { id: 'PRET_J', name: 'Pretérito -j-', description: 'decir, traer' }
                          })
                      
                      return availableFamilies.slice(0, 8).map(family => (
                        <div key={family.id} className="option-card compact" onClick={() => selectFamily(family.id)}>
                          <h3>{family.name}</h3>
                          <p className="conjugation-example">{family.description}</p>
                        </div>
                      ))
                    }
                  })()}
                </div>
                
                <button onClick={goBack} className="back-btn">
                  <img src="/back.png" alt="Volver" className="back-icon" />
                </button>
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
          <div className="icon-row">
          <button 
            onClick={() => {
                if (showQuickSwitch) {
                  setShowQuickSwitch(false)
                } else {
                  setShowQuickSwitch(true)
                  setShowChallenges(false)
                  setShowGames(false)
                }
              }}
              className="icon-btn"
              title="Cambiar rápido"
            >
              <img src="/config.png" alt="Config" className="menu-icon" />
            </button>
            <button
              onClick={() => {
                if (showChallenges) {
                  setShowChallenges(false)
                } else {
                  setShowChallenges(true)
                  setShowQuickSwitch(false)
                  setShowGames(false)
                }
              }}
              className="icon-btn"
              title="Cronometría"
            >
              <img src="/crono.png" alt="Cronometría" className="menu-icon" />
            </button>
            <button
              onClick={() => setShowAccentKeys(prev => !prev)}
              className="icon-btn"
              title="Tildes"
            >
              <img src={enieIcon} alt="Tildes" className="menu-icon" />
            </button>
            <button
              onClick={() => {
                if (showGames) {
                  setShowGames(false)
                } else {
                  setShowGames(true)
                  setShowQuickSwitch(false)
                  setShowChallenges(false)
                }
              }}
              className="icon-btn"
              title="Juegos"
            >
              <img src="/dice.png" alt="Juegos" className="menu-icon" />
            </button>
            <button 
              onClick={handleHome}
              className="icon-btn"
              title="Menú"
          >
            <img src="/home.png" alt="Menú" className="menu-icon" />
          </button>
          </div>
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
                  onChange={(e) => {
                    selectDialect(e.target.value)
                    // Clear history when changing dialect
                    setHistory({})
                    setCurrentItem(null)
                    generateNextItem()
                  }}
                  className="setting-select"
                >
                  <option value="rioplatense">Español Rioplatense</option>
                  <option value="la_general">Latinoamérica</option>
                  <option value="peninsular">Español Peninsular</option>
                  <option value="both">Todas las Formas</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Nivel MCER:</label>
                <select 
                  value={settings.level}
                  onChange={(e) => {
                    // Apply full level policy (median target, timing, orth, etc.)
                    selectLevel(e.target.value)
                    // Clear history when changing level (handled in selectLevel flow)
                    setHistory({})
                    setCurrentItem(null)
                    generateNextItem()
                  }}
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
                    // Clear history when changing practice mode
                    setHistory({})
                    setCurrentItem(null)
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
                    // Clear history when changing pronoun practice
                    setHistory({})
                    setCurrentItem(null)
                    generateNextItem()
                  }}
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
                        <input type="checkbox" checked={settings.enableFuturoSubjRead} onChange={(e)=>settings.set({ enableFuturoSubjRead: e.target.checked })} /> Lectura C1/C2
                      </label>
                      <label>
                        <input type="checkbox" checked={settings.enableFuturoSubjProd} onChange={(e)=>settings.set({ enableFuturoSubjProd: e.target.checked })} /> Producción C2
                      </label>
                    </div>
                  </div>
                  {settings.level === 'C2' && (
                    <div className="setting-group">
                      <label>Conmutación (C2):</label>
                      <div className="radio-group">
                        <label>
                          <input type="checkbox" checked={settings.enableC2Conmutacion} onChange={(e)=>settings.set({ enableC2Conmutacion: e.target.checked })} /> Alternar tratamiento por ítem
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
                  onChange={(e) => {
                    settings.set({ 
                      verbType: e.target.value,
                      selectedFamily: e.target.value !== 'irregular' ? null : settings.selectedFamily
                    })
                    // Clear history when changing verb type
                    setHistory({})
                    setCurrentItem(null)
                    generateNextItem()
                  }}
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
                    onChange={(e) => {
                      settings.set({ selectedFamily: e.target.value || null })
                      // Clear history when changing family
                      setHistory({})
                      setCurrentItem(null)
                      generateNextItem()
                    }}
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
                    onBlur={(e)=>{
                      const list = e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                      settings.set({ c2RareBoostLemmas: list })
                    }}
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
                      <option value="">Seleccioná modo...</option>
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
                        <option value="">Seleccioná tiempo...</option>
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
                          // Initialize block for A1/A2: one tense per tanda
                          const lvl = settings.level
                          if (lvl === 'A1' || lvl === 'A2') {
                            settings.set({
                              currentBlock: {
                                combos: [{ mood: settings.specificMood, tense: settings.specificTense }],
                                itemsRemaining: 8
                              }
                            })
                          } else {
                            settings.set({ currentBlock: null })
                          }
                          generateNextItem()
                          setShowSettings(false)
                        }}
                      >
                        <img src="/diana.png" alt="Diana" className="option-icon" /> Comenzar Práctica Específica
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

        {showQuickSwitch && (
          <div className="quick-switch-panel">
            <div className="setting-group">
              <label>Modo verbal:</label>
              <select
                className="setting-select"
                value={settings.specificMood || ''}
                onChange={(e) => {
                  const mood = e.target.value || null
                  settings.set({ specificMood: mood, specificTense: null })
                }}
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
                  onChange={(e) => settings.set({ specificTense: e.target.value || null })}
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
                onChange={(e) => settings.set({ verbType: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="regular">Regulares</option>
                <option value="irregular">Irregulares</option>
              </select>
            </div>

            <div className="setting-group">
              <button
                className="btn"
                onClick={() => {
                  // Set practice mode to specific when using quick switch
                  if (settings.specificMood || settings.specificTense) {
                    settings.set({ practiceMode: 'specific' })
                  }
                  // regenerate with new filters
                  setCurrentItem(null)
                  generateNextItem()
                  setShowQuickSwitch(false)
                }}
              >
                Aplicar
              </button>
              <button className="btn btn-secondary" onClick={() => setShowQuickSwitch(false)}>Cerrar</button>
            </div>
            </div>
        )}

        {showGames && (
          <div className="games-panel quick-switch-panel" aria-label="Juegos">
            <div className="options-grid">
              <div className="option-card compact" onClick={() => {
                // Toggle Resistance mode
                const s = useSettings.getState()
                if (s.resistanceActive) {
                  // Deactivate
                  settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
                } else {
                  const level = s.level || 'A1'
                  // Supervivencia: A1 20s, A2 18s, B1 18s, B2 17s, C1 16s, C2 15s
                  const baseMs = level==='C2'?15000: level==='C1'?16000: level==='B2'?17000: level==='B1'?18000: level==='A2'?18000:20000
                  settings.set({ resistanceActive: true, resistanceMsLeft: baseMs, resistanceStartTs: Date.now() })
                }
                setShowGames(false)
              }} aria-label="Survivor">
                <img src="/zombie.png" alt="Survivor" className="game-icon" />
                <p className="conjugation-example">Modo supervivencia</p>
              </div>
              <div className="option-card compact" onClick={() => {
                // Toggle reverse mode
                const active = !!useSettings.getState().reverseActive
                settings.set({ reverseActive: !active, doubleActive: false })
                setShowGames(false)
                
                // CRÍTICO: Si se activa el modo reverso, regenerar inmediatamente
                if (!active) {
                  setTimeout(() => {
                    generateNextItem()
                  }, 100)
                }
              }} aria-label="Reverso">
                <img src="/sobrev.png" alt="Reverso" className="game-icon" />
                <p className="conjugation-example">Invertí la consigna</p>
              </div>
              <div className="option-card compact" onClick={() => {
                // Toggle double mode
                const active = !!useSettings.getState().doubleActive
                settings.set({ doubleActive: !active, reverseActive: false })
                setShowGames(false)
                
                // CRÍTICO: Si se activa el modo doble, regenerar inmediatamente
                if (!active) {
                  setTimeout(() => {
                    generateNextItem()
                  }, 100)
                }
              }} aria-label="Dos juntos dos">
                <img src="/verbosverbos.png" alt="De a dos" className="game-icon" />
                <p className="conjugation-example">Dos juntos dos</p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowGames(false)}>Cerrar</button>
            </div>
            </div>
        )}

        <main className="main-content">
          {currentItem ? (
            <Drill 
              currentItem={currentItem}
              onResult={handleDrillResult}
              onContinue={handleContinue}
              showChallenges={showChallenges}
              showAccentKeys={showAccentKeys}
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