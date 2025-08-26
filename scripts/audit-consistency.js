#!/usr/bin/env node
// Quick consistency audit for person/mood/tense alignment
// - Verifies that every dataset form grades as correct for its own value
// - Focus on critical combinations: subjunctive present 1p, imperative aff 1p, indicative present 1p

import { verbs } from '../src/data/verbs.js'
import { grade } from '../src/lib/core/grader.js'

const settingsBase = {
  region: 'la_general',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false,
  strict: true,
  accentTolerance: 'warn'
}

function audit() {
  let total = 0
  let failures = []

  const focusCombos = new Set([
    'subjunctive|subjPres|1p',
    'imperative|impAff|1p',
    'indicative|pres|1p'
  ])

  for (const verb of verbs) {
    for (const paradigm of verb.paradigms || []) {
      for (const f of paradigm.forms || []) {
        const key = `${f.mood}|${f.tense}|${f.person}`
        if (!focusCombos.has(key)) continue
        // Skip if value missing or nonfinite not relevant
        if (!f.value || f.mood === 'nonfinite') continue
        total++
        const expected = {
          value: f.value,
          lemma: verb.lemma,
          mood: f.mood,
          tense: f.tense,
          person: f.person,
          alt: f.alt || [],
          accepts: f.accepts || {}
        }
        const res = grade(f.value, expected, settingsBase)
        if (!res.correct) {
          failures.push({ lemma: verb.lemma, key, value: f.value, note: res.note })
        }
      }
    }
  }

  const summary = {
    checked: total,
    failures: failures.length,
    ok: total - failures.length,
    failureSamples: failures.slice(0, 10)
  }
  console.log(JSON.stringify(summary, null, 2))
  if (failures.length > 0) process.exitCode = 1
}

audit()

