import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './game/store'
import { audio } from './game/audio'

if (import.meta.env.DEV) {
  // Test hooks only — dead-code-eliminated from production builds.
  ;(window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore
  ;(window as unknown as { __audio: typeof audio }).__audio = audio
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
