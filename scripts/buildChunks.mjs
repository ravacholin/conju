import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

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

const CORE_LEMMAS = [
  'ser','estar','haber','tener','hacer','decir','ir','ver','dar','saber',
  'querer','llegar','pasar','deber','poner','parecer','quedar'
]

const COMMON_LEMMAS = [
  'creer','hablar','llevar','dejar','seguir','encontrar','llamar','venir',
  'pensar','salir','volver','tomar','conocer','vivir','sentir','tratar',
  'mirar','contar','empezar','esperar','buscar','existir','entrar','trabajar'
]

const PRIORITY_BY_CHUNK = new Map([
  ['core', 1],
  ['common', 2],
  ['irregulars', 3],
  ['advanced', 4]
])

async function buildChunks() {
  const verbsSource = await readFile(VERBS_FILE, 'utf8')
  const verbs = extractVerbs(verbsSource)

  const assignments = new Map()
  CORE_LEMMAS.forEach((lemma) => assignments.set(lemma, 'core'))
  COMMON_LEMMAS
    .filter((lemma) => !assignments.has(lemma))
    .forEach((lemma) => assignments.set(lemma, 'common'))

  for (const verb of verbs) {
    if (
      verb.type === 'irregular' ||
      (Array.isArray(verb.tags) && verb.tags.includes('irregular')) ||
      (verb.metadata && verb.metadata.difficulty === 'irregular')
    ) {
      if (!assignments.has(verb.lemma)) {
        assignments.set(verb.lemma, 'irregulars')
      }
    }
  }

  const chunkData = new Map([
    ['core', { lemmas: new Set(), verbs: [] }],
    ['common', { lemmas: new Set(), verbs: [] }],
    ['irregulars', { lemmas: new Set(), verbs: [] }],
    ['advanced', { lemmas: new Set(), verbs: [] }]
  ])

  for (const verb of verbs) {
    const chunkName = assignments.get(verb.lemma) || 'advanced'
    const bucket = chunkData.get(chunkName)
    bucket.lemmas.add(verb.lemma)
    bucket.verbs.push(verb)
  }

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
      revision: `${manifest.version}-${hash.slice(0, 8)}`
    })
  }

  manifest.chunks.sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5))

  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return manifest
}

buildChunks()
  .then((manifest) => {
    console.log(`Chunks generados (${manifest.chunkCount}) con versión ${manifest.version}`)
  })
  .catch((error) => {
    console.error('Error generando chunks dinámicos:', error)
    process.exitCode = 1
  })
