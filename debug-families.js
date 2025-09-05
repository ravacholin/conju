// Debug script to check irregular families
import { getFamiliesForTense } from './src/lib/data/irregularFamilies.js';
import { verbs } from './src/data/verbs.js';
import { categorizeVerb } from './src/lib/data/irregularFamilies.js';

console.log('🔍 DEBUGGING IRREGULAR FAMILIES');

// Check families for present tense
console.log('\n📊 FAMILIES FOR PRESENTE (pres):');
const presentFamilies = getFamiliesForTense('pres');
presentFamilies.forEach(family => {
  console.log(`- ${family.id}: ${family.name} (${family.verbs?.length || 0} verbs)`);
});

// Check families for preterite
console.log('\n📊 FAMILIES FOR PRETÉRITO INDEFINIDO (pretIndef):');
const preteriteFamilies = getFamiliesForTense('pretIndef');
preteriteFamilies.forEach(family => {
  console.log(`- ${family.id}: ${family.name} (${family.verbs?.length || 0} verbs)`);
});

// Check specific verbs
console.log('\n🧪 TESTING SPECIFIC VERBS:');
const testVerbs = ['tener', 'proteger', 'seguir', 'hablar', 'comer'];
testVerbs.forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma);
  if (verb) {
    const families = categorizeVerb(lemma, verb);
    console.log(`${lemma}: type=${verb.type}, families=[${families.join(', ')}]`);
  } else {
    console.log(`${lemma}: NOT FOUND`);
  }
});

// Check if hablar is categorized as regular
const hablar = verbs.find(v => v.lemma === 'hablar');
console.log('\n🎯 HABLAR ANALYSIS:');
console.log(`hablar: type=${hablar?.type}, families=[${categorizeVerb('hablar', hablar).join(', ')}]`);

process.exit(0);