/**
 * Tests para PersonalizationEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import personalizationEngine from '../personalization/PersonalizationEngine.js';
import { EXERCISE_TYPES, DIFFICULTY_LEVELS } from '../core/constants.js';

// Mock de dependencias
vi.mock('../../progress/userManager/index.js', () => ({
  getCurrentUserId: () => 'test-user-id'
}));

vi.mock('../../progress/progressRepository.js', () => ({
  getProgress: vi.fn().mockResolvedValue({
    attempts: [
      {
        score: 0.8,
        isCorrect: true,
        timeSpent: 120,
        timestamp: Date.now() - 86400000, // 1 día atrás
        metadata: {
          exerciseType: 'story_building',
          difficulty: 'intermediate',
          tense: 'impf',
          mood: 'ind',
          wordCount: 150
        }
      },
      {
        score: 0.6,
        isCorrect: false,
        timeSpent: 180,
        timestamp: Date.now() - 172800000, // 2 días atrás
        metadata: {
          exerciseType: 'role_playing',
          difficulty: 'advanced',
          tense: 'subjPres',
          mood: 'subj',
          wordCount: 80
        }
      }
    ]
  })
}));

vi.mock('../../utils/logger.js', async () => {
  const actual = await vi.importActual('../../utils/logger.js')
  return {
    ...actual,
    createLogger: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }),
    registerDebugTool: vi.fn()
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('PersonalizationEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    await personalizationEngine.initialize('test-user-id');
  });

  describe('initialize', () => {
    it('should initialize successfully with user ID', async () => {
      const result = await personalizationEngine.initialize('test-user-id');

      expect(result).toBe(true);
      expect(personalizationEngine.userId).toBe('test-user-id');
    });

    it('should create default profile for new users', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await personalizationEngine.initialize('new-user-id');

      expect(personalizationEngine.userProfile).toBeDefined();
      expect(personalizationEngine.userProfile.userId).toBe('new-user-id');
      expect(personalizationEngine.preferences).toBeDefined();
    });

    it('should load existing profile for returning users', async () => {
      const existingProfile = {
        userId: 'existing-user',
        preferences: {
          exerciseTypes: { story_building: 0.8 },
          difficultyPreference: 'advanced'
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingProfile));

      await personalizationEngine.initialize('existing-user');

      expect(personalizationEngine.preferences.exerciseTypes.story_building).toBe(0.8);
      expect(personalizationEngine.preferences.difficultyPreference).toBe('advanced');
    });
  });

  describe('recommendExerciseType', () => {
    it('should recommend exercise type based on performance', async () => {
      // Setup performance data
      personalizationEngine.adaptationMetrics.performanceByType = {
        [EXERCISE_TYPES.STORY_BUILDING]: {
          totalAttempts: 10,
          correctAttempts: 8,
          averageScore: 0.8
        },
        [EXERCISE_TYPES.ROLE_PLAYING]: {
          totalAttempts: 5,
          correctAttempts: 2,
          averageScore: 0.4
        }
      };

      const recommendation = personalizationEngine.recommendExerciseType(
        'impf',
        'ind',
        [EXERCISE_TYPES.STORY_BUILDING, EXERCISE_TYPES.ROLE_PLAYING]
      );

      expect(recommendation).toBe(EXERCISE_TYPES.STORY_BUILDING);
    });

    it('should consider tense compatibility', async () => {
      const recommendation = personalizationEngine.recommendExerciseType(
        'pres',
        'ind',
        [EXERCISE_TYPES.DAILY_ROUTINE, EXERCISE_TYPES.PROBLEM_SOLVING]
      );

      expect(recommendation).toBe(EXERCISE_TYPES.DAILY_ROUTINE);
    });

    it('should avoid recently used exercise types', async () => {
      // Mock recent usage of story building
      personalizationEngine.learningHistory = [
        { exerciseType: EXERCISE_TYPES.STORY_BUILDING, timestamp: Date.now() },
        { exerciseType: EXERCISE_TYPES.STORY_BUILDING, timestamp: Date.now() - 1000 },
        { exerciseType: EXERCISE_TYPES.STORY_BUILDING, timestamp: Date.now() - 2000 }
      ];

      const recommendation = personalizationEngine.recommendExerciseType(
        'impf',
        'ind',
        [EXERCISE_TYPES.STORY_BUILDING, EXERCISE_TYPES.TIMELINE]
      );

      // Should prefer timeline due to variety factor
      expect(recommendation).toBe(EXERCISE_TYPES.TIMELINE);
    });
  });

  describe('recommendDifficulty', () => {
    it('should increase difficulty for high-performing users', async () => {
      personalizationEngine.adaptationMetrics.performanceByType = {
        [EXERCISE_TYPES.STORY_BUILDING]: {
          totalAttempts: 10,
          correctAttempts: 9,
          averageScore: 0.9
        }
      };

      personalizationEngine.preferences.difficultyPreference = DIFFICULTY_LEVELS.INTERMEDIATE;

      const recommendation = personalizationEngine.recommendDifficulty(EXERCISE_TYPES.STORY_BUILDING);

      expect(recommendation).toBe(DIFFICULTY_LEVELS.ADVANCED);
    });

    it('should decrease difficulty for struggling users', async () => {
      personalizationEngine.adaptationMetrics.performanceByType = {
        [EXERCISE_TYPES.ROLE_PLAYING]: {
          totalAttempts: 10,
          correctAttempts: 3,
          averageScore: 0.4
        }
      };

      personalizationEngine.preferences.difficultyPreference = DIFFICULTY_LEVELS.INTERMEDIATE;

      const recommendation = personalizationEngine.recommendDifficulty(EXERCISE_TYPES.ROLE_PLAYING);

      expect(recommendation).toBe(DIFFICULTY_LEVELS.BEGINNER);
    });

    it('should adjust based on learning velocity', async () => {
      personalizationEngine.adaptationMetrics.learningVelocity = 0.8; // High velocity
      personalizationEngine.preferences.difficultyPreference = DIFFICULTY_LEVELS.BEGINNER;

      const recommendation = personalizationEngine.recommendDifficulty(EXERCISE_TYPES.TIMELINE);

      expect(recommendation).toBe(DIFFICULTY_LEVELS.INTERMEDIATE);
    });
  });

  describe('calculateAdaptationMetrics', () => {
    it('should calculate performance metrics correctly', async () => {
      await personalizationEngine.calculateAdaptationMetrics();

      expect(personalizationEngine.adaptationMetrics.performanceByType).toBeDefined();
      expect(personalizationEngine.adaptationMetrics.engagementByType).toBeDefined();
      expect(personalizationEngine.adaptationMetrics.learningVelocity).toBeGreaterThanOrEqual(0);
      expect(personalizationEngine.adaptationMetrics.learningVelocity).toBeLessThanOrEqual(1);
    });

    it('should calculate learning velocity based on improvement', async () => {
      // Mock history with improvement over time
      personalizationEngine.learningHistory = [
        { score: 0.9, timestamp: Date.now() },
        { score: 0.8, timestamp: Date.now() - 86400000 },
        { score: 0.7, timestamp: Date.now() - 172800000 },
        { score: 0.6, timestamp: Date.now() - 259200000 },
        { score: 0.5, timestamp: Date.now() - 345600000 }
      ];

      await personalizationEngine.calculateAdaptationMetrics();

      expect(personalizationEngine.adaptationMetrics.learningVelocity).toBeGreaterThan(0.5);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences based on engagement', async () => {
      const result = {
        success: true,
        timeSpent: 300,
        userResponse: 'Esta es una respuesta muy detallada y completa que muestra buen engagement del usuario con el ejercicio.'
      };

      const initialPreference = personalizationEngine.preferences.exerciseTypes[EXERCISE_TYPES.STORY_BUILDING] || 0.5;

      await personalizationEngine.updatePreferences(result, EXERCISE_TYPES.STORY_BUILDING);

      const newPreference = personalizationEngine.preferences.exerciseTypes[EXERCISE_TYPES.STORY_BUILDING];

      expect(newPreference).toBeDefined();
      expect(newPreference).toBeGreaterThanOrEqual(0.1);
      expect(newPreference).toBeLessThanOrEqual(0.9);
    });

    it('should save updated profile', async () => {
      const result = { success: true, timeSpent: 200, userResponse: 'Test response' };

      await personalizationEngine.updatePreferences(result, EXERCISE_TYPES.TIMELINE);

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return comprehensive recommendations', async () => {
      const recommendations = personalizationEngine.getPersonalizedRecommendations(
        'pres',
        'ind',
        [EXERCISE_TYPES.DAILY_ROUTINE, EXERCISE_TYPES.TIMELINE]
      );

      expect(recommendations.exerciseType).toBeDefined();
      expect(recommendations.difficulty).toBeDefined();
      expect(recommendations.estimatedTime).toBeGreaterThan(0);
      expect(recommendations.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendations.confidence).toBeLessThanOrEqual(1);
      expect(recommendations.reasoning).toBeDefined();
    });

    it('should estimate reasonable time for exercises', async () => {
      const recommendations = personalizationEngine.getPersonalizedRecommendations(
        'impf',
        'ind',
        [EXERCISE_TYPES.STORY_BUILDING]
      );

      expect(recommendations.estimatedTime).toBeGreaterThan(5);
      expect(recommendations.estimatedTime).toBeLessThan(30);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement based on multiple factors', async () => {
      const result = {
        success: true,
        timeSpent: 240, // 4 minutes - good engagement time
        userResponse: 'Esta es una respuesta detallada que muestra buen engagement y participación activa del usuario en el ejercicio de práctica.'
      };

      const score = personalizationEngine.calculateEngagementScore(result);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should penalize very short responses', async () => {
      const result = {
        success: false,
        timeSpent: 30,
        userResponse: 'Sí.'
      };

      const score = personalizationEngine.calculateEngagementScore(result);

      expect(score).toBeLessThan(0.7);
    });
  });

  describe('getTypeCompatibilityBonus', () => {
    it('should give bonus for compatible tense-exercise combinations', async () => {
      const bonus = personalizationEngine.getTypeCompatibilityBonus(
        EXERCISE_TYPES.DAILY_ROUTINE,
        'pres',
        'ind'
      );

      expect(bonus).toBeGreaterThan(0);
    });

    it('should give no bonus for incompatible combinations', async () => {
      const bonus = personalizationEngine.getTypeCompatibilityBonus(
        EXERCISE_TYPES.DAILY_ROUTINE,
        'subjPres',
        'subj'
      );

      expect(bonus).toBe(0);
    });
  });

  describe('difficulty adjustment', () => {
    it('should increase difficulty properly', async () => {
      const increased = personalizationEngine.increaseDifficulty(DIFFICULTY_LEVELS.BEGINNER);
      expect(increased).toBe(DIFFICULTY_LEVELS.INTERMEDIATE);

      const maxIncreased = personalizationEngine.increaseDifficulty(DIFFICULTY_LEVELS.EXPERT);
      expect(maxIncreased).toBe(DIFFICULTY_LEVELS.EXPERT);
    });

    it('should decrease difficulty properly', async () => {
      const decreased = personalizationEngine.decreaseDifficulty(DIFFICULTY_LEVELS.ADVANCED);
      expect(decreased).toBe(DIFFICULTY_LEVELS.INTERMEDIATE);

      const minDecreased = personalizationEngine.decreaseDifficulty(DIFFICULTY_LEVELS.BEGINNER);
      expect(minDecreased).toBe(DIFFICULTY_LEVELS.BEGINNER);
    });
  });

  describe('recommendation confidence', () => {
    it('should calculate confidence based on available data', async () => {
      // Mock sufficient data
      personalizationEngine.learningHistory = new Array(30).fill(0).map((_, i) => ({
        exerciseType: EXERCISE_TYPES.STORY_BUILDING,
        score: 0.7,
        timestamp: Date.now() - i * 86400000
      }));

      personalizationEngine.adaptationMetrics.performanceByType = {
        [EXERCISE_TYPES.STORY_BUILDING]: {
          totalAttempts: 20,
          averageScore: 0.8
        }
      };

      const confidence = personalizationEngine.calculateRecommendationConfidence(EXERCISE_TYPES.STORY_BUILDING);

      expect(confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence with limited data', async () => {
      personalizationEngine.learningHistory = [];
      personalizationEngine.adaptationMetrics.performanceByType = {};

      const confidence = personalizationEngine.calculateRecommendationConfidence(EXERCISE_TYPES.TIMELINE);

      expect(confidence).toBeLessThan(0.7);
    });
  });
});
