import React from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'
import { MOOD_LABELS, formatMoodTense } from '../../lib/utils/verbLabels.js'
import { verbs as defaultVerbs } from '../../data/verbs.js'

function TenseSelectionStep({ availableTenses, onSelect, onHome, useVoseo = false, verbsData = defaultVerbs }) {
  if (!availableTenses || Object.keys(availableTenses).length === 0) {
    return null
  }

  const getPersonConjugationExample = (moodKey, tenseKey) => {
    const hablar = verbsData.find(v => v.lemma === 'hablar')
    if (!hablar) {
      if (tenseKey === 'ger') return 'hablando'
      if (tenseKey === 'part') return 'hablado'
      return ''
    }

    const moodMap = {
      indicativo: 'indicative',
      subjuntivo: 'subjunctive',
      imperativo: 'imperative',
      condicional: 'conditional',
      nonfinite: 'nonfinite'
    }

    const englishMood = moodMap[moodKey] || moodKey
    const para = hablar.paradigms?.find(p => p.forms?.some(f => f.mood === englishMood && f.tense === tenseKey))

    if (!para) {
      if (tenseKey === 'ger') return 'hablando'
      if (tenseKey === 'part') return 'hablado'
      return ''
    }

    const forms = para.forms?.filter(f => f.mood === englishMood && f.tense === tenseKey) || []
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
    <div className="App">
      <div className="onboarding learn-flow">
        <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
          <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
        </ClickableCard>

        {Object.entries(availableTenses).map(([mood, tenses]) => (
          <div key={mood} className="tense-section">
            <h2>{MOOD_LABELS[mood] || mood}</h2>
            <div className="options-grid">
              {tenses.map(tense => (
                <ClickableCard
                  key={tense}
                  className="option-card"
                  onClick={() => onSelect(mood, tense)}
                  title={`Seleccionar ${formatMoodTense(mood, tense)}`}
                >
                  <h3>{formatMoodTense(mood, tense)}</h3>
                  <p className="example">{getPersonConjugationExample(mood, tense)}</p>
                </ClickableCard>
              ))}
            </div>
          </div>
        ))}

        <button className="back-btn" onClick={onHome}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </div>
    </div>
  )
}

export default TenseSelectionStep
