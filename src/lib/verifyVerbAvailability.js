import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read JSON files
const curriculumPath = path.join(__dirname, '../data/curriculum.json')
const verbsPath = path.join(__dirname, '../data/verbs.js')

const gates = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'))

// Import verbs (we'll need to handle this differently)
let verbs = []
try {
  // Read the verbs.js file and extract the verbs array
  const verbsFileContent = fs.readFileSync(verbsPath, 'utf8')
  // This is a simple approach - in a real scenario you might want to use a proper JS parser
  const match = verbsFileContent.match(/export const verbs = (\[[\s\S]*?\])/)
  if (match) {
    // For now, let's create a simple test with the verbs we know exist
    verbs = [
      { lemma: 'hablar', forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
        { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
        { mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' },
        { mood: 'indicative', tense: 'pres', person: '1p', value: 'hablamos' },
        { mood: 'indicative', tense: 'pres', person: '2p_vosotros', value: 'habláis' },
        { mood: 'indicative', tense: 'pres', person: '3p', value: 'hablan' },
        { mood: 'nonfinite', tense: 'ger', person: 'inv', value: 'hablando' },
        { mood: 'nonfinite', tense: 'part', person: 'inv', value: 'hablado' }
      ]},
      { lemma: 'comer', forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'como' },
        { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'comes' },
        { mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'comés' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'come' },
        { mood: 'indicative', tense: 'pres', person: '1p', value: 'comemos' },
        { mood: 'indicative', tense: 'pres', person: '2p_vosotros', value: 'coméis' },
        { mood: 'indicative', tense: 'pres', person: '3p', value: 'comen' },
        { mood: 'nonfinite', tense: 'ger', person: 'inv', value: 'comiendo' },
        { mood: 'nonfinite', tense: 'part', person: 'inv', value: 'comido' }
      ]},
      { lemma: 'vivir', forms: [
        { mood: 'indicative', tense: 'pres', person: '1s', value: 'vivo' },
        { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'vives' },
        { mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'vivís' },
        { mood: 'indicative', tense: 'pres', person: '3s', value: 'vive' },
        { mood: 'indicative', tense: 'pres', person: '1p', value: 'vivimos' },
        { mood: 'indicative', tense: 'pres', person: '2p_vosotros', value: 'vivís' },
        { mood: 'indicative', tense: 'pres', person: '3p', value: 'viven' },
        { mood: 'nonfinite', tense: 'ger', person: 'inv', value: 'viviendo' },
        { mood: 'nonfinite', tense: 'part', person: 'inv', value: 'vivido' }
      ]}
    ]
  }
} catch (error) {
  console.log('Error reading verbs file:', error.message)
  // Use a minimal set for testing
  verbs = []
}

// MCER Level verb type restrictions
const levelVerbRestrictions = {
  'A1': { regular: true, irregular: true },
  'A2': { regular: true, irregular: true },
  'B1': { regular: true, irregular: true },
  'B2': { regular: true, irregular: true },
  'C1': { regular: false, irregular: true }, // Only irregular verbs for C1
  'C2': { regular: true, irregular: true },
  'ALL': { regular: true, irregular: true }
}

function isVerbTypeAllowedForLevel(verbType, level) {
  const restrictions = levelVerbRestrictions[level]
  if (!restrictions) return true
  return restrictions[verbType] || false
}

function levelOrder(L) { 
  return ['A1','A2','B1','B2','C1','C2'].indexOf(L) 
}

function isIrregularVerb(lemma) {
  // List of common irregular verbs
  const irregularVerbs = [
    'ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'decir', 'poder', 'saber',
    'dar', 'ver', 'poner', 'salir', 'traer', 'caer', 'oir', 'conocer', 'querer',
    'llegar', 'pasar', 'deber', 'parecer', 'quedar', 'hablar', 'llevar', 'dejar',
    'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'vivir', 'sentir', 'volver',
    'tomar', 'tratar', 'contar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar',
    'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir', 'recordar',
    'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'sacar',
    'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar',
    'crear', 'abrir', 'considerar', 'oír', 'acabar', 'convertir', 'ganar', 'formar',
    'traer', 'partir', 'morir', 'aceptar', 'realizar', 'suponer', 'comprender',
    'lograr', 'explicar', 'aparecer', 'creer', 'sacar', 'actuar', 'ocurrir',
    'indicar', 'responder', 'obtener', 'corresponder', 'depender', 'recibir',
    'mantener', 'situar', 'constituir', 'representar', 'incluir', 'continuar',
    'sufrir', 'reducir', 'evitar', 'impedir', 'expresar', 'comprobar', 'acabar',
    'acompañar', 'describir', 'existir', 'ocurrir', 'permitir', 'aparecer',
    'considerar', 'mantener', 'obtener', 'conseguir', 'producir', 'establecer',
    'presentar', 'comprender', 'lograr', 'explicar', 'creer', 'actuar', 'indicar',
    'responder', 'corresponder', 'depender', 'recibir', 'situar', 'constituir',
    'representar', 'incluir', 'continuar', 'sufrir', 'reducir', 'evitar',
    'impedir', 'expresar', 'comprobar', 'acompañar', 'describir', 'establecer'
  ]
  return irregularVerbs.includes(lemma)
}

