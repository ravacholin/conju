/**
 * CurriculumProcessor.js
 *
 * Processes curriculum.json into a comprehensive pedagogical structure
 * with tense relationships, prerequisites, and learning progressions.
 *
 * Responsibility: Curriculum data processing and structuring
 * Extracted from levelDrivenPrioritizer.js
 */

import curriculum from '../../../data/curriculum.json'
import { CURRICULUM_ANALYSIS, LEVEL_HIERARCHY } from './constants.js'
import { createLogger } from '../../utils/logger.js'

const logger = createLogger('prioritizer:CurriculumProcessor')

// Quiet logs during tests while keeping them in dev runtime
const debug = (...args) => {
  if (import.meta?.env?.DEV && !import.meta?.env?.VITEST) logger.debug(...args)
}

export class CurriculumProcessor {
  constructor() {
    this.levelHierarchy = LEVEL_HIERARCHY
    this.curriculumData = this.processCurriculumData()
  }

  /**
   * Process curriculum.json into a comprehensive pedagogical structure
   * @returns {Object} Processed curriculum data with multiple indexes
   */
  processCurriculumData() {
    const processed = {
      byLevel: {},
      levelIntroductions: {},
      levelOrder: {},
      tenseFamilies: {},
      complexityMapping: {},
      prerequisiteChains: {}
    }

    // Group curriculum by level with enhanced analysis
    this.levelHierarchy.forEach((level) => {
      processed.byLevel[level] = curriculum
        .filter(item => item.level === level)
        .map(item => {
          const key = `${item.mood}|${item.tense}`
          return {
            mood: item.mood,
            tense: item.tense,
            target: item.target,
            key,
            // Enhanced metadata from curriculum analysis
            complexity: CURRICULUM_ANALYSIS.complexity_scores[key] || 5,
            introducedAt: CURRICULUM_ANALYSIS.introduction_levels[key] || level,
            isCore: CURRICULUM_ANALYSIS.introduction_levels[key] === level,
            isMixed: item.tense.includes('Mixed'),
            family: this.getTenseFamily(key)
          }
        })
    })

    // Create detailed level introduction mapping
    curriculum.forEach((item, index) => {
      const key = `${item.mood}|${item.tense}`

      if (!processed.levelIntroductions[key]) {
        processed.levelIntroductions[key] = {
          level: item.level,
          order: index,
          complexity: CURRICULUM_ANALYSIS.complexity_scores[key] || 5,
          family: this.getTenseFamily(key),
          prerequisites: CURRICULUM_ANALYSIS.prerequisites[key] || []
        }
      }
    })

    // Build learning progression order within each level
    this.levelHierarchy.forEach(level => {
      processed.levelOrder[level] = this.buildLevelProgression(level, processed.byLevel[level])
    })

    // Create tense family relationships
    Object.entries(CURRICULUM_ANALYSIS.tense_families).forEach(([family, tenses]) => {
      processed.tenseFamilies[family] = tenses.map(key => {
        const [mood, tense] = key.split('|')
        return {
          mood,
          tense,
          key,
          introducedAt: CURRICULUM_ANALYSIS.introduction_levels[key],
          complexity: CURRICULUM_ANALYSIS.complexity_scores[key]
        }
      })
    })

    // Build prerequisite chains for dependency analysis
    Object.entries(CURRICULUM_ANALYSIS.prerequisites).forEach(([tenseKey, prereqs]) => {
      processed.prerequisiteChains[tenseKey] = this.buildPrerequisiteChain(tenseKey, prereqs)
    })

    debug('📚 Enhanced Curriculum processed:', {
      levels: Object.keys(processed.byLevel).length,
      totalCombinations: Object.keys(processed.levelIntroductions).length,
      tenseFamilies: Object.keys(processed.tenseFamilies).length,
      prerequisiteChains: Object.keys(processed.prerequisiteChains).length,
      sampleProgression: processed.levelOrder.B1?.slice(0, 3)
    })

    return processed
  }

