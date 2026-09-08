import { useEffect } from 'react';
import { useGameStore } from './game/store';
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

  return (
    <div className="app-shell">
      {screen === 'home' && <HomeScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'cosmetics' && <CosmeticsScreen />}
      {screen === 'app-settings' && <AppSettingsScreen />}
      {screen === 'campaign' && <CampaignScreen />}
      {screen === 'lobby' && <OnlineLobby onBack={goHome} />}
      {screen === 'game' && <GameScreen onExit={goHome} />}
    </div>
  );
}

export default App;
