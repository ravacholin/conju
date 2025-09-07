#!/usr/bin/env node

// Simple audit of learning families and their examples
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data
const curriculum = JSON.parse(readFileSync(join(__dirname, 'src/data/curriculum.json'), 'utf8'));
const { getLearningFamiliesForTense, LEARNING_IRREGULAR_FAMILIES } = await import('./src/lib/data/learningIrregularFamilies.js');
const { verbs } = await import('./src/data/verbs.js');

console.log('🔍 COMPREHENSIVE LEARNING MODULE AUDIT');
console.log('=' .repeat(80));

// Extract unique tense/mood combinations 
const uniqueCombos = new Set();
curriculum.forEach(item => {
  uniqueCombos.add(`${item.mood}:${item.tense}`);
});

const combinations = Array.from(uniqueCombos).map(combo => {
  const [mood, tense] = combo.split(':');
  return { mood, tense };
});

console.log(`📊 Found ${combinations.length} unique tense/mood combinations`);
console.log(`📚 Available learning families: ${Object.keys(LEARNING_IRREGULAR_FAMILIES).length}`);

let totalIssues = 0;
const criticalIssues = [];
const warnings = [];

// Check each learning family for completeness
console.log('\n🏷️  CHECKING ALL LEARNING FAMILIES');
console.log('-'.repeat(50));

Object.values(LEARNING_IRREGULAR_FAMILIES).forEach(family => {
  console.log(`\n${family.name} (${family.id})`);
  
  // Check if family has examples
  if (!family.examples || family.examples.length === 0) {
    const issue = `❌ ${family.id}: No examples defined`;
    console.log(`  ${issue}`);
    criticalIssues.push(issue);
    totalIssues++;
    return;
  }
  
  // Check if examples exist in verb database
  const availableVerbs = family.examples
    .map(lemma => verbs.find(v => v.lemma === lemma))
    .filter(Boolean);
    
  const missingVerbs = family.examples.filter(lemma => 
    !verbs.find(v => v.lemma === lemma)
  );
  
  if (missingVerbs.length > 0) {
    const warning = `⚠️  ${family.id}: Missing ${missingVerbs.length} verbs in database: ${missingVerbs.slice(0,3).join(', ')}${missingVerbs.length > 3 ? '...' : ''}`;
    console.log(`  ${warning}`);
    warnings.push(warning);
  }
  
  if (availableVerbs.length < 3) {
    const issue = `❌ ${family.id}: Only ${availableVerbs.length} available verbs (need ≥3)`;
    console.log(`  ${issue}`);
    criticalIssues.push(issue);
    totalIssues++;
  } else {
    // Check ending distribution
    const endings = { ar: 0, er: 0, ir: 0 };
    availableVerbs.forEach(verb => {
      if (verb.lemma.endsWith('ar')) endings.ar++;
      else if (verb.lemma.endsWith('er')) endings.er++;  
      else if (verb.lemma.endsWith('ir')) endings.ir++;
    });
    
    const hasAllEndings = endings.ar > 0 && endings.er > 0 && endings.ir > 0;
    const balanceStatus = hasAllEndings ? '✅ Balanced' : '⚠️  Unbalanced';
    
    console.log(`  ✅ ${availableVerbs.length} verbs available (first 3: ${availableVerbs.slice(0,3).map(v => v.lemma).join(', ')})`);
    console.log(`  📊 Endings: -ar:${endings.ar}, -er:${endings.er}, -ir:${endings.ir} ${balanceStatus}`);
    
    if (!hasAllEndings) {
      warnings.push(`⚠️  ${family.id}: Unbalanced endings -ar:${endings.ar}, -er:${endings.er}, -ir:${endings.ir}`);
    }
  }
});

// Check tense/family mapping
console.log('\n🎯 CHECKING TENSE/FAMILY MAPPINGS');
console.log('-'.repeat(50));

combinations.forEach(combo => {
  console.log(`\n${combo.mood.toUpperCase()} ${combo.tense.toUpperCase()}`);
  
  try {
    const families = getLearningFamiliesForTense(combo.tense);
    
    if (families.length === 0) {
      console.log(`  ⚪ No irregular families - regular verbs only`);
    } else {
      console.log(`  📚 ${families.length} families available:`);
      
      families.forEach(family => {
        const availableCount = family.examples ? 
          family.examples.filter(lemma => verbs.find(v => v.lemma === lemma)).length : 0;
          
        const status = availableCount >= 3 ? '✅' : '❌';
        console.log(`    ${status} ${family.name} (${availableCount} verbs)`);
        
        if (availableCount < 3) {
          const issue = `❌ ${combo.mood}:${combo.tense} - ${family.id} insufficient verbs: ${availableCount}`;
          criticalIssues.push(issue);
          totalIssues++;
        }
      });
    }
    
  } catch (error) {
    const issue = `❌ ${combo.mood}:${combo.tense} - Error: ${error.message}`;
    console.log(`  ${issue}`);
    criticalIssues.push(issue);
    totalIssues++;
  }
});

// Final report
console.log('\n🎯 FINAL AUDIT REPORT');
console.log('=' .repeat(80));

if (criticalIssues.length === 0) {
  console.log('🎉 NO CRITICAL ISSUES FOUND!');
  console.log('✅ All learning families have sufficient verbs for selection');
  console.log('✅ All tense/mood combinations have working irregular families');
} else {
  console.log(`🚨 ${criticalIssues.length} CRITICAL ISSUES FOUND:`);
  console.log('-'.repeat(50));
  criticalIssues.forEach((issue, i) => {
    console.log(`${i+1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} WARNINGS:`);
  console.log('-'.repeat(30));
  warnings.forEach((warning, i) => {
    console.log(`${i+1}. ${warning}`);
  });
}

console.log(`\n📊 SUMMARY: ${criticalIssues.length} critical issues, ${warnings.length} warnings`);
console.log('=' .repeat(80));