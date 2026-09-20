import { BOONS, CARDS, RELICS, PACKAGES, typeOf } from './cards.js';
import { ENCHANTMENTS, ROUTES } from './routes.js';
import {MIDNIGHT_TABLE,bombGrowth,diceFaces,diceEffects,diceCount,fixedDie} from './stakes.js';
import {nextTarget} from './pacing.js';

export const SAVE_KEY = 'one-more.run.v5';
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
const live = s => onTable(s).filter(active);
const allFood = s => live(s).filter(c => typeOf(c) === 'food');
const pairGroups = s => [...new Set(allFood(s).filter(c=>c.pair).map(c=>c.pair))].map(id=>allFood(s).filter(c=>c.pair===id));
const consumedFoods = s => s.cards.filter(c=>c.zone==='discard'&&c.consumed&&typeOf(c)==='food');
const boost = (c,n) => {c.bonus=(c.bonus||0)+n;};
export function effectTargets(s, source) {
  const kind=source.kind, target=CARDS[kind].target || CARDS[kind].pairTarget;
  if(target==='food')return foods(s);
  if(target==='pair')return pairGroups(s).map(g=>g[0]);
  if(target==='consumed')return consumedFoods(s);
  if(target==='spentPair')return foods(s).filter(c=>c.pairedOnce&&!CARDS[c.kind].noPair);
  if(target==='foodKind')return allFood(s).filter((c,i,a)=>a.findIndex(x=>x.kind===c.kind)===i);
  if(target==='discardTool')return s.cards.filter(c=>c.zone==='discard'&&typeOf(c)==='tool');
  if(target==='readyTool')return live(s).filter(c=>c.uid!==source.uid&&typeOf(c)==='tool'&&!c.tapped);
  if(target==='temporaryFood')return allFood(s).filter(c=>c.temporary);
  return [];
}
export function pairKind(a, b) {
  if (!a || !b || a.uid === b.uid || typeOf(a) !== 'food' || typeOf(b) !== 'food' || !active(a) || !active(b) || a.pairedOnce || b.pairedOnce || a.pair || b.pair) return null;
  if (CARDS[a.kind].noPair || CARDS[b.kind].noPair) return null;
  if (a.kind === 'wild') return b.kind === 'wild' ? null : b.kind;
  return b.kind === 'wild' || a.kind === b.kind ? a.kind : null;
}
export const partners = (s, uid) => onTable(s).filter(c => pairKind(card(s, uid), c) && !(hasTrouble(s, 'wrap') && [c.kind, card(s, uid)?.kind].includes('wild')));
export function value(s, c) {
  if (!active(c)) return 0;
  const bonus=c.bonus||0, food=allFood(s), same=food.filter(x=>x.kind===c.kind).length;
  if(c.kind==='fridge')return food.filter(x=>x.kind==='fish').length+bonus;
  if(c.kind==='residue')return (hasTrouble(s,'composter')?2:-1)+bonus;
  if(c.kind==='picnic')return new Set(pairGroups(s).map(g=>g[0].pairedAs||g.find(x=>x.kind!=='wild')?.kind)).size*2+bonus;
  if(c.kind==='pantry')return food.filter(x=>!x.pair&&!x.temporary).length+bonus;
  if(c.kind==='recyclingbag')return s.cards.filter(x=>x.zone==='discard'&&typeOf(x)==='trouble').length+bonus;
  if(c.kind==='glasscase')return food.filter(x=>x.temporary).length+bonus;
  if(c.kind==='clutter')return -live(s).filter(x=>typeOf(x)==='tool').length+bonus;
  if(typeOf(c)!=='food')return bonus+(typeOf(c)==='tool'&&c.tapped?Number(s.toolScoring||0):0);
  if((!c.pair&&hasTrouble(s,'debt'))||(c.temporary&&hasTrouble(s,'flies')))return 0;
  if(c.kind==='cola')return (food.find(x=>x.kind==='cola')?.uid===c.uid?1:4)+bonus;
  if(c.kind==='cake')return pairGroups(s).length*2+bonus;
  if(c.kind==='salad')return new Set(food.map(x=>x.kind)).size+bonus;
  if(c.kind==='marshmallow')return (same===1?6:0)+bonus;
  if(c.kind==='cookie')return (same%2?3:0)+bonus;
  if(c.kind==='skewer')return consumedFoods(s).length+bonus;
  if(c.kind==='icecream')return 6-(c.melt||0)+bonus;
  return (CARDS[c.kind].baseScore ?? (s.unit || 2)) * (c.pair || c.enchantment === 'raw' ? 2 : 1)+bonus;
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
function shuffleDraw(s,firstSafe=false){
  shuffle(s,s.draw);
  if(firstSafe&&card(s,s.draw[0])?.kind==='bomb'){
    const safe=s.draw.map((uid,index)=>({uid,index})).filter(x=>card(s,x.uid).kind!=='bomb');
    requireRule(safe.length,'carry');
    const j=safe[Math.floor(random(s)*safe.length)].index;[s.draw[0],s.draw[j]]=[s.draw[j],s.draw[0]];
  }
}
function log(s, key, data = {}) { s.log.push({ id: ++s.event, key, ...data }); s.log = s.log.slice(-45); }
function addCard(s, kind) { const c = { uid: ++s.uid, original: kind, kind, zone: 'deck' }; s.cards.push(c); return c; }
function resetCard(c) { Object.assign(c, { kind: c.original, zone: 'deck', tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: 0, triggers: 0, freeCost: false, multiplier: 1, boiledUsed: false, consumed: false, bonus:0, melt:0, keepOnce:false, extraUses:0, pairedAs:null }); }
function temporary(s, kind) {
  let extra=CARDS[kind].type==='food'?(s.extraFood||0):0;
  if(CARDS[kind].type==='food'&&triggerRelic(s,'redseal'))extra++;
  if(CARDS[kind].type==='food')s.extraFood=0;
  let first;
  for(let i=0;i<=extra;i++){
    const c=addCard(s,kind);resetCard(c);Object.assign(c,{temporary:true,zone:'table',entered:++s.eventCount});s.table.push(c.uid);first??=c;
    if(typeOf(c)==='food')for(const source of live(s).filter(x=>x.kind==='servingbell'))boost(source,1);
  }
  if(extra)log(s,'extraFood',{n:extra});return first;
}
function startRound(s, carry = null) {
  s.cards = s.cards.filter(c => !c.temporary);
  s.bombsAddedThisTable=bombGrowth(s).added;
  for(let i=0;i<s.bombsAddedThisTable;i++)addCard(s,'bomb');
  s.cards.forEach(resetCard);
  s.table = []; s.discard = []; s.known = []; s.flips = 0; s.pending = null; s.lastPair = null; s.relicUsed = {}; s.relicProgress = {}; s.roundEarned = 0; s.log = []; s.phase = 'play';
  s.nextEffects = []; s.lastReveal = null; s.revealedNames = []; s.delayedPeeks = []; s.freePayments = 0; s.boon = s.nextBoon || null; s.nextBoon = null;
  s.clearSight=false;s.toolScoring=false;s.extraFood=0;
  if (carry) { const c = card(s, carry); c.zone = 'table'; s.table.push(c.uid); }
  s.midnight=s.round>=MIDNIGHT_TABLE;
  s.draw=s.cards.filter(c=>c.uid!==carry).map(c=>c.uid);shuffleDraw(s,true);
  log(s, 'round', { n: s.round });
  if (s.boon === 'scout') peek(s, 3);
  if (s.boon === 'meal') s.freePayments = 2;
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
  if(s.relics.includes('emptyplate'))temporary(s,'rice');
  if(s.relics.includes('bottlestopper'))s.freePayments++;
}
export function newRun(seed = Date.now()) {
  const s = { version: 4, seed: seed >>> 0, rng: seed >>> 0, uid: 0, event: 0, pairId: 0, round: 1, maxRounds: MAX_ROUNDS, target: INITIAL_TARGET, unit: 2, bank: 0, cards: [], relics: ['shaker'], practice: false, log: [], eventCount: 0, goalHistory: [{ round: 1, target: INITIAL_TARGET }], dice: null };
  const kinds = ['rice','rice','rice','fish','fish','fish','mint','mint','tea','tea','toast','toast','wild','wild','torch','torch','scope','bell','candle','bomb'];
  kinds.forEach(k => addCard(s, k)); startRound(s); return s;
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
  requireRule(c?.zone === 'table' && ['food','trouble'].includes(typeOf(c)) && active(c), 'target');
  if(c.keepOnce){c.keepOnce=false;log(s,'retained',{kind:c.kind});return false;}
  if(c.pair)onTable(s).filter(x=>x.pair===c.pair).forEach(x=>x.pair=null);
  discard(s, c, paid); c.consumed = true;
  log(s, 'consume', { kind: c.kind });
  if(typeOf(c)!=='food')return true;
  if(triggerRelic(s,'silverfork'))gainBank(s,1);
  const n = onTable(s).filter(x => active(x) && x.kind === 'dishwasher').length;
  if (n) { s.freePayments += n; log(s, 'tickets', { n }); }
  for(const x of live(s).filter(x=>x.kind==='choppingboard'))boost(x,2);
  if(c.kind==='egg'){temporary(s,'rice');log(s,'generate',{kind:'rice'});}
  if(c.kind==='pear')peek(s,2);
  return true;
}
function clear(s, uid) {
  const c = card(s, uid); requireRule(c?.zone === 'table' && typeOf(c) === 'trouble' && active(c), 'target');
  discard(s, c); log(s, 'clear', { kind: c.kind });
  if(triggerRelic(s,'linen'))peek(s,1);
  for(const source of live(s).filter(x=>x.kind==='spicejar')){const t=foods(s)[0];if(t)boost(t,1);}
}
function peek(s, n, offset=0) {
  if (!s.clearSight&&hasTrouble(s, 'noise')) { log(s, 'blockedPeek'); return; }
  if(s.draw.length>offset&&triggerRelic(s,'pocketwatch'))n++;
  const count = !s.clearSight&&hasTrouble(s, 'fog') ? Math.min(1, n) : n;
  const seen = s.draw.slice(offset,offset+count); s.known = [...new Set([...s.known, ...seen])]; log(s, 'peek', { n: seen.length, offset });
}
function pay(s, uid) {
  const c = payableFoods(s).find(c => c.uid === uid); requireRule(c, 'foodCost');
  if (c.enchantment === 'boiled' && !c.boiledUsed) { c.boiledUsed = true; log(s, 'boiled', { kind: c.kind }); return; }
  if(consume(s, c, true))log(s, 'pay', { kind: c.kind });
}
function pairEffect(s, kind, target, except = null, pairCards=[]) {
  if(hasTrouble(s,'cold'))return false;
  if(kind==='dumpling'){pairCards.forEach(c=>boost(c,2));return true;}
  if(kind==='mushroom'){troubles(s).filter(c=>c.kind==='residue').forEach(c=>clear(s,c.uid));return true;}
  if(kind==='lemon'){s.clearSight=true;log(s,'clearSight');return true;}
  if(kind==='shrimp'){discover(s,'tool');return true;}
  if(kind==='noodle'){s.toolScoring=Number(s.toolScoring||0)+1;log(s,'toolScoring');return true;}
  if(kind==='cheese'&&target!=null){const c=foods(s).find(c=>c.uid===target);requireRule(c,'target');temporary(s,c.kind);log(s,'generate',{kind:c.kind});return true;}
  if(kind==='chili'){tiredTools(s).forEach(c=>c.tapped=false);log(s,'allReady');return true;}
  if(kind==='tofu'){s.extraFood=(s.extraFood||0)+1;log(s,'foodQueued');return true;}
  if(kind==='sushi'){temporary(s,'fish');log(s,'generate',{kind:'fish'});return true;}
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

function triggerRelic(s,id){
 s.relicProgress??={};if(!s.relics.includes(id)||s.relicProgress[id])return false;
 s.relicProgress[id]=true;log(s,'relicTrigger',{relic:id});return true;
}
function gainBank(s,n){s.bank+=n;log(s,'gainBank',{n});}
export function relicProblem(s,id){
 const r=RELICS[id];
 if(s.phase!=='play'||!r||r.mode!=='active'||!s.relics.includes(id)||s.relicUsed[id])return 'relic';
 if(s.bank<r.cost)return 'pointsCost';
 if(id==='shaker'&&!s.flips)return 'first';
 if(id==='recycler'&&!paidFoods(s).length)return 'noPaid';
 if(id==='splitter'&&!onTable(s).some(c=>c.pair))return 'noTarget';
 if(id==='polishingstone'&&!tiredTools(s).length)return 'noTired';
 if(id==='trashpass'&&!troubles(s).length)return 'noTrouble';
 if(id==='oldkey'&&!s.draw.length)return 'empty';
 if(id==='oldkey'&&!s.clearSight&&hasTrouble(s,'noise'))return 'noPeek';
 return null;
}

export function toolProblem(s, c) {
  if (!c || c.zone !== 'table' || !active(c)) return 'sealed';
  if (hasTrouble(s, 'oil')) return 'oil';
  if (c.tapped) return 'tapped';
  if (CARDS[c.kind].bankCost > s.bank) return 'pointsCost';
  if(CARDS[c.kind].target&&!effectTargets(s,c).length)return 'noTarget';
  if(c.kind==='compostfork'&&!troubles(s).some(x=>x.kind==='residue'))return 'noTarget';
  if(c.kind==='fan'&&!troubles(s).some(x=>['fog','noise'].includes(x.kind)))return 'noTarget';
  if(c.kind==='washbucket'&&!troubles(s).length)return 'noTrouble';
  if(c.kind==='magnifier'&&s.draw.length<3)return 'noTarget';
  if (needsFoodCost(s, c) && !payableFoods(s).length) return 'foodCost';
  if (['cloth', 'jar'].includes(c.kind) && !troubles(s).length) return 'noTrouble';
  if (c.kind === 'bell' && !tiredTools(s,c.uid).length) return 'noTired';
  if (c.kind === 'stove' && !transformableFoods(s).length) return 'noFood';
  if (['mold', 'juicer'].includes(c.kind) && !foods(s).length) return 'foodCost';
  if (c.kind === 'sifter' && !s.draw.length) return 'empty';
  if (c.kind === 'sifter' && !s.clearSight && hasTrouble(s,'noise') && !s.known.includes(s.draw[0])) return 'noPeek';
  return null;
}
function reclaim(s, uid) {
  const c = paidFoods(s).find(c => c.uid === uid); requireRule(c, 'target'); c.zone = 'table'; c.paid = false; c.entered = ++s.eventCount; s.discard = s.discard.filter(id => id !== uid); s.table.push(uid); log(s, 'recover', { kind: c.kind });
}
function returnFromDiscard(s,c,exhausted=false){s.discard=s.discard.filter(uid=>uid!==c.uid);c.zone='table';c.paid=false;c.consumed=false;c.tapped=exhausted;c.entered=++s.eventCount;s.table.push(c.uid);log(s,'recover',{kind:c.kind});}
function discover(s,pool){s.pending={type:'discover',pool,offers:shuffle(s,Object.keys(CARDS).filter(k=>CARDS[k].type===pool&&!CARDS[k].tokenOnly)).slice(0,s.relics.includes('neonsign')?4:3)};}
function extraTool(s,c,target){
 const def=CARDS[c.kind],t=def.target?effectTargets(s,c).find(x=>x.uid===target):null;
 if(def.target)requireRule(t,'target');
 if(c.kind==='grill'){const n=value(s,t);consume(s,t);boost(c,n*2);temporary(s,'residue');log(s,'generate',{kind:'residue'});}
 if(c.kind==='steamer'){t.keepOnce=true;log(s,'protectedFood',{kind:t.kind});}
 if(c.kind==='cleaver'){const pair=onTable(s).filter(x=>x.pair===t.pair);requireRule(pair.length===2,'target');pair.forEach(x=>consume(s,x));for(let i=0;i<3;i++)temporary(s,'rice');log(s,'generate',{kind:'rice',n:3});}
 if(c.kind==='scoop')returnFromDiscard(s,t);
 if(c.kind==='compostfork'){const list=troubles(s).filter(x=>x.kind==='residue');list.forEach(x=>consume(s,x));boost(c,list.length*2);}
 if(c.kind==='stamp'){t.pairedOnce=false;log(s,'pairReset',{kind:t.kind});}
 if(c.kind==='magnifier')peek(s,1,2);
 if(c.kind==='fan')troubles(s).filter(x=>['fog','noise'].includes(x.kind)).forEach(x=>clear(s,x.uid));
 if(c.kind==='washbucket')troubles(s).forEach(x=>clear(s,x.uid));
 if(c.kind==='tray'){s.table=s.table.filter(uid=>uid!==t.uid);s.draw.push(t.uid);t.zone='deck';s.known.push(t.uid);log(s,'bottom',{kind:t.kind});}
 if(c.kind==='menu')allFood(s).filter(x=>x.kind===t.kind).forEach(x=>boost(x,1));
 if(c.kind==='magnet')returnFromDiscard(s,t,true);
 if(c.kind==='whetstone'){t.extraUses=1;log(s,'doubleUse',{kind:t.kind});}
 if(c.kind==='ladle'){t.temporary=false;t.original=t.kind;log(s,'permanentFood',{kind:t.kind});}
}
function reveal(s) {
  requireRule(s.draw.length, 'empty'); const uid=s.draw.shift(), c=card(s,uid);
  s.known=s.known.filter(id=>id!==uid); s.flips++;
  for(const x of live(s).filter(x=>x.kind==='icecream'))x.melt=(x.melt||0)+1;
  if(c.kind==='bomb'){c.zone='table';s.table.push(uid);s.phase='lost';s.reason='bomb';log(s,'bomb');return;}
  const kind=c.kind, type=typeOf(c);
  c.zone='table';c.entered=++s.eventCount;s.table.push(uid);log(s,'reveal',{kind,source:uid});
  s.lastReveal={uid,kind,type,number:s.flips};
  if (type === 'tool' && hasTrouble(s,'rust')) { c.tapped = true; log(s,'rusted',{kind}); }
  if (kind === 'wish') { temporary(s,'wild');log(s,'gift'); }
  if(kind==='coffee'){const t=tiredTools(s)[0];if(t){t.tapped=false;log(s,'ready',{kind:t.kind});}}
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
  if(s.bank===s.target&&s.relics.includes('scale'))gainBank(s,4);
  if (s.round >= s.maxRounds) { s.phase = s.bank >= s.target ? 'won' : 'lost'; s.reason = s.bank >= s.target ? 'complete' : 'target'; return; }
  s.phase = s.round===MIDNIGHT_TABLE-1?'midnight':'stakes'; s.dice = { rolls: [], result: null, count:s.round+1>=MIDNIGHT_TABLE?2:1 };
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
  s.relicOffer = s.round === 2 ? ['lunchbox', 'recycler', 'splitter'].filter(id=>!s.relics.includes(id)) : [4,6,8].includes(s.round) ? shuffle(s,Object.keys(RELICS).filter(id=>!s.relics.includes(id))).slice(0,3) : [];
  s.relicPicked = false;
}
export function act(previous, action) {
  const s = structuredClone(previous); const a = action; s.relicProgress??={};
  if(s.phase==='midnight'){requireRule(a.type==='acceptMidnight','phase');s.phase='stakes';return s;}
  if (s.phase === 'stakes') {
    if (a.type === 'roll') {
      requireRule(s.dice.rolls.length < 2 && !s.dice.result?.locked, 'rollLimit');
      const old=s.dice.result?diceFaces(s.dice.result):[];
      const faces=Array.from({length:diceCount(s)},(_,i)=>fixedDie(old[i])?old[i]:1+Math.floor(random(s)*20)),total=faces.reduce((a,b)=>a+b,0);
      s.dice.result = { total, faces, held:faces.map((_,i)=>fixedDie(old[i])), tier: faces.includes(20)?'criticalHigh':faces.includes(1)?'criticalLow':faces.some(n=>n>=15)?'high':faces.some(n=>n<=5)?'low':'steady', locked:faces.every(fixedDie) }; s.dice.rolls.push(structuredClone(s.dice.result));
    } else if (a.type === 'acceptDice') {
      const d = s.dice.result; requireRule(d, 'rollFirst');
      const effects=diceEffects(d);
      if (effects.boon === 'choose') requireRule(['scout','sauce','meal'].includes(a.boon), 'chooseBoon');
      s.target = nextTarget(s,d.total); s.goalHistory.push({ round: s.round + 1, target: s.target, dice: { ...d } });
      effects.trouble.forEach(k=>addCard(s,k));
      s.nextBoon = effects.boon === 'feast' ? 'feast' : effects.boon === 'choose' ? a.boon : null;
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
      const c=temporary(s,a.kind);s.pending=null;log(s,'discover',{kind:c.kind});return s;
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
    first.pairedAs=second.pairedAs=kind;
    if(triggerRelic(s,'matchbox'))[first,second].forEach(c=>boost(c,1));
    if(s.relics.includes('shellpair')&&[first,second].some(c=>c.kind==='wild'))[first,second].filter(c=>c.kind!=='wild').forEach(c=>boost(c,1));
    log(s, 'pair', { kind }); if (pairEffect(s, kind, a.target,null,[first,second])) s.lastPair = kind;
    const fried = [first, second].filter(c => c.enchantment === 'fried').length;
    if (fried) { s.freePayments += fried; log(s, 'tickets', { n: fried }); }
    for (const source of listeners) { if(source.kind==='candle') peek(s,2); else {s.freePayments++;log(s,'tickets',{n:1});} }
    if(s.relics.includes('recipebook')){const kinds=s.relicProgress.pairKinds??=[];if(!kinds.includes(kind))kinds.push(kind);if(kinds.length>=2&&triggerRelic(s,'recipebook')){const t=tiredTools(s).sort((a,b)=>a.entered-b.entered)[0];if(t){t.tapped=false;log(s,'ready',{kind:t.kind});}}}
  } else if (a.type === 'use') {
    const c = card(s, a.uid); requireRule(c && typeOf(c) === 'tool', 'target'); const problem = toolProblem(s, c); requireRule(!problem, problem);
    const useListeners=live(s).filter(x=>['timer','grease'].includes(x.kind)).map(x=>({uid:x.uid,kind:x.kind}));
    if (CARDS[c.kind].bankCost) { s.bank -= CARDS[c.kind].bankCost; log(s, 'spendPoints', { n: CARDS[c.kind].bankCost }); }
    if (hasFoodCost(c)) {
      if (c.freeCost) { c.freeCost = false; log(s, 'freeUse'); }
      else if (s.freePayments > 0) { s.freePayments--; log(s, 'freeUse'); }
      else pay(s, a.food);
    }
    const extraUse=c.extraUses>0;c.tapped=!extraUse;if(extraUse)c.extraUses--;log(s, 'use', { kind: c.kind });
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
    if (c.kind === 'juicer') { const t = foods(s).find(t => t.uid === a.target); requireRule(t, 'target'); consume(s, t); temporary(s, 'residue'); log(s, 'generate', { kind: 'residue' }); temporary(s, 'juice'); log(s, 'generate', { kind: 'juice' }); }
    if (c.kind === 'sorter') {
      discover(s,'food');s.pending.source=c.uid;
    }
    extraTool(s,c,a.target);
    for(const source of useListeners)boost(card(s,source.uid),source.kind==='timer'?1:-1);
    if(triggerRelic(s,'coinpurse'))gainBank(s,2);
    s.relicProgress.toolUses=(s.relicProgress.toolUses||0)+1;
    if(s.relicProgress.toolUses===3&&s.relics.includes('luckybone'))peek(s,2);
    } else if (a.type === 'wipeOil') {
    const c = troubles(s).find(c => c.uid === a.uid && c.kind === 'oil'); requireRule(c, 'target');
    const f = foods(s).find(c => c.uid === a.food); requireRule(f, 'foodCost'); consume(s, f); clear(s, c.uid);
  } else if (a.type === 'relic') {
    const problem=relicProblem(s,a.id);requireRule(!problem,problem);
    if(RELICS[a.id].cost){s.bank-=RELICS[a.id].cost;log(s,'spendPoints',{n:RELICS[a.id].cost});}
    if (a.id === 'shaker') { requireRule(s.flips > 0, 'first'); shuffleDraw(s); s.known = []; log(s, 'shuffle'); }
    else if (a.id === 'recycler') {
      reclaim(s, a.uid);
    } else if (a.id === 'splitter') {
      const c = card(s, a.uid); requireRule(c?.zone === 'table' && c.pair, 'target'); const pair = c.pair; onTable(s).filter(c => c.pair === pair).forEach(c => c.pair = null); log(s, 'split');
    } else if(a.id==='oldkey')peek(s,1);
    else if(a.id==='trashpass')clear(s,a.uid);
    else if(a.id==='polishingstone'){const t=tiredTools(s).find(c=>c.uid===a.uid);requireRule(t,'target');t.tapped=false;log(s,'ready',{kind:t.kind});}
    else requireRule(false, 'relic');
    s.relicUsed[a.id] = true;
  } else requireRule(false, 'action');
  return s;
}
export function restore(text) {
  try {
    const s = JSON.parse(text); if (s?.version !== 4 || !['play', 'midnight', 'stakes', 'route', 'draft', 'won', 'lost'].includes(s.phase) || !Array.isArray(s.cards) || s.cards.length < 2 || !s.cards.every(c => CARDS[c.kind] && CARDS[c.original] && (c.original!=='bomb'||c.kind==='bomb'&&!c.temporary) && (!c.enchantment || ENCHANTMENTS[c.enchantment] && CARDS[c.original].type === 'food' && !c.temporary)) || s.cards.filter(c => c.original === 'bomb').length < 1) return null;
    if (new Set(s.cards.map(c => c.uid)).size !== s.cards.length) return null;
    if (![s.draw, s.table, s.discard, s.known, s.log, s.relics].every(Array.isArray) || ![s.round, s.bank, s.rng, s.uid].every(Number.isFinite)) return null;
    if ([...s.draw, ...s.table, ...s.discard].some(uid => !card(s, uid))) return null;
    if (!Array.isArray(s.nextEffects) || !Array.isArray(s.delayedPeeks) || !Array.isArray(s.revealedNames) || !Array.isArray(s.goalHistory)) return null;
    if (['stakes','midnight'].includes(s.phase) && (!s.dice || !Array.isArray(s.dice.rolls) || s.dice.rolls.length > 2)) return null;
    if(s.dice?.count!=null&&![1,2].includes(s.dice.count))return null;
    if(s.dice?.result?.faces&&(![1,2].includes(s.dice.result.faces.length)||s.dice.result.faces.some(n=>!Number.isInteger(n)||n<1||n>20)||s.dice.result.total!==s.dice.result.faces.reduce((a,b)=>a+b,0)))return null;
    if (s.pending) {
      if (s.phase !== 'play') return null;
      if (s.pending.type === 'sift') { if (s.draw[0] !== s.pending.uid || !s.known.includes(s.pending.uid) || card(s, s.pending.source)?.kind !== 'sifter') return null; }
      else if (s.pending.type === 'discover') { const pool=s.pending.pool||'food';if(!['food','tool'].includes(pool)||!Array.isArray(s.pending.offers)||s.pending.offers.length!==(s.relics.includes('neonsign')?4:3)||new Set(s.pending.offers).size!==s.pending.offers.length||s.pending.offers.some(k=>CARDS[k]?.type!==pool||CARDS[k]?.tokenOnly))return null; }
      else return null;
    }
    if(s.phase==='route' && (!Array.isArray(s.routeOffers) || s.routeOffers.length!==2 || new Set(s.routeOffers).size!==2 || s.routeOffers.some(id=>!ROUTES[id])))return null;
    if(s.nextRouteReward && ROUTES[s.nextRouteReward]?.type!=='event')return null;
    if(s.relics.some(id=>!RELICS[id]))return null;
    s.relicProgress??={};
    if(!s.practice && s.maxRounds===5 && ['play','stakes','route','draft'].includes(s.phase))s.maxRounds=MAX_ROUNDS;
    return s;
  } catch { return null; }
}
