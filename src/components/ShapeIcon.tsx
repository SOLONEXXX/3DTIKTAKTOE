import type { MarkerShape } from '../game/types';

interface ShapeIconProps {
  shape: MarkerShape;
  className?: string;
}

/** Flat preview glyph for each marker shape, used on the Cosmetics shape-picker tiles
 * so players can actually see what they're choosing instead of a blank swatch. */
export function ShapeIcon({ shape, className }: ShapeIconProps) {
  const common = { className, viewBox: '0 0 48 48', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  switch (shape) {
    case 'orb':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="15" fill="currentColor" opacity="0.85" />
          <ellipse cx="19" cy="18" rx="5" ry="3.5" fill="white" opacity="0.35" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...common}>
          <path d="M24 6 L38 24 L24 42 L10 24 Z" fill="currentColor" opacity="0.85" />
          <path d="M24 6 L24 42 M10 24 L38 24" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        </svg>
      );
    case 'pyramid':
      return (
        <svg {...common}>
          <path d="M24 6 L42 38 H6 Z" fill="currentColor" opacity="0.85" />
          <path d="M24 6 L24 38" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        </svg>
      );
    case 'figures':
      return (
        <svg {...common}>
          <circle cx="24" cy="12" r="6" fill="currentColor" />
          <path d="M12 42 Q12 24 24 24 Q36 24 36 42" fill="currentColor" opacity="0.85" />
        </svg>
      );
    case 'prism':
      return (
        <svg {...common}>
          <path d="M24 5 L42 16 V33 L24 44 L6 33 V16 Z" fill="currentColor" opacity="0.75" />
          <path d="M24 5 V24 M6 16 L24 24 L42 16 M24 24 V44" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
        </svg>
      );
    case 'ring':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="17" fill="currentColor" opacity="0.85" />
          <circle cx="24" cy="24" r="8" fill="var(--bg-elevated)" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path
            d="M24 4 L29 18 L44 18 L32 27 L37 42 L24 33 L11 42 L16 27 L4 18 L19 18 Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      );
    case 'cube':
    default:
      return (
        <svg {...common}>
          <path d="M24 4 L42 14 V34 L24 44 L6 34 V14 Z" fill="currentColor" opacity="0.7" />
          <path d="M24 4 V24 M6 14 L24 24 L42 14 M24 24 V44" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
        </svg>
      );
  }
}
