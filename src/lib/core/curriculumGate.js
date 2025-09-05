import gates from '../../data/curriculum.json'

const LEVELS_ORDER = ['A1','A2','B1','B2','C1','C2','ALL']

export function levelOrder(level) {
  return LEVELS_ORDER.indexOf(level)
}

export function getAllowedCombosForLevel(level) {
  if (!level) return new Set()
  if (level === 'ALL') return new Set(gates.map(g => `${g.mood}|${g.tense}`))
  const maxIdx = levelOrder(level)
  return new Set(
    gates
      .filter(g => levelOrder(g.level) <= maxIdx)
      .map(g => `${g.mood}|${g.tense}`)
  )
}

export function getAllowedPersonsForRegion(region) {
  const ALL = new Set(['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p'])
  if (region === 'rioplatense') {
    // yo, vos, usted/él/ella, nosotros, ustedes/ellos
    return new Set(['1s','2s_vos','3s','1p','3p'])
  }
  if (region === 'la_general') {
    // yo, tú, usted/él/ella, nosotros, ustedes/ellos
    return new Set(['1s','2s_tu','3s','1p','3p'])
  }
  if (region === 'peninsular') {
    // yo, tú, usted/él/ella, nosotros, vosotros, ustedes/ellos
    return new Set(['1s','2s_tu','3s','1p','2p_vosotros','3p'])
  }
  return ALL
}

export function gateFormsByCurriculumAndDialect(forms, settings) {
  const { level, region, practiceMode, cameFromTema, specificMood, specificTense } = settings || {}
  // Always enforce dialectal persons
  const allowedPersons = getAllowedPersonsForRegion(region)
  // Enforce curriculum level restrictions unless practicing by theme (cameFromTema)
  const enforceCurriculumLevel = !(practiceMode === 'specific' && cameFromTema === true) && practiceMode !== 'theme'
  const allowedCombos = enforceCurriculumLevel ? getAllowedCombosForLevel(level || 'A1') : null

  return forms.filter(f => {
    // Persons gate (skip for nonfinite)
    if (f.mood !== 'nonfinite' && allowedPersons && !allowedPersons.has(f.person)) return false
    // Curriculum level gate (combos) - only when not practicing by theme
    if (enforceCurriculumLevel) {
      if (!allowedCombos || !allowedCombos.has(`${f.mood}|${f.tense}`)) return false
    }
    // CRITICAL FIX: Always enforce specific mood/tense selection for theme or specific practice
    // This should work for both 'theme' and 'specific' practice modes
    if (practiceMode === 'specific' || practiceMode === 'theme') {
      if (specificMood && f.mood !== specificMood) return false
      if (specificTense) {
        if (specificTense === 'impMixed') {
          if (!(f.mood === 'imperative' && (f.tense === 'impAff' || f.tense === 'impNeg'))) return false
        } else if (specificTense === 'nonfiniteMixed') {
          if (!(f.mood === 'nonfinite' && (f.tense === 'ger' || f.tense === 'part'))) return false
        } else if (f.tense !== specificTense) {
          return false
        }
      }
    }
    return true
  })
}

export function gateDueItemsByCurriculum(dueItems, settings) {
  const { level, practiceMode, cameFromTema } = settings || {}
  if (practiceMode === 'specific' && cameFromTema === true) return dueItems // by theme, allow all
  const allowedCombos = getAllowedCombosForLevel(level || 'A1')
  return (dueItems || []).filter(dc => allowedCombos.has(`${dc.mood}|${dc.tense}`))
}

