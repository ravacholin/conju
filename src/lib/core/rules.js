export const RULE = {
  REG_AR_PRES: 'REG_AR_PRES',
  REG_ER_PRES: 'REG_ER_PRES',
  REG_IR_PRES: 'REG_IR_PRES',
  REG_PRET_INDEF_AR: 'REG_PRET_INDEF_AR',
  STEM_E_IE: 'STEM_E_IE',
  VOSEO_PRESENT_STRESS: 'VOSEO_PRESENT_STRESS',
  VOSEO_IMP_AFF: 'VOSEO_IMP_AFF',
  VOSEO_NEG_RIOMATCH: 'VOSEO_NEG_RIOMATCH',
  FUT_ROOT_VENDR: 'FUT_ROOT_VENDR'
}

// Enhanced input normalization with warnings
export function normalizeInput(input) {
  const original = input
  let normalized = input
  
  // Trim whitespace
  normalized = normalized.trim()
  
  // Convert to lowercase
  normalized = normalized.toLowerCase()
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ')
  
  // Generate warnings for corrections
  const warnings = []
  
  if (original !== normalized) {
    if (original.trim() !== input.trim()) {
      warnings.push('Se eliminaron espacios extra')
    }
    if (original.toLowerCase() !== input.toLowerCase()) {
      warnings.push('Se convirtió a minúsculas')
    }
  }
  
  return {
    normalized,
    warnings,
    wasCorrected: warnings.length > 0
  }
}

// Re-export from centralized accent utils
export { normalize } from '../utils/accentUtils.js' 