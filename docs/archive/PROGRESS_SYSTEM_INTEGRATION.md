# Spanish Conjugator - Sistema de Progreso y Analíticas

## Integración Actual

El núcleo del sistema de progreso/analíticas está integrado (tracking, mastery, SRS, orquestador emocional y UI de indicador). La app funciona local-first con sincronización opcional. Este documento refleja la integración vigente y los pendientes relevantes.

## Componentes Implementados

### 1. Sistema de Datos
- **Modelos de datos** completos para usuarios, verbos, ítems, intentos, mastery y schedules
- **Base de datos IndexedDB** para almacenamiento local eficiente
- **Esquema optimizado** con índices para búsquedas rápidas

### 2. Cálculo de Mastery
- **Fórmula de mastery score** basada en recencia, dificultad y pistas
- **Decaimiento exponencial** para recencia (τ = 10 días)
- **Dificultad por tipo de verbo** y frecuencia léxica
- **Penalización por pistas** (5 puntos por pista, máximo 15)

### 3. Tracking de Eventos
- **Registro completo de eventos** de práctica
- **Clasificación de errores** en 8 categorías específicas
- **Integración con componente Drill** para tracking automático

### 4. Sistema SRS
- **Algoritmo de repetición espaciada** con intervalos crecientes
- **Adaptación al desempeño** del usuario
- **Programación de repasos** según curva de olvido

### 5. Práctica Adaptativa
- **Selector inteligente de ítems** (50/30/20 por nivel de mastery)
- **Mezcla de verbos** regulares e irregulares
- **Priorización de áreas débiles** con confianza estadística

### 6. Vistas Analíticas
- **Mapa de calor** por modo y tiempo con indicadores de latencia
- **Radar de competencias** con 5 ejes de evaluación
- **Línea de progreso** temporal con eventos marcados
- **Objetivos semanales** con KPIs y micro-retos
- **Diagnósticos automáticos** de cuellos de botella

### 7. Modo Docente
- **Exportación a CSV/PDF** de datos agregados
- **Filtrado por listas de clase**
- **Códigos de sesión** para compartir progreso

### 8. UX Integrada
- **Indicador de Flow/Momentum** en Drill (esquina superior derecha)
- **Dashboard de progreso** con analíticas
- **Detalles por celda** y errores comunes

## Archivos Creados

### Sistema de Progreso (`src/lib/progress/`)
Todos los archivos necesarios para el funcionamiento del sistema:
- Modelos de datos
- Base de datos
- Cálculo de mastery
- Tracking de eventos
- Sistema SRS
- Gestión de verbos e ítems
- Clasificación de errores
- Utilidades
- Vistas analíticas
- Modo docente
- Sincronización
- Configuración

### Componentes de UI (`src/features/progress/`)
- Dashboard principal
- Tracker de estadísticas
- Mapa de calor
- Radar de competencias
- Estilos CSS

### Integración (`src/features/drill/`)
- Hook personalizado para tracking
- Wrapper para integración en Drill

## Integración con la Aplicación

### Estado y Configuración
El sistema se inicializa automáticamente al cargar la aplicación a través de:
```javascript
// En src/state/settings.js
import { initProgressSystem } from '../lib/progress/index.js'

// Inicializar sistema de progreso
initProgressSystem().catch(error => {
  console.error('Error al inicializar el sistema de progreso:', error)
})
```

### Tracking y señales en Drill
El componente de práctica (`src/features/drill/Drill.jsx`) está integrado con el sistema de tracking:
```javascript
// En src/features/drill/Drill.jsx
import { useProgressTracking } from './useProgressTracking.js'

const { handleResult, handleHintShown } = useProgressTracking(currentItem, onResult)

// En handleSubmit, doubleSubmit y reverseSubmit:
handleResult(extendedResult)

// En revealHint:
handleHintShown()
```

Además, el indicador visual de estado se alimenta del orquestador a través de un evento:
```javascript
// Evento del orquestador para UI
useEffect(() => {
  const onUpdate = (e) => setState(e.detail)
  window.addEventListener('progress-emo-update', onUpdate)
  return () => window.removeEventListener('progress-emo-update', onUpdate)
}, [])
```

## Estado de la Implementación

✅ Núcleo integrado: tracking, mastery por celda, SRS por celda, orquestador emocional (flow/momentum/confianza/temporal), indicador de Flow/Momentum en Drill.

🟨 En curso/próximo:
- Review Mode (SRS) en UI con `getDueItems(userId)` y métricas de due/overdue.
- Integrar señales de confianza/momentum en `ProgressDashboard` y recomendaciones.
- Tests adicionales: thresholds de momentum, calibración de confianza y ventanas circadianas.

## Próximos Pasos

1) UI de Review Mode (SRS) y filtro de items pendientes.
2) Recomendaciones basadas en señales emocionales en dashboard.
3) Suite de pruebas unitarias/integración ampliada.

## Beneficios para el Usuario

- **Seguimiento detallado** del progreso en cada celda
- **Feedback específico** sobre errores de conjugación
- **Práctica adaptativa** que se ajusta al nivel
- **Visualización clara** del dominio por áreas
- **Motivación** con objetivos y recompensas
- **Privacidad** con almacenamiento local-first

La implementación está lista para ser integrada completamente en la aplicación y proporcionará una experiencia de aprendizaje significativamente mejorada para los usuarios.
