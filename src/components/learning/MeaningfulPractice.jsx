import React, { useState } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import './MeaningfulPractice.css';

const timelineData = {
  pretIndef: {
    type: 'timeline',
    title: 'El día de ayer de María',
    events: [
      { time: '7:00', icon: '☕️', prompt: 'tomar café' },
      { time: '12:00', icon: '🍽️', prompt: 'almorzar' },
      { time: '18:00', icon: '🏋️', prompt: 'ir al gimnasio' },
      { time: '22:00', icon: '🛏️', prompt: 'acostarse' },
    ],
    expectedVerbs: ['tomó', 'almorzó', 'fue', 'se acostó'],
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
};

function MeaningfulPractice({ tense, eligibleForms, onBack, onPhaseComplete }) {
  const [story, setStory] = useState('');
  const [feedback, setFeedback] = useState(null);

  const exercise = tense ? timelineData[tense.tense] : null;

  const handleCheckStory = async () => {
    if (!exercise) return;
    const userText = story.toLowerCase();
    
    let missing = [];
    let foundVerbs = [];

    if (exercise.type === 'timeline') {
        exercise.expectedVerbs.forEach(verb => {
            const regex = new RegExp(`\b${verb}\b`, 'i');
            if (regex.test(userText)) {
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
    }

    if (missing.length === 0) {
      setFeedback({ type: 'correct', message: '¡Excelente! Usaste todos los verbos necesarios.' });
      try {
        const userId = getCurrentUserId();
        if (userId) {
          console.log('Analytics: Updating schedule for meaningful practice...');
          for (const verbStr of foundVerbs) {
            const formObject = eligibleForms.find(f => f.value === verbStr);
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
    }
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
            <button onClick={handleCheckStory} className="btn-primary">Revisar Historia</button>
        )}
      </div>
    </div>
  );
}

export default MeaningfulPractice;