import React, { useEffect } from 'react'
import { useOnboardingFlow } from '../../hooks/useOnboardingFlow.js'
import LevelSelection from './LevelSelection.jsx'
import PracticeModeSelection from './PracticeModeSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlowPorNivel({ onStartPractice, setCurrentMode }) {
  const {
    onboardingStep,
    setOnboardingStep,
    selectLevel,
    selectPracticeMode,
    selectVerbType,
    selectFamily,
    handleHome,
    settings,
  } = useOnboardingFlow()

  // This flow starts after the main menu, so we reset the step to a local context.
  // We will use step 3 from the main hook as the entry point.
  useEffect(() => {
    if (onboardingStep < 3) {
      setOnboardingStep(3)
    }
  }, [onboardingStep, setOnboardingStep])


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

          {/* Step 3: Specific Level Selection */}
          {onboardingStep === 3 && (
            <LevelSelection
              onSelectLevel={selectLevel}
              onBack={handleBack}
              showLevelDetails={true}
            />
          )}

          {/* Step 4: Practice Mode Selection */}
          {onboardingStep === 4 && (
            <PracticeModeSelection
              onSelectPracticeMode={selectPracticeMode}
              onBack={handleBack}
              settings={settings}
            />
          )}

          {/* Step 5: Verb Type Selection for Mixed Practice */}
          {onboardingStep === 5 && settings.practiceMode === 'mixed' && (
            <VerbTypeSelection
              onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
              onBack={handleBack}
            />
          )}

          {/* Step 6: Family Selection for Irregular Verbs in Mixed Practice */}
          {onboardingStep === 6 && settings.practiceMode === 'mixed' && settings.verbType === 'irregular' && (
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

export default OnboardingFlowPorNivel