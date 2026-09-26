import {drawUnits} from './staples.js';

export const FRESH_PACK_WINDOW = 6;

export function markFreshPack(s, cards) {
  for (const c of cards) if (!c.temporary && c.original !== 'bomb') c.freshRound = s.round + 1;
}

export function expireFreshPack(s) {
  for (const c of s.cards) if (c.freshRound < s.round) {
    delete c.freshRound;
    delete c.freshShown;
  }
}

const shuffled = (items, random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Opening deal only. Bombs and closed staples keep every occupied position.
export function prioritizeFreshPack(s, random, window = FRESH_PACK_WINDOW) {
  const cards = new Map(s.cards.map(c => [c.uid, c]));
  const bound = new Set(drawUnits(s).filter(ids => ids.length > 1).flat());
  const slots = s.draw.map((uid, index) => ({uid, index})).filter(({uid}) => cards.get(uid).original !== 'bomb' && !bound.has(uid));
  const fresh = slots.filter(({uid}) => cards.get(uid).freshRound === s.round).map(x => x.uid);
  if (!fresh.length) return;
  const head = slots.slice(0, Math.max(window, fresh.length));
  const chosen = shuffled(head, random).slice(0, fresh.length);
  const freshIds = shuffled(fresh, random), wanted = new Set(fresh);
  const placements = new Map(chosen.map((slot, i) => [slot.index, freshIds[i]]));
  const rest = slots.filter(({uid}) => !wanted.has(uid));
  let next = 0;
  for (const {index} of slots) s.draw[index] = placements.has(index) ? placements.get(index) : rest[next++].uid;
}

export function revealFreshCard(s, c) {
  if (c.freshRound !== s.round || c.freshShown) return false;
  c.freshShown = true;
  return true;
}

export function validFreshPack(s) {
  return s.cards.every(c => {
    if (c.freshRound == null) return c.freshShown == null;
    return Number.isSafeInteger(c.freshRound) && c.freshRound >= 1 && c.freshRound <= s.round + 1
      && !c.temporary && c.original !== 'bomb' && (c.freshShown == null || typeof c.freshShown === 'boolean');
  });
}
