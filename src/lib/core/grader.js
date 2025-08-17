import { normalizeInput } from './rules.js'
import { normalize } from './conjugationRules.js'

export function grade(input, expected, settings){
  const startTs = Date.now()
  
  // Debug only if there are issues
  // console.log('🔍 GRADER DEBUG - Input parameters:', {input, expected, settings})
  
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
  
  // Add alternative forms based on dialect settings
  // IMPORTANT: Always add dialect-specific forms regardless of strict mode
  // When a specific dialect is selected, those forms should be accepted
  const a = expected.accepts||{}
  if(settings.useTuteo && a.tu) candidates.add(a.tu)
  if(settings.useVoseo && a.vos) candidates.add(a.vos)
  if(settings.useVosotros && a.vosotros) candidates.add(a.vosotros)
  
  // Add additional alternative forms only if not in strict mode
  if(!settings.strict){
    // Additional alt forms beyond dialect variants
    // (this is for other types of alternatives, not dialect-specific ones)
  }
  
  // Accent policy by level
  const accentPolicy = settings.accentTolerance || 'warn' // 'accept' (A1), 'warn' (A2/B1), 'strict' (B2+)
  const stripAccents = (s)=> s.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
  const norm = (s)=> s.toLowerCase().trim()
  
  // CORRECCIÓN: Detectar errores de tilde ANTES de aplicar política de acentos
  const normalizedInputStrict = norm(normalizedInput)
  const candidatesStrict = [...candidates].map(c => norm(c))
  const isAccentOnlyError = !candidatesStrict.includes(normalizedInputStrict) && 
                           candidatesStrict.some(c => norm(stripAccents(c)) === norm(stripAccents(normalizedInput)))
  
  // Aplicar política de acentos para determinar corrección
  const normalizedCandidates = [...candidates].map(c => norm(accentPolicy==='accept' ? stripAccents(c) : c))
  const normalizedInputCanon = norm(accentPolicy==='accept' ? stripAccents(normalizedInput) : normalizedInput)
  const correct = normalizedCandidates.includes(normalizedInputCanon)
  
  // Manejo especial para A1: aceptar pero informar sobre tilde
  if (accentPolicy === 'accept' && isAccentOnlyError) {
    return {
      correct: true,
      accepted: input,
      targets: [...candidates],
      note: 'A1: acento no estricto (aceptado) — revisá la tilde',
      warnings: wasCorrected ? warnings : null,
      isAccentError: false
    }
  }
  
  // Generate detailed feedback para casos incorrectos
  let feedback = null
  if (!correct) {
    feedback = generateFeedback(normalizedInputCanon, normalizedCandidates, settings, expected)
  }
  
  // Check if this is an accent error
  const isAccentError = feedback && feedback.includes('ERROR DE TILDE')

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
  if (!correct && feedback === undefined) {
    console.warn('⚠️ GRADER WARNING: Generated undefined feedback for incorrect answer, using fallback')
    feedback = '❌ Forma incorrecta. Revisa la conjugación y los acentos.'
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
  // console.log('🔍 GRADER DEBUG - Final result:', {correct: result.correct, note: result.note})
  
  return result
}

function generateFeedback(input, correctAnswers, settings, expected) {
  // Check for accent issues by comparing forms without accents
  const inputWithoutAccents = input.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
  const accentIssues = correctAnswers.filter(ans => {
    const ansWithoutAccents = ans.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    return ansWithoutAccents === inputWithoutAccents && ans !== input
  })
  
  if (accentIssues.length > 0) {
    return `⚠️ ERROR DE TILDE: Tu respuesta "${input}" está bien escrita pero le falta la tilde. La forma correcta es "${accentIssues[0]}"`
  }

  // Removed enforcement of -ra/-se variant per request
  
  // Check for pronoun-specific issues
  if (settings.region === 'rioplatense' && settings.useVoseo && !settings.neutralizePronoun) {
    // Check if user wrote tú form instead of vos form
    const tuVosPairs = {
      'escribes': 'escribís',
      'comes': 'comés', 
      'vives': 'vivís',
      'vales': 'valés',
      'hablas': 'hablás',
      'necesitas': 'necesitás',
      'ayudas': 'ayudás',
      'buscas': 'buscás',
      'compras': 'comprás',
      'llegas': 'llegás'
    }
    
    if (tuVosPairs[input]) {
      return `⚠️ USO DE "TÚ" EN RIO PLATENSE: Usaste la forma de "tú" ("${input}") pero en español rioplatense se usa "vos". La forma correcta es "${tuVosPairs[input]}"`
    }
  }
  
  // Check for general form issues
  if (input.length < 3) {
    return 'La respuesta es muy corta. Revisa la forma verbal.'
  }
  
  // Check for common spelling mistakes
  const commonMistakes = {
    'escribis': 'escribís',
    'comis': 'comés', 
    'vivis': 'vivís',
    'valis': 'valés',
    'hablis': 'hablás',
    'necesitis': 'necesitás',
    'ayudis': 'ayudás',
    'buscis': 'buscás',
    'compris': 'comprás',
    'llegis': 'llegás'
  }
  
  if (commonMistakes[input]) {
    return `⚠️ ERROR DE TILDE: Te faltó la tilde. La forma correcta es "${commonMistakes[input]}"`
  }
  
  return '❌ Forma incorrecta. Revisa la conjugación y los acentos.'
} 