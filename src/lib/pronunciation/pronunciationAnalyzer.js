/**
 * Enhanced Pronunciation Analysis Engine for Spanish Language Learning
 *
 * STRICT PEDAGOGICAL ENGINE: Advanced algorithm for assessing Spanish pronunciation
 * accuracy with semantic validation and pedagogical rigor. Only accepts exact or
 * near-exact conjugations to ensure learning excellence and precision.
 *
 * Key Features:
 * - Semantic validation of verb conjugations
 * - Strict pedagogical thresholds (90%+ for "correct")
 * - Intelligent accent handling
 * - Context-aware error analysis
 * - Educational feedback generation
 */

import { semanticValidator } from './semanticValidator.js';

/**
 * Spanish phonetic patterns and rules
 */
const SPANISH_PHONETICS = {
  // Vowel systems - Spanish has 5 pure vowels
  vowels: {
    'a': { ipa: '/a/', description: 'vocal abierta central' },
    'e': { ipa: '/e/', description: 'vocal media anterior' },
    'i': { ipa: '/i/', description: 'vocal cerrada anterior' },
    'o': { ipa: '/o/', description: 'vocal media posterior' },
    'u': { ipa: '/u/', description: 'vocal cerrada posterior' }
  },

  // Common diphthongs
  diphthongs: {
    'ai': { ipa: '/ai̯/', pattern: 'vocal abierta + vocal cerrada' },
    'au': { ipa: '/au̯/', pattern: 'vocal abierta + vocal cerrada' },
    'ei': { ipa: '/ei̯/', pattern: 'vocal media + vocal cerrada' },
    'eu': { ipa: '/eu̯/', pattern: 'vocal media + vocal cerrada' },
    'ie': { ipa: '/je/', pattern: 'vocal cerrada + vocal media' },
    'iu': { ipa: '/ju/', pattern: 'vocal cerrada + vocal cerrada' },
    'oi': { ipa: '/oi̯/', pattern: 'vocal media + vocal cerrada' },
    'ou': { ipa: '/ou̯/', pattern: 'vocal media + vocal cerrada' },
    'ua': { ipa: '/wa/', pattern: 'vocal cerrada + vocal abierta' },
    'ue': { ipa: '/we/', pattern: 'vocal cerrada + vocal media' },
    'ui': { ipa: '/wi/', pattern: 'vocal cerrada + vocal cerrada' },
    'uo': { ipa: '/wo/', pattern: 'vocal cerrada + vocal media' }
  },

  // Consonant patterns
  consonants: {
    // Problematic for L2 learners
    'rr': { ipa: '/r/', type: 'fuerte', issue: 'vibrante múltiple' },
    'r': { ipa: '/ɾ/', type: 'suave', issue: 'vibrante simple' },
    'j': { ipa: '/x/', type: 'fricativa', issue: 'fricativa velar sorda' },
    'ñ': { ipa: '/ɲ/', type: 'nasal', issue: 'nasal palatal' },
    'll': { ipa: '/ʎ/', type: 'lateral', issue: 'lateral palatal' },
    'ch': { ipa: '/ʧ/', type: 'africada', issue: 'africada postalveolar' }
  },

  // Stress patterns
  stress: {
    aguda: { pattern: 'última sílaba', rule: 'palabras terminadas en vocal, n, s' },
    llana: { pattern: 'penúltima sílaba', rule: 'mayoría de palabras' },
    esdrújula: { pattern: 'antepenúltima sílaba', rule: 'siempre con tilde' }
  }
};

/**
 * Common pronunciation errors for Spanish L2 learners
 */
const ERROR_PATTERNS = {
  vowel_confusion: [
    { pattern: /[ae]/g, common: 'confusión a-e', severity: 'medium' },
    { pattern: /[ei]/g, common: 'confusión e-i', severity: 'medium' },
    { pattern: /[ou]/g, common: 'confusión o-u', severity: 'medium' }
  ],
  consonant_issues: [
    { pattern: /r{2,}/g, common: 'rr múltiple', severity: 'high' },
    { pattern: /[jh]/g, common: 'j aspirada', severity: 'medium' },
    { pattern: /[ñn]/g, common: 'ñ vs n', severity: 'high' },
    { pattern: /[bv]/g, common: 'b/v confusion', severity: 'low' }
  ],
  stress_errors: [
    { type: 'missing_accent', description: 'acento perdido', severity: 'medium' },
    { type: 'wrong_syllable', description: 'sílaba incorrecta', severity: 'high' },
    { type: 'flat_intonation', description: 'entonación plana', severity: 'low' }
  ]
};

