import React, { useState, useEffect } from 'react';
import { TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import './NarrativeIntroduction.css';

const storyData = {
  pres: {
    title: 'La rutina de Juan',
    sentences: [
      { text: 'Todos los días, Juan __habla__ con sus amigos.', verb: 'habla' },
      { text: 'Siempre __aprende__ algo nuevo.', verb: 'aprende' },
      { text: 'Él __vive__ en el centro de la ciudad.', verb: 'vive' },
    ],
    deconstruction: { verb: 'comer', stem: 'com', endings: ['o', 'es', 'e', 'emos', 'éis', 'en'] },
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: [
      { text: 'Ayer, María __caminó__ por el parque.', verb: 'caminó' },
      { text: 'Luego, __comió__ un helado de fresa.', verb: 'comió' },
      { text: 'Finalmente, __escribió__ una carta a su abuela.', verb: 'escribió' },
    ],
    deconstruction: { verb: 'hablar', stem: 'habl', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: [
      { text: 'Cuando era niño, __jugaba__ en el parque.', verb: 'jugaba' },
      { text: 'Mi madre siempre me __leía__ un cuento.', verb: 'leía' },
      { text: 'Nosotros __vivíamos__ en una casa pequeña.', verb: 'vivíamos' },
    ],
    deconstruction: { verb: 'cantar', stem: 'cant', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __visitaré__ a mis abuelos.', verb: 'visitaré' },
      { text: 'Pronto __aprenderemos__ a programar.', verb: 'aprenderemos' },
      { text: 'La gente __vivirá__ en Marte.', verb: 'vivirá' },
    ],
    deconstruction: { verb: 'vivir', stem: 'vivir', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __viajaría__ por el mundo.', verb: 'viajaría' },
      { text: 'Nosotros __compraríamos__ una casa en la playa.', verb: 'compraríamos' },
      { text: '¿Tú qué __harías__ con un millón de dólares?', verb: 'harías' },
    ],
    deconstruction: { verb: 'hablar', stem: 'hablar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: [
      { text: 'Espero que __tengas__ un buen día.', verb: 'tengas' },
      { text: 'El doctor recomienda que __bebas__ más agua.', verb: 'bebas' },
      { text: 'Quiero que __seamos__ buenos amigos.', verb: 'seamos' },
    ],
    deconstruction: { verb: 'hablar', stem: 'habl', endings: ['e', 'es', 'e', 'emos', 'éis', 'en'] },
  },
  // Add more tenses here
};

function NarrativeIntroduction({ tense, onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(0);

  useEffect(() => {
    if (!tense) return;
    const story = storyData[tense.tense];
    if (!story) return;

    const timer = setInterval(() => {
      setVisibleSentence(prev => {
        if (prev < story.sentences.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [tense]);

  if (!tense) {
    return (
      <div className="App learn-flow">
        <div className="center-column">
          <p>No tense selected.</p>
          <button onClick={onBack} className="back-btn">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
        </div>
      </div>
    );
  }

  const story = storyData[tense.tense];
  const tenseName = TENSE_LABELS[tense.tense] || tense.tense;
  const moodName = MOOD_LABELS[tense.mood] || tense.mood;

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <div className="narrative-header">
          <button onClick={onBack} className="back-btn-narrative">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
          <h1>{tenseName}</h1>
          <p className="subtitle">{moodName}</p>
        </div>

        <div className="narrative-content">
          {story ? (
            <>
              <div className="story-placeholder">
                <h3>{story.title}</h3>
                {story.sentences.map((sentence, index) => (
                  <p 
                    key={index} 
                    className={`story-sentence ${index <= visibleSentence ? 'visible' : ''}`}
                    dangerouslySetInnerHTML={{ __html: sentence.text.replace(/__(.*)__/, '<span class="highlight">$1</span>') }}
                  />
                ))}
              </div>

              <div className="deconstruction-placeholder">
                <div className="verb-deconstruction">
                  <span className="verb-stem">{story.deconstruction.stem}-</span>
                  <span className="verb-endings">
                    <span className="ending-carousel">
                      {story.deconstruction.endings.map(ending => (
                        <span key={ending} className="ending-item">{ending}</span>
                      ))}
                    </span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="story-placeholder">
              <p>Introducción para "{tenseName}" no implementada aún.</p>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={onContinue}>¡Entendido, a practicar!</button>
      </div>
    </div>
  );
}

export default NarrativeIntroduction;