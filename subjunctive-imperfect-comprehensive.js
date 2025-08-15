#!/usr/bin/env node

// Generador comprehensivo de subjuntivo imperfecto
// Completa TODOS los verbos restantes usando análisis morfológico avanzado

console.log('🔧 GENERADOR COMPREHENSIVO DE SUBJUNTIVO IMPERFECTO')
console.log('==================================================\n')

async function generateComprehensiveSubjImpf() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para subjuntivo imperfecto comprehensivo...\n`)
    
    const subjImpfPersons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Terminaciones regulares
    const endings = {
      '1s': 'ra', '2s_tu': 'ras', '2s_vos': 'ras', '3s': 'ra',
      '1p': 'ramos', '2p_vosotros': 'rais', '3p': 'ran'
    }
    
    // Mapeo completo de stems irregulares basado en pretérito 3p
    const stemMappings = {
      // Verbos -AR regulares: stem + 'aron' → stem + 'ara'
      'ar_regular': (lemma) => lemma.slice(0, -2),
      
      // Verbos -ER/-IR regulares: stem + 'ieron' → stem + 'iera' 
      'er_ir_regular': (lemma) => lemma.slice(0, -2),
      
      // Verbos con cambios ortográficos
      'car_qu': (lemma) => lemma.slice(0, -3) + 'qu', // sacar → sacaron → sacara (pero saqué)
      'gar_gu': (lemma) => lemma.slice(0, -3) + 'gu', // llegar → llegaron → llegara  
      'zar_c': (lemma) => lemma.slice(0, -3) + 'c',   // organizar → organizaron → organizara
      
      // Verbos con cambios vocálicos en presente pero regulares en pretérito
      'e_ie': (lemma) => lemma.slice(0, -2), // cerrar → cerraron → cerrara
      'o_ue': (lemma) => lemma.slice(0, -2), // contar → contaron → contara
      'u_ue': (lemma) => lemma.slice(0, -2), // jugar → jugaron → jugara
      
      // Verbos -IR con cambio vocálico en pretérito
      'e_i': (lemma) => {
        // servir → sirvieron → sirviera
        const stem = lemma.slice(0, -2)
        if (stem.includes('e')) {
          return stem.replace(/e([^e]*)$/, 'i$1')
        }
        return stem
      },
      
      'o_u': (lemma) => {
        // morir → murieron → muriera
        const stem = lemma.slice(0, -2)
        if (stem.includes('o')) {
          return stem.replace(/o([^o]*)$/, 'u$1')
        }
        return stem
      },
      
      // Verbos con -j- en pretérito (decir, traer, etc)
      'j_verbs': {
        'decir': 'dij',
        'traer': 'traj',
        'conducir': 'conduj',
        'producir': 'produj',
        'reducir': 'reduj',
        'traducir': 'traduj'
      },
      
      // Verbos -UIR (construir, huir, etc)
      'uir_verbs': (lemma) => {
        const stem = lemma.slice(0, -2)
        return stem + 'y' // construir → construyeron → construyera
      }
    }
    
    function getStemForSubjImpf(lemma) {
      // Casos especiales primero
      if (stemMappings.j_verbs[lemma]) {
        return stemMappings.j_verbs[lemma]
      }
      
      // Verbos -UIR
      if (lemma.endsWith('uir')) {
        return stemMappings.uir_verbs(lemma)
      }
      
      // Cambios ortográficos
      if (lemma.endsWith('car')) {
        return lemma.slice(0, -2) // sacar → sac (sacaron → sacara)
      }
      if (lemma.endsWith('gar')) {
        return lemma.slice(0, -2) // llegar → lleg (llegaron → llegara)
      }
      if (lemma.endsWith('zar')) {
        return lemma.slice(0, -2) // organizar → organiz (organizaron → organizara)
      }
      
      // Verbos -IR con cambio vocálico
      if (lemma.endsWith('ir')) {
        // Detectar patrones comunes
        if (lemma.includes('erv') || lemma.includes('ed') || lemma.includes('et')) {
          // servir → sirv, pedir → pid, repetir → repit
          const stem = lemma.slice(0, -2)
          return stem.replace(/e([^e]*)$/, 'i$1')
        }
        if (lemma.includes('or') && lemma !== 'morir') {
          // dormir → durm (pero morir es especial)
          const stem = lemma.slice(0, -2)
          return stem.replace(/o([^o]*)$/, 'u$1')
        }
        if (lemma === 'morir') {
          return 'mur'
        }
      }
      
      // Verbos regulares
      return lemma.slice(0, -2)
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) continue
      
      // Verificar si ya tiene subjuntivo imperfecto completo
      const existingSubjImpf = mainParadigm.forms.filter(f => f.tense === 'subjImpf')
      if (existingSubjImpf.length >= 7) continue
      
      // Obtener stem para subjuntivo imperfecto
      const stem = getStemForSubjImpf(lemma)
      
      subjImpfPersons.forEach(person => {
        const existingForm = mainParadigm.forms.find(f => 
          f.tense === 'subjImpf' && f.person === person
        )
        
        if (!existingForm) {
          let subjForm = stem + endings[person]
          
          // Aplicar acentuación en primera persona plural
          if (person === '1p') {
            if (subjForm.endsWith('ramos') && !subjForm.includes('á') && !subjForm.includes('é')) {
              // Buscar última vocal antes de 'ramos'
              const beforeRamos = subjForm.slice(0, -5)
              const lastVowelIndex = beforeRamos.search(/[aeiou][^aeiou]*$/)
              
              if (lastVowelIndex !== -1) {
                const vowel = beforeRamos[lastVowelIndex]
                let accented = vowel
                if (vowel === 'a') accented = 'á'
                else if (vowel === 'e') accented = 'é'
                else if (vowel === 'i') accented = 'í'
                else if (vowel === 'o') accented = 'ó'
                else if (vowel === 'u') accented = 'ú'
                
                subjForm = beforeRamos.slice(0, lastVowelIndex) + accented + 
                          beforeRamos.slice(lastVowelIndex + 1) + 'ramos'
              }
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
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN COMPREHENSIVA DE SUBJUNTIVO IMPERFECTO COMPLETADA')
    console.log('===============================================================')
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
    
    // Analizar verbos aún incompletos
    const stillIncomplete = []
    verbs.forEach(verb => {
      const subjImpfForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjImpf')
      
      if (subjImpfForms.length < 7) {
        stillIncomplete.push({
          lemma: verb.lemma,
          forms: subjImpfForms.length,
          family: verb.family || 'UNKNOWN'
        })
      }
    })
    
    if (stillIncomplete.length > 0) {
      console.log(`\n⚠️  ${stillIncomplete.length} verbos aún incompletos:`)
      stillIncomplete.slice(0, 10).forEach(verb => {
        console.log(`   • ${verb.lemma} (${verb.family}): ${verb.forms}/7 formas`)
      })
      
      // Agrupar por familia
      const familyCounts = {}
      stillIncomplete.forEach(verb => {
        familyCounts[verb.family] = (familyCounts[verb.family] || 0) + 1
      })
      
      console.log('\n📊 Familias con verbos incompletos:')
      Object.entries(familyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([family, count]) => {
          console.log(`   • ${family}: ${count} verbos`)
        })
    } else {
      console.log('\n✅ Todos los verbos tienen subjuntivo imperfecto completo!')
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo imperfecto comprehensivo
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjimpf-comprehensive.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo imperfecto comprehensivo')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('2. Optimizar imperativos afirmativo y negativo')
    console.log('3. Completar formas no finitas restantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateComprehensiveSubjImpf()