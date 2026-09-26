import {usesNewStakes,protectionAvailable,validProtection} from './onboarding-rules.js';
import {markFreshPack,expireFreshPack,prioritizeFreshPack,revealFreshCard,validFreshPack} from './fresh-pack.js';
import {canEnchant,enchantmentText,enchantAmount,bankCost,FRIED} from './enchantments.js';
import {createConsumption,clearConsumption,isToolConsumedFood} from './consumption.js';
import {canSkipTable,SKIP_REWARDS,scoreMultiplier,validMomentum,wheelPick,wheelSections} from './momentum.js';
import {DRAFT_SERVICES,draftTargets,packageById} from './draft-services.js';
import { BOONS, CARDS, RELICS, PACKAGES, typeOf } from './cards.js';
import { ENCHANTMENTS, ROUTES } from './routes.js';
import {MIDNIGHT_TABLE,bombGrowth,diceFaces,diceEffects,diceCount,fixedDie} from './stakes.js';
import {nextTarget,targetFactor} from './pacing.js';
import {ruleDiceCount,CHALLENGES} from './unlock-data.js';
import {GROWTH_ROUTES,GROWTH_PACKAGES,growthRoute,growthBase,growthCap,growthDeck,recordGrowth,validGrowth} from './growth-lab.js';
import {STAPLE_SIZE,stapleCandidates,drawUnits,unfasten,closedStaple,tidyStaples,validStaples} from './staples.js';
import {DEALER_ROUTES,SETBACKS,dealerQuote,effectiveTarget,bankGain,permanentFoods,permanentTools,prizePool,validDealerState} from './dealer-events.js';
import {starterDeck} from './starter.js';
import {createNightRules} from './night-rules.js';
import {economyEnabled,beginRewardTable,unlockTableReward,rewardDenied,validRewards} from './table-rewards.js';
import {pressWeight,pressCandidates,pressedWeight,parcelFoods,parcelTools,sealParcel,validCrafting,validPressWeight} from './card-crafting.js';
import {bribeOffer,eventBaseCost} from './bribes.js';

export const SAVE_KEY = 'one-more.run.v5';
export const INITIAL_TARGET = 8;
export const MAX_ROUNDS = 10;
export const PREF_KEY = 'one-more.preferences.v2';
const requireRule = (condition, code) => { if (!condition) throw new Error(code); };
// Run state is JSON save data; embedded browsers may lack structuredClone.
const cloneState = value => typeof globalThis.structuredClone === 'function'
  ? globalThis.structuredClone(value) : JSON.parse(JSON.stringify(value));
export const card = (s, uid) => s.cards.find(c => c.uid === uid);
export const onTable = s => s.table.map(uid => card(s, uid));
export const active = c => !c.sealedBy;
export const hasTrouble = (s, kind) => onTable(s).some(c => c.kind === kind && active(c));
export const foods = s => onTable(s).filter(c => typeOf(c) === 'food' && active(c) && !c.pair);
export const payableFoods = s => onTable(s).filter(c => typeOf(c) === 'food' && active(c) && (!c.pair || hasTrouble(s, 'timetable')));
export const transformableFoods = s => foods(s).filter(c => c.kind !== 'wild');
export const troubles = s => onTable(s).filter(c => typeOf(c) === 'trouble' && active(c));
export const tiredTools = (s, except = null) => onTable(s).filter(c => typeOf(c) === 'tool' && active(c) && c.tapped && c.uid !== except);
export const toolConsumedFoods = s => s.cards.filter(c => isToolConsumedFood(c,CARDS));
export const paidFoods = toolConsumedFoods; // Compatibility for earlier integrations.
export const hasFoodCost = c => ['scope', 'bell'].includes(c.kind);
export const needsFoodCost = (s, c) => hasFoodCost(c) && c.enchantment!=='boiled' && !c.freeCost && !(s.freePayments > 0);
export const knownCards = s => s.draw.map((uid, index) => ({ ...card(s, uid), index })).filter(c => s.known.includes(c.uid));
const live = s => onTable(s).filter(active);
const allFood = s => live(s).filter(c => typeOf(c) === 'food');
const pairGroups = s => [...new Set(allFood(s).filter(c=>c.pair).map(c=>c.pair))].map(id=>allFood(s).filter(c=>c.pair===id));
export const consumedFoods = s => s.cards.filter(c=>c.zone==='discard'&&c.consumed&&typeOf(c)==='food');
export const matchingFoods=(s,except=[])=>foods(s).filter(c=>!except.includes(c.uid)&&!c.pairedOnce&&!CARDS[c.kind].noPair&&c.kind!=='wild'&&s.draw.some(uid=>card(s,uid).kind===c.kind));
export const reserveTools=s=>live(s).filter(c=>typeOf(c)==='tool'&&!c.temporary&&c.lastUsed>0).sort((a,b)=>b.lastUsed-a.lastUsed).slice(0,live(s).filter(c=>c.kind==='ledger').length);
const boost = (c,n) => {c.bonus=(c.bonus||0)+n;};
export function effectTargets(s, source) {
  const kind=source.kind, target=CARDS[kind].target || CARDS[kind].pairTarget;
  if(target==='food')return foods(s).filter(c=>source.kind==='pastrymold'?c.kind!=='shortbread':source.kind==='cookiepress'?c.kind!==s.lastFoodPair:true);
  if(target==='storeFood')return allFood(s);
  if(target==='trouble')return troubles(s);
  if(target==='pair')return pairGroups(s).filter(g=>g.length===2).map(g=>g[0]);
  if(target==='consumed')return consumedFoods(s);
  if(target==='matchingFood')return matchingFoods(s,[source.uid]);
  if(target==='foodKind')return allFood(s).filter((c,i,a)=>a.findIndex(x=>x.kind===c.kind)===i);
  if(target==='discardTool')return s.cards.filter(c=>c.zone==='discard'&&typeOf(c)==='tool');
  if(target==='readyTool')return live(s).filter(c=>c.uid!==source.uid&&typeOf(c)==='tool'&&!c.tapped);
  if(target==='costTool')return live(s).filter(c=>typeOf(c)==='tool'&&bankCost(c,CARDS)>1);
  if(target==='temporaryFood')return allFood(s).filter(c=>c.temporary);
  return [];
}
export function pairKind(a, b) {
  if (!a || !b || a.uid === b.uid || typeOf(a) !== 'food' || typeOf(b) !== 'food' || !active(a) || !active(b) || a.pairedOnce || b.pairedOnce || a.pair || b.pair) return null;
  if (CARDS[a.kind].noPair || CARDS[b.kind].noPair) return null;
  if(CARDS[a.kind].pairsWith?.includes(b.kind)||CARDS[b.kind].pairsWith?.includes(a.kind))return [a.kind,b.kind].sort()[0];
  if (a.kind === 'wild') return b.kind === 'wild' ? null : b.kind;
  return b.kind === 'wild' || a.kind === b.kind ? a.kind : null;
}
export const partners = (s, uid) => onTable(s).filter(c => pairKind(card(s, uid), c) && !(hasTrouble(s, 'wrap') && [c.kind, card(s, uid)?.kind].includes('wild')));
function rawValue(s, c) {
  if (!active(c)) return 0;
  if(s.challenge==='pairs'&&typeOf(c)==='food'&&!c.pair)return 0;
  const glazed=c.enchantment==='glazed',bonus=c.bonus||0, food=allFood(s), same=food.filter(x=>x.kind===c.kind).length;
  if(c.kind==='fridge')return food.filter(x=>x.kind==='fish').length*(glazed?2:1)+bonus;
  if(c.kind==='residue')return (hasTrouble(s,'composter')?2:-1)+bonus;
  if(c.kind==='picnic')return new Set(pairGroups(s).map(g=>g[0].pairedAs||g.find(x=>x.kind!=='wild')?.kind)).size*(glazed?3:2)+bonus;
  if(c.kind==='pantry')return food.filter(x=>!x.pair&&!x.temporary).length*(glazed?2:1)+bonus;
  if(c.kind==='recyclingbag')return s.cards.filter(x=>x.zone==='discard'&&typeOf(x)==='trouble').length*(glazed?2:1)+bonus;
  if(c.kind==='glasscase')return food.filter(x=>x.temporary).length*(glazed?2:1)+bonus;
  if(c.kind==='clutter')return -live(s).filter(x=>typeOf(x)==='tool').length+bonus;
  if(typeOf(c)!=='food'){const n=night.value(s,c);if(n!=null)return n+bonus;}
  if(typeOf(c)!=='food')return bonus+(typeOf(c)==='tool'&&c.tapped?Number(s.toolScoring||0):0);
  if((!c.pair&&hasTrouble(s,'debt'))||(c.temporary&&hasTrouble(s,'flies')))return 0;
  {const n=night.value(s,c);if(n!=null)return n+bonus;}
  if(c.kind==='stackcake')return 2**same+bonus;
  if(c.kind==='cola')return (food.find(x=>x.kind==='cola')?.uid===c.uid?1:4)+(glazed?1:0)+bonus;
  if(c.kind==='cake')return pairGroups(s).length*(glazed?3:2)+bonus;
  if(c.kind==='salad')return new Set(food.map(x=>x.kind)).size*(glazed?2:1)+bonus;
  if(c.kind==='marshmallow')return (same===1?(glazed?10:6):0)+bonus;
  if(c.kind==='cookie')return (same%2?(glazed?5:3):0)+bonus;
  if(c.kind==='skewer')return consumedFoods(s).length*(glazed?2:1)+bonus;
  if(c.kind==='icecream')return (glazed?9:6)-(c.melt||0)+bonus;
  return (s.growth&&growthRoute(c)&&c.kind===c.original?growthBase(c):CARDS[c.kind].baseScore ?? (s.unit || 2)) * (c.pair || c.enchantment === 'raw' ? 2 : 1)+bonus;
}
export const value=(s,c)=>rawValue(s,c)*(typeOf(c)==='food'?pressWeight(c):1)*(s.relics.includes('silencer')&&c.pair&&typeOf(c)==='food'?2:1);
export const baseScore=s=>onTable(s).reduce((n,c)=>n+value(s,c),0);
export const score=s=>Math.floor(baseScore(s)*scoreMultiplier(s));
export const cashValue = (s, carry = null) => bankGain(s,score(carry == null ? s : { ...s, table: s.table.filter(uid => uid !== carry) }));
function random(s) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}
function shuffleDraw(s,firstSafe=false,changeTop=false){
  const units=drawUnits(s),oldTop=units[0]?.[0];shuffle(s,units);
  // Uniform among permutations with a different top unit; bound cards stay together.
  if(changeTop&&units.length>1&&units[0][0]===oldTop){
    const j=1+Math.floor(random(s)*(units.length-1));[units[0],units[j]]=[units[j],units[0]];
  }
  if(firstSafe&&card(s,units[0]?.[0])?.kind==='bomb'){
    const safe=units.map((ids,index)=>({ids,index})).filter(x=>card(s,x.ids[0]).kind!=='bomb');
    requireRule(safe.length,'carry');
    const j=safe[Math.floor(random(s)*safe.length)].index;[units[0],units[j]]=[units[j],units[0]];
  }
  s.draw=units.flat();
}
function log(s, key, data = {}) { s.log.push({ id: ++s.event, key, ...data }); s.log = s.log.slice(-45); }
function addCard(s, kind) { const c = { uid: ++s.uid, original: kind, kind, zone: 'deck' }; s.cards.push(c); return c; }
function resetCard(c) { clearConsumption(c);Object.assign(c, { kind: c.original, zone: 'deck', tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: 0, lastUsed:0, usesThisTable:0, consumedAbilityUsed:false, reclaimUsed:false, usedNames:[],costDiscount:0,triggers: 0, freeCost: false, multiplier: 1, boiledUsed: false, consumed: false, bonus:0, revealTicks:0, melt:0, keepOnce:false, extraUses:c.enchantment==='smoked'&&CARDS[c.original].type==='tool'?1:0, pairedAs:null }); }
function temporary(s, kind) {
  let extra=CARDS[kind].type==='food'?(s.extraFood||0):0;
  if(CARDS[kind].type==='food'&&triggerRelic(s,'redseal'))extra++;
  if(CARDS[kind].type==='food')s.extraFood=0;
  let first;
  for(let i=0;i<=extra;i++){
    const c=addCard(s,kind);resetCard(c);Object.assign(c,{temporary:true,zone:'table',entered:++s.eventCount});s.table.push(c.uid);first??=c;
    if(typeOf(c)==='food'){
      recordGrowth(s,'create',{uid:c.uid},log);
      if(s.growth&&triggerRelic(s,'nurserypot')){c.temporary=false;log(s,'permanentFood',{kind:c.kind});}
    }
    if(typeOf(c)==='food')for(const source of live(s).filter(x=>x.kind==='servingbell'))boost(source,1);
  }
  if(extra)log(s,'extraFood',{n:extra});return first;
}
function startRound(s, carry = null) {
  expireFreshPack(s);
  if(s.economyPending===2&&!Number.isInteger(s.lesson)){s.economy=2;delete s.economyPending;}
  const parcel=s.sealedParcel?.round<=s.round?s.sealedParcel:null;
  s.parcelArrival=[];
  const stored=(s.storedFoods||[]).map(entry=>({...entry,c:card(s,entry.uid)})).filter(x=>x.c);
  if(s.tableCondition?.round!==s.round)s.tableCondition=null;
  if(s.tableCondition?.cap)s.tableCondition.ceiling=Math.max(s.bank,effectiveTarget({...s,phase:'play'}));
  s.eventReceipt=null;s.wagerPrize=null;
  s.tablePrize=s.nextSkipPrize?.round===s.round?s.nextSkipPrize.id:null;s.nextSkipPrize=null;
  s.tableDoublings=0;s.metronomeStacks=0;s.foodStreak=0;s.autoPairQueue=[];s.panRescue=null;s.beginnerRescue=null;
  for(const b of s.staples||[])if(b.permanent)b.openedRound=null;
  s.cards = s.cards.filter(c => !c.temporary||stored.some(x=>x.uid===c.uid));
  tidyStaples(s);
  s.bombsAddedThisTable=bombGrowth(s).added;
  for(let i=0;i<s.bombsAddedThisTable;i++)addCard(s,'bomb');
  s.cards.forEach(resetCard);
  s.table = []; s.discard = []; s.known = []; s.flips = 0; s.pending = null; s.lastPair = null; s.relicUsed = {}; s.relicProgress = {}; s.roundEarned = 0; s.log = []; s.phase = 'play';
  s.nextEffects = []; s.lastReveal = null; s.revealedNames = []; s.delayedPeeks = []; s.freePayments = 0; s.boon = s.nextBoon || null; s.nextBoon = null;
  s.clearSight=false;s.toolScoring=false;s.extraFood=0;
  if(s.growth)s.growth.seen={};
  if (carry) { const c = card(s, carry); c.zone = 'table'; s.table.push(c.uid); }
  const reserved=(s.reservedTools||[]).map(uid=>card(s,uid)).filter(c=>c&&!c.temporary&&typeOf(c)==='tool');
  for(const c of reserved){unfasten(s,c.uid);c.zone='table';c.entered=++s.eventCount;s.table.push(c.uid);}
  s.reservedTools=[];
  for(const {c,kind,bonus,multiplier} of stored){Object.assign(c,{kind,bonus,multiplier,zone:'table',entered:++s.eventCount});s.table.push(c.uid);log(s,'storedReturned',{kind,uid:c.uid});}
  s.storedFoods=[];
  if(parcel){
    for(const uid of parcel.uids){const c=card(s,uid);if(!c)continue;
      s.table=s.table.filter(id=>id!==uid);unfasten(s,uid);c.zone='table';c.tapped=false;c.entered=++s.eventCount;s.table.push(uid);s.parcelArrival.push({...c});}
    s.sealedParcel=null;log(s,'openParcel',{uids:parcel.uids});
  }
  // Skipping a table carries the sealed parcel forward to the next played table.
  if(s.sealedParcel)for(const uid of s.sealedParcel.uids)card(s,uid).zone='parcel';
  s.midnight=s.round>=MIDNIGHT_TABLE;
  if(s.tablePrize==='sanctuary')s.cards.filter(c=>c.original==='bomb').forEach(c=>c.zone='held');
  s.draw=s.cards.filter(c=>c.zone==='deck').map(c=>c.uid);shuffleDraw(s,true);
  prioritizeFreshPack(s,()=>random(s));
  log(s, 'round', { n: s.round });
  for(const c of reserved)log(s,'toolReturned',{kind:c.kind});
  if(s.tablePrize==='scout'){peek(s,5);s.freePayments+=2;}
  if(s.tablePrize)log(s,'skipBoon',{reward:s.tablePrize});
  if (s.boon === 'scout') peek(s, 3);
  if (s.boon === 'meal') s.freePayments += 2;
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
  if(s.nextRouteUpgrade){
    if(reward==='lantern')peek(s,6);
    if(reward==='tea')s.freePayments+=2;
    if(reward==='helper')temporary(s,'torch');
  }
  s.nextRouteUpgrade=false;
  if(s.nextBribePeek){peek(s,s.nextBribePeek);s.nextBribePeek=0;}
  if (reward) log(s, 'routeReward', { route: reward });
  if(s.relics.includes('emptyplate'))temporary(s,'rice');
  if(s.relics.includes('bottlestopper'))s.freePayments++;
  night.start(s);
  if(s.relics.includes('reservebench'))for(const entry of stored.slice(0,2))temporary(s,entry.kind);
  beginRewardTable(s);
}
const {consumeByTool,consumeByEffect}=createConsumption({definitions:CARDS,active,onTable,discard,onFoodConsumed,log,requireRule});
const night=createNightRules({card,CARDS,live,foods,tiredTools,pairGroups,consumeByTool,temporary,discard,returnFromDiscard,boost,value,log,requireRule,bankCost,hasFoodCost,storeFood,triggerRelic});

