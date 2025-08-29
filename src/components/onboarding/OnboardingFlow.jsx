import React from 'react'
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
  // Hook functions from AppRouter
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
}) {

  // Unified back behavior: use browser history for both UI and hardware back
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

          {/* Step 5: MoodTenseSelection (for theme practice) OR VerbTypeSelection (for mixed practice) */}
          {onboardingStep === 5 && (
            <>
              {settings.practiceMode === 'mixed' ? (
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

          {/* Step 6: MoodTenseSelection for mixed practice OR Tense selection after mood in theme practice */}
          {onboardingStep === 6 && (
            <>
              {settings.practiceMode === 'mixed' && settings.verbType === 'irregular' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) ? (
                <FamilySelection 
                  settings={settings}
                  onSelectFamily={(familyId) => selectFamily(familyId, onStartPractice)}
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

          {/* Step 7: VerbTypeSelection for any practice mode */}
          {onboardingStep === 7 && (
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
