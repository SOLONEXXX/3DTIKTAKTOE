interface LogoProps {
  className?: string;
}

/**
 * The brand mark: an isometric cube whose body diagonal is already filled in — the
 * winning line *is* the logo, which is the one thing that separates this game from flat
 * tic-tac-toe at a glance (and reads at 32px on a home screen icon).
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoEdge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb3ff" />
          <stop offset="100%" stopColor="#4f6bd8" />
        </linearGradient>
        <linearGradient id="logoLine" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff5d73" />
          <stop offset="50%" stopColor="#ffd35c" />
          <stop offset="100%" stopColor="#4fc3ff" />
        </linearGradient>
      </defs>

      {/* outer cube silhouette */}
      <path
        d="M60 8 L108 34 V86 L60 112 L12 86 V34 Z"
        stroke="url(#logoEdge)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* isometric interior edges */}
      <path d="M60 8 V60 M12 34 L60 60 L108 34 M60 60 V112" stroke="url(#logoEdge)" strokeWidth="3.4" opacity="0.55" />

      {/* the winning diagonal, three cells strung along it */}
      <path d="M26 42 L60 60 L94 78" stroke="url(#logoLine)" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
      <circle cx="26" cy="42" r="9.5" fill="#ff5d73" />
      <circle cx="60" cy="60" r="9.5" fill="#ffd35c" />
      <circle cx="94" cy="78" r="9.5" fill="#4fc3ff" />
    </svg>
  );
}

/** Full lockup: mark above the wordmark, used on the home screen. */
export function LogoLockup() {
  return (
    <div className="logo-lockup">
      <LogoMark className="logo-mark" />
      <h1 className="game-title">
        <span>3D</span>
        <span className="game-title-accent">TIC·TAC·TOE</span>
      </h1>
    </div>
  );
}
