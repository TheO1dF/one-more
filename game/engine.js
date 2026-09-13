import { BOONS, CARDS, PACKAGES, typeOf } from './cards.js';

export const SAVE_KEY = 'one-more.run.v2';
export const PREF_KEY = 'one-more.preferences.v2';
const requireRule = (condition, code) => { if (!condition) throw new Error(code); };
export const card = (s, uid) => s.cards.find(c => c.uid === uid);
export const onTable = s => s.table.map(uid => card(s, uid));
export const active = c => !c.sealedBy;
export const hasTrouble = (s, kind) => onTable(s).some(c => c.kind === kind && active(c));
export const foods = s => onTable(s).filter(c => typeOf(c) === 'food' && active(c) && !c.pair);
export const troubles = s => onTable(s).filter(c => typeOf(c) === 'trouble' && active(c));
export const tiredTools = (s, except = null) => onTable(s).filter(c => typeOf(c) === 'tool' && active(c) && c.tapped && c.uid !== except);
export const paidFoods = s => s.cards.filter(c => c.zone === 'discard' && c.paid && typeOf(c) === 'food');
export const hasFoodCost = c => ['scope', 'cloth', 'bell', 'sifter'].includes(c.kind);
export const needsFoodCost = (s, c) => hasFoodCost(c) && !c.freeCost && !(s.freePayments > 0);
export const knownCards = s => s.draw.map((uid, index) => ({ ...card(s, uid), index })).filter(c => s.known.includes(c.uid));
export function pairKind(a, b) {
  if (!a || !b || a.uid === b.uid || typeOf(a) !== 'food' || typeOf(b) !== 'food' || !active(a) || !active(b) || a.pairedOnce || b.pairedOnce || a.pair || b.pair) return null;
  if (a.kind === 'wild') return b.kind === 'wild' ? null : b.kind;
  return b.kind === 'wild' || a.kind === b.kind ? a.kind : null;
}
export const partners = (s, uid) => onTable(s).filter(c => pairKind(card(s, uid), c));
export function value(s, c) {
  return typeOf(c) !== 'food' || !active(c) || (!c.pair && hasTrouble(s, 'debt')) ? 0 : (s.unit || 10) * (c.pair ? 2 : 1);
}
export const score = s => onTable(s).reduce((n, c) => n + value(s, c), 0);
function random(s) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}
function log(s, key, data = {}) { s.log.push({ id: ++s.event, key, ...data }); s.log = s.log.slice(-45); }
function addCard(s, kind) { const c = { uid: ++s.uid, original: kind, kind, zone: 'deck' }; s.cards.push(c); return c; }
function resetCard(c) { Object.assign(c, { kind: c.original, zone: 'deck', tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: 0, triggers: 0, freeCost: false }); }
function startRound(s, carry = null) {
  s.cards = s.cards.filter(c => !c.temporary);
  s.cards.forEach(resetCard);
  s.table = []; s.discard = []; s.known = []; s.flips = 0; s.pending = null; s.lastPair = null; s.relicUsed = {}; s.roundEarned = 0; s.log = []; s.phase = 'play';
  s.lastReveal = null; s.revealedNames = []; s.delayedPeeks = []; s.freePayments = 0; s.boon = s.nextBoon || null; s.nextBoon = null;
  if (carry) { const c = card(s, carry); c.zone = 'table'; s.table.push(c.uid); }
  s.draw = shuffle(s, s.cards.filter(c => c.uid !== carry).map(c => c.uid));
  if (card(s, s.draw[0]).kind === 'bomb') {
    requireRule(s.draw.length > 1, 'carry');
    const j = 1 + Math.floor(random(s) * (s.draw.length - 1)); [s.draw[0], s.draw[j]] = [s.draw[j], s.draw[0]];
  }
  log(s, 'round', { n: s.round });
  if (s.boon === 'scout') peek(s, 3);
  if (s.boon === 'meal') s.freePayments = 2;
  if (s.boon === 'sauce') { const c = addCard(s, 'wild'); resetCard(c); c.temporary = true; c.zone = 'table'; s.table.push(c.uid); }
  if (s.boon) log(s, 'boon', { boon: s.boon });
}
export function newRun(seed = Date.now(), starter = 'variety') {
  const s = { version: 2, seed: seed >>> 0, rng: seed >>> 0, uid: 0, event: 0, pairId: 0, round: 1, maxRounds: 5, target: 30, unit: 10, bank: 0, cards: [], relics: ['shaker'], practice: false, starter, log: [], eventCount: 0, goalHistory: [{ round: 1, target: 30 }], dice: null };
  const kinds = starter === 'variety'
    ? ['rice', 'rice', 'fish', 'fish', 'mint', 'mint', 'wild', 'wild', 'tea', 'toast', 'torch', 'scope', 'cloth', 'jar', 'wish', 'relay', 'candle', 'timetable', 'paper', 'bomb']
    : starter === 'mixed'
    ? [...Array(4).fill('rice'), ...Array(4).fill('fish'), ...Array(4).fill('mint'), 'torch', 'torch', 'scope', 'cloth', 'jar', 'wild', 'paper', 'bomb']
    : [...Array(6).fill('rice'), ...Array(6).fill('fish'), ...Array(4).fill('mint'), 'torch', 'torch', 'cloth', 'bomb'];
  kinds.forEach(k => addCard(s, k)); startRound(s); return s;
}
export function practiceRun() {
  const s = newRun(8819, 'mixed'); s.practice = true; s.maxRounds = 1; s.target = 0; s.cards = []; s.uid = 0;
  ['mint', 'torch', 'jar', 'wrap', 'paper', 'fish', 'oil', 'rice', 'rice', 'scope', 'sorter', 'fog', 'fish', 'bomb', 'cloth', 'mint', 'wild', 'bell', 'wish', 'debt'].forEach(k => addCard(s, k));
  startRound(s); s.table = [1, 2, 3, 4]; s.draw = s.cards.filter(c => !s.table.includes(c.uid)).map(c => c.uid);
  s.table.forEach((uid, i) => { const c = card(s, uid); c.zone = 'table'; c.entered = i + 1; });
  card(s, 2).tapped = true; card(s, 3).tapped = true; card(s, 4).sealedBy = 3; card(s, 4).ferment = 1;
  s.flips = 4; s.log = []; log(s, 'practice'); return s;
}
export function dicePractice() {
  const s = newRun(9317); s.practice = true; s.bank = 40; s.roundEarned = 40; s.phase = 'stakes'; s.dice = { rolls: [], result: null }; return s;
}
function syncWraps(s) {
  for (const c of onTable(s)) {
    if (!c.sealedBy || c.ferment !== null) continue;
    const source = card(s, c.sealedBy);
    if (!source || source.zone !== 'table' || source.kind !== 'wrap' || !active(source)) c.sealedBy = null;
  }
}
function discard(s, c, paid = false) {
  requireRule(c?.zone === 'table', 'target');
  c.zone = 'discard'; c.paid = paid; s.table = s.table.filter(uid => uid !== c.uid); s.discard.push(c.uid); syncWraps(s);
}
function clear(s, uid) {
  const c = card(s, uid); requireRule(c?.zone === 'table' && typeOf(c) === 'trouble' && active(c), 'target');
  discard(s, c); log(s, 'clear', { kind: c.kind });
}
function peek(s, n, { delayed = false, sift = false } = {}) {
  if (!delayed && hasTrouble(s, 'noise')) { s.delayedPeeks.push({ n, sift }); log(s, 'delayedPeek', { n }); return; }
  const count = hasTrouble(s, 'fog') ? Math.min(1, n) : n;
  const seen = s.draw.slice(0, count); s.known = [...new Set([...s.known, ...seen])]; log(s, 'peek', { n: seen.length });
  if (sift && seen.length) {
    const c = card(s, seen[0]);
    if (typeOf(c) === 'trouble') { s.draw.shift(); s.known = s.known.filter(uid => uid !== c.uid); c.zone = 'discard'; s.discard.push(c.uid); log(s, 'sift', { kind: c.kind }); }
  }
}
function pay(s, uid) {
  const c = foods(s).find(c => c.uid === uid); requireRule(c, 'foodCost'); discard(s, c, true); log(s, 'pay', { kind: c.kind });
}
function pairEffect(s, kind, target, except = null) {
  if (kind === 'fish') { peek(s, 1); return true; }
  if (kind === 'tea') { peek(s, 2); return true; }
  if (kind === 'ginger') { if (target != null) clear(s, target); peek(s, 1); return true; }
  if (kind === 'toast' && target != null) { reclaim(s, target); return true; }
  if (kind === 'rice' && target != null) { clear(s, target); return true; }
  if (kind === 'mint' && target != null) {
    const c = tiredTools(s, except).find(c => c.uid === target); requireRule(c, 'target'); c.tapped = false; log(s, 'ready', { kind: c.kind }); return true;
  }
  return false;
}
export function toolProblem(s, c) {
  if (!c || c.zone !== 'table' || !active(c)) return 'sealed';
  if (hasTrouble(s, 'oil')) return 'oil';
  if (c.tapped) return 'tapped';
  if (needsFoodCost(s, c) && !foods(s).length) return 'foodCost';
  if (['cloth', 'jar'].includes(c.kind) && !troubles(s).length) return 'noTrouble';
  if (c.kind === 'sorter' && hasTrouble(s, 'fog')) return 'fog';
  if (c.kind === 'sorter' && knownCards(s).filter(c => c.kind !== 'bomb').length < 2) return 'needKnown';
  if (c.kind === 'bell' && !s.lastPair) return 'noEcho';
  if (c.kind === 'bell' && s.lastPair === 'rice' && !troubles(s).length) return 'noTrouble';
  if (c.kind === 'bell' && s.lastPair === 'mint' && !tiredTools(s, c.uid).length) return 'noTired';
  if (c.kind === 'bell' && s.lastPair === 'toast' && !paidFoods(s).length) return 'noPaid';
  return null;
}
function reclaim(s, uid) {
  const c = paidFoods(s).find(c => c.uid === uid); requireRule(c, 'target'); c.zone = 'table'; c.paid = false; c.entered = ++s.eventCount; s.discard = s.discard.filter(id => id !== uid); s.table.push(uid); log(s, 'recover', { kind: c.kind });
}
function advance(s, c) {
  if (!c || c.zone !== 'table' || !(c.ferment > 0)) return false;
  c.ferment--;
  if (!c.ferment) { c.kind = 'wild'; c.sealedBy = null; c.ferment = null; log(s, 'ferment', { source: c.uid }); }
  return true;
}
function reveal(s) {
  requireRule(s.draw.length, 'empty'); const uid = s.draw.shift(); const c = card(s, uid);
  s.known = s.known.filter(id => id !== uid); s.flips++;
  if (c.kind === 'bomb') { c.zone = 'table'; s.table.push(uid); s.phase = 'lost'; s.reason = 'bomb'; log(s, 'bomb'); return; }
  const existing = [...onTable(s)], previous = s.lastReveal, delayed = s.delayedPeeks.splice(0), queue = [];
  const freshFood = typeOf(c) === 'food' && !s.revealedNames.includes(c.kind);
  c.zone = 'table'; c.entered = ++s.eventCount; s.table.push(uid); log(s, 'reveal', { kind: c.kind, source: c.uid });
  for (const source of existing) {
    if (source.ferment > 0) queue.push({ type: 'ferment', uid: source.uid });
    if (!active(source)) continue;
    if (source.kind === 'wrap' && !source.caught && typeOf(c) === 'food') queue.push({ type: 'wrap', uid: source.uid });
    if (source.kind === 'wish' && source.wish === c.kind) { source.wish = null; queue.push({ type: 'wish', uid: source.uid }); }
    if (source.kind === 'rust' && !source.triggers && typeOf(c) === 'tool') { source.triggers = 1; queue.push({ type: 'rust', uid: source.uid }); }
    if (source.kind === 'stove' && source.triggers < 2 && freshFood && existing.some(x => x.ferment > 0)) queue.push({ type: 'stove', uid: source.uid });
    if (source.kind === 'relay' && source.triggers < 2 && previous?.type === 'food' && hasFoodCost(c)) { source.triggers++; queue.push({ type: 'relay', uid: source.uid }); }
    if (source.kind === 'candle' && !source.triggers && previous?.type === 'trouble' && typeOf(c) === 'trouble') { source.triggers = 1; queue.push({ type: 'candle', uid: source.uid }); }
  }
  s.lastReveal = { uid, kind: c.kind, type: typeOf(c), number: s.flips };
  if (freshFood) s.revealedNames.push(c.kind);
  for (const pending of delayed) peek(s, pending.n, { delayed: true, sift: pending.sift });
  for (const event of queue) {
    const source = card(s, event.uid);
    if (event.type === 'ferment') advance(s, source);
    if (event.type === 'wrap' && active(c) && source.zone === 'table' && active(source)) { source.caught = c.uid; c.sealedBy = source.uid; log(s, 'caught', { kind: c.kind, source: source.uid }); }
    if (event.type === 'wish') { peek(s, 3); log(s, 'wishHit', { kind: c.kind, source: source.uid }); }
    if (event.type === 'rust') { c.tapped = true; log(s, 'rusted', { kind: c.kind, source: source.uid }); }
    if (event.type === 'relay') { c.freeCost = true; log(s, 'relay', { kind: c.kind, source: source.uid }); }
    if (event.type === 'candle') { peek(s, 1); log(s, 'candle', { source: source.uid }); }
    if (event.type === 'stove' && advance(s, onTable(s).find(x => x.ferment > 0))) { source.triggers++; log(s, 'stove', { source: source.uid }); }
  }
  if (active(c)) {
    if (c.kind === 'wish') s.pending = 'wish';
    if (c.kind === 'tea' && previous?.type === 'food') { peek(s, 1); log(s, 'tea', { source: c.uid }); }
    if (c.kind === 'toast' && previous?.type === 'tool') {
      const tool = card(s, previous.uid);
      if (tool?.zone === 'table' && active(tool) && tool.tapped) { tool.tapped = false; log(s, 'ready', { kind: tool.kind, source: c.uid }); }
    }
    if (c.kind === 'timetable') { peek(s, [3, 6].includes(s.flips) ? 3 : 1); log(s, 'timetable', { n: s.flips, source: c.uid }); }
  }
  syncWraps(s);
}
function stop(s, carryUid) {
  requireRule(s.flips > 0, 'first');
  let carry = null;
  if (carryUid != null) {
    requireRule(s.relics.includes('lunchbox') && s.round < s.maxRounds, 'relic'); carry = foods(s).find(c => c.uid === carryUid && !c.temporary); requireRule(carry && s.cards.some(c => c.uid !== carryUid && c.original !== 'bomb' && !c.temporary), 'target');
  }
  s.roundEarned = score(s) - (carry ? value(s, carry) : 0); s.bank += s.roundEarned; s.carry = carry?.uid ?? null;
  log(s, 'cash', { n: s.roundEarned });
  if (s.bank < s.target) { s.phase = 'lost'; s.reason = 'target'; return; }
  if (s.round >= s.maxRounds) { s.phase = s.bank >= s.target ? 'won' : 'lost'; s.reason = s.bank >= s.target ? 'complete' : 'target'; return; }
  s.phase = 'stakes'; s.dice = { rolls: [], result: null };
}
function openDraft(s) {
  const temporary = s.cards.filter(c => c.temporary).map(c => c.uid);
  s.cards = s.cards.filter(c => !c.temporary);
  for (const zone of ['table', 'draw', 'discard', 'known']) s[zone] = s[zone].filter(uid => !temporary.includes(uid));
  s.phase = 'draft'; s.added = false; s.removed = false;
  s.offers = shuffle(s, PACKAGES.map(p => p.id)).slice(0, 3);
  s.relicOffer = s.round === 2 ? ['lunchbox', 'recycler', 'splitter'] : [];
  s.relicPicked = false;
}
export function act(previous, action) {
  const s = structuredClone(previous); const a = action;
  if (s.phase === 'stakes') {
    if (a.type === 'roll') {
      requireRule(s.dice.rolls.length < 2, 'rollLimit');
      const tens = 1 + Math.floor(random(s) * 6), ones = 1 + Math.floor(random(s) * 6), total = tens * 10 + ones;
      s.dice.result = { tens, ones, total, tier: total <= 23 ? 'low' : total >= 51 ? 'high' : 'steady' }; s.dice.rolls.push({ ...s.dice.result });
    } else if (a.type === 'acceptDice') {
      const d = s.dice.result; requireRule(d, 'rollFirst');
      if (d.tier === 'high') requireRule(BOONS[a.boon], 'chooseBoon');
      s.target += d.total; s.goalHistory.push({ round: s.round + 1, target: s.target, dice: { ...d } });
      if (d.tier === 'low') addCard(s, 'paper');
      s.nextBoon = d.tier === 'high' ? a.boon : null;
      openDraft(s);
    } else requireRule(false, 'phase');
    return s;
  }
  if (s.phase === 'draft') {
    if (a.type === 'add') {
      requireRule(!s.added && s.offers.includes(a.id), 'draft'); const p = PACKAGES.find(p => p.id === a.id); p.cards.forEach(k => addCard(s, k)); s.added = true;
    } else if (a.type === 'remove') {
      const c = card(s, a.uid); requireRule(!s.removed && c && c.original !== 'bomb' && !c.temporary && s.cards.length > 2, 'remove'); s.cards = s.cards.filter(x => x.uid !== c.uid); s.table = s.table.filter(uid => uid !== c.uid); s.draw = s.draw.filter(uid => uid !== c.uid); s.discard = s.discard.filter(uid => uid !== c.uid); s.known = s.known.filter(uid => uid !== c.uid); if (s.carry === c.uid) s.carry = null; s.removed = true;
    } else if (a.type === 'chooseRelic') {
      requireRule(!s.relicPicked && s.relicOffer.includes(a.id), 'relic'); s.relics.push(a.id); s.relicPicked = true;
    } else if (a.type === 'next') {
      requireRule(!s.relicOffer.length || s.relicPicked, 'chooseRelic'); s.round++; startRound(s, s.carry); s.carry = null;
    } else requireRule(false, 'phase');
    return s;
  }
  requireRule(s.phase === 'play', 'phase');
  if (s.pending) {
    requireRule(a.type === 'wish' && s.cards.some(c => c.original === a.kind && typeOf({kind:a.kind}) === 'food') && a.kind !== 'wild', 'wish');
    const c = onTable(s).findLast(c => c.kind === 'wish'); c.wish = a.kind; s.pending = null; log(s, 'wish', { kind: a.kind }); return s;
  }
  if (a.type === 'draw') reveal(s);
  else if (a.type === 'stop') stop(s, a.carry);
  else if (a.type === 'pair') {
    const first = card(s, a.ids?.[0]), second = card(s, a.ids?.[1]);
    requireRule(first?.zone === 'table' && second?.zone === 'table', 'target');
    const kind = pairKind(first, second); requireRule(kind, 'pair');
    first.pair = second.pair = ++s.pairId; first.pairedOnce = second.pairedOnce = true;
    log(s, 'pair', { kind }); if (pairEffect(s, kind, a.target)) s.lastPair = kind;
  } else if (a.type === 'use') {
    const c = card(s, a.uid); requireRule(c && typeOf(c) === 'tool', 'target'); const problem = toolProblem(s, c); requireRule(!problem, problem);
    if (hasFoodCost(c)) {
      if (c.freeCost) { c.freeCost = false; log(s, 'freeUse'); }
      else if (s.freePayments > 0) { s.freePayments--; log(s, 'freeUse'); }
      else pay(s, a.food);
    }
    c.tapped = true; log(s, 'use', { kind: c.kind });
    if (c.kind === 'torch') peek(s, 1);
    if (c.kind === 'scope') peek(s, 3);
    if (c.kind === 'sifter') peek(s, 1, { sift: true });
    if (c.kind === 'cloth') clear(s, a.target);
    if (c.kind === 'jar') {
      const t = troubles(s).find(t => t.uid === a.target); requireRule(t, 'target'); t.sealedBy = c.uid; t.ferment = 2; syncWraps(s); log(s, 'seal', { kind: t.kind });
    }
    if (c.kind === 'sorter') {
      const ids = a.ids; requireRule(ids?.length === 2 && ids[0] !== ids[1] && ids.every(uid => s.known.includes(uid) && s.draw.includes(uid) && card(s, uid).kind !== 'bomb'), 'target');
      const [i, j] = ids.map(uid => s.draw.indexOf(uid)); [s.draw[i], s.draw[j]] = [s.draw[j], s.draw[i]]; log(s, 'swap');
    }
    if (c.kind === 'bell') requireRule(pairEffect(s, s.lastPair, a.target, c.uid), 'target');
  } else if (a.type === 'wipeOil') {
    const c = troubles(s).find(c => c.uid === a.uid && c.kind === 'oil'); requireRule(c, 'target');
    const f = foods(s).find(c => c.uid === a.food); requireRule(f, 'foodCost'); discard(s, f); clear(s, c.uid);
  } else if (a.type === 'relic') {
    requireRule(s.relics.includes(a.id) && !s.relicUsed[a.id], 'relic');
    if (a.id === 'shaker') { requireRule(s.flips > 0, 'first'); shuffle(s, s.draw); s.known = []; log(s, 'shuffle'); }
    else if (a.id === 'recycler') {
      reclaim(s, a.uid);
    } else if (a.id === 'splitter') {
      const c = card(s, a.uid); requireRule(c?.zone === 'table' && c.pair, 'target'); const pair = c.pair; onTable(s).filter(c => c.pair === pair).forEach(c => c.pair = null); log(s, 'split');
    } else requireRule(false, 'relic');
    s.relicUsed[a.id] = true;
  } else requireRule(false, 'action');
  return s;
}
export function restore(text) {
  try {
    const s = JSON.parse(text); if (s?.version !== 2 || !['play', 'stakes', 'draft', 'won', 'lost'].includes(s.phase) || !Array.isArray(s.cards) || s.cards.length < 2 || !s.cards.every(c => CARDS[c.kind] && CARDS[c.original]) || s.cards.filter(c => c.original === 'bomb').length !== 1) return null;
    if (new Set(s.cards.map(c => c.uid)).size !== s.cards.length) return null;
    if (![s.draw, s.table, s.discard, s.known, s.log, s.relics].every(Array.isArray) || ![s.round, s.bank, s.rng, s.uid].every(Number.isFinite)) return null;
    if ([...s.draw, ...s.table, ...s.discard].some(uid => !card(s, uid))) return null;
    if (!Array.isArray(s.delayedPeeks) || !Array.isArray(s.revealedNames) || !Array.isArray(s.goalHistory)) return null;
    if (s.phase === 'stakes' && (!s.dice || !Array.isArray(s.dice.rolls) || s.dice.rolls.length > 2)) return null;
    return s;
  } catch { return null; }
}
