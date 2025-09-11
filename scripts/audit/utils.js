import { verbs as mainVerbs } from '../../src/data/verbs.js'
import { getAllVerbsWithPriority } from '../../src/data/priorityVerbs.js'

export function loadAllVerbs() {
  const all = getAllVerbsWithPriority(mainVerbs)
  return all
}

export function eachForm(verb, cb) {
  verb.paradigms?.forEach((p, pIndex) => {
    p.forms?.forEach((f, fIndex) => cb(f, pIndex, fIndex))
  })
}

export function isTruncated(lemma, value) {
  if (!lemma || !value) return false
  if (!/(?:ar|er|ir)$/.test(lemma)) return false
  const stem = lemma.slice(0, -2)
  const v = value.trim().toLowerCase()
  if (v === stem) return true
  if (v === `no ${stem}`) return true
  return false
}

export function allowedShortImperatives(lemma, form) {
  // Allow 2s_tu short imperatives: ven, ten, pon, sal
  if (form.mood === 'imperative' && form.tense === 'impAff' && form.person === '2s_tu') {
    const map = new Map([
      ['venir','ven'], ['tener','ten'], ['poner','pon'], ['salir','sal']
    ])
    const stem = map.get(lemma)
    if (stem && form.value?.trim().toLowerCase() === stem) return true
  }
  return false
}

