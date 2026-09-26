import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,restore,score} from '../game/engine.js';
import {CARDS} from '../game/cards.js';
import {ruleDiceCount,stageRaise,maxDifficulty} from '../game/unlock-data.js';
import {bombGrowth} from '../game/stakes.js';
import {interfaceScale} from '../game/ui-scale.js';
import {arrangeCards} from '../game/layout.js';
import {nextTarget} from '../game/pacing.js';
const run=(difficulty=0)=>newRun(123,{rules:2,economy:2,stakesVersion:2,difficulty});
const bomb=s=>{s.draw=[20,...s.draw.filter(uid=>uid!==20)];return act(s,{type:'draw'});};
test('once-per-run rescue preserves table, bank and bomb; reload cannot refill it',()=>{
 let s=run();s=act(s,{type:'draw'});const before=structuredClone(s),points=score(s);
 s=bomb(s);assert.equal(s.phase,'play');assert.equal(s.protectionLeft,0);assert.deepEqual(s.table,before.table);assert.equal(score(s),points);assert.equal(s.bank,before.bank);
 assert.ok(s.draw.includes(20));assert.equal(new Set(s.draw).size,s.draw.length);
 s=restore(JSON.stringify(s));assert.equal(s.protectionLeft,0);
 s=bomb(s);assert.equal(s.phase,'lost');assert.equal(s.reason,'bomb');
});
test('low stakes protection is used before the event-only Pan gift',()=>{
 let s=run();s.relics.push('pangift');s=bomb(s);
 assert.ok(s.relics.includes('pangift'));assert.equal(s.protectionLeft,0);
 s=bomb(s);assert.equal(s.phase,'play');assert.ok(!s.relics.includes('pangift'));assert.ok(s.panRescue);
 s=bomb(s);assert.equal(s.phase,'lost');
});
test('four stakes escalate targets, remove protection, then add exactly one paper',()=>{
 const base=run();
 for(let difficulty=0;difficulty<4;difficulty++){
  const s=run(difficulty);assert.equal(s.cards.length,20);assert.equal(s.table.length,0);
  assert.equal(s.cards.filter(c=>CARDS[c.kind].type==='tool').length,base.cards.filter(c=>CARDS[c.kind].type==='tool').length);
  assert.equal(s.cards.filter(c=>c.kind==='paper').length,difficulty===3?1:0);
  assert.equal(s.protectionLeft,difficulty<2?1:0);
  assert.equal(bombGrowth(s).interval,bombGrowth(base).interval);
  for(let round=2;round<=10;round++){
   assert.equal(ruleDiceCount(s,round),1);
   assert.equal(stageRaise(s,round),difficulty===0?0:round>=8?8:round>=5?4:2);
  }
  assert.equal(nextTarget(s,10),difficulty===0?22:24);
  if(difficulty>=2)assert.equal(bomb(s).phase,'lost');
 }
 assert.equal(maxDifficulty({ascensionWins:{0:true}}),1);
});
test('old saves retain old rules and no free rescue; malformed rescue counts rejected',()=>{
 const old=newRun(123,{rules:2,difficulty:0,economy:2});assert.equal(bomb(restore(JSON.stringify(old))).phase,'lost');
 for(const protectionLeft of [-1,2,'1',null])assert.equal(restore(JSON.stringify({...run(),protectionLeft})),null);
 assert.equal(restore(JSON.stringify({...run(2),protectionLeft:1})),null);
});
test('high-resolution scale grows cards without allowing illegibly tiny desktop rows',()=>{
 assert.equal(interfaceScale(390,844),1);assert.equal(interfaceScale(3840,2160),2);
 assert.equal(interfaceScale(2560,1440),1.6);assert.equal(interfaceScale(3840,2160,'1.5'),1.5);
 const cards=Array.from({length:70},(_,i)=>({uid:i}));
 const layout=arrangeCards(cards,1700,750,{uiScale:2});assert.ok(layout.cardW>=118*1.32);assert.ok(layout.pages.length>1);
 assert.equal(layout.pages.flat(2).length,70);
});
