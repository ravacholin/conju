const RULES = {
  'indicative|pres': {
    title: 'Presente de indicativo',
    rule: 'Expresa acciones habituales, verdades generales y lo que ocurre ahora.',
    example: 'Yo hablo español todos los días.',
    counterExample: 'Yo hablé español todos los días (puntual, no habitual).'
  },
  'indicative|pretIndef': {
    title: 'Pretérito indefinido',
    rule: 'Usa indefinido para acciones puntuales y cerradas en el pasado.',
    example: 'Ayer hablé con Ana.',
    counterExample: 'Ayer hablaba con Ana (imperfecto = contexto, no evento).'
  },
  'indicative|impf': {
    title: 'Imperfecto',
    rule: 'Usa imperfecto para hábitos, contexto o acciones en progreso en el pasado.',
    example: 'De chico, jugaba al fútbol.',
    counterExample: 'De chico, jugué al fútbol (evento puntual).'
  },
  'indicative|fut': {
    title: 'Futuro simple',
    rule: 'Expresa acciones futuras, promesas o predicciones.',
    example: 'Mañana estudiaré para el examen.',
    counterExample: 'Mañana estudiaba para el examen (imperfecto = pasado).'
  },
  'indicative|pretPerf': {
    title: 'Pretérito perfecto',
    rule: 'Conecta una acción pasada con el presente. Usa "haber" + participio.',
    example: 'Hoy he comido temprano.',
    counterExample: 'Hoy comí temprano (más común en Latinoamérica, pero distinto matiz).'
  },
  'subjunctive|subjPres': {
    title: 'Subjuntivo presente',
    rule: 'Después de duda, deseo o emoción, usa subjuntivo.',
    example: 'Espero que vengas temprano.',
    counterExample: 'Espero que vienes temprano (indicativo = incorrecto aquí).'
  },
  'subjunctive|subjImpf': {
    title: 'Subjuntivo imperfecto',
    rule: 'Usa para hipótesis, condicionales irreales y deseos pasados.',
    example: 'Si tuviera dinero, viajaría.',
    counterExample: 'Si tengo dinero, viajaría (mezcla de tiempos incorrecta).'
  },
  'imperative|impAff': {
    title: 'Imperativo afirmativo',
    rule: 'Da órdenes directas con la forma de imperativo afirmativo.',
    example: 'Hablá más despacio.',
    counterExample: 'No hablés más despacio (esa es la forma negativa).'
  },
  'imperative|impNeg': {
    title: 'Imperativo negativo',
    rule: 'Para prohibiciones usa "no" + subjuntivo presente.',
    example: 'No hables tan rápido.',
    counterExample: 'No habla tan rápido (indicativo = incorrecto para orden).'
  },
  'conditional|cond': {
    title: 'Condicional',
    rule: 'Expresa cortesía, hipótesis o consecuencias de condiciones irreales.',
    example: 'Me gustaría un café, por favor.',
    counterExample: 'Me gusta un café (presente = afirmación, no pedido cortés).'
  },
  'nonfinite|ger': {
    title: 'Gerundio',
    rule: 'Indica una acción en progreso simultánea. Se forma con -ando/-iendo.',
    example: 'Estoy estudiando español.',
    counterExample: 'Estoy estudiado español (participio ≠ gerundio).'
  },
  'nonfinite|part': {
    title: 'Participio',
    rule: 'Se usa con "haber" para tiempos compuestos y como adjetivo.',
    example: 'He terminado la tarea.',
    counterExample: 'He terminando la tarea (gerundio ≠ participio).'
  }
}

export function buildErrorFeedbackCards(data) {
  const cells = Array.isArray(data?.heatmap?.cells) ? data.heatmap.cells : []
  const sorted = [...cells]
    .filter((cell) => Number(cell?.attempts) > 0)
    .sort((a, b) => (b.errorRate || 0) - (a.errorRate || 0))
    .slice(0, 3)

  return sorted.map((cell) => {
    const key = `${cell.mood}|${cell.tense}`
    const fallback = {
      title: `${formatMood(cell.mood)} · ${formatTense(cell.tense)}`,
      rule: 'Revisá la regla de uso y compará con una forma correcta.',
      example: 'Identificá el contexto y el sujeto antes de conjugar.',
      counterExample: 'Evitá mezclar tiempos o modos sin un contexto claro.'
    }
    return {
      id: key,
      errorRate: Math.round((cell.errorRate || 0) * 100),
      ...(RULES[key] || fallback)
    }
  })
}

function formatMood(mood) {
  const M = { indicative: 'Indicativo', subjunctive: 'Subjuntivo', imperative: 'Imperativo', conditional: 'Condicional', nonfinite: 'No finito' }
  return M[mood] || mood
}

function formatTense(tense) {
  const T = { pres: 'Presente', pretIndef: 'Indefinido', impf: 'Imperfecto', fut: 'Futuro', pretPerf: 'Perfecto', plusc: 'Pluscuam.', futPerf: 'Fut. Perf.', subjPres: 'Subj. Pres.', subjImpf: 'Subj. Impf.', subjPerf: 'Subj. Perf.', subjPlusc: 'Subj. Plusc.', impAff: 'Imp. Afirm.', impNeg: 'Imp. Neg.', cond: 'Condicional', condPerf: 'Cond. Perf.', ger: 'Gerundio', part: 'Participio' }
  return T[tense] || tense
}
