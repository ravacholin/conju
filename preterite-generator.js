#!/usr/bin/env node

// Generador automático de pretérito indefinido
// Incluye verbos regulares e irregulares con patrones específicos

console.log('🔧 GENERADOR DE PRETÉRITO INDEFINIDO')
console.log('===================================\n')

async function generatePreterite() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Patrones regulares de pretérito
    const regularPatterns = {
      'ar': ['é', 'aste', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      'er': ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      'ir': ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron']
    }
    
    // Verbos completamente irregulares
    const completelyIrregular = {
      'ser': ['fui', 'fuiste', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      'ir': ['fui', 'fuiste', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      'dar': ['di', 'diste', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
      'ver': ['vi', 'viste', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
      'estar': ['estuve', 'estuviste', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
      'tener': ['tuve', 'tuviste', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
      'haber': ['hube', 'hubiste', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
      'poder': ['pude', 'pudiste', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
      'poner': ['puse', 'pusiste', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'],
      'saber': ['supe', 'supiste', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
      'caber': ['cupe', 'cupiste', 'cupiste', 'cupo', 'cupimos', 'cupisteis', 'cupieron'],
      'querer': ['quise', 'quisiste', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
      'venir': ['vine', 'viniste', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
      'hacer': ['hice', 'hiciste', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
      'decir': ['dije', 'dijiste', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'],
      'traer': ['traje', 'trajiste', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'],
      'conducir': ['conduje', 'condujiste', 'condujiste', 'condujo', 'condujimos', 'condujisteis', 'condujeron'],
      'traducir': ['traduje', 'tradujiste', 'tradujiste', 'tradujo', 'tradujimos', 'tradujisteis', 'tradujeron'],
      'producir': ['produje', 'produjiste', 'produjiste', 'produjo', 'produjimos', 'produjisteis', 'produjeron'],
      'andar': ['anduve', 'anduviste', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron']
    }
    
    // Patrones irregulares por raíz
    const irregularStems = {
      // Pretéritos fuertes -uv-
      'obtener': 'obtuv', 'contener': 'contuv', 'sostener': 'sostuv', 'retener': 'retuv', 'detener': 'detuv',
      'mantener': 'mantuv',
      
      // Pretéritos fuertes -u-
      'componer': 'compus', 'proponer': 'propus', 'disponer': 'dispus', 'exponer': 'expus', 'suponer': 'supus',
      'imponer': 'impus',
      
      // Pretéritos fuertes -i-
      'convenir': 'convin', 'prevenir': 'previn', 'intervenir': 'intervin',
      'rehacer': 'rehic', 'deshacer': 'deshic',
      
      // Pretéritos fuertes -j-
      'atraer': 'atraj', 'contraer': 'contraj', 'distraer': 'distraj', 'extraer': 'extraj',
      'reducir': 'reduj', 'seducir': 'seduj', 'inducir': 'induj',
      'bendecir': 'bendij', 'maldecir': 'maldij'
    }
    
    // Aplicar cambios vocálicos específicos del pretérito
    function applyPreteriteVocalicChanges(lemma, stem, person) {
      const families = categorizeVerb(lemma, {})
      
      // e→i en verbos -ir (solo 3ª personas)
      if (families.includes('E_I_IR') && ['3s', '3p'].includes(person)) {
        if (stem.includes('e')) {
          return stem.replace(/e([^e]*)$/, 'i$1')
        }
      }
      
      // o→u en verbos -ir (solo 3ª personas)  
      if (families.includes('O_U_GER_IR') && ['3s', '3p'].includes(person)) {
        if (stem.includes('o')) {
          return stem.replace(/o([^o]*)$/, 'u$1')
        }
      }
      
      return stem
    }
    
    // Aplicar cambios ortográficos
    function applyOrthographicChanges(lemma, stem, person) {
      const families = categorizeVerb(lemma, {})
      
      // Solo en 1ª persona singular
      if (person === '1s') {
        // -car → -qu
        if (families.includes('ORTH_CAR') && lemma.endsWith('car')) {
          return stem.slice(0, -1) + 'qu'
        }
        
        // -gar → -gu
        if (families.includes('ORTH_GAR') && lemma.endsWith('gar')) {
          return stem + 'u'
        }
        
        // -zar → -c
        if (families.includes('ORTH_ZAR') && lemma.endsWith('zar')) {
          return stem.slice(0, -1) + 'c'
        }
        
        // -guar → -güe
        if (families.includes('ORTH_GUAR') && lemma.endsWith('guar')) {
          return stem.slice(0, -2) + 'güé'.slice(0, -1) // stem ya sin -ar + güe (quitamos la é final)
        }
      }
      
      return stem
    }
    
    // Aplicar cambios de hiato (i→y en 3ª personas)
    function applyHiatusChanges(lemma, stem, person, ending) {
      const families = categorizeVerb(lemma, {})
      
      if (families.includes('HIATUS_Y') && ['3s', '3p'].includes(person)) {
        // Si la terminación empieza con 'i' y la raíz termina en vocal
        if (ending.startsWith('i') && /[aeiou]$/.test(stem)) {
          if (person === '3s') {
            return { stem, ending: ending.replace('ió', 'yó') }
          } else if (person === '3p') {
            return { stem, ending: ending.replace('ieron', 'yeron') }
          }
        }
      }
      
      return { stem, ending }
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
      
      // Verificar si ya tiene pretérito completo
      const existingPretForms = mainParadigm.forms.filter(f => 
        f.tense === 'pretIndef' && f.mood === 'indicative'
      )
      if (existingPretForms.length >= 7) continue
      
      // Determinar si es completamente irregular
      if (completelyIrregular[lemma]) {
        const irregularForms = completelyIrregular[lemma]
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'pretIndef' && f.mood === 'indicative' && f.person === person
          )
          
          if (!existingForm) {
            mainParadigm.forms.push({
              tense: 'pretIndef',
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
        continue
      }
      
      // Determinar tipo de verbo y raíz base
      let verbType = ''
      let baseStem = ''
      
      if (lemma.endsWith('ar')) {
        verbType = 'ar'
        baseStem = lemma.slice(0, -2)
      } else if (lemma.endsWith('er')) {
        verbType = 'er'
        baseStem = lemma.slice(0, -2)
      } else if (lemma.endsWith('ir')) {
        verbType = 'ir'
        baseStem = lemma.slice(0, -2)
      } else {
        continue
      }
      
      // Verificar si tiene raíz irregular específica
      let useIrregularStem = false
      let irregularStem = ''
      let irregularEndings = []
      
      if (irregularStems[lemma]) {
        useIrregularStem = true
        irregularStem = irregularStems[lemma]
        
        // Determinar terminaciones según el tipo de irregular
        if (irregularStem.endsWith('uv')) {
          irregularEndings = ['e', 'iste', 'iste', 'o', 'imos', 'isteis', 'ieron']
        } else if (irregularStem.endsWith('u')) {
          irregularEndings = ['e', 'iste', 'iste', 'o', 'imos', 'isteis', 'ieron']
        } else if (irregularStem.endsWith('i') || irregularStem.endsWith('ic')) {
          irregularEndings = ['e', 'iste', 'iste', 'o', 'imos', 'isteis', 'ieron']
        } else if (irregularStem.endsWith('j')) {
          irregularEndings = ['e', 'iste', 'iste', 'o', 'imos', 'isteis', 'eron'] // -eron, no -ieron
        }
      }
      
      // Generar formas del pretérito
      const baseEndings = useIrregularStem ? irregularEndings : regularPatterns[verbType]
      
      if (baseEndings) {
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'pretIndef' && f.mood === 'indicative' && f.person === person
          )
          
          if (!existingForm) {
            let finalStem = useIrregularStem ? irregularStem : baseStem
            let finalEnding = baseEndings[index]
            
            if (!useIrregularStem) {
              // Aplicar cambios regulares
              finalStem = applyPreteriteVocalicChanges(lemma, finalStem, person)
              finalStem = applyOrthographicChanges(lemma, finalStem, person)
              
              // Aplicar cambios de hiato
              const hiatusResult = applyHiatusChanges(lemma, finalStem, person, finalEnding)
              finalStem = hiatusResult.stem
              finalEnding = hiatusResult.ending
            }
            
            const form = finalStem + finalEnding
            
            mainParadigm.forms.push({
              tense: 'pretIndef',
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
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN DE PRETÉRITO INDEFINIDO COMPLETADA')
    console.log('===============================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const pretStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      const forms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pretIndef' && f.mood === 'indicative')
      
      pretStats.total++
      pretStats.forms += forms.length
      if (forms.length >= 7) {
        pretStats.complete++
      }
    })
    
    const coverage = ((pretStats.complete / pretStats.total) * 100).toFixed(1)
    const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
    console.log(`${emoji} pretIndef: ${coverage}% (${pretStats.complete}/${pretStats.total} verbos completos, ${pretStats.forms} formas totales)`)
    
    // Identificar verbos incompletos
    console.log('\n⚠️  VERBOS CON PRETÉRITO INCOMPLETO')
    console.log('=================================')
    
    const incompleteVerbs = []
    verbs.forEach(verb => {
      const pretForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pretIndef' && f.mood === 'indicative')
      
      if (pretForms.length < 7 && pretForms.length > 0) {
        incompleteVerbs.push({
          lemma: verb.lemma,
          forms: pretForms.length,
          missingPersons: persons.filter(p => !pretForms.some(f => f.person === p))
        })
      }
    })
    
    if (incompleteVerbs.length > 0) {
      incompleteVerbs.slice(0, 15).forEach(verb => {
        console.log(`• ${verb.lemma}: ${verb.forms}/7 formas (faltan: ${verb.missingPersons.slice(0, 3).join(', ')}${verb.missingPersons.length > 3 ? '...' : ''})`)
      })
      
      if (incompleteVerbs.length > 15) {
        console.log(`... y ${incompleteVerbs.length - 15} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos con pretérito lo tienen completo')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con pretérito indefinido completado
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.preterite.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con pretérito indefinido')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar simple-tense-generator.js para regenerar subjuntivo imperfecto')
    console.log('2. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('3. Completar formas restantes de imperativo')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generatePreterite()