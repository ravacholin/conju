import { useState, useEffect, useRef } from 'react'
import { grade } from '../../lib/grader.js'
import { useResponsive } from '../../lib/mobileDetection.js'

export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue
}) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isMobile } = useResponsive()
  const inputRef = useRef(null)

  // Reset input when currentItem changes
  useEffect(() => {
    setInput('')
    // IMPORTANTE: NO resetear el resultado aquí
    
    // Focus the input when a new item is loaded
    if (inputRef.current && !result) {
      inputRef.current.focus()
    }
  }, [currentItem?.id, result])

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const gradeResult = grade(input.trim(), currentItem.form, currentItem.settings || {})
      setResult(gradeResult)
      onResult(gradeResult)
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
      'subjPres': 'Presente',
      'subjImpf': 'Imperfecto',
      'subjFut': 'Futuro',
      'subjPerf': 'Pretérito Perfecto',
      'subjPlusc': 'Pluscuamperfecto',
      'cond': 'Condicional',
      'condPerf': 'Condicional Perfecto',
      'inf': 'Infinitivo',
      'part': 'Participio',
      'ger': 'Gerundio'
    }
    
    const moodText = moodMap[mood] || 'Indicativo'
    const tenseText = tenseMap[tense] || 'Presente'
    
    return `${moodText} - ${tenseText}`
  }

  const getPersonText = () => {
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

  return (
    <div className={`drill-container ${isMobile ? 'mobile-layout' : ''}`}>
      {/* Verb lemma */}
      <div className="verb-lemma">
        {currentItem.lemma}
      </div>

      {/* Conjugation context - ALWAYS SHOW */}
      <div className="conjugation-context">
        {getContextText()}
      </div>

      {/* Person/pronoun display */}
      <div className="person-display">
        {getPersonText()}
      </div>

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
      </div>

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
            Continuar
          </button>
        )}
      </div>

      {/* Result feedback - ALWAYS SHOW WHEN RESULT EXISTS */}
      {result ? (
        <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
          <p>
            {result.correct ? '¡Correcto!' : 'Incorrecto'}
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