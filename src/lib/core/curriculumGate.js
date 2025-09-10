import { LEVELS } from '../data/levels.js';
import gates from '../../data/curriculum.json';

export function getAllowedCombosForLevel(level) {
  if (!level) return new Set();
  // Use curriculum.json (canonical) for mood/tense keys
  if (level === 'ALL') {
    return new Set(gates.map(g => `${g.mood}|${g.tense}`));
  }
  const order = ['A1','A2','B1','B2','C1','C2'];
  const maxIdx = order.indexOf(level);
  if (maxIdx === -1) return new Set();
  const set = new Set(
    gates
      .filter(g => order.indexOf(g.level) <= maxIdx)
      .map(g => `${g.mood}|${g.tense}`)
  );
  return set;
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
