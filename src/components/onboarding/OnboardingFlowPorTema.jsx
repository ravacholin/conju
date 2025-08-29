import React, { useEffect } from 'react'
import { useOnboardingFlow } from '../../hooks/useOnboardingFlow.js'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlowPorTema({ onStartPractice, setCurrentMode, formsForRegion }) {
  const {
    onboardingStep,
    setOnboardingStep,
    selectMood,
    selectTense,
    selectVerbType,
    selectFamily,
    handleHome,
    settings,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    getModeSamples,
    getConjugationExample,
  } = useOnboardingFlow()

  // This flow starts after dialect selection.
  // Ensure we are at least at step 2 and that practiceMode is 'theme'.
  useEffect(() => {
    if (onboardingStep < 2) {
      setOnboardingStep(2)
    }
    if (settings.practiceMode !== 'theme') {
      settings.set({ practiceMode: 'theme', level: 'ALL' })
    }
  }, [onboardingStep, setOnboardingStep, settings])

  const handleBack = () => {
    try {
      window.history.back()
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="App">
      <div className="onboarding">
        <div className="center-column">
          <ClickableCard className="app-logo" onClick={() => handleHome(setCurrentMode)} title="Ir al menú ¿Qué querés practicar?">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>

          {/* Step 2: Mood/Tense selection */}
          {onboardingStep === 2 && (
            <MoodTenseSelection
              formsForRegion={formsForRegion}
              settings={settings}
              onSelectMood={selectMood}
              onSelectTense={selectTense}
              onBack={handleBack}
              getAvailableMoodsForLevel={getAvailableMoodsForLevel}
              getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
              getModeSamples={getModeSamples}
              getConjugationExample={getConjugationExample}
            />
          )}

          {/* Step 3: Verb Type Selection */}
          {onboardingStep === 3 && (
            <VerbTypeSelection
              onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
              onBack={handleBack}
            />
          )}

          {/* Step 4: Family Selection for Irregular Verbs */}
          {onboardingStep === 4 && settings.verbType === 'irregular' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) && (
            <FamilySelection
              settings={settings}
              onSelectFamily={(familyId) => selectFamily(familyId, onStartPractice)}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlowPorTema