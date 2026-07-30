/**
 * Search vocabulary for the menu topic search.
 *
 * Pure data. These are the words a learner is likely to type that are NOT the
 * canonical label — "perfecto", "pasado", "mandatos", "ando"… Everything here
 * is folded at index-build time, so accents are optional but harmless.
 */

// mood key → extra words that should surface every tense of that mood
export const MOOD_ALIASES = {
  indicative: ['indicativo', 'indicativos', 'hechos', 'real', 'realidad'],
  subjunctive: ['subjuntivo', 'subjuntivos', 'hipotesis', 'deseo', 'ojala', 'duda', 'emocion'],
  imperative: ['imperativo', 'imperativos', 'mandato', 'mandatos', 'orden', 'ordenes', 'pedido'],
  conditional: ['condicional', 'condicionales', 'cortesia', 'hipotesis', 'consejo'],
  nonfinite: ['no conjugadas', 'no finitas', 'formas no personales', 'impersonales']
}

// tense key → extra words. The canonical label is added automatically.
export const TENSE_ALIASES = {
  pres: ['presente', 'presentes', 'hablo', 'ahora', 'rutina', 'habito'],
  pretIndef: [
    'preterito', 'preteritos', 'indefinido', 'indefinidos', 'pasado', 'pasados',
    'perfecto simple', 'simple', 'hable', 'ayer'
  ],
  impf: ['imperfecto', 'imperfectos', 'copreterito', 'pasado', 'hablaba', 'antes', 'solia'],
  pretPerf: [
    'perfecto', 'perfectos', 'perfecto compuesto', 'compuesto', 'antepresente',
    'pasado', 'he hablado', 'participio'
  ],
  plusc: [
    'pluscuamperfecto', 'pluscuamperfectos', 'perfecto', 'compuesto', 'pasado',
    'antecopreterito', 'habia hablado', 'participio'
  ],
  fut: ['futuro', 'futuros', 'futuro simple', 'hablare', 'manana'],
  futPerf: [
    'futuro perfecto', 'futuro compuesto', 'perfecto', 'compuesto', 'futuro',
    'antefuturo', 'habre hablado', 'participio'
  ],
  subjPres: ['presente', 'subjuntivo presente', 'hable', 'ojala', 'que hable'],
  subjImpf: [
    'imperfecto', 'subjuntivo imperfecto', 'preterito imperfecto', 'pasado',
    'hablara', 'hablase', 'si hablara'
  ],
  subjPerf: [
    'perfecto', 'perfectos', 'compuesto', 'subjuntivo perfecto', 'haya hablado',
    'participio'
  ],
  subjPlusc: [
    'pluscuamperfecto', 'perfecto', 'compuesto', 'subjuntivo pluscuamperfecto',
    'hubiera hablado', 'hubiese hablado', 'participio'
  ],
  impAff: ['afirmativo', 'imperativo afirmativo', 'mandato', 'orden', 'habla', 'hable'],
  impNeg: ['negativo', 'imperativo negativo', 'mandato negativo', 'no hables', 'prohibicion'],
  impMixed: ['mixto', 'mezclado', 'todas', 'imperativo mixto', 'afirmativo y negativo'],
  cond: ['condicional', 'condicional simple', 'pospreterito', 'hablaria', 'cortesia'],
  condPerf: [
    'condicional compuesto', 'condicional perfecto', 'perfecto', 'compuesto',
    'habria hablado', 'participio'
  ],
  ger: ['gerundio', 'gerundios', 'ando', 'iendo', 'yendo', 'hablando', 'progresivo'],
  part: ['participio', 'participios', 'ado', 'ido', 'hablado', 'pasiva'],
  nonfiniteMixed: ['no finitas', 'mixtas', 'mezcladas', 'gerundio y participio', 'todas']
}

export const VERB_TYPE_ALIASES = {
  all: ['todos', 'todo', 'cualquiera', 'sin filtro', 'mixto'],
  regular: ['regulares', 'regular', 'la regla', 'normales'],
  irregular: ['irregulares', 'irregular', 'excepciones', 'raros', 'dificiles']
}

export const LEVEL_ALIASES = {
  A1: ['a1', 'principiante', 'inicial', 'acceso', 'basico', 'cero', 'empezar'],
  A2: ['a2', 'elemental', 'basico', 'plataforma'],
  B1: ['b1', 'intermedio', 'umbral', 'medio'],
  B2: ['b2', 'intermedio alto', 'avanzado', 'intermedio'],
  C1: ['c1', 'avanzado', 'dominio operativo', 'alto'],
  C2: ['c2', 'superior', 'maestria', 'nativo', 'experto', 'avanzado']
}

/**
 * Words that describe the app's non-drill destinations.
 * `id` matches the callback key the menu supplies.
 */
export const SECTION_ENTRIES = [
  {
    id: 'progress',
    label: 'ver mi progreso',
    focal: 'progreso',
    tag: 'DATA',
    gloss: 'analiticas',
    ex: 'mapa de calor + srs',
    keywords: [
      'progreso', 'progresos', 'estadisticas', 'analiticas', 'datos', 'mapa de calor',
      'heatmap', 'srs', 'dominio', 'mastery', 'racha', 'metricas'
    ]
  },
  {
    id: 'learning',
    label: 'aprender un tiempo nuevo',
    focal: 'aprender',
    tag: 'GUIADO',
    gloss: 'lecciones',
    ex: 'explicacion + drill',
    keywords: [
      'aprender', 'aprendizaje', 'leccion', 'lecciones', 'estudiar', 'explicacion',
      'teoria', 'guiado', 'tutorial', 'ensename'
    ]
  },
  {
    id: 'placement',
    label: 'test de nivel',
    focal: 'test de nivel',
    tag: 'AUTO',
    gloss: 'diagnostico adaptativo',
    ex: '5 min · te ubica',
    keywords: [
      'test', 'test de nivel', 'nivel', 'examen', 'diagnostico', 'evaluacion',
      'ubicacion', 'placement', 'que nivel tengo'
    ]
  }
]
