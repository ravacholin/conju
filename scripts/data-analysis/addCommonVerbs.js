import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { commonVerbs } from '../../src/data/commonVerbs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const verbsPath = path.join(__dirname, '../../src/data/verbs.js')

console.log('🔧 AGREGANDO VERBOS COMUNES...')
console.log('='.repeat(80))

// Read current verbs file
const verbsFileContent = fs.readFileSync(verbsPath, 'utf8')

// Find the end of the verbs array
const endMatch = verbsFileContent.match(/(\s*\]\s*;?\s*)$/)
if (!endMatch) {
  console.log('❌ No se pudo encontrar el final del array de verbos')
  process.exit(1)
}

// Convert commonVerbs to the proper format
const formattedVerbs = commonVerbs.map(verb => {
  const forms = []
  
  // Convert the simple forms array to the complex format
  let formIndex = 0
  
  // Indicativo presente (12 forms: 6 for tu, 6 for vos)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'pres',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo pretérito indefinido (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'pretIndef',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo imperfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'impf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo pretérito perfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'pretPerf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo pluscuamperfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'plusc',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo futuro (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'fut',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Indicativo futuro perfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'indicative',
      tense: 'futPerf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Subjuntivo presente (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'subjunctive',
      tense: 'subjPres',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Subjuntivo pretérito perfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'subjunctive',
      tense: 'subjPerf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Subjuntivo imperfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'subjunctive',
      tense: 'subjImpf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Subjuntivo pluscuamperfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'subjunctive',
      tense: 'subjPlusc',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Imperativo afirmativo (10 forms: 5 for tu, 5 for vos)
  for (let i = 0; i < 10; i++) {
    const person = i < 5 ? ['2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['2s_vos', '3s', '1p', '3p', '3p'][i - 5]
    forms.push({
      mood: 'imperative',
      tense: 'impAff',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Imperativo negativo (10 forms)
  for (let i = 0; i < 10; i++) {
    const person = i < 5 ? ['2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['2s_vos', '3s', '1p', '3p', '3p'][i - 5]
    forms.push({
      mood: 'imperative',
      tense: 'impNeg',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Condicional (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'conditional',
      tense: 'cond',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Condicional perfecto (12 forms)
  for (let i = 0; i < 12; i++) {
    const person = i < 6 ? ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'][i] : ['1s', '2s_vos', '3s', '1p', '3p', '3p'][i - 6]
    forms.push({
      mood: 'conditional',
      tense: 'condPerf',
      person: person,
      value: verb.forms[formIndex++]
    })
  }
  
  // Participio (1 form)
  forms.push({
    mood: 'nonfinite',
    tense: 'part',
    person: 'part',
    value: verb.forms[formIndex++]
  })
  
  // Gerundio (1 form)
  forms.push({
    mood: 'nonfinite',
    tense: 'ger',
    person: 'ger',
    value: verb.forms[formIndex++]
  })
  
  return {
    id: verb.lemma,
    lemma: verb.lemma,
    type: 'regular',
    paradigms: [{
      regionTags: ['rioplatense', 'la_general', 'peninsular'],
      forms: forms
    }]
  }
})

// Create the new verb entries as strings
const newVerbEntries = formattedVerbs.map(verb => {
  const formsString = verb.paradigms[0].forms.map(form => {
    return `        { mood: '${form.mood}', tense: '${form.tense}', person: '${form.person}', value: '${form.value}' }`
  }).join(',\n')
  
  return `  {
    id: '${verb.id}',
    lemma: '${verb.lemma}',
    type: '${verb.type}',
    paradigms: [{
      regionTags: ['rioplatense', 'la_general', 'peninsular'],
      forms: [
${formsString}
      ]
    }]
  }`
}).join(',\n\n')

// Insert the new verbs before the closing bracket
const newContent = verbsFileContent.replace(
  /(\s*\]\s*;?\s*)$/,
  `,\n\n${newVerbEntries}\n$1`
)

// Write the updated file
fs.writeFileSync(verbsPath, newContent, 'utf8')

console.log(`✅ Agregados ${commonVerbs.length} verbos comunes:`)
commonVerbs.forEach(verb => {
  console.log(`  - ${verb.lemma}`)
})

console.log(`\n📊 Total de formas agregadas: ${commonVerbs.length * 156} formas`)
console.log('='.repeat(80))
console.log('🎯 Verbos agregados exitosamente al archivo verbs.js') 