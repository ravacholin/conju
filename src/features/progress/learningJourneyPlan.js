function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function buildLearningJourney({ userStats = {}, studyPlan = null } = {}) {
  const totalAttempts = Number(userStats.totalAttempts || 0)
  const mastery = Number(userStats.totalMastery || 0)
  const streakDays = Number(userStats.streakDays || 0)
  const accuracy = Number(userStats.accuracy || 0)
  const masteredCells = Number(userStats.masteredCells || 0)

  const allCheckpoints = [
    {
      id: 'first-steps',
      title: 'Primeros pasos',
      description: 'Completá 10 conjugaciones para empezar.',
      progress: clamp(Math.round((totalAttempts / 10) * 100), 0, 100),
      actionLabel: 'Empezar sesión'
    },
    {
      id: 'foundation',
      title: 'Base estable',
      description: 'Llegá a 50 intentos para consolidar fundamentos.',
      progress: clamp(Math.round((totalAttempts / 50) * 100), 0, 100),
      actionLabel: 'Seguir practicando'
    },
    {
      id: 'consistency',
      title: 'Consistencia',
      description: 'Mantené 5 días de racha practicando.',
      progress: clamp(Math.round((streakDays / 5) * 100), 0, 100),
      actionLabel: 'Practicar hoy'
    },
    {
      id: 'precision',
      title: 'Buena puntería',
      description: 'Alcanzá 70% de precisión global.',
      progress: clamp(Math.round((accuracy / 70) * 100), 0, 100),
      actionLabel: 'Mejorar precisión'
    },
    {
      id: 'basic-mastery',
      title: 'Dominio básico',
      description: 'Dominá al menos 5 combinaciones de modo/tiempo.',
      progress: clamp(Math.round((masteredCells / 5) * 100), 0, 100),
      actionLabel: 'Reforzar puntos débiles'
    },
    {
      id: 'advanced-mastery',
      title: 'Dominio avanzado',
      description: 'Llegá a 80% de dominio global.',
      progress: clamp(Math.round((mastery / 80) * 100), 0, 100),
      actionLabel: 'Avanzar nivel'
    }
  ].map((item) => ({
    ...item,
    completed: item.progress >= 100
  }))

  // Show: last completed + next 2 incomplete (or all if fewer)
  const lastCompletedIdx = allCheckpoints.reduce((acc, cp, i) => cp.completed ? i : acc, -1)
  const nextIncomplete = allCheckpoints.filter(cp => !cp.completed)

  let visibleCheckpoints
  if (lastCompletedIdx >= 0 && nextIncomplete.length > 0) {
    visibleCheckpoints = [
      allCheckpoints[lastCompletedIdx],
      ...nextIncomplete.slice(0, 2)
    ]
  } else if (nextIncomplete.length > 0) {
    visibleCheckpoints = nextIncomplete.slice(0, 3)
  } else {
    // All completed
    visibleCheckpoints = allCheckpoints.slice(-3)
  }

  const nextCheckpoint = nextIncomplete[0] || allCheckpoints[allCheckpoints.length - 1]

  const sessionCount = Array.isArray(studyPlan?.sessionBlueprints?.sessions)
    ? studyPlan.sessionBlueprints.sessions.length
    : 0

  let adaptiveMessage = 'Buen ritmo — seguí con una sesión mixta corta para sostener la curva.'
  if (totalAttempts === 0) {
    adaptiveMessage = 'Empezá con unas conjugaciones para ver tu progreso acá.'
  } else if (streakDays === 0) {
    adaptiveMessage = 'Arrancá con una sesión breve hoy para iniciar racha.'
  } else if (mastery < 40) {
    adaptiveMessage = 'Enfocate en tus errores frecuentes antes de ampliar contenido.'
  } else if (sessionCount > 0) {
    adaptiveMessage = 'Tenés un plan personalizado — ejecutá la próxima sesión recomendada.'
  }

  return {
    checkpoints: visibleCheckpoints,
    nextCheckpoint,
    adaptiveMessage,
    totalCompleted: allCheckpoints.filter(cp => cp.completed).length,
    totalCheckpoints: allCheckpoints.length
  }
}
