#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import url from 'url'
import { verbs } from '../src/data/verbs.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VERBS_PATH = path.join(__dirname, '../src/data/verbs.js')

function getForms(v){
  const out=[]
  for(const p of v.paradigms||[]){ for(const f of p.forms||[]){ out.push(f) } }
  return out
}
function getPresentVos(v){
  const forms=getForms(v).filter(f=>f.mood==='indicative' && f.tense==='pres')
  const direct=forms.find(f=>f.person==='2s_vos')
  if (direct) return { src:'direct', value:direct.value }
  const tu=forms.find(f=>f.person==='2s_tu')
  if (tu && tu.accepts && tu.accepts.vos) return { src:'accepts', value:tu.accepts.vos }
  return null
}
function expectedVos(lemma){
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'ás')
  if (lemma.endsWith('er')) return lemma.replace(/er$/, 'és')
  if (lemma.endsWith('ir')) return lemma.replace(/ir$/, 'ís')
  return null
}
const EXCEPTIONS = new Set(['ser','ir','ver','dar','haber'])

const fixes = []
for (const v of verbs){
  if (EXCEPTIONS.has(v.lemma)) continue
  const want = expectedVos(v.lemma)
  if (!want) continue
  const forms = getForms(v).filter(f=>f.mood==='indicative' && f.tense==='pres' && f.person==='2s_vos')
  for (const f of forms){
    if (f.value !== want){ fixes.push({ lemma: v.lemma, have: f.value, want }) }
  }
}

if (!fixes.length){
  console.log('No fixes needed.')
  process.exit(0)
}

let src = fs.readFileSync(VERBS_PATH, 'utf8')
let applied = 0
for (const f of fixes){
  // Replace only the specific present 2s_vos value within the block for the lemma
  const blockRegex = new RegExp(`(\\"lemma\\"\s*:\s*\\"${f.lemma}\\"[\\s\\S]{0,30000}?)`, 'm')
  const m = src.match(blockRegex)
  if (!m) continue
  const block = m[1]
  // Match a direct 2s_vos present regardless of property order
  const presentVosRegexA = /(\{[\s\S]*?\"tense\"\s*:\s*\"pres\"[\s\S]*?\"mood\"\s*:\s*\"indicative\"[\s\S]*?\"person\"\s*:\s*\"2s_vos\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
  const presentVosRegexB = /(\{[\s\S]*?\"mood\"\s*:\s*\"indicative\"[\s\S]*?\"tense\"\s*:\s*\"pres\"[\s\S]*?\"person\"\s*:\s*\"2s_vos\"[\s\S]*?\"value\"\s*:\s*\")(.*?)(\")/
  const presentAcceptsRegex = /(\"person\"\s*:\s*\"2s_tu\"[\s\S]*?\"accepts\"\s*:\s*\{[\s\S]*?\"vos\"\s*:\s*\")(.*?)(\")/
  let newBlock = block
  if (presentVosRegexA.test(block)){
    newBlock = block.replace(presentVosRegexA, `$1${f.want}$3`)
    applied++
  } else if (presentVosRegexB.test(block)){
    newBlock = block.replace(presentVosRegexB, `$1${f.want}$3`)
    applied++
  } else if (presentAcceptsRegex.test(block)){
    newBlock = block.replace(presentAcceptsRegex, `$1${f.want}$3`)
    applied++
  } else {
    continue
  }
  src = src.replace(block, newBlock)
}

fs.writeFileSync(VERBS_PATH, src, 'utf8')
console.log(`Applied ${applied} voseo present fixes`) 
if (applied === 0) process.exitCode = 1
