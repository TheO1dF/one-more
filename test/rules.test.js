import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, practiceRun, act, card, onTable, score, value, partners, restore } from '../game/engine.js';

function fixture(tableKinds, drawKinds = ['paper', 'bomb']) {
  const s = newRun(124); s.cards = []; s.uid = 0; s.table = []; s.draw = []; s.discard = []; s.known = []; s.flips = tableKinds.length; s.target = 0;
  for (const [zone, kinds] of [['table', tableKinds], ['deck', drawKinds]]) {
    for (const kind of kinds) {
      const c = { uid: ++s.uid, original: kind, kind, zone, tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: s.uid, triggers: 0, freeCost: false };
      s.cards.push(c); (zone === 'table' ? s.table : s.draw).push(c.uid);
    }
  }
  return s;
}
function id(s, kind, index = 0) { return s.cards.filter(c => c.kind === kind)[index].uid; }

test('20-card start, one permanent bomb, first reveal protection and reachable second-card bomb', () => {
  let seconds = 0;
  for (let seed = 1; seed <= 600; seed++) {
    const s = newRun(seed); assert.equal(s.cards.length, 20); assert.equal(s.cards.filter(c => c.original === 'bomb').length, 1); assert.notEqual(card(s, s.draw[0]).kind, 'bomb');
    if (card(s, s.draw[1]).kind === 'bomb') seconds++;
  }
  assert.ok(seconds > 10 && seconds < 70, `second-card bombs: ${seconds}`);
  assert.equal(newRun(4, 'mixed').cards.length, 20);
});

test('peek identifies bomb without drawing, triggering delays, or ending the run', () => {
  let s = fixture(['torch', 'jar', 'paper'], ['bomb', 'rice']); card(s, id(s, 'paper')).sealedBy = id(s, 'jar'); card(s, id(s, 'paper')).ferment = 1;
  s = act(s, { type: 'use', uid: id(s, 'torch') }); assert.equal(s.phase, 'play'); assert.equal(s.draw.length, 2); assert.equal(s.known[0], id(s, 'bomb')); assert.equal(card(s, id(s, 'paper')).ferment, 1);
  s = act(s, { type: 'draw' }); assert.equal(s.reason, 'bomb'); assert.equal(card(s, id(s, 'paper')).ferment, 1);
  assert.throws(() => act(s, { type: 'relic', id: 'shaker' }));
});

test('practice chain: scrap completes fermentation, wild pairs with mint, flashlight readies and peeks', () => {
  let s = practiceRun(); s = act(s, { type: 'draw' }); assert.equal(card(s, 4).kind, 'wild'); assert.equal(card(s, 4).sealedBy, null);
  s = act(s, { type: 'pair', ids: [1, 4], target: 2 }); assert.equal(score(s), 40); assert.equal(card(s, 2).tapped, false);
  s = act(s, { type: 'use', uid: 2 }); assert.equal(card(s, s.known[0]).kind, 'fish'); assert.equal(s.flips, 5);
});

test('third matching food neither triples nor reuses an already paired card; wildcard uses partner ability once', () => {
  let s = fixture(['fish', 'fish', 'fish', 'wild']); s = act(s, { type: 'pair', ids: [1, 2] }); assert.equal(score(s), 60); assert.equal(s.known.length, 1);
  assert.throws(() => act(s, { type: 'pair', ids: [1, 3] }));
  s = act(s, { type: 'pair', ids: [3, 4] }); assert.equal(score(s), 80); assert.equal(s.log.filter(e => e.key === 'peek').length, 2);
});

test('failed payment/target is atomic and a spent ingredient loses points and pairing access', () => {
  const s = fixture(['rice', 'scope', 'cloth', 'oil']); const snapshot = JSON.stringify(s);
  assert.throws(() => act(s, { type: 'use', uid: 2, food: 1 })); assert.equal(JSON.stringify(s), snapshot);
  let t = act(s, { type: 'wipeOil', uid: 4, food: 1 }); assert.equal(score(t), 0); assert.equal(card(t, 1).zone, 'discard'); assert.equal(card(t, 1).paid, false);
  t = fixture(['rice', 'cloth', 'paper']); const before = JSON.stringify(t);
  assert.throws(() => act(t, { type: 'use', uid: 2, food: 1, target: 999 })); assert.equal(JSON.stringify(t), before);
  t = act(t, { type: 'use', uid: 2, food: 1, target: 3 }); assert.equal(t.table.length, 1); assert.equal(card(t, 1).paid, true); assert.equal(card(t, 2).tapped, true);
});

