// Prueba del nuevo sistema pedagógico de familias irregulares
import { 
  LEARNING_IRREGULAR_FAMILIES,
  categorizeLearningVerb,
  getLearningFamiliesForTense,
  getLearningFamiliesByLevel
} from '../../lib/data/learningIrregularFamilies.js';
import { verbs } from '../../data/verbs.js';

// Función de prueba
function testLearningFamilies() {
  console.log('🧪 PRUEBA DEL NUEVO SISTEMA PEDAGÓGICO DE FAMILIAS IRREGULARES');
  console.log('================================================================\n');

  // 1. Probar categorización de verbos paradigmáticos
  console.log('1️⃣ CATEGORIZACIÓN DE VERBOS PARADIGMÁTICOS PEDAGÓGICOS:');
  const testVerbs = ['jugar', 'pensar', 'poder', 'tener', 'conocer', 'pedir', 'buscar', 'llegar'];
  
  testVerbs.forEach(lemma => {
    const verb = verbs.find(v => v.lemma === lemma);
    const families = categorizeLearningVerb(lemma, verb);
    console.log(`   ${lemma} → ${families.join(', ')}`);
  });

  // 2. Verificar que jugar esté separado
  console.log('\n2️⃣ VERIFICACIÓN ESPECIAL - JUGAR:');
  const jugarVerb = verbs.find(v => v.lemma === 'jugar');
  const jugarFamilies = categorizeLearningVerb('jugar', jugarVerb);
  console.log(`   jugar pertenece a: ${jugarFamilies.join(', ')}`);
  console.log(`   ✓ ¿Está incluido en LEARNING_DIPHTHONGS? ${jugarFamilies.includes('LEARNING_DIPHTHONGS') ? 'SÍ' : 'NO'}`);

  // 3. Verificar separación de YO irregulares
  console.log('\n3️⃣ VERIFICACIÓN - SEPARACIÓN DE YO IRREGULARES:');
  const yoVerbs = [
    { verb: 'tener', expectedFamily: 'LEARNING_YO_G', type: 'añade -g' },
    { verb: 'conocer', expectedFamily: 'LEARNING_YO_ZCO', type: 'añade -zco' }
  ];

  yoVerbs.forEach(({ verb: lemma, expectedFamily, type }) => {
    const verb = verbs.find(v => v.lemma === lemma);
    const families = categorizeLearningVerb(lemma, verb);
    const hasExpected = families.includes(expectedFamily);
    console.log(`   ${lemma} (${type}) → ${hasExpected ? '✓' : '✗'} ${expectedFamily}`);
  });

  // 4. Familias por nivel
  console.log('\n4️⃣ FAMILIAS POR NIVEL PEDAGÓGICO:');
  const levels = ['A1', 'A2', 'B1', 'B2'];
  levels.forEach(level => {
    const families = getLearningFamiliesByLevel(level);
    console.log(`   ${level}: ${families.length} familias disponibles`);
    families.forEach(family => {
      console.log(`      - ${family.name} (${family.paradigmatic})`);
    });
    console.log('');
  });

  // 5. Familias por tiempo
  console.log('5️⃣ FAMILIAS POR TIEMPO VERBAL:');
  const tenses = ['pres', 'pretIndef', 'subjPres'];
  tenses.forEach(tense => {
    const families = getLearningFamiliesForTense(tense);
    console.log(`   ${tense}: ${families.length} familias`);
    families.forEach(family => {
      console.log(`      - ${family.name}`);
    });
    console.log('');
  });

  console.log('🎉 PRUEBA COMPLETADA - Sistema pedagógico funcionando');
}

// Exportar para uso en desarrollo
export { testLearningFamilies };

// Ejecutar si está en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.testLearningFamilies = testLearningFamilies;
}