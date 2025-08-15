#!/usr/bin/env node

// Completador final para verbos regulares comunes
// Completa TODAS las formas para verbos que siguen patrones regulares

console.log('🔧 COMPLETADOR DE VERBOS REGULARES COMUNES')
console.log('==========================================\n')

async function completeRegularVerbs() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Verbos completamente regulares conocidos
    const regularVerbs = {
      // -ar regulares
      'bailar': 'ar',
      'cantar': 'ar', 
      'escuchar': 'ar',
      'mirar': 'ar',
      'estudiar': 'ar',
      'trabajar': 'ar',
      'caminar': 'ar',
      'hablar': 'ar',
      'cocinar': 'ar',
      'limpiar': 'ar',
      'viajar': 'ar',
      'comprar': 'ar',
      
      // -er regulares
      'comer': 'er',
      'vender': 'er',
      'aprender': 'er',
      'comprender': 'er',
      'responder': 'er',
      'beber': 'er',
      'correr': 'er',
      'meter': 'er',
      
      // -ir regulares
      'vivir': 'ir',
      'escribir': 'ir',
      'recibir': 'ir',
      'decidir': 'ir',
      'partir': 'ir',
      'subir': 'ir',
      'permitir': 'ir'
    }
    
    // Patrones completos para verbos regulares
    const patterns = {
      ar: {
        pres: ['o', 'as', 'ás', 'a', 'amos', 'áis', 'an'],
        pretIndef: ['é', 'aste', 'aste', 'ó', 'amos', 'asteis', 'aron'],
        impf: ['aba', 'abas', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
        fut: ['é', 'ás', 'ás', 'á', 'emos', 'éis', 'án'],
        cond: ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían'],
        subjPres: ['e', 'es', 'es', 'e', 'emos', 'éis', 'en'],
        subjImpf: ['ara', 'aras', 'aras', 'ara', 'áramos', 'arais', 'aran'],
        impAff: ['a', 'á', 'e', 'emos', 'ad', 'en'], // 2s_tu, 2s_vos, 3s, 1p, 2p_vosotros, 3p
        impNeg: ['es', 'es', 'e', 'emos', 'éis', 'en'] // no + subjuntivo
      },
      er: {
        pres: ['o', 'es', 'és', 'e', 'emos', 'éis', 'en'],
        pretIndef: ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
        impf: ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían'],
        fut: ['é', 'ás', 'ás', 'á', 'emos', 'éis', 'án'],
        cond: ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían'],
        subjPres: ['a', 'as', 'as', 'a', 'amos', 'áis', 'an'],
        subjImpf: ['iera', 'ieras', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran'],
        impAff: ['e', 'é', 'a', 'amos', 'ed', 'an'],
        impNeg: ['as', 'as', 'a', 'amos', 'áis', 'an']
      },
      ir: {
        pres: ['o', 'es', 'ís', 'e', 'imos', 'ís', 'en'],
        pretIndef: ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
        impf: ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían'],
        fut: ['é', 'ás', 'ás', 'á', 'emos', 'éis', 'án'],
        cond: ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían'],
        subjPres: ['a', 'as', 'as', 'a', 'amos', 'áis', 'an'],
        subjImpf: ['iera', 'ieras', 'ieras', 'iera', 'iéramos', 'ierais', 'ieran'],
        impAff: ['e', 'í', 'a', 'amos', 'id', 'an'],
        impNeg: ['as', 'as', 'a', 'amos', 'áis', 'an']
      }
    }
    
    const imperativePersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      
      // Solo procesar verbos regulares conocidos
      if (!regularVerbs[lemma]) continue
      
      const verbType = regularVerbs[lemma]
      const stem = lemma.slice(0, -2)
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) {
        verb.paradigms.push({ region: 'es', forms: [] })
        mainParadigm = verb.paradigms[verb.paradigms.length - 1]
      }
      
      // Completar todos los tiempos
      Object.entries(patterns[verbType]).forEach(([tense, endings]) => {
        
        if (tense === 'impAff' || tense === 'impNeg') {
          // Imperativo usa personas específicas
          imperativePersons.forEach((person, index) => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === tense && f.person === person
            )
            
            if (!existingForm) {
              let form = ''
              if (tense === 'impAff') {
                if (person === '2s_tu') {
                  form = stem + endings[0] // -a/-e
                } else if (person === '2s_vos') {
                  form = stem + endings[1] // -á/-é/-í
                } else {
                  form = stem + endings[index] // resto usa subjuntivo
                }
              } else { // impNeg
                form = `no ${stem}${endings[index]}`
              }
              
              mainParadigm.forms.push({
                tense: tense,
                mood: 'imperative',
                person: person,
                form: form,
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          })
        } else {
          // Tiempos regulares
          const mood = tense.startsWith('subj') ? 'subjunctive' : 
                      tense === 'cond' ? 'conditional' : 'indicative'
          
          persons.forEach((person, index) => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === tense && f.person === person && f.mood === mood
            )
            
            if (!existingForm) {
              let finalStem = stem
              
              // Para futuro y condicional, usar el infinitivo completo
              if (tense === 'fut' || tense === 'cond') {
                finalStem = lemma
              }
              
              const form = finalStem + endings[index]
              
              mainParadigm.forms.push({
                tense: tense,
                mood: mood,
                person: person,
                form: form,
                tags: [],
                region: 'es'
              })
              formsAdded++
              verbUpdated = true
            }
          })
        }
      })
      
      // Agregar formas no finitas si faltan
      const nonfinites = [
        { tense: 'inf', form: lemma, person: 'inf' },
        { tense: 'ger', form: stem + (verbType === 'ar' ? 'ando' : 'iendo'), person: 'ger' },
        { tense: 'part', form: stem + (verbType === 'ar' ? 'ado' : 'ido'), person: 'part' }
      ]
      
      nonfinites.forEach(({ tense, form, person }) => {
        const existingForm = mainParadigm.forms.find(f => f.tense === tense)
        if (!existingForm) {
          mainParadigm.forms.push({
            tense: tense,
            mood: 'nonfinite',
            person: person,
            form: form,
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
    
    console.log('✅ COMPLETADO DE VERBOS REGULARES')
    console.log('=================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar verbos completados
    console.log('🔍 VERBOS REGULARES COMPLETADOS')
    console.log('===============================')
    
    const completedRegulars = []
    Object.keys(regularVerbs).forEach(lemma => {
      const verb = verbs.find(v => v.lemma === lemma)
      if (verb) {
        const totalForms = verb.paradigms.flatMap(p => p.forms).length
        completedRegulars.push({ lemma, forms: totalForms })
      }
    })
    
    completedRegulars.sort((a, b) => b.forms - a.forms)
    completedRegulars.slice(0, 15).forEach(verb => {
      console.log(`✅ ${verb.lemma}: ${verb.forms} formas totales`)
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos regulares completados comprehensivamente
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.regular-completion.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con verbos regulares completos')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('2. Continuar con verbos irregulares faltantes')
    console.log('3. Commit y push de todos los avances')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

completeRegularVerbs()