/**
 * StoryBuildingExercise - Ejercicio de construcción de historias
 *
 * Permite a los usuarios crear narrativas usando elementos proporcionados
 * (personajes, lugares, objetos, eventos) mientras practican tiempos verbales específicos.
 *
 * @class StoryBuildingExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('StoryBuildingExercise');

export class StoryBuildingExercise extends ExerciseBase {
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.STORY_BUILDING
    });

    this.elements = config.elements || {};
    this.requiredElements = config.requiredElements || 5;
    this.targetVerbs = config.targetVerbs || [];
    this.expectedVerbs = config.expectedVerbs || [];
    this.selectedElements = [];
    this.usedElements = [];
    this.userStory = '';
    this.storyProgress = {
      elementsUsed: 0,
      verbsDetected: [],
      currentWordCount: 0
    };

    logger.debug(`StoryBuildingExercise created: ${this.id} with ${this.requiredElements} required elements`);
  }

  async initialize() {
    await super.initialize();

    if (!this.elements || Object.keys(this.elements).length === 0) {
      throw new Error('Story building exercise requires elements');
    }

    if (!this.targetVerbs || this.targetVerbs.length === 0) {
      throw new Error('Story building exercise requires target verbs');
    }

    // Pre-seleccionar elementos aleatorios para la historia
    this.selectedElements = this.selectRandomElements();

    logger.info(`Story building exercise initialized with ${this.selectedElements.length} elements`);
  }

  selectRandomElements() {
    const selected = [];
    const categories = Object.keys(this.elements);

    // Asegurar al menos un elemento de cada categoría
    categories.forEach(category => {
      const items = this.elements[category];
      if (items && items.length > 0) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        selected.push({
          category,
          item: randomItem,
          used: false
        });
      }
    });

    // Añadir elementos adicionales hasta alcanzar el número requerido
    while (selected.length < this.requiredElements) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const items = this.elements[randomCategory];
      const randomItem = items[Math.floor(Math.random() * items.length)];

      // Evitar duplicados
      const alreadySelected = selected.some(sel =>
        sel.category === randomCategory &&
        JSON.stringify(sel.item) === JSON.stringify(randomItem)
      );

      if (!alreadySelected) {
        selected.push({
          category: randomCategory,
          item: randomItem,
          used: false
        });
      }
    }

    return selected;
  }

  getNextStep() {
    if (this.isComplete()) {
      return null;
    }

    return {
      type: 'story_building_input',
      title: this.title,
      description: this.description,
      elements: this.selectedElements,
      requiredElements: this.requiredElements,
      targetVerbs: this.targetVerbs,
      expectedVerbs: this.expectedVerbs, // Incluir verbos esperados
      progress: this.storyProgress,
      instructions: this.getInstructions(),
      minLength: this.minLength || 150,
      maxLength: this.maxLength || 300,
      placeholder: `Escribe tu historia usando estos verbos: ${this.expectedVerbs && this.expectedVerbs.length > 0 ? this.expectedVerbs.join(', ') : 'los verbos indicados'}...`
    };
  }

  getInstructions() {
    const tenseInfo = this.getTenseInstructions();
    return `Crea una historia usando al menos ${this.requiredElements} de los elementos mostrados. ${tenseInfo} Incluye algunos de los verbos sugeridos en tu narrativa.`;
  }

  getTenseInstructions() {
    if (!this.targetTenses || this.targetTenses.length === 0) {
      return 'Usa los tiempos verbales apropiados para tu historia.';
    }

    const tenseNames = {
      pres: 'presente',
      pretIndef: 'pretérito indefinido',
      impf: 'pretérito imperfecto',
      fut: 'futuro',
      cond: 'condicional',
      pretPerf: 'pretérito perfecto',
      plusc: 'pluscuamperfecto'
    };

    const tenseDescriptions = this.targetTenses.map(tense => tenseNames[tense] || tense);

    if (tenseDescriptions.length === 1) {
      return `Usa principalmente el ${tenseDescriptions[0]}.`;
    } else if (tenseDescriptions.length === 2) {
      return `Combina el ${tenseDescriptions[0]} y el ${tenseDescriptions[1]}.`;
    } else {
      return `Usa una combinación de: ${tenseDescriptions.join(', ')}.`;
    }
  }

  async processResponse(response) {
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, escribe una historia más completa usando los elementos proporcionados.'
      };
    }

    this.addUserResponse(response, { step: 'story_creation' });
    this.userStory = response;

    const analysis = await this.analyzeStory(response);
    this.currentStep = 1;

    // Actualizar progreso
    this.storyProgress = {
      elementsUsed: analysis.elementsUsed.length,
      verbsDetected: analysis.verbsDetected,
      currentWordCount: analysis.wordCount
    };

    return {
      success: analysis.isComplete,
      analysis,
      feedback: this.generateFeedback(analysis),
      nextStep: this.getNextStep()
    };
  }

  async analyzeStory(story) {
    const STORY_LOWER = story.toLowerCase();
    const normalizedStory = this.normalizeText(story);

    const analysis = {
      elementsUsed: [],
      elementsNotUsed: [],
      verbsDetected: [],
      verbsNotDetected: [],
      tenseUsage: {},
      wordCount: story.trim().split(/\s+/).length,
      isComplete: false,
      qualityScore: 0
    };

    // Analizar elementos utilizados
    this.selectedElements.forEach(element => {
      const elementText = element.item.name || element.item;
      const normalizedElement = this.normalizeText(elementText);

      if (normalizedStory.includes(normalizedElement.toLowerCase())) {
        analysis.elementsUsed.push(element);
        element.used = true;
      } else {
        analysis.elementsNotUsed.push(element);
      }
    });

    // Analizar verbos objetivo
    this.targetVerbs.forEach(verb => {
      const verbPatterns = this.generateVerbPatterns(verb);
      let verbFound = false;

      for (const pattern of verbPatterns) {
        if (pattern.test(normalizedStory)) {
          analysis.verbsDetected.push(verb);
          verbFound = true;
          break;
        }
      }

      if (!verbFound) {
        analysis.verbsNotDetected.push(verb);
      }
    });

    // Analizar uso de tiempos verbales
    if (this.targetTenses) {
      analysis.tenseUsage = this.analyzeTenseUsage(story);
    }

    // Calcular completitud
    const elementsScore = analysis.elementsUsed.length / this.requiredElements;
    const verbsScore = analysis.verbsDetected.length / Math.min(this.targetVerbs.length, 3); // Max 3 verbos esperados
    const lengthScore = this.calculateLengthScore(analysis.wordCount);

    analysis.qualityScore = (elementsScore * 0.4 + verbsScore * 0.3 + lengthScore * 0.3);
    analysis.isComplete = analysis.elementsUsed.length >= this.requiredElements &&
                         analysis.verbsDetected.length >= 2 &&
                         analysis.wordCount >= (this.minLength || 150);

    return analysis;
  }

  generateVerbPatterns(verb) {
    // Normalizar el verbo para mantener coherencia con la detección del texto
    const normalizedVerb = this.normalizeText(verb);
    const patterns = [];

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const addPatternForEndings = (stem, endings) => {
      const normalizedEndings = endings
        .filter(Boolean)
        .map(ending => this.normalizeText(ending));

      if (normalizedEndings.length === 0) {
        return;
      }

      const uniqueEndings = Array.from(new Set(normalizedEndings)).map(escapeRegExp);
      const group = uniqueEndings.length === 1 ? uniqueEndings[0] : `(?:${uniqueEndings.join('|')})`;
      patterns.push(new RegExp(`\\b${escapeRegExp(stem)}${group}\\b`, 'i'));
    };

    // Patrón básico del infinitivo normalizado
    patterns.push(new RegExp(`\\b${escapeRegExp(normalizedVerb)}\\b`, 'i'));

    const endingsByGroup = {
      ar: {
        present: ['o', 'as', 'a', 'amos', 'ais', 'an'],
        preterite: ['e', 'aste', 'o', 'amos', 'asteis', 'aron'],
        imperfect: ['aba', 'abas', 'aba', 'abamos', 'abais', 'aban']
      },
      er: {
        present: ['o', 'es', 'e', 'emos', 'eis', 'en'],
        preterite: ['i', 'iste', 'io', 'imos', 'isteis', 'ieron'],
        imperfect: ['ia', 'ias', 'ia', 'iamos', 'iais', 'ian']
      },
      ir: {
        present: ['o', 'es', 'e', 'imos', 'is', 'en'],
        preterite: ['i', 'iste', 'io', 'imos', 'isteis', 'ieron'],
        imperfect: ['ia', 'ias', 'ia', 'iamos', 'iais', 'ian']
      }
    };

    const verbEnding = normalizedVerb.slice(-2);
    const stem = normalizedVerb.slice(0, -2);

    if (endingsByGroup[verbEnding]) {
      const groups = endingsByGroup[verbEnding];
      Object.values(groups).forEach(endings => addPatternForEndings(stem, endings));

      // Manejar conjugaciones con inserción de 'y' para verbos que lo requieren
      const requiresYInPreterite = /(?:a|e|o)er$/.test(normalizedVerb) || normalizedVerb.endsWith('oir');
      const isUirVerb = normalizedVerb.endsWith('uir') && !normalizedVerb.endsWith('guir');

      if (requiresYInPreterite || isUirVerb) {
        const yEndings = ['yo', 'yeron', 'yendo'];

        if (isUirVerb || normalizedVerb.endsWith('oir')) {
          yEndings.push('yes', 'ye', 'yen');
        }

        addPatternForEndings(stem, yEndings);
      }
    }

    return patterns;
  }

  analyzeTenseUsage(story) {
    const tenseUsage = {};
    const tensePatterns = {
      pres: /\b\w+(o|as|a|amos|áis|an|es|e|emos|éis|en|imos|ís)\b/gi,
      pretIndef: /\b\w+(é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)\b/gi,
      impf: /\b\w+(aba|abas|aba|ábamos|abais|aban|ía|ías|ía|íamos|íais|ían)\b/gi,
      fut: /\b\w+(ré|rás|rá|remos|réis|rán)\b/gi,
      cond: /\b\w+(ría|rías|ría|ríamos|ríais|rían)\b/gi
    };

    Object.keys(tensePatterns).forEach(tense => {
      const matches = story.match(tensePatterns[tense]) || [];
      tenseUsage[tense] = matches.length;
    });

    return tenseUsage;
  }

  calculateLengthScore(wordCount) {
    const minLength = this.minLength || 150;
    const maxLength = this.maxLength || 300;
    const optimal = (minLength + maxLength) / 2;

    if (wordCount < minLength) {
      return wordCount / minLength;
    } else if (wordCount > maxLength) {
      return Math.max(0, 1 - (wordCount - maxLength) / maxLength);
    } else {
      // Puntuación óptima cerca del punto medio
      const distance = Math.abs(wordCount - optimal);
      return Math.max(0.8, 1 - distance / optimal);
    }
  }

  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  generateFeedback(analysis) {
    let feedback = '';

    if (analysis.isComplete) {
      feedback = '¡Excelente historia! Has usado creativamente los elementos y verbos sugeridos. ';

      if (analysis.qualityScore > 0.8) {
        feedback += 'Tu narrativa es muy rica y bien estructurada.';
      } else {
        feedback += 'Has completado todos los requisitos exitosamente.';
      }
    } else {
      const issues = [];

      if (analysis.elementsUsed.length < this.requiredElements) {
        const missing = this.requiredElements - analysis.elementsUsed.length;
        issues.push(`Necesitas usar ${missing} elemento(s) más de los proporcionados`);
      }

      if (analysis.verbsDetected.length < 2) {
        issues.push('Intenta incluir más verbos de la lista sugerida');
      }

      if (analysis.wordCount < (this.minLength || 150)) {
        const needed = (this.minLength || 150) - analysis.wordCount;
        issues.push(`Tu historia necesita aproximadamente ${needed} palabras más`);
      }

      feedback = issues.join('. ') + '. ';

      if (analysis.elementsUsed.length > 0) {
        feedback += `Has usado bien: ${analysis.elementsUsed.map(e => e.item.name || e.item).join(', ')}. `;
      }

      if (analysis.verbsDetected.length > 0) {
        feedback += `Verbos detectados correctamente: ${analysis.verbsDetected.join(', ')}.`;
      }
    }

    return feedback;
  }

  validateResponse(response) {
    const errors = [];

    if (!response || typeof response !== 'string') {
      errors.push('La respuesta debe ser un texto válido');
    }

    if (response && response.trim().length < 50) {
      errors.push('La historia debe tener al menos 50 caracteres');
    }

    const wordCount = response ? response.trim().split(/\s+/).length : 0;
    if (wordCount < 30) {
      errors.push('La historia debe tener al menos 30 palabras');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  isComplete() {
    return this.currentStep >= 1 && this.storyProgress.elementsUsed >= this.requiredElements;
  }

  getTotalSteps() {
    return 1;
  }

  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      elements: this.selectedElements,
      requiredElements: this.requiredElements,
      targetVerbs: this.targetVerbs,
      inputType: 'textarea',
      placeholder: 'Escribe tu historia aquí...',
      minLength: this.minLength || 150,
      maxLength: this.maxLength || 300,
      showWordCount: true,
      showElementTracker: true,
      showVerbSuggestions: true
    };
  }

  reset() {
    super.reset();
    this.selectedElements = this.selectRandomElements();
    this.usedElements = [];
    this.userStory = '';
    this.storyProgress = {
      elementsUsed: 0,
      verbsDetected: [],
      currentWordCount: 0
    };
  }

  // Método para obtener estadísticas del ejercicio
  getExerciseStats() {
    const baseStats = typeof super.getExerciseStats === 'function' ? super.getExerciseStats() : {};

    return {
      ...baseStats,
      elementsUsed: this.storyProgress.elementsUsed,
      requiredElements: this.requiredElements,
      verbsDetected: this.storyProgress.verbsDetected.length,
      targetVerbs: this.targetVerbs.length,
      storyLength: this.storyProgress.currentWordCount
    };
  }
}
