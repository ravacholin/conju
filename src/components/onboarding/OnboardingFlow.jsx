import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import './OnboardingFlow.css'
import PlacementTest from '../levels/PlacementTest.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'
import { getFamiliesForMood, getFamiliesForTense } from '../../lib/data/irregularFamilies.js'
import {
  getSimplifiedGroupsForMood,
  getSimplifiedGroupsForTense,
  shouldUseSimplifiedGroupingForMood,
  shouldUseSimplifiedGrouping,
} from '../../lib/data/simplifiedFamilyGroups.js'

/* ── Design tokens ── */
const ACCENT = 'var(--accent-primary)'
const INK    = 'var(--text)'
const INK2   = 'var(--muted)'
const INK3   = 'var(--border-strong)'
const LINE   = 'var(--border)'

/* ── Static option datasets ── */
const MOOD_OPTS = [
  { id: 'indicative',  label: 'indicativo',      tag: 'FINITAS',    gloss: 'hechos · hábitos · relato',   ex: 'yo hablo' },
  { id: 'subjunctive', label: 'subjuntivo',       tag: 'FINITAS',    gloss: 'hipótesis · deseo · matiz',   ex: 'yo hable' },
  { id: 'imperative',  label: 'imperativo',       tag: 'MANDATO',    gloss: 'órdenes',                     ex: 'tú habla / vos hablá' },
  { id: 'conditional', label: 'condicional',      tag: 'HIPÓTESIS',  gloss: 'consecuencia · cortesía',     ex: 'yo hablaría' },
  { id: 'nonfinite',   label: 'no conjugadas',    tag: 'NO FINITAS', gloss: 'inf · ger · part',            ex: 'hablando · hablado' },
]

const VERB_TYPE_OPTS = [
  { id: 'all',       label: 'todos',       tag: 'AMPLIO',  gloss: 'sin filtro',      ex: 'reg · irreg', ariaLabel: 'Seleccionar todos los verbos' },
  { id: 'regular',   label: 'regulares',   tag: 'SISTEMA', gloss: 'siguen la regla', ex: 'hablar · comer · vivir', ariaLabel: 'Seleccionar solo verbos regulares' },
  { id: 'irregular', label: 'irregulares', tag: 'TENSIÓN', gloss: 'casos duros',     ex: 'ser · estar · tener · ir', ariaLabel: 'Seleccionar solo verbos irregulares' },
]

const THEME_ROOT_MOOD_OPTS = new Set(['subjunctive', 'imperative'])

function buildThemeTopicOptions({ selectMood, selectTense, themeSubMenu, setThemeSubMenu }) {
  if (themeSubMenu === 'condicional') {
    return [
      {
        id: 'conditional-cond',
        label: 'condicional simple',
        tag: 'COND',
        gloss: 'condicional',
        ex: 'yo hablaría',
        onSelect: () => {
          selectMood('conditional', { navigate: false })
          selectTense('cond')
        }
      },
      {
        id: 'conditional-condPerf',
        label: 'condicional compuesto',
        tag: 'COND',
        gloss: 'condicional',
        ex: 'yo habría hablado',
        onSelect: () => {
          selectMood('conditional', { navigate: false })
          selectTense('condPerf')
        }
      }
    ]
  }

  if (themeSubMenu === 'futuro') {
    return [
      {
        id: 'indicative-fut',
        label: 'futuro simple',
        tag: 'FUT',
        gloss: 'indicativo',
        ex: 'yo hablaré',
        onSelect: () => {
          selectMood('indicative', { navigate: false })
          selectTense('fut')
        }
      },
      {
        id: 'indicative-futPerf',
        label: 'futuro compuesto',
        tag: 'FUT',
        gloss: 'indicativo',
        ex: 'yo habré hablado',
        onSelect: () => {
          selectMood('indicative', { navigate: false })
          selectTense('futPerf')
        }
      }
    ]
  }

  if (themeSubMenu === 'nonfinite') {
    return [
      {
        id: 'nonfinite-ger',
        label: 'gerundio',
        tag: 'NF',
        gloss: 'no finita',
        ex: 'hablando',
        onSelect: () => {
          selectMood('nonfinite', { navigate: false })
          selectTense('ger')
        }
      },
      {
        id: 'nonfinite-part',
        label: 'participio',
        tag: 'NF',
        gloss: 'no finita',
        ex: 'hablado',
        onSelect: () => {
          selectMood('nonfinite', { navigate: false })
          selectTense('part')
        }
      },
      {
        id: 'nonfinite-nonfiniteMixed',
        label: 'formas no finitas mixtas',
        tag: 'NF',
        gloss: 'no finita',
        ex: 'hablando / hablado',
        onSelect: () => {
          selectMood('nonfinite', { navigate: false })
          selectTense('nonfiniteMixed')
        }
      }
    ]
  }

  const buildDirectTenseOptions = (mood, tag) => getTensesForMood(mood)
    .filter(tense => mood !== 'indicative' || (tense !== 'fut' && tense !== 'futPerf'))
    .map(tense => {
      // Get friendly examples
      const getEx = (t) => {
        if (t === 'pres') return 'yo hablo'
        if (t === 'pretPerf') return 'he hablado'
        if (t === 'pretIndef') return 'yo hablé'
        if (t === 'impf') return 'yo hablaba'
        if (t === 'plusc') return 'yo había hablado'
        return ''
      }
      return {
        id: `${mood}-${tense}`,
        label: getTenseLabel(tense).toLowerCase(),
        tag,
        gloss: getMoodLabel(mood).toLowerCase(),
        ex: getEx(tense),
        onSelect: () => {
          selectMood(mood, { navigate: false })
          selectTense(tense)
        },
      }
    })

  return [
    ...buildDirectTenseOptions('indicative', 'IND'),
    {
      id: 'futuro-menu',
      label: 'futuro',
      tag: 'FUT',
      gloss: 'elegir tiempo',
      ex: 'simple · compuesto',
      onSelect: () => setThemeSubMenu('futuro')
    },
    {
      id: 'conditional-menu',
      label: 'condicional',
      tag: 'COND',
      gloss: 'elegir tiempo',
      ex: 'simple · compuesto',
      onSelect: () => setThemeSubMenu('condicional')
    },
    {
      id: 'nonfinite-menu',
      label: 'formas no finitas',
      tag: 'NF',
      gloss: 'elegir forma',
      ex: 'gerundio · participio · mixto',
      onSelect: () => setThemeSubMenu('nonfinite')
    },
    {
      id: 'subjunctive',
      label: 'subjuntivos',
      tag: 'SUB',
      gloss: 'elegir tiempo',
      ex: 'presente · imperfecto',
      onSelect: () => selectMood('subjunctive'),
    },
    {
      id: 'imperative',
      label: 'imperativo',
      tag: 'IMP',
      gloss: 'afirmativo o negativo',
      ex: 'habla · no hables',
      onSelect: () => selectMood('imperative'),
    },
  ]
}

