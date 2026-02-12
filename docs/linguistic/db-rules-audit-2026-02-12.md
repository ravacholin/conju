# Auditoría general de base de datos y reglas

Fecha: 2026-02-12
Scope: integridad de `src/data/verbs.js` + coherencia de reglas en `src/lib/core/conjugationRules.js`

## Comandos ejecutados
- `npm run -s validate-integrity`
- `npm run -s audit:irregular-sources`
- `npm run -s audit:irregular-golden`
- `npm run -s audit:all`
- `npx vitest run src/lib/core/conjugationRules.voseo.test.js src/lib/core/conjugationRules.nonfinite.test.js src/lib/core/generator.comprehensive.test.js src/lib/core/generator.integration.test.js`
- Chequeo adicional ad-hoc: consistencia de `subjImpf` derivada de `pretIndef 3p` para todos los verbos.

## Resultado ejecutivo
- Estado general del pipeline de auditoría existente: **OK sin bloqueantes**.
- Estado real al agregar chequeo derivacional de `subjImpf`: **hay 4 verbos con error crítico de datos** (28 formas incorrectas en total).

## Hallazgos críticos (bloqueantes funcionales)

### 1) `subjImpf` inconsistente con `pretIndef 3p` en 4 verbos
Archivo afectado: `src/data/verbs.js`

- `preferir` (además con typo en pretérito: `priferieron`)
  - ejemplos: `priferira` (esperado `priferiera`), `priferiras` (`priferieras`), `priferirámos` (`priferiéramos`)
- `resolver`
  - ejemplos: `resolvira` (`resolviera`), `resolviras` (`resolvieras`), `resolvirámos` (`resolviéramos`)
- `competir`
  - ejemplos: `competira` (`competiera`), `competiras` (`competieras`), `competirámos` (`compitiéramos` según forma base cargada)
- `vestir`
  - ejemplos: `vestira` (`vestiera`), `vestiras` (`vestieras`), `vestirámos` (`vistiéramos` según forma base cargada)

Impacto: ejercicios de imperfecto de subjuntivo para esos verbos se corrigen mal.

## Hallazgos altos (calidad/consistencia)

### 2) Cobertura incompleta entre familias y dataset
Salida de `audit:all` / `validate-integrity`:
- Familias pedagógicas referencian lemas no presentes en dataset (ej. `reconocer`, `reponer`, `sentarse`, `mentir`, etc.).

Impacto: no rompe corrección directa, pero reduce cobertura real de familias y puede sesgar selección/adaptación.

### 3) Deriva entre fuentes de irregularidades no finitas
Salida de `audit:irregular-sources`:
- Overlap `patterns vs builder/rules` en gerundios/participios es `0`, con listas de lemas solo en patterns.

Impacto: riesgo de drift futuro entre fuente de datos y validadores/reglas.

## Reglas (motor)

### 4) Tests de reglas/generador relevantes: verdes
- `conjugationRules` y tests integrados ejecutados: **20 tests OK, 0 fallos**.
- `irregular-golden-report`: **44 checks, 0 mismatches**.

Nota: el set de golden actual no detecta los 4 casos críticos anteriores; falta cobertura específica de `subjImpf` derivacional.

## Diagnóstico
- El problema principal no es el algoritmo de corrección en runtime, sino **datos corruptos/inconsistentes en el dataset** para un subconjunto de verbos.
- La auditoría existente es útil, pero **no tiene un guardrail derivacional global para `subjImpf`**, por eso este tipo de bug pasó.

## Acciones recomendadas inmediatas
1. Corregir en `src/data/verbs.js` las 28 formas de `subjImpf` y el `pretIndef 3p` con typo en `preferir`.
2. Agregar test de integridad global: `subjImpf` debe derivar de `pretIndef 3p` (acento-insensitive) para todas las personas.
3. Integrar ese test al pipeline `audit:all` para que falle en CI ante regresión.
4. Extender `irregular-golden` con estos lemas para evitar falsos verdes.