function storeFood(s,c){
 requireRule(c&&typeOf(c)==='food'&&c.zone!=='stored'&&(s.phase!=='play'||active(c)),'target');
 if(c.pair)for(const mate of onTable(s).filter(x=>x.pair===c.pair&&x.uid!==c.uid))mate.pair=null;
 for(const zone of ['table','draw','discard','known'])s[zone]=s[zone].filter(uid=>uid!==c.uid);
 unfasten(s,c.uid);c.zone='stored';c.pair=null;c.sealedBy=null;
 if(s.relics.includes('sealclip'))boost(c,2);
 (s.storedFoods??=[]).push({uid:c.uid,kind:c.kind,bonus:c.bonus||0,multiplier:c.multiplier||1});
 log(s,'storeFood',{kind:c.kind,uid:c.uid});syncWraps(s);
}
export function newRun(seed = Date.now(), options = {}) {
  const s = { version: 4, seed: seed >>> 0, rng: seed >>> 0, uid: 0, event: 0, pairId: 0, round: 1, maxRounds: MAX_ROUNDS, target: INITIAL_TARGET, unit: 2, bank: 0, cards: [], relics: ['shaker'], practice: false, log: [], eventCount: 0, goalHistory: [{ round: 1, target: INITIAL_TARGET }], dice: null };
  if(options.economy===2)s.economy=2;
  const route=GROWTH_ROUTES[options.growthRoute];
  if(route){requireRule(CARDS[route.core],'growthContent');s.growth={route:options.growthRoute,curve:options.growthCurve==='classic'?'classic':'rising',seen:{}};s.relics.push(route.relic);}
  const kinds = route?growthDeck(options.growthRoute):['rice','rice','rice','fish','fish','fish','mint','mint','tea','tea','toast','toast','wild','wild','torch','torch','scope','bell','candle','bomb'];
  if(options.rules===2){s.rules=2;s.difficulty=Math.max(0,Math.min(3,Math.trunc(options.difficulty)||0));s.challenge=CHALLENGES[options.challenge]?options.challenge:'standard';s.allowedCards=options.allowedCards?.filter(k=>CARDS[k])||Object.keys(CARDS);s.allowedRelics=(options.allowedRelics||Object.keys(RELICS)).filter(k=>RELICS[k]&&!RELICS[k].retired);}
  if(options.stakesVersion===2&&s.rules===2&&!route){s.stakesVersion=2;s.protectionLeft=s.difficulty<2?1:0;}
  const starter=s.rules===2?starterDeck(kinds,CARDS,usesNewStakes(s)?(s.difficulty===3?2:0):s.difficulty,route?[route.core,route.support]:[]):kinds;
  starter.forEach((k,i) => addCard(s,s.challenge==='barehands'&&CARDS[k].type==='tool'?['rice','fish','mint'][i%3]:k));
  if(s.challenge==='doublebomb')addCard(s,'bomb');
  startRound(s);
  if(route){const index=s.draw.indexOf(1);[s.draw[0],s.draw[index]]=[s.draw[index],s.draw[0]];}
  return s;
}
function syncWraps(s) {
  for (const c of onTable(s)) {
    if (!c.sealedBy || c.ferment !== null) continue;
    const source = card(s, c.sealedBy);
    if (!source || source.zone !== 'table' || source.kind !== 'wrap' || !active(source)) c.sealedBy = null;
  }
}
function discard(s, c) {
  requireRule(c?.zone === 'table', 'target');
  clearConsumption(c);c.zone = 'discard'; s.table = s.table.filter(uid => uid !== c.uid); s.discard.push(c.uid); syncWraps(s);
}
function onFoodConsumed(s,c) {
  night.consumed(s,c);
  recordGrowth(s,'consume',{uid:c.uid},log);
  if(triggerRelic(s,'silverfork'))gainBank(s,1);
  const n = onTable(s).filter(x => active(x) && x.kind === 'dishwasher').length;
  if (n) { s.freePayments += n; log(s, 'tickets', { n }); }
  for(const x of live(s).filter(x=>x.kind==='choppingboard'))boost(x,2);
  if(c.kind==='egg'){for(let i=0;i<1+enchantAmount(c,'consumeAmount');i++)temporary(s,'rice');log(s,'generate',{kind:'rice'});}
  if(c.kind==='pear')peek(s,2+enchantAmount(c,'consumeAmount'));
  if(s.growth&&triggerRelic(s,'heirloomladle'))returnFromDiscard(s,c);
}
function clear(s, uid) {
  const c = card(s, uid); requireRule(c?.zone === 'table' && typeOf(c) === 'trouble' && active(c), 'target');
  discard(s, c); log(s, 'clear', { kind: c.kind });
  recordGrowth(s,'clear',{uid:c.uid},log);
  if(s.growth&&!c.temporary&&triggerRelic(s,'bristlebrush')){s.cards=s.cards.filter(x=>x.uid!==c.uid);s.discard=s.discard.filter(uid=>uid!==c.uid);log(s,'growthPrune',{kind:c.kind});}
  if(triggerRelic(s,'linen'))peek(s,1);
  for(const source of live(s).filter(x=>x.kind==='spicejar')){const t=foods(s)[0];if(t)boost(t,1);}
}
function peek(s, n, offset=0) {
  if (!s.clearSight&&hasTrouble(s, 'noise')) { log(s, 'blockedPeek'); return; }
  if(s.draw.length>offset&&triggerRelic(s,'pocketwatch'))n++;
  const count = !s.clearSight&&hasTrouble(s, 'fog') ? Math.min(1, n) : n;
  const seen = s.draw.slice(offset,offset+count); s.known = [...new Set([...s.known, ...seen])]; log(s, 'peek', { n: seen.length, offset });
}
function pay(s, uid, source) {
  const c = payableFoods(s).find(c => c.uid === uid); requireRule(c, 'foodCost');
  if (c.enchantment === 'boiled' && !c.boiledUsed) { c.boiledUsed = true; log(s, 'boiled', { kind: c.kind }); return; }
  if(consumeByTool(s, source, c))log(s, 'pay', { kind: c.kind });
}
export const pairTargetLimit=(s,ids)=>1+ids.reduce((n,uid)=>n+enchantAmount(card(s,uid),'pairTargets'),0);
export function pairEffectTargets(s,kind,ids=[]){
  if(s.relics.includes('silencer')||hasTrouble(s,'cold'))return [];
  return kind==='rice'?troubles(s):kind==='mint'?tiredTools(s):kind==='toast'?toolConsumedFoods(s):kind==='hazelnut'?matchingFoods(s,ids):kind==='cheese'?foods(s).filter(c=>!ids.includes(c.uid)):[];
}
function pairEffect(s, kind, target, except = null, pairCards=[]) {
  const more=pairCards.reduce((n,c)=>n+enchantAmount(c,'pairAmount'),0),targets=Array.isArray(target)?target:target==null?[]:[target];
  requireRule(new Set(targets).size===targets.length&&targets.length<=1+pairCards.reduce((n,c)=>n+enchantAmount(c,'pairTargets'),0),'target');
  if(s.relics.includes('silencer'))return false;
  if(hasTrouble(s,'cold'))return false;
  if(night.pair(s,kind))return true;
  if(kind==='dumpling'){pairCards.forEach(c=>boost(c,2+more));return true;}
  if(kind==='mushroom'){troubles(s).filter(c=>c.kind==='residue').forEach(c=>clear(s,c.uid));return true;}
  if(kind==='lemon'){s.clearSight=true;log(s,'clearSight');return true;}
  if(kind==='shrimp'){discover(s,'tool');return true;}
  if(kind==='noodle'){s.toolScoring=Number(s.toolScoring||0)+1+more;log(s,'toolScoring');return true;}
  if(kind==='cheese'&&targets.length){const c=foods(s).find(c=>c.uid===targets[0]);requireRule(c,'target');for(let i=0;i<1+more;i++)temporary(s,c.kind);log(s,'generate',{kind:c.kind});return true;}
  if(kind==='chili'){tiredTools(s).forEach(c=>c.tapped=false);log(s,'allReady');return true;}
  if(kind==='tofu'){s.extraFood=(s.extraFood||0)+1+more;log(s,'foodQueued');return true;}
  if(kind==='sushi'){for(let i=0;i<1+more;i++)temporary(s,'fish');log(s,'generate',{kind:'fish'});return true;}
  if (kind === 'popcorn') { for(let i=0;i<1+more;i++)temporary(s, 'popcorn'); log(s, 'generate', { kind: 'popcorn' }); return true; }
  if (kind === 'fish') { peek(s, 1+more); return true; }
  if (kind === 'tea') { s.freePayments += 1+more; log(s, 'tickets', { n: 1+more }); return true; }
  if (kind === 'ginger') { s.relicUsed = {}; log(s, 'relicReady'); return true; }
  if (kind === 'toast' && targets.length) { targets.forEach(uid=>reclaim(s,uid));return true; }
  if (kind === 'rice' && targets.length) { targets.forEach(uid=>clear(s,uid));return true; }
  if(kind==='mint'&&targets.length){for(const uid of targets){const c=tiredTools(s,except).find(c=>c.uid===uid);requireRule(c,'target');c.tapped=false;log(s,'ready',{kind:c.kind});}return true;}
  if(kind==='hazelnut'&&targets.length){
    for(const uid of targets){
      const target=matchingFoods(s).find(c=>c.uid===uid);requireRule(target,'target');
      const found=card(s,s.draw.find(id=>card(s,id).kind===target.kind));
      unfasten(s,found.uid);s.draw=s.draw.filter(id=>id!==found.uid);s.known=s.known.filter(id=>id!==found.uid);
      found.zone='table';found.entered=++s.eventCount;s.table.push(found.uid);
      log(s,'seekPair',{kind:found.kind,uid:found.uid});
    }return true;
  }
  return false;
}

function triggerRelic(s,id){
 s.relicProgress??={};if(!s.relics.includes(id)||s.relicProgress[id])return false;
 s.relicProgress[id]=true;log(s,'relicTrigger',{relic:id});return true;
}
function gainBank(s,n){n=bankGain(s,n);s.bank+=n;log(s,'gainBank',{n});}
function spendBank(s,n){
 s.bank-=n;s.bankSpent=(s.bankSpent||0)+n;log(s,'spendPoints',{n});recordGrowth(s,'spend',{n},log);
 if(s.growth&&triggerRelic(s,'pawnreceipt'))gainBank(s,Math.floor(n/2));
}
export function relicProblem(s,id){
 const r=RELICS[id];
 if(s.phase!=='play'||!r||r.mode!=='active'||!s.relics.includes(id)||s.relicUsed[id])return 'relic';
 if(s.bank<r.cost)return 'pointsCost';
 if(id==='shaker'&&!s.flips)return 'first';
 if(id==='recycler'&&!toolConsumedFoods(s).length)return 'noPaid';
 if(id==='splitter'&&!onTable(s).some(c=>c.pair))return 'noTarget';
 if(id==='polishingstone'&&!tiredTools(s).length)return 'noTired';
 if(id==='trashpass'&&!troubles(s).length)return 'noTrouble';
 if(id==='oldkey'&&!s.draw.length)return 'empty';
 if(id==='oldkey'&&!s.clearSight&&hasTrouble(s,'noise'))return 'noPeek';
 return null;
}

