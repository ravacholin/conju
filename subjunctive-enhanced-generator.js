#!/usr/bin/env node

// Generador mejorado de subjuntivo presente
// Más agresivo en completar formas faltantes

console.log('🔧 GENERADOR MEJORADO DE SUBJUNTIVO PRESENTE')
console.log('============================================\n')

async function generateEnhancedSubjunctive() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log(`📚 Procesando ${verbs.length} verbos...\n`)
    
    const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Aplicar cambios vocálicos en subjuntivo
    function applySubjunctiveVocalicChanges(lemma, stem, person) {
      const families = categorizeVerb(lemma, {})
      
      // e→ie se mantiene en subjuntivo (menos nosotros/vosotros)
      if (families.includes('DIPHT_E_IE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        if (stem.includes('e')) {
          return stem.replace(/e([^e]*)$/, 'ie$1')
        }
      }
      
      // o→ue se mantiene en subjuntivo (menos nosotros/vosotros)
      if (families.includes('DIPHT_O_UE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        if (stem.includes('o')) {
          return stem.replace(/o([^o]*)$/, 'ue$1')
        }
      }
      
      // u→ue (jugar)
      if (families.includes('DIPHT_U_UE') && ['1s', '2s_tu', '2s_vos', '3s', '3p'].includes(person)) {
        if (stem.includes('u')) {
          return stem.replace(/u([^u]*)$/, 'ue$1')
        }
      }
      
      // e→i en verbos -ir se mantiene en todas las personas del subjuntivo
      if (families.includes('E_I_IR')) {
        if (stem.includes('e')) {
          return stem.replace(/e([^e]*)$/, 'i$1')
        }
      }
      
      return stem
    }
    
    let verbsUpdated = 0
    let formsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) continue
      
      // Buscar primera persona singular del presente indicativo
      const firstPersonPres = mainParadigm.forms.find(f => 
        f.tense === 'pres' && f.person === '1s' && f.mood === 'indicative'
      )
      
      if (!firstPersonPres || !firstPersonPres.form) continue
      
      // Determinar raíz del subjuntivo
      let subjStem = ''
      let subjEndings = []
      
      const firstPersonForm = firstPersonPres.form
      
      // Casos especiales completamente irregulares
      if (lemma === 'dar') {
        subjStem = 'dé'
        subjEndings = ['', 's', '', 'mos', 'is', 'n']
      } else if (lemma === 'estar') {
        subjStem = 'est'
        subjEndings = ['é', 'és', 'é', 'emos', 'éis', 'én']
      } else if (lemma === 'ir') {
        subjStem = 'vay'
        subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
      } else if (lemma === 'ser') {
        subjStem = 'se'
        subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
      } else if (lemma === 'haber') {
        subjStem = 'hay'
        subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
      } else if (lemma === 'saber') {
        subjStem = 'sep'
        subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
      } else if (lemma === 'caber') {
        subjStem = 'quep'
        subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
      } else {
        // Regla general: quitar -o y agregar terminaciones opuestas
        if (firstPersonForm.endsWith('o')) {
          const baseStem = firstPersonForm.slice(0, -1)
          
          // Determinar terminaciones según el tipo de verbo
          if (lemma.endsWith('ar')) {
            subjEndings = ['e', 'es', 'e', 'emos', 'éis', 'en']
          } else if (lemma.endsWith('er') || lemma.endsWith('ir')) {
            subjEndings = ['a', 'as', 'a', 'amos', 'áis', 'an']
          }
          
          // La raíz base para aplicar cambios vocálicos
          subjStem = baseStem
        } else {
          // Para verbos que no terminan en -o en 1ª persona
          continue
        }
      }
      
      // Generar todas las formas del subjuntivo
      if (subjStem && subjEndings.length === 6) {
        persons.forEach((person, index) => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'subjPres' && f.person === person
          )
          
          if (!existingForm) {
            // Aplicar cambios vocálicos específicos para cada persona
            let finalStem = applySubjunctiveVocalicChanges(lemma, subjStem, person)
            
            const subjForm = finalStem + subjEndings[index]
            
            mainParadigm.forms.push({
              tense: 'subjPres',
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
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ GENERACIÓN MEJORADA DE SUBJUNTIVO COMPLETADA')
    console.log('===============================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Formas agregadas: ${formsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const subjStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      const forms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      subjStats.total++
      subjStats.forms += forms.length
      if (forms.length >= 7) {
        subjStats.complete++
      }
    })
    
    const coverage = ((subjStats.complete / subjStats.total) * 100).toFixed(1)
    const emoji = coverage >= 90 ? '✅' : coverage >= 70 ? '🔶' : '⚠️'
    console.log(`${emoji} subjPres: ${coverage}% (${subjStats.complete}/${subjStats.total} verbos completos, ${subjStats.forms} formas totales)`)
    
    // Análisis de verbos incompletos
    console.log('\n📊 ANÁLISIS DE VERBOS INCOMPLETOS')
    console.log('=================================')
    
    const incompleteByCount = {}
    verbs.forEach(verb => {
      const subjForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      
      const count = subjForms.length
      if (count < 7) {
        if (!incompleteByCount[count]) incompleteByCount[count] = []
        incompleteByCount[count].push(verb.lemma)
      }
    })
    
    Object.entries(incompleteByCount).forEach(([count, verbs]) => {
      console.log(`${count}/7 formas: ${verbs.length} verbos (${verbs.slice(0, 5).join(', ')}${verbs.length > 5 ? '...' : ''})`)
    })
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo presente mejorado
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjunctive-enhanced.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo mejorado')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar imperative-generator.js para completar imperativo')
    console.log('2. Ejecutar comprehensive-tense-audit.js para verificar mejora total')
    console.log('3. Generar formas no finitas faltantes')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

generateEnhancedSubjunctive()