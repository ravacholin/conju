import React, { useState, useEffect } from 'react';
import { diffChars } from 'diff';
import { formatMoodTense, TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import { storyData } from '../../data/narrativeStories.js';
import {
  FUTURE_CONDITIONAL_ROOTS,
  IRREGULAR_GERUNDS,
  IRREGULAR_PARTICIPLES,
  FUTURE_ENDINGS,
  CONDITIONAL_ENDINGS,
  buildFutureConditionalForm,
  getPronounLabel
} from '../../lib/data/irregularPatterns.js';
import { SafeTemplate } from '../../lib/utils/htmlSanitizer.jsx';
import './NarrativeIntroduction.css';
import { useSettings } from '../../state/settings.js';
import { LEARNING_IRREGULAR_FAMILIES } from '../../lib/data/learningIrregularFamilies.js';

// Extraer formas conjugadas reales de la base de datos
function extractRealConjugatedForms(verbObj, tense, mood = 'indicative') {
  if (!verbObj || !verbObj.paradigms) {
    return []
  }

  // Buscar paradigma correcto
  const paradigm = verbObj.paradigms.find(p =>
    p.forms?.some(f => f.mood === mood && f.tense === tense)
  );


  if (!paradigm || !paradigm.forms) return [];
  
  // Extraer formas para el dialecto (orden: 1s, 2s_vos, 3s, 1p, 3p)
  const persons = ['1s', '2s_vos', '3s', '1p', '3p'];
  const forms = [];
  
  persons.forEach(person => {
    const form = paradigm.forms.find(f =>
      f.mood === mood && f.tense === tense && f.person === person
    );
    
    if (form && form.value) {
      forms.push(form.value);
    } else {
      // Fallback a forma alternativa si existe
      if (person === '2s_vos') {
        const tuForm = paradigm.forms.find(f =>
          f.mood === mood && f.tense === tense && f.person === '2s_tu'
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

// Mapeo de raíces irregulares para pretéritos fuertes (verbos muy irregulares)
const STRONG_PRETERITE_STEMS = {
  // Familia tuv-
  'tener': 'tuv',
  'obtener': 'obtuv',
  'mantener': 'mantuv',
  'contener': 'contuv',
  'sostener': 'sostuv',
  'retener': 'retuv',

  // Familia estuv-
  'estar': 'estuv',
  'andar': 'anduv',

  // Familia hic-/hiz-
  'hacer': 'hic', // hice, hiciste, hizo (alternancia c/z)
  'satisfacer': 'satisfic',
  'deshacer': 'deshic',
  'rehacer': 'rehic',

  // Familia quis-
  'querer': 'quis',

  // Familia pud-
  'poder': 'pud',

  // Familia pus-
  'poner': 'pus',
  'componer': 'compus',
  'proponer': 'propus',
  'disponer': 'dispus',
  'exponer': 'expus',
  'suponer': 'supus',
  'reponer': 'repus',

  // Familia vin-
  'venir': 'vin',
  'prevenir': 'previn',
  'convenir': 'convin',
  'intervenir': 'intervin',

  // Familia sup-
  'saber': 'sup',

  // Familia cup-
  'caber': 'cup',

  // Familia hub-
  'haber': 'hub',

  // Familia dij-
  'decir': 'dij',
  'predecir': 'predij',
  'contradecir': 'contradij',

  // Familia traj-
  'traer': 'traj',
  'atraer': 'atraj',
  'contraer': 'contraj',
  'distraer': 'distraj',

  // Familia -duc- (verbos en -ducir)
  'conducir': 'conduj',
  'producir': 'produj',
  'traducir': 'traduj',
  'reducir': 'reduj',
  'introducir': 'introduj',
  'deducir': 'deduj',
  'seducir': 'seduj',
  'reproducir': 'reproduj'
};

// Terminaciones fuertes especiales (sin acentos)
const STRONG_PRETERITE_ENDINGS = ['e', 'iste', 'o', 'imos', 'isteis', 'ieron'];

const FUTURE_ROOT_MAP = new Map(FUTURE_CONDITIONAL_ROOTS.map(item => [item.lemma, item.root]));
const GERUND_MAP = new Map(IRREGULAR_GERUNDS.map(item => [item.lemma, item.form]));
const PARTICIPLE_MAP = new Map(IRREGULAR_PARTICIPLES.map(item => [item.lemma, item.form]));

// Función para detectar si un verbo es un pretérito fuerte (muy irregular)
function isStrongPreterite(verbObj, tense) {
  return tense.mood === 'indicativo' &&
         tense.tense === 'pretIndef' &&
         Object.prototype.hasOwnProperty.call(STRONG_PRETERITE_STEMS, verbObj.lemma);
}

// Función para obtener la raíz irregular del pretérito fuerte
function getIrregularStem(lemma) {
  return STRONG_PRETERITE_STEMS[lemma] || null;
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
    },
    subjImpf: {
      ar: ['ara', 'aras', 'ara', 'áramos', 'arais', 'aran'],
      er: ['iera', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran'],
      ir: ['iera', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran']
    }
  };
  
  return endings[tense]?.[group] || endings.pres[group] || [];
}

// Función para renderizar verbos irregulares solo en terceras personas
function renderThirdPersonIrregularDeconstruction(exampleVerbs, settings) {
  const thirdPersonIrregularVerbs = exampleVerbs.filter(verbObj => {
    // Fallback directo para los verbos más comunes de 3ª persona irregular
    const thirdPersonVerbs = ['pedir', 'dormir', 'leer', 'servir', 'sentir', 'morir', 'seguir', 'repetir', 'preferir', 'mentir', 'vestir', 'construir', 'destruir', 'incluir', 'concluir', 'influir', 'huir', 'creer', 'caer', 'traer', 'oír'];
    return thirdPersonVerbs.includes(verbObj.lemma);
  });

  if (thirdPersonIrregularVerbs.length === 0) return null;

  // Función para extraer el cambio de raíz en 3ª persona
  const getStemChange = (verbObj) => {
    const verb = verbObj.lemma;
    const normalStem = verb.slice(0, -2);

    const paradigm = verbObj.paradigms?.[0];
    const pretForms = paradigm?.forms?.filter(f => f.mood === 'indicative' && f.tense === 'pretIndef') || [];
    const thirdSing = pretForms.find(f => f.person === '3s')?.value || '';
    const thirdPlur = pretForms.find(f => f.person === '3p')?.value || '';

    // Determinar terminaciones esperadas
    let expectedEnd3s, expectedEnd3p;
    if (verb.endsWith('ar')) {
      expectedEnd3s = 'ó'; expectedEnd3p = 'aron';
    } else {
      expectedEnd3s = 'ió'; expectedEnd3p = 'ieron';
    }

    // Extraer raíz irregular quitando la terminación
    const irregularStem3s = thirdSing.replace(new RegExp(expectedEnd3s + '$'), '');

    return {
      normalStem,
      irregularStem: irregularStem3s, // usar 3s como referencia
      thirdSing,
      thirdPlur,
      expectedEnd3s,
      expectedEnd3p
    };
  };

  // Obtener terminaciones regulares según dialecto (1s, 2s, 1p, [2p])
  const getRegularEndings = () => {
    const baseEndings = ['í', 'iste', 'imos'];
    if (settings?.useVosotros && !settings?.useVoseo) {
      return ['í', 'iste', 'imos', 'isteis'];
    }
    return baseEndings;
  };

  const regularEndings = getRegularEndings();

  return (
    <div className="deconstruction-item third-person-irregular-group">
      <div className="third-person-verbs-container">
        {thirdPersonIrregularVerbs
          .sort((a, b) => {
            // Ordenar por terminación: -ar, -er, -ir
            const getEndingOrder = (verb) => {
              if (verb.lemma.endsWith('ar')) return 0;
              if (verb.lemma.endsWith('er')) return 1;
              if (verb.lemma.endsWith('ir')) return 2;
              return 3;
            };
            return getEndingOrder(a) - getEndingOrder(b);
          })
          .map((verbObj, index) => {
          const verb = verbObj.lemma;
          const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir';

          return (
            <div key={`third-${index}`} className="third-person-verb-item">
              <div className="verb-lemma-large">
                <span className="lemma-stem-large">{verb.slice(0, -2)}</span>
                <span className="group-label-large">{group}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de formas regulares - con raíz normal */}
      <div className="regular-forms-section">
        <div className="regular-forms-title">1ª y 2ª persona (raíz normal)</div>
        <div className="regular-forms-display">
          <div className="verb-stem">
            <span className="stem-base">raíz</span>
          </div>
          <span className="plus-symbol">+</span>
          <div className="ending-carousel">
            {regularEndings.map((ending, index) => (
              <div key={`regular-${index}`} className="regular-ending-item">
                {ending}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de formas irregulares - mostrando cambio de raíz en 3ª persona */}
      <div className="irregular-forms-section">
        <div className="irregular-forms-title">3ª persona (raíz cambia)</div>
        <div className="irregular-forms-display">
          {thirdPersonIrregularVerbs
            .sort((a, b) => {
              // Ordenar por terminación: -ar, -er, -ir
              const getEndingOrder = (verb) => {
                if (verb.lemma.endsWith('ar')) return 0;
                if (verb.lemma.endsWith('er')) return 1;
                if (verb.lemma.endsWith('ir')) return 2;
                return 3;
              };
              return getEndingOrder(a) - getEndingOrder(b);
            })
            .slice(0, 3).map((verbObj, index) => {
            const changes = getStemChange(verbObj);

            return (
              <div key={`irreg-${index}`} className="irregular-stem-comparison">
                <div className="stem-change-display">
                  <span className="normal-stem">{changes.normalStem}</span>
                  <span className="arrow">→</span>
                  <span className="irregular-stem-highlight">{changes.irregularStem}</span>
                </div>
                <div className="resulting-forms">
                  <span className="irregular-form">{changes.thirdSing}</span>
                  <span className="irregular-form">{changes.thirdPlur}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderFutureRootDeconstruction(exampleVerbs, tense, settings) {
  if (!tense || !['fut', 'cond'].includes(tense.tense)) {
    return null
  }

  const relevant = FUTURE_CONDITIONAL_ROOTS

  if (relevant.length === 0) return null

  const isConditional = tense.tense === 'cond'
  const endingsSource = isConditional ? CONDITIONAL_ENDINGS : FUTURE_ENDINGS
  const pronounOrder = [
    '1s',
    settings?.useVoseo ? '2s_vos' : '2s_tu',
    '3s',
    '1p',
    (!settings?.useVoseo && settings?.useVosotros) ? '2p_vosotros' : null,
    '3p'
  ].filter(Boolean)

  const endingsList = pronounOrder.map(pronoun => endingsSource[pronoun] || '')
  const samplePronoun = settings?.useVoseo ? '2s_vos' : '1s'

  return (
    <div className="deconstruction-item future-root-group">
      <div className="future-root-verbs">
        {relevant.map((item, index) => {
          const { lemma, root } = item
          return (
            <div key={`future-root-${index}`} className="future-root-item">
              <span className="lemma-stem-large">{lemma}</span>
              <span className="arrow">→</span>
              <span className="future-root-highlight">{root}-</span>
              <span className="future-root-example">
                {getPronounLabel(samplePronoun, settings?.useVoseo)}{' '}
                {buildFutureConditionalForm(root || lemma, tense.tense, samplePronoun)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="root-endings">
        <div className="root-endings-title">Terminaciones regulares ({isConditional ? 'condicional' : 'futuro'})</div>
        <div className="ending-carousel">
          {endingsList.map((ending, idx) => (
            <div key={`future-ending-${idx}`} className="regular-ending-item">{ending}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderRegularFutureConditionalDeconstruction(exampleVerbs, tense, settings) {
  if (!tense || !['fut', 'cond'].includes(tense.tense)) {
    return null
  }

  const regularVerbs = exampleVerbs.filter(verbObj => verbObj.type === 'regular')
  if (regularVerbs.length === 0) return null

  const isConditional = tense.tense === 'cond'
  const endingsSource = isConditional ? CONDITIONAL_ENDINGS : FUTURE_ENDINGS
  const pronounOrder = [
    '1s',
    settings?.useVoseo ? '2s_vos' : '2s_tu',
    '3s',
    '1p',
    (!settings?.useVoseo && settings?.useVosotros) ? '2p_vosotros' : null,
    '3p'
  ].filter(Boolean)

  const endingsList = pronounOrder.map(pronoun => endingsSource[pronoun] || '')

  return (
    <div className="deconstruction-item future-root-group">
      <div className="future-root-verbs">
        {regularVerbs
          .sort((a, b) => {
            // Ordenar por terminación: -ar, -er, -ir
            const getEndingOrder = (verb) => {
              if (verb.lemma.endsWith('ar')) return 0;
              if (verb.lemma.endsWith('er')) return 1;
              if (verb.lemma.endsWith('ir')) return 2;
              return 3;
            };
            return getEndingOrder(a) - getEndingOrder(b);
          })
          .map((verbObj, index) => {
          const verb = verbObj.lemma
          const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir'

          return (
            <div key={`regular-verb-${index}`} className="future-root-item">
              <span className="lemma-stem-large">{verb.slice(0, -2)}</span>
              <span className="group-label-large">{group}</span>
              <span className="arrow">→</span>
              <span className="future-root-highlight">{verb}-</span>
            </div>
          )
        })}
      </div>

      <div className="root-endings">
        <div className="root-endings-title">Terminaciones regulares ({isConditional ? 'condicional' : 'futuro'})</div>
        <div className="ending-carousel">
          {endingsList.map((ending, idx) => (
            <div key={`regular-ending-${idx}`} className="regular-ending-item">{ending}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderNonFiniteIrregularDeconstruction(exampleVerbs, tense) {
  if (!tense || !['ger', 'part'].includes(tense.tense)) {
    return null
  }

  const map = tense.tense === 'ger' ? GERUND_MAP : PARTICIPLE_MAP
  const relevant = (tense.tense === 'ger' ? IRREGULAR_GERUNDS : IRREGULAR_PARTICIPLES)
  if (relevant.length === 0) return null

  const title = tense.tense === 'ger' ? 'Gerundios irregulares más usados' : 'Participios irregulares esenciales'

  return (
    <div className="deconstruction-item nonfinite-irregular-group">
      <div className="nonfinite-title">{title}</div>
      <div className="nonfinite-grid">
        {relevant.map((item, index) => (
          <div key={`nonfinite-${index}`} className="nonfinite-item">
            <span className="lemma-stem-large">{item.lemma}</span>
            <span className="arrow">→</span>
            <span className="nonfinite-highlight">{map.get(item.lemma)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderRegularNonFiniteDeconstruction(exampleVerbs, tense, settings) {
  if (!tense || !['ger', 'part'].includes(tense.tense)) {
    return null
  }

  const regularVerbs = exampleVerbs.filter(verbObj => verbObj.type === 'regular')
  if (regularVerbs.length === 0) return null

  const isGerund = tense.tense === 'ger'
  const title = isGerund ? 'Formación regular de gerundios' : 'Formación regular de participios'

  // Terminaciones regulares
  const getRegularEnding = (verb) => {
    if (isGerund) {
      return verb.endsWith('ar') ? 'ando' : 'iendo'
    } else {
      return verb.endsWith('ar') ? 'ado' : 'ido'
    }
  }

  return (
    <div className="deconstruction-item future-root-group">
      <div className="future-root-verbs">
        {regularVerbs
          .sort((a, b) => {
            // Ordenar por terminación: -ar, -er, -ir
            const getEndingOrder = (verb) => {
              if (verb.lemma.endsWith('ar')) return 0;
              if (verb.lemma.endsWith('er')) return 1;
              if (verb.lemma.endsWith('ir')) return 2;
              return 3;
            };
            return getEndingOrder(a) - getEndingOrder(b);
          })
          .map((verbObj, index) => {
          const verb = verbObj.lemma
          const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir'
          const stem = verb.slice(0, -2)
          const ending = getRegularEnding(verb)

          return (
            <div key={`regular-nonfinite-${index}`} className="future-root-item">
              <span className="lemma-stem-large">{stem}</span>
              <span className="group-label-large">{group}</span>
              <span className="arrow">→</span>
              <span className="future-root-highlight">{stem + ending}</span>
            </div>
          )
        })}
      </div>

      <div className="root-endings">
        <div className="root-endings-title">{title}</div>
        <div className="formation-formula">
          <span className="infinitive-part">raíz</span>
          <span className="plus-symbol">+</span>
          <div className="ending-carousel">
            <div className="regular-ending-item">{isGerund ? 'ando / iendo' : 'ado / ido'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Función para renderizar verbos irregulares en YO (presente) mostrando la forma conjugada en YO
function renderIrregularYoDeconstruction(exampleVerbs, tense, settings) {
  if (!tense || tense.tense !== 'pres' || tense.mood !== 'indicativo') {
    return null;
  }

  // Verificar si al menos un verbo tiene irregularidad en yo (termina en -go o -zco)
  const hasYoIrregular = exampleVerbs.some(verbObj => {
    if (!verbObj?.paradigms) return false;
    const paradigm = verbObj.paradigms.find(p =>
      p.forms?.some(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s')
    );
    if (!paradigm) return false;
    const yoForm = paradigm.forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s');
    if (!yoForm?.value) return false;
    // Detectar si es irregular en yo (-go o -zco)
    return yoForm.value.endsWith('go') || yoForm.value.endsWith('zco');
  });

  if (!hasYoIrregular) return null;

  // Obtener terminaciones según dialecto
  const getDialectEndings = () => {
    const baseEndings = ['o', 'es', 'e', 'emos', 'éis', 'en'];

    // Si usa voseo, no mostrar vosotros
    if (settings?.useVoseo) {
      return ['o', 'és/ís', 'e', 'emos', 'en']; // voseo forms
    }

    // Si no usa vosotros, no mostrarlo
    if (!settings?.useVosotros) {
      return ['o', 'es', 'e', 'emos', 'en']; // sin vosotros
    }

    return baseEndings; // mostrar todas incluyendo vosotros
  };

  const dialectEndings = getDialectEndings();

  return (
    <div className="deconstruction-item strong-preterite-group">
      <div className="strong-verbs-container">
        {exampleVerbs
          .sort((a, b) => {
            // Ordenar por terminación: -ar, -er, -ir
            const getEndingOrder = (verb) => {
              if (verb.lemma.endsWith('ar')) return 0;
              if (verb.lemma.endsWith('er')) return 1;
              if (verb.lemma.endsWith('ir')) return 2;
              return 3;
            };
            return getEndingOrder(a) - getEndingOrder(b);
          })
          .map((verbObj, index) => {
          const verb = verbObj.lemma;
          const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir';

          // Obtener la forma YO conjugada
          const paradigm = verbObj.paradigms?.find(p =>
            p.forms?.some(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s')
          );
          const yoForm = paradigm?.forms?.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s');
          const yoValue = yoForm?.value || verb;

          return (
            <div key={`yo-irregular-${index}`} className="strong-verb-item">
              <div className="verb-lemma-large">
                <span className="lemma-stem-large">{verb.slice(0, -2)}</span>
                <span className="group-label-large">{group}</span>
              </div>
              <div className="arrow">→</div>
              <div className="irregular-stem-large">{yoValue}</div>
            </div>
          );
        })}
      </div>

      <div className="plus-symbol">+</div>

      <div className="strong-endings-carousel">
        {dialectEndings.map((ending, idx) => (
          <span key={`ending-${idx}`} className="strong-ending-item">
            {ending}
          </span>
        ))}
      </div>
    </div>
  );
}

// Función para renderizar la deconstrucción especial de pretéritos fuertes agrupados
function renderStrongPreteriteDeconstruction(exampleVerbs, settings) {
  const strongVerbs = exampleVerbs.filter(verbObj =>
    Object.prototype.hasOwnProperty.call(STRONG_PRETERITE_STEMS, verbObj.lemma)
  );

  if (strongVerbs.length === 0) return null;

  // Obtener terminaciones según dialecto
  const getDialectEndings = () => {
    const baseEndings = ['e', 'iste', 'o', 'imos', 'isteis', 'ieron'];

    // Si usa voseo, no mostrar vosotros
    if (settings?.useVoseo) {
      return ['e', 'iste', 'o', 'imos', 'ieron']; // sin vosotros
    }

    // Si no usa vosotros, no mostrarlo
    if (!settings?.useVosotros) {
      return ['e', 'iste', 'o', 'imos', 'ieron']; // sin vosotros
    }

    return baseEndings; // mostrar todas incluyendo vosotros
  };

  const dialectEndings = getDialectEndings();

  return (
    <div className="deconstruction-item strong-preterite-group">
      <div className="strong-verbs-container">
        {strongVerbs
          .sort((a, b) => {
            // Ordenar por terminación: -ar, -er, -ir
            const getEndingOrder = (verb) => {
              if (verb.lemma.endsWith('ar')) return 0;
              if (verb.lemma.endsWith('er')) return 1;
              if (verb.lemma.endsWith('ir')) return 2;
              return 3;
            };
            return getEndingOrder(a) - getEndingOrder(b);
          })
          .map((verbObj, index) => {
          const verb = verbObj.lemma;
          const group = verb.endsWith('ar') ? '-ar' : verb.endsWith('er') ? '-er' : '-ir';
          const irregularStem = getIrregularStem(verb);

          return (
            <div key={`strong-verb-${index}`} className="strong-verb-item">
              <div className="verb-lemma-large">
                <span className="lemma-stem-large">{verb.slice(0, -2)}</span>
                <span className="group-label-large">{group}</span>
              </div>
              <div className="arrow">→</div>
              <div className="irregular-stem-large">{irregularStem}-</div>
            </div>
          );
        })}
      </div>

      <div className="plus-symbol">+</div>

      <div className="strong-endings-carousel">
        {dialectEndings.map((ending, idx) => (
          <span key={`ending-${idx}`} className="strong-ending-item">
            {ending}
          </span>
        ))}
      </div>
    </div>
  );
}

function NarrativeIntroduction({ tense, exampleVerbs = [], onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(-1);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const settings = useSettings();

  // Determinar si tenemos verbos regulares o irregulares
  const hasRegularVerbs = exampleVerbs && exampleVerbs.some(verbObj => verbObj.type === 'regular')
  const hasIrregularVerbs = exampleVerbs && exampleVerbs.some(verbObj => verbObj.type === 'irregular')

  // Para tiempos con narrativas diferenciadas, seleccionar la apropiada
  const getTenseStoryData = () => {
    if (!tense) return null

    const baseStoryData = storyData[tense.tense]
    if (!baseStoryData) return null

    // Si tiene estructura diferenciada (futuro, condicional, gerundio, participio)
    if (['fut', 'cond', 'ger', 'part'].includes(tense.tense) && baseStoryData.regularStory && baseStoryData.irregularStory) {
      // Si solo tenemos verbos regulares, usar narrativa regular
      if (hasRegularVerbs && !hasIrregularVerbs) {
        return baseStoryData.regularStory
      }
      // Si solo tenemos verbos irregulares, usar narrativa irregular
      if (hasIrregularVerbs && !hasRegularVerbs) {
        return baseStoryData.irregularStory
      }
      // Si tenemos mezcla, priorizar irregulares (comportamiento actual)
      if (hasIrregularVerbs) {
        return baseStoryData.irregularStory
      }
      // Fallback a regulares si no hay irregulares
      return baseStoryData.regularStory
    }

    // Para otros tiempos, usar estructura normal
    return baseStoryData
  }

  const tenseStoryData = getTenseStoryData()

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

  const tenseName = formatMoodTense(tense.mood, tense.tense) || TENSE_LABELS[tense.tense] || tense.tense;
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
    if (!verbObj || !verbObj.paradigms) {
      return verbObj?.lemma || '';
    }

    // Para gerundios y participios, generar la forma regular si no existe
    if (tense.tense === 'ger' || tense.tense === 'part') {
      // Primero buscar en los datos
      const paradigm = verbObj.paradigms.find(p => p.forms?.some(f => f.mood === 'nonfinite' && f.tense === tense.tense));
      if (paradigm && paradigm.forms) {
        const form = paradigm.forms.find(f => f.mood === 'nonfinite' && f.tense === tense.tense);
        if (form?.value) return form.value;
      }

      // Si no encontramos forma específica, generar forma regular
      const verb = verbObj.lemma;
      const stem = verb.slice(0, -2);
      if (tense.tense === 'ger') {
        return verb.endsWith('ar') ? stem + 'ando' : stem + 'iendo';
      } else if (tense.tense === 'part') {
        return verb.endsWith('ar') ? stem + 'ado' : stem + 'ido';
      }
    }

    // Mapear nombres de español a inglés porque los datos están en inglés
    const moodMap = {
      'indicativo': 'indicative',
      'subjuntivo': 'subjunctive',
      'imperativo': 'imperative',
      'condicional': 'conditional',
      'nonfinite': 'nonfinite'
    };

    const englishMood = moodMap[mood] || mood;

    // Buscar el paradigma correcto
    const paradigm = verbObj.paradigms.find(p => p.forms?.some(f => f.mood === englishMood && f.tense === tense.tense));
    if (!paradigm || !paradigm.forms) {
      // Fallback: devolver el infinitivo si no encontramos el paradigma
      return verbObj.lemma;
    }

    // Buscar la forma específica
    const form = paradigm.forms.find(f => f.mood === englishMood && f.tense === tense.tense && f.person === person);

    // Si no encontramos la forma exacta, retornar el infinitivo como fallback
    return form?.value || verbObj.lemma;
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
      if (p === '2s_vos' && tense.mood === 'indicativo' && tense.tense === 'pres') {
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
      // Para tiempos con narrativas diferenciadas, usar siempre 1s si la narrativa dice "yo"
      const personHint = (['fut', 'cond', 'ger', 'part'].includes(tense.tense) && /\byo\b/i.test(sentenceTemplate))
        ? '1s'
        : (/^\s*Yo\b/i.test(sentenceTemplate)
            ? '1s'
            : (/^\s*Nosotros\b/i.test(sentenceTemplate) ? '1p' : '3s'))
      // Usar el modo correcto (indicative, conditional, subjunctive, etc.) para obtener la forma
      const conjugation = getConjugation(verbObj, personHint, tense.mood);

      // Capitalizar si el verbo inicia la oración (posiblemente tras signos de apertura)
      const startsWithVerb = /^__VERB__/.test(sentenceTemplate);
      const conjDisplay = startsWithVerb && typeof conjugation === 'string' && conjugation.length
        ? conjugation.charAt(0).toUpperCase() + conjugation.slice(1)
        : conjugation;

      let replacementRoot = null
      let replacementIrregular = null
      if (tense?.tense === 'fut' || tense?.tense === 'cond') {
        replacementRoot = FUTURE_ROOT_MAP.get(verbObj.lemma) || null
        // Use the full conjugation as irregular form highlight
        replacementIrregular = conjDisplay
      } else if (tense?.tense === 'ger') {
        replacementIrregular = GERUND_MAP.get(verbObj.lemma) || null
      } else if (tense?.tense === 'part') {
        replacementIrregular = PARTICIPLE_MAP.get(verbObj.lemma) || null
      }

      const replacements = {
        verb: conjDisplay,
        root: replacementRoot || (replacementIrregular ? replacementIrregular : conjDisplay),
        irreg: replacementIrregular || replacementRoot || conjDisplay
      }

      
      const isVisible = index <= visibleSentence;
      return (
        <p
          key={index}
          className={isVisible ? "story-sentence visible" : "story-sentence"}
          style={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? 'visible' : 'hidden' }}
          aria-hidden={!isVisible}
        >
          <SafeTemplate 
            template={sentenceTemplate}
            replacements={replacements}
            highlightClass="highlight"
          />
        </p>
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
                  {(() => {
                    // Primero verificar si es futuro/condicional con verbos regulares
                    if (['fut', 'cond'].includes(tense.tense) && hasRegularVerbs && !hasIrregularVerbs) {
                      return renderRegularFutureConditionalDeconstruction(exampleVerbs, tense, settings)
                    }

                    // Verificar si es gerundio/participio con verbos regulares
                    if (['ger', 'part'].includes(tense.tense) && hasRegularVerbs && !hasIrregularVerbs) {
                      return renderRegularNonFiniteDeconstruction(exampleVerbs, tense, settings)
                    }

                    const futureRootBlock = renderFutureRootDeconstruction(exampleVerbs, tense, settings)
                    if (futureRootBlock) {
                      return futureRootBlock
                    }

                    const nonFiniteBlock = renderNonFiniteIrregularDeconstruction(exampleVerbs, tense)
                    if (nonFiniteBlock) {
                      return nonFiniteBlock
                    }

                    // Verificar si tenemos verbos irregulares en YO (presente) para renderizarlos con forma conjugada
                    const yoIrregularBlock = renderIrregularYoDeconstruction(exampleVerbs, tense, settings)
                    if (yoIrregularBlock) {
                      return yoIrregularBlock
                    }

                    // Verificar si tenemos pretéritos fuertes para renderizarlos agrupados
                    const hasStrongPreterites = exampleVerbs && exampleVerbs.some(verbObj =>
                      isStrongPreterite(verbObj, tense)
                    );

                    if (hasStrongPreterites) {
                      return renderStrongPreteriteDeconstruction(exampleVerbs, settings);
                    }

                    // Verificar si tenemos verbos irregulares solo en terceras personas
                    const hasThirdPersonIrregulars = exampleVerbs && exampleVerbs.some(verbObj => {
                      // Fallback directo para los verbos más comunes de 3ª persona irregular
                      const thirdPersonVerbs = ['pedir', 'dormir', 'leer', 'servir', 'sentir', 'morir', 'seguir', 'repetir', 'preferir', 'mentir', 'vestir', 'construir', 'destruir', 'incluir', 'concluir', 'influir', 'huir', 'creer', 'caer', 'traer', 'oír'];
                      return thirdPersonVerbs.includes(verbObj.lemma);
                    });

                    if (hasThirdPersonIrregulars && tense.tense === 'pretIndef') {
                      return renderThirdPersonIrregularDeconstruction(exampleVerbs, settings);
                    }

                    // Si no hay pretéritos fuertes ni irregulares de terceras personas, usar la lógica normal
                    return exampleVerbs && exampleVerbs.length > 0 && exampleVerbs
                      .sort((a, b) => {
                        // Ordenar por terminación: -ar, -er, -ir
                        const getEndingOrder = (verb) => {
                          if (verb.lemma.endsWith('ar')) return 0;
                          if (verb.lemma.endsWith('er')) return 1;
                          if (verb.lemma.endsWith('ir')) return 2;
                          return 3;
                        };
                        return getEndingOrder(a) - getEndingOrder(b);
                      })
                      .map((verbObj, index) => {
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

                    // Convertir mood de español a inglés para la búsqueda en BD
                    const moodMapping = {
                      'indicativo': 'indicative',
                      'subjuntivo': 'subjunctive',
                      'imperativo': 'imperative',
                      'condicional': 'conditional'
                    };
                    const englishMood = moodMapping[tense.mood] || tense.mood;

                    const realForms = extractRealConjugatedForms(verbObj, tense.tense, englishMood);

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
                    let realStem = detectRealStem(verbObj, tense.tense, tense.mood) || lemmaStem(verb);

                    // Para condicional y futuro regulares, usar el infinitivo completo en lugar de la raíz
                    const isConditionalOrFutureRegular =
                      ((tense.tense === 'cond' && tense.mood === 'condicional') ||
                       (tense.tense === 'fut' && tense.mood === 'indicativo')) &&
                      verbObj.type === 'regular';

                    if (isConditionalOrFutureRegular) {
                      realStem = verb; // Usar infinitivo completo (hablar, comer, vivir)
                    }

                    const standardEndings = getStandardEndings(group.slice(-2), tense.tense);
                    
                    const dialectEndings = pronouns.map(p => {
                      const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
                      const grp = group.slice(-2);
                      const key = p === '2s_vos' ? '2s_tu' : p;
                      let base = standardEndings?.[baseOrder.indexOf(key)] || '';
                      
                      if (p === '2s_vos' && tense.mood === 'indicativo' && tense.tense === 'pres') {
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
                    });
                  })()}
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
