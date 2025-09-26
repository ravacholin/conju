# Meaningful Practice - Nueva Arquitectura

## Resumen
Sistema rediseñado para práctica significativa de verbos con arquitectura modular, contenido dinámico y evaluación avanzada.

## Estructura de Directorios

### `/src/lib/meaningful-practice/`
- **`/content/`** - Gestión de contenido y personalización
  - `ExerciseContentManager.js` - Gestión centralizada de contenido
  - `DynamicContentGenerator.js` - Generación de contenido dinámico
  - `PersonalizationEngine.js` - Motor de personalización
  - `ContentVersioning.js` - Versionado y A/B testing

- **`/exercises/`** - Tipos de ejercicios y fábrica
  - `ExerciseFactory.js` - Fábrica de ejercicios
  - `StoryBuildingExercise.js` - Construcción de historias
  - `RolePlayingExercise.js` - Juegos de rol
  - `ProblemSolvingExercise.js` - Resolución de problemas
  - `MediaBasedExercise.js` - Ejercicios multimedia
  - `CreativeExpressionExercise.js` - Expresión creativa
  - `GamifiedChallenges.js` - Desafíos gamificados

- **`/assessment/`** - Evaluación y análisis
  - `LanguageAnalyzer.js` - Análisis NLP avanzado
  - `ErrorClassifier.js` - Clasificación de errores
  - `FeedbackGenerator.js` - Generación de feedback
  - `ProgressTracker.js` - Seguimiento de progreso

- **`/core/`** - Utilidades centrales
  - `ExerciseBase.js` - Clase base para ejercicios
  - `types.js` - Definiciones de tipos
  - `constants.js` - Constantes del sistema
  - `utils.js` - Utilidades comunes

### `/src/data/meaningful-practice/`
- **`/exercises/`** - Contenido de ejercicios en JSON
  - `timeline-exercises.json` - Ejercicios de timeline
  - `story-building.json` - Plantillas de construcción de historias
  - `role-playing.json` - Escenarios de rol
  - `problem-solving.json` - Tareas de resolución

- **`/scenarios/`** - Escenarios contextuales
  - `daily-life.json` - Vida cotidiana
  - `travel.json` - Viajes
  - `work.json` - Trabajo
  - `relationships.json` - Relaciones

- **`/templates/`** - Plantillas reutilizables
  - `conversation-templates.json` - Plantillas de conversación
  - `story-templates.json` - Plantillas de historias
  - `assessment-rubrics.json` - Rúbricas de evaluación

### `/src/components/meaningful-practice/`
- **`/exercises/`** - Componentes de ejercicios
  - `StoryBuildingComponent.jsx` - UI de construcción de historias
  - `RolePlayingComponent.jsx` - UI de juegos de rol
  - `ProblemSolvingComponent.jsx` - UI de resolución de problemas

- **`/renderers/`** - Renderizadores especializados
  - `ExerciseRenderer.jsx` - Renderizador base
  - `InteractiveRenderer.jsx` - Elementos interactivos
  - `MediaRenderer.jsx` - Contenido multimedia

- **`/ui/`** - Componentes UI reutilizables
  - `ExerciseHeader.jsx` - Encabezado de ejercicios
  - `FeedbackDisplay.jsx` - Mostrar feedback
  - `ProgressIndicator.jsx` - Indicador de progreso
  - `GamificationElements.jsx` - Elementos de gamificación

## Flujo de Datos

1. **Inicialización**: ExerciseFactory crea ejercicio basado en configuración
2. **Contenido**: ExerciseContentManager proporciona contenido personalizado
3. **Renderizado**: Componentes especializados muestran ejercicio
4. **Interacción**: Usuario completa ejercicio
5. **Evaluación**: LanguageAnalyzer analiza respuesta
6. **Feedback**: FeedbackGenerator proporciona retroalimentación
7. **Progreso**: ProgressTracker actualiza métricas

## Principios de Diseño

- **Modularidad**: Componentes separados por responsabilidad
- **Extensibilidad**: Fácil agregar nuevos tipos de ejercicio
- **Personalización**: Adaptación basada en usuario y progreso
- **Escalabilidad**: Soporte para crecimiento de contenido
- **Mantenibilidad**: Código limpio y bien documentado

## Integración

- **SRS**: Integración completa con sistema de repetición espaciada
- **Progress Tracking**: Métricas detalladas de progreso
- **Settings**: Respeta configuraciones de usuario (dialecto, nivel)
- **Learning Flow**: Se integra seamlessly con flujo existente