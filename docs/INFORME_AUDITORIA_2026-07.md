# Informe de auditoría de código — Spanish Conjugator

**Fecha:** 2026-07-04
**Alcance:** frontend (React 19 + Vite + Zustand), motor core y sistema de progreso (`src/lib/`), backend (`server/`, Node/Express + SQLite), build y datos.
**Método:** exploración de las tres áreas en paralelo + verificación manual en el código de los hallazgos críticos.

> Este documento es **solo diagnóstico**. No modifica código de la aplicación. Los arreglos se proponen como paso siguiente (ver sección "Plan de remediación").

---

## Resumen ejecutivo

Se encontraron **5 problemas críticos**, **5 altos**, **7 medios** y varios de higiene. Los dos más urgentes:

1. **Seguridad — bypass de autenticación en el backend.** El middleware acepta la identidad enviada en un header (`X-User-Id`) sin verificarla cuando falla el JWT. Un atacante puede leer y sobrescribir los datos de progreso de cualquier cuenta. Sumado a un secreto JWT hardcodeado como fallback y a un endpoint de "reclamo de datos huérfanos" sin verificación de propiedad.
2. **Bug funcional — doble contabilización del SRS.** Cada respuesta del drill dispara **dos** pipelines de tracking en paralelo, que actualizan el scheduler de repetición espaciada y el mastery **dos veces por intento**, corrompiendo los intervalos y las métricas de dominio.

Nota positiva: la integridad de datos de verbos pasa sin errores, el SQL del backend está parametrizado (sin inyección), el dataset pesado se carga de forma diferida (no está en el bundle inicial) y hay error boundaries en capas.

| Severidad | Cantidad | Ejemplos |
|---|---|---|
| Crítico | 5 | Bypass auth, JWT secret, claim-orphan, social sin auth, doble SRS |
| Alto | 5 | Social roto, probe IndexedDB, race de sync, Zustand global, CORS/rate-limit |
| Medio | 7 | Código muerto, sobre-ingeniería, intervals de import, componentes gigantes, leaks UI, PWA frágil, merge no determinista |
| Bajo/Higiene | ~5 | Dep muerta, ~476 console.*, backups de 16 MB, keys por índice |

---

## CRÍTICOS

### C1 — Bypass de autenticación por header `X-User-Id` / `X-API-Key`
**Archivo:** `server/src/auth.js:38-55` · **Verificado**

Cuando la verificación del JWT falla (o no se envía token), el middleware cae en un fallback que toma la identidad directamente de los headers `X-User-Id` / `X-API-Key` sin ninguna verificación, y la usa como `req.userId`.

```js
} catch (error) {
  // Fallback: accept X-User-Id or X-API-Key for progress routes without account linkage
  console.log(`⚠️ JWT verification failed. Falling back to header-based identity...`)
}
if (!userId && apiKey) { userId = apiKey.trim() }
```

Como el `user_id` de almacenamiento es el `accountId` (que se devuelve al cliente como `user.id`), un atacante que setee `X-User-Id: <accountId de la víctima>` puede **leer** (`GET /api/progress/export`) y **sobrescribir** (todos los endpoints `*/bulk`) el progreso de cualquier cuenta.

**Impacto:** toma de control / robo y corrupción de datos de cualquier usuario.
**Fix:** rechazar con 401 cuando el JWT falla; eliminar el fallback por header en producción. Si se necesita el modo "sin cuenta" para desarrollo, gatearlo tras una env var explícita de dev.

### C2 — JWT secret hardcodeado como fallback
**Archivo:** `server/src/auth-service.js:8`

```js
const JWT_SECRET = process.env.JWT_SECRET || 'spanish-conjugator-secret-key-2025'
```

Si `JWT_SECRET` no está seteado en el entorno de deploy, el servidor firma y verifica con un secreto público que está en el repo → cualquiera puede forjar tokens válidos para cualquier `accountId`.

**Fix:** fail-fast al arrancar si falta `JWT_SECRET`. Nunca embarcar un fallback.

### C3 — Robo de datos vía `POST /claim-orphan-data`
**Archivo:** `server/src/auth-routes.js:325-379`

