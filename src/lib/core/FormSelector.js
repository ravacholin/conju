/**
 * FormSelector.js
 *
 * Intelligent form selection algorithm.
 * Extracted from generator.js to improve maintainability.
 *
 * Responsibilities:
 * - Select forms based on variety and recency
 * - Apply level-driven prioritization
 * - Handle weighted selection for verb types
 * - Manage person rotation and variety
 * - Avoid repetition
 */

import { getPersonWeightsForLevel } from './practicePolicy.js'
import { VERB_LOOKUP_MAP } from './optimizedCache.js'
import { isIrregularInTense } from '../utils/irregularityUtils.js'

/**
 * Selection configuration
 */
export class SelectionConfig {
  constructor(settings = {}) {
    this.level = settings.level || 'B1'
    this.practiceMode = settings.practiceMode || 'mixed'
    this.verbType = settings.verbType || 'all'
    this.region = settings.region || 'la_general'

    // C2 conmutacion settings
    this.enableC2Conmutacion = settings.enableC2Conmutacion || false
    this.conmutacionSeq = settings.conmutacionSeq || ['2s_vos', '3p', '3s']
    this.conmutacionIdx = settings.conmutacionIdx || 0

    // Rotation settings
    this.rotateSecondPerson = settings.rotateSecondPerson || false
    this.nextSecondPerson = settings.nextSecondPerson || '2s_vos'

    // Current item (to avoid repetition)
    this.currentItem = settings.currentItem || null
  }
}

/**
 * Form selector class
 */
export class FormSelector {
  constructor(config) {
    this.config = config
    this.stats = {
      totalForms: 0,
      selectedForm: null,
      selectionStrategy: 'none'
    }
  }

  /**
   * Select a form from eligible forms
   * @param {Array} eligibleForms - Array of eligible forms
   * @returns {Object|null} Selected form or null
   */
  selectForm(eligibleForms) {
    if (!Array.isArray(eligibleForms) || eligibleForms.length === 0) {
      return null
    }

    this.stats.totalForms = eligibleForms.length

    // Remove current item from candidates if possible
    let candidates = this.excludeCurrentItem(eligibleForms)

    // Apply selection strategy based on practice mode
    let selected = null

    if (this.config.practiceMode === 'specific') {
      // For specific practice, use simple random with verb variety
      selected = this.selectForSpecificPractice(candidates)
      this.stats.selectionStrategy = 'specific'
    } else if (this.config.enableC2Conmutacion && this.config.level === 'C2') {
      // C2 conmutacion for person variety
      selected = this.selectWithC2Conmutacion(candidates)
      this.stats.selectionStrategy = 'c2_conmutacion'
    } else {
      // Default: weighted selection by person
      selected = this.selectWithPersonWeighting(candidates)
      this.stats.selectionStrategy = 'person_weighted'
    }

    this.stats.selectedForm = selected
    return selected
  }

  /**
   * Exclude current item from candidates to avoid repetition
   */
  excludeCurrentItem(forms) {
    if (!this.config.currentItem || forms.length <= 1) {
      return forms
    }

    const { lemma, mood, tense, person } = this.config.currentItem

    // For specific practice, prioritize verb variety by excluding the last-used lemma entirely
    if (this.config.practiceMode === 'specific') {
      const filteredByLemma = forms.filter(f => f.lemma !== lemma)
      if (filteredByLemma.length > 0) {
        return filteredByLemma
      }
    } else {
      // For other modes, exclude exact match
      const filtered = forms.filter(f =>
        f.lemma !== lemma || f.mood !== mood || f.tense !== tense || f.person !== person
      )
      if (filtered.length > 0) {
        return filtered
      }
    }

    return forms
  }

  /**
   * Select form for specific practice mode
   */
  selectForSpecificPractice(forms) {
    if (forms.length === 0) return null

    // For regular practice, ensure better distribution of verb endings
    if (this.config.verbType === 'regular') {
      return this.selectWithEndingVariety(forms)
    }

    // Simple random selection
    const idx = Math.floor(Math.random() * forms.length)
    return forms[idx]
  }

