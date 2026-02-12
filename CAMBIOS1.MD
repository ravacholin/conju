# CAMBIOS1 - Plan Maestro de Implementacion

## Objetivo
Definir un plan ejecutable, incremental y verificable para resolver las mejoras pendientes identificadas en `CAMBIOS.MD`.

## Principios de ejecucion
- Cambios en slices pequenos, con pruebas por slice.
- Cada slice termina con: codigo + tests + update de documentacion.
- No mezclar refactor estructural con cambios de comportamiento en el mismo slice.
- Todo cambio de riesgo alto se protege con feature flag o rollout gradual cuando aplique.

## Fase 0 - Baseline y control (1 semana)
### 0.1 Instrumentacion minima obligatoria
- Medir baseline de:
- tiempo de carga dashboard (cold/warm),
- tiempo de generacion de item drill (p50/p95),
- tamaño de bundle por chunk.
- Entregables:
- script de medicion reproducible,
- reporte baseline en markdown.
- Criterio de aceptacion:
- reporte ejecutable en local/CI con resultados consistentes.

### 0.2 Definir SLAs tecnicos
- SLAs iniciales:
- Drill generation p95 < 50ms,
- Dashboard cold p95 < 1.5s,
- error rate en flujos criticos < 1%.
- Entregables:
- archivo `docs/performance-sla.md`.

---

## Fase 1 - Navegacion y arquitectura de eventos (2-3 semanas)
### 1.1 Contrato de eventos globales
- Crear catalogo unico de eventos (nombre, payload, origen, consumidores).
- Validar payloads con schema (Zod u otro).
- Reemplazar dispatch/listeners ad-hoc por helpers centralizados.
- Entregables:
- modulo `eventBus` tipado,
- migracion de eventos `progress:*` principales.

### 1.2 Unica fuente de verdad de navegacion
- Elegir estrategia final:
- A) React Router, o
- B) router actual + state machine formal.
- Migrar rutas criticas primero: home, onboarding, drill, progress.
- Eliminar sincronizacion duplicada URL/store/hooks.
- Entregables:
- ADR de decision,
- rutas criticas migradas,
- fallback de rollback.

### 1.3 E2E de navegacion critica
- Implementar Playwright para:
- onboarding end-to-end,
- back/forward browser,
- entrada/salida de drill,
- navegacion a progress y retorno.
- Criterio de aceptacion:
- suite estable en CI sin flakes > 2%.

---

## Fase 2 - Estado y persistencia (2 semanas)
### 2.1 Separacion definitiva de estado
- Auditar `useSettings` y mover todo estado efimero restante a stores de sesion.
- Bloquear set de keys desconocidas en runtime.
- Entregables:
- checklist de claves,
- migraciones de estado,
- tests de regresion de hidratacion.

### 2.2 Versionado y migraciones
- Versionar schema de settings.
- Agregar migraciones forward para versiones antiguas.
- Criterio de aceptacion:
- abrir app con snapshots viejos sin perdida de configuracion valida.

### 2.3 Persistencia coherente
- Revisar localStorage + IndexedDB para reducir write races.
- Unificar estrategia de debounce y orden de escritura.

---

## Fase 3 - Motor de generacion (2-4 semanas)
### 3.1 Indices de datos por combinacion
- Precomputar indices por `mood|tense|person|region`.
- Integrar al pipeline de seleccion.

### 3.2 Reporte causal de pool vacio
- Estandarizar motivo de descarte por filtro.
- Exponer causas en UI + acciones recomendadas.

### 3.3 Medicion de performance del generador
- Benchmarks en CI para evitar regresiones de p95.

---

## Fase 4 - Calidad de datos linguisticos (2-3 semanas)
### 4.1 Source of truth unico
- Consolidar irregularidades/reglas en estructura canonical.
- Deprecar duplicados y backups inconsistentes.

### 4.2 Suite regresiva linguistica
- Fixtures estables por verbos top + casos limite.
- Golden tests de conjugaciones y errores esperados.

