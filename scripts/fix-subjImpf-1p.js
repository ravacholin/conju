#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import url from 'url'
import { verbs } from '../src/data/verbs.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VERBS_PATH = path.join(__dirname, '../src/data/verbs.js')

const accent = (ch) => ({'a':'á','e':'é','i':'í','o':'ó','u':'ú'}[ch] || ch)

function build1pFromPret3p(pret3p){
  if (!pret3p || typeof pret3p !== 'string') return null
  // Single-word only
  const token = pret3p.trim().split(/\s+/)[0]
  if (!token.endsWith('ron')) return null
  let base = token.slice(0, -3) + 'ramos' // drop 'ron', add 'ramos'
  // Accent the vowel immediately before the 'r' of 'ramos'
  const idx = base.lastIndexOf('ramos')
  if (idx > 0){
    const pre = base.slice(0, idx)
    const last = pre.slice(-1)
    const withAccent = pre.slice(0, -1) + accent(last)
    return withAccent + 'ramos'
  }
  return base
}

let src = fs.readFileSync(VERBS_PATH, 'utf8')
let applied = 0

for (const v of verbs){
  // locate forms inside source by block
  const blockRe = new RegExp(`(\\"lemma\\"\\s*:\\s*\\"${v.lemma}\\"[\\s\\S]{0,30000})`) // greedy-ish but bounded
  const m = src.match(blockRe)
  if (!m) continue
  const block = m[1]

  // Find 3p pretIndef value
  const pret3pMatch = block.match(/\{[\s\S]*?\"mood\"\s*:\s*\"indicative\"[\s\S]*?\"tense\"\s*:\s*\"pretIndef\"[\s\S]*?\"person\"\s*:\s*\"3p\"[\s\S]*?\"value\"\s*:\s*\"([^\"]+)\"/)
  const pret3p = pret3pMatch && pret3pMatch[1]
  if (!pret3p) continue
  const want = build1pFromPret3p(pret3p)
  if (!want) continue

  // Replace current 1p subjImpf if it's malformed
  const subj1pRe = /(\{[\s\S]*?\"mood\"\s*:\s*\"subjunctive\"[\s\S]*?\"tense\"\s*:\s*\"subjImpf\"[\s\S]*?\"person\"\s*:\s*\"1p\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
  const m2 = block.match(subj1pRe)
  if (!m2) continue
  const have = m2[2]
  // Skip if already matches allowed endings and not obviously wrong (quick check)
  const endsOk = /(i?éramos|áramos)$/.test(have || '')
  const wrongArOnErIr = (v.lemma.endsWith('er') || v.lemma.endsWith('ir')) && /áramos$/.test(have || '')
  if (endsOk && !wrongArOnErIr) continue

  // Apply replacement in block only
  const newBlock = block.replace(subj1pRe, `$1${want}$3`)
  if (newBlock !== block){
    src = src.replace(block, newBlock)
    applied++
  }
}

fs.writeFileSync(VERBS_PATH, src, 'utf8')
console.log(`Applied subjImpf 1p fixes: ${applied}`)

