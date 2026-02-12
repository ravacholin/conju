import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const assetsDir = path.join(projectRoot, 'dist', 'assets')
const outputDir = path.join(projectRoot, 'docs', 'performance')
const outputJson = path.join(outputDir, 'baseline.json')
const outputMd = path.join(outputDir, 'baseline.md')

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

if (!fs.existsSync(assetsDir)) {
  throw new Error('No se encontro dist/assets. Ejecuta primero `npm run build`.')
}

const files = fs.readdirSync(assetsDir)
const rows = files.map((fileName) => {
  const filePath = path.join(assetsDir, fileName)
  const stats = fs.statSync(filePath)
  const extension = fileName.endsWith('.js') ? 'js' : fileName.endsWith('.css') ? 'css' : 'other'
  return {
    fileName,
    bytes: stats.size,
    extension
  }
})

const totalJsBytes = rows.filter((row) => row.extension === 'js').reduce((sum, row) => sum + row.bytes, 0)
const totalCssBytes = rows.filter((row) => row.extension === 'css').reduce((sum, row) => sum + row.bytes, 0)
const topChunks = [...rows].sort((a, b) => b.bytes - a.bytes).slice(0, 12)

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    files: rows.length,
    jsFiles: rows.filter((row) => row.extension === 'js').length,
    cssFiles: rows.filter((row) => row.extension === 'css').length,
    totalJsBytes,
    totalCssBytes,
    totalBytes: totalJsBytes + totalCssBytes
  },
  topChunks
}

ensureDir(outputDir)
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const md = [
  '# Baseline de Performance (Build)',
  '',
  `Generado: ${report.generatedAt}`,
  '',
  '## Totales',
  `- Archivos analizados: ${report.totals.files}`,
  `- JS: ${report.totals.jsFiles} archivos (${formatKb(report.totals.totalJsBytes)})`,
  `- CSS: ${report.totals.cssFiles} archivos (${formatKb(report.totals.totalCssBytes)})`,
  `- Total JS+CSS: ${formatKb(report.totals.totalBytes)}`,
  '',
  '## Top chunks por tamaño',
  ...report.topChunks.map((chunk) => `- ${chunk.fileName}: ${formatKb(chunk.bytes)} (${chunk.extension})`),
  ''
].join('\n')

fs.writeFileSync(outputMd, md, 'utf8')

console.log(`Baseline generado en:\n- ${path.relative(projectRoot, outputJson)}\n- ${path.relative(projectRoot, outputMd)}`)