### 4.3 Reporte de inconsistencias
- Script que detecte conflictos entre reglas/tablas.
- Publicar reporte en CI artifacts.

---

## Fase 5 - Progreso, analytics y UX accionable (2 semanas)
### 5.1 Reducir complejidad del dashboard
- Mantener solo bloques de alto impacto en primera vista.
- Mover analiticas pesadas secundarias a expansion under-demand.

### 5.2 Grafo de cache por dependencia
- Documentar que invalida que.
- Reglas explicitas de TTL por tipo de dato.

### 5.3 Insights accionables
- Cada tarjeta de progreso debe tener CTA directo y medible.

---

## Fase 6 - Accesibilidad y UX (1-2 semanas)
### 6.1 Auditoria a11y automatica
- Integrar `axe` en tests de componentes clave.

### 6.2 Focus management
- Revisar foco en onboarding, modales, drill feedback.

### 6.3 Contraste y escalado mobile
- Ajustes de contraste/tamano en pantallas de uso diario.

---

## Fase 7 - Seguridad y privacidad (1-2 semanas)
### 7.1 Sync tokens
- Eliminar dependencia de secretos en frontend cuando aplique.
- Diseñar intercambio seguro via backend/token exchange.

### 7.2 Politica de datos
- Documentar datos recolectados, retencion y opt-in analytics.
- Mostrar controles al usuario en UI de configuracion.

---

## Fase 8 - Operacion, CI y mantenimiento (1 semana)
### 8.1 Presupuestos de performance en CI
- Falla build si excede:
- bundle size,
- tiempos criticos baseline + tolerancia.

### 8.2 Hygiene de repositorio
- Limpiar artefactos legacy/backups obsoletos.
- Documentar checklist de release tecnica.

### 8.3 Changelog tecnico por release
- Formato fijo: cambios, riesgo, rollback, metricas.

---

## Orden sugerido de ejecucion (sprints)
1. Sprint A: Fase 0 + 1.1
2. Sprint B: 1.2 + 1.3
3. Sprint C: Fase 2 completa
4. Sprint D: Fase 3.1 + 3.2
5. Sprint E: 3.3 + Fase 4.1
6. Sprint F: 4.2 + 4.3
7. Sprint G: Fase 5
8. Sprint H: Fase 6 + Fase 7
9. Sprint I: Fase 8 + hardening final

## Definicion de terminado (DoD)
- Codigo mergeado con tests verdes.
- Sin warnings de lint nuevos en archivos tocados.
- Documentacion actualizada (`CAMBIOS.MD` + docs tecnicos).
- Metricas antes/despues registradas para cada fase.

## Riesgos y mitigacion
- Riesgo: migracion de routing rompe navegacion.
- Mitigacion: feature flag + E2E + rollout gradual.

- Riesgo: refactor de datos linguisticos introduce regresiones.
- Mitigacion: golden tests + comparador before/after.

- Riesgo: optimizaciones de cache oculten errores de invalidez.
- Mitigacion: trazas de invalidacion + tests de eventos.

## Primer backlog inmediato (proximo paso concreto)
1. [x] Crear `docs/performance-sla.md` y baseline inicial.
2. [x] Crear catalogo de eventos globales con schema.
3. [x] Inicializar Playwright con 3 escenarios criticos de navegacion.

## Siguiente backlog activo (Fase 1.2)
1. [x] Definir ADR de navegacion y contrato canonico de ruta.
2. [x] Migrar rutas criticas para usar exclusivamente el contrato (`home`, `onboarding`, `drill`, `progress`).
3. [x] Agregar cobertura E2E extra para regresiones de URL canónica.

## Siguiente backlog activo (Fase 2.1)
1. [x] Bloquear `set` de keys desconocidas en `useSettings` en runtime.
2. [ ] Auditar escrituras restantes a `useSettings` y mover estado efimero pendiente a store de sesion.
3. [ ] Agregar checklist de claves de estado persistente vs efimero.
