# Plan de Optimización de Chunks y Bundle Size

## Diagnóstico Actual

### Problemas Identificados:
1. **Chunk de datos masivo**: `data-CdDy0a40.js` (1.8MB) bloquea carga inicial
2. **Imports mixtos**: `database.js` importado estática y dinámicamente
3. **Bundle monolítico**: Código y datos cargados juntos innecesariamente

### Métricas Actuales:
- Bundle principal: 280.39 kB (83.74 kB gzipped)
- Datos: 1,848.55 kB (104.43 kB gzipped)
- Progreso: 168.65 kB (44.92 kB gzipped)

## Estrategia de Optimización

### Fase 1: Separación de Datos por Demanda
**Objetivo**: Cargar solo los verbos necesarios para el nivel actual

#### Paso 1.1: Reestructurar datos de verbos
- [ ] Dividir `verbs.js` por niveles CEFR (A1, A2, B1, B2, C1, C2)
- [ ] Crear archivos separados: `verbs-a1.js`, `verbs-a2.js`, etc.
- [ ] Implementar índice ligero con metadatos básicos
- [ ] Mantener compatibility con API actual

#### Paso 1.2: Implementar carga lazy de verbos
- [ ] Crear `VerbLoader` con cache inteligente
- [ ] Implementar preloading del nivel siguiente
- [ ] Añadir loading states en UI
- [ ] Fallback para casos de fallo de carga

#### Paso 1.3: Optimizar irregular families
- [ ] Separar familias por complejidad/nivel
- [ ] Cargar solo familias relevantes por nivel
- [ ] Crear índice de patrones lingüísticos

### Fase 2: Resolución de Imports Mixtos
**Objetivo**: Eliminar duplicación de código en chunks

#### Paso 2.1: Auditar imports de database.js
- [ ] Mapear todos los archivos que importan database.js
- [ ] Identificar cuáles necesitan acceso sincrónico vs asíncrono
- [ ] Documentar dependencias críticas

#### Paso 2.2: Unificar estrategia de imports
- [ ] Convertir todos los imports estáticos a dinámicos
- [ ] Crear `DatabaseManager` con inicialización lazy
- [ ] Implementar cache compartido entre módulos
- [ ] Añadir error handling robusto

#### Paso 2.3: Refactorizar módulos afectados
- [ ] `AdaptivePracticeEngine.js` → dynamic import
- [ ] `DifficultyManager.js` → dynamic import
- [ ] `analytics.js` → dynamic import
- [ ] `mastery.js` → dynamic import
- [ ] `srs.js` → dynamic import
- [ ] Otros módulos identificados

### Fase 3: Configuración de Build Optimizada
**Objetivo**: Control manual de chunking para máximo rendimiento

#### Paso 3.1: Configurar manualChunks
- [ ] Separar vendor libraries en chunk independiente
- [ ] Agrupar módulos de progreso en chunk específico
- [ ] Crear chunk para utilidades compartidas
- [ ] Configurar chunks por feature/ruta

#### Paso 3.2: Implementar code splitting por rutas
- [ ] Lazy load componentes de progreso
- [ ] Lazy load configuraciones avanzadas
- [ ] Preload componentes críticos
- [ ] Optimizar critical path

#### Paso 3.3: Optimizar assets estáticos
- [ ] Comprimir archivos de configuración JSON
- [ ] Implementar tree shaking agresivo
- [ ] Minimizar polyfills innecesarios
- [ ] Optimizar importaciones de librerías

### Fase 4: Implementación de Cache Estratégico
**Objetivo**: Máximo aprovechamiento del cache del navegador

#### Paso 4.1: Cache de datos de verbos
- [ ] Implementar versioning de datos
- [ ] Cache persistente con IndexedDB
- [ ] Invalidación inteligente
- [ ] Sincronización background

#### Paso 4.2: Service Worker para assets
- [ ] Cache de chunks estáticos
- [ ] Estrategia cache-first para datos
- [ ] Precaching de recursos críticos
- [ ] Fallback offline básico

