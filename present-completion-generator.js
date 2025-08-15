#!/usr/bin/env node

// Generador para completar presente de indicativo incompleto
// Muchos verbos tienen solo algunas formas, necesitamos las 7 personas

console.log('🔧 COMPLETADOR DE PRESENTE INDICATIVO')
console.log('=====================================\n')

async function completePresent() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { IRREGULAR_FAMILIES, categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Patrones de conjugación regular
    const regularPatterns = {
      'ar': ['o', 'as', 'ás', 'a', 'amos', 'áis', 'an'],
      'er': ['o', 'es', 'és', 'e', 'emos', 'éis', 'en'],
      'ir': ['o', 'es', 'ís', 'e', 'imos', 'ís', 'en']
    }
    
    // Verbos completamente irregulares con formas específicas
    const completelyIrregular = {
      'ser': ['soy', 'eres', 'sos', 'es', 'somos', 'sois', 'son'],
      'estar': ['estoy', 'estás', 'estás', 'está', 'estamos', 'estáis', 'están'],
      'ir': ['voy', 'vas', 'vas', 'va', 'vamos', 'vais', 'van'],
      'dar': ['doy', 'das', 'das', 'da', 'damos', 'dais', 'dan'],
      'ver': ['veo', 'ves', 'ves', 've', 'vemos', 'veis', 'ven'],
      'haber': ['he', 'has', 'has', 'ha', 'hemos', 'habéis', 'han']
    }
    
    // Aplicar cambios vocálicos conocidos
    function applyVocalicChanges(lemma, stem, person) {
      const families = categorizeVerb(lemma, {})
      
      // e→ie (pensar, cerrar, etc.)
      if (families.includes('DIPHT_E_IE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        return stem.replace(/e([^e]*)$/, 'ie$1')
      }
      
      // o→ue (volver, poder, etc.)
      if (families.includes('DIPHT_O_UE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        return stem.replace(/o([^o]*)$/, 'ue$1')
      }
      
      // u→ue (jugar)
      if (families.includes('DIPHT_U_UE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        return stem.replace(/u([^u]*)$/, 'ue$1')
      }
      
      // e→i en verbos -ir (pedir, servir, etc.)
      if (families.includes('E_I_IR') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        return stem.replace(/e([^e]*)$/, 'i$1')
      }
      
      return stem
    }
    
    // Aplicar cambios consonánticos en 1ª persona
    function applyConsonantChanges(lemma, stem, person, families) {
      if (person !== '1s') return stem
      
      // Verbos en -cer/-cir → -zco
      if (families.includes('ZCO_VERBS')) {
        if (lemma.endsWith('cer') || lemma.endsWith('cir')) {
          return stem.slice(0, -1) + 'zc'
        }
      }
      
      // Verbos en -ger/-gir → -jo
      if (families.includes('JO_VERBS')) {
        if (lemma.endsWith('ger') || lemma.endsWith('gir')) {
          return stem.slice(0, -1) + 'j'
        }
      }
      
      // Verbos en -guir → pérdida de u
      if (families.includes('GU_DROP')) {
        if (lemma.endsWith('guir')) {
          return stem.slice(0, -2) + 'g'
        }
      }
      
      // Verbos irregulares en YO específicos
      const irregularFirst = {
        'tener': 'teng', 'venir': 'veng', 'poner': 'pong', 'salir': 'salg',
        'hacer': 'hag', 'decir': 'dig', 'traer': 'traig', 'caer': 'caig',
        'valer': 'valg', 'oír': 'oig'
      }
      
      if (irregularFirst[lemma]) {
        return irregularFirst[lemma]
      }
      
      return stem
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({ region: 'es', forms: [] })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // Verificar si ya tiene presente completo
      const existingPresForms = mainParadigm.forms.filter(f => 
        f.tense === 'pres' && f.mood === 'indicative'
      )
      if (existingPresForms.length >= 7) continue
      
      // Determinar tipo de verbo y raíz
      let verbType = ''
      let stem = ''
      
      if (lemma.endsWith('ar')) {
        verbType = 'ar'
        stem = lemma.slice(0, -2)
      } else if (lemma.endsWith('er')) {
        verbType = 'er'
        stem = lemma.slice(0, -2)
      } else if (lemma.endsWith('ir')) {
        verbType = 'ir'
        stem = lemma.slice(0, -2)
      } else {
        console.log(`⚠️  Tipo de verbo no reconocido: ${lemma}`)
        continue
      }
      
      // Verificar si es completamente irregular
      if (completelyIrregular[lemma]) {
        const irregularForms = completelyIrregular[lemma]
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'pres' && f.mood === 'indicative' && f.person === person
          )
          
          if (!existingForm) {
            mainParadigm.forms.push({
              tense: 'pres',
              mood: 'indicative',
              person: person,
              form: irregularForms[index],
              tags: [],
              region: 'es'
            })
            formsAdded++
            verbUpdated = true
          }
        })
      } else {
        // Aplicar reglas regulares con cambios
        const families = categorizeVerb(lemma, verb)
        const endings = regularPatterns[verbType]
        
        if (endings) {
          persons.forEach((person, index) => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === 'pres' && f.mood === 'indicative' && f.person === person
            )
            
            if (!existingForm) {
              // Aplicar cambios vocálicos
              let modifiedStem = applyVocalicChanges(lemma, stem, person)
              
              // Aplicar cambios consonánticos
              modifiedStem = applyConsonantChanges(lemma, modifiedStem, person, families)
              
              const form = modifiedStem + endings[index]
              
              mainParadigm.forms.push({
                tense: 'pres',
                mood: 'indicative',
                person: person,
                form: form,
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          })
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ COMPLETADO DE PRESENTE INDICATIVO')
    console.log('====================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const presStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      const forms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pres' && f.mood === 'indicative')
      
      presStats.total++
      presStats.forms += forms.length
      if (forms.length >= 7) {
        presStats.complete++
      }
    })
    
    const coverage = ((presStats.complete / presStats.total) * 100).toFixed(1)
    const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
    console.log(`${emoji} pres: ${coverage}% (${presStats.complete}/${presStats.total} verbos completos, ${presStats.forms} formas totales)`)
    
    // Identificar verbos que aún necesitan trabajo
    console.log('\n⚠️  VERBOS QUE AÚN NECESITAN REVISIÓN')
    console.log('===================================')
    
    const incompleteVerbs = []
    verbs.forEach(verb => {
      const presForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pres' && f.mood === 'indicative')
      
      if (presForms.length < 7) {
        incompleteVerbs.push({
          lemma: verb.lemma,
          forms: presForms.length,
          missingPersons: persons.filter(p => !presForms.some(f => f.person === p))
        })
      }
    })
    
    if (incompleteVerbs.length > 0) {
      incompleteVerbs.slice(0, 10).forEach(verb => {
        console.log(`• ${verb.lemma}: ${verb.forms}/7 formas (faltan: ${verb.missingPersons.join(', ')})`)
      })
      
      if (incompleteVerbs.length > 10) {
        console.log(`... y ${incompleteVerbs.length - 10} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos tienen presente completo')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con presente completado automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.present.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con presente completo')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar subjunctive-generator.js para completar subjuntivo')
    console.log('2. Ejecutar imperative-generator.js para completar imperativo')
    console.log('3. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

completePresent()