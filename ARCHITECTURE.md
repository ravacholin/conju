# Spanish Conjugator - Documentación Técnica

## 🏗️ Arquitectura del Sistema

### Visión General
Spanish Conjugator es una aplicación React que enseña conjugaciones verbales en español mediante práctica interactiva. El sistema está diseñado para ser escalable, mantenible y lingüísticamente preciso.

### Estructura de Directorios

```
src/
├── data/                     # Datos de verbos y configuración
│   ├── verbs.js             # Base de datos principal de verbos
│   ├── priorityVerbs.js     # Verbos prioritarios agregados
│   ├── additionalVerbs.js   # Verbos adicionales
│   └── curriculum.json      # Curriculum por niveles CEFR
├── lib/                     # Lógica de negocio
│   ├── core/               # Funcionalidades centrales
│   │   ├── generator.js    # Generador de ejercicios
│   │   ├── grader.js       # Evaluación de respuestas
│   │   ├── levelVerbFiltering.js # Filtrado por nivel
│   │   ├── optimizedCache.js # Sistema de cache inteligente
│   │   └── validators.js   # Validaciones automáticas
│   ├── data/               # Estructuras de datos
│   │   ├── irregularFamilies.js # Familias de verbos irregulares
│   │   ├── simplifiedFamilyGroups.js # Agrupaciones simplificadas
│   │   ├── criticalVerbCategories.js # Categorías críticas
│   │   └── levels.js       # Definiciones de niveles
│   └── utils/              # Utilidades
│       ├── verbLabels.js   # Etiquetas y traducciones
│       ├── addCommonVerbs.js # Agregado de verbos comunes
│       └── verifyVerbAvailability.js # Verificación de disponibilidad
├── features/               # Componentes de funcionalidades
│   └── drill/
│       └── Drill.jsx      # Componente de ejercicios
├── state/                 # Manejo de estado
│   └── settings.js       # Configuraciones de usuario
└── App.jsx               # Componente principal
```

## 🧠 Componentes Clave

### 1. Generator (Generador de Ejercicios)
**Ubicación:** `src/lib/core/generator.js`

**Responsabilidad:** Selecciona el siguiente verbo/forma para practicar basado en:
- Nivel del usuario (A1-C2)
- Configuraciones de dialecto (tuteo/voseo/vosotros)
- Modo de práctica (mixto/específico)
- Tipo de verbos (regulares/irregulares/todos)
- Familia de irregularidades seleccionada
- Historial de respuestas (sistema SRS)

**Optimizaciones:**
- Cache inteligente con TTL
- Lookups pre-computados (O(1))
- Filtrado eficiente con Sets

**Algoritmo:**
1. Filtrar formas elegibles según configuración
2. Aplicar pesos basados en historial SRS
3. Seleccionar aleatoriamente con distribución ponderada
4. Cachear resultado para próximas consultas

### 2. Irregular Families (Familias Irregulares)
**Ubicación:** `src/lib/data/irregularFamilies.js`

**Total:** 31 familias de verbos irregulares

**Categorías principales:**
- **Cambios de raíz:** e→ie, o→ue, u→ue, e→i
- **Alternancias consonánticas:** Verbos en -zco, -jo, -go
- **Cambios ortográficos:** -car→-qu, -gar→-gu, -zar→-c
- **Pretéritos fuertes:** -uv-, -u-, -i-, -j-
- **Formas no conjugadas:** Gerundios/participios irregulares
- **Categorías especializadas:** Defectivos, doble participio, acentuación

**Nuevas categorías (v2024):**
- `DEFECTIVE_VERBS`: Verbos defectivos (soler, abolir)
- `DOUBLE_PARTICIPLES`: Doble participio (freír/frito)
- `ACCENT_CHANGES`: Cambios de acentuación (prohibir→prohíbo)
- `MONOSYLLABIC_IRREG`: Monosílabos irregulares (ir, ser, dar)

### 3. Cache System (Sistema de Cache)
**Ubicación:** `src/lib/core/optimizedCache.js`

**Características:**
- **TTL inteligente:** 3-15 minutos según tipo de dato
- **LRU eviction:** Elimina entradas menos usadas
- **Límite de memoria:** 1000-1500 entradas máx
- **Warm-up:** Pre-carga datos frecuentes al iniciar

