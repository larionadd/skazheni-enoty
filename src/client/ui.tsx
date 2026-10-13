import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { CARD_DEFS, type CardType } from '../shared/cards.ts';

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

/** Native <dialog> modal. `mandatory` blocks Esc/back-gesture dismissal for required choices. */
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
  title: string;
  children: ReactNode;
  mandatory?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        if (mandatory) e.preventDefault();
        else onClose?.();
      }}
      onClose={() => open && !mandatory && onClose?.()}
    >
      {open && (
        <>
          <h2 id="modal-title">{title}</h2>
          {children}
        </>
      )}
    </dialog>
  );
}
