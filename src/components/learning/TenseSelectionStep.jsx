import React, { useEffect, useState } from 'react'
import MenuOptionCard from '../onboarding/MenuOptionCard.jsx'
import LearningMenuLayout from './LearningMenuLayout.jsx'
import { MOOD_LABELS, formatMoodTense } from '../../lib/utils/verbLabels.js'
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
  if (!availableTenses || Object.keys(availableTenses).length === 0) {
    return null
  }

  const getPersonConjugationExample = (moodKey, tenseKey) => {
    // Para gerundios y participios, mostrar los 3 verbos modelo
    if (tenseKey === 'ger' || tenseKey === 'part') {
      const modelVerbs = ['hablar', 'comer', 'vivir']
      const examples = []

      for (const lemma of modelVerbs) {
        const forms = getFormsForLemma(lemma)
        const match = forms.find(f => f.mood === 'nonfinite' && f.tense === tenseKey)
        if (match?.value) {
          examples.push(match.value)
          continue
        }

        // Si no hay forma específica, generar forma regular
        const stem = lemma.slice(0, -2)
        if (tenseKey === 'ger') {
          examples.push(lemma.endsWith('ar') ? stem + 'ando' : stem + 'iendo')
        } else if (tenseKey === 'part') {
          examples.push(lemma.endsWith('ar') ? stem + 'ado' : stem + 'ido')
        }
      }

      return examples.join(', ')
    }

    // Para otros tiempos, usar el verbo de referencia "hablar"
    const hablarForms = getFormsForLemma('hablar')
    if (hablarForms.length === 0) return ''

    const moodMap = {
      indicativo: 'indicative',
      subjuntivo: 'subjunctive',
      imperativo: 'imperative',
      condicional: 'conditional',
      nonfinite: 'nonfinite'
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

  return (
    <LearningMenuLayout
      step="01"
      kicker="LEARNING"
      title="Elegí el tiempo"
      description="Este flujo enseña un tiempo por vez. Elegí el bloque verbal y después definís qué tipo de verbos trabajar."
      onHome={onHome}
      footer={(
        <button className="back-btn" onClick={onHome}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      )}
    >
        {Object.entries(availableTenses).map(([mood, tenses]) => (
          <div key={mood} className="tense-section">
            <h2>{MOOD_LABELS[mood] || mood}</h2>
            <div className="options-grid">
              {tenses.map(tense => (
                <MenuOptionCard
                  key={tense}
                  className="learning-option-card"
                  eyebrow={MOOD_LABELS[mood] || mood}
                  badge="TIEMPO"
                  title={formatMoodTense(mood, tense)}
                  subtitle="Ruta de aprendizaje"
                  description="Introducción, práctica guiada y aplicación progresiva."
                  detail={getPersonConjugationExample(mood, tense)}
                  onClick={() => onSelect(mood, tense)}
                  cardTitle={`Seleccionar ${formatMoodTense(mood, tense)}`}
                />
              ))}
            </div>
          </div>
        ))}
    </LearningMenuLayout>
  )
}

export default TenseSelectionStep
