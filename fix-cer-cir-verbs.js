#!/usr/bin/env node

/**
 * Fix missing 'z' forms in -cer/-cir verbs
 * 
 * This script systematically fixes conjugation errors where -cer/-cir verbs
 * are missing the required 'z' insertion in subjunctive and imperative forms.
 * 
 * Examples: 
 * - agradecer: "agradecamos" → "agradezcamos"
 * - obedecer: "obedecamos" → "obedezcamos"
 * - merecer: "merecamos" → "merezcamos"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VERBS_PATH = './src/data/verbs.js';
const BACKUP_PATH = './src/data/verbs.js.backup-' + Date.now();

// -cer/-cir verbs that need 'z' insertion (consonant + cer/cir)
const VERBS_TO_FIX = [
  'agradecer',
  'obedecer', 
  'merecer',
  'establecer',
  'ofrecer'
];

// Forms that need 'z' insertion: all subjunctive present and imperative
const AFFECTED_FORMS = [
  // Subjunctive present
  { mood: 'subjunctive', tense: 'subjPres' },
  // Imperative affirmative  
  { mood: 'imperative', tense: 'impAff' },
  // Imperative negative
  { mood: 'imperative', tense: 'impNeg' }
];

function fixVerb(verbData, lemma) {
  let fixCount = 0;
  
  if (!verbData.regions) return fixCount;
  
  for (const regionKey in verbData.regions) {
    const region = verbData.regions[regionKey];
    if (!region.forms) continue;
    
    for (const form of region.forms) {
      // Check if this form needs fixing
      const needsFix = AFFECTED_FORMS.some(af => 
        form.mood === af.mood && form.tense === af.tense
      );
      
      if (!needsFix) continue;
      
      const ending = lemma.endsWith('cer') ? 'cer' : 'cir';
      const stem = lemma.slice(0, -3); // Remove cer/cir
      
      // Fix patterns like "agradecamos" → "agradezcamos"
      if (form.value.includes(stem + 'c') && !form.value.includes(stem + 'zc')) {
        const oldValue = form.value;
        form.value = form.value.replace(new RegExp(stem + 'c', 'g'), stem + 'zc');
        console.log(`  ✓ ${lemma} ${form.mood}/${form.tense}/${form.person}: '${oldValue}' → '${form.value}'`);
        fixCount++;
      }
      
      // Fix "no agradecamos" → "no agradezcamos" 
      if (form.value.includes(`no ${stem}c`) && !form.value.includes(`no ${stem}zc`)) {
        const oldValue = form.value;
        form.value = form.value.replace(new RegExp(`no ${stem}c`, 'g'), `no ${stem}zc`);
        console.log(`  ✓ ${lemma} ${form.mood}/${form.tense}/${form.person}: '${oldValue}' → '${form.value}'`);
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

async function main() {
  console.log('🔧 Fixing -cer/-cir verb conjugation errors...\n');
  
  // Read the verbs file
  let verbsContent;
  try {
    verbsContent = fs.readFileSync(VERBS_PATH, 'utf8');
  } catch (err) {
    console.error(`❌ Error reading ${VERBS_PATH}:`, err.message);
    process.exit(1);
  }
  
  // Create backup
  console.log(`📋 Creating backup: ${BACKUP_PATH}`);
  fs.writeFileSync(BACKUP_PATH, verbsContent);
  
  // Parse the verbs data
  let verbs;
  try {
    // Use dynamic import to load the module
    const verbsModule = await import(path.resolve(VERBS_PATH));
    verbs = verbsModule;
  } catch (err) {
    console.error(`❌ Error parsing ${VERBS_PATH}:`, err.message);
    process.exit(1);
  }
  
  let totalFixes = 0;
  
  for (const verbToFix of VERBS_TO_FIX) {
    console.log(`\n🔍 Fixing ${verbToFix}...`);
    
    const verbData = verbs.verbs.find(v => v.lemma === verbToFix);
    if (!verbData) {
      console.log(`  ⚠️  Verb '${verbToFix}' not found in database`);
      continue;
    }
    
    const fixes = fixVerb(verbData, verbToFix);
    totalFixes += fixes;
    
    if (fixes === 0) {
      console.log(`  ✅ No fixes needed for ${verbToFix}`);
    } else {
      console.log(`  ✅ Applied ${fixes} fixes to ${verbToFix}`);
    }
  }
  
  // Write the fixed data back
  if (totalFixes > 0) {
    console.log(`\n💾 Writing fixed data back to ${VERBS_PATH}...`);
    
    try {
      const fixedContent = 'export const verbs = ' + JSON.stringify(verbs.verbs, null, 2) + ';\n';
      fs.writeFileSync(VERBS_PATH, fixedContent);
      console.log(`✅ Successfully applied ${totalFixes} total fixes!`);
    } catch (err) {
      console.error(`❌ Error writing fixed data:`, err.message);
      console.log(`🔄 Restoring from backup...`);
      fs.writeFileSync(VERBS_PATH, verbsContent);
      process.exit(1);
    }
  } else {
    console.log('\n✅ No fixes were needed!');
  }
  
  console.log('\n🎉 Verb fixing complete!');
  
  // Validate the fixes
  console.log('\n🔍 Running validation...');
  try {
    const { execSync } = await import('child_process');
    execSync('node src/validate-data.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Validation passed!');
  } catch (err) {
    console.error('❌ Validation failed. Check the output above.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}