import { useOnboardingFlow } from '../../hooks/useOnboardingFlow.js'
import DialectSelection from './DialectSelection.jsx'
import LevelSelection from './LevelSelection.jsx'
import PracticeModeSelection from './PracticeModeSelection.jsx'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

function OnboardingFlow({ onStartPractice }) {
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

  return (
    <div className="App">
      <div className="onboarding">
        <div className="center-column">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={handleHome} title="Ir al menú ¿Qué querés practicar?">
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
              onBack={goBack}
              showLevelDetails={false}
            />
          )}

          {/* Step 3: Specific Level Selection */}
          {onboardingStep === 3 && (
            <LevelSelection 
              onSelectLevel={selectLevel}
              onSelectPracticeMode={selectPracticeMode}
              onGoToLevelDetails={goToLevelDetails}
              onBack={goBack}
              showLevelDetails={true}
            />
          )}

          {/* Step 4: Practice Mode Selection */}
          {onboardingStep === 4 && (
            <PracticeModeSelection 
              onSelectPracticeMode={selectPracticeMode}
              onBack={goBack}
              settings={settings}
            />
          )}

          {/* Step 5: Mood/Tense Selection OR Verb Type Selection for Mixed Practice */}
          {onboardingStep === 5 && (
            <>
              {settings.level && settings.practiceMode === 'mixed' ? (
                <VerbTypeSelection 
                  onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
                  onBack={goBack}
                />
              ) : (
                <MoodTenseSelection 
                  settings={settings}
                  onSelectMood={selectMood}
                  onSelectTense={selectTense}
                  onBack={goBack}
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
              {settings.verbType === 'irregular' && settings.level && settings.practiceMode === 'mixed' ? (
                <FamilySelection 
                  settings={settings}
                  onSelectFamily={(familyId) => selectFamily(familyId, onStartPractice)}
                  onBack={goBack}
                />
              ) : settings.level ? (
                <MoodTenseSelection 
                  settings={settings}
                  onSelectMood={selectMood}
                  onSelectTense={selectTense}
                  onBack={goBack}
                  getAvailableMoodsForLevel={getAvailableMoodsForLevel}
                  getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
                  getModeSamples={getModeSamples}
                  getConjugationExample={getConjugationExample}
                />
              ) : (
                <VerbTypeSelection 
                  onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
                  onBack={goBack}
                />
              )}
            </>
          )}

          {/* Step 7: Verb Type Selection for Level-Specific Practice */}
          {onboardingStep === 7 && settings.level && (
            <VerbTypeSelection 
              onSelectVerbType={(verbType) => selectVerbType(verbType, onStartPractice)}
              onBack={goBack}
            />
          )}

          {/* Step 8: Family Selection for Irregular Verbs */}
          {onboardingStep === 8 && settings.verbType === 'irregular' && (
            <FamilySelection 
              settings={settings}
              onSelectFamily={(familyId) => selectFamily(familyId, onStartPractice)}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow