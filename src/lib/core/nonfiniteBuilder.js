// Generador de formas no finitas (gerundio/participio) con irregulares comunes

// Mapa de gerundios irregulares frecuentes
const IRREGULAR_GERUNDS = {
  'ir': 'yendo',
  'poder': 'pudiendo',
  'venir': 'viniendo',
  'decir': 'diciendo',
  'traer': 'trayendo',
  'caer': 'cayendo',
  'leer': 'leyendo',
  'creer': 'creyendo',
  'oír': 'oyendo',
  'construir': 'construyendo',
  'destruir': 'destruyendo',
  'huir': 'huyendo',
  'incluir': 'incluyendo',
  'concluir': 'concluyendo',
  'contribuir': 'contribuyendo',
  'dormir': 'durmiendo',
  'morir': 'muriendo',
  'pedir': 'pidiendo',
  'sentir': 'sintiendo',
  'preferir': 'prefiriendo',
  'mentir': 'mintiendo',
  'competir': 'compitiendo',
  'medir': 'midiendo',
  'vestir': 'vistiendo',
  'seguir': 'siguiendo',
  'conseguir': 'consiguiendo',
  'perseguir': 'persiguiendo',
  'elegir': 'eligiendo',
  'repetir': 'repitiendo',
  'servir': 'sirviendo',
  'reír': 'riendo',
  // Ampliación e→i (-ir)
  'despedir': 'despidiendo',
  'impedir': 'impidiendo',
  'divertir': 'divirtiendo',
  'convertir': 'convirtiendo',
  'advertir': 'advirtiendo',
  'referir': 'refiriendo',
  'sugerir': 'sugiriendo',
  'consentir': 'consintiendo',
  'herir': 'hiriendo',
  'digerir': 'digiriendo',
  'inferir': 'infiriendo',
  'hervir': 'hirviendo',
  // Ampliación hiatos y -traer/-raer/-poseer
  'atraer': 'atrayendo',
  'distraer': 'distrayendo',
  'sustraer': 'sustrayendo',
  'retraer': 'retrayendo',
  'raer': 'rayendo',
  'poseer': 'poseyendo',
  'proveer': 'proveyendo'
}

// Participios irregulares (valor) para cubrir los más comunes
const IRREGULAR_PARTICIPLES = {
  'abrir': 'abierto',
  'escribir': 'escrito',
  'hacer': 'hecho',
  'poner': 'puesto',
  'ver': 'visto',
  'volver': 'vuelto',
  'romper': 'roto',
  'morir': 'muerto',
  'cubrir': 'cubierto',
  'decir': 'dicho',
  'resolver': 'resuelto',
  'devolver': 'devuelto',
  'revolver': 'revuelto',
  'envolver': 'envuelto',
  'desenvolver': 'desenvuelto',
  'descubrir': 'descubierto',
  'componer': 'compuesto',
  'disponer': 'dispuesto',
  'exponer': 'expuesto',
  'imponer': 'impuesto',
  'oponer': 'opuesto',
  'proponer': 'propuesto',
  'suponer': 'supuesto',
  'prever': 'previsto'
}

export function buildGerund(lemma) {
  if (!lemma || typeof lemma !== 'string') return null
  // Irregular explícito
  if (IRREGULAR_GERUNDS[lemma]) return IRREGULAR_GERUNDS[lemma]
  // Regla -yendo para vocal + -er/-ir (leer, caer, oír) y -uir
  const endsWith = (s) => lemma.endsWith(s)
  const stem = lemma.slice(0, -2)
  const lastStemChar = stem.slice(-1)
  // Nota: incluir 'u' y 'ü' explícitamente para casos como secuencias con vocal simple
  // La regla de -yendo se aplica si la raíz termina en vocal.
  // Se excluyen los dígrafos 'gu' y 'qu' donde la 'u' no forma diptongo.
  if ((endsWith('er') || endsWith('ir')) && /[aeiouáéíóúü]/i.test(lastStemChar)) {
    const prevChar = stem.slice(-2, -1)
    if (lastStemChar === 'u' && (prevChar === 'g' || prevChar === 'q')) {
      // No hacer nada, dejar que caiga a la regla de -iendo (ej. distinguir -> distinguiendo)
    } else {
      // Para raíces terminadas en vocal (leer, construir, argüir)
      return stem + 'yendo'
    }
  }
  if (lemma.endsWith('uir') && !lemma.endsWith('guir') && !lemma.endsWith('quir')) {
    return stem + 'yendo'
  }
  // Regulares
  if (endsWith('ar')) return lemma.replace(/ar$/, 'ando')
  if (endsWith('er')) return lemma.replace(/er$/, 'iendo')
  if (endsWith('ir')) return lemma.replace(/ir$/, 'iendo')
  return null
}

export function buildParticiple(lemma) {
  if (!lemma || typeof lemma !== 'string') return null
  if (IRREGULAR_PARTICIPLES[lemma]) return IRREGULAR_PARTICIPLES[lemma]
  if (lemma.endsWith('ar')) return lemma.replace(/ar$/, 'ado')
  if (lemma.endsWith('er')) return lemma.replace(/er$/, 'ido')
  if (lemma.endsWith('ir')) return lemma.replace(/ir$/, 'ido')
  return null
}

export function buildNonfiniteFormsForLemma(lemma) {
  const forms = []
  const ger = buildGerund(lemma)
  if (ger) {
    forms.push({ mood: 'nonfinite', tense: 'ger', person: '', value: ger, lemma })
  }
  const part = buildParticiple(lemma)
  if (part) {
    forms.push({ mood: 'nonfinite', tense: 'part', person: '', value: part, lemma })
  }
  return forms
}