  /**
   * Get the pedagogical family for a tense
   * @param {string} tenseKey - Tense key in format "mood|tense"
   * @returns {string} Family name (e.g., 'basic_present', 'past_narrative', etc.)
   */
  getTenseFamily(tenseKey) {
    for (const [family, tenses] of Object.entries(CURRICULUM_ANALYSIS.tense_families)) {
      if (tenses.includes(tenseKey)) {
        return family
      }
    }
    return 'independent'
  }

  /**
   * Build optimal learning progression within a level
   * @param {string} level - CEFR level
   * @param {Array} levelTenses - Array of tense objects for this level
   * @returns {Array} Sorted array of tenses in optimal learning order
   */
  buildLevelProgression(level, levelTenses) {
    // Sort tenses within level by pedagogical order
    return levelTenses.sort((a, b) => {
      // 1. Prerequisites first
      const aHasPrereqs = a.key && CURRICULUM_ANALYSIS.prerequisites[a.key]
      const bHasPrereqs = b.key && CURRICULUM_ANALYSIS.prerequisites[b.key]

      if (aHasPrereqs && !bHasPrereqs) return 1
      if (!aHasPrereqs && bHasPrereqs) return -1

      // 2. Core tenses before review tenses
      if (a.isCore !== b.isCore) return a.isCore ? -1 : 1

      // 3. Complexity order
      if (a.complexity !== b.complexity) {
        return (a.complexity || 5) - (b.complexity || 5)
      }

      // 4. Family grouping (learn related tenses together)
      if (a.family !== b.family) {
        const familyOrder = ['basic_present', 'nonfinite_basics', 'past_narrative', 'perfect_system', 'subjunctive_present', 'conditional_system', 'command_forms', 'subjunctive_past']
        const aFamilyIndex = familyOrder.indexOf(a.family)
        const bFamilyIndex = familyOrder.indexOf(b.family)

        if (aFamilyIndex !== -1 && bFamilyIndex !== -1) {
          return aFamilyIndex - bFamilyIndex
        }
      }

      return 0
    })
  }

  /**
   * Build complete prerequisite chain for a tense
   * @param {string} tenseKey - Tense key in format "mood|tense"
   * @param {Array} _DIRECT_PREREQS - Direct prerequisites (not used, for API compatibility)
   * @returns {Array} Array of all prerequisite tense keys (including transitive prerequisites)
   */
  buildPrerequisiteChain(tenseKey, _DIRECT_PREREQS) {
    const chain = new Set()
    const visited = new Set()

    const addPrereqs = (key) => {
      if (visited.has(key)) return // Avoid circular dependencies
      visited.add(key)

      const prereqs = CURRICULUM_ANALYSIS.prerequisites[key] || []
      prereqs.forEach(prereq => {
        chain.add(prereq)
        addPrereqs(prereq) // Recursive chain building
      })
    }

    addPrereqs(tenseKey)
    return Array.from(chain)
  }

  /**
   * Get tense family groups
   * @returns {Object} Tense families from curriculum data
   */
  getTenseFamilyGroups() {
    return this.curriculumData.tenseFamilies
  }

  /**
   * Get data for a specific level
   * @param {string} level - CEFR level
   * @returns {Array} Tense objects for the level
   */
  getLevelData(level) {
    return this.curriculumData.byLevel[level] || []
  }

  /**
   * Get learning progression for a level
   * @param {string} level - CEFR level
   * @returns {Array} Tenses in optimal learning order
   */
  getLevelProgression(level) {
    return this.curriculumData.levelOrder[level] || []
  }

  /**
   * Get prerequisite chain for a tense
   * @param {string} tenseKey - Tense key in format "mood|tense"
   * @returns {Array} Array of prerequisite tense keys
   */
  getPrerequisiteChain(tenseKey) {
    return this.curriculumData.prerequisiteChains[tenseKey] || []
  }
}
