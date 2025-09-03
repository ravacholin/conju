// Labels and mappings for Spanish verb forms

export const MOOD_LABELS = {
  // Formatos ingleses (sistema existente)
  'indicative': 'Indicativo',
  'subjunctive': 'Subjuntivo',
  'imperative': 'Imperativo',
  'conditional': 'Condicional',
  'nonfinite': 'Formas no conjugadas',
  
  // Formatos españoles (levels.js)
  'indicativo': 'Indicativo',
  'subjuntivo': 'Subjuntivo',
  'imperativo': 'Imperativo',
  'condicional': 'Condicional'
}

export const TENSE_LABELS = {
  // Indicativo - formatos cortos
  'pres': 'Presente',
  'pretPerf': 'Pretérito perfecto',
  'pretIndef': 'Pretérito indefinido',
  'impf': 'Imperfecto',
  'plusc': 'Pluscuamperfecto',
  'fut': 'Futuro',
  'futPerf': 'Futuro perfecto',

  // Indicativo - formatos largos (levels.js)
  'presente': 'Presente',
  'preterito_perfecto_simple': 'Pretérito perfecto simple',
  'preterito_imperfecto': 'Pretérito imperfecto',
  'preterito_perfecto_compuesto': 'Pretérito perfecto compuesto',
  'preterito_pluscuamperfecto': 'Pretérito pluscuamperfecto',
  'futuro_simple': 'Futuro simple',
  'futuro_compuesto': 'Futuro compuesto',
  
  // Subjuntivo - formatos cortos
  'subjPres': 'Presente',
  'subjImpf': 'Imperfecto',
  'subjPerf': 'Perfecto',
  'subjPlusc': 'Pluscuamperfecto',
  
  // Subjuntivo - formatos largos (levels.js)
  'presente_subjuntivo': 'Presente de subjuntivo',
  'imperfecto_subjuntivo': 'Imperfecto de subjuntivo',
  'preterito_perfecto_subjuntivo': 'Pretérito perfecto de subjuntivo',
  'pluscuamperfecto_subjuntivo': 'Pluscuamperfecto de subjuntivo',
  'futuro_subjuntivo': 'Futuro de subjuntivo',
  'futuro_perfecto_subjuntivo': 'Futuro perfecto de subjuntivo',
  
  // Imperativo - todos los formatos
  'impAff': 'Afirmativo',
  'impNeg': 'Negativo',
  'impMixed': 'Todas',
  'imperativo_afirmativo': 'Imperativo afirmativo',
  'imperativo_negativo': 'Imperativo negativo',
  
  // Condicional - todos los formatos
  'cond': 'Condicional',
  'condPerf': 'Condicional perfecto',
  'condicional_simple': 'Condicional simple',
  'condicional_compuesto': 'Condicional compuesto',
  
  // Formas no conjugadas
  'ger': 'Gerundio',
  'part': 'Participio',
  'nonfiniteMixed': 'Participios y Gerundios'
}

export const PERSON_LABELS = {
  '1s': 'yo',
  '2s_tu': 'tú',
  '2s_vos': 'vos',
  '3s': 'él/ella',
  '1p': 'nosotros',
  '2p_vosotros': 'vosotros',
  '3p': 'ellos'
}

// Mapping of moods to their available tenses
export const MOOD_TENSES = {
  'indicative': [
    'pres', 'pretPerf', 'pretIndef', 'impf', 'plusc', 
    'fut', 'futPerf'
  ],
  'subjunctive': [
    'subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'
  ],
  'imperative': [
    'impAff', 'impNeg', 'impMixed'
  ],
  'conditional': [
    'cond', 'condPerf'
  ],
  'nonfinite': [
    'ger', 'part', 'nonfiniteMixed'
  ]
}

// Get available tenses for a specific mood
export function getTensesForMood(mood) {
  return MOOD_TENSES[mood] || []
}

// Get Spanish label for a mood
export function getMoodLabel(mood) {
  return MOOD_LABELS[mood] || mood
}

// Get Spanish label for a tense
export function getTenseLabel(tense) {
  return TENSE_LABELS[tense] || tense
}

// Get Spanish label for a person
export function getPersonLabel(person) {
  return PERSON_LABELS[person] || person
}