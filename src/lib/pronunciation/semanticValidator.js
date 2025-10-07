/**
 * Semantic Validation System for Spanish Verb Conjugations
 *
 * Advanced validation engine that ensures pronunciation practice only accepts
 * semantically correct conjugations, not just phonetically similar words.
 *
 * Key Features:
 * - Validates person, tense, mood correctness
 * - Distinguishes pronunciation errors from conjugation errors
 * - Provides specific feedback for different error types
 * - Integrates with existing verb database
 */

import { buildFormsForRegion } from '../core/eligibility.js';
import { MOOD_LABELS, TENSE_LABELS, PERSON_LABELS } from '../utils/verbLabels.js';

/**
 * Semantic validation engine for verb conjugations
 */
export class SemanticValidator {
  constructor() {
    // Cache for performance
    this.verbFormsCache = new Map();
    this.validationCache = new Map();

    // Initialize with verb forms
    this.initializeVerbForms();
  }

  /**
   * Initialize comprehensive verb forms database
   */
  initializeVerbForms() {
    try {
      const allForms = buildFormsForRegion('la_general');

      // Build lookup tables for fast validation
      this.verbFormsCache.clear();

      allForms.forEach(form => {
        const verb = form.lemma || form.verb;
        if (!verb || !form.value) return;

        if (!this.verbFormsCache.has(verb)) {
          this.verbFormsCache.set(verb, new Map());
        }

        const verbForms = this.verbFormsCache.get(verb);
        const key = `${form.mood}_${form.tense}_${form.person}`;

        if (!verbForms.has(key)) {
          verbForms.set(key, new Set());
        }

        verbForms.get(key).add(form.value.toLowerCase());
      });

      console.log('🔍 SemanticValidator initialized with', this.verbFormsCache.size, 'verbs');
    } catch (error) {
      console.error('Failed to initialize SemanticValidator:', error);
    }
  }

  /**
   * Validate if a recognized word is a correct conjugation for the target
   */
  validateConjugation(target, recognized, context) {
    const cacheKey = `${target}_${recognized}_${JSON.stringify(context)}`;

    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    const result = this._performValidation(target, recognized, context);
    this.validationCache.set(cacheKey, result);

    return result;
  }

  /**
   * Format context in Spanish for user-friendly messages
   */
  _formatContextInSpanish(mood, tense, person) {
    const MOOD_LABEL = MOOD_LABELS[mood] || mood;
    const tenseLabel = TENSE_LABELS[tense] || tense;
    const personLabel = PERSON_LABELS[person] || person;

    // Format based on mood
    if (mood === 'subjunctive' || mood === 'subjuntivo') {
      return `${tenseLabel} de subjuntivo con ${personLabel}`;
    } else if (mood === 'imperative' || mood === 'imperativo') {
      return `imperativo con ${personLabel}`;
    } else if (mood === 'conditional' || mood === 'condicional') {
      return `${tenseLabel} con ${personLabel}`;
    } else {
      // Indicativo
      return `${tenseLabel} con ${personLabel}`;
    }
  }

