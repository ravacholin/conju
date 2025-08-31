// Sistema de validación automática para Spanish Conjugator
import { verbs } from '../../data/verbs.js'
import { getAllVerbsWithPriority } from '../../data/priorityVerbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'

// Obtener todos los verbos (principales + prioritarios)
const allVerbs = getAllVerbsWithPriority(verbs)

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
  const semanticValidator = new SemanticValidator()
  const familyValidator = new FamilyValidator()
  
  let totalErrors = 0
  let totalWarnings = 0
  const problemVerbs = []
  
  // Validar todos los verbos
  console.log(`📚 Validando ${allVerbs.length} verbos...`)
  console.log(`🧠 Incluye validación semántica y de verbos defectivos
`)
  
  allVerbs.forEach((verb, index) => {
    const structuralResults = verbValidator.validateVerb(verb)
    const semanticResults = semanticValidator.validateVerb(verb)
    
    const allErrors = [...structuralResults.errors, ...semanticResults.errors]
    const allWarnings = [...structuralResults.warnings, ...semanticResults.warnings]
    
    if (allErrors.length > 0 || allWarnings.length > 0) {
      problemVerbs.push({
        verb: verb.lemma || `index_${index}`,
        errors: allErrors,
        warnings: allWarnings
      })
      totalErrors += allErrors.length
      totalWarnings += allWarnings.length
    }
  })
  
  // Validar familias irregulares
  console.log(`
🏗️  Validando ${Object.keys(IRREGULAR_FAMILIES).length} familias irregulares...
`)
  
  const familyProblems = []
  Object.values(IRREGULAR_FAMILIES).forEach(family => {
    const structureErrors = familyValidator.validateFamilyStructure(family)
    const exampleWarnings = familyValidator.validateFamilyExamples(family, allVerbs)
    
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
  console.log(`✅ Verbos validados: ${allVerbs.length}`)
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
    
    familyProblems.filter(p => p.warnings.length > 0).forEach(problem => {
      console.log(`  Familia ${problem.family}:
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

// Validador semántico avanzado para detectar errores lingüísticos
export class SemanticValidator {
  constructor() {
    // Definir reglas de verbos defectivos con sus restricciones específicas
    this.defectiveVerbs = {
      // Verbos que NO admiten imperativo
      'soler': {
        type: 'defective_imperative',
        description: 'No admite imperativo (uso auxiliar de hábito)',
        forbiddenTenses: ['imperative']
      },
      'abolir': {
        type: 'defective_imperative', 
        description: 'No admite imperativo (verbo defectivo clásico)',
        forbiddenTenses: ['imperative']
      },
      'blandir': {
        type: 'defective_imperative',
        description: 'No admite imperativo (verbo defectivo)',
        forbiddenTenses: ['imperative']
      },
      'agredir': {
        type: 'defective_imperative',
        description: 'No admite imperativo (verbo defectivo)',
        forbiddenTenses: ['imperative']
      },
      'empedernir': {
        type: 'defective_imperative',
        description: 'No admite imperativo (verbo defectivo)',
        forbiddenTenses: ['imperative'] 
      },
      'desvaír': {
        type: 'defective_imperative',
        description: 'No admite imperativo (verbo defectivo)',
        forbiddenTenses: ['imperative']
      },
      // Verbos que solo se conjugan en tercera persona
      'concernir': {
        type: 'third_person_only',
        description: 'Solo se conjuga en tercera persona',
        allowedPersons: ['3s', '3p']
      },
      'atañer': {
        type: 'third_person_only', 
        description: 'Solo se conjuga en tercera persona',
        allowedPersons: ['3s', '3p']
      },
      // Verbos meteorológicos (solo 3ª persona singular)
      'llover': {
        type: 'weather_verb',
        description: 'Verbo meteorológico, solo 3ª persona singular',
        allowedPersons: ['3s']
      },
      'nevar': {
        type: 'weather_verb',
        description: 'Verbo meteorológico, solo 3ª persona singular', 
        allowedPersons: ['3s']
      },
      'granizar': {
        type: 'weather_verb',
        description: 'Verbo meteorológico, solo 3ª persona singular',
        allowedPersons: ['3s']
      }
    }
  }

  validateDefectiveVerb(verb) {
    const errors = []
    const warnings = []

    const defectiveRule = this.defectiveVerbs[verb.lemma]
    if (!defectiveRule) return { errors, warnings }

    verb.paradigms?.forEach((paradigm, pIndex) => {
      paradigm.forms?.forEach((form, fIndex) => {
        // Verificar tiempos prohibidos
        if (defectiveRule.forbiddenTenses?.includes(form.mood)) {
          errors.push(
            `DEFECTIVO: ${verb.lemma} no debe tener formas de ${form.mood} ` +
            `(encontrado: ${form.value} en paradigma ${pIndex}, forma ${fIndex}). ` +
            `${defectiveRule.description}`
          )
        }

        // Verificar personas permitidas
        if (defectiveRule.allowedPersons && !defectiveRule.allowedPersons.includes(form.person)) {
          errors.push(
            `DEFECTIVO: ${verb.lemma} solo se conjuga en ${defectiveRule.allowedPersons.join(', ')} ` +
            `(encontrado: ${form.person} con valor "${form.value}"). ` +
            `${defectiveRule.description}`
          )
        }
      })
    })

    return { errors, warnings }
  }

  validateSemanticConsistency(verb) {
    const warnings = []
    
    // Detectar posibles problemas semánticos adicionales
    verb.paradigms?.forEach(paradigm => {
      paradigm.forms?.forEach(form => {
        // Verificar formas potencialmente sospechosas en verbos regulares
        if (verb.type === 'regular' && form.mood === 'imperative') {
          if (form.value.includes('*') || form.value.includes('?') || form.value === '') {
            warnings.push(`Forma imperativa sospechosa en verbo regular ${verb.lemma}: "${form.value}"`)
          }
        }

        // Detectar valores vacíos o marcadores de error
        if (!form.value || form.value.trim() === '' || form.value.includes('ERROR')) {
          warnings.push(`Forma con valor vacío o inválido en ${verb.lemma}: "${form.value}"`)
        }
      })
    })

    return warnings
  }

  validateVerb(verb) {
    const defectiveResults = this.validateDefectiveVerb(verb)
    const semanticWarnings = this.validateSemanticConsistency(verb)

    return {
      errors: defectiveResults.errors,
      warnings: [...defectiveResults.warnings, ...semanticWarnings]
    }
  }
}

// Función de validación rápida (solo errores críticos)
export function quickValidation() {
  const criticalErrors = []
  
  // Verificar que verbos básicos estén presentes
  const essentialVerbs = ['ser', 'estar', 'tener', 'hacer', 'ir']
  const verbSet = new Set(allVerbs.map(v => v.lemma))
  
  essentialVerbs.forEach(verb => {
    if (!verbSet.has(verb)) {
      criticalErrors.push(`Essential verb missing: ${verb}`)
    }
  })
  
  // Verificar que no haya verbos duplicados
  const lemmas = allVerbs.map(v => v.lemma)
  const duplicates = lemmas.filter((lemma, index) => lemmas.indexOf(lemma) !== index)
  
  if (duplicates.length > 0) {
    criticalErrors.push(`Duplicate verbs found: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  return {
    isValid: criticalErrors.length === 0,
    errors: criticalErrors
  }
}
