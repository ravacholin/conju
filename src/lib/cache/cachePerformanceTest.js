// Performance test for ProgressDataCache
// Run this in browser console to test cache performance

import { progressDataCache } from './ProgressDataCache.js'

/**
 * Test cache performance and functionality
 */
export async function testCachePerformance() {
  console.log(' Iniciando pruebas de rendimiento del caché...')
  
  // Clear cache for clean test
  progressDataCache.clear()
  
  // Mock data loader functions
  const mockLoaders = {
    fastData: () => new Promise(resolve => {
      setTimeout(() => resolve({ data: 'fast', timestamp: Date.now() }), 50)
    }),
    slowData: () => new Promise(resolve => {
      setTimeout(() => resolve({ data: 'slow', timestamp: Date.now() }), 500)
    }),
    errorData: () => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Mock error')), 100)
    })
  }
  
  const userId = 'test-user'
  const results = {}
  
  console.log(' Test 1: Cache miss performance')
  const start1 = performance.now()
  try {
    await progressDataCache.get(`${userId}:test1`, mockLoaders.fastData, 'userStats')
    const end1 = performance.now()
    results.cacheMiss = end1 - start1
    console.log(`✅ Cache miss time: ${results.cacheMiss.toFixed(2)}ms`)
  } catch (error) {
    console.error('❌ Cache miss test failed:', error)
  }
  
  console.log(' Test 2: Cache hit performance')
  const start2 = performance.now()
  try {
    await progressDataCache.get(`${userId}:test1`, mockLoaders.fastData, 'userStats')
    const end2 = performance.now()
    results.cacheHit = end2 - start2
    console.log(`✅ Cache hit time: ${results.cacheHit.toFixed(2)}ms`)
  } catch (error) {
    console.error('❌ Cache hit test failed:', error)
  }
  
  console.log(' Test 3: Request deduplication')
  const start3 = performance.now()
  try {
    const promises = [
      progressDataCache.get(`${userId}:dedupe`, mockLoaders.slowData, 'heatMap'),
      progressDataCache.get(`${userId}:dedupe`, mockLoaders.slowData, 'heatMap'),
      progressDataCache.get(`${userId}:dedupe`, mockLoaders.slowData, 'heatMap')
    ]
    await Promise.all(promises)
    const end3 = performance.now()
    results.deduplication = end3 - start3
    console.log(`✅ Deduplication time: ${results.deduplication.toFixed(2)}ms`)
  } catch (error) {
    console.error('❌ Deduplication test failed:', error)
  }
  
  console.log(' Test 4: Error handling')
  try {
    await progressDataCache.get(`${userId}:error`, mockLoaders.errorData, 'errorIntel')
    console.log('❌ Error test should have failed')
  } catch {
    console.log('✅ Error handling working correctly')
    results.errorHandling = true
  }
  
  console.log(' Test 5: TTL expiration')
  // Set a very short TTL for testing
  progressDataCache.setTTL('testType', 100) // 100ms
  await progressDataCache.get(`${userId}:ttl`, mockLoaders.fastData, 'testType')
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const start5 = performance.now()
  await progressDataCache.get(`${userId}:ttl`, mockLoaders.fastData, 'testType')
  const end5 = performance.now()
  results.ttlExpiration = end5 - start5
  console.log(`✅ TTL expiration test: ${results.ttlExpiration.toFixed(2)}ms`)
  
  // Get final cache stats
  const stats = progressDataCache.getStats()
  
  console.log('\n RESULTADOS FINALES:')
  console.log('======================')
  console.log(`Cache miss: ${results.cacheMiss?.toFixed(2)}ms`)
  console.log(`Cache hit: ${results.cacheHit?.toFixed(2)}ms`)
  console.log(`Speedup: ${(results.cacheMiss / results.cacheHit).toFixed(1)}x faster`)
  console.log(`Deduplication: ${results.deduplication?.toFixed(2)}ms`)
  console.log(`TTL expiration: ${results.ttlExpiration?.toFixed(2)}ms`)
  console.log(`Hit rate: ${stats.hitRate}`)
  console.log(`Cache size: ${stats.cacheSize} entries`)
  console.log(`Deduped requests: ${stats.deduped}`)
  
  // Performance expectations
  const expectations = {
    cacheHitUnder5ms: results.cacheHit < 5,
    deduplicationUnder600ms: results.deduplication < 600, // Should be ~500ms, not 1500ms
    speedupOver5x: (results.cacheMiss / results.cacheHit) > 5
  }
  
  console.log('\n✅ EXPECTATIVAS DE RENDIMIENTO:')
  console.log('================================')
  console.log(`Cache hit < 5ms: ${expectations.cacheHitUnder5ms ? '✅' : '❌'}`)
  console.log(`Deduplication < 600ms: ${expectations.deduplicationUnder600ms ? '✅' : '❌'}`)
  console.log(`Speedup > 5x: ${expectations.speedupOver5x ? '✅' : '❌'}`)
  
  return {
    results,
    stats,
    expectations,
    allTestsPassed: Object.values(expectations).every(Boolean)
  }
}

/**
 * Test cache invalidation strategies
 */
export async function testCacheInvalidation() {
  console.log('️ Iniciando pruebas de invalidación del caché...')
  
  progressDataCache.clear()
  const userId = 'test-user'
  
  // Populate cache with test data
  const testLoader = () => Promise.resolve({ data: 'test-data', timestamp: Date.now() })
  
  await progressDataCache.get(`${userId}:userStats`, testLoader, 'userStats')
  await progressDataCache.get(`${userId}:heatMap`, testLoader, 'heatMap')
  await progressDataCache.get(`${userId}:recommendations`, testLoader, 'recommendations')
  await progressDataCache.get(`other-user:userStats`, testLoader, 'userStats')
  
  console.log(` Cache populated with ${progressDataCache.getStats().cacheSize} entries`)
  
  // Test user-specific invalidation
  progressDataCache.invalidateUser(userId)
  const statsAfterUserInvalidation = progressDataCache.getStats()
  console.log(`✅ After user invalidation: ${statsAfterUserInvalidation.cacheSize} entries remaining`)
  
  // Test pattern-based invalidation
  await progressDataCache.get(`${userId}:recommendations`, testLoader, 'recommendations')
  await progressDataCache.get(`another-user:recommendations`, testLoader, 'recommendations')
  
  progressDataCache.invalidate(/:recommendations$/)
  const statsAfterPatternInvalidation = progressDataCache.getStats()
  console.log(`✅ After pattern invalidation: ${statsAfterPatternInvalidation.cacheSize} entries remaining`)
  
  console.log(' Cache invalidation tests completed')
}

// Export for console testing
if (typeof window !== 'undefined') {
  window.testCachePerformance = testCachePerformance
  window.testCacheInvalidation = testCacheInvalidation
  window.getCacheStats = () => progressDataCache.getStats()
  window.clearCache = () => progressDataCache.clear()
}