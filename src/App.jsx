import { useEffect } from 'react'
import AppRouter from './components/AppRouter.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import GamificationNotifications from './components/gamification/GamificationNotifications.jsx'
import { inject } from '@vercel/analytics'
import { Capacitor } from '@capacitor/core'
import './App.css'

function App() {
  useEffect(() => {
    inject()

    let backButtonListener = null

    const setupBackButton = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { App: CapApp } = await import('@capacitor/app')
          const { default: router } = await import('./lib/routing/Router.js')

          backButtonListener = await CapApp.addListener('backButton', () => {
            const currentRoute = router.getCurrentRoute()
            // Si estamos en la pantalla inicial de onboarding (paso 1 o 2), minimizamos la app.
            // De lo contrario, volvemos atrás.
            if (
              currentRoute?.mode === 'onboarding' &&
              (currentRoute?.step === 1 || currentRoute?.step === 2 || !currentRoute?.step)
            ) {
              CapApp.minimizeApp()
            } else {
              router.back()
            }
          })
        } catch (error) {
          console.error('Error setting up native back button listener:', error)
        }
      }
    }

    setupBackButton()

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove()
      }
    }
  }, [])

  return (
    <div className="app-container">
      <GlobalErrorBoundary>
        <AppRouter />
        <GamificationNotifications />
      </GlobalErrorBoundary>
    </div>
  )
}

export default App
