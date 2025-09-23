import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

// Import for CEFR classification and frequency analysis
const require = createRequire(import.meta.url)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const VERBS_FILE = path.join(ROOT_DIR, 'src/data/verbs.js')
const OUTPUT_DIR = path.join(ROOT_DIR, 'public/chunks')

function extractVerbs(jsonSource) {
  const match = jsonSource.match(/export const verbs = (\[.*\]);?\s*$/s)
  if (!match) {
    throw new Error('No se pudo extraer el array de verbos desde src/data/verbs.js')
  }
  return JSON.parse(match[1])
}

// Dynamic classification using CEFR levels and frequency data
async function loadCEFRAndFrequencyData() {
  try {
    // Load CEFR packs from levels.js
    const levelsModule = await import('../src/lib/data/levels.js')
    const { PACKS } = levelsModule

    // Load frequency determination function
    const verbInitModule = await import('../src/lib/progress/verbInitialization.js')
    const { determineVerbFrequency } = verbInitModule

    // Load irregular categorization function
    const irregularModule = await import('../src/lib/data/irregularFamilies.js')
    const { categorizeVerb } = irregularModule

    return { PACKS, determineVerbFrequency, categorizeVerb }
  } catch (error) {
    console.error('Failed to load CEFR and frequency data:', error)
    throw error
  }
}

// Target chunk sizes for balanced distribution
const TARGET_SIZES = {
  core: 25,
  common: 40,
  irregulars: 80,
  advanced: 60
}

// CEFR level progression mapping
const CEFR_TO_CHUNK = {
  A1: 'core',
  A2: 'common',
  B1: 'common',
  B2: 'advanced',
  C1: 'advanced',
  C2: 'advanced'
}

const PRIORITY_BY_CHUNK = new Map([
  ['core', 1],
  ['common', 2],
  ['irregulars', 3],
  ['advanced', 4]
])

