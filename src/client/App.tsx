import { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_DEFS, AVATARS, type CardType } from '../shared/cards.ts';
import type { ClientAction, GameEvent, RoomView } from '../shared/protocol.ts';
import { CloudTransport } from './cloud.ts';
import { sfx, isMuted, setMuted } from './fx.ts';
import { Game, type Boom } from './Game.tsx';
import { loadSession, OfflineTransport, saveSession, type NetStatus, type Transport } from './net.ts';
import { Home, Lobby, type Profile } from './Screens.tsx';

interface Toast {
  id: number;
  text: string;
  tone?: 'bad' | 'good';
}

function loadProfile(): Profile {
  try {
    const p = JSON.parse(localStorage.getItem('enoty.profile') ?? 'null');
    if (p?.name !== undefined) return p;
  } catch {
    /* ignore */
  }
  return { name: 'Шкряб', avatar: AVATARS[0] };
}

export function App() {
  const [profile, setProfileState] = useState<Profile>(loadProfile);
  const [view, setView] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<NetStatus>('connecting');
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [future, setFuture] = useState<CardType[] | null>(null);
  const [boom, setBoom] = useState<Boom | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const transport = useRef<Transport | null>(null);
  const online = useRef<CloudTransport | null>(null);
  const viewRef = useRef<RoomView | null>(null);
  viewRef.current = view;

  const setProfile = (p: Profile) => {
    setProfileState(p);
    try {
      localStorage.setItem('enoty.profile', JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const toast = useCallback((text: string, tone?: Toast['tone']) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const nameOf = (id: string) => viewRef.current?.members.find((m) => m.id === id)?.name ?? '???';

  const onEvents = useCallback(
    (events: GameEvent[]) => {
      const me = viewRef.current?.me;
      for (const e of events) {
        switch (e.kind) {
          case 'played':
            sfx.card();
            break;
          case 'noped':
            sfx.nope();
            break;
          case 'drew':
            sfx.draw();
            break;
          case 'future':
            setFuture(e.cards);
            break;
          case 'gotCard':
            if (e.reason !== 'draw') toast(`🎁 Ти отримав «${CARD_DEFS[e.card].title}» від ${nameOf(e.from ?? '')}`, 'good');
            else toast(`Ти витягнув «${CARD_DEFS[e.card].title}»`);
            break;
          case 'lostCard':
            toast(`😿 ${nameOf(e.taker)} забрав твою «${CARD_DEFS[e.card].title}»`, 'bad');
            break;
          case 'exploded':
            setBoom({ by: e.by, saved: e.saved, key: Date.now() });
            if (e.saved) sfx.saved();
            else sfx.boom();
            setTimeout(() => setBoom(null), 1800);
            break;
          case 'shuffled':
            toast(`🌪️ ${nameOf(e.by)} перемішав бак`);
            break;
          case 'turn':
            if (e.player === me) sfx.turn();
            break;
          case 'winner':
            if (e.player === me) sfx.win();
            break;
        }
      }
    },
    [toast],
  );

  const listener = useRef({
    onView: (v: RoomView) => setView(v),
    onEvents: (e: GameEvent[]) => onEventsRef.current(e),
    onStatus: (s: NetStatus) => setStatus(s),
    onKicked: () => {
      setView(null);
      toast('Тебе більше немає в кімнаті.', 'bad');
    },
  });
  const onEventsRef = useRef(onEvents);
  onEventsRef.current = onEvents;

  const getOnline = useCallback(() => {
    if (!online.current) online.current = new CloudTransport(listener.current);
    transport.current = online.current;
    return online.current;
  }, []);

  // Connect immediately and restore any previous online session.
  useEffect(() => {
    const client = getOnline();
    const s = loadSession();
    if (s) void client.resume(s);
  }, [getOnline]);

  const initialCode = new URLSearchParams(location.search).get('room') ?? '';

  async function enter(mode: 'create' | 'join', code?: string) {
    setBusy(true);
    const err = await getOnline().enter(mode, profile.name, profile.avatar, code);
    setBusy(false);
    if (err) toast(err, 'bad');
    else {
      try {
        history.replaceState(null, '', location.pathname);
      } catch {
        /* ignore on file:// */
      }
    }
  }

  function startOffline(bots: number) {
    transport.current?.close();
    online.current = null;
    transport.current = new OfflineTransport(listener.current, profile.name, profile.avatar, bots);
    void transport.current.act({ t: 'start' });
  }

  const act = useCallback(
    async (a: ClientAction) => {
      const t = transport.current;
      if (!t) return;
      const err = await t.act(a);
      if (err) toast(err, 'bad');
      else if (a.t === 'leave') {
        if (viewRef.current?.offline) {
          t.close();
          transport.current = null;
        }
        saveSession(null);
        setView(null);
        setFuture(null);
      }
    },
    [toast],
  );

  const inRoom = view && view.members.some((m) => m.id === view.me);

  return (
    <div className="app">
      <div className="topbar">
        <span className={`net net-${status}`}>
          {status === 'online' && '● онлайн'}
          {status === 'connecting' && '○ з’єднання…'}
          {status === 'reconnecting' && '◌ перепідключення…'}
          {status === 'offline-mode' && '📴 офлайн з ботами'}
        </span>
        {inRoom && !view.offline && <span className="topcode">Кімната {view.code}</span>}
        <button
          className="icon-btn"
          aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {!inRoom && (
        <Home
          profile={profile}
          setProfile={setProfile}
          initialCode={initialCode}
          busy={busy}
          onCreate={() => enter('create')}
          onJoin={(code) => enter('join', code)}
          onOffline={startOffline}
        />
      )}
      {inRoom && !view.game && <Lobby view={view} act={act} />}
      {inRoom && view.game && <Game view={view} act={act} future={future} clearFuture={() => setFuture(null)} boom={boom} />}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? ''}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
