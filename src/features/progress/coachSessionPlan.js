function normalizeHeatMapEntries(heatMapData) {
  if (!heatMapData || typeof heatMapData !== 'object' || typeof heatMapData.heatMap !== 'object') {
    return []
  }

  return Object.entries(heatMapData.heatMap)
    .map(([combo, stats]) => {
      const [mood, tense] = combo.split('-')
      return {
        mood,
        tense,
        mastery: Number(stats?.mastery || 0),
        attempts: Number(stats?.attempts || 0)
      }
    })
    .filter((item) => item.mood && item.tense)
}

export function buildCoachSessionPlan({ userStats = {}, heatMapData = null } = {}) {
  const mastery = Number(userStats?.totalMastery || 0)
  const streakDays = Number(userStats?.streakDays || 0)
  const entries = normalizeHeatMapEntries(heatMapData)

  const weakest = entries
    .filter((entry) => entry.attempts >= 2)
    .sort((a, b) => a.mastery - b.mastery)[0] || null

  const shouldRecoverConfidence = mastery < 45 || streakDays === 0

  if (weakest) {
    return {
      mode: 'targeted',
      title: 'Coach de rescate (5 min)',
      objective: `Refuerza ${weakest.mood}/${weakest.tense} para cerrar tu brecha principal.`,
      why: `Mastery actual en foco: ${Math.round(weakest.mastery * 100)}%.`,
      estimatedMinutes: 5,
      drillConfig: {
        practiceMode: 'specific',
        specificMood: weakest.mood,
        specificTense: weakest.tense
      }
    }
  }

  return {
    mode: shouldRecoverConfidence ? 'confidence' : 'mixed',
    title: 'Coach de enfoque (5 min)',
    objective: shouldRecoverConfidence
      ? 'Haz una sesión corta de repaso para retomar ritmo sin fatiga.'
      : 'Entrena una mezcla breve para sostener consistencia diaria.',
    why: shouldRecoverConfidence
      ? 'Tu progreso reciente indica que conviene reforzar base antes de ampliar contenido.'
      : 'Tu estado actual permite mantener velocidad con una práctica compacta.',
    estimatedMinutes: 5,
    drillConfig: {
      practiceMode: shouldRecoverConfidence ? 'review' : 'mixed',
      reviewSessionType: shouldRecoverConfidence ? 'due' : 'due',
      reviewSessionFilter: {}
    }
  }
}
