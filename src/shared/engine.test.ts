// Smoke test: simulate many all-bot games with a fake clock and check invariants.
// Run with `npm test`.
import assert from 'node:assert/strict';
import { Room } from './room.ts';
import { createGame, drawCard, playCards, playNope, tick, type GameState } from './engine.ts';

function totalCards(g: GameState) {
  return g.deck.length + g.discard.length + g.players.reduce((n, p) => n + p.hand.length, 0) + (g.defuse ? 1 : 0);
}

// 1) Deck composition.
for (let n = 2; n <= 5; n++) {
  const g = createGame(Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'P' + i, avatar: '🦝', isBot: true })));
  assert.equal(g.deck.filter((c) => c.type === 'petard').length, n - 1, 'petards = players - 1');
  assert.ok(g.players.every((p) => p.hand.length === 8 && p.hand.some((c) => c.type === 'doormat')));
}

// 2) Nope chain: double nope lets the action through.
{
  const g = createGame([
    { id: 'a', name: 'A', avatar: '🦝', isBot: false },
    { id: 'b', name: 'B', avatar: '🦝', isBot: false },
  ]);
  g.current = 0;
  const a = g.players[0];
  const b = g.players[1];
  a.hand = [{ id: 901, type: 'bush' }, { id: 902, type: 'nope' }];
  b.hand = [{ id: 903, type: 'nope' }];
  assert.equal(playCards(g, 'a', [901], undefined, 0), null);
  assert.equal(playNope(g, 'b', 10), null);
  assert.equal(playNope(g, 'a', 20), null);
  tick(g, 100_000);
  assert.equal(g.players[g.current].id, 'b', 'skip went through after nope-nope');
  assert.equal(drawCard(g, 'a'), 'Зараз не твій хід.');
}

// 3) Full bot games.
let finished = 0;
for (let game = 0; game < 300; game++) {
  let now = 0;
  const room = new Room('T', { onChange() {}, onEvents() {} }, true);
  const host = room.join('Host', '🦝');
  assert.ok(typeof host !== 'string');
  const players = 2 + (game % 4);
  for (let i = 1; i < players; i++) room.action(host.id, { t: 'addBot' }, now);
  // The host is driven by the autopilot after "disconnecting".
  room.members[0].isBot = true;
  assert.equal(room.action(host.id, { t: 'start' }, now), null);
  const start = totalCards(room.game!);
  let steps = 0;
  while (room.game!.phase !== 'over' && steps < 20_000) {
    now += 250;
    room.tick(now);
    assert.equal(totalCards(room.game!), start, 'cards are conserved');
    steps++;
  }
  assert.equal(room.game!.phase, 'over', `game ${game} finished`);
  assert.ok(room.game!.winner);
  finished++;
}
console.log(`✅ engine ok — ${finished} bot games finished`);
