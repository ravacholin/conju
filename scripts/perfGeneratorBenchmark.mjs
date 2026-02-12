import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

import { applyComprehensiveFiltering, clearFormsCache, generateAllFormsForRegion, getFormsCacheKey } from '../src/hooks/modules/DrillFormFilters.js'
import { resolveFormsPool } from '../src/hooks/modules/formsPoolService.js'

const DEFAULT_RUNS = Number.parseInt(process.env.BENCH_RUNS || '200', 10)
const DEFAULT_WARMUP = Number.parseInt(process.env.BENCH_WARMUP || '20', 10)
const TARGET_REGION = process.env.BENCH_REGION || 'la_general'
const DEFAULT_BATCH_SIZE = Number.parseInt(process.env.BENCH_BATCH_SIZE || '50', 10)

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'performance')
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'generator-benchmark.json')
const OUTPUT_MD = path.join(OUTPUT_DIR, 'generator-benchmark.md')

const benchmarkSettings = {
  region: TARGET_REGION,
  practiceMode: 'specific',
  verbType: 'all',
  level: 'ALL',
  practicePronoun: 'all',
  useVoseo: true,
  useVosotros: true,
  selectedFamily: null
}

const specificConstraints = {
  isSpecific: true,
  specificMood: 'indicative',
  specificTense: 'pres',
  specificPerson: '1s'
}

const round = (value) => Number(value.toFixed(6))

const percentile = (samples, p) => {
  if (!samples.length) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const rank = (sorted.length - 1) * p
  const lower = Math.floor(rank)
  const upper = Math.ceil(rank)
  if (lower === upper) return sorted[lower]
  const weight = rank - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

const summarize = (samples = []) => {
  if (!samples.length) {
    return { runs: 0, minMs: 0, p50Ms: 0, p95Ms: 0, maxMs: 0, avgMs: 0 }
  }
  const total = samples.reduce((acc, value) => acc + value, 0)
  return {
    runs: samples.length,
    minMs: round(Math.min(...samples)),
    p50Ms: round(percentile(samples, 0.5)),
    p95Ms: round(percentile(samples, 0.95)),
    maxMs: round(Math.max(...samples)),
    avgMs: round(total / samples.length)
  }
}

const formatSummary = (summary, label) => [
  `### ${label}`,
  `- Runs: ${summary.runs}`,
  `- min: ${summary.minMs}ms`,
  `- p50: ${summary.p50Ms}ms`,
  `- p95: ${summary.p95Ms}ms`,
  `- max: ${summary.maxMs}ms`,
  `- avg: ${summary.avgMs}ms`,
  ''
]

const measureOne = (forms, settings, constraints, index) => {
  const start = performance.now()
  for (let i = 0; i < DEFAULT_BATCH_SIZE; i += 1) {
    applyComprehensiveFiltering(forms, settings, constraints, index)
  }
  return (performance.now() - start) / DEFAULT_BATCH_SIZE
}

const run = async () => {
  clearFormsCache()

  const initial = await resolveFormsPool({
    settings: benchmarkSettings,
    region: TARGET_REGION,
    cache: { signature: null, forms: null, index: null },
    generateAllFormsForRegion,
    getFormsCacheKey
  })

  const forms = initial.forms
  const index = initial.index

  if (!Array.isArray(forms) || forms.length === 0) {
    throw new Error('No se pudieron cargar formas para benchmark de generador.')
  }

  for (let i = 0; i < DEFAULT_WARMUP; i += 1) {
    clearFormsCache()
    measureOne(forms, benchmarkSettings, specificConstraints, null)
    clearFormsCache()
    measureOne(forms, benchmarkSettings, specificConstraints, index)
  }

  const noIndexSamples = []
  const indexedSamples = []

  for (let i = 0; i < DEFAULT_RUNS; i += 1) {
    clearFormsCache()
    noIndexSamples.push(measureOne(forms, benchmarkSettings, specificConstraints, null))
    clearFormsCache()
    indexedSamples.push(measureOne(forms, benchmarkSettings, specificConstraints, index))
  }

  const noIndex = summarize(noIndexSamples)
  const indexed = summarize(indexedSamples)
  const p95GainMs = round(noIndex.p95Ms - indexed.p95Ms)
  const p95GainPct = noIndex.p95Ms > 0 ? round((p95GainMs / noIndex.p95Ms) * 100) : 0

  const report = {
    generatedAt: new Date().toISOString(),
    benchmark: {
      runs: DEFAULT_RUNS,
      warmupRuns: DEFAULT_WARMUP,
      batchSize: DEFAULT_BATCH_SIZE,
      region: TARGET_REGION,
      formsCount: forms.length,
      constraints: specificConstraints
    },
    noIndex,
    indexed,
    delta: {
      p95GainMs,
      p95GainPct
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const md = [
    '# Benchmark Generador Drill',
    '',
    `Generado: ${report.generatedAt}`,
    `Region: ${TARGET_REGION}`,
    `Forms cargadas: ${forms.length}`,
    `Corridas: ${DEFAULT_RUNS} (warmup ${DEFAULT_WARMUP})`,
    `Batch interno por muestra: ${DEFAULT_BATCH_SIZE}`,
    '',
    ...formatSummary(noIndex, 'Sin indice precomputado'),
    ...formatSummary(indexed, 'Con indice precomputado'),
    '## Delta',
    `- Mejora p95: ${p95GainMs}ms (${p95GainPct}%)`,
    ''
  ].join('\n')

  fs.writeFileSync(OUTPUT_MD, md, 'utf8')

  console.log(`Benchmark generado en:\n- ${path.relative(process.cwd(), OUTPUT_JSON)}\n- ${path.relative(process.cwd(), OUTPUT_MD)}`)
  console.log(`p95 sin indice: ${noIndex.p95Ms}ms`)
  console.log(`p95 con indice: ${indexed.p95Ms}ms`)
  console.log(`delta p95: ${p95GainMs}ms (${p95GainPct}%)`)
  process.exit(0)
}

run().catch((error) => {
  console.error('Benchmark de generador fallo', error)
  process.exitCode = 1
})
