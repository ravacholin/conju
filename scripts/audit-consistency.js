#!/usr/bin/env node
// COMPREHENSIVE consistency audit for person/mood/tense alignment
// - Verifies that every dataset form grades as correct for its own value
// - EXPANDED: Now checks all major combinations across paradigms
// - Provides detailed statistics and pattern analysis

import { verbs } from '../src/data/verbs.js'
import { getAllVerbsWithPriority } from '../src/data/priorityVerbs.js'
import { grade } from '../src/lib/core/grader.js'

// Use complete verb set (main + priority)
const allVerbs = getAllVerbsWithPriority(verbs)

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
  const stats = {}

  // EXPANDED: Focus on all major combinations
  const focusCombos = new Set([
    // Indicativo presente - todas las personas
    'indicative|pres|1s', 'indicative|pres|2s_tu', 'indicative|pres|3s',
    'indicative|pres|1p', 'indicative|pres|2p_vosotros', 'indicative|pres|3p',
    
    // Subjuntivo presente - todas las personas
    'subjunctive|subjPres|1s', 'subjunctive|subjPres|2s_tu', 'subjunctive|subjPres|3s',
    'subjunctive|subjPres|1p', 'subjunctive|subjPres|2p_vosotros', 'subjunctive|subjPres|3p',
    
    // Imperativo - formas principales
    'imperative|impAff|2s_tu', 'imperative|impAff|3s', 'imperative|impAff|1p',
    'imperative|impAff|2p_vosotros', 'imperative|impAff|3p',
    'imperative|impNeg|2s_tu', 'imperative|impNeg|3s', 'imperative|impNeg|1p',
    
    // Tiempos pasados clave
    'indicative|pretIndef|1s', 'indicative|pretIndef|3s',
    'indicative|impf|1s', 'indicative|impf|3s',
    
    // Tiempos futuros/condicionales
    'indicative|fut|1s', 'indicative|fut|3s',
    'conditional|cond|1s', 'conditional|cond|3s',
    
    // Subjuntivo imperfecto
    'subjunctive|subjImpf|1s', 'subjunctive|subjImpf|3s',
    
    // Formas no personales
    'nonfinite|inf|', 'nonfinite|ger|', 'nonfinite|part|'
  ])

  for (const verb of allVerbs) {
    for (const paradigm of verb.paradigms || []) {
      for (const f of paradigm.forms || []) {
        const key = `${f.mood}|${f.tense}|${f.person || ''}`
        if (!focusCombos.has(key)) continue
        // Skip if value missing
        if (!f.value) continue
        
        total++
        
        // Initialize stats for this combination
        if (!stats[key]) {
          stats[key] = { checked: 0, failed: 0 }
        }
        stats[key].checked++
        
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
          stats[key].failed++
        }
      }
    }
  }

  // Enhanced summary with per-combination statistics
  const summary = {
    totalVerbs: allVerbs.length,
    totalCombinations: focusCombos.size,
    formsChecked: total,
    totalFailures: failures.length,
    totalOk: total - failures.length,
    successRate: `${((total - failures.length) / total * 100).toFixed(2)}%`,
    
    // Per-combination breakdown
    combinationStats: Object.entries(stats)
      .map(([combo, data]) => ({
        combination: combo,
        checked: data.checked,
        failed: data.failed,
        successRate: `${((data.checked - data.failed) / data.checked * 100).toFixed(1)}%`
      }))
      .sort((a, b) => b.failed - a.failed),
    
    // Worst performing combinations  
    worstCombinations: Object.entries(stats)
      .filter(([, data]) => data.failed > 0)
      .sort((a, b) => b[1].failed - a[1].failed)
      .slice(0, 5)
      .map(([combo, data]) => ({ combination: combo, failures: data.failed })),
    
    failureSamples: failures.slice(0, 15)
  }
  
  console.log(JSON.stringify(summary, null, 2))
  if (failures.length > 0) globalThis.process.exitCode = 1
}

audit()

