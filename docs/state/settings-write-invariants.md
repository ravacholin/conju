# Settings Write Invariants

Fecha: 2026-02-12

## Objetivo
Documentar reglas de orden/escritura para evitar race conditions entre:
- cambios locales de `useSettings`,
- persistencia IndexedDB,
- flush previo a sync,
- merges de settings desde servidor.

## Invariantes
1. Persistencia local coalescida:
- cambios rápidos de `useSettings` se coalescean; se persiste solo el último snapshot.

2. Escritura serial:
- no se ejecutan dos `saveUserSettings(...)` en paralelo desde la cola de settings.

3. Flush comparte el mismo pipeline:
- `flushSettings()` usa la misma cola serializada que el debounce normal.
- evita rutas de persistencia divergentes.

4. Orden temporal por `lastUpdated`:
- `saveUserSettings(...)` ignora snapshots stale (`incoming.lastUpdated < existing.lastUpdated`).
- evita overwrite fuera de orden.

5. Sync sube snapshot confirmado:
- `syncCoordinator` hace `flushSettings()` antes de `claimAndGetUnsynced(USER_SETTINGS, userId)`.

6. Estado efímero no persiste en settings:
- `currentBlock`, `reviewSessionType`, `reviewSessionFilter` se mantienen en `useSessionStore`.

## Puntos de control
- Cola: `src/state/settingsPersistence.js`
- Integración: `src/state/settings.js`
- Guard anti-stale: `src/lib/progress/database.js` (`saveUserSettings`)
- Flujo sync: `src/lib/progress/syncCoordinator.js`
- Runtime efímero: `src/state/session.js`
