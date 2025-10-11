# Guía de Desarrollo - Spanish Conjugator

## 🚀 Quick Start

### Requisitos del Sistema
- Node.js ≥18.0.0
- npm ≥8.0.0
- Git

### Instalación
```bash
git clone <repository-url>
cd spanish-conjugator/conju
npm install
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo (puerto 5175)
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linting con ESLint
npm test             # Tests (Vitest)
node src/validate-data.js  # Validación de datos
```

## 🏗️ Arquitectura para Desarrolladores

### Flujo de Datos Principal
```
Usuario → App.jsx → Settings → Generator → Verbs Database → Drill Component
                      ↓
                   Cache System → Performance Optimizations
```

## 🛠️ Debugging y Sistema de Logs

- Usa el logger central (`createLogger`) para cualquier traza nueva. En producción solo se mostrarán errores por defecto.
- Para habilitar niveles más verbosos en tiempo de ejecución, abre la consola y ejecuta `window.__CONJU_DEBUG__.logger.setLogLevel('DEBUG')`.
- El namespace `window.__CONJU_DEBUG__` expone utilidades como:
  - `logger.getLogConfig()` para inspeccionar el nivel actual.
  - `bootstrap.getStatus()` para revisar si el arranque usó el fallback robusto.
  - `verbsLazy.getStatus()` y `verbChunks.getStatus()` para ver el estado de cachés de verbos.
  - `authService.getState()` y `googleAuth.isConfigured()` para diagnosticar autenticación.
- Puedes extender el panel registrando nuevas herramientas con `registerDebugTool('miModulo', {...})` desde `src/lib/utils/logger.js`.

### Estado Global (Zustand)
**Ubicación:** `src/state/settings.js`

**Configuraciones principales:**
```javascript
{
  // Configuración de usuario
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'ALL',
  useVoseo: boolean,
  useTuteo: boolean,
  useVosotros: boolean,
  
  // Modo de práctica
  practiceMode: 'mixed' | 'specific',
  specificMood: string | null,
  specificTense: string | null,
  verbType: 'all' | 'regular' | 'irregular',
  selectedFamily: string | null,
  
  // Features
  resistanceActive: boolean,
  reverseActive: boolean,
  doubleActive: boolean
}
```

## 📚 API de Componentes

### Generator API
**`chooseNext(forms, history)`**

Selecciona la próxima forma verbal para practicar.

```javascript
import { chooseNext } from './lib/core/generator.js'

const nextForm = chooseNext(allForms, userHistory)
// Returns: { lemma, mood, tense, person, value, ... }
```

**Parámetros:**
- `forms`: Array de todas las formas verbales disponibles
- `history`: Objeto con historial de respuestas del usuario

**Retorna:** Objeto con la forma verbal seleccionada

### Grader API  
**`grade(userAnswer, expectedAnswer, lemma)`**

Evalúa la respuesta del usuario.

```javascript
import { grade } from './lib/core/grader.js'

const result = grade('hablo', 'hablo', 'hablar')
// Returns: { correct: true, score: 1.0, feedback: null }
```

**Parámetros:**
- `userAnswer`: Respuesta ingresada por el usuario
- `expectedAnswer`: Respuesta correcta esperada
- `lemma`: Infinitivo del verbo (para contexto)

**Retorna:**
- `correct`: boolean
- `score`: number (0.0-1.0)
- `feedback`: string | null

### Irregular Families API

**`getFamiliesForTense(tense)`**
```javascript
import { getFamiliesForTense } from './lib/data/irregularFamilies.js'

const families = getFamiliesForTense('pres')
// Returns: Array of family objects for present tense
```

**`categorizeVerb(lemma, verbData)`**
```javascript
import { categorizeVerb } from './lib/data/irregularFamilies.js'

const families = categorizeVerb('pensar', verbObject)
// Returns: ['DIPHT_E_IE'] - Array of family IDs
```

## 🔧 Agregar Nuevos Verbos

### 1. Estructura Mínima
```javascript
{
  "id": "nuevo_verbo",
  "lemma": "infinitivo",
  "type": "regular" | "irregular",
  "paradigms": [
    {
      "regionTags": ["rioplatense", "la_general", "peninsular"],
      "forms": [
        // Formas mínimas requeridas:
        { "mood": "indicative", "tense": "pres", "person": "1s", "value": "forma" },
        { "mood": "indicative", "tense": "pres", "person": "3s", "value": "forma" },
        { "mood": "nonfinite", "tense": "inf", "person": "", "value": "infinitivo" }
        // ... más formas
      ]
    }
  ]
}
```

### 2. Ubicación de Archivos
- **Verbos prioritarios:** `src/data/priorityVerbs.js`
- **Verbos adicionales:** `src/data/additionalVerbs.js`
- **Base principal:** `src/data/verbs.js` (solo casos especiales)

### 3. Validación
```bash
# Siempre validar después de agregar verbos
node src/validate-data.js
```

