import { useState, Suspense, lazy } from 'react'
import DrillHeader from './DrillHeader.jsx'
import QuickSwitchPanel from './QuickSwitchPanel.jsx'
import GamesPanel from './GamesPanel.jsx'
import SettingsPanel from './SettingsPanel.jsx'
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
      )}

      {showQuickSwitch && (
        <QuickSwitchPanel
          settings={settings}
          onApply={handleQuickSwitchApply}
          onClose={() => setShowQuickSwitch(false)}
          getAvailableMoodsForLevel={getAvailableMoodsForLevel}
          getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
        />
      )}

      {showGames && (
        <GamesPanel
          settings={settings}
          onClose={() => setShowGames(false)}
          onRegenerateItem={onRegenerateItem}
        />
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
