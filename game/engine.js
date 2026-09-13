import { BOONS, CARDS, PACKAGES, typeOf } from './cards.js';
import { ENCHANTMENTS, ROUTES } from './routes.js';

export const SAVE_KEY = 'one-more.run.v4';
export const INITIAL_TARGET = 8;
export const MAX_ROUNDS = 10;
export const PREF_KEY = 'one-more.preferences.v2';
const requireRule = (condition, code) => { if (!condition) throw new Error(code); };
export const card = (s, uid) => s.cards.find(c => c.uid === uid);
export const onTable = s => s.table.map(uid => card(s, uid));
export const active = c => !c.sealedBy;
export const hasTrouble = (s, kind) => onTable(s).some(c => c.kind === kind && active(c));
export const foods = s => onTable(s).filter(c => typeOf(c) === 'food' && active(c) && !c.pair);
export const payableFoods = s => onTable(s).filter(c => typeOf(c) === 'food' && active(c) && (!c.pair || hasTrouble(s, 'timetable')));
export const transformableFoods = s => foods(s).filter(c => c.kind !== 'wild');
export const troubles = s => onTable(s).filter(c => typeOf(c) === 'trouble' && active(c));
export const tiredTools = (s, except = null) => onTable(s).filter(c => typeOf(c) === 'tool' && active(c) && c.tapped && c.uid !== except);
export const paidFoods = s => s.cards.filter(c => c.zone === 'discard' && c.paid && typeOf(c) === 'food');
export const hasFoodCost = c => ['scope', 'bell'].includes(c.kind);
export const needsFoodCost = (s, c) => hasFoodCost(c) && !c.freeCost && !(s.freePayments > 0);
export const knownCards = s => s.draw.map((uid, index) => ({ ...card(s, uid), index })).filter(c => s.known.includes(c.uid));
export function pairKind(a, b) {
  if (!a || !b || a.uid === b.uid || typeOf(a) !== 'food' || typeOf(b) !== 'food' || !active(a) || !active(b) || a.pairedOnce || b.pairedOnce || a.pair || b.pair) return null;
  if (CARDS[a.kind].noPair || CARDS[b.kind].noPair) return null;
  if (a.kind === 'wild') return b.kind === 'wild' ? null : b.kind;
  return b.kind === 'wild' || a.kind === b.kind ? a.kind : null;
}
export const partners = (s, uid) => onTable(s).filter(c => pairKind(card(s, uid), c) && !(hasTrouble(s, 'wrap') && [c.kind, card(s, uid)?.kind].includes('wild')));
export function value(s, c) {
  if (!active(c)) return 0;
  if (c.kind === 'fridge') return onTable(s).filter(x => active(x) && x.kind === 'fish').length;
  if (c.kind === 'residue') return hasTrouble(s, 'composter') ? 2 : -1;
  if (typeOf(c) !== 'food' || (!c.pair && hasTrouble(s, 'debt'))) return 0;
  if (c.kind === 'cola') return onTable(s).find(x => active(x) && x.kind === 'cola')?.uid === c.uid ? 1 : 4;
  return (CARDS[c.kind].baseScore ?? (s.unit || 2)) * (c.pair || c.enchantment === 'raw' ? 2 : 1);
}
export const score = s => onTable(s).reduce((n, c) => n + value(s, c), 0);
export const cashValue = (s, carry = null) => score(carry == null ? s : { ...s, table: s.table.filter(uid => uid !== carry) });
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
function resetCard(c) { Object.assign(c, { kind: c.original, zone: 'deck', tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: 0, triggers: 0, freeCost: false, multiplier: 1, boiledUsed: false, consumed: false }); }
function temporary(s, kind) {
  const c = addCard(s, kind); resetCard(c); Object.assign(c, { temporary: true, zone: 'table', entered: ++s.eventCount }); s.table.push(c.uid); return c;
}
function startRound(s, carry = null) {
  s.cards = s.cards.filter(c => !c.temporary);
  s.cards.forEach(resetCard);
  s.table = []; s.discard = []; s.known = []; s.flips = 0; s.pending = null; s.lastPair = null; s.relicUsed = {}; s.roundEarned = 0; s.log = []; s.phase = 'play';
  s.nextEffects = []; s.lastReveal = null; s.revealedNames = []; s.delayedPeeks = []; s.freePayments = 0; s.boon = s.nextBoon || null; s.nextBoon = null;
  if (carry) { const c = card(s, carry); c.zone = 'table'; s.table.push(c.uid); }
  s.draw = shuffle(s, s.cards.filter(c => c.uid !== carry).map(c => c.uid));
  if (card(s, s.draw[0]).kind === 'bomb') {
    requireRule(s.draw.length > 1, 'carry');
    const j = 1 + Math.floor(random(s) * (s.draw.length - 1)); [s.draw[0], s.draw[j]] = [s.draw[j], s.draw[0]];
  }
  log(s, 'round', { n: s.round });
  if (s.boon === 'scout') peek(s, 1);
  if (s.boon === 'meal') s.freePayments = 1;
  if (s.boon === 'sauce') temporary(s, 'wild');
  if (s.boon === 'feast') {
    const pair = ++s.pairId;
    for (let n = 0; n < 2; n++) Object.assign(temporary(s, 'rice'), { pair, pairedOnce: true });
    temporary(s, 'fish'); temporary(s, 'mint');
  }
  if (s.boon) log(s, 'boon', { boon: s.boon });
  const reward = s.nextRouteReward; s.nextRouteReward = null;
  if (reward === 'lantern') peek(s, 3);
  if (reward === 'tea') s.freePayments += 2;
  if (reward === 'helper') { const c = addCard(s, 'torch'); resetCard(c); Object.assign(c, { temporary: true, zone: 'table' }); s.table.push(c.uid); }
  if (reward) log(s, 'routeReward', { route: reward });
}
export function newRun(seed = Date.now(), starter = 'variety') {
  const s = { version: 4, seed: seed >>> 0, rng: seed >>> 0, uid: 0, event: 0, pairId: 0, round: 1, maxRounds: MAX_ROUNDS, target: INITIAL_TARGET, unit: 2, bank: 0, cards: [], relics: ['shaker'], practice: false, starter, log: [], eventCount: 0, goalHistory: [{ round: 1, target: INITIAL_TARGET }], dice: null };
  const kinds = starter === 'variety'
    ? ['rice','rice','rice','fish','fish','fish','mint','mint','tea','tea','toast','toast','wild','wild','torch','torch','scope','bell','candle','bomb']
    : starter === 'mixed'
    ? [...Array(4).fill('rice'), ...Array(4).fill('fish'), ...Array(4).fill('mint'), 'torch', 'torch', 'scope', 'cloth', 'jar', 'wild', 'paper', 'bomb']
    : [...Array(6).fill('rice'), ...Array(6).fill('fish'), ...Array(4).fill('mint'), 'torch', 'torch', 'cloth', 'bomb'];
  kinds.forEach(k => addCard(s, k)); startRound(s); return s;
}
export function practiceRun() {
  const s = newRun(8819, 'mixed'); s.practice = true; s.maxRounds = 1; s.target = 0; s.cards = []; s.uid = 0;
  ['mint', 'torch', 'stove', 'rice', 'paper', 'fish', 'oil', 'rice', 'rice', 'scope', 'sorter', 'fog', 'fish', 'bomb', 'cloth', 'mint', 'wild', 'bell', 'wish', 'debt'].forEach(k => addCard(s, k));
  startRound(s); s.table = [1, 2, 3, 4]; s.draw = s.cards.filter(c => !s.table.includes(c.uid)).map(c => c.uid);
  s.table.forEach((uid, i) => { const c = card(s, uid); c.zone = 'table'; c.entered = i + 1; });
  card(s, 2).tapped = true;
  s.flips = 4; s.log = []; log(s, 'practice'); return s;
}
export function dicePractice() {
  const s = newRun(9317); s.practice = true; s.bank = INITIAL_TARGET; s.roundEarned = INITIAL_TARGET; s.phase = 'stakes'; s.dice = { rolls: [], result: null }; return s;
}
export function kitchenPractice() {
  const s = newRun(4309); Object.assign(s, { practice: true, maxRounds: 1, target: 0, bank: 8, cards: [], uid: 0 });
  ['cola','cola','fridge','fish','fish','juicer','composter','dishwasher','mold','popcorn','popcorn','mint','torch','rice','bomb'].forEach(k => addCard(s, k));
  startRound(s); s.table = s.cards.slice(0, 11).map(c => c.uid); s.draw = s.cards.slice(11).map(c => c.uid);
  s.table.forEach((uid, i) => Object.assign(card(s, uid), { zone: 'table', entered: i + 1 }));
  s.flips = 11; s.eventCount = 11; s.log = []; log(s, 'practice'); return s;
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
function consume(s, c, paid = false) {
  requireRule(c?.zone === 'table' && typeOf(c) === 'food' && active(c), 'target');
  discard(s, c, paid); c.consumed = true;
  temporary(s, 'residue'); log(s, 'consume', { kind: c.kind });
  const n = onTable(s).filter(x => active(x) && x.kind === 'dishwasher').length;
  if (n) { s.freePayments += n; log(s, 'tickets', { n }); }
}
function clear(s, uid) {
  const c = card(s, uid); requireRule(c?.zone === 'table' && typeOf(c) === 'trouble' && active(c), 'target');
  discard(s, c); log(s, 'clear', { kind: c.kind });
}
function peek(s, n) {
  if (hasTrouble(s, 'noise')) { log(s, 'blockedPeek'); return; }
  const count = hasTrouble(s, 'fog') ? Math.min(1, n) : n;
  const seen = s.draw.slice(0, count); s.known = [...new Set([...s.known, ...seen])]; log(s, 'peek', { n: seen.length });
}
function pay(s, uid) {
  const c = payableFoods(s).find(c => c.uid === uid); requireRule(c, 'foodCost');
  if (c.enchantment === 'boiled' && !c.boiledUsed) { c.boiledUsed = true; log(s, 'boiled', { kind: c.kind }); return; }
  if (c.pair) { const pair = c.pair; onTable(s).filter(x => x.pair === pair).forEach(x => x.pair = null); }
  consume(s, c, true); log(s, 'pay', { kind: c.kind });
}
function pairEffect(s, kind, target, except = null) {
  if (kind === 'popcorn') { temporary(s, 'popcorn'); log(s, 'generate', { kind: 'popcorn' }); return true; }
  if (kind === 'fish') { peek(s, 1); return true; }
  if (kind === 'tea') { s.freePayments += 2; log(s, 'tickets', { n: 2 }); return true; }
  if (kind === 'ginger') { s.relicUsed = {}; log(s, 'relicReady'); return true; }
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
  if (CARDS[c.kind].bankCost > s.bank) return 'pointsCost';
  if (needsFoodCost(s, c) && !payableFoods(s).length) return 'foodCost';
  if (['cloth', 'jar'].includes(c.kind) && !troubles(s).length) return 'noTrouble';
  if (c.kind === 'bell' && !tiredTools(s,c.uid).length) return 'noTired';
  if (c.kind === 'stove' && !transformableFoods(s).length) return 'noFood';
  if (['mold', 'juicer'].includes(c.kind) && !foods(s).length) return 'foodCost';
  if (c.kind === 'sifter' && !s.draw.length) return 'empty';
  if (c.kind === 'sifter' && hasTrouble(s,'noise') && !s.known.includes(s.draw[0])) return 'noPeek';
  return null;
}
function reclaim(s, uid) {
  const c = paidFoods(s).find(c => c.uid === uid); requireRule(c, 'target'); c.zone = 'table'; c.paid = false; c.entered = ++s.eventCount; s.discard = s.discard.filter(id => id !== uid); s.table.push(uid); log(s, 'recover', { kind: c.kind });
}
function reveal(s) {
  requireRule(s.draw.length, 'empty'); const uid=s.draw.shift(), c=card(s,uid);
  s.known=s.known.filter(id=>id!==uid); s.flips++;
  if(c.kind==='bomb'){c.zone='table';s.table.push(uid);s.phase='lost';s.reason='bomb';log(s,'bomb');return;}
  const kind=c.kind, type=typeOf(c);
  c.zone='table';c.entered=++s.eventCount;s.table.push(uid);log(s,'reveal',{kind,source:uid});
  s.lastReveal={uid,kind,type,number:s.flips};
  if (type === 'tool' && hasTrouble(s,'rust')) { c.tapped = true; log(s,'rusted',{kind}); }
  if (kind === 'wish') { const token=addCard(s,'wild');resetCard(token);Object.assign(token,{temporary:true,zone:'table',entered:++s.eventCount});s.table.push(token.uid);log(s,'gift'); }
}
function stop(s, carryUid) {
  requireRule(s.flips > 0, 'first');
  let carry = null;
  if (carryUid != null) {
    requireRule(s.relics.includes('lunchbox') && s.round < s.maxRounds, 'relic'); carry = foods(s).find(c => c.uid === carryUid && !c.temporary); requireRule(carry && s.cards.some(c => c.uid !== carryUid && c.original !== 'bomb' && !c.temporary), 'target');
  }
  s.roundEarned = cashValue(s, carry?.uid); s.bank += s.roundEarned; s.carry = carry?.uid ?? null;
  log(s, 'cash', { n: s.roundEarned });
  if (s.bank < s.target) { s.phase = 'lost'; s.reason = 'target'; return; }
  if (s.round >= s.maxRounds) { s.phase = s.bank >= s.target ? 'won' : 'lost'; s.reason = s.bank >= s.target ? 'complete' : 'target'; return; }
  s.phase = 'stakes'; s.dice = { rolls: [], result: null };
}
export function routeTargets(s, id) {
  const route = ROUTES[id];
  return s.cards.filter(c => !c.temporary && (route?.type === 'enchant'
    ? CARDS[c.original].type === 'food' && !CARDS[c.original].noPair && !c.enchantment
    : route?.type === 'remove' && c.original !== 'bomb'));
}
function openRoute(s) {
  s.phase = 'route';
  const enchants = Object.keys(ENCHANTMENTS).filter(id => routeTargets(s, id).length);
  const events = ['lantern', 'tea', 'helper'];
  const first = enchants.length ? shuffle(s, enchants)[0] : shuffle(s, events)[0];
  const canPrune = [2, 5, 8].includes(s.round) && s.bank >= ROUTES.prune.cost && routeTargets(s, 'prune').length;
  const second = canPrune ? 'prune' : shuffle(s, events.filter(id => id !== first))[0];
  s.routeOffers = [first, second];
}
function chooseRoute(s, a) {
  requireRule(s.routeOffers?.includes(a.id), 'route');
  const route = ROUTES[a.id];
  if (route.type !== 'event') {
    const target = routeTargets(s, a.id).find(c => c.uid === a.uid); requireRule(target, 'target');
    if (route.type === 'enchant') target.enchantment = a.id;
    else {
      requireRule(s.bank >= route.cost, 'routeCost'); s.bank -= route.cost;
      s.cards = s.cards.filter(c => c.uid !== target.uid);
      for (const zone of ['table', 'draw', 'discard', 'known']) s[zone] = s[zone].filter(uid => uid !== target.uid);
      if (s.carry === target.uid) s.carry = null;
    }
  } else s.nextRouteReward = a.id;
  (s.routeHistory ??= []).push({ round: s.round, id: a.id, uid: a.uid ?? null });
  openDraft(s);
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
      requireRule(s.dice.rolls.length < 2 && !s.dice.result?.locked, 'rollLimit');
      const total = 1 + Math.floor(random(s) * 20);
      s.dice.result = { total, tier: total === 1 ? 'criticalLow' : total === 20 ? 'criticalHigh' : total <= 5 ? 'low' : total >= 15 ? 'high' : 'steady', locked: total === 1 || total === 20 }; s.dice.rolls.push({ ...s.dice.result });
    } else if (a.type === 'acceptDice') {
      const d = s.dice.result; requireRule(d, 'rollFirst');
      if (d.tier === 'high') requireRule(['scout','sauce','meal'].includes(a.boon), 'chooseBoon');
      s.target += d.total; s.goalHistory.push({ round: s.round + 1, target: s.target, dice: { ...d } });
      if (d.tier === 'low') addCard(s, 'paper');
      if (d.tier === 'criticalLow') ['debt','rust','paper'].forEach(k=>addCard(s,k));
      s.nextBoon = d.tier === 'criticalHigh' ? 'feast' : d.tier === 'high' ? a.boon : null;
      openRoute(s);
    } else requireRule(false, 'phase');
    return s;
  }
  if (s.phase === 'route') { requireRule(a.type === 'chooseRoute', 'phase'); chooseRoute(s, a); return s; }
  if (s.phase === 'draft') {
    if (a.type === 'add') {
      requireRule(!s.added && s.offers.includes(a.id), 'draft'); const p = PACKAGES.find(p => p.id === a.id); p.cards.forEach(k => addCard(s, k)); s.added = true;
    } else if (a.type === 'chooseRelic') {
      requireRule(!s.relicPicked && s.relicOffer.includes(a.id), 'relic'); s.relics.push(a.id); s.relicPicked = true;
    } else if (a.type === 'next') {
      requireRule(s.added, 'choosePackage');
      requireRule(!s.relicOffer.length || s.relicPicked, 'chooseRelic'); s.round++; startRound(s, s.carry); s.carry = null;
    } else requireRule(false, 'phase');
    return s;
  }
  requireRule(s.phase === 'play', 'phase');
  if(s.pending){
    if (s.pending.type === 'discover') {
      requireRule(a.type === 'discover' && s.pending.offers.includes(a.kind), 'pending');
      const c = addCard(s, a.kind); resetCard(c); Object.assign(c, { temporary: true, zone: 'table', entered: ++s.eventCount });
      s.table.push(c.uid); s.pending = null; log(s, 'discover', { kind: c.kind }); return s;
    }
    requireRule(s.pending.type==='sift' && a.type==='resolveSift' && typeof a.discard==='boolean','pending');
    const uid=s.pending.uid,t=card(s,uid);requireRule(s.draw[0]===uid && s.known.includes(uid),'target');
    if(a.discard){requireRule(t.kind!=='bomb','bomb');s.draw.shift();s.known=s.known.filter(id=>id!==uid);t.zone='discard';s.discard.push(uid);log(s,'sift',{kind:t.kind});}
    s.pending=null;return s;
  }
  if (a.type === 'draw') reveal(s);
  else if (a.type === 'stop') stop(s, a.carry);
  else if (a.type === 'pair') {
    const first = card(s, a.ids?.[0]), second = card(s, a.ids?.[1]);
    requireRule(first?.zone === 'table' && second?.zone === 'table', 'target');
    const kind = pairKind(first, second); requireRule(kind && partners(s,first.uid).some(c=>c.uid===second.uid), 'pair');
    const listeners = onTable(s).filter(c=>active(c)&&['candle','relay'].includes(c.kind)).map(c=>({uid:c.uid,kind:c.kind}));
    first.pair = second.pair = ++s.pairId; first.pairedOnce = second.pairedOnce = true;
    log(s, 'pair', { kind }); if (pairEffect(s, kind, a.target)) s.lastPair = kind;
    const fried = [first, second].filter(c => c.enchantment === 'fried').length;
    if (fried) { s.freePayments += fried; log(s, 'tickets', { n: fried }); }
    for (const source of listeners) { if(source.kind==='candle') peek(s,2); else {s.freePayments++;log(s,'tickets',{n:1});} }
  } else if (a.type === 'use') {
    const c = card(s, a.uid); requireRule(c && typeOf(c) === 'tool', 'target'); const problem = toolProblem(s, c); requireRule(!problem, problem);
    if (CARDS[c.kind].bankCost) { s.bank -= CARDS[c.kind].bankCost; log(s, 'spendPoints', { n: CARDS[c.kind].bankCost }); }
    if (hasFoodCost(c)) {
      if (c.freeCost) { c.freeCost = false; log(s, 'freeUse'); }
      else if (s.freePayments > 0) { s.freePayments--; log(s, 'freeUse'); }
      else pay(s, a.food);
    }
    c.tapped = true; log(s, 'use', { kind: c.kind });
    if(c.kind==='bell') {const t=tiredTools(s,c.uid).find(x=>x.uid===a.target);requireRule(t,'target');t.tapped=false;log(s,'ready',{kind:t.kind});}
    if (c.kind === 'torch') peek(s, 1);
    if (c.kind === 'scope') peek(s, 3);
    if (c.kind === 'sifter') { peek(s,1);s.pending={type:'sift',source:c.uid,uid:s.draw[0]}; }
    if (c.kind === 'cloth') clear(s, a.target);
    if (c.kind === 'jar') {
      const t = troubles(s).find(t => t.uid === a.target); requireRule(t, 'target'); t.kind='wild'; log(s,'ferment');
    }
    if (c.kind === 'stove') { const t=transformableFoods(s).find(t=>t.uid===a.target); requireRule(t,'target'); t.kind='wild'; log(s,'ferment'); }
    if (c.kind === 'mold') { const t = foods(s).find(t => t.uid === a.target); requireRule(t, 'target'); temporary(s, t.kind); log(s, 'generate', { kind: t.kind }); }
    if (c.kind === 'juicer') { const t = foods(s).find(t => t.uid === a.target); requireRule(t, 'target'); consume(s, t); temporary(s, 'juice'); log(s, 'generate', { kind: 'juice' }); }
    if (c.kind === 'sorter') {
      s.pending = { type: 'discover', source: c.uid, offers: shuffle(s, Object.keys(CARDS).filter(k => CARDS[k].type === 'food' && !CARDS[k].tokenOnly)).slice(0, 3) };
    }
    } else if (a.type === 'wipeOil') {
    const c = troubles(s).find(c => c.uid === a.uid && c.kind === 'oil'); requireRule(c, 'target');
    const f = foods(s).find(c => c.uid === a.food); requireRule(f, 'foodCost'); consume(s, f); clear(s, c.uid);
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
    const s = JSON.parse(text); if (s?.version !== 4 || !['play', 'stakes', 'route', 'draft', 'won', 'lost'].includes(s.phase) || !Array.isArray(s.cards) || s.cards.length < 2 || !s.cards.every(c => CARDS[c.kind] && CARDS[c.original] && (!c.enchantment || ENCHANTMENTS[c.enchantment] && CARDS[c.original].type === 'food' && !c.temporary)) || s.cards.filter(c => c.original === 'bomb').length !== 1) return null;
    if (new Set(s.cards.map(c => c.uid)).size !== s.cards.length) return null;
    if (![s.draw, s.table, s.discard, s.known, s.log, s.relics].every(Array.isArray) || ![s.round, s.bank, s.rng, s.uid].every(Number.isFinite)) return null;
    if ([...s.draw, ...s.table, ...s.discard].some(uid => !card(s, uid))) return null;
    if (!Array.isArray(s.nextEffects) || !Array.isArray(s.delayedPeeks) || !Array.isArray(s.revealedNames) || !Array.isArray(s.goalHistory)) return null;
    if (s.phase === 'stakes' && (!s.dice || !Array.isArray(s.dice.rolls) || s.dice.rolls.length > 2)) return null;
    if (s.pending) {
      if (s.phase !== 'play') return null;
      if (s.pending.type === 'sift') { if (s.draw[0] !== s.pending.uid || !s.known.includes(s.pending.uid) || card(s, s.pending.source)?.kind !== 'sifter') return null; }
      else if (s.pending.type === 'discover') { if (card(s, s.pending.source)?.kind !== 'sorter' || !Array.isArray(s.pending.offers) || s.pending.offers.length !== 3 || new Set(s.pending.offers).size !== 3 || s.pending.offers.some(k => CARDS[k]?.type !== 'food')) return null; }
      else return null;
    }
    if(s.phase==='route' && (!Array.isArray(s.routeOffers) || s.routeOffers.length!==2 || new Set(s.routeOffers).size!==2 || s.routeOffers.some(id=>!ROUTES[id])))return null;
    if(s.nextRouteReward && ROUTES[s.nextRouteReward]?.type!=='event')return null;
    if(!s.practice && s.maxRounds===5 && ['play','stakes','route','draft'].includes(s.phase))s.maxRounds=MAX_ROUNDS;
    return s;
  } catch { return null; }
}
