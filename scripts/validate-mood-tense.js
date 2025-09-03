#!/usr/bin/env node

// Script de validación automática de integridad mood/tense
// Detecta problemas de mapeo antes de que lleguen al usuario

import { generateIntegrityReport } from '../src/lib/utils/moodTenseValidator.js';
import { getMasteryByUser } from '../src/lib/progress/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function validateMoodTenseIntegrity() {
  console.log('🔍 Ejecutando validación de integridad mood/tense...\n');
  
  try {
    // Simular algunos datos de ejemplo para la validación
    const mockData = [
      { mood: 'indicativo', tense: 'presente' },
      { mood: 'indicativo', tense: 'preterito_perfecto_simple' },
      { mood: 'imperativo', tense: 'imperativo_afirmativo' },
      { mood: 'imperativo', tense: 'imperativo_negativo' },
      { mood: 'subjuntivo', tense: 'presente_subjuntivo' },
      { mood: 'condicional', tense: 'condicional_simple' },
      // Agregar algunos casos que podrían fallar
      { mood: 'indicative', tense: 'pres' }, // formato inglés
      { mood: 'subjunctive', tense: 'subjPres' }, // formato corto
    ];
    
    const report = generateIntegrityReport(mockData);
    
    console.log('📊 REPORTE DE INTEGRIDAD MOOD/TENSE');
    console.log('=====================================');
    console.log(`Combinaciones totales: ${report.totalCombinations}`);
    console.log(`Combinaciones válidas: ${report.validCombinations}`);
    console.log(`Combinaciones inválidas: ${report.invalidCombinations}`);
    console.log(`Puntuación de integridad: ${report.integrityScore}%\n`);
    
    if (report.invalidCombinations > 0) {
      console.log('❌ PROBLEMAS DETECTADOS:');
      console.log('========================');
      
      for (const invalid of report.invalidDetails) {
        console.log(`• Mood: "${invalid.mood}", Tense: "${invalid.tense}"`);
        for (const error of invalid.errors) {
          console.log(`  - ${error}`);
        }
      }
      
      if (report.missingMappings.moods.length > 0) {
        console.log(`\n🚫 Moods faltantes: ${report.missingMappings.moods.join(', ')}`);
      }
      
      if (report.missingMappings.tenses.length > 0) {
        console.log(`🚫 Tenses faltantes: ${report.missingMappings.tenses.join(', ')}`);
      }
      
      console.log('\n⚠️  Se requieren correcciones en verbLabels.js');
      
      // Guardar reporte para revisión
      const reportPath = path.join(__dirname, '..', 'mood-tense-validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Reporte guardado en: ${reportPath}`);
      
      process.exit(1); // Fallar el proceso si hay problemas
    } else {
      console.log('✅ Todos los mapeos mood/tense son válidos');
      console.log('🎉 Integridad del sistema confirmada\n');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando validación:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Función para validar datos reales de progreso (si están disponibles)
async function validateRealProgressData() {
  try {
    console.log('🔍 Validando datos reales de progreso...');
    
    // Esto requeriría conexión a la base de datos en un entorno real
    // Por ahora solo mostramos que el framework está listo
    console.log('⚠️  Validación de datos reales requiere conexión a base de datos');
    console.log('📋 Framework de validación instalado y listo\n');
    
  } catch (error) {
    console.log('⚠️  No se pueden validar datos reales sin base de datos inicializada');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateMoodTenseIntegrity()
    .then(() => validateRealProgressData())
    .catch(error => {
      console.error('Error fatal en validación:', error);
      process.exit(1);
    });
}