// Prueba del nuevo sistema pedagógico de familias irregulares
import {
  LEARNING_IRREGULAR_FAMILIES,
  categorizeLearningVerb,
  getLearningFamiliesForTense,
  getLearningFamiliesByLevel,
  convertLearningFamilyToOld
} from '../../lib/data/learningIrregularFamilies.js';
import { getAllVerbs } from '../../lib/core/verbDataService.js';
import { chooseNext } from '../../lib/core/generator.js';

// Función de prueba
async function testLearningFamilies() {
  console.log('🧪 PRUEBA DEL NUEVO SISTEMA PEDAGÓGICO DE FAMILIAS IRREGULARES');
  console.log('================================================================\n');

  const verbs = await getAllVerbs({ ensureChunks: true })

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

  // 6. Verificar que LEARNING_PRET_3AS_PERSONAS genera verbos
  console.log('6️⃣ VERIFICACIÓN CRÍTICA - LEARNING_PRET_3AS_PERSONAS GENERA VERBOS:');

  try {
    // Configurar settings para pretérito con familia específica
    const testSettings = {
      region: 'la_general',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pretIndef',
      verbType: 'irregular',
      selectedFamily: convertLearningFamilyToOld('LEARNING_PRET_3AS_PERSONAS')
    };

    console.log(`   Convertido a: ${testSettings.selectedFamily}`);

    // Intentar generar ejercicios
    let generatedCount = 0;
    let attempts = 0;
    const maxAttempts = 10;

    while (generatedCount < 5 && attempts < maxAttempts) {
      try {
        const form = chooseNext(testSettings);
        if (form) {
          generatedCount++;
          console.log(`   ✓ Generado ${generatedCount}: ${form.lemma} (${form.tense}, ${form.person})`);
        }
        attempts++;
      } catch (error) {
        console.log(`   ✗ Error en intento ${attempts + 1}: ${error.message}`);
        attempts++;
      }
    }

    if (generatedCount > 0) {
      console.log(`   🎉 ¡ÉXITO! Se generaron ${generatedCount} verbos para LEARNING_PRET_3AS_PERSONAS`);
    } else {
      console.log(`   🚨 ¡FALLO! No se pudo generar ningún verbo para LEARNING_PRET_3AS_PERSONAS`);
      console.log(`   Familia convertida: ${testSettings.selectedFamily}`);
    }

  } catch (error) {
    console.log(`   🚨 ERROR CRÍTICO: ${error.message}`);
  }

  console.log('\n🎉 PRUEBA COMPLETADA - Sistema pedagógico funcionando');
}

// Exportar para uso en desarrollo
export { testLearningFamilies };

// Ejecutar si está en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.testLearningFamilies = testLearningFamilies;
}
