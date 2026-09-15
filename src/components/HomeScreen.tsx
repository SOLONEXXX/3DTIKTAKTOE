import { lazy, Suspense } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { dailyChallengeFor, streakStillAlive, todayKey } from '../game/daily';
import { LogoLockup } from './Logo';
import { BotIcon, CalendarIcon, CheckIcon, DuoIcon, FlameIcon, GlobeIcon, InfinityIcon, PlayIcon } from './icons';
import type { GameMode } from '../game/types';

const IdleCube = lazy(() => import('../three/IdleCube').then((m) => ({ default: m.IdleCube })));

const QUICK_MODES: { mode: GameMode; labelKey: string; icon: typeof BotIcon }[] = [
  { mode: 'bot', labelKey: 'settings.modeBot', icon: BotIcon },
  { mode: 'local', labelKey: 'settings.modeLocal', icon: DuoIcon },
  { mode: 'online', labelKey: 'settings.modeOnline', icon: GlobeIcon },
];

export function HomeScreen() {
  const t = useT();
  const background = useGameStore((s) => s.background);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const markerMaterial = useGameStore((s) => s.markerMaterial);
  const mode = useGameStore((s) => s.mode);
  const size = useGameStore((s) => s.size);
  const dailyLastCompleted = useGameStore((s) => s.dailyLastCompleted);
  const dailyStreak = useGameStore((s) => s.dailyStreak);
  const survivalBest3 = useGameStore((s) => s.survivalBest3);
  const survivalBest4 = useGameStore((s) => s.survivalBest4);
  const playNow = useGameStore((s) => s.playNow);
  const setMode = useGameStore((s) => s.setMode);
  const goToScreen = useGameStore((s) => s.goToScreen);
  const startDailyChallenge = useGameStore((s) => s.startDailyChallenge);
  const startSurvivalRun = useGameStore((s) => s.startSurvivalRun);

  const daily = dailyChallengeFor();
  const dailyDone = dailyLastCompleted === todayKey();
  const streakAlive = streakStillAlive(dailyLastCompleted);
  const survivalBest = size === 3 ? survivalBest3 : survivalBest4;

  const click = (fn: () => void) => () => {
    audio.playClick();
    fn();
  };

  return (
    <div className="screen home-screen">
      <div className={`home-backdrop bg-${background}`}>
        <Suspense fallback={null}>
          <IdleCube colorTheme={markerColorTheme} shape={markerShape} material={markerMaterial} />
        </Suspense>
        <div className="home-backdrop-fade" />
      </div>

      <div className="home-content">
        <LogoLockup />

        <div className="home-actions">
          <button className="play-button" onClick={click(playNow)}>
            <PlayIcon className="play-button-icon" />
            <span className="play-button-text">
              <span className="play-button-label">{t('home.play')}</span>
              <span className="play-button-sub">
                {t(`settings.mode${mode === 'local' ? 'Local' : mode === 'online' ? 'Online' : 'Bot'}`)} · {size}×{size}×{size}
              </span>
            </span>
          </button>

          <div className="quick-modes">
            {QUICK_MODES.map(({ mode: target, labelKey, icon: Icon }) => (
              <button
                key={target}
                className={`quick-mode ${mode === target ? 'selected' : ''}`}
                onClick={click(() => setMode(target))}
              >
                <Icon className="quick-mode-icon" />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>

          <button
            className={`feature-card daily-card ${dailyDone ? 'done' : ''}`}
            onClick={click(dailyDone ? () => goToScreen('levels') : startDailyChallenge)}
          >
            <span className="feature-icon-wrap">
              {dailyDone ? <CheckIcon className="feature-icon" /> : <CalendarIcon className="feature-icon" />}
            </span>
            <span className="feature-text">
              <span className="feature-title">{t('daily.title')}</span>
              <span className="feature-sub">
                {dailyDone
                  ? t('daily.done')
                  : t(`daily.toughness.${daily.toughness}`) + ` · ${daily.size}×${daily.size}×${daily.size}`}
              </span>
            </span>
            {streakAlive && dailyStreak > 0 && (
              <span className="streak-chip">
                <FlameIcon className="streak-icon" />
                {dailyStreak}
              </span>
            )}
          </button>

          <button className="feature-card survival-card" onClick={click(startSurvivalRun)}>
            <span className="feature-icon-wrap">
              <InfinityIcon className="feature-icon" />
            </span>
            <span className="feature-text">
              <span className="feature-title">{t('survival.title')}</span>
              <span className="feature-sub">{t('survival.best', { n: survivalBest })}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
