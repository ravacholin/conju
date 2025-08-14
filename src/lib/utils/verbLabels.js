// Labels and mappings for Spanish verb forms

export const MOOD_LABELS = {
  'indicative': 'Indicativo',
  'subjunctive': 'Subjuntivo',
  'imperative': 'Imperativo',
  'conditional': 'Condicional',
  'nonfinite': 'Formas no conjugadas'
}

export const TENSE_LABELS = {
  // Indicativo
  'pres': 'Presente',
  'pretPerf': 'Pretérito perfecto',
  'pretIndef': 'Pretérito indefinido',
  'impf': 'Imperfecto',
  'plusc': 'Pluscuamperfecto',
  'fut': 'Futuro',
  'futPerf': 'Futuro perfecto',

  
  // Subjuntivo
  'subjPres': 'Presente',
  'subjImpf': 'Imperfecto',
  'subjPerf': 'Perfecto',
  'subjPlusc': 'Pluscuamperfecto',
  
  // Imperativo
  'impAff': 'Afirmativo',
  'impNeg': 'Negativo',
  'impMixed': 'Todas',
  
  // Condicional
  'cond': 'Condicional',
  'condPerf': 'Condicional perfecto',
  
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