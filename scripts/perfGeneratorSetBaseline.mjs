import fs from 'node:fs'
import path from 'node:path'

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'performance')
const BENCHMARK_PATH = path.join(OUTPUT_DIR, 'generator-benchmark.json')
const BASELINE_PATH = path.join(OUTPUT_DIR, 'generator-baseline.json')

if (!fs.existsSync(BENCHMARK_PATH)) {
  throw new Error('No se encontro docs/performance/generator-benchmark.json. Ejecuta primero `npm run perf:generator`.')
}

const benchmark = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'))
const baseline = {
  generatedAt: new Date().toISOString(),
  sourceBenchmarkGeneratedAt: benchmark.generatedAt || null,
  benchmark: benchmark.benchmark || {},
  indexed: benchmark.indexed || {},
  noIndex: benchmark.noIndex || {},
  policy: {
    maxP95RegressionPct: Number.parseFloat(process.env.GENERATOR_MAX_P95_REGRESSION_PCT || '25'),
    maxP50RegressionPct: Number.parseFloat(process.env.GENERATOR_MAX_P50_REGRESSION_PCT || '25')
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')

console.log(`Baseline de generador actualizado en ${path.relative(process.cwd(), BASELINE_PATH)}`)
