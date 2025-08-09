import { useState, useEffect, useRef } from 'react'
import { grade } from '../../lib/grader.js'
import { useSettings } from '../../state/settings.js'


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

  const inputRef = useRef(null)
  const touchStart = useRef({ x: 0, y: 0 })
  const settings = useSettings()

  // Reset input when currentItem changes
  useEffect(() => {
    setInput('')
    // IMPORTANTE: NO resetear el resultado aquí
    setHint('')
    setItemStart(Date.now())
    
    // Focus the input when a new item is loaded
    if (inputRef.current && !result) {
      inputRef.current.focus()
    }
  }, [currentItem?.id, result])

  // Auto-advance on accent errors
  useEffect(() => {
    if (result && result.isAccentError) {
      // Auto-advance to next verb after 2 seconds for accent errors
      const timer = setTimeout(() => {
        handleContinue()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [result])

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const gradeResult = grade(input.trim(), currentItem.form, currentItem.settings || {})
      setResult(gradeResult)
      onResult(gradeResult)
      // latency
      const elapsed = Date.now() - itemStart
      setLatencies(v => [...v, elapsed])
      // local counters
      if (!gradeResult.isAccentError) {
        if (gradeResult.correct) {
          setLocalCorrect(c => c + 1)
          setCurrentStreak(s => {
            const ns = s + 1
            setBestStreak(b => Math.max(b, ns))
            return ns
          })
        } else {
          setCurrentStreak(0)
          setErrorsCount(e => e + 1)
        }
        if (microMode === 'cards') setCardsDone(n => n + 1)
      }
    } catch (error) {
      console.error('Error grading conjugation:', error)
      setResult({ correct: false, message: 'Error al evaluar la conjugación' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard events for non-input elements
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle Enter if not in an input field
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        if (!result) {
          handleSubmit()
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
    onContinue()
    
    // Focus the input after a short delay to ensure the new item is loaded
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
    if (microMode === 'cards') {
      // end if reached target
      if (cardsDone >= cardsTarget) {
        setMicroMode(null)
      }
    }
  }

  // Accent keypad logic
  const specialChars = ['á','é','í','ó','ú','ü','ñ']
  const insertChar = (ch) => {
    if (!inputRef.current) return
    const el = inputRef.current
    const start = el.selectionStart ?? input.length
    const end = el.selectionEnd ?? input.length
    const next = input.slice(0, start) + ch + input.slice(end)
    setInput(next)
    // restore caret after state applies
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const pos = start + ch.length
        inputRef.current.setSelectionRange(pos, pos)
        inputRef.current.focus()
      }
    })
  }

  // Hint logic: show first 2-3 chars of target
  const revealHint = () => {
    const target = currentItem?.form?.value || ''
    if (!target) return
    const slice = target.slice(0, Math.min(3, target.length))
    setHint(`Pista: empieza con "${slice}"`)
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
    const mood = currentItem.mood || 'indicative'
    const tense = currentItem.tense || 'pres'
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
    return `${moodText} - ${tenseText}${isJur ? ' · Registro jurídico' : ''}`
  }


  const getPersonText = () => {
    // Para formas no finitas, siempre mostrar "No conjugado"
    if (currentItem.mood === 'nonfinite' || 
        currentItem.tense === 'ger' || 
        currentItem.tense === 'part' || 
        currentItem.tense === 'nonfiniteMixed') {
      return 'No conjugado'
    }

    const personMap = {
      '1s': 'Yo',
      '2s_tu': 'Tú',
      '2s_vos': 'Vos',
      '3s': 'Él/Ella/Usted',
      '1p': 'Nosotros',
      '2p_vosotros': 'Vosotros',
      '3p': 'Ellos/Ustedes'
    }
    return personMap[currentItem.person] || 'Yo'
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

  return (
    <div className="drill-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Verb lemma (infinitive) - TOP */}
      <div className="verb-lemma">
        {currentItem.lemma}
      </div>

      {/* Conjugation context - MIDDLE */}
      <div className="conjugation-context">
        {getContextText()}
      </div>

      {/* Person/pronoun display - BOTTOM (hide for nonfinite forms) */}
      {currentItem.mood !== 'nonfinite' && (
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
          disabled={result !== null}
          autoFocus
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

      {/* Micro-drills controls & progress */}
      {showChallenges && (
      <div className="micro-controls">
        <div className="micro-chip">Aciertos: {localCorrect}</div>
        <div className="micro-chip">Racha: {currentStreak} (mejor {bestStreak})</div>
        <div className="micro-chip">Errores/100: {Math.round((errorsCount / Math.max(1, localCorrect + errorsCount)) * 100)}</div>
        {settings.medianTargetMs && latencies.length>0 && (
          <div className="micro-chip">Mediana: {Math.round([...latencies].sort((a,b)=>a-b)[Math.floor(latencies.length/2)]/10)/100}s / Obj {Math.round(settings.medianTargetMs/10)/100}s</div>
        )}
      </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        {!result ? (
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
        )}
      </div>

      {/* Result feedback - ALWAYS SHOW WHEN RESULT EXISTS */}
      {result ? (
        <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
          <p>
            {result.correct ? '¡Correcto!' : (result.isAccentError ? 'Error de Tilde' : 'Incorrecto')}
          </p>
          {result.correct && result.note && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              {result.note}
            </p>
          )}
          {!result.correct && result.targets && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Respuesta correcta: <strong>{result.targets.join(' / ')}</strong>
            </p>
          )}
          {!result.correct && result.note && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              {result.note}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
} 