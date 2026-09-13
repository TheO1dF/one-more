import {newRun,card,INITIAL_TARGET} from '../game/engine.js';
import {TRIALS} from './trials.js';
const requireRule=(c,m)=>{if(!c)throw Error(m);};
function addCard(s,kind){const c={uid:++s.uid,original:kind,kind,zone:'deck'};s.cards.push(c);return c;}
function log(s,key,data={}){s.log.push({id:++s.event,key,...data});}
function resetCard(c) { Object.assign(c, { kind: c.original, zone: 'deck', tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: 0, triggers: 0, freeCost: false, multiplier: 1, boiledUsed: false, consumed: false, bonus:0, melt:0, keepOnce:false, extraUses:0, pairedAs:null }); }
function startRound(s){s.cards.forEach(resetCard);s.table=[];s.draw=s.cards.map(c=>c.uid);s.discard=[];s.known=[];s.flips=0;s.phase='play';s.log=[];}
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
export function systemPractice(id){
 if(id==='kitchen')return kitchenPractice();
 requireRule(TRIALS[id],'target');const s=newRun(5000);
 Object.assign(s,{practice:true,maxRounds:1,target:0,bank:16,cards:[],uid:0});
 const kinds=TRIALS[id].cards;[...kinds,'coffee','egg','pear','torch','bomb'].forEach(k=>addCard(s,k));startRound(s);
 s.table=s.cards.slice(0,kinds.length).map(c=>c.uid);s.draw=s.cards.slice(kinds.length).map(c=>c.uid);
 s.table.forEach((uid,i)=>Object.assign(card(s,uid),{zone:'table',entered:i+1}));
 if(id==='growth')s.cards.filter(c=>c.kind==='wild').forEach(c=>c.temporary=true);
 s.flips=kinds.length;s.eventCount=kinds.length;s.log=[];log(s,'practice');return s;
}
