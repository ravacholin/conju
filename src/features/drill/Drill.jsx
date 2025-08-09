import { useState, useEffect, useRef } from 'react'
import { grade } from '../../lib/grader.js'
import { getTenseLabel, getMoodLabel } from '../../lib/verbLabels.js'
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
  const [shakeStreak, setShakeStreak] = useState(false)
  const [secondInput, setSecondInput] = useState('')

  const inputRef = useRef(null)
  const firstRef = useRef(null)
  const secondRef = useRef(null)
  const touchStart = useRef({ x: 0, y: 0 })
  const settings = useSettings()
  const [resistTick, setResistTick] = useState(0)

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
      if (left === 0) {
        // update best by level
        const lvl = settings.level || 'A1'
        const best = useSettings.getState().resistanceBestMsByLevel || {}
        const survived = (Date.now() - (useSettings.getState().resistanceStartTs||Date.now()))
        if (!best[lvl] || survived > best[lvl]) {
          best[lvl] = survived
          settings.set({ resistanceBestMsByLevel: { ...best } })
        }
        settings.set({ resistanceActive: false })
      }
    }, 100)
    return () => clearInterval(id)
  }, [settings.resistanceActive, settings.resistanceMsLeft])

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
            if (ns > 0 && ns % 5 === 0) {
              setShakeStreak(true)
              setTimeout(() => setShakeStreak(false), 500)
            }
            return ns
          })
          // Resistance: add time on correct
          if (settings.resistanceActive) {
            const bonus = 5000 // ms per correct
            settings.set({ resistanceMsLeft: Math.min(useSettings.getState().resistanceMsLeft + bonus, 120000) })
          }
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

  const doubleSubmit = () => {
    if (!input.trim() || !secondInput.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const firstRes = grade(input.trim(), currentItem.form, currentItem.settings || {})
      // Use explicit second target from secondForm if present, otherwise fall back to same as first
      const secondTarget = currentItem.secondForm ? { ...currentItem.secondForm } : { ...currentItem.form }
      const secondRes = secondTarget ? grade(secondInput.trim(), secondTarget, currentItem.settings || {}) : { correct: false }
      const correct = firstRes.correct && secondRes.correct
      const resultObj = {
        correct,
        isAccentError: firstRes.isAccentError || secondRes.isAccentError,
        targets: [currentItem.form.value, secondTarget.value]
      }
      setResult(resultObj)
      onResult(resultObj)
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

  const isReverse = !!settings.reverseActive
  const isDouble = !!settings.doubleActive
  const inSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense

  // Campos visibles según modo
  const showInfinitiveField = isReverse
  const showPersonField = isReverse
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
    if (!personGuess) return
    if (showMoodField && !moodGuess) return
    if (showTenseField && !tenseGuess) return

    // Comprobar contra currentItem.form
    const expected = currentItem.form
    const okInf = expected.lemma ? expected.lemma.toLowerCase() === infinitiveGuess.trim().toLowerCase() : false
    const okPerson = expected.person ? expected.person === personGuess : false
    const okMood = showMoodField ? expected.mood === moodGuess : true
    const okTense = showTenseField ? expected.tense === tenseGuess : true
    const correct = okInf && okPerson && okMood && okTense

    const resultObj = {
      correct,
      isAccentError: false,
      targets: [`${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}`]
    }
    setResult(resultObj)
    onResult(resultObj)
  }

  return (
    <div className="drill-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Verb lemma (infinitive) - TOP */}
      <div className="verb-lemma">
        {isReverse ? currentItem.form?.value : currentItem.lemma}
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
      )}

      {isReverse && (
        <div className="reverse-container">
          <div className="reverse-badge">Invertí la consigna</div>
          <div className="reverse-subtle">
            {inSpecific ? 'Decí el infinitivo y la persona' : 'Decí el infinitivo, la persona, el modo y el tiempo'}
          </div>
          <div className="reverse-divider" />

          <div className="reverse-grid">
            <div className="reverse-field">
              <label className="reverse-label">Infinitivo</label>
              <input className="reverse-input" value={infinitiveGuess} onChange={(e)=>setInfinitiveGuess(e.target.value)} placeholder="escribir, tener..." />
            </div>

            <div className="reverse-field">
              <label className="reverse-label">Persona</label>
              <select className="reverse-select" value={personGuess} onChange={(e)=>setPersonGuess(e.target.value)}>
                <option value="">Seleccioná persona...</option>
                {personOptions.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>

            {showMoodField && (
              <div className="reverse-field">
                <label className="reverse-label">Modo</label>
                <select className="reverse-select" value={moodGuess} onChange={(e)=>{ setMoodGuess(e.target.value); setTenseGuess('') }}>
                  <option value="">Seleccioná modo...</option>
                  {moodOptions.map(m => <option key={m.v} value={m.v}>{getMoodLabel(m.v)}</option>)}
                </select>
              </div>
            )}

            {showTenseField && (
              <div className="reverse-field">
                <label className="reverse-label">Tiempo</label>
                <select className="reverse-select" value={tenseGuess} onChange={(e)=>setTenseGuess(e.target.value)} disabled={!moodGuess}>
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
          <div className="conjugation-context" style={{marginBottom: '10px'}}>Conjugá dos juntos</div>
          <div className="double-grid">
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>{getMoodLabel(currentItem.mood)} · {getTenseLabel(currentItem.tense)} · {getPersonText()}</div>
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
              />
            </div>
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>{getMoodLabel((currentItem.secondForm||currentItem.form).mood)} · {getTenseLabel((currentItem.secondForm||currentItem.form).tense)} · {getPersonText()}</div>
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
            <div className="chrono-value">{Math.round((errorsCount / Math.max(1, localCorrect + errorsCount)) * 100)}</div>
            <div className="chrono-label">Errores/100</div>
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
        {!isReverse && !isDouble ? (
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
        ) : isReverse ? (
          !result ? (
            <button 
              className="btn" 
              onClick={reverseSubmit}
              disabled={!(infinitiveGuess.trim() && personGuess && (!showMoodField || moodGuess) && (!showTenseField || tenseGuess))}
            >
              Verificar
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              Continuar
            </button>
          )
        ) : (
          !result ? (
            <button 
              className="btn" 
              onClick={doubleSubmit}
              disabled={!(input.trim() && secondInput.trim())}
            >
              Verificar
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              Continuar
            </button>
          )
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

      {/* Resistance HUD */}
      {settings.resistanceActive && (
        <div className="resistance-hud">
          <div className="digit-clock">
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
          <div className="resistance-caption">Modo Resistencia</div>
        </div>
      )}
    </div>
  )
} 