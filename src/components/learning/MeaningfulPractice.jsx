import React, { useState } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import './MeaningfulPractice.css';

const timelineData = {
  pres: {
    type: 'daily_routine',
    title: 'La rutina diaria de Carlos',
    description: 'Describe un día típico de Carlos usando los verbos indicados en presente.',
    prompts: [
      { icon: '⏰', text: 'Por la mañana (despertarse, levantarse)', expected: ['despierta', 'levanta'] },
      { icon: '🍳', text: 'En el desayuno (comer, beber)', expected: ['come', 'bebe'] },
      { icon: '💼', text: 'En el trabajo (trabajar, escribir)', expected: ['trabaja', 'escribe'] },
      { icon: '🏠', text: 'Al llegar a casa (cocinar, ver televisión)', expected: ['cocina', 've'] },
      { icon: '🌙', text: 'Por la noche (leer, dormir)', expected: ['lee', 'duerme'] },
    ],
  },
  pretIndef: {
    type: 'timeline',
    title: 'El día de ayer de María',
    events: [
      { time: '7:00', icon: '☕️', prompt: 'tomar café' },
      { time: '12:00', icon: '🍽️', prompt: 'comer' },
      { time: '18:00', icon: '🏋️', prompt: 'ir al gimnasio' },
      { time: '22:00', icon: '🛏️', prompt: 'acostarse' },
    ],
    expectedVerbs: ['tomó', 'comió', 'fue', 'se acostó'],
  },
  subjPres: {
    type: 'prompts',
    title: 'Dando Consejos',
    prompts: [
        { prompt: 'Tu amigo está cansado. (recomendar que...)', expected: ['descanse', 'duerma'] },
        { prompt: 'Tu hermana quiere aprender español. (sugerir que...)', expected: ['practique', 'estudie'] },
        { prompt: 'Tus padres van a viajar. (esperar que...)', expected: ['disfruten', 'viajen'] },
    ],
  },
  impf: {
    type: 'daily_routine',
    title: 'Los recuerdos de la infancia',
    description: 'Describe cómo era la vida cuando eras pequeño usando los verbos en imperfecto.',
    prompts: [
      { icon: '🏠', text: 'Donde vivías de niño (vivir, tener)', expected: ['vivía', 'tenía'] },
      { icon: '🎮', text: 'Con qué jugabas (jugar, divertirse)', expected: ['jugaba', 'divertía'] },
      { icon: '📚', text: 'Qué estudiabas (estudiar, aprender)', expected: ['estudiaba', 'aprendía'] },
      { icon: '👨‍👩‍👧‍👦', text: 'Cómo era tu familia (ser, estar)', expected: ['era', 'estaba'] },
      { icon: '🌞', text: 'Qué hacías los veranos (ir, hacer)', expected: ['iba', 'hacía'] },
    ],
  },
  fut: {
    type: 'prompts',
    title: 'Planes para el futuro',
    prompts: [
        { prompt: 'El próximo año... (viajar, conocer)', expected: ['viajaré', 'conoceré', 'viajarás', 'conocerás'] },
        { prompt: 'En mis próximas vacaciones... (descansar, visitar)', expected: ['descansaré', 'visitaré', 'descansarás', 'visitarás'] },
        { prompt: 'Cuando termine mis estudios... (trabajar, ser)', expected: ['trabajaré', 'seré', 'trabajarás', 'serás'] },
        { prompt: 'En el futuro... (tener, hacer)', expected: ['tendré', 'haré', 'tendrás', 'harás'] },
    ],
  },
  pretPerf: {
    type: 'timeline',
    title: 'Lo que he hecho hoy',
    events: [
      { time: '8:00', icon: '🌅', prompt: 'levantarse temprano' },
      { time: '10:00', icon: '☕️', prompt: 'desayunar bien' },
      { time: '14:00', icon: '💻', prompt: 'trabajar en el proyecto' },
      { time: '19:00', icon: '👥', prompt: 'quedar con amigos' },
    ],
    expectedVerbs: ['me he levantado', 'he desayunado', 'he trabajado', 'he quedado'],
  },
  cond: {
    type: 'prompts',
    title: 'Situaciones hipotéticas',
    prompts: [
        { prompt: 'Si tuviera mucho dinero... (comprar, viajar)', expected: ['compraría', 'viajaría'] },
        { prompt: 'Si fuera invisible por un día... (hacer, ir)', expected: ['haría', 'iría'] },
        { prompt: 'Si pudiera cambiar algo del mundo... (cambiar, mejorar)', expected: ['cambiaría', 'mejoraría'] },
        { prompt: 'En tu lugar yo... (decir, hacer)', expected: ['diría', 'haría'] },
    ],
  },
};

