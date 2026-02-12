const RULES = {
  'indicative|pretIndef': {
    title: 'Pretérito indefinido',
    rule: 'Usa indefinido para acciones puntuales y cerradas en el pasado.',
    example: 'Ayer hablé con Ana.',
    counterExample: 'Ayer hablaba con Ana.'
  },
  'indicative|impf': {
    title: 'Imperfecto',
    rule: 'Usa imperfecto para hábitos, contexto o acciones en progreso en el pasado.',
    example: 'De chico, jugaba al fútbol.',
    counterExample: 'De chico, jugué al fútbol (evento puntual).'
  },
  'subjunctive|subjPres': {
    title: 'Subjuntivo presente',
    rule: 'Después de duda, deseo o emoción, usa subjuntivo.',
    example: 'Espero que vengas temprano.',
    counterExample: 'Espero que vienes temprano.'
  },
  'imperative|impAff': {
    title: 'Imperativo afirmativo',
    rule: 'Da órdenes directas con la forma de imperativo afirmativo.',
    example: 'Habla más despacio.',
    counterExample: 'No hables más despacio.'
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
      title: `${cell.mood} · ${cell.tense}`,
      rule: 'Revisá la regla de uso y compará con una forma correcta.',
      example: 'Primero identificá contexto y sujeto.',
      counterExample: 'Evita mezclar tiempo o modo sin contexto.'
    }
    return {
      id: key,
      errorRate: Math.round((cell.errorRate || 0) * 100),
      ...(RULES[key] || fallback)
    }
  })
}
