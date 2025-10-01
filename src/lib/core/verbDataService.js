// Enhanced verb data service with comprehensive fallback layers and error handling
// Integrates with redundancy, integrity, and auto-recovery systems
// PERFORMANCE: Now uses lazy loading to eliminate 4.1MB initial bundle

import { getVerbs, getVerbsSync, areVerbsLoaded } from '../../data/verbsLazy.js'
import { buildNonfiniteFormsForLemma } from './nonfiniteBuilder.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'
import { getAllVerbsWithRedundancy, getRedundancyManager } from './VerbDataRedundancyManager.js'
import { validateAndHealVerbs, getIntegrityGuard } from './DataIntegrityGuard.js'
import { handleErrorWithRecovery } from './AutoRecoverySystem.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('VerbDataService')

// Synchronous version for backward compatibility (returns cached verbs or empty array)
export function getAllVerbsSync() {
  try {
    // Try redundancy manager first
    try {
      const redundantVerbs = getAllVerbsWithRedundancy()
      if (redundantVerbs && Array.isArray(redundantVerbs) && redundantVerbs.length > 0) {
        return redundantVerbs
      }
    } catch (redundancyError) {
      logger.warn('getAllVerbsSync', 'Redundancy manager failed, trying sync cache', redundancyError)
    }

    // Try sync cache
    const syncVerbs = getVerbsSync()
    if (syncVerbs && Array.isArray(syncVerbs) && syncVerbs.length > 0) {
      return syncVerbs
    }

    // Return empty array if nothing loaded yet
    logger.warn('getAllVerbsSync', 'No verbs cached yet, consider using getAllVerbs() async version')
    return []
  } catch (error) {
    logger.error('getAllVerbsSync', 'Failed to get verbs synchronously', error)
    return []
  }
}

// Enhanced get all verbs with comprehensive fallback layers - ASYNC VERSION
export async function getAllVerbs() {
  try {
    // Layer 1: Try redundancy manager first (most reliable)
    try {
      const redundantVerbs = getAllVerbsWithRedundancy()
      if (redundantVerbs && Array.isArray(redundantVerbs) && redundantVerbs.length > 0) {
        logger.debug('getAllVerbs', `Retrieved ${redundantVerbs.length} verbs from redundancy manager`)
        return redundantVerbs
      }
    } catch (redundancyError) {
      logger.warn('getAllVerbs', 'Redundancy manager failed, trying lazy loading', redundancyError)
    }

    // Layer 2: Lazy loading fallback
    try {
      const lazyVerbs = await getVerbs()
      if (lazyVerbs && Array.isArray(lazyVerbs) && lazyVerbs.length > 0) {
        logger.debug('getAllVerbs', `Retrieved ${lazyVerbs.length} verbs from lazy loading`)
        return lazyVerbs
      }
    } catch (lazyError) {
      logger.warn('getAllVerbs', 'Lazy loading failed, trying sync fallback', lazyError)
    }

    // Layer 3: Sync fallback if already loaded
    const syncVerbs = getVerbsSync()
    if (syncVerbs && Array.isArray(syncVerbs) && syncVerbs.length > 0) {
      logger.debug('getAllVerbs', `Retrieved ${syncVerbs.length} verbs from sync cache`)
      return syncVerbs
    }

    // Layer 3: Emergency fallback through redundancy manager
    try {
      const manager = getRedundancyManager()
      const emergencyVerbs = manager.getAllVerbs()
      if (emergencyVerbs && Array.isArray(emergencyVerbs) && emergencyVerbs.length > 0) {
        logger.warn('getAllVerbs', `Using emergency verbs: ${emergencyVerbs.length} available`)
        return emergencyVerbs
      }
    } catch (emergencyError) {
      logger.error('getAllVerbs', 'Emergency fallback also failed', emergencyError)
    }

    // Layer 4: Absolute emergency - minimal hardcoded verbs
    const emergencySet = [
      {
        lemma: 'ser',
        type: 'irregular',
        paradigms: [{
          regionTags: ['la_general'],
          forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }]
        }]
      },
      {
        lemma: 'estar',
        type: 'irregular',
        paradigms: [{
          regionTags: ['la_general'],
          forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'estoy' }]
        }]
      }
    ]

    logger.error('getAllVerbs', 'ALL FALLBACKS FAILED - Using minimal emergency set')

    // Trigger recovery system
    handleErrorWithRecovery(new Error('Complete verb data failure'), {
      component: 'verbDataService',
      function: 'getAllVerbs',
      severity: 'critical'
    })

    return emergencySet

  } catch (criticalError) {
    logger.error('getAllVerbs', 'CRITICAL: Even emergency set failed', criticalError)

    // Trigger recovery system with critical error
    handleErrorWithRecovery(criticalError, {
      component: 'verbDataService',
      function: 'getAllVerbs',
      severity: 'catastrophic'
    })

    // Return absolutely minimal set to prevent complete failure
    return [{
      lemma: 'ser',
      type: 'irregular',
      paradigms: [{
        regionTags: ['la_general'],
        forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }]
      }]
    }]
  }
}

