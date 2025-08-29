import React, { useState, useEffect, Suspense, lazy } from 'react'
import DrillHeader from './DrillHeader.jsx'
const QuickSwitchPanel = lazy(() => import('./QuickSwitchPanel.jsx'))
const GamesPanel = lazy(() => import('./GamesPanel.jsx'))
const SettingsPanel = lazy(() => import('./SettingsPanel.jsx'))
import Drill from '../../features/drill/Drill.jsx'
const ProgressDashboard = lazy(() => import('../../features/progress/ProgressDashboard.jsx'))

function DrillMode({
  currentItem,
  settings,
  onDrillResult,
  onContinue,
  onHome,
  onRegenerateItem,
  onDialectChange,
  onLevelChange,
  onPracticeModeChange,
  onPronounPracticeChange,
  onVerbTypeChange,
  onStartSpecificPractice,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood
}) {
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  const closeAllPanels = () => {
    setShowQuickSwitch(false)
    setShowChallenges(false)
    setShowGames(false)
    setShowSettings(false)
    setShowProgress(false)
  }

  const handleToggleQuickSwitch = (show = null) => {
    const newShow = show !== null ? show : !showQuickSwitch
    if (newShow) {
      closeAllPanels()
      setShowQuickSwitch(true)
    } else {
      setShowQuickSwitch(false)
    }
  }

  const handleToggleChallenges = (show = null) => {
    const newShow = show !== null ? show : !showChallenges
    if (newShow) {
      closeAllPanels()
      setShowChallenges(true)
    } else {
      setShowChallenges(false)
    }
  }

  const handleToggleGames = (show = null) => {
    const newShow = show !== null ? show : !showGames
    if (newShow) {
      closeAllPanels()
      setShowGames(true)
    } else {
      setShowGames(false)
    }
  }

  const handleToggleAccentKeys = () => {
    setShowAccentKeys(prev => !prev)
  }

  const handleToggleProgress = (show = null) => {
    const newShow = show !== null ? show : !showProgress
    if (newShow) {
      closeAllPanels()
      setShowProgress(true)
    } else {
      setShowProgress(false)
    }
  }

  const handleQuickSwitchApply = () => {
    onRegenerateItem()
    setShowQuickSwitch(false)
  }

  // Listen for navigation requests from ProgressDashboard
  useEffect(() => {
    const handler = () => {
      try {
        // Close panel and start specific practice with current settings
        setShowProgress(false)
        // Kick off specific practice flow
        if (typeof onStartSpecificPractice === 'function') {
          onStartSpecificPractice()
        } else {
          // Fallback: regenerate item after settings change
          onRegenerateItem()
        }
      } catch (error) {
        console.error('Error handling progress navigation:', error)
      }
    }
    window.addEventListener('progress:navigate', handler)
    return () => window.removeEventListener('progress:navigate', handler)
  }, [onStartSpecificPractice, onRegenerateItem])

  return (
    <div className="App">
      <DrillHeader
        onToggleQuickSwitch={handleToggleQuickSwitch}
        onToggleChallenges={handleToggleChallenges}
        onToggleAccentKeys={handleToggleAccentKeys}
        onToggleGames={handleToggleGames}
        onToggleProgress={handleToggleProgress}
        onHome={onHome}
        showQuickSwitch={showQuickSwitch}
        showChallenges={showChallenges}
        showGames={showGames}
        showProgress={showProgress}
      />

      {showSettings && (
        <Suspense fallback={<div className="loading">Cargando configuración...</div>}>
          <SettingsPanel
            settings={settings}
            onClose={() => setShowSettings(false)}
            onDialectChange={onDialectChange}
            onLevelChange={onLevelChange}
            onPracticeModeChange={onPracticeModeChange}
            onPronounPracticeChange={onPronounPracticeChange}
            onVerbTypeChange={onVerbTypeChange}
            onStartSpecificPractice={onStartSpecificPractice}
          />
        </Suspense>
      )}

      {showQuickSwitch && (
        <Suspense fallback={<div className="loading">Cargando opciones rápidas...</div>}>
          <QuickSwitchPanel
            settings={settings}
            onApply={handleQuickSwitchApply}
            onClose={() => setShowQuickSwitch(false)}
            getAvailableMoodsForLevel={getAvailableMoodsForLevel}
            getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
          />
        </Suspense>
      )}

      {showGames && (
        <Suspense fallback={<div className="loading">Cargando juegos...</div>}>
          <GamesPanel
            settings={settings}
            onClose={() => setShowGames(false)}
            onRegenerateItem={onRegenerateItem}
          />
        </Suspense>
      )}

      {showProgress && (
        <div className="panel-overlay">
          <div className="panel-content progress-panel">
            <button 
              className="close-btn"
              onClick={() => setShowProgress(false)}
            >
              ×
            </button>
            <Suspense fallback={<div className="loading">Cargando panel de progreso...</div>}>
              <ProgressDashboard />
            </Suspense>
          </div>
        </div>
      )}

      <main className="main-content">
        {currentItem ? (
          <Drill 
            currentItem={currentItem}
            onResult={onDrillResult}
            onContinue={onContinue}
            showChallenges={showChallenges}
            showAccentKeys={showAccentKeys}
          />
        ) : (
          <div className="loading">Cargando próxima conjugación...</div>
        )}
      </main>
    </div>
  )
}

export default DrillMode
