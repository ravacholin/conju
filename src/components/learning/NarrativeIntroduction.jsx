import React, { useState, useEffect } from 'react';
import { TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import './NarrativeIntroduction.css';
import { useSettings } from '../../state/settings.js';

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
      { group: '-ar', verb: 'caminar', stem: 'camin', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
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
      { group: '-ar', verb: 'jugar', stem: 'jug', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
      { group: '-er', verb: 'leer', stem: 'le', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __hablaré__ con mi jefe.', verb: 'hablaré' },
      { text: 'Pronto __haré__ mi tarea.', verb: 'haré' },
      { text: 'Después __saldré__ con mis amigos.', verb: 'saldré' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-ir', verb: 'salir', stem: 'saldr', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
    ],
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __hablaría__ con mi familia más.', verb: 'hablaría' },
      { text: 'Nosotros __haríamos__ un viaje increíble.', verb: 'haríamos' },
      { text: '¿Tú qué __dirías__ en esa situación?', verb: 'dirías' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'decir', stem: 'dir', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
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

function NarrativeIntroduction({ tense, exampleVerbs = [], onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(-1);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    if (!tense) return;
    const story = storyData[tense.tense];
    if (!story) return;

    // Start showing sentences after the deconstruction finishes (2s delay)
    const initialDelay = setTimeout(() => {
      setVisibleSentence(0); // Show first sentence
      
      const timer = setInterval(() => {
        setVisibleSentence(prev => {
          if (prev < story.sentences.length - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, 1200); // Faster between sentences

      return () => clearInterval(timer);
    }, 2000);

    return () => clearTimeout(initialDelay);
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

  const pronounsForDialect = () => {
    const arr = ['1s', settings?.useVoseo ? '2s_vos' : '2s_tu', '3s', '1p'];
    if (settings?.useVosotros) arr.push('2p_vosotros');
    arr.push('3p');
    return arr;
  };

  const getFormMapForVerb = (verbObj) => {
    if (!verbObj) return {};
    const map = {};
    const para = verbObj.paradigms?.find(p => p.forms?.some(f => f.mood === tense.mood && f.tense === tense.tense));
    if (!para) return map;
    para.forms.filter(f => f.mood === tense.mood && f.tense === tense.tense).forEach(f => { map[f.person] = f.value; });
    return map;
  };

  const detectRealStem = (verbObj, tense, mood) => {
    if (!verbObj) return null;
    const para = verbObj.paradigms?.find(p => p.forms?.some(f => f.mood === mood && f.tense === tense));
    if (!para) return null;
    
    const forms = para.forms.filter(f => f.mood === mood && f.tense === tense);
    if (forms.length === 0) return null;
    
    // For future and conditional, the stem is the infinitive for regular verbs, 
    // or an irregular stem that we need to detect
    if (tense === 'fut' || tense === 'cond') {
      const endings = ['é', 'ás', 'á', 'emos', 'éis', 'án']; // future endings
      const condEndings = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']; // conditional endings
      const expectedEndings = tense === 'fut' ? endings : condEndings;
      
      // Try to find the stem by looking for common prefix
      let candidateStem = '';
      const firstForm = forms.find(f => f.person === '1s');
      if (firstForm) {
        const value = firstForm.value;
        // Try different stem lengths
        for (let i = 1; i < value.length; i++) {
          const potentialStem = value.slice(0, i);
          
          // Check if this stem works for all forms
          const worksForAll = forms.every(form => {
            const personIndex = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'].indexOf(form.person);
            if (personIndex === -1) return true; // skip unknown persons
            const expectedEnding = expectedEndings[personIndex];
            return form.value === potentialStem + expectedEnding;
          });
          
          if (worksForAll) {
            candidateStem = potentialStem;
            break;
          }
        }
      }
      return candidateStem || verbObj.lemma; // fallback to full infinitive
    }
    
    // For other tenses, use simpler logic - remove infinitive ending
    return verbObj.lemma.slice(0, -2); // remove -ar/-er/-ir
  };

  const endingFromForm = (formValue, detectedStem, fallback) => {
    if (typeof formValue === 'string' && detectedStem && formValue.startsWith(detectedStem)) {
      return formValue.slice(detectedStem.length);
    }
    return fallback || '';
  };

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
                  {story.deconstructions?.map(({ group, stem, endings, verb }) => {
                    const pronouns = pronounsForDialect();
                    const verbObj = exampleVerbs?.find(v => v.lemma === verb);
                    const formMap = getFormMapForVerb(verbObj);
                    const realStem = detectRealStem(verbObj, tense.tense, tense.mood) || stem;
                    const dialectEndings = pronouns.map(p => {
                      const formVal = formMap[p];
                      const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
                      const base = endings?.[baseOrder.indexOf(p)] || '';
                      return endingFromForm(formVal, realStem, base);
                    });
                    return (
                      <div key={group} className="deconstruction-item">
                        <div className="verb-lemma"><span className="lemma-stem">{verb}</span><span className="group-label">{group}</span></div>
                        <div className="verb-deconstruction">
                          <span className="verb-stem">{realStem}-</span>
                          <span className="verb-endings">
                            <span className="ending-carousel">
                              {dialectEndings.map((ending, idx) => (
                                <span key={`${group}-${idx}-${ending}`} className="ending-item">{ending}</span>
                              ))}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
