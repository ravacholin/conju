#!/usr/bin/env node

// Generador automático de subjuntivo presente
// Se basa en la primera persona singular del presente de indicativo

console.log('🔧 GENERADOR DE SUBJUNTIVO PRESENTE')
console.log('===================================\n')

async function generateSubjunctive() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    // Verbos con raíces irregulares conocidas en subjuntivo
    const irregularSubjunctive = {
      'dar': { stem: 'dé', endings: ['', 's', '', 'mos', 'is', 'n'] },
      'estar': { stem: 'est', endings: ['é', 'és', 'é', 'emos', 'éis', 'én'] },
      'ir': { stem: 'vay', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      'ser': { stem: 'se', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      'haber': { stem: 'hay', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      'saber': { stem: 'sep', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      'caber': { stem: 'quep', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] }
    }
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
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
      
      // Verificar si ya tiene subjuntivo completo
      const existingSubjForms = mainParadigm.forms.filter(f => f.tense === 'subjPres')
      if (existingSubjForms.length >= 7) continue
      
      // Buscar primera persona singular del presente
      const firstPersonPres = mainParadigm.forms.find(f => 
        f.tense === 'pres' && f.person === '1s' && f.mood === 'indicative'
      )
      
      if (!firstPersonPres || !firstPersonPres.form) continue
      
      let subjunctiveStem = ''
      let endings = []
      
      // Verificar si es irregular
      if (irregularSubjunctive[lemma]) {
        subjunctiveStem = irregularSubjunctive[lemma].stem
        endings = irregularSubjunctive[lemma].endings
      } else {
        // Regla general: quitar -o de la 1ª persona y agregar terminaciones opuestas
        const firstPersonForm = firstPersonPres.form
        
        if (firstPersonForm.endsWith('o')) {
          subjunctiveStem = firstPersonForm.slice(0, -1)
          
          // Determiniar tipo de verbo por el infinitivo
          if (lemma.endsWith('ar')) {
            // Verbos -ar usan terminaciones de -er/-ir
            endings = ['e', 'es', 'e', 'emos', 'éis', 'en']
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            // Verbos -er/-ir usan terminaciones de -ar
            endings = ['a', 'as', 'a', 'amos', 'áis', 'an']
          }
        } else {
          // Para verbos que no terminan en -o en 1ª persona (ej: dar → doy)
          if (firstPersonForm === 'doy') {
            subjunctiveStem = 'dé'
            endings = ['', 's', '', 'mos', 'is', 'n']
          } else if (firstPersonForm === 'estoy') {
            subjunctiveStem = 'est'
            endings = ['é', 'és', 'é', 'emos', 'éis', 'én']
          } else if (firstPersonForm === 'voy') {
            subjunctiveStem = 'vay'
            endings = ['a', 'as', 'a', 'amos', 'áis', 'an']
          } else if (firstPersonForm === 'soy') {
            subjunctiveStem = 'se'
            endings = ['a', 'as', 'a', 'amos', 'áis', 'an']
          } else {
            // Intentar regla general
            subjunctiveStem = firstPersonForm
            if (lemma.endsWith('ar')) {
              endings = ['e', 'es', 'e', 'emos', 'éis', 'en']
            } else {
              endings = ['a', 'as', 'a', 'amos', 'áis', 'an']
            }
          }
        }
      }
      
      // Generar formas del subjuntivo
      if (subjunctiveStem && endings.length === 6) {
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'subjPres' && f.person === person
          )
          
          if (!existingForm) {
            const subjForm = subjunctiveStem + endings[index]
            
            mainParadigm.forms.push({
              tense: 'subjPres',
              mood: 'subjunctive',
              person: person,
              form: subjForm,
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
    
    console.log('✅ GENERACIÓN DE SUBJUNTIVO PRESENTE COMPLETADA')
    console.log('===============================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
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
    
    // Identificar verbos que aún necesitan trabajo manual
    console.log('\n⚠️  VERBOS QUE NECESITAN REVISIÓN MANUAL')
    console.log('=======================================')
    
    const verbsNeedingWork = []
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      const presForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pres' && f.mood === 'indicative')
      
      if (subjForms.length < 7 && presForms.length > 0) {
        verbsNeedingWork.push({
          lemma: verb.lemma,
          subjForms: subjForms.length,
          presForms: presForms.length,
          hasFirstPerson: presForms.some(f => f.person === '1s')
        })
      }
    })
    
    if (verbsNeedingWork.length > 0) {
      verbsNeedingWork.slice(0, 15).forEach(verb => {
        console.log(`• ${verb.lemma}: subjPres=${verb.subjForms}/7, pres=${verb.presForms}/7, has1s=${verb.hasFirstPerson}`)
      })
      
      if (verbsNeedingWork.length > 15) {
        console.log(`... y ${verbsNeedingWork.length - 15} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos con presente tienen subjuntivo presente')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo presente generado automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjunctive.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo presente')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar imperative-generator.js nuevamente para mejorar imperativo')
    console.log('2. Completar presente indicativo incompleto')
    console.log('3. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateSubjunctive()