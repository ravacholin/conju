import { LEVELS } from '../data/levels.js';
import gates from '../../data/curriculum.json'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:curriculumGate')


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

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

let firstLevelByCombo = null;

/**
 * The earliest CEFR level at which a mood/tense combo is introduced.
 * Accepts canonical or Spanish/long keys, same as the rest of this module.
 *
 * @returns {string|null} e.g. 'A2', or null when the combo is not in the curriculum
 */
export function getFirstLevelForCombo(mood, tense) {
  if (!firstLevelByCombo) {
    firstLevelByCombo = new Map();
    gates.forEach(g => {
      const key = `${canonicalizeMood(g.mood)}|${canonicalizeTense(g.tense)}`;
      const known = firstLevelByCombo.get(key);
      if (!known || LEVEL_ORDER.indexOf(g.level) < LEVEL_ORDER.indexOf(known)) {
        firstLevelByCombo.set(key, g.level);
      }
    });
  }
  return firstLevelByCombo.get(`${canonicalizeMood(mood)}|${canonicalizeTense(tense)}`) || null;
}

export function getAllowedCombosForLevel(level) {
  if (!level) return new Set();
  // Build list with canonicalized mood/tense to match forms dataset
  const canonPairs = gates.map(g => `${canonicalizeMood(g.mood)}|${canonicalizeTense(g.tense)}`);
  if (level === 'ALL') {
    return new Set(canonPairs);
  }
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const maxIdx = order.indexOf(level);
  if (maxIdx === -1) return new Set();
  const set = new Set(
    gates
      .filter(g => order.indexOf(g.level) <= maxIdx)
      .map(g => `${canonicalizeMood(g.mood)}|${canonicalizeTense(g.tense)}`)
  );
  return set;
}

export function getAllowedPersonsForRegion(region, { useVoseo = false, useVosotros = false } = {}) {
  const ALL = new Set(['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']);
  if (region === 'rioplatense') {
    // Rioplatense: vos only (no tú, no vosotros)
    return new Set(['1s', '2s_vos', '3s', '1p', '3p']);
  }
  if (region === 'peninsular') {
    // Spain: tú + vosotros (no vos)
    return new Set(['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p']);
  }
  if (region === 'la_general') {
    // Latin America base: tú only, unless flags enable more
    const persons = new Set(['1s', '2s_tu', '3s', '1p', '3p']);
    if (useVoseo) persons.add('2s_vos');
    if (useVosotros) persons.add('2p_vosotros');
    return persons;
  }
  return ALL;
}

// Collect the `mood|tense` combos a runtime block targets, from either its
// `combos` (mood/tense pairs) or its `cells` (mood/tense/person triples).
function collectBlockCombos(currentBlock) {
  const combos = new Set();
  if (!currentBlock) return combos;
  if (Array.isArray(currentBlock.combos)) {
    for (const c of currentBlock.combos) {
      if (c && c.mood && c.tense) combos.add(`${c.mood}|${c.tense}`);
    }
  }
  if (Array.isArray(currentBlock.cells)) {
    for (const c of currentBlock.cells) {
      if (c && c.mood && c.tense) combos.add(`${c.mood}|${c.tense}`);
    }
  }
  return combos;
}

export function gateFormsByCurriculumAndDialect(forms, settings) {
  const { level, region, useVoseo, useVosotros, practiceMode, cameFromTema, specificMood, specificTense, currentBlock } = settings || {};
  const allowedPersons = getAllowedPersonsForRegion(region, { useVoseo, useVosotros });

  // Debug logging for regional filtering issues
  if (import.meta.env.DEV && region && region !== 'global') {
    const allowedPersonsArray = Array.from(allowedPersons);
    logger.debug(`🌍 Regional filtering active:`, {
      region,
      level,
      allowedPersons: allowedPersonsArray,
      totalForms: forms.length
    });
  }

  const enforceCurriculumLevel = practiceMode !== 'specific' && practiceMode !== 'theme';
  // Progress-module micro-drills ("Practicar esto", error heatmap, difficult verbs)
  // run in 'mixed' mode but target a specific mood/tense through `currentBlock`.
  // Those combos come straight from the learner's mistakes, so they can sit ABOVE
  // the current level. The curriculum gate must not strip them, or the pool empties
  // out and the drill falls back to the broad mixed pool (presente regular et al.).
  // `applyLevelFilter` downstream still narrows the pool to exactly the block combos.
  const blockCombos = collectBlockCombos(currentBlock);
  let allowedCombos = enforceCurriculumLevel ? getAllowedCombosForLevel(level || 'A1') : null;
  if (allowedCombos && blockCombos.size > 0) {
    allowedCombos = new Set(allowedCombos);
    for (const combo of blockCombos) allowedCombos.add(combo);
  }
  const enforceSelection = practiceMode === 'specific' && cameFromTema !== true;
  const MIXED_COMBO_MAP = new Map([
    ['imperative|impMixed', new Set(['impAff', 'impNeg'])],
    ['nonfinite|nonfiniteMixed', new Set(['ger', 'part'])]
  ]);

  return forms.filter(f => {
    // Filter by allowed persons for region
    if (f.mood !== 'nonfinite' && allowedPersons && !allowedPersons.has(f.person)) return false;

    // Filter by curriculum level
    if (enforceCurriculumLevel) {
      if (!allowedCombos) return false;
      const directKey = `${f.mood}|${f.tense}`;
      if (!allowedCombos.has(directKey)) {
        const mixedEntry = [...MIXED_COMBO_MAP.entries()].find(([combo]) => allowedCombos.has(combo) && combo.startsWith(`${f.mood}|`));
        if (!mixedEntry) return false;
        const [, allowedTenses] = mixedEntry;
        if (!allowedTenses.has(f.tense)) return false;
      }
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
