/**
 * Constants for Level-Driven Tense Prioritization System
 *
 * This module contains all configuration constants used by the prioritization engine.
 * Extracted from levelDrivenPrioritizer.js for better maintainability.
 */

/**
 * CEFR level hierarchy
 */
export const LEVEL_HIERARCHY = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/**
 * Advanced prioritization weights derived from curriculum analysis
 * These weights are based on the actual curriculum structure and progression
 */
export const LEVEL_PRIORITY_WEIGHTS = {
  A1: {
    core: 0.90,     // 90% focus on A1 basics (present + nonfinite only)
    review: 0.10,   // 10% reinforcement
    exploration: 0.0, // No exploration - master basics first
    consolidation: 0.8 // High consolidation need for fundamentals
  },
  A2: {
    core: 0.75,     // 75% focus on A2 expansion (past, future, imperative)
    review: 0.20,   // 20% A1 review
    exploration: 0.05, // 5% B1 preview
    consolidation: 0.6 // Good consolidation for new tenses
  },
  B1: {
    core: 0.65,     // 65% focus on B1 complexity (subjunctive, perfect tenses)
    review: 0.25,   // 25% A1-A2 review
    exploration: 0.10, // 10% B2 preview
    consolidation: 0.5 // Moderate consolidation, more exploration
  },
  B2: {
    core: 0.50,     // 50% focus on B2 advanced (subjunctive imperfect, complex)
    review: 0.35,   // 35% previous levels review
    exploration: 0.15, // 15% C1 preview
    consolidation: 0.4 // Less consolidation, more variety
  },
  C1: {
    core: 0.35,     // 35% focus on C1 mastery
    review: 0.45,   // 45% comprehensive review for fluency
    exploration: 0.20, // 20% C2 preview
    consolidation: 0.3 // Low consolidation, high variety
  },
  C2: {
    core: 0.25,     // 25% focus on C2 perfection
    review: 0.55,   // 55% comprehensive mastery practice
    exploration: 0.20, // 20% advanced/rare combinations
    consolidation: 0.2 // Minimal consolidation, maximum variety
  }
}

/**
 * Curriculum-derived tense introduction order and complexity analysis
 * This maps exactly to the curriculum.json structure
 */
export const CURRICULUM_ANALYSIS = {
  // When each tense is first introduced (curriculum order)
  introduction_levels: {
    'indicative|pres': 'A1',        // Foundation
    'nonfinite|part': 'A1',         // Basic participles
    'nonfinite|ger': 'A1',          // Basic gerunds
    'indicative|pretIndef': 'A2',   // Past actions
    'indicative|impf': 'A2',        // Past descriptions
    'indicative|fut': 'A2',         // Future
    'imperative|impAff': 'A2',      // Commands
    'indicative|plusc': 'B1',       // Pluperfect
    'indicative|pretPerf': 'B1',    // Present perfect
    'indicative|futPerf': 'B1',     // Future perfect
    'subjunctive|subjPres': 'B1',   // Present subjunctive
    'subjunctive|subjPerf': 'B1',   // Perfect subjunctive
    'imperative|impNeg': 'B1',      // Negative commands
    'conditional|cond': 'B1',       // Conditional
    'subjunctive|subjImpf': 'B2',   // Imperfect subjunctive
    'subjunctive|subjPlusc': 'B2',  // Pluperfect subjunctive
    'conditional|condPerf': 'B2'    // Conditional perfect
  },

  // Complexity scores based on curriculum progression
  complexity_scores: {
    'indicative|pres': 1,        // Simplest
    'nonfinite|ger': 2,
    'nonfinite|part': 2,
    'indicative|pretIndef': 3,
    'indicative|impf': 3,
    'indicative|fut': 3,
    'imperative|impAff': 4,
    'indicative|pretPerf': 5,   // Perfect tenses jump in complexity
    'conditional|cond': 5,
    'indicative|plusc': 6,
    'indicative|futPerf': 6,
    'subjunctive|subjPres': 7,   // Subjunctive is major complexity jump
    'subjunctive|subjPerf': 7,
    'imperative|impNeg': 7,
    'subjunctive|subjImpf': 8,   // Advanced subjunctive
    'conditional|condPerf': 8,
    'subjunctive|subjPlusc': 9   // Most complex
  },

  // Pedagogical relationships (what should be learned together)
  tense_families: {
    'basic_present': ['indicative|pres'],
    'nonfinite_basics': ['nonfinite|ger', 'nonfinite|part'],
    'past_narrative': ['indicative|pretIndef', 'indicative|impf'],
    'future_planning': ['indicative|fut'],
    'command_forms': ['imperative|impAff', 'imperative|impNeg'],
    'perfect_system': ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf', 'conditional|condPerf', 'subjunctive|subjPerf', 'subjunctive|subjPlusc'],
    'subjunctive_present': ['subjunctive|subjPres', 'subjunctive|subjPerf'],
    'subjunctive_past': ['subjunctive|subjImpf', 'subjunctive|subjPlusc'],
    'conditional_system': ['conditional|cond', 'conditional|condPerf']
  },

  // Learning prerequisites (what must be solid before advancing)
  prerequisites: {
    'subjunctive|subjPres': ['indicative|pres', 'indicative|pretIndef'],
    'subjunctive|subjImpf': ['subjunctive|subjPres', 'indicative|impf'],
    'indicative|pretPerf': ['indicative|pres'],
    'indicative|plusc': ['indicative|pretPerf', 'indicative|impf'],
    'conditional|condPerf': ['conditional|cond', 'indicative|pretPerf'],
    'subjunctive|subjPlusc': ['subjunctive|subjImpf', 'indicative|plusc']
  },

  // Mixed practice combinations from curriculum
  mixed_combinations: {
    'imperative|impMixed': ['imperative|impAff', 'imperative|impNeg'],
    'nonfinite|nonfiniteMixed': ['nonfinite|ger', 'nonfinite|part']
  }
}