// Enhanced get single verb by lemma with comprehensive fallback
export async function getVerbByLemma(lemma) {
  if (!lemma || typeof lemma !== 'string') {
    logger.warn('getVerbByLemma', 'Invalid lemma provided', { lemma })
    return null
  }

  try {
    // Layer 1: Try from current verb set (most efficient)
    const allVerbs = await getAllVerbs()
    const verb = allVerbs.find(v => v.lemma === lemma)

    if (verb) {
      // Validate verb integrity before returning
      try {
        const integrityGuard = getIntegrityGuard()
        const validationResult = integrityGuard.validateVerb(verb)

        if (validationResult.valid) {
          logger.debug('getVerbByLemma', `Found valid verb: ${lemma}`)
          return verb
        } else {
          logger.warn('getVerbByLemma', `Verb ${lemma} failed validation, attempting healing`, {
            errors: validationResult.errors
          })

          // Attempt healing
          const healingResult = integrityGuard.healVerb(verb, validationResult)
          if (healingResult.healed) {
            logger.info('getVerbByLemma', `Successfully healed verb: ${lemma}`)
            return verb
          } else {
            logger.error('getVerbByLemma', `Failed to heal verb: ${lemma}`, healingResult)
          }
        }
      } catch (validationError) {
        logger.warn('getVerbByLemma', 'Validation failed, returning unvalidated verb', validationError)
        return verb
      }
    }

    // Layer 2: Try direct search in original dataset
    try {
      if (verbs && Array.isArray(verbs)) {
        const directVerb = verbs.find(v => v.lemma === lemma)
        if (directVerb) {
          logger.debug('getVerbByLemma', `Found verb in direct dataset: ${lemma}`)
          return directVerb
        }
      }
    } catch (directError) {
      logger.warn('getVerbByLemma', 'Direct dataset search failed', directError)
    }

    // Layer 3: Check if it's a common verb we must have
    const commonVerbs = ['ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver']
    if (commonVerbs.includes(lemma)) {
      logger.error('getVerbByLemma', `CRITICAL: Common verb ${lemma} not found in any dataset`)

      // Trigger recovery for missing common verb
      handleErrorWithRecovery(new Error(`Critical verb missing: ${lemma}`), {
        component: 'verbDataService',
        function: 'getVerbByLemma',
        lemma,
        severity: 'high'
      })

      // Return minimal form for critical verbs
      return this.createMinimalVerb(lemma)
    }

    logger.debug('getVerbByLemma', `Verb not found: ${lemma}`)
    return null

  } catch (error) {
    logger.error('getVerbByLemma', `Error getting verb ${lemma}`, error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getVerbByLemma',
      lemma,
      severity: 'medium'
    })

    return null
  }
}

// Create minimal verb structure for critical verbs
function createMinimalVerb(lemma) {
  const minimalForms = {
    'ser': [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'es' }
    ],
    'estar': [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'estoy' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'está' }
    ],
    'haber': [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'he' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'ha' }
    ],
    'tener': [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'tengo' },
      { mood: 'indicative', tense: 'pres', person: '3s', value: 'tiene' }
    ]
  }

  const forms = minimalForms[lemma] || [
    { mood: 'indicative', tense: 'pres', person: '1s', value: lemma + 'o' }
  ]

  return {
    lemma,
    type: 'irregular',
    paradigms: [{
      regionTags: ['la_general'],
      forms
    }]
  }
}

