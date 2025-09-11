/**
 * DoubleModeManager.js - Double mode complexity logic extracted from useDrillMode
 * 
 * This module handles the complex logic for double mode (practicing two forms simultaneously):
 * - Level-aware form filtering for double mode
 * - Verb selection with variety preferences
 * - Combination selection and pairing logic
 * - Form identity collision avoidance
 * - Emergency fallback for double mode failures
 * - Exclusion logic to prevent repetition
 */

import { shouldFilterVerbByLevel, getVerbSelectionWeight } from '../../lib/core/levelVerbFiltering.js'
import { categorizeVerb } from '../../lib/data/irregularFamilies.js'
import { allowsPerson } from './DrillFormFilters.js'
import { generateDrillItem } from './DrillItemGenerator.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('DoubleModeManager')

/**
 * Weighted random selection for verb prioritization
 * @param {Array} items - Items to select from
 * @param {Array} weights - Weight for each item
 * @returns {*} - Selected item
 */
const weightedRandomSelection = (items, weights) => {
  // Robust input validation
  if (!Array.isArray(items) || !Array.isArray(weights)) {
    console.warn('weightedRandomSelection: items and weights must be arrays')
    return null
  }
  
  if (items.length === 0) {
    return null
  }
  
  if (weights.length === 0) {
    // If no weights provided, use uniform random selection
    return items[Math.floor(Math.random() * items.length)]
  }
  
  if (items.length !== weights.length) {
    console.warn(`weightedRandomSelection: items length (${items.length}) must match weights length (${weights.length})`)
    return null
  }
  
  // Validate that all weights are valid numbers
  const validWeights = weights.map(w => {
    const num = Number(w)
    return isNaN(num) || num < 0 ? 0 : num
  })
  
  const totalWeight = validWeights.reduce((sum, weight) => sum + weight, 0)
  
  // If total weight is 0, all weights are invalid/zero - use uniform selection
  if (totalWeight === 0) {
    return items[Math.floor(Math.random() * items.length)]
  }
  
  let randomValue = Math.random() * totalWeight
  
  for (let i = 0; i < items.length; i++) {
    randomValue -= validWeights[i]
    if (randomValue <= 0) {
      return items[i]
    }
  }
  
  // Fallback to last item (should rarely happen due to floating point precision)
  return items[items.length - 1]
}

/**
 * Filter forms for double mode based on level and settings
 * @param {Array} allFormsForRegion - All available forms for the region
 * @param {Object} settings - User settings
 * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
 * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
 * @returns {Array} - Filtered forms suitable for double mode
 */
const filterFormsForDoubleMode = (allFormsForRegion, settings, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
  const level = settings.level || 'B1'
  
  return allFormsForRegion.filter(f => {
    // Check mood and tense eligibility for level
    const allowedMoods = getAvailableMoodsForLevel(level)
    const allowedTenses = getAvailableTensesForLevelAndMood(level, f.mood)
    const moodTenseOK = allowedMoods.includes(f.mood) && allowedTenses.includes(f.tense)
    
    if (!moodTenseOK) return false
    
    // Apply person/pronoun filtering
    if (!allowsPerson(f.person, settings)) {
      return false
    }
    
    // Apply verb level filtering
    const verbFamilies = categorizeVerb(f.lemma)
    if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
      logger.debug('filterFormsForDoubleMode', `Filtering verb ${f.lemma} for level ${level}`)
      return false
    }
    
    // Apply verb type filtering if specified
    if (settings.verbType && settings.verbType !== 'all') {
      if (settings.verbType === 'regular') {
        return verbFamilies.length === 0
      } else if (settings.verbType === 'irregular') {
        return verbFamilies.length > 0
      }
    }
    
    return true
  })
}

/**
 * Group forms by verb and calculate unique mood/tense combinations
 * @param {Array} levelForms - Forms filtered for the level
 * @returns {Array} - Array of verb objects with forms and combo counts
 */
const groupFormsByVerb = (levelForms) => {
  const verbGroups = new Map()
  
  // Group forms by verb
  for (const form of levelForms) {
    if (!verbGroups.has(form.lemma)) {
      verbGroups.set(form.lemma, [])
    }
    verbGroups.get(form.lemma).push(form)
  }
  
  // Calculate unique combinations for each verb
  const verbsWithCombos = []
  for (const [lemma, forms] of verbGroups) {
    const uniqueCombos = new Set()
    for (const form of forms) {
      uniqueCombos.add(`${form.mood}|${form.tense}`)
    }
    
    // Only include verbs with at least 2 different combinations
    if (uniqueCombos.size >= 2) {
      verbsWithCombos.push({
        lemma,
        forms,
        uniqueCombos: uniqueCombos.size
      })
    }
  }
  
  return verbsWithCombos
}

/**
 * Filter verbs excluding the current item's verb if applicable
 * @param {Array} validVerbs - Valid verbs for double mode
 * @param {Object} itemToExclude - Item to exclude (if any)
 * @returns {Array} - Filtered verbs
 */
const filterVerbsExcludingCurrent = (validVerbs, itemToExclude) => {
  if (!itemToExclude || !itemToExclude.lemma) {
    return validVerbs
  }
  
  const filtered = validVerbs.filter(v => v.lemma !== itemToExclude.lemma)
  
  logger.debug('filterVerbsExcludingCurrent', `After excluding ${itemToExclude.lemma}`, {
    original: validVerbs.length,
    filtered: filtered.length
  })
  
  // If we excluded all verbs, use the original list
  if (filtered.length === 0) {
    logger.warn('filterVerbsExcludingCurrent', 'No verbs left after exclusion, using original list')
    return validVerbs
  }
  
  return filtered
}

/**
 * Create combinations map for a verb
 * @param {Array} verbForms - Forms for the specific verb
 * @returns {Map} - Map of mood|tense combinations to form arrays
 */
const createCombinationsMap = (verbForms) => {
  const uniqueCombos = new Map()
  
  for (const form of verbForms) {
    const key = `${form.mood}|${form.tense}`
    if (!uniqueCombos.has(key)) {
      uniqueCombos.set(key, [])
    }
    uniqueCombos.get(key).push(form)
  }
  
  return uniqueCombos
}

/**
 * Filter combinations excluding current item's combinations
 * @param {Array} comboKeys - Available combination keys
 * @param {Object} itemToExclude - Item to exclude (if any)
 * @param {string} selectedVerbLemma - Lemma of selected verb
 * @returns {Array} - Filtered combination keys
 */
const filterCombinationsExcludingCurrent = (comboKeys, itemToExclude, selectedVerbLemma) => {
  if (!itemToExclude || itemToExclude.lemma !== selectedVerbLemma) {
    return comboKeys
  }
  
  const excludedFirstCombo = `${itemToExclude.mood}|${itemToExclude.tense}`
  const excludedSecondCombo = itemToExclude.secondForm 
    ? `${itemToExclude.secondForm.mood}|${itemToExclude.secondForm.tense}` 
    : null
  
  const filtered = comboKeys.filter(combo => 
    combo !== excludedFirstCombo && combo !== excludedSecondCombo
  )
  
  logger.debug('filterCombinationsExcludingCurrent', 'After excluding combinations', {
    excluded: [excludedFirstCombo, excludedSecondCombo].filter(Boolean),
    original: comboKeys.length,
    filtered: filtered.length
  })
  
  // If we don't have enough combinations after exclusion, use all
  if (filtered.length < 2) {
    logger.warn('filterCombinationsExcludingCurrent', 'Not enough combinations after exclusion, using all')
    return comboKeys
  }
  
  return filtered
}

/**
 * Select two forms ensuring they're not identical in value
 * @param {Array} firstForms - Forms from first combination
 * @param {Array} secondForms - Forms from second combination
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Object|null} - Object with firstForm and secondForm, or null if failed
 */
const selectNonIdenticalForms = (firstForms, secondForms, maxAttempts = 5) => {
  if (!firstForms.length || !secondForms.length) return null
  
  let firstForm = firstForms[Math.floor(Math.random() * firstForms.length)]
  let secondForm = secondForms[Math.floor(Math.random() * secondForms.length)]
  let attempts = 0
  
  // Ensure forms are not identical in value
  while (
    firstForm && secondForm &&
    (firstForm.value || firstForm.form) === (secondForm.value || secondForm.form) &&
    attempts < maxAttempts
  ) {
    logger.debug('selectNonIdenticalForms', 'Forms were identical, re-selecting second form', {
      attempt: attempts + 1,
      firstValue: firstForm.value || firstForm.form,
      secondValue: secondForm.value || secondForm.form
    })
    secondForm = secondForms[Math.floor(Math.random() * secondForms.length)]
    attempts++
  }
  
  // Final verification
  if (firstForm.lemma === secondForm.lemma && 
      (firstForm.mood !== secondForm.mood || firstForm.tense !== secondForm.tense)) {
    return { firstForm, secondForm }
  }
  
  return null
}

/**
 * Generate double mode drill item
 * @param {Object} settings - User settings
 * @param {Object} itemToExclude - Previous item to exclude
 * @param {Array} allFormsForRegion - All available forms
 * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
 * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
 * @param {Function} setCurrentItem - Function to set the current item
 * @returns {Object|null} - Generated double mode item or null if failed
 */
export const generateDoubleModeItem = async (
  settings, 
  itemToExclude, 
  allFormsForRegion, 
  getAvailableMoodsForLevel, 
  getAvailableTensesForLevelAndMood,
  setCurrentItem
) => {
  logger.info('generateDoubleModeItem', 'Starting double form generation', {
    excludedItem: itemToExclude ? `${itemToExclude.lemma} (${itemToExclude.mood}/${itemToExclude.tense}-${itemToExclude.person})` : 'none',
    level: settings.level
  })
  
  try {
    const level = settings.level || 'B1'
    
    // 1. Filter forms for double mode
    const levelForms = filterFormsForDoubleMode(
      allFormsForRegion, 
      settings, 
      getAvailableMoodsForLevel, 
      getAvailableTensesForLevelAndMood
    )
    
    logger.debug('generateDoubleModeItem', 'Forms filtered for double mode', {
      total: allFormsForRegion.length,
      filtered: levelForms.length
    })
    
    // 2. Group forms by verb and calculate combinations
    const validVerbs = groupFormsByVerb(levelForms)
    
    if (validVerbs.length === 0) {
      logger.warn('generateDoubleModeItem', 'No valid verbs found for double mode')
      return null
    }
    
    logger.debug('generateDoubleModeItem', 'Valid verbs found', {
      count: validVerbs.length,
      examples: validVerbs.slice(0, 5).map(v => `${v.lemma}(${v.uniqueCombos})`)
    })
    
    // 3. Sort by number of combinations and filter exclusions
    validVerbs.sort((a, b) => b.uniqueCombos - a.uniqueCombos)
    const availableVerbs = filterVerbsExcludingCurrent(validVerbs, itemToExclude)
    
    if (availableVerbs.length < 3) {
      logger.debug('generateDoubleModeItem', `Limited verbs available (${availableVerbs.length}), person variation will provide additional variety`)
    }
    
    // 4. Select verb using weighted selection
    const verbWeights = availableVerbs.map(v => getVerbSelectionWeight(v.lemma, level))
    const selectedVerb = weightedRandomSelection(availableVerbs, verbWeights)
    
    if (!selectedVerb) {
      logger.error('generateDoubleModeItem', 'Failed to select verb')
      return null
    }
    
    logger.debug('generateDoubleModeItem', 'Verb selected', {
      lemma: selectedVerb.lemma,
      combinations: selectedVerb.uniqueCombos
    })
    
    // 5. Create combinations map and select two different combinations
    const uniqueCombos = createCombinationsMap(selectedVerb.forms)
    const comboKeys = Array.from(uniqueCombos.keys())
    
    logger.debug('generateDoubleModeItem', 'Available combinations', {
      verb: selectedVerb.lemma,
      combinations: comboKeys
    })
    
    if (comboKeys.length < 2) {
      logger.warn('generateDoubleModeItem', 'Not enough combinations available')
      return null
    }
    
    // Filter combinations to exclude current item's combinations
    const availableCombos = filterCombinationsExcludingCurrent(comboKeys, itemToExclude, selectedVerb.lemma)
    
    // Shuffle combinations
    for (let i = availableCombos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availableCombos[i], availableCombos[j]] = [availableCombos[j], availableCombos[i]]
    }
    
    // Select two different combinations
    const firstCombo = availableCombos[0]
    const secondCombo = availableCombos[1]
    
    logger.debug('generateDoubleModeItem', 'Selected combinations', {
      first: firstCombo,
      second: secondCombo
    })
    
    // 6. Get forms from each combination and select non-identical forms
    const firstForms = uniqueCombos.get(firstCombo)
    const secondForms = uniqueCombos.get(secondCombo)
    
    if (!firstForms || !secondForms) {
      logger.error('generateDoubleModeItem', 'Failed to get forms for combinations')
      return null
    }
    
    logger.debug('generateDoubleModeItem', 'Forms available', {
      first: firstForms.length,
      second: secondForms.length
    })
    
    const selectedForms = selectNonIdenticalForms(firstForms, secondForms)
    
    if (!selectedForms) {
      logger.warn('generateDoubleModeItem', 'Failed to select non-identical forms')
      return null
    }
    
    const { firstForm, secondForm } = selectedForms
    
    logger.debug('generateDoubleModeItem', 'Selected forms', {
      first: `${firstForm.lemma} ${firstForm.mood}/${firstForm.tense}-${firstForm.person} = "${firstForm.value || firstForm.form}"`,
      second: `${secondForm.lemma} ${secondForm.mood}/${secondForm.tense}-${secondForm.person} = "${secondForm.value || secondForm.form}"`
    })
    
    // 7. Generate double mode drill item
    const drillItem = generateDrillItem(firstForm, settings, allFormsForRegion)
    
    if (!drillItem) {
      logger.error('generateDoubleModeItem', 'Failed to generate base drill item')
      return null
    }
    
    // Add second form to the drill item
    drillItem.secondForm = {
      value: secondForm.value || secondForm.form,
      lemma: secondForm.lemma,
      mood: secondForm.mood,
      tense: secondForm.tense,
      person: secondForm.person,
      alt: secondForm.alt || [],
      accepts: secondForm.accepts || {}
    }
    
    // Mark as double mode item
    drillItem.isDoubleMode = true
    
    logger.info('generateDoubleModeItem', 'Double mode item generated successfully', {
      main: `${drillItem.lemma} ${drillItem.mood}/${drillItem.tense}-${drillItem.person} = "${drillItem.form?.value}"`,
      second: `${drillItem.secondForm.lemma} ${drillItem.secondForm.mood}/${drillItem.secondForm.tense}-${drillItem.secondForm.person} = "${drillItem.secondForm.value}"`
    })
    
    // Set the current item and return
    setCurrentItem(drillItem)
    return drillItem
    
  } catch (error) {
    logger.error('generateDoubleModeItem', 'Error during double mode generation', error)
    return null
  }
}

/**
 * Check if double mode is viable for current settings
 * @param {Array} allFormsForRegion - All available forms
 * @param {Object} settings - User settings
 * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
 * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
 * @returns {boolean} - Whether double mode is viable
 */
export const isDoubleModeViable = (allFormsForRegion, settings, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
  const levelForms = filterFormsForDoubleMode(
    allFormsForRegion, 
    settings, 
    getAvailableMoodsForLevel, 
    getAvailableTensesForLevelAndMood
  )
  
  const validVerbs = groupFormsByVerb(levelForms)
  
  logger.debug('isDoubleModeViable', 'Double mode viability check', {
    levelForms: levelForms.length,
    validVerbs: validVerbs.length,
    viable: validVerbs.length > 0
  })
  
  return validVerbs.length > 0
}

/**
 * Get double mode statistics for debugging
 * @param {Array} allFormsForRegion - All available forms
 * @param {Object} settings - User settings
 * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
 * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
 * @returns {Object} - Double mode statistics
 */
export const getDoubleModeStats = (allFormsForRegion, settings, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
  const levelForms = filterFormsForDoubleMode(
    allFormsForRegion, 
    settings, 
    getAvailableMoodsForLevel, 
    getAvailableTensesForLevelAndMood
  )
  
  const validVerbs = groupFormsByVerb(levelForms)
  
  return {
    totalForms: allFormsForRegion.length,
    levelFilteredForms: levelForms.length,
    validVerbsCount: validVerbs.length,
    averageCombinationsPerVerb: validVerbs.length > 0 
      ? Math.round(validVerbs.reduce((sum, v) => sum + v.uniqueCombos, 0) / validVerbs.length * 10) / 10
      : 0,
    topVerbs: validVerbs
      .sort((a, b) => b.uniqueCombos - a.uniqueCombos)
      .slice(0, 5)
      .map(v => ({ lemma: v.lemma, combinations: v.uniqueCombos }))
  }
}