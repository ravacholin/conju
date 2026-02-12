function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function buildLearningJourney({ userStats = {}, studyPlan = null } = {}) {
  const totalAttempts = Number(userStats.totalAttempts || 0)
  const mastery = Number(userStats.totalMastery || 0)
  const streakDays = Number(userStats.streakDays || 0)

  const checkpoints = [
    {
      id: 'foundation',
      title: 'Base estable',
      description: 'Logra 25 intentos para consolidar fundamentos.',
      progress: clamp(Math.round((totalAttempts / 25) * 100), 0, 100)
    },
    {
      id: 'consistency',
      title: 'Consistencia',
      description: 'Mantén 5 días de racha.',
      progress: clamp(Math.round((streakDays / 5) * 100), 0, 100)
    },
    {
      id: 'mastery',
      title: 'Dominio operativo',
      description: 'Llega a 70% de dominio global.',
      progress: clamp(Math.round((mastery / 70) * 100), 0, 100)
    }
  ].map((item) => ({
    ...item,
    completed: item.progress >= 100
  }))

  const nextCheckpoint = checkpoints.find((item) => !item.completed) || checkpoints[checkpoints.length - 1]
  const sessionCount = Array.isArray(studyPlan?.sessionBlueprints?.sessions)
    ? studyPlan.sessionBlueprints.sessions.length
    : 0

  let adaptiveMessage = 'Buen ritmo: seguí con una sesión mixta corta para sostener la curva de aprendizaje.'
  if (streakDays === 0) {
    adaptiveMessage = 'Arranca con una sesión breve hoy para iniciar racha y estabilizar hábito.'
  } else if (mastery < 40) {
    adaptiveMessage = 'Prioriza una sesión enfocada en errores frecuentes antes de ampliar contenido.'
  } else if (sessionCount > 0) {
    adaptiveMessage = 'Ya tienes plan personalizado: ejecuta la primera sesión recomendada y evalúa avance.'
  }

  return {
    checkpoints,
    nextCheckpoint,
    adaptiveMessage
  }
}