// Enhanced get multiple verbs by lemmas with comprehensive error handling
export async function getVerbsByLemmas(lemmas) {
  if (!Array.isArray(lemmas)) {
    logger.warn('getVerbsByLemmas', 'Invalid lemmas parameter - not an array', { lemmas })
    return []
  }

  if (lemmas.length === 0) {
    return []
  }

  try {
    const results = []
    const notFound = []

    // Get all verbs once
    const allVerbs = await getAllVerbs()
    const lemmaSet = new Set(lemmas)

    // Filter efficiently
    const foundVerbs = allVerbs.filter(verb => {
      if (lemmaSet.has(verb.lemma)) {
        results.push(verb)
        return true
      }
      return false
    })

    // Check for missing lemmas
    const foundLemmas = new Set(results.map(v => v.lemma))
    for (const lemma of lemmas) {
      if (!foundLemmas.has(lemma)) {
        notFound.push(lemma)
      }
    }

    // Handle missing verbs
    if (notFound.length > 0) {
      logger.warn('getVerbsByLemmas', `Missing verbs: ${notFound.join(', ')}`, {
        requested: lemmas.length,
        found: results.length,
        missing: notFound
      })

      // Try to get missing verbs individually with fallbacks
      for (const missingLemma of notFound) {
        const verb = await getVerbByLemma(missingLemma)
        if (verb) {
          results.push(verb)
        }
      }
    }

    // Validate results if integrity guard is available
    try {
      const integrityGuard = getIntegrityGuard()
      if (results.length > 0) {
        const validationResult = integrityGuard.validateVerbs(results)

        if (!validationResult.valid && validationResult.summary.invalid > 0) {
          logger.warn('getVerbsByLemmas', `Found ${validationResult.summary.invalid} invalid verbs`, {
            totalVerbs: results.length,
            invalidCount: validationResult.summary.invalid
          })

          // Attempt healing if there are healable errors
          if (validationResult.summary.healable > 0) {
            const healingResult = integrityGuard.validateAndHealVerbs(results)
            if (healingResult.healingPerformed && healingResult.totalHealed > 0) {
              logger.info('getVerbsByLemmas', `Healed ${healingResult.totalHealed} verbs`)
            }
          }
        }
      }
    } catch (validationError) {
      logger.warn('getVerbsByLemmas', 'Validation failed for verb set', validationError)
    }

    logger.debug('getVerbsByLemmas', `Retrieved ${results.length}/${lemmas.length} requested verbs`)
    return results

  } catch (error) {
    logger.error('getVerbsByLemmas', 'Error retrieving verbs by lemmas', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getVerbsByLemmas',
      lemmasCount: lemmas.length,
      severity: 'medium'
    })

    // Return empty array to prevent crashes
    return []
  }
}

