import React, { useState, useEffect } from 'react';
import { diffChars } from 'diff';
import { TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import { storyData } from '../../data/narrativeStories.js';
import './NarrativeIntroduction.css';
import { useSettings } from '../../state/settings.js';
// import { verbs } from '../../data/verbs.js';

// Extraer formas conjugadas reales de la base de datos
function extractRealConjugatedForms(verbObj, tense) {
  if (!verbObj || !verbObj.paradigms) return [];
  
  // Buscar paradigma correcto
  const paradigm = verbObj.paradigms.find(p => 
    p.forms?.some(f => f.mood === 'indicative' && f.tense === tense)
  );
  
  if (!paradigm || !paradigm.forms) return [];
  
  // Extraer formas para el dialecto (orden: 1s, 2s_vos, 3s, 1p, 3p)
  const persons = ['1s', '2s_vos', '3s', '1p', '3p'];
  const forms = [];
  
  persons.forEach(person => {
    const form = paradigm.forms.find(f => 
      f.mood === 'indicative' && f.tense === tense && f.person === person
    );
    
    if (form && form.value) {
      forms.push(form.value);
    } else {
      // Fallback a forma alternativa si existe
      if (person === '2s_vos') {
        const tuForm = paradigm.forms.find(f => 
          f.mood === 'indicative' && f.tense === tense && f.person === '2s_tu'
        );
        if (tuForm && tuForm.accepts && tuForm.accepts.vos) {
          forms.push(tuForm.accepts.vos);
        } else if (tuForm && tuForm.value) {
          // Si no hay forma vos específica, usar transformación morfológica en presente; si no, usar forma de tú
          if (tense === 'pres') {
            const grp = (verbObj.lemma?.endsWith('ar') ? 'ar' : verbObj.lemma?.endsWith('er') ? 'er' : 'ir');
            if (/as$/.test(tuForm.value)) forms.push(tuForm.value.replace(/as$/, 'ás'));
            else if (/es$/.test(tuForm.value)) forms.push(grp === 'ir' ? tuForm.value.replace(/es$/, 'ís') : tuForm.value.replace(/es$/, 'és'));
            else forms.push(tuForm.value);
          } else {
            forms.push(tuForm.value);
          }
        } else {
          forms.push(''); // Placeholder
        }
      } else {
        forms.push(''); // Placeholder
      }
    }
  });
  
  return forms;
}

// Get standard endings for verb group and tense
function getStandardEndings(group, tense) {
  const endings = {
    pres: {
      ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
      er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
      ir: ['o', 'es', 'e', 'imos', 'ís', 'en']
    },
    pretIndef: {
      ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron']
    },
    impf: {
      ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
      er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']
    },
    fut: {
      ar: ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      er: ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      ir: ['é', 'ás', 'á', 'emos', 'éis', 'án']
    },
    cond: {
      ar: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']
    },
    subjPres: {
      ar: ['e', 'es', 'e', 'emos', 'éis', 'en'],
      er: ['a', 'as', 'a', 'amos', 'áis', 'an'],
      ir: ['a', 'as', 'a', 'amos', 'áis', 'an']
    }
  };
  
  return endings[tense]?.[group] || endings.pres[group] || [];
}

function NarrativeIntroduction({ tense, exampleVerbs = [], onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(-1);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const settings = useSettings();

  const tenseStoryData = tense ? storyData[tense.tense] : null;

  useEffect(() => {
    if (!tenseStoryData || !exampleVerbs) return;

    const numSentences = exampleVerbs.length;

    const initialDelay = setTimeout(() => {
      setVisibleSentence(0); // Show first sentence
      
      const timer = setInterval(() => {
        setVisibleSentence(prev => {
          if (prev < numSentences - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, 1200); // Faster between sentences

      return () => clearInterval(timer);
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, [tenseStoryData, exampleVerbs]);

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
    
    if (tense === 'fut' || tense === 'cond') {
      const endings = ['é', 'ás', 'á', 'emos', 'éis', 'án']; // future endings
      const condEndings = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']; // conditional endings
      const expectedEndings = tense === 'fut' ? endings : condEndings;
      
      let candidateStem = '';
      const firstForm = forms.find(f => f.person === '1s');
      if (firstForm) {
        const value = firstForm.value;
        for (let i = 1; i < value.length; i++) {
          const potentialStem = value.slice(0, i);
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
      return candidateStem || verbObj.lemma;
    }
    
    return verbObj.lemma.slice(0, -2);
  };

  const endingFromForm = (formValue, detectedStem, fallback) => {
    if (typeof formValue === 'string' && detectedStem && formValue.startsWith(detectedStem)) {
      return formValue.slice(detectedStem.length);
    }
    return fallback || '';
  };

  const getConjugation = (verbObj, person, mood = 'indicative') => {
    if (!verbObj || !verbObj.paradigms) return '';
    const paradigm = verbObj.paradigms.find(p => p.forms?.some(f => f.mood === mood && f.tense === tense.tense));
    if (!paradigm || !paradigm.forms) return '';
    const form = paradigm.forms.find(f => f.mood === mood && f.tense === tense.tense && f.person === person);
    return form?.value || '';
  };

  // Helpers to compute expected regular forms and highlight irregular fragments
  const baseOrder = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'];
  const stripAccents = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const renderWithIrregularHighlights = (actual, expected) => {
    if (!actual || !expected) return actual;
    if (stripAccents(actual) === stripAccents(expected)) return actual;
    const parts = diffChars(expected, actual);
    const nodes = [];
    for (let idx = 0; idx < parts.length; idx++) {
      const p = parts[idx];
      if (p.added) {
        let val = p.value || '';
        // Para diptongos en presente (e→ie, o→ue): resaltar "ie" o "ue" completos
        // Si el diff marcó solo la i/u añadida y la e quedó como parte sin cambio,
        // unimos esa primera 'e' a la porción resaltada.
        const next = parts[idx + 1];
        if ((val.endsWith('i') || val.endsWith('u')) && next && !next.added && !next.removed && typeof next.value === 'string' && next.value.startsWith('e')) {
          val += 'e';
          parts[idx + 1] = { ...next, value: next.value.slice(1) };
        }
        nodes.push(<span key={idx} className="irreg-frag">{val}</span>);
      } else if (p.removed) {
        // omitimos
      } else {
        if (!p.value) continue;
        nodes.push(<span key={idx}>{p.value}</span>);
      }
    }
    return nodes;
  };
  const expectedRegularForms = (verbObj) => {
    if (!verbObj) return [];
    const persons = ['1s', '2s_vos', '3s', '1p', '3p'];
    const lemma = verbObj.lemma || '';
    const group = lemma.endsWith('ar') ? 'ar' : lemma.endsWith('er') ? 'er' : 'ir';
    const endings = getStandardEndings(group, tense.tense) || [];
    const stem = (tense.tense === 'fut' || tense.tense === 'cond') ? lemma : lemma.slice(0, -2);
    return persons.map((p) => {
      const key = p === '2s_vos' ? '2s_tu' : p;
      const idx = baseOrder.indexOf(key);
      let ending = idx >= 0 ? endings[idx] : '';
      if (p === '2s_vos' && tense.mood === 'indicative' && tense.tense === 'pres') {
        if (group === 'ar' && ending === 'as') ending = 'ás';
        else if (group === 'er' && ending === 'es') ending = 'és';
        else if (group === 'ir' && ending === 'es') ending = 'ís';
      }
      return `${stem}${ending || ''}`;
    });
  };

  const renderStorySentences = () => {
    if (!tenseStoryData || !exampleVerbs || exampleVerbs.length < 3) return null;

    const sentences = exampleVerbs.map((verbObj, index) => {
      const verbEnding = verbObj.lemma.slice(-2);
      const sentenceTemplate = (tenseStoryData.verbSpecific && tenseStoryData.verbSpecific[verbObj.lemma]) || tenseStoryData.sentences[verbEnding] || tenseStoryData.sentences.ar;
      // Elegir persona según el texto de la narrativa (si comienza con "Yo", usar 1s; si "Nosotros", usar 1p; si no, 3s)
      const personHint = /^\s*["'“‘(\[¡¿-]*Yo\b/i.test(sentenceTemplate)
        ? '1s'
        : (/^\s*["'“‘(\[¡¿-]*Nosotros\b/i.test(sentenceTemplate) ? '1p' : '3s')
      const conjugation = getConjugation(verbObj, personHint);
      // Capitalizar si el verbo inicia la oración (posiblemente tras signos de apertura)
      const startsWithVerb = /^[\s\"'“‘(\[¡¿-]*__VERB__/.test(sentenceTemplate);
      const conjDisplay = startsWithVerb && typeof conjugation === 'string' && conjugation.length
        ? conjugation.charAt(0).toUpperCase() + conjugation.slice(1)
        : conjugation;
      const filledSentence = sentenceTemplate.replace(/__VERB__/, `<span class="highlight">${conjDisplay}</span>`);
      return (
        <p 
          key={index} 
          className={`story-sentence ${index <= visibleSentence ? 'visible' : ''}`}
          dangerouslySetInnerHTML={{ __html: filledSentence }}
        />
      );
    });

    return sentences;
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
          {tenseStoryData ? (
            <>
              <div className="story-placeholder">
                <h3>{tenseStoryData.title}</h3>
                {renderStorySentences()}
              </div>

              <div className="deconstruction-placeholder">
                <div className="deconstruction-list">
                  {exampleVerbs && exampleVerbs.length > 0 && exampleVerbs.map((verbObj, index) => {
                    const pronouns = pronounsForDialect();
                    const verb = verbObj.lemma;
                    const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir';
                    const lemmaStem = (v) => {
                      if (typeof v !== 'string') return '';
                      if (v.endsWith('ar') || v.endsWith('er') || v.endsWith('ir')) {
                        return v.slice(0, -2);
                      }
                      return v;
                    };
                    
                    const isIrregular = verbObj.type === 'irregular';
                    const realForms = extractRealConjugatedForms(verbObj, tense.tense);
                    
                    if (isIrregular && realForms && realForms.length > 0) {
                      const expectedForms = expectedRegularForms(verbObj);
                      return (
                        <div key={`${group}-${index}`} className="deconstruction-item">
                          <div className="verb-lemma"><span className="lemma-stem">{lemmaStem(verb)}</span><span className="group-label">{group}</span></div>
                          <div className="verb-deconstruction irregular">
                            <span className="irregular-forms">
                              {realForms.map((form, idx) => (
                                <span key={`${group}-${idx}-${form}`} className="conjugated-form">
                                  {renderWithIrregularHighlights(form, expectedForms[idx] || '')}
                                  {idx < realForms.length - 1 && <span className="form-separator"> • </span>}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    const formMap = getFormMapForVerb(verbObj);
                    const realStem = detectRealStem(verbObj, tense.tense, tense.mood) || lemmaStem(verb);
                    const standardEndings = getStandardEndings(group.slice(-2), tense.tense);
                    
                    const dialectEndings = pronouns.map(p => {
                      const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
                      const grp = group.slice(-2);
                      const key = p === '2s_vos' ? '2s_tu' : p;
                      let base = standardEndings?.[baseOrder.indexOf(key)] || '';
                      
                      if (p === '2s_vos' && tense.mood === 'indicative' && tense.tense === 'pres') {
                        if (grp === 'ar' && base === 'as') base = 'ás';
                        else if (grp === 'er' && base === 'es') base = 'és';
                        else if (grp === 'ir' && base === 'es') base = 'ís';
                      }
                      
                      if (base) return base;
                      
                      const formVal = formMap[p];
                      return endingFromForm(formVal, realStem, base);
                    });
                    
                    return (
                      <div key={`${group}-${index}`} className="deconstruction-item">
                        <div className="verb-lemma"><span className="lemma-stem">{lemmaStem(verb)}</span><span className="group-label">{group}</span></div>
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
          Continuar
        </button>
      </div>
    </div>
  );
}

export default NarrativeIntroduction;
