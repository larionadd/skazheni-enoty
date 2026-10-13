import type { CSSProperties, ReactNode } from 'react';
import { AVATARS, CARD_DEFS, type CardType } from '../shared/cards.ts';
import { IconSkull } from './icons.tsx';

export function AvatarImg({ src, dead }: { src?: string; dead?: boolean }) {
  if (dead) {
    return (
      <span className="dead-skull" title="Вибув">
        <IconSkull size={24} />
      </span>
    );
  }
  const valid = src && AVATARS.includes(src) ? src : AVATARS[0];
  return <img className="avatar-img" src={valid} alt="" draggable={false} decoding="async" />;
}

export function CardFace({
  type,
  size = 'md',
  selected,
  dim,
  isNew,
  cardId,
  onClick,
}: {
  type: CardType;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  dim?: boolean;
  isNew?: boolean;
  cardId?: number;
  onClick?: () => void;
}) {
  const d = CARD_DEFS[type];
  const cls = `card card-${size}${selected ? ' selected' : ''}${dim ? ' dim' : ''}${isNew ? ' card-new' : ''}${d.pair ? ' pair' : ''}`;
  const style = { '--accent': d.color } as CSSProperties;
  const body = (
    <>
      {isNew && <span className="card-new-badge">НОВА</span>}
      <span className="card-title">{d.title}</span>
      <img className="card-art" src={d.image} alt="" draggable={false} loading="lazy" decoding="async" />
      {size !== 'sm' && <span className="card-text">{d.short}</span>}
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={cls}
      style={style}
      data-card-id={cardId}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${d.title}. ${d.short}`}
    >
      {body}
    </button>
  ) : (
    <div className={cls} style={style} data-card-id={cardId} aria-label={d.title}>
      {body}
    </div>
  );
}

/** Controlled React modal with high-z backdrop (never hijacks the top-layer). */
export function Modal({
  open,
  onClose,
  title,
  children,
  mandatory,
  className = '',
}: {
  open: boolean;
  onClose?: () => void;
  title: ReactNode;
  children: ReactNode;
  mandatory?: boolean;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      className={`modal-backdrop ${className}`}
      onClick={(e) => {
        if (!mandatory && e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`modal ${className}`}>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
