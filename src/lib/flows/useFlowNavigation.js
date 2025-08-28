/**
 * Generic Flow Navigation Hook
 * 
 * Provides navigation logic for any flow based on its configuration.
 * Handles step management, browser history, and settings integration.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../state/settings.js'
import { STEPS } from './flowConfigs.js'

export function useFlowNavigation(flowConfig, initialStep = null) {
  const settings = useSettings()
  
  // Determine initial step
  const getInitialStep = () => {
    if (initialStep) return initialStep
    
    // Try to get step from URL
    const pathname = window.location.pathname
    const stepFromUrl = getStepFromUrl(pathname, flowConfig)
    if (stepFromUrl) return stepFromUrl
    
    // Default to first step in flow
    return flowConfig.steps[0]
  }
  
  const [currentStep, setCurrentStep] = useState(getInitialStep)
  
  // Push a browser history entry for navigation
  const pushHistory = useCallback((step) => {
    try {
      const url = flowConfig.urlPaths[step] || '/'
      const state = {
        appNav: true,
        flowType: flowConfig.type,
        step: step,
        ts: Date.now()
      }
      window.history.pushState(state, '', url)
      console.log(`📍 History pushed: ${step} → ${url}`)
    } catch (err) {
      console.error('Error pushing history:', err)
    }
  }, [flowConfig])
  
  // Navigate to a specific step
  const navigateToStep = useCallback((step) => {
    if (!flowConfig.steps.includes(step)) {
      console.error(`Invalid step for ${flowConfig.type} flow:`, step)
      return
    }
    
    console.log(`🧭 Navigating: ${currentStep} → ${step} (${flowConfig.type})`)
    setCurrentStep(step)
    pushHistory(step)
  }, [currentStep, flowConfig, pushHistory])
  
  // Get the previous step for current step
  const getPreviousStep = useCallback((step = currentStep) => {
    const navRule = flowConfig.navigation[step]
    if (!navRule || !navRule.prev) return null
    
    // Handle function-based navigation rules
    if (typeof navRule.prev === 'function') {
      return navRule.prev(settings)
    }
    
    return navRule.prev
  }, [currentStep, flowConfig, settings])
  
  // Get the next step for current step
  const getNextStep = useCallback((step = currentStep) => {
    const navRule = flowConfig.navigation[step]
    if (!navRule || !navRule.next) return null
    
    // Handle function-based navigation rules
    if (typeof navRule.next === 'function') {
      return navRule.next(settings)
    }
    
    return navRule.next
  }, [currentStep, flowConfig, settings])
  
  // Navigate to previous step
  const goBack = useCallback(() => {
    // First try browser history for hardware back compatibility
    try {
      const hasHistory = window.history.length > 1
      if (hasHistory) {
        console.log(`🔙 Using browser back navigation`)
        window.history.back()
        return
      }
    } catch {
      // Browser history failed, use manual navigation
    }
    
    // Manual navigation using flow config
    const prevStep = getPreviousStep()
    if (prevStep) {
      console.log(`🔙 Manual back navigation: ${currentStep} → ${prevStep}`)
      navigateToStep(prevStep)
    } else {
      console.log(`⚠️  No previous step available from ${currentStep}`)
    }
  }, [currentStep, getPreviousStep, navigateToStep])
  
  // Navigate to next step  
  const goNext = useCallback(() => {
    const nextStep = getNextStep()
    if (nextStep) {
      navigateToStep(nextStep)
    } else {
      console.log(`⚠️  No next step available from ${currentStep}`)
    }
  }, [currentStep, getNextStep, navigateToStep])
  
  // Navigate to drill mode
  const goToDrill = useCallback(() => {
    navigateToStep(STEPS.DRILL)
  }, [navigateToStep])
  
  // Navigate to main menu (home)
  const goHome = useCallback(() => {
    navigateToStep(STEPS.MAIN_MENU)
  }, [navigateToStep])
  
  // Get flow-namespaced setting (using enhanced settings system)
  const getFlowSetting = useCallback((key) => {
    return settings.getFlowSetting(flowConfig.type, key)
  }, [flowConfig.type, settings])
  
  // Set flow-namespaced setting (using enhanced settings system)
  const setFlowSetting = useCallback((updates) => {
    settings.setFlowSettings(flowConfig.type, updates)
  }, [flowConfig.type, settings])
  
  // Check if all required settings are present
  const hasRequiredSettings = useCallback(() => {
    const required = flowConfig.settings.required || []
    return required.every(key => {
      const value = getFlowSetting(key)
      return value !== null && value !== undefined
    })
  }, [flowConfig, getFlowSetting])
  
  // Clear flow-specific settings (using enhanced settings system)
  const clearFlowSettings = useCallback(() => {
    settings.clearFlowSettings(flowConfig.type)
  }, [flowConfig.type, settings])
  
  // Handle browser popstate events
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state || {}
      
      // Only handle our flow's navigation events
      if (state.appNav && state.flowType === flowConfig.type && state.step) {
        console.log(`🔙 PopState navigation: ${state.flowType} → ${state.step}`)
        setCurrentStep(state.step)
        // Don't push history again - we're responding to a history event
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [flowConfig.type])
  
  // Ensure current history state is marked
  useEffect(() => {
    const state = window.history.state
    if (!state || !state.appNav || state.flowType !== flowConfig.type) {
      // Mark current state
      try {
        window.history.replaceState({
          appNav: true,
          flowType: flowConfig.type,
          step: currentStep,
          ts: Date.now()
        }, '', flowConfig.urlPaths[currentStep] || '/')
      } catch (err) {
        console.error('Error marking history state:', err)
      }
    }
  }, [currentStep, flowConfig])
  
  return {
    // State
    currentStep,
    flowConfig,
    
    // Navigation functions
    navigateToStep,
    goBack,
    goNext,
    goToDrill,
    goHome,
    
    // Step utilities
    getPreviousStep,
    getNextStep,
    
    // Settings helpers
    getFlowSetting,
    setFlowSetting,
    hasRequiredSettings,
    clearFlowSettings,
    
    // Step checkers
    isFirstStep: currentStep === flowConfig.steps[0],
    isLastStep: currentStep === flowConfig.steps[flowConfig.steps.length - 1],
    canGoBack: getPreviousStep() !== null,
    canGoNext: getNextStep() !== null
  }
}

// Helper function to get step from URL (needed for initial step detection)
function getStepFromUrl(pathname, flowConfig) {
  for (const [step, path] of Object.entries(flowConfig.urlPaths)) {
    if (pathname === path) {
      return step
    }
  }
  return null
}