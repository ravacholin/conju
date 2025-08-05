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
  
  return {
    correct,
    accepted: correct ? input : null,
    targets: [...candidates],
    note: feedback,
    warnings: wasCorrected ? warnings : null
  }
}

function generateFeedback(input, correctAnswers, settings, expected) {
  // Check for accent issues by comparing forms without accents
  const inputWithoutAccents = input.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
  const hasAccentIssue = correctAnswers.some(ans => {
    const ansWithoutAccents = ans.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    return ansWithoutAccents === inputWithoutAccents && ans !== input
  })
  
  if (hasAccentIssue) {
    return 'Te faltó la tilde. Revisa los acentos.'
  }
  
  // Check for pronoun-specific issues
  if (settings.region === 'rioplatense' && settings.useVoseo) {
    // Check if user wrote tú form instead of vos form
    const tuForms = ['escribes', 'comes', 'vives', 'vales', 'hablas']
    const vosForms = ['escribis', 'comes', 'vivis', 'vales', 'hablas']
    
    const tuIndex = tuForms.indexOf(input)
    if (tuIndex !== -1) {
      return `En español rioplatense se usa "vos". La forma correcta es "${vosForms[tuIndex]}"`
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
    'hablis': 'hablás'
  }
  
  if (commonMistakes[input]) {
    return `Te faltó la tilde. La forma correcta es "${commonMistakes[input]}"`
  }
  
  return 'Forma incorrecta. Revisa la conjugación.'
} 