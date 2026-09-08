import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './game/store'

if (import.meta.env.DEV) {
  // Test hook only — dead-code-eliminated from production builds.
  ;(window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