// Enhanced build forms for a specific region with comprehensive error handling
export async function getFormsForRegion(region, settings = {}) {
  if (!region || typeof region !== 'string') {
    logger.warn('getFormsForRegion', 'Invalid region parameter', { region })
    return []
  }

  try {
    const forms = []
    let processedVerbs = 0
    let formsGenerated = 0
    let errorCount = 0

    // Get verbs with fallback protection
    const allVerbs = await getAllVerbs()

    if (!allVerbs || allVerbs.length === 0) {
      logger.error('getFormsForRegion', 'No verbs available for form generation')

      // Trigger recovery
      handleErrorWithRecovery(new Error('No verbs available for form generation'), {
        component: 'verbDataService',
        function: 'getFormsForRegion',
        region,
        severity: 'critical'
      })

      return []
    }

    for (const verb of allVerbs) {
      try {
        if (!verb?.paradigms) {
          errorCount++
          continue
        }

        for (const paradigm of verb.paradigms) {
          try {
            // Check if paradigm matches region
            if (!paradigm.regionTags?.includes(region)) continue
            if (!paradigm.forms) continue

            for (const form of paradigm.forms) {
              try {
                const enrichedForm = {
                  ...form,
                  lemma: verb.lemma,
                  id: `${verb.lemma}|${form.mood}|${form.tense}|${form.person || ''}`,
                  type: verb.type || 'regular',
                  verbType: verb.type || 'regular'
                }
                forms.push(enrichedForm)
                formsGenerated++
              } catch (formError) {
                logger.warn('getFormsForRegion', `Error processing form for verb ${verb.lemma}`, formError)
                errorCount++
              }
            }
          } catch (paradigmError) {
            logger.warn('getFormsForRegion', `Error processing paradigm for verb ${verb.lemma}`, paradigmError)
            errorCount++
          }
        }

        processedVerbs++

      } catch (verbError) {
        logger.warn('getFormsForRegion', `Error processing verb ${verb?.lemma || 'unknown'}`, verbError)
        errorCount++
      }
    }

    // Log processing statistics
    logger.debug('getFormsForRegion', `Form generation completed for region: ${region}`, {
      totalVerbs: allVerbs.length,
      processedVerbs,
      formsGenerated,
      errorCount,
      successRate: `${((processedVerbs / allVerbs.length) * 100).toFixed(1)}%`
    })

    // Check if we have a reasonable number of forms
    if (forms.length === 0) {
      logger.error('getFormsForRegion', `No forms generated for region: ${region}`)

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No forms generated for region: ${region}`), {
        component: 'verbDataService',
        function: 'getFormsForRegion',
        region,
        verbCount: allVerbs.length,
        severity: 'high'
      })

      return []
    }

    // Check for unusually low form count (might indicate data issues)
    const expectedMinForms = Math.max(50, allVerbs.length * 5) // At least 5 forms per verb
    if (forms.length < expectedMinForms) {
      logger.warn('getFormsForRegion', `Unusually low form count for region: ${region}`, {
        formsGenerated: forms.length,
        expectedMin: expectedMinForms,
        verbCount: allVerbs.length
      })

      // This might indicate data corruption, but don't fail completely
      handleErrorWithRecovery(new Error(`Low form count: ${forms.length} forms for ${allVerbs.length} verbs`), {
        component: 'verbDataService',
        function: 'getFormsForRegion',
        region,
        formsGenerated: forms.length,
        expectedMin: expectedMinForms,
        severity: 'medium'
      })
    }

    // Validate form structure if integrity guard is available
    try {
      const integrityGuard = getIntegrityGuard()

      // Sample validation on subset for performance
      const sampleSize = Math.min(10, forms.length)
      const sampleForms = forms.slice(0, sampleSize).map(form => ({
        lemma: form.lemma,
        paradigms: [{ forms: [form] }]
      }))

      const validationResult = integrityGuard.validateVerbs(sampleForms)
      if (!validationResult.valid) {
        logger.warn('getFormsForRegion', `Form validation issues detected in region: ${region}`, {
          sampleSize,
          invalidForms: validationResult.summary.invalid
        })
      }
    } catch (validationError) {
      logger.warn('getFormsForRegion', 'Form validation failed', validationError)
    }

    return forms

  } catch (error) {
    logger.error('getFormsForRegion', `Critical error generating forms for region: ${region}`, error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getFormsForRegion',
      region,
      severity: 'critical'
    })

    // Return empty array to prevent crashes
    return []
  }
}

// Enhanced get example verbs for learning with comprehensive error handling
export function getExampleVerbs({ verbType = 'all', families = [], tense = null, region = 'la_general' } = {}) {
  try {
    // Get verbs with fallback protection
    let candidateVerbs = getAllVerbsSync()

    if (!candidateVerbs || candidateVerbs.length === 0) {
      logger.error('getExampleVerbs', 'No verbs available for example selection')

      // Trigger recovery
      handleErrorWithRecovery(new Error('No verbs available for example selection'), {
        component: 'verbDataService',
        function: 'getExampleVerbs',
        verbType,
        families,
        severity: 'high'
      })

      // Emergency fallback - return hardcoded examples
      const emergencyExamples = [
        { lemma: 'ser', type: 'irregular' },
        { lemma: 'estar', type: 'irregular' },
        { lemma: 'haber', type: 'irregular' },
        { lemma: 'tener', type: 'irregular' },
        { lemma: 'hacer', type: 'irregular' }
      ]

      logger.warn('getExampleVerbs', 'Using emergency fallback examples')
      return emergencyExamples
    }

    let filteredCount = candidateVerbs.length
    let errorCount = 0

    // Filter by verb type with error handling
    try {
      if (verbType === 'regular') {
        candidateVerbs = candidateVerbs.filter(verb => {
          try {
            return verb.type === 'regular' || !verb.type
          } catch (error) {
            errorCount++
            return false
          }
        })
      } else if (verbType === 'irregular') {
        candidateVerbs = candidateVerbs.filter(verb => {
          try {
            return verb.type === 'irregular'
          } catch (error) {
            errorCount++
            return false
          }
        })
      }

      filteredCount = candidateVerbs.length
    } catch (filterError) {
      logger.warn('getExampleVerbs', 'Error filtering by verb type', filterError)
      errorCount++
    }

    // Filter by families if specified with enhanced error handling
    if (families.length > 0) {
      try {
        candidateVerbs = candidateVerbs.filter(verb => {
          try {
            const verbFamilies = categorizeVerb(verb.lemma, verb)
            if (!verbFamilies || verbFamilies.length === 0) {
              return false
            }

            return families.some(selectedFamily => {
              try {
                const expandedFamilies = expandSimplifiedGroup(selectedFamily)
                if (expandedFamilies.length > 0) {
                  return verbFamilies.some(vf => expandedFamilies.includes(vf))
                } else {
                  return verbFamilies.includes(selectedFamily)
                }
              } catch (familyError) {
                logger.warn('getExampleVerbs', `Error processing family ${selectedFamily} for verb ${verb.lemma}`, familyError)
                errorCount++
                return false
              }
            })
          } catch (categorizationError) {
            logger.warn('getExampleVerbs', `Failed to categorize verb ${verb.lemma}`, categorizationError)
            errorCount++
            return false
          }
        })
      } catch (familyFilterError) {
        logger.warn('getExampleVerbs', 'Error filtering by families', familyFilterError)
        errorCount++
      }
    }

    // For learning purposes, prioritize common verbs
    const priorityVerbs = [
      'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
      'querer', 'poner', 'parecer', 'creer', 'seguir', 'venir', 'pensar', 'salir', 'volver',
      'conocer', 'vivir', 'sentir', 'empezar', 'hablar', 'comer'
    ]

    // Sort by priority with error handling
    try {
      candidateVerbs.sort((a, b) => {
        try {
          const aPriority = priorityVerbs.indexOf(a.lemma)
          const bPriority = priorityVerbs.indexOf(b.lemma)

          if (aPriority !== -1 && bPriority !== -1) {
            return aPriority - bPriority
          } else if (aPriority !== -1) {
            return -1
          } else if (bPriority !== -1) {
            return 1
          } else {
            return a.lemma.localeCompare(b.lemma)
          }
        } catch (sortError) {
          logger.warn('getExampleVerbs', `Error sorting verbs ${a?.lemma} vs ${b?.lemma}`, sortError)
          return 0
        }
      })
    } catch (sortError) {
      logger.warn('getExampleVerbs', 'Error sorting example verbs', sortError)
      errorCount++
    }

    const results = candidateVerbs.slice(0, 15)

    // Check if we have sufficient examples
    if (results.length === 0) {
      logger.error('getExampleVerbs', 'No example verbs found after filtering', {
        verbType,
        families,
        originalCount: filteredCount,
        errorCount
      })

      // Emergency fallback based on verb type
      let emergencyExamples = []
      if (verbType === 'regular') {
        emergencyExamples = [
          { lemma: 'hablar', type: 'regular' },
          { lemma: 'comer', type: 'regular' },
          { lemma: 'vivir', type: 'regular' }
        ]
      } else if (verbType === 'irregular') {
        emergencyExamples = [
          { lemma: 'ser', type: 'irregular' },
          { lemma: 'estar', type: 'irregular' },
          { lemma: 'tener', type: 'irregular' }
        ]
      } else {
        emergencyExamples = [
          { lemma: 'ser', type: 'irregular' },
          { lemma: 'hablar', type: 'regular' },
          { lemma: 'estar', type: 'irregular' }
        ]
      }

      logger.warn('getExampleVerbs', `Using emergency fallback examples for verbType: ${verbType}`)
      return emergencyExamples
    }

    // Log processing statistics
    logger.debug('getExampleVerbs', `Example selection completed`, {
      verbType,
      familyCount: families.length,
      originalCount: filteredCount,
      resultCount: results.length,
      errorCount,
      successRate: `${(((filteredCount - errorCount) / filteredCount) * 100).toFixed(1)}%`
    })

    return results

  } catch (error) {
    logger.error('getExampleVerbs', 'Critical error getting example verbs', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getExampleVerbs',
      verbType,
      families,
      severity: 'medium'
    })

    // Absolute emergency fallback
    const emergencyExamples = [
      { lemma: 'ser', type: 'irregular' },
      { lemma: 'estar', type: 'irregular' },
      { lemma: 'hablar', type: 'regular' }
    ]

    logger.warn('getExampleVerbs', 'Using absolute emergency fallback examples')
    return emergencyExamples
  }
}

// Enhanced get verb forms for display with comprehensive error handling
export async function getVerbForms(lemma, region = 'la_general') {
  if (!lemma || typeof lemma !== 'string') {
    logger.warn('getVerbForms', 'Invalid lemma parameter', { lemma })
    return []
  }

  if (!region || typeof region !== 'string') {
    logger.warn('getVerbForms', 'Invalid region parameter', { region })
    region = 'la_general' // fallback to default
  }

  try {
    // Get verb with comprehensive fallback
    const verb = await getVerbByLemma(lemma)
    if (!verb) {
      logger.warn('getVerbForms', `Verb not found: ${lemma}`)

      // Trigger recovery
      handleErrorWithRecovery(new Error(`Verb not found: ${lemma}`), {
        component: 'verbDataService',
        function: 'getVerbForms',
        lemma,
        region,
        severity: 'low'
      })

      return []
    }

    if (!verb.paradigms || !Array.isArray(verb.paradigms)) {
      logger.warn('getVerbForms', `Verb ${lemma} has no valid paradigms`, { verb })

      // Try to heal the verb structure
      try {
        const integrityGuard = getIntegrityGuard()
        const healingResult = integrityGuard.validateAndHealVerbs([verb])

        if (healingResult.healingPerformed && healingResult.healedVerbs.length > 0) {
          const healedVerb = healingResult.healedVerbs[0]
          logger.info('getVerbForms', `Healed verb structure for ${lemma}`)
          // Continue with healed verb
          verb.paradigms = healedVerb.paradigms
        } else {
          return []
        }
      } catch (healingError) {
        logger.warn('getVerbForms', `Failed to heal verb ${lemma}`, healingError)
        return []
      }
    }

    const forms = []
    let paradigmsProcessed = 0
    let formsProcessed = 0
    let errorCount = 0

    for (const paradigm of verb.paradigms) {
      try {
        // Check if paradigm matches region
        if (!paradigm.regionTags?.includes(region)) {
          continue
        }

        if (!paradigm.forms || !Array.isArray(paradigm.forms)) {
          logger.warn('getVerbForms', `Invalid forms in paradigm for verb ${lemma}`, { paradigm })
          errorCount++
          continue
        }

        for (const form of paradigm.forms) {
          try {
            if (!form || typeof form !== 'object') {
              errorCount++
              continue
            }

            const enrichedForm = {
              ...form,
              lemma: verb.lemma,
              verbType: verb.type || 'regular'
            }

            // Basic validation of form structure
            if (enrichedForm.mood && enrichedForm.tense && enrichedForm.value) {
              forms.push(enrichedForm)
              formsProcessed++
            } else {
              logger.warn('getVerbForms', `Invalid form structure for verb ${lemma}`, { form })
              errorCount++
            }
          } catch (formError) {
            logger.warn('getVerbForms', `Error processing form for verb ${lemma}`, formError)
            errorCount++
          }
        }

        paradigmsProcessed++
      } catch (paradigmError) {
        logger.warn('getVerbForms', `Error processing paradigm for verb ${lemma}`, paradigmError)
        errorCount++
      }
    }

    // Log processing statistics for debugging
    logger.debug('getVerbForms', `Forms retrieval completed for ${lemma}`, {
      lemma,
      region,
      paradigmsProcessed,
      formsProcessed,
      errorCount,
      resultCount: forms.length
    })

    // Check if we got reasonable results
    if (forms.length === 0 && verb.paradigms.length > 0) {
      logger.warn('getVerbForms', `No forms extracted for verb ${lemma} in region ${region}`, {
        lemma,
        region,
        paradigmCount: verb.paradigms.length,
        errorCount
      })

      // Trigger recovery for potential data issues
      handleErrorWithRecovery(new Error(`No forms extracted for verb ${lemma}`), {
        component: 'verbDataService',
        function: 'getVerbForms',
        lemma,
        region,
        paradigmCount: verb.paradigms.length,
        severity: 'medium'
      })
    }

    return forms

  } catch (error) {
    logger.error('getVerbForms', `Critical error getting forms for verb ${lemma}`, error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getVerbForms',
      lemma,
      region,
      severity: 'medium'
    })

    return []
  }
}

// Enhanced preload nonfinite sets with comprehensive error handling
export function preloadNonfiniteSets(lemmas) {
  if (!Array.isArray(lemmas)) {
    logger.warn('preloadNonfiniteSets', 'Invalid lemmas parameter - not an array', { lemmas })
    return []
  }

  if (lemmas.length === 0) {
    return []
  }

  try {
    const results = []
    let processedCount = 0
    let errorCount = 0
    let successCount = 0

    for (const lemma of lemmas) {
      try {
        if (!lemma || typeof lemma !== 'string') {
          logger.warn('preloadNonfiniteSets', 'Invalid lemma in array', { lemma })
          errorCount++
          continue
        }

        const forms = buildNonfiniteFormsForLemma(lemma)

        if (forms && forms.length > 0) {
          results.push({ lemma, forms })
          successCount++
        } else {
          logger.debug('preloadNonfiniteSets', `No nonfinite forms found for lemma: ${lemma}`)
        }

        processedCount++
      } catch (lemmaError) {
        logger.warn('preloadNonfiniteSets', `Error processing lemma: ${lemma}`, lemmaError)
        errorCount++
      }
    }

    // Log processing statistics
    logger.debug('preloadNonfiniteSets', 'Nonfinite sets preloading completed', {
      requestedCount: lemmas.length,
      processedCount,
      successCount,
      errorCount,
      successRate: `${((successCount / lemmas.length) * 100).toFixed(1)}%`
    })

    // Check for excessive errors
    if (errorCount > lemmas.length * 0.5) {
      logger.warn('preloadNonfiniteSets', 'High error rate in nonfinite preloading', {
        errorRate: `${((errorCount / lemmas.length) * 100).toFixed(1)}%`,
        errorCount,
        totalCount: lemmas.length
      })

      // Trigger recovery for potential systemic issues
      handleErrorWithRecovery(new Error(`High error rate in nonfinite preloading: ${errorCount}/${lemmas.length}`), {
        component: 'verbDataService',
        function: 'preloadNonfiniteSets',
        errorRate: errorCount / lemmas.length,
        severity: 'medium'
      })
    }

    return results

  } catch (error) {
    logger.error('preloadNonfiniteSets', 'Critical error in nonfinite sets preloading', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'preloadNonfiniteSets',
      lemmasCount: lemmas.length,
      severity: 'medium'
    })

    return []
  }
}

// Enhanced get eligible forms for settings with comprehensive error handling
export function getEligibleFormsForSettings(region, settings) {
  if (!region || typeof region !== 'string') {
    logger.warn('getEligibleFormsForSettings', 'Invalid region parameter', { region })
    region = 'la_general' // fallback to default
  }

  if (!settings || typeof settings !== 'object') {
    logger.warn('getEligibleFormsForSettings', 'Invalid settings parameter', { settings })
    settings = {} // fallback to empty settings
  }

  try {
    // Get forms with enhanced error handling
    const forms = getFormsForRegion(region, settings)

    if (!forms || forms.length === 0) {
      logger.warn('getEligibleFormsForSettings', `No forms available for region: ${region}`)

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No forms available for region: ${region}`), {
        component: 'verbDataService',
        function: 'getEligibleFormsForSettings',
        region,
        settings,
        severity: 'high'
      })

      return []
    }

    // Apply curriculum and dialect filtering with error handling
    try {
      const eligibleForms = gateFormsByCurriculumAndDialect(forms, settings)

      if (!eligibleForms || eligibleForms.length === 0) {
        logger.warn('getEligibleFormsForSettings', `No eligible forms after filtering`, {
          region,
          originalFormsCount: forms.length,
          settings
        })

        // Check if this is due to overly restrictive settings
        const settingsKeys = Object.keys(settings)
        if (settingsKeys.length > 5) {
          logger.warn('getEligibleFormsForSettings', 'Settings may be overly restrictive', {
            settingsCount: settingsKeys.length,
            settings
          })
        }

        // Trigger recovery for potential filtering issues
        handleErrorWithRecovery(new Error(`No eligible forms after filtering for region: ${region}`), {
          component: 'verbDataService',
          function: 'getEligibleFormsForSettings',
          region,
          originalFormsCount: forms.length,
          filteredFormsCount: 0,
          severity: 'medium'
        })
      } else {
        // Log successful filtering statistics
        logger.debug('getEligibleFormsForSettings', 'Form filtering completed', {
          region,
          originalFormsCount: forms.length,
          eligibleFormsCount: eligibleForms.length,
          filteringRate: `${((eligibleForms.length / forms.length) * 100).toFixed(1)}%`
        })
      }

      return eligibleForms || []

    } catch (filteringError) {
      logger.error('getEligibleFormsForSettings', 'Error during form filtering', filteringError)

      // Trigger recovery
      handleErrorWithRecovery(filteringError, {
        component: 'verbDataService',
        function: 'getEligibleFormsForSettings',
        region,
        formsCount: forms.length,
        severity: 'medium'
      })

      // Return unfiltered forms as fallback
      logger.warn('getEligibleFormsForSettings', 'Returning unfiltered forms as fallback')
      return forms
    }

  } catch (error) {
    logger.error('getEligibleFormsForSettings', 'Critical error getting eligible forms', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getEligibleFormsForSettings',
      region,
      settings,
      severity: 'high'
    })

    return []
  }
}