function MeaningfulPractice({ tense, eligibleForms, onBack, onPhaseComplete }) {
  const [story, setStory] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create a dummy currentItem for progress tracking
  const currentItem = {
    id: `meaningful-practice-${tense?.tense}`,
    lemma: 'meaningful-practice',
    tense: tense?.tense,
    mood: tense?.mood
  };
  
  const { handleResult } = useProgressTracking(currentItem, (result) => {
    console.log('Meaningful practice progress tracking result:', result);
  });

  // Debug logging
  console.log('MeaningfulPractice received tense:', tense);
  console.log('Available exercises:', Object.keys(timelineData));
  
  const exercise = tense ? timelineData[tense.tense] : null;
  console.log('Selected exercise:', exercise);

  const handleCheckStory = async () => {
    if (!exercise || !story.trim()) return;
    
    setIsProcessing(true);
    setFeedback(null);
    
    const userText = story.toLowerCase();
    
    let missing = [];
    let foundVerbs = [];

    if (exercise.type === 'timeline') {
        exercise.expectedVerbs.forEach(verb => {
            // Normalize both texts to handle accents properly
            const normalizeText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const normalizedUser = normalizeText(userText);
            const normalizedVerb = normalizeText(verb);
            
            // Use word boundaries with normalized text
            const regex = new RegExp(`\\b${normalizedVerb.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(normalizedUser)) {
                foundVerbs.push(verb);
            } else {
                missing.push(verb);
            }
        });
    } else if (exercise.type === 'prompts') {
        exercise.prompts.forEach(p => {
            const found = p.expected.some(verb => {
                const regex = new RegExp(`\b${verb}\b`, 'i');
                if (regex.test(userText)) {
                    foundVerbs.push(verb);
                    return true;
                }
                return false;
            });
            if (!found) {
                missing.push(p.expected.join(' o '));
            }
        });
    } else if (exercise.type === 'daily_routine') {
        exercise.prompts.forEach(p => {
            const found = p.expected.some(verb => {
                // Use includes for simpler matching - check if verb appears as whole word
                const regex = new RegExp(`\\b${verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(userText)) {
                    foundVerbs.push(verb);
                    return true;
                }
                return false;
            });
            if (!found) {
                missing.push(p.expected.join(' o '));
            }
        });
    }

    const isCorrect = missing.length === 0;
    
    if (isCorrect) {
      setFeedback({ type: 'correct', message: '¡Excelente! Usaste todos los verbos necesarios.' });
      
      // Use official progress tracking system
      await handleResult({
        correct: true,
        userAnswer: story,
        correctAnswer: foundVerbs.join(', '),
        hintsUsed: 0,
        errorTags: [],
        latencyMs: 0, // Not applicable for this type of exercise
        isIrregular: false,
        itemId: currentItem.id
      });
      
      // Keep SRS scheduling for found verbs
      try {
        const userId = getCurrentUserId();
        if (userId) {
          console.log('Analytics: Updating schedule for meaningful practice...');
          for (const verbStr of foundVerbs) {
            const formObject = eligibleForms?.find(f => f.value === verbStr);
            if (formObject) {
              await updateSchedule(userId, formObject, true, 0);
              console.log(`  - Updated ${formObject.lemma} (${verbStr})`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to update SRS schedule:", error);
      }
    } else {
      setFeedback({ type: 'incorrect', message: `Faltaron algunos verbos o no están bien conjugados: ${missing.join(', ')}` });
      
      // Track incorrect attempt
      await handleResult({
        correct: false,
        userAnswer: story,
        correctAnswer: missing.join(', '),
        hintsUsed: 0,
        errorTags: ['missing_verbs'],
        latencyMs: 0,
        isIrregular: false,
        itemId: currentItem.id
      });
    }
    
    setIsProcessing(false);
  };

  if (!exercise) {
    return (
      <div className="meaningful-practice">
        <p>Ejercicio no disponible para este tiempo verbal aún.</p>
        <button onClick={onBack} className="btn-secondary">Volver</button>
      </div>
    );
  }

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <div className="drill-header-learning">
            <button onClick={onBack} className="back-btn-drill">
                <img src="/back.png" alt="Volver" className="back-icon" />
            </button>
            <h2>Práctica Significativa: {TENSE_LABELS[tense.tense]}</h2>
        </div>

        {exercise.type === 'timeline' && (
            <div className="timeline-container">
              <h3>{exercise.title}</h3>
              <div className="timeline">
                {exercise.events.map(event => (
                  <div key={event.time} className="timeline-event">
                    <span className="icon">{event.icon}</span>
                    <span className="time">{event.time}</span>
                    <span className="prompt">({event.prompt})</span>
                  </div>
                ))}
              </div>
            </div>
        )}

        {exercise.type === 'prompts' && (
            <div className="prompts-container">
                <h3>{exercise.title}</h3>
                <ul>
                    {exercise.prompts.map((p, i) => <li key={i}>{p.prompt}</li>)}
                </ul>
            </div>
        )}

        {exercise.type === 'daily_routine' && (
            <div className="daily-routine-container">
                <h3>{exercise.title}</h3>
                <p className="description">{exercise.description}</p>
                <div className="routine-prompts">
                    {exercise.prompts.map((prompt, i) => (
                        <div key={i} className="routine-prompt">
                            <span className="icon">{prompt.icon}</span>
                            <span className="text">{prompt.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <textarea
          className="story-textarea"
          placeholder="Escribe aquí tus respuestas..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />

        {feedback && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {feedback?.type === 'correct' ? (
            <button onClick={onPhaseComplete} className="btn-primary">Siguiente Fase</button>
        ) : (
            <button 
              onClick={handleCheckStory} 
              className="btn-primary"
              disabled={isProcessing || !story.trim()}
            >
              {isProcessing ? 'Revisando...' : 'Revisar Historia'}
            </button>
        )}
      </div>
    </div>
  );
}

export default MeaningfulPractice;