import { useState, useEffect, useRef } from 'react'
import { grade } from '../../lib/core/grader.js'
import { getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'
import { useSettings } from '../../state/settings.js'
import { useProgressTracking } from './useProgressTracking.js'
import { ProgressTrackingWrapper } from './ProgressTrackingWrapper.jsx'


export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue,
  showChallenges = false,
  showAccentKeys = true
}) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hint, setHint] = useState('')
  const [microMode, setMicroMode] = useState(null) // 'time' | 'cards' | null
  const [timeLeft, setTimeLeft] = useState(60)
  const [cardsTarget, setCardsTarget] = useState(10)
  const [cardsDone, setCardsDone] = useState(0)
  const [localCorrect, setLocalCorrect] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [errorsCount, setErrorsCount] = useState(0)
  const [latencies, setLatencies] = useState([])
  const [itemStart, setItemStart] = useState(Date.now())
  const [shakeStreak, setShakeStreak] = useState(false)
  const [secondInput, setSecondInput] = useState('')
  const [clockClickFeedback, setClockClickFeedback] = useState(false)
  const [showExplosion, setShowExplosion] = useState(false)
  const [urgentTick, setUrgentTick] = useState(false)

  const inputRef = useRef(null)
  const firstRef = useRef(null)
  const secondRef = useRef(null)
  const touchStart = useRef({ x: 0, y: 0 })
  const settings = useSettings()
  const [resistTick, setResistTick] = useState(0)
  
  // Hook para tracking de progreso
  const { handleResult, handleHintShown } = useProgressTracking(currentItem, onResult)

  // Reset input when currentItem changes
  useEffect(() => {
    setInput('')
    setSecondInput('')
    // IMPORTANTE: NO resetear el resultado aquí
    setHint('')
    setItemStart(Date.now())
    
    // Focus the input when a new item is loaded
    if (!result) {
      if (settings.doubleActive && firstRef.current) firstRef.current.focus()
      else if (inputRef.current) inputRef.current.focus()
    }
  }, [currentItem?.id, result])

  // Resistance countdown
  useEffect(() => {
    if (!settings.resistanceActive) return
    if (settings.resistanceMsLeft <= 0) return
    const id = setInterval(() => {
      const left = Math.max(0, useSettings.getState().resistanceMsLeft - 100)
      settings.set({ resistanceMsLeft: left })
      setResistTick(t=>t+1)
      
      // Vibración ligera en modo urgente (últimos 5 segundos)
      if (left <= 5000 && left > 0) {
        setUrgentTick(true)
        setTimeout(() => setUrgentTick(false), 150)
      }
      
      if (left === 0) {
        // Activar animación de explosión
        setShowExplosion(true)
        
        // Mantener la explosión visible por 2 segundos
        setTimeout(() => {
          setShowExplosion(false)
          // update best by level
          const lvl = settings.level || 'A1'
          const best = useSettings.getState().resistanceBestMsByLevel || {}
          const survived = (Date.now() - (useSettings.getState().resistanceStartTs||Date.now()))
          if (!best[lvl] || survived > best[lvl]) {
            best[lvl] = survived
            settings.set({ resistanceBestMsByLevel: { ...best } })
          }
          settings.set({ resistanceActive: false })
        }, 2000)
      }
    }, 100)
    return () => clearInterval(id)
  }, [settings.resistanceActive, settings.resistanceMsLeft])

  // Add 5 seconds when countdown is activated
  useEffect(() => {
    if (settings.resistanceActive && settings.resistanceMsLeft > 0) {
      // Add 5 seconds (5000ms) to the countdown
      const currentMs = settings.resistanceMsLeft
      settings.set({ resistanceMsLeft: currentMs + 5000 })
    }
  }, [settings.resistanceActive])

  

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Debug only for problematic cases
      // console.log('🔍 DRILL DEBUG - Grading attempt:', {input: input.trim(), form: currentItem.form})
      
      const gradeResult = grade(input.trim(), currentItem.form, currentItem.settings || {})
      
      // Clasificar errores para tracking
      let errorTags = []
      if (!gradeResult.correct && !gradeResult.isAccentError) {
        // Importar classifyError localmente para evitar problemas de dependencias
        // En una implementación completa, esto se haría de manera más robusta
        errorTags = ['error_general'] // Placeholder hasta que se implemente classifyError correctamente
      }
      
      // Crear resultado extendido con información de tracking
      const extendedResult = {
        ...gradeResult,
        hintsUsed: hint ? 1 : 0, // Si se mostró pista, contar como usada
        errorTags
      }
      
      // Debug only for problematic cases
      // console.log('🔍 DRILL DEBUG - Grade result:', {correct: extendedResult.correct, note: extendedResult.note})
      
      setResult(extendedResult)
      handleResult(extendedResult)
      // latency
      const elapsed = Date.now() - itemStart
      setLatencies(v => [...v, elapsed])
      // local counters
      if (!extendedResult.isAccentError) {
        if (extendedResult.correct) {
          setLocalCorrect(c => c + 1)
          setCurrentStreak(s => {
            const ns = s + 1
            setBestStreak(b => Math.max(b, ns))
            if (ns > 0 && ns % 5 === 0) {
              setShakeStreak(true)
              setTimeout(() => setShakeStreak(false), 500)
            }
            return ns
          })
          // Resistance: add time on correct
          if (settings.resistanceActive) {
            const lvl = useSettings.getState().level || 'A1'
            // Incrementos por nivel: A1 +5.0s, A2 +4.5s, B1 +4.0s, B2 +3.5s, C1 +3.0s, C2 +2.5s
            const inc = lvl==='C2'?2500: lvl==='C1'?3000: lvl==='B2'?3500: lvl==='B1'?4000: lvl==='A2'?4500:5000
            settings.set({ resistanceMsLeft: Math.min(useSettings.getState().resistanceMsLeft + inc, 120000) })
          }
        } else {
          setCurrentStreak(0)
          setErrorsCount(e => e + 1)
        }
        if (microMode === 'cards') setCardsDone(n => n + 1)
      }
    } catch (error) {
      console.error('Error grading conjugation:', error)
      console.error('Current item:', currentItem)
      console.error('User input:', input.trim())
      console.error('Settings:', currentItem.settings)
      
      // Create a more informative error result that still shows helpful info
      const errorResult = { 
        correct: false, 
        message: 'Error al evaluar la conjugación',
        note: 'Error técnico detectado. Revisa la consola para más detalles.',
        targets: currentItem?.form?.value ? [currentItem.form.value] : ['Forma no disponible'],
        isAccentError: false
      }
      
      setResult(errorResult)
      handleResult(errorResult)
    } finally {
      setIsSubmitting(false)
      // Keep focus in the input field for mobile users to easily press Enter for next verb
      // Only focus if we're not showing the result (which would disable the input)
      if (inputRef.current && !result) {
        // Use a small delay to ensure the DOM has updated
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            // Select all text to make it easy to replace
            inputRef.current.select()
          }
        }, 10)
      }
    }
  }

  const doubleSubmit = () => {
    if (!input.trim() || !secondInput.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const firstRes = grade(input.trim(), currentItem.form, currentItem.settings || {})
      // Use explicit second target from secondForm if present, otherwise fall back to same as first
      const secondTarget = currentItem.secondForm ? { ...currentItem.secondForm } : { ...currentItem.form }
      const secondRes = grade(secondInput.trim(), secondTarget, currentItem.settings || {})
      const correct = firstRes.correct && secondRes.correct
      const resultObj = {
        correct,
        isAccentError: firstRes.isAccentError || secondRes.isAccentError,
        targets: [currentItem.form.value, secondTarget.value],
        note: !correct ? (firstRes.note || secondRes.note || '❌ Forma incorrecta. Revisa la conjugación y los acentos.') : null,
        accepted: correct ? `${firstRes.accepted || ''} / ${secondRes.accepted || ''}`.trim() : null,
        hintsUsed: hint ? 1 : 0, // Si se mostró pista, contar como usada
        errorTags: [] // En modo doble, no clasificamos errores específicos
      }
      setResult(resultObj)
      handleResult(resultObj)
      const elapsed = Date.now() - itemStart
      setLatencies(v => [...v, elapsed])
      if (correct) {
        setLocalCorrect(c => c + 1)
        setCurrentStreak(s => {
          const ns = s + 1
          setBestStreak(b => Math.max(b, ns))
          if (ns > 0 && ns % 5 === 0) {
            setShakeStreak(true)
            setTimeout(() => setShakeStreak(false), 500)
          }
          return ns
        })
      } else {
        setCurrentStreak(0)
        setErrorsCount(e => e + 1)
      }
    } finally {
      setIsSubmitting(false)
      // Keep focus in the second input field for mobile users to easily press Enter for next verb
      if (secondRef.current && !result) {
        // Use a small delay to ensure the DOM has updated
        setTimeout(() => {
          if (secondRef.current) {
            secondRef.current.focus()
            // Select all text to make it easy to replace
            secondRef.current.select()
          }
        }, 10)
      }
    }
  }

  // Handle keyboard events for non-input elements
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle Enter if not in an input field
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
          if (!result) {
          if (isDouble) {
            // If double mode, guide focus then submit
            if (document.activeElement !== firstRef.current && document.activeElement !== secondRef.current) {
              if (firstRef.current) firstRef.current.focus()
            } else if (document.activeElement === firstRef.current) {
              if (secondRef.current) secondRef.current.focus()
            } else if (document.activeElement === secondRef.current) {
              doubleSubmit()
            }
          } else if (isReverse) {
            reverseSubmit()
          } else {
            handleSubmit()
          }
        } else {
          handleContinue()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [result])

  const handleContinue = () => {
    setResult(null)
    setInput('')
    setSecondInput('')
    
    onContinue()
    
    // Focus the appropriate input after a short delay to ensure the new item is loaded
    setTimeout(() => {
      // For double mode, focus the first input field
      if (settings.doubleActive && firstRef.current) {
        firstRef.current.focus()
        // Select all text to make it easy to replace
        firstRef.current.select()
      } 
      // For single mode, focus the main input field
      else if (inputRef.current) {
        inputRef.current.focus()
        // Select all text to make it easy to replace
        inputRef.current.select()
      }
    }, 100)
    
    if (microMode === 'cards') {
      // end if reached target
      if (cardsDone >= cardsTarget) {
        setMicroMode(null)
      }
    }
  }

  // Accent keypad logic (works in single and double)
  const specialChars = ['á','é','í','ó','ú','ü','ñ']
  const insertChar = (ch) => {
    const active = document.activeElement
    let el = null
    if (active === secondRef.current) el = secondRef.current
    else if (active === firstRef.current) el = firstRef.current
    else el = inputRef.current
    if (!el) return
    const value = el.value ?? ''
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + ch + value.slice(end)
    if (el === secondRef.current) setSecondInput(next)
    else setInput(next)
    requestAnimationFrame(() => {
      try { el.setSelectionRange(start + ch.length, start + ch.length) } catch {}
      el.focus()
    })
  }

  // Hint logic: show first 2-3 chars of target
  const revealHint = () => {
    const target = currentItem?.form?.value || ''
    if (!target) return
    const slice = target.slice(0, Math.min(3, target.length))
    setHint(`Pista: empieza con "${slice}"`)
    // Registrar que se mostró una pista
    handleHintShown()
  }

  const handleTouchStart = (e) => {
    const t = e.changedTouches?.[0]
    if (!t) return
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const handleTouchEnd = (e) => {
    const t = e.changedTouches?.[0]
    if (!t) return
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) > 40 && Math.abs(dy) < 40) {
      if (dx > 0) {
        // swipe right → Continue (if result), otherwise submit
        if (result) {
          handleContinue()
        } else {
          handleSubmit()
        }
      } else {
        // swipe left → Hint
        revealHint()
      }
    }
  }

  // Micro-drills timers
  useEffect(() => {
    if (microMode !== 'time') return
    if (timeLeft <= 0) {
      setMicroMode(null)
      return
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [microMode, timeLeft])

  const startTimeDrill = () => {
    setMicroMode('time')
    setTimeLeft(60)
    setCardsDone(0)
    setLocalCorrect(0)
  }
  const startCardsDrill = () => {
    setMicroMode('cards')
    setCardsTarget(10)
    setCardsDone(0)
    setLocalCorrect(0)
  }

  // Quick switch handlers (use global store)
  const changeMood = (mood) => {
    settings.set({ specificMood: mood, specificTense: null })
    setResult(null)
    setInput('')
    onContinue()
  }
  const changeTense = (tense) => {
    settings.set({ specificTense: tense })
    setResult(null)
    setInput('')
    onContinue()
  }
  const changeVerbType = (vt) => {
    settings.set({ verbType: vt })
    setResult(null)
    setInput('')
    onContinue()
  }

  if (!currentItem) {
    return (
      <div className="loading">
        <p>Cargando próxima conjugación...</p>
      </div>
    )
  }
  
  // Handle error state
  if (currentItem.error) {
    console.log('🔧 DRILL DEBUG - Showing error state:', currentItem)
    return (
      <div className="drill-container">
        <div className="error-message">
          <h3>⚠️ Error</h3>
          <p>{currentItem.message}</p>
          <button 
            className="btn" 
            onClick={() => window.location.reload()}
          >
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }

  // SIMPLE AND ROBUST CONTEXT LOGIC
  const getContextText = () => {
    const mood = currentItem?.mood || 'indicative'
    const tense = currentItem?.tense || 'pres'
    const lvl = settings.level
    
    const moodMap = {
      'indicative': 'Indicativo',
      'subjunctive': 'Subjuntivo', 
      'imperative': 'Imperativo',
      'conditional': 'Condicional',
      'nonfinite': 'No Finito'
    }
    
    const tenseMap = {
      'pres': 'Presente',
      'pretIndef': 'Pretérito Indefinido',
      'impf': 'Imperfecto',
      'fut': 'Futuro',
      'pretPerf': 'Pretérito Perfecto',
      'plusc': 'Pluscuamperfecto',
      'futPerf': 'Futuro Perfecto',
      'irAInf': 'Ir a + Infinitivo',
      'presFuturate': 'Presente Futurativo',
      'impAff': 'Afirmativo',
      'impNeg': 'Negativo',
      'impMixed': 'Todas',
      'subjPres': 'Presente',
      'subjImpf': 'Imperfecto',
      'subjFut': 'Futuro',
      'subjPerf': 'Pretérito Perfecto',
      'subjPlusc': 'Pluscuamperfecto',
      'cond': 'Condicional',
      'condPerf': 'Condicional Perfecto',
      'inf': 'Infinitivo',
      'part': 'Participio',
      'ger': 'Gerundio',
      'nonfiniteMixed': 'Participios y Gerundios'
    }
    
    const moodText = moodMap[mood] || 'Indicativo'
    const tenseText = tenseMap[tense] || 'Presente'
    
    // Etiqueta de registro jurídico si es futuro de subjuntivo y lectura/producción está activada
    const isJur = (tense === 'subjFut' || tense === 'subjFutPerf') && (settings.enableFuturoSubjRead || settings.enableFuturoSubjProd)
    
    // Ejemplo de conjugación del verbo hablar en primera persona para este modo y tiempo
    // Solo mostrar tiempos simples, no compuestos
    const getHablarExample = () => {
      // Get the appropriate imperative example based on dialect
      const getImperativeExample = () => {
        // For rioplatense (useVoseo), show vos form
        if (settings.useVoseo && !settings.useTuteo) {
          return 'hablá / no hables';
        }
        // For other dialects, show tú form
        return 'habla / no hables';
      };

      const examples = {
        'indicative': {
          'pres': 'hablo',
          'pretIndef': 'hablé',
          'impf': 'hablaba',
          'fut': 'hablaré',
          'irAInf': 'voy a hablar',
          'presFuturate': 'hablo'
        },
        'subjunctive': {
          'subjPres': 'hable',
          'subjImpf': 'hablara',
          'subjFut': 'hablare'
        },
        'conditional': {
          'cond': 'hablaría'
        },
        'imperative': {
          'impAff': getImperativeExample(),
          'impNeg': getImperativeExample(),
          'impMixed': getImperativeExample()
        },
        'nonfinite': {
          'inf': 'hablar',
          'part': 'hablado',
          'ger': 'hablando',
          'nonfiniteMixed': 'hablando / hablado'
        }
      }
      
      return examples[mood]?.[tense] || 'hablo'
    }
    
    const example = getHablarExample()
    
    return `${moodText} - ${tenseText}: ${example}${isJur ? ' · Registro jurídico' : ''}`
  }


  // Generalized: get person label for any form object
  const getPersonText = (formObj = currentItem) => {
    if (!formObj) return '';
    if (formObj.mood === 'nonfinite' || 
        formObj.tense === 'ger' || 
        formObj.tense === 'part' || 
        formObj.tense === 'nonfiniteMixed') {
      return 'No conjugado';
    }
    const personMap = {
      '1s': 'Yo',
      '2s_tu': 'Tú',
      '2s_vos': 'Vos',
      '3s': 'Él/Ella/Usted',
      '1p': 'Nosotros',
      '2p_vosotros': 'Vosotros',
      '3p': 'Ellos/Ustedes'
    };
    return personMap[formObj.person] || 'Yo';
  }

  // Show required enclitics for imperativo afirmativo when present in target
  const getCliticHint = () => {
    if (!currentItem?.form?.value) return null
    if (currentItem.mood !== 'imperative' || currentItem.tense !== 'impAff') return null
    const val = String(currentItem.form.value).replace(/\s+/g, '').toLowerCase()
    const m = val.match(/(me|te|se|lo|la|le|nos|los|las|les)+$/)
    if (!m) return null
    let s = m[0]
    const order = ['nos','les','las','los','le','la','lo','se','me','te']
    const tokens = []
    while (s.length > 0) {
      const t = order.find(tok => s.startsWith(tok))
      if (!t) break
      tokens.push(t)
      s = s.slice(t.length)
    }
    if (tokens.length === 0) return null
    return tokens.join(' ')
  }

  const isReverse = !!settings.reverseActive
  const isDouble = !!settings.doubleActive
  const inSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense

  // Campos visibles según modo
  const showInfinitiveField = isReverse
  const showPersonField = isReverse && currentItem?.mood !== 'nonfinite'
  const showMoodField = isReverse && !inSpecific
  const showTenseField = isReverse && !inSpecific

  const [infinitiveGuess, setInfinitiveGuess] = useState('')
  const [personGuess, setPersonGuess] = useState('')
  const [moodGuess, setMoodGuess] = useState('')
  const [tenseGuess, setTenseGuess] = useState('')

  const resetReverseInputs = () => {
    setInfinitiveGuess('')
    setPersonGuess('')
    setMoodGuess('')
    setTenseGuess('')
  }

  useEffect(() => { if (isReverse) resetReverseInputs() }, [currentItem?.id, isReverse])

  const personOptions = [
    { v:'1s', l:'yo' },
    { v:'2s_tu', l:'tú' },
    { v:'2s_vos', l:'vos' },
    { v:'3s', l:'él/ella/usted' },
    { v:'1p', l:'nosotros' },
    { v:'2p_vosotros', l:'vosotros' },
    { v:'3p', l:'ellos/ustedes' }
  ]

  const moodOptions = [
    { v:'indicative', l:'Indicativo' },
    { v:'subjunctive', l:'Subjuntivo' },
    { v:'imperative', l:'Imperativo' },
    { v:'conditional', l:'Condicional' },
    { v:'nonfinite', l:'No Finito' }
  ]

  const tenseOptionsByMood = {
    indicative: ['pres','pretPerf','pretIndef','impf','plusc','fut','futPerf'],
    subjunctive: ['subjPres','subjImpf','subjPerf','subjPlusc'],
    imperative: ['impAff','impNeg','impMixed'],
    conditional: ['cond','condPerf'],
    nonfinite: ['ger','part','nonfiniteMixed']
  }

  const reverseSubmit = () => {
    // Validar
    if (!infinitiveGuess.trim()) return
    if (showPersonField && !personGuess) return
    if (showMoodField && !moodGuess) return
    if (showTenseField && !tenseGuess) return

    // Comprobar contra currentItem.form
    const expected = currentItem.form
    const okInf = expected.lemma ? expected.lemma.toLowerCase() === infinitiveGuess.trim().toLowerCase() : false
    // Aceptar sincretismos de persona cuando la forma es idéntica (p. ej., 1s/3s)
    const key = `${expected.mood}|${expected.tense}`
    const EQUIV = {
      'subjunctive|subjImpf': [['1s','3s']],
      'subjunctive|subjPres': [['1s','3s']],
      'subjunctive|subjPerf': [['1s','3s']],
      'subjunctive|subjPlusc': [['1s','3s']],
      'indicative|impf': [['1s','3s']],
      'indicative|plusc': [['1s','3s']],
      'conditional|cond': [['1s','3s']],
      'conditional|condPerf': [['1s','3s']]
    }
    const groups = EQUIV[key] || []
    const sameGroup = groups.some(g => g.includes(expected.person) && g.includes(personGuess))
    const okPerson = showPersonField ? (expected.person ? (expected.person === personGuess || sameGroup) : false) : true
    const okMood = showMoodField ? expected.mood === moodGuess : true
    const okTense = showTenseField ? expected.tense === tenseGuess : true
    const correct = okInf && okPerson && okMood && okTense

    // Provide specific feedback about what was wrong
    let specificNote = null
    if (!correct) {
      const errors = []
      if (!okInf) errors.push('infinitivo incorrecto')
      if (!okPerson) errors.push('persona incorrecta')
      if (!okMood) errors.push('modo incorrecto')
      if (!okTense) errors.push('tiempo incorrecto')
      specificNote = `❌ ${errors.join(', ')}. Respuesta correcta: ${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}`
    }

    const resultObj = {
      correct,
      isAccentError: false,
      targets: [`${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}`],
      note: specificNote,
      accepted: correct ? `${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}` : null,
      hintsUsed: 0, // No hay pistas en modo reverso
      errorTags: correct ? [] : ['error_general'] // En modo reverso, error general si es incorrecto
    }
    setResult(resultObj)
    handleResult(resultObj)
  }

  // Helper function to determine what to display for a result
  const getResultDisplay = (result) => {
    if (!result) return null
    
    if (result.correct) {
      return {
        mainMessage: '¡Correcto!',
        additionalNote: result.note // Show note for correct answers if exists
      }
    }
    
    if (result.isAccentError) {
      return {
        mainMessage: <>¡Cuidado! Falta la tilde: <strong>{result.targets?.join(' / ')}</strong></>,
        additionalNote: null // No additional note for accent errors
      }
    }
    
    // For incorrect answers, prioritize the grader's note
    const mainMessage = result.note || 'Incorrecto'
    
    return {
      mainMessage,
      additionalNote: result.targets && !result.note ? 
        `Respuesta correcta: ${result.targets.join(' / ')}` : null
    }
  }

  const handleReverseKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!result) {
        // Primer Enter: verificar respuesta
        reverseSubmit()
      } else {
        // Segundo Enter: continuar al siguiente
        handleContinue()
      }
    }
  }

  return (
    <div className="drill-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Verb lemma (infinitive) - TOP */}
      <div className="verb-lemma">
        {isReverse ? currentItem.form?.value : currentItem?.lemma}
      </div>

      {/* Conjugation context - MIDDLE */}
      {!isReverse && !isDouble && (
        <div className="conjugation-context">
          {getContextText()}
        </div>
      )}

      {/* Person/pronoun display - BOTTOM (hide for nonfinite forms) */}
      {!isReverse && !isDouble && currentItem.mood !== 'nonfinite' && (
        <div className="person-display">
          {getPersonText()}
          {(() => {
            const hint = getCliticHint()
            if (hint && currentItem.mood === 'imperative' && currentItem.tense === 'impAff') {
              return <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>(Clíticos: {hint})</span>
            }
            return null
          })()}
        </div>
      )}

      {/* Variant selector for -ra/-se when enforced (C1/C2) */}
      {false && <div />}

      {/* Input form */}
      {!isReverse && !isDouble && (
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className="conjugation-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (!result) {
                handleSubmit()
              } else {
                handleContinue()
              }
            }
          }}
          placeholder="Escribe la conjugación..."
          readOnly={result !== null}
          autoFocus
          // Prevent mobile keyboard from hiding on submit
          onBlur={(e) => {
            // Only refocus if we have a result (meaning we just submitted)
            // and we're not in the process of continuing to the next verb
            if (result && !isSubmitting) {
              // Small delay to ensure the UI has updated
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }, 10)
            }
          }}
        />
        {/* Accent keypad */}
        {showAccentKeys && (
        <div className="accent-keypad" aria-hidden={result !== null}>
          {specialChars.map(ch => (
            <button
              key={ch}
              type="button"
              className="accent-key"
              onClick={() => insertChar(ch)}
              tabIndex={-1}
            >{ch}</button>
          ))}
          <button
            type="button"
            className="accent-key hint-key"
            onClick={revealHint}
            title="Pista"
            tabIndex={-1}
          >?
          </button>
        </div>
        )}
        {hint && !result && (
          <div className="hint-text">{hint}</div>
        )}
      </div>
      )}

      {isReverse && (
        <div className="reverse-container">
          <div className="reverse-badge">Invertí la consigna</div>
          <div className="reverse-subtle">
            {inSpecific ? 'Decí el infinitivo y la persona' : 'Decí el infinitivo, la persona, el modo y el tiempo'}
          </div>
          <div className="reverse-divider" />

          <div className={`reverse-grid ${!showPersonField && !showMoodField && !showTenseField ? 'reverse-grid-single' : ''}`}>
            <div className="reverse-field">
              <label className="reverse-label">Infinitivo</label>
              <input className="reverse-input" value={infinitiveGuess} onChange={(e)=>setInfinitiveGuess(e.target.value)} onKeyDown={handleReverseKeyDown} placeholder="escribir, tener..." />
            </div>

            {showPersonField && (
              <div className="reverse-field">
                <label className="reverse-label">Persona</label>
                <select className="reverse-select" value={personGuess} onChange={(e)=>setPersonGuess(e.target.value)} onKeyDown={handleReverseKeyDown}>
                  <option value="">Seleccioná persona...</option>
                  {personOptions.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
            )}

            {showMoodField && (
              <div className="reverse-field">
                <label className="reverse-label">Modo</label>
                <select className="reverse-select" value={moodGuess} onChange={(e)=>{ setMoodGuess(e.target.value); setTenseGuess('') }} onKeyDown={handleReverseKeyDown}>
                  <option value="">Seleccioná modo...</option>
                  {moodOptions.map(m => <option key={m.v} value={m.v}>{getMoodLabel(m.v)}</option>)}
                </select>
              </div>
            )}

            {showTenseField && (
              <div className="reverse-field">
                <label className="reverse-label">Tiempo</label>
                <select className="reverse-select" value={tenseGuess} onChange={(e)=>setTenseGuess(e.target.value)} onKeyDown={handleReverseKeyDown} disabled={!moodGuess}>
                  <option value="">Seleccioná tiempo...</option>
                  {(tenseOptionsByMood[moodGuess]||[]).map(t => <option key={t} value={t}>{getTenseLabel(t)}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {isDouble && (
        <div className="double-container">
          <div className="conjugation-context" style={{marginBottom: '10px'}}>
                            <strong>Dos verbos dos: {currentItem.lemma}</strong>
          </div>
          <div className="double-grid">
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>
                {getMoodLabel(currentItem.mood)} · {getTenseLabel(currentItem.tense)} · {getPersonText(currentItem)}
              </div>
              <input
                ref={firstRef}
                className="conjugation-input"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                placeholder="Escribí la primera forma..."
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault()
                    if (result) { handleContinue(); return }
                    if(secondRef.current){ secondRef.current.focus() }
                  }
                }}
                // Prevent mobile keyboard from hiding on submit
                onBlur={(e) => {
                  // Only refocus if we have a result (meaning we just submitted)
                  // and we're not in the process of continuing to the next verb
                  if (result && !isSubmitting) {
                    // Small delay to ensure the UI has updated
                    setTimeout(() => {
                      if (firstRef.current) {
                        firstRef.current.focus()
                      }
                    }, 10)
                  }
                }}
              />
            </div>
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>
                {getMoodLabel((currentItem.secondForm||currentItem.form).mood)} · {getTenseLabel((currentItem.secondForm||currentItem.form).tense)} · {getPersonText(currentItem.secondForm||currentItem.form)}
              </div>
              <input
                ref={secondRef}
                className="conjugation-input"
                value={secondInput}
                onChange={(e)=>setSecondInput(e.target.value)}
                placeholder="Escribí la segunda forma..."
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault()
                    if (result) { handleContinue(); return }
                    doubleSubmit()
                  }
                }}
                // Prevent mobile keyboard from hiding on submit
                onBlur={(e) => {
                  // Only refocus if we have a result (meaning we just submitted)
                  // and we're not in the process of continuing to the next verb
                  if (result && !isSubmitting) {
                    // Small delay to ensure the UI has updated
                    setTimeout(() => {
                      if (secondRef.current) {
                        secondRef.current.focus()
                      }
                    }, 10)
                  }
                }}
              />
            </div>
          </div>
          {showAccentKeys && (
            <div className="accent-keypad" aria-hidden={result !== null}>
              {specialChars.map(ch => (
                <button
                  key={ch}
                  type="button"
                  className="accent-key"
                  onClick={() => insertChar(ch)}
                  tabIndex={-1}
                >{ch}</button>
              ))}
              <button
                type="button"
                className="accent-key hint-key"
                onClick={revealHint}
                title="Pista"
                tabIndex={-1}
              >?
              </button>
            </div>
          )}
        </div>
      )}

      {/* Micro-drills controls & progress */}
      {showChallenges && (
        <div className="chrono-panel">
          <div className="chrono-item">
            <div className="chrono-value">{localCorrect}</div>
            <div className="chrono-label">Aciertos</div>
          </div>
          <div className="chrono-item">
            <div className="chrono-value">
              <span className={`streak-value streak-tier-${Math.min(6, Math.floor(currentStreak/5))} ${shakeStreak ? 'streak-shake' : ''}`}>{currentStreak}</span>
              <span className="chrono-sub"> (mejor {bestStreak})</span>
            </div>
            <div className="chrono-label">Racha</div>
          </div>
          <div className="chrono-item">
            <div className="chrono-value">{Math.round((localCorrect / Math.max(1, localCorrect + errorsCount)) * 100)}</div>
            <div className="chrono-label">Aciertos/100</div>
          </div>
          <div className="chrono-divider" />
          {latencies.length>0 && (
            <div className="chrono-item wide">
              <div className="chrono-label">Mediana</div>
              <div className="chrono-value">
                {Math.round(([...latencies].sort((a,b)=>a-b)[Math.floor(latencies.length/2)])/10)/100}s
                {(settings.level && settings.medianTargetMs) && (
                  <span className="chrono-sub"> / obj {Math.round(settings.medianTargetMs/10)/100}s</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        {/* Only the main Verificar/Continuar button remains */}
        {!isReverse && !isDouble && (
          !result ? (
            <button 
              className="btn" 
              onClick={handleSubmit}
              disabled={isSubmitting || !input.trim()}
            >
              {isSubmitting ? 'Verificando...' : 'Verificar'}
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              {result.isAccentError ? 'Siguiente Verbo (Auto)' : 'Continuar'}
            </button>
          )
        )}
      </div>

      {/* Result feedback - SIMPLIFIED WITH HELPER FUNCTION */}
      {result ? (() => {
        const display = getResultDisplay(result)
        return display ? (
          <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
            <p>{display.mainMessage}</p>
            {display.additionalNote && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                {display.additionalNote}
              </p>
            )}
          </div>
        ) : null
      })() : null}

      {/* Resistance HUD */}
      {(settings.resistanceActive || showExplosion) && (
        <div className="resistance-hud">
          <div 
            className={`digit-clock ${settings.resistanceMsLeft <= 5000 ? 'urgent' : ''} ${showExplosion ? 'shake' : ''} ${clockClickFeedback ? 'click-feedback' : ''} ${urgentTick ? 'urgent-tick' : ''}`}
            onClick={() => {
              // Solo permitir clicks si el modo está activo
              if (settings.resistanceActive && settings.resistanceMsLeft > 0) {
                // Add 5 seconds (5000ms) when clicking the clock
                const currentMs = settings.resistanceMsLeft
                settings.set({ resistanceMsLeft: currentMs + 5000 })
                
                // Show visual feedback
                setClockClickFeedback(true)
                setTimeout(() => setClockClickFeedback(false), 300)
              }
            }}
            style={{ cursor: settings.resistanceActive && settings.resistanceMsLeft > 0 ? 'pointer' : 'default' }}
            title={settings.resistanceActive && settings.resistanceMsLeft > 0 ? "Click para agregar 5 segundos" : "¡Tiempo agotado!"}
          >
            {(() => {
              const ms = Math.max(0, settings.resistanceMsLeft)
              const s = Math.floor(ms/1000)
              const d2 = (n) => String(n).padStart(2,'0')
              const str = `${d2(Math.floor(s/60))}:${d2(s%60)}`
              return str.split('').map((ch, i) => (
                <span key={i} className={`digit ${ch === ':' ? 'colon' : ''}`}>{ch}</span>
              ))
            })()}
          </div>
          {showExplosion && (
            <div className="resistance-caption">
              ¡Tiempo agotado!
            </div>
          )}
        </div>
      )}
      {/* Wrapper para tracking de progreso */}
      <ProgressTrackingWrapper 
        currentItem={currentItem}
        onResult={onResult}
        onContinue={onContinue}
        result={result}
      />
    </div>
  )
} 