#!/usr/bin/env node

// Completador total de formas no finitas
// Completa TODOS los infinitivos, gerundios y participios faltantes

console.log('🔧 COMPLETADOR TOTAL DE FORMAS NO FINITAS')
console.log('==========================================\n')

async function completeAllNonfinites() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para formas no finitas completas...\n`)
    
    // Participios irregulares completamente actualizados
    const irregularParticiples = {
      'hacer': 'hecho', 'ver': 'visto', 'escribir': 'escrito', 'poner': 'puesto',
      'volver': 'vuelto', 'morir': 'muerto', 'abrir': 'abierto', 'cubrir': 'cubierto',
      'descubrir': 'descubierto', 'romper': 'roto', 'decir': 'dicho', 'satisfacer': 'satisfecho',
      'freír': 'frito', 'imprimir': 'impreso', 'proveer': 'proveído', 'componer': 'compuesto',
      'proponer': 'propuesto', 'disponer': 'dispuesto', 'exponer': 'expuesto', 'suponer': 'supuesto',
      'imponer': 'impuesto', 'rehacer': 'rehecho', 'deshacer': 'deshecho', 'devolver': 'devuelto',
      'resolver': 'resuelto', 'revolver': 'revuelto', 'envolver': 'envuelto', 'desenvolver': 'desenvuelto',
      'contradecir': 'contradicho', 'predecir': 'predicho', 'bendecir': 'bendecido', 'maldecir': 'maldecido',
      'sostener': 'sostenido', 'mantener': 'mantenido', 'contener': 'contenido', 'obtener': 'obtenido',
      'detener': 'detenido', 'retener': 'retenido', 'entretener': 'entretenido'
    }
    
    // Gerundios irregulares completamente actualizados
    const irregularGerunds = {
      'ir': 'yendo', 'poder': 'pudiendo', 'venir': 'viniendo', 'decir': 'diciendo',
      'traer': 'trayendo', 'caer': 'cayendo', 'leer': 'leyendo', 'creer': 'creyendo',
      'oír': 'oyendo', 'huir': 'huyendo', 'construir': 'construyendo', 'destruir': 'destruyendo',
      'incluir': 'incluyendo', 'concluir': 'concluyendo', 'excluir': 'excluyendo',
      'contribuir': 'contribuyendo', 'distribuir': 'distribuyendo', 'sustituir': 'sustituyendo',
      'atribuir': 'atribuyendo', 'instruir': 'instruyendo', 'seguir': 'siguiendo',
      'conseguir': 'consiguiendo', 'perseguir': 'persiguiendo', 'pedir': 'pidiendo',
      'servir': 'sirviendo', 'repetir': 'repitiendo', 'sentir': 'sintiendo',
      'mentir': 'mintiendo', 'preferir': 'prefiriendo', 'medir': 'midiendo',
      'vestir': 'vistiendo', 'dormir': 'durmiendo', 'morir': 'muriendo',
      'reñir': 'riñendo', 'teñir': 'tiñendo', 'ceñir': 'ciñendo', 'gemir': 'gimiendo',
      'regir': 'rigiendo', 'elegir': 'eligiendo', 'corregir': 'corrigiendo',
      'competir': 'compitiendo', 'impedir': 'impidiendo', 'despedir': 'despidiendo',
      'dirigir': 'dirigiendo', 'exigir': 'exigiendo', 'fingir': 'fingiendo',
      'restringir': 'restringiendo', 'distinguir': 'distinguiendo', 'extinguir': 'extinguiendo'
    }
    
    let verbsUpdated = 0
    let infAdded = 0
    let gerAdded = 0 
    let partAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({ region: 'es', forms: [] })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // 1. COMPLETAR INFINITIVO
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
        infAdded++
        verbUpdated = true
      }
      
      // 2. COMPLETAR PARTICIPIO
      const existingPart = mainParadigm.forms.find(f => f.tense === 'part')
      if (!existingPart) {
        let participio = ''
        
        // Verificar si es irregular
        if (irregularParticiples[lemma]) {
          participio = irregularParticiples[lemma]
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
          partAdded++
          verbUpdated = true
        }
      }
      
      // 3. COMPLETAR GERUNDIO
      const existingGer = mainParadigm.forms.find(f => f.tense === 'ger')
      if (!existingGer) {
        let gerundio = ''
        
        // Verificar si es irregular
        if (irregularGerunds[lemma]) {
          gerundio = irregularGerunds[lemma]
        } else {
          // Generar regular
          if (lemma.endsWith('ar')) {
            gerundio = lemma.slice(0, -2) + 'ando'
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            gerundio = lemma.slice(0, -2) + 'iendo'
          }
          
          // Aplicar cambios ortográficos para gerundios -iendo
          if (gerundio.endsWith('iendo')) {
            // Cambios vocálicos en raíz
            const stem = gerundio.slice(0, -5)
            
            // Verbos -UIR: construir → construyendo
            if (lemma.endsWith('uir')) {
              gerundio = stem + 'yendo'
            }
            // Doble vocal: leer → leyendo, caer → cayendo
            else if (stem.endsWith('e') || stem.endsWith('a') || stem.endsWith('o')) {
              const lastChar = stem.slice(-1)
              if (lastChar === 'e' || lastChar === 'a' || lastChar === 'o') {
                gerundio = stem.slice(0, -1) + lastChar + 'yendo'
              }
            }
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
          gerAdded++
          verbUpdated = true
        }
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ COMPLETADO TOTAL DE FORMAS NO FINITAS FINALIZADO')
    console.log('===================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Infinitivos agregados: ${infAdded}`)
    console.log(`📈 Gerundios agregados: ${gerAdded}`)
    console.log(`📈 Participios agregados: ${partAdded}`)
    console.log(`📈 Total formas no finitas agregadas: ${infAdded + gerAdded + partAdded}`)
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
    
    // Verificar verbos completamente terminados en formas no finitas
    const fullyComplete = []
    verbs.forEach(verb => {
      const infForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'inf')
      const gerForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'ger')  
      const partForms = verb.paradigms.flatMap(p => p.forms).filter(f => f.tense === 'part')
      
      if (infForms.length >= 1 && gerForms.length >= 1 && partForms.length >= 1) {
        fullyComplete.push(verb.lemma)
      }
    })
    
    console.log(`\n✅ ${fullyComplete.length}/${verbs.length} verbos tienen todas las formas no finitas completas`)
    console.log(`   Porcentaje total: ${((fullyComplete.length / verbs.length) * 100).toFixed(1)}%`)
    
    // Identificar verbos aún incompletos
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
        console.log(`\n❌ ${tense}: ${verbsList.length} verbos sin forma`)
        if (verbsList.length <= 10) {
          console.log(`   • ${verbsList.join(', ')}`)
        } else {
          console.log(`   • ${verbsList.slice(0, 8).join(', ')}... (+${verbsList.length - 8} más)`)
        }
      }
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con todas las formas no finitas completadas
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.nonfinite-complete.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con todas las formas no finitas')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para auditoría completa')
    console.log('2. Crear commit con todas las mejoras masivas')
    console.log('3. Continuar con subjuntivo presente para mejorar imperativos')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

completeAllNonfinites()