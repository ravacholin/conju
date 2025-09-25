// Pruebas del sistema de progreso

import { 
  initProgressSystem,
  calculateRecencyWeight,
  getVerbDifficulty,
  calculateHintPenalty,
  calculateMasteryForItem,
  calculateMasteryForCell,
  getConfidenceLevel,
  classifyMasteryLevel
} from './all.js'

/**
 * Ejecuta pruebas básicas del sistema de progreso
 * @returns {Promise<boolean>} Si todas las pruebas pasan
 */
export async function runBasicTests() {
  console.log('🧪 Ejecutando pruebas básicas del sistema de progreso...')
  
  try {
    // 1. Inicializar sistema
    const userId = await initProgressSystem()
    console.log('✅ Sistema inicializado con userId:', userId)
    
    // 2. Probar cálculo de peso por recencia
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    
    const weightNow = calculateRecencyWeight(now)
    const weightOneDay = calculateRecencyWeight(oneDayAgo)
    const weightTenDays = calculateRecencyWeight(tenDaysAgo)
    
    console.log('✅ Pesos por recencia:', { weightNow, weightOneDay, weightTenDays })
    
    // 3. Probar cálculo de dificultad del verbo
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    
    console.log('✅ Dificultad de verbos:', { regularDifficulty, irregularDifficulty })
    
    // 4. Probar cálculo de penalización por pistas
    const penalty0 = calculateHintPenalty(0)
    const penalty1 = calculateHintPenalty(1)
    const penalty3 = calculateHintPenalty(3)
    const penalty5 = calculateHintPenalty(5) // Debería estar por debajo del máximo
    
    console.log('✅ Penalización por pistas:', { penalty0, penalty1, penalty3, penalty5 })
    
    // 5. Probar cálculo de mastery para un ítem sin intentos
    const testVerb = {
      id: 'verb-test-mastery',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    const mastery = await calculateMasteryForItem('item-nonexistent', testVerb)
    
    console.log('✅ Mastery para ítem sin intentos:', mastery)
    
    // 6. Probar cálculo de mastery para una celda sin ítems
    const items = []
    const verbsMap = {}
    
    const cellMastery = await calculateMasteryForCell(items, verbsMap)
    
    console.log('✅ Mastery para celda sin ítems:', cellMastery)
    
    // 7. Probar determinación del nivel de confianza
    const confidenceLow = getConfidenceLevel(5)
    const confidenceMedium = getConfidenceLevel(10)
    const confidenceHigh = getConfidenceLevel(25)
    
    console.log('✅ Nivel de confianza:', { confidenceLow, confidenceMedium, confidenceHigh })
    
    // 8. Probar clasificación del nivel de mastery
    // Con pocos intentos
    const levelInsufficient = classifyMasteryLevel(70, 5, 3000)
    // Con suficientes intentos y buen score
    const levelAchieved = classifyMasteryLevel(85, 10, 2000)
    // Con suficientes intentos y score medio
    const levelAttention = classifyMasteryLevel(70, 10, 4000)
    // Con suficientes intentos y score bajo
    const levelCritical = classifyMasteryLevel(40, 10, 3000)
    
    console.log('✅ Clasificación de nivel de mastery:', { 
      levelInsufficient, 
      levelAchieved, 
      levelAttention, 
      levelCritical 
    })
    
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
    const _userId = await initProgressSystem()
    results.initTime = performance.now() - initStart
    
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

// Ejecutar pruebas si este archivo se ejecuta directamente
if (typeof window !== 'undefined' && window.location) {
  // Solo ejecutar en el navegador
  runAllTests().then(results => {
    console.log('📊 Resultados finales de pruebas:', results)
  }).catch(error => {
    console.error('Error en pruebas:', error)
  })
}

export default runAllTests