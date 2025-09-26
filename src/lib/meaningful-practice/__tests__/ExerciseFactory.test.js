/**
 * Tests para ExerciseFactory
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import exerciseFactory from '../exercises/ExerciseFactory.js';
import { EXERCISE_TYPES } from '../core/constants.js';

// Mock de logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

describe('ExerciseFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createExercise', () => {
    it('should create a timeline exercise', async () => {
      const config = {
        tense: 'pretIndef',
        mood: 'ind',
        difficulty: 'intermediate'
      };

      const exercise = await exerciseFactory.createExercise(EXERCISE_TYPES.TIMELINE, config);

      expect(exercise).toBeDefined();
      expect(exercise.type).toBe(EXERCISE_TYPES.TIMELINE);
      expect(exercise.tense).toBe('pretIndef');
      expect(exercise.difficulty).toBe('intermediate');
    });

    it('should create a story building exercise', async () => {
      const config = {
        tense: 'impf',
        mood: 'ind',
        difficulty: 'advanced'
      };

      const exercise = await exerciseFactory.createExercise(EXERCISE_TYPES.STORY_BUILDING, config);

      expect(exercise).toBeDefined();
      expect(exercise.type).toBe(EXERCISE_TYPES.STORY_BUILDING);
      expect(exercise.tense).toBe('impf');
      expect(exercise.difficulty).toBe('advanced');
    });

    it('should throw error for invalid exercise type', async () => {
      const config = { tense: 'pres', mood: 'ind' };

      await expect(
        exerciseFactory.createExercise('invalid_type', config)
      ).rejects.toThrow('Unknown exercise type: invalid_type');
    });

    it('should apply default configuration when not provided', async () => {
      const exercise = await exerciseFactory.createExercise(EXERCISE_TYPES.DAILY_ROUTINE, {
        tense: 'pres',
        mood: 'ind'
      });

      expect(exercise.difficulty).toBe('intermediate'); // Default value
    });
  });

  describe('getRecommendedExercises', () => {
    it('should return recommended exercises based on criteria', async () => {
      const criteria = {
        tense: 'pres',
        mood: 'ind',
        difficulty: 'beginner',
        count: 3
      };

      const recommendations = await exerciseFactory.getRecommendedExercises(criteria);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('type');
        expect(recommendations[0]).toHaveProperty('config');
      }
    });

    it('should limit recommendations to requested count', async () => {
      const criteria = {
        tense: 'pres',
        mood: 'ind',
        count: 2
      };

      const recommendations = await exerciseFactory.getRecommendedExercises(criteria);

      expect(recommendations.length).toBeLessThanOrEqual(2);
    });
  });

  describe('createExerciseSession', () => {
    it('should create a session with multiple exercises', async () => {
      const config = {
        tense: 'pres',
        mood: 'ind',
        difficulty: 'intermediate',
        exerciseCount: 2
      };

      const session = await exerciseFactory.createExerciseSession(config);

      expect(session).toBeDefined();
      expect(session.exercises).toBeDefined();
      expect(Array.isArray(session.exercises)).toBe(true);
      expect(session.exercises.length).toBe(2);
      expect(session.sessionId).toBeDefined();
    });

    it('should create session with default count when not specified', async () => {
      const config = {
        tense: 'pres',
        mood: 'ind'
      };

      const session = await exerciseFactory.createExerciseSession(config);

      expect(session.exercises.length).toBe(3); // Default count
    });
  });

  describe('validateExerciseConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        tense: 'pres',
        mood: 'ind',
        difficulty: 'intermediate'
      };

      const validation = exerciseFactory.validateExerciseConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const config = {
        mood: 'ind'
        // Missing tense
      };

      const validation = exerciseFactory.validateExerciseConfig(config);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('tense is required');
    });

    it('should detect invalid difficulty levels', () => {
      const config = {
        tense: 'pres',
        mood: 'ind',
        difficulty: 'invalid'
      };

      const validation = exerciseFactory.validateExerciseConfig(config);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('difficulty'))).toBe(true);
    });
  });
});