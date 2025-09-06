import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import LearnTenseFlow from './learning/LearnTenseFlow.jsx';
import { lazy } from 'react'

const ProgressDashboard = lazy(() => import('../features/progress/ProgressDashboard.jsx'))
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
// Debug utilities - commented out to avoid unused imports
// import { warmupCaches, getCacheStats } from '../lib/core/optimizedCache.js'
import { buildFormsForRegion } from '../lib/core/eligibility.js'
// import { getEligiblePool, buildNonfiniteFormsForLemma } from '../lib/core/nonfiniteBuilder.js'
import { initProgressSystem } from '../lib/progress/index.js'

function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings()
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow()

  // Track previous settings to detect changes from progress navigation
  const prevSettingsRef = useRef({
    practiceMode: settings.practiceMode,
    specificMood: settings.specificMood,
    specificTense: settings.specificTense,
    verbType: settings.verbType,
    selectedFamily: settings.selectedFamily
  })

  console.log('--- RENDER AppRouter ---', { 
    currentMode,
    onboardingStep: onboardingFlow.onboardingStep
  });

  // Compute forms for current region (memoized for performance)
  const allFormsForRegion = useMemo(() => buildFormsForRegion(settings.region), [settings.region])

  // Initialize app state
  useEffect(() => {
    // Initialize progress system on app load
    initProgressSystem().then((userId) => {
      console.log('✅ Sistema de progreso inicializado con usuario:', userId)
    }).catch((error) => {
      console.error('❌ Error inicializando sistema de progreso:', error)
    })
  }, [])

  // Allow deep-linking into modes via query param (e.g., ?mode=learning)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || '')
      const mode = params.get('mode')
      if (mode && ['onboarding','drill','learning','progress'].includes(mode)) {
        setCurrentMode(mode)
        const state = { appNav: true, mode, ts: Date.now() }
        try { window.history.replaceState(state, '') } catch {}
      }
    } catch (err) {
      // ignore URL parsing issues
    }
  }, [])

  const handleStartPractice = () => {
    console.log('🚀 handleStartPractice called');
    setCurrentMode('drill')
    // Push history state for drill mode
    try {
      const historyState = { appNav: true, mode: 'drill', ts: Date.now() };
      window.history.pushState(historyState, '')
    } catch {
      // Ignore history API errors
    }
  }

  const handleHome = () => {
    console.log('🏠 handleHome called');
    try {
      setCurrentMode('onboarding')
      // Navigate to onboarding step 2 (menú por tema/nivel/seguir)
      cleanupStateForStep(2)
      onboardingFlow.setOnboardingStep(2)
      const historyState = { appNav: true, mode: 'onboarding', step: 2, ts: Date.now() }
      window.history.pushState(historyState, '')
    } catch (e) {
      // Fallback
      setCurrentMode('onboarding')
      onboardingFlow.setOnboardingStep(2)
    }
  }

  const handleGoToProgress = () => {
    console.log('📊 handleGoToProgress called');
    setCurrentMode('progress')
    // Push history state for progress mode
    try {
      const historyState = { appNav: true, mode: 'progress', ts: Date.now() };
      window.history.pushState(historyState, '')
    } catch {
      // Ignore history API errors
    }
  }

  const handleStartLearningNewTense = () => {
    console.log('🧠 handleStartLearningNewTense called');
    setCurrentMode('learning');
    // You might want to push a history state here as well
    try {
      const historyState = { appNav: true, mode: 'learning', ts: Date.now() };
      window.history.pushState(historyState, '');
    } catch {
      // Ignore
    }
  };

  // From Progress page: go to onboarding menu step 2 (no dialects)
  const handleProgressMenu = () => {
    try {
      setCurrentMode('onboarding')
      // Clean up state for step 2 but keep region (dialect) as selected
      cleanupStateForStep(2)
      onboardingFlow.setOnboardingStep(2)
      const historyState = { appNav: true, mode: 'onboarding', step: 2, ts: Date.now() }
      window.history.pushState(historyState, '')
    } catch (e) {
      console.warn('Failed to navigate to onboarding step 2 from progress:', e)
      setCurrentMode('onboarding')
      onboardingFlow.setOnboardingStep(2)
    }
  }

  // Generate next item when entering drill mode OR when settings change while in drill mode
  useEffect(() => {
    // Check if we're in drill mode
    if (currentMode === 'drill') {
      // Detect if specific practice settings changed
      const settingsChanged = 
        prevSettingsRef.current.practiceMode !== settings.practiceMode ||
        prevSettingsRef.current.specificMood !== settings.specificMood ||
        prevSettingsRef.current.specificTense !== settings.specificTense ||
        prevSettingsRef.current.verbType !== settings.verbType ||
        prevSettingsRef.current.selectedFamily !== settings.selectedFamily;

      // If settings changed and we have a current item, clear it first
      if (settingsChanged && drillMode.currentItem && drillMode.clearCurrentItem) {
        console.log('🔄 Practice settings changed while in drill mode, clearing current item');
        drillMode.clearCurrentItem();
      }

      // Generate new item if we don't have one (either new entry or after clearing)
      if (!drillMode.currentItem) {
        console.log('🎯 Generating drill item');
        drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
      }

      // Update previous settings reference
      prevSettingsRef.current = {
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily
      };
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, allFormsForRegion, drillMode, onboardingFlow])

  // Sync browser/hardware back with in-app state using History API state
  useEffect(() => {
    const onPopState = (e) => {
      console.group('🔙 PopState Triggered');
      console.log('History event state:', e.state);
      
      const st = e.state || window.history.state || {}
      if (st && st.appNav) {
        console.log('📋 Valid app navigation state found:', st)
        
        if (st.mode === 'drill' && currentMode === 'drill') {
          // Only allow drill mode navigation when already in drill mode
          setCurrentMode('drill')
          if (!drillMode.currentItem) {
            console.log('🔧 Regenerating drill item after back navigation')
            setTimeout(() => {
              drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
            }, 100)
          }
        } else if (st.mode === 'progress') {
          // Handle progress navigation
          setCurrentMode('progress')
        } else if (st.mode === 'onboarding' || (st.mode === 'drill' && currentMode === 'onboarding')) {
          // Handle onboarding navigation OR ignore drill states when in onboarding
          console.log('PRE-UPDATE state:', { currentMode, step: onboardingFlow.onboardingStep });
          setCurrentMode('onboarding')
          
          if (typeof st.step === 'number' && st.step >= 1 && st.step <= 8) {
            console.log(`🎯 Navigating to step ${st.step}`)
            try { 
              cleanupStateForStep(st.step)
              onboardingFlow.setOnboardingStep(st.step)
            } catch (err) {
              console.error('Error setting onboarding step:', err)
              cleanupStateForStep(1)
              onboardingFlow.setOnboardingStep(1)
            }
          } else {
            console.log(`⚠️  Invalid step in state, defaulting to step 1`)
            try { 
              onboardingFlow.setOnboardingStep(1)
            } catch (error) {
              console.error('Failed to set onboarding step:', error)
            }
          }
        }
      } else {
        // ... (same)
      }
      console.groupEnd();
    }
    
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [onboardingFlow.setOnboardingStep, currentMode, drillMode, allFormsForRegion])

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    console.log(`🧹 cleanupStateForStep called for step: ${targetStep}`);
    const updates = {}
    
    // Clear settings based on target step
    // DO NOT clear region for step 1 - it should keep selected region
    if (targetStep < 1) {
      updates.region = null
    }
    if (targetStep < 3) {
      updates.level = null
    }
    if (targetStep < 4) {
      updates.practiceMode = null
    }
    if (targetStep <= 5) {
      updates.specificMood = null
      updates.specificTense = null
    }
    if (targetStep < 6) {
      updates.verbType = null
    }
    if (targetStep < 7) {
      updates.selectedFamily = null
    }

    if (Object.keys(updates).length > 0) {
      console.log('Applying state cleanup:', updates);
      settings.set(updates)
    }
  }


  // Handler functions for drill mode settings changes
  const handleDialectChange = (dialect) => {
    onboardingFlow.selectDialect(dialect)
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleLevelChange = (level) => {
    onboardingFlow.selectLevel(level)
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePracticeModeChange = (mode, mood = null, tense = null) => {
    console.log(`Practice mode change: ${mode}, mood: ${mood}, tense: ${tense}`)
    settings.set({ 
      practiceMode: mode,
      specificMood: mood,
      specificTense: tense
    })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handlePronounPracticeChange = (pronoun) => {
    settings.set({ practicePronoun: pronoun })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleVerbTypeChange = (verbType, selectedFamily) => {
    settings.set({ 
      verbType,
      selectedFamily: verbType !== 'irregular' ? null : selectedFamily
    })
    drillMode.clearHistoryAndRegenerate(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleStartSpecificPractice = () => {
    // Initialize block for A1/A2: one tense per tanda
    const lvl = settings.level
    if (lvl === 'A1' || lvl === 'A2') {
      settings.set({
        currentBlock: {
          combos: [{ mood: settings.specificMood, tense: settings.specificTense }],
          itemsRemaining: 8
        }
      })
    } else {
      settings.set({ currentBlock: null })
    }
    drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  const handleRegenerateItem = () => {
    drillMode.setCurrentItem(null)
    drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
  }

  if (currentMode === 'onboarding') {
    return (
      <OnboardingFlow 
        onStartPractice={handleStartPractice} 
        setCurrentMode={setCurrentMode} 
        formsForRegion={allFormsForRegion}
        // Pass all hook functions as props
        onboardingStep={onboardingFlow.onboardingStep}
        selectDialect={onboardingFlow.selectDialect}
        selectLevel={onboardingFlow.selectLevel}
        selectPracticeMode={onboardingFlow.selectPracticeMode}
        selectMood={onboardingFlow.selectMood}
        selectTense={onboardingFlow.selectTense}
        selectVerbType={onboardingFlow.selectVerbType}
        selectFamily={onboardingFlow.selectFamily}
        goBack={onboardingFlow.goBack}
        goToLevelDetails={onboardingFlow.goToLevelDetails}
        handleHome={onboardingFlow.handleHome}
        settings={onboardingFlow.settings}
        getAvailableMoodsForLevel={onboardingFlow.getAvailableMoodsForLevel}
        getAvailableTensesForLevelAndMood={onboardingFlow.getAvailableTensesForLevelAndMood}
        getModeSamples={onboardingFlow.getModeSamples}
        getConjugationExample={onboardingFlow.getConjugationExample}
        onGoToProgress={handleGoToProgress}
        onStartLearningNewTense={handleStartLearningNewTense}
      />
    )
  }

  if (currentMode === 'drill') {
    return (
      <DrillMode
        currentItem={drillMode.currentItem}
        settings={settings}
        onDrillResult={drillMode.handleDrillResult}
        onContinue={() => drillMode.handleContinue(allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)}
        onHome={handleHome}
        onRegenerateItem={handleRegenerateItem}
        onDialectChange={handleDialectChange}
        onLevelChange={handleLevelChange}
        onPracticeModeChange={handlePracticeModeChange}
        onPronounPracticeChange={handlePronounPracticeChange}
        onVerbTypeChange={handleVerbTypeChange}
        onStartSpecificPractice={handleStartSpecificPractice}
        getAvailableMoodsForLevel={onboardingFlow.getAvailableMoodsForLevel}
        getAvailableTensesForLevelAndMood={onboardingFlow.getAvailableTensesForLevelAndMood}
        onNavigateToProgress={handleGoToProgress}
      />
    )
  }

  if (currentMode === 'learning') {
    return (
      <LearnTenseFlow 
        onHome={handleHome}
        onGoToProgress={handleGoToProgress}
      />
    )
  }

  if (currentMode === 'progress') {
    return (
      <React.Suspense fallback={<div className="loading">Cargando progreso...</div>}>
        <ProgressDashboard 
          onNavigateHome={handleProgressMenu} 
          onNavigateToDrill={() => setCurrentMode('drill')} 
        />
      </React.Suspense>
    )
  }

  return (
    <div className="App">
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default AppRouter
