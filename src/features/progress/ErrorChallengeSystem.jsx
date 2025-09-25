import React, { useState, useEffect, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'
import './ErrorChallengeSystem.css'

export default function ErrorChallengeSystem({ onStartChallenge, userStats: _userStats }) {
  const [challenges, setChallenges] = useState([])
  const [userProgress, setUserProgress] = useState({
    totalXP: 0,
    level: 1,
    badges: [],
    streaks: {},
    completedChallenges: []
  })
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(null)

  useEffect(() => {
    loadChallenges()
    loadUserProgress()
  }, [])

  async function loadChallenges() {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const generatedChallenges = generateGameifiedChallenges(attempts)
      setChallenges(generatedChallenges)
    } catch (error) {
      console.error('Error loading challenges:', error)
    }
  }

  function loadUserProgress() {
    // Cargar progreso del usuario desde localStorage o base de datos
    const saved = localStorage.getItem(`error-challenge-progress-${getCurrentUserId()}`)
    if (saved) {
      setUserProgress(JSON.parse(saved))
    }
  }

  function acceptChallenge(challenge) {
    onStartChallenge?.(challenge)

    // Actualizar estado del challenge
    const updatedChallenges = challenges.map(c =>
      c.id === challenge.id ? { ...c, status: 'active', startedAt: new Date() } : c
    )
    setChallenges(updatedChallenges)
  }

  const challengesByCategory = useMemo(() => {
    return challenges.reduce((acc, challenge) => {
      const category = challenge.category || 'general'
      if (!acc[category]) acc[category] = []
      acc[category].push(challenge)
      return acc
    }, {})
  }, [challenges])

  return (
    <div className="error-challenge-system">
      {showBadgeAnimation && (
        <BadgeUnlockAnimation
          badge={showBadgeAnimation}
          onComplete={() => setShowBadgeAnimation(null)}
        />
      )}

      <div className="challenge-header">
        <div className="user-progress-summary">
          <div className="progress-item">
            <div className="progress-icon"></div>
            <div className="progress-info">
              <span className="progress-value">{userProgress.totalXP}</span>
              <span className="progress-label">XP Total</span>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-icon"></div>
            <div className="progress-info">
              <span className="progress-value">Nivel {userProgress.level}</span>
              <span className="progress-label">
                {getXPForNextLevel(userProgress.totalXP) - userProgress.totalXP} XP para subir
              </span>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-icon">️</div>
            <div className="progress-info">
              <span className="progress-value">{userProgress.badges.length}</span>
              <span className="progress-label">Medallas</span>
            </div>
          </div>
        </div>

        <div className="level-progress-bar">
          <div className="level-bar">
            <div
              className="level-bar-fill"
              style={{
                width: `${getLevelProgress(userProgress.totalXP)}%`
              }}
            />
          </div>
          <span className="level-text">Nivel {userProgress.level}</span>
        </div>
      </div>

      <div className="badges-showcase">
        <h3> Colección de Medallas</h3>
        <div className="badges-grid">
          {getAllAvailableBadges().map(badge => {
            const isUnlocked = userProgress.badges.some(b => b.id === badge.id)
            return (
              <div
                key={badge.id}
                className={`badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="badge-icon">
                  {isUnlocked ? badge.icon : ''}
                </div>
                <div className="badge-info">
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-description">{badge.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="challenges-sections">
        {Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
          <ChallengeCategory
            key={category}
            category={category}
            challenges={categoryChallenges}
            onAcceptChallenge={acceptChallenge}
            userProgress={userProgress}
          />
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="no-challenges">
          <div className="no-challenges-icon"></div>
          <h3>¡Felicitaciones!</h3>
          <p>Has completado todos los desafíos disponibles. ¡Sigue practicando para desbloquear nuevos retos!</p>
        </div>
      )}
    </div>
  )
}

function ChallengeCategory({ category, challenges, onAcceptChallenge, userProgress }) {
  const categoryInfo = getCategoryInfo(category)

  return (
    <div className="challenge-category">
      <div className="category-header">
        <div className="category-icon">{categoryInfo.icon}</div>
        <div className="category-info">
          <h3>{categoryInfo.name}</h3>
          <p>{categoryInfo.description}</p>
        </div>
        <div className="category-stats">
          <span className="challenge-count">{challenges.length} desafíos</span>
        </div>
      </div>

      <div className="challenges-grid">
        {challenges.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onAccept={onAcceptChallenge}
            userProgress={userProgress}
          />
        ))}
      </div>
    </div>
  )
}

function ChallengeCard({ challenge, onAccept, userProgress }) {
  const isCompleted = userProgress.completedChallenges.includes(challenge.id)
  const canStart = !isCompleted && challenge.status !== 'active'

  return (
    <div className={`challenge-card ${challenge.difficulty} ${challenge.status || 'available'}`}>
      <div className="challenge-header">
        <div className="challenge-title">
          <span className="challenge-emoji">{challenge.emoji}</span>
          <h4>{challenge.title}</h4>
        </div>
        <div className="challenge-difficulty">
          {''.repeat(Math.max(1, challenge.difficultyLevel || 1))}
        </div>
      </div>

      <div className="challenge-description">
        {challenge.description}
      </div>

      <div className="challenge-objectives">
        <h5> Objetivos:</h5>
        <ul>
          {challenge.objectives.map((objective, index) => (
            <li key={index}>{objective}</li>
          ))}
        </ul>
      </div>

      <div className="challenge-rewards">
        <div className="reward-item">
          <span className="reward-icon"></span>
          <span>{challenge.xpReward} XP</span>
        </div>
        {challenge.badgeReward && (
          <div className="reward-item">
            <span className="reward-icon"></span>
            <span>{challenge.badgeReward.name}</span>
          </div>
        )}
        {challenge.bonusRewards && challenge.bonusRewards.map((bonus, index) => (
          <div key={index} className="reward-item bonus">
            <span className="reward-icon">{bonus.icon}</span>
            <span>{bonus.name}</span>
          </div>
        ))}
      </div>

      <div className="challenge-progress">
        {challenge.progress && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(challenge.progress.current / challenge.progress.target) * 100}%` }}
            />
            <span className="progress-text">
              {challenge.progress.current} / {challenge.progress.target}
            </span>
          </div>
        )}
      </div>

      <div className="challenge-actions">
        {isCompleted ? (
          <div className="completed-indicator">
            ✅ Completado
          </div>
        ) : challenge.status === 'active' ? (
          <div className="active-indicator">
             En progreso...
          </div>
        ) : canStart ? (
          <button
            className="accept-challenge-btn"
            onClick={() => onAccept(challenge)}
          >
            ¡Acepto el Desafío!
          </button>
        ) : (
          <div className="unavailable-indicator">
             Proximamente
          </div>
        )}
      </div>

      {challenge.timeLimit && (
        <div className="challenge-timer">
           {challenge.timeLimit}
        </div>
      )}
    </div>
  )
}

function BadgeUnlockAnimation({ badge, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="badge-unlock-overlay">
      <div className="badge-unlock-animation">
        <div className="unlock-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${i * 0.1}s`,
              '--angle': `${(360 / 20) * i}deg`
            }} />
          ))}
        </div>
        <div className="unlock-badge">
          <div className="badge-glow">
            <div className="badge-icon-large">{badge.icon}</div>
          </div>
          <h2>¡Nueva Medalla!</h2>
          <h3>{badge.name}</h3>
          <p>{badge.description}</p>
          <div className="unlock-xp">+{badge.xp || 50} XP</div>
        </div>
      </div>
    </div>
  )
}

