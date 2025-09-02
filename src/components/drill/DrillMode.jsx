import React, { useState, useEffect, Suspense, lazy } from 'react'
import DrillHeader from './DrillHeader.jsx'
const QuickSwitchPanel = lazy(() => import('./QuickSwitchPanel.jsx'))
const GamesPanel = lazy(() => import('./GamesPanel.jsx'))
const SettingsPanel = lazy(() => import('./SettingsPanel.jsx'))
import Drill from '../../features/drill/Drill.jsx'

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
  getAvailableTensesForLevelAndMood,
  onNavigateToProgress
}) {
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const closeAllPanels = () => {
    setShowQuickSwitch(false)
    setShowGames(false)
    setShowSettings(false)
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


  const handleQuickSwitchApply = () => {
    onRegenerateItem()
    setShowQuickSwitch(false)
  }

  // Listen for navigation requests from ProgressDashboard
  useEffect(() => {
    const handler = (event) => {
      try {
        const { detail } = event
        console.log('Progress navigation event received:', detail)
        
        // If we have mood/tense data, set specific practice mode
        if (detail && detail.mood && detail.tense) {
          // Set specific practice mode
          if (typeof onPracticeModeChange === 'function') {
            onPracticeModeChange('specific', detail.mood, detail.tense)
          }
          
          // Start specific practice
          if (typeof onStartSpecificPractice === 'function') {
            onStartSpecificPractice()
          } else {
            // Fallback: regenerate item after settings change
            setTimeout(() => onRegenerateItem(), 100)
          }
        } else if (detail && detail.micro) {
          // Handle micro-drill navigation
          console.log('Micro-drill navigation:', detail.micro)
          onRegenerateItem()
        } else if (detail && detail.focus === 'review') {
          // Handle SRS review navigation
          console.log('SRS review navigation')
          onRegenerateItem()
        } else {
          // Fallback: just regenerate
          onRegenerateItem()
        }
      } catch (error) {
        console.error('Error handling progress navigation:', error)
      }
    }
    
    window.addEventListener('progress:navigate', handler)
    return () => window.removeEventListener('progress:navigate', handler)
  }, [onStartSpecificPractice, onRegenerateItem, onPracticeModeChange])

  return (
    <div className="App">
      <DrillHeader
        onToggleQuickSwitch={handleToggleQuickSwitch}
        onToggleAccentKeys={handleToggleAccentKeys}
        onToggleGames={handleToggleGames}
        onNavigateToProgress={onNavigateToProgress}
        onHome={onHome}
        showQuickSwitch={showQuickSwitch}
        showGames={showGames}
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


      <main className="main-content">
        {currentItem ? (
          <Drill 
            currentItem={currentItem}
            onResult={onDrillResult}
            onContinue={onContinue}
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
