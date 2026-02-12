import fs from 'node:fs'
import path from 'node:path'

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'performance')
const BENCHMARK_PATH = path.join(OUTPUT_DIR, 'generator-benchmark.json')
const BASELINE_PATH = path.join(OUTPUT_DIR, 'generator-baseline.json')
const REPORT_PATH = path.join(OUTPUT_DIR, 'generator-benchmark-check.md')

if (!fs.existsSync(BENCHMARK_PATH)) {
  throw new Error('No se encontro benchmark actual. Ejecuta primero `npm run perf:generator`.')
}

if (!fs.existsSync(BASELINE_PATH)) {
  throw new Error('No se encontro baseline. Ejecuta primero `npm run perf:generator:baseline`.')
}

const benchmark = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'))
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))

const currentP95 = Number(benchmark?.indexed?.p95Ms || 0)
const currentP50 = Number(benchmark?.indexed?.p50Ms || 0)
const baselineP95 = Number(baseline?.indexed?.p95Ms || 0)
const baselineP50 = Number(baseline?.indexed?.p50Ms || 0)
const maxP95RegressionPct = Number(baseline?.policy?.maxP95RegressionPct || 25)
const maxP50RegressionPct = Number(baseline?.policy?.maxP50RegressionPct || 25)
const strictMode = process.env.PERF_GENERATOR_STRICT === '1'

const percentDelta = (current, base) => {
  if (base <= 0) {
    if (current <= 0) return 0
    return 100
  }
  return ((current - base) / base) * 100
}

const p95DeltaPct = percentDelta(currentP95, baselineP95)
const p50DeltaPct = percentDelta(currentP50, baselineP50)
const p95Regression = p95DeltaPct > maxP95RegressionPct
const p50Regression = p50DeltaPct > maxP50RegressionPct
const hasRegression = p95Regression || p50Regression

const formatPct = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

const report = [
  '# Generator Benchmark Check',
  '',
  `Current benchmark: ${benchmark.generatedAt || 'n/a'}`,
  `Baseline: ${baseline.generatedAt || 'n/a'}`,
  '',
  '## Indexed path comparison',
  `- p95 baseline/current: ${baselineP95}ms -> ${currentP95}ms (${formatPct(p95DeltaPct)})`,
  `- p50 baseline/current: ${baselineP50}ms -> ${currentP50}ms (${formatPct(p50DeltaPct)})`,
  '',
  '## Regression policy',
  `- Max p95 regression: ${maxP95RegressionPct}%`,
  `- Max p50 regression: ${maxP50RegressionPct}%`,
  `- Strict mode: ${strictMode ? 'ON' : 'OFF'}`,
  '',
  `Status: ${hasRegression ? 'REGRESSION DETECTED' : 'OK'}`,
  ''
].join('\n')

fs.writeFileSync(REPORT_PATH, report, 'utf8')
console.log(report)
console.log(`Reporte guardado en ${path.relative(process.cwd(), REPORT_PATH)}`)

if (strictMode && hasRegression) {
  process.exitCode = 1
}
