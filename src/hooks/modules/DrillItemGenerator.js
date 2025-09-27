/**
 * DrillItemGenerator.js - Item generation logic extracted from useDrillMode
 * 
 * This module handles the creation of drill items from selected forms:
 * - Canonical form resolution from dataset
 * - Complete verb information injection for irregularity system
 * - Dialect-specific setting auto-activation
 * - Debug logging for voseo/dialect compatibility
 * - Item structure standardization
 */

import { VERB_LOOKUP_MAP } from '../../lib/core/optimizedCache.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('DrillItemGenerator')

/**
 * Find canonical form from the available forms pool
 * @param {string} lemma - Verb lemma
 * @param {string} mood - Verb mood
 * @param {string} tense - Verb tense  
 * @param {string} person - Person/pronoun
 * @param {Array} formsPool - Available forms to search in
 * @returns {Object|null} - Canonical form or null if not found
 */
const findCanonicalForm = (lemma, mood, tense, person, formsPool) => {
  try {
    return formsPool.find(f => 
      f.lemma === lemma && 
      f.mood === mood && 
      f.tense === tense && 
      f.person === person
    ) || null
  } catch (error) {
    logger.warn('findCanonicalForm', 'Error finding canonical form', { lemma, mood, tense, person, error })
    return null
  }
}

/**
 * Generate form object with standardized structure
 * @param {Object} selectedForm - Form selected by generation algorithm
 * @param {Array} formsPool - Available forms pool for canonical resolution
 * @returns {Object} - Standardized form object
 */
const generateFormObject = (selectedForm, formsPool) => {
  const canonical = findCanonicalForm(
    selectedForm.lemma, 
    selectedForm.mood, 
    selectedForm.tense, 
    selectedForm.person, 
    formsPool
  )
  
  const base = canonical || selectedForm
  
  return {
    value: base.value || base.form,
    lemma: base.lemma,
    mood: base.mood,
    tense: base.tense,
    person: base.person,
    alt: base.alt || [],
    accepts: base.accepts || {}
  }
}

/**
 * Auto-activate dialect settings based on form person
 * @param {Object} baseSettings - Base user settings
 * @param {string} person - Person identifier from selected form
 * @returns {Object} - Settings with auto-activated dialect options
 */
const autoActivateDialectSettings = (baseSettings, person) => {
  return {
    ...baseSettings,
    useVoseo: baseSettings.useVoseo || person?.includes('vos') || person === '2s_vos',
    useTuteo: baseSettings.useTuteo || person?.includes('tu') || person === '2s_tu',
    useVosotros: baseSettings.useVosotros || person?.includes('vosotros') || person === '2p_vosotros'
  }
}

/**
 * Get complete verb information for irregularity system
 * @param {string} lemma - Verb lemma
 * @returns {Object} - Complete verb information
 */
const getVerbInformation = (lemma) => {
  const parentVerb = VERB_LOOKUP_MAP.get(lemma) || {}

  return {
    type: parentVerb.type || 'regular',
    irregularTenses: parentVerb.irregularTenses || [],
    irregularityMatrix: parentVerb.irregularityMatrix || {}
  }
}

/**
 * Generate a complete drill item from a selected form
 * @param {Object} selectedForm - Form selected by generation algorithm
 * @param {Object} settings - User settings
 * @param {Array} formsPool - Available forms pool for canonical resolution
 * @returns {Object} - Complete drill item
 */
export const generateDrillItem = (selectedForm, settings, formsPool = []) => {
  if (!selectedForm || !selectedForm.mood || !selectedForm.tense) {
    logger.error('generateDrillItem', 'Invalid selected form provided', { selectedForm })
    return null
  }
  
  logger.debug('generateDrillItem', 'Generating drill item', {
    lemma: selectedForm.lemma,
    mood: selectedForm.mood,
    tense: selectedForm.tense,
    person: selectedForm.person
  })
  
  // Get complete verb information
  const verbInfo = getVerbInformation(selectedForm.lemma)
  
  // Generate form object with canonical resolution
  const formObject = generateFormObject(selectedForm, formsPool)
  
  // Auto-activate dialect settings
  const enhancedSettings = autoActivateDialectSettings(settings, selectedForm.person)
  
  // Create complete drill item
  const drillItem = {
    id: Date.now(), // Unique identifier to force re-render
    lemma: selectedForm.lemma,
    mood: selectedForm.mood,
    tense: selectedForm.tense,
    person: selectedForm.person,
    
    // Irregularity system information
    type: verbInfo.type,
    irregularTenses: verbInfo.irregularTenses,
    irregularityMatrix: verbInfo.irregularityMatrix,
    
    // Standardized form object
    form: formObject,
    
    // Enhanced settings with dialect auto-activation
    settings: enhancedSettings
  }
  
  // Debug logging for voseo compatibility
  if (shouldLogVoseoDebug(enhancedSettings, selectedForm)) {
    logVoseoDebugInfo(selectedForm, settings, drillItem.form)
  }
  
  logger.debug('generateDrillItem', 'Drill item generated successfully', {
    id: drillItem.id,
    lemma: drillItem.lemma,
    mood: drillItem.mood,
    tense: drillItem.tense,
    person: drillItem.person,
    verbType: drillItem.type
  })
  
  return drillItem
}

/**
 * Check if voseo debug logging should be performed
 * @param {Object} settings - Enhanced settings
 * @param {Object} selectedForm - Selected form
 * @returns {boolean} - Whether to log voseo debug info
 */
const shouldLogVoseoDebug = (settings, selectedForm) => {
  return settings.useVoseo || 
         selectedForm.person?.includes('vos') || 
         (selectedForm.accepts && selectedForm.accepts.vos)
}

/**
 * Log voseo debug information
 * @param {Object} selectedForm - Selected form
 * @param {Object} originalSettings - Original settings before enhancement
 * @param {Object} generatedForm - Generated form object
 */
const logVoseoDebugInfo = (selectedForm, originalSettings, generatedForm) => {
  logger.debug('logVoseoDebugInfo', 'VOSEO DEBUG - Item generation', {
    nextFormFromGenerator: selectedForm,
    originalSettings: originalSettings,
    generatedItemForm: generatedForm,
    useVoseoSetting: originalSettings.useVoseo,
    person: selectedForm.person,
    accepts: selectedForm.accepts
  })
}

/**
 * Generate multiple drill items in batch
 * @param {Array} selectedForms - Array of selected forms
 * @param {Object} settings - User settings
 * @param {Array} formsPool - Available forms pool
 * @returns {Array} - Array of generated drill items
 */
export const generateDrillItemBatch = (selectedForms, settings, formsPool = []) => {
  if (!Array.isArray(selectedForms)) {
    logger.error('generateDrillItemBatch', 'Invalid selectedForms array provided')
    return []
  }
  
  logger.debug('generateDrillItemBatch', 'Generating batch of drill items', {
    count: selectedForms.length
  })
  
  const items = selectedForms
    .map(form => generateDrillItem(form, settings, formsPool))
    .filter(Boolean) // Remove any null items
  
  logger.debug('generateDrillItemBatch', 'Batch generation completed', {
    requested: selectedForms.length,
    generated: items.length,
    failed: selectedForms.length - items.length
  })
  
  return items
}

/**
 * Enhance existing drill item with additional information
 * @param {Object} existingItem - Existing drill item
 * @param {Object} enhancements - Additional data to merge
 * @returns {Object} - Enhanced drill item
 */
export const enhanceDrillItem = (existingItem, enhancements = {}) => {
  if (!existingItem) {
    logger.error('enhanceDrillItem', 'No existing item provided')
    return null
  }
  
  logger.debug('enhanceDrillItem', 'Enhancing existing drill item', {
    itemId: existingItem.id,
    enhancements: Object.keys(enhancements)
  })
  
  return {
    ...existingItem,
    ...enhancements,
    // Preserve critical properties
    id: existingItem.id,
    lemma: existingItem.lemma,
    mood: existingItem.mood,
    tense: existingItem.tense,
    person: existingItem.person,
    form: existingItem.form
  }
}

/**
 * Validate drill item structure
 * @param {Object} item - Drill item to validate
 * @returns {Object} - Validation result
 */
export const validateDrillItemStructure = (item) => {
  if (!item) {
    return { valid: false, errors: ['ITEM_NULL'] }
  }
  
  const errors = []
  const requiredFields = ['id', 'lemma', 'mood', 'tense', 'person', 'form', 'settings']
  
  for (const field of requiredFields) {
    if (!(field in item)) {
      errors.push(`MISSING_${field.toUpperCase()}`)
    }
  }
  
  // Validate form structure
  if (item.form) {
    const requiredFormFields = ['value', 'lemma', 'mood', 'tense', 'person']
    for (const field of requiredFormFields) {
      if (!(field in item.form)) {
        errors.push(`MISSING_FORM_${field.toUpperCase()}`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    item: {
      id: item.id,
      lemma: item.lemma,
      mood: item.mood,
      tense: item.tense,
      person: item.person,
      hasForm: !!item.form,
      hasSettings: !!item.settings
    }
  }
}

/**
 * Create fallback drill item when generation fails
 * @param {Object} fallbackData - Minimal data for fallback item
 * @param {Object} settings - User settings
 * @returns {Object} - Fallback drill item
 */
export const createFallbackDrillItem = (fallbackData, settings) => {
  logger.warn('createFallbackDrillItem', 'Creating fallback drill item')
  
  return {
    id: Date.now(),
    lemma: fallbackData.lemma || 'ser',
    mood: fallbackData.mood || 'ind',
    tense: fallbackData.tense || 'pres',
    person: fallbackData.person || '1s',
    type: 'irregular',
    irregularTenses: [],
    irregularityMatrix: {},
    form: {
      value: fallbackData.value || 'soy',
      lemma: fallbackData.lemma || 'ser',
      mood: fallbackData.mood || 'ind',
      tense: fallbackData.tense || 'pres',
      person: fallbackData.person || '1s',
      alt: [],
      accepts: {}
    },
    settings: settings || {},
    isFallback: true
  }
}
