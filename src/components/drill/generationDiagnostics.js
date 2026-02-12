export function buildGenerationSuggestions(settings = {}) {
  const suggestions = []

  if (settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense) {
    suggestions.push({
      id: 'switch-to-mixed',
      label: 'Cambiar a modo mixto',
      reason: 'Tu configuración específica puede dejar sin formas elegibles.',
      recommended: true
    })
  }

  if (settings.practiceMode === 'theme') {
    suggestions.push({
      id: 'switch-theme-to-mixed',
      label: 'Salir de modo tema',
      reason: 'El tema elegido puede ser muy restrictivo.',
      recommended: suggestions.length === 0
    })
  }

  if (settings.verbType && settings.verbType !== 'all') {
    suggestions.push({
      id: 'verb-type-all',
      label: 'Usar todos los verbos',
      reason: 'Amplía el pool disponible.',
      recommended: suggestions.length === 0
    })
  }

  if (settings.selectedFamily) {
    suggestions.push({
      id: 'clear-family',
      label: 'Quitar familia irregular',
      reason: 'Quita un filtro de familia que puede vaciar el pool.',
      recommended: false
    })
  }

  if (settings.practicePronoun && settings.practicePronoun !== 'all' && settings.practicePronoun !== 'mixed') {
    suggestions.push({
      id: 'pronoun-all',
      label: 'Ampliar pronombres',
      reason: 'Permite más personas gramaticales.',
      recommended: false
    })
  }

  return suggestions
}

export function buildGenerationDetail(totalForms = 0) {
  return totalForms === 0
    ? 'No se pudieron cargar formas para tu región.'
    : 'No hay formas que cumplan la configuración actual.'
}
