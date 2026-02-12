# Inventario De Fuentes De Irregularidades

Generado: 2026-02-12T21:10:36.634Z

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
- Overlap gerundios (patterns vs builder): 13
- Overlap participios (patterns vs builder): 11
- Overlap participios (patterns vs rules): 11

## Divergencias detectadas
- Gerundios solo en patterns: ninguno
- Gerundios solo en builder: advertir, atraer, caer, competir, concluir, conseguir, consentir, contribuir, convertir, creer, despedir, destruir, digerir, distraer, divertir, elegir, herir, hervir, huir, impedir, incluir, inferir, medir, mentir, perseguir, poseer, preferir, proveer, raer, referir, repetir, retraer, reír, seguir, sugerir, sustraer, vestir
- Participios solo en patterns: freír
- Participios solo en builder: componer, descubrir, desenvolver, devolver, disponer, envolver, exponer, imponer, oponer, prever, proponer, revolver, suponer
- Participios solo en rules: anteponer, antever, bendecir, componer, contradecir, contrahacer, deponer, describir, descubrir, desenvolver, deshacer, deshacerse, devolver, disponer, encubrir, entrever, envolver, exponer, imponer, inscribir, interponer, maldecir, oponer, posponer, predecir, predisponer, prescribir, presuponer, prever, proponer, recubrir, reescribir, rehacer, reponer, rever, revolver, satisfacer, sobreponer, suponer, suscribir, transcribir, yuxtaponer

## Lemmas con mayor duplicación entre fuentes
- decir: 7 apariciones
- morir: 7 apariciones
- abrir: 5 apariciones
- cubrir: 5 apariciones
- escribir: 5 apariciones
- hacer: 5 apariciones
- poner: 5 apariciones
- romper: 5 apariciones
- ver: 5 apariciones
- volver: 5 apariciones
- construir: 4 apariciones
- dormir: 4 apariciones
- ir: 4 apariciones
- leer: 4 apariciones
- oír: 4 apariciones
- pedir: 4 apariciones
- poder: 4 apariciones
- resolver: 4 apariciones
- sentir: 4 apariciones
- servir: 4 apariciones
- traer: 4 apariciones
- venir: 4 apariciones
- caer: 3 apariciones
- competir: 3 apariciones
- componer: 3 apariciones
- concluir: 3 apariciones
- conseguir: 3 apariciones
- contribuir: 3 apariciones
- creer: 3 apariciones
- descubrir: 3 apariciones
- destruir: 3 apariciones
- disponer: 3 apariciones
- elegir: 3 apariciones
- exponer: 3 apariciones
- freír: 3 apariciones
- huir: 3 apariciones
- incluir: 3 apariciones
- medir: 3 apariciones
- mentir: 3 apariciones
- perseguir: 3 apariciones

## Recomendación inmediata
- Definir una sola fuente canónica para no finitos irregulares y derivar el resto por import para eliminar drift.