async function buildChunks() {
  const verbsSource = await readFile(VERBS_FILE, 'utf8')
  const verbs = extractVerbs(verbsSource)

  // Load CEFR and frequency classification data
  const { PACKS, determineVerbFrequency, categorizeVerb } = await loadCEFRAndFrequencyData()

  console.log(`📊 Processing ${verbs.length} verbs with CEFR + frequency classification`)

  const assignments = new Map()
  const verbFrequencies = new Map()
  const verbCEFRLevels = new Map()
  const verbIrregularFamilies = new Map()

  // Step 1: Analyze all verbs for frequency, CEFR level, and irregularity
  for (const verb of verbs) {
    const frequency = determineVerbFrequency(verb.lemma)
    verbFrequencies.set(verb.lemma, frequency)

    // Determine CEFR level from PACKS
    let cefrLevel = null
    for (const [packName, pack] of Object.entries(PACKS)) {
      if (pack.lemmas && pack.lemmas.includes(verb.lemma)) {
        if (packName.startsWith('A1')) cefrLevel = 'A1'
        else if (packName.startsWith('A2')) cefrLevel = 'A2'
        else if (packName.startsWith('B1')) cefrLevel = 'B1'
        else if (packName.startsWith('B2')) cefrLevel = 'B2'
        else if (packName.startsWith('C1')) cefrLevel = 'C1'
        else if (packName.startsWith('C2')) cefrLevel = 'C2'
        break
      }
    }
    verbCEFRLevels.set(verb.lemma, cefrLevel)

    // Check for irregularity using categorizeVerb
    let isIrregular = false
    let irregularFamilies = []

    // First check explicit markers
    if (verb.type === 'irregular' ||
        (Array.isArray(verb.tags) && verb.tags.includes('irregular')) ||
        (verb.metadata && verb.metadata.difficulty === 'irregular')) {
      isIrregular = true
    } else {
      // Use categorizeVerb for proper detection
      try {
        irregularFamilies = categorizeVerb(verb.lemma, verb)
        isIrregular = irregularFamilies.length > 0
      } catch (error) {
        // If categorization fails, keep as regular
        console.warn(`Failed to categorize verb ${verb.lemma}, treating as regular:`, error.message)
      }
    }

    verbIrregularFamilies.set(verb.lemma, { isIrregular, families: irregularFamilies })
  }

  console.log(`📈 Frequency distribution: ${Array.from(verbFrequencies.values()).reduce((acc, freq) => { acc[freq] = (acc[freq] || 0) + 1; return acc }, {})}`)
  console.log(`📚 CEFR distribution: ${Array.from(verbCEFRLevels.values()).reduce((acc, level) => { acc[level || 'unknown'] = (acc[level || 'unknown'] || 0) + 1; return acc }, {})}`)
  console.log(`🔥 Irregular verbs: ${Array.from(verbIrregularFamilies.values()).filter(v => v.isIrregular).length}`)

  // Step 2: Assign verbs to chunks using CEFR + frequency logic
  // Priority 1: Core chunk (A1 + high frequency, including some irregular)
  const coreVerbs = verbs.filter(verb => {
    const frequency = verbFrequencies.get(verb.lemma)
    const cefrLevel = verbCEFRLevels.get(verb.lemma)

    // Include A1 verbs regardless of irregularity, and high frequency regulars
    return cefrLevel === 'A1' || frequency === 'high'
  })

  // Take top verbs by priority for core
  const sortedCoreVerbs = coreVerbs
    .sort((a, b) => {
      const aFreq = verbFrequencies.get(a.lemma)
      const bFreq = verbFrequencies.get(b.lemma)
      const aCefr = verbCEFRLevels.get(a.lemma)
      const bCefr = verbCEFRLevels.get(b.lemma)

      // A1 + high frequency first
      if (aCefr === 'A1' && aFreq === 'high' && !(bCefr === 'A1' && bFreq === 'high')) return -1
      if (bCefr === 'A1' && bFreq === 'high' && !(aCefr === 'A1' && aFreq === 'high')) return 1

      // Then A1 verbs
      if (aCefr === 'A1' && bCefr !== 'A1') return -1
      if (bCefr === 'A1' && aCefr !== 'A1') return 1

      // Then high frequency
      if (aFreq === 'high' && bFreq !== 'high') return -1
      if (bFreq === 'high' && aFreq !== 'high') return 1

      return a.lemma.localeCompare(b.lemma)
    })
    .slice(0, TARGET_SIZES.core)

  sortedCoreVerbs.forEach(verb => assignments.set(verb.lemma, 'core'))

  // Priority 2: Irregular verbs (only complex irregulars, not in core)
  const irregularVerbs = verbs.filter(verb => {
    const irregular = verbIrregularFamilies.get(verb.lemma)
    const frequency = verbFrequencies.get(verb.lemma)

    // Only include significantly irregular verbs that aren't already in core
    return irregular.isIrregular &&
           !assignments.has(verb.lemma) &&
           (irregular.families.length > 1 || frequency === 'low' || verb.type === 'irregular')
  })

  // Sort irregulars by frequency and CEFR level (prioritize common ones)
  const sortedIrregularVerbs = irregularVerbs
    .sort((a, b) => {
      const aFreq = verbFrequencies.get(a.lemma)
      const bFreq = verbFrequencies.get(b.lemma)
      const aCefr = verbCEFRLevels.get(a.lemma)
      const bCefr = verbCEFRLevels.get(b.lemma)

      // High frequency first
      if (aFreq === 'high' && bFreq !== 'high') return -1
      if (bFreq === 'high' && aFreq !== 'high') return 1

      // Then medium frequency
      if (aFreq === 'medium' && bFreq === 'low') return -1
      if (bFreq === 'medium' && aFreq === 'low') return 1

      // Earlier CEFR levels first
      const cefrOrder = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, null: 7 }
      const aOrder = cefrOrder[aCefr] || 7
      const bOrder = cefrOrder[bCefr] || 7
      if (aOrder !== bOrder) return aOrder - bOrder

      return a.lemma.localeCompare(b.lemma)
    })
    .slice(0, TARGET_SIZES.irregulars)

  sortedIrregularVerbs.forEach(verb => assignments.set(verb.lemma, 'irregulars'))

  // Priority 3: Common chunk (A2-B1 + medium frequency, including some irregulars)
  const commonVerbs = verbs.filter(verb => {
    const frequency = verbFrequencies.get(verb.lemma)
    const cefrLevel = verbCEFRLevels.get(verb.lemma)
    const irregular = verbIrregularFamilies.get(verb.lemma)

    if (assignments.has(verb.lemma)) return false

    // Include A2/B1 verbs and medium frequency verbs (regular or mildly irregular)
    return (cefrLevel === 'A2' || cefrLevel === 'B1' || frequency === 'medium')
  })

  const sortedCommonVerbs = commonVerbs
    .sort((a, b) => {
      const aFreq = verbFrequencies.get(a.lemma)
      const bFreq = verbFrequencies.get(b.lemma)
      const aCefr = verbCEFRLevels.get(a.lemma)
      const bCefr = verbCEFRLevels.get(b.lemma)

      // A2 first, then B1, then medium frequency
      const priorityScore = (verb) => {
        const freq = verbFrequencies.get(verb.lemma)
        const cefr = verbCEFRLevels.get(verb.lemma)
        if (cefr === 'A2' && freq === 'medium') return 1
        if (cefr === 'A2') return 2
        if (cefr === 'B1' && freq === 'medium') return 3
        if (cefr === 'B1') return 4
        if (freq === 'medium') return 5
        return 6
      }

      const aScore = priorityScore(a)
      const bScore = priorityScore(b)
      if (aScore !== bScore) return aScore - bScore

      return a.lemma.localeCompare(b.lemma)
    })
    .slice(0, TARGET_SIZES.common)

  sortedCommonVerbs.forEach(verb => assignments.set(verb.lemma, 'common'))

  // Priority 4: Advanced chunk (remaining verbs)
  const remainingVerbs = verbs.filter(verb => !assignments.has(verb.lemma))
  remainingVerbs.forEach(verb => assignments.set(verb.lemma, 'advanced'))

  // Log assignment statistics
  const assignmentStats = { core: 0, common: 0, irregulars: 0, advanced: 0 }
  assignments.forEach(chunk => assignmentStats[chunk]++)
  console.log(`📊 Chunk assignments:`, assignmentStats)

  const chunkData = new Map([
    ['core', {
      lemmas: new Set(),
      verbs: [],
      expectedCount: TARGET_SIZES.core,
      cefrRange: 'A1',
      frequencyProfile: 'high',
      description: 'Essential A1 verbs + high frequency'
    }],
    ['common', {
      lemmas: new Set(),
      verbs: [],
      expectedCount: TARGET_SIZES.common,
      cefrRange: 'A2-B1',
      frequencyProfile: 'medium',
      description: 'Common A2-B1 verbs + medium frequency'
    }],
    ['irregulars', {
      lemmas: new Set(),
      verbs: [],
      expectedCount: TARGET_SIZES.irregulars,
      cefrRange: 'A1-C2',
      frequencyProfile: 'mixed',
      description: 'Irregular verbs prioritized by frequency'
    }],
    ['advanced', {
      lemmas: new Set(),
      verbs: [],
      expectedCount: TARGET_SIZES.advanced,
      cefrRange: 'B2-C2',
      frequencyProfile: 'low',
      description: 'Advanced regular verbs + low frequency'
    }]
  ])

  for (const verb of verbs) {
    const chunkName = assignments.get(verb.lemma) || 'advanced'
    const bucket = chunkData.get(chunkName)
    bucket.lemmas.add(verb.lemma)
    bucket.verbs.push(verb)
  }

  // Log actual vs expected counts
  chunkData.forEach((data, chunkName) => {
    const actual = data.verbs.length
    const expected = data.expectedCount
    const coverage = ((actual / expected) * 100).toFixed(1)
    console.log(`📈 ${chunkName}: ${actual}/${expected} verbs (${coverage}% of target)`)
  })

  await mkdir(OUTPUT_DIR, { recursive: true })

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: Date.now().toString(36),
    totalVerbs: verbs.length,
    chunkCount: chunkData.size,
    chunks: []
  }

  for (const [name, data] of chunkData.entries()) {
    const verbsForChunk = data.verbs.sort((a, b) => a.lemma.localeCompare(b.lemma))
    const json = JSON.stringify(verbsForChunk)
    const hash = crypto.createHash('sha1').update(json).digest('hex')
    const byteSize = Buffer.byteLength(json, 'utf8')
    const lemmas = Array.from(data.lemmas).sort()

    await writeFile(path.join(OUTPUT_DIR, `${name}.json`), json)

    manifest.chunks.push({
      name,
      lemmaCount: lemmas.length,
      lemmas,
      bytes: byteSize,
      hash,
      priority: PRIORITY_BY_CHUNK.get(name) ?? 5,
      revision: `${manifest.version}-${hash.slice(0, 8)}`,
      // Enhanced metadata for chunk health monitoring
      expectedCount: data.expectedCount,
      cefrRange: data.cefrRange,
      frequencyProfile: data.frequencyProfile,
      description: data.description,
      coverage: ((lemmas.length / data.expectedCount) * 100).toFixed(1),
      generationMethod: 'cefr-frequency-dynamic'
    })
  }

  manifest.chunks.sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5))

  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return manifest
}

buildChunks()
  .then((manifest) => {
    console.log(`\n✅ Chunks generados (${manifest.chunkCount}) con versión ${manifest.version}`)
    console.log('📊 Final distribution:')
    manifest.chunks.forEach(chunk => {
      console.log(`   ${chunk.name}: ${chunk.lemmaCount} verbs (${chunk.coverage}% of target) - ${chunk.description}`)
    })
    console.log(`\n🎯 Total verbs: ${manifest.totalVerbs}`)
  })
  .catch((error) => {
    console.error('❌ Error generando chunks dinámicos:', error)
    process.exitCode = 1
  })
