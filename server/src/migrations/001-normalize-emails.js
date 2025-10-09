/**
 * Migration: Normalize all email addresses to lowercase
 *
 * This migration ensures all existing email addresses are normalized to lowercase
 * to prevent duplicate accounts with different casing and ensure case-insensitive login.
 */

import { db } from '../db.js'

export function up() {
  console.log('📧 Normalizing all email addresses to lowercase...')

  // Get all accounts
  const accounts = db.prepare('SELECT id, email FROM accounts WHERE email IS NOT NULL').all()

  let normalized = 0
  let conflicts = 0
  const conflictEmails = []

  // Track which emails exist after normalization to detect duplicates
  const normalizedEmails = new Map()

  // First pass: detect conflicts
  for (const account of accounts) {
    const normalizedEmail = account.email.toLowerCase()

    if (normalizedEmail !== account.email) {
      // Check if this normalized email would conflict with an existing one
      if (normalizedEmails.has(normalizedEmail)) {
        conflicts++
        conflictEmails.push({
          original: account.email,
          normalized: normalizedEmail,
          conflictsWith: normalizedEmails.get(normalizedEmail)
        })
      } else {
        normalizedEmails.set(normalizedEmail, account.email)
      }
    } else {
      normalizedEmails.set(normalizedEmail, account.email)
    }
  }

  if (conflicts > 0) {
    console.error(`⚠️  Found ${conflicts} email conflicts that would occur after normalization:`)
    conflictEmails.forEach(({ original, normalized, conflictsWith }) => {
      console.error(`   - "${original}" → "${normalized}" conflicts with existing "${conflictsWith}"`)
    })
    console.error('\n❌ Migration aborted. Please manually resolve duplicate accounts first.')
    throw new Error(`Email normalization would create ${conflicts} duplicate accounts`)
  }

  // Second pass: normalize emails
  db.transaction(() => {
    for (const account of accounts) {
      const normalizedEmail = account.email.toLowerCase()

      if (normalizedEmail !== account.email) {
        db.prepare('UPDATE accounts SET email = ? WHERE id = ?')
          .run(normalizedEmail, account.id)
        normalized++
      }
    }
  })()

  console.log(`✅ Normalized ${normalized} email addresses`)
  console.log(`ℹ️  ${accounts.length - normalized} emails were already lowercase`)

  return { normalized, total: accounts.length, conflicts }
}

export function down() {
  console.warn('⚠️  Cannot safely reverse email normalization migration')
  console.warn('    Original email casing was not preserved')
  throw new Error('Email normalization migration is not reversible')
}