  /**
   * Select form with verb ending variety (for regular verbs)
   */
  selectWithEndingVariety(forms) {
    // Group forms by ending
    const formsByEnding = {
      'ar': forms.filter(f => f.lemma?.endsWith('ar')),
      'er': forms.filter(f => f.lemma?.endsWith('er')),
      'ir': forms.filter(f => f.lemma?.endsWith('ir'))
    }

    // Give -ir verbs 30% selection chance to ensure they appear
    const random = Math.random()
    let selectedEnding

    if (formsByEnding.ir.length > 0 && random < 0.3) {
      selectedEnding = 'ir'
    } else if (formsByEnding.er.length > 0 && random < 0.6) {
      selectedEnding = 'er'
    } else {
      selectedEnding = 'ar'
    }

    const selectedForms = formsByEnding[selectedEnding]
    if (selectedForms.length > 0) {
      const idx = Math.floor(Math.random() * selectedForms.length)
      return selectedForms[idx]
    }

    // Fallback: random from all forms
    const idx = Math.floor(Math.random() * forms.length)
    return forms[idx]
  }

  /**
   * Select form with C2 conmutacion (person variety)
   */
  selectWithC2Conmutacion(forms) {
    if (forms.length === 0) return null

    try {
      // Get persons allowed by region and filter sequence
      const allowedPersons = this.getAllowedPersonsByRegion()
      const rawSeq = Array.isArray(this.config.conmutacionSeq) && this.config.conmutacionSeq.length > 0
        ? this.config.conmutacionSeq
        : ['2s_vos', '3p', '3s']

      const effectiveSeq = rawSeq.filter(p => allowedPersons.has(p))
      const seq = effectiveSeq.length > 0 ? effectiveSeq : [...allowedPersons]

      // Choose safe index
      const currentIdx = Number.isInteger(this.config.conmutacionIdx) ? this.config.conmutacionIdx : 0

      // Find first person from sequence that has candidates in the pool
      let usedIdx = currentIdx % seq.length
      let targetPerson = seq[usedIdx]
      let candidatesForTarget = forms.filter(f => f.person === targetPerson)

      if (candidatesForTarget.length === 0) {
        // Advance circularly until finding an available person or completing full circle
        for (let step = 1; step < seq.length; step++) {
          const tryIdx = (currentIdx + step) % seq.length
          const tryPerson = seq[tryIdx]
          const tryCandidates = forms.filter(f => f.person === tryPerson)
          if (tryCandidates.length > 0) {
            usedIdx = tryIdx
            targetPerson = tryPerson
            candidatesForTarget = tryCandidates
            break
          }
        }
      }

      // Choose a base lemma that has the target person
      const baseCandidates = candidatesForTarget.length > 0 ? candidatesForTarget : forms
      const base = baseCandidates[Math.floor(Math.random() * baseCandidates.length)]

      // Soft boost: prioritize lemma+person target, maintain the rest
      const boosted = []
      forms.forEach(f => {
        let weight = 1
        if (f.lemma === base.lemma && f.person === targetPerson) weight = 3
        for (let i = 0; i < weight; i++) boosted.push(f)
      })

      // Advance index only one position from the actually used index
      const nextIdx = (usedIdx + 1) % seq.length
      // Note: This would need to update the global state, which should be handled by the caller

      // Select from boosted pool
      const idx = Math.floor(Math.random() * boosted.length)
      return boosted[idx]
    } catch (error) {
      // Fallback to simple random
      const idx = Math.floor(Math.random() * forms.length)
      return forms[idx]
    }
  }

  /**
   * Select form with person weighting
   */
  selectWithPersonWeighting(forms) {
    if (forms.length === 0) return null

    // Get all persons in candidates
    const personsInCandidates = [...new Set(forms.map(f => f.person))]

    // Group candidates by person
    const candidatesByPerson = {}
    personsInCandidates.forEach(person => {
      candidatesByPerson[person] = forms.filter(f => f.person === person)
    })

    // Get person weights for level
    const personWeights = getPersonWeightsForLevel({ level: this.config.level })
    const availablePersons = personsInCandidates

    // Apply rotation if enabled
    const weights = availablePersons.map(p => {
      let w = personWeights[p] || 1
      if (this.config.rotateSecondPerson && (p === '2s_tu' || p === '2s_vos')) {
        if (p === this.config.nextSecondPerson) w *= 1.5
        else w *= 0.75
      }
      return w
    })

    const totalW = weights.reduce((a, b) => a + b, 0) || 1
    let r = Math.random() * totalW
    let randomPerson = availablePersons[0]

    for (let i = 0; i < availablePersons.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        randomPerson = availablePersons[i]
        break
      }
    }

    // Select form from chosen person
    const formsForPerson = candidatesByPerson[randomPerson]

    // For participles with multiple forms (e.g. provisto/proveído), always choose the first (standard) one
    if (formsForPerson.length > 1 && formsForPerson[0].mood === 'nonfinite' && formsForPerson[0].tense === 'part') {
      return formsForPerson[0]
    }

    const idx = Math.floor(Math.random() * formsForPerson.length)
    return formsForPerson[idx]
  }

  /**
   * Get allowed persons by region
   */
  getAllowedPersonsByRegion() {
    if (this.config.region === 'rioplatense') {
      return new Set(['1s', '2s_vos', '3s', '1p', '3p'])
    } else if (this.config.region === 'la_general') {
      return new Set(['1s', '2s_tu', '3s', '1p', '3p'])
    } else if (this.config.region === 'peninsular') {
      return new Set(['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'])
    } else {
      return new Set(['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'])
    }
  }

  /**
   * Get selection statistics
   */
  getStats() {
    return {
      ...this.stats
    }
  }
}

/**
 * Apply weighted selection to balance regular vs irregular verbs
 * @param {Array} forms - Array of forms
 * @returns {Array} Weighted forms
 */
export function applyWeightedSelection(forms) {
  const regularForms = []
  const irregularForms = []

  forms.forEach(form => {
    const verb = VERB_LOOKUP_MAP.get(form.lemma)
    if (verb) {
      if (isIrregularInTense(verb, form.tense)) {
        irregularForms.push(form)
      } else {
        regularForms.push(form)
      }
    }
  })

  // Target distribution: 30% regular, 70% irregular
  const targetRegularRatio = 0.3
  const totalForms = forms.length
  const targetRegularCount = Math.floor(totalForms * targetRegularRatio)
  const targetIrregularCount = totalForms - targetRegularCount

  const selectedForms = []

  // Add regular forms (reduced frequency)
  if (regularForms.length > 0) {
    const regularSample = sampleArray(regularForms, Math.min(targetRegularCount, regularForms.length))
    selectedForms.push(...regularSample)
  }

  // Add irregular forms (increased frequency)
  if (irregularForms.length > 0) {
    const irregularSample = sampleArray(irregularForms, Math.min(targetIrregularCount, irregularForms.length))
    selectedForms.push(...irregularSample)
  }

  // If we don't have enough forms from one type, fill with the other
  if (selectedForms.length < totalForms) {
    const remainingForms = forms.filter(f => !selectedForms.includes(f))
    selectedForms.push(...sampleArray(remainingForms, totalForms - selectedForms.length))
  }

  return selectedForms
}

/**
 * Helper function to randomly sample from an array
 */
function sampleArray(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Factory function to create a selector with settings
 * @param {Object} settings - User settings object
 * @returns {FormSelector} Configured selector instance
 */
export function createFormSelector(settings) {
  const config = new SelectionConfig(settings)
  return new FormSelector(config)
}