**Tipos de cache:**
- `verbCategorizationCache`: Categorización de verbos (10 min TTL)
- `formFilterCache`: Filtrado de formas (3 min TTL)
- `combinationCache`: Combinaciones frecuentes (15 min TTL)

### 4. Validation System (Sistema de Validación)
**Ubicación:** `src/lib/core/validators.js`

**Validaciones automáticas:**
- **Estructura de verbos:** IDs, lemmas, tipos, paradigmas
- **Formas verbales:** Completitud, consistencia, valores requeridos
- **Familias irregulares:** Ejemplos, tiempos afectados
- **Duplicados:** Detección automática de verbos duplicados
- **Integridad referencial:** Verbos mencionados en familias

## 📊 Base de Datos de Verbos

### Estructura de un Verbo
```javascript
{
  "id": "unique_id",
  "lemma": "infinitivo",
  "type": "regular" | "irregular",
  "paradigms": [
    {
      "regionTags": ["rioplatense", "la_general", "peninsular"],
      "forms": [
        {
          "mood": "indicative" | "subjunctive" | "imperative" | "conditional" | "nonfinite",
          "tense": "pres" | "pretIndef" | "fut" | ...,
          "person": "1s" | "2s_tu" | "2s_vos" | "3s" | "1p" | "2p_vosotros" | "3p" | "",
          "value": "forma_conjugada",
          "accepts": { "vos": "forma_voseante" } // opcional
        }
      ]
    }
  ]
}
```

### Estadísticas Actuales
- **Total verbos:** ~94 (post-deduplicación)
- **Verbos de alta frecuencia:** 77/242 cubiertos (32%)
- **Familias irregulares:** 31 familias
- **Todas las familias:** ≥6 verbos de ejemplo
- **Errores detectados:** 186 (en proceso de corrección)

## 🔧 Herramientas de Desarrollo

### Scripts de Análisis
- `analyze-families.js`: Estado de familias irregulares
- `analyze-missing-verbs.js`: Verbos faltantes de alta frecuencia
- `validate-data.js`: Validación completa de datos

### Comandos Útiles
```bash
# Validar todos los datos
node src/validate-data.js

# Analizar cobertura de verbos
node src/analyze-missing-verbs.js

# Estado de familias
node src/analyze-families.js

# Ver estadísticas de cache (en consola del navegador)
getCacheStats()
```

## 🚀 Performance

### Optimizaciones Implementadas
1. **Cache inteligente** con evicción LRU
2. **Lookups O(1)** con Map() pre-computados  
3. **Filtrado eficiente** con Sets para combinaciones permitidas
4. **Lazy loading** de datos según necesidad
5. **Warm-up automático** de caches críticos

### Métricas Esperadas
- **Tiempo de respuesta:** <50ms para generación de ejercicios
- **Cache hit rate:** >80% después del warm-up
- **Memory usage:** <20MB para caches
- **Startup time:** <500ms para warm-up inicial

## 🧪 Testing y Validación

### Validación Automática
El sistema incluye validación automática que detecta:
- Verbos duplicados
- Formas verbales faltantes
- Inconsistencias en conjugaciones
- Referencias rotas entre familias y verbos
- Estructura de datos inválida

### Niveles de Validación
1. **Validación rápida:** Errores críticos únicamente
2. **Validación completa:** Errores + advertencias
3. **Exit codes:** 0 = éxito, 1 = errores encontrados

### Integración CI/CD
```bash
# En pipeline de CI
npm test
node src/validate-data.js
```

## 🔮 Roadmap Técnico

### Próximas Mejoras
1. **Base de datos:** Completar verbos faltantes (165 pendientes)
2. **Performance:** Implementar service workers para cache offline
3. **Validación:** Auto-corrección de errores menores
4. **Analytics:** Métricas de uso y rendimiento
5. **Testing:** Tests unitarios automatizados
6. **Documentation:** Guías de contribución para nuevos verbos

### Arquitectura Futura
- **Microservicios:** Separar generador y validador
- **Database:** Migrar a base de datos real (SQLite/PostgreSQL)
- **API:** REST API para datos de verbos
- **Internacionalización:** Soporte para múltiples idiomas de interfaz

---

**Última actualización:** Agosto 2024  
**Versión:** 2.0  
**Mantenedor:** Spanish Conjugator Team