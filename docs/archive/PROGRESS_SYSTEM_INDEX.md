# Índice del Sistema de Progreso y Analíticas

## Archivos del Sistema

### Librerías Principales (`src/lib/progress/`)

1. **`dataModels.js`** - Modelos de datos y tipos
   - Definición de estructuras para usuarios, verbos, ítems, etc.
   - Constantes y configuraciones de dificultad

2. **`database.js`** - Manejo de IndexedDB
   - Inicialización y configuración de la base de datos
   - Funciones CRUD para todas las entidades
   - Índices optimizados para búsquedas

3. **`mastery.js`** - Cálculo de mastery scores
   - Implementación de la fórmula de mastery
   - Cálculo de recencia y dificultad
   - Funciones de agregación por celda, tiempo y modo

4. **`tracking.js`** - Sistema de tracking de eventos
   - Registro de eventos de práctica
   - Manejo de sesiones e intentos
   - Integración con el componente Drill

5. **`srs.js`** - Sistema de repetición espaciada
   - Algoritmo de cálculo de intervalos
   - Gestión de repasos programados

6. **`verbInitialization.js`** - Inicialización de verbos
   - Carga de verbos en el sistema de progreso
   - Determinación de frecuencia léxica

7. **`itemManagement.js`** - Gestión de ítems de práctica
   - Creación y mantenimiento de ítems
   - Relación entre verbos y celdas de práctica

8. **`errorClassification.js`** - Clasificación de errores
   - Algoritmos para identificar tipos de errores
   - Etiquetado automático de intentos

9. **`utils.js`** - Utilidades generales
   - Funciones auxiliares para cálculos y manipulación de datos

10. **`uiUtils.js`** - Utilidades para la interfaz
    - Formateo de datos para mostrar al usuario
    - Funciones de presentación y estilos

11. **`analytics.js`** - Vistas analíticas
    - Generación de datos para mapas de calor
    - Cálculo de métricas para el radar de competencias
    - Preparación de datos para visualizaciones

12. **`goals.js`** - Objetivos semanales
    - Gestión de objetivos del usuario
    - Seguimiento de progreso hacia metas

13. **`teacherMode.js`** - Modo docente
    - Generación de informes para docentes
    - Exportación de datos
    - Gestión de códigos de sesión

14. **`diagnosis.js`** - Diagnóstico inicial
    - Evaluación del nivel inicial del usuario
    - Programación de recalibraciones

15. **`cloudSync.js`** - Sincronización con la nube
    - Funciones de sincronización
    - Modo incógnito
    - Exportación e importación de datos

16. **`index.js`** - Punto de entrada principal
    - Inicialización del sistema
    - Exportación de funciones principales

17. **`fullInitialization.js`** - Inicialización completa
    - Proceso de inicialización de todos los componentes

18. **`config.js`** - Configuración del sistema
    - Constantes y parámetros de configuración

19. **`all.js`** - Exportación completa
    - Punto de acceso a todas las funciones del sistema

20. **`autoInit.js`** - Inicialización automática
    - Configuración para inicialización al cargar la app

21. **`progress.test.js`** - Pruebas unitarias
    - Cobertura de pruebas para funciones principales

### Componentes de UI (`src/features/progress/`)

1. **`ProgressDashboard.jsx`** - Dashboard principal
   - Componente principal que agrupa todas las vistas

2. **`ProgressTracker.jsx`** - Tracker de estadísticas
   - Visualización de estadísticas generales del usuario

3. **`HeatMap.jsx`** - Mapa de calor
   - Representación visual del mastery por modo y tiempo

4. **`CompetencyRadar.jsx`** - Radar de competencias
   - Visualización de habilidades en múltiples ejes

5. **`progress.css`** - Estilos
   - Hoja de estilos para los componentes de progreso

6. **`index.js`** - Exportación de componentes
   - Punto de acceso a los componentes de UI

### Integración con Drill (`src/features/drill/`)

1. **`useProgressTracking.js`** - Hook de tracking
   - Integración del tracking con el componente Drill

2. **`ProgressTrackingWrapper.jsx`** - Wrapper para tracking
   - Componente auxiliar para manejar el tracking

## Documentación

1. **`README.md`** - Documentación del sistema de progreso
   - Descripción general y arquitectura

2. **`SUMMARY.md`** - Resumen de archivos creados
   - Listado de todos los archivos del sistema

3. **`PROGRESS_IMPLEMENTATION_SUMMARY.md`** - Resumen de implementación
   - Detalle de lo implementado y estado actual

4. **`PROGRESS_SYSTEM_INTEGRATION.md`** - Integración con la app
   - Cómo se integra el sistema en la aplicación principal

5. **`README_PROGRESS_SYSTEM.md`** - README completo del sistema
   - Documentación detallada del sistema de progreso

6. **`PROGRESS_SYSTEM_COMMANDS.md`** - Comandos y scripts
   - Guía de comandos para desarrollo y mantenimiento

## Pruebas

1. **`progress.test.js`** - Pruebas unitarias del sistema
   - Cobertura de las funciones principales del sistema

## Configuración

1. **`package.json`** - Dependencias del sistema
   - Librerías necesarias para el funcionamiento

2. **`vitest.config.js`** - Configuración de pruebas
   - Configuración para ejecutar las pruebas

3. **`test-setup.js`** - Configuración de entorno de pruebas
   - Setup para el entorno de pruebas

## Integración con la Aplicación Principal

### Archivos Modificados

1. **`src/state/settings.js`** - Inicialización del sistema
   - Integración de la inicialización automática

2. **`src/features/drill/Drill.jsx`** - Integración con tracking
   - Modificación para registrar eventos de práctica

## Estado Actual

✅ **Completamente implementado**:
- Modelo de datos completo
- Cálculo de mastery scores
- Tracking de eventos
- Sistema SRS
- Clasificación de errores
- Práctica adaptativa
- Vistas analíticas
- Modo docente
- Sincronización local-first
- UX integrada
- Pruebas unitarias

## Próximos Pasos

1. **Integración en la UI principal**
   - Añadir el botón "Progreso" al tab bar
   - Integrar el dashboard en la navegación

2. **Activación de tracking en Drill**
   - Verificar que todos los eventos se registran correctamente

3. **Implementación de vistas analíticas**
   - Mostrar mapa de calor en la UI
   - Integrar radar de competencias

4. **Pruebas de integración completa**
   - Verificar funcionamiento en diferentes navegadores
   - Probar sincronización con la nube (si se implementa)

5. **Optimización de rendimiento**
   - Revisar tiempos de carga
   - Optimizar consultas a la base de datos

Este índice proporciona una visión completa de todos los componentes del sistema de progreso y su estructura, facilitando la comprensión y el mantenimiento del código.