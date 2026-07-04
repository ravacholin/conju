import React, { useEffect, useState, useMemo } from 'react'
import LearningStepView from './LearningStepView.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'
import { getVerbForms } from '../../lib/core/verbDataService.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('TenseSelectionStep')

const REFERENCE_LEMMAS = ['hablar', 'comer', 'vivir']
const SUBMENU_MOODS = {
  subjunctive: ['subjunctive', 'subjuntivo'],
  imperative: ['imperative', 'imperativo'],
}
const ROOT_DIRECT_MOODS = [
  { aliases: ['indicative', 'indicativo'], tag: 'IND' },
  { aliases: ['conditional', 'condicional'], tag: 'COND' },
  { aliases: ['nonfinite'], tag: 'NF' },
]

function findAvailableMoodKey(availableTenses, moodAliases) {
  return moodAliases.find(mood => Array.isArray(availableTenses?.[mood]) && availableTenses[mood].length > 0)
}

function orderTensesForMood(mood, tenses) {
  const canonicalMood = mood === 'indicativo'
    ? 'indicative'
    : mood === 'subjuntivo'
      ? 'subjunctive'
      : mood === 'imperativo'
        ? 'imperative'
        : mood
  const order = getTensesForMood(canonicalMood)
  return [...(tenses || [])].sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function TenseSelectionStep({ availableTenses, onSelect, onHome, useVoseo = false, region }) {
  const [referenceForms, setReferenceForms] = useState(new Map())
  const [selectedMenu, setSelectedMenu] = useState(null)

  useEffect(() => {
    async function loadReferenceForms() {
      try {
        const pairs = await Promise.all(
          REFERENCE_LEMMAS.map(async lemma => {
            try {
              const forms = await getVerbForms(lemma, region)
              return [lemma, forms]
            } catch (error) {
              logger.warn(`no se pudieron obtener formas para ${lemma}`, error)
              return [lemma, []]
            }
          })
        )
        setReferenceForms(new Map(pairs))
      } catch (error) {
        logger.error('fallo al cargar verbos de referencia', error)
        setReferenceForms(new Map())
      }
    }
    loadReferenceForms()
  }, [region])

  const getFormsForLemma = (lemma) => referenceForms.get(lemma) || []

  const getPersonConjugationExample = (moodKey, tenseKey) => {
    if (tenseKey === 'ger' || tenseKey === 'part') {
      const modelVerbs = ['hablar', 'comer', 'vivir']
      const examples = []
      for (const lemma of modelVerbs) {
        const forms = getFormsForLemma(lemma)
        const match = forms.find(f => f.mood === 'nonfinite' && f.tense === tenseKey)
        if (match?.value) { examples.push(match.value); continue }
        const stem = lemma.slice(0, -2)
        if (tenseKey === 'ger') {
          examples.push(lemma.endsWith('ar') ? stem + 'ando' : stem + 'iendo')
        } else if (tenseKey === 'part') {
          examples.push(lemma.endsWith('ar') ? stem + 'ado' : stem + 'ido')
        }
      }
      return examples.join(', ')
    }

    const hablarForms = getFormsForLemma('hablar')
    if (hablarForms.length === 0) return ''

    const moodMap = {
      indicativo: 'indicative', subjuntivo: 'subjunctive',
      imperativo: 'imperative', condicional: 'conditional', nonfinite: 'nonfinite'
    }

    const englishMood = moodMap[moodKey] || moodKey
    const forms = hablarForms.filter(f => f.mood === englishMood && f.tense === tenseKey)
    const pron2Key = useVoseo ? '2s_vos' : '2s_tu'

    const getForm = (key) => {
      let f = forms.find(ff => ff.person === key)
      if (!f && key === '2s_vos') {
        const tu = forms.find(ff => ff.person === '2s_tu')
        if (tu && moodKey === 'indicative' && tenseKey === 'pres') {
          const base = tu.value || ''
          if (/as$/i.test(base)) return base.replace(/as$/i, 'ás')
          if (/es$/i.test(base)) return base.replace(/es$/i, 'és')
        }
        return tu?.value || ''
      }
      return f?.value || ''
    }

    const parts = []
    const f1 = getForm('1s')
    if (f1) parts.push(`yo ${f1}`)
    const f2 = getForm(pron2Key)
    if (f2) parts.push(`${useVoseo ? 'vos' : 'tú'} ${f2}`)
    const f3 = getForm('3s')
    if (f3) parts.push(`ella ${f3}`)
    return parts.join(', ')
  }

  useEffect(() => {
    setSelectedMenu(null)
  }, [availableTenses])

  const options = useMemo(() => {
    if (!availableTenses || Object.keys(availableTenses).length === 0) return []

    if (selectedMenu) {
      if (selectedMenu === 'condicional') {
        const mood = findAvailableMoodKey(availableTenses, ['conditional', 'condicional'])
        const tenses = availableTenses[mood] || []
        return orderTensesForMood(mood, tenses).map(tense => {
          let label = getTenseLabel(tense)
          if (tense === 'cond') label = 'Condicional simple'
          if (tense === 'condPerf') label = 'Condicional compuesto'
          return {
            id: `${mood}__${tense}`,
            label,
            tag: 'COND',
            gloss: getMoodLabel(mood),
            ex: getPersonConjugationExample(mood, tense),
            onSelect: () => onSelect(mood, tense),
          }
        })
      }

      if (selectedMenu === 'futuro') {
        const mood = findAvailableMoodKey(availableTenses, ['indicative', 'indicativo'])
        const tenses = (availableTenses[mood] || []).filter(tense => tense === 'fut' || tense === 'futPerf')
        return orderTensesForMood(mood, tenses).map(tense => {
          let label = getTenseLabel(tense)
          if (tense === 'fut') label = 'Futuro simple'
          if (tense === 'futPerf') label = 'Futuro compuesto'
          return {
            id: `${mood}__${tense}`,
            label,
            tag: 'FUT',
            gloss: getMoodLabel(mood),
            ex: getPersonConjugationExample(mood, tense),
            onSelect: () => onSelect(mood, tense),
          }
        })
      }

      if (selectedMenu === 'nonfinite') {
        const mood = findAvailableMoodKey(availableTenses, ['nonfinite'])
        const tenses = availableTenses[mood] || []
        return orderTensesForMood(mood, tenses).map(tense => {
          let label = getTenseLabel(tense)
          if (tense === 'ger') label = 'Gerundio'
          if (tense === 'part') label = 'Participio'
          if (tense === 'nonfiniteMixed') label = 'Formas no finitas mixtas'
          return {
            id: `${mood}__${tense}`,
            label,
            tag: 'NF',
            gloss: getMoodLabel(mood),
            ex: getPersonConjugationExample(mood, tense),
            onSelect: () => onSelect(mood, tense),
          }
        })
      }

      const mood = findAvailableMoodKey(availableTenses, SUBMENU_MOODS[selectedMenu])
      const tenses = selectedMenu === 'imperative'
        ? (availableTenses[mood] || []).filter(tense => tense === 'impAff' || tense === 'impNeg')
        : (availableTenses[mood] || [])

      return orderTensesForMood(mood, tenses).map(tense => ({
        id: `${mood}__${tense}`,
        label: selectedMenu === 'imperative'
          ? `Imperativo ${getTenseLabel(tense).toLowerCase()}`
          : getTenseLabel(tense),
        tag: selectedMenu === 'imperative' ? 'IMP' : 'SUB',
        gloss: getMoodLabel(mood),
        ex: getPersonConjugationExample(mood, tense),
        onSelect: () => onSelect(mood, tense),
      }))
    }

    const subjunctiveMood = findAvailableMoodKey(availableTenses, SUBMENU_MOODS.subjunctive)
    const imperativeMood = findAvailableMoodKey(availableTenses, SUBMENU_MOODS.imperative)
    const rootOptions = []

    // Indicativo (except futuro)
    const indMood = findAvailableMoodKey(availableTenses, ['indicative', 'indicativo'])
    if (indMood) {
      const nonFutTenses = (availableTenses[indMood] || []).filter(tense => tense !== 'fut' && tense !== 'futPerf')
      rootOptions.push(...orderTensesForMood(indMood, nonFutTenses).map(tense => ({
        id: `${indMood}__${tense}`,
        label: getTenseLabel(tense),
        tag: 'IND',
        gloss: getMoodLabel(indMood),
        ex: getPersonConjugationExample(indMood, tense),
        onSelect: () => onSelect(indMood, tense),
      })))
    }

    const hasFuturo = indMood && (availableTenses[indMood] || []).some(tense => tense === 'fut' || tense === 'futPerf')
    if (hasFuturo) {
      rootOptions.push({
        id: 'futuro-menu',
        label: 'Futuro',
        tag: 'FUT',
        gloss: 'elegir tiempo',
        ex: 'simple · compuesto',
        onSelect: () => setSelectedMenu('futuro'),
      })
    }

    const condMood = findAvailableMoodKey(availableTenses, ['conditional', 'condicional'])
    if (condMood && (availableTenses[condMood] || []).length > 0) {
      rootOptions.push({
        id: 'conditional-menu',
        label: 'Condicional',
        tag: 'COND',
        gloss: 'elegir tiempo',
        ex: 'simple · compuesto',
        onSelect: () => setSelectedMenu('condicional'),
      })
    }

    const nfMood = findAvailableMoodKey(availableTenses, ['nonfinite'])
    if (nfMood && (availableTenses[nfMood] || []).length > 0) {
      rootOptions.push({
        id: 'nonfinite-menu',
        label: 'Formas no finitas',
        tag: 'NF',
        gloss: 'elegir forma',
        ex: 'gerundio · participio · mixto',
        onSelect: () => setSelectedMenu('nonfinite'),
      })
    }

    if (subjunctiveMood) {
      rootOptions.push({
        id: 'subjunctive-menu',
        label: 'subjuntivos',
        tag: 'SUB',
        gloss: 'elegir tiempo',
        ex: 'presente · imperfecto',
        onSelect: () => setSelectedMenu('subjunctive'),
      })
    }

    if (imperativeMood) {
      rootOptions.push({
        id: 'imperative-menu',
        label: 'imperativo',
        tag: 'IMP',
        gloss: 'afirmativo o negativo',
        ex: 'habla · no hables',
        onSelect: () => setSelectedMenu('imperative'),
      })
    }

    return rootOptions
  }, [availableTenses, useVoseo, referenceForms, selectedMenu])

  if (!availableTenses || Object.keys(availableTenses).length === 0) return null

  const stepConfig = {
    n: '01',
    kicker: selectedMenu === 'subjunctive'
      ? 'SUBJUNTIVO'
      : selectedMenu === 'imperative'
        ? 'IMPERATIVO'
        : selectedMenu === 'condicional'
          ? 'CONDICIONAL'
          : selectedMenu === 'futuro'
            ? 'FUTURO'
            : selectedMenu === 'nonfinite'
              ? 'FORMAS NO FINITAS'
              : 'TEMA',
    prompt: 'Elegís...',
    aux: selectedMenu
      ? 'Elegí un tiempo para seguir con el tipo de verbos.'
      : 'Indicativo directo. Futuro, condicional y no finitas abren submenú.',
    options,
  }

  const getSubmenuLabel = (menu) => {
    if (menu === 'subjunctive') return 'subjuntivos'
    if (menu === 'imperative') return 'imperativo'
    if (menu === 'condicional') return 'condicional'
    if (menu === 'futuro') return 'futuro'
    if (menu === 'nonfinite') return 'formas no finitas'
    return ''
  }

  return (
    <LearningStepView
      stepConfig={stepConfig}
      onBack={selectedMenu ? () => setSelectedMenu(null) : onHome}
      breadcrumb={[
        { label: 'FLUJO', value: 'aprender' },
        ...(selectedMenu ? [{ label: 'TEMA', value: getSubmenuLabel(selectedMenu) }] : []),
      ]}
      stepNum={1}
      totalSteps={3}
    />
  )
}

export default TenseSelectionStep
