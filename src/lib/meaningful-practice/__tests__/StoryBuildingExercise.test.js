/**
 * Tests para StoryBuildingExercise
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoryBuildingExercise } from '../exercises/StoryBuildingExercise.js';
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

describe('StoryBuildingExercise', () => {
  let exercise;

  beforeEach(() => {
    const config = {
      id: 'test_story',
      title: 'Test Story Building',
      description: 'A test story building exercise',
      tense: 'impf',
      mood: 'ind',
      difficulty: 'intermediate',
      elements: {
        characters: [
          { name: 'Ana', description: 'una estudiante' },
          { name: 'Carlos', description: 'su hermano' }
        ],
        settings: ['la escuela', 'el parque'],
        objects: ['un libro', 'una pelota'],
        events: ['estudiar juntos', 'jugar fútbol']
      },
      requiredElements: 3,
      targetVerbs: ['estudiar', 'jugar', 'leer'],
      minLength: 100,
      maxLength: 300
    };

    exercise = new StoryBuildingExercise(config);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(exercise.type).toBe(EXERCISE_TYPES.STORY_BUILDING);
      expect(exercise.elements).toBeDefined();
      expect(exercise.requiredElements).toBe(3);
      expect(exercise.targetVerbs).toEqual(['estudiar', 'jugar', 'leer']);
      expect(exercise.selectedElements).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(exercise.initialize()).resolves.not.toThrow();
      expect(exercise.selectedElements.length).toBeGreaterThan(0);
    });

    it('should throw error if no elements provided', async () => {
      const invalidExercise = new StoryBuildingExercise({
        id: 'invalid',
        title: 'Invalid',
        description: 'Missing elements config',
        tense: 'pres',
        mood: 'ind',
        difficulty: 'beginner',
        elements: {},
        targetVerbs: ['leer']
      });

      await expect(invalidExercise.initialize()).rejects.toThrow(
        'Story building exercise requires elements'
      );
    });

    it('should throw error if no target verbs provided', async () => {
      const invalidExercise = new StoryBuildingExercise({
        id: 'invalid',
        title: 'Invalid',
        description: 'Missing verbs config',
        tense: 'pres',
        mood: 'ind',
        difficulty: 'beginner',
        elements: { characters: ['Ana'] },
        targetVerbs: []
      });

      await expect(invalidExercise.initialize()).rejects.toThrow(
        'Story building exercise requires target verbs'
      );
    });
  });

  describe('selectRandomElements', () => {
    it('should select required number of elements', async () => {
      await exercise.initialize();
      const elements = exercise.selectRandomElements();

      expect(elements.length).toBeGreaterThanOrEqual(exercise.requiredElements);
    });

    it('should select at least one element from each category', async () => {
      await exercise.initialize();
      const elements = exercise.selectRandomElements();

      const categories = [...new Set(elements.map(e => e.category))];
      expect(categories.length).toBeGreaterThan(1);
    });

    it('should not select duplicate elements', async () => {
      await exercise.initialize();
      const elements = exercise.selectRandomElements();

      const uniqueElements = new Set(elements.map(e => JSON.stringify(e.item)));
      expect(uniqueElements.size).toBe(elements.length);
    });
  });

  describe('getNextStep', () => {
    it('should return correct step when not complete', async () => {
      await exercise.initialize();
      const step = exercise.getNextStep();

      expect(step).toBeDefined();
      expect(step.type).toBe('story_building_input');
      expect(step.title).toBe(exercise.title);
      expect(step.elements).toBeDefined();
      expect(step.targetVerbs).toEqual(exercise.targetVerbs);
    });

    it('should return null when exercise is complete', async () => {
      await exercise.initialize();
      exercise.currentStep = 1; // Mark as complete
      exercise.storyProgress.elementsUsed = exercise.requiredElements;

      const step = exercise.getNextStep();
      expect(step).toBeNull();
    });
  });

  describe('processResponse', () => {
    beforeEach(async () => {
      await exercise.initialize();
    });

    it('should process valid response successfully', async () => {
      const response = 'Ana era una estudiante muy dedicada. Todos los días iba a la escuela con su libro favorito. Después de estudiar, le gustaba jugar fútbol en el parque con Carlos, su hermano menor. Juntos pasaban horas leyendo bajo la sombra de un gran árbol.';

      const result = await exercise.processResponse(response);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should reject too short responses', async () => {
      const response = 'Ana estudia.';

      const result = await exercise.processResponse(response);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect used elements correctly', async () => {
      const response = 'Ana era una estudiante muy dedicada que cada mañana llegaba a la escuela con su libro favorito en la mochila. Junto a Carlos repasaba historias en el parque y describía cada objeto importante que encontraba.';

      const result = await exercise.processResponse(response);

      expect(result.analysis.elementsUsed.length).toBeGreaterThan(0);
    });

    it('should detect target verbs correctly', async () => {
      const response = 'Ana estudió con intensidad toda la tarde, luego jugó fútbol en el parque con Carlos y más tarde se quedó leyendo un libro antiguo mientras recordaba cada lección aprendida en la escuela.';

      const result = await exercise.processResponse(response);

      expect(result.analysis.verbsDetected.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeStory', () => {
    beforeEach(async () => {
      await exercise.initialize();
      exercise.selectedElements = [
        { category: 'characters', item: { name: 'Ana', description: 'una estudiante' }, used: false },
        { category: 'characters', item: { name: 'Carlos', description: 'su hermano' }, used: false },
        { category: 'settings', item: 'la escuela', used: false },
        { category: 'settings', item: 'el parque', used: false },
        { category: 'objects', item: 'un libro', used: false },
        { category: 'events', item: 'estudiar juntos', used: false },
        { category: 'events', item: 'jugar fútbol', used: false }
      ];
      exercise.minLength = 10;
    });

    it('should analyze story comprehensively', async () => {
      const story = 'Ana era una estudiante muy inteligente. Cada día llevaba su libro a la escuela. Después de estudiar, jugaba fútbol en el parque.';

      const analysis = await exercise.analyzeStory(story);

      expect(analysis.elementsUsed).toBeDefined();
      expect(analysis.elementsNotUsed).toBeDefined();
      expect(analysis.verbsDetected).toBeDefined();
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should calculate completion correctly', async () => {
      // Use all required elements and verbs
      const story = 'Ana, una estudiante, llevó su libro a la escuela. Después estudió y jugó fútbol en el parque con Carlos.';

      const analysis = await exercise.analyzeStory(story);

      expect(analysis.isComplete).toBe(true);
    });

    it('should detect missing elements', async () => {
      const story = 'Estudié mucho ayer.'; // Missing most elements

      const analysis = await exercise.analyzeStory(story);

      expect(analysis.elementsNotUsed.length).toBeGreaterThan(0);
      expect(analysis.isComplete).toBe(false);
    });
  });

  describe('generateVerbPatterns', () => {
    it('should generate patterns for -ar verbs', () => {
      const patterns = exercise.generateVerbPatterns('estudiar');

      expect(patterns.length).toBeGreaterThan(1);
      expect(patterns.some(p => p.test(exercise.normalizeText('estudia')))).toBe(true);
      expect(patterns.some(p => p.test(exercise.normalizeText('estudió')))).toBe(true);
    });

    it('should generate patterns for -er verbs', () => {
      const patterns = exercise.generateVerbPatterns('leer');

      expect(patterns.length).toBeGreaterThan(1);
      expect(patterns.some(p => p.test(exercise.normalizeText('lee')))).toBe(true);
      expect(patterns.some(p => p.test(exercise.normalizeText('leyó')))).toBe(true);
    });

    it('should generate patterns for -ir verbs', () => {
      const patterns = exercise.generateVerbPatterns('vivir');

      expect(patterns.length).toBeGreaterThan(1);
      expect(patterns.some(p => p.test(exercise.normalizeText('vive')))).toBe(true);
      expect(patterns.some(p => p.test(exercise.normalizeText('vivió')))).toBe(true);
    });
  });

  describe('irregular verb detection', () => {
    it('should detect verbs with y-insertion patterns', async () => {
      const irregularExercise = new StoryBuildingExercise({
        id: 'irregular_story',
        title: 'Irregular Verb Story',
        description: 'Detecta verbos irregulares',
        tense: 'pretIndef',
        mood: 'ind',
        difficulty: 'intermediate',
        elements: {
          characters: [{ name: 'Ana' }],
          settings: ['la biblioteca'],
          objects: ['un libro'],
          events: ['leer en voz alta']
        },
        requiredElements: 2,
        targetVerbs: ['leer', 'oír', 'construir']
      });

      await irregularExercise.initialize();
      irregularExercise.selectedElements = [
        { category: 'characters', item: { name: 'Ana' }, used: false },
        { category: 'settings', item: 'la biblioteca', used: false },
        { category: 'objects', item: 'un libro', used: false }
      ];

      const story = 'Ana leyó un libro en voz alta. Los vecinos oyeron la historia mientras ella construyó una maqueta y continúo construyendo su sueño.';
      const analysis = await irregularExercise.analyzeStory(story);

      expect(analysis.verbsDetected).toEqual(
        expect.arrayContaining(['leer', 'oír', 'construir'])
      );
    });
  });

  describe('generateFeedback', () => {
    beforeEach(async () => {
      await exercise.initialize();
    });

    it('should generate positive feedback for complete stories', async () => {
      const goodAnalysis = {
        isComplete: true,
        elementsUsed: [{ item: 'Ana' }, { item: 'escuela' }],
        verbsDetected: ['estudiar', 'jugar'],
        qualityScore: 0.9
      };

      const feedback = exercise.generateFeedback(goodAnalysis);

      expect(feedback).toContain('Excelente');
      expect(typeof feedback).toBe('string');
      expect(feedback.length).toBeGreaterThan(0);
    });

    it('should generate constructive feedback for incomplete stories', async () => {
      const incompleteAnalysis = {
        isComplete: false,
        elementsUsed: [{ item: 'Ana' }],
        elementsNotUsed: [{ item: 'escuela' }, { item: 'libro' }],
        verbsDetected: ['estudiar'],
        verbsNotDetected: ['jugar', 'leer'],
        qualityScore: 0.4
      };

      const feedback = exercise.generateFeedback(incompleteAnalysis);

      expect(feedback).toContain('Necesitas');
      expect(feedback).toBeDefined();
      expect(feedback.length).toBeGreaterThan(0);
    });
  });

  describe('isComplete', () => {
    it('should return false when exercise is not started', () => {
      expect(exercise.isComplete()).toBe(false);
    });

    it('should return true when exercise is completed', async () => {
      await exercise.initialize();
      exercise.currentStep = 1;
      exercise.storyProgress.elementsUsed = exercise.requiredElements;

      expect(exercise.isComplete()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset exercise to initial state', async () => {
      await exercise.initialize();
      exercise.currentStep = 1;
      exercise.userStory = 'test story';

      exercise.reset();

      expect(exercise.currentStep).toBe(0);
      expect(exercise.userStory).toBe('');
      expect(exercise.selectedElements.length).toBeGreaterThan(0); // Should re-select
    });
  });

  describe('getRenderConfig', () => {
    it('should return appropriate render configuration', async () => {
      await exercise.initialize();
      const config = exercise.getRenderConfig();

      expect(config.elements).toBeDefined();
      expect(config.targetVerbs).toBeDefined();
      expect(config.inputType).toBe('textarea');
      expect(config.showWordCount).toBe(true);
      expect(config.minLength).toBeDefined();
      expect(config.maxLength).toBeDefined();
    });
  });

  describe('getExerciseStats', () => {
    it('should return comprehensive exercise statistics', async () => {
      await exercise.initialize();
      const stats = exercise.getExerciseStats();

      expect(stats.elementsUsed).toBeDefined();
      expect(stats.requiredElements).toBe(exercise.requiredElements);
      expect(stats.verbsDetected).toBeDefined();
      expect(stats.targetVerbs).toBe(exercise.targetVerbs.length);
      expect(stats.storyLength).toBeDefined();
    });
  });
});