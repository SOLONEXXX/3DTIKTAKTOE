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
