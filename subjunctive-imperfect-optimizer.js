#!/usr/bin/env node

// Optimizador específico para subjuntivo imperfecto
// Completa pretéritos faltantes y genera subjuntivos imperfectos

console.log('🔧 OPTIMIZADOR DE SUBJUNTIVO IMPERFECTO')
console.log('======================================\n')

async function optimizeSubjunctiveImperfect() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log(`📚 Procesando ${verbs.length} verbos para subjuntivo imperfecto...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Subjuntivos imperfectos completamente irregulares
    const irregularSubjImpf = {
      'ser': ['fuera', 'fueras', 'fueras', 'fuera', 'fuéramos', 'fuerais', 'fueran'],
      'ir': ['fuera', 'fueras', 'fueras', 'fuera', 'fuéramos', 'fuerais', 'fueran'],
      'dar': ['diera', 'dieras', 'dieras', 'diera', 'diéramos', 'dierais', 'dieran'],
      'ver': ['viera', 'vieras', 'vieras', 'viera', 'viéramos', 'vierais', 'vieran']
    }
    
    // Primero, completar pretéritos faltantes para verbos regulares comunes
    const regularPreterites = {
      'bailar': ['bailé', 'bailaste', 'bailaste', 'bailó', 'bailamos', 'bailasteis', 'bailaron'],
      'cantar': ['canté', 'cantaste', 'cantaste', 'cantó', 'cantamos', 'cantasteis', 'cantaron'],
      'escuchar': ['escuché', 'escuchaste', 'escuchaste', 'escuchó', 'escuchamos', 'escuchasteis', 'escucharon'],
      'mirar': ['miré', 'miraste', 'miraste', 'miró', 'miramos', 'mirasteis', 'miraron'],
      'comprar': ['compré', 'compraste', 'compraste', 'compró', 'compramos', 'comprasteis', 'compraron'],
      'limpiar': ['limpié', 'limpiaste', 'limpiaste', 'limpió', 'limpiamos', 'limpiásteis', 'limpiaron'],
      'viajar': ['viajé', 'viajaste', 'viajaste', 'viajó', 'viajamos', 'viajasteis', 'viajaron'],
      'caminar': ['caminé', 'caminaste', 'caminaste', 'caminó', 'caminamos', 'caminasteis', 'caminaron'],
      'cocinar': ['cociné', 'cocinaste', 'cocinaste', 'cocinó', 'cocinamos', 'cocinasteis', 'cocinaron'],
      
      'comer': ['comí', 'comiste', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron'],
      'vender': ['vendí', 'vendiste', 'vendiste', 'vendió', 'vendimos', 'vendisteis', 'vendieron'],
      'beber': ['bebí', 'bebiste', 'bebiste', 'bebió', 'bebimos', 'bebisteis', 'bebieron'],
      'correr': ['corrí', 'corriste', 'corriste', 'corrió', 'corrimos', 'corristeis', 'corrieron'],
      'meter': ['metí', 'metiste', 'metiste', 'metió', 'metimos', 'metisteis', 'metieron'],
      
      'recibir': ['recibí', 'recibiste', 'recibiste', 'recibió', 'recibimos', 'recibisteis', 'recibieron'],
      'decidir': ['decidí', 'decidiste', 'decidiste', 'decidió', 'decidimos', 'decidisteis', 'decidieron'],
      'partir': ['partí', 'partiste', 'partiste', 'partió', 'partimos', 'partisteis', 'partieron'],
      'subir': ['subí', 'subiste', 'subiste', 'subió', 'subimos', 'subisteis', 'subieron'],
      'permitir': ['permití', 'permitiste', 'permitiste', 'permitió', 'permitimos', 'permitisteis', 'permitieron'],
      
      // Verbos irregulares comunes conocidos
      'repetir': ['repetí', 'repetiste', 'repetiste', 'repitió', 'repetimos', 'repetisteis', 'repitieron'],
      'morir': ['morí', 'moriste', 'moriste', 'murió', 'morimos', 'moristeis', 'murieron'],
      'andar': ['anduve', 'anduviste', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron']
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
      
      // Paso 1: Completar pretérito si es necesario
      const existingPreterite = mainParadigm.forms.filter(f => 
        f.tense === 'pretIndef' && f.mood === 'indicative'
      )
      
      if (existingPreterite.length < 7 && regularPreterites[lemma]) {
        const preteriteForms = regularPreterites[lemma]
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'pretIndef' && f.mood === 'indicative' && f.person === person
          )
          
          if (!existingForm) {
            mainParadigm.forms.push({
              tense: 'pretIndef',
              mood: 'indicative',
              person: person,
              form: preteriteForms[index],
              tags: [],
              region: 'es'
            })
            formsAdded++
            verbUpdated = true
          }
        })
      }
      
      // Paso 2: Generar subjuntivo imperfecto
      const existingSubjImpf = mainParadigm.forms.filter(f => f.tense === 'subjImpf')
      
      if (existingSubjImpf.length < 7) {
        // Verificar si es completamente irregular
        if (irregularSubjImpf[lemma]) {
          const subjImpfForms = irregularSubjImpf[lemma]
          persons.forEach((person, index) => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === 'subjImpf' && f.person === person
            )
            
            if (!existingForm) {
              mainParadigm.forms.push({
                tense: 'subjImpf',
                mood: 'subjunctive',
                person: person,
                form: subjImpfForms[index],
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          })
        } else {
          // Buscar 3ª persona plural del pretérito para generar subjuntivo imperfecto
          const thirdPluralPret = mainParadigm.forms.find(f => 
            f.tense === 'pretIndef' && f.person === '3p' && f.mood === 'indicative'
          )
          
          if (thirdPluralPret && thirdPluralPret.form) {
            let stem = ''
            
            // Determinar la raíz del subjuntivo imperfecto
            if (thirdPluralPret.form.endsWith('aron')) {
              stem = thirdPluralPret.form.slice(0, -4) // hablar → hablaron → habl
            } else if (thirdPluralPret.form.endsWith('ieron')) {
              stem = thirdPluralPret.form.slice(0, -5) // comer → comieron → com
            } else if (thirdPluralPret.form.endsWith('eron')) {
              stem = thirdPluralPret.form.slice(0, -4) // traer → trajeron → traj
            }
            
            if (stem) {
              const subjImpfEndings = ['ara', 'aras', 'aras', 'ara', 'áramos', 'arais', 'aran']
              
              persons.forEach((person, index) => {
                const existingForm = mainParadigm.forms.find(f => 
                  f.tense === 'subjImpf' && f.person === person
                )
                
                if (!existingForm) {
                  mainParadigm.forms.push({
                    tense: 'subjImpf',
                    mood: 'subjunctive',
                    person: person,
                    form: stem + subjImpfEndings[index],
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
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ OPTIMIZACIÓN DE SUBJUNTIVO IMPERFECTO COMPLETADA')
    console.log('===================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const subjImpfStats = { total: 0, complete: 0, forms: 0 }
    const pretStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      // Subjuntivo imperfecto
      const subjImpfForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjImpf')
      subjImpfStats.total++
      subjImpfStats.forms += subjImpfForms.length
      if (subjImpfForms.length >= 7) {
        subjImpfStats.complete++
      }
      
      // Pretérito indefinido
      const pretForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pretIndef' && f.mood === 'indicative')
      pretStats.total++
      pretStats.forms += pretForms.length
      if (pretForms.length >= 7) {
        pretStats.complete++
      }
    })
    
    const subjCoverage = ((subjImpfStats.complete / subjImpfStats.total) * 100).toFixed(1)
    const pretCoverage = ((pretStats.complete / pretStats.total) * 100).toFixed(1)
    
    const subjEmoji = subjCoverage >= 90 ? '✅' : subjCoverage >= 70 ? '🔶' : subjCoverage >= 50 ? '⚠️' : '❌'
    const pretEmoji = pretCoverage >= 90 ? '✅' : pretCoverage >= 70 ? '🔶' : '⚠️'
    
    console.log(`${subjEmoji} subjImpf: ${subjCoverage}% (${subjImpfStats.complete}/${subjImpfStats.total} verbos completos, ${subjImpfStats.forms} formas totales)`)
    console.log(`${pretEmoji} pretIndef: ${pretCoverage}% (${pretStats.complete}/${pretStats.total} verbos completos, ${pretStats.forms} formas totales)`)
    
    // Identificar verbos que aún necesitan trabajo
    console.log('\n📊 ANÁLISIS DE VERBOS PENDIENTES')
    console.log('================================')
    
    const missingSubjImpf = []
    const missingPreterite = []
    
    verbs.forEach(verb => {
      const subjImpfForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjImpf')
      const pretForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'pretIndef' && f.mood === 'indicative')
      
      if (subjImpfForms.length === 0) {
        missingSubjImpf.push(verb.lemma)
      }
      
      if (pretForms.length < 7) {
        missingPreterite.push({
          lemma: verb.lemma,
          forms: pretForms.length
        })
      }
    })
    
    console.log(`❌ Verbos sin subjuntivo imperfecto: ${missingSubjImpf.length}`)
    if (missingSubjImpf.length > 0) {
      console.log(`   Ejemplos: ${missingSubjImpf.slice(0, 10).join(', ')}${missingSubjImpf.length > 10 ? '...' : ''}`)
    }
    
    console.log(`⚠️  Verbos con pretérito incompleto: ${missingPreterite.length}`)
    if (missingPreterite.length > 0) {
      missingPreterite.slice(0, 10).forEach(verb => {
        console.log(`   • ${verb.lemma}: ${verb.forms}/7 formas`)
      })
    }
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo imperfecto optimizado
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjimpf-optimized.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo imperfecto optimizado')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora')
    console.log('2. Optimizar imperativo negativo')
    console.log('3. Completar formas no finitas restantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

optimizeSubjunctiveImperfect()