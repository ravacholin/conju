import { useState, useEffect, useMemo } from 'react'
import { useSettings } from '../state/settings.js'
import OnboardingFlow from './onboarding/OnboardingFlow.jsx'
import DrillMode from './drill/DrillMode.jsx'
import { useDrillMode } from '../hooks/useDrillMode.js'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow.js'
import { warmupCaches, getCacheStats } from '../lib/core/optimizedCache.js'
import { verbs } from '../data/verbs.js'
import { buildNonfiniteFormsForLemma } from '../lib/core/nonfiniteBuilder.js'

function AppRouter() {
  const [currentMode, setCurrentMode] = useState('onboarding')
  const settings = useSettings()
  
  // Import hooks
  const drillMode = useDrillMode()
  const onboardingFlow = useOnboardingFlow()

  // Compute forms for current region (memoized for performance)
  const allFormsForRegion = useMemo(() => {
    if (!settings.region) return []

    const regionForms = []
    const eligibleLemmas = new Set()

    for (const verb of verbs) {
      const paradigms = verb.paradigms || []
      const hasRegion = paradigms.some(p => (p.regionTags || []).includes(settings.region))
      if (!hasRegion) continue
      eligibleLemmas.add(verb.lemma)
      for (const p of paradigms) {
        if (!p.regionTags || !p.regionTags.includes(settings.region)) continue
        for (const f of p.forms || []) {
          regionForms.push({ ...f, lemma: verb.lemma })
        }
      }
    }

    // Agregar formas no finitas sintetizadas (gerundio/participio) por verbo elegible
    for (const lemma of eligibleLemmas) {
      const nf = buildNonfiniteFormsForLemma(lemma)
      regionForms.push(...nf)
    }

    return regionForms
  }, [settings.region])

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
  }, [])

  const handleStartPractice = () => {
    // Push a history entry so the hardware back goes back to onboarding from drill
    try { window.history.pushState({ appNav: true, mode: 'drill', ts: Date.now() }, '') } catch {}
    setCurrentMode('drill')
  }

  const handleHome = () => {
    // Scroll to top when returning to menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Map browser/hardware back to in-app back/home behavior
  useEffect(() => {
    const onPopState = () => {
      if (currentMode === 'drill') {
        handleHome()
      } else {
        try { onboardingFlow.goBack() } catch {}
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [currentMode])

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
    return <OnboardingFlow onStartPractice={handleStartPractice} setCurrentMode={setCurrentMode} />
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
