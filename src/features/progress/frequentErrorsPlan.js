export function buildFrequentErrorsPlan(errorIntel = null) {
  const cells = Array.isArray(errorIntel?.heatmap?.cells) ? errorIntel.heatmap.cells : []

  const priorityErrors = cells
    .filter((cell) => Number(cell?.attempts || 0) >= 3)
    .sort((a, b) => Number(b?.errorRate || 0) - Number(a?.errorRate || 0))
    .slice(0, 3)
    .map((cell, index) => ({
      id: `${cell.mood || 'mood'}-${cell.tense || 'tense'}-${index}`,
      mood: cell.mood,
      tense: cell.tense,
      attempts: Number(cell.attempts || 0),
      errorRate: Math.round(Number(cell.errorRate || 0) * 100)
    }))

  if (priorityErrors.length > 0) {
    return {
      headline: 'Errores frecuentes detectados',
      description: 'Ataca primero los patrones con más impacto para recuperar precisión rápido.',
      items: priorityErrors
    }
  }

  return {
    headline: 'Sin errores críticos recientes',
    description: 'Sostén práctica mixta para mantener estabilidad y detectar nuevas brechas.',
    items: []
  }
}