// Funciones de generación de challenges
function generateGameifiedChallenges(attempts) {
  const challenges = []
  const recentErrors = attempts.slice(-300).filter(a => !a.correct)
  const errorStats = analyzeErrorStats(recentErrors)

  // Boss Fight Challenges - Los errores más problemáticos
  const topErrors = Object.entries(errorStats.byType)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 3)

  topErrors.forEach(([errorType, stats], index) => {
    const isBoss = index === 0
    challenges.push({
      id: `boss-${errorType}`,
      category: 'boss',
      type: 'boss_fight',
      title: isBoss ? ` Boss Final: ${getErrorTagLabel(errorType)}` : `⚔️ Mini Boss: ${getErrorTagLabel(errorType)}`,
      emoji: isBoss ? '' : '⚔️',
      description: `Tu mayor enemigo: ${getErrorTagLabel(errorType)}. ${stats.count} errores recientes detectados.`,
      difficulty: isBoss ? 'legendary' : 'epic',
      difficultyLevel: isBoss ? 5 : 4,
      objectives: [
        `Reduce errores de ${getErrorTagLabel(errorType)} en 70%`,
        'Mantén >85% precisión en 20 intentos consecutivos',
        isBoss ? 'Completa sin usar pistas' : 'Usa máximo 3 pistas'
      ],
      xpReward: isBoss ? 200 : 100,
      badgeReward: isBoss ? {
        id: `boss-slayer-${errorType}`,
        name: 'Boss Slayer',
        icon: '',
        description: 'Derrotaste a tu error más problemático'
      } : null,
      bonusRewards: isBoss ? [
        { icon: '', name: 'Gema de la Victoria' },
        { icon: '', name: 'Orbe de Sabiduría' }
      ] : null,
      errorType,
      targetImprovement: 0.7,
      timeLimit: '7 días',
      progress: {
        current: 0,
        target: 20
      }
    })
  })

  // Rescue Mission Challenges - Recuperar habilidades perdidas
  const strugglingAreas = findStrugglingAreas(attempts)
  strugglingAreas.forEach((area, _index) => {
    challenges.push({
      id: `rescue-${area.combo}`,
      category: 'rescue',
      type: 'rescue_mission',
      title: ` Misión de Rescate: ${area.name}`,
      emoji: '',
      description: `Rescata tu dominio en ${area.name}. Precisión actual: ${Math.round(area.accuracy * 100)}%`,
      difficulty: 'heroic',
      difficultyLevel: 3,
      objectives: [
        `Alcanza 80% de precisión en ${area.name}`,
        'Completa 15 ejercicios consecutivos',
        'Mantén la racha por 3 días'
      ],
      xpReward: 75,
      badgeReward: {
        id: `rescuer-${area.combo}`,
        name: 'Rescatista',
        icon: '',
        description: `Rescataste tu dominio en ${area.name}`
      },
      combo: area.combo,
      currentAccuracy: area.accuracy,
      targetAccuracy: 0.8,
      timeLimit: '5 días',
      progress: {
        current: 0,
        target: 15
      }
    })
  })

  // Consistency Master Challenges
  const consistencyScore = calculateConsistencyScore(attempts)
  if (consistencyScore < 0.75) {
    challenges.push({
      id: 'consistency-master',
      category: 'consistency',
      type: 'consistency_challenge',
      title: ' Maestro de la Consistencia',
      emoji: '',
      description: 'Desarrolla un rendimiento constante día tras día.',
      difficulty: 'epic',
      difficultyLevel: 4,
      objectives: [
        'Mantén >75% precisión por 7 días consecutivos',
        'Practica al menos 10 ejercicios diarios',
        'No tengas días con <60% precisión'
      ],
      xpReward: 150,
      badgeReward: {
        id: 'consistency-master',
        name: 'Maestro Constante',
        icon: '',
        description: 'Mantuviste alta consistencia por una semana'
      },
      timeLimit: '7 días',
      progress: {
        current: 0,
        target: 7
      }
    })
  }

  // Speed Challenge
  const avgResponseTime = calculateAverageResponseTime(attempts)
  if (avgResponseTime > 5000) {
    challenges.push({
      id: 'speed-demon',
      category: 'skill',
      type: 'speed_challenge',
      title: ' Demonio de la Velocidad',
      emoji: '',
      description: 'Mejora tu velocidad de respuesta manteniendo la precisión.',
      difficulty: 'rare',
      difficultyLevel: 3,
      objectives: [
        'Responde en <4 segundos promedio',
        'Mantén >80% precisión',
        'Completa 25 ejercicios rápidos'
      ],
      xpReward: 80,
      currentSpeed: avgResponseTime,
      targetSpeed: 4000,
      timeLimit: '3 días',
      progress: {
        current: 0,
        target: 25
      }
    })
  }

  // Perfect Week Challenge
  challenges.push({
    id: 'perfect-week',
    category: 'achievement',
    type: 'perfection_challenge',
    title: ' Semana Perfecta',
    emoji: '',
    description: 'Logra una semana de práctica sin errores significativos.',
    difficulty: 'legendary',
    difficultyLevel: 5,
    objectives: [
      'Mantén >90% precisión todos los días',
      'Practica mínimo 20 ejercicios diarios',
      'No faltes ningún día de la semana'
    ],
    xpReward: 300,
    badgeReward: {
      id: 'perfectionist',
      name: 'Perfeccionista',
      icon: '',
      description: 'Completaste una semana perfecta de práctica'
    },
    bonusRewards: [
      { icon: '', name: 'Corona de la Perfección' },
      { icon: '', name: 'Aura Dorada' }
    ],
    timeLimit: '7 días',
    progress: {
      current: 0,
      target: 7
    }
  })

  // Error Type Mastery Challenges
  Object.values(ERROR_TAGS).forEach(errorTag => {
    const errorCount = errorStats.byType[errorTag]?.count || 0
    if (errorCount > 10) {
      challenges.push({
        id: `mastery-${errorTag}`,
        category: 'mastery',
        type: 'mastery_challenge',
        title: ` Maestría: ${getErrorTagLabel(errorTag)}`,
        emoji: '',
        description: `Domina completamente los errores de ${getErrorTagLabel(errorTag)}.`,
        difficulty: 'epic',
        difficultyLevel: 4,
        objectives: [
          `Reduce errores de ${getErrorTagLabel(errorTag)} a <5%`,
          'Demuestra dominio en 30 ejercicios',
          'Enseña a otros (comparte tips)'
        ],
        xpReward: 120,
        badgeReward: {
          id: `master-${errorTag}`,
          name: `Maestro de ${getErrorTagLabel(errorTag)}`,
          icon: '',
          description: `Dominaste completamente ${getErrorTagLabel(errorTag)}`
        },
        errorType: errorTag,
        timeLimit: '14 días',
        progress: {
          current: 0,
          target: 30
        }
      })
    }
  })

  return challenges.slice(0, 12) // Límite de challenges activos
}

// Funciones auxiliares
function analyzeErrorStats(errors) {
  const byType = {}
  const byTime = {}

  errors.forEach(error => {
    if (Array.isArray(error.errorTags)) {
      error.errorTags.forEach(tag => {
        if (!byType[tag]) byType[tag] = { count: 0, recent: [] }
        byType[tag].count++
        byType[tag].recent.push(error)
      })
    }

    const hour = new Date(error.createdAt).getHours()
    if (!byTime[hour]) byTime[hour] = 0
    byTime[hour]++
  })

  return { byType, byTime }
}

function findStrugglingAreas(attempts) {
  const areas = {}

  attempts.slice(-200).forEach(attempt => {
    const combo = `${attempt.mood}-${attempt.tense}`
    if (!areas[combo]) {
      areas[combo] = {
        combo,
        name: `${formatMood(attempt.mood)} ${formatTense(attempt.tense)}`,
        total: 0,
        correct: 0
      }
    }
    areas[combo].total++
    if (attempt.correct) areas[combo].correct++
  })

  return Object.values(areas)
    .filter(area => area.total >= 10)
    .map(area => ({ ...area, accuracy: area.correct / area.total }))
    .filter(area => area.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
}

function calculateConsistencyScore(attempts) {
  const last7Days = attempts.slice(-70) // ~10 per day
  const dailyAccuracy = {}

  last7Days.forEach(attempt => {
    const date = new Date(attempt.createdAt).toDateString()
    if (!dailyAccuracy[date]) {
      dailyAccuracy[date] = { correct: 0, total: 0 }
    }
    dailyAccuracy[date].total++
    if (attempt.correct) dailyAccuracy[date].correct++
  })

  const accuracies = Object.values(dailyAccuracy)
    .map(day => day.total > 0 ? day.correct / day.total : 0)

  if (accuracies.length === 0) return 0

  const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
  const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length

  return Math.max(0, 1 - Math.sqrt(variance))
}

function calculateAverageResponseTime(attempts) {
  const withLatency = attempts.filter(a => a.latencyMs && a.latencyMs > 0)
  if (withLatency.length === 0) return 0
  return withLatency.reduce((sum, a) => sum + a.latencyMs, 0) / withLatency.length
}

function calculateLevel(totalXP) {
  // Sistema de niveles exponencial
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

function getXPForNextLevel(currentXP) {
  const currentLevel = calculateLevel(currentXP)
  return Math.pow(currentLevel, 2) * 100
}

function getLevelProgress(totalXP) {
  const currentLevel = calculateLevel(totalXP)
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100
  const nextLevelXP = Math.pow(currentLevel, 2) * 100
  return ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
}

function getAllAvailableBadges() {
  return [
    { id: 'boss-slayer', name: 'Cazador de Jefes', icon: '', description: 'Derrota a tu error más problemático' },
    { id: 'rescuer', name: 'Rescatista', icon: '', description: 'Rescata un área problemática' },
    { id: 'consistency-master', name: 'Maestro Constante', icon: '', description: 'Mantén consistencia por una semana' },
    { id: 'speed-demon', name: 'Demonio de Velocidad', icon: '', description: 'Mejora significativamente tu velocidad' },
    { id: 'perfectionist', name: 'Perfeccionista', icon: '', description: 'Completa una semana perfecta' },
    { id: 'scholar', name: 'Erudito', icon: '', description: 'Domina un tipo de error específico' },
    { id: 'marathon', name: 'Maratonista', icon: '', description: 'Practica 100 días consecutivos' },
    { id: 'comeback-kid', name: 'Rey del Regreso', icon: '', description: 'Supera una racha de errores' }
  ]
}

function getCategoryInfo(category) {
  const info = {
    boss: {
      name: 'Boss Fights',
      icon: '',
      description: 'Enfréntate a tus errores más problemáticos'
    },
    rescue: {
      name: 'Misiones de Rescate',
      icon: '',
      description: 'Recupera áreas donde has perdido dominio'
    },
    consistency: {
      name: 'Desafíos de Consistencia',
      icon: '',
      description: 'Desarrolla hábitos de práctica constante'
    },
    skill: {
      name: 'Desafíos de Habilidad',
      icon: '',
      description: 'Mejora velocidad, precisión y técnica'
    },
    achievement: {
      name: 'Logros Épicos',
      icon: '',
      description: 'Los retos más difíciles y prestigiosos'
    },
    mastery: {
      name: 'Maestría Total',
      icon: '',
      description: 'Domina completamente cada tipo de error'
    }
  }
  return info[category] || { name: 'Desafíos', icon: '', description: 'Desafíos variados' }
}

function getErrorTagLabel(tag) {
  const labels = {
    [ERROR_TAGS.ACCENT]: 'Acentuación',
    [ERROR_TAGS.VERBAL_ENDING]: 'Terminaciones Verbales',
    [ERROR_TAGS.IRREGULAR_STEM]: 'Raíces Irregulares',
    [ERROR_TAGS.WRONG_PERSON]: 'Persona Incorrecta',
    [ERROR_TAGS.WRONG_TENSE]: 'Tiempo Incorrecto',
    [ERROR_TAGS.WRONG_MOOD]: 'Modo Incorrecto',
    [ERROR_TAGS.CLITIC_PRONOUNS]: 'Pronombres Clíticos',
    [ERROR_TAGS.ORTHOGRAPHY_C_QU]: 'Ortografía C/QU',
    [ERROR_TAGS.ORTHOGRAPHY_G_GU]: 'Ortografía G/GU',
    [ERROR_TAGS.ORTHOGRAPHY_Z_C]: 'Ortografía Z/C',
    [ERROR_TAGS.OTHER_VALID_FORM]: 'Otra Forma Válida'
  }
  return labels[tag] || 'Error Desconocido'
}

function formatMood(mood) {
  const moods = {
    indicative: 'Indicativo',
    subjunctive: 'Subjuntivo',
    imperative: 'Imperativo',
    conditional: 'Condicional'
  }
  return moods[mood] || mood
}

function formatTense(tense) {
  const tenses = {
    pres: 'Presente',
    pretIndef: 'Pretérito Indefinido',
    impf: 'Imperfecto',
    fut: 'Futuro',
    pretPerf: 'Pretérito Perfecto'
  }
  return tenses[tense] || tense
}
