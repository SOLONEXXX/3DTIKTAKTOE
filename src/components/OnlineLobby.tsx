import { useState } from 'react';
import { useGameStore } from '../game/store';

interface OnlineLobbyProps {
  onBack: () => void;
}

export function OnlineLobby({ onBack }: OnlineLobbyProps) {
  const size = useGameStore((s) => s.size);
  const timeControl = useGameStore((s) => s.timeControl);
  const online = useGameStore((s) => s.online);
  const startOnlineHost = useGameStore((s) => s.startOnlineHost);
  const startOnlineJoin = useGameStore((s) => s.startOnlineJoin);

  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [error, setError] = useState<string | null>(null);

  const handleHost = async () => {
    setMode('host');
    setError(null);
    try {
      await startOnlineHost(size, timeControl);
    } catch {
      setError('Could not create a room. Check your connection and try again.');
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 3) return;
    setMode('join');
    setError(null);
    try {
      await startOnlineJoin(joinCode.trim());
    } catch {
      setError('Could not join that room. Double-check the code.');
    }
  };

  return (
    <div className="screen lobby-screen">
      <h1 className="title">Play Online</h1>

      {mode === 'choose' && (
        <div className="lobby-choices">
          <button className="primary-btn" onClick={handleHost}>
            Host a Game
          </button>
          <div className="lobby-divider">or</div>
          <input
            className="code-input"
            placeholder="Enter room code"
            value={joinCode}
            maxLength={6}
            autoCapitalize="characters"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button className="primary-btn secondary" disabled={joinCode.trim().length < 3} onClick={handleJoin}>
            Join Game
          </button>
        </div>
      )}

      {mode === 'host' && (
        <div className="lobby-status">
          {online.roomCode ? (
            <>
              <p>Share this code with your opponent:</p>
              <div className="room-code">{online.roomCode}</div>
              <p className="lobby-hint">Waiting for them to join…</p>
              <div className="spinner" />
            </>
          ) : (
            <p className="lobby-hint">Creating room…</p>
          )}
        </div>
      )}

      {mode === 'join' && (
        <div className="lobby-status">
          <p className="lobby-hint">Connecting to {joinCode}…</p>
          <div className="spinner" />
        </div>
      )}

      {error && <p className="lobby-error">{error}</p>}

      <button className="link-btn" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
