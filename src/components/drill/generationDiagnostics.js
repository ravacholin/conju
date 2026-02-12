const REASON_SUGGESTION_MAP = {
  specific_practice_constraints: [{ id: 'switch-to-mixed', recommended: true }],
  verb_type_filter: [{ id: 'verb-type-all', recommended: true }],
  pedagogical_preterite_filter: [
    { id: 'clear-family', recommended: true },
    { id: 'verb-type-all', recommended: false }
  ],
  family_theme_filter: [{ id: 'clear-family', recommended: true }],
  pronoun_region_filter: [{ id: 'pronoun-all', recommended: true }],
  level_gate_filter: [{ id: 'switch-to-mixed', recommended: true }]
}

const SUGGESTION_CATALOG = {
  'switch-to-mixed': {
    id: 'switch-to-mixed',
    label: 'Cambiar a modo mixto',
    reason: 'Tu configuración específica puede dejar sin formas elegibles.'
  },
  'switch-theme-to-mixed': {
    id: 'switch-theme-to-mixed',
    label: 'Salir de modo tema',
    reason: 'El tema elegido puede ser muy restrictivo.'
  },
  'verb-type-all': {
    id: 'verb-type-all',
    label: 'Usar todos los verbos',
    reason: 'Amplía el pool disponible.'
  },
  'clear-family': {
    id: 'clear-family',
    label: 'Quitar familia irregular',
    reason: 'Quita un filtro de familia que puede vaciar el pool.'
  },
  'pronoun-all': {
    id: 'pronoun-all',
    label: 'Ampliar pronombres',
    reason: 'Permite más personas gramaticales.'
  }
}

const REASON_DETAIL_MAP = {
  specific_practice_constraints: 'No hay formas para el modo específico elegido.',
  verb_type_filter: 'El filtro de tipo de verbo dejó sin opciones al ejercicio.',
  pedagogical_preterite_filter: 'El filtro pedagógico de pretérito dejó el pool vacío.',
  family_theme_filter: 'La familia irregular seleccionada no tiene formas disponibles.',
  pronoun_region_filter: 'Los pronombres/dialecto activos no tienen formas elegibles.',
  level_gate_filter: 'El nivel actual bloqueó todas las combinaciones disponibles.'
}

const mergeSuggestion = (suggestions, suggestionId, recommended) => {
  const existing = suggestions.find((item) => item.id === suggestionId)
  if (existing) {
    existing.recommended = existing.recommended || recommended
    return
  }
  const base = SUGGESTION_CATALOG[suggestionId]
  if (!base) return
  suggestions.push({ ...base, recommended })
}

export function buildGenerationSuggestions(settings = {}, filteringReport = null) {
  const suggestions = []
  const causalSuggestions = REASON_SUGGESTION_MAP[filteringReport?.emptyReason] || []

  causalSuggestions.forEach((suggestion) => {
    mergeSuggestion(suggestions, suggestion.id, suggestion.recommended === true)
  })

  if (settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense) {
    mergeSuggestion(suggestions, 'switch-to-mixed', suggestions.length === 0)
  }

  if (settings.practiceMode === 'theme') {
    mergeSuggestion(suggestions, 'switch-theme-to-mixed', suggestions.length === 0)
  }

  if (settings.verbType && settings.verbType !== 'all') {
    mergeSuggestion(suggestions, 'verb-type-all', suggestions.length === 0)
  }

  if (settings.selectedFamily) {
    mergeSuggestion(suggestions, 'clear-family', false)
  }

  if (settings.practicePronoun && settings.practicePronoun !== 'all' && settings.practicePronoun !== 'mixed') {
    mergeSuggestion(suggestions, 'pronoun-all', false)
  }

  return suggestions
}

export function buildGenerationDetail(totalForms = 0, filteringReport = null) {
  if (filteringReport?.emptyReason && REASON_DETAIL_MAP[filteringReport.emptyReason]) {
    return REASON_DETAIL_MAP[filteringReport.emptyReason]
  }
  return totalForms === 0
    ? 'No se pudieron cargar formas para tu región.'
    : 'No hay formas que cumplan la configuración actual.'
}
