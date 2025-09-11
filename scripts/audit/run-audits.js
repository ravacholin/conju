#!/usr/bin/env node
/**
 * Weekly audit runner: executes all audits and prints a compact summary.
 * Use individual scripts for detailed JSON reports.
 */
import { spawn } from 'node:child_process'

const APPLY = process.argv.includes('--apply')
const FAIL = process.argv.includes('--fail-on-findings')
const scripts = [
  { name: 'duplicates', cmd: 'node', args: ['scripts/audit/audit-duplicates.js', ...(APPLY ? ['--apply'] : []), ...(FAIL ? ['--fail-on-findings'] : [])] },
  { name: 'regularity', cmd: 'node', args: ['scripts/audit/audit-regularity.js', ...(FAIL ? ['--fail-on-findings'] : [])] },
  { name: 'irregular_consistency', cmd: 'node', args: ['scripts/audit/audit-irregular-consistency.js', ...(FAIL ? ['--fail-on-findings'] : [])] },
  { name: 'truncated_forms', cmd: 'node', args: ['scripts/find-truncated-forms.js', ...(APPLY ? ['--apply'] : []), ...(FAIL ? ['--fail-on-findings'] : [])] }
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
