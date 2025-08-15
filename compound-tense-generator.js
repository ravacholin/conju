#!/usr/bin/env node

// Generador automático de tiempos compuestos
// Los tiempos compuestos se forman con haber + participio

console.log('🔧 GENERADOR DE TIEMPOS COMPUESTOS')
console.log('==================================\n')

async function generateCompoundTenses() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    // Conjugaciones de HABER para tiempos compuestos
    const haberConjugations = {
      // Indicativo compuesto
      pretPerf: {
        '1s': 'he', '2s_tu': 'has', '2s_vos': 'has', '3s': 'ha',
        '1p': 'hemos', '2p_vosotros': 'habéis', '3p': 'han'
      },
      plusc: {
        '1s': 'había', '2s_tu': 'habías', '2s_vos': 'habías', '3s': 'había',
        '1p': 'habíamos', '2p_vosotros': 'habíais', '3p': 'habían'
      },
      futPerf: {
        '1s': 'habré', '2s_tu': 'habrás', '2s_vos': 'habrás', '3s': 'habrá',
        '1p': 'habremos', '2p_vosotros': 'habréis', '3p': 'habrán'
      },
      condPerf: {
        '1s': 'habría', '2s_tu': 'habrías', '2s_vos': 'habrías', '3s': 'habría',
        '1p': 'habríamos', '2p_vosotros': 'habríais', '3p': 'habrían'
      },
      
      // Subjuntivo compuesto
      subjPerf: {
        '1s': 'haya', '2s_tu': 'hayas', '2s_vos': 'hayas', '3s': 'haya',
        '1p': 'hayamos', '2p_vosotros': 'hayáis', '3p': 'hayan'
      },
      subjPlusc: {
        '1s': 'hubiera', '2s_tu': 'hubieras', '2s_vos': 'hubieras', '3s': 'hubiera',
        '1p': 'hubiéramos', '2p_vosotros': 'hubierais', '3p': 'hubieran'
      }
    }
    
    const compoundTenseInfo = {
      pretPerf: { mood: 'indicative', name: 'Pretérito perfecto compuesto' },
      plusc: { mood: 'indicative', name: 'Pretérito pluscuamperfecto' },
      futPerf: { mood: 'indicative', name: 'Futuro perfecto' },
      condPerf: { mood: 'conditional', name: 'Condicional perfecto' },
      subjPerf: { mood: 'subjunctive', name: 'Pretérito perfecto del subjuntivo' },
      subjPlusc: { mood: 'subjunctive', name: 'Pretérito pluscuamperfecto del subjuntivo' }
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      // Buscar el participio del verbo
      let participio = null
      
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          if (form.tense === 'part') {
            participio = form.form
          }
        })
      })
      
      if (!participio) {
        // Generar participio regular si no existe
        if (verb.lemma.endsWith('ar')) {
          participio = verb.lemma.slice(0, -2) + 'ado'
        } else if (verb.lemma.endsWith('er') || verb.lemma.endsWith('ir')) {
          participio = verb.lemma.slice(0, -2) + 'ido'
        } else {
          console.log(`⚠️  No se pudo generar participio para: ${verb.lemma}`)
          continue
        }
      }
      
      let verbUpdated = false
      
      // Buscar paradigma principal o crear uno
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({
          region: 'es',
          forms: []
        })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // Generar tiempos compuestos
      Object.entries(compoundTenseInfo).forEach(([tense, tenseData]) => {
        const haberForms = haberConjugations[tense]
        
        Object.entries(haberForms).forEach(([person, haberForm]) => {
          // Verificar si ya existe esta forma
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === tense && f.person === person
          )
          
          if (!existingForm) {
            // Crear forma compuesta
            const compoundForm = `${haberForm} ${participio}`
            
            mainParadigm.forms.push({
              tense: tense,
              mood: tenseData.mood,
              person: person,
              form: compoundForm,
              tags: [],
              region: 'es'
            })
            
            formsAdded++
            verbUpdated = true
          }
        })
      })
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN COMPLETADA')
    console.log('========================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const tenseStats = {}
    Object.keys(compoundTenseInfo).forEach(tense => {
      tenseStats[tense] = { total: 0, complete: 0 }
    })
    
    verbs.forEach(verb => {
      Object.keys(compoundTenseInfo).forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        tenseStats[tense].total++
        if (forms.length >= 7) { // 7 personas
          tenseStats[tense].complete++
        }
      })
    })
    
    Object.entries(tenseStats).forEach(([tense, stats]) => {
      const coverage = ((stats.complete / stats.total) * 100).toFixed(1)
      const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
      console.log(`${emoji} ${tense}: ${coverage}% (${stats.complete}/${stats.total} verbos completos)`)
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con tiempos compuestos generados automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const path = await import('path')
    
    const backupPath = `./src/data/verbs.backup.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con tiempos compuestos')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar tests para verificar integridad')
    console.log('2. Revisar participios irregulares y ajustar manualmente')
    console.log('3. Completar tiempos simples faltantes (impf, fut, cond, subjImpf)')
    console.log('4. Ejecutar comprehensive-tense-audit.js para verificar mejora')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateCompoundTenses()