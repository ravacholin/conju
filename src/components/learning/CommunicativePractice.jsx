import React, { useState, useEffect } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import './CommunicativePractice.css';

const chatData = {
  pretIndef: {
    title: 'Charla sobre el finde',
    initialMessage: '¡Hola! ¿Qué tal tu fin de semana? ¿Hiciste algo interesante?',
    script: [
      {
        userKeywords: ['fui', 'visité', 'comí', 'vi', 'jugué'], // Verbs in preterite
        botResponse: '¡Suena genial! ¿Y con quién fuiste?',
      },
      {
        userKeywords: ['amigos', 'familia', 'novia', 'novio', 'solo'],
        botResponse: '¡Qué bueno! A mí también me gusta salir con gente. La próxima vez podríamos hacer algo.',
      },
    ],
  },
  subjPres: {
    title: 'Planeando una fiesta',
    initialMessage: '¡Hola! Estoy organizando una fiesta el sábado. Para que todo salga bien, necesito que me ayudes.',
    script: [
      {
        userKeywords: ['quieres que', 'necesitas que', 'dime qué'],
        botResponse: 'Perfecto. Sugiero que tú __traigas__ las bebidas. ¿Te parece?',
      },
      {
        userKeywords: ['traiga', 'compre', 'lleve', 'de acuerdo', 'claro'],
        botResponse: '¡Genial! Y ojalá que tus amigos __vengan__ también. ¡Será divertido!',
      },
    ],
  },
};

function CommunicativePractice({ tense, eligibleForms, onBack, onFinish }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatEnded, setChatEnded] = useState(false);
  const [scriptIndex, setScriptIndex] = useState(0);

  const exercise = tense ? chatData[tense.tense] : null;

  useEffect(() => {
    if (exercise) {
      setMessages([{ author: 'bot', text: exercise.initialMessage }]);
      setScriptIndex(0);
      setChatEnded(false);
    } else {
      setMessages([]);
    }
  }, [exercise]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !exercise) return;

    const currentScriptNode = exercise.script[scriptIndex];
    const userMessage = { author: 'user', text: inputValue };
    const newMessages = [...messages, userMessage];

    const userText = inputValue.toLowerCase();

    let keywordFound = null;
    const keywordMatched = currentScriptNode.userKeywords.some(kw => {
        const regex = new RegExp(`\b${kw}\b`, 'i');
        if (regex.test(userText)) {
            keywordFound = kw;
            return true;
        }
        return false;
    });

    if (keywordMatched) {
      // Correct keyword found, move to next bot response
      const botMessage = { author: 'bot', text: currentScriptNode.botResponse };
      newMessages.push(botMessage);

      // --- Analytics Integration ---
      if (keywordFound) {
        const formObject = eligibleForms.find(f => f.value === keywordFound);
        if (formObject) {
          try {
            const userId = getCurrentUserId();
            if (userId) {
              await updateSchedule(userId, formObject, true, 0);
              console.log(`Analytics: Updated schedule for communicative practice: ${formObject.lemma} - ${keywordFound}`);
            }
          } catch (error) {
            console.error("Failed to update SRS schedule:", error);
          }
        }
      }

      if (scriptIndex >= exercise.script.length - 1) {
        setChatEnded(true);
      } else {
        setScriptIndex(prev => prev + 1);
      }
    } else {
      // No keyword, give a hint
      const hint = { author: 'bot', text: `Intenta usar un verbo en ${TENSE_LABELS[tense.tense]} para contarme qué pasó.` };
      newMessages.push(hint);
    }

    setMessages(newMessages);
    setInputValue('');
  };

  if (!exercise) {
    return (
        <div className="center-column">
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
            <h2>Práctica Comunicativa: {TENSE_LABELS[tense.tense]}</h2>
        </div>

        <div className="chat-container">
            <div className="message-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.author}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input 
                    type="text"
                    placeholder="Escribe tu respuesta..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    disabled={chatEnded}
                />
                {chatEnded ? (
                    <button onClick={onFinish} className="btn-primary">Finalizar</button>
                ) : (
                    <button onClick={handleSendMessage}>Enviar</button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicativePractice;
