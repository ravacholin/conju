import { normalizeInput } from './rules.js'
import { stripAccents, normalizeKeepAccents } from '../utils/accentUtils.js'

export function grade(input, expected, settings){
  const startTs = Date.now()
  
  // Debug only if there are issues
  // console.log(' GRADER DEBUG - Input parameters:', {input, expected, settings})
  
  // PARAMETER VALIDATION: Ensure we never fail silently
  if (!input || typeof input !== 'string') {
    console.error('❌ GRADER ERROR: Invalid input parameter:', input)
    return {
      correct: false,
      accepted: null,
      targets: ['Error: entrada inválida'],
      note: '❌ Error: entrada inválida. Revisa la consola para detalles.',
      warnings: null,
      isAccentError: false,
      ts: startTs
    }
  }
  
  if (!expected || typeof expected !== 'object' || !expected.value) {
    console.error('❌ GRADER ERROR: Invalid expected parameter:', expected)
    return {
      correct: false,
      accepted: null,
      targets: ['Error: forma esperada inválida'],
      note: '❌ Error: forma esperada inválida. Revisa la consola para detalles.',
      warnings: null,
      isAccentError: false,
      ts: startTs
    }
  }
  
  if (!settings || typeof settings !== 'object') {
    console.error('❌ GRADER ERROR: Invalid settings parameter:', settings)
    settings = {} // Use empty settings as fallback
  }
  
  // Normalize input with warnings (but keep accents)
  const { normalized: normalizedInput, warnings, wasCorrected } = normalizeInput(input)
  
  // Get all possible correct answers based on settings
  const candidates = new Set([expected.value, ...(expected.alt||[])])
  
  // CORRECIÓN CRÍTICA: Generar automáticamente formas alternativas -se para subjuntivo imperfecto y pluscuamperfecto
  // AMBAS FORMAS SON SIEMPRE CORRECTAS EN TODOS LOS NIVELES (A1-C2)
  if (expected.mood === 'subjunctive' && (expected.tense === 'subjImpf' || expected.tense === 'subjPlusc')) {
    const generateSubjunctiveAlternative = (form) => {
      if (typeof form !== 'string') return null
      
      // Transformaciones -ra <-> -se para subjuntivo imperfecto
      if (expected.tense === 'subjImpf') {
        // -ra -> -se
        if (form.endsWith('ara')) return form.replace(/ara$/, 'ase')
        if (form.endsWith('aras')) return form.replace(/aras$/, 'ases')
        if (form.endsWith('áramos')) return form.replace(/áramos$/, 'ásemos')
        if (form.endsWith('arais')) return form.replace(/arais$/, 'aseis')
        if (form.endsWith('aran')) return form.replace(/aran$/, 'asen')
        
        if (form.endsWith('iera')) return form.replace(/iera$/, 'iese')
        if (form.endsWith('ieras')) return form.replace(/ieras$/, 'ieses')
        if (form.endsWith('iéramos')) return form.replace(/iéramos$/, 'iésemos')
        if (form.endsWith('ierais')) return form.replace(/ierais$/, 'ieseis')
        if (form.endsWith('ieran')) return form.replace(/ieran$/, 'iesen')
        
        // irregular patterns without 'i': fuera->fuese, eras->eses, etc.
        if (form.endsWith('era')) return form.replace(/era$/, 'ese')
        if (form.endsWith('eras')) return form.replace(/eras$/, 'eses')
        if (form.endsWith('éramos')) return form.replace(/éramos$/, 'ésemos')
        if (form.endsWith('erais')) return form.replace(/erais$/, 'eseis')
        if (form.endsWith('eran')) return form.replace(/eran$/, 'esen')
        
        // -se -> -ra
        if (form.endsWith('ase')) return form.replace(/ase$/, 'ara')
        if (form.endsWith('ases')) return form.replace(/ases$/, 'aras')
        if (form.endsWith('ásemos')) return form.replace(/ásemos$/, 'áramos')
        if (form.endsWith('aseis')) return form.replace(/aseis$/, 'arais')
        if (form.endsWith('asen')) return form.replace(/asen$/, 'aran')
        
        if (form.endsWith('iese')) return form.replace(/iese$/, 'iera')
        if (form.endsWith('ieses')) return form.replace(/ieses$/, 'ieras')
        if (form.endsWith('iésemos')) return form.replace(/iésemos$/, 'iéramos')
        if (form.endsWith('ieseis')) return form.replace(/ieseis$/, 'ierais')
        if (form.endsWith('iesen')) return form.replace(/iesen$/, 'ieran')
        
        // reverse for irregular without 'i': fuese->fuera, ses->ras analog
        if (form.endsWith('ese')) return form.replace(/ese$/, 'era')
        if (form.endsWith('eses')) return form.replace(/eses$/, 'eras')
        if (form.endsWith('ésemos')) return form.replace(/ésemos$/, 'éramos')
        if (form.endsWith('eseis')) return form.replace(/eseis$/, 'erais')
        if (form.endsWith('esen')) return form.replace(/esen$/, 'eran')
      }
      
      // Para subjuntivo pluscuamperfecto: transformar la parte del auxiliar
      if (expected.tense === 'subjPlusc') {
        // hubiera -> hubiese y viceversa
        if (form.includes('hubiera ')) return form.replace('hubiera ', 'hubiese ')
        if (form.includes('hubieras ')) return form.replace('hubieras ', 'hubieses ')
        if (form.includes('hubiéramos ')) return form.replace('hubiéramos ', 'hubiésemos ')
        if (form.includes('hubierais ')) return form.replace('hubierais ', 'hubieseis ')
        if (form.includes('hubieran ')) return form.replace('hubieran ', 'hubiesen ')
        
        if (form.includes('hubiese ')) return form.replace('hubiese ', 'hubiera ')
        if (form.includes('hubieses ')) return form.replace('hubieses ', 'hubieras ')
        if (form.includes('hubiésemos ')) return form.replace('hubiésemos ', 'hubiéramos ')
        if (form.includes('hubieseis ')) return form.replace('hubieseis ', 'hubierais ')
        if (form.includes('hubiesen ')) return form.replace('hubiesen ', 'hubieran ')
      }
      
      return null
    }
    
    // Generar formas alternativas para value y todas las alt existentes
    const formsToTransform = [expected.value, ...(expected.alt||[])]
    for (const form of formsToTransform) {
      const alternative = generateSubjunctiveAlternative(form)
      if (alternative) {
        candidates.add(alternative)
      }
    }
  }
  
  // Add alternative forms based on dialect settings
  // IMPORTANT: Always add dialect-specific forms regardless of strict mode
  // When a specific dialect is selected, those forms should be accepted
  const a = expected.accepts||{}
  // Dialect alternatives are NOT applied in subjunctive (vos = tú)
  const allowDialectAlts = expected.mood !== 'subjunctive'
  if(settings.useTuteo && a.tu) candidates.add(a.tu)
  if(allowDialectAlts && settings.useVoseo && a.vos) candidates.add(a.vos)
  if(settings.useVosotros && a.vosotros) candidates.add(a.vosotros)
  
  // Add additional alternative forms only if not in strict mode
  if(!settings.strict){
    // Additional alt forms beyond dialect variants
    // (this is for other types of alternatives, not dialect-specific ones)
  }
  
  // UNIFIED ACCENT SYSTEM - Single point of truth
  const accentPolicy = settings.accentTolerance || 'warn' // 'accept' (A1), 'warn' (A2/B1), 'strict' (B2+), 'off'
  const norm = (s)=> normalizeKeepAccents(s)
  
  // Normalize all candidates and input
  const normalizedInputClean = norm(normalizedInput)
  const candidatesNormalized = [...candidates].map(c => norm(c))
  
  // SINGLE EVALUATION POINT - determine correctness based on accent policy
  let correct = false
  let feedback = null
  let isAccentError = false
  
  if (accentPolicy === 'off') {
    // No accent checking - compare without accents
    const inputNoAccents = stripAccents(normalizedInputClean)
    const candidatesNoAccents = candidatesNormalized.map(c => stripAccents(c))
    correct = candidatesNoAccents.includes(inputNoAccents)
  } else {
    // First check exact match (with accents)
    correct = candidatesNormalized.includes(normalizedInputClean)
    
    if (!correct) {
      // Check if it's only an accent error
      const inputNoAccents = stripAccents(normalizedInputClean)
      const candidatesNoAccents = candidatesNormalized.map(c => stripAccents(c))
      const isOnlyAccentError = candidatesNoAccents.includes(inputNoAccents)
      
      if (isOnlyAccentError) {
        isAccentError = true
        const correctForm = [...candidates].find(c => stripAccents(norm(c)) === inputNoAccents)
        
        if (accentPolicy === 'accept') {
          // A1: Accept but warn
          correct = true
          feedback = `A1: acento no estricto (aceptado) — revisá la tilde. Forma correcta: "${correctForm}"`
        } else if (accentPolicy === 'warn') {
          // A2/B1: Reject, but message is instructive
          correct = false
          feedback = `️ ERROR DE TILDE: Tu respuesta "${input}" está bien escrita pero le falta la tilde. La forma correcta es "${correctForm}"`
        } else {
          // B2+: Reject
          correct = false
          feedback = `️ ERROR DE TILDE: Tu respuesta "${input}" está bien escrita pero le falta la tilde. La forma correcta es "${correctForm}"`
        }
      }
    }
  }
  
  // Generate general feedback only if not already set by accent system
  if (!correct && !feedback) {
    feedback = generateGeneralFeedback(input, settings, expected)
  }

  // Dieresis enforcement (B2+)
  if (!correct && settings.requireDieresis) {
    const expectHasU = /g[uü](e|i)/i.test(expected.value)
    const expectNeedsDia = /g[u]e|g[u]i/i.test(expected.value) && /g[u]e|g[u]i/i.test(input) && !/gü(e|i)/i.test(input)
    if (expectHasU && expectNeedsDia) {
      return {
        correct: false,
        accepted: null,
        targets: [...candidates],
        note: 'Falta diéresis (ü) en güe/güi: revisá la ortografía',
        warnings: wasCorrected ? warnings : null,
        isAccentError: false
      }
    }
  }

  // Non-normative spellings (C1+): block "fué" etc.
  if (!correct && settings.blockNonNormativeSpelling) {
    // Penaliza "fué" y norma de "guion" en C2
    if (/fué/i.test(input)) {
      return {
        correct: false,
        accepted: null,
        targets: [...candidates],
        note: 'Grafía no normativa ("fué"). Debe ser "fue".',
        warnings: wasCorrected ? warnings : null,
        isAccentError: false
      }
    }
    if (settings.level === 'C2') {
      // Adoptamos "guion" como norma (sin tilde)
      if (/guión/i.test(input)) {
        return {
          correct: false,
          accepted: null,
          targets: [...candidates],
          note: 'Norma C2: usar "guion" (sin tilde).',
          warnings: wasCorrected ? warnings : null,
          isAccentError: false
        }
      }
    }
  }

  // Defectivos explícitos: "soler" no tiene imperativo (C1/C2 marcan, C2 duro)
  if (expected.lemma === 'soler' && expected.mood === 'imperative') {
    return {
      correct: false,
      accepted: null,
      targets: [...candidates],
      note: '“soler” no admite imperativo en español estándar',
      warnings: wasCorrected ? warnings : null,
      isAccentError: false
    }
  }

  // Clitic strictness (position and accent) basic checks when enabled
  if (!correct && settings.cliticStrictness !== 'off') {
    const val = normalizedInput
    const enclitic = /(me|te|se|lo|la|le|nos|los|las|les)+$/i.test(val.replace(/\s+/g,''))
    const isImpAff = expected.mood === 'imperative' && expected.tense === 'impAff'
    const isImpNeg = expected.mood === 'imperative' && expected.tense === 'impNeg'
    if (isImpAff && !enclitic && settings.cliticStrictness === 'high') {
      return {
        correct: false,
        accepted: null,
        targets: [...candidates],
        note: 'Imperativo afirmativo: clíticos enclíticos requeridos',
        warnings: wasCorrected ? warnings : null,
        isAccentError: false
      }
    }
    if (isImpNeg && enclitic && settings.cliticStrictness !== 'off') {
      return {
        correct: false,
        accepted: null,
        targets: [...candidates],
        note: 'Imperativo negativo: clíticos proclíticos (antes del verbo) requeridos',
        warnings: wasCorrected ? warnings : null,
        isAccentError: false
      }
    }
    // Heurística voseo 2s: 1 clítico → sin tilde; 2 clíticos → con tilde; C2 exigir regla
    if (isImpAff && expected.person === '2s_vos' && settings.level === 'C2') {
      const cl = (input.replace(/\s+/g,'').match(/(me|te|se|lo|la|le|nos|los|las|les)+$/i)||[''])[0]
      const clCount = (cl.match(/(me|te|se|lo|la|le|nos|los|las|les)/gi)||[]).length
      const hasTilde = /[áéíóúÁÉÍÓÚ]/.test(input)
      if (clCount === 1 && hasTilde) {
        return {
          correct: false,
          accepted: null,
          targets: [...candidates],
          note: 'C2: con un clítico en voseo 2ª sg. no lleva tilde (hablame, comeme, vivime).',
          warnings: wasCorrected ? warnings : null,
          isAccentError: true
        }
      }
      if (clCount >= 2 && !hasTilde) {
        return {
          correct: false,
          accepted: null,
          targets: [...candidates],
          note: 'C2: con dos clíticos en voseo 2ª sg. debe llevar tilde (hablámelo, comémelo, vivímelo).',
          warnings: wasCorrected ? warnings : null,
          isAccentError: true
        }
      }
    }
  }
  
  // FINAL VALIDATION: Only apply fallback for truly undefined feedback on incorrect answers
  // Generate positive feedback for correct answers
  if (correct && !feedback) {
    feedback = '¡Correcto!'
  }
  
  if (!correct && feedback === undefined) {
    console.warn('️ GRADER WARNING: Generated undefined feedback for incorrect answer, using fallback')
    const correctForm = expected.value || (expected.alt && expected.alt[0]) || 'la forma correcta'
    feedback = `❌ Forma incorrecta. La forma correcta es "${correctForm}"`
  }
  
  const result = {
    correct,
    accepted: correct ? input : null,
    targets: [...candidates],
    note: feedback,
    warnings: wasCorrected ? warnings : null,
    isAccentError,
    ts: startTs
  }
  
  // Debug only for problematic cases
  // console.log(' GRADER DEBUG - Final result:', {correct: result.correct, note: result.note})
  
  return result
}

function analyzeError(input, correctForm, expected) {
  // Normalizar para comparaciones ortográficas (sin tildes, minúsculas)
  const inNorm = stripAccents(normalizeKeepAccents(String(input || ''))).toLowerCase()
  const corrNorm = stripAccents(normalizeKeepAccents(String(correctForm || ''))).toLowerCase()
  // Stem-changing verbs: e.g., "pEnsar" -> "pIEnso"
  if (expected.tags?.includes('stem-e-ie') && inNorm.includes('e') && corrNorm.includes('ie')) {
    return `Ojo, este es un verbo con cambio de raíz (e → ie). La forma correcta es "${correctForm}".`;
  }
  if (expected.tags?.includes('stem-o-ue') && inNorm.includes('o') && corrNorm.includes('ue')) {
    return `Ojo, este es un verbo con cambio de raíz (o → ue). La forma correcta es "${correctForm}".`;
  }
  if (expected.tags?.includes('stem-e-i') && inNorm.includes('e') && corrNorm.includes('i')) {
    return `Ojo, este es un verbo con cambio de raíz (e → i). La forma correcta es "${correctForm}".`;
  }

  // Spelling changes: e.g., "saCar" -> "saQUé"
  if (expected.tags?.includes('spell-c-qu') && inNorm.endsWith('ce') && corrNorm.endsWith('que')) {
    return `Cuidado con el cambio ortográfico (c → qu). La forma correcta es "${correctForm}".`;
  }
  if (expected.tags?.includes('spell-g-gu') && inNorm.endsWith('ge') && corrNorm.endsWith('gue')) {
    return `Cuidado con el cambio ortográfico (g → gu). La forma correcta es "${correctForm}".`;
  }
  if (expected.tags?.includes('spell-z-c') && inNorm.endsWith('ze') && corrNorm.endsWith('ce')) {
    return `Cuidado con el cambio ortográfico (z → c). La forma correcta es "${correctForm}".`;
  }

  // Irregular preterites
  if (expected.tense === 'pret' && expected.tags?.includes('irregular')) {
    return `Este verbo tiene un pretérito irregular. La forma correcta es "${correctForm}".`;
  }

  return null; // No specific error found
}

