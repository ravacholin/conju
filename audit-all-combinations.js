#!/usr/bin/env node

// Comprehensive audit script for ALL tense/mood/family combinations in learning module
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load required modules
const curriculum = JSON.parse(readFileSync(join(__dirname, 'src/data/curriculum.json'), 'utf8'));
const { getLearningFamiliesForTense } = await import('./src/lib/data/learningIrregularFamilies.js');
const { LEARNING_IRREGULAR_FAMILIES } = await import('./src/lib/data/learningIrregularFamilies.js');
const { verbs } = await import('./src/data/verbs.js');

// Import the selectExampleVerbs function
const LearnTenseFlowModule = await import('./src/components/learning/LearnTenseFlow.jsx');

console.log('🔍 COMPREHENSIVE AUDIT: ALL LEARNING MODULE COMBINATIONS');
console.log('=' .repeat(80));

// Extract all unique tense/mood combinations from curriculum
const allCombinations = [];
curriculum.forEach(item => {
  const _combo = `${item.mood}:${item.tense}`;
  void _combo; // Variable intentionally unused for debugging
  if (!allCombinations.find(c => c.mood === item.mood && c.tense === item.tense)) {
    allCombinations.push({ mood: item.mood, tense: item.tense });
  }
});

console.log(`📊 Found ${allCombinations.length} unique tense/mood combinations in curriculum`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

// Test each combination
for (const combo of allCombinations) {
  console.log(`\n🎯 Testing ${combo.mood.toUpperCase()} ${combo.tense.toUpperCase()}`);
  console.log('-'.repeat(50));
  
  try {
    // Get available families for this tense
    const availableFamilies = getLearningFamiliesForTense(combo.tense);
    console.log(`📚 Available families: ${availableFamilies.length}`);
    
    if (availableFamilies.length === 0) {
      console.log('⚪ No irregular families available - only regular verbs');
      totalTests++;
      
      // Test regular verbs - simulate the selectExampleVerbs function logic
      const regularAr = verbs.find(v => v.lemma === 'hablar' && v.type === 'regular');
      const regularEr = verbs.find(v => v.lemma === 'comer' && v.type === 'regular');
      const regularIr = verbs.find(v => v.lemma === 'vivir' && v.type === 'regular');
      const selectedVerbs = [regularAr, regularEr, regularIr].filter(Boolean);
      
      if (selectedVerbs.length === 3) {
        console.log(`✅ Regular verbs: ${selectedVerbs.map(v => v.lemma).join(', ')}`);
        passedTests++;
      } else {
        console.log(`❌ Regular verb selection failed: only ${selectedVerbs.length} verbs`);
        failedTests++;
        issues.push(`${combo.mood}:${combo.tense} - Regular verb selection incomplete`);
      }
      continue;
    }
    
    // Test each available family
    for (const family of availableFamilies) {
      console.log(`\n  🏷️  Testing family: ${family.name} (${family.id})`);
      totalTests++;
      
      // Check if family has examples
      if (!family.examples || family.examples.length < 3) {
        console.log(`    ❌ Family ${family.id} has insufficient examples: ${family.examples?.length || 0}`);
        failedTests++;
        issues.push(`${combo.mood}:${combo.tense} - ${family.id} has insufficient examples`);
        continue;
      }
      
      console.log(`    📝 Examples available: ${family.examples.slice(0,5).join(', ')}${family.examples.length > 5 ? '...' : ''} (${family.examples.length} total)`);
      
      // Check if examples exist in verb database
      const availableVerbs = family.examples
        .map(lemma => verbs.find(v => v.lemma === lemma))
        .filter(Boolean);
        
      if (availableVerbs.length < 3) {
        console.log(`    ❌ Family ${family.id} has insufficient verbs in database: ${availableVerbs.length}`);
        failedTests++;
        issues.push(`${combo.mood}:${combo.tense} - ${family.id} insufficient verbs in database`);
        continue;
      }
      
      console.log(`    ✅ Available verbs: ${availableVerbs.slice(0,3).map(v => v.lemma).join(', ')}`);
      
      // Test ending distribution (ar/er/ir)
      const endings = { ar: 0, er: 0, ir: 0 };
      availableVerbs.forEach(verb => {
        if (verb.lemma.endsWith('ar')) endings.ar++;
        else if (verb.lemma.endsWith('er')) endings.er++;
        else if (verb.lemma.endsWith('ir')) endings.ir++;
      });
      
      const hasDistribution = endings.ar > 0 && endings.er > 0 && endings.ir > 0;
      console.log(`    📊 Ending distribution: -ar:${endings.ar}, -er:${endings.er}, -ir:${endings.ir} ${hasDistribution ? '✅' : '⚠️'}`);
      
      passedTests++;
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${combo.mood}:${combo.tense}: ${error.message}`);
    failedTests++;
    issues.push(`${combo.mood}:${combo.tense} - Error: ${error.message}`);
  }
}

console.log('\n🎯 AUDIT RESULTS');
console.log('=' .repeat(80));
console.log(`📊 Total tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);

if (issues.length > 0) {
  console.log('\n🚨 ISSUES FOUND:');
  console.log('-'.repeat(50));
  issues.forEach((issue, i) => {
    console.log(`${i+1}. ${issue}`);
  });
} else {
  console.log('\n🎉 NO ISSUES FOUND - All combinations look good!');
}

console.log('\n' + '=' .repeat(80));