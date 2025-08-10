import { useState, useEffect, useMemo, useRef } from 'react'
import { useSettings } from './state/settings.js'
import { verbs } from './data/verbs.js'
import { chooseNext } from './lib/generator.js'
import { getTensesForMood, getTenseLabel, getMoodLabel } from './lib/verbLabels.js'
import gates from './data/curriculum.json'
import Drill from './features/drill/Drill.jsx'

import './App.css'
import configIcon from '../config.png'
import enieIcon from '../enie.png'
// Debug logging flag for this component
const APP_DEBUG = false
const dlog = (...args) => { if (APP_DEBUG) console.log(...args) }

function App() {
  dlog('Curriculum gates imported:', gates)
  dlog('Total gates:', gates.length)
  dlog('Sample gates:', gates.slice(0, 5))
  
  // Test verb availability on app load
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('./lib/devDiagnostics.js').then(m => m.runDevDiagnostics()).catch(()=>{})
    }
    // Ensure Resistance mode is off on app load
    settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
  }, [])
  
  const [currentMode, setCurrentMode] = useState('onboarding') // 'onboarding', 'drill', 'settings'
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: dialect, 2: level, 3: practice mode, 4: mood/tense, 5: verb type
  const settings = useSettings()
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const handlingPopRef = useRef(false)
  const lastPushedRef = useRef({ mode: null, step: null })
  
  // Cierra todos los paneles superiores y desactiva funciones auxiliares
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
    dlog(`Cached ${acc.length} forms for region ${settings.region}`)
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

  const generateNextItem = () => {
    const nextForm = chooseNext({ forms: allFormsForRegion, history })
    
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
                      console.log('✅ Double mode - VERIFIED same verb with distinct combinations:')
                      console.log('  Verb:', firstForm.lemma)
                      console.log('  First:', firstForm.mood, firstForm.tense)
                      console.log('  Second:', secondForm.mood, secondForm.tense)
                      
                      // Actualizar el item principal
                      newItem.lemma = firstForm.lemma
                      newItem.mood = firstForm.mood
                      newItem.tense = firstForm.tense
                      newItem.person = firstForm.person
                      newItem.form = { ...firstForm }
                      
                      // Agregar la segunda forma
                      newItem.secondForm = { ...secondForm }
                    } else {
                      console.log('❌ CRITICAL ERROR: Forms are not from same verb or have same combo!')
                      console.log('First form:', firstForm)
                      console.log('Second form:', secondForm)
                      
                      // FALLBACK DE EMERGENCIA: buscar otro verbo válido
                      const fallbackVerb = validVerbs.find(v => v.lemma !== selectedVerb.lemma)
                      if (fallbackVerb) {
                        console.log('🚨 Using fallback verb:', fallbackVerb.lemma)
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
      console.error('❌ No valid form found! This might indicate a bug in the generator or insufficient verbs.')
      dlog('Current settings:', settings)
      dlog('Available forms count:', allFormsForRegion.length)
      
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
    generateNextItem()
  }

  const startPractice = () => {
    // Clear history when starting new practice
    setHistory({})
    setCurrentItem(null)
    // Cerrar paneles y desactivar funciones auxiliares
    closeTopPanelsAndFeatures()
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
      // Core frequent lemmas for A1
      updates.allowedLemmas = new Set(['ser','estar','tener','haber','ir','venir','poder','querer','hacer','decir','poner','dar','vivir','comer','hablar'])
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
      updates.allowedLemmas = null // allow broader set
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
      updates.allowedLemmas = null
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
      updates.allowedLemmas = null
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
      updates.allowedLemmas = null
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
      updates.allowedLemmas = null
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
    console.log('selectMood called with:', mood)
    console.log('Current settings:', settings)
    settings.set({ specificMood: mood })
    console.log('After setting specificMood:', settings)
    
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
    const updates = { verbType }
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

  // Function to go back in the onboarding flow
  const goBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1)
    }
  }

  const handleBack = () => {
    // Go back to settings
    setShowSettings(true)
  }

  const handleHome = () => {
    // Go to main menu: "¿Qué querés practicar?" (step 2)
    setCurrentMode('onboarding')
    setOnboardingStep(2)
    setCurrentItem(null)
    setHistory({})
    setShowSettings(false)
    // Cerrar paneles y desactivar funciones auxiliares
    closeTopPanelsAndFeatures()
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
      
      // Imperativo
      'imperative_impAff': 'habla, hable, hablen',
      'imperative_impNeg': 'no hables, no hable, no hablen',
      'imperative_impMixed': 'habla / no hables, hable / no hable',
      
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

  // Compact samples per mood using hablar
  const getModeSamples = (mood) => {
    const picks = {
      indicative: ['pres','pretIndef','impf','fut'],
      subjunctive: ['subjPres','subjImpf'],
      imperative: ['impAff','impNeg'],
      conditional: ['cond'],
      nonfinite: ['ger','part']
    }
    const tenses = picks[mood] || []
    const singleOf = (m, t) => {
      const s = getConjugationExample(m, t)
      if (!s) return ''
      // tomar solo la primera forma de cada tiempo (antes de la primera coma o slash)
      const parts = s.split(',').map(x=>x.trim())
      let pick = parts[0] || ''
      // Para imperativo queremos la forma de usted: segunda entrada (hable / no hable)
      if (m === 'imperative') {
        pick = (parts[1] || parts[0] || '').trim()
      }
      // si hubiera barras, tomar el primer segmento
      return pick.split('/')[0].trim()
    }
    return tenses.map(t => singleOf(mood, t)).filter(Boolean).join(' · ')
  }

  if (currentMode === 'onboarding') {
    return (
      <div className="App">
        <div className="onboarding">
                      <div className="app-logo" onClick={handleHome} title="Ir al menú ¿Qué querés practicar?">
                        <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
                      </div>
                      { /* Garantizar que al entrar al menú todo esté cerrado */ }
                      { showQuickSwitch || showChallenges || showAccentKeys || showGames ? closeTopPanelsAndFeatures() : null }
            
            {/* Step 1: Dialect Selection */}
            {onboardingStep === 1 && (
              <>
                <div className="options-grid">
                  <div className="option-card" onClick={() => selectDialect('rioplatense')}>
                    <h3>Español Rioplatense</h3>
                    <p>Argentina, Uruguay</p>
                    <p className="example">vos tenés, vos hablás</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('la_general')}>
                    <h3>Latinoamérica</h3>
                    <p>México, Perú, Cuba, etc.</p>
                    <p className="example">tú tienes, tú hablas</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('peninsular')}>
                    <h3>Español Peninsular</h3>
                    <p>España</p>
                    <p className="example">tú tienes, vosotros tenéis</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectDialect('both')}>
                    <h3>Todas las Formas</h3>
                    <p>Tú, vos, y vosotros</p>
                    <p className="example">tú tienes / vos tenés / vosotros tenéis</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Level Selection or Specific Forms */}
            {onboardingStep === 2 && (
              <>
                <h2>¿Qué querés practicar?</h2>
                <p>Elegí tu nivel o trabajá formas específicas:</p>
                
                <div className="options-grid menu-section">
                  <div className="option-card featured" onClick={() => setOnboardingStep(3)}>
                    <h3><img src="/books.png" alt="Libros" className="option-icon" /> Por nivel</h3>
                    <p>Practicá según tu nivel de español</p>
                    <p className="example">A1, A2, B1, B2, C1, C2</p>
                  </div>
                  
                  {/* Comentado temporalmente - nivel Libre
                  <div className="option-card" onClick={() => {
                    // Formas específicas con inventario completo pero dificultad media
                    settings.set({ practiceMode: 'specific', level: 'ALL' })
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
                      allowedLemmas: null
                    })
                    setOnboardingStep(5)
                  }}>
                    <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Por tema</h3>
                    <p>Elegí un tiempo o modo específico</p>
                    <p className="example">Presente, subjuntivo, imperativo, etc.</p>
                  </div>
                  */}
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
                  <div className="option-card" onClick={() => selectLevel('A1')}>
                    <h3>A1 - Principiante</h3>
                    <p>Te presentás, describís personas y rutinas, pedís y das datos básicos.</p>
                    <p className="example">Indicativo: Presente</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('A2')}>
                    <h3>A2 - Elemental</h3>
                    <p>Contás experiencias y planes, seguís instrucciones y resolvés gestiones simples.</p>
                    <p className="example">Indicativo: Pretéritos, Futuro | Imperativo: Afirmativo</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('B1')}>
                    <h3>B1 - Intermedio</h3>
                    <p>Narrás con orden, comparás pasados, explicás causas y fundamentás opiniones.</p>
                    <p className="example">Pluscuamperfecto, Futuro compuesto, Subjuntivo presente, Condicional</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('B2')}>
                    <h3>B2 - Intermedio alto</h3>
                    <p>Argumentás con matices, manejás hipótesis y concesiones, pedís y das aclaraciones complejas.</p>
                    <p className="example">Subjuntivo imperfecto/pluscuamperfecto, Condicional compuesto</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('C1')}>
                    <h3>C1 - Avanzado</h3>
                    <p>Producís discursos precisos y cohesionados, adaptás registro y reformulás con naturalidad.</p>
                    <p className="example">Todas las formas verbales</p>
                  </div>
                  
                  <div className="option-card" onClick={() => selectLevel('C2')}>
                    <h3>C2 - Superior</h3>
                    <p>Usás recursos idiomáticos y tonos variados con dominio casi nativo.</p>
                    <p className="example">Todas las formas verbales</p>
                  </div>
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
                  console.log('Step 4 - Current settings:', {
                    level: settings.level,
                    practiceMode: settings.practiceMode
                  })
                  
                  if (settings.level) {
                    // Coming from level selection - show practice mode
                    return (
                      <>
                        <h2>¿Cómo querés practicar?</h2>
                        <p>Elegí el tipo de práctica para tu nivel {settings.level}:</p>
                        
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
                  console.log('Step 5 - Current settings:', {
                    level: settings.level,
                    practiceMode: settings.practiceMode,
                    specificMood: settings.specificMood
                  })
                  
                  if (settings.level && settings.practiceMode === 'mixed') {
                    // Mixed practice from level - go directly to verb type selection
                    return (
                      <>
                        <h2>Seleccioná el tipo de verbos:</h2>
                        <p>Práctica mixta para nivel {settings.level}:</p>
                        
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
                    )
                  } else if (settings.level && settings.practiceMode === 'specific') {
                    // Specific practice from level - show filtered moods
                    console.log('=== STEP 5 DEBUG ===')
                    console.log('Settings:', { level: settings.level, practiceMode: settings.practiceMode })
                    const availableMoods = getAvailableMoodsForLevel(settings.level)
                    console.log('Available moods for level', settings.level, ':', availableMoods)
                    return (
                      <>
                        <h2>Seleccioná el modo verbal:</h2>
                        {settings.level === 'C2' || settings.level === 'ALL' ? (
                          <p>Modos disponibles (todas las formas):</p>
                        ) : (
                          <p>Modos disponibles para nivel {settings.level}:</p>
                        )}
                        
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
                    console.log('Showing tense selection for mood:', settings.specificMood)
                    return (
                      <>
                        <h2>Seleccioná el tiempo verbal:</h2>
                        
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
                    console.log('Showing mood selection for forms specific without level')
                    return (
                      <>
                        <h2>Seleccioná el modo verbal:</h2>
                        
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
                    console.log('No condition matched in step 5')
                    return null
                  }
                })()}
              </>
            )}

            {/* Step 6: Tense Selection (for specific practice from level) or Verb Type Selection */}
            {onboardingStep === 6 && (
              <>
                {(() => {
                  if (settings.level) {
                    // Coming from level selection - show filtered tenses
                    return (
                      <>
                        <h2>Seleccioná el tiempo verbal:</h2>
                        {settings.level === 'C2' || settings.level === 'ALL' ? (
                          <p>Tiempos disponibles para {getMoodLabel(settings.specificMood)} (todas las formas):</p>
                        ) : (
                          <p>Tiempos disponibles para {getMoodLabel(settings.specificMood)} en nivel {settings.level}:</p>
                        )}
                        
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
                <h2>Seleccioná el tipo de verbos:</h2>
                
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
              <img src={configIcon} alt="Config" className="menu-icon" />
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
                    settings.set({ verbType: e.target.value })
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
                  // Supervivencia: A1 35s, A2 30s, B1 25s, B2 20s, C1 18s, C2 16s
                  const baseMs = level==='C2'?16000: level==='C1'?18000: level==='B2'?20000: level==='B1'?25000: level==='A2'?30000:35000
                  settings.set({ resistanceActive: true, resistanceMsLeft: baseMs, resistanceStartTs: Date.now() })
                }
                setShowGames(false)
              }} aria-label="Survivor">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/zombie.png" alt="Survivor" className="game-icon" />
                  <p className="conjugation-example" style={{ margin: 0 }}>Modo supervivencia</p>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/sobrev.png" alt="Reverso" className="game-icon" />
                  <p className="conjugation-example" style={{ margin: 0 }}>Invertí la consigna</p>
                </div>
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
              }} aria-label="Conjugá dos juntos">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/verbosverbos.png" alt="De a dos" className="game-icon" />
                  <p className="conjugation-example" style={{ margin: 0 }}>Conjugá dos juntos</p>
                </div>
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