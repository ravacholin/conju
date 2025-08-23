#!/usr/bin/env node

// Script to validate the entire verb dataset for correctness and consistency.
// This script will be used to detect errors, duplicates, and inconsistencies in verb conjugations.

import { verbs } from './data/verbs.js';
import { IRREGULAR_FAMILIES } from './lib/data/irregularFamilies.js';

// Load validation logic
import { validateAllData } from './lib/core/validators.js';

console.log('🔍 Starting comprehensive verb data validation...\n');

// Run validations
const results = validateAllData();

// Exit with appropriate code
process.exit(results.isValid ? 0 : 1);