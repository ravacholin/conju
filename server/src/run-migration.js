#!/usr/bin/env node

/**
 * Migration Runner
 *
 * Usage:
 *   node server/src/run-migration.js <migration-name>
 *
 * Example:
 *   node server/src/run-migration.js 001-normalize-emails
 */

import { migrate as initDb } from './db.js'

// Initialize database first
initDb()

const migrationName = process.argv[2]

if (!migrationName) {
  console.error('❌ Migration name required')
  console.log('Usage: node server/src/run-migration.js <migration-name>')
  console.log('Example: node server/src/run-migration.js 001-normalize-emails')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log(`\n🚀 Running migration: ${migrationName}\n`)

    const migration = await import(`./migrations/${migrationName}.js`)

    if (!migration.up) {
      throw new Error('Migration must export an "up" function')
    }

    const result = migration.up()

    console.log('\n✅ Migration completed successfully\n')
    if (result) {
      console.log('Results:', result)
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