function generateGeneralFeedback(input, settings, expected) {
  // Obtener la forma correcta esperada (primera opción disponible)
  const correctForm = expected.value || (expected.alt && expected.alt[0]) || 'la forma correcta'

  // 1. Check for pronoun-specific issues (tú/vos)
  if (
    settings.region === 'rioplatense' &&
    settings.useVoseo &&
    !settings.neutralizePronoun
  ) {
    const tuVosPairs = {
      'escribes': 'escribís', 'comes': 'comés', 'vives': 'vivís',
      'vales': 'valés', 'hablas': 'hablás', 'necesitas': 'necesitás',
      'ayudas': 'ayudás', 'buscas': 'buscás', 'compras': 'comprás', 'llegas': 'llegás'
    };
    if (
      tuVosPairs[input] && (
        (typeof expected?.person === 'string' && expected.person.startsWith('2s')) ||
        tuVosPairs[input] === correctForm
      )
    ) {
      return `️ USO DE "TÚ" EN RIO PLATENSE: Usaste la forma de "tú" ("${input}") pero en español rioplatense se usa "vos". La forma correcta es "${tuVosPairs[input]}"`;
    }
  }

  // 2. Analyze for common conjugation errors
  const specificError = analyzeError(input, correctForm, expected);
  if (specificError) {
    return specificError;
  }

  // 3. Check for general form issues
  if (input.length < 3) {
    return `La respuesta es muy corta. La forma correcta es "${correctForm}"`;
  }

  // 4. Default fallback: always show the correct form
  return `❌ Forma incorrecta. La forma correcta es "${correctForm}"`;
} 
