import AppRouter from './components/AppRouter.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import { Analytics } from '@vercel/analytics/react'
import './App.css'

function App() {
  return (
    <GlobalErrorBoundary>
      <AppRouter />
      <Analytics />
    </GlobalErrorBoundary>
  )
}

export default App
