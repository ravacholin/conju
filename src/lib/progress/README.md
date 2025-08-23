# Sistema de Progreso y Analíticas

## Descripción General

El sistema de progreso y analíticas para el conjugador de español está diseñado para evaluar y seguir el desempeño del usuario en la conjugación de verbos en español. El sistema funciona local-first con sincronización opcional a la nube, respetando la privacidad del usuario.

## Arquitectura

### Componentes Principales

1. **Modelo de Datos**: Define las estructuras para usuarios, verbos, ítems, intentos, mastery y schedules.
2. **Base de Datos**: Utiliza IndexedDB para almacenamiento local de todos los datos de progreso.
3. **Cálculo de Mastery**: Implementa algoritmos para calcular el dominio del usuario por celda (modo-tiempo-persona).
4. **Tracking de Eventos**: Registra eventos de práctica como intentos, pistas, sesiones, etc.
5. **Sistema SRS**: Implementa un sistema de repetición espaciada para la revisión de conocimientos.
6. **Vistas Analíticas**: Proporciona componentes de UI para visualizar el progreso del usuario.
7. **Modo Docente**: Ofrece funcionalidades para exportar datos y compartir progreso con docentes.

### Ejes de Medición

- **Modo**: indicativo, subjuntivo, imperativo
- **Tiempo**: presente, pretérito, imperfecto, futuro, condicional, etc.
- **Persona**: 1ª, 2ª, 3ª singular y plural
- **Tipo de verbo**: regular, irregular, con diptongo, con cambio ortográfico
- **Frecuencia léxica**: alta, media, baja

## Fórmulas y Algoritmos

### Cálculo de Mastery Score

```
M_C = 100 · Σ(w_i · d_i · acierto_i) / Σ(w_i · d_i) - penalización_pistas
```

Donde:
- `w_i` = peso por recencia (decaimiento exponencial)
- `d_i` = dificultad de la forma verbal
- `acierto_i` = 1 si correcto, 0 si incorrecto
- `penalización_pistas` = 5 puntos por cada pista usada

### Recencia

```
w = e^(-Δdías/τ)
```

Donde τ = 10 días (valor recomendado)

### Dificultad Base

- Regular: 1.0
- Diptongo: 1.1
- Cambio ortográfico: 1.15
- Altamente irregular: 1.2
- Frecuencia baja: +0.05

## Eventos Mínimos

- `attempt_started`
- `attempt_submitted` {correcta: bool, latencia_ms, pistas_usadas, errores:[]}
- `session_ended` {duración, modo, device}
- `hint_shown`
- `streak_incremented`
- `tense_drill_started/ended`

## Taxonomía de Errores

- Persona equivocada
- Terminación verbal
- Raíz irregular
- Acentuación
- Pronombres clíticos
- Ortografía (g/gu, c/qu, z/c)
- Concordancia número
- Modo equivocado

## Práctica Adaptativa

### Selector de Próximo Ítem

- 50% celdas débiles (M < 60)
- 30% área tibia (60 ≤ M < 80)
- 20% repaso espaciado (M ≥ 80)

### Curva de Olvido (SRS)

- Acierto sin pista: próximo en 1d, 3d, 7d, 14d, 30d (multiplicando por 2)
- Fallo: reinicia al intervalo anterior
- Uso de pista: no sube de nivel

## Vistas Analíticas

1. **Mapa de calor por modo y tiempo**
2. **Radar por competencias**
3. **Línea de progreso temporal**
4. **Objetivos semanales**
5. **Diagnósticos y micro-retos**

## Modo Docente

- Exportar CSV o PDF
- Filtrar por lista de verbos de clase
- Código breve de sesión para compartir

## Instrumentación y Almacenamiento

### Esquema Mínimo

- `users(id)`
- `verbs(id, lema, patrón, frecuencia)`
- `items(id, verb_id, modo, tiempo, persona)`
- `attempts(id, item_id, correct, latency_ms, hints, error_tags[], created_at)`
- `mastery(id, user_id, modo, tiempo, persona, M, n, updated_at)`
- `schedules(id, user_id, modo, tiempo, persona, next_due)`

## UX en la App

- Botón "Progreso" en el tab bar
- Arriba: radar y M global
- Abajo: mapa de calor
- Detalle de celda: semáforo, latencia, errores comunes
- Centro de retos: tarjetas automáticas

## Privacidad y Consentimiento

- Todo se calcula localmente
- Sincronización opcional y anonimizada
- Modo incógnito de práctica sin logging

## Roadmap

- **V0**: Eventos y mastery por celda, mapa de calor, botón "practicar 6"
- **V1**: Radar, SRS, diagnósticos automáticos, exportar CSV
- **V2**: Objetivos semanales, modo docente, comparativas por listas de verbos