/* ── Level-filtered topic options (same grouping as "por tema" but level-gated) ── */
function buildLevelTopicOptions({ level, selectMood, selectTense, themeSubMenu, setThemeSubMenu, getAvailableTensesForLevelAndMood }) {
  const indicativeTenses   = getAvailableTensesForLevelAndMood(level, 'indicative')
  const subjunctiveTenses  = getAvailableTensesForLevelAndMood(level, 'subjunctive')
  const imperativeTenses   = getAvailableTensesForLevelAndMood(level, 'imperative')
  const conditionalTenses  = getAvailableTensesForLevelAndMood(level, 'conditional')
  const nonfiniteTenses    = getAvailableTensesForLevelAndMood(level, 'nonfinite')

  const pick = (mood, tense) => () => {
    selectMood(mood, { navigate: false })
    selectTense(tense)
  }

  // ── Submenús activos ──
  if (themeSubMenu === 'futuro') {
    const futureTenses = indicativeTenses.filter(t => t === 'fut' || t === 'futPerf')
    return [
      { id: 'indicative-fut',     label: 'futuro simple',    tag: 'FUT', gloss: 'indicativo', ex: 'yo hablaré',        onSelect: pick('indicative', 'fut') },
      { id: 'indicative-futPerf', label: 'futuro compuesto', tag: 'FUT', gloss: 'indicativo', ex: 'yo habré hablado',  onSelect: pick('indicative', 'futPerf') },
    ].filter(o => futureTenses.includes(o.id.split('-')[1]))
  }

  if (themeSubMenu === 'condicional') {
    return [
      { id: 'conditional-cond',     label: 'condicional simple',    tag: 'COND', gloss: 'condicional', ex: 'yo hablaría',        onSelect: pick('conditional', 'cond') },
      { id: 'conditional-condPerf', label: 'condicional compuesto', tag: 'COND', gloss: 'condicional', ex: 'yo habría hablado',  onSelect: pick('conditional', 'condPerf') },
    ].filter(o => conditionalTenses.includes(o.id.split('-')[1]))
  }

  if (themeSubMenu === 'nonfinite') {
    const nfEx = { ger: 'hablando', part: 'hablado', nonfiniteMixed: 'hablando / hablado' }
    return nonfiniteTenses.map(t => ({
      id: `nonfinite-${t}`,
      label: getTenseLabel(t).toLowerCase(),
      tag: 'NF',
      gloss: 'no finita',
      ex: nfEx[t] || '',
      onSelect: pick('nonfinite', t),
    }))
  }

  if (themeSubMenu === 'subjuntivo') {
    const subjEx = { subjPres: 'hable', subjImpf: 'hablara', subjPerf: 'haya hablado', subjPlusc: 'hubiera hablado' }
    return subjunctiveTenses.map(t => ({
      id: `subjunctive-${t}`,
      label: getTenseLabel(t).toLowerCase(),
      tag: 'SUB',
      gloss: 'subjuntivo',
      ex: subjEx[t] || '',
      onSelect: pick('subjunctive', t),
    }))
  }

  if (themeSubMenu === 'imperativo') {
    const impEx = { impAff: 'habla', impNeg: 'no hables' }
    return imperativeTenses
      .filter(t => t === 'impAff' || t === 'impNeg')
      .map(t => ({
        id: `imperative-${t}`,
        label: getTenseLabel(t).toLowerCase(),
        tag: 'IMP',
        gloss: 'imperativo',
        ex: impEx[t] || '',
        onSelect: pick('imperative', t),
      }))
  }

  // ── Menú raíz ──
  const options = []

  // Indicativos directos (sin futuro)
  const indEx = {
    pres: 'yo hablo', pretIndef: 'yo hablé', impf: 'yo hablaba',
    pretPerf: 'he hablado', plusc: 'yo había hablado',
  }
  indicativeTenses
    .filter(t => t !== 'fut' && t !== 'futPerf')
    .forEach(t => options.push({
      id: `indicative-${t}`,
      label: getTenseLabel(t).toLowerCase(),
      tag: 'IND',
      gloss: 'indicativo',
      ex: indEx[t] || '',
      onSelect: pick('indicative', t),
    }))

  // Futuro (submenú si hay más de uno, directo si solo uno)
  const futureTenses = indicativeTenses.filter(t => t === 'fut' || t === 'futPerf')
  if (futureTenses.length > 1) {
    options.push({ id: 'futuro-menu', label: 'futuro', tag: 'FUT', gloss: 'elegir tiempo', ex: 'simple · compuesto', onSelect: () => setThemeSubMenu('futuro') })
  } else if (futureTenses.length === 1) {
    options.push({ id: `indicative-${futureTenses[0]}`, label: getTenseLabel(futureTenses[0]).toLowerCase(), tag: 'FUT', gloss: 'indicativo', ex: 'yo hablaré', onSelect: pick('indicative', futureTenses[0]) })
  }

  // Condicional (submenú si hay más de uno, directo si solo uno)
  if (conditionalTenses.length > 1) {
    options.push({ id: 'conditional-menu', label: 'condicional', tag: 'COND', gloss: 'elegir tiempo', ex: 'simple · compuesto', onSelect: () => setThemeSubMenu('condicional') })
  } else if (conditionalTenses.length === 1) {
    options.push({ id: `conditional-${conditionalTenses[0]}`, label: getTenseLabel(conditionalTenses[0]).toLowerCase(), tag: 'COND', gloss: 'condicional', ex: 'yo hablaría', onSelect: pick('conditional', conditionalTenses[0]) })
  }

  // Formas no finitas (submenú si hay más de una forma "real", directo si solo una)
  const nfReal = nonfiniteTenses.filter(t => t !== 'nonfiniteMixed')
  if (nfReal.length > 1) {
    options.push({ id: 'nonfinite-menu', label: 'formas no finitas', tag: 'NF', gloss: 'elegir forma', ex: 'gerundio · participio', onSelect: () => setThemeSubMenu('nonfinite') })
  } else if (nonfiniteTenses.length > 0) {
    const t = nonfiniteTenses[0]
    const nfEx = { ger: 'hablando', part: 'hablado', nonfiniteMixed: 'hablando / hablado' }
    options.push({ id: `nonfinite-${t}`, label: getTenseLabel(t).toLowerCase(), tag: 'NF', gloss: 'no finita', ex: nfEx[t] || '', onSelect: pick('nonfinite', t) })
  }

  // Subjuntivos (submenú si hay más de uno, directo si solo uno)
  if (subjunctiveTenses.length > 1) {
    options.push({ id: 'subjuntivo-menu', label: 'subjuntivos', tag: 'SUB', gloss: 'elegir tiempo', ex: 'presente · imperfecto', onSelect: () => setThemeSubMenu('subjuntivo') })
  } else if (subjunctiveTenses.length === 1) {
    const subjEx = { subjPres: 'hable', subjImpf: 'hablara', subjPerf: 'haya hablado', subjPlusc: 'hubiera hablado' }
    const t = subjunctiveTenses[0]
    options.push({ id: `subjunctive-${t}`, label: getTenseLabel(t).toLowerCase(), tag: 'SUB', gloss: 'subjuntivo', ex: subjEx[t] || '', onSelect: pick('subjunctive', t) })
  }

  // Imperativo (submenú si hay más de uno aff/neg, directo si solo uno)
  const impFiltered = imperativeTenses.filter(t => t === 'impAff' || t === 'impNeg')
  if (impFiltered.length > 1) {
    options.push({ id: 'imperativo-menu', label: 'imperativo', tag: 'IMP', gloss: 'afirmativo o negativo', ex: 'habla · no hables', onSelect: () => setThemeSubMenu('imperativo') })
  } else if (impFiltered.length === 1) {
    const impEx = { impAff: 'habla', impNeg: 'no hables' }
    const t = impFiltered[0]
    options.push({ id: `imperative-${t}`, label: getTenseLabel(t).toLowerCase(), tag: 'IMP', gloss: 'imperativo', ex: impEx[t] || '', onSelect: pick('imperative', t) })
  }

  return options
}

const FALLBACK_FAMILIES = [
  { id: 'G_VERBS',   name: 'Irregulares en YO',  description: 'tener, poner, salir, conocer, vencer' },
  { id: 'UIR_Y',     name: '-uir (inserción y)',  description: 'construir, huir' },
  { id: 'PRET_UV',   name: 'Pretérito -uv-',      description: 'andar, estar, tener' },
  { id: 'PRET_U',    name: 'Pretérito -u-',       description: 'poder, poner, saber' },
  { id: 'PRET_J',    name: 'Pretérito -j-',       description: 'decir, traer' },
]

/* ── Family options builder ── */
function buildFamilyOptions(settings, selectFamily, onStartPractice) {
  const { specificTense, specificMood } = settings

  const allOpt = {
    id: '__all__',
    label: 'todas las familias',
    tag: 'AMPLIO',
    gloss: 'sin filtrar',
    ex: 'máxima variedad',
    onSelect: () => selectFamily(null, onStartPractice),
  }

  let groups = []
  if (specificTense && shouldUseSimplifiedGrouping(specificTense)) {
    groups = getSimplifiedGroupsForTense(specificTense) || []
  } else if (specificMood && !specificTense && shouldUseSimplifiedGroupingForMood(specificMood)) {
    groups = getSimplifiedGroupsForMood(specificMood) || []
  }

  if (groups.length > 0) {
    return [
      allOpt,
      ...groups.map(g => ({
        id: g.id,
        label: g.name,
        tag: 'GRUPO',
        gloss: g.explanation || '',
        ex: g.description || '',
        onSelect: () => selectFamily(g.id, onStartPractice),
      })),
    ]
  }

  const families = specificTense
    ? getFamiliesForTense(specificTense)
    : specificMood
      ? getFamiliesForMood(specificMood)
      : FALLBACK_FAMILIES

  return [
    allOpt,
    ...((families || FALLBACK_FAMILIES).slice(0, 8).map(f => ({
      id: f.id,
      label: f.name,
      tag: 'FAMILIA',
      gloss: f.description || '',
      ex: f.description || '',
      onSelect: () => selectFamily(f.id, onStartPractice),
    }))),
  ]
}

