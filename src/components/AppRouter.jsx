import React, { useState, useEffect, useMemo } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import OnboardingFlowPorNivel from './onboarding/OnboardingFlowPorNivel.jsx'
import OnboardingFlowPorTema from './onboarding/OnboardingFlowPorTema.jsx'
import DrillMode from './drill/DrillMode.jsx'
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { warmupCaches, getCacheStats } from '../lib/core/optimizedCache.js'
import { getEligiblePool, buildFormsForRegion } from '../lib/core/eligibility.js'
import { buildNonfiniteFormsForLemma } from '../lib/core/nonfiniteBuilder.js'

function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const [flowType, setFlowType] = useState(null) // 'por_nivel' | 'por_tema' | null
  const settings = useSettings()
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow(flowType)

  console.log('--- RENDER AppRouter ---', { 
    currentMode,
    flowType,
    onboardingStep: onboardingFlow.onboardingStep
  });

  // Compute forms for current region (memoized for performance)
  const allFormsForRegion = useMemo(() => buildFormsForRegion(settings.region), [settings.region])

  // Initialize app state
  useEffect(() => {
    // ... (same)
  }, [])

  const handleStartPractice = () => {
    // ... (same)
  }

  const handleHome = () => {
    // ... (same)
  }

  // Generate next item when entering drill mode
  useEffect(() => {
    // ... (same)
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, allFormsForRegion, drillMode, onboardingFlow])

  // Sync browser/hardware back with in-app state using History API state
  useEffect(() => {
    const onPopState = (e) => {
      console.group('🔙 PopState Triggered');
      console.log('History event state:', e.state);
      
      const st = e.state || window.history.state || {}
      if (st && st.appNav) {
        console.log('📋 Valid app navigation state found:', st)
        
        if (st.mode === 'drill') {
          setCurrentMode('drill')
          if (!drillMode.currentItem) {
            console.log('🔧 Regenerating drill item after back navigation')
            setTimeout(() => {
              drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
            }, 100)
          }
        } else {
          console.log('PRE-UPDATE state:', { currentMode, flowType, step: onboardingFlow.onboardingStep });
          setCurrentMode('onboarding')
          setFlowType(st.flowType || null)
          
          if (typeof st.step === 'number' && st.step >= 1 && st.step <= 8) {
            console.log(`🎯 Navigating to step ${st.step} with flowType: ${st.flowType || null}`)
            try { 
              onboardingFlow.setOnboardingStep(st.step)
              cleanupStateForStep(st.step, st.flowType || null)
            } catch (err) {
              console.error('Error setting onboarding step:', err)
              onboardingFlow.setOnboardingStep(2)
              setFlowType(null)
              cleanupStateForStep(2, null)
            }
          } else {
            console.log(`⚠️  Invalid step in state, defaulting to step 1`)
            try { 
              onboardingFlow.setOnboardingStep(1)
              setFlowType(null)
            } catch {}
          }
        }
      } else {
        // ... (same)
      }
      console.groupEnd();
    }
    
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [onboardingFlow.setOnboardingStep, currentMode, drillMode, allFormsForRegion, flowType])

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep, targetFlowType) => {
    console.log(`🧹 cleanupStateForStep called for step: ${targetStep}, flow: ${targetFlowType}`);
    const updates = {}
    
    // ... (same logic, but now can use targetFlowType if needed)

    if (Object.keys(updates).length > 0) {
      console.log('Applying state cleanup:', updates);
      settings.set(updates)
    }
  }

  const handleFlowTypeSelection = (selectedFlowType) => {
    console.group('👉 handleFlowTypeSelection');
    console.log(`🎯 Flow type selected: ${selectedFlowType}`)
    let nextStep = 2;

    if (selectedFlowType === 'por_nivel') {
      nextStep = 3;
      onboardingFlow.goToLevelDetails();
    } else if (selectedFlowType === 'por_tema') {
      nextStep = 5;
      onboardingFlow.selectPracticeMode('theme');
    }

    setFlowType(selectedFlowType)
    onboardingFlow.setOnboardingStep(nextStep)
    try {
      const historyState = { appNav: true, mode: 'onboarding', step: nextStep, flowType: selectedFlowType, ts: Date.now() };
      console.log('Pushing new history state:', historyState);
      window.history.pushState(historyState, '')
    } catch {}
    console.groupEnd();
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

  const handlePracticeModeChange = (mode) => {
    settings.set({ 
      practiceMode: mode,
      specificMood: null,
      specificTense: null
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
    if (flowType === 'por_nivel') {
      return <OnboardingFlowPorNivel onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} formsForRegion={allFormsForRegion} />
    } else if (flowType === 'por_tema') {
      return <OnboardingFlowPorTema 
        onStartPractice={handleStartPractice} 
        setCurrentMode={setCurrentMode} 
        formsForRegion={allFormsForRegion} 
        onboardingFlow={onboardingFlow}
        settings={settings}
      />
    } else {
      // Main menu - show flow selection
      return <OnboardingFlow onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} formsForRegion={allFormsForRegion} onSelectFlowType={handleFlowTypeSelection} />
    }
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
      />
    )
  }

  return (
    <div className="App">
      <div className="loading">Cargando aplicación...</div>
    </div>
  )
}

export default AppRouter
