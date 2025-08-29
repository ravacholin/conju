import React, { useEffect } from 'react'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlowPorTema({ 
  onStartPractice, 
  setCurrentMode, 
  formsForRegion,
  // Receive hook functions as props from AppRouter
  onboardingFlow,
  settings
}) {
  const {
    onboardingStep,
    setOnboardingStep,
    selectMood,
    selectTense,
    selectVerbType,
    selectFamily,
    handleHome,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    getModeSamples,
    getConjugationExample,
  } = onboardingFlow

  // This flow starts after dialect selection.
  // Initialize Por Tema with correct step and settings
  useEffect(() => {
    console.log('🎯 OnboardingFlowPorTema useEffect - initializing', { 
      currentStep: onboardingStep, 
      practiceMode: settings.practiceMode 
    });
    
    if (settings.practiceMode !== 'theme') {
      settings.set({ practiceMode: 'theme', level: 'ALL' })
    }
    
    // When Por Tema flow is at step 5, force it to step 2 (MoodTenseSelection)
    // This handles both initial entry and back navigation to step 5
    if (onboardingStep === 5 && settings.practiceMode === 'theme') {
      console.log('🎯 Por Tema flow at step 5 - setting onboardingStep to 2 for MoodTenseSelection');
      setOnboardingStep(2)
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