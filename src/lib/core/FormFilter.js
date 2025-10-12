/**
 * FormFilter.js
 *
 * Modular filtering logic for verb conjugation forms.
 * Extracted from generator.js to improve maintainability and testability.
 *
 * Responsibilities:
 * - Filter forms by curriculum level
 * - Apply dialect restrictions
 * - Handle verb type filtering (regular/irregular)
 * - Manage pronoun filtering
 * - Apply family-based filtering
 */

import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel } from './levelVerbFiltering.js'
import { isRegularFormForMood, isRegularNonfiniteForm } from './conjugationRules.js'
import { getAllowedCombosForLevel as GET_ALLOWED_COMBOS } from './curriculumGate.js'
import { isIrregularInTense } from '../utils/irregularityUtils.js'
import { VERB_LOOKUP_MAP } from './optimizedCache.js'

/**
 * Configuration for form filtering
 */
export class FilterConfig {
  constructor(settings = {}) {
    // Level settings
    this.level = settings.level || 'B1'
    this.userLevel = settings.userLevel || 'A2'
    this.levelPracticeMode = settings.levelPracticeMode || 'by_level'

    // Dialect settings
    this.region = settings.region || 'la_general'
    this.useVoseo = settings.useVoseo !== false
    this.useTuteo = settings.useTuteo !== false
    this.useVosotros = settings.useVosotros !== false

    // Practice settings
    this.practiceMode = settings.practiceMode || 'mixed'
    this.specificMood = settings.specificMood || null
    this.specificTense = settings.specificTense || null
    this.practicePronoun = settings.practicePronoun || null

    // Verb type settings
    this.verbType = settings.verbType || 'all'
    this.selectedFamily = settings.selectedFamily || null
    this.allowedLemmas = settings.allowedLemmas || null

    // Advanced settings
    this.currentBlock = settings.currentBlock || null
    this.enableFuturoSubjProd = settings.enableFuturoSubjProd || false
    this.cameFromTema = settings.cameFromTema || false
  }

  /**
   * Check if level filtering should be applied
   */
  shouldApplyLevelFiltering() {
    return this.levelPracticeMode === 'by_level'
  }

  /**
   * Check if this is a specific topic practice (theme/specific)
   */
  isSpecificTopicPractice() {
    return this.practiceMode === 'theme' || this.practiceMode === 'specific'
  }

  /**
   * Get effective level for filtering
   */
  getEffectiveLevel() {
    return this.shouldApplyLevelFiltering() ? this.level : 'ALL'
  }
}

/**
 * Main form filtering class
 */
export class FormFilter {
  constructor(config) {
    this.config = config
    this.stats = {
      totalForms: 0,
      filteredForms: 0,
      levelFiltered: 0,
      dialectFiltered: 0,
      verbTypeFiltered: 0,
      pronounFiltered: 0,
      familyFiltered: 0
    }
  }

