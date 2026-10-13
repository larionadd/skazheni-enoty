import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number };

export function IconCard({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor" fillOpacity="0.18" />
      <path d="M9 7h6M9 12h6M9 17h4" />
    </svg>
  );
}

export function IconBomb({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <circle cx="11" cy="13" r="7.5" fill="#ff3b3b" fillOpacity="0.35" stroke="#ff3b3b" />
      <path d="M16.5 7.5L19 5" stroke="#ff9f1c" strokeWidth="2.4" />
      <path d="M19 3l1.5 1.5M22 5l-1.5 1.5M19 7l1.5-1.5" stroke="#ffd166" strokeWidth="2" />
    </svg>
  );
}

export function IconDefuse({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" fill="#22c55e" fillOpacity="0.28" stroke="#22c55e" />
      <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2.6" />
    </svg>
  );
}

export function IconNope({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <circle cx="12" cy="12" r="9" fill="#ff2d95" fillOpacity="0.25" stroke="#ff2d95" />
      <path d="M5.5 5.5l13 13" stroke="#ff2d95" strokeWidth="2.5" />
    </svg>
  );
}

export function IconCrown({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M3 18h18l-2-11-5 5-2-7-2 7-5-5-2 11z" fill="#ffd166" fillOpacity="0.85" stroke="#e0a526" />
      <circle cx="12" cy="5" r="1.2" fill="#fff" />
      <circle cx="4" cy="7" r="1" fill="#fff" />
      <circle cx="20" cy="7" r="1" fill="#fff" />
    </svg>
  );
}

export function IconTrophy({ size = 20, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" fill="#ffd166" fillOpacity="0.85" stroke="#e0a526" />
      <path d="M6 7H3a2 2 0 0 0 0 4h3M18 7h3a2 2 0 0 1 0 4h-3M12 15v4M8 21h8" stroke="#ffd166" strokeWidth="2.2" />
    </svg>
  );
}

export function IconBot({ size = 14, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <rect x="4" y="8" width="16" height="12" rx="3" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" />
      <circle cx="9" cy="13" r="1.5" fill="#fff" />
      <circle cx="15" cy="13" r="1.5" fill="#fff" />
      <path d="M12 4v4M9 18h6M2 13h2M20 13h2" stroke="#38bdf8" />
    </svg>
  );
}

export function IconOffline({ size = 14, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 14 0M1.5 8.5a15 15 0 0 1 21 0" />
    </svg>
  );
}

export function IconRules({ size = 18, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fillOpacity="0.2" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  );
}

export function IconTarget({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ff2d95" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <circle cx="12" cy="12" r="8" fill="#ff2d95" fillOpacity="0.25" />
      <circle cx="12" cy="12" r="3" fill="#ff2d95" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function IconDice({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.2" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconSkull({ size = 18, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M12 2a7 7 0 0 0-7 7c0 3.1 1.9 5.8 4.7 6.6V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3.4c2.8-.8 4.7-3.5 4.7-6.6a7 7 0 0 0-7-7z" fill="#94a3b8" fillOpacity="0.3" />
      <circle cx="9" cy="10" r="1.5" fill="#f87171" />
      <circle cx="15" cy="10" r="1.5" fill="#f87171" />
      <path d="M10 17v2M14 17v2" stroke="#64748b" />
    </svg>
  );
}

export function IconVolume({ on = true, size = 18, ...p }: Props & { on?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.25" />
      {on ? (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
      ) : (
        <line x1="16" y1="9" x2="22" y2="15" stroke="#f87171" strokeWidth="2.4" />
      )}
    </svg>
  );
}

export function IconShare({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <circle cx="18" cy="5" r="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="6" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      <circle cx="18" cy="19" r="3" fill="currentColor" fillOpacity="0.25" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

export function IconRadar({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3dff8a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <circle cx="12" cy="12" r="9" fill="#3dff8a" fillOpacity="0.18" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="#3dff8a" />
      <path d="M12 3v9l6 6" />
    </svg>
  );
}

export function IconShuffle({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#a06bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

export function IconSteal({ size = 16, ...p }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffc531" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M6 14v-2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-4" fill="#ffc531" fillOpacity="0.25" />
    </svg>
  );
}