/* ── Step config builder ── */
function buildStep(step, settings, handlers) {
  const {
    selectDialect, selectLevel, selectPracticeMode, selectMood, selectTense,
    selectVerbType, selectFamily, goToLevelDetails, onStartPractice,
    onGoToProgress, onStartLearningNewTense, onStartLevelTest,
    getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood,
    themeSubMenu, setThemeSubMenu
  } = handlers

  switch (step) {
    case 1:
      return {
        n: '01', kicker: 'VARIANTE',
        prompt: 'Hablás...', aux: 'Definí el sistema pronominal antes de empezar.',
        options: [
          { id: 'rioplatense', label: 'vos',           tag: 'AR · UY', gloss: 'rioplatense', ex: 'vos tenés / vos hablás', ariaLabel: 'Seleccionar dialecto rioplatense (vos)', onSelect: () => selectDialect('rioplatense') },
          { id: 'la_general',  label: 'tú',            tag: 'LATAM',   gloss: 'estándar',    ex: 'tú tienes / tú hablas',  ariaLabel: 'Seleccionar dialecto latinoamericano general (tú)', onSelect: () => selectDialect('la_general') },
          { id: 'peninsular',  label: 'tú · vosotros', tag: 'ES',      gloss: 'peninsular',  ex: 'vosotros tenéis',        ariaLabel: 'Seleccionar dialecto peninsular (tú y vosotros)', onSelect: () => selectDialect('peninsular') },
          { id: 'both',        label: 'todos',          tag: 'MIX',     gloss: 'sin filtro',  ex: 'tú · vos · vosotros',   ariaLabel: 'Seleccionar todos los dialectos', onSelect: () => selectDialect('both') },
        ],
      }

    case 2:
      return {
        n: '02', kicker: 'ENTRADA',
        prompt: 'Querés...', aux: 'Cuatro accesos. Cada uno con su lógica.',
        options: [
          { id: 'levels',   label: 'practicar por nivel', tag: 'A1 → C2', gloss: 'progresión cefr', ex: 'recorrido estructurado',    onSelect: goToLevelDetails },
          { id: 'theme',    label: 'practicar por tema',  tag: 'FOCO',    gloss: 'tiempo verbal',   ex: 'presente · subjuntivo · etc.', onSelect: () => selectPracticeMode('theme', onStartPractice) },
          { id: 'learn',    label: 'aprender',            tag: 'GUIADO',  gloss: 'lecciones',       ex: 'explicación + drill',        onSelect: onStartLearningNewTense },
          { id: 'progress', label: 'ver mi progreso',     tag: 'DATA',    gloss: 'analíticas',      ex: 'mapa de calor + srs',        onSelect: onGoToProgress },
        ],
      }

    case 3:
      return {
        n: '03', kicker: 'NIVEL',
        prompt: 'Tu nivel es...', aux: 'Elegí un tramo CEFR o dejá que el test te ubique.',
        options: [
          { id: 'A1',   label: 'A1',           tag: 'PRINCIPIANTE', gloss: 'acceso',               ex: 'presente',               ariaLabel: 'Seleccionar nivel A1', onSelect: () => selectLevel('A1') },
          { id: 'A2',   label: 'A2',           tag: 'ELEMENTAL',    gloss: 'base',                  ex: 'pretéritos · futuro',    ariaLabel: 'Seleccionar nivel A2', onSelect: () => selectLevel('A2') },
          { id: 'B1',   label: 'B1',           tag: 'INTERMEDIO',   gloss: 'tracción',              ex: 'condicional · perfectos',ariaLabel: 'Seleccionar nivel B1', onSelect: () => selectLevel('B1') },
          { id: 'B2',   label: 'B2',           tag: 'INTERMEDIO+',  gloss: 'precisión',             ex: 'subjuntivo imperfecto',  ariaLabel: 'Seleccionar nivel B2', onSelect: () => selectLevel('B2') },
          { id: 'C1',   label: 'C1',           tag: 'AVANZADO',     gloss: 'matiz',                 ex: 'discurso fluido',        ariaLabel: 'Seleccionar nivel C1', onSelect: () => selectLevel('C1') },
          { id: 'C2',   label: 'C2',           tag: 'SUPERIOR',     gloss: 'dominio',               ex: 'nativo completo',        ariaLabel: 'Seleccionar nivel C2', onSelect: () => selectLevel('C2') },
          ...(onStartLevelTest ? [{ id: 'test', label: 'test de nivel', tag: 'AUTO', gloss: 'diagnóstico adaptativo', ex: '5 min · te ubica', ariaLabel: 'Test de nivel adaptativo', onSelect: onStartLevelTest }] : []),
        ],
      }

    case 4:
      return {
        n: '04', kicker: 'FORMA',
        prompt: 'Querés trabajar...', aux: 'Mezcla amplia o foco quirúrgico.',
        options: [
          { id: 'mixed',    label: 'todo mezclado',     tag: 'AMPLIO',  gloss: 'panorama', ex: 'todos los modos y tiempos', onSelect: () => selectPracticeMode('mixed', onStartPractice) },
          { id: 'specific', label: 'un bloque puntual', tag: 'PRECISO', gloss: 'foco',     ex: 'un modo, un tiempo',        onSelect: () => selectPracticeMode('specific') },
        ],
      }

    case 5: {
      if (settings.practiceMode === 'mixed') {
        return {
          n: '05', kicker: 'MATERIAL',
          prompt: 'Verbos...', aux: 'El generador filtra por tipo. La práctica no cambia.',
          options: VERB_TYPE_OPTS.map(o => ({ ...o, onSelect: () => selectVerbType(o.id, onStartPractice) })),
        }
      }
      if (settings.practiceMode === 'theme') {
        const kickerMap = {
          futuro: 'FUTURO',
          condicional: 'CONDICIONAL',
          nonfinite: 'FORMAS NO FINITAS'
        }
        return {
          n: '05',
          kicker: themeSubMenu ? (kickerMap[themeSubMenu] || themeSubMenu.toUpperCase()) : 'TEMA',
          prompt: 'Trabajás...',
          aux: themeSubMenu
            ? 'Elegí un tiempo para seguir con el tipo de verbos.'
            : 'Indicativo directo. Futuro, condicional y no finitas abren submenú.',
          options: buildThemeTopicOptions({ selectMood, selectTense, themeSubMenu, setThemeSubMenu }),
        }
      }
      // Specific mode (por nivel): themed grouped menu filtered by level — no mode selection
      const kickerMapLevel = {
        futuro: 'FUTURO', condicional: 'CONDICIONAL',
        nonfinite: 'FORMAS NO FINITAS', subjuntivo: 'SUBJUNTIVOS', imperativo: 'IMPERATIVO',
      }
      return {
        n: '05',
        kicker: themeSubMenu ? (kickerMapLevel[themeSubMenu] || themeSubMenu.toUpperCase()) : 'BLOQUE',
        prompt: 'Trabajás...',
        aux: themeSubMenu
          ? 'Elegí un tiempo para seguir con el tipo de verbos.'
          : 'Elegí un bloque para practicar.',
        options: buildLevelTopicOptions({
          level: settings.level,
          selectMood, selectTense,
          themeSubMenu, setThemeSubMenu,
          getAvailableTensesForLevelAndMood,
        }),
      }
    }

    case 6: {
      if (settings.practiceMode === 'mixed' && settings.verbType === 'irregular') {
        return {
          n: '06', kicker: 'FAMILIA IRREGULAR',
          prompt: 'Foco en...', aux: 'Acotá la familia para un drill más deliberado.',
          options: buildFamilyOptions(settings, selectFamily, onStartPractice),
        }
      }
      if (!settings.specificMood) return null
      if (settings.practiceMode === 'theme' && !THEME_ROOT_MOOD_OPTS.has(settings.specificMood)) return null
      // 'specific' mode: tense was already chosen at step 5 — skip step 6
      if (settings.practiceMode === 'specific') return null
      const tenses = settings.level
        ? getAvailableTensesForLevelAndMood(settings.level, settings.specificMood)
        : getTensesForMood(settings.specificMood)
      const visibleTenses = settings.practiceMode === 'theme' && settings.specificMood === 'imperative'
        ? tenses.filter(tense => tense === 'impAff' || tense === 'impNeg')
        : tenses
      const moodTag = getMoodLabel(settings.specificMood).toUpperCase().slice(0, 3)
      return {
        n: '06', kicker: 'TIEMPO',
        prompt: 'Atacás...', aux: 'Recorte exacto del drill.',
        options: visibleTenses.map(t => ({
          id: t,
          label: getTenseLabel(t),
          tag: moodTag,
          gloss: getMoodLabel(settings.specificMood),
          ex: '',
          onSelect: () => selectTense(t),
        })),
      }
    }

    case 7:
      return {
        n: '07', kicker: 'TIPO',
        prompt: 'Verbos...', aux: 'Último filtro antes de entrar al drill.',
        options: VERB_TYPE_OPTS.map(o => ({ ...o, onSelect: () => selectVerbType(o.id, onStartPractice) })),
      }

    case 8: {
      return {
        n: '08', kicker: 'FAMILIAS',
        prompt: 'Foco en...', aux: 'Si querés, trabajá patrones puntuales.',
        options: buildFamilyOptions(settings, selectFamily, onStartPractice),
      }
    }

    default:
      return null
  }
}