  /**
   * Filter an array of forms based on configuration
   * @param {Array} forms - Array of verb forms to filter
   * @returns {Array} Filtered forms
   */
  filterForms(forms) {
    if (!Array.isArray(forms) || forms.length === 0) {
      return []
    }

    this.stats.totalForms = forms.length

    let filtered = forms.filter(form => {
      // Basic validation
      if (!this.isValidForm(form)) return false

      // Apply filters in order of specificity
      if (!this.passesLevelFilter(form)) return false
      if (!this.passesDialectFilter(form)) return false
      if (!this.passesVerbTypeFilter(form)) return false
      if (!this.passesPronounFilter(form)) return false
      if (!this.passesFamilyFilter(form)) return false
      if (!this.passesLemmaRestrictions(form)) return false
      if (!this.passesSpecificPracticeFilter(form)) return false

      return true
    })

    // Filter out infinitives (they're not conjugated forms)
    filtered = filtered.filter(f =>
      !(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf'))
    )

    this.stats.filteredForms = filtered.length

    return filtered
  }

  /**
   * Validate that a form has required fields
   */
  isValidForm(form) {
    if (!form || typeof form !== 'object') return false
    if (!form.value && !form.form) return false
    return true
  }

  /**
   * Check if form passes level filtering
   */
  passesLevelFilter(form) {
    // Skip level filtering for specific topic practice
    if (this.config.isSpecificTopicPractice()) {
      return true
    }

    // Get allowed combinations for level
    const allowed = this.config.currentBlock && this.config.currentBlock.combos && this.config.currentBlock.combos.length
      ? new Set(this.config.currentBlock.combos.map(c => `${c.mood}|${c.tense}`))
      : GET_ALLOWED_COMBOS(this.config.level)

    const comboKey = `${form.mood}|${form.tense}`
    if (!allowed.has(comboKey)) {
      this.stats.levelFiltered++
      return false
    }

    // Gate futuro de subjuntivo by production toggle
    if (form.mood === 'subjunctive' && (form.tense === 'subjFut' || form.tense === 'subjFutPerf')) {
      if (!this.config.enableFuturoSubjProd) {
        this.stats.levelFiltered++
        return false
      }
    }

    return true
  }

  /**
   * Check if form passes dialect filtering
   */
  passesDialectFilter(form) {
    // Dialect filtering already handled by curriculumGate
    // This is a placeholder for any additional dialect logic
    return true
  }

  /**
   * Check if form passes verb type filtering
   */
  passesVerbTypeFilter(form) {
    const verb = VERB_LOOKUP_MAP.get(form.lemma) || { type: 'regular', lemma: form.lemma }

    // Apply verb type filtering based on user selection
    if (this.config.verbType === 'regular' && this.config.verbType !== 'mixed' && this.config.verbType !== 'all') {
      // Use form-level type to avoid incomplete VERB_LOOKUP_MAP issues
      if (form.type !== 'regular') {
        this.stats.verbTypeFiltered++
        return false
      }

      // Additional morphology-based filtering for regular forms
      const isCompoundTense = this.isCompoundTense(form.tense)
      if (isCompoundTense) {
        const part = (form.value || '').split(/\s+/).pop()
        if (!isRegularNonfiniteForm(form.lemma, 'part', part)) {
          this.stats.verbTypeFiltered++
          return false
        }
      } else if (form.mood === 'nonfinite') {
        if (!isRegularNonfiniteForm(form.lemma, form.tense, form.value)) {
          this.stats.verbTypeFiltered++
          return false
        }
      } else {
        if (!isRegularFormForMood(form.lemma, form.mood, form.tense, form.person, form.value)) {
          this.stats.verbTypeFiltered++
          return false
        }
      }
    } else if (this.config.verbType === 'irregular' && this.config.verbType !== 'mixed' && this.config.verbType !== 'all') {
      // For irregular verbs, include all forms of irregular lemmas
      if ((verb?.type || 'regular') !== 'irregular') {
        this.stats.verbTypeFiltered++
        return false
      }
    }

    // Level-based verb filtering
    try {
      const verbFamilies = categorizeVerb(form.lemma, verb)
      const isPedagogicalDrill = this.config.selectedFamily === 'PRETERITE_THIRD_PERSON'
      const isRegularPracticeMode = this.config.verbType === 'regular'
      const verbIsActuallyRegular = verb?.type === 'regular' || form.type === 'regular'
      const shouldBypassLevelFiltering = isRegularPracticeMode && verbIsActuallyRegular

      if (!shouldBypassLevelFiltering) {
        const shouldApplyFiltering = this.config.shouldApplyLevelFiltering()
        const shouldFilter = !isPedagogicalDrill && shouldApplyFiltering &&
          shouldFilterVerbByLevel(form.lemma, verbFamilies, this.config.getEffectiveLevel(), form.tense)

        if (shouldFilter) {
          this.stats.verbTypeFiltered++
          return false
        }
      }
    } catch {
      // If categorization fails, allow the form through
    }

    return true
  }

  /**
   * Check if form passes pronoun filtering
   */
  passesPronounFilter(form) {
    // Apply pronoun filtering only for non-mixed, non-specific practice
    if (this.config.practiceMode === 'specific' || this.config.practiceMode === 'theme') {
      // For specific/theme practice, show ALL persons of the selected form
      return true
    }

    if (this.config.practiceMode === 'mixed' || this.config.practiceMode === 'all' || !this.config.practiceMode) {
      // Mixed practice: show variety of persons
      return true
    }

    // Apply strict pronoun filtering for other modes
    if (this.config.practicePronoun === 'tu_only') {
      if (form.person !== '2s_tu') {
        this.stats.pronounFiltered++
        return false
      }
    } else if (this.config.practicePronoun === 'vos_only') {
      if (form.person !== '2s_vos') {
        this.stats.pronounFiltered++
        return false
      }
    }
    // 'both' and 'all' allow regional dialect filtering to work normally

    return true
  }

  /**
   * Check if form passes family filtering
   */
  passesFamilyFilter(form) {
    if (!this.config.selectedFamily) {
      return true
    }

    const verb = VERB_LOOKUP_MAP.get(form.lemma) || { type: 'regular', lemma: form.lemma }

    // Special pedagogical drill: "Irregulares en 3ª persona"
    if (form.tense === 'pretIndef' && this.config.verbType === 'irregular' && this.config.selectedFamily === 'PRETERITE_THIRD_PERSON') {
      const verbFamilies = categorizeVerb(form.lemma, verb)
      const pedagogicalThirdPersonFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
      const isPedagogicallyRelevant = verbFamilies.some(family => pedagogicalThirdPersonFamilies.includes(family))

      if (!isPedagogicallyRelevant) {
        this.stats.familyFiltered++
        return false
      }

      // Exclude verbs with strong pretérito irregularities
      const strongPreteriteIrregularities = ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL']
      const hasStrongPreteriteIrregularities = verbFamilies.some(family => strongPreteriteIrregularities.includes(family))
      if (hasStrongPreteriteIrregularities) {
        this.stats.familyFiltered++
        return false
      }
    }

    // Standard family filtering
    if (this.config.practiceMode === 'theme' || !this.config.cameFromTema) {
      const verbFamilies = categorizeVerb(form.lemma, verb)

      // Check if it's a simplified group that needs expansion
      const expandedFamilies = expandSimplifiedGroup(this.config.selectedFamily)
      if (expandedFamilies.length > 0) {
        const isMatch = verbFamilies.some(vf => expandedFamilies.includes(vf))
        if (!isMatch) {
          this.stats.familyFiltered++
          return false
        }
      } else {
        // Regular family - check direct match
        if (!verbFamilies.includes(this.config.selectedFamily)) {
          this.stats.familyFiltered++
          return false
        }
      }

      // Level-based filtering for specific verb types
      const isPedagogicalDrill = this.config.selectedFamily === 'PRETERITE_THIRD_PERSON'
      const shouldApplyFiltering = this.config.shouldApplyLevelFiltering()
      const shouldApplyThematicLevelFiltering = (this.config.practiceMode === 'theme' && this.config.selectedFamily) ||
        (!this.config.cameFromTema && !isPedagogicalDrill)

      if (shouldApplyThematicLevelFiltering && shouldApplyFiltering && !isPedagogicalDrill &&
          shouldFilterVerbByLevel(form.lemma, verbFamilies, this.config.getEffectiveLevel(), form.tense)) {
        this.stats.familyFiltered++
        return false
      }
    }

    return true
  }

  /**
   * Check if form passes lemma restrictions
   */
  passesLemmaRestrictions(form) {
    // Skip restriction for theme or specific practice from tema
    const shouldBypassLemmaRestrictions = (this.config.verbType === 'all') ||
      (this.config.practiceMode === 'theme' || (this.config.practiceMode === 'specific' && this.config.cameFromTema === true))

    if (this.config.allowedLemmas && !shouldBypassLemmaRestrictions) {
      if (!this.config.allowedLemmas.has(form.lemma)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if form passes specific practice filtering
   */
  passesSpecificPracticeFilter(form) {
    if (this.config.practiceMode !== 'specific') {
      return true
    }

    // Mood filtering
    if (this.config.specificMood && form.mood !== this.config.specificMood) {
      return false
    }

    // Tense filtering
    if (this.config.specificTense) {
      if (this.config.specificTense === 'impMixed') {
        // Mixed imperative: both affirmative and negative
        if (form.mood !== 'imperative' || (form.tense !== 'impAff' && form.tense !== 'impNeg')) {
          return false
        }
      } else if (this.config.specificTense === 'nonfiniteMixed') {
        // Mixed nonfinite: gerund and participle
        if (form.mood !== 'nonfinite' || (form.tense !== 'ger' && form.tense !== 'part')) {
          return false
        }

        // For irregular verb type, allow all nonfinite forms of irregular lemmas
        if (this.config.verbType === 'irregular') {
          const v = VERB_LOOKUP_MAP.get(form.lemma)
          if ((v?.type || 'regular') !== 'irregular') return false
        }
      } else if (form.tense !== this.config.specificTense) {
        return false
      }
    }

    return true
  }

  /**
   * Check if a tense is compound
   */
  isCompoundTense(tense) {
    const compoundTenses = ['pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc']
    return compoundTenses.includes(tense)
  }

  /**
   * Get filtering statistics
   */
  getStats() {
    return {
      ...this.stats,
      filterRate: this.stats.totalForms > 0
        ? ((this.stats.totalForms - this.stats.filteredForms) / this.stats.totalForms * 100).toFixed(1) + '%'
        : '0%'
    }
  }
}

/**
 * Factory function to create a filter with settings
 * @param {Object} settings - User settings object
 * @returns {FormFilter} Configured filter instance
 */
export function createFormFilter(settings) {
  const config = new FilterConfig(settings)
  return new FormFilter(config)
}
