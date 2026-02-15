/**
 * Comprehensive audit of all vos conjugation forms (present indicative + imperative affirmative)
 *
 * Rules for vos forms:
 *
 * PRESENT INDICATIVE:
 * - -ar verbs: stem + ás (hablar → hablás)
 * - -er verbs: stem + és (comer → comés)
 * - -ir verbs: stem + ís (vivir → vivís)
 * - NO STEM CHANGES because stress falls on the ending
 *   e.g. competir → competís (NOT compitís)
 *        poder → podés (NOT puedés)
 *        sentir → sentís (NOT sintís/sentís... actually sentís IS correct because no stem change)
 *
 * IMPERATIVE AFFIRMATIVE:
 * - -ar verbs: stem + á (hablar → hablá)
 * - -er verbs: stem + é (comer → comé)
 * - -ir verbs: stem + í (vivir → viví)
 * - NO STEM CHANGES
 *
 * Known irregular vos forms (exceptions):
 * - ser → sos (present), sé (imperative)
 * - ir → vas/is (present), andá/í (imperative) - varies by region
 * - haber → has/habés (present)
 */

import { verbs } from '../src/data/verbs.js';

// Try to load priority verbs too
let priorityVerbs = [];
try {
  const mod = await import('../src/data/priorityVerbs.js');
  priorityVerbs = mod.priorityVerbs || mod.default || [];
} catch (e) {
  console.log('No priority verbs file or could not load it');
}

let missingVerbs = [];
try {
  const mod = await import('../src/data/missingVerbs.js');
  missingVerbs = mod.missingVerbs || mod.default || [];
} catch (e) {
  // ignore
}

const allVerbs = [...verbs, ...priorityVerbs, ...missingVerbs];

// Known truly irregular vos present forms
const KNOWN_IRREGULAR_VOS_PRESENT = {
  'ser': 'sos',
  'ir': true, // multiple accepted forms
  'haber': true,
};

// Known truly irregular vos imperative forms
const KNOWN_IRREGULAR_VOS_IMPERATIVE = {
  'ser': 'sé',
  'ir': true,
};

function getExpectedVosPresent(infinitive) {
  if (KNOWN_IRREGULAR_VOS_PRESENT[infinitive]) return null; // skip known irregulars

  if (infinitive.endsWith('ar')) {
    return infinitive.slice(0, -2) + 'ás';
  } else if (infinitive.endsWith('er')) {
    return infinitive.slice(0, -2) + 'és';
  } else if (infinitive.endsWith('ir') || infinitive.endsWith('ír')) {
    const stem = infinitive.endsWith('ír') ? infinitive.slice(0, -2) : infinitive.slice(0, -2);
    return stem + 'ís';
  }
  return null;
}

function getExpectedVosImperative(infinitive) {
  if (KNOWN_IRREGULAR_VOS_IMPERATIVE[infinitive]) return null;

  if (infinitive.endsWith('ar')) {
    return infinitive.slice(0, -2) + 'á';
  } else if (infinitive.endsWith('er')) {
    return infinitive.slice(0, -2) + 'é';
  } else if (infinitive.endsWith('ir') || infinitive.endsWith('ír')) {
    const stem = infinitive.endsWith('ír') ? infinitive.slice(0, -2) : infinitive.slice(0, -2);
    return stem + 'í';
  }
  return null;
}

const errors = [];
const warnings = [];
const checked = { present: 0, imperative: 0 };

for (const verb of allVerbs) {
  const infinitive = verb.lemma || verb.id;
  if (!infinitive) continue;

  for (const paradigm of (verb.paradigms || [])) {
    for (const form of (paradigm.forms || [])) {
      // Check 2s_vos present indicative
      if (form.person === '2s_vos' && form.mood === 'indicative' && form.tense === 'pres') {
        checked.present++;
        const expected = getExpectedVosPresent(infinitive);
        if (expected && form.value !== expected) {
          errors.push({
            verb: infinitive,
            type: 'present_indicative',
            field: '2s_vos value',
            got: form.value,
            expected: expected,
          });
        }
      }

      // Check 2s_tu present indicative accepts.vos cross-reference
      if (form.person === '2s_tu' && form.mood === 'indicative' && form.tense === 'pres' && form.accepts?.vos) {
        const expected = getExpectedVosPresent(infinitive);
        if (expected && form.accepts.vos !== expected) {
          errors.push({
            verb: infinitive,
            type: 'present_indicative',
            field: '2s_tu accepts.vos',
            got: form.accepts.vos,
            expected: expected,
          });
        }
      }

      // Check 2s_vos imperative affirmative
      if (form.person === '2s_vos' && form.mood === 'imperative' && form.tense === 'impAff') {
        checked.imperative++;
        const expected = getExpectedVosImperative(infinitive);
        if (expected && form.value !== expected) {
          errors.push({
            verb: infinitive,
            type: 'imperative_affirmative',
            field: '2s_vos value',
            got: form.value,
            expected: expected,
          });
        }
      }

      // Check 2s_tu imperative affirmative accepts.vos
      if (form.person === '2s_tu' && form.mood === 'imperative' && form.tense === 'impAff' && form.accepts?.vos) {
        const expected = getExpectedVosImperative(infinitive);
        if (expected && form.accepts.vos !== expected) {
          errors.push({
            verb: infinitive,
            type: 'imperative_affirmative',
            field: '2s_tu accepts.vos',
            got: form.accepts.vos,
            expected: expected,
          });
        }
      }
    }
  }
}

console.log('=== VOS CONJUGATION AUDIT REPORT ===\n');
console.log(`Total verbs scanned: ${allVerbs.length}`);
console.log(`Vos present indicative forms checked: ${checked.present}`);
console.log(`Vos imperative affirmative forms checked: ${checked.imperative}`);
console.log(`\nTotal errors found: ${errors.length}\n`);

if (errors.length > 0) {
  console.log('--- ERRORS ---\n');

  // Group by verb
  const byVerb = {};
  for (const err of errors) {
    if (!byVerb[err.verb]) byVerb[err.verb] = [];
    byVerb[err.verb].push(err);
  }

  for (const [verb, errs] of Object.entries(byVerb)) {
    console.log(`VERB: ${verb}`);
    for (const err of errs) {
      console.log(`  ${err.type} (${err.field}): got "${err.got}" expected "${err.expected}"`);
    }
    console.log('');
  }
} else {
  console.log('No errors found! All vos forms are correct.');
}

// Also output a JSON summary for programmatic use
const summary = {
  totalVerbs: allVerbs.length,
  presentChecked: checked.present,
  imperativeChecked: checked.imperative,
  totalErrors: errors.length,
  errors: errors,
};

import { writeFileSync } from 'fs';
writeFileSync('/home/user/conju/scripts/vos-audit-results.json', JSON.stringify(summary, null, 2));
console.log('\nDetailed results written to scripts/vos-audit-results.json');
