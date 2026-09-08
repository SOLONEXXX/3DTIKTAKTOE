import { useState } from 'react';
import { timeControlFromIndex, useGameStore } from '../game/store';
import { audio } from '../game/audio';

interface OnlineLobbyProps {
  onBack: () => void;
}

export function OnlineLobby({ onBack }: OnlineLobbyProps) {
  const size = useGameStore((s) => s.size);
  const timeControl = timeControlFromIndex(useGameStore((s) => s.timeControlIndex));
  const online = useGameStore((s) => s.online);
  const startOnlineHost = useGameStore((s) => s.startOnlineHost);
  const startOnlineJoin = useGameStore((s) => s.startOnlineJoin);

  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [error, setError] = useState<string | null>(null);

  const handleHost = async () => {
    audio.playClick();
    setMode('host');
    setError(null);
    try {
      await startOnlineHost(size, timeControl);
    } catch {
      setError('Raum konnte nicht erstellt werden. Prüfe deine Verbindung und versuch es erneut.');
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 3) return;
    audio.playClick();
    setMode('join');
    setError(null);
    try {
      await startOnlineJoin(joinCode.trim());
    } catch {
      setError('Beitritt fehlgeschlagen. Prüfe den Code.');
    }
  };

  return (
    <div className="screen lobby-screen">
      <h1 className="title">Online spielen</h1>

      {mode === 'choose' && (
        <div className="lobby-choices">
          <button className="primary-btn" onClick={handleHost}>
            Spiel erstellen
          </button>
          <div className="lobby-divider">oder</div>
          <input
            className="code-input"
            placeholder="Raumcode eingeben"
            value={joinCode}
            maxLength={6}
            autoCapitalize="characters"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button className="primary-btn secondary" disabled={joinCode.trim().length < 3} onClick={handleJoin}>
            Beitreten
          </button>
        </div>
      )}

      {mode === 'host' && (
        <div className="lobby-status">
          {online.roomCode ? (
            <>
              <p>Teile diesen Code mit deinem Gegner:</p>
              <div className="room-code">{online.roomCode}</div>
              <p className="lobby-hint">Warte auf Beitritt…</p>
              <div className="spinner" />
            </>
          ) : (
            <p className="lobby-hint">Raum wird erstellt…</p>
          )}
        </div>
      )}

      {mode === 'join' && (
        <div className="lobby-status">
          <p className="lobby-hint">Verbinde mit {joinCode}…</p>
          <div className="spinner" />
        </div>
      )}

      {error && <p className="lobby-error">{error}</p>}

      <button className="link-btn" onClick={() => { audio.playClick(); onBack(); }}>
        Zurück
      </button>
    </div>
  );
}
