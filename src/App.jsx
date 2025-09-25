import { useEffect } from 'react'
import AppRouter from './components/AppRouter.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import GamificationNotifications from './components/gamification/GamificationNotifications.jsx'
import { inject } from '@vercel/analytics'
import './App.css'

function App() {
  useEffect(() => {
    inject()
  }, [])

  return (
    <GlobalErrorBoundary>
      <AppRouter />
      <GamificationNotifications />
    </GlobalErrorBoundary>
  )
}

export default App
