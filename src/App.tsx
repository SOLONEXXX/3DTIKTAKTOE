import { useEffect } from 'react';
import { trackForScreen, useGameStore } from './game/store';
import { audio } from './game/audio';
import { HomeScreen } from './components/HomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CosmeticsScreen } from './components/CosmeticsScreen';
import { AppSettingsScreen } from './components/AppSettingsScreen';
import { CampaignScreen } from './components/CampaignScreen';
import { OnlineLobby } from './components/OnlineLobby';
import { GameScreen } from './components/GameScreen';
import './App.css';

function App() {
  const screen = useGameStore((s) => s.screen);
  const goHome = useGameStore((s) => s.goHome);
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    const interval = window.setInterval(() => tick(), 200);
    return () => window.clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    // A shared invite link (?join=CODE) drops the visitor straight into the online
    // lobby, which reads and consumes the same query param to auto-join.
    if (new URLSearchParams(window.location.search).has('join')) {
      useGameStore.setState({ screen: 'lobby' });
    }
  }, []);

  useEffect(() => {
    // Browsers only allow audio once a real user gesture has happened — kick off
    // the context-appropriate music track on the very first such gesture anywhere in the
    // app. Some mobile browsers (notably iOS Safari) don't count a bare "pointerdown" as
    // a valid unlocking gesture, so listen broadly and unlock exactly once.
    let unlocked = false;
    const startOnFirstInteraction = () => {
      if (unlocked) return;
      unlocked = true;
      audio.unlock();
      const state = useGameStore.getState();
      audio.playTrack(trackForScreen(state.screen, state.mode));
      events.forEach((event) => window.removeEventListener(event, startOnFirstInteraction));
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
    events.forEach((event) => window.addEventListener(event, startOnFirstInteraction, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, startOnFirstInteraction));
  }, []);

  return (
    <div className="app-shell">
      {screen === 'home' && <HomeScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'cosmetics' && <CosmeticsScreen />}
      {screen === 'app-settings' && <AppSettingsScreen />}
      {screen === 'campaign' && <CampaignScreen />}
      {screen === 'lobby' && <OnlineLobby onBack={goHome} />}
      {screen === 'game' && <GameScreen />}
    </div>
  );
}

export default App;