class PronunciationAnalyzer {
  constructor() {
    // STRICT PEDAGOGICAL THRESHOLDS - Excellence-focused learning
    this.thresholds = {
      perfect: 100,     // Only exact matches
      excellent: 95,    // Near perfect with minor pronunciation issues
      good: 85,         // Correct conjugation with accent errors
      needs_work: 75,   // Major pronunciation issues but correct meaning
      incorrect: 0      // Wrong conjugation or unrecognizable
    };

    // Minimum threshold to be considered "correct" for SRS purposes
    this.passingThreshold = 90; // Much stricter than previous 80%

    // Enhanced error pattern detection for common Spanish learner mistakes
    this.commonSpanishErrors = {
      // Vowel confusion patterns
      vowelErrors: new Map([
        ['e', ['i', 'a']], // Common substitutions
        ['i', ['e']],
        ['o', ['u']],
        ['u', ['o']],
        ['a', ['e']]
      ]),

      // Consonant confusion patterns
      consonantErrors: new Map([
        ['b', ['v', 'p']], // b/v betacism, voicing
        ['v', ['b', 'f']],
        ['d', ['t']], // Final d/t confusion
        ['g', ['k', 'c']],
        ['r', ['rr', 'l']], // Single vs multiple r
        ['rr', ['r']],
        ['ñ', ['n', 'ny']], // Palatalization issues
        ['j', ['h', 'y']], // Fricative confusion
        ['ll', ['y', 'ly']], // Yeísmo variations
        ['c', ['s', 'z']], // Ceceo/seseo
        ['z', ['s', 'c']]
      ]),

      // Silent letter patterns
      silentLetters: ['h'], // h is always silent in Spanish

      // Accent pattern issues
      accentPatterns: {
        missingAccents: /[aeiou]/g, // Should have accent but doesn't
        extraAccents: /[áéíóú]/g,   // Has accent but shouldn't
        wrongAccentPosition: true    // Accent on wrong syllable
      }
    };

    // Initialize semantic validator
    this.semanticValidator = semanticValidator;
  }

  /**
   * Main analysis function with STRICT pedagogical evaluation
   *
   * @param {string} target - Expected conjugation
   * @param {string} recognized - Recognized speech
   * @param {Object} options - Context options (verb, mood, tense, person, confidence, timing)
   * @returns {Object} Comprehensive analysis with strict scoring
   */
  analyzePronunciation(target, recognized, options = {}) {
    const analysis = {
      accuracy: 0,
      pedagogicalScore: 0,
      isCorrectForSRS: false,
      feedback: '',
      detailedAnalysis: {},
      suggestions: [],
      phoneticsBreakdown: {},
      semanticValidation: null,
      timestamp: Date.now()
    };

    try {
      console.log('🎯 STRICT Pronunciation Analysis:', {
        target,
        recognized,
        options
      });

      // Step 1: SEMANTIC VALIDATION (Primary assessment)
      analysis.semanticValidation = this.semanticValidator.validateConjugation(
        target,
        recognized,
        {
          verb: options.verb || options.lemma,
          mood: options.mood,
          tense: options.tense,
          person: options.person
        }
      );

      // Step 2: STRICT SCORING based on semantic validation
      const semanticResult = analysis.semanticValidation;
      analysis.pedagogicalScore = semanticResult.pedagogicalScore;
      analysis.accuracy = semanticResult.pedagogicalScore; // Use pedagogical score as accuracy

      // Step 3: PASSING THRESHOLD (90%+ required for SRS "correct")
      analysis.isCorrectForSRS = analysis.accuracy >= this.passingThreshold;

      // Step 4: PHONETIC ANALYSIS (Secondary - for detailed feedback)
      const normalizedTarget = this.normalizeText(target);
      const normalizedRecognized = this.normalizeText(recognized);

      analysis.detailedAnalysis = {
        semanticValidation: semanticResult,
        textSimilarity: this.analyzeTextSimilarity(normalizedTarget, normalizedRecognized),
        phoneticAnalysis: this.analyzePhonetics(normalizedTarget, normalizedRecognized),
        stressAnalysis: this.analyzeStressPatterns(normalizedTarget, normalizedRecognized),
        fluentAnalysis: this.analyzeFluency(normalizedTarget, normalizedRecognized, options)
      };

      // Step 5: EDUCATIONAL FEEDBACK
      analysis.feedback = this.generatePedagogicalFeedback(semanticResult, analysis.accuracy);
      analysis.suggestions = this.generateEducationalSuggestions(semanticResult, analysis.detailedAnalysis);
      analysis.phoneticsBreakdown = this.generatePhoneticsBreakdown(normalizedTarget, analysis.detailedAnalysis);

      console.log('🎯 STRICT Analysis Result:', {
        accuracy: analysis.accuracy,
        isCorrectForSRS: analysis.isCorrectForSRS,
        semanticType: semanticResult.type,
        feedback: analysis.feedback
      });

    } catch (error) {
      analysis.accuracy = 0;
      analysis.pedagogicalScore = 0;
      analysis.isCorrectForSRS = false;
      analysis.feedback = 'Error en el análisis de pronunciación';
      analysis.suggestions = ['Inténtalo de nuevo - error técnico'];
      console.error('Pronunciation analysis error:', error);
    }

    return analysis;
  }

  /**
   * Conservative text normalization - preserves accent information
   * Only removes punctuation and normalizes spacing
   */
  normalizeText(text) {
    const normalized = text
      .toLowerCase()
      .trim()
      .replace(/[¿¡]/g, '') // Remove question/exclamation marks
      .replace(/[.,;:!?]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize spaces
      // NOTE: Accent marks are preserved for semantic analysis

    return normalized;
  }

  /**
   * Generate pedagogical feedback based on semantic validation
   */
  generatePedagogicalFeedback(semanticResult, accuracy) {
    switch (semanticResult.type) {
      case 'exact_match':
        return '¡Perfecto! Pronunciación y conjugación exactas.';

      case 'valid_conjugation':
        return '¡Excelente! Conjugación correcta con buena pronunciación.';

      case 'accent_error':
        return 'Conjugación correcta, pero presta atención a la acentuación.';

      case 'wrong_context':
        return `${semanticResult.message}. ${semanticResult.suggestion}`;

      case 'different_verb':
        return `${semanticResult.message}. ${semanticResult.suggestion}`;

      case 'minor_pronunciation':
        return `Conjugación correcta pero ${semanticResult.message}. ${semanticResult.suggestion}`;

      case 'incorrect_word':
        return `"${semanticResult.message}". ${semanticResult.suggestion}`;

      default:
        return accuracy >= this.thresholds.excellent
          ? '¡Muy bien! Pronunciación clara y correcta.'
          : accuracy >= this.thresholds.good
          ? 'Bien, pero necesita más precisión en la pronunciación.'
          : 'Inténtalo de nuevo - enfócate en la conjugación exacta.';
    }
  }

  /**
   * Generate educational suggestions based on semantic analysis and detailed error detection
   */
  generateEducationalSuggestions(semanticResult, detailedAnalysis) {
    const suggestions = [];

    // Primary suggestions based on semantic validation
    if (semanticResult.suggestion) {
      suggestions.push(semanticResult.suggestion);
    }

    // Additional suggestions based on error type
    switch (semanticResult.type) {
      case 'wrong_context':
        suggestions.push('Revisa el tiempo verbal y la persona gramatical');
        suggestions.push('Practica las conjugaciones de este verbo específico');
        break;

      case 'different_verb':
        suggestions.push('Asegúrate de pronunciar el verbo correcto');
        suggestions.push('Escucha el audio de ejemplo nuevamente');
        break;

      case 'accent_error':
        suggestions.push('Estudia las reglas de acentuación española');
        suggestions.push('Practica la pronunciación con énfasis en las sílabas tónicas');
        break;

      case 'minor_pronunciation':
        suggestions.push('Habla más despacio y articula cada sílaba');
        suggestions.push('Presta atención a los sonidos específicos del español');
        break;

      case 'incorrect_word':
        suggestions.push('Verifica que estés pronunciando la conjugación correcta');
        suggestions.push('Usa el audio de ejemplo como guía');
        break;
    }

    // Enhanced suggestions based on specific errors detected
    if (detailedAnalysis.phoneticAnalysis?.common_errors) {
      const errors = detailedAnalysis.phoneticAnalysis.common_errors;

      // Group errors by type for more targeted suggestions
      const errorTypes = {
        vowel_confusion: [],
        consonant_confusion: [],
        accent_errors: [],
        silent_letter_errors: []
      };

      errors.forEach(error => {
        if (errorTypes[error.type]) {
          errorTypes[error.type].push(error);
        }
      });

      // Add specific suggestions for each error type
      if (errorTypes.vowel_confusion.length > 0) {
        const vowelIssues = errorTypes.vowel_confusion.map(e => e.description).join(', ');
        suggestions.push(`Problemas con vocales: ${vowelIssues}`);
        suggestions.push('Practica las 5 vocales españolas: a, e, i, o, u');
      }

      if (errorTypes.consonant_confusion.length > 0) {
        const consonantIssues = errorTypes.consonant_confusion;
        const highSeverity = consonantIssues.filter(e => e.severity === 'high');

        if (highSeverity.length > 0) {
          suggestions.push(`Errores críticos: ${highSeverity[0].suggestion}`);
        }

        suggestions.push('Enfócate en consonantes españolas distintivas');
      }

      if (errorTypes.accent_errors.length > 0) {
        suggestions.push('Problema de acentuación detectado');
        suggestions.push('Repasa las reglas: agudas (-án), llanas (ca-SA), esdrújulas (MÉ-di-co)');
      }

      if (errorTypes.silent_letter_errors.length > 0) {
        suggestions.push('Recuerda: la "h" es siempre muda en español');
      }
    }

    // General phonetic suggestions (improved)
    if (detailedAnalysis.phoneticAnalysis?.vowel_accuracy < 80) {
      suggestions.push('Las vocales españolas son puras: /a/ /e/ /i/ /o/ /u/');
    }

    if (detailedAnalysis.phoneticAnalysis?.consonant_accuracy < 70) {
      suggestions.push('Practica especialmente: rr (vibrante), ñ (palatal), j (fricativa)');
    }

    // Fluency suggestions
    if (detailedAnalysis.fluentAnalysis?.confidence_score < 70) {
      suggestions.push('Habla con más confianza y volumen adecuado');
    }

    // Remove duplicates and limit to most relevant suggestions
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.length > 0 ? uniqueSuggestions.slice(0, 4) : ['¡Sigue practicando!'];
  }

  /**
   * Calculate text similarity using Levenshtein distance
   */
  analyzeTextSimilarity(target, recognized) {
    // Check for exact match first (case-insensitive, accent-tolerant)
    const exactMatch = target === recognized;

    const distance = this.levenshteinDistance(target, recognized);
    const maxLength = Math.max(target.length, recognized.length);
    const similarity = maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;

    // If it's an exact match after normalization, give perfect score
    const finalSimilarity = exactMatch ? 100 : similarity;

    return {
      similarity: Math.round(finalSimilarity),
      distance,
      exact_match: exactMatch,
      character_errors: distance,
      target_length: target.length,
      recognized_length: recognized.length
    };
  }

  /**
   * Levenshtein distance implementation
   */
  levenshteinDistance(str1, str2) {
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
   * Analyze phonetic accuracy
   */
  analyzePhonetics(target, recognized) {
    // If exactly the same, perfect score
    if (target === recognized) {
      return {
        vowel_accuracy: 100,
        consonant_accuracy: 100,
        diphthong_accuracy: 100,
        common_errors: [],
        overall_score: 100
      };
    }

    const phonetics = {
      vowel_accuracy: this.analyzeVowels(target, recognized),
      consonant_accuracy: this.analyzeConsonants(target, recognized),
      diphthong_accuracy: this.analyzeDiphthongs(target, recognized),
      common_errors: this.detectCommonErrors(target, recognized)
    };

    phonetics.overall_score = Math.round(
      (phonetics.vowel_accuracy * 0.3 +
       phonetics.consonant_accuracy * 0.4 +
       phonetics.diphthong_accuracy * 0.2 +
       (100 - phonetics.common_errors.length * 10) * 0.1)
    );

    return phonetics;
  }

  /**
   * Analyze vowel pronunciation
   */
  analyzeVowels(target, recognized) {
    const targetVowels = target.match(/[aeiou]/g) || [];
    const recognizedVowels = recognized.match(/[aeiou]/g) || [];

    if (targetVowels.length === 0) return 100;

    let correct = 0;
    const minLength = Math.min(targetVowels.length, recognizedVowels.length);

    for (let i = 0; i < minLength; i++) {
      if (targetVowels[i] === recognizedVowels[i]) {
        correct++;
      }
    }

    return Math.round((correct / targetVowels.length) * 100);
  }

  /**
   * Analyze consonant pronunciation
   */
  analyzeConsonants(target, recognized) {
    const targetConsonants = target.replace(/[aeiou\s]/g, '');
    const recognizedConsonants = recognized.replace(/[aeiou\s]/g, '');

    if (targetConsonants.length === 0) return 100;

    const distance = this.levenshteinDistance(targetConsonants, recognizedConsonants);
    const accuracy = ((targetConsonants.length - distance) / targetConsonants.length) * 100;

    return Math.max(0, Math.round(accuracy));
  }

  /**
   * Analyze diphthong pronunciation
   */
  analyzeDiphthongs(target, recognized) {
    const diphthongPattern = /[aeiou]{2}/g;
    const targetDiphthongs = target.match(diphthongPattern) || [];
    const recognizedDiphthongs = recognized.match(diphthongPattern) || [];

    if (targetDiphthongs.length === 0) return 100;

    let correct = 0;
    const minLength = Math.min(targetDiphthongs.length, recognizedDiphthongs.length);

    for (let i = 0; i < minLength; i++) {
      if (targetDiphthongs[i] === recognizedDiphthongs[i]) {
        correct++;
      }
    }

    return Math.round((correct / targetDiphthongs.length) * 100);
  }

  /**
   * Detect common pronunciation errors with enhanced patterns
   */
  detectCommonErrors(target, recognized) {
    const errors = [];

    // Enhanced vowel error detection
    for (let i = 0; i < Math.min(target.length, recognized.length); i++) {
      const targetChar = target[i];
      const recognizedChar = recognized[i];

      if (targetChar !== recognizedChar) {
        // Check if it's a known vowel confusion
        if (this.commonSpanishErrors.vowelErrors.has(targetChar)) {
          const commonSubstitutions = this.commonSpanishErrors.vowelErrors.get(targetChar);
          if (commonSubstitutions.includes(recognizedChar)) {
            errors.push({
              type: 'vowel_confusion',
              description: `Confusión ${targetChar}/${recognizedChar}`,
              severity: 'medium',
              position: i,
              suggestion: `Practica la diferencia entre "${targetChar}" y "${recognizedChar}"`
            });
          }
        }

        // Check consonant confusions
        if (this.commonSpanishErrors.consonantErrors.has(targetChar)) {
          const commonSubstitutions = this.commonSpanishErrors.consonantErrors.get(targetChar);
          if (commonSubstitutions.includes(recognizedChar)) {
            errors.push({
              type: 'consonant_confusion',
              description: `Confusión ${targetChar}/${recognizedChar}`,
              severity: this._getConsonantErrorSeverity(targetChar, recognizedChar),
              position: i,
              suggestion: this._getConsonantErrorSuggestion(targetChar, recognizedChar)
            });
          }
        }
      }
    }

    // Check for silent letter issues
    this.commonSpanishErrors.silentLetters.forEach(letter => {
      if (target.includes(letter) && !recognized.includes(letter)) {
        errors.push({
          type: 'silent_letter_error',
          description: `La "${letter}" es muda en español`,
          severity: 'low',
          suggestion: `Recuerda que la "${letter}" no se pronuncia`
        });
      }
    });

    // Check for accent pattern issues
    const accentErrors = this._detectAccentErrors(target, recognized);
    errors.push(...accentErrors);

    // Legacy pattern checks for backwards compatibility
    ERROR_PATTERNS.vowel_confusion.forEach(errorPattern => {
      const targetMatches = (target.match(errorPattern.pattern) || []).length;
      const recognizedMatches = (recognized.match(errorPattern.pattern) || []).length;

      if (Math.abs(targetMatches - recognizedMatches) > 0) {
        errors.push({
          type: 'vowel_error',
          description: errorPattern.common,
          severity: errorPattern.severity
        });
      }
    });

    return errors;
  }

  /**
   * Get severity for consonant errors
   */
  _getConsonantErrorSeverity(target, recognized) {
    const highSeverityPairs = [
      ['r', 'rr'], ['rr', 'r'], // R distinction is crucial
      ['ñ', 'n'], ['n', 'ñ'],   // Palatalization changes meaning
      ['ll', 'y'], ['y', 'll']   // Regional but important
    ];

    const mediumSeverityPairs = [
      ['b', 'v'], ['v', 'b'],   // Common but meaning usually clear
      ['c', 's'], ['s', 'c'],   // Regional variation
      ['z', 's'], ['s', 'z']    // Ceceo/seseo
    ];

    for (const [t, r] of highSeverityPairs) {
      if (target === t && recognized === r) return 'high';
    }

    for (const [t, r] of mediumSeverityPairs) {
      if (target === t && recognized === r) return 'medium';
    }

    return 'low';
  }

  /**
   * Get specific suggestions for consonant errors
   */
  _getConsonantErrorSuggestion(target, recognized) {
    const suggestions = {
      'r_rr': 'Practica la diferencia entre r simple y rr múltiple',
      'rr_r': 'La "rr" requiere vibración múltiple de la lengua',
      'ñ_n': 'La "ñ" se pronuncia con la lengua en el paladar',
      'n_ñ': 'La "n" es diferente de "ñ" - sin palatalización',
      'll_y': 'En muchas regiones "ll" suena como "y"',
      'y_ll': 'Dependiendo de la región, "y" y "ll" pueden sonar igual',
      'b_v': 'En español "b" y "v" suenan igual',
      'v_b': 'No hay diferencia de pronunciación entre "v" y "b"',
      'c_s': 'En algunas regiones "ce/ci" suena como "se/si"',
      's_c': 'Distingue entre "s" y "c" según tu región',
      'j_h': 'La "j" es un sonido fricativo, la "h" es muda'
    };

    const key = `${target}_${recognized}`;
    return suggestions[key] || `Practica la diferencia entre "${target}" y "${recognized}"`;
  }

  /**
   * Detect accent-related errors
   */
  _detectAccentErrors(target, recognized) {
    const errors = [];

    // Remove accents to compare base words
    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const targetNoAccents = removeAccents(target);
    const recognizedNoAccents = removeAccents(recognized);

    // If base words are the same but accents differ
    if (targetNoAccents === recognizedNoAccents && target !== recognized) {
      const targetAccents = target.match(/[áéíóú]/g) || [];
      const recognizedAccents = recognized.match(/[áéíóú]/g) || [];

      if (targetAccents.length !== recognizedAccents.length) {
        errors.push({
          type: 'accent_count_error',
          description: 'Número incorrecto de acentos',
          severity: 'medium',
          suggestion: 'Revisa las reglas de acentuación española'
        });
      } else if (targetAccents.join('') !== recognizedAccents.join('')) {
        errors.push({
          type: 'accent_position_error',
          description: 'Acento en posición incorrecta',
          severity: 'medium',
          suggestion: 'Practica la acentuación de palabras agudas, llanas y esdrújulas'
        });
      }
    }

    return errors;
  }

  /**
   * Analyze stress patterns (simplified)
   */
  analyzeStressPatterns(target, recognized) {
    // If exactly the same, perfect accuracy
    if (target === recognized) {
      return {
        syllable_count: this.countSyllables(target),
        stress_type: this.getStressType(target),
        accuracy: 100
      };
    }

    // Basic stress analysis - can be enhanced with syllable detection
    const syllableCount = this.countSyllables(target);
    const stressType = this.getStressType(target);

    return {
      syllable_count: syllableCount,
      stress_type: stressType,
      accuracy: target === recognized ? 100 : 75
    };
  }

  /**
   * Count syllables in Spanish word
   */
  countSyllables(word) {
    // Simplified syllable counting for Spanish
    const vowelGroups = word.toLowerCase().match(/[aeiouáéíóú]+/g) || [];
    let syllables = vowelGroups.length;

    // Adjust for diphthongs
    vowelGroups.forEach(group => {
      if (group.length > 1) {
        // Check if it's a true diphthong or hiatus
        const isDiphthong = /[iu][aeo]|[aeo][iu]|[iu][iu]/.test(group);
        if (!isDiphthong) {
          syllables += group.length - 1;
        }
      }
    });

    return Math.max(1, syllables);
  }

  /**
   * Determine stress type
   */
  getStressType(word) {
    if (/[áéíóú]/.test(word)) {
      return 'esdrújula'; // Has written accent
    }

    const syllables = this.countSyllables(word);
    if (syllables === 1) return 'monosílaba';

    if (word.match(/[ns]$/)) {
      return 'llana'; // Ends in n, s -> stress on penultimate
    } else {
      return 'aguda'; // Stress on last syllable
    }
  }

  /**
   * Analyze fluency (placeholder for advanced implementation)
   */
  analyzeFluency(_target, _recognized, options = {}) {
    const confidence = options.confidence || 0.8;
    const timing = options.timing || 1000; // ms

    return {
      confidence_score: Math.round(confidence * 100),
      timing_score: timing < 3000 ? 100 : Math.max(50, 100 - (timing - 3000) / 100),
      hesitation_detected: timing > 5000,
      clarity_score: confidence > 0.8 ? 100 : Math.round(confidence * 100)
    };
  }

  /**
   * Legacy method - now handled by semantic validation
   * Kept for backward compatibility with phonetic analysis
   */
  calculateLegacyPhoneticScore(detailedAnalysis) {
    // This is only used for detailed phonetic breakdown now
    const weights = {
      textSimilarity: 0.4,
      phoneticAnalysis: 0.3,
      stressAnalysis: 0.2,
      fluentAnalysis: 0.1
    };

    let totalScore = 0;
    totalScore += detailedAnalysis.textSimilarity.similarity * weights.textSimilarity;
    totalScore += detailedAnalysis.phoneticAnalysis.overall_score * weights.phoneticAnalysis;
    totalScore += detailedAnalysis.stressAnalysis.accuracy * weights.stressAnalysis;
    totalScore += detailedAnalysis.fluentAnalysis.confidence_score * weights.fluentAnalysis;

    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }

  /**
   * Legacy feedback method - replaced by generatePedagogicalFeedback
   * Kept for backward compatibility
   */
  generateLegacyFeedback(accuracy, analysis) {
    console.warn('Using legacy feedback method - consider using generatePedagogicalFeedback');

    if (analysis.textSimilarity?.exact_match) {
      return '¡Perfecto! Pronunciación exacta y clara.';
    }

    if (accuracy >= this.thresholds.excellent) {
      return '¡Excelente pronunciación!';
    } else if (accuracy >= this.thresholds.good) {
      return 'Buena pronunciación, pero puede mejorar.';
    } else {
      return 'Necesita más práctica. Inténtalo de nuevo.';
    }
  }

  /**
   * Legacy suggestions method - replaced by generateEducationalSuggestions
   * Kept for backward compatibility
   */
  generateLegacySuggestions(analysis) {
    console.warn('Using legacy suggestions method - consider using generateEducationalSuggestions');

    const suggestions = ['Practica más la pronunciación'];

    if (analysis.phoneticAnalysis?.vowel_accuracy < 80) {
      suggestions.push('Enfócate en las vocales');
    }

    if (analysis.phoneticAnalysis?.consonant_accuracy < 70) {
      suggestions.push('Presta atención a las consonantes');
    }

    return suggestions;
  }

  /**
   * Generate phonetics breakdown for educational purposes
   */
  generatePhoneticsBreakdown(target, _analysis) {
    const breakdown = {
      word: target,
      syllables: target.split(/[aeiouáéíóú]+/g).length - 1,
      vowels: (target.match(/[aeiou]/g) || []).join('-'),
      consonants: target.replace(/[aeiou\s]/g, '').split('').join('-'),
      stress_pattern: this.getStressType(target),
      difficulty_elements: []
    };

    // Identify difficult elements
    if (target.includes('rr')) {
      breakdown.difficulty_elements.push({ element: 'rr', type: 'vibrante múltiple', tip: 'Vibra la lengua contra el paladar' });
    }
    if (target.includes('ñ')) {
      breakdown.difficulty_elements.push({ element: 'ñ', type: 'nasal palatal', tip: 'Coloca la lengua en el paladar' });
    }
    if (target.includes('j')) {
      breakdown.difficulty_elements.push({ element: 'j', type: 'fricativa velar', tip: 'Sonido suave desde la garganta' });
    }

    return breakdown;
  }
}

export default PronunciationAnalyzer;