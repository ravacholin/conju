import React, { useState, useEffect, useMemo } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { warmupCaches, getCacheStats } from '../lib/core/optimizedCache.js'
import { getEligiblePool, buildFormsForRegion } from '../lib/core/eligibility.js'
import { buildNonfiniteFormsForLemma } from '../lib/core/nonfiniteBuilder.js'
// New flow-based navigation imports
import { getFlowConfig, getFlowTypeFromUrl, porNivelFlowConfig, porTemaFlowConfig } from '../lib/flows/flowConfigs.js'
import { useFlowNavigation } from '../lib/flows/useFlowNavigation.js'

function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings()
  
  // Detect flow type from URL or settings
  const [flowType, setFlowType] = useState(() => {
    // First try to get from URL
    const urlFlowType = getFlowTypeFromUrl(window.location.pathname)
    if (urlFlowType) return urlFlowType
    
    // Then try to get from settings
    if (settings.flowType) return settings.flowType
    
    // Default to null (will show main menu)
    return null
  })
  
  // Feature flag for gradual migration
  const useNewFlowSystem = true // TODO: Make this configurable
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow()
  
  // Initialize flow navigation (only if using new system and flow type is set)
  const flowConfig = flowType ? getFlowConfig(flowType) : null
  const flowNavigation = flowConfig ? useFlowNavigation(flowConfig) : null

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
    if (useNewFlowSystem && flowNavigation) {
      // Use new flow-based navigation
      flowNavigation.goToDrill()
      setCurrentMode('drill')
    } else {
      // Fallback to old system
      try { window.history.pushState({ appNav: true, mode: 'drill', step: null, ts: Date.now() }, '') } catch {}
      setCurrentMode('drill')
    }
  }

  const handleHome = () => {
    // Scroll to top when returning to menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    if (useNewFlowSystem && flowNavigation) {
      // Use new flow-based navigation - it will calculate the correct previous step
      console.log(`🏠 Using new flow navigation to go back from drill`)
      flowNavigation.goBack()
      setCurrentMode('onboarding')
    } else {
      // Fallback to old complex calculation logic
      const calculatePreviousStepFromDrill = () => {
        // Based on the current settings, determine where we came from
        if (settings.selectedFamily) {
          return 8  // Came from Family Selection
        } else if (settings.verbType && settings.specificTense) {
          return 7  // Came from Verb Type Selection (after tense selection)
        } else if (settings.specificTense) {
          return 6  // Came from Tense Selection
        } else if (settings.specificMood) {
          return 5  // Came from Mood Selection
        } else if (settings.practiceMode && settings.level) {
          return 4  // Came from Practice Mode Selection (Por nivel)
        } else {
          return 2  // Default: Main Menu (Por tema or initial)
        }
      }
      
      const previousStep = calculatePreviousStepFromDrill()
      console.log(`🏠 Drill → Onboarding step ${previousStep} (old system)`)
      
      try { 
        window.history.pushState({ appNav: true, mode: 'onboarding', step: previousStep, ts: Date.now() }, '') 
      } catch {}
      
      setCurrentMode('onboarding')
      onboardingFlow.setOnboardingStep(previousStep)
    }
    
    // Always clear drill state
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
        window.history.replaceState({ appNav: true, mode: currentMode, step: onboardingFlow.onboardingStep || 1, ts: Date.now() }, '')
      }
    } catch {}

    const onPopState = (e) => {
      console.log(`🔙 PopState triggered:`, e.state)
      
      const st = e.state || window.history.state || {}
      if (st && st.appNav) {
        console.log(`📋 Valid app navigation state:`, st)
        
        if (st.mode === 'drill') {
          setCurrentMode('drill')
          // Ensure drill has a current item when navigating back to it
          if (!drillMode.currentItem) {
            console.log(`🔧 Regenerating drill item after back navigation`)
            setTimeout(() => {
              drillMode.generateNextItem(null, allFormsForRegion, onboardingFlow.getAvailableMoodsForLevel, onboardingFlow.getAvailableTensesForLevelAndMood)
            }, 100)
          }
        } else {
          setCurrentMode('onboarding')
          // Drive onboarding step directly from history state
          if (typeof st.step === 'number' && st.step >= 1 && st.step <= 8) {
            console.log(`🎯 Navigating to step ${st.step}`)
            try { 
              onboardingFlow.setOnboardingStep(st.step)
              // Enhanced state cleanup based on navigation target
              cleanupStateForStep(st.step)
            } catch (err) {
              console.error('Error setting onboarding step:', err)
              // Fallback to main menu
              onboardingFlow.setOnboardingStep(2)
              cleanupStateForStep(2)
            }
          } else {
            console.log(`⚠️  Invalid step in state, defaulting to step 1`)
            try { onboardingFlow.setOnboardingStep(1) } catch {}
          }
        }
      } else {
        console.log(`⚠️  No valid app state found, creating guard entry`)
        // Not our state or no state; calculate proper step and re-insert guard state
        try {
          const currentStep = onboardingFlow.onboardingStep || 2
          const mode = currentMode || 'onboarding'
          
          console.log(`🛡️  Creating guard state: mode=${mode}, step=${currentStep}`)
          window.history.pushState({ appNav: true, mode, step: currentStep, ts: Date.now() }, '')
          
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
  }, [onboardingFlow.setOnboardingStep, currentMode, drillMode, allFormsForRegion])

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

  // New flow-based functions
  const handleFlowSelection = (selectedFlowType) => {
    console.log(`🚀 User selected flow: ${selectedFlowType}`)
    setFlowType(selectedFlowType)
    settings.set({ flowType: selectedFlowType })
    
    // Navigate to first step of the selected flow
    if (useNewFlowSystem) {
      // The flow navigation will be initialized on next render with the new flow type
      setTimeout(() => {
        const config = getFlowConfig(selectedFlowType)
        const firstStep = config.steps[0]
        // Navigate to the appropriate first step after main menu
        const secondStep = config.steps[2] // Skip dialect and main menu
        window.history.pushState({ 
          appNav: true, 
          flowType: selectedFlowType, 
          step: secondStep, 
          ts: Date.now() 
        }, '', config.urlPaths[secondStep])
      }, 50)
    }
  }

  const handleBackToMainMenu = () => {
    console.log(`🏠 Returning to main menu, clearing flow type`)
    setFlowType(null)
    settings.set({ flowType: null })
    
    // Clear flow-specific settings
    if (flowNavigation) {
      flowNavigation.clearFlowSettings()
    }
  }

  if (currentMode === 'onboarding') {
    // Determine which system to use
    if (useNewFlowSystem && flowType && flowNavigation) {
      console.log(`🎯 Using new flow system: ${flowType}`)
      // TODO: Return flow-specific components here
      // For now, fallback to old system with additional props
      return (
        <OnboardingFlow 
          onStartPractice={handleStartPractice} 
          setCurrentMode={setCurrentMode} 
          formsForRegion={allFormsForRegion}
          // New flow-based props
          flowType={flowType}
          flowNavigation={flowNavigation}
          onFlowSelection={handleFlowSelection}
          onBackToMainMenu={handleBackToMainMenu}
        />
      )
    } else {
      // Use old system (for main menu and fallback)
      return (
        <OnboardingFlow 
          onStartPractice={handleStartPractice} 
          setCurrentMode={setCurrentMode} 
          formsForRegion={allFormsForRegion}
          // Flow selection handlers for main menu
          onFlowSelection={handleFlowSelection}
        />
      )
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
        // New flow-based props
        flowType={flowType}
        flowNavigation={flowNavigation}
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
