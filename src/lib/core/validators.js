// Sistema de validación automática para Spanish Conjugator
import { getAllVerbs } from '../core/verbDataService.js'
import { getAllVerbsWithPriority } from '../../data/priorityVerbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:validators')


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
    
    // Acumuladores para detectar duplicados y formas truncadas
    const slotMap = new Map() // key: mood|tense|person -> [{value, pIndex, fIndex}]
    const exactMap = new Set() // key: mood|tense|person|value

    verb.paradigms.forEach((paradigm, pIndex) => {
      if (!paradigm.regionTags || !Array.isArray(paradigm.regionTags)) {
        errors.push(`Verb ${verb.lemma} paradigm ${pIndex} missing regionTags`)
      }
      
      if (!paradigm.forms || !Array.isArray(paradigm.forms)) {
        errors.push(`Verb ${verb.lemma} paradigm ${pIndex} missing forms`)
        return
      }
      
      // Verificar formas esenciales (con excepciones para verbos defectivos)
      const isDefectiveVerb = ['empedernir', 'desvaír', 'soler', 'abolir', 'agredir', 'blandir'].includes(verb.lemma)
      
      const requiredCombinations = [
        { mood: 'nonfinite', tense: 'inf', person: '' }
      ]
      
      // Los verbos defectivos no requieren formas de presente
      if (!isDefectiveVerb) {
        requiredCombinations.push(
          { mood: 'indicative', tense: 'pres', person: '1s' },
          { mood: 'indicative', tense: 'pres', person: '3s' }
        )
      }
      
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

        // 1) Duplicados: por slot y por coincidencia exacta
        const slotKey = `${form.mood}|${form.tense}|${form.person}`
        if (!slotMap.has(slotKey)) slotMap.set(slotKey, [])
        slotMap.get(slotKey).push({ value: form.value, pIndex, fIndex })

        const exactKey = `${slotKey}|${form.value}`
        if (exactMap.has(exactKey)) {
          warnings.push(`Duplicate form entry (exact) in ${verb.lemma}: ${slotKey} -> "${form.value}" (paradigm ${pIndex}, form ${fIndex})`)
        } else {
          exactMap.add(exactKey)
        }

        // 2) Formas truncadas: valor igual al lexema sin terminación (o con prefijo 'no ')
        try {
          if (typeof verb.lemma === 'string' && /(?:ar|er|ir)$/.test(verb.lemma)) {
            const stem = verb.lemma.slice(0, -2)
            const val = (form.value || '').trim().toLowerCase()
            // Allow a few known imperative 2s_tu short forms that equal the stem
            const allowedImperativeStem = new Map([
              ['venir', 'ven'],
              ['tener', 'ten'],
              ['poner', 'pon'],
              ['salir', 'sal']
            ])
            const isAllowedStemImperative = (
              form.mood === 'imperative' && form.tense === 'impAff' && form.person === '2s_tu' &&
              allowedImperativeStem.get(verb.lemma) === val
            )

            if (!isAllowedStemImperative) {
              if (val === stem || val === `no ${stem}`) {
                errors.push(`Truncated form detected in ${verb.lemma}: ${form.mood}|${form.tense}|${form.person} -> "${form.value}" (paradigm ${pIndex}, form ${fIndex})`)
              }
            }
          }
        } catch {/* ignore */}
      })
    })
    
    // Reportar duplicados por slot (múltiples valores para la misma combinación)
    for (const [slotKey, entries] of slotMap.entries()) {
      if (entries.length > 1) {
        const values = [...new Set(entries.map(e => e.value))]
        warnings.push(`Duplicate slot entries in ${verb.lemma}: ${slotKey} -> [${values.join(', ')}] (${entries.length} entries)`) 
      }
    }

    return { errors, warnings }
  }

  // Validar consistencia de conjugaciones (MEJORADO: todas las formas regulares)
  validateConjugationConsistency(verb) {
    const warnings = []
    
    if (verb.type === 'regular') {
      // Para verbos regulares, verificar todas las formas contra patrones regulares
      const regularCombinations = [
        // Presente indicativo - todas las personas
        { mood: 'indicative', tense: 'pres', person: '1s' },
        { mood: 'indicative', tense: 'pres', person: '2s_tu' },
        { mood: 'indicative', tense: 'pres', person: '2s_vos' },
        { mood: 'indicative', tense: 'pres', person: '3s' },
        { mood: 'indicative', tense: 'pres', person: '1p' },
        { mood: 'indicative', tense: 'pres', person: '2p_vosotros' },
        { mood: 'indicative', tense: 'pres', person: '3p' },
        // Imperfecto indicativo - todas las personas
        { mood: 'indicative', tense: 'impf', person: '1s' },
        { mood: 'indicative', tense: 'impf', person: '2s_tu' },
        { mood: 'indicative', tense: 'impf', person: '2s_vos' },
        { mood: 'indicative', tense: 'impf', person: '3s' },
        { mood: 'indicative', tense: 'impf', person: '1p' },
        { mood: 'indicative', tense: 'impf', person: '2p_vosotros' },
        { mood: 'indicative', tense: 'impf', person: '3p' },
        // Pretérito indefinido - todas las personas
        { mood: 'indicative', tense: 'pretIndef', person: '1s' },
        { mood: 'indicative', tense: 'pretIndef', person: '2s_tu' },
        { mood: 'indicative', tense: 'pretIndef', person: '2s_vos' },
        { mood: 'indicative', tense: 'pretIndef', person: '3s' },
        { mood: 'indicative', tense: 'pretIndef', person: '1p' },
        { mood: 'indicative', tense: 'pretIndef', person: '2p_vosotros' },
        { mood: 'indicative', tense: 'pretIndef', person: '3p' },
        // Futuro indicativo - todas las personas
        { mood: 'indicative', tense: 'fut', person: '1s' },
        { mood: 'indicative', tense: 'fut', person: '2s_tu' },
        { mood: 'indicative', tense: 'fut', person: '2s_vos' },
        { mood: 'indicative', tense: 'fut', person: '3s' },
        { mood: 'indicative', tense: 'fut', person: '1p' },
        { mood: 'indicative', tense: 'fut', person: '2p_vosotros' },
        { mood: 'indicative', tense: 'fut', person: '3p' },
        // Condicional - todas las personas
        { mood: 'conditional', tense: 'cond', person: '1s' },
        { mood: 'conditional', tense: 'cond', person: '2s_tu' },
        { mood: 'conditional', tense: 'cond', person: '2s_vos' },
        { mood: 'conditional', tense: 'cond', person: '3s' },
        { mood: 'conditional', tense: 'cond', person: '1p' },
        { mood: 'conditional', tense: 'cond', person: '2p_vosotros' },
        { mood: 'conditional', tense: 'cond', person: '3p' },
        // Presente subjuntivo - todas las personas
        { mood: 'subjunctive', tense: 'subjPres', person: '1s' },
        { mood: 'subjunctive', tense: 'subjPres', person: '2s_tu' },
        { mood: 'subjunctive', tense: 'subjPres', person: '2s_vos' },
        { mood: 'subjunctive', tense: 'subjPres', person: '3s' },
        { mood: 'subjunctive', tense: 'subjPres', person: '1p' },
        { mood: 'subjunctive', tense: 'subjPres', person: '2p_vosotros' },
        { mood: 'subjunctive', tense: 'subjPres', person: '3p' },
        // IMPERFECTO SUBJUNTIVO - TODAS LAS PERSONAS (CLAVE!)
        { mood: 'subjunctive', tense: 'subjImpf', person: '1s' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '2s_tu' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '2s_vos' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '3s' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '1p' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '2p_vosotros' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '3p' },
        // Imperativo afirmativo - personas válidas
        { mood: 'imperative', tense: 'impAff', person: '2s_tu' },
        { mood: 'imperative', tense: 'impAff', person: '2s_vos' },
        { mood: 'imperative', tense: 'impAff', person: '3s' },
        { mood: 'imperative', tense: 'impAff', person: '1p' },
        { mood: 'imperative', tense: 'impAff', person: '2p_vosotros' },
        { mood: 'imperative', tense: 'impAff', person: '3p' }
      ];
      
      verb.paradigms?.forEach(paradigm => {
        paradigm.forms?.forEach(form => {
          const shouldValidate = regularCombinations.some(combo =>
            combo.mood === form.mood && 
            combo.tense === form.tense && 
            combo.person === form.person
          );
          
          if (shouldValidate) {
            const expected = this.getRegularForm(verb.lemma, form.mood, form.tense, form.person)
            if (expected && form.value !== expected) {
              warnings.push(`Regular verb ${verb.lemma} has irregular ${form.mood}|${form.tense}|${form.person}: ${form.value} (expected: ${expected})`)
            }
          }
        })
      })
    }
    
    return warnings
  }

  // Generar forma regular esperada (COMPLETO: todos los tiempos y personas)
  getRegularForm(lemma, mood, tense, person) {
    const stem = lemma.slice(0, -2);
    const ending = lemma.slice(-2);
    
    // PRESENTE INDICATIVO
    if (mood === 'indicative' && tense === 'pres') {
      const patterns = {
        'ar': { '1s': 'o', '2s_tu': 'as', '2s_vos': 'ás', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' },
        'er': { '1s': 'o', '2s_tu': 'es', '2s_vos': 'és', '3s': 'e', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en' },
        'ir': { '1s': 'o', '2s_tu': 'es', '2s_vos': 'ís', '3s': 'e', '1p': 'imos', '2p_vosotros': 'ís', '3p': 'en' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // IMPERFECTO INDICATIVO
    if (mood === 'indicative' && tense === 'impf') {
      const patterns = {
        'ar': { '1s': 'aba', '2s_tu': 'abas', '2s_vos': 'abas', '3s': 'aba', '1p': 'ábamos', '2p_vosotros': 'abais', '3p': 'aban' },
        'er': { '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía', '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían' },
        'ir': { '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía', '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // PRETÉRITO INDEFINIDO
    if (mood === 'indicative' && tense === 'pretIndef') {
      const patterns = {
        'ar': { '1s': 'é', '2s_tu': 'aste', '2s_vos': 'aste', '3s': 'ó', '1p': 'amos', '2p_vosotros': 'asteis', '3p': 'aron' },
        'er': { '1s': 'í', '2s_tu': 'iste', '2s_vos': 'iste', '3s': 'ió', '1p': 'imos', '2p_vosotros': 'isteis', '3p': 'ieron' },
        'ir': { '1s': 'í', '2s_tu': 'iste', '2s_vos': 'iste', '3s': 'ió', '1p': 'imos', '2p_vosotros': 'isteis', '3p': 'ieron' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // FUTURO INDICATIVO
    if (mood === 'indicative' && tense === 'fut') {
      const patterns = { '1s': 'é', '2s_tu': 'ás', '2s_vos': 'ás', '3s': 'á', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'án' };
      return patterns[person] ? lemma + patterns[person] : null;
    }
    
    // CONDICIONAL
    if (mood === 'conditional' && tense === 'cond') {
      const patterns = { '1s': 'ía', '2s_tu': 'ías', '2s_vos': 'ías', '3s': 'ía', '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían' };
      return patterns[person] ? lemma + patterns[person] : null;
    }
    
    // PRESENTE SUBJUNTIVO
    if (mood === 'subjunctive' && tense === 'subjPres') {
      const patterns = {
        'ar': { '1s': 'e', '2s_tu': 'es', '2s_vos': 'es', '3s': 'e', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en' },
        'er': { '1s': 'a', '2s_tu': 'as', '2s_vos': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' },
        'ir': { '1s': 'a', '2s_tu': 'as', '2s_vos': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // IMPERFECTO SUBJUNTIVO (subjImpf) - ¡CLAVE!
    if (mood === 'subjunctive' && tense === 'subjImpf') {
      const patterns = {
        'ar': { '1s': 'ara', '2s_tu': 'aras', '2s_vos': 'aras', '3s': 'ara', '1p': 'áramos', '2p_vosotros': 'arais', '3p': 'aran' },
        'er': { '1s': 'iera', '2s_tu': 'ieras', '2s_vos': 'ieras', '3s': 'iera', '1p': 'iéramos', '2p_vosotros': 'ierais', '3p': 'ieran' },
        'ir': { '1s': 'iera', '2s_tu': 'ieras', '2s_vos': 'ieras', '3s': 'iera', '1p': 'iéramos', '2p_vosotros': 'ierais', '3p': 'ieran' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // IMPERATIVO AFIRMATIVO
    if (mood === 'imperative' && tense === 'impAff') {
      const patterns = {
        'ar': { '2s_tu': 'a', '2s_vos': 'á', '3s': 'e', '1p': 'emos', '2p_vosotros': 'ad', '3p': 'en' },
        'er': { '2s_tu': 'e', '2s_vos': 'é', '3s': 'a', '1p': 'amos', '2p_vosotros': 'ed', '3p': 'an' },
        'ir': { '2s_tu': 'e', '2s_vos': 'í', '3s': 'a', '1p': 'amos', '2p_vosotros': 'id', '3p': 'an' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    // FORMAS NO FINITAS
    if (mood === 'nonfinite') {
      if (tense === 'inf') return lemma;
      if (tense === 'ger') {
        const patterns = { 'ar': 'ando', 'er': 'iendo', 'ir': 'iendo' };
        return patterns[ending] ? stem + patterns[ending] : null;
      }
      if (tense === 'part') {
        const patterns = { 'ar': 'ado', 'er': 'ido', 'ir': 'ido' };
        return patterns[ending] ? stem + patterns[ending] : null;
      }
    }
    
    return null;
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
export async function validateAllData() {
  logger.debug('🔍 INICIANDO VALIDACIÓN COMPLETA DE DATOS\n')
  
  const verbValidator = new VerbValidator()
  const semanticValidator = new SemanticValidator()
  const familyValidator = new FamilyValidator()
  const _patternValidator = new IrregularPatternValidator() // NUEVO
  const baseVerbs = await getAllVerbs({ ensureChunks: true })
  const allVerbs = getAllVerbsWithPriority(baseVerbs)
  
  let totalErrors = 0
  let totalWarnings = 0
  const problemVerbs = []
  
  // Validar todos los verbos
  logger.debug(`📚 Validando ${allVerbs.length} verbos...`)
  logger.debug(`🧠 Incluye validación semántica, verbos defectivos y patrones irregulares
`)
  
  allVerbs.forEach((verb, index) => {
    const structuralResults = verbValidator.validateVerb(verb)
    const semanticResults = semanticValidator.validateVerb(verb)
    // DESACTIVADO temporalmente: validación de patrones irregulares (reduce spam de advertencias)
    const patternWarnings = [] // verb.type === 'irregular' ? patternValidator.validateAllPatterns(verb) : []
    
    const allErrors = [...structuralResults.errors, ...semanticResults.errors]
    const allWarnings = [...structuralResults.warnings, ...semanticResults.warnings, ...patternWarnings]
    
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
  logger.debug(`
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
  logger.debug(`
📊 RESULTADOS DE VALIDACIÓN:
`)
  logger.debug(`✅ Verbos validados: ${allVerbs.length}`)
  logger.debug(`✅ Familias validadas: ${Object.keys(IRREGULAR_FAMILIES).length}`)
  logger.debug(`❌ Total errores: ${totalErrors}`)
  logger.debug(`⚠️  Total advertencias: ${totalWarnings}`)
  
  // Mostrar problemas más críticos
  if (totalErrors > 0) {
    logger.debug(`
🚨 ERRORES CRÍTICOS:
`)
    problemVerbs.filter(p => p.errors.length > 0).slice(0, 5).forEach(problem => {
      logger.debug(`  ${problem.verb}:
`)
      problem.errors.forEach(error => logger.debug(`    - ${error}`))
    })
    
    if (problemVerbs.filter(p => p.errors.length > 0).length > 5) {
      logger.debug(`    ... y ${problemVerbs.filter(p => p.errors.length > 0).length - 5} verbos más con errores`)
    }
  }
  
  if (totalWarnings > 0) {
    logger.debug(`
⚠️  ADVERTENCIAS:
`)
    problemVerbs.filter(p => p.warnings.length > 0).forEach(problem => {
      logger.debug(`  ${problem.verb}:
`)
      problem.warnings.forEach(warning => logger.debug(`    - ${warning}`))
    })
    
    familyProblems.filter(p => p.warnings.length > 0).forEach(problem => {
      logger.debug(`  Familia ${problem.family}:
`)
      problem.warnings.forEach(warning => logger.debug(`    - ${warning}`))
    })
  }
  
  // Estado general
  if (totalErrors === 0 && totalWarnings === 0) {
    logger.debug(`
🎉 ¡PERFECTO! Todos los datos pasaron la validación.
`)
  } else if (totalErrors === 0) {
    logger.debug(`
✅ Sin errores críticos. Solo advertencias menores.
`)
  } else {
    logger.debug(`
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

// NUEVO: Validador de patrones irregulares reales
export class IrregularPatternValidator {
  constructor() {
    this.patternRules = {
      // e→ie: pensar → pienso, piensas, piensa, pensamos, pensáis, piensan
      'DIPHT_E_IE': {
        expectedPattern: /e([^aeiou]*)$/,
        replacement: 'ie$1',
        affectedPersons: ['1s', '2s_tu', '3s', '3p'],
        tenses: ['pres']
      },
      
      // o→ue: dormir → duermo, duermes, duerme, dormimos, dormís, duermen  
      'DIPHT_O_UE': {
        expectedPattern: /o([^aeiou]*)$/,
        replacement: 'ue$1', 
        affectedPersons: ['1s', '2s_tu', '3s', '3p'],
        tenses: ['pres']
      },
      
      // e→i: pedir → pido, pides, pide, pedimos, pedís, piden
      'E_I_IR': {
        expectedPattern: /e([^aeiou]*)$/,
        replacement: 'i$1',
        affectedPersons: ['1s', '2s_tu', '3s', '3p'],
        tenses: ['pres', 'pretIndef', 'subjPres']
      },
      
      // -cer → -zo: vencer → venzo
      'ZO_VERBS': {
        expectedPattern: /c$/,
        replacement: 'z',
        affectedPersons: ['1s'],
        tenses: ['pres', 'subjPres']
      },
      
      // -iar → -ío: fiar → fío (con tilde)
      'IAR_VERBS': {
        expectedPattern: /i$/,
        replacement: 'í',
        affectedPersons: ['1s', '2s_tu', '3s', '3p'],
        tenses: ['pres']
      },
      
      // -uar → -úo: actuar → actúo (con tilde)
      'UAR_VERBS': {
        expectedPattern: /u$/,
        replacement: 'ú',
        affectedPersons: ['1s', '2s_tu', '3s', '3p'],
        tenses: ['pres']
      }
    };
  }

  validateVerbPattern(verb, familyId) {
    const warnings = [];
    const rule = this.patternRules[familyId];
    
    if (!rule) {
      return warnings;
    }

    const stem = verb.lemma.slice(0, -2);
    
    // Verificar si el stem tiene el patrón esperado
    if (!rule.expectedPattern.test(stem)) {
      warnings.push(`Verb ${verb.lemma} in family ${familyId} doesn't match expected stem pattern`);
      return warnings;
    }

    verb.paradigms?.forEach(paradigm => {
      paradigm.forms?.forEach(form => {
        // Solo verificar combinaciones relevantes
        const shouldHaveIrregularity = 
          rule.affectedPersons.includes(form.person) && 
          rule.tenses.includes(form.tense) &&
          form.mood === 'indicative';

        if (shouldHaveIrregularity) {
          const expectedStem = stem.replace(rule.expectedPattern, rule.replacement);
          const expectedForm = this.buildExpectedForm(expectedStem, verb.lemma, form.person, form.tense);
          
          if (expectedForm && form.value !== expectedForm) {
            warnings.push(`Verb ${verb.lemma} (${familyId}): expected irregular form "${expectedForm}" but found "${form.value}" for ${form.person}|${form.tense}`);
          }
        }
      });
    });

    return warnings;
  }

  buildExpectedForm(stem, lemma, person, tense) {
    const ending = lemma.slice(-2);
    
    if (tense === 'pres') {
      const patterns = {
        'ar': { '1s': 'o', '2s_tu': 'as', '3s': 'a', '3p': 'an' },
        'er': { '1s': 'o', '2s_tu': 'es', '3s': 'e', '3p': 'en' },
        'ir': { '1s': 'o', '2s_tu': 'es', '3s': 'e', '3p': 'en' }
      };
      return patterns[ending]?.[person] ? stem + patterns[ending][person] : null;
    }
    
    return null;
  }

  validateAllPatterns(verb) {
    const warnings = [];
    
    // Solo validar patrones que realmente aplican al verbo
    const relevantPatterns = this.detectRelevantPatterns(verb);
    
    for (const familyId of relevantPatterns) {
      const patternWarnings = this.validateVerbPattern(verb, familyId);
      warnings.push(...patternWarnings);
    }
    
    return warnings;
  }

  detectRelevantPatterns(verb) {
    const stem = verb.lemma.slice(0, -2);
    const relevantPatterns = [];
    
    // Solo verificar patrones que tienen sentido para este verbo
    if (/e[^aeiou]*$/.test(stem)) {
      relevantPatterns.push('DIPHT_E_IE', 'E_I_IR');
    }
    if (/o[^aeiou]*$/.test(stem)) {
      relevantPatterns.push('DIPHT_O_UE');
    }
    if (verb.lemma.endsWith('cer') || verb.lemma.endsWith('cir')) {
      relevantPatterns.push('ZO_VERBS');
    }
    if (verb.lemma.endsWith('iar')) {
      relevantPatterns.push('IAR_VERBS');
    }
    if (verb.lemma.endsWith('uar')) {
      relevantPatterns.push('UAR_VERBS');
    }
    
    return relevantPatterns;
  }
}

// Función de validación rápida (solo errores críticos)
export async function quickValidation() {
  const criticalErrors = []
  const baseVerbs = await getAllVerbs({ ensureChunks: true })
  const allVerbs = getAllVerbsWithPriority(baseVerbs)
  
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
