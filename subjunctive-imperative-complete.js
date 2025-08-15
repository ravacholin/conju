#!/usr/bin/env node

// Completador simultáneo de subjuntivo presente e imperativos
// Genera ambos para maximizar cobertura de imperativos

console.log('🔧 COMPLETADOR SIMULTÁNEO SUBJUNTIVO-IMPERATIVO')
console.log('===============================================\n')

async function completeSubjunctiveAndImperative() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`📚 Procesando ${verbs.length} verbos para subjuntivo presente e imperativos...\n`)
    
    const subjPresPersons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    const imperativePersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    
    // Subjuntivos presentes completamente irregulares (actualizados)
    const completeSubjunctives = {
      'ser': ['sea', 'seas', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
      'estar': ['esté', 'estés', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
      'ir': ['vaya', 'vayas', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
      'dar': ['dé', 'des', 'des', 'dé', 'demos', 'deis', 'den'],
      'saber': ['sepa', 'sepas', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
      'haber': ['haya', 'hayas', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
      'hacer': ['haga', 'hagas', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
      'poder': ['pueda', 'puedas', 'puedas', 'pueda', 'podamos', 'podáis', 'puedan'],
      'poner': ['ponga', 'pongas', 'pongas', 'ponga', 'pongamos', 'pongáis', 'pongan'],
      'querer': ['quiera', 'quieras', 'quieras', 'quiera', 'queramos', 'queráis', 'quieran'],
      'venir': ['venga', 'vengas', 'vengas', 'venga', 'vengamos', 'vengáis', 'vengan'],
      'tener': ['tenga', 'tengas', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan'],
      'decir': ['diga', 'digas', 'digas', 'diga', 'digamos', 'digáis', 'digan'],
      'salir': ['salga', 'salgas', 'salgas', 'salga', 'salgamos', 'salgáis', 'salgan'],
      'ver': ['vea', 'veas', 'veas', 'vea', 'veamos', 'veáis', 'vean'],
      'traer': ['traiga', 'traigas', 'traigas', 'traiga', 'traigamos', 'traigáis', 'traigan'],
      'caer': ['caiga', 'caigas', 'caigas', 'caiga', 'caigamos', 'caigáis', 'caigan'],
      'oír': ['oiga', 'oigas', 'oigas', 'oiga', 'oigamos', 'oigáis', 'oigan'],
      'conocer': ['conozca', 'conozcas', 'conozcas', 'conozca', 'conozcamos', 'conozcáis', 'conozcan'],
      'conducir': ['conduzca', 'conduzcas', 'conduzcas', 'conduzca', 'conduzcamos', 'conduzcáis', 'conduzcan'],
      'producir': ['produzca', 'produzcas', 'produzcas', 'produzca', 'produzcamos', 'produzcáis', 'produzcan'],
      'construir': ['construya', 'construyas', 'construyas', 'construya', 'construyamos', 'construyáis', 'construyan'],
      'huir': ['huya', 'huyas', 'huyas', 'huya', 'huyamos', 'huyáis', 'huyan'],
      'destruir': ['destruya', 'destruyas', 'destruyas', 'destruya', 'destruyamos', 'destruyáis', 'destruyan'],
      'incluir': ['incluya', 'incluyas', 'incluyas', 'incluya', 'incluyamos', 'incluyáis', 'incluyan'],
      'concluir': ['concluya', 'concluyas', 'concluyas', 'concluya', 'concluyamos', 'concluyáis', 'concluyan'],
      'contribuir': ['contribuya', 'contribuyas', 'contribuyas', 'contribuya', 'contribuyamos', 'contribuyáis', 'contribuyan'],
      'distribuir': ['distribuya', 'distribuyas', 'distribuyas', 'distribuya', 'distribuyamos', 'distribuyáis', 'distribuyan'],
      'sustituir': ['sustituya', 'sustituyas', 'sustituyas', 'sustituya', 'sustituyamos', 'sustituyáis', 'sustituyan'],
      'atribuir': ['atribuya', 'atribuyas', 'atribuyas', 'atribuya', 'atribuyamos', 'atribuyáis', 'atribuyan'],
      'instruir': ['instruya', 'instruyas', 'instruyas', 'instruya', 'instruyamos', 'instruyáis', 'instruyan'],
      'servir': ['sirva', 'sirvas', 'sirvas', 'sirva', 'sirvamos', 'sirváis', 'sirvan'],
      'pedir': ['pida', 'pidas', 'pidas', 'pida', 'pidamos', 'pidáis', 'pidan'],
      'repetir': ['repita', 'repitas', 'repitas', 'repita', 'repitamos', 'repitáis', 'repitan'],
      'seguir': ['siga', 'sigas', 'sigas', 'siga', 'sigamos', 'sigáis', 'sigan'],
      'conseguir': ['consiga', 'consigas', 'consigas', 'consiga', 'consigamos', 'consigáis', 'consigan'],
      'dormir': ['duerma', 'duermas', 'duermas', 'duerma', 'durmamos', 'durmáis', 'duerman'],
      'morir': ['muera', 'mueras', 'mueras', 'muera', 'muramos', 'muráis', 'mueran'],
      'sentir': ['sienta', 'sientas', 'sientas', 'sienta', 'sintamos', 'sintáis', 'sientan'],
      'mentir': ['mienta', 'mientas', 'mientas', 'mienta', 'mintamos', 'mintáis', 'mientan'],
      'preferir': ['prefiera', 'prefieras', 'prefieras', 'prefiera', 'prefiramos', 'prefiráis', 'prefieran'],
      'cerrar': ['cierre', 'cierres', 'cierres', 'cierre', 'cerremos', 'cerréis', 'cierren'],
      'pensar': ['piense', 'pienses', 'pienses', 'piense', 'pensemos', 'penséis', 'piensen'],
      'contar': ['cuente', 'cuentes', 'cuentes', 'cuente', 'contemos', 'contéis', 'cuenten'],
      'mostrar': ['muestre', 'muestres', 'muestres', 'muestre', 'mostremos', 'mostréis', 'muestren'],
      'encontrar': ['encuentre', 'encuentres', 'encuentres', 'encuentre', 'encontremos', 'encontréis', 'encuentren'],
      'jugar': ['juegue', 'juegues', 'juegues', 'juegue', 'juguemos', 'juguéis', 'jueguen'],
      'volar': ['vuele', 'vueles', 'vueles', 'vuele', 'volemos', 'voléis', 'vuelen'],
      'volver': ['vuelva', 'vuelvas', 'vuelvas', 'vuelva', 'volvamos', 'volváis', 'vuelvan'],
      'mover': ['mueva', 'muevas', 'muevas', 'mueva', 'movamos', 'mováis', 'muevan'],
      'perder': ['pierda', 'pierdas', 'pierdas', 'pierda', 'perdamos', 'perdáis', 'pierdan'],
      'entender': ['entienda', 'entiendas', 'entiendas', 'entienda', 'entendamos', 'entendáis', 'entiendan'],
      'leer': ['lea', 'leas', 'leas', 'lea', 'leamos', 'leáis', 'lean'],
      'creer': ['crea', 'creas', 'creas', 'crea', 'creamos', 'creáis', 'crean'],
      'deber': ['deba', 'debas', 'debas', 'deba', 'debamos', 'debáis', 'deban'],
      'abrir': ['abra', 'abras', 'abras', 'abra', 'abramos', 'abráis', 'abran'],
      'cubrir': ['cubra', 'cubras', 'cubras', 'cubra', 'cubramos', 'cubráis', 'cubran'],
      'excluir': ['excluya', 'excluyas', 'excluyas', 'excluya', 'excluyamos', 'excluyáis', 'excluyan'],
      'comer': ['coma', 'comas', 'comas', 'coma', 'comamos', 'comáis', 'coman'],
      'vivir': ['viva', 'vivas', 'vivas', 'viva', 'vivamos', 'viváis', 'vivan'],
      'amar': ['ame', 'ames', 'ames', 'ame', 'amemos', 'améis', 'amen'],
      'llegar': ['llegue', 'llegues', 'llegues', 'llegue', 'lleguemos', 'lleguéis', 'lleguen'],
      'buscar': ['busque', 'busques', 'busques', 'busque', 'busquemos', 'busquéis', 'busquen'],
      'sacar': ['saque', 'saques', 'saques', 'saque', 'saquemos', 'saquéis', 'saquen'],
      'organizar': ['organice', 'organices', 'organices', 'organice', 'organicemos', 'organicéis', 'organicen']
    }
    
    // Imperativos afirmativos tú irregulares
    const irregularAffirmativeTu = {
      'ser': 'sé', 'ir': 've', 'hacer': 'haz', 'tener': 'ten', 'venir': 'ven',
      'poner': 'pon', 'salir': 'sal', 'decir': 'di', 'dar': 'da', 'estar': 'está', 'saber': 'sabe'
    }
    
    let verbsUpdated = 0
    let subjFormsAdded = 0
    let impAffFormsAdded = 0
    let impNegFormsAdded = 0
    
    for (const verb of verbs) {
      const lemma = verb.lemma
      let verbUpdated = false
      
      // Buscar paradigma principal
      let mainParadigm = verb.paradigms.find(p => p.region === 'es' || !p.region)
      if (!mainParadigm) continue
      
      // 1. COMPLETAR SUBJUNTIVO PRESENTE
      const existingSubjPres = mainParadigm.forms.filter(f => f.tense === 'subjPres')
      
      if (existingSubjPres.length < 7) {
        if (completeSubjunctives[lemma]) {
          // Usar formas irregulares conocidas
          const irregularForms = completeSubjunctives[lemma]
          
          subjPresPersons.forEach((person, index) => {
            const existingForm = mainParadigm.forms.find(f => 
              f.tense === 'subjPres' && f.person === person
            )
            
            if (!existingForm && irregularForms[index]) {
              mainParadigm.forms.push({
                tense: 'subjPres',
                mood: 'subjunctive',
                person: person,
                form: irregularForms[index],
                tags: [],
                region: 'es'
              })
              subjFormsAdded++
              verbUpdated = true
            }
          })
        } else {
          // Generar subjuntivo regular usando primera persona presente
          const presentForms = mainParadigm.forms.filter(f => f.tense === 'pres')
          const firstPerson = presentForms.find(f => f.person === '1s')
          
          if (firstPerson && firstPerson.form) {
            let stem = ''
            
            // Obtener raíz del subjuntivo desde 1s presente
            if (firstPerson.form.endsWith('o')) {
              stem = firstPerson.form.slice(0, -1)
            } else if (firstPerson.form.endsWith('oy')) {
              stem = firstPerson.form.slice(0, -2) + 'ay' // soy → say (but irregular)
            }
            
            if (stem) {
              // Terminaciones regulares del subjuntivo
              const subjEndings = {
                'ar': ['e', 'es', 'es', 'e', 'emos', 'éis', 'en'],
                'er': ['a', 'as', 'as', 'a', 'amos', 'áis', 'an'],
                'ir': ['a', 'as', 'as', 'a', 'amos', 'áis', 'an']
              }
              
              let verbType = 'ar'
              if (lemma.endsWith('er')) verbType = 'er'
              else if (lemma.endsWith('ir')) verbType = 'ir'
              
              subjPresPersons.forEach((person, index) => {
                const existingForm = mainParadigm.forms.find(f => 
                  f.tense === 'subjPres' && f.person === person
                )
                
                if (!existingForm) {
                  const subjForm = stem + subjEndings[verbType][index]
                  
                  mainParadigm.forms.push({
                    tense: 'subjPres',
                    mood: 'subjunctive',
                    person: person,
                    form: subjForm,
                    tags: [],
                    region: 'es'
                  })
                  subjFormsAdded++
                  verbUpdated = true
                }
              })
            }
          }
        }
      }
      
      // 2. COMPLETAR IMPERATIVO AFIRMATIVO
      const existingImpAff = mainParadigm.forms.filter(f => f.tense === 'impAff')
      const currentSubjPres = mainParadigm.forms.filter(f => f.tense === 'subjPres')
      const presentForms = mainParadigm.forms.filter(f => f.tense === 'pres')
      
      if (existingImpAff.length < 6) {
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impAff' && f.person === person
          )
          
          if (!existingForm) {
            let affForm = ''
            
            if (person === '2s_tu') {
              // Tú: usar forma irregular o 3s presente
              if (irregularAffirmativeTu[lemma]) {
                affForm = irregularAffirmativeTu[lemma]
              } else {
                const thirdSingular = presentForms.find(f => f.person === '3s')
                if (thirdSingular && thirdSingular.form) {
                  affForm = thirdSingular.form
                }
              }
            } else if (person === '2s_vos') {
              // Vos: infinitivo sin -r + acento
              if (lemma.endsWith('ar')) {
                affForm = lemma.slice(0, -1) + 'á'
              } else if (lemma.endsWith('er')) {
                affForm = lemma.slice(0, -1) + 'é'
              } else if (lemma.endsWith('ir')) {
                affForm = lemma.slice(0, -1) + 'í'
              }
            } else {
              // Otras personas: usar subjuntivo presente
              const subjForm = currentSubjPres.find(f => f.person === person)
              if (subjForm && subjForm.form) {
                affForm = subjForm.form
              }
            }
            
            if (affForm) {
              mainParadigm.forms.push({
                tense: 'impAff',
                mood: 'imperative',
                person: person,
                form: affForm,
                tags: [],
                region: 'es'
              })
              impAffFormsAdded++
              verbUpdated = true
            }
          }
        })
      }
      
      // 3. COMPLETAR IMPERATIVO NEGATIVO
      const existingImpNeg = mainParadigm.forms.filter(f => f.tense === 'impNeg')
      
      if (existingImpNeg.length < 6) {
        imperativePersons.forEach(person => {
          const existingForm = mainParadigm.forms.find(f => 
            f.tense === 'impNeg' && f.person === person
          )
          
          if (!existingForm) {
            const subjForm = currentSubjPres.find(f => f.person === person)
            if (subjForm && subjForm.form) {
              const negForm = `no ${subjForm.form}`
              
              mainParadigm.forms.push({
                tense: 'impNeg',
                mood: 'imperative',
                person: person,
                form: negForm,
                tags: [],
                region: 'es'
              })
              impNegFormsAdded++
              verbUpdated = true
            }
          }
        })
      }
      
      if (verbUpdated) {
        verbsUpdated++
      }
    }
    
    console.log('✅ COMPLETADO SIMULTÁNEO SUBJUNTIVO-IMPERATIVO FINALIZADO')
    console.log('=========================================================')
    console.log(`📈 Verbos actualizados: ${verbsUpdated}`)
    console.log(`📈 Subjuntivo presente agregado: ${subjFormsAdded}`)
    console.log(`📈 Imperativo afirmativo agregado: ${impAffFormsAdded}`)
    console.log(`📈 Imperativo negativo agregado: ${impNegFormsAdded}`)
    console.log(`📈 Total formas agregadas: ${subjFormsAdded + impAffFormsAdded + impNegFormsAdded}`)
    console.log()
    
    // Verificar cobertura resultante
    console.log('🔍 VERIFICANDO COBERTURA RESULTANTE')
    console.log('===================================')
    
    const subjPresStats = { total: 0, complete: 0, forms: 0 }
    const impAffStats = { total: 0, complete: 0, forms: 0 }
    const impNegStats = { total: 0, complete: 0, forms: 0 }
    
    verbs.forEach(verb => {
      // Subjuntivo presente
      const subjPresForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'subjPres')
      subjPresStats.total++
      subjPresStats.forms += subjPresForms.length
      if (subjPresForms.length >= 7) {
        subjPresStats.complete++
      }
      
      // Imperativo afirmativo
      const impAffForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impAff')
      impAffStats.total++
      impAffStats.forms += impAffForms.length
      if (impAffForms.length >= 6) {
        impAffStats.complete++
      }
      
      // Imperativo negativo
      const impNegForms = verb.paradigms.flatMap(p => p.forms)
        .filter(f => f.tense === 'impNeg')
      impNegStats.total++
      impNegStats.forms += impNegForms.length
      if (impNegForms.length >= 6) {
        impNegStats.complete++
      }
    })
    
    const subjPresCoverage = ((subjPresStats.complete / subjPresStats.total) * 100).toFixed(1)
    const affCoverage = ((impAffStats.complete / impAffStats.total) * 100).toFixed(1)
    const negCoverage = ((impNegStats.complete / impNegStats.total) * 100).toFixed(1)
    
    const subjPresEmoji = subjPresCoverage >= 95 ? '✅' : subjPresCoverage >= 85 ? '🔶' : '⚠️'
    const affEmoji = affCoverage >= 90 ? '✅' : affCoverage >= 70 ? '🔶' : '⚠️'
    const negEmoji = negCoverage >= 90 ? '✅' : negCoverage >= 70 ? '🔶' : '⚠️'
    
    console.log(`${subjPresEmoji} subjPres: ${subjPresCoverage}% (${subjPresStats.complete}/${subjPresStats.total} verbos completos, ${subjPresStats.forms} formas)`)
    console.log(`${affEmoji} impAff: ${affCoverage}% (${impAffStats.complete}/${impAffStats.total} verbos completos, ${impAffStats.forms} formas)`)
    console.log(`${negEmoji} impNeg: ${negCoverage}% (${impNegStats.complete}/${impNegStats.total} verbos completos, ${impNegStats.forms} formas)`)
    
    // Generar archivo actualizado
    const updatedVerbsContent = `// Verbos con subjuntivo presente e imperativos completados
// Generado el ${new Date().toISOString()}

export const verbs = ${JSON.stringify(verbs, null, 2)}`
    
    // Crear backup
    const fs = await import('fs')
    const backupPath = `./src/data/verbs.backup.subjunctive-imperative.${Date.now()}.js`
    await fs.promises.copyFile('./src/data/verbs.js', backupPath)
    console.log(`\n💾 Backup creado: ${backupPath}`)
    
    // Escribir archivo actualizado
    await fs.promises.writeFile('./src/data/verbs.js', updatedVerbsContent)
    console.log('💾 Archivo verbs.js actualizado con subjuntivo e imperativos completados')
    
    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS')
    console.log('==============================')
    console.log('1. Ejecutar comprehensive-tense-audit.js para auditoría final')
    console.log('2. Completar formas no finitas restantes')
    console.log('3. Commit final de todas las mejoras')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

completeSubjunctiveAndImperative()