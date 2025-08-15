#!/usr/bin/env node

// Completador agresivo de subjuntivo presente
// Fuerza la creación de todas las formas faltantes, incluso sobrescribiendo parciales

console.log('🔧 COMPLETADOR AGRESIVO DE SUBJUNTIVO PRESENTE')
console.log('==============================================\n')

async function aggressiveSubjunctiveCompletion() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Mapeo completo de verbos irregulares con sus subjuntivos conocidos
    const completeSubjunctives = {
      'ser': ['sea', 'seas', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
      'estar': ['esté', 'estés', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
      'ir': ['vaya', 'vayas', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
      'dar': ['dé', 'des', 'des', 'dé', 'demos', 'deis', 'den'],
      'ver': ['vea', 'veas', 'veas', 'vea', 'veamos', 'veáis', 'vean'],
      'haber': ['haya', 'hayas', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
      'saber': ['sepa', 'sepas', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
      'caber': ['quepa', 'quepas', 'quepas', 'quepa', 'quepamos', 'quepáis', 'quepan'],
      'poder': ['pueda', 'puedas', 'puedas', 'pueda', 'podamos', 'podáis', 'puedan'],
      'querer': ['quiera', 'quieras', 'quieras', 'quiera', 'queramos', 'queráis', 'quieran'],
      'tener': ['tenga', 'tengas', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan'],
      'venir': ['venga', 'vengas', 'vengas', 'venga', 'vengamos', 'vengáis', 'vengan'],
      'poner': ['ponga', 'pongas', 'pongas', 'ponga', 'pongamos', 'pongáis', 'pongan'],
      'salir': ['salga', 'salgas', 'salgas', 'salga', 'salgamos', 'salgáis', 'salgan'],
      'valer': ['valga', 'valgas', 'valgas', 'valga', 'valgamos', 'valgáis', 'valgan'],
      'hacer': ['haga', 'hagas', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
      'decir': ['diga', 'digas', 'digas', 'diga', 'digamos', 'digáis', 'digan'],
      'traer': ['traiga', 'traigas', 'traigas', 'traiga', 'traigamos', 'traigáis', 'traigan'],
      'caer': ['caiga', 'caigas', 'caigas', 'caiga', 'caigamos', 'caigáis', 'caigan'],
      'oír': ['oiga', 'oigas', 'oigas', 'oiga', 'oigamos', 'oigáis', 'oigan'],
      
      // Verbos con diptongación
      'pensar': ['piense', 'pienses', 'pienses', 'piense', 'pensemos', 'penséis', 'piensen'],
      'cerrar': ['cierre', 'cierres', 'cierres', 'cierre', 'cerremos', 'cerréis', 'cierren'],
      'empezar': ['empiece', 'empieces', 'empieces', 'empiece', 'empecemos', 'empecéis', 'empiecen'],
      'volver': ['vuelva', 'vuelvas', 'vuelvas', 'vuelva', 'volvamos', 'volváis', 'vuelvan'],
      'contar': ['cuente', 'cuentes', 'cuentes', 'cuente', 'contemos', 'contéis', 'cuenten'],
      'mostrar': ['muestre', 'muestres', 'muestres', 'muestre', 'mostremos', 'mostréis', 'muestren'],
      'jugar': ['juegue', 'juegues', 'juegues', 'juegue', 'juguemos', 'juguéis', 'jueguen'],
      
      // Verbos e→i
      'pedir': ['pida', 'pidas', 'pidas', 'pida', 'pidamos', 'pidáis', 'pidan'],
      'servir': ['sirva', 'sirvas', 'sirvas', 'sirva', 'sirvamos', 'sirváis', 'sirvan'],
      'seguir': ['siga', 'sigas', 'sigas', 'siga', 'sigamos', 'sigáis', 'sigan'],
      'sentir': ['sienta', 'sientas', 'sientas', 'sienta', 'sintamos', 'sintáis', 'sientan'],
      
      // Verbos -cer/-cir
      'conocer': ['conozca', 'conozcas', 'conozcas', 'conozca', 'conozcamos', 'conozcáis', 'conozcan'],
      'parecer': ['parezca', 'parezcas', 'parezcas', 'parezca', 'parezcamos', 'parezcáis', 'parezcan'],
      'nacer': ['nazca', 'nazcas', 'nazcas', 'nazca', 'nazcamos', 'nazcáis', 'nazcan'],
      'crecer': ['crezca', 'crezcas', 'crezcas', 'crezca', 'crezcamos', 'crezcáis', 'crezcan'],
      'conducir': ['conduzca', 'conduzcas', 'conduzcas', 'conduzca', 'conduzcamos', 'conduzcáis', 'conduzcan'],
      'traducir': ['traduzca', 'traduzcas', 'traduzcas', 'traduzca', 'traduzcamos', 'traduzcáis', 'traduzcan'],
      'producir': ['produzca', 'produzcas', 'produzcas', 'produzca', 'produzcamos', 'produzcáis', 'produzcan'],
      
      // Verbos -ger/-gir
      'proteger': ['proteja', 'protejas', 'protejas', 'proteja', 'protejamos', 'protejáis', 'protejan'],
      'coger': ['coja', 'cojas', 'cojas', 'coja', 'cojamos', 'cojáis', 'cojan'],
      'elegir': ['elija', 'elijas', 'elijas', 'elija', 'elijamos', 'elijáis', 'elijan'],
      
      // Verbos -uir
      'construir': ['construya', 'construyas', 'construyas', 'construya', 'construyamos', 'construyáis', 'construyan'],
      'destruir': ['destruya', 'destruyas', 'destruyas', 'destruya', 'destruyamos', 'destruyáis', 'destruyan'],
      'huir': ['huya', 'huyas', 'huyas', 'huya', 'huyamos', 'huyáis', 'huyan'],
      'incluir': ['incluya', 'incluyas', 'incluyas', 'incluya', 'incluyamos', 'incluyáis', 'incluyan'],
      'concluir': ['concluya', 'concluyas', 'concluyas', 'concluya', 'concluyamos', 'concluyáis', 'concluyan'],
      'contribuir': ['contribuya', 'contribuyas', 'contribuyas', 'contribuya', 'contribuyamos', 'contribuyáis', 'contribuyan'],
      'distribuir': ['distribuya', 'distribuyas', 'distribuyas', 'distribuya', 'distribuyamos', 'distribuyáis', 'distribuyan'],
      
      // Verbos ortográficos
      'buscar': ['busque', 'busques', 'busques', 'busque', 'busquemos', 'busquéis', 'busquen'],
      'sacar': ['saque', 'saques', 'saques', 'saque', 'saquemos', 'saquéis', 'saquen'],
      'llegar': ['llegue', 'llegues', 'llegues', 'llegue', 'lleguemos', 'lleguéis', 'lleguen'],
      'pagar': ['pague', 'pagues', 'pagues', 'pague', 'paguemos', 'paguéis', 'paguen'],
      'organizar': ['organice', 'organices', 'organices', 'organice', 'organicemos', 'organicéis', 'organicen'],
      'almorzar': ['almuerce', 'almuerces', 'almuerces', 'almuerce', 'almorcemos', 'almorcéis', 'almuercen']
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    let formsReplaced = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({ region: 'es', forms: [] })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // Verificar si tiene subjuntivo completo
      const existingSubjForms = mainParadigm.forms.filter(f => f.tense === 'subjPres')
      
      // Si tiene formas conocidas completas, usarlas
      if (completeSubjunctives[lemma]) {
        const knownForms = completeSubjunctives[lemma]
        
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'subjPres' && f.person === person
          )
          
          if (!existingForm) {
            mainParadigm.forms.push({
              tense: 'subjPres',
              mood: 'subjunctive',
              person: person,
              form: knownForms[index],
              tags: [],
              region: 'es'
            })
            formsAdded++
            verbUpdated = true
          } else if (existingForm.form !== knownForms[index]) {
            // Reemplazar con la forma correcta
            existingForm.form = knownForms[index]
            formsReplaced++
            verbUpdated = true
          }
        })
      } else if (existingSubjForms.length < 7) {
        // Intentar generar formas regulares para verbos sin formas conocidas
        const firstPersonPres = mainParadigm.forms.find(f => 
          f.tense === 'pres' && f.person === '1s' && f.mood === 'indicative'
        )
        
        if (firstPersonPres && firstPersonPres.form && firstPersonPres.form.endsWith('o')) {
          const stem = firstPersonPres.form.slice(0, -1)
          let endings = []
          
          if (lemma.endsWith('ar')) {
            endings = ['e', 'es', 'es', 'e', 'emos', 'éis', 'en']
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            endings = ['a', 'as', 'as', 'a', 'amos', 'áis', 'an']
          }
          
          if (endings.length > 0) {
            persons.forEach((person, index) => {
              const existingForm = mainParadigm.forms.find(f => 
                f.tense === 'subjPres' && f.person === person
              )
              
              if (!existingForm) {
                mainParadigm.forms.push({
                  tense: 'subjPres',
                  mood: 'subjunctive',
                  person: person,
                  form: stem + endings[index],
                  tags: [],
                  region: 'es'
                })
                formsAdded++
                verbUpdated = true
              }
            })
          }
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ COMPLETADO AGRESIVO DE SUBJUNTIVO PRESENTE')
    console.log('============================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log(`📈 Formas corregidas: ${formsReplaced}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const subjStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      const forms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      subjStats.total++
      subjStats.forms += forms.length
      if (forms.length >= 7) {
        subjStats.complete++
      }
    })
    
    const coverage = ((subjStats.complete / subjStats.total) * 100).toFixed(1)
    const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
    console.log(`${emoji} subjPres: ${coverage}% (${subjStats.complete}/${subjStats.total} verbos completos, ${subjStats.forms} formas totales)`)
    
    // Analizar verbos aún incompletos
    console.log('\n⚠️  VERBOS AÚN INCOMPLETOS')
    console.log('=========================')
    
    const stillIncomplete = []
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      if (subjForms.length < 7) {
        stillIncomplete.push({
          lemma: verb.lemma,
          forms: subjForms.length,
          missingPersons: persons.filter(p => !subjForms.some(f => f.person === p))
        })
      }
    })
    
    if (stillIncomplete.length > 0) {
      console.log(`📊 ${stillIncomplete.length} verbos aún incompletos:`)
      stillIncomplete.slice(0, 20).forEach(verb => {
        console.log(`• ${verb.lemma}: ${verb.forms}/7 formas (faltan: ${verb.missingPersons.slice(0, 3).join(', ')}${verb.missingPersons.length > 3 ? '...' : ''})`)
      })
      
      if (stillIncomplete.length > 20) {
        console.log(`... y ${stillIncomplete.length - 20} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos tienen subjuntivo presente completo')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo presente completado agresivamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjunctive-aggressive.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo completo')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar imperative-generator.js para completar imperativo con nuevo subjuntivo')
    console.log('2. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('3. Continuar con completado de formas restantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

aggressiveSubjunctiveCompletion()