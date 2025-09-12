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
  const { level, region, practiceMode, cameFromTema, specificMood, specificTense } = settings || {};
  const allowedPersons = getAllowedPersonsForRegion(region);
  const enforceCurriculumLevel = !(practiceMode === 'specific' && cameFromTema === true) && practiceMode !== 'theme';
  const allowedCombos = enforceCurriculumLevel ? getAllowedCombosForLevel(level || 'A1') : null;
  const enforceSelection = practiceMode === 'specific' && cameFromTema !== true;

  return forms.filter(f => {
    // Filter by allowed persons for region
    if (f.mood !== 'nonfinite' && allowedPersons && !allowedPersons.has(f.person)) return false;
    
    // Filter by curriculum level
    if (enforceCurriculumLevel) {
      if (!allowedCombos || !allowedCombos.has(`${f.mood}|${f.tense}`)) return false;
    }

    // For specific practice (not from theme), respect the chosen mood/tense
    if (enforceSelection) {
      if (specificMood && f.mood !== specificMood) return false;
      if (specificTense && f.tense !== specificTense) return false;
    }
    
    // CRITICAL FIX: Filter by individual form region attribute
    // Forms with "region": "es" should be available for all regions (universal forms)
    // Only filter out if form has a specific region that conflicts with user's region
    if (f.region && f.region !== 'es' && region) {
      const regionMapping = {
        'rioplatense': ['rioplatense', 'es'], 
        'la_general': ['la_general', 'es'],
        'peninsular': ['peninsular', 'es']
      };
      const allowedRegions = regionMapping[region] || [region, 'es'];
      if (!allowedRegions.includes(f.region)) {
        return false;
      }
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
