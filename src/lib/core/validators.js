// Sistema de validación automática para Spanish Conjugator
import { verbs } from '../../data/verbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'

// Validadores individuales
export class VerbValidator {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  // Validar estructura básica de un verbo
  validateVerbStructure(verb) {
    const errors = []
    
    if (!verb.id || typeof verb.id !== 'string') {
      errors.push(`Verb missing or invalid ID: ${verb.id}`)
    }
    
    if (!verb.lemma || typeof verb.lemma !== 'string') {
      errors.push(`Verb ${verb.id} missing or invalid lemma: ${verb.lemma}`)
    }
    
    if (!['regular', 'irregular'].includes(verb.type)) {
      errors.push(`Verb ${verb.lemma} has invalid type: ${verb.type}`)
    }
    
    if (!verb.paradigms || !Array.isArray(verb.paradigms) || verb.paradigms.length === 0) {
      errors.push(`Verb ${verb.lemma} missing paradigms`)
    }
    
    return errors
  }

  // Validar formas verbales
  validateVerbForms(verb) {
    const errors = []
    const warnings = []
    
    if (!verb.paradigms) return { errors, warnings }
    
    verb.paradigms.forEach((paradigm, pIndex) => {
      if (!paradigm.regionTags || !Array.isArray(paradigm.regionTags)) {
        errors.push(`Verb ${verb.lemma} paradigm ${pIndex} missing regionTags`)
      }
      
      if (!paradigm.forms || !Array.isArray(paradigm.forms)) {
        errors.push(`Verb ${verb.lemma} paradigm ${pIndex} missing forms`)
        return
      }
      
      // Verificar formas esenciales
      const requiredCombinations = [
        { mood: 'indicative', tense: 'pres', person: '1s' },
        { mood: 'indicative', tense: 'pres', person: '3s' },
        { mood: 'nonfinite', tense: 'inf', person: '' }
      ]
      
      requiredCombinations.forEach(req => {
        const found = paradigm.forms.find(f => 
          f.mood === req.mood && 
          f.tense === req.tense && 
          f.person === req.person
        )
        
        if (!found) {
          errors.push(`Verb ${verb.lemma} missing required form: ${req.mood}|${req.tense}|${req.person}`)
        }
      })
      
      // Validar cada forma individual
      paradigm.forms.forEach((form, fIndex) => {
        if (!form.mood || !form.tense) {
          errors.push(`Verb ${verb.lemma} form ${fIndex} missing mood/tense`)
        }
        
        if (form.person === undefined) {
          errors.push(`Verb ${verb.lemma} form ${fIndex} missing person field`)
        }
        
        if (!form.value || typeof form.value !== 'string') {
          errors.push(`Verb ${verb.lemma} form ${fIndex} invalid value: ${form.value}`)
        }
        
        // Verificar coherencia de lemma
        if (form.lemma && form.lemma !== verb.lemma) {
          warnings.push(`Verb ${verb.lemma} form ${fIndex} has mismatched lemma: ${form.lemma}`)
        }
      })
    })
    
    return { errors, warnings }
  }

  // Validar consistencia de conjugaciones
  validateConjugationConsistency(verb) {
    const warnings = []
    
    if (verb.type === 'regular') {
      // Para verbos regulares, verificar que no tengan formas irregulares obvias
      verb.paradigms?.forEach(paradigm => {
        paradigm.forms?.forEach(form => {
          if (form.mood === 'indicative' && form.tense === 'pres' && form.person === '1s') {
            const expected = this.getRegularForm(verb.lemma, form.mood, form.tense, form.person)
            if (expected && form.value !== expected) {
              warnings.push(`Regular verb ${verb.lemma} has irregular 1s present: ${form.value} (expected: ${expected})`)
            }
          }
        })
      })
    }
    
    return warnings
  }

  // Generar forma regular esperada (simplificado)
  getRegularForm(lemma, mood, tense, person) {
    if (mood === 'indicative' && tense === 'pres' && person === '1s') {
      if (lemma.endsWith('ar')) return lemma.slice(0, -2) + 'o'
      if (lemma.endsWith('er')) return lemma.slice(0, -2) + 'o'  
      if (lemma.endsWith('ir')) return lemma.slice(0, -2) + 'o'
    }
    return null
  }

  // Validar un verbo completo
  validateVerb(verb) {
    const structureErrors = this.validateVerbStructure(verb)
    const { errors: formErrors, warnings: formWarnings } = this.validateVerbForms(verb)
    const consistencyWarnings = this.validateConjugationConsistency(verb)
    
    return {
      errors: [...structureErrors, ...formErrors],
      warnings: [...formWarnings, ...consistencyWarnings]
    }
  }
}

// Validador de familias irregulares
export class FamilyValidator {
  validateFamilyStructure(family) {
    const errors = []
    
    if (!family.id) errors.push(`Family missing ID`)
    if (!family.name) errors.push(`Family ${family.id} missing name`)
    if (!family.examples || !Array.isArray(family.examples)) {
      errors.push(`Family ${family.id} missing examples array`)
    }
    if (!family.affectedTenses || !Array.isArray(family.affectedTenses)) {
      errors.push(`Family ${family.id} missing affectedTenses array`)
    }
    
    return errors
  }