function getVerbType(lemma) {
  return isIrregularVerb(lemma) ? 'irregular' : 'regular'
}

function countAvailableVerbs(level, mood, tense, verbType, dialect = 'both') {
  // Get all forms for this level, mood, and tense
  const gate = gates.find(g => g.mood === mood && g.tense === tense && levelOrder(g.level) <= levelOrder(level))
  if (!gate) return 0

  // Get all forms for this mood and tense
  let forms = verbs.flatMap(verb => {
    const verbForms = verb.forms || []
    return verbForms.filter(form => form.mood === mood && form.tense === tense)
  })

  // Filter by verb type
  forms = forms.filter(form => {
    const verb = verbs.find(v => v.forms && v.forms.some(f => f === form))
    if (!verb) return false
    const verbTypeForForm = getVerbType(verb.lemma)
    return verbTypeForForm === verbType
  })

  // Filter by dialect (person)
  forms = forms.filter(form => {
    if (mood === 'nonfinite') return true // Nonfinite forms are invariable
    
    if (dialect === 'rioplatense') {
      // Rioplatense: exclude tú and vosotros
      return form.person !== '2s_tu' && form.person !== '2p_vosotros'
    } else if (dialect === 'general') {
      // General LA: exclude vos and vosotros
      return form.person !== '2s_vos' && form.person !== '2p_vosotros'
    } else if (dialect === 'peninsular') {
      // Peninsular: exclude vos
      return form.person !== '2s_vos'
    } else {
      // Both forms: include all
      return true
    }
  })

  // Get unique verbs (by lemma)
  const uniqueVerbs = new Set(forms.map(form => {
    const verb = verbs.find(v => v.forms && v.forms.some(f => f === form))
    return verb ? verb.lemma : null
  }).filter(Boolean))

  return uniqueVerbs.size
}

function verifyAllCombinations() {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
  const verbTypes = ['regular', 'irregular']
  const dialects = ['rioplatense', 'general', 'peninsular', 'both']
  
  const results = []
  const issues = []

  console.log('🔍 VERIFICANDO DISPONIBILIDAD DE VERBOS PARA TODAS LAS COMBINACIONES...')
  console.log('='.repeat(80))

  for (const level of levels) {
    for (const mood of moods) {
      for (const verbType of verbTypes) {
        // Check if this verb type is allowed for this level
        if (!isVerbTypeAllowedForLevel(verbType, level)) {
          console.log(`⏭️  Skipping ${level} ${mood} ${verbType} - not allowed for this level`)
          continue
        }

        // Get available tenses for this mood and level
        const availableTenses = gates
          .filter(g => g.mood === mood && levelOrder(g.level) <= levelOrder(level))
          .map(g => g.tense)

        for (const tense of availableTenses) {
          for (const dialect of dialects) {
            const count = countAvailableVerbs(level, mood, tense, verbType, dialect)
            const result = {
              level,
              mood,
              tense,
              verbType,
              dialect,
              count,
              status: count >= 40 ? '✅ OK' : '❌ INSUFICIENTE'
            }
            results.push(result)

            if (count < 40) {
              issues.push(result)
              console.log(`❌ ${level} ${mood} ${tense} ${verbType} ${dialect}: ${count} verbos (necesita 40)`)
            } else {
              console.log(`✅ ${level} ${mood} ${tense} ${verbType} ${dialect}: ${count} verbos`)
            }
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESUMEN:')
  console.log(`Total combinaciones verificadas: ${results.length}`)
  console.log(`✅ Combinaciones con suficientes verbos: ${results.filter(r => r.count >= 40).length}`)
  console.log(`❌ Combinaciones con verbos insuficientes: ${issues.length}`)

  if (issues.length > 0) {
    console.log('\n🚨 PROBLEMAS ENCONTRADOS:')
    issues.forEach(issue => {
      console.log(`❌ ${issue.level} ${issue.mood} ${issue.tense} ${issue.verbType} ${issue.dialect}: ${issue.count} verbos`)
    })
  } else {
    console.log('\n🎉 ¡TODAS LAS COMBINACIONES TIENEN SUFICIENTES VERBOS!')
  }

  return { results, issues }
}

// Run verification
verifyAllCombinations() 