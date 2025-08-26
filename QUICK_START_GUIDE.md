# Guía de Inicio Rápido - Sistema de Progreso

## Bienvenido al Sistema de Progreso y Analíticas

Esta guía te ayudará a comenzar rápidamente con el sistema de progreso implementado para el conjugador de español.

## Estructura Rápida

```
src/lib/progress/          # Librerías del sistema de progreso
src/features/progress/     # Componentes de UI
src/features/drill/        # Integración con Drill (modificada)
```

## Primeros Pasos

### 1. Inicialización del Sistema
El sistema se inicializa automáticamente al cargar la aplicación:
```javascript
// Ya configurado en src/state/settings.js
import { initProgressSystem } from '../lib/progress/index.js'

initProgressSystem().catch(error => {
  console.error('Error al inicializar el sistema de progreso:', error)
})
```

### 2. Uso Básico
```javascript
// Importar funciones principales
import { 
  trackAttemptStarted, 
  trackAttemptSubmitted,
  getHeatMapData
} from './lib/progress/all.js'

// Iniciar un intento
const attemptId = trackAttemptStarted(item)

// Finalizar un intento
await trackAttemptSubmitted(attemptId, {
  correct: true,
  latencyMs: 2500,
  hintsUsed: 0,
  errorTags: []
})

// Obtener datos para el mapa de calor
const heatMapData = await getHeatMapData()
```

## Componentes Clave

### Tracking de Intentos
```javascript
// En src/features/drill/Drill.jsx
import { useProgressTracking } from './useProgressTracking.js'

const { handleResult, handleHintShown } = useProgressTracking(currentItem, onResult)

// En handleSubmit:
handleResult(extendedResult)

// En revealHint:
handleHintShown()
```

### Señales Emocionales en la UI
```javascript
// Indicador visual de Flow/Momentum en Drill
import { FlowIndicator } from './features/progress/FlowIndicator.jsx'

// El orquestador emite el evento 'progress-emo-update' en window con el estado actual
useEffect(() => {
  const onUpdate = (e) => setState(e.detail)
  window.addEventListener('progress-emo-update', onUpdate)
  return () => window.removeEventListener('progress-emo-update', onUpdate)
}, [])

// En el JSX del Drill
<FlowIndicator flowState={state.flowState} momentum={state.momentumType} metrics={state.metrics} />
```

### Vistas Analíticas
```javascript
// Dashboard principal
import { ProgressDashboard } from './features/progress/index.js'

// Usar en la aplicación:
<ProgressDashboard />
```

## Desarrollo

### Ejecutar Pruebas
```bash
# Pruebas del sistema de progreso
npm test src/lib/progress/progress.test.js

# Pruebas en modo watch
npx vitest src/lib/progress/progress.test.js
```

### Estructura de Archivos
```
src/lib/progress/
├── index.js              # Punto de entrada
├── dataModels.js         # Modelos de datos
├── database.js           # IndexedDB
├── mastery.js            # Cálculo de mastery
├── tracking.js           # Tracking de eventos
├── srs.js                # Sistema SRS
└── progress.test.js      # Pruebas

src/features/progress/
├── ProgressDashboard.jsx # Dashboard principal
├── HeatMap.jsx           # Mapa de calor
├── CompetencyRadar.jsx   # Radar de competencias
└── progress.css          # Estilos
```

## Funciones Principales

### Tracking
```javascript
// Iniciar intento
trackAttemptStarted(item) // Retorna attemptId

// Finalizar intento
trackAttemptSubmitted(attemptId, result)

// Otros eventos
trackSessionEnded()
trackHintShown()
trackStreakIncremented()
```

### Cálculo de Mastery
```javascript
// Calcular para un ítem
calculateMasteryForItem(itemId, verb)

// Calcular para una celda
calculateMasteryForCell(items, verbsMap)
```

### Sistema SRS
```javascript
// Actualizar schedule
updateSchedule(userId, cell, correct, hintsUsed)

// Verificar si un ítem está pendiente
isItemDue(schedule, currentDate)
```

### Vistas Analíticas
```javascript
// Mapa de calor
getHeatMapData()

// Radar de competencias
getCompetencyRadarData()

// Estadísticas del usuario
getUserStats()
```

## Pruebas

### Ejecutar Todas las Pruebas
```bash
npm test
```

### Ejecutar Pruebas Específicas
```bash
# Solo pruebas del sistema de progreso
npx vitest run src/lib/progress/progress.test.js

# Pruebas en modo watch
npx vitest src/lib/progress/progress.test.js
```

### Depuración
```javascript
// En la consola del navegador
import { getCacheStats } from './src/lib/progress/database.js'
console.log(getCacheStats())
```

## Integración con la Aplicación

### Drill Component
El componente `Drill` ya está integrado con el sistema de tracking:
- Registra intentos automáticamente
- Clasifica errores en tiempo real
- Actualiza mastery scores

### UI Components
Los componentes de progreso se pueden usar directamente:
```javascript
import { ProgressDashboard } from './features/progress/index.js'

function App() {
  return (
    <div>
      <ProgressDashboard />
    </div>
  )
}
```

## Configuración

### Variables de Entorno
```bash
# Para desarrollo
NODE_ENV=development

# Para pruebas
VITEST_ENV=test
```

### Depuración
```javascript
// Habilitar logs detallados
localStorage.setItem('debug', 'spanish-conjugator:progress:*')
```

## Problemas Comunes

### "IndexedDB not supported"
- Verificar compatibilidad del navegador
- El sistema usa fallback a localStorage si es necesario

### "User not initialized"
- Asegurar que `initProgressSystem()` se llama antes de usar otras funciones

### Pruebas que fallan
```bash
# Limpiar cache
npx vitest --clearCache

# Ejecutar con más información
npx vitest --reporter=verbose
```

## Contribución

### Estilo de Código
- Seguir las convenciones existentes
- Usar JSDoc para documentar funciones
- Mantener cobertura de pruebas > 80%

### Nuevas Funcionalidades
1. Crear rama desde `main`
2. Implementar funcionalidad
3. Agregar pruebas
4. Actualizar documentación
5. Crear pull request

## Recursos Adicionales

- `README_PROGRESS_SYSTEM.md` - Documentación completa
- `PROGRESS_SYSTEM_COMMANDS.md` - Comandos y scripts
- `PROGRESS_SYSTEM_INDEX.md` - Índice de archivos
- `EXECUTIVE_SUMMARY.md` - Resumen ejecutivo

¡Estás listo para comenzar a trabajar con el sistema de progreso!