test('oil prevents tool activation, but a rice pair clears oil and releases a normal action window', () => {
  let s = fixture(['rice', 'rice', 'oil', 'torch']); assert.throws(() => act(s, { type: 'use', uid: 4 }));
  s = act(s, { type: 'pair', ids: [1, 2], target: 3 }); s = act(s, { type: 'use', uid: 4 }); assert.equal(s.known.length, 1); assert.equal(score(s), 40);
});

test('wrap captures food, sealing its source releases food immediately, and fermentation is temporary', () => {
  let s = fixture(['wrap', 'jar'], ['rice', 'paper', 'fish', 'bomb']); s = act(s, { type: 'draw' }); const rice = id(s, 'rice'); assert.equal(card(s, rice).sealedBy, 1); assert.equal(score(s), 0);
  s = act(s, { type: 'use', uid: 2, target: 1 }); assert.equal(card(s, rice).sealedBy, null); assert.equal(score(s), 10);
  s = act(s, { type: 'draw' }); assert.equal(card(s, 1).ferment, 1);
  s = act(s, { type: 'draw' }); assert.equal(card(s, 1).kind, 'wild');
  s = act(s, { type: 'stop' }); s = act(settle(s), { type: 'next' }); assert.equal(card(s, 1).kind, 'wrap'); assert.equal(card(s, 1).ferment, null); assert.equal(card(s, 2).tapped, false);
});

test('multiple wraps capture distinct available foods and never reinterpret bomb', () => {
  let s = fixture(['wrap', 'wrap'], ['rice', 'fish', 'bomb']); s = act(s, { type: 'draw' }); assert.equal(card(s, 1).caught, 3); assert.equal(card(s, 2).caught, null);
  s = act(s, { type: 'draw' }); assert.equal(card(s, 2).caught, 4); s = act(s, { type: 'draw' }); assert.equal(s.reason, 'bomb');
});

test('debt suppresses unpaired points, but food remains usable for costs', () => {
  let s = fixture(['rice', 'rice', 'debt', 'scope']); assert.equal(score(s), 0); s = act(s, { type: 'pair', ids: [1, 2] }); assert.equal(score(s), 40);
  s = fixture(['rice', 'debt', 'scope'], ['fish', 'paper', 'bomb']); s = act(s, { type: 'use', uid: 3, food: 1 }); assert.equal(s.known.length, 3); assert.equal(card(s, 1).zone, 'discard');
});

test('fog limits only future peeks, forbids swaps, and does not erase earlier knowledge', () => {
  let s = fixture(['rice', 'scope', 'sorter', 'fog'], ['fish', 'mint', 'bomb']); s.known = [5, 6];
  s = act(s, { type: 'use', uid: 2, food: 1 }); assert.deepEqual(s.known, [5, 6]); assert.throws(() => act(s, { type: 'use', uid: 3, ids: [5, 6] }));
});

test('sorter preserves bomb position and known identities, and rejects swapping unknown cards', () => {
  let s = fixture(['sorter'], ['wrap', 'fish', 'bomb', 'rice']); s.known = [2, 3, 4];
  assert.throws(() => act(s, { type: 'use', uid: 1, ids: [2, 5] })); assert.throws(() => act(s, { type: 'use', uid: 1, ids: [2, 4] }));
  s = act(s, { type: 'use', uid: 1, ids: [2, 3] }); assert.deepEqual(s.draw, [3, 2, 4, 5]);
});

test('shuffle is once per round, clears information, excludes table/discard, and can put bomb next', () => {
  let topBomb = false;
  for (let seed = 1; seed < 80; seed++) {
    let s = fixture(['rice', 'torch'], ['paper', 'fish', 'bomb']); s.rng = seed; s.known = [...s.draw];
    const original = [...s.draw].sort(); s = act(s, { type: 'relic', id: 'shaker' }); assert.deepEqual([...s.draw].sort(), original); assert.equal(s.table.length, 2); assert.equal(s.known.length, 0);
    if (card(s, s.draw[0]).kind === 'bomb') topBomb = true; assert.throws(() => act(s, { type: 'relic', id: 'shaker' }));
  }
  assert.ok(topBomb); assert.throws(() => act(newRun(8), { type: 'relic', id: 'shaker' }));
});

