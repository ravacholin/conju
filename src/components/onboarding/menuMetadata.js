const DIALECT_LABELS = {
  rioplatense: 'Voseo rioplatense',
  la_general: 'Tuteo latinoamericano',
  peninsular: 'España con vosotros',
  both: 'Dialecto global'
}

const PRACTICE_MODE_LABELS = {
  mixed: 'Práctica mixta',
  specific: 'Práctica específica',
  theme: 'Práctica por tema'
}

const VERB_TYPE_LABELS = {
  all: 'Todos los verbos',
  regular: 'Regulares',
  irregular: 'Irregulares'
}

const MOOD_LABELS = {
  indicative: 'Indicativo',
  subjunctive: 'Subjuntivo',
  imperative: 'Imperativo',
  conditional: 'Condicional',
  nonfinite: 'No conjugadas'
}

const TENSE_LABELS = {
  pres: 'Presente',
  pretIndef: 'Pretérito indefinido',
  pretImp: 'Pretérito imperfecto',
  fut: 'Futuro',
  cond: 'Condicional',
  pretPerf: 'Pretérito perfecto',
  plusc: 'Pluscuamperfecto',
  futPerf: 'Futuro perfecto',
  condPerf: 'Condicional perfecto',
  subjPres: 'Presente',
  subjImpf: 'Imperfecto',
  subjPerf: 'Perfecto',
  subjPlusc: 'Pluscuamperfecto',
  aff: 'Afirmativo',
  neg: 'Negativo',
  inf: 'Infinitivo',
  ger: 'Gerundio',
  part: 'Participio',
  nonfiniteMixed: 'Mezcladas'
}

export function getStepMeta(step, settings = {}) {
  const metas = {
    1: {
      layout: 'hero',
      step: '01',
      kicker: 'DIALECTO',
      title: 'Elegí variante',
      description: 'Definí el sistema pronominal antes de empezar: voseo, tuteo, peninsular o mezcla.'
    },
    2: {
      layout: 'hero',
      step: '02',
      kicker: 'SELECCIÓN',
      title: 'Elegí tu punto de entrada',
      description: 'Nivel, foco verbal, aprendizaje guiado o progreso. Cuatro accesos distintos, cada uno con una lógica distinta.'
    },
    3: {
      layout: 'split',
      step: '03',
      kicker: 'NIVEL',
      title: 'Ajustá la dificultad con precisión',
      description: 'Elegí un tramo CEFR o dejá que el test ubique tu punto de entrada.'
    },
    4: {
      layout: 'compact',
      step: '04',
      kicker: 'MODO',
      title: 'Definí la forma de práctica',
      description: 'Podés mezclar todo tu nivel o aislar una familia concreta de formas.'
    },
    5: settings.practiceMode === 'mixed'
      ? {
          layout: 'compact',
          step: '05',
          kicker: 'MATERIAL',
          title: 'Filtrá qué tipo de verbos entran al drill',
          description: 'La práctica sigue siendo la misma; acá solo decidís el tipo de input que va a recibir el generador.'
        }
      : {
          layout: 'split',
          step: '05',
          kicker: 'FOCO',
          title: 'Elegí el modo o tiempo que querés atacar',
          description: 'Segmentá la práctica para trabajar un bloque verbal bien definido sin tocar la lógica de conjugación.'
        },
    6: settings.practiceMode === 'mixed'
      ? {
          layout: 'compact',
          step: '06',
          kicker: 'FAMILIAS',
          title: 'Acotá la irregularidad cuando haga falta',
          description: 'Si vas por irregulares, podés entrar por familias para que el drill sea más deliberado.'
        }
      : {
          layout: 'minimal',
          step: '06',
          kicker: 'SELECCIÓN',
          title: 'Cerrá el recorte exacto del drill',
          description: 'Definí el tiempo final o elegí tipo de verbo según el flujo que hayas tomado.'
        },
    7: {
      layout: 'minimal',
      step: '07',
      kicker: 'TIPO',
      title: 'Definí el set final de verbos',
      description: 'Último filtro antes de entrar al drill para práctica específica.'
    },
    8: {
      layout: 'minimal',
      step: '08',
      kicker: 'FAMILIAS',
      title: 'Elegí la familia irregular a practicar',
      description: 'Si querés, podés dejar todas juntas o trabajar patrones puntuales.'
    }
  }

  return metas[step] || metas[2]
}

export function getSettingsSummary(settings = {}) {
  const items = []

  if (settings.region) {
    items.push({ label: 'Dialecto', value: DIALECT_LABELS[settings.region] || settings.region })
  }

  if (settings.level) {
    items.push({ label: 'Nivel', value: settings.level })
  }

  if (settings.practiceMode) {
    items.push({
      label: 'Modo',
      value: PRACTICE_MODE_LABELS[settings.practiceMode] || settings.practiceMode
    })
  }

  if (settings.specificMood) {
    items.push({
      label: 'Modo verbal',
      value: MOOD_LABELS[settings.specificMood] || settings.specificMood
    })
  }

  if (settings.specificTense) {
    items.push({
      label: 'Tiempo',
      value: TENSE_LABELS[settings.specificTense] || settings.specificTense
    })
  }

  if (settings.verbType) {
    items.push({
      label: 'Verbos',
      value: VERB_TYPE_LABELS[settings.verbType] || settings.verbType
    })
  }

  if (settings.selectedFamily) {
    items.push({ label: 'Familia', value: settings.selectedFamily })
  }

  return items
}
