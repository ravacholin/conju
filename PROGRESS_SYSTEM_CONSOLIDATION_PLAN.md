# Plan de Consolidación del Sistema de Progreso

## Problema Actual

El directorio `src/lib/progress/` contiene **114 archivos**, creando:
- Fragmentación extrema de responsabilidades
- Código duplicado y overlapping
- Mantenibilidad crítica
- Dificultad para onboarding de desarrolladores

## Análisis de Archivos Duplicados

### 1. Sistema de Sincronización (4 implementaciones)

| Archivo | Líneas | Estado | Usado por |
|---------|--------|--------|-----------|
| `cloudSync.js` | 361 | **ACTIVO** | main.jsx, hooks, components |
| `syncCoordinator.js` | 511 | Activo | userManager/index.js |
| `enhancedCloudSync.js` | 379 | **MUERTO** | Ninguno (Fase 5+ preparatorio) |
| `SyncService.js` | 514 | A verificar | ? |
| `socialSync.js` | ? | A verificar | ? |

**Recomendación**:
- ✅ Eliminar `enhancedCloudSync.js` (código muerto)
- Consolidar `cloudSync.js` y `syncCoordinator.js` en un solo módulo
- Mover `SyncMutex.js` a `lib/utils/` (es utilidad general, no específica de progreso)

### 2. Sistema de Analytics (múltiples archivos)

```bash
src/lib/progress/analytics.js
src/lib/progress/analytics.pronunciation.test.js
src/lib/progress/analytics.heatmap.test.js
src/lib/progress/analytics.advanced.test.js
```

**Problema**: Tests mezclados con lógica de negocio, sin separación clara.

**Recomendación**:
```
src/lib/progress/analytics/
  ├── index.js (orchestration)
  ├── core.js (base analytics)
  ├── heatmap.js
  ├── pronunciation.js
  ├── advanced.js
  └── __tests__/
      ├── heatmap.test.js
      ├── pronunciation.test.js
      └── advanced.test.js
```

### 3. Sistema de Tracking/Managers (5+ archivos)

```bash
tracking.js
sessionManager.js
momentumTracker.js
planTracking.js
progressRepository.js
```

**Problema**: Responsabilidades overlapping, no está claro qué hace cada uno.

**Recomendación**: Consolidar en:
```
src/lib/progress/tracking/
  ├── index.js (unified tracking facade)
  ├── SessionTracker.js
  ├── MomentumTracker.js
  ├── PlanTracker.js
  └── ProgressRepository.js
```

### 4. Base de Datos (múltiples abstracciones)

```bash
database.js (1,330 líneas - OVERSIZED!)
progressRepository.js
dataExport.js
dataRestore.js
dataIntegrity.js
```

**Recomendación**: Refactorizar a Repository Pattern:
```
src/lib/progress/database/
  ├── index.js (DB connection & migrations)
  ├── repositories/
  │   ├── UserRepository.js
  │   ├── AttemptRepository.js
  │   ├── MasteryRepository.js
  │   └── ScheduleRepository.js
  ├── migrations/
  ├── utils/
  │   ├── export.js
  │   ├── restore.js
  │   └── integrity.js
```

## Plan de Consolidación (Fases)

### Fase 1: Limpieza Inmediata (1-2 días)
- [x] Eliminar archivos muertos (`enhancedCloudSync.js`)
- [ ] Mover utilidades generales a `lib/utils/`
- [ ] Consolidar archivos de test en `__tests__/`

### Fase 2: Reorganización de Directorios (3-5 días)
- [ ] Crear subdirectorios: `analytics/`, `tracking/`, `database/`, `sync/`
- [ ] Mover archivos a estructura propuesta
- [ ] Actualizar imports en toda la app
- [ ] Verificar que tests sigan pasando

### Fase 3: Consolidación de Lógica (1-2 semanas)
- [ ] Unificar `cloudSync.js` + `syncCoordinator.js`
- [ ] Refactorizar `database.js` (1,330 líneas) a Repository Pattern
- [ ] Consolidar tracking managers
- [ ] Eliminar código duplicado

### Fase 4: Testing Exhaustivo (1 semana)
- [ ] Verificar todos los flujos de progreso
- [ ] Testing de sincronización multi-dispositivo
- [ ] Performance testing
- [ ] Regression testing

## Métricas de Éxito

| Métrica | Actual | Objetivo | Mejora |
|---------|--------|----------|--------|
| Total de archivos | 114 | ~30 | -74% |
| Archivos >500 líneas | 3 | 0 | -100% |
| Código duplicado | Alto | Bajo | -60% |
| Tiempo de onboarding | 1 semana | 2 días | -71% |
| Cyclomatic complexity | >15 | <10 | -33% |

## Riesgos

⚠️ **ALTO RIESGO**: Sistema de progreso es crítico para la aplicación.
- Una consolidación mal hecha puede corromper datos de usuarios
- Requiere testing exhaustivo en cada paso
- Debe hacerse en feature branch con rollback plan

## Recomendación Final

**No hacer todo de una vez**. Seguir el plan por fases:
1. ✅ Eliminar código muerto (bajo riesgo)
2. Reorganizar directorios (riesgo medio, alto beneficio)
3. Consolidar lógica (alto riesgo, requiere semanas de testing)

Priorizar **estabilidad sobre velocidad**.

---

**Status**:
- Bugs críticos arreglados: ✅ Memory leak, ✅ Silent sync
- Consolidación: 🟡 En planificación
- Archivos eliminados: 1 (enhancedCloudSync.js)
- Próximos pasos: Fase 1 de consolidación

**Fecha**: 2025-10-20
