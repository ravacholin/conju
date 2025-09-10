import { LEVELS } from '../data/levels.js';

export function getAllowedCombosForLevel(level) {
  if (!level) return new Set();

  if (level === 'ALL') {
    const allCombos = new Set();
    Object.values(LEVELS).forEach(levelConfig => {
      levelConfig.inventory.forEach(combo => {
        allCombos.add(`${combo.mood}|${combo.tense}`);
      });
    });
    return allCombos;
  }

  if (LEVELS[level]) {
    return new Set(LEVELS[level].inventory.map(g => `${g.mood}|${g.tense}`));
  }

  return new Set();
}

export function getAllowedPersonsForRegion(region) {
  const ALL = new Set(['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p']);
  if (region === 'rioplatense') {
    return new Set(['1s','2s_vos','3s','1p','3p']);
  }
  if (region === 'la_general') {
    return new Set(['1s','2s_tu','3s','1p','3p']);
  }
  if (region === 'peninsular') {
    return new Set(['1s','2s_tu','3s','1p','2p_vosotros','3p']);
  }
  return ALL;
}

export function gateFormsByCurriculumAndDialect(forms, settings) {
  const { level, region, practiceMode, cameFromTema } = settings || {};
  const allowedPersons = getAllowedPersonsForRegion(region);
  const enforceCurriculumLevel = !(practiceMode === 'specific' && cameFromTema === true) && practiceMode !== 'theme';
  const allowedCombos = enforceCurriculumLevel ? getAllowedCombosForLevel(level || 'A1') : null;

  return forms.filter(f => {
    if (f.mood !== 'nonfinite' && allowedPersons && !allowedPersons.has(f.person)) return false;
    if (enforceCurriculumLevel) {
      if (!allowedCombos || !allowedCombos.has(`${f.mood}|${f.tense}`)) return false;
    }
    return true;
  });
}

export function gateDueItemsByCurriculum(dueItems, settings) {
  const { level, practiceMode, cameFromTema } = settings || {};
  if (practiceMode === 'specific' && cameFromTema === true) return dueItems;
  const allowedCombos = getAllowedCombosForLevel(level || 'A1');
  return (dueItems || []).filter(dc => allowedCombos.has(`${dc.mood}|${dc.tense}`));
}