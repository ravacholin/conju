// Índice de chunks de verbos
// Generado automáticamente por generate-chunks.js

export const CHUNK_INDEX = {
  "core": {
    "verbCount": 15,
    "size": 332166,
    "sizeKB": 324,
    "verbs": [
      "llegar",
      "ser",
      "estar",
      "tener",
      "hacer",
      "ir",
      "decir",
      "ver",
      "dar",
      "saber"
    ]
  },
  "common": {
    "verbCount": 23,
    "size": 517085,
    "sizeKB": 505,
    "verbs": [
      "hablar",
      "vivir",
      "trabajar",
      "mirar",
      "pensar",
      "empezar",
      "perder",
      "volver",
      "pedir",
      "seguir"
    ]
  },
  "irregulars": {
    "verbCount": 160,
    "size": 3292644,
    "sizeKB": 3215,
    "verbs": [
      "bailar",
      "cantar",
      "escuchar",
      "dormir",
      "jugar",
      "comprar",
      "poder",
      "traer",
      "caer",
      "valer"
    ]
  },
  "advanced": {
    "verbCount": 8,
    "size": 184231,
    "sizeKB": 180,
    "verbs": [
      "comer",
      "estudiar",
      "caminar",
      "necesitar",
      "ayudar",
      "beber",
      "aprender",
      "comprender"
    ]
  }
}

export const CHUNKS = {
  core: () => import('./core.js'),
  common: () => import('./common.js'),
  irregulars: () => import('./irregulars.js'),
  advanced: () => import('./advanced.js')
}

// Funciones de utilidad para encontrar chunks
export function getChunkForVerb(lemma) {
  for (const [chunkName, stat] of Object.entries(CHUNK_INDEX)) {
    if (stat.verbs && stat.verbs.includes(lemma)) {
      return chunkName
    }
  }
  return 'advanced' // fallback
}

export function getChunkSize(chunkName) {
  return CHUNK_INDEX[chunkName]?.sizeKB || 0
}

export function getAllChunkNames() {
  return Object.keys(CHUNK_INDEX)
}
