import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, dicePractice, act, card, score, restore, needsFoodCost } from '../game/engine.js';
import { CARDS } from '../game/cards.js';

export function fixture(tableKinds, drawKinds = ['rice', 'paper', 'bomb']) {
  const s = newRun(312); Object.assign(s, { cards: [], uid: 0, table: [], draw: [], discard: [], known: [], flips: tableKinds.length, eventCount: tableKinds.length });
  for (const [zone, kinds] of [['table', tableKinds], ['deck', drawKinds]]) for (const kind of kinds) {
    const c = { uid: ++s.uid, original: kind, kind, zone, tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: s.uid, triggers: 0, freeCost: false };
    s.cards.push(c); (zone === 'table' ? s.table : s.draw).push(c.uid);
  }
  return s;
}
const draw = s => act(s, { type: 'draw' });
function stakes(tier, boon = 'scout') {
  for (let seed = 1; seed < 300; seed++) { const s = dicePractice(); s.rng = seed; const rolled = act(s, { type: 'roll' }); if (rolled.dice.result.tier === tier) return act(rolled, { type: 'acceptDice', boon }); }
  throw Error('tier not reached');
}

test('variety deck keeps 20 cards and 16 types, food pairs and two wild partners', () => {
  const s = newRun(48); assert.equal(new Set(s.cards.map(c => c.kind)).size, 16); assert.equal(s.cards.length, 20);
  assert.equal(s.cards.filter(c => CARDS[c.kind].type === 'food').length, 10); assert.equal(s.cards.filter(c => c.kind === 'wild').length, 2); assert.equal(Object.keys(CARDS).length, 27);
});
test('two independent d6 form tens and ones; all 36 outcomes occur and reroll replaces result once', () => {
  const outcomes = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    let s = dicePractice(); s.rng = seed; s = act(s, { type: 'roll' }); const d = s.dice.result; outcomes.add(d.total);
    assert.ok(d.tens >= 1 && d.tens <= 6 && d.ones >= 1 && d.ones <= 6); assert.equal(d.total, d.tens * 10 + d.ones);
    assert.equal(d.tier, d.total <= 23 ? 'low' : d.total >= 51 ? 'high' : 'steady');
    s = act(s, { type: 'roll' }); assert.equal(s.dice.rolls.length, 2); assert.deepEqual(s.dice.result, s.dice.rolls[1]); assert.throws(() => act(s, { type: 'roll' }), /rollLimit/);
  }
  assert.equal(outcomes.size, 36);
});
test('dice state survives reload; target and junk commit only once on acceptance', () => {
  const unrolled = dicePractice(); assert.throws(() => act(unrolled, { type: 'acceptDice' }));
  let s = unrolled; s.rng = 4; s = act(s, { type: 'roll' }); const revived = restore(JSON.stringify(s)); assert.deepEqual(revived.dice, s.dice);
  const next = act(revived, { type: 'acceptDice', boon: 'scout' }); assert.equal(next.target, 30 + s.dice.result.total); assert.equal(next.goalHistory.at(-1).target, next.target);
  assert.equal(next.cards.length, s.dice.result.tier === 'low' ? 21 : 20); assert.throws(() => act(next, { type: 'acceptDice', boon: 'scout' })); assert.equal(next.bank, 40);
  const low = stakes('low'); assert.equal(low.cards.filter(c => c.original === 'paper').length, 2); assert.equal(low.nextBoon, null);
  const steady = stakes('steady'); assert.equal(steady.cards.length, 20); assert.equal(steady.nextBoon, null);
});
test('high roll requires valid boon; scout peeks three without moving first-safe bomb', () => {
  let s, seed = 1; do { s = dicePractice(); s.rng = seed++; s = act(s, { type: 'roll' }); } while (s.dice.result.tier !== 'high');
  assert.throws(() => act(s, { type: 'acceptDice', boon: 'fake' }));
  s = act(act(s, { type: 'acceptDice', boon: 'scout' }), { type: 'next' }); assert.equal(s.known.length, 3); assert.equal(s.flips, 0); assert.notEqual(card(s, s.draw[0]).kind, 'bomb');
});
test('loaned sauce expires, cannot be carried, and never enters the permanent deck', () => {
  let s = act(stakes('high', 'sauce'), { type: 'next' }); const temp = s.cards.find(c => c.temporary); assert.ok(temp); assert.equal(temp.zone, 'table'); assert.equal(s.draw.length, 20);
  s.relics.push('lunchbox'); s.flips = 1; s.target = 0; assert.throws(() => act(s, { type: 'stop', carry: temp.uid }));
  s = act(s, { type: 'stop' }); s = act(act(s, { type: 'roll' }), { type: 'acceptDice', boon: 'meal' }); assert.ok(!s.cards.some(c => c.uid === temp.uid)); assert.ok(!s.table.includes(temp.uid));
});
test('meal waivers and local relay waiver are paid in order; invalid targets spend neither', () => {
  let s = fixture(['scope', 'cloth', 'paper']); s.freePayments = 2; card(s, 1).freeCost = true;
  s = act(s, { type: 'use', uid: 1 }); assert.equal(s.freePayments, 2); assert.equal(card(s, 1).freeCost, false);
  const before = JSON.stringify(s); assert.throws(() => act(s, { type: 'use', uid: 2, target: 999 })); assert.equal(JSON.stringify(s), before);
  s = act(s, { type: 'use', uid: 2, target: 3 }); assert.equal(s.freePayments, 1); assert.equal(s.cards[2].zone, 'discard');
  const next = act(stakes('high', 'meal'), { type: 'next' }); assert.equal(next.freePayments, 2);
});
test('tea uses actual previous reveal, not a peek or a reclaimed card', () => {
  let s = fixture(['torch'], ['rice', 'tea', 'paper', 'bomb']); s = draw(s); s = act(s, { type: 'use', uid: 1 }); const old = s.lastReveal;
  assert.equal(old.kind, 'rice'); s = draw(s); assert.equal(s.log.filter(e => e.key === 'tea').length, 1); assert.deepEqual(s.known, [4]);
  s = fixture(['torch'], ['tea', 'paper', 'bomb']); s = draw(s); assert.equal(s.known.length, 0);
});
test('toast readies the previously revealed tool even if it has since been used', () => {
  let s = fixture([], ['torch', 'toast', 'rice', 'bomb']); s = draw(s); s = act(s, { type: 'use', uid: 1 }); assert.equal(card(s, 1).tapped, true);
  s = draw(s); assert.equal(card(s, 1).tapped, false); assert.equal(s.lastReveal.kind, 'toast');
});
test('toast pair recovers a spent physical card without replaying its reveal or pair history', () => {
  let s = fixture(['toast', 'wild', 'rice', 'scope']); s = act(s, { type: 'use', uid: 4, food: 3 }); const reveals = s.flips;
  s = act(s, { type: 'pair', ids: [1, 2], target: 3 }); assert.equal(card(s, 3).zone, 'table'); assert.equal(s.flips, reveals); assert.equal(score(s), 50);
});
test('ginger clears fog before peeking; choosing no clear still resolves the peek', () => {
  let s = fixture(['ginger', 'wild', 'fog']); s = act(s, { type: 'pair', ids: [1, 2], target: 3 }); assert.equal(card(s, 3).zone, 'discard'); assert.equal(s.known.length, 1); assert.equal(s.lastPair, 'ginger');
  s = fixture(['ginger', 'wild']); s = act(s, { type: 'pair', ids: [1, 2] }); assert.equal(s.known.length, 1);
});
test('timetable checks reveal ordinal, not current table size', () => {
  for (const [flips, n] of [[2, 3], [5, 3], [0, 1], [3, 1]]) { let s = fixture([], ['timetable', 'rice', 'paper', 'bomb']); s.flips = flips; s = draw(s); assert.equal(s.known.length, n); }
});
test('relay rewards food-to-tool order twice; does not reward a no-cost tool', () => {
  let s = fixture(['relay'], ['rice', 'scope', 'fish', 'torch', 'mint', 'sifter', 'tea', 'cloth', 'bomb']);
  for (let i = 0; i < 8; i++) s = draw(s);
  assert.equal(card(s, 1).triggers, 2); assert.equal(card(s, 3).freeCost, true); assert.equal(card(s, 5).freeCost, false); assert.equal(card(s, 7).freeCost, true); assert.equal(card(s, 9).freeCost, false);
  assert.equal(needsFoodCost(s, card(s, 3)), false);
});
test('candlestick waits for two consecutive troubles and only triggers once', () => {
  let s = fixture(['candle'], ['paper', 'rice', 'paper', 'paper', 'paper', 'bomb']); for (let i = 0; i < 5; i++) s = draw(s);
  assert.equal(s.log.filter(e => e.key === 'candle').length, 1); assert.equal(card(s, 1).triggers, 1);
});
test('preheater advances the oldest fermentation in source order, only for a new food name', () => {
  let s = fixture(['stove', 'jar', 'paper', 'paper'], ['rice', 'rice', 'fish', 'bomb']); card(s, 3).sealedBy = 2; card(s, 3).ferment = 2; card(s, 4).sealedBy = 2; card(s, 4).ferment = 2;
  s = draw(s); assert.equal(card(s, 3).kind, 'wild'); assert.equal(card(s, 4).ferment, 1); assert.equal(card(s, 1).triggers, 1);
  s = draw(s); assert.equal(card(s, 4).kind, 'wild'); assert.equal(card(s, 1).triggers, 1);
});
test('rust exhausts the next tool exactly once, with no retroactive ready on clearing', () => {
  let s = fixture(['rust'], ['torch', 'scope', 'rice', 'rice', 'bomb']); s = draw(s); s = draw(s); assert.equal(card(s, 2).tapped, true); assert.equal(card(s, 3).tapped, false);
  s = draw(draw(s)); s = act(s, { type: 'pair', ids: [4, 5], target: 1 }); assert.equal(card(s, 2).tapped, true);
});
test('noise delays the complete sieve action once, never discards a bomb or increments reveals', () => {
  let s = fixture(['noise', 'sifter', 'rice'], ['fish', 'paper', 'bomb']); const originalBomb = s.draw.at(-1);
  s = act(s, { type: 'use', uid: 2, food: 3 }); assert.equal(s.known.length, 0); assert.equal(s.delayedPeeks.length, 1); assert.equal(s.draw.length, 3);
  s = draw(s); assert.equal(s.draw.length, 1); assert.equal(s.draw[0], originalBomb); assert.equal(s.flips, 4); assert.equal(s.delayedPeeks.length, 0); assert.equal(card(s, 5).zone, 'discard');
  s = fixture(['sifter', 'rice'], ['bomb', 'paper']); s = act(s, { type: 'use', uid: 1, food: 2 }); assert.equal(s.phase, 'play'); assert.equal(card(s, s.draw[0]).kind, 'bomb');
});
test('bomb beats delayed peeks, fermentation and every sequence trigger', () => {
  let s = fixture(['noise', 'torch', 'jar', 'paper'], ['bomb', 'rice']); card(s, 4).sealedBy = 3; card(s, 4).ferment = 1;
  s = act(s, { type: 'use', uid: 2 }); s = draw(s); assert.equal(s.reason, 'bomb'); assert.equal(s.delayedPeeks.length, 1); assert.equal(card(s, 4).ferment, 1); assert.equal(s.known.length, 0);
});
test('a cumulative surplus is retained; cashing out below the current target loses immediately', () => {
  let s = fixture(['rice', 'fish']); s.bank = 20; s.target = 30; s = act(s, { type: 'stop' }); assert.equal(s.phase, 'stakes'); assert.equal(s.bank, 40);
  s = fixture(['rice']); s.target = 30; s = act(s, { type: 'stop' }); assert.equal(s.reason, 'target'); assert.equal(s.phase, 'lost');
});