  /**
   * Core validation logic
   */
  _performValidation(target, recognized, context) {
    const normalizedTarget = target.toLowerCase().trim();
    const normalizedRecognized = recognized.toLowerCase().trim();

    // Extract context information
    const verb = context.verb || context.lemma;
    const mood = context.mood;
    const tense = context.tense;
    const person = context.person;

    console.log('🔍 Semantic validation:', {
      target: normalizedTarget,
      recognized: normalizedRecognized,
      verb,
      mood,
      tense,
      person
    });

    // Step 1: Exact match (highest score)
    if (normalizedTarget === normalizedRecognized) {
      return {
        isValid: true,
        confidence: 100,
        type: 'exact_match',
        message: 'Conjugación exacta y correcta',
        pedagogicalScore: 100
      };
    }

    // Step 2: Check if recognized word is a valid conjugation of the same verb
    if (verb && this.verbFormsCache.has(verb)) {
      const verbForms = this.verbFormsCache.get(verb);

      // Check if it's a valid form for this specific context
      const contextKey = `${mood}_${tense}_${person}`;
      if (verbForms.has(contextKey)) {
        const validForms = verbForms.get(contextKey);

        if (validForms.has(normalizedRecognized)) {
          return {
            isValid: true,
            confidence: 95,
            type: 'valid_conjugation',
            message: 'Conjugación correcta para este contexto',
            pedagogicalScore: 95
          };
        }
      }

      // Check if it's a valid form for the verb but wrong context
      const wrongContextMatch = this._findWrongContextMatch(verbForms, normalizedRecognized, contextKey);
      if (wrongContextMatch) {
        const wrongContext = this._formatContextInSpanish(...wrongContextMatch.contextKey.split('_'));
        const correctContext = this._formatContextInSpanish(mood, tense, person);

        return {
          isValid: false,
          confidence: 60,
          type: 'wrong_context',
          message: `Es una conjugación válida de "${verb}" pero para ${wrongContext}`,
          pedagogicalScore: 20,
          suggestion: `Para ${correctContext} debe ser "${normalizedTarget}"`
        };
      }

      // Check if it's a conjugation of a different verb
      const differentVerbMatch = this._findDifferentVerbMatch(normalizedRecognized);
      if (differentVerbMatch) {
        return {
          isValid: false,
          confidence: 40,
          type: 'different_verb',
          message: `"${normalizedRecognized}" es conjugación de "${differentVerbMatch.verb}", no de "${verb}"`,
          pedagogicalScore: 10,
          suggestion: `Pronuncia la conjugación correcta de "${verb}": "${normalizedTarget}"`
        };
      }
    }

    // Step 3: Accent-only differences (pronunciation issue, not conjugation)
    const accentDifference = this._checkAccentOnlyDifference(normalizedTarget, normalizedRecognized);
    if (accentDifference.isAccentOnly) {
      return {
        isValid: true,
        confidence: 85,
        type: 'accent_error',
        message: 'Conjugación correcta, pero falta la acentuación apropiada',
        pedagogicalScore: 85,
        suggestion: 'Practica la acentuación española'
      };
    }

    // Step 4: Minor pronunciation variations (1-2 character differences)
    const pronunciationSimilarity = this._analyzeMinorPronunciationErrors(normalizedTarget, normalizedRecognized);
    if (pronunciationSimilarity.isMinorPronunciation) {
      return {
        isValid: false,
        confidence: 70,
        type: 'minor_pronunciation',
        message: pronunciationSimilarity.message,
        pedagogicalScore: 60,
        suggestion: pronunciationSimilarity.suggestion
      };
    }

    // Step 5: Completely different word
    return {
      isValid: false,
      confidence: 20,
      type: 'incorrect_word',
      message: `"${normalizedRecognized}" no es la conjugación correcta`,
      pedagogicalScore: 0,
      suggestion: `La conjugación correcta es "${normalizedTarget}"`
    };
  }

  /**
   * Find if recognized word is valid for verb but in wrong context
   */
  _findWrongContextMatch(verbForms, recognized, correctContextKey) {
    for (const [contextKey, forms] of verbForms.entries()) {
      if (contextKey !== correctContextKey && forms.has(recognized)) {
        return {
          contextKey
        };
      }
    }
    return null;
  }

  /**
   * Find if recognized word is a conjugation of a different verb
   */
  _findDifferentVerbMatch(recognized) {
    for (const [verb, verbForms] of this.verbFormsCache.entries()) {
      for (const [contextKey, forms] of verbForms.entries()) {
        if (forms.has(recognized)) {
          return { verb, contextKey };
        }
      }
    }
    return null;
  }

