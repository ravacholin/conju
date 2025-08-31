#!/usr/bin/env node

// Script para corregir errores críticos de conjugación identificados
const fs = require('fs');
const path = require('path');

const VERBS_FILE = './src/data/verbs.js';

console.log('🔧 Iniciando corrección de errores críticos de conjugación...\n');

// Leer archivo de verbos
let verbsContent = fs.readFileSync(VERBS_FILE, 'utf8');
const { verbs } = require(path.resolve(VERBS_FILE));

let correctionsMade = 0;
let errorsFound = 0;

// Función para aplicar correcciones específicas
function applyCorrections() {
  console.log('📋 Aplicando correcciones conocidas...\n');
  
  // CORRECCIÓN 1: aprendáis mal asignado como 1p en subjunctive
  // Debe ser 2p_vosotros
  const correction1 = verbsContent.replace(
    /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "1p",\s*"value": "aprendáis"/g,
    '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "2p_vosotros",\n            "value": "aprendáis"'
  );
  
  if (correction1 !== verbsContent) {
    console.log('✅ CORRECCIÓN 1: aprendáis subjunctive 1p → 2p_vosotros');
    verbsContent = correction1;
    correctionsMade++;
  }
  
  // CORRECCIÓN 2: aprendamos mal asignado como 3s en subjunctive
  // Debe ser 1p
  const correction2 = verbsContent.replace(
    /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "3s",\s*"value": "aprendamos"/g,
    '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "1p",\n            "value": "aprendamos"'
  );
  
  if (correction2 !== verbsContent) {
    console.log('✅ CORRECCIÓN 2: aprendamos subjunctive 3s → 1p');
    verbsContent = correction2;
    correctionsMade++;
  }
}

// Función para detectar y reportar errores adicionales
function detectAdditionalErrors() {
  console.log('\n🔍 Detectando errores adicionales...\n');
  
  verbs.forEach(verb => {
    verb.paradigms?.forEach((paradigm, pIndex) => {
      paradigm.forms?.forEach((form, fIndex) => {
        
        // Patrón: formas que terminan en -áis deberían ser 2p_vosotros
        if (form.value && form.value.endsWith('áis') && form.person !== '2p_vosotros') {
          console.log(`⚠️  POSIBLE ERROR: ${verb.lemma} - "${form.value}" asignado como ${form.person} (probablemente debería ser 2p_vosotros)`);
          errorsFound++;
        }
        
        // Patrón: formas que terminan en -amos deberían ser 1p (excepto en indicativo presente)
        if (form.value && form.value.endsWith('amos') && form.person !== '1p' && 
            !(form.mood === 'indicative' && form.tense === 'pres')) {
          console.log(`⚠️  POSIBLE ERROR: ${verb.lemma} - "${form.value}" asignado como ${form.person} (probablemente debería ser 1p)`);
          errorsFound++;
        }
        
        // Patrón: formas que terminan en -an deberían ser 3p
        if (form.value && form.value.endsWith('an') && form.person !== '3p') {
          console.log(`⚠️  POSIBLE ERROR: ${verb.lemma} - "${form.value}" asignado como ${form.person} (probablemente debería ser 3p)`);
          errorsFound++;
        }
      });
    });
  });
}

// Ejecutar correcciones
applyCorrections();
detectAdditionalErrors();

// Guardar cambios si hay correcciones
if (correctionsMade > 0) {
  console.log(`\n💾 Guardando ${correctionsMade} correcciones aplicadas...`);
  fs.writeFileSync(VERBS_FILE, verbsContent, 'utf8');
  console.log('✅ Archivo actualizado exitosamente');
} else {
  console.log('\n📄 No se encontraron correcciones que aplicar');
}

console.log(`\n📊 RESUMEN:`);
console.log(`   Correcciones aplicadas: ${correctionsMade}`);
console.log(`   Errores adicionales detectados: ${errorsFound}`);

if (errorsFound > 0) {
  console.log(`\n⚠️  Se encontraron ${errorsFound} posibles errores adicionales que requieren revisión manual.`);
}

console.log('\n🎉 Script de corrección completado');