test('wish is a required named choice, fires once only on a later true reveal', () => {
  let s = fixture(['torch'], ['wish', 'fish', 'fish', 'paper', 'bomb']); s = act(s, { type: 'draw' }); assert.equal(s.pending, 'wish'); assert.throws(() => act(s, { type: 'draw' }));
  s = act(s, { type: 'wish', kind: 'fish' }); s = act(s, { type: 'draw' }); assert.equal(s.known.length, 3); assert.equal(card(s, 2).wish, null);
  const count = s.log.filter(e => e.key === 'wishHit').length; s = act(s, { type: 'draw' }); assert.equal(s.log.filter(e => e.key === 'wishHit').length, count);
});

test('echo repeats an ability, not a pair event; cannot self-ready or create a free loop', () => {
  let s = fixture(['mint', 'mint', 'torch', 'bell', 'rice']); card(s, 3).tapped = true;
  s = act(s, { type: 'pair', ids: [1, 2], target: 3 }); s = act(s, { type: 'use', uid: 3 });
  assert.throws(() => act(s, { type: 'use', uid: 4, food: 5, target: 4 }));
  s = act(s, { type: 'use', uid: 4, food: 5, target: 3 }); assert.equal(card(s, 3).tapped, false); assert.equal(card(s, 4).tapped, true); assert.equal(s.log.filter(e => e.key === 'pair').length, 1); assert.equal(score(s), 40);
});

test('splitter and recycler retain physical-card history; food can be recovered only once per round', () => {
  let s = fixture(['fish', 'fish', 'scope']); s.relics.push('splitter', 'recycler');
  s = act(s, { type: 'pair', ids: [1, 2] }); s = act(s, { type: 'relic', id: 'splitter', uid: 1 }); assert.equal(score(s), 20); assert.equal(partners(s, 1).length, 0);
  s = act(s, { type: 'use', uid: 3, food: 1 }); s = act(s, { type: 'relic', id: 'recycler', uid: 1 }); assert.equal(card(s, 1).zone, 'table'); assert.equal(partners(s, 1).length, 0);
  assert.throws(() => act(s, { type: 'relic', id: 'recycler', uid: 1 }));
});

test('lunchbox forgoes income, removes the carried card from next draw pile, and does not consume safe first reveal', () => {
  let s = fixture(['rice', 'fish'], ['mint', 'bomb']); s.relics.push('lunchbox');
  s = act(s, { type: 'stop', carry: 1 }); assert.equal(s.roundEarned, 10); s = act(settle(s), { type: 'next' });
  assert.deepEqual(s.table, [1]); assert.equal(s.draw.length, 3); assert.equal(s.flips, 0); assert.notEqual(card(s, s.draw[0]).kind, 'bomb');
});

test('draft allows one independent add and remove, protects the bomb, and resets only next round', () => {
  let s = act(act({ ...newRun(19), target: 0 }, { type: 'draw' }), { type: 'stop' }); s = settle(s); const length = s.cards.length;
  s = act(s, { type: 'add', id: s.offers[0] }); assert.ok(s.cards.length > length); assert.throws(() => act(s, { type: 'add', id: s.offers[1] }));
  assert.throws(() => act(s, { type: 'remove', uid: id(s, 'bomb') })); s = act(s, { type: 'remove', uid: id(s, 'rice') }); assert.throws(() => act(s, { type: 'remove', uid: id(s, 'rice') }));
  s = act(settle(s), { type: 'next' }); assert.equal(s.round, 2); assert.equal(s.table.length, 0); assert.equal(s.cards.filter(c => c.original === 'bomb').length, 1);
});

test('cash-out commits exactly once and terminal results distinguish victory, shortfall, and bomb', () => {
  let s = fixture(['fish', 'fish']); s.round = 5; s.bank = 20; s.target = 60; s = act(s, { type: 'pair', ids: [1, 2] }); s = act(s, { type: 'stop' }); assert.equal(s.phase, 'won'); assert.equal(s.bank, 60); assert.throws(() => act(s, { type: 'stop' }));
  let short = fixture(['rice']); short.round = 5; short.target = 30; short = act(short, { type: 'stop' }); assert.equal(short.phase, 'lost'); assert.equal(short.reason, 'target');
});

test('saved state preserves draw order, choices, spent tools and deterministic future', () => {
  let s = practiceRun(); s = act(s, { type: 'draw' }); const recovered = restore(JSON.stringify(s)); assert.deepEqual(recovered, s); assert.deepEqual(act(s, { type: 'draw' }), act(recovered, { type: 'draw' }));
  assert.equal(restore('{'), null); assert.equal(restore(JSON.stringify({ ...s, cards: [] })), null);
});

function settle(s) { return s.phase === 'stakes' ? act(act(s, { type: 'roll' }), { type: 'acceptDice', boon: 'scout' }) : s; }
