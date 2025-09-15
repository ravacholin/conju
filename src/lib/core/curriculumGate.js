import { LEVELS } from '../data/levels.js';
import gates from '../../data/curriculum.json';

// Map curriculum mood keys (which may use Spanish labels) to the
// canonical internal mood tokens used in forms and across the app.
function canonicalizeMood(mood) {
  const map = {
    // Spanish → canonical (English)
    'indicativo': 'indicative',
    'subjuntivo': 'subjunctive',
    'imperativo': 'imperative',
    'condicional': 'conditional',
    // Already canonical or special
    'indicative': 'indicative',
    'subjunctive': 'subjunctive',
    'imperative': 'imperative',
    'conditional': 'conditional',
    'nonfinite': 'nonfinite'
  };
  return map[mood] || mood;
}

// Normalize tense keys from possible long/Spanish variants to canonical shorts
function canonicalizeTense(tense) {
  const map = {
    // Indicative longs → shorts
    'presente': 'pres',
    'preterito_perfecto_simple': 'pretIndef',
    'preterito_imperfecto': 'impf',
    'preterito_perfecto_compuesto': 'pretPerf',
    'preterito_pluscuamperfecto': 'plusc',
    'futuro_simple': 'fut',
    'futuro_compuesto': 'futPerf',
    // Subjunctive longs → shorts
    'presente_subjuntivo': 'subjPres',
    'imperfecto_subjuntivo': 'subjImpf',
    'preterito_perfecto_subjuntivo': 'subjPerf',
    'pluscuamperfecto_subjuntivo': 'subjPlusc',
    'futuro_subjuntivo': 'subjFut',
    'futuro_perfecto_subjuntivo': 'subjFutPerf',
    // Imperative longs → shorts
    'imperativo_afirmativo': 'impAff',
    'imperativo_negativo': 'impNeg',
    // Nonfinite Spanish → shorts (defensive)
    'gerundio': 'ger',
    'participio': 'part'
  };
  return map[tense] || tense;
}

export function getAllowedCombosForLevel(level) {
  if (!level) return new Set();
  // Build list with canonicalized mood/tense to match forms dataset
  const canonPairs = gates.map(g => `${canonicalizeMood(g.mood)}|${canonicalizeTense(g.tense)}`);
  if (level === 'ALL') {
    return new Set(canonPairs);
  }
  const order = ['A1','A2','B1','B2','C1','C2'];
  const maxIdx = order.indexOf(level);
  if (maxIdx === -1) return new Set();
  const set = new Set(
    gates
      .filter(g => order.indexOf(g.level) <= maxIdx)
      .map(g => `${canonicalizeMood(g.mood)}|${canonicalizeTense(g.tense)}`)
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