Un usuario autenticado envía cualquier `orphanUserId` y el handler ejecuta `UPDATE <tabla> SET user_id=<miCuenta> WHERE user_id=<orphanUserId>` sobre `attempts/mastery/schedules/sessions` **sin verificar la propiedad**. Los IDs legacy son adivinables (basados en timestamp, p. ej. `user-1757116089225-znn62g8vx`), lo que convierte esto en un primitivo de robo de datos. El mismo patrón está en `POST /migrate` (`auth-routes.js:284`), aunque ahí está limitado a `account_id IS NULL`.

**Fix:** exigir verificación de propiedad antes de reasignar datos; no aceptar un `orphanUserId` arbitrario del cliente.

### C4 — Endpoints sociales sin autenticación ni validación
**Archivos:** `server/src/social-routes.js:96,245`, montados en `server/src/index.js:37`

`app.use('/api/social', socialRoutes)` se monta sin middleware de auth. Cualquiera puede enviar entradas de leaderboard con `userId`, `alias` y `xp` arbitrarios (spoofing de puntaje / suplantación) o crear challenges a nombre de cualquier `creatorId`.

**Fix:** exigir auth, derivar `userId` del token, validar el body con zod (ya es dependencia del proyecto).

### C5 — Doble contabilización del SRS por cada respuesta
**Archivos:** `src/features/drill/useProgressTracking.js:127-131,175` + `src/hooks/modules/useDrillProgress.js:208-247` + `src/lib/progress/tracking.js` · **Verificado**

`useProgressTracking.handleResult(result)` hace **dos cosas** con el mismo intento:

- **(a)** llama a `onResult(result)` → `useDrillMode.handleDrillResult` → `useDrillProgress.handleResponse`, que ejecuta `recordAttempt(...)` + `updateMastery(...)` + `scheduleNextReview(...)` (una actualización SRS/mastery completa).
- **(b)** llama a `trackAttemptSubmitted(...)` → `tracking.js` ejecuta `saveAttempt(...)` **y** `updateSchedule(...)` (otra actualización SRS).

Resultado: cada envío mueve el scheduler de repetición espaciada **dos veces** y actualiza mastery por duplicado, corrompiendo los intervalos (1d/3d/7d…) y las métricas de dominio. El lock `processingRef` de `useDrillProgress` evita la re-entrada de la ruta (a), pero **no** evita la ruta (b) paralela.

**Fix:** unificar en un solo pipeline de tracking. Recomendado: dejar `useProgressTracking` + `tracking.js` como única fuente de verdad para persistir intento + schedule + mastery, y quitar la persistencia de `useDrillProgress.handleResponse` (que quedaría solo para efectos de UI). Cubrir con un test que verifique **una sola** llamada a `updateSchedule`/`scheduleNextReview` por intento.

---

## ALTOS

### A1 — Los endpoints sociales están completamente rotos
**Archivos:** `server/src/social-routes.js` (varias líneas), `server/src/migrations/002-social-features.js:8,169`

`db.js` exporta una instancia de **better-sqlite3** (API **sincrónica**: `db.prepare().get/all/run`), pero `social-routes.js` usa la API async de node-sqlite3 (`await db.all(sql, params)`, `db.get`, `db.run`). Esos métodos no existen en la instancia → toda ruta social lanza `db.all is not a function`, se captura y devuelve 500. Además, la migración `002-social-features.js` usa `module.exports = migration` en un paquete ESM (`"type": "module"`) → `module` es `undefined` al importar y la migración nunca corre; las tablas (`leaderboard_entries`, `challenges`…) no se crean. La feature social está muerta de punta a punta.

**Fix:** reescribir `social-routes.js` con la API sincrónica de better-sqlite3; convertir la migración a ESM (`export default`) y pasarle `db` al `up(db)`. Si la feature no se va a usar aún, quitar el `app.use('/api/social', ...)` para no exponer superficie rota.

### A2 — `initDB()` abre una IndexedDB "probe" en cada llamada
**Archivo:** `src/lib/progress/database.js:159-164` · **Verificado**

```js
export async function initDB() {
  const { openDB } = await import("idb");
  if (typeof openDB === "function") {
    await openDB("progress-probe", 1, { upgrade() { } }); // ← antes del cache check
  }
  if (dbInstance) return dbInstance;
  ...
}
```

El probe corre **antes** del short-circuit `if (dbInstance) return`. Como `initDB()` se llama al inicio de casi toda operación de DB (~22 call sites: `saveToDB`, `getFromDB`, `batchSaveToDB`, `markSynced`…), cada lectura/escritura paga un `openDB` extra. Es un impuesto de performance constante sobre todo el sistema de progreso.

