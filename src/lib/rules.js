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

// Basic canonicalization
export function normalize(s){
  return s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}+/gu,'') // strip combining marks
    .replace(/\s+/g,' ').trim()
} 