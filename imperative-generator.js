#!/usr/bin/env node

// Generador automático de imperativo afirmativo y negativo
// El imperativo se basa en el presente de indicativo y subjuntivo

console.log('🔧 GENERADOR DE IMPERATIVO')
console.log('==========================\n')

async function generateImperative() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    // Verbos con imperativo irregular específico
    const irregularImperatives = {
      'tener': {
        impAff: { '2s_tu': 'ten', '2s_vos': 'tené' },
        impNeg: { '2s_tu': 'no tengas', '2s_vos': 'no tengas' }
      },
      'venir': {
        impAff: { '2s_tu': 'ven', '2s_vos': 'vení' },
        impNeg: { '2s_tu': 'no vengas', '2s_vos': 'no vengas' }
      },
      'poner': {
        impAff: { '2s_tu': 'pon', '2s_vos': 'poné' },
        impNeg: { '2s_tu': 'no pongas', '2s_vos': 'no pongas' }
      },
      'salir': {
        impAff: { '2s_tu': 'sal', '2s_vos': 'salí' },
        impNeg: { '2s_tu': 'no salgas', '2s_vos': 'no salgas' }
      },
      'hacer': {
        impAff: { '2s_tu': 'haz', '2s_vos': 'hacé' },
        impNeg: { '2s_tu': 'no hagas', '2s_vos': 'no hagas' }
      },
      'decir': {
        impAff: { '2s_tu': 'di', '2s_vos': 'decí' },
        impNeg: { '2s_tu': 'no digas', '2s_vos': 'no digas' }
      },
      'ir': {
        impAff: { '2s_tu': 've', '2s_vos': 'andá' },
        impNeg: { '2s_tu': 'no vayas', '2s_vos': 'no vayas' }
      },
      'ser': {
        impAff: { '2s_tu': 'sé', '2s_vos': 'sé' },
        impNeg: { '2s_tu': 'no seas', '2s_vos': 'no seas' }
      },
      'dar': {
        impAff: { '2s_tu': 'da', '2s_vos': 'da' },
        impNeg: { '2s_tu': 'no des', '2s_vos': 'no des' }
      },
      'estar': {
        impAff: { '2s_tu': 'está', '2s_vos': 'está' },
        impNeg: { '2s_tu': 'no estés', '2s_vos': 'no estés' }
      },
      'haber': {
        impAff: { '2s_tu': 'he', '2s_vos': 'habé' },
        impNeg: { '2s_tu': 'no hayas', '2s_vos': 'no hayas' }
      },
      'saber': {
        impAff: { '2s_tu': 'sabe', '2s_vos': 'sabé' },
        impNeg: { '2s_tu': 'no sepas', '2s_vos': 'no sepas' }
      }
    }
    
    const imperativePersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
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
      
      // Recopilar formas existentes de presente indicativo y subjuntivo
      const presenteInd = {}
      const presenteSubj = {}
      
      mainParadigm.forms.forEach(form => {
        if (form.tense === 'pres' && form.mood === 'indicative') {
          presenteInd[form.person] = form.form
        }
        if (form.tense === 'subjPres' && form.mood === 'subjunctive') {
          presenteSubj[form.person] = form.form
        }
      })
      
      // Generar imperativo afirmativo
      const existingImpAff = mainParadigm.forms.filter(f => f.tense === 'impAff')
      if (existingImpAff.length < 6) {
        
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impAff' && f.person === person
          )
          
          if (!existingForm) {
            let imperativeForm = null
            
            // Verificar si es irregular
            if (irregularImperatives[lemma] && irregularImperatives[lemma].impAff[person]) {
              imperativeForm = irregularImperatives[lemma].impAff[person]
            } else {
              // Reglas regulares
              if (person === '2s_tu') {
                // tú: 3ª persona singular del presente
                imperativeForm = presenteInd['3s']
              } else if (person === '2s_vos') {
                // vos: infinitivo sin -r + acento
                if (lemma.endsWith('ar')) {
                  imperativeForm = lemma.slice(0, -1) + 'á'
                } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
                  imperativeForm = lemma.slice(0, -1) + 'é'
                }
              } else {
                // 3s, 1p, 2p_vosotros, 3p: usar subjuntivo presente
                imperativeForm = presenteSubj[person]
                
                // Para vosotros: infinitivo sin -r + -d
                if (person === '2p_vosotros') {
                  imperativeForm = lemma.slice(0, -1) + 'd'
                }
              }
            }
            
            if (imperativeForm) {
              mainParadigm.forms.push({
                tense: 'impAff',
                mood: 'imperative',
                person: person,
                form: imperativeForm,
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          }
        })
      }
      
      // Generar imperativo negativo
      const existingImpNeg = mainParadigm.forms.filter(f => f.tense === 'impNeg')
      if (existingImpNeg.length < 6) {
        
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impNeg' && f.person === person
          )
          
          if (!existingForm) {
            let imperativeForm = null
            
            // Verificar si es irregular
            if (irregularImperatives[lemma] && irregularImperatives[lemma].impNeg[person]) {
              imperativeForm = irregularImperatives[lemma].impNeg[person]
            } else {
              // Imperativo negativo: siempre "no" + subjuntivo presente
              const subjForm = presenteSubj[person]
              if (subjForm) {
                imperativeForm = `no ${subjForm}`
              }
            }
            
            if (imperativeForm) {
              mainParadigm.forms.push({
                tense: 'impNeg',
                mood: 'imperative',
                person: person,
                form: imperativeForm,
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          }
        })
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN DE IMPERATIVO COMPLETADA')
    console.log('======================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const imperativeStats = {
      impAff: { total: 0, complete: 0, forms: 0 },
      impNeg: { total: 0, complete: 0, forms: 0 }
    }
    
    verbs.forEach(verb => {
      ['impAff', 'impNeg'].forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        imperativeStats[tense].total++
        imperativeStats[tense].forms += forms.length
        if (forms.length >= 6) { // 6 personas del imperativo
          imperativeStats[tense].complete++
        }
      })
    })
    
    Object.entries(imperativeStats).forEach(([tense, stats]) => {
      const coverage = ((stats.complete / stats.total) * 100).toFixed(1)
      const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
      console.log(`${emoji} ${tense}: ${coverage}% (${stats.complete}/${stats.total} verbos completos, ${stats.forms} formas totales)`)
    })
    
    // Identificar verbos que aún necesitan subjuntivo presente para imperativo
    console.log('\n⚠️  VERBOS QUE NECESITAN SUBJUNTIVO PRESENTE PARA IMPERATIVO COMPLETO')
    console.log('====================================================================')
    
    const verbsNeedingSubjunctive = []
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      if (subjForms.length < 6) {
        const impAffForms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === 'impAff')
        const impNegForms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === 'impNeg')
        
        if (impAffForms.length < 6 || impNegForms.length < 6) {
          verbsNeedingSubjunctive.push({
            lemma: verb.lemma,
            subjForms: subjForms.length,
            impAff: impAffForms.length,
            impNeg: impNegForms.length
          })
        }
      }
    })
    
    if (verbsNeedingSubjunctive.length > 0) {
      verbsNeedingSubjunctive.slice(0, 20).forEach(verb => {
        console.log(`• ${verb.lemma}: subjPres=${verb.subjForms}/7, impAff=${verb.impAff}/6, impNeg=${verb.impNeg}/6`)
      })
      
      if (verbsNeedingSubjunctive.length > 20) {
        console.log(`... y ${verbsNeedingSubjunctive.length - 20} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos tienen subjuntivo presente suficiente para imperativo')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con imperativo generado automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.imperative.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con imperativo')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Completar subjuntivo presente para mejorar imperativo')
    console.log('2. Completar presente indicativo incompleto')
    console.log('3. Ejecutar comprehensive-tense-audit.js para verificar mejora')
    console.log('4. Generar formas no finitas faltantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateImperative()