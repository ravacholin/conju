// LIMPIAR CACHE Y PROBAR FILTRO
import { formFilterCache } from './src/lib/core/optimizedCache.js'

console.log("🧹 LIMPIANDO CACHE...")
console.log("Cache stats antes:", formFilterCache.getStats())

// Limpiar cache
formFilterCache.clear()

console.log("Cache stats después:", formFilterCache.getStats())
console.log("✅ Cache limpiado")

console.log("")
console.log("🎯 Ahora recarga la página en el navegador y prueba de nuevo:")
console.log("   VOS → Por tema → Indicativo → Imperfecto → Verbos Irregulares")
console.log("")
console.log("Deberías ver SOLO:")
console.log("  - ser (era)")
console.log("  - ir (iba)")  
console.log("  - ver (veía)")
console.log("")
console.log("NO deberías ver:")
console.log("  - atestiguar (regular)")
console.log("  - publicar (regular)")
console.log("  - repetir (regular)")
console.log("  - aullar (regular)")