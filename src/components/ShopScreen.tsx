import { lazy, Suspense, useState } from 'react';
import { useGameStore } from '../game/store';
import { audio } from '../game/audio';
import { useT } from '../game/i18n';
import {
  BACKGROUNDS,
  COLOR_THEMES,
  MATERIALS,
  RARITY_COLORS,
  RARITY_LABELS,
  SHAPES,
  SOLO_COLORS,
  colorThemeDef,
  cosmeticKey,
  isUnlocked,
  priceOf,
  type CosmeticKind,
  type CosmeticSource,
} from '../game/cosmetics';
import { LockIcon, ShardIcon } from './icons';
import { ShapeIcon } from './ShapeIcon';

const IdleCube = lazy(() => import('../three/IdleCube').then((m) => ({ default: m.IdleCube })));

type Tab = 'color' | 'shape' | 'material' | 'background';

const TABS: { id: Tab; labelKey: string }[] = [
  { id: 'color', labelKey: 'cosmetics.colorTheme' },
  { id: 'shape', labelKey: 'cosmetics.shape' },
  { id: 'material', labelKey: 'cosmetics.material' },
  { id: 'background', labelKey: 'cosmetics.background' },
];

export function ShopScreen() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('color');
  const [toast, setToast] = useState<string | null>(null);

  const background = useGameStore((s) => s.background);
  const markerColorTheme = useGameStore((s) => s.markerColorTheme);
  const markerShape = useGameStore((s) => s.markerShape);
  const markerMaterial = useGameStore((s) => s.markerMaterial);
  const onlineMyColor = useGameStore((s) => s.onlineMyColor);
  const shards = useGameStore((s) => s.shards);
  const ownedCosmetics = useGameStore((s) => s.ownedCosmetics);
  const campaignLevel3 = useGameStore((s) => s.campaignLevel3);
  const campaignLevel4 = useGameStore((s) => s.campaignLevel4);
  const peakTierIndex = useGameStore((s) => s.peakTierIndex);
  const cheatUnlockAll = useGameStore((s) => s.cheatUnlockAll);
  const setBackground = useGameStore((s) => s.setBackground);
  const setMarkerColorTheme = useGameStore((s) => s.setMarkerColorTheme);
  const setMarkerShape = useGameStore((s) => s.setMarkerShape);
  const setMarkerMaterial = useGameStore((s) => s.setMarkerMaterial);
  const setOnlineMyColor = useGameStore((s) => s.setOnlineMyColor);
  const buyCosmetic = useGameStore((s) => s.buyCosmetic);

  const ctx = {
    owned: ownedCosmetics,
    bestCampaignLevel: Math.max(campaignLevel3, campaignLevel4),
    peakTierIndex,
    cheatUnlockAll,
  };

  const sourceLabel = (source: CosmeticSource): string => {
    switch (source.kind) {
      case 'level':
        return t('shop.fromLevel', { n: source.level });
      case 'world':
        return t('shop.fromWorld', { n: source.world + 1 });
      case 'rank':
        return t('shop.fromRank', { tier: source.tierName });
      case 'shop':
      case 'default':
        return '';
    }
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const handleSelect = (kind: CosmeticKind, id: string, unlockedItem: boolean, price: number | null, source: CosmeticSource) => {
    if (unlockedItem) {
      audio.playClick();
      if (kind === 'color') setMarkerColorTheme(id as never);
      if (kind === 'shape') setMarkerShape(id as never);
      if (kind === 'material') setMarkerMaterial(id as never);
      if (kind === 'background') setBackground(id as never);
      return;
    }
    if (price !== null) {
      if (shards < price) {
        audio.playLose();
        flash(t('shop.notEnough'));
        return;
      }
      if (buyCosmetic(kind, id, price)) {
        flash(t('shop.bought'));
        if (kind === 'color') setMarkerColorTheme(id as never);
        if (kind === 'shape') setMarkerShape(id as never);
        if (kind === 'material') setMarkerMaterial(id as never);
        if (kind === 'background') setBackground(id as never);
      }
      return;
    }
    audio.playLose();
    flash(sourceLabel(source));
  };

  const renderCard = (
    kind: CosmeticKind,
    item: { id: string; label: string; rarity: keyof typeof RARITY_COLORS; source: CosmeticSource },
    equipped: boolean,
    preview: React.ReactNode,
  ) => {
    const unlockedItem = isUnlocked(kind, item as never, ctx);
    const price = priceOf(item as never);
    const affordable = price !== null && shards >= price;

    return (
      <button
        key={cosmeticKey(kind, item.id)}
        className={`shop-card ${equipped ? 'equipped' : ''} ${unlockedItem ? '' : 'locked'}`}
        style={{ ['--rarity' as string]: RARITY_COLORS[item.rarity] }}
        onClick={() => handleSelect(kind, item.id, unlockedItem, price, item.source)}
      >
        <span className="shop-card-preview">
          {preview}
          {!unlockedItem && <LockIcon className="lock-icon" />}
        </span>
        <span className="shop-card-name">{item.label}</span>
        <span className="shop-card-rarity">{RARITY_LABELS[item.rarity]}</span>
        {equipped ? (
          <span className="shop-card-state equipped-state">{t('shop.equipped')}</span>
        ) : unlockedItem ? (
          <span className="shop-card-state">{t('shop.equip')}</span>
        ) : price !== null ? (
          <span className={`shop-card-price ${affordable ? '' : 'poor'}`}>
            <ShardIcon className="shop-price-icon" />
            {price}
          </span>
        ) : (
          <span className="shop-card-state requirement">{sourceLabel(item.source)}</span>
        )}
      </button>
    );
  };

  return (
    <div className="screen tab-screen shop-screen">
      <div className="screen-head">
        <h1 className="screen-title">{t('shop.title')}</h1>
        <span className="screen-head-meta">
          <ShardIcon className="status-currency-icon" /> {shards.toLocaleString('de-DE')}
        </span>
      </div>

      <div className={`cosmetics-preview bg-${background}`}>
        <Suspense fallback={null}>
          <IdleCube colorTheme={markerColorTheme} shape={markerShape} material={markerMaterial} />
        </Suspense>
      </div>

      <div className="shop-tabs">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            className={`shop-tab ${tab === entry.id ? 'active' : ''}`}
            onClick={() => { audio.playClick(); setTab(entry.id); }}
          >
            {t(entry.labelKey)}
          </button>
        ))}
      </div>

      <div className="shop-scroll">
        {tab === 'color' && (
          <>
            <div className="shop-grid">
              {COLOR_THEMES.map((item) =>
                renderCard(
                  'color',
                  item,
                  markerColorTheme === item.id,
                  <span
                    className="shop-color-swatch"
                    style={{ background: `linear-gradient(135deg, ${item.xColor}, ${item.oColor})` }}
                  />,
                ),
              )}
            </div>
            <section className="menu-section">
              <h2>{t('cosmetics.myLook')}</h2>
              <p className="field-hint">{t('cosmetics.myLookHint')}</p>
              <div className="solo-color-grid">
                {SOLO_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`solo-color-swatch ${onlineMyColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => { audio.playClick(); setOnlineMyColor(c); }}
                    aria-label={c}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'shape' && (
          <div className="shop-grid">
            {SHAPES.map((item) =>
              renderCard(
                'shape',
                item,
                markerShape === item.id,
                <ShapeIcon shape={item.id} className="shop-shape-icon" />,
              ),
            )}
          </div>
        )}

        {tab === 'material' && (
          <div className="shop-grid">
            {MATERIALS.map((item) =>
              renderCard(
                'material',
                item,
                markerMaterial === item.id,
                <span className={`shop-material-swatch material-${item.id}`} style={{ background: colorThemeDef(markerColorTheme).xColor }} />,
              ),
            )}
          </div>
        )}

        {tab === 'background' && (
          <div className="shop-grid">
            {BACKGROUNDS.map((item) =>
              renderCard('background', item, background === item.id, <span className={`shop-bg-swatch bg-${item.id}`} />),
            )}
          </div>
        )}
      </div>

      {toast && <div className="shop-toast">{toast}</div>}
    </div>
  );
}