**Fix trivial, gran ganancia:** mover el probe **después** del check de `dbInstance`/`initPromise`, o gatearlo solo para entornos de test (parece existir para forzar mocks de `idb` en pruebas).

### A3 — Race de pérdida de datos en el sync
**Archivos:** `src/lib/progress/syncCoordinator.js:46-67`, `src/lib/progress/database.js:805-814`

- `markSynced` re-lee cada registro y le estampa `syncedAt` **después** del upload. Para stores mutables (mastery, schedules, user_settings), si el usuario modifica un registro entre el "claim/upload" y el `markSynced`, ese cambio queda marcado como sincronizado sin haberse enviado → se pierde en futuros syncs. Los `attempts` (append-only) están a salvo; los mutables no.
- `updateInDB` hace read-modify-write en **dos transacciones separadas** (`getFromDB` readonly → merge → `saveToDB` readwrite). Dos `updateInDB` concurrentes sobre el mismo id se pisan (lost update).

**Fix:** en `updateInDB`, hacer get+put dentro de una **única** transacción `readwrite`. En `markSynced`, estampar `syncedAt` solo si `updatedAt` no avanzó más allá del timestamp del claim.

### A4 — Suscripción al store completo de Zustand en ~30 componentes
**Archivos:** `state/settings.js:335-345`, y `useSettings()` sin selector en ~30 archivos

`useSettings()` sin selector se usa en al menos 30 componentes. Como `set()` bumpea `lastUpdated` en **cada** cambio de estado, todos re-renderizan ante cualquier mutación de settings. Casos concretos:

- **`useResistanceTimer.ts:39-42`**: un `setInterval(...,100)` llama a `settings.set({ resistanceMsLeft })` 10 veces por segundo → ~10 escrituras síncronas a `localStorage`/seg (vía el middleware `persist`) + re-render de todos los suscriptores globales, durante todo el modo resistencia.
- **`useProgressTracking.js:37`**: `const settings = useSettings()` y `settings` **nunca se usa** en el hook → fuerza re-render de `Drill` en cada cambio de settings, para nada.

**Fix:** suscribirse con selectores / `useShallow` (como ya hacen `AppRouter.jsx:77` y `useDrillMode.js:37`). Sacar el countdown del store persistido (usar `useState`/`useRef` local). Borrar la línea muerta en `useProgressTracking`.

### A5 — CORS permisivo, sin rate limiting, JWT de 30 días sin revocación
**Archivo:** `server/src/index.js:15-21` (+ `auth-service.js:9,277-283`)

`CORS_ORIGIN='*'` por defecto se traduce en `cors({ origin: true, credentials: true })`, que refleja cualquier origen y permite credenciales (agrava C1). No hay `express-rate-limit` en login/register/google → exposición a fuerza bruta / credential stuffing. No hay `helmet`. Los JWT duran 30 días sin refresh ni blacklist: un token filtrado vale un mes.

**Fix:** allowlist explícita de orígenes en producción; `express-rate-limit` en `/api/auth/*`; `helmet`; considerar tokens de vida más corta con refresh.

---

## MEDIOS

### M1 — Código muerto pesado
- `src/lib/core/HealthCheckSystem.js` (1.252 líneas): **sin importadores** en la app; instancia un singleton y arranca 2 `setInterval`. El archivo más grande de `core/` y completamente muerto.
- `src/lib/core/validators.js` (824 líneas): **sin importadores**; arrastra un `import` estático de `priorityVerbs.js` (669 KB) — riesgo latente de bundle si algo lo importara.
- Scripts one-off dentro de `src/`: `src/lib/utils/{cleanVerbs,cleanDuplicateVerbs,fixGerundioIssue,removeInfinitivos,infinitivoRemoval,nonfiniteFix}.js`, `src/lib/categorizationScript.js`, `src/lib/bugFixes.js`, `src/validate-data.js`.

**Fix:** eliminar. (Confirmado que `AutoRecoverySystem`, `CacheOrchestrator`, `DataIntegrityGuard`, `VerbDataRedundancyManager` **sí** se usan; `HealthCheckSystem` y `validators` no.)

### M2 — Sobre-ingeniería del acceso a datos de verbos
**Archivo:** `src/lib/core/verbDataService.js` (1.391 líneas)

