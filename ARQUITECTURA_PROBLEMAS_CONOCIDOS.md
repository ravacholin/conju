# Problemas de Arquitectura Conocidos

Este documento describe los problemas arquitectónicos conocidos en el sistema que requieren atención futura.

## 1. Lógica de Merge Incompleta para Attempts

### Problema
La función `mergeAccountDataLocally` en `src/lib/progress/dataMerger.js` no implementa lógica de actualización para attempts existentes cuando los datos remotos son más recientes.

### Detalles Técnicos

**Comportamiento Actual:**
- Para `sessions`, `mastery` y `schedules`: El código mantiene dos arrays separados:
  - `*ToSave` para nuevos items
  - `*ToUpdate` para items existentes que necesitan actualización
- Para `attempts`: Solo existe `attemptsToSave`, no hay `attemptsToUpdate`

**Código Relevante:**
```javascript
// Lógica actual para attempts (solo guarda nuevos)
const attemptsToSave = []
for (const remoteAttempt of accountData.attempts) {
  if (!existing) { // Solo guarda si no existe
    attemptsToSave.push(localAttempt)
  }
  // No hay lógica para actualizar si el attempt ya existe
}

// Lógica para sessions (guarda nuevos Y actualiza existentes)
const sessionsToSave = []
const sessionsToUpdate = []
for (const remoteSession of accountData.sessions) {
  if (!existing) {
    sessionsToSave.push(localSession)
  } else if (shouldUpdate) {
    sessionsToUpdate.push(updatedSession) // ¡Esto falta para attempts!
  }
}
```

### Impacto

**Test Fallando:**
- `src/lib/progress/dataMergeConflicts.test.js > should prefer newer data when local and remote have same item`
- El test espera que cuando un attempt local y remoto tienen el mismo ID pero el remoto es más reciente (newer syncedAt), se actualice el local con los datos remotos.
- Actualmente, el attempt local no se actualiza, lo que lleva a inconsistencias de datos.

**Escenario Problemático:**
1. Usuario hace un attempt localmente (correct: true)
2. El mismo attempt se sincroniza desde otro dispositivo con datos diferentes (correct: false) y timestamp más reciente
3. Actualmente: El attempt local NO se actualiza, quedando con datos obsoletos
4. Esperado: El attempt local DEBERÍA actualizarse con los datos remotos más recientes

### Solución Propuesta

**Opción 1: Implementar lógica de actualización para attempts**
```javascript
// Añadir lógica similar a sessions/mastery/schedules
const attemptsToSave = []
const attemptsToUpdate = []

for (const remoteAttempt of accountData.attempts) {
  const existing = attemptMap.get(key)
  
  if (!existing) {
    // Nuevo attempt - guardar
    attemptsToSave.push(localAttempt)
  } else if (shouldUpdateBasedOnTimestamps(remoteAttempt, existing)) {
    // Attempt existente pero remoto es más reciente - actualizar
    const updatedAttempt = {
      ...existing,
      ...remoteAttempt,
      syncedAt: new Date()
    }
    attemptsToUpdate.push(updatedAttempt)
  }
  // Si existe y el local es más reciente, mantener el local (no hacer nada)
}

// Luego ejecutar batchUpdateInDB para los attempts a actualizar
if (attemptsToUpdate.length > 0) {
  const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptsToUpdate)
  results.attempts += batchResult.updated
}
```

**Opción 2: Decidir que los attempts no deberían actualizarse**
Si este comportamiento es intencional (por ejemplo, por razones pedagógicas), entonces:
- Actualizar el test para reflejar el comportamiento correcto
- Documentar claramente esta decisión de diseño

### Recomendación

**Acción Inmediata:**
- Decidir si los attempts deberían actualizarse o no (consultar con el equipo pedagógico)
- Si se decide implementar la actualización, seguir el patrón existente para sessions/mastery/schedules

**Acción a Largo Plazo:**
- Revisar la estrategia de resolución de conflictos para todos los tipos de datos
- Considerar implementar un sistema de resolución de conflictos más sofisticado
- Añadir métricas para rastrear cuántos conflictos ocurren y cómo se resuelven

### Prioridad
**Media-Alta**: Este problema puede llevar a inconsistencias de datos entre dispositivos, pero no es crítico para la funcionalidad básica.

## 2. Problemas de Acoplamiento y Testing

### Problema
Los módulos están altamente acoplados, lo que hace que los tests sean frágiles y difíciles de mantener.

### Detalles
- Múltiples módulos dependen de `PROGRESS_CONFIG`, `authBridge`, `userSettingsStore`, etc.
- Los tests requieren mockear 5-10 dependencias diferentes
- Cambios en un módulo pueden romper tests en módulos no relacionados

### Solución Parcial Implementada
Se creó `src/lib/progress/test-helpers.js` con mocks completos para:
- `createCompleteConfigMock()`
- `createCompleteAuthBridgeMock()`
- `createCompleteUserSettingsStoreMock()`

Esto ha reducido significativamente los problemas de mocks incompletos.

### Recomendación a Largo Plazo
- Implementar inyección de dependencias consistente
- Dividir la configuración monolítica en módulos más pequeños
- Reducir el estado global compartido

## 3. Problemas de IndexedDB en Tests

### Problema
Algunos tests fallan debido a problemas con IndexedDB en el entorno de testing.

### Tests Afectados
- `src/lib/progress/database.schedules.test.js`

### Solución Parcial
Se necesitaría investigar más a fondo para implementar una solución robusta.

---

**Estado Actual (14/12/2025):**
- Tests pasando: 26/27 (96% de éxito)
- Problema principal restante: Lógica de merge para attempts
- Infraestructura de testing mejorada significativamente