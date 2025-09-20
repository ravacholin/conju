
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

import { validateIntegrity } from './validateIntegrity.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const toModuleUrl = (relativePath) => pathToFileURL(path.join(repoRoot, relativePath)).href

function record(collection, message) {
  if (!collection.includes(message)) {
    collection.push(message)
  }
}

async function deepAudit({ verbose = false } = {}) {
  const errors = []
  const warnings = []
  const info = (...args) => { if (verbose) console.log(...args) }

  let verbs
  let curriculum
  let learningFamiliesModule

  try {
    ;({ verbs } = await import(toModuleUrl('src/data/verbs.js')))
  } catch (error) {
    record(errors, `Unable to load verbs dataset: ${error.message}`)
    return { errors, warnings }
  }

  try {
    const raw = await fs.readFile(path.join(repoRoot, 'src/data/curriculum.json'), 'utf8')
    curriculum = JSON.parse(raw)
  } catch (error) {
    record(errors, `Unable to read curriculum.json: ${error.message}`)
    return { errors, warnings }
  }

  try {
    learningFamiliesModule = await import(toModuleUrl('src/lib/data/learningIrregularFamilies.js'))
  } catch (error) {
    record(errors, `Unable to load irregular families module: ${error.message}`)
    return { errors, warnings }
  }

  const { LEARNING_IRREGULAR_FAMILIES, getLearningFamiliesForTense } = learningFamiliesModule
  const lemmaIndex = new Map(verbs.map((verb) => [verb.lemma, verb]))
  const allFamilies = Object.values(LEARNING_IRREGULAR_FAMILIES ?? {})

  info(`🔁 Checking ${curriculum?.length ?? 0} curriculum entries, ${allFamilies.length} families, ${verbs.length} verbs`)

  const combos = new Map()
  curriculum.forEach(({ mood, tense }) => {
    if (!mood || !tense) return
    const key = `${mood}|${tense}`
    if (!combos.has(key)) {
      combos.set(key, { mood, tense })
    }
  })

  combos.forEach(({ mood, tense }) => {
    if (typeof getLearningFamiliesForTense !== 'function') {
      record(warnings, 'getLearningFamiliesForTense is not implemented')
      return
    }

    let families
    try {
      families = getLearningFamiliesForTense(tense)
    } catch (error) {
      record(errors, `getLearningFamiliesForTense(${tense}) threw: ${error.message}`)
      return
    }

    if (!Array.isArray(families) || families.length === 0) {
      info(`ℹ️  ${mood}:${tense} has no irregular families (regular coverage)`)
      return
    }

    families.forEach((family) => {
      const examples = Array.isArray(family?.examples) ? family.examples : []
      const available = examples.filter((lemma) => lemmaIndex.has(lemma))

      if (available.length < 3) {
        record(warnings, `${mood}:${tense} family ${family.id} only has ${available.length} usable verbs`)
      }

      if (available.length) {
        const endings = available.reduce((acc, lemma) => {
          if (lemma.endsWith('ar')) acc.ar++
          else if (lemma.endsWith('er')) acc.er++
          else if (lemma.endsWith('ir')) acc.ir++
          return acc
        }, { ar: 0, er: 0, ir: 0 })

        const distinctEndings = Object.values(endings).filter((count) => count > 0).length
        if (distinctEndings < 2) {
          record(warnings, `${mood}:${tense} family ${family.id} has limited ending distribution (ar:${endings.ar}, er:${endings.er}, ir:${endings.ir})`)
        }
      }
    })
  })

  // Ensure every defined family is reachable from at least one tense
  const reachableFamilies = new Set()
  if (typeof getLearningFamiliesForTense === 'function') {
    combos.forEach(({ tense }) => {
      try {
        getLearningFamiliesForTense(tense).forEach((family) => {
          if (family?.id) reachableFamilies.add(family.id)
        })
      } catch {
        // already captured above
      }
    })
  }

  allFamilies.forEach((family) => {
    if (family?.id && !reachableFamilies.has(family.id)) {
      record(warnings, `Learning family ${family.id} is defined but never referenced by any tense`)
    }
  })

  return { errors, warnings }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Set(process.argv.slice(2))
  const failOnFindings = args.has('--fail-on-findings')
  const failOnWarning = args.has('--fail-on-warning')
  const verbose = args.has('--verbose')

  const main = async () => {
    const integrity = await validateIntegrity({ verbose })
    const deep = await deepAudit({ verbose })

    const errors = [...new Set([...(integrity.errors ?? []), ...(deep.errors ?? [])])]
    const warnings = [...new Set([...(integrity.warnings ?? []), ...(deep.warnings ?? [])])]

    if (warnings.length) {
      console.log('\n⚠️  WARNINGS:')
      warnings.forEach((warning) => console.log(` - ${warning}`))
    }

    if (errors.length) {
      console.error('\n❌ ERRORS:')
      errors.forEach((error) => console.error(` - ${error}`))
      process.exit(1)
    }

    if ((failOnWarning || failOnFindings) && warnings.length) {
      console.error('\n❌ Failing due to warnings (options requested).')
      process.exit(1)
    }

    console.log('\n✅ Comprehensive audit finished with no blocking issues.')
  }

  main().catch((error) => {
    console.error('Unexpected error during audit:', error)
    process.exit(1)
  })
}
