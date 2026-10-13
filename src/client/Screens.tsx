import { useState } from 'react';
import { AVATARS, MAX_PLAYERS, MIN_PLAYERS } from '../shared/cards.ts';
import type { ClientAction, RoomView } from '../shared/protocol.ts';
import { RulesModal } from './RulesModal.tsx';

export interface Profile {
  name: string;
  avatar: string;
}

export function Home({
  profile,
  setProfile,
  initialCode,
  busy,
  onCreate,
  onJoin,
  onOffline,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  initialCode: string;
  busy: boolean;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onOffline: (bots: number) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [bots, setBots] = useState(3);
  const [rulesOpen, setRulesOpen] = useState(false);
  const nameOk = profile.name.trim().length > 0;

  return (
    <main className="home">
      <header className="logo">
        <span className="logo-emoji" aria-hidden>
          🦝🧨
        </span>
        <h1>
          Скажені Єноти
          <small>Нічний Дожор</small>
        </h1>
      </header>

      <section className="panel">
        <label className="field">
          <span>Твоє ім’я</span>
          <input
            value={profile.name}
            maxLength={16}
            autoComplete="nickname"
            enterKeyHint="done"
            placeholder="Наприклад, Шкряб"
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </label>
        <div className="avatars" role="radiogroup" aria-label="Аватар">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={profile.avatar === a}
              className={profile.avatar === a ? 'on' : ''}
              onClick={() => setProfile({ ...profile, avatar: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <button className="btn btn-primary btn-big" disabled={!nameOk || busy} onClick={onCreate}>
          🗑️ Створити кімнату
        </button>
        <form
          className="join"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 4) onJoin(code);
          }}
        >
          <input
            aria-label="Код кімнати"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="Код: 1234"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <button className="btn btn-secondary" disabled={!nameOk || busy || code.length !== 4}>
            Увійти
          </button>
        </form>
      </section>

      <section className="panel offline">
        <div className="offline-row">
          <span>🤖 Ботів:</span>
          <div className="stepper">
            <button type="button" aria-label="Менше ботів" onClick={() => setBots(Math.max(1, bots - 1))}>
              −
            </button>
            <b>{bots}</b>
            <button type="button" aria-label="Більше ботів" onClick={() => setBots(Math.min(MAX_PLAYERS - 1, bots + 1))}>
              +
            </button>
          </div>
        </div>
        <button className="btn btn-ghost btn-big" disabled={!nameOk} onClick={() => onOffline(bots)}>
          📴 Грати з ботами (без інтернету)
        </button>
      </section>

      <button type="button" className="btn btn-rules btn-big" onClick={() => setRulesOpen(true)}>
        📖 Правила гри та всі карти
      </button>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}

export function Lobby({ view, act }: { view: RoomView; act: (a: ClientAction) => void }) {
  const isHost = view.me === view.hostId;
  const [copied, setCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const baseUrl =
    location.protocol.startsWith('http') && !location.hostname.includes('localhost')
      ? `${location.origin}${location.pathname}`
      : 'https://larionadd.github.io/skazheni-enoty/';
  const link = `${baseUrl}?room=${view.code}`;

  async function share() {
    const text = `Го в «Скажені Єноти»! Код кімнати: ${view.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Скажені Єноти', text, url: link });
        return;
      } catch {
        /* user cancelled -> fall back to copy */
      }
    }
    await navigator.clipboard?.writeText(`${text}\n${link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="lobby">
      <section className="panel code-panel">
        <span className="muted">Код кімнати</span>
        <strong className="room-code">{view.code}</strong>
        {!view.offline && (
          <button className="btn btn-secondary" onClick={share}>
            {copied ? '✅ Скопійовано' : '📤 Поділитися з друзями'}
          </button>
        )}
      </section>

      <section className="panel">
        <h2>
          Банда ({view.members.length}/{MAX_PLAYERS})
        </h2>
        <ul className="members">
          {view.members.map((m) => (
            <li key={m.id} className={m.connected ? '' : 'offline'}>
              <span className="avatar">{m.avatar}</span>
              <span className="mname">
                {m.name}
                {m.id === view.me && <em> (ти)</em>}
              </span>
              {m.id === view.hostId && <span title="Господар">👑</span>}
              {m.isBot && <span className="tag">бот</span>}
              {!m.connected && <span className="tag warn">нема зв’язку</span>}
              {isHost && m.id !== view.me && (
                <button className="icon-btn" aria-label={`Вигнати ${m.name}`} onClick={() => act({ t: 'kick', playerId: m.id })}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        {isHost && view.members.length < MAX_PLAYERS && (
          <button className="btn btn-ghost" onClick={() => act({ t: 'addBot' })}>
            ➕ Додати бота
          </button>
        )}
      </section>

      {isHost ? (
        <button className="btn btn-primary btn-big" disabled={view.members.length < MIN_PLAYERS} onClick={() => act({ t: 'start' })}>
          🧨 Почати дожір
        </button>
      ) : (
        <p className="muted center">Чекаємо, поки господар почне гру…</p>
      )}
      <div className="row between">
        <button className="btn btn-ghost small" onClick={() => setRulesOpen(true)}>
          📖 Правила гри
        </button>
        <button className="btn btn-link" onClick={() => act({ t: 'leave' })}>
          Вийти з кімнати
        </button>
      </div>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
