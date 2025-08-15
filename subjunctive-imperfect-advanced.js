#!/usr/bin/env node

// Generador avanzado de subjuntivo imperfecto
// Completa formas usando pretérito indefinido tercera persona plural + terminaciones

console.log('🔧 GENERADOR AVANZADO DE SUBJUNTIVO IMPERFECTO')
console.log('===============================================\n')

async function generateSubjunctiveImperfect() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para subjuntivo imperfecto...\n`)
    
    const subjImpfPersons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Terminaciones de subjuntivo imperfecto (-ra y -se)
    const subjImpfEndings = {
      '-ra': {
        '1s': 'ra',
        '2s_tu': 'ras', 
        '2s_vos': 'ras',
        '3s': 'ra',
        '1p': 'ramos',
        '2p_vosotros': 'rais',
        '3p': 'ran'
      }
    }
    
    // Subjuntivos imperfectos completamente irregulares
    const irregularSubjImpf = {
      'ser': {
        '1s': 'fuera', '2s_tu': 'fueras', '2s_vos': 'fueras', '3s': 'fuera',
        '1p': 'fuéramos', '2p_vosotros': 'fuerais', '3p': 'fueran'
      },
      'ir': {
        '1s': 'fuera', '2s_tu': 'fueras', '2s_vos': 'fueras', '3s': 'fuera',
        '1p': 'fuéramos', '2p_vosotros': 'fuerais', '3p': 'fueran'
      },
      'estar': {
        '1s': 'estuviera', '2s_tu': 'estuvieras', '2s_vos': 'estuvieras', '3s': 'estuviera',
        '1p': 'estuviéramos', '2p_vosotros': 'estuvierais', '3p': 'estuvieran'
      },
      'dar': {
        '1s': 'diera', '2s_tu': 'dieras', '2s_vos': 'dieras', '3s': 'diera',
        '1p': 'diéramos', '2p_vosotros': 'dierais', '3p': 'dieran'
      },
      'haber': {
        '1s': 'hubiera', '2s_tu': 'hubieras', '2s_vos': 'hubieras', '3s': 'hubiera',
        '1p': 'hubiéramos', '2p_vosotros': 'hubierais', '3p': 'hubieran'
      },
      'hacer': {
        '1s': 'hiciera', '2s_tu': 'hicieras', '2s_vos': 'hicieras', '3s': 'hiciera',
        '1p': 'hiciéramos', '2p_vosotros': 'hicierais', '3p': 'hicieran'
      },
      'saber': {
        '1s': 'supiera', '2s_tu': 'supieras', '2s_vos': 'supieras', '3s': 'supiera',
        '1p': 'supiéramos', '2p_vosotros': 'supierais', '3p': 'supieran'
      },
      'poder': {
        '1s': 'pudiera', '2s_tu': 'pudieras', '2s_vos': 'pudieras', '3s': 'pudiera',
        '1p': 'pudiéramos', '2p_vosotros': 'pudierais', '3p': 'pudieran'
      },
      'poner': {
        '1s': 'pusiera', '2s_tu': 'pusieras', '2s_vos': 'pusieras', '3s': 'pusiera',
        '1p': 'pusiéramos', '2p_vosotros': 'pusierais', '3p': 'pusieran'
      },
      'querer': {
        '1s': 'quisiera', '2s_tu': 'quisieras', '2s_vos': 'quisieras', '3s': 'quisiera',
        '1p': 'quisiéramos', '2p_vosotros': 'quisierais', '3p': 'quisieran'
      },
      'venir': {
        '1s': 'viniera', '2s_tu': 'vinieras', '2s_vos': 'vinieras', '3s': 'viniera',
        '1p': 'viniéramos', '2p_vosotros': 'vinierais', '3p': 'vinieran'
      },
      'tener': {
        '1s': 'tuviera', '2s_tu': 'tuvieras', '2s_vos': 'tuvieras', '3s': 'tuviera',
        '1p': 'tuviéramos', '2p_vosotros': 'tuvierais', '3p': 'tuvieran'
      },
      'decir': {
        '1s': 'dijera', '2s_tu': 'dijeras', '2s_vos': 'dijeras', '3s': 'dijera',
        '1p': 'dijéramos', '2p_vosotros': 'dijerais', '3p': 'dijeran'
      },
      'traer': {
        '1s': 'trajera', '2s_tu': 'trajeras', '2s_vos': 'trajeras', '3s': 'trajera',
        '1p': 'trajéramos', '2p_vosotros': 'trajerais', '3p': 'trajeran'
      },
      'conducir': {
        '1s': 'condujera', '2s_tu': 'condujeras', '2s_vos': 'condujeras', '3s': 'condujera',
        '1p': 'condujéramos', '2p_vosotros': 'condujerais', '3p': 'condujeran'
      },
      'caer': {
        '1s': 'cayera', '2s_tu': 'cayeras', '2s_vos': 'cayeras', '3s': 'cayera',
        '1p': 'cayéramos', '2p_vosotros': 'cayerais', '3p': 'cayeran'
      },
      'leer': {
        '1s': 'leyera', '2s_tu': 'leyeras', '2s_vos': 'leyeras', '3s': 'leyera',
        '1p': 'leyéramos', '2p_vosotros': 'leyerais', '3p': 'leyeran'
      },
      'creer': {
        '1s': 'creyera', '2s_tu': 'creyeras', '2s_vos': 'creyeras', '3s': 'creyera',
        '1p': 'creyéramos', '2p_vosotros': 'creyerais', '3p': 'creyeran'
      },
      'oír': {
        '1s': 'oyera', '2s_tu': 'oyeras', '2s_vos': 'oyeras', '3s': 'oyera',
        '1p': 'oyéramos', '2p_vosotros': 'oyerais', '3p': 'oyeran'
      },
      'ver': {
        '1s': 'viera', '2s_tu': 'vieras', '2s_vos': 'vieras', '3s': 'viera',
        '1p': 'viéramos', '2p_vosotros': 'vierais', '3p': 'vieran'
      },
      'andar': {
        '1s': 'anduviera', '2s_tu': 'anduvieras', '2s_vos': 'anduvieras', '3s': 'anduviera',
        '1p': 'anduviéramos', '2p_vosotros': 'anduvierais', '3p': 'anduvieran'
      },
      'caber': {
        '1s': 'cupiera', '2s_tu': 'cupieras', '2s_vos': 'cupieras', '3s': 'cupiera',
        '1p': 'cupiéramos', '2p_vosotros': 'cupierais', '3p': 'cupieran'
      },
      'producir': {
        '1s': 'produjera', '2s_tu': 'produjeras', '2s_vos': 'produjeras', '3s': 'produjera',
        '1p': 'produjéramos', '2p_vosotros': 'produjerais', '3p': 'produjeran'
      },
      'construir': {
        '1s': 'construyera', '2s_tu': 'construyeras', '2s_vos': 'construyeras', '3s': 'construyera',
        '1p': 'construyéramos', '2p_vosotros': 'construyerais', '3p': 'construyeran'
      },
      'huir': {
        '1s': 'huyera', '2s_tu': 'huyeras', '2s_vos': 'huyeras', '3s': 'huyera',
        '1p': 'huyéramos', '2p_vosotros': 'huyerais', '3p': 'huyeran'
      },
      'destruir': {
        '1s': 'destruyera', '2s_tu': 'destruyeras', '2s_vos': 'destruyeras', '3s': 'destruyera',
        '1p': 'destruyéramos', '2p_vosotros': 'destruyerais', '3p': 'destruyeran'
      },
      'incluir': {
        '1s': 'incluyera', '2s_tu': 'incluyeras', '2s_vos': 'incluyeras', '3s': 'incluyera',
        '1p': 'incluyéramos', '2p_vosotros': 'incluyerais', '3p': 'incluyeran'
      },
      'concluir': {
        '1s': 'concluyera', '2s_tu': 'concluyeras', '2s_vos': 'concluyeras', '3s': 'concluyera',
        '1p': 'concluyéramos', '2p_vosotros': 'concluyerais', '3p': 'concluyeran'
      },
      'contribuir': {
        '1s': 'contribuyera', '2s_tu': 'contribuyeras', '2s_vos': 'contribuyeras', '3s': 'contribuyera',
        '1p': 'contribuyéramos', '2p_vosotros': 'contribuyerais', '3p': 'contribuyeran'
      },
      'distribuir': {
        '1s': 'distribuyera', '2s_tu': 'distribuyeras', '2s_vos': 'distribuyeras', '3s': 'distribuyera',
        '1p': 'distribuyéramos', '2p_vosotros': 'distribuyerais', '3p': 'distribuyeran'
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
      
      // Verificar subjuntivo imperfecto existente
      const existingSubjImpf = mainParadigm.forms.filter(f => f.tense === 'subjImpf')
      
      // Si ya está completo, saltar
      if (existingSubjImpf.length >= 7) continue
      
      // Verificar si es completamente irregular
      if (irregularSubjImpf[lemma]) {
        const irregularForms = irregularSubjImpf[lemma]
        
        subjImpfPersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'subjImpf' && f.person === person
          )
          
          if (!existingForm && irregularForms[person]) {
            mainParadigm.forms.push({
              tense: 'subjImpf',
              mood: 'subjunctive',
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
        // Generar regular usando pretérito indefinido
        const preteriteForms = mainParadigm.forms.filter(f => f.tense === 'pretIndef')
        const thirdPlural = preteriteForms.find(f => f.person === '3p')
        
        if (thirdPlural && thirdPlural.form) {
          let stem = ''
          
          // Obtener raíz del pretérito 3p
          if (thirdPlural.form.endsWith('aron')) {
            stem = thirdPlural.form.slice(0, -4)
          } else if (thirdPlural.form.endsWith('ieron')) {
            stem = thirdPlural.form.slice(0, -5)
          } else if (thirdPlural.form.endsWith('eron')) {
            stem = thirdPlural.form.slice(0, -4)
          }
          
          if (stem) {
            subjImpfPersons.forEach(person => {
              const existingForm = mainParadigm.forms.find(f => 
                f.tense === 'subjImpf' && f.person === person
              )
              
              if (!existingForm) {
                const ending = subjImpfEndings['-ra'][person]
                let subjForm = stem + ending
                
                // Aplicar acentuación en primera persona plural
                if (person === '1p' && !subjForm.includes('é') && !subjForm.includes('á')) {
                  // Buscar vocal antes de 'ramos' para acentuar
                  if (subjForm.endsWith('aramos')) {
                    subjForm = subjForm.replace('aramos', 'áramos')
                  } else if (subjForm.endsWith('eramos')) {
                    subjForm = subjForm.replace('eramos', 'éramos')  
                  } else if (subjForm.endsWith('iramos')) {
                    subjForm = subjForm.replace('iramos', 'éramos')
                  }
                }
                
                mainParadigm.forms.push({
                  tense: 'subjImpf',
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
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN AVANZADA DE SUBJUNTIVO IMPERFECTO COMPLETADA')
    console.log('==========================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const subjImpfStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      const subjImpfForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjImpf')
      subjImpfStats.total++
      subjImpfStats.forms += subjImpfForms.length
      if (subjImpfForms.length >= 7) {
        subjImpfStats.complete++
      }
    })
    
    const coverage = ((subjImpfStats.complete / subjImpfStats.total) * 100).toFixed(1)
    const emoji = coverage >= 85 ? '✅' : coverage >= 65 ? '🔶' : coverage >= 45 ? '⚠️' : '❌'
    
    console.log(`${emoji} subjImpf: ${coverage}% (${subjImpfStats.complete}/${subjImpfStats.total} verbos completos, ${subjImpfStats.forms} formas totales)`)
    
    // Verbos aún sin subjuntivo imperfecto
    const stillMissing = []
    verbs.forEach(verb => {
      const subjImpfForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjImpf')
      
      if (subjImpfForms.length === 0) {
        const preteriteForms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === 'pretIndef')
        stillMissing.push({
          lemma: verb.lemma,
          pretForms: preteriteForms.length
        })
      }
    })
    
    if (stillMissing.length > 0) {
      console.log(`\n❌ ${stillMissing.length} verbos aún sin subjuntivo imperfecto:`)
      stillMissing.slice(0, 15).forEach(verb => {
        console.log(`   • ${verb.lemma}: pretIndef=${verb.pretForms}/7`)
      })
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo imperfecto avanzado
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjimpf-advanced.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo imperfecto avanzado')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora')
    console.log('2. Optimizar imperativo afirmativo y negativo')
    console.log('3. Completar formas no finitas restantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateSubjunctiveImperfect()