// Achievement system for Spanish Conjugator
// Defines various achievements users can unlock through learning activities

export const ACHIEVEMENT_TYPES = {
  STREAK: 'streak',
  MASTERY: 'mastery',
  PRACTICE: 'practice',
  PERFECT: 'perfect',
  EXPLORER: 'explorer',
  SPEED: 'speed',
  DEDICATION: 'dedication'
};

export const ACHIEVEMENT_TIERS = {
  BRONZE: { name: 'bronze', points: 10, color: '#CD7F32' },
  SILVER: { name: 'silver', points: 25, color: '#C0C0C0' },
  GOLD: { name: 'gold', points: 50, color: '#FFD700' },
  PLATINUM: { name: 'platinum', points: 100, color: '#E5E4E2' },
  DIAMOND: { name: 'diamond', points: 200, color: '#B9F2FF' }
};

export const achievements = [
  // Streak Achievements
  {
    id: 'streak_3',
    type: ACHIEVEMENT_TYPES.STREAK,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    title: 'Primer Impulso',
    description: 'Mantén una racha de 3 días practicando',
    icon: '🔥',
    requirement: 3,
    checkCondition: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    type: ACHIEVEMENT_TYPES.STREAK,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Una Semana Completa',
    description: 'Practica durante 7 días consecutivos',
    icon: '🔥',
    requirement: 7,
    checkCondition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_30',
    type: ACHIEVEMENT_TYPES.STREAK,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Mes de Dedicación',
    description: 'Mantén una racha de 30 días',
    icon: '🔥',
    requirement: 30,
    checkCondition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_100',
    type: ACHIEVEMENT_TYPES.STREAK,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    title: 'Centurión del Español',
    description: 'Increíble racha de 100 días',
    icon: '🔥',
    requirement: 100,
    checkCondition: (stats) => stats.currentStreak >= 100
  },

  // Mastery Achievements
  {
    id: 'master_present',
    type: ACHIEVEMENT_TYPES.MASTERY,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Maestro del Presente',
    description: 'Domina el tiempo presente con 90%+ precisión',
    icon: '⏰',
    requirement: { tense: 'pres', accuracy: 0.9 },
    checkCondition: (stats) => stats.tenseAccuracy?.pres >= 0.9
  },
  {
    id: 'master_preterite',
    type: ACHIEVEMENT_TYPES.MASTERY,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Conquistador del Pretérito',
    description: 'Domina el pretérito indefinido con 85%+ precisión',
    icon: '🏆',
    requirement: { tense: 'pretIndef', accuracy: 0.85 },
    checkCondition: (stats) => stats.tenseAccuracy?.pretIndef >= 0.85
  },
  {
    id: 'master_subjunctive',
    type: ACHIEVEMENT_TYPES.MASTERY,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    title: 'Domador del Subjuntivo',
    description: 'Conquista el subjuntivo presente con 80%+ precisión',
    icon: '🎯',
    requirement: { tense: 'presSub', accuracy: 0.8 },
    checkCondition: (stats) => stats.tenseAccuracy?.presSub >= 0.8
  },

  // Practice Volume Achievements
  {
    id: 'practice_100',
    type: ACHIEVEMENT_TYPES.PRACTICE,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    title: 'Principiante Dedicado',
    description: 'Completa 100 ejercicios',
    icon: '📚',
    requirement: 100,
    checkCondition: (stats) => stats.totalExercises >= 100
  },
  {
    id: 'practice_500',
    type: ACHIEVEMENT_TYPES.PRACTICE,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Estudiante Comprometido',
    description: 'Completa 500 ejercicios',
    icon: '📚',
    requirement: 500,
    checkCondition: (stats) => stats.totalExercises >= 500
  },
  {
    id: 'practice_1000',
    type: ACHIEVEMENT_TYPES.PRACTICE,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Mil Ejercicios',
    description: 'Alcanza la marca de 1000 ejercicios',
    icon: '📚',
    requirement: 1000,
    checkCondition: (stats) => stats.totalExercises >= 1000
  },
  {
    id: 'practice_5000',
    type: ACHIEVEMENT_TYPES.PRACTICE,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    title: 'Veterano del Español',
    description: 'Increíbles 5000 ejercicios completados',
    icon: '📚',
    requirement: 5000,
    checkCondition: (stats) => stats.totalExercises >= 5000
  },

  // Perfect Sessions
  {
    id: 'perfect_10',
    type: ACHIEVEMENT_TYPES.PERFECT,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    title: 'Sesión Perfecta',
    description: 'Completa 10 ejercicios consecutivos sin errores',
    icon: '💎',
    requirement: 10,
    checkCondition: (stats) => stats.currentPerfectStreak >= 10
  },
  {
    id: 'perfect_25',
    type: ACHIEVEMENT_TYPES.PERFECT,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Precisión Excepcional',
    description: '25 ejercicios perfectos consecutivos',
    icon: '💎',
    requirement: 25,
    checkCondition: (stats) => stats.currentPerfectStreak >= 25
  },
  {
    id: 'perfect_50',
    type: ACHIEVEMENT_TYPES.PERFECT,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Máquina de Precisión',
    description: '50 respuestas perfectas consecutivas',
    icon: '💎',
    requirement: 50,
    checkCondition: (stats) => stats.currentPerfectStreak >= 50
  },

  // Explorer Achievements
  {
    id: 'explorer_5_tenses',
    type: ACHIEVEMENT_TYPES.EXPLORER,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Explorador Temporal',
    description: 'Practica con 5 tiempos verbales diferentes',
    icon: '🗺️',
    requirement: 5,
    checkCondition: (stats) => Object.keys(stats.tensesPracticed || {}).length >= 5
  },
  {
    id: 'explorer_all_persons',
    type: ACHIEVEMENT_TYPES.EXPLORER,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Maestro de Personas',
    description: 'Practica con todas las personas gramaticales',
    icon: '👥',
    requirement: 6,
    checkCondition: (stats) => Object.keys(stats.personsPracticed || {}).length >= 6
  },
  {
    id: 'explorer_50_verbs',
    type: ACHIEVEMENT_TYPES.EXPLORER,
    tier: ACHIEVEMENT_TIERS.PLATINUM,
    title: 'Coleccionista de Verbos',
    description: 'Practica con 50 verbos diferentes',
    icon: '🎨',
    requirement: 50,
    checkCondition: (stats) => Object.keys(stats.verbsPracticed || {}).length >= 50
  },

  // Speed Achievements
  {
    id: 'speed_fast',
    type: ACHIEVEMENT_TYPES.SPEED,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    title: 'Respuesta Rápida',
    description: 'Responde 10 ejercicios en menos de 3 segundos cada uno',
    icon: '⚡',
    requirement: { count: 10, maxTime: 3000 },
    checkCondition: (stats) => stats.fastAnswers >= 10
  },
  {
    id: 'speed_lightning',
    type: ACHIEVEMENT_TYPES.SPEED,
    tier: ACHIEVEMENT_TIERS.GOLD,
    title: 'Velocidad del Rayo',
    description: 'Responde 25 ejercicios en menos de 2 segundos cada uno',
    icon: '⚡',
    requirement: { count: 25, maxTime: 2000 },
    checkCondition: (stats) => stats.lightningAnswers >= 25
  },

  // Dedication Achievements
  {
    id: 'dedication_weekend',
    type: ACHIEVEMENT_TYPES.DEDICATION,
    tier: ACHIEVEMENT_TIERS.BRONZE,
    title: 'Fin de Semana Productivo',
    description: 'Practica durante un fin de semana completo',
    icon: '🎯',
    requirement: 'weekend_practice',
    checkCondition: (stats) => stats.weekendSessions >= 2
  },
  {
    id: 'dedication_early_bird',
    type: ACHIEVEMENT_TYPES.DEDICATION,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Madrugador',
    description: 'Practica antes de las 7:00 AM por 5 días',
    icon: '🌅',
    requirement: 'early_practice',
    checkCondition: (stats) => stats.earlyBirdSessions >= 5
  },
  {
    id: 'dedication_night_owl',
    type: ACHIEVEMENT_TYPES.DEDICATION,
    tier: ACHIEVEMENT_TIERS.SILVER,
    title: 'Búho Nocturno',
    description: 'Practica después de las 10:00 PM por 5 días',
    icon: '🦉',
    requirement: 'night_practice',
    checkCondition: (stats) => stats.nightOwlSessions >= 5
  }
];

// Function to check which achievements a user has earned
export function checkAchievements(userStats, currentAchievements = []) {
  const newAchievements = [];
  const currentAchievementIds = new Set(currentAchievements.map(a => a.id));

  for (const achievement of achievements) {
    if (!currentAchievementIds.has(achievement.id) && achievement.checkCondition(userStats)) {
      newAchievements.push({
        ...achievement,
        unlockedAt: new Date().toISOString(),
        points: achievement.tier.points
      });
    }
  }

  return newAchievements;
}

// Function to calculate total achievement points
export function calculateTotalPoints(userAchievements) {
  return userAchievements.reduce((total, achievement) => {
    return total + (achievement.points || achievement.tier.points || 0);
  }, 0);
}

// Function to get user's achievement level based on points
export function getUserLevel(totalPoints) {
  const levels = [
    { level: 1, name: 'Principiante', minPoints: 0, color: '#8B4513' },
    { level: 2, name: 'Novato', minPoints: 50, color: '#CD7F32' },
    { level: 3, name: 'Estudiante', minPoints: 150, color: '#C0C0C0' },
    { level: 4, name: 'Intermedio', minPoints: 300, color: '#FFD700' },
    { level: 5, name: 'Avanzado', minPoints: 600, color: '#E5E4E2' },
    { level: 6, name: 'Experto', minPoints: 1000, color: '#B9F2FF' },
    { level: 7, name: 'Maestro', minPoints: 1500, color: '#9370DB' },
    { level: 8, name: 'Leyenda', minPoints: 2500, color: '#FF1493' }
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalPoints >= levels[i].minPoints) {
      return levels[i];
    }
  }
  
  return levels[0];
}