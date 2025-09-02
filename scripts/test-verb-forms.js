#!/usr/bin/env node

/**
 * Comprehensive Verb Form Testing Script
 * 
 * Tests specific verb conjugations against expected forms to prevent
 * grammar errors from entering the database.
 * 
 * Usage: node scripts/test-verb-forms.js [verb-name]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Critical test cases that must always pass
const CRITICAL_TESTS = [
  // agradecer - the original error case
  {
    verb: 'agradecer',
    mood: 'imperative', 
    tense: 'impNeg',
    person: '1p',
    expected: 'no agradezcamos',
    description: 'agradecer imperativo negativo nosotros debe ser "no agradezcamos"'
  },
  {
    verb: 'agradecer',
    mood: 'subjunctive', 
    tense: 'subjPres',
    person: '1p',
    expected: 'agradezcamos',
    description: 'agradecer subjuntivo presente nosotros debe ser "agradezcamos"'
  },
  // Other -cer verbs with consonant + cer pattern
  {
    verb: 'vencer',
    mood: 'subjunctive', 
    tense: 'subjPres',
    person: '1p',
    expected: 'venzamos',
    description: 'vencer subjuntivo presente nosotros debe ser "venzamos"'
  },
  {
    verb: 'ejercer',
    mood: 'imperative', 
    tense: 'impNeg',
    person: '1p',
    expected: 'no ejerzamos',
    description: 'ejercer imperativo negativo nosotros debe ser "no ejerzamos"'
  },
  // Vowel + cer verbs should use -zco
  {
    verb: 'conocer',
    mood: 'subjunctive', 
    tense: 'subjPres',
    person: '1p',
    expected: 'conozcamos',
    description: 'conocer subjuntivo presente nosotros debe ser "conozcamos"'
  },
  {
    verb: 'parecer',
    mood: 'imperative', 
    tense: 'impNeg',
    person: '1p',
    expected: 'no parezcamos',
    description: 'parecer imperativo negativo nosotros debe ser "no parezcamos"'
  }
];

async function loadVerbs() {
  try {
    const verbsModule = await import('../src/data/verbs.js');
    return verbsModule.verbs;
  } catch (err) {
    console.error('❌ Error loading verbs:', err.message);
    process.exit(1);
  }
}

function findVerbForm(verbs, verbName, mood, tense, person, region = 'es') {
  const verb = verbs.find(v => v.lemma === verbName);
  if (!verb) {
    return null;
  }
  
  // Check new paradigms structure
  if (verb.paradigms && verb.paradigms[0] && verb.paradigms[0].forms) {
    const form = verb.paradigms[0].forms.find(f => 
      f.mood === mood && f.tense === tense && f.person === person
    );
    return form?.value || null;
  }
  
  // Fallback to old regions structure
  if (verb.regions && verb.regions[region]) {
    const form = verb.regions[region].forms.find(f => 
      f.mood === mood && f.tense === tense && f.person === person
    );
    return form?.value || null;
  }
  
  return null;
}

function runTests(verbs, testFilter = null) {
  console.log('🧪 Running verb form tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  const testsToRun = testFilter 
    ? CRITICAL_TESTS.filter(t => t.verb === testFilter)
    : CRITICAL_TESTS;
    
  if (testsToRun.length === 0) {
    console.log(`❌ No tests found for verb: ${testFilter}`);
    return false;
  }
  
  for (const test of testsToRun) {
    const actual = findVerbForm(verbs, test.verb, test.mood, test.tense, test.person);
    
    if (actual === test.expected) {
      console.log(`✅ PASS: ${test.description}`);
      console.log(`   Expected: '${test.expected}' | Got: '${actual}'\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.description}`);
      console.log(`   Expected: '${test.expected}' | Got: '${actual || 'NOT FOUND'}'\n`);
      failed++;
    }
  }
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed! Grammar errors detected.');
    return false;
  } else {
    console.log('✅ All tests passed! No grammar errors found.');
    return true;
  }
}

async function main() {
  const verbFilter = process.argv[2];
  
  if (verbFilter) {
    console.log(`🔍 Testing specific verb: ${verbFilter}\n`);
  } else {
    console.log('🔍 Running all critical verb form tests\n');
  }
  
  const verbs = await loadVerbs();
  const success = runTests(verbs, verbFilter);
  
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}