# Comandos y Scripts del Sistema de Progreso

## Comandos de Desarrollo

### Iniciar la Aplicación
```bash
npm run dev
```

### Construir para Producción
```bash
npm run build
```

### Vista Previa de la Construcción
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

### Pruebas
```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas específicas del sistema de progreso
npx vitest run src/lib/progress/progress.test.js

# Ejecutar pruebas en modo watch
npx vitest src/lib/progress/progress.test.js
```

## Scripts Personalizados

### Verificación de Integración
```bash
# Verificar que el sistema de progreso se integra correctamente
node src/lib/progress/integrationCheck.js
```

### Inicialización Completa
```bash
# Inicializar completamente el sistema de progreso
node src/lib/progress/fullInitialization.js
```

### Exportación de Datos
```bash
# Exportar datos para backup
node src/lib/progress/exportData.js
```

### Importación de Datos
```bash
# Importar datos desde backup
node src/lib/progress/importData.js
```

## Estructura de Archivos

### Sistema de Progreso
```
src/lib/progress/
├── dataModels.js          # Modelos de datos
├── database.js            # Base de datos IndexedDB
├── mastery.js             # Cálculo de mastery
├── tracking.js            # Tracking de eventos
├── srs.js                 # Sistema SRS
├── verbInitialization.js  # Inicialización de verbos
├── itemManagement.js      # Gestión de ítems
├── errorClassification.js # Clasificación de errores
├── utils.js               # Utilidades generales
├── uiUtils.js             # Utilidades de UI
├── analytics.js           # Vistas analíticas
├── goals.js               # Objetivos semanales
├── teacherMode.js         # Modo docente
├── diagnosis.js           # Diagnóstico inicial
├── cloudSync.js           # Sincronización
├── index.js               # Punto de entrada
├── fullInitialization.js  # Inicialización completa
├── config.js              # Configuración
├── all.js                 # Exportación completa
├── autoInit.js            # Inicialización automática
└── progress.test.js       # Pruebas
```

### Componentes de UI
```
src/features/progress/
├── ProgressDashboard.jsx  # Dashboard principal
├── ProgressTracker.jsx    # Tracker de estadísticas
├── HeatMap.jsx            # Mapa de calor
├── CompetencyRadar.jsx    # Radar de competencias
├── progress.css           # Estilos
└── index.js               # Exportación
```

### Integración con Drill
```
src/features/drill/
├── useProgressTracking.js      # Hook de tracking
└── ProgressTrackingWrapper.jsx # Wrapper
```

## Variables de Entorno

### Configuración de Pruebas
```bash
# Para ejecutar pruebas en entorno específico
VITEST_ENV=test
```

### Configuración de Desarrollo
```bash
# Para habilitar logs detallados en desarrollo
NODE_ENV=development
```

## Depuración

### Logs del Sistema de Progreso
```javascript
// Habilitar logs detallados
localStorage.setItem('debug', 'spanish-conjugator:progress:*')
```

### Inspección de Base de Datos
```javascript
// En la consola del navegador
import { getAllFromDB, STORES } from './src/lib/progress/database.js'

// Ver todos los usuarios
getAllFromDB(STORES.USERS).then(console.log)

// Ver todos los verbos
getAllFromDB(STORES.VERBS).then(console.log)

// Ver todos los ítems
getAllFromDB(STORES.ITEMS).then(console.log)

// Ver todos los intentos
getAllFromDB(STORES.ATTEMPTS).then(console.log)

// Ver todos los mastery scores
getAllFromDB(STORES.MASTERY).then(console.log)

// Ver todos los schedules
getAllFromDB(STORES.SCHEDULES).then(console.log)
```

### Verificación de Estado
```javascript
// En la consola del navegador
import { 
  isProgressSystemInitialized, 
  getCurrentUserId,
  getSyncStatus
} from './src/lib/progress/index.js'

// Verificar si el sistema está inicializado
console.log('Sistema inicializado:', isProgressSystemInitialized())

// Obtener ID del usuario actual
console.log('Usuario actual:', getCurrentUserId())

// Ver estado de sincronización
console.log('Estado de sincronización:', getSyncStatus())
```

## Mantenimiento

### Limpieza de Datos
```javascript
// Limpiar todos los datos de progreso (usar con cuidado)
import { clearAllCaches } from './src/lib/progress/database.js'
clearAllCaches()
```

### Actualización de Esquema
Cuando se modifica el esquema de la base de datos:
1. Incrementar la versión en `src/lib/progress/database.js`
2. Actualizar la función `upgrade` con los cambios necesarios
3. Probar la migración

### Optimización de Rendimiento
```javascript
// Ver estadísticas de cache
import { getCacheStats } from './src/lib/progress/database.js'
console.log(getCacheStats())
```

## Despliegue

### Checklist de Despliegue
- [ ] Todas las pruebas pasan
- [ ] No hay errores en la consola
- [ ] El sistema de progreso se inicializa correctamente
- [ ] Los componentes de UI se renderizan sin errores
- [ ] La sincronización funciona (si está habilitada)
- [ ] La privacidad se mantiene según configuración

### Monitoreo en Producción
- [ ] Verificar logs de errores
- [ ] Monitorear tiempos de respuesta
- [ ] Verificar uso de memoria
- [ ] Confirmar sincronización correcta

## Solución de Problemas

### Errores Comunes

1. **"IndexedDB not supported"**
   - Verificar compatibilidad del navegador
   - Usar localStorage como fallback

2. **"Database upgrade failed"**
   - Verificar versión de base de datos
   - Revisar función de upgrade

3. **"User not initialized"**
   - Asegurar que `initProgressSystem()` se llama antes de usar otras funciones

4. **"Attempt not found"**
   - Verificar que `trackAttemptStarted()` se llama antes de `trackAttemptSubmitted()`

### Depuración de Pruebas

Si las pruebas fallan:
```bash
# Limpiar cache de Vitest
npx vitest --clearCache

# Ejecutar pruebas con más información
npx vitest --reporter=verbose src/lib/progress/progress.test.js
```

## Contribución

### Estilo de Código
- Seguir las convenciones existentes
- Usar JSDoc para documentar funciones
- Mantener cobertura de pruebas > 80%

### Nuevas Funcionalidades
1. Crear issue describiendo la funcionalidad
2. Crear rama desde `main`
3. Implementar funcionalidad
4. Agregar pruebas
5. Actualizar documentación
6. Crear pull request

### Reporte de Bugs
1. Crear issue con descripción detallada
2. Incluir pasos para reproducir
3. Agregar información del entorno (navegador, versión, etc.)
4. Incluir logs relevantes si es posible