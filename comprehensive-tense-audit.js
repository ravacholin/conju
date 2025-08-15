#!/usr/bin/env node

// Auditoría comprehensiva de TODOS los tiempos verbales
// Identifica conjugaciones faltantes en todos los modos y tiempos

console.log('🔍 AUDITORÍA COMPREHENSIVA DE TIEMPOS VERBALES')
console.log('===============================================\n')

async function comprehensiveTenseAudit() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { priorityVerbs } = await import('./src/data/priorityVerbs.js')
    
    console.log(`📚 Analizando ${verbs.length} verbos...\n`)
    
    // Definir todos los tiempos esperados y sus personas
    const expectedPersons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    const nonFiniteForms = ['inf', 'ger', 'part']
    
    const allTenses = {
      // Indicativo
      'pres': { mood: 'indicative', persons: expectedPersons },
      'pretIndef': { mood: 'indicative', persons: expectedPersons },
      'impf': { mood: 'indicative', persons: expectedPersons },
      'fut': { mood: 'indicative', persons: expectedPersons },
      'cond': { mood: 'conditional', persons: expectedPersons },
      
      // Tiempos compuestos indicativo
      'pretPerf': { mood: 'indicative', persons: expectedPersons },
      'plusc': { mood: 'indicative', persons: expectedPersons },
      'futPerf': { mood: 'indicative', persons: expectedPersons },
      'condPerf': { mood: 'conditional', persons: expectedPersons },
      
      // Subjuntivo
      'subjPres': { mood: 'subjunctive', persons: expectedPersons },
      'subjImpf': { mood: 'subjunctive', persons: expectedPersons },
      
      // Tiempos compuestos subjuntivo
      'subjPerf': { mood: 'subjunctive', persons: expectedPersons },
      'subjPlusc': { mood: 'subjunctive', persons: expectedPersons },
      
      // Imperativo
      'impAff': { mood: 'imperative', persons: ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'] },
      'impNeg': { mood: 'imperative', persons: ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'] },
      
      // Formas no finitas
      'inf': { mood: 'nonfinite', persons: ['inf'] },
      'ger': { mood: 'nonfinite', persons: ['ger'] },
      'part': { mood: 'nonfinite', persons: ['part'] }
    }
    
    const tenseAnalysis = {}
    const verbAnalysis = {}
    
    // Inicializar análisis
    Object.keys(allTenses).forEach(tense => {
      tenseAnalysis[tense] = {
        totalExpected: 0,
        totalFound: 0,
        completeVerbs: [],
        incompleteVerbs: [],
        missingVerbs: [],
        coverage: 0
      }
    })
    
    // Analizar cada verbo
    for (const verb of verbs) {
      verbAnalysis[verb.lemma] = {}
      const isPriority = priorityVerbs.some(pv => pv.lemma === verb.lemma)
      
      // Recopilar todas las formas del verbo
      const verbForms = {}
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          const key = `${form.tense}_${form.person || form.tense}`
          verbForms[key] = form
        })
      })
      
      // Analizar cada tiempo
      Object.entries(allTenses).forEach(([tense, tenseInfo]) => {
        const expectedForms = tenseInfo.persons.length
        const foundForms = tenseInfo.persons.filter(person => {
          const key = `${tense}_${person}`
          return verbForms[key] !== undefined
        }).length
        
        tenseAnalysis[tense].totalExpected += expectedForms
        tenseAnalysis[tense].totalFound += foundForms
        
        verbAnalysis[verb.lemma][tense] = {
          expected: expectedForms,
          found: foundForms,
          complete: foundForms === expectedForms,
          coverage: expectedForms > 0 ? (foundForms / expectedForms * 100).toFixed(1) : 0
        }
        
        // Clasificar verbos
        if (foundForms === 0) {
          tenseAnalysis[tense].missingVerbs.push(verb.lemma)
        } else if (foundForms === expectedForms) {
          tenseAnalysis[tense].completeVerbs.push(verb.lemma)
        } else {
          tenseAnalysis[tense].incompleteVerbs.push({
            lemma: verb.lemma,
            found: foundForms,
            expected: expectedForms,
            isPriority
          })
        }
      })
    }
    
    // Calcular cobertura global
    Object.keys(tenseAnalysis).forEach(tense => {
      const analysis = tenseAnalysis[tense]
      analysis.coverage = analysis.totalExpected > 0 ? 
        (analysis.totalFound / analysis.totalExpected * 100).toFixed(1) : 0
    })
    
    // Reportar resultados
    console.log('📊 COBERTURA GLOBAL POR TIEMPO')
    console.log('==============================')
    
    const timesByImportance = [
      'pres', 'pretIndef', 'impf', 'fut', 'cond',
      'subjPres', 'subjImpf',
      'pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc',
      'impAff', 'impNeg', 'inf', 'ger', 'part'
    ]
    
    timesByImportance.forEach(tense => {
      if (tenseAnalysis[tense]) {
        const analysis = tenseAnalysis[tense]
        const emoji = analysis.coverage >= 90 ? '✅' : 
                     analysis.coverage >= 70 ? '🔶' : 
                     analysis.coverage >= 50 ? '⚠️' : '❌'
        
        console.log(`${emoji} ${tense}: ${analysis.coverage}% (${analysis.totalFound}/${analysis.totalExpected})`)
        console.log(`   Completos: ${analysis.completeVerbs.length} | Incompletos: ${analysis.incompleteVerbs.length} | Faltantes: ${analysis.missingVerbs.length}`)
      }
    })
    
    // Identificar tiempos críticos
    console.log('\n🚨 TIEMPOS CRÍTICOS (< 50% cobertura)')
    console.log('=====================================')
    
    const criticalTenses = Object.entries(tenseAnalysis)
      .filter(([tense, analysis]) => analysis.coverage < 50)
      .sort((a, b) => a[1].coverage - b[1].coverage)
    
    if (criticalTenses.length > 0) {
      criticalTenses.forEach(([tense, analysis]) => {
        console.log(`❌ ${tense}: ${analysis.coverage}% - ${analysis.missingVerbs.length} verbos sin ninguna forma`)
        
        // Mostrar verbos prioritarios afectados
        const priorityMissing = analysis.missingVerbs.filter(lemma => 
          priorityVerbs.some(pv => pv.lemma === lemma)
        )
        if (priorityMissing.length > 0) {
          console.log(`   🎯 Prioritarios faltantes: ${priorityMissing.slice(0, 10).join(', ')}${priorityMissing.length > 10 ? '...' : ''}`)
        }
      })
    } else {
      console.log('✅ No hay tiempos con cobertura crítica')
    }
    
    // Identificar verbos prioritarios con problemas
    console.log('\n🎯 VERBOS PRIORITARIOS CON CONJUGACIONES INCOMPLETAS')
    console.log('===================================================')
    
    const priorityProblems = []
    priorityVerbs.forEach(pv => {
      const analysis = verbAnalysis[pv.lemma]
      if (analysis) {
        const problems = []
        Object.entries(analysis).forEach(([tense, tenseData]) => {
          if (!tenseData.complete && tenseData.found > 0) {
            problems.push(`${tense}:${tenseData.found}/${tenseData.expected}`)
          } else if (tenseData.found === 0 && timesByImportance.slice(0, 10).includes(tense)) {
            problems.push(`${tense}:FALTA`)
          }
        })
        
        if (problems.length > 0) {
          priorityProblems.push({
            lemma: pv.lemma,
            level: pv.level,
            problems: problems
          })
        }
      }
    })
    
    priorityProblems.sort((a, b) => a.level - b.level)
    
    if (priorityProblems.length > 0) {
      priorityProblems.slice(0, 20).forEach(verb => {
        console.log(`• ${verb.lemma} (A${verb.level}): ${verb.problems.join(', ')}`)
      })
      
      if (priorityProblems.length > 20) {
        console.log(`... y ${priorityProblems.length - 20} verbos más`)
      }
    } else {
      console.log('✅ Todos los verbos prioritarios tienen conjugaciones completas en tiempos principales')
    }
    
    // Plan de acción
    console.log('\n🚀 PLAN DE ACCIÓN RECOMENDADO')
    console.log('============================')
    
    console.log('1️⃣ CRÍTICO - Completar tiempos con <50% cobertura:')
    criticalTenses.slice(0, 5).forEach(([tense, analysis]) => {
      console.log(`   • ${tense}: Agregar formas para ${analysis.missingVerbs.length} verbos`)
    })
    
    console.log('\n2️⃣ PRIORITARIO - Completar verbos prioritarios incompletos:')
    const topPriorityProblems = priorityProblems.filter(v => v.level <= 2).slice(0, 10)
    if (topPriorityProblems.length > 0) {
      topPriorityProblems.forEach(verb => {
        console.log(`   • ${verb.lemma}: ${verb.problems.slice(0, 3).join(', ')}`)
      })
    }
    
    console.log('\n3️⃣ MEJORAR - Expandir cobertura de tiempos compuestos:')
    const compoundTenses = ['pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc']
    compoundTenses.forEach(tense => {
      if (tenseAnalysis[tense] && tenseAnalysis[tense].coverage < 90) {
        console.log(`   • ${tense}: ${tenseAnalysis[tense].coverage}% - agregar ${tenseAnalysis[tense].missingVerbs.length} verbos`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

comprehensiveTenseAudit()