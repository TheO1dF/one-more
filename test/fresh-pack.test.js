import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,restore} from '../game/engine.js';
import {PACKAGES} from '../game/cards.js';
import {drawUnits,validStaples} from '../game/staples.js';
import {prioritizeFreshPack,revealFreshCard} from '../game/fresh-pack.js';

function drafted(seed=170,pack='juicer',size=20){
 const s=newRun(seed,{rules:2,stakesVersion:2,economy:2});
 for(let i=s.cards.length;i<size;i++)s.cards.push({...s.cards[i%19],uid:++s.uid});
 Object.assign(s,{phase:'draft',added:false,removed:false,rewardPackOpened:true,roundRewardEligible:true,offers:[pack],relicOffer:[],relicPicked:false});
 s.rewardGate.unlocked=true;
 return act(s,{type:'add',id:pack});
}
const clearFresh=s=>{for(const c of s.cards){delete c.freshRound;delete c.freshShown;}return s;};
const bombs=s=>s.draw.flatMap((uid,index)=>card(s,uid).original==='bomb'?[[index,uid]]:[]);
const loose=s=>{
 const bound=new Set(drawUnits(s).filter(u=>u.length>1).flat());
 return s.draw.filter(uid=>card(s,uid).original!=='bomb'&&!bound.has(uid));
};

test('all newly selected pack cards, including trouble, enter the next opening window without moving bombs',()=>{
 for(const size of [20,40,80])for(let seed=1;seed<=120;seed++){
  const pending=drafted(seed,'juicer',size),fresh=pending.cards.filter(c=>c.freshRound===2).map(c=>c.uid);
  assert.deepEqual(fresh.map(uid=>card(pending,uid).kind),['juicer','rice','paper']);
  const baseline=act(clearFresh(structuredClone(pending)),{type:'next'}),next=act(pending,{type:'next'});
  assert.deepEqual(bombs(next),bombs(baseline));assert.deepEqual([...next.draw].sort((a,b)=>a-b),[...baseline.draw].sort((a,b)=>a-b));
  assert.ok(fresh.every(uid=>loose(next).slice(0,6).includes(uid)));
  assert.notEqual(card(next,next.draw[0]).kind,'bomb');assert.equal(next.table.length,0);assert.equal(next.flips,0);
  assert.deepEqual(restore(JSON.stringify(next)),next);
 }
});

test('new foods, tools, devices and trouble receive the same scheduling and no free activation',()=>{
 for(const id of ['tea','relay','sealed-opening','juicer']){
  const pending=drafted(171,id),pack=PACKAGES.find(p=>p.id===id),next=act(pending,{type:'next'});
  assert.deepEqual(next.cards.filter(c=>c.freshRound===2).map(c=>c.original),pack.cards);
  assert.ok(next.cards.filter(c=>c.freshRound===2).every(c=>c.zone==='deck'&&!c.pair&&!c.tapped&&!c.freshShown));
  assert.equal(next.table.length,0);assert.equal(next.freePayments,0);assert.equal(next.known.length,0);
 }
});

test('pack order varies, including trouble first, and the same seed resumes identically before and after opening',()=>{
 const seen=new Set();
 for(let seed=1;seed<=80;seed++){
  const pending=drafted(seed),a=act(pending,{type:'next'}),b=act(restore(JSON.stringify(pending)),{type:'next'});
  assert.deepEqual(a,b);const fresh=new Set(a.cards.filter(c=>c.freshRound===2).map(c=>c.uid));
  seen.add(a.draw.filter(uid=>fresh.has(uid)).map(uid=>card(a,uid).kind).join(','));
 }
 assert.equal(seen.size,6);
});

test('shaker and rescued-bomb reshuffles never reapply the opening preference',()=>{
 let far=false,bombOnTop=false;
 for(let seed=1;seed<=80;seed++){
  const s=act(drafted(seed),{type:'next'});s.flips=1;
  const shaken=act(s,{type:'relic',id:'shaker'}),plain=act(clearFresh(structuredClone(s)),{type:'relic',id:'shaker'});
  assert.deepEqual(shaken.draw,plain.draw);assert.notEqual(shaken.draw[0],s.draw[0]);
  far||=loose(shaken).slice(6).some(uid=>card(shaken,uid).freshRound===2);
  bombOnTop||=card(shaken,shaken.draw[0]).kind==='bomb';
  const bomb=s.cards.find(c=>c.original==='bomb').uid;s.draw=[bomb,...s.draw.filter(uid=>uid!==bomb)];
  const rescue=act(s,{type:'draw'}),rescuePlain=act(clearFresh(structuredClone(s)),{type:'draw'});
  assert.deepEqual(rescue.draw,rescuePlain.draw);assert.equal(rescue.protectionLeft,0);
 }
 assert.ok(far);assert.ok(bombOnTop);
});

test('closed staples keep their exact slots and order, while new cards use available early slots',()=>{
 for(let seed=1;seed<=100;seed++){
  const pending=drafted(seed,'tea',40);pending.stapleId=2;
  pending.staples=[{id:1,uids:[1,2,3],readyRound:2},{id:2,uids:[4,5,6],readyRound:2,permanent:true}];
  const baseline=act(clearFresh(structuredClone(pending)),{type:'next'}),next=act(pending,{type:'next'});
  assert.ok(validStaples(next));assert.deepEqual(bombs(next),bombs(baseline));
  for(const uid of pending.staples.flatMap(b=>b.uids))assert.equal(next.draw.indexOf(uid),baseline.draw.indexOf(uid));
  assert.ok(next.cards.filter(c=>c.freshRound===2).every(c=>loose(next).slice(0,6).includes(c.uid)));
 }
});

test('preference expires the next round; an old save without markers keeps its existing draw order',()=>{
 let s=act(drafted(88),{type:'next'});const old=clearFresh(structuredClone(s));
 assert.deepEqual(restore(JSON.stringify(old)),old);
 Object.assign(s,{phase:'draft',added:true,offers:[],relicOffer:[],relicPicked:true});
 const next=act(s,{type:'next'});assert.ok(next.cards.every(c=>c.freshRound==null&&c.freshShown==null));
 assert.deepEqual(next.draw,act(clearFresh(structuredClone(s)),{type:'next'}).draw);
});

test('only the first actual reveal emits new-card feedback; peeking and reloading do not replay it',()=>{
 let s=act(drafted(91),{type:'next'}),c=s.cards.find(c=>c.freshRound===2&&c.kind==='rice');
 s.draw=[c.uid,...s.draw.filter(uid=>uid!==c.uid)];s.known=[c.uid];
 s=restore(JSON.stringify(s));assert.equal(card(s,c.uid).freshShown,undefined);
 s=act(s,{type:'draw'});assert.ok(s.log.some(e=>e.key==='reveal'&&e.source===c.uid&&e.fresh));
 s=restore(JSON.stringify(s));assert.equal(revealFreshCard(s,card(s,c.uid)),false);
 const snapshot=JSON.stringify(s);restore(snapshot);assert.equal(JSON.stringify(s),snapshot);
});

test('bombs, temporary cards and invalid future-round metadata cannot receive preference from a save',()=>{
 const base=drafted();
 for(const mutate of [s=>card(s,20).freshRound=2,s=>{const c=s.cards.at(-1);c.temporary=true;},s=>s.cards.at(-1).freshRound=3,s=>s.cards.at(-1).freshRound=1.5,s=>s.cards.at(-1).freshShown='yes',s=>card(s,1).freshShown=true]){
  const s=structuredClone(base);mutate(s);assert.equal(restore(JSON.stringify(s)),null);
 }
});

test('short decks and off-deck fresh cards are handled without duplication or moving stored cards',()=>{
 const s={round:2,cards:[{uid:1,kind:'rice',original:'rice',freshRound:2},{uid:2,kind:'bomb',original:'bomb'},{uid:3,kind:'torch',original:'torch',freshRound:2,zone:'stored'}],draw:[1,2]};
 prioritizeFreshPack(s,()=>.5);assert.deepEqual(s.draw,[1,2]);assert.equal(s.cards[2].zone,'stored');
});