### 4. Clasificación Automática
El sistema clasifica automáticamente verbos en familias irregulares basado en:
- Terminaciones (-car, -gar, -zar, -guir, etc.)
- Patrones conocidos (lista manual en `irregularFamilies.js`)
- Análisis de formas verbales

## 🎯 Agregar Nueva Familia Irregular

### 1. Definir la Familia
```javascript
// En src/lib/data/irregularFamilies.js
'NUEVA_FAMILIA': {
  id: 'NUEVA_FAMILIA',
  name: 'Descripción corta',
  description: 'verbo1, verbo2, verbo3',
  examples: ['verbo1', 'verbo2', 'verbo3', 'verbo4', 'verbo5', 'verbo6'],
  pattern: 'Explicación del patrón lingüístico',
  affectedTenses: ['pres', 'subjPres'], // Tiempos afectados
  paradigmaticVerbs: ['verbo1', 'verbo2'] // Verbos más representativos
}
```

### 2. Requisitos
- **Mínimo 6 ejemplos** (recomendado)
- **Patrón lingüístico claro**
- **Tiempos afectados específicos**
- **Descripción pedagógica**

### 3. Integración Automática
El sistema automáticamente:
- Incluye la familia en menús relevantes
- Aplica filtrado por tiempos afectados
- Categoriza verbos automáticamente

## 🧪 Testing y Debugging

### Debugging Cache
```javascript
// En consola del navegador
import { getCacheStats, clearAllCaches } from './lib/core/optimizedCache.js'

getCacheStats()    // Ver estadísticas
clearAllCaches()   // Limpiar todos los caches
```

### Debugging Generator
```javascript
// En consola del navegador
import { debugVerbAvailability } from './lib/core/generator.js'
debugVerbAvailability() // Ver verbos disponibles por combinación
```

### Tests Manuales Importantes
1. **Dialectos:** Verificar voseo/tuteo/vosotros
2. **Niveles:** Probar A1-C2 y ALL
3. **Familias:** Cada familia debe mostrar ejemplos relevantes
4. **Performance:** Generar 100 ejercicios consecutivos (<5s)

### Herramientas de Análisis
```bash
# Ver estado de familias
node src/analyze-families.js

# Detectar verbos faltantes
node src/analyze-missing-verbs.js

# Validación completa
node src/validate-data.js
```

## 🔍 Troubleshooting Común

### Error: "No valid form found"
**Causa:** Filtros demasiado restrictivos, no quedan formas elegibles
**Solución:**
1. Verificar configuración de nivel y dialecto
2. Revisar que el tipo de verbo seleccionado tenga ejemplos
3. Comprobar que la familia irregular tenga verbos disponibles

### Performance Lenta
**Causa:** Cache frío o demasiadas formas verbales
**Solución:**
1. Permitir warm-up completo (3-5 segundos)
2. Verificar `getCacheStats()` - hit rate >80%
3. Reducir nivel de detalle si es necesario

### Verbos Duplicados
**Causa:** Agregado manual sin verificar duplicados
**Solución:**
```bash
node src/validate-data.js  # Detecta automáticamente duplicados
```

### Familias Sin Ejemplos
**Causa:** Familia referencia verbos no existentes
**Solución:**
1. Verificar que ejemplos en familia existen en DB
2. Usar validador: `node src/validate-data.js`

## 📋 Checklist de Contribución

### Antes de Commit
- [ ] `npm run lint` pasa sin errores
- [ ] `node src/validate-data.js` exitoso (exit code 0)
- [ ] Probar en navegador: al menos 10 ejercicios consecutivos
- [ ] Verificar que no se introdujeron regresiones

### Pull Request
- [ ] Descripción clara del cambio
- [ ] Capturas de pantalla si hay cambios de UI
- [ ] Resultados de validación incluidos
- [ ] Actualizada documentación si es necesario

### Nuevas Features
- [ ] Documentación actualizada
- [ ] Tests manuales documentados
- [ ] Consideraciones de performance evaluadas
- [ ] Backward compatibility verificada

## 🚧 Limitaciones Conocidas

1. **Base de datos:** 186 errores de validación pendientes
2. **Cobertura:** Solo 32% de verbos de alta frecuencia
3. **Regiones:** Algunos verbos solo para España (`coger`)
4. **Performance:** Cache inicial requiere warm-up
5. **Mobile:** Optimizaciones pendientes para dispositivos lentos

## 🎓 Recursos Lingüísticos

### Referencias Gramaticales
- RAE Nueva gramática de la lengua española
- Gramática descriptiva de la lengua española (Bosque & Demonte)
- Manual de escritura académica (Estrella Montolío)

### Corpus y Frecuencia
- CREA (Corpus de Referencia del Español Actual)  
- CORPES XXI (Corpus del Español del Siglo XXI)
- Frequency Dictionary of Spanish (Davies & Davies)

### CEFR y Niveles
- Marco Común Europeo de Referencia (MCER)
- Plan Curricular del Instituto Cervantes
- Diccionario de aprendizaje de español (SM)

---

**Última actualización:** Agosto 2024
**Contribuidores:** Ver CONTRIBUTORS.md
**Issues:** GitHub Issues