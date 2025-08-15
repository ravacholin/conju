#!/usr/bin/env node

// Generador automático de formas no finitas (infinitivo, gerundio, participio)

console.log('🔧 GENERADOR DE FORMAS NO FINITAS')
console.log('=================================\n')

async function generateNonfinite() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    // Participios irregulares conocidos
    const irregularParticiples = {
      'hacer': 'hecho',
      'ver': 'visto',
      'escribir': 'escrito',
      'poner': 'puesto',
      'volver': 'vuelto',
      'morir': 'muerto',
      'abrir': 'abierto',
      'cubrir': 'cubierto',
      'descubrir': 'descubierto',
      'romper': 'roto',
      'decir': 'dicho',
      'satisfacer': 'satisfecho',
      'bendecir': 'bendecido', // o bendito
      'maldecir': 'maldecido', // o maldito
      'imprimir': 'impreso', // o imprimido
      'freír': 'frito', // o freído
      'proveer': 'proveído', // o provisto
      'elegir': 'elegido', // o electo
      'absorber': 'absorbido', // o absorto
      'suspender': 'suspendido', // o suspenso
      'prender': 'prendido', // o preso
      'componer': 'compuesto',
      'proponer': 'propuesto',
      'disponer': 'dispuesto',
      'exponer': 'expuesto',
      'suponer': 'supuesto',
      'imponer': 'impuesto',
      'rehacer': 'rehecho',
      'deshacer': 'deshecho',
      'devolver': 'devuelto',
      'resolver': 'resuelto',
      'revolver': 'revuelto',
      'envolver': 'envuelto',
      'desenvolver': 'desenvuelto'
    }
    
    // Gerundios irregulares conocidos
    const irregularGerunds = {
      'ir': 'yendo',
      'poder': 'pudiendo',
      'venir': 'viniendo',
      'decir': 'diciendo',
      'traer': 'trayendo',
      'caer': 'cayendo',
      'leer': 'leyendo',
      'creer': 'creyendo',
      'oír': 'oyendo',
      'huir': 'huyendo',
      'construir': 'construyendo',
      'destruir': 'destruyendo',
      'incluir': 'incluyendo',
      'concluir': 'concluyendo',
      'excluir': 'excluyendo',
      'contribuir': 'contribuyendo',
      'distribuir': 'distribuyendo',
      'sustituir': 'sustituyendo',
      'atribuir': 'atribuyendo',
      'constituir': 'constituyendo',
      'instruir': 'instruyendo',
      'reconstruir': 'reconstruyendo',
      'argüir': 'arguyendo',
      'seguir': 'siguiendo',
      'conseguir': 'consiguiendo',
      'perseguir': 'persiguiendo',
      'pedir': 'pidiendo',
      'servir': 'sirviendo',
      'repetir': 'repitiendo',
      'sentir': 'sintiendo',
      'mentir': 'mintiendo',
      'preferir': 'prefiriendo',
      'medir': 'midiendo',
      'vestir': 'vistiendo',
      'dormir': 'durmiendo',
      'morir': 'muriendo',
      'reñir': 'riñendo',
      'teñir': 'tiñendo',
      'ceñir': 'ciñendo'
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
      
      // Generar infinitivo
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
      
      // Generar participio
      const existingPart = mainParadigm.forms.find(f => f.tense === 'part')
      if (!existingPart) {
        let participio = ''
        
        if (irregularParticiples[lemma]) {
          participio = irregularParticiples[lemma]
        } else {
          // Reglas regulares
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
      
      // Generar gerundio
      const existingGer = mainParadigm.forms.find(f => f.tense === 'ger')
      if (!existingGer) {
        let gerundio = ''
        
        if (irregularGerunds[lemma]) {
          gerundio = irregularGerunds[lemma]
        } else {
          // Reglas regulares
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
    
    console.log('✅ GENERACIÓN DE FORMAS NO FINITAS COMPLETADA')
    console.log('=============================================')
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
      const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
      console.log(`${emoji} ${tense}: ${coverage}% (${stats.complete}/${stats.total} verbos completos)`)
    })
    
    // Identificar verbos sin formas no finitas
    console.log('\n⚠️  VERBOS SIN FORMAS NO FINITAS')
    console.log('==============================')
    
    const missingNonfinite = { inf: [], ger: [], part: [] }
    
    verbs.forEach(verb => {
      ['inf', 'ger', 'part'].forEach(tense => {
        const forms = verb.paradigms.flatMap(p => p.forms)
          .filter(f => f.tense === tense)
        
        if (forms.length === 0) {
          missingNonfinite[tense].push(verb.lemma)
        }
      })
    })
    
    Object.entries(missingNonfinite).forEach(([tense, verbs]) => {
      if (verbs.length > 0) {
        console.log(`${tense}: ${verbs.length} verbos sin forma (${verbs.slice(0, 10).join(', ')}${verbs.length > 10 ? '...' : ''})`)
      } else {
        console.log(`${tense}: ✅ Todos los verbos tienen forma`)
      }
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con formas no finitas generadas automáticamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.nonfinite.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con formas no finitas')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('2. Revisar y completar subjuntivo presente para mejorar imperativo')
    console.log('3. Completar pretérito indefinido para mejorar subjuntivo imperfecto')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateNonfinite()