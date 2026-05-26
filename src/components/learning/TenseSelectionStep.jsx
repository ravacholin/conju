import React, { useEffect, useState, useMemo } from 'react'
import LearningStepView from './LearningStepView.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'
import { getVerbForms } from '../../lib/core/verbDataService.js'

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
              console.warn(`TenseSelectionStep: no se pudieron obtener formas para ${lemma}`, error)
              return [lemma, []]
            }
          })
        )
        setReferenceForms(new Map(pairs))
      } catch (error) {
        console.error('TenseSelectionStep: fallo al cargar verbos de referencia', error)
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

    ROOT_DIRECT_MOODS.forEach(({ aliases, tag }) => {
      const mood = findAvailableMoodKey(availableTenses, aliases)
      if (!mood) return
      rootOptions.push(...orderTensesForMood(mood, availableTenses[mood]).map(tense => ({
        id: `${mood}__${tense}`,
        label: getTenseLabel(tense),
        tag,
        gloss: getMoodLabel(mood),
        ex: getPersonConjugationExample(mood, tense),
        onSelect: () => onSelect(mood, tense),
      })))
    })

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
        : 'TEMA',
    prompt: 'Elegís...',
    aux: selectedMenu
      ? 'Elegí un tiempo para seguir con el tipo de verbos.'
      : 'Indicativo directo. Subjuntivo e imperativo abren su propio menú.',
    options,
  }

  return (
    <LearningStepView
      stepConfig={stepConfig}
      onBack={selectedMenu ? () => setSelectedMenu(null) : onHome}
      breadcrumb={[
        { label: 'FLUJO', value: 'aprender' },
        ...(selectedMenu ? [{ label: 'TEMA', value: selectedMenu === 'subjunctive' ? 'subjuntivos' : 'imperativo' }] : []),
      ]}
      stepNum={1}
      totalSteps={3}
    />
  )
}

export default TenseSelectionStep