  validateFamilyExamples(family, allVerbs) {
    const warnings = []
    const verbSet = new Set(allVerbs.map(v => v.lemma))
    
    family.examples?.forEach(example => {
      if (!verbSet.has(example)) {
        warnings.push(`Family ${family.id} example verb '${example}' not found in database`)
      }
    })
    
    if (family.examples && family.examples.length < 3) {
      warnings.push(`Family ${family.id} has too few examples (${family.examples.length})`)
    }
    
    return warnings
  }
}

// Función principal de validación
export function validateAllData() {
  console.log('🔍 INICIANDO VALIDACIÓN COMPLETA DE DATOS\n')
  
  const verbValidator = new VerbValidator()
  const familyValidator = new FamilyValidator()
  
  let totalErrors = 0
  let totalWarnings = 0
  const problemVerbs = []
  
  // Validar todos los verbos
  console.log(`📚 Validando ${verbs.length} verbos...
`)
  
  verbs.forEach((verb, index) => {
    const { errors, warnings } = verbValidator.validateVerb(verb)
    
    if (errors.length > 0 || warnings.length > 0) {
      problemVerbs.push({
        verb: verb.lemma || `index_${index}`,
        errors,
        warnings
      })
      totalErrors += errors.length
      totalWarnings += warnings.length
    }
  })
  
  // Validar familias irregulares
  console.log(`
🏗️  Validando ${Object.keys(IRREGULAR_FAMILIES).length} familias irregulares...
`)
  
  const familyProblems = []
  Object.values(IRREGULAR_FAMILIES).forEach(family => {
    const structureErrors = familyValidator.validateFamilyStructure(family)
    const exampleWarnings = familyValidator.validateFamilyExamples(family, verbs)
    
    if (structureErrors.length > 0 || exampleWarnings.length > 0) {
      familyProblems.push({
        family: family.name || family.id,
        errors: structureErrors,
        warnings: exampleWarnings
      })
      totalErrors += structureErrors.length
      totalWarnings += exampleWarnings.length
    }
  })
  
  // Reportar resultados
  console.log(`
📊 RESULTADOS DE VALIDACIÓN:
`)
  console.log(`✅ Verbos validados: ${verbs.length}`)
  console.log(`✅ Familias validadas: ${Object.keys(IRREGULAR_FAMILIES).length}`)
  console.log(`❌ Total errores: ${totalErrors}`)
  console.log(`⚠️  Total advertencias: ${totalWarnings}`)
  
  // Mostrar problemas más críticos
  if (totalErrors > 0) {
    console.log(`
🚨 ERRORES CRÍTICOS:
`)
    problemVerbs.filter(p => p.errors.length > 0).slice(0, 5).forEach(problem => {
      console.log(`  ${problem.verb}:
`)
      problem.errors.forEach(error => console.log(`    - ${error}`))
    })
    
    if (problemVerbs.filter(p => p.errors.length > 0).length > 5) {
      console.log(`    ... y ${problemVerbs.filter(p => p.errors.length > 0).length - 5} verbos más con errores`)
    }
  }
  
  if (totalWarnings > 0) {
    console.log(`
⚠️  ADVERTENCIAS:
`)
    problemVerbs.filter(p => p.warnings.length > 0).forEach(problem => {
      console.log(`  ${problem.verb}:
`)
      problem.warnings.forEach(warning => console.log(`    - ${warning}`))
    })
  }
  
  // Estado general
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`
🎉 ¡PERFECTO! Todos los datos pasaron la validación.
`)
  } else if (totalErrors === 0) {
    console.log(`
✅ Sin errores críticos. Solo advertencias menores.
`)
  } else {
    console.log(`
🔧 Se requieren correcciones antes del deploy.
`)
  }
  
  return {
    totalErrors,
    totalWarnings,
    problemVerbs,
    familyProblems,
    isValid: totalErrors === 0
  }
}

// Función de validación rápida (solo errores críticos)
export function quickValidation() {
  const criticalErrors = []
  
  // Verificar que verbos básicos estén presentes
  const essentialVerbs = ['ser', 'estar', 'tener', 'hacer', 'ir']
  const verbSet = new Set(verbs.map(v => v.lemma))
  
  essentialVerbs.forEach(verb => {
    if (!verbSet.has(verb)) {
      criticalErrors.push(`Essential verb missing: ${verb}`)
    }
  })
  
  // Verificar que no haya verbos duplicados
  const lemmas = verbs.map(v => v.lemma)
  const duplicates = lemmas.filter((lemma, index) => lemmas.indexOf(lemma) !== index)
  
  if (duplicates.length > 0) {
    criticalErrors.push(`Duplicate verbs found: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  return {
    isValid: criticalErrors.length === 0,
    errors: criticalErrors
  }
}