/* ── Breadcrumb builder ── */
function buildBreadcrumb(settings) {
  const items = []
  const dialectMap = { rioplatense: 'vos', la_general: 'tú', peninsular: 'tú·vosotros', global: 'todos' }
  if (settings.region) items.push({ label: 'DIALECTO', value: dialectMap[settings.region] || settings.region })
  if (settings.level) items.push({ label: 'NIVEL', value: settings.level })
  const modeMap = { mixed: 'mezclado', specific: 'específico', theme: 'por tema' }
  if (settings.practiceMode) items.push({ label: 'MODO', value: modeMap[settings.practiceMode] || settings.practiceMode })
  if (settings.specificMood) items.push({ label: 'MODO·V', value: getMoodLabel(settings.specificMood) })
  return items.slice(-3)
}

/* ──────────────────────────────
   StepView — two-panel layout
────────────────────────────── */
function StepView({ stepConfig, animKey, onSelect }) {
  const [focusIdx, setFocusIdx] = useState(0)
  const { n, kicker, prompt, aux, options } = stepConfig

  useEffect(() => { setFocusIdx(0) }, [animKey])

  // Keyboard navigation
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIdx(i => Math.min(options.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIdx(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        onSelect(options[focusIdx])
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (idx < options.length) { setFocusIdx(idx); onSelect(options[idx]) }
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [focusIdx, options, onSelect])

  const focused = options[focusIdx] || options[0]

  // Dynamic font size for focal word
  const len = (focused?.label || '').length
  const lenFactor = len <= 6 ? 1 : len <= 10 ? 0.78 : len <= 16 ? 0.58 : len <= 22 ? 0.44 : 0.34
  const focalSize = `clamp(44px, ${Math.max(5, 12 * lenFactor)}vw, ${Math.round(180 * lenFactor)}px)`
  const optionFontSize = '26px'

  return (
    <div key={animKey} className="vo-step vo-lift-in">
      {/* LEFT: focal word display */}
      <div className="vo-left">
        <div className="vo-step-tag">──── {kicker}</div>

        {/* Ghost step number watermark */}
        <div className="vo-watermark" aria-hidden="true">{n}</div>

        <div className="vo-left-bottom">
          <div className="vo-aux">▸ {aux}</div>
          <div className="vo-prompt">{prompt}</div>

          {/* Focal option — huge italic */}
          <div
            key={focused?.id ?? 'x'}
            className="vo-focal-word vo-scan-in"
            style={{ fontSize: focalSize, color: ACCENT }}
          >
            {focused?.label}
            <span
              className="vo-cursor"
              style={{
                display: 'inline-block',
                width: '0.07em',
                height: '0.68em',
                background: ACCENT,
                marginLeft: '0.05em',
                verticalAlign: 'baseline',
                transform: 'translateY(-0.05em)',
              }}
            />
          </div>

          {/* Metadata strip */}
          {focused && (
            <div className="vo-meta">
              <div className="vo-meta-item">
                <span className="vo-meta-key">TAG</span>
                <span className="vo-meta-val">{focused.tag}</span>
              </div>
              <div className="vo-meta-item">
                <span className="vo-meta-key">TIPO</span>
                <span className="vo-meta-val">{focused.gloss}</span>
              </div>
              {focused.ex && (
                <div className="vo-meta-item vo-meta-right">
                  <span className="vo-meta-key">EJEMPLO</span>
                  <span className="vo-meta-val vo-meta-ex" style={{ color: ACCENT }}>{focused.ex}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: option list */}
      <div className="vo-right vo-noscroll">
        <div className="vo-options-label">
          OPCIONES · {String(options.length).padStart(2, '0')} ────
        </div>

        <div className="vo-options-list">
          {options.map((opt, i) => {
            const active = i === focusIdx
            return (
              <div
                key={opt.id ?? i}
                className="vo-option"
                role="button"
                tabIndex={0}
                aria-label={opt.ariaLabel || opt.label}
                style={{ paddingLeft: active ? 76 : 52, paddingTop: 14, paddingBottom: 14 }}
                onMouseEnter={() => setFocusIdx(i)}
                onClick={() => onSelect(opt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(opt)
                  }
                }}
              >
                {/* Number box */}
                <div className="vo-option-num" style={{ color: active ? ACCENT : INK3 }}>
                  <span className="vo-option-num-box" style={{ borderColor: active ? ACCENT : LINE }}>
                    {i + 1}
                  </span>
                  {active && <span className="vo-option-tick" style={{ background: ACCENT }} />}
                </div>

                {/* Label */}
                <div
                  className="vo-option-label"
                  style={{
                    fontSize: optionFontSize,
                    fontWeight: active ? 700 : 400,
                    fontStyle: active ? 'italic' : 'normal',
                    color: active ? INK : INK2,
                  }}
                >
                  {opt.label}
                </div>

                {/* Tag */}
                <div className="vo-option-tag" style={{ color: active ? ACCENT : INK3 }}>
                  {opt.tag}
                </div>

                {/* Arrow */}
                <div
                  className="vo-option-arrow"
                  style={{
                    color: ACCENT,
                    opacity: active ? 1 : 0,
                    transform: active ? 'translateX(0)' : 'translateX(-6px)',
                  }}
                >
                  →
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   Corner crosshairs — purely decorative
──────────────────────────────────────────── */
function Crosshairs() {
  const positions = [
    { top: 56, left: 12 },
    { top: 56, right: 12 },
    { bottom: 44, left: 12 },
    { bottom: 44, right: 12 },
  ]
  return positions.map((pos, i) => (
    <div key={i} className="vo-crosshair" style={pos}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M0 7H14M7 0V14" stroke={ACCENT} strokeWidth="1" />
      </svg>
    </div>
  ))
}

/* ──────────────────────────────────────────
   Placement report modal (kept from original)
────────────────────────────────────────── */
function PlacementReportModal({ result, reportSaved, onClose, onRetake, onSave }) {
  const report = result.report
  const accuracy = report?.summary?.accuracy ? Math.round(report.summary.accuracy * 100) : 0
  const averageSeconds = report?.timings?.averageMs ? Math.round(report.timings.averageMs / 100) / 10 : 0
  const medianSeconds = report?.timings?.medianMs ? Math.round(report.timings.medianMs / 100) / 10 : 0

  return (
    <div className="placement-report-overlay" role="dialog" aria-modal="true">
      <div className="placement-report-modal">
        <header className="placement-report-header">
          <h3>Resumen del Test de Nivel</h3>
          <p>Revisá tu desempeño y decidí los próximos pasos.</p>
        </header>

        <section className="placement-report-summary">
          <div className="summary-card">
            <span className="summary-label">Nivel estimado</span>
            <span className="summary-value">{result.determinedLevel}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Precisión</span>
            <span className="summary-value">{accuracy}%</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Promedio</span>
            <span className="summary-value">{averageSeconds}s</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Mediana</span>
            <span className="summary-value">{medianSeconds}s</span>
          </div>
        </section>

        {report?.recommendations?.length > 0 && (
          <section className="placement-report-section">
            <h4>Recomendaciones</h4>
            <ul>
              {report.recommendations.map((rec, idx) => (
                <li key={`${report.testId}-rec-${idx}`}>{rec}</li>
              ))}
            </ul>
          </section>
        )}

        {report?.focusAreas?.weaknesses?.length > 0 && (
          <section className="placement-report-section">
            <h4>Áreas a reforzar</h4>
            <ul>
              {report.focusAreas.weaknesses.map(area => {
                const [mood, tense] = area.key.split('_')
                return (
                  <li key={`${report.testId}-${area.key}`}>
                    {`${tense} (${mood}) · Precisión ${(area.accuracy * 100).toFixed(0)}%`}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <footer className="placement-report-actions">
          <button type="button" className="placement-report-button secondary" onClick={onRetake}>Repetir test</button>
          <button
            type="button"
            className={`placement-report-button primary ${reportSaved ? 'saved' : ''}`}
            onClick={onSave}
          >
            {reportSaved ? 'Actualizar guardado' : 'Guardar en ajustes'}
          </button>
          <button type="button" className="placement-report-button ghost" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   Main OnboardingFlow component
────────────────────────────────────────── */
function OnboardingFlow({
  onStartPractice,
  setCurrentMode,
  onStartLearningNewTense,
  onboardingStep,
  selectDialect,
  selectLevel,
  selectPracticeMode,
  selectMood,
  selectTense,
  selectVerbType,
  selectFamily,
  goToLevelDetails,
  handleHome,
  settings,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  onGoToProgress,
}) {
  const [showLevelTest, setShowLevelTest]             = useState(false)
  const [showPlacementSummary, setShowPlacementSummary] = useState(false)
  const [lastPlacementResult, setLastPlacementResult]   = useState(null)
  const [reportSaved, setReportSaved]                   = useState(false)
  const [animKey, setAnimKey]                           = useState(0)
  const [themeSubMenu, setThemeSubMenu]                 = useState(null)

  // Bump animKey on step change to trigger animations
  const prevStep = useRef(onboardingStep)
  useEffect(() => {
    if (onboardingStep !== prevStep.current) {
      prevStep.current = onboardingStep
      setAnimKey(k => k + 1)
      setThemeSubMenu(null)
    }
  }, [onboardingStep])

  const handleStartLevelTest = useCallback(() => setShowLevelTest(true), [])

  const handleLevelTestComplete = useCallback((result) => {
    setShowLevelTest(false)
    if (result) {
      setLastPlacementResult(result)
      setShowPlacementSummary(Boolean(result.report))
      setReportSaved(Boolean(
        result.report &&
        settings.placementTestReport &&
        settings.placementTestReport.testId === result.report.testId
      ))
    }
    if (result?.determinedLevel) selectLevel(result.determinedLevel)
  }, [selectLevel, settings.placementTestReport])

  const handleSavePlacementReport = useCallback(() => {
    if (!lastPlacementResult?.report) return
    if (typeof settings.setPlacementTestReport === 'function') {
      settings.setPlacementTestReport(lastPlacementResult.report)
      setReportSaved(true)
    }
  }, [lastPlacementResult, settings])

  const handleBack = useCallback(() => {
    if (onboardingStep === 5 && themeSubMenu) {
      setThemeSubMenu(null)
      setAnimKey(k => k + 1)
    } else {
      try { window.history.back() } catch { /* ignore */ }
    }
  }, [onboardingStep, themeSubMenu])

  const handleLogoClick = useCallback(() => {
    handleHome(setCurrentMode)
  }, [handleHome, setCurrentMode])

  // Global back keyboard shortcut
  useEffect(() => {
    const fn = (e) => {
      if (showLevelTest) return
      if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        e.preventDefault(); handleBack()
      } else if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); handleBack()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [handleBack, showLevelTest])

  const handlers = useMemo(() => ({
    selectDialect,
    selectLevel,
    selectPracticeMode,
    selectMood,
    selectTense,
    selectVerbType,
    selectFamily,
    goToLevelDetails,
    onStartPractice,
    onGoToProgress,
    onStartLearningNewTense,
    onStartLevelTest: handleStartLevelTest,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    themeSubMenu,
    setThemeSubMenu,
  }), [
    selectDialect, selectLevel, selectPracticeMode, selectMood, selectTense,
    selectVerbType, selectFamily, goToLevelDetails, onStartPractice, onGoToProgress,
    onStartLearningNewTense, handleStartLevelTest, getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood, themeSubMenu, setThemeSubMenu,
  ])

  const stepConfig = useMemo(
    () => buildStep(onboardingStep, settings, handlers),
    [onboardingStep, settings.practiceMode, settings.verbType, settings.specificMood, settings.level, settings.region, handlers]
  )

  const breadcrumb = useMemo(() => buildBreadcrumb(settings), [settings])

  const handleOptionSelect = useCallback((opt) => {
    opt.onSelect()
  }, [])

  const TOTAL_STEPS = 8

  return (
    <div className="verbos-onboarding">
      {/* Background grid */}
      <div className="vo-grid" aria-hidden="true" />
      <div className="vo-vignette" aria-hidden="true" />
      <Crosshairs />

      {/* Top header */}
      <header className="vo-header">
        <div className="vo-header-left">
          {onboardingStep > 1 && !showLevelTest && (
            <button className="vo-back-btn" onClick={handleBack} aria-label="Volver al paso anterior">
              ← VOLVER
            </button>
          )}
          <div className="vo-logo" onClick={handleLogoClick} title="Ir al inicio">
            <div className="vo-logo-dot" style={{ background: ACCENT }} />
            <span className="vo-logo-name">
              VERB<span style={{ color: ACCENT }}>/</span>OS
            </span>
            <span style={{ marginLeft: 8 }}>v0.1</span>
          </div>
        </div>

        <div className="vo-breadcrumb" aria-label="Progreso de configuración">
          {breadcrumb.length === 0
            ? <span style={{ color: INK3 }}>— · —</span>
            : breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="vo-breadcrumb-sep">/</span>}
                <span>
                  <span className="vo-breadcrumb-label">{item.label}</span>
                  <span className="vo-breadcrumb-val">{item.value}</span>
                </span>
              </React.Fragment>
            ))
          }
        </div>

        <div className="vo-step-counter" style={{ fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2 }}>
          STEP <span>{String(onboardingStep).padStart(2, '0')}</span> / {String(TOTAL_STEPS).padStart(2, '0')}
        </div>
      </header>

      {/* Main content area */}
      {showLevelTest ? (
        <div className="vo-placement-overlay">
          <PlacementTest
            onComplete={handleLevelTestComplete}
            onCancel={() => setShowLevelTest(false)}
          />
        </div>
      ) : stepConfig ? (
        <StepView
          stepConfig={stepConfig}
          animKey={animKey}
          onSelect={handleOptionSelect}
        />
      ) : null}

      {/* Placement report modal */}
      {showPlacementSummary && lastPlacementResult?.report && (
        <PlacementReportModal
          result={lastPlacementResult}
          reportSaved={reportSaved}
          onClose={() => setShowPlacementSummary(false)}
          onRetake={() => { setShowPlacementSummary(false); setShowLevelTest(true) }}
          onSave={handleSavePlacementReport}
        />
      )}

      {/* Bottom status bar */}
      <footer className="vo-footer">
        <div className="vo-footer-hints">
          <span><em>↑↓</em> navegá</span>
          <span><em>↵ / →</em> seleccioná</span>
          <span><em>← / esc</em> volver</span>
        </div>
        <div style={{ color: INK2 }}>{stepConfig?.kicker}</div>
        <div>SISTEMA · OK</div>
      </footer>
    </div>
  )
}

export default OnboardingFlow
