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

  // Compute forms for current region (memoized for performance)
  const allFormsForRegion = useMemo(() => buildFormsForRegion(settings.region), [settings.region])

  // Initialize app state
  useEffect(() => {
    // Ensure Resistance mode is off on app load (but keep other persisted values)
    settings.set({ resistanceActive: false, resistanceMsLeft: 0, resistanceStartTs: null })
    
    // Warm up performance caches
    warmupCaches()
    
    // Initialize progress system with proper error handling
    // This is done after UI renders to prevent blank page if initialization fails
    setTimeout(async () => {
      try {
        const { initProgressSystem } = await import('../lib/progress/index.js')
        await initProgressSystem()
        console.log('✅ Progress system initialized successfully')
      } catch (error) {
        console.warn('⚠️ Progress system initialization failed, app will continue without it:', error)
        // App continues to work even if progress system fails
      }
    }, 100)
    
    // Log cache stats in development
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.log('📊 Cache Stats:', getCacheStats())
      }, 1000)
    }

    // Ensure we have a guard history entry so hardware back doesn't exit immediately
    try {
      const st = window.history.state
      const step = onboardingFlow.onboardingStep || 1
      if (!st || !st.appNav) {
        window.history.replaceState({ appNav: true, mode: 'onboarding', step, flowType: null, ts: Date.now() }, '')
      }
      // Push guard entry to keep one step inside the app
      window.history.pushState({ appNav: true, mode: 'onboarding', step, flowType: null, ts: Date.now() }, '')
    } catch {}
  }, [])

  const handleStartPractice = () => {
    // Push a history entry so the hardware back goes back to onboarding from drill
    try { window.history.pushState({ appNav: true, mode: 'drill', step: null, flowType: flowType, ts: Date.now() }, '') } catch {}
    setCurrentMode('drill')
  }

  const handleHome = () => {
    // ... (This function's logic can be simplified or reviewed later if needed)
    const previousStep = 2 // Always return to the main menu
    const previousFlowType = null

    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    try { 
      window.history.pushState({ appNav: true, mode: 'onboarding', step: previousStep, flowType: previousFlowType, ts: Date.now() }, '') 
    } catch {}
    
    setCurrentMode('onboarding')
    setFlowType(previousFlowType)
    onboardingFlow.setOnboardingStep(previousStep)
    drillMode.setCurrentItem(null)
    drillMode.setHistory({})
  }

  // Generate next item when entering drill mode
  useEffect(() => {
    if (currentMode === 'drill' && settings.region && !drillMode.currentItem && 
        settings.practiceMode && settings.verbType && 
        (settings.practiceMode === 'mixed' || (settings.specificMood && settings.specificTense))) {
      window.scrollTo(0, 0)
      drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, allFormsForRegion, drillMode, onboardingFlow])

  // Sync browser/hardware back with in-app state using History API state
  useEffect(() => {
    const onPopState = (e) => {
      console.log(`🔙 PopState triggered:`, e.state)
      
      const st = e.state || window.history.state || {}
      if (st && st.appNav) {
        console.log(`📋 Valid app navigation state:`, st)
        
        if (st.mode === 'drill') {
          setCurrentMode('drill')
          if (!drillMode.currentItem) {
            console.log(`🔧 Regenerating drill item after back navigation`)
            setTimeout(() => {
              drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
            }, 100)
          }
        } else {
          setCurrentMode('onboarding')
          setFlowType(st.flowType || null)
          
          if (typeof st.step === 'number' && st.step >= 1 && st.step <= 8) {
            console.log(`🎯 Navigating to step ${st.step}`)
            try { 
              onboardingFlow.setOnboardingStep(st.step)
              cleanupStateForStep(st.step)
            } catch (err) {
              console.error('Error setting onboarding step:', err)
              onboardingFlow.setOnboardingStep(2)
              setFlowType(null)
              cleanupStateForStep(2)
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
        console.log(`⚠️  No valid app state found, creating guard entry`)
        try {
          const currentStep = onboardingFlow.onboardingStep || 2
          const mode = currentMode || 'onboarding'
          
          console.log(`🛡️  Creating guard state: mode=${mode}, step=${currentStep}`)
          window.history.pushState({ appNav: true, mode, step: currentStep, flowType, ts: Date.now() }, '')
          
          setCurrentMode(mode)
          if (mode === 'onboarding') {
            onboardingFlow.setOnboardingStep(currentStep)
          }
        } catch (err) {
          console.error('Error creating guard state:', err)
        }
      }
    }
    
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [onboardingFlow.setOnboardingStep, currentMode, drillMode, allFormsForRegion, flowType])

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    const updates = {}
    
    if (targetStep === 1) {
      updates.cameFromTema = false
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
      updates.level = null
      updates.practiceMode = null
    }
    else if (targetStep === 2) {
        updates.cameFromTema = false
        updates.specificMood = null
        updates.specificTense = null
        updates.verbType = null
        updates.selectedFamily = null
        updates.level = null
        updates.practiceMode = null
    }
    else if (targetStep === 3) {
      if (flowType === 'por_nivel') {
        updates.practiceMode = null
        updates.specificMood = null
        updates.specificTense = null
        updates.verbType = null
        updates.selectedFamily = null
      }
    }
    else if (targetStep === 4) {
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
    }
    else if (targetStep === 5) {
      updates.specificTense = null
      updates.selectedFamily = null
    }
    else if (targetStep === 7) {
      updates.selectedFamily = null
    }

    if (Object.keys(updates).length > 0) {
      settings.set(updates)
    }
  }

  const handleFlowTypeSelection = (selectedFlowType) => {
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
      window.history.pushState({ appNav: true, mode: 'onboarding', step: nextStep, flowType: selectedFlowType, ts: Date.now() }, '')
    } catch {}
  }

  if (currentMode === 'onboarding') {
    if (flowType === 'por_nivel') {
      return <OnboardingFlowPorNivel onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} formsForRegion={allFormsForRegion} />
    } else if (flowType === 'por_tema') {
      return <OnboardingFlowPorTema onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} formsForRegion={allFormsForRegion} />
    } else {
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
