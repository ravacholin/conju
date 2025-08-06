import { normalize, normalizeInput } from './rules.js'

export function grade(input, expected, settings){
  // Normalize input with warnings (but keep accents)
  const { normalized: normalizedInput, warnings, wasCorrected } = normalizeInput(input)
  
  // Get all possible correct answers based on settings
  const candidates = new Set([expected.value, ...(expected.alt||[])])
  
  // Add alternative forms if not in strict mode
  if(!settings.strict){
    const a = expected.accepts||{}
    if(settings.useTuteo && a.tu) candidates.add(a.tu)
    if(settings.useVoseo && a.vos) candidates.add(a.vos)
    if(settings.useVosotros && a.vosotros) candidates.add(a.vosotros)
  }
  
  // For accent-sensitive comparison, normalize for case and whitespace only
  const normalizedCandidates = [...candidates].map(c => c.toLowerCase().trim())
  const normalizedInputCanon = normalizedInput.toLowerCase().trim()
  
  // Check for exact match (case-insensitive, whitespace-insensitive, but accent-sensitive)
  const correct = normalizedCandidates.includes(normalizedInputCanon)
  
  // Generate detailed feedback
  let feedback = null
  if (!correct) {
    feedback = generateFeedback(normalizedInputCanon, normalizedCandidates, settings, expected)
  }
  
  // Check if this is an accent error
  const isAccentError = feedback && feedback.includes('ERROR DE TILDE')
  
  return {
    correct,
    accepted: correct ? input : null,
    targets: [...candidates],
    note: feedback,
    warnings: wasCorrected ? warnings : null,
    isAccentError
  }
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
  
  // Check for pronoun-specific issues
  if (settings.region === 'rioplatense' && settings.useVoseo) {
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