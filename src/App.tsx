import { useEffect } from 'react';
import { trackForScreen, useGameStore } from './game/store';
import { audio } from './game/audio';
import { HomeScreen } from './components/HomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ShopScreen } from './components/ShopScreen';
import { AppSettingsScreen } from './components/AppSettingsScreen';
import { LevelMapScreen } from './components/LevelMapScreen';
import { RankedScreen } from './components/RankedScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { OnlineLobby } from './components/OnlineLobby';
import { GameScreen } from './components/GameScreen';
import { StatusBar } from './components/StatusBar';
import { TabBar, TAB_SCREENS } from './components/TabBar';
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
    // A shared invite link (?join=CODE) drops the visitor straight into the online lobby.
    if (new URLSearchParams(window.location.search).has('join')) {
      useGameStore.setState({ screen: 'lobby' });
    }
  }, []);

  useEffect(() => {
    // Browsers only allow audio after a real user gesture. Some mobile browsers don't
    // count a bare pointerdown, so listen broadly and unlock exactly once.
    let unlocked = false;
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
    const startOnFirstInteraction = () => {
      if (unlocked) return;
      unlocked = true;
      audio.unlock();
      const state = useGameStore.getState();
      audio.playTrack(trackForScreen(state.screen, state.mode));
      events.forEach((event) => window.removeEventListener(event, startOnFirstInteraction));
    };
    events.forEach((event) => window.addEventListener(event, startOnFirstInteraction, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, startOnFirstInteraction));
  }, []);

  const isTabScreen = TAB_SCREENS.includes(screen);

  return (
    <div className="app-shell">
      {isTabScreen && <StatusBar />}

      <div className={`screen-host ${isTabScreen ? 'with-chrome' : ''}`}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'levels' && <LevelMapScreen />}
        {screen === 'ranked' && <RankedScreen />}
        {screen === 'shop' && <ShopScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'app-settings' && <AppSettingsScreen />}
        {screen === 'lobby' && <OnlineLobby onBack={goHome} />}
        {screen === 'game' && <GameScreen />}
      </div>

      {isTabScreen && <TabBar />}
    </div>
  );
}

export default App;
