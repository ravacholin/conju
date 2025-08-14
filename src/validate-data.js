// Script de validación de datos para Spanish Conjugator
import { validateAllData, quickValidation } from './lib/core/validators.js'

console.log('🚀 Spanish Conjugator - Validación de Datos\n')

// Ejecutar validación rápida primero
console.log('⚡ Ejecutando validación rápida...')
const quickResult = quickValidation()

if (quickResult.isValid) {
  console.log('✅ Validación rápida exitosa\n')
  
  // Solo si la validación rápida pasa, hacer la completa
  const fullResult = validateAllData()
  
  console.log('\n' + '='.repeat(50))
  console.log('📋 RESUMEN FINAL:')
  console.log('='.repeat(50))
  
  if (fullResult.isValid) {
    console.log('🎉 TODOS LOS DATOS SON VÁLIDOS')
    console.log('✅ Listos para producción')
  } else {
    console.log('⚠️  SE ENCONTRARON PROBLEMAS')
    console.log(`❌ ${fullResult.totalErrors} errores críticos`)
    console.log(`⚠️  ${fullResult.totalWarnings} advertencias`)
    
    if (fullResult.totalErrors === 0) {
      console.log('✅ Sin errores críticos - Safe para deploy')
    } else {
      console.log('🚨 CORRECCIONES REQUERIDAS antes del deploy')
    }
  }
  
} else {
  console.log('🚨 VALIDACIÓN RÁPIDA FALLÓ')
  console.log('Errores críticos encontrados:')
  quickResult.errors.forEach(error => {
    console.log(`  - ${error}`)
  })
  console.log('\n❌ Corregir estos errores antes de continuar')
}

console.log('\n🏁 Validación completada')
process.exit(quickResult.isValid && validateAllData().totalErrors === 0 ? 0 : 1)