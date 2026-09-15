type IconProps = { className?: string };

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2.5" opacity="0.35" />
      <path d="M19 15.5 L33 24 L19 32.5 Z" fill="currentColor" />
    </svg>
  );
}

export function CosmeticsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 6 L27 18 L39 21 L27 24 L24 36 L21 24 L9 21 L21 18 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="36" cy="34" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="11" cy="33" r="2.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="3" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M24 4 V10" />
        <path d="M24 38 V44" />
        <path d="M44 24 H38" />
        <path d="M10 24 H4" />
        <path d="M37.5 10.5 L33.3 14.7" />
        <path d="M14.7 33.3 L10.5 37.5" />
        <path d="M37.5 37.5 L33.3 33.3" />
        <path d="M14.7 14.7 L10.5 10.5" />
      </g>
    </svg>
  );
}

export function BotIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="28" height="22" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="27" r="3" fill="currentColor" />
      <circle cx="30" cy="27" r="3" fill="currentColor" />
      <path d="M24 16 V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="6" r="3" fill="currentColor" />
      <path d="M16 33 Q24 38 32 33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function DuoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="33" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 40 Q6 27 17 27 Q28 27 28 40" stroke="currentColor" strokeWidth="2.5" />
      <path d="M22 40 Q22 27 33 27 Q44 27 44 40" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
      <ellipse cx="24" cy="24" rx="7.5" ry="18" stroke="currentColor" strokeWidth="2.5" />
      <path d="M6 24 H42" stroke="currentColor" strokeWidth="2.5" />
      <path d="M9 14 H39" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <path d="M9 34 H39" stroke="currentColor" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="22" width="26" height="18" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M17 22 V15 a7 7 0 0 1 14 0 v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="30" r="2.6" fill="currentColor" />
      <path d="M24 32.6 V36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 8 H33 V20 a9 9 0 0 1 -18 0 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M15 11 H8 a1 1 0 0 0 -1 1 v2 a7 7 0 0 0 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M33 11 H40 a1 1 0 0 1 1 1 v2 a7 7 0 0 1 -7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 29 V35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 41 H32 M16 41 Q16 36 24 35 Q32 36 32 41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SoundIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19 H14 L24 10 V38 L14 29 H6 Z" fill="currentColor" />
      <path d="M31 16 Q37 24 31 32" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M35 10 Q45 24 35 38" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6 H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 12 H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 18 H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path d="M17 3 V7 H13" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 21 V17 H11" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8 L3 11.5 L6 15" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3 11.5 H14 a6 6 0 0 1 0 12 H9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="2.6" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="2.6" stroke="currentColor" strokeWidth="2" />
      <path d="M8.3 10.7 L15.7 6.3 M8.3 13.3 L15.7 17.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1 -1 1 h-5 v-6 h-6 v6 H4 a1 1 0 0 1 -1 -1 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6.5 L9 4 L15 6.5 L21 4 V17.5 L15 20 L9 17.5 L3 20 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 4 V17.5 M15 6.5 V20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function RankIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5 L20 5.5 V11 c0 5-3.4 8.5-8 10.5C7.4 19.5 4 16 4 11 V5.5 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 8 L13.4 11 L16.5 11.3 L14.2 13.4 L14.9 16.5 L12 14.9 L9.1 16.5 L9.8 13.4 L7.5 11.3 L10.6 11 Z" fill="currentColor" />
    </svg>
  );
}

export function ShopIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8 H20 L18.7 20 a1 1 0 0 1 -1 1 H6.3 a1 1 0 0 1 -1 -1 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 11 V7 a3.5 3.5 0 0 1 7 0 v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.5" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 20.5 c0-4.2 3.4-6.5 7.5-6.5 s7.5 2.3 7.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ShardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L20 9 L12 22 L4 9 Z" fill="currentColor" opacity="0.9" />
      <path d="M4 9 H20 M12 2 L12 22" stroke="#07080f" strokeOpacity="0.35" strokeWidth="1.3" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3 L14.6 9.1 L21.2 9.7 L16.2 14 L17.7 20.5 L12 17 L6.3 20.5 L7.8 14 L2.8 9.7 L9.4 9.1 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5 c3.5 4 5.5 6.2 5.5 9.6 A5.5 5.5 0 0 1 12 21.5 a5.5 5.5 0 0 1 -5.5 -9.4 c1.2 1 2.2 1.2 2.8 .6 C8 9.5 9.6 6 12 2.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 10 H20.5 M8 3 V6.5 M16 3 V6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function SwordsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3 L9.5 9.5 M14.5 14.5 L21 21 M21 3 L14.5 9.5 M9.5 14.5 L3 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12.5 L10 17.5 L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfinityIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.5 8.5 a3.5 3.5 0 1 0 0 7 c2.5 0 4-7 7-7 a3.5 3.5 0 1 1 0 7 c-3 0-4.5-7-7-7 Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 5 L8 12 L15 19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