// Enhanced get verb metadata with comprehensive error handling
export function getVerbMetadata(lemma) {
  if (!lemma || typeof lemma !== 'string') {
    logger.warn('getVerbMetadata', 'Invalid lemma parameter', { lemma })
    return null
  }

  try {
    const verb = getVerbByLemma(lemma)
    if (!verb) {
      logger.debug('getVerbMetadata', `Verb not found: ${lemma}`)
      return null
    }

    try {
      // Get verb families with error handling
      let families = []
      try {
        families = categorizeVerb(verb.lemma, verb) || []
      } catch (categorizationError) {
        logger.warn('getVerbMetadata', `Error categorizing verb ${lemma}`, categorizationError)
        families = [] // fallback to empty array
      }

      const metadata = {
        lemma: verb.lemma,
        type: verb.type || 'regular',
        families
      }

      // Validate metadata structure
      if (!metadata.lemma) {
        logger.warn('getVerbMetadata', `Invalid metadata for verb ${lemma}`, { metadata })
        return null
      }

      logger.debug('getVerbMetadata', `Retrieved metadata for ${lemma}`, {
        lemma: metadata.lemma,
        type: metadata.type,
        familyCount: metadata.families.length
      })

      return metadata

    } catch (metadataError) {
      logger.warn('getVerbMetadata', `Error building metadata for verb ${lemma}`, metadataError)

      // Return minimal metadata as fallback
      const fallbackMetadata = {
        lemma: verb.lemma,
        type: verb.type || 'regular',
        families: []
      }

      logger.warn('getVerbMetadata', `Using fallback metadata for ${lemma}`)
      return fallbackMetadata
    }

  } catch (error) {
    logger.error('getVerbMetadata', `Critical error getting metadata for verb ${lemma}`, error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'getVerbMetadata',
      lemma,
      severity: 'low'
    })

    return null
  }
}

