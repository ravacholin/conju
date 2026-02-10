import React, { useState, useEffect, useCallback, useRef } from 'react'
import { conversationEngine } from '../../lib/learning/conversationEngine.js'
import SpeechRecognitionManager from '../../lib/learning/SpeechRecognitionManager.js'
import { gradeWithPartialCredit } from '../../lib/learning/conversationGrader.js'
import { createLogger } from '../../lib/utils/logger.js'
import './ConversationMode.css'

const logger = createLogger('learning:ConversationMode')

/**
 * ConversationMode - Interactive dialog practice with speech recognition
 * Provides realistic conversation scenarios with NPC interactions
 */
function ConversationMode({ scenario, onBack, onComplete }) {
  const [session, setSession] = useState(null)
  const [currentExchange, setCurrentExchange] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [showHints, setShowHints] = useState(false)
  const [speechManager, setSpeechManager] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  const inputRef = useRef(null)

  // Initialize session
  useEffect(() => {
    if (!scenario) return

    try {
      const newSession = conversationEngine.startConversation(scenario.id)
      setSession(newSession)
      setCurrentExchange(newSession.scenario.getExchange(0))

      // Add NPC's first message to history
      setConversationHistory([{
        type: 'npc',
        message: newSession.scenario.getExchange(0).npc,
        timestamp: Date.now()
      }])

      logger.debug('Started conversation', { scenarioId: scenario.id })
    } catch (error) {
      logger.error('Error starting conversation:', error)
    }
  }, [scenario])

  // Initialize speech recognition
  useEffect(() => {
    const initSpeech = async () => {
      const supported = SpeechRecognitionManager.isSupported()
      setIsSupported(supported)

      if (supported) {
        const manager = new SpeechRecognitionManager({
          language: 'es-ES',
          continuous: false,
          autoStop: true,
          silenceThreshold: 3000
        })

        manager.setCallbacks({
          onStart: () => {
            setIsRecording(true)
            logger.debug('Recording started')
          },
          onEnd: () => {
            setIsRecording(false)
            logger.debug('Recording ended')
          },
          onResult: (result) => {
            setTranscription(result.transcript)
            setUserInput(result.transcript)
            logger.debug('Speech result', { transcript: result.transcript })
          },
          onInterim: (result) => {
            setTranscription(result.transcript)
          },
          onError: (error) => {
            logger.error('Speech error', error)
            setIsRecording(false)
          }
        })

        setSpeechManager(manager)
      }
    }

    initSpeech()

    return () => {
      if (speechManager) {
        speechManager.destroy()
      }
    }
  }, []) // Empty deps - only run once

  // Handle voice input
  const handleStartRecording = useCallback(() => {
    if (!speechManager) return

    setFeedback(null)
    setTranscription('')
    speechManager.start()
  }, [speechManager])

  const handleStopRecording = useCallback(() => {
    if (!speechManager) return

    speechManager.stop()
  }, [speechManager])

  const responseDelayRef = useRef(null)

  // Submit response (text or voice)
  const handleSubmit = useCallback(() => {
    if (!session || !currentExchange || !userInput.trim()) return

    // Grade the response
    const grade = gradeWithPartialCredit(userInput, currentExchange, {
      confidence: 0.8 // Default confidence for text input
    })

    setFeedback(grade)

    // Add user message to history
    setConversationHistory(prev => [...prev, {
      type: 'user',
      message: userInput,
      grade,
      timestamp: Date.now()
    }])

    // Process with conversation engine
    const result = conversationEngine.processResponse(session, userInput)

    if (result.valid) {
      // Move to next exchange
      if (responseDelayRef.current) {
        clearTimeout(responseDelayRef.current)
      }
      responseDelayRef.current = setTimeout(() => {
        if (result.complete) {
          // Conversation completed
          logger.debug('Conversation completed', { score: session.score })
          onComplete?.({
            scenarioId: session.scenarioId,
            score: session.score,
            duration: Date.now() - session.startTime,
            exchanges: session.responses.length
          })
        } else {
          // Add NPC's next message
          setConversationHistory(prev => [...prev, {
            type: 'npc',
            message: result.nextNPC,
            timestamp: Date.now()
          }])

          const nextExchange = session.scenario.getExchange(session.currentExchange)
          setCurrentExchange(nextExchange)
          setUserInput('')
          setTranscription('')
          setFeedback(null)
          setShowHints(false)
        }
        responseDelayRef.current = null
      }, 2000) // Delay for user to read feedback
    }
  }, [session, currentExchange, userInput, onComplete])

  useEffect(() => {
    return () => {
      if (responseDelayRef.current) {
        clearTimeout(responseDelayRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && userInput.trim() && !isRecording) {
        handleSubmit()
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [userInput, isRecording, handleSubmit])

  if (!scenario || !session || !currentExchange) {
    return (
      <div className="conversation-mode">
        <div className="loading">Cargando conversación...</div>
      </div>
    )
  }

  return (
    <div className="conversation-mode">
      <div className="conversation-header">
        <button onClick={onBack} className="back-btn">← Volver</button>
        <div className="scenario-info">
          <h2>{scenario.title}</h2>
          <p className="difficulty-badge">{scenario.difficulty}</p>
        </div>
        <div className="score-display">
          Puntos: {session.score}
        </div>
      </div>

      <div className="conversation-context">
        <p>{scenario.context}</p>
      </div>

      <div className="conversation-history">
        {conversationHistory.map((entry, index) => (
          <div key={index} className={`message ${entry.type}`}>
            <div className="message-content">
              {entry.type === 'npc' && <span className="speaker">NPC:</span>}
              {entry.type === 'user' && <span className="speaker">Tú:</span>}
              <p>{entry.message}</p>
            </div>
            {entry.grade && (
              <div className={`grade-badge ${entry.grade.isPerfect ? 'perfect' : entry.grade.isAcceptable ? 'good' : 'needs-work'}`}>
                {entry.grade.score}%
              </div>
            )}
          </div>
        ))}
      </div>

      {feedback && (
        <div className={`feedback-panel ${feedback.isPerfect ? 'perfect' : feedback.isAcceptable ? 'good' : 'needs-work'}`}>
          <h3>{feedback.overallFeedback}</h3>

          {feedback.successes.length > 0 && (
            <div className="successes">
              <h4>✓ Correcto:</h4>
              <ul>
                {feedback.successes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {feedback.errors.length > 0 && (
            <div className="errors">
              <h4>⚠ Errores:</h4>
              <ul>
                {feedback.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {feedback.suggestions.length > 0 && (
            <div className="suggestions">
              <h4>💡 Sugerencias:</h4>
              <ul>
                {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="input-panel">
        <div className="input-controls">
          {isSupported && (
            <button
              className={`voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            >
              {isRecording ? '🎙️ Detener' : '🎙️ Hablar'}
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Escribe tu respuesta o usa el micrófono..."
            disabled={isRecording}
            className="text-input"
          />

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!userInput.trim() || isRecording}
          >
            Enviar
          </button>
        </div>

        {isRecording && (
          <div className="recording-indicator">
            <div className="pulse"></div>
            <span>Escuchando... {transcription}</span>
          </div>
        )}

        <div className="help-controls">
          <button
            className="hint-btn"
            onClick={() => setShowHints(!showHints)}
          >
            {showHints ? '❌ Ocultar pistas' : '💡 Ver pistas'}
          </button>
        </div>

        {showHints && currentExchange.hints && (
          <div className="hints-panel">
            <h4>Pistas:</h4>
            <ul>
              {currentExchange.hints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
            {currentExchange.goodExamples && (
              <>
                <h4>Ejemplos:</h4>
                <ul>
                  {currentExchange.goodExamples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {scenario.vocabulary && scenario.vocabulary.length > 0 && (
        <div className="vocabulary-panel">
          <h4>Vocabulario útil:</h4>
          <div className="vocabulary-tags">
            {scenario.vocabulary.map((word, i) => (
              <span key={i} className="vocab-tag">{word}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationMode
