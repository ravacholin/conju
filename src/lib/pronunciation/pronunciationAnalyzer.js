/**
 * Pronunciation Analysis Engine for Spanish Language Learning
 *
 * Advanced algorithm for assessing Spanish pronunciation accuracy based on
 * speech recognition results. Implements phonetic analysis, stress pattern
 * detection, and linguistic error classification following 2025 research
 * on L2 Spanish pronunciation assessment.
 */

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
    this.thresholds = {
      excellent: 90,
      good: 75,
      fair: 60,
      poor: 40
    };
  }

  /**
   * Main analysis function - evaluates pronunciation accuracy
   */
  analyzePronunciation(target, recognized, options = {}) {
    const analysis = {
      accuracy: 0,
      feedback: '',
      detailedAnalysis: {},
      suggestions: [],
      phoneticsBreakdown: {},
      timestamp: Date.now()
    };

    try {
      // Normalize inputs
      const normalizedTarget = this.normalizeText(target);
      const normalizedRecognized = this.normalizeText(recognized);

      // Debug logging
      console.log('🔍 Pronunciation Analysis Debug:', {
        original_target: target,
        original_recognized: recognized,
        normalized_target: normalizedTarget,
        normalized_recognized: normalizedRecognized,
        exact_match: normalizedTarget === normalizedRecognized
      });

      // Core analysis components
      analysis.detailedAnalysis = {
        textSimilarity: this.analyzeTextSimilarity(normalizedTarget, normalizedRecognized),
        phoneticAnalysis: this.analyzePhonetics(normalizedTarget, normalizedRecognized),
        stressAnalysis: this.analyzeStressPatterns(normalizedTarget, normalizedRecognized),
        fluentAnalysis: this.analyzeFluency(normalizedTarget, normalizedRecognized, options)
      };

      // Debug detailed analysis
      console.log('📊 Detailed Analysis:', analysis.detailedAnalysis);

      // Calculate overall accuracy
      analysis.accuracy = this.calculateOverallAccuracy(analysis.detailedAnalysis);

      console.log('🎯 Final Accuracy:', analysis.accuracy);

      // Generate feedback and suggestions
      analysis.feedback = this.generateFeedback(analysis.accuracy, analysis.detailedAnalysis);
      analysis.suggestions = this.generateSuggestions(analysis.detailedAnalysis);
      analysis.phoneticsBreakdown = this.generatePhoneticsBreakdown(normalizedTarget, analysis.detailedAnalysis);

    } catch (error) {
      analysis.accuracy = 0;
      analysis.feedback = 'Error en el análisis de pronunciación';
      analysis.suggestions = ['Inténtalo de nuevo'];
      console.error('Pronunciation analysis error:', error);
    }

    return analysis;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    const normalized = text
      .toLowerCase()
      .trim()
      .replace(/[¿¡]/g, '') // Remove question/exclamation marks
      .replace(/[.,;:!?]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u');

    console.log('🔤 Text normalization:', {
      original: text,
      normalized: normalized,
      length_original: text.length,
      length_normalized: normalized.length
    });

    return normalized;
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
   * Detect common pronunciation errors
   */
  detectCommonErrors(target, recognized) {
    const errors = [];

    // Check vowel confusion patterns
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

    // Check consonant issues
    ERROR_PATTERNS.consonant_issues.forEach(errorPattern => {
      if (target.match(errorPattern.pattern) && !recognized.match(errorPattern.pattern)) {
        errors.push({
          type: 'consonant_error',
          description: errorPattern.common,
          severity: errorPattern.severity
        });
      }
    });

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
   * Calculate overall accuracy score
   */
  calculateOverallAccuracy(detailedAnalysis) {
    // If there's an exact text match, give excellent score
    if (detailedAnalysis.textSimilarity.exact_match) {
      return 95; // Near perfect for exact match
    }

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
   * Generate user-friendly feedback
   */
  generateFeedback(accuracy, analysis) {
    // Special feedback for exact matches
    if (analysis.textSimilarity.exact_match) {
      return '¡Perfecto! Pronunciación exacta y clara.';
    }

    if (accuracy >= this.thresholds.excellent) {
      return '¡Excelente pronunciación! Tu acento es muy claro y natural.';
    } else if (accuracy >= this.thresholds.good) {
      return '¡Muy bien! Tu pronunciación es buena, con pequeños detalles a mejorar.';
    } else if (accuracy >= this.thresholds.fair) {
      return 'Buena pronunciación. Sigue practicando para mejorar la claridad.';
    } else if (accuracy >= this.thresholds.poor) {
      return 'Necesitas más práctica. Enfócate en pronunciar cada sílaba claramente.';
    } else {
      return 'Sigue intentando. Escucha el ejemplo y repite despacio.';
    }
  }

  /**
   * Generate specific suggestions for improvement
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    // Text similarity suggestions
    if (analysis.textSimilarity.similarity < 70) {
      suggestions.push('Habla más despacio y articula cada palabra claramente');
    }

    // Phonetic suggestions
    if (analysis.phoneticAnalysis.vowel_accuracy < 80) {
      suggestions.push('Enfócate en pronunciar las vocales de forma más clara y diferenciada');
    }

    if (analysis.phoneticAnalysis.consonant_accuracy < 70) {
      suggestions.push('Presta atención a las consonantes, especialmente r, rr, ñ y j');
    }

    // Common error suggestions
    analysis.phoneticAnalysis.common_errors.forEach(error => {
      switch (error.type) {
        case 'vowel_error':
          suggestions.push('Revisa la pronunciación de las vocales - el español tiene 5 sonidos vocálicos claros');
          break;
        case 'consonant_error':
          suggestions.push(`Practica el sonido: ${error.description}`);
          break;
      }
    });

    // Fluency suggestions
    if (analysis.fluentAnalysis.confidence_score < 70) {
      suggestions.push('Habla con más confianza y volumen adecuado');
    }

    if (analysis.fluentAnalysis.hesitation_detected) {
      suggestions.push('Intenta hablar de forma más fluida, sin pausas largas');
    }

    return suggestions.length > 0 ? suggestions : ['¡Sigue practicando!'];
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