// Enhanced cache stats with comprehensive error handling
export async function getVerbDataCacheStats() {
  try {
    // Get verbs with fallback protection
    const allVerbs = await getAllVerbs()

    const baseStats = {
      totalVerbs: allVerbs ? allVerbs.length : 0,
      cacheType: 'direct_import_with_redundancy'
    }

    // Try to get additional stats from redundancy manager
    try {
      const redundancyManager = getVerbDataRedundancyManager()
      if (redundancyManager) {
        const redundancyStats = redundancyManager.getSystemStats()
        Object.assign(baseStats, {
          redundancyLayers: redundancyStats.layers || 4,
          currentLayer: redundancyStats.currentLayer || 'primary',
          lastSwitchTime: redundancyStats.lastSwitchTime,
          circuitBreakerStatus: redundancyStats.circuitBreakerStatus
        })
      }
    } catch (redundancyStatsError) {
      logger.debug('getVerbDataCacheStats', 'Could not get redundancy stats', redundancyStatsError)
    }

    // Try to get cache orchestrator stats
    try {
      const cacheOrchestrator = getCacheOrchestrator()
      if (cacheOrchestrator) {
        const cacheStats = cacheOrchestrator.getGlobalStats()
        Object.assign(baseStats, {
          cacheHitRate: cacheStats.globalHitRate,
          memoryUsage: cacheStats.totalMemoryUsage,
          cacheCount: cacheStats.activeCaches
        })
      }
    } catch (cacheStatsError) {
      logger.debug('getVerbDataCacheStats', 'Could not get cache orchestrator stats', cacheStatsError)
    }

    logger.debug('getVerbDataCacheStats', 'Cache stats retrieved', baseStats)
    return baseStats

  } catch (error) {
    logger.error('getVerbDataCacheStats', 'Error getting cache stats', error)

    // Return minimal fallback stats
    return {
      totalVerbs: 0,
      cacheType: 'error_fallback',
      error: error.message
    }
  }
}

