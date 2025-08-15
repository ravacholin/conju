#!/usr/bin/env node

// Optimizador final de formas no finitas
// Completa TODAS las formas no finitas faltantes

console.log('🔧 OPTIMIZADOR FINAL DE FORMAS NO FINITAS')
console.log('=========================================\n')

async function optimizeNonfinites() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para formas no finitas...\n`)
    
    // Formas no finitas completamente irregulares
    const irregularNonfinites = {
      // Participios irregulares
      'hacer': { part: 'hecho' },
      'ver': { part: 'visto' },
      'escribir': { part: 'escrito' },
      'poner': { part: 'puesto' },
      'volver': { part: 'vuelto' },
      'morir': { part: 'muerto' },
      'abrir': { part: 'abierto' },
      'cubrir': { part: 'cubierto' },
      'descubrir': { part: 'descubierto' },
      'romper': { part: 'roto' },
      'decir': { part: 'dicho' },
      'satisfacer': { part: 'satisfecho' },
      'freír': { part: 'frito' },
      'imprimir': { part: 'impreso' },
      'proveer': { part: 'proveído' },
      'componer': { part: 'compuesto' },
      'proponer': { part: 'propuesto' },
      'disponer': { part: 'dispuesto' },
      'exponer': { part: 'expuesto' },
      'suponer': { part: 'supuesto' },
      'imponer': { part: 'impuesto' },
      'rehacer': { part: 'rehecho' },
      'deshacer': { part: 'deshecho' },
      'devolver': { part: 'devuelto' },
      'resolver': { part: 'resuelto' },
      'revolver': { part: 'revuelto' },
      'envolver': { part: 'envuelto' },
      'desenvolver': { part: 'desenvuelto' },
      
      // Gerundios irregulares
      'ir': { ger: 'yendo' },
      'poder': { ger: 'pudiendo' },
      'venir': { ger: 'viniendo' },
      'decir': { ger: 'diciendo' },
      'traer': { ger: 'trayendo' },
      'caer': { ger: 'cayendo' },
      'leer': { ger: 'leyendo' },
      'creer': { ger: 'creyendo' },
      'oír': { ger: 'oyendo' },
      'huir': { ger: 'huyendo' },
      'construir': { ger: 'construyendo' },
      'destruir': { ger: 'destruyendo' },
      'incluir': { ger: 'incluyendo' },
      'concluir': { ger: 'concluyendo' },
      'excluir': { ger: 'excluyendo' },
      'contribuir': { ger: 'contribuyendo' },
      'distribuir': { ger: 'distribuyendo' },
      'sustituir': { ger: 'sustituyendo' },
      'atribuir': { ger: 'atribuyendo' },
      'seguir': { ger: 'siguiendo' },
      'conseguir': { ger: 'consiguiendo' },
      'perseguir': { ger: 'persiguiendo' },
      'pedir': { ger: 'pidiendo' },
      'servir': { ger: 'sirviendo' },
      'repetir': { ger: 'repitiendo' },
      'sentir': { ger: 'sintiendo' },
      'mentir': { ger: 'mintiendo' },
      'preferir': { ger: 'prefiriendo' },
      'medir': { ger: 'midiendo' },
      'vestir': { ger: 'vistiendo' },
      'dormir': { ger: 'durmiendo' },
      'morir': { ger: 'muriendo' },
      'reñir': { ger: 'riñendo' },
      'teñir': { ger: 'tiñendo' },
      'ceñir': { ger: 'ciñendo' }
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
      
      // Completar infinitivo
      const existingInf = mainParadigm.forms.find(f => f.tense === 'inf')
      if (!existingInf) {
        mainParadigm.forms.push({
          tense: 'inf',
          mood: 'nonfinite',
          person: 'inf',
          form: lemma,
          tags: [],
          region: 'es'
        })
        formsAdded++
        verbUpdated = true
      }
      
      // Completar participio
      const existingPart = mainParadigm.forms.find(f => f.tense === 'part')
      if (!existingPart) {
        let participio = ''
        
        // Verificar si es irregular
        if (irregularNonfinites[lemma] && irregularNonfinites[lemma].part) {
          participio = irregularNonfinites[lemma].part
        } else {
          // Generar regular
          if (lemma.endsWith('ar')) {
            participio = lemma.slice(0, -2) + 'ado'
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            participio = lemma.slice(0, -2) + 'ido'
          }
        }
        
        if (participio) {
          mainParadigm.forms.push({
            tense: 'part',
            mood: 'nonfinite',
            person: 'part',
            form: participio,
            tags: [],
            region: 'es'
          })
          formsAdded++
          verbUpdated = true
        }
      }
      
      // Completar gerundio
      const existingGer = mainParadigm.forms.find(f => f.tense === 'ger')
      if (!existingGer) {
        let gerundio = ''
        
        // Verificar si es irregular
        if (irregularNonfinites[lemma] && irregularNonfinites[lemma].ger) {
          gerundio = irregularNonfinites[lemma].ger
        } else {
          // Generar regular
          if (lemma.endsWith('ar')) {
            gerundio = lemma.slice(0, -2) + 'ando'
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            gerundio = lemma.slice(0, -2) + 'iendo'
          }
        }
        
        if (gerundio) {
          mainParadigm.forms.push({
            tense: 'ger',
            mood: 'nonfinite',
            person: 'ger',
            form: gerundio,
            tags: [],
            region: 'es'
          })
          formsAdded++
          verbUpdated = true
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ OPTIMIZACIÓN FINAL DE FORMAS NO FINITAS COMPLETADA')
    console.log('=====================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const nonfiniteStats = {
      inf: { total: 0, complete: 0 },
      ger: { total: 0, complete: 0 },
      part: { total: 0, complete: 0 }
    }
    
    verbs.forEach(verb => {
      ['inf', 'ger', 'part'].forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        nonfiniteStats[tense].total++
        if (forms.length >= 1) {
          nonfiniteStats[tense].complete++
        }
      })
    })
    
    Object.entries(nonfiniteStats).forEach(([tense, stats]) => {
      const coverage = ((stats.complete / stats.total) * 100).toFixed(1)
      const emoji = coverage >= 95 ? '✅' : coverage >= 85 ? '🔶' : '⚠️'
      console.log(`${emoji} ${tense}: ${coverage}% (${stats.complete}/${stats.total} verbos completos)`)
    })
    
    // Identificar verbos sin formas no finitas
    console.log('\n⚠️  VERBOS AÚN SIN FORMAS NO FINITAS')
    console.log('==================================')
    
    const stillMissing = { inf: [], ger: [], part: [] }
    
    verbs.forEach(verb => {
      ['inf', 'ger', 'part'].forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        if (forms.length === 0) {
          stillMissing[tense].push(verb.lemma)
        }
      })
    })
    
    Object.entries(stillMissing).forEach(([tense, verbsList]) => {
      if (verbsList.length > 0) {
        console.log(`❌ ${tense}: ${verbsList.length} verbos (${verbsList.slice(0, 5).join(', ')}${verbsList.length > 5 ? '...' : ''})`)
      } else {
        console.log(`✅ ${tense}: Todos los verbos completos`)
      }
    })
    
    // Estadísticas de verbos completamente terminados
    console.log('\n📊 VERBOS COMPLETAMENTE TERMINADOS (FORMAS NO FINITAS)')
    console.log('====================================================')
    
    const fullyCompleteNonfinite = []
    verbs.forEach(verb => {
      const infForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'inf')
      const gerForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'ger')
      const partForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'part')
      
      if (infForms.length >= 1 && gerForms.length >= 1 && partForms.length >= 1) {
        fullyCompleteNonfinite.push(verb.lemma)
      }
    })
    
    console.log(`✅ ${fullyCompleteNonfinite.length}/${verbs.length} verbos tienen todas las formas no finitas`)
    console.log(`   Porcentaje: ${((fullyCompleteNonfinite.length / verbs.length) * 100).toFixed(1)}%`)
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con formas no finitas optimizadas finalmente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.nonfinite-final.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con formas no finitas optimizadas')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para auditoría final')
    console.log('2. Commit y push de todas las optimizaciones')
    console.log('3. Verificar que la aplicación funciona correctamente')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

optimizeNonfinites()