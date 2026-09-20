import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,restore,canEnterEndless} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {registerGrowthContent,GROWTH_ROUTES,GROWTH_CARDS,growthDeck} from '../game/growth-lab.js';
import {nextTarget} from '../game/pacing.js';
import {effectiveTarget} from '../game/dealer-events.js';
import {trackProgress} from '../game/progress.js';
import {points} from '../game/points.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
const kinds=s=>s.cards.map(c=>c.original);
const normal=['rice','rice','rice','fish','fish','fish','mint','mint','tea','tea','toast','toast','wild','wild','torch','torch','scope','bell','candle','bomb'];
function cleared(options={}){let s=newRun(141,{rules:2,...(!options.growthRoute?{allowedCards:Object.keys(CARDS).filter(k=>!GROWTH_CARDS[k])}:{}),...options});s.round=10;s.target=500;s.bank=500;s.flips=1;return act(s,{type:'stop'});}
function advance(s){
 // An ordinary free service isolates the transition from randomized encounter choices.
 s.routeOffers=['lantern','tea'];s=act(s,{type:'chooseRoute',id:'lantern'});
 s=act(s,{type:'add',id:s.offers[0]});if(s.relicOffer.length)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});
 return act(s,{type:'next'});
}
test('difficulty 0 and 1 preserve every starting slot; only high ascensions replace cards',()=>{
 for(const route of [null,...Object.keys(GROWTH_ROUTES)]){
  const expected=route?growthDeck(route):normal;
  for(const difficulty of [0,1])assert.deepEqual(kinds(newRun(141,{rules:2,difficulty,growthRoute:route})),expected);
  const d2=newRun(141,{rules:2,difficulty:2,growthRoute:route}),d3=newRun(141,{rules:2,difficulty:3,growthRoute:route});
  const changes=s=>kinds(s).filter((k,i)=>k!==expected[i]);assert.deepEqual(changes(d2),['paper']);assert.deepEqual(changes(d3),['paper','paper']);
  assert.equal(d3.cards.length,20);assert.equal(d3.cards.filter(c=>c.original==='bomb').length,1);
 }
 const count=(d,t)=>newRun(141,{rules:2,difficulty:d}).cards.filter(c=>CARDS[c.original].type===t).length;
 assert.deepEqual([0,1,2,3].map(d=>['food','tool','device','trouble','bomb'].map(t=>count(d,t))),[[14,4,1,0,1],[14,4,1,0,1],[13,4,1,1,1],[13,3,1,2,1]]);
});
test('table ten is a saved win with optional endless entry, never automatic',()=>{
 const s=cleared();assert.equal(s.phase,'won');assert.ok(canEnterEndless(s));assert.deepEqual(restore(JSON.stringify(s)),s);
 assert.throws(()=>act(newRun(1),{type:'continueEndless'}));assert.throws(()=>act({...s,practice:true},{type:'continueEndless'}));
 const next=act(s,{type:'continueEndless'});assert.equal(next.phase,'route');assert.equal(next.target,1000);assert.equal(next.bank,500);assert.equal(next.round,10);assert.equal(next.endless,true);assert.deepEqual(next.cards,s.cards);assert.deepEqual(next.relics,s.relics);assert.equal(next.dice,null);assert.equal(next.reason,null);assert.throws(()=>act(next,{type:'continueEndless'}));assert.deepEqual(restore(JSON.stringify(next)),next);
});
test('endless keeps the same run, doubles cumulative targets, and continues draft/relic cadence',()=>{
 for(const growthRoute of [null,...Object.keys(GROWTH_ROUTES)]){
  let s=act(cleared({growthRoute}),{type:'continueEndless'}),target=1000;
  for(let round=11;round<=18;round++){
   const count=s.cards.length,owned=s.relics.length;s=advance(s);assert.equal(s.round,round);assert.equal(s.phase,'play');assert.ok(s.cards.length>count);assert.ok(s.relics.length>=owned);assert.equal(s.target,target);assert.deepEqual(restore(JSON.stringify(s)),s);
   s.bank=target;s.flips=1;s=act(s,{type:'stop'});target*=2;assert.equal(s.phase,'route');assert.equal(s.target,target);assert.deepEqual(restore(JSON.stringify(s)),s);
  }
 }
});
test('temporary doubles do not compound into the endless base; cap expires',()=>{
 let s=advance(act(cleared(),{type:'continueEndless'}));s.tableCondition={id:'pressure',round:11,double:true,cap:false,wager:false};assert.equal(effectiveTarget(s),2000);s.bank=2000;s.flips=1;s=act(s,{type:'stop'});assert.equal(s.target,2000);assert.equal(s.tableCondition,null);s=advance(s);assert.equal(effectiveTarget(s),2000);assert.equal(nextTarget(s,1),4000);
});
test('endless bomb remains fatal and a later loss preserves the original clear record',()=>{
 let base=newRun(141,{rules:2,allowedCards:Object.keys(CARDS).filter(k=>!GROWTH_CARDS[k])});base.round=10;base.target=500;base.bank=500;base.flips=1;
 const meta={};let s=act(base,{type:'stop'});trackProgress(meta,base,s,{type:'stop'});assert.equal(meta.stats.runsWon,1);assert.ok(meta.achievements.clear);
 s=advance(act(s,{type:'continueEndless'}));s.flips=1;const bomb=s.cards.find(c=>c.kind==='bomb');s.draw=[bomb.uid,...s.draw.filter(uid=>uid!==bomb.uid)];const dead=act(s,{type:'draw'});assert.equal(dead.phase,'lost');assert.equal(dead.reason,'bomb');assert.ok(!canEnterEndless(dead));trackProgress(meta,s,dead,{type:'draw'});assert.equal(meta.stats.runsWon,1);assert.equal(meta.history.length,1);assert.equal(meta.history[0].reason,'complete');assert.equal(meta.history[0].endlessRound,11);assert.deepEqual(restore(JSON.stringify(dead)),dead);
});
test('endless high targets remain readable and serializable within numerical range',()=>{
 let s=act(cleared(),{type:'continueEndless'});for(let n=11;n<=100;n++){assert.ok(Number.isFinite(s.target));assert.ok(points(s.target).length<=10);assert.deepEqual(restore(JSON.stringify(s)),s);s={...s,target:nextTarget(s)};}
 assert.equal(points(999999),'999999');assert.equal(points(1024000),'1.02e6');assert.equal(restore(JSON.stringify({...s,target:null})),null);
});