export function toolProblem(s, c) {
  if (!c || c.zone !== 'table' || !active(c)) return 'sealed';
  if(c.kind==='packingcord'&&(s.sealedParcel||s.parcelUsedRound===s.round||!parcelFoods(s,CARDS).length||!parcelTools(s,CARDS,c.uid).length))return 'noTarget';
  const nightProblem=night.toolProblem(s,c);if(nightProblem)return nightProblem;
  if (hasTrouble(s, 'oil')) return 'oil';
  if (c.tapped) return 'tapped';
  if(c.kind==='cardcutter'&&drawUnits(s).length<2)return 'noTarget';
  if (bankCost(c,CARDS) > s.bank) return 'pointsCost';
  if(CARDS[c.kind].target&&!effectTargets(s,c).length)return 'noTarget';
  if(c.kind==='compostfork'&&!troubles(s).some(x=>x.kind==='residue'))return 'noTarget';
  if(c.kind==='fan'&&!troubles(s).some(x=>['fog','noise'].includes(x.kind)))return 'noTarget';
  if(c.kind==='washbucket'&&!troubles(s).length)return 'noTrouble';
  if(c.kind==='magnifier'&&s.draw.length<3)return 'noTarget';
  if(c.kind==='tastingfork'&&discoveryPool(s,'food',true).length<(s.relics.includes('neonsign')?4:3))return 'noTarget';
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
  const c = toolConsumedFoods(s).find(c => c.uid === uid); requireRule(c, 'target'); returnFromDiscard(s,c);
}
function returnFromDiscard(s,c,exhausted=false){s.discard=s.discard.filter(uid=>uid!==c.uid);c.zone='table';clearConsumption(c);c.tapped=exhausted;c.entered=++s.eventCount;s.table.push(c.uid);log(s,'recover',{kind:c.kind});night.reclaimed(s,c);}
function discoveryPool(s,pool,absent=false){return Object.keys(CARDS).filter(k=>CARDS[k].type===pool&&!CARDS[k].tokenOnly&&(s.growth||!CARDS[k].experimental)&&(!s.allowedCards||s.allowedCards.includes(k))&&(!absent||!onTable(s).some(c=>c.kind===k)));}
function discover(s,pool,absent=false){s.pending={type:'discover',pool,offers:shuffle(s,discoveryPool(s,pool,absent)).slice(0,s.relics.includes('neonsign')?4:3)};}
function extraTool(s,c,target){
 const more=enchantAmount(c,'toolAmount'),def=CARDS[c.kind],t=def.target?effectTargets(s,c).find(x=>x.uid===target):null;
 if(def.target)requireRule(t,'target');
 night.use(s,c,t);
 if(c.kind==='grill'){const n=value(s,t);consumeByTool(s,c,t);boost(c,n*2);temporary(s,'residue');log(s,'generate',{kind:'residue'});}
 if(c.kind==='steamer'){t.keepOnce=true;log(s,'protectedFood',{kind:t.kind});}
 if(c.kind==='cleaver'){const pair=onTable(s).filter(x=>x.pair===t.pair);requireRule(pair.length===2,'target');pair.forEach(x=>consumeByTool(s,c,x));for(let i=0;i<3+more;i++)temporary(s,'rice');log(s,'generate',{kind:'rice',n:3});}
 if(c.kind==='scoop')returnFromDiscard(s,t);
 if(c.kind==='compostfork'){const list=troubles(s).filter(x=>x.kind==='residue');list.forEach(x=>consumeByTool(s,c,x));boost(c,list.length*2);}
 if(c.kind==='stamp'){const pair=onTable(s).filter(x=>x.pair===t.pair);requireRule(pair.length===2,'target');for(const x of pair){x.pair=null;x.pairedOnce=false;x.pairedAs=null;}log(s,'pairReset',{kind:t.kind});}
 if(c.kind==='magnifier')peek(s,1,2);
 if(c.kind==='fan')troubles(s).filter(x=>['fog','noise'].includes(x.kind)).forEach(x=>clear(s,x.uid));
 if(c.kind==='washbucket')troubles(s).forEach(x=>clear(s,x.uid));
 if(c.kind==='tray'){s.table=s.table.filter(uid=>uid!==t.uid);s.draw.push(t.uid);t.zone='deck';s.known=[...new Set([...s.known,t.uid])];syncWraps(s);log(s,'bottom',{kind:t.kind});}
 if(c.kind==='cardcutter'){const units=drawUnits(s),j=1+Math.floor(random(s)*(units.length-1));[units[0],units[j]]=[units[j],units[0]];s.draw=units.flat();s.known=[];log(s,'cutRandom');}
 if(c.kind==='menu')allFood(s).filter(x=>x.kind===t.kind).forEach(x=>boost(x,1+more));
 if(c.kind==='magnet')returnFromDiscard(s,t,true);
 if(c.kind==='whetstone'){t.extraUses=1;log(s,'doubleUse',{kind:t.kind});}
  if(c.kind==='ladle'){t.temporary=false;t.original=t.kind;log(s,'permanentFood',{kind:t.kind});}
  if(c.kind==='mincer'){consumeByTool(s,c,t);for(let i=0;i<2+more;i++)temporary(s,'mince');}
  if(c.kind==='doughpress')for(let i=0;i<1+more;i++)temporary(s,'sourdough');
  if(c.kind==='sproutbox')for(let i=0;i<2+more;i++)temporary(s,'sprouts');
  if(c.kind==='tastingfork')discover(s,'food',true);
  if(c.kind==='washpress'){clear(s,t.uid);for(let i=0;i<1+more;i++)temporary(s,'sprouts');}
  if(c.kind==='cellarpress'){
    const level=t.growthLevel||0,xp=t.growthXP||0,kinds=[...(t.growthKinds||[])],copy=temporary(s,t.kind);
    if(growthRoute(t)&&t.kind===t.original){copy.growthLevel=level;copy.growthXP=xp;copy.growthKinds=kinds;}
  }
}
function resolvePair(s,a){
    const first = card(s, a.ids?.[0]), second = card(s, a.ids?.[1]);
    requireRule(first?.zone === 'table' && second?.zone === 'table', 'target');
    const kind = pairKind(first, second); requireRule(kind && partners(s,first.uid).some(c=>c.uid===second.uid), 'pair');
    const listeners = onTable(s).filter(c=>active(c)&&['candle','relay','houselamp'].includes(c.kind)).map(c=>({uid:c.uid,kind:c.kind}));
    first.pair = second.pair = ++s.pairId; first.pairedOnce = second.pairedOnce = true;
    s.lastFoodPair=kind;
    first.pairedAs=second.pairedAs=kind;
    if(s.relics.includes('silencer')){log(s,'pair',{kind,silent:true});return s;}
    night.paired(s,[first,second]);
    recordGrowth(s,'pair',{ids:[first.uid,second.uid],kind},log);
    if(s.growth&&triggerRelic(s,'proofingcloth'))temporary(s,'wild');
    if(triggerRelic(s,'matchbox'))[first,second].forEach(c=>boost(c,1));
    if(s.relics.includes('shellpair')&&[first,second].some(c=>c.kind==='wild'))[first,second].filter(c=>c.kind!=='wild').forEach(c=>boost(c,1));
    log(s, 'pair', { kind });
    const effect={type:'pairEffect',ids:[first.uid,second.uid],kind,listeners};
    if(a.chooseEffect&&pairEffectTargets(s,kind,effect.ids).length){s.pending=effect;return;}
    finishPair(s,effect,a.targets??a.target);
}
function finishPair(s,{ids,kind,listeners},targets){
    const [first,second]=ids.map(uid=>card(s,uid));
    if(pairEffect(s,kind,targets,null,[first,second]))s.lastPair=kind;
    const fried = [first, second].filter(c => c.enchantment === 'fried'&&!FRIED[c.kind]).length;
    if (fried) { s.freePayments += fried; log(s, 'tickets', { n: fried }); }
    for (const source of listeners) {
      if(source.kind==='candle')peek(s,1);
      else if(source.kind==='houselamp'){const trouble=troubles(s).sort((a,b)=>(a.entered||0)-(b.entered||0))[0];if(trouble){clear(s,trouble.uid);log(s,'houseLamp',{source:source.uid,kind:trouble.kind});}}
      else {s.freePayments++;log(s,'tickets',{n:1});}
    }
    if(s.relics.includes('recipebook')){const kinds=s.relicProgress.pairKinds??=[];if(!kinds.includes(kind))kinds.push(kind);if(kinds.length>=2&&triggerRelic(s,'recipebook')){const t=tiredTools(s).sort((a,b)=>a.entered-b.entered)[0];if(t){t.tapped=false;log(s,'ready',{kind:t.kind});}}}
    if(s.growth&&s.relics.includes('banquetmenu')){
      const kinds=s.relicProgress.banquetKinds??=[];if(!kinds.includes(kind))kinds.push(kind);
      if(kinds.length>=3&&triggerRelic(s,'banquetmenu'))troubles(s).forEach(c=>clear(s,c.uid));
    }
}
function drainAutoPairs(s){
 while(s.autoPairQueue?.length&&!s.pending&&s.phase==='play'){
  const uid=s.autoPairQueue.shift(),c=card(s,uid);
  if(!s.autoPairEnabled||!s.relics.includes('autotongs')||c?.zone!=='table'||typeOf(c)!=='food')continue;
  const options=partners(s,uid).sort((a,b)=>Number(b.kind===c.kind)-Number(a.kind===c.kind)||(a.entered||0)-(b.entered||0));
  const other=options[0];if(!other)continue;
  const kind=pairKind(c,other),targets=pairEffectTargets(s,kind,[uid,other.uid]);
  const picks=targets.sort((a,b)=>(a.entered||0)-(b.entered||0)).slice(0,pairTargetLimit(s,[uid,other.uid])).map(c=>c.uid);
  resolvePair(s,{ids:[uid,other.uid],targets:picks});log(s,'autoPair',{uids:[uid,other.uid],kind});
 }
}
function reveal(s) {
  requireRule(s.draw.length,'empty');
  s.panRescue=null;s.beginnerRescue=null;
  const ids=drawUnits(s)[0],bundle=unfasten(s,ids[0]);
  if(bundle)log(s,'unstaple',{n:ids.length,uids:ids,id:bundle.id});
  for(const uid of ids){requireRule(s.draw[0]===uid,'stapleOrder');revealOne(s);if(s.phase==='lost')break;}
}
function returnRescuedBomb(s,c,source){
  c.zone='deck';s.draw.push(c.uid);shuffleDraw(s);
  s.known=[];s.lastReveal=null;s.foodStreak=0;s.autoPairQueue=[];
  s[source==='pan'?'panRescue':'beginnerRescue']={uid:c.uid,round:s.round};
  log(s,source==='pan'?'panSave':'beginnerSave',{uid:c.uid});
}
function revealOne(s) {
  requireRule(s.draw.length, 'empty'); const uid=s.draw.shift(), c=card(s,uid);
  s.known=s.known.filter(id=>id!==uid); s.flips++;
  for(const x of live(s).filter(x=>x.kind==='icecream'))x.melt=(x.melt||0)+1;
  if(c.kind==='bomb'){
    if(protectionAvailable(s)){
      s.protectionLeft=0;returnRescuedBomb(s,c,'beginner');return;
    }
    if(s.relics.includes('pangift')){
      s.relics=s.relics.filter(id=>id!=='pangift');
      returnRescuedBomb(s,c,'pan');return;
    }
    c.zone='table';s.table.push(uid);s.phase='lost';s.reason='bomb';s.autoPairQueue=[];log(s,'bomb');return;
  }
  const kind=c.kind, type=typeOf(c);
  c.zone='table';c.entered=++s.eventCount;s.table.push(uid);log(s,'reveal',{kind,source:uid,...(revealFreshCard(s,c)?{fresh:true}:{})});
  s.lastReveal={uid,kind,type,number:s.flips};
  night.revealed(s,c);
  if (type === 'tool' && hasTrouble(s,'rust')) { c.tapped = true; log(s,'rusted',{kind}); }
  if (kind === 'wish') { temporary(s,'wild');log(s,'gift'); }
  if(type==='food'){
    s.foodStreak=(s.foodStreak||0)+1;
    if(s.relics.includes('streakcounter')&&s.foodStreak%4===0){s.tableDoublings=(s.tableDoublings||0)+1;log(s,'multiply',{source:'streakcounter',factor:2});}
    for(const source of live(s).filter(x=>['metronome','sweeper'].includes(x.kind))){
      source.revealTicks=(source.revealTicks||0)+1;
      if(source.revealTicks%(source.enchantment==='smoked'?2:3))continue;
      if(source.kind==='metronome'){s.metronomeStacks=(s.metronomeStacks||0)+1;log(s,'multiply',{source:source.uid,factor:1.2});}
      else {const t=troubles(s).sort((a,b)=>a.entered-b.entered)[0];if(t)clear(s,t.uid);}
    }
  }else s.foodStreak=0;
  if(kind==='coffee')for(const t of tiredTools(s).slice(0,1+enchantAmount(c,'revealAmount'))){t.tapped=false;log(s,'ready',{kind:t.kind});}
  if(type==='food'&&s.autoPairEnabled&&s.relics.includes('autotongs')){(s.autoPairQueue??=[]).push(c.uid);drainAutoPairs(s);}
}
function awardAutoPair(s){
 if(s.rules!==2||s.practice||s.autoPairRewardClaimed)return;
 s.autoPairRewardClaimed=true;
 if(!s.relics.includes('autotongs')){s.relics.push('autotongs');s.autoPairEnabled=false;log(s,'autoPairReward');}
}
function stop(s, carryUid) {
  requireRule(s.flips > 0, 'first');
  let carry = null;
  if (carryUid != null) {
    requireRule(s.relics.includes('lunchbox') && (s.endless || s.round < s.maxRounds), 'relic'); carry = foods(s).find(c => c.uid === carryUid && !c.temporary); requireRule(carry && s.cards.some(c => c.uid !== carryUid && c.original !== 'bomb' && !c.temporary), 'target');
  }
  s.roundEarned = cashValue(s, carry?.uid); s.bank += s.roundEarned; s.carry = carry?.uid ?? null;
  if(economyEnabled(s)){
    // cashValue is now in the bank; do not count the table twice.
    if(s.rewardGate&&s.bank-s.rewardGate.bankStart>=s.rewardGate.goal)s.rewardGate.unlocked=true;
    s.roundRewardEligible=!!s.rewardGate?.unlocked;
  }
  log(s, 'cash', { n: s.roundEarned });
  const target=effectiveTarget(s);
  if (s.bank < target) { s.phase = 'lost'; s.reason = 'target'; return; }
  night.cash(s);
  s.reservedTools=reserveTools(s).map(c=>c.uid);
  for(const uid of s.reservedTools)log(s,'toolReserved',{kind:card(s,uid).kind});
  if(s.bank===target&&s.relics.includes('scale'))gainBank(s,4);
  if(s.tableCondition?.round===s.round&&s.tableCondition.wager){const ids=shuffle(s,prizePool(s,RELICS)).slice(0,s.tableCondition.prizes||1);for(const id of ids){s.relics.push(id);log(s,'wagerReward',{relic:id});}if(ids.length)s.wagerPrize={round:s.round,id:ids[0],ids};s.tableCondition=null;}
  s.tableCondition=null;
  if(s.endless){openEndlessTable(s);return;}
  if (s.round >= s.maxRounds) { if(s.round===MAX_ROUNDS)awardAutoPair(s);s.phase = 'won'; s.reason = 'complete'; return; }
  s.phase = s.round===MIDNIGHT_TABLE-1&&ruleDiceCount(s)>1?'midnight':'stakes'; s.dice = { rolls: [], result: null, count:ruleDiceCount(s) };
}
function openEndlessTable(s){
  s.target=nextTarget(s);s.dice=null;s.nextBoon=null;s.reason=null;
  s.goalHistory.push({round:s.round+1,target:s.target,endless:true});
  openRoute(s);
}
export function canEnterEndless(s){return !!s&&!s.practice&&!Number.isInteger(s.lesson)&&!s.endless&&s.phase==='won'&&s.reason==='complete'&&s.round===MAX_ROUNDS;}
export function routeTargets(s, id) {
  const route = ROUTES[id];
  return s.cards.filter(c => !c.temporary && (route?.type === 'enchant'
    ? canEnchant(c,id,CARDS)
    : route?.type === 'remove' && c.original !== 'bomb'));
}
function openRoute(s) {
  s.phase = 'route';
  const enchants = Object.keys(ENCHANTMENTS).filter(id => routeTargets(s, id).length);
  const events = ['lantern', 'tea', 'helper'];
  const first = enchants.length ? shuffle(s, enchants)[0] : shuffle(s, events)[0];
  const canPrune = s.round % 3 === 2 && s.bank >= ROUTES.prune.cost && routeTargets(s, 'prune').length;
  const second = canPrune ? 'prune' : shuffle(s, events.filter(id => id !== first))[0];
  s.routeOffers = [first, second];
  if(s.growth&&s.round%2===1&&stapleCandidates(s).length>=STAPLE_SIZE)s.routeOffers[0]='staple';
  if(!s.growth&&s.rules===2&&s.round%3===2&&eligibleDealerRoutes(s).includes('duplicate'))s.routeOffers[0]='duplicate';
  if(s.growth){
    const special=['mystery',...eligibleDealerRoutes(s)];
    s.routeOffers[1]=shuffle(s,special)[0];
  }
  if(s.rules===2&&!s.growth&&!s.practice&&!canPrune){const services=eligibleDealerRoutes(s).filter(id=>['coldlocker','menuchange','closingmeal'].includes(id));if(services.length&&random(s)<.35)s.routeOffers[1]=shuffle(s,services)[0];}
  if(economyEnabled(s)){
    const extra=['press','mystery',...eligibleDealerRoutes(s),...(s.bank>=4&&stapleCandidates(s).length>=3?['staple']:[])].filter(id=>id!==s.routeOffers[0]&&(id!=='press'||pressCandidates(s,CARDS).some(c=>pressCandidates(s,CARDS,c).length)));
    if(extra.length&&random(s)<.5)s.routeOffers[1]=shuffle(s,extra)[0];
  }
  // Pan never enters a standard reward pool; this is the only offer route.
  if(s.rules===2&&!s.practice&&!s.growth&&s.round>=3&&s.round<10&&s.bank>=50&&!s.relics.includes('pangift')&&random(s)<.035)s.routeOffers[1]='pan';
  s.skipOffer=null;offerSkipReward(s);
}
export function skipRewardPool(s){
 const ordinary=s.cards.filter(c=>!c.temporary&&c.original!=='bomb'),enchantable=ordinary.filter(c=>Object.keys(ENCHANTMENTS).some(id=>canEnchant(c,id,CARDS)));
 return Object.keys(SKIP_REWARDS).filter(id=>id==='prune'?ordinary.length>2:id==='enchant'?enchantable.length>=2:id==='staple'?stapleCandidates(s).length>=STAPLE_SIZE:id==='relic'?prizePool(s,RELICS).length>0:id==='duplicate'?ordinary.length>0:true);
}
function offerSkipReward(s){
 if(!canSkipTable(s)||s.skipOffer?.round===s.round+1)return;
 s.skipOffer={round:s.round+1,pool:skipRewardPool(s),id:null};
}
function copyPermanent(s,source){
 const copy=addCard(s,source.original);resetCard(copy);
 for(const key of ['enchantment','growthLevel','growthXP','growthKinds','seasoned','pressWeight'])if(source[key]!=null)copy[key]=cloneState(source[key]);
 return copy;
}
export function eligibleDealerRoutes(s){return ['trade','pawn','wager','duplicate','coldlocker','menuchange','closingmeal'].filter(id=>id==='coldlocker'?s.bank>=3&&permanentFoods(s,CARDS).some(c=>c.zone!=='stored'&&typeOf(c)==='food'):id==='menuchange'?s.bank>=4&&reprintTargets(s).length>0&&tradePool(s).filter(k=>CARDS[k].type==='food'&&reprintTargets(s,k).length).length>=3:id==='closingmeal'?permanentFoods(s,CARDS).length>=2&&prizePool(s,RELICS).length>0:id==='duplicate'?s.bank>=6&&s.cards.some(c=>!c.temporary&&c.original!=='bomb'):id==='trade'?permanentFoods(s,CARDS).length>=2&&tradePool(s).length>=3:id==='pawn'?s.relics.length>0:prizePool(s,RELICS).length>0&&s.bank<s.target*2);}
export function reprintTargets(s,kind){return permanentFoods(s,CARDS).filter(c=>c.zone!=='stored'&&(!kind||c.original!==kind&&(!c.enchantment||canEnchant({...c,original:kind,kind,enchantment:null},c.enchantment,CARDS))));}
function tradePool(s){return Object.keys(CARDS).filter(k=>['food','tool','device'].includes(CARDS[k].type)&&!CARDS[k].tokenOnly&&(s.growth||!CARDS[k].experimental)&&(!s.allowedCards||s.allowedCards.includes(k)));}
function removePermanent(s,target){
 requireRule(target&&!target.temporary&&target.original!=='bomb','target');
 s.cards=s.cards.filter(c=>c.uid!==target.uid);
 for(const zone of ['table','draw','discard','known'])s[zone]=s[zone].filter(uid=>uid!==target.uid);
 if(s.carry===target.uid)s.carry=null;tidyStaples(s);
  if(s.reservedTools)s.reservedTools=s.reservedTools.filter(uid=>uid!==target.uid);
  if(s.storedFoods)s.storedFoods=s.storedFoods.filter(entry=>entry.uid!==target.uid);
  if(s.sealedParcel?.uids.includes(target.uid)){for(const uid of s.sealedParcel.uids){const c=card(s,uid);if(c&&c.zone==='parcel'){c.zone='deck';s.draw.push(uid);}}s.sealedParcel=null;}
}
function beginEncounter(s,source){
 let id=source;
 if(source==='mystery'){
  const good=['lantern','tea','helper',...Object.keys(ENCHANTMENTS).filter(k=>routeTargets(s,k).length),...eligibleDealerRoutes(s).filter(k=>k!=='wager')];
  if(s.bank>=4&&routeTargets(s,'prune').length)good.push('prune');
  const bad=['levy','pressure','cap',...(permanentFoods(s,CARDS).length>1?['foodLoss']:[]),...(permanentTools(s,CARDS).length?['toolLoss']:[])];
  id=shuffle(s,random(s)<.4?bad:good)[0];
 }
 const e=s.encounter={id,source,quote:id==='pan'?50:dealerQuote(s),applied:!!SETBACKS[id]};s.phase='encounter';
 if(id==='trade')e.offers=shuffle(s,tradePool(s)).slice(0,3);
 if(id==='menuchange')e.offers=shuffle(s,tradePool(s).filter(k=>CARDS[k].type==='food'&&reprintTargets(s,k).length)).slice(0,3);
 if(id==='closingmeal')e.prize=shuffle(s,prizePool(s,RELICS))[0];
 if(id==='pawn')e.pledgeOffers=shuffle(s,prizePool(s,RELICS)).slice(0,3);
 s.eventReceipt=null;
 if(e.applied){
  const receipt={id,source,round:s.round,removed:[]};
  if(id==='levy'){receipt.amount=Math.min(s.bank,Math.max(4,Math.ceil(s.bank*.15)));s.bank-=receipt.amount;}
  if(id==='foodLoss'||id==='toolLoss'){const target=shuffle(s,id==='foodLoss'?permanentFoods(s,CARDS):permanentTools(s,CARDS))[0];receipt.removed.push({...target});removePermanent(s,target);}
  if(id==='pressure'||id==='cap')s.tableCondition={id,round:s.round+1,double:id==='pressure',cap:id==='cap',wager:false};
  s.eventReceipt=receipt;log(s,'dealerEvent',{route:id,amount:receipt.amount||0,kind:receipt.removed[0]?.original||null});
 }
}
function resolveEncounter(s,a){
 const e=s.encounter;requireRule(e,'phase');
 if(a.type==='haggleEncounter'){
  requireRule(e.id==='pan'&&!e.haggled,'phase');
  e.haggled=true;e.quote=random(s)<.5?25:100;
  log(s,'panHaggle',{price:e.quote});return;
 }
 if(a.type==='leaveEncounter'){requireRule(!e.applied,'phase');s.encounter=null;openDraft(s);return;}
 requireRule(a.type==='resolveEncounter','phase');
 const receipt=s.eventReceipt||{id:e.id,source:e.source,round:s.round,removed:[]};
 const upgraded=a.bribe===true;
 if(upgraded){const offer=bribeOffer(e.id,ENCHANTMENTS,s);requireRule(offer&&s.bank>=offer.cost+eventBaseCost(e),'pointsCost');spendBank(s,offer.cost);receipt.bribe=offer.cost;receipt.upgraded=true;}
 if(e.applied&&upgraded){
   if(e.id==='levy'){receipt.refund=receipt.amount;s.bank+=receipt.refund;}
   if(e.id==='pressure'||e.id==='cap')s.tableCondition=null;
   if(e.id==='foodLoss'||e.id==='toolLoss'){const recovered=copyPermanent(s,receipt.removed[0]);receipt.gained=recovered.original;receipt.copied={...recovered};receipt.recovered=true;}
 }
 if(!e.applied){
  if(e.id==='pan'){
   requireRule(s.bank>=e.quote&&!s.relics.includes('pangift'),'pointsCost');
   spendBank(s,e.quote);s.relics.push('pangift');receipt.relic='pangift';receipt.amount=e.quote;
   if(upgraded)s.nextBribePeek=3;
  }else if(e.id==='press'){
   requireRule(Array.isArray(a.uids)&&a.uids.length===2&&a.uids[0]!==a.uids[1],'target');
   const main=pressCandidates(s,CARDS).find(c=>c.uid===a.uids[0]),other=main&&pressCandidates(s,CARDS,main).find(c=>c.uid===a.uids[1]);requireRule(main&&other,'target');
   const weight=pressedWeight(main,other,upgraded);requireRule(validPressWeight(weight),'target');
   receipt.inputs=[{...main},{...other}];main.pressWeight=weight;removePermanent(s,other);receipt.pressed={...main};receipt.gained=main.original;
  }else if(e.id==='coldlocker'){
   const ids=upgraded?a.uids:[a.uid],candidates=permanentFoods(s,CARDS).filter(c=>c.zone!=='stored'&&c.zone!=='parcel'&&typeOf(c)==='food');
   requireRule(s.bank>=3&&Array.isArray(ids)&&ids.length===(upgraded?2:1)&&new Set(ids).size===ids.length&&ids.every(uid=>candidates.some(c=>c.uid===uid)),'target');
   spendBank(s,3);ids.forEach(uid=>storeFood(s,card(s,uid)));receipt.stored=ids[0];receipt.storedIds=[...ids];receipt.amount=3;
  }else if(e.id==='menuchange'){
   const target=reprintTargets(s,a.kind).find(c=>c.uid===a.uid);requireRule(s.bank>=4&&target&&e.offers.includes(a.kind),'target');
   spendBank(s,4);receipt.changedFrom=target.original;target.original=a.kind;target.kind=a.kind;target.bonus=0;
   for(const key of ['seasoned','growthLevel','growthXP','growthKinds'])delete target[key];
   receipt.gained=a.kind;receipt.amount=4;
   if(upgraded)receipt.copied={...copyPermanent(s,target)};
  }else if(e.id==='closingmeal'){
   const candidates=permanentFoods(s,CARDS),n=upgraded?1:2;requireRule(Array.isArray(a.uids)&&a.uids.length===n&&new Set(a.uids).size===n&&a.uids.every(uid=>candidates.some(c=>c.uid===uid))&&prizePool(s,RELICS).includes(e.prize),'target');
   for(const uid of a.uids){const c=card(s,uid);receipt.removed.push({...c});removePermanent(s,c);}
   s.relics.push(e.prize);receipt.relic=e.prize;
  }else if(e.id==='trade'){
   const n=upgraded?1:2;requireRule(Array.isArray(a.uids)&&a.uids.length===n&&new Set(a.uids).size===n&&e.offers.includes(a.kind),'target');
   const foods=permanentFoods(s,CARDS);requireRule(a.uids.every(uid=>foods.some(c=>c.uid===uid)),'target');
   for(const uid of a.uids){const c=card(s,uid);receipt.removed.push({...c});removePermanent(s,c);}
   receipt.gained=a.kind;addCard(s,a.kind);
  }else if(e.id==='duplicate'){
   const source=card(s,a.uid);requireRule(s.bank>=6&&source&&!source.temporary&&source.original!=='bomb','target');
   spendBank(s,6);const copy=copyPermanent(s,source);
   receipt.gained=copy.original;receipt.copied={...copy};receipt.amount=6;
   if(upgraded){copyPermanent(s,source);receipt.copies=2;}
  }else if(e.id==='pawn'){
   requireRule(s.relics.includes(a.relic),'relic');
   if(upgraded)requireRule(e.pledgeOffers?.includes(a.prize)&&prizePool(s,RELICS).includes(a.prize),'relic');
   s.relics=s.relics.filter(id=>id!==a.relic);receipt.relic=a.relic;receipt.amount=upgraded?0:e.quote;s.bank+=receipt.amount;
   if(upgraded){s.relics.push(a.prize);receipt.receivedRelic=a.prize;}
  }else if(e.id==='wager'){
   requireRule(eligibleDealerRoutes(s).includes('wager'),'route');s.tableCondition={id:'wager',round:s.round+1,double:true,cap:false,wager:true,prizes:upgraded?2:1};
  }else if(economyEnabled(s)||upgraded){
   const type=ROUTES[e.id]?.type;
   if(type==='event'){s.nextRouteReward=e.id;s.nextRouteUpgrade=upgraded;}
   else if(type==='staple'){
    const candidates=stapleCandidates(s);requireRule(candidates.length>=3&&s.bank>=4,'target');spendBank(s,4);s.stapleId=(s.stapleId||0)+1;
    (s.staples??=[]).push({id:s.stapleId,uids:shuffle(s,candidates.map(c=>c.uid)).slice(0,3),readyRound:s.round+1,...(upgraded?{permanent:true}:{})});receipt.staple=s.stapleId;
   }else{
    const ids=upgraded?a.uids:[a.uid],candidates=routeTargets(s,e.id);
    requireRule(Array.isArray(ids)&&ids.length===(upgraded?2:1)&&new Set(ids).size===ids.length&&ids.every(uid=>candidates.some(c=>c.uid===uid)),'target');
    if(type==='remove'){requireRule(s.bank>=4,'routeCost');spendBank(s,4);for(const uid of ids){receipt.removed.push({...card(s,uid)});removePermanent(s,card(s,uid));}}
    else {requireRule(type==='enchant','route');for(const uid of ids)card(s,uid).enchantment=e.id;receipt.enchanted=ids.map(uid=>({...card(s,uid)}));}
   }
  }else{
   const removed=e.id==='prune'?[{...card(s,a.uid)}]:[];s.encounter=null;s.routeOffers=[e.id,e.id==='tea'?'helper':'tea'];chooseRoute(s,{type:'chooseRoute',id:e.id,uid:a.uid});s.eventReceipt={...receipt,removed};return;
  }
  s.eventReceipt=receipt;log(s,'dealerEvent',{route:e.id,amount:receipt.amount||0,kind:receipt.gained||null,relic:receipt.relic||null});
 }
 (s.routeHistory??=[]).push({round:s.round,id:e.source,outcome:e.id});s.encounter=null;openDraft(s);
}
function chooseRoute(s, a) {
  requireRule(s.routeOffers?.includes(a.id), 'route');
  const route = ROUTES[a.id];
  if(economyEnabled(s)){
   if(a.id==='press')requireRule(pressCandidates(s,CARDS).some(c=>pressCandidates(s,CARDS,c).length),'noTarget');
   if(a.id==='staple')requireRule(stapleCandidates(s).length>=3,'noTarget');
   if(a.id==='pan')requireRule(s.bank>=50&&!s.relics.includes('pangift'),'pointsCost');
   beginEncounter(s,a.id);return;
  }
  if(route.type==='dealer'){
    const rarePan=a.id==='pan'&&s.rules===2&&!s.practice&&!s.growth&&s.bank>=50&&!s.relics.includes('pangift');
    const usual=(s.growth||['duplicate','coldlocker','menuchange','closingmeal'].includes(a.id))&&(a.id==='mystery'||eligibleDealerRoutes(s).includes(a.id));
    requireRule(rarePan||usual,'route');beginEncounter(s,a.id);return;
  }
  if(route.type==='staple'){
    requireRule(s.growth,'route');requireRule(s.bank>=route.cost,'routeCost');
    const candidates=stapleCandidates(s);requireRule(candidates.length>=STAPLE_SIZE,'noTarget');
    const uids=shuffle(s,candidates.map(c=>c.uid)).slice(0,STAPLE_SIZE);
    spendBank(s,route.cost);s.stapleId=(s.stapleId||0)+1;
    (s.staples??=[]).push({id:s.stapleId,uids,readyRound:s.round+1});
    log(s,'staple',{id:s.stapleId,uids,n:uids.length});
  }else if (route.type !== 'event') {
    const target = routeTargets(s, a.id).find(c => c.uid === a.uid); requireRule(target, 'target');
    if (route.type === 'enchant') target.enchantment = a.id;
    else {
      requireRule(s.bank >= route.cost, 'routeCost'); spendBank(s,route.cost);
      s.eventReceipt={id:'prune',round:s.round,removed:[{...target}]};removePermanent(s,target);
    }
  } else s.nextRouteReward = a.id;
  (s.routeHistory ??= []).push({ round: s.round, id: a.id, uid: a.uid ?? null });
  openDraft(s);
}
function openDraft(s) {
  const temporary = s.cards.filter(c => c.temporary&&c.zone!=='stored').map(c => c.uid);
  s.cards = s.cards.filter(c => !temporary.includes(c.uid));
  for (const zone of ['table', 'draw', 'discard', 'known']) s[zone] = s[zone].filter(uid => !temporary.includes(uid));
  s.phase = 'draft'; s.added = false; s.removed = false;s.draftReceipt=null;
  s.offers = shuffle(s, PACKAGES.filter(p=>(s.growth||!p.id.startsWith('growth-'))&&(!s.allowedCards||p.cards.every(k=>s.allowedCards.includes(k)))).map(p => p.id)).slice(0, 3);
  if(s.growth){const own='growth-'+s.growth.route,other=shuffle(s,GROWTH_PACKAGES.filter(p=>p.id!==own).map(p=>p.id))[0],normal=shuffle(s,PACKAGES.filter(p=>!p.id.startsWith('growth-')).map(p=>p.id))[0];s.offers=[own,other,normal];if(s.round>=4){s.offers=[own,draftTargets(s,'focus-upgrade').length?'focus-upgrade':other,draftTargets(s,'focus-prune').length?'focus-prune':normal];}}
  const relicTable=[2,4,6,8].includes(s.round)||s.endless&&s.round>=10&&s.round%2===0;
  s.relicOffer = s.round === 2 ? ['lunchbox', 'recycler', 'splitter'].filter(id=>!s.relics.includes(id)) : relicTable ? shuffle(s,Object.keys(RELICS).filter(id=>!RELICS[id].retired&&!RELICS[id].rewardOnly&&!s.relics.includes(id))).slice(0,3) : [];
  if(s.allowedRelics&&relicTable)s.relicOffer=shuffle(s,Object.keys(RELICS).filter(id=>!RELICS[id].retired&&!RELICS[id].rewardOnly&&s.allowedRelics.includes(id)&&!s.relics.includes(id))).slice(0,3);
  s.relicPicked = false;
  if(rewardDenied(s)){s.offers=[];s.added=true;}
}
function applyAction(previous, action) {
  const s = cloneState(previous); const a = action; s.relicProgress??={};
  unlockTableReward(s,score(s));
  if(a.type==='continueEndless'){requireRule(canEnterEndless(s),'phase');awardAutoPair(s);s.endless=true;openEndlessTable(s);return s;}
  if(s.phase==='encounter'){resolveEncounter(s,a);return s;}
  if(s.phase==='midnight'){requireRule(a.type==='acceptMidnight','phase');s.phase='stakes';return s;}
  if (s.phase === 'stakes') {
    if (a.type === 'roll') {
      requireRule(s.dice.rolls.length < 2 && !s.dice.result?.locked, 'rollLimit');
      const old=s.dice.result?diceFaces(s.dice.result):[];
      const faces=Array.from({length:diceCount(s)},(_,i)=>fixedDie(old[i])?old[i]:1+Math.floor(random(s)*20)),total=faces.reduce((a,b)=>a+b,0);
      s.dice.result = { total, faces, held:faces.map((_,i)=>fixedDie(old[i])), tier: faces.includes(20)?'criticalHigh':faces.includes(1)?'criticalLow':faces.some(n=>n>=15)?'high':faces.some(n=>n<=5)?'low':'steady', locked:faces.every(fixedDie) }; s.dice.rolls.push(cloneState(s.dice.result));
    } else if (a.type === 'acceptDice') {
      const d = s.dice.result; requireRule(d, 'rollFirst');
      const effects=diceEffects(d);
      if (effects.boon === 'choose') requireRule(['scout','sauce','meal'].includes(a.boon), 'chooseBoon');
      const factor=targetFactor(s);s.target = nextTarget(s,d.total); s.goalHistory.push({ round: s.round + 1, target: s.target, factor, dice: { ...d } });
      effects.trouble.forEach(k=>addCard(s,k));
      s.nextBoon = effects.boon === 'feast' ? 'feast' : effects.boon === 'choose' ? a.boon : null;
      openRoute(s);
    } else requireRule(false, 'phase');
    return s;
  }
  if(s.phase==='route'&&a.type==='spinSkip'){
    requireRule(canSkipTable(s)&&s.skipOffer?.round===s.round+1,'skip');
    const pool=s.skipOffer.pool||skipRewardPool(s),pick=s.skipOffer.id?wheelPick([s.skipOffer.id],0):wheelPick(pool,random(s));
    // The saved result determines the landing; reloading never rolls it again.
    s.skipOffer={round:s.round+1,pool,id:pick.id,rotation:6*360+360-pick.mid};
    if(previous.skipOffer.id){const segments=wheelSections(pool);s.skipOffer.rotation=6*360+360-segments.find(x=>x.id===pick.id).mid;}
    s.phase='skipReward';log(s,'wheel',{reward:pick.id});return s;
  }
  if (s.phase === 'route'||s.phase==='skipReward') {
    if(a.type==='skipTable'){
      requireRule(s.phase==='skipReward'&&s.skipOffer?.round===s.round+1&&s.skipOffer.id===a.id,'skip');
      const receipt={id:a.id,round:s.round+1,removed:[]};
      if(a.id==='prune'){
        requireRule(Array.isArray(a.uids)&&a.uids.length===2&&new Set(a.uids).size===2&&s.cards.filter(c=>!c.temporary&&c.original!=='bomb').length>2,'target');
        requireRule(a.uids.every(uid=>{const c=card(s,uid);return c&&!c.temporary&&c.original!=='bomb';}),'target');
        for(const uid of a.uids){const c=card(s,uid);receipt.removed.push({...c});removePermanent(s,c);}
      }else if(a.id==='enchant'){
        requireRule(Array.isArray(a.enchants)&&a.enchants.length===2&&new Set(a.enchants.map(x=>x.uid)).size===2,'target');
        for(const e of a.enchants){const c=card(s,e.uid);requireRule(c&&canEnchant(c,e.enchantment,CARDS),'target');}
        receipt.enchanted=a.enchants.map(e=>{const c=card(s,e.uid);c.enchantment=e.enchantment;return {...c};});
      }else if(a.id==='staple'){
        const candidates=stapleCandidates(s);requireRule(candidates.length>=3,'noTarget');
        const uids=shuffle(s,candidates.map(c=>c.uid)).slice(0,3);s.stapleId=(s.stapleId||0)+1;
        const bundle={id:s.stapleId,uids,readyRound:s.round+2,permanent:true};(s.staples??=[]).push(bundle);receipt.staple=bundle.id;
      }else if(a.id==='duplicate'){
        const c=card(s,a.uid);requireRule(c&&!c.temporary&&c.original!=='bomb','target');receipt.card={...copyPermanent(s,c)};
      }else if(a.id==='relic'){
        const id=shuffle(s,prizePool(s,RELICS))[0];requireRule(id,'relic');s.relics.push(id);receipt.relic=id;
      }
      s.nextSkipPrize=['scout','jackpot','sanctuary'].includes(a.id)?{round:s.round+2,id:a.id}:null;
      s.skipReceipt=receipt;s.skipOffer=null;
      s.round++;s.lastSkipped=s.round;s.nextBoon=null;s.nextRouteReward=null;
      if(s.rewardGate)s.rewardGate.round=s.round;
      if(s.sealedParcel)s.sealedParcel.round=s.round+1;
      (s.skipHistory??=[]).push({round:s.round,reward:a.id,target:s.target});
      log(s,'skipTable',{round:s.round,reward:a.id});
      s.phase=s.round===MIDNIGHT_TABLE-1&&ruleDiceCount(s)>1?'midnight':'stakes';s.dice={rolls:[],result:null,count:ruleDiceCount(s)};
      return s;
    }
    requireRule(s.phase==='route'&&a.type === 'chooseRoute', 'phase'); chooseRoute(s, a); return s;
  }
  if (s.phase === 'draft') {
    if(a.type==='openRewardPack'){requireRule(economyEnabled(s)&&!rewardDenied(s)&&!s.rewardPackOpened&&!s.added,'draft');s.rewardPackOpened=true;
    }else if (a.type === 'add') {
      requireRule(!economyEnabled(s)||s.rewardPackOpened,'openPackage');
      requireRule(!s.added && s.offers.includes(a.id), 'draft'); const p=packageById(a.id,PACKAGES);requireRule(p,'draft');
      if(p.service){
        requireRule(s.growth&&s.round>=4,'draft');const target=draftTargets(s,a.id).find(c=>c.uid===a.uid);requireRule(target,'target');
        const receipt={id:a.id,uid:target.uid,kind:target.original};
        if(p.service==='upgrade'){const r=growthRoute(target);receipt.from=growthBase(target);target.growthXP=Math.min(r.every*growthCap(s),(target.growthXP||0)+r.every);target.growthLevel=(target.growthLevel||0)+1;receipt.to=growthBase(target);log(s,'growth',{kind:target.original,uid:target.uid,from:receipt.from,to:receipt.to});}
        else{receipt.removed={...target};removePermanent(s,target);}
        s.draftReceipt=receipt;log(s,'draftService',{service:p.service,kind:target.original});
      }
      const added=p.cards.map(k=>addCard(s,k));
      if(s.rules===2&&!s.growth&&!s.practice&&!p.service)markFreshPack(s,added);
      s.added=true;
    } else if (a.type === 'chooseRelic') {
      requireRule(!s.relicPicked && s.relicOffer.includes(a.id), 'relic'); s.relics.push(a.id); s.relicPicked = true;
    } else if (a.type === 'next') {
      requireRule(s.added, 'choosePackage');
      requireRule(!s.relicOffer.length || s.relicPicked, 'chooseRelic'); s.round++; startRound(s, s.carry); s.carry = null;
    } else requireRule(false, 'phase');
    return s;
  }
  requireRule(s.phase === 'play', 'phase');
  if(a.type==='toggleAutoPair'){requireRule(s.relics.includes('autotongs'),'relic');s.autoPairEnabled=!s.autoPairEnabled;return s;}
  if(s.pending){
    if(s.pending.type==='pairEffect'){
      const effect=s.pending,targets=a.targets,eligible=pairEffectTargets(s,effect.kind,effect.ids);
      requireRule(a.type==='resolvePairEffect'&&Array.isArray(targets)&&new Set(targets).size===targets.length&&targets.length<=pairTargetLimit(s,effect.ids)&&targets.every(uid=>eligible.some(c=>c.uid===uid)),'target');
      s.pending=null;finishPair(s,effect,targets);drainAutoPairs(s);return s;
    }
    if (s.pending.type === 'discover') {
      requireRule(a.type === 'discover' && s.pending.offers.includes(a.kind), 'pending');
      const c=temporary(s,a.kind);s.pending=null;log(s,'discover',{kind:c.kind});drainAutoPairs(s);return s;
    }
    requireRule(s.pending.type==='sift' && a.type==='resolveSift' && typeof a.discard==='boolean','pending');
    const uid=s.pending.uid,t=card(s,uid);requireRule(s.draw[0]===uid && s.known.includes(uid),'target');
    if(a.discard){requireRule(t.kind!=='bomb','bomb');const bundle=unfasten(s,uid);if(bundle)log(s,'unstapleSift',{n:bundle.uids.length});s.draw.shift();s.known=s.known.filter(id=>id!==uid);t.zone='discard';s.discard.push(uid);log(s,'sift',{kind:t.kind});}
    s.pending=null;return s;
  }
  if (a.type === 'draw') reveal(s);
  else if (a.type === 'stop') stop(s, a.carry);
  else if (a.type === 'pair') {
    resolvePair(s,a);
  } else if (a.type === 'use') {
    const c = card(s, a.uid); requireRule(c && typeOf(c) === 'tool', 'target'); const problem = toolProblem(s, c); requireRule(!problem, problem);
    const useListeners=live(s).filter(x=>['timer','grease'].includes(x.kind)).map(x=>({uid:x.uid,kind:x.kind}));
    if (bankCost(c,CARDS)) spendBank(s,bankCost(c,CARDS));
    if (hasFoodCost(c)&&c.enchantment!=='boiled') {
      if (c.freeCost) { c.freeCost = false; log(s, 'freeUse'); }
      else if (s.freePayments > 0) { s.freePayments--; log(s, 'freeUse'); }
      else pay(s, a.food, c);
    }
    const extraUse=c.extraUses>0;c.tapped=!extraUse;if(extraUse)c.extraUses--;c.lastUsed=++s.eventCount;c.usesThisTable=(c.usesThisTable||0)+1;log(s, 'use', { kind: c.kind });
    if(c.kind==='packingcord'){
      const food=parcelFoods(s,CARDS).find(c=>c.uid===a.food),tool=parcelTools(s,CARDS,c.uid).find(c=>c.uid===a.tool);
      requireRule(food&&tool&&!s.sealedParcel&&s.parcelUsedRound!==s.round,'target');sealParcel(s,food,tool,{unfasten,log});syncWraps(s);
    }
    if(c.kind==='bell') {const t=tiredTools(s,c.uid).find(x=>x.uid===a.target);requireRule(t,'target');t.tapped=false;log(s,'ready',{kind:t.kind});}
    if (c.kind === 'torch') peek(s, 1+enchantAmount(c,'toolAmount'));
    if (c.kind === 'scope') peek(s, 3+enchantAmount(c,'toolAmount'));
    if (c.kind === 'sifter') { peek(s,1);s.pending={type:'sift',source:c.uid,uid:s.draw[0]}; }
    if (c.kind === 'cloth') clear(s, a.target);
    if (c.kind === 'jar') {
      const t = troubles(s).find(t => t.uid === a.target); requireRule(t, 'target'); night.transform(s,t,'wild'); log(s,'ferment');
    }
    if (c.kind === 'stove') { const t=transformableFoods(s).find(t=>t.uid===a.target); requireRule(t,'target'); night.transform(s,t,'wild'); log(s,'ferment'); }
    if (c.kind === 'mold') { const t = foods(s).find(t => t.uid === a.target); requireRule(t, 'target'); for(let i=0;i<1+enchantAmount(c,'toolAmount');i++)temporary(s, t.kind); log(s, 'generate', { kind: t.kind }); }
    if (c.kind === 'juicer') { const t = foods(s).find(t => t.uid === a.target); requireRule(t, 'target'); consumeByTool(s,c,t); temporary(s, 'residue'); log(s, 'generate', { kind: 'residue' }); for(let i=0;i<1+enchantAmount(c,'toolAmount');i++)temporary(s, 'juice'); log(s, 'generate', { kind: 'juice' }); }
    if (c.kind === 'sorter') {
      discover(s,'food');s.pending.source=c.uid;
    }
    extraTool(s,c,a.target);
    night.used(s,c);
    for(const source of useListeners)boost(card(s,source.uid),source.kind==='timer'?1:-1);
    if(triggerRelic(s,'coinpurse'))gainBank(s,2);
    s.relicProgress.toolUses=(s.relicProgress.toolUses||0)+1;
    if(s.relicProgress.toolUses===3&&s.relics.includes('luckybone'))peek(s,2);
    } else if (a.type === 'wipeOil') {
    const c = troubles(s).find(c => c.uid === a.uid && c.kind === 'oil'); requireRule(c, 'target');
    const f = foods(s).find(c => c.uid === a.food); requireRule(f, 'foodCost'); consumeByEffect(s,c,f); clear(s, c.uid);
  } else if (a.type === 'relic') {
    const problem=relicProblem(s,a.id);requireRule(!problem,problem);
    if(RELICS[a.id].cost)spendBank(s,RELICS[a.id].cost);
    if (a.id === 'shaker') { requireRule(s.flips > 0, 'first'); shuffleDraw(s,false,true); s.known = []; log(s, 'shuffle'); }
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
export function act(previous,action){
 const next=applyAction(previous,action);
 if(next.phase==='play')unlockTableReward(next,score(next));
 return next;
}
export function restore(text) {
  try {
    const s = JSON.parse(text); if (s?.version !== 4 || !['play', 'midnight', 'stakes', 'route', 'skipReward', 'encounter','draft', 'won', 'lost'].includes(s.phase) || !Array.isArray(s.cards) || s.cards.length < 2 || !s.cards.every(c => CARDS[c.kind] && CARDS[c.original] && (c.original!=='bomb'||c.kind==='bomb'&&!c.temporary) && (!c.enchantment || ENCHANTMENTS[c.enchantment] && !c.temporary && (enchantmentText(c,c.enchantment,CARDS)||CARDS[c.original].type==='food'&&['raw','fried','boiled'].includes(c.enchantment)))) || s.cards.filter(c => c.original === 'bomb').length < 1) return null;
    if (new Set(s.cards.map(c => c.uid)).size !== s.cards.length) return null;
    if (![s.draw, s.table, s.discard, s.known, s.log, s.relics].every(Array.isArray) || ![s.round, s.bank, s.target, s.rng, s.uid].every(Number.isFinite)) return null;
    if ([...s.draw, ...s.table, ...s.discard].some(uid => !card(s, uid))) return null;
    if (!Array.isArray(s.nextEffects) || !Array.isArray(s.delayedPeeks) || !Array.isArray(s.revealedNames) || !Array.isArray(s.goalHistory)) return null;
    if (['stakes','midnight'].includes(s.phase) && (!s.dice || !Array.isArray(s.dice.rolls) || s.dice.rolls.length > 2)) return null;
    if(s.endless!=null&&(s.endless!==true||s.round<MAX_ROUNDS||s.practice||s.phase==='won'||['stakes','midnight'].includes(s.phase)))return null;
    if(s.rules!=null&&s.rules!==2)return null;
    if(s.rules===2&&(!Number.isInteger(s.difficulty)||s.difficulty<0||s.difficulty>3||!CHALLENGES[s.challenge]||!Array.isArray(s.allowedCards)||s.allowedCards.some(k=>!CARDS[k])||!Array.isArray(s.allowedRelics)||s.allowedRelics.some(k=>!RELICS[k])))return null;
    if(s.dice?.count!=null&&![1,2,3].includes(s.dice.count))return null;
    if(s.dice?.result?.faces&&(![1,2,3].includes(s.dice.result.faces.length)||s.dice.result.faces.some(n=>!Number.isInteger(n)||n<1||n>20)||s.dice.result.total!==s.dice.result.faces.reduce((a,b)=>a+b,0)))return null;
    if (s.pending) {
      if (s.phase !== 'play') return null;
      if(s.pending.type==='pairEffect'){
        const {ids,kind,listeners}=s.pending;
        if(!Array.isArray(ids)||ids.length!==2||ids[0]===ids[1]||ids.some(uid=>card(s,uid)?.zone!=='table')||!card(s,ids[0]).pair||card(s,ids[0]).pair!==card(s,ids[1]).pair||pairKind(...ids.map(uid=>({...card(s,uid),pair:null,pairedOnce:false})))!==kind||!pairEffectTargets(s,kind,ids).length)return null;
        if(!Array.isArray(listeners)||new Set(listeners.map(x=>x.uid)).size!==listeners.length||listeners.some(x=>!['candle','relay','houselamp'].includes(x.kind)||card(s,x.uid)?.kind!==x.kind||card(s,x.uid)?.zone!=='table'))return null;
      }
      else if (s.pending.type === 'sift') { if (s.draw[0] !== s.pending.uid || !s.known.includes(s.pending.uid) || card(s, s.pending.source)?.kind !== 'sifter') return null; }
      else if (s.pending.type === 'discover') { const pool=s.pending.pool||'food';if(!['food','tool'].includes(pool)||!Array.isArray(s.pending.offers)||s.pending.offers.length!==(s.relics.includes('neonsign')?4:3)||new Set(s.pending.offers).size!==s.pending.offers.length||s.pending.offers.some(k=>CARDS[k]?.type!==pool||CARDS[k]?.tokenOnly))return null; }
      else return null;
    }
    if(s.phase==='route' && (!Array.isArray(s.routeOffers) || s.routeOffers.length!==2 || new Set(s.routeOffers).size!==2 || s.routeOffers.some(id=>!ROUTES[id])))return null;
    if(s.cards.some(c=>c.zone==='held'&&(s.tablePrize!=='sanctuary'||c.original!=='bomb'||[...s.draw,...s.table,...s.discard].includes(c.uid))))return null;
    if(s.tablePrize==='sanctuary'&&s.cards.some(c=>c.original==='bomb'&&c.zone!=='held'))return null;
    if(s.nextRouteReward && ROUTES[s.nextRouteReward]?.type!=='event')return null;
    if(s.relics.some(id=>!RELICS[id]))return null;
    if(s.bankSpent!=null&&(!Number.isInteger(s.bankSpent)||s.bankSpent<0))return null;
    if(s.storedFoods!=null&&(!Array.isArray(s.storedFoods)||new Set(s.storedFoods.map(e=>e.uid)).size!==s.storedFoods.length||s.storedFoods.some(e=>{const c=card(s,e.uid);return !c||c.zone!=='stored'||CARDS[e.kind]?.type!=='food'||c.kind!==e.kind||![e.bonus,e.multiplier].every(Number.isFinite)||e.multiplier<=0||[...s.draw,...s.table,...s.discard].includes(e.uid);})))return null;
    if(s.cards.some(c=>c.zone==='stored'&&!(s.storedFoods||[]).some(e=>e.uid===c.uid)))return null;
    if(s.lastFoodPair!=null&&CARDS[s.lastFoodPair]?.type!=='food')return null;
    if(s.nextKitchen!=null&&(!Array.isArray(s.nextKitchen.foods)||s.nextKitchen.foods.some(k=>CARDS[k]?.type!=='food')||!Number.isSafeInteger(s.nextKitchen.free)||s.nextKitchen.free<0))return null;
    if(s.cards.some(c=>['usesThisTable','costDiscount','seasoned'].some(k=>c[k]!=null&&(!Number.isSafeInteger(c[k])||c[k]<0))||c.seasoned>6||c.usedNames!=null&&(!Array.isArray(c.usedNames)||c.usedNames.some(k=>CARDS[k]?.type!=='tool'))))return null;
    if(s.reservedTools!=null&&(!Array.isArray(s.reservedTools)||new Set(s.reservedTools).size!==s.reservedTools.length||s.reservedTools.some(uid=>{const c=card(s,uid);return !c||c.temporary||CARDS[c.original].type!=='tool';})))return null;
    if(s.panRescue!=null&&(!Number.isInteger(s.panRescue.uid)||s.panRescue.round!==s.round||card(s,s.panRescue.uid)?.kind!=='bomb'||!s.draw.includes(s.panRescue.uid)||s.relics.includes('pangift')))return null;
    if(!validProtection(s)||!validFreshPack(s))return null;
    if(!validGrowth(s)||!validMomentum(s)||!validRewards(s)||!validCrafting(s,CARDS))return null;
    if(s.autoPairEnabled!=null&&(typeof s.autoPairEnabled!=='boolean'||s.autoPairEnabled&&!s.relics.includes('autotongs')))return null;
    if(s.autoPairRewardClaimed!=null&&typeof s.autoPairRewardClaimed!=='boolean')return null;
    if(s.autoPairQueue!=null&&(!Array.isArray(s.autoPairQueue)||s.autoPairQueue.some(uid=>!card(s,uid))))return null;
    if(s.draftReceipt&&(!DRAFT_SERVICES[s.draftReceipt.id]||!s.growth||!CARDS[s.draftReceipt.kind]||s.draftReceipt.kind==='bomb'))return null;
    if(s.phase==='draft'&&(!Array.isArray(s.offers)||s.offers.some(id=>!packageById(id,PACKAGES))))return null;
    if(!validStaples(s))return null;
    if(!validDealerState(s,CARDS,RELICS,ROUTES))return null;
    if(s.encounter?.id==='pawn'&&!s.encounter.pledgeOffers)s.encounter.pledgeOffers=shuffle(s,prizePool(s,RELICS)).slice(0,3);
    s.relicProgress??={};
    if(!s.practice && s.maxRounds===5 && ['play','stakes','route','draft'].includes(s.phase))s.maxRounds=MAX_ROUNDS;
    if(s.endless||s.phase==='won'&&s.round===MAX_ROUNDS)awardAutoPair(s);
    if(s.phase==='route'){
      if(s.skipOffer==null)offerSkipReward(s);
      else if(!s.skipOffer.pool){s.skipOffer.pool=skipRewardPool(s);if(!s.skipOffer.pool.includes(s.skipOffer.id))s.skipOffer.id=null;}
    }
    return s;
  } catch { return null; }
}
