import { useState, useEffect } from 'react'
import { grade } from '../../lib/grader.js'

export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue
}) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset input when currentItem changes, but keep result until user continues
  useEffect(() => {
    setInput('')
    // Don't reset result here - let user control when to move to next item
  }, [currentItem])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (result && e.key === 'Enter') {
        handleContinue()
      }
    }

    if (result) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [result])

  const handleSubmit = async () => {
    console.log('handleSubmit called with input:', input)
    if (!input.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const gradeResult = grade(input.trim(), currentItem.form, currentItem.settings || {})
      console.log('Grade result:', gradeResult)
      setResult(gradeResult)
      onResult(gradeResult)
    } catch (error) {
      console.error('Error grading conjugation:', error)
      setResult({ correct: false, message: 'Error al evaluar la conjugación' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !result) {
      handleSubmit()
    }
  }

  const handleContinue = () => {
    setResult(null) // Reset result when user continues
    onContinue()
  }

  if (!currentItem) {
    return (
      <div className="loading">
        <p>Cargando próxima conjugación...</p>
      </div>
    )
  }

  return (
    <div className="drill-container">
      {/* Verb lemma */}
      <div className="verb-lemma">
        {currentItem.lemma}
      </div>

      {/* Conjugation context */}
      <div className="conjugation-context">
        {currentItem.mood === 'imperative' && currentItem.tense === 'impAff' && 'Imperativo Afirmativo'}
        {currentItem.mood === 'imperative' && currentItem.tense === 'impNeg' && 'Imperativo Negativo'}
        {currentItem.mood === 'indicative' && currentItem.tense === 'pres' && 'Presente (Indicativo)'}
        {currentItem.mood === 'indicative' && currentItem.tense === 'pret' && 'Pretérito (Indicativo)'}
        {currentItem.mood === 'indicative' && currentItem.tense === 'impf' && 'Imperfecto (Indicativo)'}
        {currentItem.mood === 'indicative' && currentItem.tense === 'fut' && 'Futuro (Indicativo)'}
        {currentItem.mood === 'subjunctive' && currentItem.tense === 'subjPres' && 'Presente (Subjuntivo)'}
        {currentItem.mood === 'subjunctive' && currentItem.tense === 'subjImpf' && 'Imperfecto (Subjuntivo)'}
        {currentItem.mood === 'conditional' && currentItem.tense === 'cond' && 'Condicional'}
      </div>

      {/* Person/pronoun display */}
      <div className="person-display">
        {currentItem.person === '1s' && 'Yo'}
        {currentItem.person === '2s_tu' && 'Tú'}
        {currentItem.person === '2s_vos' && 'Vos'}
        {currentItem.person === '3s' && 'Él/Ella/Usted'}
        {currentItem.person === '1p' && 'Nosotros'}
        {currentItem.person === '2p_vosotros' && 'Vosotros'}
        {currentItem.person === '3p' && 'Ellos/Ustedes'}
      </div>

      {/* Input form */}
      <div className="input-container">
        <input
          type="text"
          className="conjugation-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
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

      {/* Result feedback */}
      {result && (
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
      )}
    </div>
  )
} 