## Implementación Detallada

### Estructura de Archivos Propuesta:
```
src/data/
├── index.js                 // Loader principal
├── verbs/
│   ├── a1-verbs.js         // ~15 verbos básicos
│   ├── a2-verbs.js         // ~25 verbos frecuentes
│   ├── b1-verbs.js         // ~30 verbos intermedios
│   ├── b2-verbs.js         // ~20 verbos avanzados
│   └── c1-c2-verbs.js      // ~4 verbos expertos
├── families/
│   ├── basic-patterns.js   // Patrones A1-A2
│   └── advanced-patterns.js // Patrones B1+
└── metadata.js             // Índices y metadatos
```

### Configuración Vite Optimizada:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'zustand'],
          'progress': ['src/lib/progress'],
          'data-core': ['src/data/metadata.js'],
          'utils': ['src/lib/core/utils']
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
}
```

### VerbLoader Implementation:
```javascript
class VerbLoader {
  constructor() {
    this.cache = new Map()
    this.loadingPromises = new Map()
  }
  
  async loadLevel(level) {
    if (this.cache.has(level)) return this.cache.get(level)
    if (this.loadingPromises.has(level)) return this.loadingPromises.get(level)
    
    const promise = import(`./verbs/${level}-verbs.js`)
      .then(module => {
        this.cache.set(level, module.default)
        return module.default
      })
    
    this.loadingPromises.set(level, promise)
    return promise
  }
}
```

## Métricas Objetivo

### Targets de Rendimiento:
- **Initial Bundle**: < 150 kB (50 kB gzipped)
- **Data Loading**: < 2s para nivel completo
- **Cache Hit Rate**: > 90% después de primer uso
- **Time to Interactive**: < 3s en 3G
- **First Contentful Paint**: < 1.5s

### Monitorización:
- [ ] Lighthouse CI en pipeline
- [ ] Bundle analyzer en cada build
- [ ] Performance monitoring en producción
- [ ] Core Web Vitals tracking

## Cronograma Estimado

### Semana 1: Fase 1 (Separación de Datos)
- Días 1-2: Reestructurar datos de verbos
- Días 3-4: Implementar VerbLoader
- Días 5-7: Testing y optimización

### Semana 2: Fase 2 (Imports Mixtos)
- Días 1-3: Auditoría y refactoring
- Días 4-5: DatabaseManager implementation
- Días 6-7: Testing integración

### Semana 3: Fase 3 (Build Optimization)
- Días 1-2: Configurar manualChunks
- Días 3-4: Code splitting por rutas
- Días 5-7: Testing y fine-tuning

### Semana 4: Fase 4 (Cache Strategy)
- Días 1-3: Cache implementation
- Días 4-5: Service Worker
- Días 6-7: Testing final y deployment

## Riesgos y Mitigaciones

### Riesgos Técnicos:
- **Complejidad de lazy loading**: Implementar loading states robustos
- **Cache invalidation**: Versioning estratégico
- **Backward compatibility**: Mantener API actual durante transición

### Riesgos de UX:
- **Loading delays**: Preloading inteligente
- **Offline functionality**: Service Worker fallbacks
- **Error states**: Graceful degradation

## Validación de Éxito

### Criterios de Aceptación:
- [ ] Bundle inicial < 150 kB
- [ ] Tiempo de carga < 3s en 3G
- [ ] Sin regresiones funcionales
- [ ] Cache hit rate > 90%
- [ ] Lighthouse score > 90

### Testing Strategy:
- [ ] Unit tests para VerbLoader
- [ ] Integration tests para lazy loading
- [ ] Performance tests automatizados
- [ ] Cross-browser compatibility
- [ ] Mobile performance validation

---

**Nota**: Este plan requiere implementación incremental con validación continua. Cada fase debe completarse y validarse antes de proceder a la siguiente.