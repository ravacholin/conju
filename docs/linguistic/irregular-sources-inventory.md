# Inventario De Fuentes De Irregularidades

Generado: 2026-02-12T21:54:38.597Z

## Fuentes auditadas
- `src/lib/data/irregularFamilies.js`
- `src/lib/data/learningIrregularFamilies.js`
- `src/lib/data/simplifiedFamilyGroups.js`
- `src/lib/data/irregularPatterns.js`
- `src/lib/core/nonfiniteBuilder.js`
- `src/lib/core/conjugationRules.js`

## Hallazgos principales
- Familias técnicas: 32
- Clusters técnicos: 8
- Grupos simplificados: 4
- Overlap ejemplos técnico vs learning: 94
- Overlap gerundios (patterns vs builder): 0
- Overlap participios (patterns vs builder): 0
- Overlap participios (patterns vs rules): 0

## Divergencias detectadas
- Gerundios solo en patterns: construir, decir, dormir, ir, leer, morir, oír, pedir, poder, sentir, servir, traer, venir
- Gerundios solo en builder: ninguno
- Participios solo en patterns: abrir, cubrir, decir, escribir, freír, hacer, morir, poner, resolver, romper, ver, volver
- Participios solo en builder: ninguno
- Participios solo en rules: ninguno

## Lemmas con mayor duplicación entre fuentes
- decir: 4 apariciones
- morir: 4 apariciones
- abrir: 3 apariciones
- construir: 3 apariciones
- cubrir: 3 apariciones
- dormir: 3 apariciones
- escribir: 3 apariciones
- freír: 3 apariciones
- hacer: 3 apariciones
- ir: 3 apariciones
- leer: 3 apariciones
- oír: 3 apariciones
- pedir: 3 apariciones
- poder: 3 apariciones
- poner: 3 apariciones
- romper: 3 apariciones
- sentir: 3 apariciones
- servir: 3 apariciones
- traer: 3 apariciones
- venir: 3 apariciones
- ver: 3 apariciones
- volver: 3 apariciones

## Recomendación inmediata
- Definir una sola fuente canónica para no finitos irregulares y derivar el resto por import para eliminar drift.
