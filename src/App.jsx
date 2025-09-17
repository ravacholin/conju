import { useEffect } from 'react'
import AppRouter from './components/AppRouter.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import { inject } from '@vercel/analytics'
import './App.css'

function App() {
  useEffect(() => {
    inject()
  }, [])

  return (
    <GlobalErrorBoundary>
      <AppRouter />
    </GlobalErrorBoundary>
  )
}

export default App
