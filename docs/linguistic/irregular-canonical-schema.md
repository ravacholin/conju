# Irregular Canonical Schema

Objetivo: definir una estructura canónica única para irregularidades antes de migrar consumidores.

## Ubicación
- `src/lib/data/irregularCanonical.js`

## Estructura v1
- `version`: versión del esquema canónico.
- `sources`: trazabilidad de la fuente legacy usada para bootstrap.
- `nonfinite.gerund[lemma] -> form`
- `nonfinite.participle[lemma] -> { primary, alternates[] }`
- `finite.futureConditionalRoots[lemma] -> { root, group }`

## API expuesta
- `getCanonicalGerund(lemma)`
- `getCanonicalParticiple(lemma)`
- `getCanonicalFutureRoot(lemma)`
- `validateIrregularCanonical()`

## Criterio de migración (siguiente slice)
1. Migrar consumidores de no finitos y raíces futuro/condicional para leer del canonical dataset.
2. Mantener paridad funcional mediante tests de no regresión.
3. Retirar duplicación legacy luego de estabilizar cobertura.
