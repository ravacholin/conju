import { useState, useEffect } from 'react'
import { grade } from '../../lib/grader.js'
import { getMoodLabel, getTenseLabel, getPersonLabel } from '../../lib/verbLabels.js'

export default function Drill({item, onResult, settings}){
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    setValue('')
    setIsSubmitting(false)
    setResult(null)
    setShowResult(false)
  }, [item])

  const handleSubmit = () => {
    if (!value.trim() || isSubmitting) return
    setIsSubmitting(true)
    
    // Grade the response
    const gradeResult = grade(value, item.form, settings)
    setResult(gradeResult)
    setShowResult(true)
    setIsSubmitting(false)
  }

  const handleContinue = () => {
    // Pass result to parent and prepare for next question
    onResult(result)
    setShowResult(false)
    setResult(null)
    setValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleContinue()
      } else if (!isSubmitting) {
        handleSubmit()
      }
    }
  }

  return (
    <div className="drill-interface">
      <div className="prompt">
        <div className="prompt-header">
          <span className="prompt-label">Conjuga</span>
          <span className="prompt-verb">{item.lemma}</span>
        </div>
        <div className="prompt-details">
          <span className="prompt-mood">{getMoodLabel(item.mood)}</span>
          <span className="prompt-separator">•</span>
          <span className="prompt-tense">{getTenseLabel(item.tense)}</span>
          <span className="prompt-separator">•</span>
          <span className="prompt-person">{getPersonLabel(item.person)}</span>
        </div>
      </div>
      
      {!showResult ? (
        <>
          <div className="input-section">
            <input 
              value={value} 
              onChange={e => setValue(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu respuesta..."
              autoFocus
              disabled={isSubmitting}
              className="conjugation-input"
            />
            <button 
              onClick={handleSubmit}
              disabled={!value.trim() || isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Verificando...' : 'Verificar Respuesta'}
            </button>
          </div>

          <div className="hint-section">
            <p className="hint-text">
              💡 Consejo: Puedes presionar Enter para enviar tu respuesta
            </p>
          </div>
        </>
      ) : (
        <div className="result-section">
          <div className={`result-feedback ${result.correct ? 'correct' : 'incorrect'}`}>
            {result.correct ? (
              <>
                <div className="result-icon">✅</div>
                <div className="result-message">¡Correcto!</div>
                <div className="result-answer">Tu respuesta: <strong>{value}</strong></div>
              </>
            ) : (
              <>
                <div className="result-icon">❌</div>
                <div className="result-message">Incorrecto</div>
                <div className="result-answer">Tu respuesta: <strong>{value}</strong></div>
                <div className="result-targets">
                  Respuestas correctas: <strong>{result.targets.join(', ')}</strong>
                </div>
                {result.note && (
                  <div className="result-note">{result.note}</div>
                )}
              </>
            )}
          </div>
          
          <button 
            onClick={handleContinue}
            onKeyPress={handleKeyPress}
            className="continue-btn"
            autoFocus
          >
            Continuar
          </button>
          
          <div className="hint-section">
            <p className="hint-text">
              💡 Presiona Enter para continuar
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 