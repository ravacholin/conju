import fs from 'node:fs'
import path from 'node:path'

import { IRREGULAR_FAMILIES, IRREGULARITY_CLUSTERS } from '../src/lib/data/irregularFamilies.js'
import { LEARNING_IRREGULAR_FAMILIES } from '../src/lib/data/learningIrregularFamilies.js'
import { SIMPLIFIED_GROUPS } from '../src/lib/data/simplifiedFamilyGroups.js'
import { IRREGULAR_GERUNDS, IRREGULAR_PARTICIPLES } from '../src/lib/data/irregularPatterns.js'

const projectRoot = process.cwd()
const outputDir = path.join(projectRoot, 'docs', 'linguistic')
const outputJson = path.join(outputDir, 'irregular-sources-inventory.json')
const outputMd = path.join(outputDir, 'irregular-sources-inventory.md')

const unique = (items) => [...new Set(items.filter(Boolean))].sort()

const intersection = (a, b) => {
  const setB = new Set(b)
  return unique(a.filter((item) => setB.has(item)))
}

const diff = (a, b) => {
  const setB = new Set(b)
  return unique(a.filter((item) => !setB.has(item)))
}

const toCountMap = (items) => {
  const map = new Map()
  items.forEach((item) => map.set(item, (map.get(item) || 0) + 1))
  return map
}

const extractObjectKeysFromSource = (source, marker) => {
  const startIndex = source.indexOf(marker)
  if (startIndex === -1) return []
  const braceStart = source.indexOf('{', startIndex)
  if (braceStart === -1) return []

  let depth = 0
  let end = -1
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) return []

  const objectLiteral = source.slice(braceStart, end + 1)
  return unique([...objectLiteral.matchAll(/'([^']+)'\s*:/g)].map((match) => match[1]))
}

const irregularFamiliesIds = Object.keys(IRREGULAR_FAMILIES)
const clusterFamilyIds = unique(Object.values(IRREGULARITY_CLUSTERS).flatMap((cluster) => cluster.families || []))
const simplifiedFamilyIds = unique(Object.values(SIMPLIFIED_GROUPS).flatMap((group) => group.includedFamilies || []))

const technicalExamples = unique(Object.values(IRREGULAR_FAMILIES).flatMap((family) => family.examples || []))
const learningExamples = unique(Object.values(LEARNING_IRREGULAR_FAMILIES).flatMap((family) => family.examples || []))

const irregularPatternsGerunds = unique(IRREGULAR_GERUNDS.map((entry) => entry.lemma))
const irregularPatternsParticiples = unique(IRREGULAR_PARTICIPLES.map((entry) => entry.lemma))

const nonfiniteBuilderSource = fs.readFileSync(path.join(projectRoot, 'src/lib/core/nonfiniteBuilder.js'), 'utf8')
const conjugationRulesSource = fs.readFileSync(path.join(projectRoot, 'src/lib/core/conjugationRules.js'), 'utf8')

const builderGerunds = extractObjectKeysFromSource(nonfiniteBuilderSource, 'const IRREGULAR_GERUNDS')
const builderParticiples = extractObjectKeysFromSource(nonfiniteBuilderSource, 'const IRREGULAR_PARTICIPLES')
const rulesParticiples = extractObjectKeysFromSource(conjugationRulesSource, 'const irregularParticiples')

const allSources = [
  ...technicalExamples,
  ...learningExamples,
  ...irregularPatternsGerunds,
  ...irregularPatternsParticiples,
  ...builderGerunds,
  ...builderParticiples,
  ...rulesParticiples
]

const sourceCounts = toCountMap(allSources)
const duplicatedLemmas = [...sourceCounts.entries()]
  .filter(([, count]) => count >= 3)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 40)
  .map(([lemma, count]) => ({ lemma, count }))

const findings = {
  families: {
    totalTechnical: irregularFamiliesIds.length,
    totalClusters: Object.keys(IRREGULARITY_CLUSTERS).length,
    totalSimplifiedGroups: Object.keys(SIMPLIFIED_GROUPS).length,
    simplifiedNotInTechnical: diff(simplifiedFamilyIds, irregularFamiliesIds),
    clustersNotInTechnical: diff(clusterFamilyIds, irregularFamiliesIds)
  },
  overlap: {
    technicalVsLearningExamples: intersection(technicalExamples, learningExamples).length,
    gerundsPatternsVsBuilder: intersection(irregularPatternsGerunds, builderGerunds).length,
    participlesPatternsVsBuilder: intersection(irregularPatternsParticiples, builderParticiples).length,
    participlesPatternsVsRules: intersection(irregularPatternsParticiples, rulesParticiples).length
  },
  divergences: {
    gerundsOnlyInPatterns: diff(irregularPatternsGerunds, builderGerunds),
    gerundsOnlyInBuilder: diff(builderGerunds, irregularPatternsGerunds),
    participlesOnlyInPatterns: diff(irregularPatternsParticiples, builderParticiples),
    participlesOnlyInBuilder: diff(builderParticiples, irregularPatternsParticiples),
    participlesOnlyInRules: diff(rulesParticiples, irregularPatternsParticiples)
  },
  duplicatedLemmasTop: duplicatedLemmas
}

const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    technicalFamiliesFile: 'src/lib/data/irregularFamilies.js',
    learningFamiliesFile: 'src/lib/data/learningIrregularFamilies.js',
    simplifiedGroupsFile: 'src/lib/data/simplifiedFamilyGroups.js',
    irregularPatternsFile: 'src/lib/data/irregularPatterns.js',
    nonfiniteBuilderFile: 'src/lib/core/nonfiniteBuilder.js',
    conjugationRulesFile: 'src/lib/core/conjugationRules.js'
  },
  findings
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const md = [
  '# Inventario De Fuentes De Irregularidades',
  '',
  `Generado: ${report.generatedAt}`,
  '',
  '## Fuentes auditadas',
  ...Object.values(report.sources).map((source) => `- \`${source}\``),
  '',
  '## Hallazgos principales',
  `- Familias técnicas: ${findings.families.totalTechnical}`,
  `- Clusters técnicos: ${findings.families.totalClusters}`,
  `- Grupos simplificados: ${findings.families.totalSimplifiedGroups}`,
  `- Overlap ejemplos técnico vs learning: ${findings.overlap.technicalVsLearningExamples}`,
  `- Overlap gerundios (patterns vs builder): ${findings.overlap.gerundsPatternsVsBuilder}`,
  `- Overlap participios (patterns vs builder): ${findings.overlap.participlesPatternsVsBuilder}`,
  `- Overlap participios (patterns vs rules): ${findings.overlap.participlesPatternsVsRules}`,
  '',
  '## Divergencias detectadas',
  `- Gerundios solo en patterns: ${findings.divergences.gerundsOnlyInPatterns.join(', ') || 'ninguno'}`,
  `- Gerundios solo en builder: ${findings.divergences.gerundsOnlyInBuilder.join(', ') || 'ninguno'}`,
  `- Participios solo en patterns: ${findings.divergences.participlesOnlyInPatterns.join(', ') || 'ninguno'}`,
  `- Participios solo en builder: ${findings.divergences.participlesOnlyInBuilder.join(', ') || 'ninguno'}`,
  `- Participios solo en rules: ${findings.divergences.participlesOnlyInRules.join(', ') || 'ninguno'}`,
  '',
  '## Lemmas con mayor duplicación entre fuentes',
  ...findings.duplicatedLemmasTop.map((item) => `- ${item.lemma}: ${item.count} apariciones`),
  '',
  '## Recomendación inmediata',
  '- Definir una sola fuente canónica para no finitos irregulares y derivar el resto por import para eliminar drift.',
  ''
].join('\n')

fs.writeFileSync(outputMd, md, 'utf8')

console.log(`Inventario generado en:\n- ${path.relative(projectRoot, outputJson)}\n- ${path.relative(projectRoot, outputMd)}`)
