# Comandos del Sistema de Progreso - Referencia Rápida

## 🚀 Comandos de Desarrollo

### Iniciar Entorno de Desarrollo
```bash
npm run dev
```

### Construir para Producción
```bash
npm run build
```

### Vista Previa de Producción
```bash
npm run preview
```

### Linting de Código
```bash
npm run lint
```

## 🧪 Comandos de Pruebas

### Ejecutar Todas las Pruebas
```bash
npm test
```

### Ejecutar Pruebas del Sistema de Progreso
```bash
npx vitest run src/lib/progress/progress.test.js
```

### Ejecutar Pruebas en Modo Watch
```bash
npx vitest src/lib/progress/progress.test.js
```

### Limpiar Cache de Pruebas
```bash
npx vitest --clearCache
```

### Ejecutar con Reporte Detallado
```bash
npx vitest --reporter=verbose src/lib/progress/progress.test.js
```

## 📊 Comandos de Inspección de Datos

### Verificar Estado de la Base de Datos
```javascript
// En consola del navegador
import { getCacheStats } from './src/lib/progress/database.js'
console.log(getCacheStats())
```

### Inspeccionar Datos Específicos
```javascript
// En consola del navegador
import { getAllFromDB, STORES } from './src/lib/progress/database.js'

// Ver todos los usuarios
getAllFromDB(STORES.USERS).then(data => console.table(data))

// Ver todos los verbos
getAllFromDB(STORES.VERBS).then(data => console.table(data))

// Ver todos los ítems
getAllFromDB(STORES.ITEMS).then(data => console.table(data))

// Ver todos los intentos
getAllFromDB(STORES.ATTEMPTS).then(data => console.table(data))

// Ver todos los mastery scores
getAllFromDB(STORES.MASTERY).then(data => console.table(data))

// Ver todos los schedules
getAllFromDB(STORES.SCHEDULES).then(data => console.table(data))
```

## 🔧 Comandos de Depuración

### Habilitar Logs Detallados
```javascript
// En consola del navegador
localStorage.setItem('debug', 'spanish-conjugator:progress:*')
```

### Verificar Inicialización del Sistema
```javascript
// En consola del navegador
import { 
  isProgressSystemInitialized, 
  getCurrentUserId,
  getSyncStatus
} from './src/lib/progress/index.js'

console.log('Sistema inicializado:', isProgressSystemInitialized())
console.log('Usuario actual:', getCurrentUserId())
console.log('Estado de sincronización:', getSyncStatus())
```

## 📈 Comandos de Análisis

### Obtener Datos Analíticos
```javascript
// En consola del navegador
import { 
  getHeatMapData, 
  getCompetencyRadarData,
  getUserStats
} from './src/lib/progress/analytics.js'

getHeatMapData().then(data => console.log('Mapa de calor:', data))
getCompetencyRadarData().then(data => console.log('Radar de competencias:', data))
getUserStats().then(data => console.log('Estadísticas del usuario:', data))
```

### Verificar Cálculos de Mastery
```javascript
// En consola del navegador
import { 
  calculateMasteryForItem, 
  calculateMasteryForCell
} from './src/lib/progress/mastery.js'

// Calcular para un ítem específico
calculateMasteryForItem('item-id', verbObject).then(result => {
  console.log('Mastery para ítem:', result)
})
```

## 🔄 Comandos de Sincronización

### Verificar Estado de Sincronización
```javascript
// En consola del navegador
import { getSyncStatus } from './src/lib/progress/cloudSync.js'
console.log(getSyncStatus())
```

### Forzar Sincronización
```javascript
// En consola del navegador
import { forceSync } from './src/lib/progress/cloudSync.js'
forceSync().then(success => {
  console.log('Sincronización forzada:', success ? 'Éxito' : 'Fallida')
})
```

## 📤 Comandos de Exportación/Importación

### Exportar Datos para Backup
```javascript
// En consola del navegador
import { exportDataForBackup } from './src/lib/progress/cloudSync.js'
exportDataForBackup().then(data => {
  console.log('Datos exportados:', data)
  // Guardar en archivo si es necesario
})
```

### Importar Datos desde Backup
```javascript
// En consola del navegador
import { importDataFromBackup } from './src/lib/progress/cloudSync.js'
// data debe ser un objeto con los datos exportados
importDataFromBackup(data).then(() => {
  console.log('Datos importados correctamente')
})
```

## 🧹 Comandos de Mantenimiento

### Limpiar Caches
```javascript
// En consola del navegador
import { clearAllCaches } from './src/lib/progress/database.js'
clearAllCaches()
```

### Verificar Integración
```bash
node src/lib/progress/integrationCheck.js
```

### Inicialización Completa
```bash
node src/lib/progress/fullInitialization.js
```

## 🌐 Comandos de Red

### Verificar Conectividad
```javascript
// En consola del navegador
console.log('Navegador online:', navigator.onLine)
```

### Manejar Cambios de Conectividad
```javascript
// En consola del navegador
window.addEventListener('online', () => console.log('Conectado a internet'))
window.addEventListener('offline', () => console.log('Sin conexión a internet'))
```

## 📋 Comandos de Verificación

### Verificar Estado del Sistema
```javascript
// En consola del navegador
import { 
  isProgressSystemInitialized,
  getCurrentUserId
} from './src/lib/progress/index.js'

console.log('Sistema inicializado:', isProgressSystemInitialized())
console.log('ID de usuario:', getCurrentUserId())
```

### Verificar Componentes de UI
```javascript
// En consola del navegador
import { 
  ProgressDashboard,
  ProgressTracker,
  HeatMap,
  CompetencyRadar
} from './src/features/progress/index.js'

console.log('Componentes disponibles:', {
  ProgressDashboard,
  ProgressTracker,
  HeatMap,
  CompetencyRadar
})
```

## 🛠️ Variables de Entorno

### Para Desarrollo
```bash
NODE_ENV=development
```

### Para Pruebas
```bash
VITEST_ENV=test
```

### Para Producción
```bash
NODE_ENV=production
```

## 📚 Atajos Útiles

### Acceso Rápido a Funciones Comunes
```javascript
// En consola del navegador
import * as progress from './src/lib/progress/all.js'

// Ahora puedes acceder a todas las funciones
console.log(progress.calculateMasteryForItem)
console.log(progress.trackAttemptStarted)
console.log(progress.getHeatMapData)
```

### Ver Todas las Funciones Disponibles
```javascript
// En consola del navegador
import * as progress from './src/lib/progress/all.js'
console.log(Object.keys(progress))
```

---

## 🎯 Comandos Más Utilizados

### 1. Ejecutar pruebas del sistema de progreso
```bash
npx vitest run src/lib/progress/progress.test.js
```

### 2. Inspeccionar datos de mastery
```javascript
import { getAllFromDB, STORES } from './src/lib/progress/database.js'
getAllFromDB(STORES.MASTERY).then(data => console.table(data))
```

### 3. Verificar inicialización del sistema
```javascript
import { isProgressSystemInitialized } from './src/lib/progress/index.js'
console.log(isProgressSystemInitialized())
```

### 4. Habilitar debugging detallado
```javascript
localStorage.setItem('debug', 'spanish-conjugator:progress:*')
```

---

Esta referencia rápida proporciona acceso a los comandos más importantes para trabajar con el sistema de progreso. Para información más detallada, consulta la documentación completa en `DOCUMENTATION_INDEX.md`.