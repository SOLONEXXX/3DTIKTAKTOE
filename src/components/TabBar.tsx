import type { ComponentType } from 'react';
import { useGameStore, type Screen } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import { HomeIcon, MapIcon, RankIcon, ShopIcon, ProfileIcon } from './icons';

const TABS: { screen: Screen; labelKey: string; icon: ComponentType<{ className?: string }> }[] = [
  { screen: 'home', labelKey: 'tab.home', icon: HomeIcon },
  { screen: 'levels', labelKey: 'tab.levels', icon: MapIcon },
  { screen: 'ranked', labelKey: 'tab.ranked', icon: RankIcon },
  { screen: 'shop', labelKey: 'tab.shop', icon: ShopIcon },
  { screen: 'profile', labelKey: 'tab.profile', icon: ProfileIcon },
];

export const TAB_SCREENS: Screen[] = TABS.map((tab) => tab.screen);

/** Bottom navigation — the standard shape for a casual mobile game, and the reason
 * every mode is now one thumb-reach away instead of buried behind a menu list. */
export function TabBar() {
  const t = useT();
  const screen = useGameStore((s) => s.screen);
  const goToScreen = useGameStore((s) => s.goToScreen);

  return (
    <nav className="tab-bar">
      {TABS.map(({ screen: target, labelKey, icon: Icon }) => (
        <button
          key={target}
          className={`tab-item ${screen === target ? 'active' : ''}`}
          onClick={() => { audio.playClick(); goToScreen(target); }}
        >
          <Icon className="tab-icon" />
          <span className="tab-label">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
