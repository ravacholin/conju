#!/usr/bin/env node

// Test script para verificar que el sistema de chunks funciona correctamente
import { verbChunkManager } from '../src/lib/core/verbChunkManager.js'
import { generateAllFormsForRegion } from '../src/hooks/modules/DrillFormFilters.js'

async function testChunkSystem() {
  console.log('🧪 Testing Chunk System Performance\n')
  
  // Test 1: Cargar chunk core
  console.log('📦 Test 1: Loading core chunk...')
  const startTime1 = performance.now()
  
  await verbChunkManager.loadChunk('core')
  const coreVerbs = verbChunkManager.loadedChunks.get('core')
  
  const loadTime1 = performance.now() - startTime1
  console.log(`✅ Core chunk loaded: ${coreVerbs.length} verbs in ${loadTime1.toFixed(1)}ms`)
  
  // Test 2: Generar formas para A1
  console.log('\n📋 Test 2: Generating forms for A1 level...')
  const startTime2 = performance.now()
  
  const settings = { level: 'A1', practiceMode: 'mixed', region: 'la_general' }
  const forms = await generateAllFormsForRegion('la_general', settings)
  
  const loadTime2 = performance.now() - startTime2
  console.log(`✅ Forms generated: ${forms.length} forms in ${loadTime2.toFixed(1)}ms`)
  
  // Test 3: Práctica por tema
  console.log('\n🎯 Test 3: Theme-based practice...')
  const startTime3 = performance.now()
  
  const themeVerbs = await verbChunkManager.getVerbsByTheme('irregular')
  
  const loadTime3 = performance.now() - startTime3
  console.log(`✅ Theme verbs loaded: ${themeVerbs.length} verbs in ${loadTime3.toFixed(1)}ms`)
  
  // Test 4: Fallback con timeout
  console.log('\n⚡ Test 4: Fallback system...')
  const startTime4 = performance.now()
  
  const fallbackVerbs = await verbChunkManager.getVerbsWithFallback(['ser', 'estar', 'inexistente'], 500)
  
  const loadTime4 = performance.now() - startTime4
  console.log(`✅ Fallback verbs: ${fallbackVerbs.length} verbs in ${loadTime4.toFixed(1)}ms`)
  
  // Test 5: Estadísticas de rendimiento
  console.log('\n📊 Performance Stats:')
  const stats = verbChunkManager.getStats()
  console.log(`   Cache hit rate: ${stats.hitRate}`)
  console.log(`   Chunks loaded: ${stats.chunksLoaded}`)
  console.log(`   Average load time: ${stats.averageLoadTime}ms`)
  console.log(`   Loaded chunks: ${stats.loadedChunks.join(', ')}`)
  
  // Test 6: Validar target de <50ms después de warmup
  console.log('\n🎯 Test 6: Speed after warmup...')
  const runs = []
  
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    await generateAllFormsForRegion('la_general', settings)
    const time = performance.now() - start
    runs.push(time)
  }
  
  const avgTime = runs.reduce((a, b) => a + b, 0) / runs.length
  const maxTime = Math.max(...runs)
  
  console.log(`   Average time: ${avgTime.toFixed(1)}ms`)
  console.log(`   Max time: ${maxTime.toFixed(1)}ms`)
  
  if (avgTime < 50) {
    console.log(`✅ Performance target met! (${avgTime.toFixed(1)}ms < 50ms)`)
  } else {
    console.log(`⚠️  Performance target missed (${avgTime.toFixed(1)}ms >= 50ms)`)
  }
  
  // Resumen final
  console.log('\n🎉 Test Summary:')
  console.log(`   Core chunk loading: ${loadTime1.toFixed(1)}ms`)
  console.log(`   Forms generation: ${loadTime2.toFixed(1)}ms`)
  console.log(`   Theme loading: ${loadTime3.toFixed(1)}ms`)
  console.log(`   Fallback system: ${loadTime4.toFixed(1)}ms`)
  console.log(`   Warmup performance: ${avgTime.toFixed(1)}ms average`)
  
  const allTestsPassed = loadTime1 < 200 && loadTime2 < 200 && avgTime < 50
  console.log(`\n${allTestsPassed ? '✅' : '❌'} Overall: ${allTestsPassed ? 'PASSED' : 'NEEDS OPTIMIZATION'}`)
}

// Ejecutar tests
testChunkSystem().catch(console.error)