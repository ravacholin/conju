#!/usr/bin/env node
/**
 * Weekly audit runner: executes all audits and prints a compact summary.
 * Use individual scripts for detailed JSON reports.
 */
import { spawn } from 'node:child_process'

const scripts = [
  { name: 'duplicates', cmd: 'node', args: ['scripts/audit/audit-duplicates.js'] },
  { name: 'regularity', cmd: 'node', args: ['scripts/audit/audit-regularity.js'] },
  { name: 'irregular_consistency', cmd: 'node', args: ['scripts/audit/audit-irregular-consistency.js'] },
  { name: 'truncated_forms', cmd: 'node', args: ['scripts/find-truncated-forms.js'] }
]

let exitCode = 0

for (const s of scripts) {
  await run(s)
}

process.exit(exitCode)

function run(spec) {
  return new Promise((resolve) => {
    console.log(`\n=== AUDIT: ${spec.name} ===`)
    const ps = spawn(spec.cmd, spec.args, { stdio: 'inherit' })
    ps.on('close', (code) => {
      if (code !== 0) exitCode = 1
      resolve()
    })
  })
}

