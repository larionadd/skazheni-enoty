import { useEffect, useMemo, useState } from 'react';
import { CARD_DEFS, type CardType } from '../shared/cards.ts';
import type { Card } from '../shared/engine.ts';
import type { ClientAction, MemberView, RoomView } from '../shared/protocol.ts';
import { RulesModal } from './RulesModal.tsx';
import { CardFace, Modal } from './ui.tsx';

const ORDER = Object.keys(CARD_DEFS) as CardType[];

export interface Boom {
  by: string;
  saved: boolean;
  key: number;
}

export function Game({
  view,
  act,
  future,
  clearFuture,
  boom,
}: {
  view: RoomView;
  act: (a: ClientAction) => void;
  future: CardType[] | null;
  clearFuture: () => void;
  boom: Boom | null;
}) {
  const g = view.game!;
  const me = view.me;
  const byId = useMemo(() => new Map(view.members.map((m) => [m.id, m])), [view.members]);
  const name = (id?: string) => (id && byId.get(id)?.name) || '???';
  const meM = byId.get(me);
  const alive = meM?.alive !== false;

  const [selected, setSelected] = useState<number[]>([]);
  const [targeting, setTargeting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const hand = useMemo(
    () => [...g.hand].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || a.id - b.id),
    [g.hand],
  );
  const myTurn = g.phase === 'turn' && g.current === me && !g.pending;

  useEffect(() => {
    setSelected((sel) => sel.filter((id) => g.hand.some((c) => c.id === id)));
    if (!myTurn) setTargeting(false);
  }, [g.hand, myTurn]);

  const selCards = selected.map((id) => hand.find((c) => c.id === id)).filter(Boolean) as Card[];
  const selType = selCards[0]?.type;
  const selDef = selType ? CARD_DEFS[selType] : null;
  const playable =
    myTurn &&
    !!selDef &&
    ((selCards.length === 1 && !selDef.pair && !['nope', 'doormat', 'petard'].includes(selDef.type)) ||
      (selCards.length === 2 && selDef.pair && selCards[1].type === selType));

  function tapCard(c: Card) {
    if (selected.includes(c.id)) return setSelected(selected.filter((x) => x !== c.id));
    const d = CARD_DEFS[c.type];
    if (d.pair && selCards.length === 1 && selType === c.type) return setSelected([...selected, c.id]);
    setSelected([c.id]);
    setTargeting(false);
  }

  function play() {
    if (!playable || !selDef) return;
    if (selDef.targeted) return setTargeting(true);
    act({ t: 'play', cardIds: selected });
    setSelected([]);
  }

  function pickTarget(m: MemberView) {
    if (!targeting || m.id === me || !m.alive || !m.cardCount) return;
    act({ t: 'play', cardIds: selected, target: m.id });
    setSelected([]);
    setTargeting(false);
  }

  const p = g.pending;
  const hasNope = g.hand.some((c) => c.type === 'nope');
  const canNope = !!p && alive && hasNope && p.lastNopeBy !== me && !(p.nopes === 0 && p.by === me);

  let status: string;
  if (g.phase === 'over') status = `🏆 Переміг ${name(g.winner ?? undefined)}!`;
  else if (p) status = `${name(p.by)}: «${CARD_DEFS[p.type].title}»${p.target ? ` → ${name(p.target)}` : ''}`;
  else if (g.phase === 'favor')
    status = g.favor?.giver === me ? 'Віддай одну карту!' : `${name(g.favor?.giver)} обирає карту для ${name(g.favor?.receiver)}…`;
  else if (g.phase === 'defuse')
    status = g.defuse?.playerId === me ? 'Сховай Петарду!' : `${name(g.defuse?.playerId)} таємно ховає Петарду…`;
  else if (myTurn)
    status = targeting ? '👆 Обери суперника вгорі' : `Твій хід${g.turnsLeft > 1 ? ` (ходів: ${g.turnsLeft})` : ''}: грай карти або тягни`;
  else status = `Ходить ${name(g.current)}${g.turnsLeft > 1 ? ` (ходів: ${g.turnsLeft})` : ''}`;

  const chance = g.deckCount ? Math.round((g.petardsInDeck / g.deckCount) * 100) : 0;
  const opponents = view.members.filter((m) => m.id !== me);
  const recentLogs = g.log.slice(-3);

  return (
    <main className={`game${boom && !boom.saved ? ' shake' : ''}`}>
      {/* Opponents */}
      <section className="opponents" aria-label="Суперники">
        {opponents.map((m) => {
          const isTurn = g.current === m.id && g.phase !== 'over';
          const pickable = targeting && m.alive && !!m.cardCount;
          return (
            <button
              key={m.id}
              type="button"
              className={`opp${isTurn ? ' turn' : ''}${m.alive === false ? ' dead' : ''}${pickable ? ' pickable' : ''}`}
              onClick={() => pickTarget(m)}
              disabled={!pickable}
            >
              <span className="opp-avatar">
                {m.alive === false ? '💀' : m.avatar}
                {!m.connected && !m.isBot && <i className="badge-off">📵</i>}
                {m.isBot && <i className="badge-bot">🤖</i>}
              </span>
              <span className="opp-name">{m.name}</span>
              <span className="opp-cards">🂠 {m.cardCount ?? 0}</span>
              {g.pending?.target === m.id && <span className="opp-target">🎯</span>}
            </button>
          );
        })}
      </section>

      {/* Table: Card Back Deck + Discard */}
      <section className="table">
        <div className="deck-wrap">
          <button
            type="button"
            className={`deck-card-stack${myTurn && !targeting ? ' ready' : ''}`}
            disabled={!myTurn || targeting}
            onClick={() => {
              setSelected([]);
              act({ t: 'draw' });
            }}
            aria-label={`Тягнути карту з колоди. Залишилось карт: ${g.deckCount}, шанс петарди: ${chance}%`}
          >
            <img className="deck-back-img" src="cards/back.webp" alt="Колода карт" draggable={false} />
            <span className="deck-badge-top">{g.deckCount} карт</span>
            <span className={`deck-badge-bottom${chance >= 30 ? ' hot' : ''}`}>🧨 {chance}%</span>
          </button>
        </div>

        <div className="discard" aria-label="Скинуті карти">
          {g.discardTop.length ? (
            g.discardTop.map((t, i) => (
              <div key={i} className="discard-card" style={{ transform: `rotate(${(i - 2) * 6}deg)` }}>
                <CardFace type={t} size="sm" />
              </div>
            ))
          ) : (
            <span className="muted">Скид</span>
          )}
        </div>
      </section>

      {/* Status + 3-line Live Center Log */}
      <div className="center-feed">
        <div className="status-row">
          <p className="status" role="status" aria-live="polite">
            {status}
          </p>
          <button className="icon-btn" aria-label="Правила гри" title="Правила гри" onClick={() => setRulesOpen(true)}>
            📖
          </button>
        </div>

        <button type="button" className="center-log" onClick={() => setLogOpen(true)} aria-label="Відкрити повний журнал ходів">
          {recentLogs.map((line, i) => (
            <div key={i} className={`center-log-line${i === recentLogs.length - 1 ? ' latest' : ''}`}>
              {line}
            </div>
          ))}
        </button>
      </div>

      {/* Pending action + nope */}
      {p && (
        <section className="pending" key={p.id}>
          <div className={`pending-card${p.nopes % 2 ? ' noped' : ''}`}>
            <CardFace type={p.type} size="sm" />
            {p.nopes > 0 && <span className="nope-stamp">{p.nopes % 2 ? 'НІ!' : 'ТАК!'}</span>}
          </div>
          <div className="pending-side">
            <div className="timer">
              <div key={`${p.id}:${p.nopes}`} style={{ animationDuration: `${p.msLeft}ms` }} />
            </div>
            {canNope ? (
              <button className="btn btn-nope" onClick={() => act({ t: 'nope' })}>
                🛑 {p.nopes % 2 ? 'А от і ні!' : 'Моє! Не руш!'}
              </button>
            ) : (
              <span className="muted small">{p.nopes % 2 ? 'Скасовано… поки що' : 'Хтось скаже «Ні»?'}</span>
            )}
          </div>
        </section>
      )}

      {!alive && g.phase !== 'over' && <p className="spectator">💥 Ти вилетів. Дивись, хто стане королем бака!</p>}

      {/* Action bar */}
      {selDef && (
        <section className="actionbar">
          <p className="sel-rule">
            <b>{selDef.title}:</b> {selDef.rule}
          </p>
          <div className="row">
            {targeting ? (
              <button className="btn btn-ghost" onClick={() => setTargeting(false)}>
                Скасувати
              </button>
            ) : (
              <button className="btn btn-primary" disabled={!playable} onClick={play}>
                {selCards.length === 2 ? '🫳 Вкрасти парою' : selDef.pair ? 'Потрібна пара однакових' : '▶ Зіграти'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Hand */}
      <section className={`hand${hand.length > 6 ? ' tight' : ''}`} aria-label="Твої карти">
        {hand.map((c) => (
          <CardFace key={c.id} type={c.type} selected={selected.includes(c.id)} onClick={() => tapCard(c)} />
        ))}
        {!hand.length && alive && <span className="muted">Порожні лапи</span>}
      </section>

      {/* ── Dialogs ── */}
      <Modal open={g.phase === 'favor' && g.favor?.giver === me} title={`🥺 ${name(g.favor?.receiver)} просить поділитися`} mandatory>
        <p className="muted">Обери карту, яку віддаси:</p>
        <div className="grid">
          {hand.map((c) => (
            <CardFace key={c.id} type={c.type} size="sm" onClick={() => act({ t: 'favor', cardId: c.id })} />
          ))}
        </div>
      </Modal>

      {g.phase === 'defuse' && g.defuse?.playerId === me && <DefuseDialog deckCount={g.deckCount} act={act} />}

      <Modal open={!!future} onClose={clearFuture} title="👃 Нюх-Радар: верх бака">
        <div className="future">
          {future?.map((t, i) => (
            <div key={i} className="future-slot">
              <span className="muted small">{i === 0 ? 'Зверху' : `${i + 1}-а`}</span>
              <CardFace type={t} size="sm" />
            </div>
          ))}
          {future?.length === 0 && <p>Бак порожній!</p>}
        </div>
        <button className="btn btn-primary" onClick={clearFuture}>
          Запам’ятав 🤫
        </button>
      </Modal>

      <Modal open={g.phase === 'over'} title={g.winner === me ? '🏆 Ти король бака!' : `🏆 Переміг ${name(g.winner ?? undefined)}`} mandatory>
        <p className="big-emoji">{g.winner === me ? '👑🦝' : '💥🗑️'}</p>
        {view.hostId === me ? (
          <button className="btn btn-primary btn-big" onClick={() => act({ t: 'restart' })}>
            🔁 Ще раунд
          </button>
        ) : (
          <p className="muted">Господар може почати новий раунд.</p>
        )}
        <button className="btn btn-link" onClick={() => act({ t: 'leave' })}>
          Вийти
        </button>
      </Modal>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="📜 Повний журнал ходів" className="tall">
        <ol className="log">
          {[...g.log].reverse().map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
        <button className="btn btn-primary" onClick={() => setLogOpen(false)}>
          Закрити
        </button>
      </Modal>

      {boom && (
        <div key={boom.key} className={`boom ${boom.saved ? 'saved' : 'dead'}`} aria-hidden>
          <span>{boom.saved ? '🫓🦝' : '💥'}</span>
          <b>{boom.saved ? `${name(boom.by)} прикинувся Килимком!` : `БАХ! ${name(boom.by)} вилітає!`}</b>
        </div>
      )}
    </main>
  );
}

function DefuseDialog({ deckCount, act }: { deckCount: number; act: (a: ClientAction) => void }) {
  const [pos, setPos] = useState(0);
  const label = pos === 0 ? 'На самий верх 😈' : pos >= deckCount ? 'На саме дно' : `${pos + 1}-а карта зверху`;
  return (
    <Modal open title="🤫 Сховай Петарду назад у бак" mandatory>
      <div className="defuse-art">
        <CardFace type="petard" size="sm" />
      </div>
      <p className="center">
        <b>{label}</b>
      </p>
      <input
        type="range"
        min={0}
        max={deckCount}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Позиція Петарди в баку"
        className="range"
      />
      <div className="row wrap">
        <button className="btn btn-ghost small" onClick={() => setPos(0)}>
          Верх
        </button>
        <button className="btn btn-ghost small" onClick={() => setPos(Math.min(1, deckCount))}>
          2-а
        </button>
        <button className="btn btn-ghost small" onClick={() => setPos(Math.floor(Math.random() * (deckCount + 1)))}>
          🎲 Випадково
        </button>
        <button className="btn btn-ghost small" onClick={() => setPos(deckCount)}>
          Дно
        </button>
      </div>
      <button className="btn btn-primary btn-big" onClick={() => act({ t: 'place', position: pos })}>
        Сховати
      </button>
    </Modal>
  );
}
