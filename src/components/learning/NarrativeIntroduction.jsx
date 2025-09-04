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
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['o', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-er', verb: 'aprender', stem: 'aprend', endings: ['o', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
    ],
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: [
      { text: 'Ayer, María __caminó__ por el parque.', verb: 'caminó' },
      { text: 'Luego, __comió__ un helado de fresa.', verb: 'comió' },
      { text: 'Finalmente, __escribió__ una carta a su abuela.', verb: 'escribió' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
      { group: '-er', verb: 'comer', stem: 'com', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
      { group: '-ir', verb: 'escribir', stem: 'escrib', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
    ],
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: [
      { text: 'Cuando era niño, __jugaba__ en el parque.', verb: 'jugaba' },
      { text: 'Mi madre siempre me __leía__ un cuento.', verb: 'leía' },
      { text: 'Nosotros __vivíamos__ en una casa pequeña.', verb: 'vivíamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'cantar', stem: 'cant', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
      { group: '-er', verb: 'leer', stem: 'le', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __visitaré__ a mis abuelos.', verb: 'visitaré' },
      { text: 'Pronto __aprenderemos__ a programar.', verb: 'aprenderemos' },
      { text: 'La gente __vivirá__ en Marte.', verb: 'vivirá' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'visitar', stem: 'visitar', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-er', verb: 'aprender', stem: 'aprender', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-ir', verb: 'vivir', stem: 'vivir', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
    ],
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __viajaría__ por el mundo.', verb: 'viajaría' },
      { text: 'Nosotros __compraríamos__ una casa en la playa.', verb: 'compraríamos' },
      { text: '¿Tú qué __harías__ con un millón de dólares?', verb: 'harías' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'viajar', stem: 'viajar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-er', verb: 'comer', stem: 'comer', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'vivir', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: [
      { text: 'Espero que __tengas__ un buen día.', verb: 'tengas' },
      { text: 'El doctor recomienda que __bebas__ más agua.', verb: 'bebas' },
      { text: 'Quiero que __seamos__ buenos amigos.', verb: 'seamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['e', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-er', verb: 'beber', stem: 'beb', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
    ],
  },
  // Add more tenses here
};

function NarrativeIntroduction({ tense, onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(0);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  useEffect(() => {
    // trigger enter animation on mount
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleAnimatedContinue = () => {
    // play leave animation then continue
    setLeaving(true);
    setTimeout(() => {
      onContinue && onContinue();
    }, 350);
  };

  const handleAnimatedBack = () => {
    setLeaving(true);
    setTimeout(() => {
      onBack && onBack();
    }, 300);
  };

  if (!tense) {
    return (
      <div className="App learn-flow">
        <div className="center-column">
          <p>No tense selected.</p>
          <button onClick={handleAnimatedBack} className="back-btn">
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
    <div className="App">
      <div className="onboarding learn-flow narrative-intro">
        <div className="narrative-header">
          <button onClick={onBack} className="back-btn">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
          <h1>{tenseName}</h1>
          <p className="subtitle">{moodName}</p>
        </div>

        <div className={`narrative-content page-transition ${entered ? 'page-in' : ''} ${leaving ? 'page-out' : ''}`}>
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
                <div className="deconstruction-list">
                  {story.deconstructions?.map(({ group, stem, endings }) => (
                    <div key={group} className="deconstruction-item">
                      <div className="verb-lemma"><span className="lemma-stem">{stem}</span><span className="group-label">{group}</span></div>
                      <div className="verb-deconstruction">
                        <span className="verb-stem">{stem}-</span>
                        <span className="verb-endings">
                          <span className="ending-carousel">
                            {endings.map(ending => (
                              <span key={ending} className="ending-item">{ending}</span>
                            ))}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="story-placeholder">
              <p>Introducción para "{tenseName}" no implementada aún.</p>
            </div>
          )}
        </div>

        <button className="btn" onClick={handleAnimatedContinue}>
          <img src="/play.png" alt="Comenzar" className="play-icon" />
          ¡Entendido, a practicar!
        </button>
      </div>
    </div>
  );
}

export default NarrativeIntroduction;
