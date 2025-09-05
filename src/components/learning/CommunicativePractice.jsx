import React, { useState, useEffect } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import './CommunicativePractice.css';

const chatData = {
  pres: {
    title: 'Rutina diaria',
    initialMessage: '¡Hola! Me gusta conocer la rutina de las personas. ¿Qué haces normalmente durante la semana?',
    script: [
      {
        userKeywords: ['trabajo', 'estudio', 'voy', 'como', 'duermo', 'hago', 'veo', 'hablo', 'vivo', 'tengo', 'soy', 'estoy'],
        botResponse: '¡Qué interesante! ¿Y en tu tiempo libre? ¿Cómo te gusta relajarte?',
      },
      {
        userKeywords: ['leo', 'escucho', 'veo', 'juego', 'salgo', 'camino', 'cocino', 'escribo', 'practico', 'visito'],
        botResponse: '¡Me parece genial! Es importante tener actividades que nos gusten. ¡Tienes una rutina muy equilibrada!',
      },
    ],
  },
  pretIndef: {
    title: 'Charla sobre el finde',
    initialMessage: '¡Hola! ¿Qué tal tu fin de semana? ¿Hiciste algo interesante?',
    script: [
      {
        userKeywords: ['fui', 'visité', 'comí', 'vi', 'jugué', 'tuve', 'vimos', 'caminé', 'leí', 'cociné', 'hice', 'salí', 'llegué'], // Verbs in preterite
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
  impf: {
    title: 'Recordando la infancia',
    initialMessage: '¡Qué nostalgia! ¿Cómo era tu vida cuando eras pequeño? Me encanta escuchar historias de la infancia.',
    script: [
      {
        userKeywords: ['vivía', 'tenía', 'era', 'estaba', 'jugaba', 'iba', 'hacía', 'estudiaba'],
        botResponse: '¡Qué interesante! ¿Y qué era lo que más te gustaba hacer en esa época?',
      },
      {
        userKeywords: ['gustaba', 'encantaba', 'divertía', 'jugaba', 'veía', 'leía'],
        botResponse: '¡Qué bonitos recuerdos! La infancia siempre deja memorias especiales.',
      },
    ],
  },
  fut: {
    title: 'Hablando del futuro',
    initialMessage: '¡Hola! Me gusta planificar el futuro. ¿Qué planes tienes para el próximo año?',
    script: [
      {
        userKeywords: ['viajaré', 'estudiaré', 'trabajaré', 'haré', 'seré', 'tendré', 'iré'],
        botResponse: '¡Suena genial! ¿Y cómo crees que lograrás esos objetivos?',
      },
      {
        userKeywords: ['estudiaré', 'prepararé', 'practicaré', 'esforzaré', 'dedicaré'],
        botResponse: 'Me parece un plan excelente. ¡Seguro que lo conseguirás!',
      },
    ],
  },
  pretPerf: {
    title: 'Lo que has hecho hoy',
    initialMessage: '¡Hola! ¿Qué tal ha ido tu día? ¿Has hecho algo especial hoy?',
    script: [
      {
        userKeywords: ['he hecho', 'he trabajado', 'he estudiado', 'he quedado', 'he ido', 'he visto'],
        botResponse: '¡Qué productivo! ¿Y has tenido tiempo para relajarte un poco?',
      },
      {
        userKeywords: ['he descansado', 'he visto', 'he leído', 'he escuchado', 'he salido'],
        botResponse: 'Perfecto, es importante encontrar el equilibrio entre trabajo y descanso.',
      },
    ],
  },
  cond: {
    title: 'Situaciones hipotéticas',
    initialMessage: 'Me encantan las preguntas hipotéticas. Si fueras millonario, ¿qué harías?',
    script: [
      {
        userKeywords: ['compraría', 'viajaría', 'haría', 'ayudaría', 'donaría', 'invertiría'],
        botResponse: '¡Qué interesante! ¿Y si pudieras vivir en cualquier época de la historia?',
      },
      {
        userKeywords: ['viviría', 'sería', 'estaría', 'conocería', 'aprendería', 'experimentaría'],
        botResponse: '¡Qué respuesta tan reflexiva! Me gusta cómo piensas.',
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
      setInputValue(''); // Reset input when exercise changes
    } else {
      setMessages([]);
      setInputValue('');
      setScriptIndex(0);
      setChatEnded(false);
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
        // Normalize both texts to handle accents properly
        const normalizeText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normalizedUser = normalizeText(userText);
        const normalizedKeyword = normalizeText(kw);
        
        const regex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalizedUser)) {
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
      const hintText = tense.tense === 'pres' 
        ? `Cuéntame usando verbos en presente. Por ejemplo: "Yo trabajo en..." o "Normalmente voy a..."`
        : `Intenta usar un verbo en ${TENSE_LABELS[tense.tense]} para contarme qué pasó.`;
      const hint = { author: 'bot', text: hintText };
      newMessages.push(hint);
    }

    setMessages(newMessages);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatEnded) {
        handleSendMessage();
      } else {
        onFinish();
      }
    }
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
                    onKeyDown={handleKeyDown}
                    disabled={chatEnded}
                    autoFocus
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
