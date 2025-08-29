import React, { useEffect } from 'react'
import { useOnboardingFlow } from '../../hooks/useOnboardingFlow.js'
import DialectSelection from './DialectSelection.jsx'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlowPorTema({ onStartPractice, setCurrentMode, formsForRegion }) {
  const {
    onboardingStep,
    selectDialect,
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
    setOnboardingStep
  } = useOnboardingFlow()

  // Initialize Por Tema mode - ensure it's always set correctly
  useEffect(() => {
    console.log('🎯 OnboardingFlowPorTema mounted/updated, current practiceMode:', settings.practiceMode)
    if (settings.practiceMode !== 'theme') {
      console.log('🎯 Setting Por Tema mode')
      settings.setPracticeMode('theme')
      settings.setLevel('ALL')
    }
  }, [settings.practiceMode])


  // Proper back navigation for Por Tema flow
  const handleBack = () => {
    if (onboardingStep === 2) {
      // From mood selection back to dialect selection
      setOnboardingStep(1)
      settings.set({
        specificMood: null,
        specificTense: null,
        verbType: null,
        selectedFamily: null
      })
    } else if (onboardingStep === 3) {
      // From verb type back to mood selection  
      setOnboardingStep(2)
      settings.set({
        verbType: null,
        selectedFamily: null
      })
    } else if (onboardingStep === 4) {
      // From family selection back to verb type
      setOnboardingStep(3)
      settings.set({
        selectedFamily: null
      })
    } else {
      // Step 1: back to main menu - use handleHome which exists
      handleHome(setCurrentMode)
    }
  }

  return (
    <div className="App">
      <div className="onboarding">
        <div className="center-column">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={() => handleHome(setCurrentMode)} title="Ir al menú ¿Qué querés practicar?">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>
          
          {/* Step 1: Dialect Selection */}
          {onboardingStep === 1 && (
            <DialectSelection onSelectDialect={selectDialect} />
          )}

          {/* Step 2: Go directly to Mood/Tense selection for Por Tema (skip levels) */}
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