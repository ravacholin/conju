import React, { useMemo } from 'react'
import PronunciationPractice from '../learning/PronunciationPractice.jsx'

function PronunciationPanel({ currentItem, onClose, onContinue }) {
  const tense = useMemo(() => {
    if (!currentItem) return null
    return {
      mood: currentItem.mood || null,
      tense: currentItem.tense || null
    }
  }, [currentItem])

  const eligibleForms = useMemo(() => {
    if (!currentItem) return []
    const value = currentItem.form?.value || currentItem.value
    if (!value) return []

    return [
      {
        verb: currentItem.lemma,
        lemma: currentItem.lemma,
        form: value,
        value,
        person: currentItem.person,
        mood: currentItem.mood,
        tense: currentItem.tense,
        type: currentItem.type
      }
    ]
  }, [currentItem])

  const handleContinue = () => {
    if (typeof onContinue === 'function') {
      onContinue()
    } else if (typeof onClose === 'function') {
      onClose()
    }
  }

  return (
    <div className="quick-switch-panel pronunciation-panel">
      <PronunciationPractice
        tense={tense}
        eligibleForms={eligibleForms}
        trackingItem={currentItem}
        onBack={onClose}
        onContinue={handleContinue}
      />
    </div>
  )
}

export default PronunciationPanel
