#!/usr/bin/env node

// Optimizador específico para imperativo negativo
// Mejora la cobertura del imperativo negativo usando subjuntivo presente

console.log('🔧 OPTIMIZADOR DE IMPERATIVO NEGATIVO')
console.log('=====================================\n')

async function optimizeImperativeNegative() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para imperativo negativo...\n`)
    
    const imperativePersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Mapeo de personas imperativo a subjuntivo
    const personMapping = {
      '2s_tu': '2s_tu',
      '2s_vos': '2s_vos', 
      '3s': '3s',
      '1p': '1p',
      '2p_vosotros': '2p_vosotros',
      '3p': '3p'
    }
    
    // Verbos con imperativos negativos completamente irregulares
    const irregularNegative = {
      'ser': {
        '2s_tu': 'no seas',
        '2s_vos': 'no seas',
        '3s': 'no sea',
        '1p': 'no seamos',
        '2p_vosotros': 'no seáis',
        '3p': 'no sean'
      },
      'estar': {
        '2s_tu': 'no estés',
        '2s_vos': 'no estés',
        '3s': 'no esté',
        '1p': 'no estemos',
        '2p_vosotros': 'no estéis',
        '3p': 'no estén'
      },
      'ir': {
        '2s_tu': 'no vayas',
        '2s_vos': 'no vayas',
        '3s': 'no vaya',
        '1p': 'no vayamos',
        '2p_vosotros': 'no vayáis',
        '3p': 'no vayan'
      },
      'dar': {
        '2s_tu': 'no des',
        '2s_vos': 'no des',
        '3s': 'no dé',
        '1p': 'no demos',
        '2p_vosotros': 'no deis',
        '3p': 'no den'
      },
      'saber': {
        '2s_tu': 'no sepas',
        '2s_vos': 'no sepas',
        '3s': 'no sepa',
        '1p': 'no sepamos',
        '2p_vosotros': 'no sepáis',
        '3p': 'no sepan'
      }
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) continue
      
      // Verificar imperativo negativo existente
      const existingImpNeg = mainParadigm.forms.filter(f => f.tense === 'impNeg')
      
      // Si ya está completo, saltar
      if (existingImpNeg.length >= 6) continue
      
      // Verificar si es completamente irregular
      if (irregularNegative[lemma]) {
        const irregularForms = irregularNegative[lemma]
        
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impNeg' && f.person === person
          )
          
          if (!existingForm && irregularForms[person]) {
            mainParadigm.forms.push({
              tense: 'impNeg',
              mood: 'imperative',
              person: person,
              form: irregularForms[person],
              tags: [],
              region: 'es'
            })
            formsAdded++
            verbUpdated = true
          }
        })
      } else {
        // Imperativo negativo regular: "no" + subjuntivo presente
        const subjunctiveForms = mainParadigm.forms.filter(f => f.tense === 'subjPres')
        
        // Solo proceder si tiene suficientes formas de subjuntivo
        if (subjunctiveForms.length >= 4) {
          imperativePersons.forEach(person => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === 'impNeg' && f.person === person
            )
            
            if (!existingForm) {
              // Buscar la forma correspondiente del subjuntivo
              const subjPerson = personMapping[person]
              const subjForm = subjunctiveForms.find(f => f.person === subjPerson)
              
              if (subjForm && subjForm.form) {
                const negativeForm = `no ${subjForm.form}`
                
                mainParadigm.forms.push({
                  tense: 'impNeg',
                  mood: 'imperative',
                  person: person,
                  form: negativeForm,
                  tags: [],
                  region: 'es'
                })
                formsAdded++
                verbUpdated = true
              }
            }
          })
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ OPTIMIZACIÓN DE IMPERATIVO NEGATIVO COMPLETADA')
    console.log('=================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const impNegStats = { total: 0, complete: 0, forms: 0 }
    const impAffStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      // Imperativo negativo
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      impNegStats.total++
      impNegStats.forms += impNegForms.length
      if (impNegForms.length >= 6) {
        impNegStats.complete++
      }
      
      // Imperativo afirmativo para comparación
      const impAffForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impAff')
      impAffStats.total++
      impAffStats.forms += impAffForms.length
      if (impAffForms.length >= 6) {
        impAffStats.complete++
      }
    })
    
    const negCoverage = ((impNegStats.complete / impNegStats.total) * 100).toFixed(1)
    const affCoverage = ((impAffStats.complete / impAffStats.total) * 100).toFixed(1)
    
    const negEmoji = negCoverage >= 90 ? '✅' : negCoverage >= 70 ? '🔶' : negCoverage >= 50 ? '⚠️' : '❌'
    const affEmoji = affCoverage >= 90 ? '✅' : affCoverage >= 70 ? '🔶' : '⚠️'
    
    console.log(`${negEmoji} impNeg: ${negCoverage}% (${impNegStats.complete}/${impNegStats.total} verbos completos, ${impNegStats.forms} formas totales)`)
    console.log(`${affEmoji} impAff: ${affCoverage}% (${impAffStats.complete}/${impAffStats.total} verbos completos, ${impAffStats.forms} formas totales)`)
    
    // Analizar verbos que necesitan más subjuntivo para imperativo
    console.log('\n📊 ANÁLISIS DE DEPENDENCIAS')
    console.log('===========================')
    
    const needMoreSubjunctive = []
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      
      if (subjForms.length >= 4 && impNegForms.length < 6) {
        needMoreSubjunctive.push({
          lemma: verb.lemma,
          subjForms: subjForms.length,
          impNegForms: impNegForms.length
        })
      }
    })
    
    if (needMoreSubjunctive.length > 0) {
      console.log(`⚠️  ${needMoreSubjunctive.length} verbos pueden mejorar imperativo negativo:`)
      needMoreSubjunctive.slice(0, 15).forEach(verb => {
        console.log(`   • ${verb.lemma}: subjPres=${verb.subjForms}/7, impNeg=${verb.impNegForms}/6`)
      })
    }
    
    // Verbos sin subjuntivo suficiente
    const needSubjunctive = []
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      
      if (subjForms.length < 4 && impNegForms.length < 6) {
        needSubjunctive.push({
          lemma: verb.lemma,
          subjForms: subjForms.length
        })
      }
    })
    
    if (needSubjunctive.length > 0) {
      console.log(`\n❌ ${needSubjunctive.length} verbos necesitan más subjuntivo presente:`)
      needSubjunctive.slice(0, 10).forEach(verb => {
        console.log(`   • ${verb.lemma}: subjPres=${verb.subjForms}/7`)
      })
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con imperativo negativo optimizado
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.impneg-optimized.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con imperativo negativo optimizado')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora')
    console.log('2. Optimizar formas no finitas restantes')
    console.log('3. Commit final de optimizaciones')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

optimizeImperativeNegative()