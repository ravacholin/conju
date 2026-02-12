function getHeatMapEntries(heatMapData) {
  if (!heatMapData || typeof heatMapData.heatMap !== 'object') {
    return []
  }

  return Object.entries(heatMapData.heatMap)
    .map(([combo, value]) => {
      const [mood, tense] = combo.split('-')
      return {
        mood,
        tense,
        mastery: Number(value?.mastery || 0),
        attempts: Number(value?.attempts || 0),
        lastAttempt: Number(value?.lastAttempt || 0)
      }
    })
    .filter((item) => item.mood && item.tense)
}

export function buildFocusTracks({ heatMapData = null, userStats = {} } = {}) {
  const entries = getHeatMapEntries(heatMapData)
  const now = Date.now()

  const weakest = entries
    .filter((entry) => entry.attempts >= 3)
    .sort((a, b) => a.mastery - b.mastery)[0] || null

  const stale = entries
    .filter((entry) => entry.attempts > 0 && entry.mastery >= 0.65)
    .filter((entry) => entry.lastAttempt > 0 && ((now - entry.lastAttempt) / (1000 * 60 * 60 * 24)) >= 7)
    .sort((a, b) => a.lastAttempt - b.lastAttempt)[0] || null

  const mastery = Number(userStats?.totalMastery || 0)
  const tracks = []

  if (weakest) {
    tracks.push({
      id: 'repair-weakness',
      title: 'Reparar punto débil',
      level: 'Alta',
      description: `Sesión específica en ${weakest.mood}/${weakest.tense}.`,
      drillConfig: {
        practiceMode: 'specific',
        specificMood: weakest.mood,
        specificTense: weakest.tense
      }
    })
  }

  if (stale) {
    tracks.push({
      id: 'reactivate-mastery',
      title: 'Reactivar dominio',
      level: 'Media',
      description: `Repaso puntual en ${stale.mood}/${stale.tense}.`,
      drillConfig: {
        practiceMode: 'specific',
        specificMood: stale.mood,
        specificTense: stale.tense
      }
    })
  }

  tracks.push({
    id: 'stable-mix',
    title: mastery < 50 ? 'Base guiada' : 'Mixto de consolidación',
    level: mastery < 50 ? 'Baja' : 'Media',
    description: mastery < 50
      ? 'Bloque corto para recuperar precisión general.'
      : 'Práctica variada para mantener velocidad y retención.',
    drillConfig: {
      practiceMode: mastery < 50 ? 'review' : 'mixed',
      reviewSessionType: 'due',
      reviewSessionFilter: {}
    }
  })

  return tracks.slice(0, 3)
}