`getAllVerbs()` encadena 5 subsistemas de "capas de fallback" (RedundancyManager → DataIntegrityGuard → AutoRecoverySystem → CacheOrchestrator → optimizedCache) con try/catch anidados en cada llamada, alrededor de lo que es un único array JSON estático. Cada subsistema tiene su propio `setInterval` siempre activo (p. ej. `VerbDataRedundancyManager.js:469` revalida cada 30 s). Además hay **doble cache** del mismo dataset (`verbsLazy.js` y `directDatasetCache` en `verbDataService.js`).

**Fix:** consolidar a una sola capa de cache simple; hacer el monitoreo opt-in. El bundler + una cache memoizada ya garantizan lo que esta maquinaria intenta asegurar.

### M3 — Intervals como efecto secundario de import
**Archivos:** `confidenceEngine.js:709`, `temporalIntelligence.js:807`, `dynamicGoals.js:992`, `memoryManager.js:249`, `progress/index.js:111`

Estos módulos registran `setInterval` de auto-save/cleanup **al importarse**, corran o no la feature. Solo se limpian en `beforeunload`. En tests / montajes repetidos se acumulan.

**Fix:** iniciar los timers de forma perezosa en el primer uso real; asegurar que todos sean des-registrables vía `memoryManager`.

### M4 — Componentes gigantes sin memoización
`NarrativeIntroduction.jsx` (1.492 líneas, **0** `useMemo`/`useCallback`/`React.memo`), `MeaningfulPractice.jsx` (1.399), `PronunciationPractice.jsx` (1.113), `LearningDrill.jsx` (1.082). Construyen arrays/JSX derivados grandes en cada render; combinado con A4, el costo se amplifica.

**Fix:** memoizar derivaciones costosas y dividir estos componentes (< 500 líneas según la guía del propio `CLAUDE.md`).

### M5 — Leaks y races de UI
- **speechSynthesis** nunca se cancela al desmontar (`useSpeech.ts`, `PronunciationPractice.jsx:41-92`): al navegar sigue hablando. Fix: `useEffect(() => () => window.speechSynthesis?.cancel(), [])`.
- **setTimeout sin cleanup** (`useResistanceTimer.ts:46,52,79`): `setState` tras desmontar (el timeout de explosión de 2000 ms es el peor). Fix: guardar los IDs y limpiarlos.
- **Efectos de generación de drill duplicados** que compiten (`AppRouter.jsx:158-167` vs `223-277`), ambos vía `scheduleDrillGeneration`, sin guard de concurrencia en `useDrillMode.generateNextItem`.
- **Mutación transitoria del store global** durante la generación (`useDrillMode.js:145-176`): `setSettings(activitySettings)` y restaura en `finally`; si lanza antes de restaurar, `practiceMode` queda pegado. Fix: pasar los settings de actividad como parámetros de generación en vez de round-trip por el store global.
- **Async en efectos sin cancelación** (`LearningDrill.jsx:443,697`): `setCurrentItem` al completar sin guard "is-mounted"/abort → stale setState si cambia el ítem/tiempo a mitad de vuelo.

### M6 — Configuración de PWA frágil
**Archivo:** `vite.config.js:23,25,31,64-67`
- El chunk `data-verbs` (~5 MB de datos string, minifican mal) queda justo en el límite `maximumFileSizeToCacheInBytes = 5 * 1024 * 1024`. Si el chunk minificado lo supera, **se cae silenciosamente del precache** → el dataset core no funciona offline.
- La PWA se deshabilita por completo en Node 22 → según el runner del build, se embarcan builds **sin service worker**.
- El `favicon.png` de **1,3 MB** se usa como ícono 192×192 y 512×512 del manifest y como ícono de página → penaliza install/first-paint.

**Fix:** verificar el tamaño real del chunk construido y, o bien dividir el dataset (ya existe `scripts/buildChunks.mjs`, pero el path de la app importa el monolito), o subir el límite deliberadamente; no deshabilitar la PWA por versión de Node; generar favicons por tamaño.

### M7 — Merge del servidor no determinista y sin dedup
**Archivo:** `server/src/auth-service.js:394-396,418-440`

