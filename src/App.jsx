import AppRouter from './components/AppRouter.jsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'
import './App.css'

function App() {
  return (
    <GlobalErrorBoundary>
      <AppRouter />
    </GlobalErrorBoundary>
  )
}

export default App
