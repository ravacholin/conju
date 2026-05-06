import React, { useEffect, useState, useMemo } from 'react'
import LearningStepView from './LearningStepView.jsx'
import { MOOD_LABELS, formatMoodTense, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'
import { getVerbForms } from '../../lib/core/verbDataService.js'

const REFERENCE_LEMMAS = ['hablar', 'comer', 'vivir']

function TenseSelectionStep({ availableTenses, onSelect, onHome, useVoseo = false, region }) {
  const [referenceForms, setReferenceForms] = useState(new Map())

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

  const options = useMemo(() => {
    if (!availableTenses || Object.keys(availableTenses).length === 0) return []
    return Object.entries(availableTenses).flatMap(([mood, tenses]) =>
      tenses.map(tense => ({
        id: `${mood}__${tense}`,
        label: formatMoodTense(mood, tense),
        tag: (getMoodLabel ? getMoodLabel(mood) : MOOD_LABELS[mood] || mood).toUpperCase().slice(0, 4),
        gloss: MOOD_LABELS[mood] || mood,
        ex: getPersonConjugationExample(mood, tense),
        onSelect: () => onSelect(mood, tense),
      }))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTenses, useVoseo, referenceForms])

  if (!availableTenses || Object.keys(availableTenses).length === 0) return null

  const stepConfig = {
    n: '01',
    kicker: 'TIEMPO VERBAL',
    prompt: 'Elegís...',
    aux: 'Un tiempo por vez. Después definís el tipo de verbos.',
    options,
  }

  return (
    <LearningStepView
      stepConfig={stepConfig}
      onBack={onHome}
      breadcrumb={[{ label: 'FLUJO', value: 'aprender' }]}
      stepNum={1}
      totalSteps={3}
    />
  )
}

export default TenseSelectionStep
