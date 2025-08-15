#!/usr/bin/env node

// Auditoría comprehensiva de cobertura de familias de verbos irregulares
// Analiza TODAS las 31 familias definidas en irregularFamilies.js

console.log('🔍 AUDITORÍA COMPREHENSIVA DE FAMILIAS DE VERBOS')
console.log('===============================================\n')

async function comprehensiveFamilyAudit() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { priorityVerbs, getAllVerbsWithPriority } = await import('./src/data/priorityVerbs.js')
    const { IRREGULAR_FAMILIES, categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    // Combinar todos los verbos
    const allVerbs = getAllVerbsWithPriority(verbs)
    console.log(`📚 Total de verbos analizados: ${allVerbs.length}`)
    console.log(`   - Verbos principales: ${verbs.length}`)
    console.log(`   - Verbos prioritarios: ${priorityVerbs.length}\n`)
    
    // Analizar cada familia
    const familyAnalysis = {}
    const tenseAnalysis = {}
    
    // Inicializar contadores
    Object.keys(IRREGULAR_FAMILIES).forEach(familyId => {
      familyAnalysis[familyId] = {
        verbs: new Set(),
        forms: 0,
        tenses: {}
      }
      
      // Inicializar contadores por tiempo afectado
      IRREGULAR_FAMILIES[familyId].affectedTenses.forEach(tense => {
        familyAnalysis[familyId].tenses[tense] = 0
        if (!tenseAnalysis[tense]) {
          tenseAnalysis[tense] = {
            total: 0,
            families: {}
          }
        }
        tenseAnalysis[tense].families[familyId] = 0
      })
    })
    
    // Procesar todos los verbos
    allVerbs.forEach(verb => {
      const families = categorizeVerb(verb.lemma, verb)
      
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          // Contar formas por tiempo
          if (!tenseAnalysis[form.tense]) {
            tenseAnalysis[form.tense] = { total: 0, families: {} }
          }
          tenseAnalysis[form.tense].total++
          
          // Asignar a familias
          families.forEach(familyId => {
            if (familyAnalysis[familyId]) {
              familyAnalysis[familyId].verbs.add(verb.lemma)
              familyAnalysis[familyId].forms++
              
              if (familyAnalysis[familyId].tenses[form.tense] !== undefined) {
                familyAnalysis[familyId].tenses[form.tense]++
                if (tenseAnalysis[form.tense].families[familyId] !== undefined) {
                  tenseAnalysis[form.tense].families[familyId]++
                }
              }
            }
          })
        })
      })
    })
    
    // Reportar resultados por familia
    console.log('📊 ANÁLISIS POR FAMILIA DE VERBOS IRREGULARES')
    console.log('============================================\n')
    
    const familiesByPriority = []
    
    Object.entries(IRREGULAR_FAMILIES).forEach(([familyId, familyInfo]) => {
      const analysis = familyAnalysis[familyId]
      const verbCount = analysis.verbs.size
      
      let priority = 'ADECUADA'
      let emoji = '✅'
      
      if (verbCount === 0) {
        priority = 'CRÍTICA'
        emoji = '🚨'
      } else if (verbCount < 3) {
        priority = 'URGENTE'
        emoji = '❌'
      } else if (verbCount < 7) {
        priority = 'ADVERTENCIA'
        emoji = '⚠️'
      } else if (verbCount < 12) {
        priority = 'MEJORABLE'
        emoji = '🔶'
      }
      
      familiesByPriority.push({
        familyId,
        familyInfo,
        analysis,
        verbCount,
        priority,
        emoji
      })
      
      console.log(`${emoji} ${familyInfo.name} (${familyId})`)
      console.log(`   Verbos: ${verbCount} | Formas: ${analysis.forms}`)
      console.log(`   Descripción: ${familyInfo.description}`)
      console.log(`   Estado: ${priority}`)
      
      if (verbCount > 0) {
        console.log(`   Verbos disponibles: ${[...analysis.verbs].slice(0, 8).join(', ')}${verbCount > 8 ? '...' : ''}`)
        
        // Mostrar cobertura por tiempo
        const tensesCoverage = Object.entries(analysis.tenses)
          .filter(([tense, count]) => count > 0)
          .map(([tense, count]) => `${tense}:${count}`)
        
        if (tensesCoverage.length > 0) {
          console.log(`   Cobertura: ${tensesCoverage.join(', ')}`)
        }
      } else {
        console.log(`   ⚠️  SIN VERBOS - Paradigmáticos esperados: ${familyInfo.paradigmaticVerbs.join(', ')}`)
      }
      console.log()
    })
    
    // Ordenar por prioridad
    familiesByPriority.sort((a, b) => {
      const priorityOrder = { 'CRÍTICA': 0, 'URGENTE': 1, 'ADVERTENCIA': 2, 'MEJORABLE': 3, 'ADECUADA': 4 }
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.verbCount - b.verbCount
    })
    
    // Resumen ejecutivo
    console.log('🎯 RESUMEN EJECUTIVO')
    console.log('===================')
    
    const criticalFamilies = familiesByPriority.filter(f => f.priority === 'CRÍTICA')
    const urgentFamilies = familiesByPriority.filter(f => f.priority === 'URGENTE')
    const warningFamilies = familiesByPriority.filter(f => f.priority === 'ADVERTENCIA')
    const improvableFamilies = familiesByPriority.filter(f => f.priority === 'MEJORABLE')
    const adequateFamilies = familiesByPriority.filter(f => f.priority === 'ADECUADA')
    
    console.log(`🚨 CRÍTICAS (0 verbos): ${criticalFamilies.length} familias`)
    console.log(`❌ URGENTES (1-2 verbos): ${urgentFamilies.length} familias`)
    console.log(`⚠️  ADVERTENCIA (3-6 verbos): ${warningFamilies.length} familias`)
    console.log(`🔶 MEJORABLES (7-11 verbos): ${improvableFamilies.length} familias`)
    console.log(`✅ ADECUADAS (12+ verbos): ${adequateFamilies.length} familias`)
    
    // Prioridades de acción
    console.log('\n🚀 PLAN DE ACCIÓN PRIORITARIO')
    console.log('=============================')
    
    if (criticalFamilies.length > 0) {
      console.log('\n1️⃣ CRÍTICO - Implementar inmediatamente:')
      criticalFamilies.forEach(f => {
        console.log(`   • ${f.familyInfo.name}: Agregar ${f.familyInfo.paradigmaticVerbs.slice(0, 3).join(', ')}`)
      })
    }
    
    if (urgentFamilies.length > 0) {
      console.log('\n2️⃣ URGENTE - Expandir a mínimo 5 verbos:')
      urgentFamilies.forEach(f => {
        const needed = Math.max(5 - f.verbCount, 2)
        const available = f.familyInfo.paradigmaticVerbs.filter(v => !f.analysis.verbs.has(v))
        console.log(`   • ${f.familyInfo.name}: Agregar ${needed} verbos (sugeridos: ${available.slice(0, needed).join(', ')})`)
      })
    }
    
    if (warningFamilies.length > 0) {
      console.log('\n3️⃣ ADVERTENCIA - Expandir a mínimo 8 verbos:')
      warningFamilies.forEach(f => {
        const needed = Math.max(8 - f.verbCount, 2)
        const available = f.familyInfo.paradigmaticVerbs.filter(v => !f.analysis.verbs.has(v))
        console.log(`   • ${f.familyInfo.name}: Agregar ${needed} verbos (sugeridos: ${available.slice(0, needed).join(', ')})`)
      })
    }
    
    // Análisis por tiempo
    console.log('\n📈 ANÁLISIS POR TIEMPO/MODO')
    console.log('===========================')
    
    const timesByImportance = [
      'pres', 'subjPres', 'pretIndef', 'impf', 'fut', 'cond',
      'subjImpf', 'pretPerf', 'plusc', 'futPerf', 'subjPerf', 'subjPlusc',
      'impAff', 'impNeg', 'ger', 'part', 'inf'
    ]
    
    timesByImportance.forEach(tense => {
      if (tenseAnalysis[tense]) {
        const total = tenseAnalysis[tense].total
        const activeFamilies = Object.values(tenseAnalysis[tense].families).filter(count => count > 0).length
        console.log(`${tense}: ${total} formas, ${activeFamilies} familias activas`)
      }
    })
    
    // Identificar tiempos críticos
    console.log('\n🔍 TIEMPOS CON COBERTURA INSUFICIENTE')
    console.log('====================================')
    
    const criticalTenses = []
    timesByImportance.slice(0, 10).forEach(tense => { // Los 10 tiempos más importantes
      if (tenseAnalysis[tense]) {
        const total = tenseAnalysis[tense].total
        const activeFamilies = Object.values(tenseAnalysis[tense].families).filter(count => count > 0).length
        
        if (total < 100 || activeFamilies < 5) {
          criticalTenses.push({ tense, total, activeFamilies })
        }
      }
    })
    
    if (criticalTenses.length > 0) {
      criticalTenses.forEach(({ tense, total, activeFamilies }) => {
        console.log(`⚠️  ${tense}: Solo ${total} formas y ${activeFamilies} familias`)
      })
    } else {
      console.log('✅ Todos los tiempos principales tienen cobertura adecuada')
    }
    
  } catch (error) {
    console.error('❌ Error en auditoría:', error.message)
    console.error(error.stack)
  }
}

comprehensiveFamilyAudit()