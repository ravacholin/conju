#!/usr/bin/env node

// Script para corrección masiva de errores sistemáticos de conjugación
const fs = require('fs');
const path = require('path');

const VERBS_FILE = './src/data/verbs.js';

console.log('🔧 Iniciando corrección masiva de errores sistemáticos...\n');

// Leer archivo de verbos
let verbsContent = fs.readFileSync(VERBS_FILE, 'utf8');
let correctionsMade = 0;

console.log('📋 Aplicando correcciones sistemáticas por patrones...\n');

// PATRÓN 1: Formas terminadas en -amos mal asignadas como 3s → 1p
const pattern1Fixes = [
  // Subjuntivo presente
  { find: /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "3s",\s*"value": "([^"]*amos)"/g, 
    replace: '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "1p",\n            "value": "$1"' },
  
  // Imperativo afirmativo
  { find: /"tense": "impAff",\s*"mood": "imperative",\s*"person": "3s",\s*"value": "([^"]*amos)"/g,
    replace: '"tense": "impAff",\n            "mood": "imperative",\n            "person": "1p",\n            "value": "$1"' },
  
  // Imperativo negativo
  { find: /"tense": "impNeg",\s*"mood": "imperative",\s*"person": "3s",\s*"value": "no ([^"]*amos)"/g,
    replace: '"tense": "impNeg",\n            "mood": "imperative",\n            "person": "1p",\n            "value": "no $1"' },
];

// PATRÓN 2: Formas terminadas en -áis mal asignadas como 1p → 2p_vosotros  
const pattern2Fixes = [
  // Subjuntivo presente
  { find: /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "1p",\s*"value": "([^"]*áis)"/g,
    replace: '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "2p_vosotros",\n            "value": "$1"' },
  
  // Imperativo negativo
  { find: /"tense": "impNeg",\s*"mood": "imperative",\s*"person": "1p",\s*"value": "no ([^"]*áis)"/g,
    replace: '"tense": "impNeg",\n            "mood": "imperative",\n            "person": "2p_vosotros",\n            "value": "no $1"' },
];

// PATRÓN 3: Formas terminadas en -an mal asignadas como 2p_vosotros → 3p
const pattern3Fixes = [
  // Subjuntivo presente
  { find: /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "2p_vosotros",\s*"value": "([^"]*an)"/g,
    replace: '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "3p",\n            "value": "$1"' },
  
  // Imperativo negativo
  { find: /"tense": "impNeg",\s*"mood": "imperative",\s*"person": "2p_vosotros",\s*"value": "no ([^"]*an)"/g,
    replace: '"tense": "impNeg",\n            "mood": "imperative",\n            "person": "3p",\n            "value": "no $1"' },
];

// Aplicar todas las correcciones
const allFixes = [...pattern1Fixes, ...pattern2Fixes, ...pattern3Fixes];

allFixes.forEach((fix, index) => {
  const beforeContent = verbsContent;
  verbsContent = verbsContent.replace(fix.find, fix.replace);
  
  if (beforeContent !== verbsContent) {
    const matches = beforeContent.match(fix.find);
    const numMatches = matches ? matches.length : 0;
    console.log(`✅ PATRÓN ${index + 1}: ${numMatches} correcciones aplicadas`);
    correctionsMade += numMatches;
  }
});

// Verificar resultados
console.log('\n🔍 Verificando resultados...');

const { verbs } = require(path.resolve('./src/data/verbs.js'));
let remainingErrors = 0;

// Re-ejecutar detección para ver errores restantes
verbs.forEach(verb => {
  verb.paradigms?.forEach(paradigm => {
    paradigm.forms?.forEach(form => {
      // Verificar patrones que deberían estar corregidos
      if (form.value && form.value.endsWith('amos') && form.person !== '1p' && 
          !(form.mood === 'indicative' && form.tense === 'pres')) {
        remainingErrors++;
      }
      
      if (form.value && form.value.endsWith('áis') && form.person !== '2p_vosotros') {
        remainingErrors++;
      }
      
      if (form.value && form.value.endsWith('an') && form.person !== '3p') {
        remainingErrors++;
      }
    });
  });
});

// Guardar cambios
if (correctionsMade > 0) {
  console.log(`\n💾 Guardando ${correctionsMade} correcciones masivas...`);
  fs.writeFileSync(VERBS_FILE, verbsContent, 'utf8');
  console.log('✅ Archivo actualizado exitosamente');
} else {
  console.log('\n📄 No se encontraron correcciones que aplicar');
}

console.log(`\n📊 RESUMEN FINAL:`);
console.log(`   Correcciones aplicadas: ${correctionsMade}`);
console.log(`   Errores restantes detectados: ${remainingErrors}`);

if (remainingErrors === 0) {
  console.log('\n🎉 ¡TODOS LOS ERRORES SISTEMÁTICOS CORREGIDOS!');
} else {
  console.log(`\n⚠️  Quedan ${remainingErrors} errores que requieren revisión adicional.`);
}

console.log('\n🎯 Corrección masiva completada');