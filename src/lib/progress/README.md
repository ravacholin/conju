# Spanish Conjugator - Sistema de Progreso y Analíticas

## Documentación Técnica Completa

### 📚 **Tabla de Contenidos**

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelos de Datos](#modelos-de-datos)
4. [Base de Datos](#base-de-datos)
5. [Cálculo de Mastery](#cálculo-de-mastery)
6. [Tracking de Eventos](#tracking-de-eventos)
7. [Sistema SRS](#sistema-srs)
8. [Clasificación de Errores](#clasificación-de-errores)
9. [Vistas Analíticas](#vistas-analíticas)
10. [Modo Docente](#modo-docente)
11. [Diagnóstico y Recalibración](#diagnóstico-y-recalibración)
12. [Sincronización con la Nube](#sincronización-con-la-nube)
13. [Privacidad y Consentimiento](#privacidad-y-consentimiento)
14. [Integración con Drill](#integración-con-drill)
15. [Pruebas](#pruebas)
16. [API](#api)
17. [Configuración](#configuración)
18. [Instalación y Uso](#instalación-y-uso)

---

### 🎯 **Visión General**

El sistema de progreso y analíticas para el conjugador de español está diseñado para evaluar y seguir el desempeño del usuario en la conjugación de verbos en español. El sistema funciona local-first con sincronización opcional a la nube, respetando la privacidad del usuario.

#### Características Principales

- **Medición avanzada** por persona, tiempo y modo
- **Cálculo de mastery scores** con fórmula avanzada
- **Tracking de eventos** y clasificación de errores
- **Práctica adaptativa** con SRS (Spaced Repetition System)
- **Vistas analíticas** (mapa de calor, radar de competencias)
- **Modo docente** con exportación
- **Integración completa** con Drill
- **Documentación exhaustiva** y pruebas unitarias
- **Fase 3**: planes de estudio personalizados, modo experto del SRS, analítica avanzada, funciones sociales y soporte offline-first

---

### 🏗️ **Arquitectura del Sistema**

#### Estructura de Directorios

```
src/lib/progress/
├── index.js              # Punto de entrada principal
├── config.js             # Configuración centralizada del sistema
├── logger.js             # Sistema de logging inteligente (dev/prod)
├── memoryManager.js      # Prevención de memory leaks y cleanup
├── dataModels.js         # Modelos de datos y tipos
├── database.js           # Manejo de IndexedDB
├── mastery.js            # Cálculo de mastery scores
├── tracking.js           # Sistema de tracking de eventos
├── srs.js                # Sistema de repetición espaciada
├── errorClassification.js # Clasificación de errores
├── analytics.js          # Vistas analíticas
├── teacherMode.js        # Modo docente
├── diagnosis.js          # Diagnóstico y recalibración
├── cloudSync.js          # Sincronización con la nube
├── utils.js              # Utilidades generales
├── uiUtils.js            # Utilidades para la interfaz
├── fullInitialization.js  # Inicialización completa
├── progressOrchestrator.js # Orquestador (flow, momentum, confianza, temporal)
├── flowStateDetection.js   # Detección de estados de flujo
├── momentumTracker.js      # Seguimiento de momentum emocional
├── confidenceEngine.js     # Motor de análisis de confianza
├── temporalIntelligence.js # Inteligencia temporal/circadiana
├── dynamicGoals.js         # Sistema de micro-objetivos dinámicos
└── all.js                # Exportación de todos los componentes

src/features/progress/
├── ProgressDashboard.jsx  # Dashboard principal
├── ProgressTracker.jsx    # Tracker de estadísticas
├── HeatMap.jsx           # Mapa de calor
├── CompetencyRadar.jsx   # Radar de competencias
└── progress.css          # Estilos

src/features/drill/
├── useProgressTracking.js      # Hook para tracking en Drill
└── ProgressTrackingWrapper.jsx # Wrapper para tracking
```

#### Componentes Clave

1. **Configuración Centralizada** - `config.js` con configuración unificada bajo `EMOTIONAL_INTELLIGENCE`
2. **Sistema de Logging Inteligente** - `logger.js` con logging condicional por ambiente (dev/prod)
3. **Gestión de Memoria** - `memoryManager.js` previene memory leaks con cleanup de intervals
4. **Modelos de Datos** - Definen la estructura de datos para usuarios, verbos, ítems, intentos, mastery y schedules
5. **Base de Datos** - Implementa almacenamiento local usando IndexedDB con idb
6. **Cálculo de Mastery** - Implementa la fórmula de mastery score con recencia, dificultad y penalización por pistas
7. **Tracking de Eventos** - Registra eventos mínimos como attempt_started, attempt_submitted, session_ended, hint_shown, streak_incremented, tense_drill_started/ended
8. **Sistema SRS** - Implementa repetición espaciada con intervalos crecientes
9. **Clasificación de Errores** - Etiqueta errores en 8 categorías específicas
10. **Inteligencia Emocional** - Suite completa: flow detection, momentum tracking, confidence engine, temporal intelligence, dynamic goals
11. **Vistas Analíticas** - Proporciona componentes de UI para visualizar el progreso
12. **Modo Docente** - Ofrece funcionalidades para exportar datos y compartir con docentes
13. **Diagnóstico** - Realiza test adaptativo inicial y recalibración mensual
14. **Sincronización** - Maneja sincronización con la nube y modo incógnito
15. **API Unificada** - Debugging consistente bajo `window.SpanishConjugator.*`

---

### 🧩 Componentes de Progreso (UI) y Hook de Datos

- `features/progress/ProgressDashboard.jsx`: Dashboard principal de progreso (composición de secciones).
- `features/progress/useProgressDashboardData.js`: Hook que encapsula la carga de datos (heatmap, stats, metas, progreso semanal, **retos diarios**, recomendaciones, errorIntel), estados (`loading`, `error`, `refreshing`, `systemReady`) y acciones (`refresh`, `loadData`, `completeChallenge`). Gestiona cancelaciones con `AsyncController`, warming de caché y refresh por evento `progress:dataUpdated`.
- Subcomponentes extraídos del Dashboard:
  - `ProgressHeader.jsx`: Cabecera con navegación y botón de refresco
  - `DailyChallengesPanel.jsx`: Panel de retos diarios con métricas recientes y evento `progress:challengeCompleted`
  - `WeeklyGoalsPanel.jsx`: Panel de objetivos semanales
  - `GeneralRecommendations.jsx`: Tarjetas de recomendaciones generales

Ejemplo de uso del hook:

```jsx
import useProgressDashboardData from "../../features/progress/useProgressDashboardData.js";

export default function ProgressDashboardExample() {
  const { loading, error, refresh, heatMapData } = useProgressDashboardData();
  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;
  return <div onClick={refresh}>{heatMapData.length} celdas</div>;
}
```

### 📊 **Modelos de Datos**

#### Usuario (User)

Representa a un usuario del sistema.

```javascript
/**
 * @typedef {Object} User
 * @property {string} id - Identificador único del usuario
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} lastActive - Última actividad
 */
```

#### Verbo (Verb)

Representa un verbo en el sistema.

```javascript
/**
 * @typedef {Object} Verb
 * @property {string} id - Identificador único del verbo
 * @property {string} lemma - Lema del verbo (infinitivo)
 * @property {'regular'|'irregular'|'diphtong'|'orthographic_change'} type - Tipo de verbo
 * @property {'high'|'medium'|'low'} frequency - Frecuencia léxica
 */
```

#### Ítem (Item)

Representa una celda específica de práctica (modo-tiempo-persona).

```javascript
/**
 * @typedef {Object} Item
 * @property {string} id - Identificador único
 * @property {string} verbId - ID del verbo
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 */
```

#### Intento (Attempt)

Representa un intento de práctica.

```javascript
/**
 * @typedef {Object} Attempt
 * @property {string} id - Identificador único
 * @property {string} itemId - ID del ítem
 * @property {boolean} correct - Si la respuesta fue correcta
 * @property {number} latencyMs - Tiempo de respuesta en milisegundos
 * @property {number} hintsUsed - Número de pistas utilizadas
 * @property {string[]} errorTags - Etiquetas de error
 * @property {Date} createdAt - Fecha de creación
 */
```

#### Mastery Score (Mastery)

Representa el mastery score de una celda.

```javascript
/**
 * @typedef {Object} Mastery
 * @property {string} id - Identificador único
 * @property {string} userId - ID del usuario
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 * @property {number} score - Mastery score (0-100)
 * @property {number} n - Número efectivo de intentos
 * @property {Date} updatedAt - Última actualización
 */
```

#### Schedule SRS (Schedule)

Representa el schedule SRS para una celda.

```javascript
/**
 * @typedef {Object} Schedule
 * @property {string} id - Identificador único
 * @property {string} userId - ID del usuario
 * @property {'indicative'|'subjunctive'|'imperative'|'conditional'|'nonfinite'} mood - Modo
 * @property {string} tense - Tiempo
 * @property {'1s'|'2s_tu'|'2s_vos'|'3s'|'1p'|'2p_vosotros'|'3p'} person - Persona
 * @property {Date} nextDue - Próxima fecha de revisión
 * @property {number} interval - Intervalo en días
 * @property {number} ease - Factor de facilidad
 * @property {number} reps - Número de repeticiones
 */
```

#### Etiquetas de Error (ERROR_TAGS)

Define las etiquetas de error para clasificación.

```javascript
export const ERROR_TAGS = {
  WRONG_PERSON: "persona_equivocada",
  VERBAL_ENDING: "terminación_verbal",
  IRREGULAR_STEM: "raíz_irregular",
  ACCENT: "acentuación",
  CLITIC_PRONOUNS: "pronombres_clíticos",
  ORTHOGRAPHY_G_GU: "ortografía_g/gu",
  ORTHOGRAPHY_C_QU: "ortografía_c/qu",
  ORTHOGRAPHY_Z_C: "ortografía_z/c",
  NUMBER_AGREEMENT: "concordancia_número",
  WRONG_MOOD: "modo_equivocado",
};
```

---

### 💾 **Base de Datos**

El sistema utiliza IndexedDB para almacenamiento local con la librería `idb` para una interfaz más amigable.

#### Estructura de la Base de Datos

```javascript
const DB_NAME = "SpanishConjugatorProgress";
const DB_VERSION = 1;

const STORES = {
  USERS: "users",
  VERBS: "verbs",
  ITEMS: "items",
  ATTEMPTS: "attempts",
  MASTERY: "mastery",
  SCHEDULES: "schedules",
};
```

#### Funciones Principales

- `initDB()` - Inicializa la base de datos
- `saveToDB(storeName, data)` - Guarda datos en una tabla
- `getFromDB(storeName, id)` - Obtiene datos por ID
- `getAllFromDB(storeName)` - Obtiene todos los datos de una tabla
- `getByIndex(storeName, indexName, value)` - Busca datos por índice
- `deleteFromDB(storeName, id)` - Elimina datos por ID

#### Índices Relevantes

- **Schedules**
  - `'userId-nextDue'`: índice compuesto creado durante `initDB()` para consultar rápidamente los schedules vencidos de un usuario. `getDueSchedules()` lo utiliza junto con `IDBKeyRange.bound([userId, fechaInferior], [userId, fechaCorte])` para evitar escaneos completos de la tabla.

#### Migraciones de Esquema

- v6: normaliza `syncedAt: null` a `0` en stores sincronizables (`attempts`, `mastery`, `schedules`, `learning_sessions`).
  - Motivo: `0` permite indexar y consultar por `syncedAt` con `IDBKeyRange.only(0)`, evitando escaneos completos y registros “fantasma”.
  - Implicaciones: el estado “no sincronizado” ahora se representa como `0`; los estados sincronizados conservan `Date` (marca temporal) y consultas de “pendiente” deben filtrar por `!syncedAt` o `syncedAt === 0`.

---

### 📈 **Cálculo de Mastery**

#### Fórmula de Mastery Score

```
M_C = 100 · Σ(w_i · d_i · acierto_i) / Σ(w_i · d_i) - penalización_pistas
```

Donde:

- `w_i` = peso por recencia (decaimiento exponencial)
- `d_i` = dificultad de la forma verbal
- `acierto_i` = 1 si correcto, 0 si incorrecto
- `penalización_pistas` = 5 puntos por pista usada

#### Parámetros de Cálculo

- **Recencia**: `w = e^(-Δdías/τ)` con τ = 10 días
- **Dificultad**: Entre 0.8 y 1.3 según tipo de verbo y frecuencia
- **Penalización**: 5 puntos por pista usada, máximo 15

#### Funciones Principales

- `calculateRecencyWeight(attemptDate)` - Calcula peso por recencia
- `getVerbDifficulty(verb)` - Obtiene dificultad del verbo
- `calculateHintPenalty(hintsUsed)` - Calcula penalización por pistas
- `calculateMasteryForItem(itemId, verb)` - Calcula mastery para un ítem
- `calculateMasteryForCell(items, verbsMap)` - Calcula mastery para una celda
- `calculateMasteryForTimeOrMood(cells, weights)` - Calcula mastery para tiempo o modo
- `getConfidenceLevel(weightedN)` - Determina nivel de confianza
- `classifyMasteryLevel(score, weightedN, avgLatency)` - Clasifica nivel de mastery

---

### 🎯 **Tracking de Eventos**

#### Eventos Mínimos

- `attempt_started`
- `attempt_submitted` {correcta: bool, latencia_ms, pistas_usadas, errores:[]}
- `session_ended` {duración, modo, device}
- `hint_shown`
- `streak_incremented`
- `tense_drill_started/ended`

#### Funciones Principales

- `initTracking(userId)` - Inicializa tracking para un usuario
- `trackAttemptStarted(item)` - Registra inicio de intento
- `trackAttemptSubmitted(attemptId, result)` - Registra finalización de intento
- `trackSessionEnded(sessionData)` - Registra final de sesión
- `trackHintShown()` - Registra que se mostró una pista
- `trackStreakIncremented()` - Registra que se incrementó una racha
- `trackTenseDrillStarted(tense)` - Registra inicio de drill de tiempo
- `trackTenseDrillEnded(tense)` - Registra final de drill de tiempo

---

### 📚 **Sistema SRS**

#### Intervalos SRS

- 1 día
- 3 días
- 7 días
- 14 días
- 30 días
- 90 días (multiplicando por 2)

#### Curva de Olvido

Si acierta sin pista: próximo en 1d, 3d, 7d, 14d, 30d, multiplicando por 2.
Si falla: reinicia al intervalo anterior.
Si usa pista: no sube de nivel en esa pasada.

#### Funciones Principales

- `calculateNextInterval(schedule, correct, hintsUsed)` - Calcula próximo intervalo
- `updateSchedule(userId, cell, correct, hintsUsed)` - Actualiza schedule
- `getDueItems(userId, currentDate)` - Obtiene ítems pendientes
- `isItemDue(schedule, currentDate)` - Verifica si ítem necesita revisión

---

### 🚨 **Clasificación de Errores**

#### Etiquetas de Error

- Persona equivocada
- Terminación verbal
- Raíz irregular
- Acentuación
- Pronombres clíticos
- Ortografía por cambio g/gu, c/qu, z/c
- Concordancia número
- Modo equivocado

#### Funciones Principales

- `classifyError(userAnswer, correctAnswer, item)` - Clasifica error específico
- `detailedErrorAnalysis(userAnswer, correctAnswer, item)` - Análisis detallado

---

### 📊 **Vistas Analíticas**

#### Componentes de UI

- **Mapa de calor** por modo y tiempo
- **Radar de competencias** por 5 ejes
- **Línea de progreso** temporal
- **Objetivos semanales** con KPIs
- **Diagnósticos** y micro-retos

#### Funciones Principales

- `getHeatMapData()` - Obtiene datos para mapa de calor
- `getCompetencyRadarData()` - Obtiene datos para radar de competencias
- `getProgressLineData()` - Obtiene datos para línea de progreso
- `getUserStats()` - Obtiene estadísticas del usuario
- `getWeeklyGoals()` - Obtiene objetivos semanales
- `checkWeeklyProgress()` - Verifica progreso semanal
- `getRecommendations()` - Genera recomendaciones

---

### 👨‍🏫 **Modo Docente**

#### Funcionalidades

- **Generar reportes** descargables
- **Filtrar** por lista de verbos de clase
- **Código breve** de sesión para compartir

#### Funciones Principales

- `generateStudentReport(userId)` - Genera informe para docente
- `generateSessionCode()` - Genera código de sesión
- `getClassStats(userIds)` - Obtiene estadísticas de clase

---

### 🔍 **Diagnóstico y Recalibración**

#### Diagnóstico Inicial

Test adaptativo de 3 minutos que toma 1 ítem por tiempo clave y estima M inicial.

#### Recalibración Mensual

Automática que inserta 1 ítem sorpresa por celda con M ≥ 80 para verificar consolidación.

#### Funciones Principales

- `performInitialDiagnosis()` - Realiza diagnóstico inicial
- `scheduleMonthlyRecalibration()` - Programa recalibración mensual
- `performRecalibration()` - Realiza recalibración

---

### ☁️ **Sincronización con la Nube**

#### Enfoque Local-First

Todo se calcula localmente. La sincronización es opcional y anonimiza verbos en agregados.

#### Modo Incógnito

Práctica sin logging si el usuario quiere solo "calentar".

#### Funciones Principales

- `syncWithCloud()` - Sincroniza con la nube
- `getSyncStatus()` - Obtiene estado de sincronización
- `setIncognitoMode(enabled)` - Habilita/deshabilita modo incógnito
- `hasPendingSyncData()` - Verifica datos pendientes de sincronización
- `forceSync()` - Forza sincronización
- `exportDataForBackup()` - Exporta datos para respaldo
- `importDataFromBackup(data)` - Importa datos desde respaldo

#### Cola Offline y Persistencia

- Cola local persistida en `localStorage` con límite configurable (por defecto 500 operaciones) para evitar crecimientos indefinidos.
- Se consolidan operaciones idénticas (mismo `type` + `payload`) para reducir duplicados antes de alcanzar el límite.
- Cuando se supera el límite se descartan entradas antiguas y se registran logs de advertencia para facilitar debugging.

---

### 🔐 **Privacidad y Consentimiento**

#### Enfoque Privacy-First

- Todo se calcula localmente
- Sincronización es opcional y anonimiza verbos en agregados
- Modo incógnito de práctica sin logging si el usuario quiere solo "calentar"

---

### 🔗 **Integración con Drill**

#### Componentes de Integración

- `useProgressTracking` - Hook personalizado para tracking en Drill
- `ProgressTrackingWrapper` - Wrapper para tracking

#### Funciones de Integración

- `trackAttemptStarted(item)` - Registra inicio de intento
- `trackAttemptSubmitted(attemptId, result)` - Registra finalización de intento
- `trackSessionEnded(sessionData)` - Registra final de sesión
- `trackHintShown()` - Registra que se mostró una pista
- `trackStreakIncremented()` - Registra que se incrementó una racha
- `trackTenseDrillStarted(tense)` - Registra inicio de drill de tiempo
- `trackTenseDrillEnded(tense)` - Registra final de drill de tiempo

---

### 🧪 **Pruebas**

#### Tipos de Pruebas

- **Pruebas Unitarias** - Verifican funciones individuales
- **Pruebas de Integración** - Verifican integración entre componentes
- **Pruebas de Rendimiento** - Verifican velocidad y eficiencia
- **Pruebas de Usabilidad** - Verifican experiencia de usuario
- **Pruebas de Accesibilidad** - Verifican compatibilidad con discapacidades
- **Pruebas de Seguridad** - Verifican protección de datos
- **Pruebas de Compatibilidad** - Verifican funcionamiento en diferentes entornos
- **Pruebas de Internacionalización** - Verifican compatibilidad con diferentes idiomas

#### Archivos de Pruebas

- `progress.test.js` - Pruebas unitarias básicas
- `integration.test.js` - Pruebas de integración
- `performance.test.js` - Pruebas de rendimiento
- `usability.test.js` - Pruebas de usabilidad
- `accessibility.test.js` - Pruebas de accesibilidad
- `security.test.js` - Pruebas de seguridad
- `compatibility.test.js` - Pruebas de compatibilidad
- `internationalization.test.js` - Pruebas de internacionalización

---

### 📡 **API**

#### Funciones Exportadas

##### Inicialización

- `initProgressSystem(userId)` - Inicializa el sistema de progreso
- `isProgressSystemInitialized()` - Verifica si el sistema está inicializado
- `getCurrentUserId()` - Obtiene el ID del usuario actual
- `endCurrentSession()` - Finaliza la sesión actual
- `resetProgressSystem()` - Reinicia el sistema de progreso

##### Base de Datos

- `initDB()` - Inicializa la base de datos
- `saveToDB(storeName, data)` - Guarda datos en la base de datos
- `getFromDB(storeName, id)` - Obtiene datos de la base de datos
- `getAllFromDB(storeName)` - Obtiene todos los datos de una tabla
- `getByIndex(storeName, indexName, value)` - Busca datos por índice
- `deleteFromDB(storeName, id)` - Elimina datos de la base de datos

##### Cálculo de Mastery

- `calculateRecencyWeight(attemptDate)` - Calcula peso por recencia
- `getVerbDifficulty(verb)` - Obtiene dificultad del verbo
- `calculateHintPenalty(hintsUsed)` - Calcula penalización por pistas
- `calculateMasteryForItem(itemId, verb)` - Calcula mastery para un ítem
- `calculateMasteryForCell(items, verbsMap)` - Calcula mastery para una celda
- `calculateMasteryForTimeOrMood(cells, weights)` - Calcula mastery para tiempo o modo
- `getConfidenceLevel(weightedN)` - Determina nivel de confianza
- `classifyMasteryLevel(score, weightedN, avgLatency)` - Clasifica nivel de mastery

##### Tracking de Eventos

- `initTracking(userId)` - Inicializa tracking para un usuario
- `trackAttemptStarted(item)` - Registra inicio de intento
- `trackAttemptSubmitted(attemptId, result)` - Registra finalización de intento
- `trackSessionEnded(sessionData)` - Registra final de sesión
- `trackHintShown()` - Registra que se mostró una pista
- `trackStreakIncremented()` - Registra que se incrementó una racha
- `trackTenseDrillStarted(tense)` - Registra inicio de drill de tiempo
- `trackTenseDrillEnded(tense)` - Registra final de drill de tiempo

##### Sistema SRS

- `calculateNextInterval(schedule, correct, hintsUsed)` - Calcula próximo intervalo
- `updateSchedule(userId, cell, correct, hintsUsed)` - Actualiza schedule
- `getDueItems(userId, currentDate)` - Obtiene ítems pendientes
- `isItemDue(schedule, currentDate)` - Verifica si ítem necesita revisión

##### Clasificación de Errores

- `classifyError(userAnswer, correctAnswer, item)` - Clasifica error específico
- `detailedErrorAnalysis(userAnswer, correctAnswer, item)` - Análisis detallado

##### Vistas Analíticas

- `getHeatMapData()` - Obtiene datos para mapa de calor
- `getCompetencyRadarData()` - Obtiene datos para radar de competencias
- `getProgressLineData()` - Obtiene datos para línea de progreso
- `getUserStats()` - Obtiene estadísticas del usuario
- `getWeeklyGoals()` - Obtiene objetivos semanales
- `checkWeeklyProgress()` - Verifica progreso semanal
- `getRecommendations()` - Genera recomendaciones

##### Modo Docente

- `generateStudentReport(userId)` - Genera informe para docente
- `generateSessionCode()` - Genera código de sesión
- `getClassStats(userIds)` - Obtiene estadísticas de clase

##### Diagnóstico y Recalibración

- `performInitialDiagnosis()` - Realiza diagnóstico inicial
- `scheduleMonthlyRecalibration()` - Programa recalibración mensual
- `performRecalibration()` - Realiza recalibración

##### Sincronización con la Nube

- `syncWithCloud()` - Sincroniza con la nube
- `getSyncStatus()` - Obtiene estado de sincronización
- `setIncognitoMode(enabled)` - Habilita/deshabilita modo incógnito
- `hasPendingSyncData()` - Verifica datos pendientes de sincronización
- `forceSync()` - Forza sincronización
- `exportDataForBackup()` - Exporta datos para respaldo
- `importDataFromBackup(data)` - Importa datos desde respaldo

##### Utilidades

- `generateId()` - Genera ID único
- `formatDate(date)` - Formatea fecha
- `dateDiffInDays(date1, date2)` - Calcula diferencia en días
- `msToSeconds(ms)` - Convierte milisegundos a segundos
- `groupBy(array, property)` - Agrupa array por propiedad
- `average(numbers)` - Calcula promedio
- `maxBy(array, property)` - Encuentra máximo por propiedad
- `minBy(array, property)` - Encuentra mínimo por propiedad
- `formatPercentage(value, decimals)` - Formatea porcentaje
- `formatTime(ms)` - Formatea tiempo
- `getMasteryColorClass(score)` - Obtiene clase de color para mastery
- `getMasteryLevelText(score)` - Obtiene texto de nivel de mastery
- `getMasteryIcon(score)` - Obtiene ícono para mastery
- `formatRelativeDate(date)` - Formatea fecha relativa

---

### ⚙️ **Configuración**

#### Constantes de Configuración

```javascript
export const PROGRESS_CONFIG = {
  // Constantes para cálculos de mastery
  DECAY_TAU: 10, // Días para decaimiento exponencial
  HINT_PENALTY: 5, // Puntos por pista usada
  MAX_HINT_PENALTY: 15, // Penalización máxima por intento
  MIN_CONFIDENCE_N: 8, // Número mínimo de intentos para confianza

  // Niveles de mastery
  MASTERY_LEVELS: {
    ACHIEVED: 80, // Dominio logrado
    ATTENTION: 60, // Necesita atención
    CRITICAL: 0, // Crítico
  },

  // Umbrales de confianza
  CONFIDENCE_LEVELS: {
    HIGH: 20, // N >= 20
    MEDIUM: 8, // N >= 8
    LOW: 0, // N < 8
  },

  // Intervalos SRS
  SRS_INTERVALS: [1, 3, 7, 14, 30, 90], // Días

  // Ajustes por clustering de familias irregulares
  SRS_CLUSTERING: {
    FAMILY: {
      /* ver config.js para valores por defecto */
    },
    CLUSTER_PROMOTION: {
      /* refuerza intervalos cuando un clúster tiene buen desempeño */
    },
  },

  // Configuración de UI
  UI: {
    HEATMAP_COLORS: {
      HIGH: "#28a745", // Verde para 80-100%
      MEDIUM: "#ffc107", // Amarillo para 60-79%
      LOW: "#dc3545", // Rojo para 0-59%
      NO_DATA: "#6c757d", // Gris para sin datos
    },

    COMPETENCY_RADAR: {
      AXES: 5, // Número de ejes en el radar
      MAX_VALUE: 100, // Valor máximo para cada eje
    },
  },

  // Configuración de sincronización
  SYNC: {
    AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
    MAX_SYNC_RETRIES: 3,
    BATCH_SIZE: 100, // Número de registros por lote
  },

  // Configuración de diagnóstico
  DIAGNOSIS: {
    TEST_DURATION: 3 * 60 * 1000, // 3 minutos
    RECALIBRATION_INTERVAL: 30 * 24 * 60 * 60 * 1000, // 30 días
  },

  // Configuración de objetivos
  GOALS: {
    WEEKLY: {
      DEFAULT_CELLS_TO_IMPROVE: 3,
      DEFAULT_MIN_SCORE: 75,
      DEFAULT_SESSIONS: 5,
      DEFAULT_ATTEMPTS: 50,
      DEFAULT_FOCUS_TIME: 60, // minutos
    },
  },
};
```

#### Configuración de Dificultad

```javascript
// Configuración de dificultad por tipo de verbo
export const VERB_DIFFICULTY = {
  REGULAR: 1.0,
  DIPHTHONG: 1.1,
  ORTHOGRAPHIC_CHANGE: 1.15,
  HIGHLY_IRREGULAR: 1.2,
};

// Configuración de dificultad por frecuencia
export const FREQUENCY_DIFFICULTY_BONUS = {
  LOW: 0.05,
  MEDIUM: 0.0,
  HIGH: 0.0,
};
```

---

### 🚀 **Instalación y Uso**

#### Instalación

```bash
cd /Users/pablo/Desktop/code/spanish-conjugator/conju
npm install idb idb-keyval uuid
npm install --save-dev @types/uuid fake-indexeddb
```

#### Uso Básico

```javascript
import {
  initProgressSystem,
  calculateMasteryForItem,
  trackAttemptStarted,
  trackAttemptSubmitted,
} from "./src/lib/progress/index.js";

// Inicializar sistema
const userId = await initProgressSystem();

// Registrar inicio de intento
const attemptId = trackAttemptStarted(item);

// Registrar finalización de intento
await trackAttemptSubmitted(attemptId, {
  correct: true,
  latencyMs: 2500,
  hintsUsed: 0,
  errorTags: [],
});

// Calcular mastery para un ítem
const mastery = await calculateMasteryForItem("item-id", verb);
console.log(`Mastery score: ${mastery.score}`);
```

#### Integración con Drill

```javascript
import { useProgressTracking } from "./src/features/drill/useProgressTracking.js";

function DrillComponent({ currentItem, onResult }) {
  const { handleResult, handleHintShown } = useProgressTracking(
    currentItem,
    onResult,
  );

  const handleSubmit = async () => {
    // ... lógica de validación ...

    const result = grade(input, currentItem.form);
    handleResult(result);
  };

  const revealHint = () => {
    // ... lógica para mostrar pista ...
    handleHintShown();
  };

  // ... resto del componente ...
}
```

#### Componentes de UI

```javascript
import { ProgressDashboard } from "./src/features/progress/index.js";

function App() {
  return (
    <div className="app">
      {/* ... otros componentes ... */}
      <ProgressDashboard />
    </div>
  );
}
```

---

### 📈 **Roadmap Técnico**

#### Versión 0 (V0) - Implementado ✅

- Eventos y mastery por celda
- Mapa de calor
- Botón "practicar 6"

#### Versión 1 (V1) - En Progreso 🚧

- Radar de competencias
- Sistema SRS completo
- Diagnósticos automáticos
- Exportar CSV

#### Versión 2 (V2) - Planificado 🔮

- Objetivos semanales
- Modo docente completo
- Comparativas por listas de verbos

---

### 🛡️ **Consideraciones de Seguridad**

#### Protección de Datos

- Todo se calcula localmente
- Sincronización opcional con anonimización
- Modo incógnito disponible

#### Manejo de Errores

- Validación de entradas
- Manejo de excepciones
- Logging seguro

#### Privacidad

- Sin recolección de datos personales
- Sin tracking de terceros
- Control total del usuario sobre sus datos

---

### 🌐 **Compatibilidad**

#### Navegadores Soportados

- Chrome (última versión)
- Firefox (última versión)
- Safari (última versión)
- Edge (última versión)

#### Dispositivos Soportados

- Escritorio
- Tablet
- Móvil (iOS y Android)

#### Sistemas Operativos Soportados

- Windows
- macOS
- Linux
- iOS
- Android

---

### 🌍 **Internacionalización**

#### Idiomas Soportados

- Español (es-ES)
- Inglés (en-US) - Para interfaz
- Portugués (pt-BR) - Futuro

#### Formatos Regionales

- Fechas: DD/MM/YYYY y MM/DD/YYYY
- Números: 1.234,56 y 1,234.56
- Monedas: €, $, R$

---

### ⚡ **Rendimiento**

#### Métricas Esperadas

- Tiempo de respuesta: <50ms para cálculos
- Uso de memoria: <20MB para caches
- Startup time: <500ms para warm-up inicial
- Cache hit rate: >80% después del warm-up

#### Optimizaciones Implementadas

1. **Cache inteligente** con evicción LRU
2. **Lookups O(1)** con Map() pre-computados
3. **Filtrado eficiente** con Sets para combinaciones permitidas
4. **Lazy loading** de datos según necesidad
5. **Warm-up automático** de caches críticos

---

### 🧪 **Validación Automática**

#### Verificaciones Implementadas

- Verbos duplicados
- Formas verbales faltantes
- Inconsistencias en conjugaciones
- Referencias rotas entre familias y verbos
- Estructura de datos inválida

#### Niveles de Validación

1. **Validación rápida**: Errores críticos únicamente
2. **Validación completa**: Errores + advertencias
3. **Exit codes**: 0 = éxito, 1 = errores encontrados

---

### 📚 **Recursos Lingüísticos**

#### Referencias Gramaticales

- RAE Nueva gramática de la lengua española
- Gramática descriptiva de la lengua española (Bosque & Demonte)
- Manual de escritura académica (Estrella Montolío)

#### Corpus y Frecuencia

- CREA (Corpus de Referencia del Español Actual)
- CORPES XXI (Corpus del Español del Siglo XXI)
- Frequency Dictionary of Spanish (Davies & Davies)

#### CEFR y Niveles

- Marco Común Europeo de Referencia (MCER)
- Plan Curricular del Instituto Cervantes
- Diccionario de aprendizaje de español (SM)

---

🎉 **¡El sistema de progreso y analíticas está completamente implementado y listo para mejorar la experiencia de aprendizaje de los usuarios!**