  /**
   * Check if difference is only in accents
   */
  _checkAccentOnlyDifference(target, recognized) {
    // Remove accents for comparison
    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const targetNoAccents = removeAccents(target);
    const recognizedNoAccents = removeAccents(recognized);

    const isAccentOnly = targetNoAccents === recognizedNoAccents && target !== recognized;

    return {
      isAccentOnly,
      accentDifferences: isAccentOnly ? this._findAccentDifferences(target, recognized) : []
    };
  }

  /**
   * Find specific accent differences
   */
  _findAccentDifferences(target, recognized) {
    const differences = [];
    const minLength = Math.min(target.length, recognized.length);

    for (let i = 0; i < minLength; i++) {
      if (target[i] !== recognized[i]) {
        differences.push({
          position: i,
          expected: target[i],
          received: recognized[i]
        });
      }
    }

    return differences;
  }

  /**
   * Analyze minor pronunciation errors (1-2 character differences)
   */
  _analyzeMinorPronunciationErrors(target, recognized) {
    if (Math.abs(target.length - recognized.length) > 2) {
      return { isMinorPronunciation: false };
    }

    const distance = this._levenshteinDistance(target, recognized);

    if (distance <= 2) {
      const errorType = this._identifyPronunciationErrorType(target, recognized);
      return {
        isMinorPronunciation: true,
        distance,
        message: `Error menor de pronunciación: ${errorType.description}`,
        suggestion: errorType.suggestion
      };
    }

    return { isMinorPronunciation: false };
  }

  /**
   * Identify specific pronunciation error patterns
   */
  _identifyPronunciationErrorType(target, recognized) {
    // Common Spanish pronunciation patterns
    const patterns = [
      {
        pattern: /b/g,
        replacement: /v/g,
        description: 'confusión b/v',
        suggestion: 'En español, b y v suenan igual'
      },
      {
        pattern: /h/g,
        replacement: /(?:)/g,
        description: 'h muda no pronunciada',
        suggestion: 'La h en español es muda'
      },
      {
        pattern: /c([ei])/g,
        replacement: /z$1/g,
        description: 'ceceo/seseo',
        suggestion: 'ce/ci vs ze/zi según la región'
      },
      {
        pattern: /ll/g,
        replacement: /y/g,
        description: 'yeísmo',
        suggestion: 'll suena como y en muchas regiones'
      }
    ];

    for (const pattern of patterns) {
      const targetModified = target.replace(pattern.pattern, pattern.replacement);
      if (targetModified === recognized) {
        return pattern;
      }
    }

    return {
      description: 'diferencia menor de pronunciación',
      suggestion: 'Articula más claramente cada sonido'
    };
  }

  /**
   * Calculate Levenshtein distance
   */
  _levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get cached statistics
   */
  getStats() {
    return {
      verbsLoaded: this.verbFormsCache.size,
      validationsCached: this.validationCache.size,
      memoryUsage: this._estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  _estimateMemoryUsage() {
    let size = 0;
    for (const [verb, forms] of this.verbFormsCache.entries()) {
      size += verb.length * 2; // Unicode characters
      for (const [key, values] of forms.entries()) {
        size += key.length * 2;
        for (const value of values) {
          size += value.length * 2;
        }
      }
    }
    return `${Math.round(size / 1024)}KB`;
  }

  /**
   * Clear caches to free memory
   */
  clearCaches() {
    this.validationCache.clear();
    console.log('🧹 SemanticValidator caches cleared');
  }
}

// Singleton instance for global use (lazy initialization)
let semanticValidatorInstance = null;

export function getSemanticValidator() {
  if (!semanticValidatorInstance) {
    semanticValidatorInstance = new SemanticValidator();
  }
  return semanticValidatorInstance;
}

// Backwards compatibility - lazy getter
export const semanticValidator = new Proxy({}, {
  get(target, prop) {
    return getSemanticValidator()[prop];
  }
});

export default semanticValidator;