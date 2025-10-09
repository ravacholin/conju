export const HEATMAP_MOOD_CONFIG = {
  indicative: {
    label: 'Indicativo',
    icon: '/hechos-indicativo.png',
    tenses: [
      { key: 'pres', label: 'Presente' },
      { key: 'pretIndef', label: 'Pretérito indefinido' },
      { key: 'impf', label: 'Pretérito imperfecto' },
      { key: 'fut', label: 'Futuro simple' },
      { key: 'pretPerf', label: 'Pretérito perfecto' },
      { key: 'plusc', label: 'Pluscuamperfecto' },
      { key: 'futPerf', label: 'Futuro perfecto' }
    ]
  },
  subjunctive: {
    label: 'Subjuntivo',
    icon: '/posib-subj.png',
    tenses: [
      { key: 'subjPres', label: 'Presente' },
      { key: 'subjImpf', label: 'Pretérito imperfecto' },
      { key: 'subjPerf', label: 'Pretérito perfecto' },
      { key: 'subjPlusc', label: 'Pluscuamperfecto' }
    ]
  },
  conditional: {
    label: 'Condicional',
    icon: '/posib-condic.png',
    tenses: [
      { key: 'cond', label: 'Condicional simple' },
      { key: 'condPerf', label: 'Condicional compuesto' }
    ]
  },
  imperative: {
    label: 'Imperativo',
    icon: '/megaf-imperat.png',
    tenses: [
      { key: 'imper', label: 'Imperativo' }
    ]
  }
}

export const SUPPORTED_HEATMAP_COMBOS = Object.freeze(
  Object.entries(HEATMAP_MOOD_CONFIG).flatMap(([mood, config]) =>
    config.tenses.map((tense) => `${mood}-${tense.key}`)
  )
)

export const SUPPORTED_HEATMAP_COMBO_SET = new Set(SUPPORTED_HEATMAP_COMBOS)
