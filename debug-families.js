// Debug para verificar familias de verbos
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { verbs } from './src/data/verbs.js'

console.log('=== VERBOS QUE APARECEN (NO DEBERÍAN) ===');
['hacer', 'venir', 'ser', 'saber', 'querer', 'haber', 'traducir', 'educar', 'comunicar'].forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma);
  if (verb) {
    const families = categorizeVerb(lemma, verb);
    console.log(`${lemma}: ${families.join(', ')}`);
  } else {
    console.log(`${lemma}: NO ENCONTRADO`);
  }
});

console.log('\n=== VERBOS QUE DEBERÍAN APARECER ===');
['pedir', 'morir', 'mentir', 'creer', 'huir', 'oír', 'dormir', 'leer', 'construir'].forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma);
  if (verb) {
    const families = categorizeVerb(lemma, verb);
    console.log(`${lemma}: ${families.join(', ')}`);
  } else {
    console.log(`${lemma}: NO ENCONTRADO`);
  }
});

console.log('\n=== FAMILIAS PEDAGÓGICAS BUSCADAS ===');
console.log('E_I_IR, O_U_GER_IR, HIATUS_Y');

console.log('\n=== FAMILIAS EXCLUIDAS ===');
console.log('PRET_UV, PRET_U, PRET_I, PRET_J, PRET_SUPPL');