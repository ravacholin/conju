// Verbos comunes con formas estructuradas y metadatos de persona
// Limpiado de duplicados y organizado por personas gramaticales

export const commonVerbs = [
  // VERBOS REGULARES - AR (alta frecuencia)
  {
    lemma: 'trabajar',
    type: 'regular',
    forms: {
      // Indicativo presente
      'pres': {
        '1s': 'trabajo',
        '2s_tu': 'trabajas', 
        '2s_vos': 'trabajás',
        '3s': 'trabaja',
        '1p': 'trabajamos',
        '2p_vosotros': 'trabajáis',
        '3p': 'trabajan'
      },
      // Indicativo pretérito indefinido
      'pretIndef': {
        '1s': 'trabajé',
        '2s_tu': 'trabajaste',
        '2s_vos': 'trabajaste', 
        '3s': 'trabajó',
        '1p': 'trabajamos',
        '2p_vosotros': 'trabajasteis',
        '3p': 'trabajaron'
      },
      // Indicativo imperfecto
      'impf': {
        '1s': 'trabajaba',
        '2s_tu': 'trabajabas',
        '2s_vos': 'trabajabas',
        '3s': 'trabajaba', 
        '1p': 'trabajábamos',
        '2p_vosotros': 'trabajabais',
        '3p': 'trabajaban'
      },
      // Subjuntivo presente
      'subjPres': {
        '1s': 'trabaje',
        '2s_tu': 'trabajes',
        '2s_vos': 'trabajes',
        '3s': 'trabaje',
        '1p': 'trabajemos', 
        '2p_vosotros': 'trabajéis',
        '3p': 'trabajen'
      },
      // Subjuntivo imperfecto
      'subjImpf': {
        '1s': 'trabajara',
        '2s_tu': 'trabajaras', 
        '2s_vos': 'trabajaras',
        '3s': 'trabajara',
        '1p': 'trabajáramos',
        '2p_vosotros': 'trabajarais',
        '3p': 'trabajaran'
      },
      // Imperativo afirmativo
      'impAff': {
        '2s_tu': 'trabaja',
        '2s_vos': 'trabajá',
        '3s': 'trabaje',
        '1p': 'trabajemos',
        '2p_vosotros': 'trabajad',
        '3p': 'trabajen'
      },
      // Condicional
      'cond': {
        '1s': 'trabajaría',
        '2s_tu': 'trabajarías',
        '2s_vos': 'trabajarías',
        '3s': 'trabajaría',
        '1p': 'trabajaríamos',
        '2p_vosotros': 'trabajaríais', 
        '3p': 'trabajarían'
      },
      // Formas no finitas
      'inf': 'trabajar',
      'ger': 'trabajando',
      'part': 'trabajado'
    }
  },

  // VERBOS REGULARES - ER
  {
    lemma: 'comer',
    type: 'regular',
    forms: {
      'pres': {
        '1s': 'como',
        '2s_tu': 'comes',
        '2s_vos': 'comés', 
        '3s': 'come',
        '1p': 'comemos',
        '2p_vosotros': 'coméis',
        '3p': 'comen'
      },
      'pretIndef': {
        '1s': 'comí',
        '2s_tu': 'comiste',
        '2s_vos': 'comiste',
        '3s': 'comió',
        '1p': 'comimos', 
        '2p_vosotros': 'comisteis',
        '3p': 'comieron'
      },
      'impf': {
        '1s': 'comía',
        '2s_tu': 'comías',
        '2s_vos': 'comías',
        '3s': 'comía',
        '1p': 'comíamos',
        '2p_vosotros': 'comíais',
        '3p': 'comían'
      },
      'subjPres': {
        '1s': 'coma',
        '2s_tu': 'comas',
        '2s_vos': 'comas',
        '3s': 'coma',
        '1p': 'comamos',
        '2p_vosotros': 'comáis',
        '3p': 'coman'
      },
      'subjImpf': {
        '1s': 'comiera',
        '2s_tu': 'comieras',
        '2s_vos': 'comieras', 
        '3s': 'comiera',
        '1p': 'comiéramos',
        '2p_vosotros': 'comierais',
        '3p': 'comieran'
      },
      'impAff': {
        '2s_tu': 'come',
        '2s_vos': 'comé',
        '3s': 'coma',
        '1p': 'comamos',
        '2p_vosotros': 'comed',
        '3p': 'coman'
      },
      'cond': {
        '1s': 'comería',
        '2s_tu': 'comerías',
        '2s_vos': 'comerías',
        '3s': 'comería', 
        '1p': 'comeríamos',
        '2p_vosotros': 'comeríais',
        '3p': 'comerían'
      },
      'inf': 'comer',
      'ger': 'comiendo', 
      'part': 'comido'
    }
  },

  // VERBOS REGULARES - IR
  {
    lemma: 'vivir', 
    type: 'regular',
    forms: {
      'pres': {
        '1s': 'vivo',
        '2s_tu': 'vives',
        '2s_vos': 'vivís',
        '3s': 'vive',
        '1p': 'vivimos',
        '2p_vosotros': 'vivís',
        '3p': 'viven'
      },
      'pretIndef': {
        '1s': 'viví',
        '2s_tu': 'viviste',
        '2s_vos': 'viviste',
        '3s': 'vivió', 
        '1p': 'vivimos',
        '2p_vosotros': 'vivisteis',
        '3p': 'vivieron'
      },
      'impf': {
        '1s': 'vivía',
        '2s_tu': 'vivías',
        '2s_vos': 'vivías',
        '3s': 'vivía',
        '1p': 'vivíamos',
        '2p_vosotros': 'vivíais',
        '3p': 'vivían'
      },
      'subjPres': {
        '1s': 'viva',
        '2s_tu': 'vivas',
        '2s_vos': 'vivas',
        '3s': 'viva',
        '1p': 'vivamos',
        '2p_vosotros': 'viváis',
        '3p': 'vivan'
      },
      'subjImpf': {
        '1s': 'viviera',
        '2s_tu': 'vivieras',
        '2s_vos': 'vivieras',
        '3s': 'viviera',
        '1p': 'viviéramos',
        '2p_vosotros': 'vivierais',
        '3p': 'vivieran'
      },
      'impAff': {
        '2s_tu': 'vive',
        '2s_vos': 'viví',
        '3s': 'viva',
        '1p': 'vivamos',
        '2p_vosotros': 'vivid',
        '3p': 'vivan'
      },
      'cond': {
        '1s': 'viviría',
        '2s_tu': 'vivirías', 
        '2s_vos': 'vivirías',
        '3s': 'viviría',
        '1p': 'viviríamos',
        '2p_vosotros': 'viviríais',
        '3p': 'vivirían'
      },
      'inf': 'vivir',
      'ger': 'viviendo',
      'part': 'vivido'
    }
  },

  // VERBOS IRREGULARES COMUNES
  {
    lemma: 'ser',
    type: 'irregular', 
    forms: {
      'pres': {
        '1s': 'soy',
        '2s_tu': 'eres',
        '2s_vos': 'sos',
        '3s': 'es',
        '1p': 'somos',
        '2p_vosotros': 'sois', 
        '3p': 'son'
      },
      'pretIndef': {
        '1s': 'fui',
        '2s_tu': 'fuiste',
        '2s_vos': 'fuiste',
        '3s': 'fue',
        '1p': 'fuimos',
        '2p_vosotros': 'fuisteis',
        '3p': 'fueron'
      },
      'impf': {
        '1s': 'era',
        '2s_tu': 'eras',
        '2s_vos': 'eras',
        '3s': 'era',
        '1p': 'éramos',
        '2p_vosotros': 'erais',
        '3p': 'eran'
      },
      'subjPres': {
        '1s': 'sea',
        '2s_tu': 'seas',
        '2s_vos': 'seas',
        '3s': 'sea',
        '1p': 'seamos',
        '2p_vosotros': 'seáis',
        '3p': 'sean'
      },
      'subjImpf': {
        '1s': 'fuera',
        '2s_tu': 'fueras',
        '2s_vos': 'fueras',
        '3s': 'fuera',
        '1p': 'fuéramos', 
        '2p_vosotros': 'fuerais',
        '3p': 'fueran'
      },
      'impAff': {
        '2s_tu': 'sé',
        '2s_vos': 'sé',
        '3s': 'sea',
        '1p': 'seamos', 
        '2p_vosotros': 'sed',
        '3p': 'sean'
      },
      'cond': {
        '1s': 'sería',
        '2s_tu': 'serías',
        '2s_vos': 'serías',
        '3s': 'sería',
        '1p': 'seríamos',
        '2p_vosotros': 'seríais',
        '3p': 'serían'
      },
      'inf': 'ser',
      'ger': 'siendo',
      'part': 'sido'
    }
  },

  {
    lemma: 'tener',
    type: 'irregular',
    forms: {
      'pres': {
        '1s': 'tengo',
        '2s_tu': 'tienes', 
        '2s_vos': 'tenés',
        '3s': 'tiene',
        '1p': 'tenemos',
        '2p_vosotros': 'tenéis',
        '3p': 'tienen'
      },
      'pretIndef': {
        '1s': 'tuve',
        '2s_tu': 'tuviste',
        '2s_vos': 'tuviste',
        '3s': 'tuvo',
        '1p': 'tuvimos',
        '2p_vosotros': 'tuvisteis',
        '3p': 'tuvieron'
      },
      'subjPres': {
        '1s': 'tenga',
        '2s_tu': 'tengas',
        '2s_vos': 'tengas',
        '3s': 'tenga',
        '1p': 'tengamos',
        '2p_vosotros': 'tengáis',
        '3p': 'tengan'
      },
      'subjImpf': {
        '1s': 'tuviera',
        '2s_tu': 'tuvieras',
        '2s_vos': 'tuvieras',
        '3s': 'tuviera',
        '1p': 'tuviéramos',
        '2p_vosotros': 'tuvierais',
        '3p': 'tuvieran'
      },
      'cond': {
        '1s': 'tendría',
        '2s_tu': 'tendrías',
        '2s_vos': 'tendrías', 
        '3s': 'tendría',
        '1p': 'tendríamos',
        '2p_vosotros': 'tendríais',
        '3p': 'tendrían'
      },
      'inf': 'tener',
      'ger': 'teniendo',
      'part': 'tenido'
    }
  }
];

// Función auxiliar para obtener todas las formas de un verbo
export function getAllForms(lemma) {
  const verb = commonVerbs.find(v => v.lemma === lemma);
  if (!verb) return [];
  
  const allForms = [];
  Object.entries(verb.forms).forEach(([tense, forms]) => {
    if (typeof forms === 'string') {
      // Formas no finitas
      allForms.push({ tense, form: forms, person: '' });
    } else {
      // Formas conjugadas
      Object.entries(forms).forEach(([person, form]) => {
        allForms.push({ tense, person, form });
      });
    }
  });
  
  return allForms;
}

// Función para validar consistencia con la base principal
export function validateCommonVerbs() {
  const errors = [];
  const warnings = [];
  
  commonVerbs.forEach(verb => {
    // Verificar que todas las formas tengan valores válidos
    Object.entries(verb.forms).forEach(([tense, forms]) => {
      if (typeof forms === 'object' && forms !== null) {
        Object.entries(forms).forEach(([person, form]) => {
          if (!form || typeof form !== 'string' || form.trim() === '') {
            errors.push(`${verb.lemma}: forma vacía en ${tense}|${person}`);
          }
        });
      }
    });
  });
  
  return { errors, warnings, isValid: errors.length === 0 };
}

export default commonVerbs;