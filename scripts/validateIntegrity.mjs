
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const toModuleUrl = (relativePath) => pathToFileURL(path.join(repoRoot, relativePath)).href

function collectIssue(collection, message) {
  if (!collection.includes(message)) {
    collection.push(message)
  }
}

export async function validateIntegrity({ verbose = false } = {}) {
  const errors = []
  const warnings = []
  const info = (...args) => {
    if (verbose) console.log(...args)
  }

  info('🔎 Running integrity validation...')

  // Load core datasets
  let verbs
  try {
    ;({ verbs } = await import(toModuleUrl('src/data/verbs.js')))
    if (!Array.isArray(verbs) || verbs.length === 0) {
      collectIssue(errors, 'Verb dataset is empty or not an array')
    }
  } catch (error) {
    collectIssue(errors, `Unable to load verbs dataset: ${error.message}`)
    return { errors, warnings }
  }

  let curriculum
  try {
    const curriculumRaw = await fs.readFile(path.join(repoRoot, 'src/data/curriculum.json'), 'utf8')
    curriculum = JSON.parse(curriculumRaw)
    if (!Array.isArray(curriculum) || curriculum.length === 0) {
      collectIssue(errors, 'Curriculum data is empty or not an array')
    }
  } catch (error) {
    collectIssue(errors, `Unable to load curriculum.json: ${error.message}`)
    return { errors, warnings }
  }

  let learningFamiliesModule
  try {
    learningFamiliesModule = await import(toModuleUrl('src/lib/data/learningIrregularFamilies.js'))
  } catch (error) {
    collectIssue(errors, `Unable to load learning irregular families module: ${error.message}`)
    return { errors, warnings }
  }

  const { LEARNING_IRREGULAR_FAMILIES, getLearningFamiliesForTense } = learningFamiliesModule

  if (!LEARNING_IRREGULAR_FAMILIES || typeof LEARNING_IRREGULAR_FAMILIES !== 'object') {
    collectIssue(errors, 'LEARNING_IRREGULAR_FAMILIES is missing or not an object')
  }

  const lemmaIndex = new Map()
  verbs.forEach((verb, idx) => {
    if (!verb || typeof verb !== 'object') {
      collectIssue(errors, `Verb entry at index ${idx} is not an object`)
      return
    }

    const { lemma, paradigms } = verb
    if (!lemma || typeof lemma !== 'string') {
      collectIssue(errors, `Verb entry at index ${idx} is missing a valid lemma`)
      return
    }

    if (lemmaIndex.has(lemma)) {
      collectIssue(errors, `Duplicate lemma detected: ${lemma}`)
    } else {
      lemmaIndex.set(lemma, idx)
    }

    if (paradigms && !Array.isArray(paradigms)) {
      collectIssue(warnings, `Verb ${lemma} has paradigms defined but it is not an array`)
    }
  })

  const uniqueCombos = new Map()
  curriculum.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') {
      collectIssue(errors, `Curriculum entry at index ${idx} is not an object`)
      return
    }

    const { mood, tense, level } = entry
    if (!mood || !tense) {
      collectIssue(errors, `Curriculum entry at index ${idx} is missing mood or tense`)
      return
    }

    const comboKey = `${mood}|${tense}`
    if (!uniqueCombos.has(comboKey)) {
      uniqueCombos.set(comboKey, { mood, tense, levels: new Set() })
    }

    if (level) {
      uniqueCombos.get(comboKey).levels.add(level)
    }
  })

  if (uniqueCombos.size === 0) {
    collectIssue(errors, 'No unique mood/tense combinations found in curriculum')
  }

  if (LEARNING_IRREGULAR_FAMILIES) {
    Object.entries(LEARNING_IRREGULAR_FAMILIES).forEach(([familyId, family]) => {
      if (!family || typeof family !== 'object') {
        collectIssue(errors, `Learning family ${familyId} is not an object`)
        return
      }

      const { examples = [], name } = family
      if (!name) {
        collectIssue(warnings, `Learning family ${familyId} is missing a descriptive name`)
      }

      if (!Array.isArray(examples) || examples.length === 0) {
        collectIssue(errors, `Learning family ${familyId} has no examples defined`)
        return
      }

      const missing = examples.filter((lemma) => !lemmaIndex.has(lemma))
      if (missing.length) {
        collectIssue(warnings, `Learning family ${familyId} references ${missing.length} verb(s) not present in dataset: ${missing.slice(0, 5).join(', ')}`)
      }
    })
  }

  // Verify each tense maps to valid families and they have sufficient verb coverage
  uniqueCombos.forEach(({ mood, tense }) => {
    if (typeof getLearningFamiliesForTense === 'function') {
      try {
        const families = getLearningFamiliesForTense(tense)
        if (!Array.isArray(families)) {
          collectIssue(errors, `getLearningFamiliesForTense(${tense}) did not return an array`)
          return
        }

        families.forEach((family) => {
          if (!family?.examples?.length) {
            collectIssue(warnings, `${mood}:${tense} family ${family?.id || 'unknown'} has no examples defined`)
            return
          }

          const available = family.examples.filter((lemma) => lemmaIndex.has(lemma))
          if (available.length < 3) {
            collectIssue(warnings, `${mood}:${tense} family ${family.id} only has ${available.length} verbs available`) 
          }
        })
      } catch (error) {
        collectIssue(errors, `getLearningFamiliesForTense(${tense}) threw: ${error.message}`)
      }
    }
  })

  info(`✅ Integrity validation completed with ${errors.length} error(s) and ${warnings.length} warning(s).`)
  return { errors, warnings, stats: { verbs: verbs.length, curriculumEntries: curriculum.length, combinations: uniqueCombos.size } }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failOnWarning = process.argv.includes('--fail-on-warning')
  const verbose = process.argv.includes('--verbose')

  const main = async () => {
    const { errors, warnings, stats } = await validateIntegrity({ verbose })

    if (stats) {
      console.log(`📦 Verbs: ${stats.verbs} · Curriculum entries: ${stats.curriculumEntries} · Combinations: ${stats.combinations}`)
    }

    if (warnings.length) {
      console.log('\n⚠️  WARNINGS:')
      warnings.forEach((warning) => console.log(` - ${warning}`))
    }

    if (errors.length) {
      console.error('\n❌ ERRORS:')
      errors.forEach((error) => console.error(` - ${error}`))
      process.exitCode = 1
    } else if (failOnWarning && warnings.length) {
      console.error('\n❌ Failing due to warnings (fail-on-warning enabled).')
      process.exitCode = 1
    } else {
      console.log('\n✅ Data integrity checks passed.')
    }
  }

  main().catch((error) => {
    console.error('Unexpected error during validation:', error)
    process.exitCode = 1
  })
}
