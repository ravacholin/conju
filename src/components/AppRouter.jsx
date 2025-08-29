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

  // ... (rest of the component is the same)
