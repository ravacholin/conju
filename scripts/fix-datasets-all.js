#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import url from 'url'
import { verbs } from '../src/data/verbs.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TARGET_FILES = [
  '../src/data/verbs.js',
  '../src/data/verbs-enriched.js',
  '../src/data/chunks/irregulars.js',
  '../src/data/chunks/common.js',
  '../src/data/chunks/core.js',
  '../src/data/chunks/advanced.js',
].map(p => path.join(__dirname, p))

const EXCEPT_VOSEO = new Set(['ser','ir','ver','dar','haber'])

function expectedVos(lemma){
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'ás')
  if (lemma.endsWith('er')) return lemma.replace(/er$/, 'és')
  if (lemma.endsWith('ir')) return lemma.replace(/ir$/, 'ís')
  return null
}

const accent = (ch) => ({'a':'á','e':'é','i':'í','o':'ó','u':'ú'}[ch] || ch)
function build1pFromPret3p(pret3p){
  if (!pret3p || typeof pret3p !== 'string') return null
  const token = pret3p.trim().split(/\s+/)[0]
  if (!token.endsWith('ron')) return null
  let base = token.slice(0, -3) + 'ramos'
  const idx = base.lastIndexOf('ramos')
  if (idx > 0){
    const pre = base.slice(0, idx)
    const last = pre.slice(-1)
    const withAccent = pre.slice(0, -1) + accent(last)
    return withAccent + 'ramos'
  }
  return base
}

// Build lookup maps from canonical verbs dataset
const PRET3P = new Map()
const VOSEO_WANT = new Map()
for (const v of verbs){
  const forms = []
  for (const p of v.paradigms||[]) for (const f of p.forms||[]) forms.push(f)
  const pret3p = forms.find(f => f.mood==='indicative' && f.tense==='pretIndef' && f.person==='3p')?.value
  if (pret3p) PRET3P.set(v.lemma, pret3p)
  const want = EXCEPT_VOSEO.has(v.lemma) ? null : expectedVos(v.lemma)
  if (want) VOSEO_WANT.set(v.lemma, want)
}

let totalApplied = 0
for (const file of TARGET_FILES){
  if (!fs.existsSync(file)) continue
  let src = fs.readFileSync(file, 'utf8')
  let appliedHere = 0

  for (const v of verbs){
    const lemma = v.lemma
    // Limit operations to the block of this lemma
    const blockRe = new RegExp(`(\\"lemma\\"\\s*:\\s*\\"${lemma}\\"[\\s\\S]{0,30000})`, 'm')
    const m = src.match(blockRe)
    if (!m) continue
    const block = m[1]
    let newBlock = block

    // Fix voseo present (2s_vos) direct value
    const wantVos = VOSEO_WANT.get(lemma)
    if (wantVos){
      const rePresOrderA = /(\{[\s\S]*?\"tense\"\s*:\s*\"pres\"[\s\S]*?\"mood\"\s*:\s*\"indicative\"[\s\S]*?\"person\"\s*:\s*\"2s_vos\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
      const rePresOrderB = /(\{[\s\S]*?\"mood\"\s*:\s*\"indicative\"[\s\S]*?\"tense\"\s*:\s*\"pres\"[\s\S]*?\"person\"\s*:\s*\"2s_vos\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
      if (rePresOrderA.test(newBlock)) newBlock = newBlock.replace(rePresOrderA, `$1${wantVos}$3`)
      else if (rePresOrderB.test(newBlock)) newBlock = newBlock.replace(rePresOrderB, `$1${wantVos}$3`)

      // Also patch accepts.vos under 2s_tu present, if present
      const reAccepts = /(\"person\"\s*:\s*\"2s_tu\"[\s\S]*?\"tense\"\s*:\s*\"pres\"[\s\S]*?\"accepts\"\s*:\s*\{[\s\S]*?\"vos\"\s*:\s*\")(.*?)(\")/
      if (reAccepts.test(newBlock)) newBlock = newBlock.replace(reAccepts, `$1${wantVos}$3`)
    }

    // Fix subjImpf 1p using pretérito 3p
    const pret3p = PRET3P.get(lemma)
    if (pret3p){
      const want1p = build1pFromPret3p(pret3p)
      if (want1p){
        const reSubj1p = /(\{[\s\S]*?\"mood\"\s*:\s*\"subjunctive\"[\s\S]*?\"tense\"\s*:\s*\"subjImpf\"[\s\S]*?\"person\"\s*:\s*\"1p\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
        // Only replace if malformed
        const m2 = newBlock.match(reSubj1p)
        if (m2){
          const have = m2[2]
          const endsOk = /(i?éramos|áramos)$/.test(have || '')
          const wrongArOnErIr = (lemma.endsWith('er') || lemma.endsWith('ir')) && /áramos$/.test(have || '')
          if (!endsOk || wrongArOnErIr){
            newBlock = newBlock.replace(reSubj1p, `$1${want1p}$3`)
          }
        }
      }
    }

    if (newBlock !== block){
      src = src.replace(block, newBlock)
      appliedHere++
    }
  }

  if (appliedHere){
    fs.writeFileSync(file, src, 'utf8')
    console.log(`✅ ${path.basename(file)}: applied ${appliedHere} fixes`)
    totalApplied += appliedHere
  } else {
    console.log(`ℹ️ ${path.basename(file)}: no changes`)
  }
}

console.log(`Done. Total fixed blocks: ${totalApplied}`)

