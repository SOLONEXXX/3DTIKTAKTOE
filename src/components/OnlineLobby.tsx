import { useEffect, useState } from 'react';
import { timeControlFromIndex, useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { getRank } from '../game/rank';
import { BackIcon, GlobeIcon, ShareIcon } from './icons';

interface OnlineLobbyProps {
  onBack: () => void;
}

export function OnlineLobby({ onBack }: OnlineLobbyProps) {
  const t = useT();
  const size = useGameStore((s) => s.size);
  const timeControl = timeControlFromIndex(useGameStore((s) => s.timeControlIndex));
  const online = useGameStore((s) => s.online);
  const onlineStats = useGameStore((s) => s.onlineStats);
  const startOnlineHost = useGameStore((s) => s.startOnlineHost);
  const startOnlineJoin = useGameStore((s) => s.startOnlineJoin);

  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const rank = getRank(onlineStats);

  const handleHost = async () => {
    audio.playClick();
    setMode('host');
    setError(null);
    try {
      await startOnlineHost(size, timeControl);
    } catch {
      setError(t('lobby.errorHost'));
    }
  };

  const handleJoin = async (code: string) => {
    if (code.trim().length < 3) return;
    audio.playClick();
    setMode('join');
    setError(null);
    try {
      await startOnlineJoin(code.trim());
    } catch {
      setError(t('lobby.errorJoin'));
    }
  };

  useEffect(() => {
    // Consume a shared invite link (?join=CODE) exactly once and auto-join.
    const code = new URLSearchParams(window.location.search).get('join');
    if (code) {
      window.history.replaceState(null, '', window.location.pathname);
      setJoinCode(code.toUpperCase());
      handleJoin(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inviteLink = online.roomCode
    ? `${window.location.origin}${window.location.pathname}?join=${online.roomCode}`
    : '';

  const shareInvite = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({ title: '3D Tic-Tac-Toe', text: `Spiel gegen mich! Code: ${online.roomCode}`, url: inviteLink });
      } catch {
        // user cancelled the native share sheet
      }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    }
  };

  return (
    <div className="screen lobby-screen">
      <div className="settings-topbar">
        <button className="icon-btn" onClick={() => { audio.playClick(); onBack(); }} aria-label={t('lobby.back')}>
          <BackIcon className="icon-btn-svg" />
        </button>
      </div>

      <div className="lobby-body">
        <div className="lobby-hero">
          <GlobeIcon className="lobby-globe" />
          <h1 className="title">{t('lobby.title')}</h1>
          <div className="lobby-rank">
            <span className="lobby-rank-icon">{rank.icon}</span>
            <span className="lobby-rank-label">{t('lobby.rank')}: {rank.name}</span>
          </div>
        </div>

        {mode === 'choose' && (
          <div className="lobby-choices">
            <button className="primary-btn" onClick={handleHost}>
              {t('lobby.host')}
            </button>
            <div className="lobby-divider">{t('lobby.or')}</div>
            <input
              className="code-input"
              placeholder={t('lobby.joinPlaceholder')}
              value={joinCode}
              maxLength={6}
              autoCapitalize="characters"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <button className="primary-btn secondary" disabled={joinCode.trim().length < 3} onClick={() => handleJoin(joinCode)}>
              {t('lobby.join')}
            </button>
          </div>
        )}

        {mode === 'host' && (
          <div className="lobby-status">
            {online.roomCode ? (
              <>
                <p>{t('lobby.shareCode')}</p>
                <div className="room-code">{online.roomCode}</div>
                <button className="primary-btn secondary" onClick={shareInvite}>
                  <ShareIcon className="icon-btn-svg inline-icon" />
                  {linkCopied ? t('lobby.linkCopied') : t('lobby.shareLink')}
                </button>
                <p className="lobby-hint">{t('lobby.waiting')}</p>
                <div className="spinner" />
              </>
            ) : (
              <p className="lobby-hint">{t('lobby.creating')}</p>
            )}
          </div>
        )}

        {mode === 'join' && (
          <div className="lobby-status">
            <p className="lobby-hint">{t('lobby.connecting', { code: joinCode })}</p>
            <div className="spinner" />
          </div>
        )}

        {error && <p className="lobby-error">{error}</p>}
      </div>
    </div>
  );
}