// Enhanced clear caches with comprehensive error handling
export function clearVerbDataCaches() {
  try {
    logger.info('clearVerbDataCaches', 'Starting cache clearing process')

    let clearedCount = 0
    let errorCount = 0

    // Clear cache orchestrator if available
    try {
      const cacheOrchestrator = getCacheOrchestrator()
      if (cacheOrchestrator) {
        cacheOrchestrator.clearAllCaches()
        clearedCount++
        logger.debug('clearVerbDataCaches', 'Cache orchestrator cleared')
      }
    } catch (orchestratorError) {
      logger.warn('clearVerbDataCaches', 'Error clearing cache orchestrator', orchestratorError)
      errorCount++
    }

    // Clear redundancy manager caches if available
    try {
      const redundancyManager = getVerbDataRedundancyManager()
      if (redundancyManager) {
        redundancyManager.clearAllCaches()
        clearedCount++
        logger.debug('clearVerbDataCaches', 'Redundancy manager caches cleared')
      }
    } catch (redundancyError) {
      logger.warn('clearVerbDataCaches', 'Error clearing redundancy manager', redundancyError)
      errorCount++
    }

    // Clear any other cached data
    try {
      // Clear optimized cache if available
      if (typeof clearOptimizedCache === 'function') {
        clearOptimizedCache()
        clearedCount++
        logger.debug('clearVerbDataCaches', 'Optimized cache cleared')
      }
    } catch (optimizedCacheError) {
      logger.warn('clearVerbDataCaches', 'Error clearing optimized cache', optimizedCacheError)
      errorCount++
    }

    // Log clearing results
    logger.info('clearVerbDataCaches', 'Cache clearing completed', {
      clearedCount,
      errorCount,
      successRate: clearedCount > 0 ? `${((clearedCount / (clearedCount + errorCount)) * 100).toFixed(1)}%` : '0%'
    })

    // Trigger recovery if there were significant errors
    if (errorCount > 0) {
      handleErrorWithRecovery(new Error(`Cache clearing had ${errorCount} errors`), {
        component: 'verbDataService',
        function: 'clearVerbDataCaches',
        clearedCount,
        errorCount,
        severity: errorCount > clearedCount ? 'medium' : 'low'
      })
    }

    return {
      success: true,
      clearedCount,
      errorCount
    }

  } catch (error) {
    logger.error('clearVerbDataCaches', 'Critical error during cache clearing', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'verbDataService',
      function: 'clearVerbDataCaches',
      severity: 'medium'
    })

    return {
      success: false,
      error: error.message
    }
  }
}

// Preload function for progressive enhancement
export function preloadVerbData() {
  // Start loading verbs in background
  getAllVerbs().catch(() => {})
}