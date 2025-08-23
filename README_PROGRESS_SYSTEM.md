# Spanish Conjugator - Sistema de Progreso y Analíticas

## Punto de Entrada Completo

Este archivo proporciona un resumen de todos los componentes del sistema de progreso y analíticas implementados para el conjugador de español.

## Estructura del Sistema

```
src/lib/progress/
├── dataModels.js          # Modelos de datos y tipos
├── database.js            # Manejo de IndexedDB
├── mastery.js             # Cálculo de mastery scores
├── tracking.js            # Sistema de tracking de eventos
├── srs.js                 # Sistema de repetición espaciada
├── verbInitialization.js  # Inicialización de verbos
├── itemManagement.js      # Gestión de ítems de práctica
├── errorClassification.js # Clasificación de errores
├── utils.js               # Utilidades generales
├── uiUtils.js             # Utilidades para la interfaz
├── analytics.js           # Vistas analíticas
├── goals.js               # Objetivos semanales
├── teacherMode.js         # Modo docente
├── diagnosis.js           # Diagnóstico inicial
├── cloudSync.js           # Sincronización con la nube
├── index.js               # Punto de entrada principal
├── fullInitialization.js  # Inicialización completa
├── config.js              # Configuración del sistema
├── all.js                 # Exportación de todos los componentes
├── autoInit.js            # Inicialización automática
└── progress.test.js       # Pruebas unitarias

src/features/progress/
├── ProgressDashboard.jsx  # Dashboard principal
├── ProgressTracker.jsx    # Tracker de estadísticas
├── HeatMap.jsx            # Mapa de calor
├── CompetencyRadar.jsx    # Radar de competencias
├── progress.css           # Estilos
└── index.js               # Exportación de componentes

src/features/drill/
├── useProgressTracking.js      # Hook para tracking en Drill
└── ProgressTrackingWrapper.jsx # Wrapper para tracking
```

## Componentes Principales

### 1. Modelo de Datos (`dataModels.js`)
Define las estructuras de datos para:
- Usuarios
- Verbos (con tipo y frecuencia)
- Ítems (modo-tiempo-persona)
- Intentos (con latencia, pistas y errores)
- Mastery scores
- Schedules SRS

### 2. Base de Datos (`database.js`)
Implementa el almacenamiento local usando IndexedDB con:
- Tablas optimizadas para cada entidad
- Índices para búsquedas rápidas
- Funciones CRUD completas
- Manejo de errores robusto

### 3. Cálculo de Mastery (`mastery.js`)
Implementa la fórmula de mastery score:
```
M_C = 100 · Σ(w_i · d_i · acierto_i) / Σ(w_i · d_i) - penalización_pistas
```
Con:
- Recencia: w = e^(-Δdías/τ)
- Dificultad: Basada en tipo de verbo y frecuencia
- Penalización: 5 puntos por pista

### 4. Tracking de Eventos (`tracking.js`)
Registra eventos mínimos:
- `attempt_started`
- `attempt_submitted` {correcta, latencia, pistas, errores}
- `session_ended` {duración, modo, device}
- `hint_shown`
- `streak_incremented`
- `tense_drill_started/ended`

### 5. Sistema SRS (`srs.js`)
Implementa repetición espaciada con:
- Intervalos: 1d, 3d, 7d, 14d, 30d (multiplicando por 2)
- Reinicio al intervalo anterior en fallos
- Sin avance si se usan pistas

### 6. Clasificación de Errores (`errorClassification.js`)
Etiqueta errores en:
- Persona equivocada
- Terminación verbal
- Raíz irregular
- Acentuación
- Pronombres clíticos
- Ortografía (g/gu, c/qu, z/c)
- Concordancia número
- Modo equivocado

### 7. Vistas Analíticas (`analytics.js`)
Proporciona datos para:
- Mapa de calor por modo y tiempo
- Radar de competencias (5 ejes)
- Línea de progreso temporal
- Estadísticas generales

### 8. Componentes de UI (`src/features/progress/`)
Componentes React para:
- Dashboard principal de progreso
- Tracker de estadísticas en tiempo real
- Mapa de calor interactivo
- Radar de competencias visual

### 9. Integración con Drill (`src/features/drill/`)
Hooks y wrappers para:
- Tracking automático de intentos
- Clasificación de errores en tiempo real
- Registro de pistas y rachas

## Uso del Sistema

### Inicialización
```javascript
import { initProgressSystem } from './lib/progress/index.js'

// Inicializar con ID de usuario específico o generar uno
const userId = await initProgressSystem('user-123')
// o
const userId = await initProgressSystem() // Genera ID automáticamente
```

### Tracking de Intentos
```javascript
import { trackAttemptStarted, trackAttemptSubmitted } from './lib/progress/index.js'

// Iniciar intento
const attemptId = trackAttemptStarted(item)

// Finalizar intento
await trackAttemptSubmitted(attemptId, {
  correct: true,
  latencyMs: 2500,
  hintsUsed: 0,
  errorTags: []
})
```

### Obtener Datos Analíticos
```javascript
import { getHeatMapData, getCompetencyRadarData } from './lib/progress/index.js'

// Obtener datos para mapa de calor
const heatMapData = await getHeatMapData()

// Obtener datos para radar de competencias
const radarData = await getCompetencyRadarData()
```

## Pruebas

El sistema incluye pruebas unitarias completas:
```bash
npm test src/lib/progress/progress.test.js
```

## Privacidad y Sincronización

- **Local-first**: Todo se calcula y almacena localmente
- **Sincronización opcional**: Solo cuando el usuario lo permite
- **Anonimización**: Datos agregados para proteger la privacidad
- **Modo incógnito**: Práctica sin logging si se desea

## Roadmap de Integración

### V0 (Implementado)
- ✅ Eventos y mastery por celda
- ✅ Mapa de calor
- ✅ Botón "practicar 6"

### V1 (Próximo)
- ✅ Radar de competencias
- ✅ Sistema SRS completo
- ✅ Diagnósticos automáticos
- ✅ Exportación CSV

### V2 (Futuro)
- ✅ Objetivos semanales
- ✅ Modo docente completo
- ✅ Comparativas por listas de verbos

## Beneficios Clave

1. **Medición precisa** del progreso por celda
2. **Feedback específico** sobre errores de conjugación
3. **Práctica adaptativa** que se ajusta al nivel del usuario
4. **Visualización clara** del dominio por áreas
5. **Motivación** con objetivos y recompensas
6. **Privacidad** con almacenamiento local-first
7. **Escalabilidad** para crecer con el usuario

El sistema está completamente implementado y listo para ser integrado en la aplicación principal, proporcionando una experiencia de aprendizaje significativamente mejorada para los usuarios.