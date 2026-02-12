import fs from 'node:fs'
import path from 'node:path'

const outputDir = path.join(process.cwd(), 'docs', 'accessibility')
const outputJson = path.join(outputDir, 'a11y-report.json')
const outputMd = path.join(outputDir, 'a11y-report.md')

const report = {
  generatedAt: new Date().toISOString(),
  suites: [
    'src/features/progress/ProgressDashboard.a11y.test.jsx',
    'src/components/drill/DrillMode.a11y.test.jsx',
    'src/components/drill/DrillMode.keyboard.test.jsx'
  ],
  status: 'generated-after-test:a11y',
  notes: [
    'Reporte base para artefactos CI.',
    'Las violaciones detalladas se obtienen desde salida de test y backlog a11y.'
  ]
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const md = [
  '# A11y Report',
  '',
  `Generado: ${report.generatedAt}`,
  `Estado: ${report.status}`,
  '',
  '## Suites ejecutadas',
  ...report.suites.map((suite) => `- \`${suite}\``),
  '',
  '## Notas',
  ...report.notes.map((note) => `- ${note}`),
  ''
].join('\n')

fs.writeFileSync(outputMd, md, 'utf8')
console.log(`A11y report generado en:\n- ${path.relative(process.cwd(), outputJson)}\n- ${path.relative(process.cwd(), outputMd)}`)
