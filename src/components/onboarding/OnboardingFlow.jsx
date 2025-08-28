import React from 'react'
import { useOnboardingFlow } from '../../hooks/useOnboardingFlow.js'
import DialectSelection from './DialectSelection.jsx'
import LevelSelection from './LevelSelection.jsx'
import PracticeModeSelection from './PracticeModeSelection.jsx'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlow({ 
  onStartPractice, 
  setCurrentMode, 
  formsForRegion,
  // New flow-based props
  flowType = null,
  flowNavigation = null,
  onFlowSelection = null,
  onBackToMainMenu = null 
}) {
  const {
    onboardingStep,
    selectDialect,
    selectLevel,
    selectPracticeMode,
    selectMood,
    selectTense,
    selectVerbType,
    selectFamily,
    goBack,
    goToLevelDetails,
    handleHome,
    settings,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    getModeSamples,
    getConjugationExample
  } = useOnboardingFlow()

  // Unified back behavior: prefer flow navigation if available
  const handleBack = () => {
    if (flowNavigation && flowNavigation.canGoBack) {
      console.log(`🔙 Using flow navigation for back`)
      flowNavigation.goBack()
    } else {
      try { 
        console.log(`🔙 Using browser history for back`)
        window.history.back() 
      } catch { 
        /* ignore */ 
      }
    }
  }
  
  // Handle flow selection from main menu
  const handleFlowSelectionFromMenu = (selectedFlowType) => {
    console.log(`📋 Flow selected from menu: ${selectedFlowType}`)
    if (onFlowSelection) {
      onFlowSelection(selectedFlowType)
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

          {/* Step 2: Level Selection Mode */}
          {onboardingStep === 2 && (
            <LevelSelection 
              onSelectLevel={selectLevel}
              onSelectPracticeMode={selectPracticeMode}
              onGoToLevelDetails={goToLevelDetails}
              onBack={handleBack}
              showLevelDetails={false}
              // New flow-based props
              onFlowSelection={handleFlowSelectionFromMenu}
              flowType={flowType}
              flowNavigation={flowNavigation}
            />
          )}

          {/* Step 3: Specific Level Selection */}
          {onboardingStep === 3 && (
            <LevelSelection 
              onSelectLevel={selectLevel}
              onSelectPracticeMode={selectPracticeMode}
              onGoToLevelDetails={goToLevelDetails}
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

          {/* Step 5: Mood/Tense Selection OR Verb Type Selection for Mixed Practice */}
          {onboardingStep === 5 && (
            <>
              {settings.level && settings.practiceMode === 'mixed' ? (
                <VerbTypeSelection 
                  onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
                  onBack={handleBack}
                />
              ) : (
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
            </>
          )}

          {/* Step 6: Multiple cases - Family Selection or Tense Selection */}
          {onboardingStep === 6 && (
            <>
              {settings.verbType === 'irregular' && settings.level && settings.practiceMode === 'mixed' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) ? (
                <FamilySelection 
                  settings={settings}
                  onSelectFamily={(familyId) => selectFamily(familyId, onStartPractice)}
                  onBack={handleBack}
                />
              ) : settings.level ? (
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
              ) : (
                <VerbTypeSelection 
                  onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
                  onBack={handleBack}
                />
              )}
            </>
          )}

          {/* Step 7: Verb Type Selection for Level-Specific Practice */}
          {onboardingStep === 7 && settings.level && (
            <VerbTypeSelection 
              onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
              onBack={handleBack}
            />
          )}

          {/* Step 8: Family Selection for Irregular Verbs */}
          {onboardingStep === 8 && settings.verbType === 'irregular' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) && (
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

export default OnboardingFlow
