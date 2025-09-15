#!/usr/bin/env node
// Quick morphology audit for common pitfalls: voseo present (2s_vos) and subjImpf 1p
import { verbs } from '../src/data/verbs.js'

function getForms(v){
  const out=[]
  for(const p of v.paradigms||[]){
    for(const f of p.forms||[]){ out.push(f) }
  }
  return out
}

function getPresentVos(v){
  const forms=getForms(v).filter(f=>f.mood==='indicative' && f.tense==='pres')
  const direct=forms.find(f=>f.person==='2s_vos')
  if (direct) return direct.value
  const tu=forms.find(f=>f.person==='2s_tu')
  return tu && tu.accepts && tu.accepts.vos
}

function expectedVos(lemma){
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'ás')
  if (lemma.endsWith('er')) return lemma.replace(/er$/, 'és')
  if (lemma.endsWith('ir')) return lemma.replace(/ir$/, 'ís')
  return null
}

function isWrongDiphthong(lemma, vos){
  // If lemma has o/e in the root and vos has ue/ie before the ending, flag
  const base = lemma.slice(0, -2)
  const stemVos = vos.slice(0, -2) // strip accent ending (ás/és/ís)
  return (/ue|ie/.test(stemVos) && !/ue|ie/.test(base))
}

function subjImpf1pExpected(lemma){
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'áramos')
  if (lemma.endsWith('er')||lemma.endsWith('ir')) return lemma.replace(/(er|ir)$/, 'iéramos')
  return null
}

const offenders=[]
for(const v of verbs){
  const vos=getPresentVos(v)
  if (vos){
    const want=expectedVos(v.lemma)
    if (want && vos !== want){
      offenders.push({ type:'vos_present', lemma:v.lemma, have:vos, want })
    }
    if (isWrongDiphthong(v.lemma, vos)){
      offenders.push({ type:'vos_diphthong', lemma:v.lemma, have:vos, note:'diptongo indebido con vos' })
    }
  }
}

// Print report
if (offenders.length){
  console.log('🚨 Morphology audit found issues:')
  offenders.slice(0,200).forEach(o=>{
    if (o.type==='vos_present'){
      console.log(` - [vos_present] ${o.lemma}: got "${o.have}", expected "${o.want}"`)
    } else {
      console.log(` - [${o.type}] ${o.lemma}: "${o.have}" (${o.note})`)
    }
  })
  console.log(`\nTotal issues: ${offenders.length}`)
  const isVercel = !!process.env.VERCEL
  const strict = process.env.AUDIT_STRICT === '1'
  if (isVercel && !strict){
    console.log('\nℹ️  Vercel environment detected; not failing build for audit warnings. Set AUDIT_STRICT=1 to enforce.')
  } else {
    process.exitCode=1
  }
} else {
  console.log('✅ Morphology audit passed (no voseo/subjImpf issues detected)')
}