`new Date(m.updatedAt)` con `updatedAt` indefinido produce `Invalid Date`, por lo que las comparaciones `>` siempre son false y gana arbitrariamente el primer registro visto. Los `attempts` se concatenan entre todos los userId de dispositivo **sin dedup**, así que cada `/sync/download` devuelve duplicados que crecen sin límite. (Relacionado: `mergeAccountDataLocally` del cliente no actualiza attempts existentes, ya documentado en `ARQUITECTURA_PROBLEMAS_CONOCIDOS.md`.)

**Fix:** normalizar timestamps ausentes; deduplicar attempts por id en el merge.

---

## BAJOS / Higiene

- **B1 — Dependencia muerta:** `@google/generative-ai` (`package.json:53`) no se importa en ningún lado de `src/` ni `server/` (**verificado**). Quitar.
- **B2 — Logging:** ~476 llamadas `console.*` directas en `src/` pese a la política de logger centralizado. Peores: `src/lib/cache/cachePerformanceTest.js` (35), `src/lib/categorizationScript.js` (20), `src/lib/bugFixes.js` (14), `components/learning/LearningDrill.jsx` (12). El backend loguea PII/identidad en `auth.js` con `console.log`.
- **B3 — Repo/bundle bloat:** ~16 MB de backups `verbs.js.backup-*` dentro de `src/data/`; ~40 markdowns históricos y scripts debug/one-off en el root (`debug-*.js`, `test-*.js`, `*.csv`, reportes `*.json` de cientos de KB); `scripts/` con fixers one-off y sus outputs JSON. Mover a `docs/`/git history o eliminar.
- **B4 — `.env.production` trackeado:** solo contiene valores públicos `VITE_` (el client ID de OAuth es público por diseño), **no es fuga de secreto**, pero es inconsistente con `server/.gitignore`. Agregarlo al `.gitignore` del root.
- **B5 — Keys por índice en listas dinámicas:** `CommunicativePractice.jsx:593` (chat que se agranda), `PronunciationPractice.jsx:683,925,1007,1057`, `SessionSummary.jsx:146`. Usar ids estables.
- **B6 — `server.middlewares` en `vite.config.js:133`** no es una clave válida de config de Vite → no-op silencioso. `chunkSizeWarningLimit: 3000` enmascara warnings de chunks grandes.

---

## No-problemas verificados (para ahorrar tiempo)

- `verbs.js` (5,18 MB) se carga **siempre** con `import()` dinámico → **no** está en el bundle inicial.
- SQL **parametrizado** en todo el backend de auth/progress (la única interpolación son nombres de tabla de una allowlist interna fija → no inyectable).
- `npm run validate-integrity` pasa con **0 errores / 0 warnings** (239 verbos). Los "186 errores de validación" del `CLAUDE.md` están **desactualizados**.
- Error boundaries en capas (`main.jsx` → `App` → `<Suspense>` por pantalla + `DrillErrorBoundary`), sourcemaps/terser bien gateados (sin fuga de sourcemap en prod), dashboard de progreso lazy-loaded.
- El dedup de formas en `eligibility.js:684` es O(n) con `Set` (no O(n²)); las caches por región están bien memoizadas.

---

## Plan de remediación propuesto (orden de prioridad)

| # | Bloque | Ítems | Esfuerzo aprox. |
|---|---|---|---|
| 1 | **Seguridad** | C1 (quitar fallback de header), C2 (fail-fast JWT), C3 (ownership en claim-orphan), C4 (auth social), A5 (CORS allowlist + rate limit + helmet) | 1-2 días |
| 2 | **Bug SRS doble** | C5 (unificar pipeline de tracking + test) | 1 día |
| 3 | **Quick wins perf** | A2 (probe de initDB), A4 (selectores Zustand + countdown fuera del store), B1 (dep muerta) | 1 día |
| 4 | **Limpieza** | M1 (código muerto), B3 (backups + markdowns), B2 (logger) | 1 día |
| 5 | **Media prioridad** | A3 (transacciones/markSynced), A1 (social roto), M2/M3 (sobre-ingeniería + intervals), M4/M5 (componentes + leaks UI), M6 (PWA), M7 (merge servidor) | 3-5 días |

**Sugerencia de secuencia:** empezar por el bloque 1 (riesgo de seguridad activo) y el 2 (corrompe datos de todos los usuarios activamente), que juntos son ~2-3 días y eliminan los dos riesgos más serios. Los bloques 3-4 son de bajo riesgo y alto retorno. El bloque 5 es refactor de fondo.
