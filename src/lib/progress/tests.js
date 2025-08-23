// Pruebas para el sistema de progreso

import { 
  initProgressSystem, 
  saveVerb, 
  saveItem, 
  saveAttempt, 
  saveMastery,
  getMasteryByUser,
  calculateMasteryForItem
} from './all.js'

/**
 * Ejecuta pruebas básicas del sistema de progreso
 * @returns {Promise<boolean>} Si todas las pruebas pasaron
 */
export async function runBasicTests() {
  console.log('🧪 Ejecutando pruebas básicas del sistema de progreso...')
  
  try {
    // 1. Inicializar sistema
    const userId = await initProgressSystem()
    console.log('✅ Sistema inicializado con userId:', userId)
    
    // 2. Guardar un verbo de prueba
    const testVerb = {
      id: 'verb-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    await saveVerb(testVerb)
    console.log('✅ Verbo de prueba guardado')
    
    // 3. Guardar un ítem de prueba
    const testItem = {
      id: 'item-test',
      verbId: 'verb-test',
      mood: 'indicative',
      tense: 'pres',
      person: '1s'
    }
    
    await saveItem(testItem)
    console.log('✅ Ítem de prueba guardado')
    
    // 4. Guardar intentos de prueba
    const testAttempt1 = {
      id: 'attempt-1',
      itemId: 'item-test',
      correct: true,
      latencyMs: 2500,
      hintsUsed: 0,
      errorTags: [],
      createdAt: new Date()
    }
    
    const testAttempt2 = {
      id: 'attempt-2',
      itemId: 'item-test',
      correct: false,
      latencyMs: 3200,
      hintsUsed: 1,
      errorTags: ['persona_equivocada'],
      createdAt: new Date(Date.now() - 86400000) // Hace 1 día
    }
    
    await saveAttempt(testAttempt1)
    await saveAttempt(testAttempt2)
    console.log('✅ Intentos de prueba guardados')
    
    // 5. Calcular mastery para el ítem
    const mastery = await calculateMasteryForItem('item-test', testVerb)
    console.log('✅ Mastery calculado:', mastery)
    
    // 6. Guardar mastery
    const testMastery = {
      id: 'mastery-test',
      userId,
      mood: 'indicative',
      tense: 'pres',
      person: '1s',
      score: mastery.score,
      n: mastery.n,
      updatedAt: new Date()
    }
    
    await saveMastery(testMastery)
    console.log('✅ Mastery guardado')
    
    // 7. Obtener mastery por usuario
    const userMastery = await getMasteryByUser(userId)
    console.log('✅ Mastery por usuario obtenido:', userMastery.length, 'registros')
    
    console.log('🎉 Todas las pruebas básicas pasaron')
    return true
  } catch (error) {
    console.error('❌ Error en pruebas básicas:', error)
    return false
  }
}

/**
 * Ejecuta pruebas de rendimiento
 * @returns {Promise<Object>} Resultados de las pruebas de rendimiento
 */
export async function runPerformanceTests() {
  console.log('⚡ Ejecutando pruebas de rendimiento...')
  
  const results = {
    initTime: 0,
    saveVerbTime: 0,
    saveItemTime: 0,
    saveAttemptTime: 0,
    getMasteryTime: 0
  }
  
  try {
    // Medir tiempo de inicialización
    const initStart = performance.now()
    const userId = await initProgressSystem()
    results.initTime = performance.now() - initStart
    
    // Medir tiempo de guardado de verbo
    const verbStart = performance.now()
    await saveVerb({
      id: 'perf-verb',
      lemma: 'perf_test',
      type: 'regular',
      frequency: 'high'
    })
    results.saveVerbTime = performance.now() - verbStart
    
    // Medir tiempo de guardado de ítem
    const itemStart = performance.now()
    await saveItem({
      id: 'perf-item',
      verbId: 'perf-verb',
      mood: 'indicative',
      tense: 'pres',
      person: '1s'
    })
    results.saveItemTime = performance.now() - itemStart
    
    // Medir tiempo de guardado de intento
    const attemptStart = performance.now()
    await saveAttempt({
      id: 'perf-attempt',
      itemId: 'perf-item',
      correct: true,
      latencyMs: 2000,
      hintsUsed: 0,
      errorTags: [],
      createdAt: new Date()
    })
    results.saveAttemptTime = performance.now() - attemptStart
    
    // Medir tiempo de obtención de mastery
    const masteryStart = performance.now()
    await getMasteryByUser(userId)
    results.getMasteryTime = performance.now() - masteryStart
    
    console.log('⚡ Pruebas de rendimiento completadas:', results)
    return results
  } catch (error) {
    console.error('❌ Error en pruebas de rendimiento:', error)
    return results
  }
}

/**
 * Ejecuta todas las pruebas
 * @returns {Promise<Object>} Resultados de todas las pruebas
 */
export async function runAllTests() {
  console.log('🚀 Ejecutando todas las pruebas del sistema de progreso...')
  
  const results = {
    basicTests: false,
    performanceTests: null,
    totalTests: 0,
    passedTests: 0
  }
  
  try {
    // Ejecutar pruebas básicas
    results.basicTests = await runBasicTests()
    results.totalTests += 1
    if (results.basicTests) results.passedTests += 1
    
    // Ejecutar pruebas de rendimiento
    results.performanceTests = await runPerformanceTests()
    results.totalTests += 1
    if (results.performanceTests) results.passedTests += 1
    
    console.log(`🏁 Pruebas completadas: ${results.passedTests}/${results.totalTests} pasaron`)
    return results
  } catch (error) {
    console.error('❌ Error ejecutando todas las pruebas:', error)
    return results
  }
}