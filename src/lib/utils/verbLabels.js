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
  'nonfiniteMixed': 'Formas no conjugadas (mixto)'
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

// Normalize alternative tense keys to canonical ones used across the app
export function normalizeTenseKey(tense) {
  const map = {
    'imperativo_afirmativo': 'impAff',
    'imperativo_negativo': 'impNeg'
  }
  return map[tense] || tense
}

// Format a human-friendly label combining mood and tense when needed
export function formatMoodTense(mood, tense) {
  const moodLabel = MOOD_LABELS[mood] || mood
  const normalized = normalizeTenseKey(tense)
  const tenseLabel = TENSE_LABELS[normalized] || normalized

  // Imperative: show "Imperativo afirmativo/negativo"
  if (mood === 'imperative' || mood === 'imperativo') {
    if (normalized === 'impAff') return 'Imperativo afirmativo'
    if (normalized === 'impNeg') return 'Imperativo negativo'
    if (normalized === 'impMixed') return 'Imperativo (todas)'
    // Fallback to combining text
    return `Imperativo ${String(tenseLabel || '').toLowerCase()}`
  }

  // Subjunctive: if label already expands, return it
  if (mood === 'subjunctive' || mood === 'subjuntivo') {
    if ((tenseLabel || '').toLowerCase().includes('subjuntivo')) return tenseLabel
    return `${tenseLabel} (${moodLabel})`
  }

  // Indicative: tense label is enough
  if (mood === 'indicative' || mood === 'indicativo') return tenseLabel

  // Other moods: combine
  return `${tenseLabel} (${moodLabel})`
}
