import { useEffect, useState } from 'react';
import { timeControlFromIndex, useGameStore } from './game/store';
import { MainMenu } from './components/MainMenu';
import { OnlineLobby } from './components/OnlineLobby';
import { GameScreen } from './components/GameScreen';
import type { BoardSize, Difficulty, GameMode } from './game/types';
import './App.css';

function App() {
  const screen = useGameStore((s) => s.screen);
  const startBotGame = useGameStore((s) => s.startBotGame);
  const startLocalGame = useGameStore((s) => s.startLocalGame);
  const openOnlineLobby = useGameStore((s) => s.openOnlineLobby);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const tick = useGameStore((s) => s.tick);

  const [size, setSize] = useState<BoardSize>(4);
  const [mode, setMode] = useState<GameMode>('bot');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeControlIndex, setTimeControlIndex] = useState(2);

  useEffect(() => {
    const interval = window.setInterval(() => tick(), 200);
    return () => window.clearInterval(interval);
  }, [tick]);

  const handleStart = () => {
    const timeControl = timeControlFromIndex(timeControlIndex);
    if (mode === 'bot') startBotGame(size, difficulty, timeControl);
    else if (mode === 'local') startLocalGame(size, timeControl);
    else {
      useGameStore.setState({ size, timeControl });
      openOnlineLobby();
    }
  };

  return (
    <div className="app-shell">
      {screen === 'menu' && (
        <MainMenu
          size={size}
          onSizeChange={setSize}
          mode={mode}
          onModeChange={setMode}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          timeControlIndex={timeControlIndex}
          onTimeControlChange={setTimeControlIndex}
          onStart={handleStart}
        />
      )}
      {screen === 'lobby' && <OnlineLobby onBack={goToMenu} />}
      {screen === 'game' && <GameScreen onExit={goToMenu} />}
    </div>
  );
}

export default App;
