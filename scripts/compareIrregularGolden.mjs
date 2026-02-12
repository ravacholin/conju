import fs from 'node:fs'
import path from 'node:path'

import { normalize } from '../src/lib/utils/accentUtils.js'
import { categorizeVerb } from '../src/lib/data/irregularFamilies.js'
import { IRREGULAR_GOLDEN_FIXTURES } from '../src/lib/data/fixtures/irregularGoldenFixtures.js'
import { buildGerund, buildParticiple } from '../src/lib/core/nonfiniteBuilder.js'
import { getVerbForms } from '../src/lib/core/verbDataService.js'

const outputDir = path.join(process.cwd(), 'docs', 'linguistic')
const outputJson = path.join(outputDir, 'irregular-golden-report.json')
const outputMd = path.join(outputDir, 'irregular-golden-report.md')

const strict = process.env.IRREGULAR_GOLDEN_STRICT === '1'

const getSeverity = (type) => {
  if (type === 'missing-form' || type === 'value') return 'critical'
  if (type === 'gerund' || type === 'participle') return 'high'
  return 'medium'
}

const nonfiniteMismatches = []
IRREGULAR_GOLDEN_FIXTURES.nonfinite.forEach((entry) => {
  const actualGerund = buildGerund(entry.lemma)
  const actualParticiple = buildParticiple(entry.lemma)
  if (normalize(actualGerund) !== normalize(entry.gerund)) {
    nonfiniteMismatches.push({
      lemma: entry.lemma,
      type: 'gerund',
      severity: getSeverity('gerund'),
      expected: entry.gerund,
      actual: actualGerund
    })
  }
  if (normalize(actualParticiple) !== normalize(entry.participle)) {
    nonfiniteMismatches.push({
      lemma: entry.lemma,
      type: 'participle',
      severity: getSeverity('participle'),
      expected: entry.participle,
      actual: actualParticiple
    })
  }
})

const preteriteMismatches = []
for (const fixture of IRREGULAR_GOLDEN_FIXTURES.preteriteStrong) {
  const families = categorizeVerb(fixture.lemma)
  if (!families.includes(fixture.family)) {
    preteriteMismatches.push({
      lemma: fixture.lemma,
      type: 'family',
      severity: getSeverity('family'),
      expected: fixture.family,
      actual: families
    })
  }

  const forms = await getVerbForms(fixture.lemma, 'la_general')
  for (const [person, expectedValue] of Object.entries(fixture.forms)) {
    const match = forms.find(
      (form) =>
        form.mood === 'indicative' &&
        form.tense === 'pretIndef' &&
        form.person === person
    )

    if (!match) {
      preteriteMismatches.push({
        lemma: fixture.lemma,
        type: 'missing-form',
        severity: getSeverity('missing-form'),
        person,
        expected: expectedValue,
        actual: null
      })
      continue
    }

    if (normalize(match.value) !== normalize(expectedValue)) {
      preteriteMismatches.push({
        lemma: fixture.lemma,
        type: 'value',
        severity: getSeverity('value'),
        person,
        expected: expectedValue,
        actual: match.value
      })
    }
  }
}

const totalChecks =
  IRREGULAR_GOLDEN_FIXTURES.nonfinite.length * 2 +
  IRREGULAR_GOLDEN_FIXTURES.preteriteStrong.length * 4
const totalMismatches = nonfiniteMismatches.length + preteriteMismatches.length
const allMismatches = [...nonfiniteMismatches, ...preteriteMismatches]
const severitySummary = {
  critical: allMismatches.filter((item) => item.severity === 'critical').length,
  high: allMismatches.filter((item) => item.severity === 'high').length,
  medium: allMismatches.filter((item) => item.severity === 'medium').length
}

const report = {
  generatedAt: new Date().toISOString(),
  totalChecks,
  totalMismatches,
  severitySummary,
  strict,
  status: totalMismatches === 0 ? 'ok' : 'mismatch',
  nonfiniteMismatches,
  preteriteMismatches
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const md = [
  '# Irregular Golden Report',
  '',
  `Generado: ${report.generatedAt}`,
  `Checks totales: ${report.totalChecks}`,
  `Mismatches: ${report.totalMismatches}`,
  `Severidad (critical/high/medium): ${severitySummary.critical}/${severitySummary.high}/${severitySummary.medium}`,
  `Modo estricto: ${strict ? 'ON' : 'OFF'}`,
  `Estado: ${report.status.toUpperCase()}`,
  '',
  '## Nonfinite mismatches',
  ...(nonfiniteMismatches.length
    ? nonfiniteMismatches.map((item) => `- ${item.lemma} (${item.type}): esperado=${item.expected} actual=${item.actual}`)
    : ['- ninguno']),
  '',
  '## Preterite mismatches',
  ...(preteriteMismatches.length
    ? preteriteMismatches.map((item) =>
      `- ${item.lemma} (${item.type}${item.person ? `:${item.person}` : ''}): esperado=${JSON.stringify(item.expected)} actual=${JSON.stringify(item.actual)}`
    )
    : ['- ninguno']),
  ''
].join('\n')

fs.writeFileSync(outputMd, md, 'utf8')
console.log(`Reporte generado en:\n- ${path.relative(process.cwd(), outputJson)}\n- ${path.relative(process.cwd(), outputMd)}`)

if (strict && totalMismatches > 0) {
  process.exitCode = 1
}

process.exit(process.exitCode || 0)
