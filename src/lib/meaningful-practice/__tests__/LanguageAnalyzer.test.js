/**
 * Tests para LanguageAnalyzer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import languageAnalyzer from '../assessment/LanguageAnalyzer.js';

// Mock de logger
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

describe('LanguageAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeText', () => {
    it('should analyze Spanish text and return comprehensive results', async () => {
      const text = 'Ayer fui al mercado y compré muchas frutas. Mi hermana también vino conmigo.';
      const context = {
        tense: 'pretIndef',
        mood: 'ind',
        expectedVerbs: ['ir', 'comprar', 'venir']
      };

      const analysis = await languageAnalyzer.analyzeText(text, context);

      expect(analysis).toBeDefined();
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.sentenceCount).toBeGreaterThan(0);
      expect(analysis.verbAnalysis).toBeDefined();
      expect(analysis.tenseAnalysis).toBeDefined();
      expect(analysis.grammarScore).toBeGreaterThanOrEqual(0);
      expect(analysis.grammarScore).toBeLessThanOrEqual(1);
    });

    it('should detect verbs correctly', async () => {
      const text = 'Yo como pizza y bebo agua.';
      const context = {
        tense: 'pres',
        mood: 'ind',
        expectedVerbs: ['comer', 'beber']
      };

      const analysis = await languageAnalyzer.analyzeText(text, context);

      expect(analysis.verbAnalysis.detectedVerbs.length).toBeGreaterThan(0);
      expect(analysis.verbAnalysis.conjugations.length).toBeGreaterThan(0);
    });

    it('should calculate creativity score', async () => {
      const text = 'El gato negro saltó sobre la mesa de cristal mientras la luna brillaba intensamente en el cielo estrellado.';
      const context = { tense: 'pretIndef', mood: 'ind' };

      const analysis = await languageAnalyzer.analyzeText(text, context);

      expect(analysis.creativityScore).toBeDefined();
      expect(analysis.creativityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.creativityScore).toBeLessThanOrEqual(1);
    });

    it('should handle empty text gracefully', async () => {
      const text = '';
      const context = { tense: 'pres', mood: 'ind' };

      const analysis = await languageAnalyzer.analyzeText(text, context);

      expect(analysis.wordCount).toBe(0);
      expect(analysis.sentenceCount).toBe(0);
      expect(analysis.grammarScore).toBe(0);
    });
  });

  describe('analyzeVerbs', () => {
    it('should identify verbs and their conjugations', async () => {
      const text = 'Nosotros estudiamos español todos los días.';

      const verbAnalysis = await languageAnalyzer.analyzeVerbs(text);

      expect(verbAnalysis.detectedVerbs).toBeDefined();
      expect(verbAnalysis.conjugations).toBeDefined();
      expect(Array.isArray(verbAnalysis.detectedVerbs)).toBe(true);
      expect(Array.isArray(verbAnalysis.conjugations)).toBe(true);
    });

    it('should detect irregular verbs', async () => {
      const text = 'Yo fui al cine y tuve una buena experiencia.';

      const verbAnalysis = await languageAnalyzer.analyzeVerbs(text);

      const hasIrregular = verbAnalysis.conjugations.some(conj => conj.isIrregular);
      expect(hasIrregular).toBe(true);
    });
  });

  describe('analyzeTenses', () => {
    it('should detect verb tenses correctly', async () => {
      const text = 'Ayer estudié mucho y hoy estudiaré más.';
      const expectedTense = 'pretIndef';

      const tenseAnalysis = await languageAnalyzer.analyzeTenses(text, expectedTense);

      expect(tenseAnalysis.detectedTenses).toBeDefined();
      expect(tenseAnalysis.correctTenseUsage).toBeDefined();
      expect(tenseAnalysis.tenseErrors).toBeDefined();
      expect(Array.isArray(tenseAnalysis.detectedTenses)).toBe(true);
    });

    it('should calculate tense consistency', async () => {
      const text = 'Estudio español y practico todos los días.';
      const expectedTense = 'pres';

      const tenseAnalysis = await languageAnalyzer.analyzeTenses(text, expectedTense);

      expect(tenseAnalysis.consistency).toBeDefined();
      expect(tenseAnalysis.consistency).toBeGreaterThanOrEqual(0);
      expect(tenseAnalysis.consistency).toBeLessThanOrEqual(1);
    });
  });

  describe('evaluateContentQuality', () => {
    it('should evaluate content quality comprehensively', async () => {
      const text = 'Mi familia y yo fuimos de vacaciones a la playa el verano pasado. Construimos castillos de arena, nadamos en el mar cristalino y disfrutamos de deliciosos mariscos en un restaurante local. Fue una experiencia inolvidable que siempre recordaremos con cariño.';

      const quality = await languageAnalyzer.evaluateContentQuality(text);

      expect(quality.coherence).toBeDefined();
      expect(quality.richness).toBeDefined();
      expect(quality.engagement).toBeDefined();
      expect(quality.overallScore).toBeDefined();

      expect(quality.overallScore).toBeGreaterThanOrEqual(0);
      expect(quality.overallScore).toBeLessThanOrEqual(1);
    });

    it('should penalize very short content', async () => {
      const text = 'Sí.';

      const quality = await languageAnalyzer.evaluateContentQuality(text);

      expect(quality.overallScore).toBeLessThan(0.5);
    });

    it('should reward detailed, rich content', async () => {
      const text = 'Durante mi infancia en el pueblo, solíamos levantarnos temprano para ayudar a mi abuelo en la granja. Alimentábamos a los animales, recolectábamos los huevos frescos de las gallinas, y por las tardes nos sentábamos bajo el gran roble para escuchar sus fascinantes historias sobre los viejos tiempos.';

      const quality = await languageAnalyzer.evaluateContentQuality(text);

      expect(quality.overallScore).toBeGreaterThan(0.6);
      expect(quality.richness).toBeGreaterThan(0.5);
    });
  });

  describe('calculateGrammarScore', () => {
    it('should calculate grammar score based on patterns', async () => {
      const text = 'Los estudiantes estudian en la biblioteca.';

      const grammarScore = await languageAnalyzer.calculateGrammarScore(text);

      expect(grammarScore).toBeGreaterThanOrEqual(0);
      expect(grammarScore).toBeLessThanOrEqual(1);
    });

    it('should detect agreement errors', async () => {
      const text = 'La niña está contento.'; // Error de concordancia

      const grammarScore = await languageAnalyzer.calculateGrammarScore(text);

      expect(grammarScore).toBeLessThan(0.8); // Debería penalizar el error
    });
  });

  describe('extractKeyPhrases', () => {
    it('should extract meaningful phrases from text', async () => {
      const text = 'El restaurante italiano de la esquina sirve la mejor pasta de la ciudad.';

      const keyPhrases = await languageAnalyzer.extractKeyPhrases(text);

      expect(Array.isArray(keyPhrases)).toBe(true);
      expect(keyPhrases.length).toBeGreaterThan(0);
      expect(keyPhrases).toContain('restaurante italiano');
    });

    it('should handle text without clear phrases', async () => {
      const text = 'Y pero entonces después.';

      const keyPhrases = await languageAnalyzer.extractKeyPhrases(text);

      expect(Array.isArray(keyPhrases)).toBe(true);
      // Debería retornar un array, posiblemente vacío
    });
  });

  describe('performance', () => {
    it('should analyze text within reasonable time', async () => {
      const text = 'Este es un texto de prueba que debe ser analizado rápidamente por el sistema de análisis de lenguaje natural para verificar que el rendimiento es adecuado.';
      const context = { tense: 'pres', mood: 'ind' };

      const startTime = Date.now();
      const analysis = await languageAnalyzer.analyzeText(text, context);
      const endTime = Date.now();

      expect(analysis).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});
