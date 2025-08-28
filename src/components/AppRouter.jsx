import React, { useState, useEffect, useMemo } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { warmupCaches, getCacheStats } from '../lib/core/optimizedCache.js'
import { getEligiblePool, buildFormsForRegion } from '../lib/core/eligibility.js'
import { buildNonfiniteFormsForLemma } from '../lib/core/nonfiniteBuilder.js'

function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings()
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow()

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
        window.history.replaceState({ appNav: true, mode: 'onboarding', step, ts: Date.now() }, '')
      }
      // Push guard entry to keep one step inside the app
      window.history.pushState({ appNav: true, mode: 'onboarding', step, ts: Date.now() }, '')
    } catch {}
  }, [])

  const handleStartPractice = () => {
    // Push a history entry so the hardware back goes back to onboarding from drill
    try { window.history.pushState({ appNav: true, mode: 'drill', step: null, ts: Date.now() }, '') } catch {}
    setCurrentMode('drill')
  }

  const handleHome = () => {
    // Scroll to top when returning to menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try { window.history.pushState({ appNav: true, mode: 'onboarding', step: 2, ts: Date.now() }, '') } catch {}
    setCurrentMode('onboarding')
    drillMode.setCurrentItem(null)
    drillMode.setHistory({})
  }

  // Generate next item when entering drill mode
  useEffect(() => {
    if (currentMode === 'drill' && settings.region && !drillMode.currentItem && 
        settings.practiceMode && settings.verbType && 
        (settings.practiceMode === 'mixed' || (settings.specificMood && settings.specificTense))) {
      // Scroll to top when entering drill mode
      window.scrollTo(0, 0)
      drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
    }
  }, [currentMode, settings.region, settings.practiceMode, settings.specificMood, settings.specificTense, settings.verbType, settings.selectedFamily, allFormsForRegion, drillMode, onboardingFlow])

  // Sync browser/hardware back with in-app state using History API state
  useEffect(() => {
    // Mark current entry if not already marked
    try {
      const st = window.history.state
      if (!st || !st.appNav) {
        window.history.replaceState({ appNav: true, mode: 'onboarding', step: onboardingFlow.onboardingStep || 1, ts: Date.now() }, '')
      }
    } catch {}

    const onPopState = (e) => {
      const st = e.state || window.history.state || {}
      if (st && st.appNav) {
        if (st.mode === 'drill') {
          setCurrentMode('drill')
        } else {
          setCurrentMode('onboarding')
          // Drive onboarding step directly from history state
          if (typeof st.step === 'number') {
            try { 
              onboardingFlow.setOnboardingStep(st.step)
              // Enhanced state cleanup based on navigation target
              cleanupStateForStep(st.step)
            } catch (err) {
              console.error('Error setting onboarding step:', err)
            }
          } else {
            try { onboardingFlow.setOnboardingStep(1) } catch {}
          }
        }
      } else {
        // Not our state; re-insert a guard state to keep navigation inside app
        try {
          const step = onboardingFlow.onboardingStep || 1
          window.history.pushState({ appNav: true, mode: 'onboarding', step, ts: Date.now() }, '')
          setCurrentMode('onboarding')
          onboardingFlow.setOnboardingStep(step)
        } catch {}
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [onboardingFlow, settings])

  // Enhanced state cleanup function
  const cleanupStateForStep = (targetStep) => {
    const updates = {}
    
    // Step 1: Clear everything when going back to dialect selection
    if (targetStep === 1) {
      updates.cameFromTema = false
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
      updates.level = null
      updates.practiceMode = null
    }
    
    // Step 2: Clear practice-specific settings when going back to main menu
    else if (targetStep === 2) {
      updates.cameFromTema = false
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
    }
    
    // Step 3: Clear practice mode when going back to level details
    else if (targetStep === 3) {
      updates.practiceMode = null
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
    }
    
    // Step 4: Clear mood/tense selections when going back to practice mode
    else if (targetStep === 4) {
      updates.specificMood = null
      updates.specificTense = null
      updates.verbType = null
      updates.selectedFamily = null
    }
    
    // Step 5: Clear tense selection when going back to mood selection
    else if (targetStep === 5) {
      // For theme-based practice, we might need to clear mood
      if (settings.cameFromTema && settings.specificMood && !settings.specificTense) {
        updates.specificMood = null
      } else {
        updates.specificTense = null
        updates.selectedFamily = null
      }
    }
    
    // Step 6: Clear family selection when going back to verb type
    else if (targetStep === 6) {
      // If we have both mood and tense, we're going back to tense selection
      if (settings.specificMood && settings.specificTense) {
        updates.specificTense = null
      }
      // If we have only mood, we're going back to mood selection
      else if (settings.specificMood && !settings.specificTense) {
        updates.specificMood = null
      }
      updates.selectedFamily = null
    }
    
    // Step 7: Clear family when going back to verb type selection
    else if (targetStep === 7) {
      updates.selectedFamily = null
    }

    if (Object.keys(updates).length > 0) {
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
    return <OnboardingFlow onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} formsForRegion={allFormsForRegion} />
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
