#!/usr/bin/env node

// Generador automático de tiempos simples faltantes
// Genera imperfecto, futuro, condicional y subjuntivo imperfecto

console.log('🔧 GENERADOR DE TIEMPOS SIMPLES')
console.log('===============================\n')

async function generateSimpleTenses() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    // Patrones de conjugación para tiempos regulares
    const conjugationPatterns = {
      // Imperfecto indicativo
      impf: {
        'ar': {
          '1s': 'aba', '2s_tu': 'abas', '2s_vos': 'abas', '3s': 'aba',
          '1p': 'ábamos', '2p_vosotros': 'abais', '3p': 'aban'
        },
        'er': {
          '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía',
          '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían'
        },
        'ir': {
          '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía',
          '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían'
        }
      },
      
      // Futuro (se basa en el infinitivo completo)
      fut: {
        'ar': {
          '1s': 'é', '2s_tu': 'ás', '2s_vos': 'ás', '3s': 'á',
          '1p': 'emos', '2p_vosotros': 'éis', '3p': 'án'
        },
        'er': {
          '1s': 'é', '2s_tu': 'ás', '2s_vos': 'ás', '3s': 'á',
          '1p': 'emos', '2p_vosotros': 'éis', '3p': 'án'
        },
        'ir': {
          '1s': 'é', '2s_tu': 'ás', '2s_vos': 'ás', '3s': 'á',
          '1p': 'emos', '2p_vosotros': 'éis', '3p': 'án'
        }
      },
      
      // Condicional (se basa en el infinitivo completo)
      cond: {
        'ar': {
          '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía',
          '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían'
        },
        'er': {
          '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía',
          '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían'
        },
        'ir': {
          '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía',
          '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían'
        }
      }
    }
    
    // Verbos irregulares conocidos - raíces especiales
    const irregularStems = {
      // Futuro y condicional irregulares
      fut: {
        'tener': 'tendr', 'venir': 'vendr', 'poner': 'pondr', 'salir': 'saldr',
        'valer': 'valdr', 'poder': 'podr', 'saber': 'sabr', 'caber': 'cabr',
        'haber': 'habr', 'querer': 'querr', 'hacer': 'har', 'decir': 'dir'
      },
      cond: {
        'tener': 'tendr', 'venir': 'vendr', 'poner': 'pondr', 'salir': 'saldr',
        'valer': 'valdr', 'poder': 'podr', 'saber': 'sabr', 'caber': 'cabr',
        'haber': 'habr', 'querer': 'querr', 'hacer': 'har', 'decir': 'dir'
      },
      
      // Imperfecto (solo ser, ir y ver son irregulares)
      impf: {
        'ser': { '1s': 'era', '2s_tu': 'eras', '2s_vos': 'eras', '3s': 'era',
                 '1p': 'éramos', '2p_vosotros': 'erais', '3p': 'eran' },
        'ir': { '1s': 'iba', '2s_tu': 'ibas', '2s_vos': 'ibas', '3s': 'iba',
                '1p': 'íbamos', '2p_vosotros': 'ibais', '3p': 'iban' },
        'ver': { '1s': 'veía', '2s_tu': 'veías', '2s_vos': 'veías', '3s': 'veía',
                 '1p': 'veíamos', '2p_vosotros': 'veíais', '3p': 'veían' }
      }
    }
    
    const tenseInfo = {
      impf: { mood: 'indicative', name: 'Pretérito imperfecto' },
      fut: { mood: 'indicative', name: 'Futuro simple' },
      cond: { mood: 'conditional', name: 'Condicional simple' },
      subjImpf: { mood: 'subjunctive', name: 'Pretérito imperfecto del subjuntivo' }
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Determinar tipo de verbo
      let verbType = null
      if (lemma.endsWith('ar')) verbType = 'ar'
      else if (lemma.endsWith('er')) verbType = 'er'
      else if (lemma.endsWith('ir')) verbType = 'ir'
      
      if (!verbType) {
        console.log(`⚠️  Tipo de verbo no reconocido: ${lemma}`)
        continue
      }
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({ region: 'es', forms: [] })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // Generar cada tiempo
      Object.entries(tenseInfo).forEach(([tense, tenseData]) => {
        
        // Verificar si ya tiene formas completas para este tiempo
        const existingForms = mainParadigm.forms.filter(f => f.tense === tense)
        if (existingForms.length >= 7) return // Ya completo
        
        let generated = false
        
        if (tense === 'subjImpf') {
          // Subjuntivo imperfecto se basa en la 3ª persona plural del pretérito
          const preteritoForms = mainParadigm.forms.filter(f => f.tense === 'pretIndef')
          const thirdPlural = preteritoForms.find(f => f.person === '3p')
          
          if (thirdPlural && thirdPlural.form) {
            let stem = thirdPlural.form
            
            // Remover terminación del pretérito 3p
            if (stem.endsWith('aron')) {
              stem = stem.slice(0, -4) // hablar -> hablaron -> habl-
            } else if (stem.endsWith('ieron')) {
              stem = stem.slice(0, -5) // comer -> comieron -> com-
            } else if (stem.endsWith('eron')) {
              stem = stem.slice(0, -4) // traer -> trajeron -> traj-
            } else {
              // No se puede determinar la raíz, saltar este verbo
              return
            }
            
            // Terminaciones del subjuntivo imperfecto
            const subjImpfEndings = {
              '1s': 'ara', '2s_tu': 'aras', '2s_vos': 'aras', '3s': 'ara',
              '1p': 'áramos', '2p_vosotros': 'arais', '3p': 'aran'
            }
            
            Object.entries(subjImpfEndings).forEach(([person, ending]) => {
              const existingForm = mainParadigm.forms.find(f => 
                f.tense === tense && f.person === person
              )
              
              if (!existingForm) {
                mainParadigm.forms.push({
                  tense: tense,
                  mood: tenseData.mood,
                  person: person,
                  form: stem + ending,
                  tags: [],
                  region: 'es'
                })
                formsAdded++
                generated = true
              }
            })
          }
        } else {
          // Tiempos regulares (impf, fut, cond)
          let stem = ''
          let endings = {}
          
          if (tense === 'impf') {
            // Verificar si es irregular
            if (irregularStems[tense] && irregularStems[tense][lemma]) {
              const irregularForms = irregularStems[tense][lemma]
              Object.entries(irregularForms).forEach(([person, form]) => {
                const existingForm = mainParadigm.forms.find(f => 
                  f.tense === tense && f.person === person
                )
                
                if (!existingForm) {
                  mainParadigm.forms.push({
                    tense: tense,
                    mood: tenseData.mood,
                    person: person,
                    form: form,
                    tags: [],
                    region: 'es'
                  })
                  formsAdded++
                  generated = true
                }
              })
            } else {
              // Imperfecto regular
              stem = lemma.slice(0, -2) // Quitar -ar/-er/-ir
              endings = conjugationPatterns[tense][verbType]
            }
          } else if (tense === 'fut' || tense === 'cond') {
            // Futuro y condicional
            if (irregularStems[tense] && irregularStems[tense][lemma]) {
              stem = irregularStems[tense][lemma]
            } else {
              stem = lemma // Usar infinitivo completo
            }
            endings = conjugationPatterns[tense][verbType]
          }
          
          if (endings) {
            Object.entries(endings).forEach(([person, ending]) => {
              const existingForm = mainParadigm.forms.find(f => 
                f.tense === tense && f.person === person
              )
              
              if (!existingForm) {
                mainParadigm.forms.push({
                  tense: tense,
                  mood: tenseData.mood,
                  person: person,
                  form: stem + ending,
                  tags: [],
                  region: 'es'
                })
                formsAdded++
                generated = true
              }
            })
          }
        }
        
        if (generated) {
          verbUpdated = true
        }
      })
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN DE TIEMPOS SIMPLES COMPLETADA')
    console.log('===========================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const tenseStats = {}
    Object.keys(tenseInfo).forEach(tense => {
      tenseStats[tense] = { total: 0, complete: 0, forms: 0 }
    })
    
    verbs.forEach(verb => {
      Object.keys(tenseInfo).forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        tenseStats[tense].total++
        tenseStats[tense].forms += forms.length
        if (forms.length >= 7) { // 7 personas
          tenseStats[tense].complete++
        }
      })
    })
    
    Object.entries(tenseStats).forEach(([tense, stats]) => {
      const coverage = ((stats.complete / stats.total) * 100).toFixed(1)
      const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
      console.log(`${emoji} ${tense}: ${coverage}% (${stats.complete}/${stats.total} verbos completos, ${stats.forms} formas totales)`)
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con tiempos simples generados automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.simple.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con tiempos simples')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('2. Revisar verbos irregulares y ajustar manualmente')
    console.log('3. Completar imperativo y formas no finitas faltantes')
    console.log('4. Ejecutar tests de validación')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateSimpleTenses()