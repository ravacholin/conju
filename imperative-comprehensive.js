#!/usr/bin/env node

// Generador comprehensivo de imperativo afirmativo y negativo
// Completa ambos modos usando subjuntivo presente y formas específicas

console.log('🔧 GENERADOR COMPREHENSIVO DE IMPERATIVOS')
console.log('==========================================\n')

async function generateComprehensiveImperative() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para imperativos comprehensivos...\n`)
    
    const imperativePersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Imperativos afirmativos irregulares (tú)
    const irregularAffirmativeTu = {
      'ser': 'sé',
      'ir': 've', 
      'hacer': 'haz',
      'tener': 'ten',
      'venir': 'ven',
      'poner': 'pon',
      'salir': 'sal',
      'decir': 'di',
      'dar': 'da',
      'estar': 'está',
      'saber': 'sabe'
    }
    
    // Imperativos negativos: "no" + subjuntivo presente
    const irregularNegatives = {
      'ser': {
        '2s_tu': 'no seas', '2s_vos': 'no seas', '3s': 'no sea',
        '1p': 'no seamos', '2p_vosotros': 'no seáis', '3p': 'no sean'
      },
      'estar': {
        '2s_tu': 'no estés', '2s_vos': 'no estés', '3s': 'no esté',
        '1p': 'no estemos', '2p_vosotros': 'no estéis', '3p': 'no estén'
      },
      'ir': {
        '2s_tu': 'no vayas', '2s_vos': 'no vayas', '3s': 'no vaya',
        '1p': 'no vayamos', '2p_vosotros': 'no vayáis', '3p': 'no vayan'
      },
      'dar': {
        '2s_tu': 'no des', '2s_vos': 'no des', '3s': 'no dé',
        '1p': 'no demos', '2p_vosotros': 'no deis', '3p': 'no den'
      },
      'saber': {
        '2s_tu': 'no sepas', '2s_vos': 'no sepas', '3s': 'no sepa',
        '1p': 'no sepamos', '2p_vosotros': 'no sepáis', '3p': 'no sepan'
      }
    }
    
    let verbsUpdated = 0
    let formsAddedAff = 0
    let formsAddedNeg = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) continue
      
      // Obtener formas de subjuntivo presente para usar en imperativo
      const subjPresentForms = mainParadigm.forms.filter(f => f.tense === 'subjPres')
      const presentForms = mainParadigm.forms.filter(f => f.tense === 'pres')
      
      // IMPERATIVO AFIRMATIVO
      const existingImpAff = mainParadigm.forms.filter(f => f.tense === 'impAff')
      
      if (existingImpAff.length < 6) {
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impAff' && f.person === person
          )
          
          if (!existingForm) {
            let affForm = ''
            
            if (person === '2s_tu') {
              // Tú: usar forma irregular o 3s presente sin 's'
              if (irregularAffirmativeTu[lemma]) {
                affForm = irregularAffirmativeTu[lemma]
              } else {
                const thirdSingular = presentForms.find(f => f.person === '3s')
                if (thirdSingular && thirdSingular.form) {
                  affForm = thirdSingular.form
                }
              }
            } else if (person === '2s_vos') {
              // Vos: infinitivo sin -r + acento en última vocal
              if (lemma.endsWith('ar')) {
                affForm = lemma.slice(0, -1) + 'á'
              } else if (lemma.endsWith('er')) {
                affForm = lemma.slice(0, -1) + 'é'
              } else if (lemma.endsWith('ir')) {
                affForm = lemma.slice(0, -1) + 'í'
              }
            } else {
              // Otras personas: usar subjuntivo presente
              const subjForm = subjPresentForms.find(f => f.person === person)
              if (subjForm && subjForm.form) {
                affForm = subjForm.form
              }
            }
            
            if (affForm) {
              mainParadigm.forms.push({
                tense: 'impAff',
                mood: 'imperative',
                person: person,
                form: affForm,
                tags: [],
                region: 'es'
              })
              formsAddedAff++
              verbUpdated = true
            }
          }
        })
      }
      
      // IMPERATIVO NEGATIVO
      const existingImpNeg = mainParadigm.forms.filter(f => f.tense === 'impNeg')
      
      if (existingImpNeg.length < 6) {
        // Verificar si es completamente irregular
        if (irregularNegatives[lemma]) {
          const irregularForms = irregularNegatives[lemma]
          
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
              formsAddedNeg++
              verbUpdated = true
            }
          })
        } else {
          // Regular: "no" + subjuntivo presente
          imperativePersons.forEach(person => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === 'impNeg' && f.person === person
            )
            
            if (!existingForm) {
              const subjForm = subjPresentForms.find(f => f.person === person)
              if (subjForm && subjForm.form) {
                const negForm = `no ${subjForm.form}`
                
                mainParadigm.forms.push({
                  tense: 'impNeg',
                  mood: 'imperative',
                  person: person,
                  form: negForm,
                  tags: [],
                  region: 'es'
                })
                formsAddedNeg++
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
    
    console.log('✅ GENERACIÓN COMPREHENSIVA DE IMPERATIVOS COMPLETADA')
    console.log('=====================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas afirmativas agregadas: ${formsAddedAff}`)
    console.log(`📈 Formas negativas agregadas: ${formsAddedNeg}`)
    console.log(`📈 Total formas agregadas: ${formsAddedAff + formsAddedNeg}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const impAffStats = { total: 0, complete: 0, forms: 0 }
    const impNegStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      // Imperativo afirmativo
      const impAffForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impAff')
      impAffStats.total++
      impAffStats.forms += impAffForms.length
      if (impAffForms.length >= 6) {
        impAffStats.complete++
      }
      
      // Imperativo negativo
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      impNegStats.total++
      impNegStats.forms += impNegForms.length
      if (impNegForms.length >= 6) {
        impNegStats.complete++
      }
    })
    
    const affCoverage = ((impAffStats.complete / impAffStats.total) * 100).toFixed(1)
    const negCoverage = ((impNegStats.complete / impNegStats.total) * 100).toFixed(1)
    
    const affEmoji = affCoverage >= 90 ? '✅' : affCoverage >= 70 ? '🔶' : '⚠️'
    const negEmoji = negCoverage >= 90 ? '✅' : negCoverage >= 70 ? '🔶' : '⚠️'
    
    console.log(`${affEmoji} impAff: ${affCoverage}% (${impAffStats.complete}/${impAffStats.total} verbos completos, ${impAffStats.forms} formas totales)`)
    console.log(`${negEmoji} impNeg: ${negCoverage}% (${impNegStats.complete}/${impNegStats.total} verbos completos, ${impNegStats.forms} formas totales)`)
    
    // Analizar verbos aún incompletos
    const stillIncompleteAff = []
    const stillIncompleteNeg = []
    
    verbs.forEach(verb => {
      const impAffForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impAff')
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      if (impAffForms.length < 6) {
        stillIncompleteAff.push({
          lemma: verb.lemma,
          impAffForms: impAffForms.length,
          subjForms: subjForms.length
        })
      }
      
      if (impNegForms.length < 6) {
        stillIncompleteNeg.push({
          lemma: verb.lemma,
          impNegForms: impNegForms.length,
          subjForms: subjForms.length
        })
      }
    })
    
    if (stillIncompleteAff.length > 0) {
      console.log(`\n⚠️  ${stillIncompleteAff.length} verbos con imperativo afirmativo incompleto:`)
      stillIncompleteAff.slice(0, 10).forEach(verb => {
        console.log(`   • ${verb.lemma}: impAff=${verb.impAffForms}/6, subjPres=${verb.subjForms}/7`)
      })
    }
    
    if (stillIncompleteNeg.length > 0) {
      console.log(`\n⚠️  ${stillIncompleteNeg.length} verbos con imperativo negativo incompleto:`)
      stillIncompleteNeg.slice(0, 10).forEach(verb => {
        console.log(`   • ${verb.lemma}: impNeg=${verb.impNegForms}/6, subjPres=${verb.subjForms}/7`)
      })
    }
    
    if (stillIncompleteAff.length === 0 && stillIncompleteNeg.length === 0) {
      console.log('\n✅ Todos los verbos tienen imperativos completos!')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con imperativos comprehensivos
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.imperative-comprehensive.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con imperativos comprehensivos')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('2. Completar formas no finitas restantes')
    console.log('3. Resolver verbos con dependencias específicas')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateComprehensiveImperative()