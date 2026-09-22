import test from 'node:test';
import assert from 'node:assert/strict';
import {act,newRun,restore,card} from '../game/engine.js';
import {canSkipTable,SKIP_REWARDS} from '../game/momentum.js';
import {skipHTML} from '../game/momentum-view.js';
import {targetFactor,nextTarget} from '../game/pacing.js';
import {diceTargetHTML,tableTargetLabel} from '../game/target-view.js';
import {drawUnits,validStaples} from '../game/staples.js';
import {registerGrowthContent,GROWTH_CURVES} from '../game/growth-lab.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
function offer(seed=1){
 let s=newRun(seed,{rules:2});Object.assign(s,{bank:10000,phase:'stakes',dice:{rolls:[],result:null,count:1}});
 return act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});
}
function take(s){
 const id=s.skipOffer.id,foods=s.cards.filter(c=>!c.temporary&&CARDS[c.original].type==='food'&&!CARDS[c.original].noPair&&!c.enchantment),ordinary=s.cards.filter(c=>!c.temporary&&c.original!=='bomb');
 return act(s,{type:'skipTable',id,uid:foods[0]?.uid,enchantment:'fried',uids:ordinary.slice(0,2).map(c=>c.uid)});
}
test('one random skip reward is shown and saved; a different reward is rejected',()=>{
 const counts={};
 for(let seed=1;seed<=400;seed++){
  const s=offer(seed),id=s.skipOffer.id;counts[id]=(counts[id]||0)+1;
  assert.equal((skipHTML(s).match(/data-action="skip-table"/g)||[]).length,1);
  assert.deepEqual(restore(JSON.stringify(s)),s);
  assert.throws(()=>act(s,{type:'skipTable',id:Object.keys(SKIP_REWARDS).find(x=>x!==id)}),/skip/);
 }
 assert.equal(Object.keys(counts).length,4);for(const n of Object.values(counts))assert.ok(n>55&&n<145);
 const old=offer(8);delete old.skipOffer;const restored=restore(JSON.stringify(old));assert.ok(restored.skipOffer);
 assert.deepEqual(restore(JSON.stringify(old)),restored);assert.deepEqual(restore(JSON.stringify(restored)),restored);
});
test('consecutive skips give only the next target a non-stacking +1; final table blocks skipping',()=>{
 let s=offer();
 for(let round=2;round<=9;round++){
  assert.ok(canSkipTable(s));const before=s.target,bank=s.bank;s=take(s);
  assert.equal(s.round,round);assert.equal(s.target,before);assert.equal(s.bank,bank);assert.equal(targetFactor(s),2);
  assert.deepEqual(restore(JSON.stringify(s)),s);
  if(s.phase==='midnight')s=act(s,{type:'acceptMidnight'});
  s=act(s,{type:'roll'});const expected=before+s.dice.result.total*2;
  assert.match(diceTargetHTML(s,'en',true),/Includes \+1 for this target only/);
  s=act(s,{type:'acceptDice',boon:'scout'});assert.equal(s.target,expected);assert.equal(s.goalHistory.at(-1).factor,2);
  assert.equal(tableTargetLabel(s,'en'),'DICE ×2');
 }
 assert.equal(s.round,9);assert.equal(s.skipHistory.length,8);assert.ok(!canSkipTable(s));assert.equal(s.skipOffer,null);
 assert.match(skipHTML(s,'en'),/FINAL TABLE/);assert.throws(()=>act(s,{type:'skipTable',id:'relic'}),/skip/);
});
test('skip penalty is additive to growth curve and high-difficulty surcharges, not bank or endless multipliers',()=>{
 for(const difficulty of [0,1,2,3])for(let round=1;round<10;round++){
  const s=newRun(4,{rules:2,difficulty,growthRoute:'broth',growthCurve:'rising'});
  Object.assign(s,{round,target:100,bank:1000,skipHistory:[{round:2,reward:'relic'},{round:3,reward:'prune'}]});
  const base=GROWTH_CURVES[difficulty>=2?'steep':'gentle'][round-1],extra=(round===1?4:0)+(difficulty>=2?(round>=7?8:round>=4?4:2):0);
  const penalty=[2,3].includes(round)?1:0;assert.equal(targetFactor(s),base+penalty);assert.equal(nextTarget(s,10),100+10*(base+penalty)+extra);
  assert.equal(nextTarget({...s,endless:true},10),200);
 }
});
test('skip surcharge expires after the next table, including across save and reload',()=>{
 let s=take(offer());
 s=act(s,{type:'roll'});const before=s.target,rolled=s.dice.result.total;
 s=act(s,{type:'acceptDice',boon:'scout'});assert.equal(s.target,before+rolled*2);
 assert.match(skipHTML(s,'zh'),/仅下一桌/);assert.match(skipHTML(s,'zh'),/骰点合计.*×2/);assert.doesNotMatch(skipHTML(s,'zh'),/×3/);
 s.routeOffers=['tea','helper'];s=act(s,{type:'chooseRoute',id:'tea'});
 s=act(s,{type:'add',id:s.offers[0]});if(s.relicOffer.length)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});
 s=act(s,{type:'next'});assert.equal(s.round,3);assert.equal(tableTargetLabel(s,'en'),'DICE ×2');
 s=restore(JSON.stringify(s));assert.ok(s);assert.equal(targetFactor(s),1);
 s=act(act(s,{type:'draw'}),{type:'stop'});assert.equal(s.phase,'stakes');assert.equal(targetFactor(s),1);
 assert.doesNotMatch(diceTargetHTML(s,'en'),/Includes \+1/);
 s=act(s,{type:'roll'});const base=s.target,roll=s.dice.result.total;
 s=act(s,{type:'acceptDice',boon:'scout'});assert.equal(s.target,base+roll);assert.equal(tableTargetLabel(s,'en'),'');
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
function pile(kinds,seed){
 const s=newRun(seed,{rules:2});s.cards=kinds.map((kind,i)=>({uid:i+1,kind,original:kind,zone:'deck'}));s.uid=kinds.length;s.draw=s.cards.map(c=>c.uid);s.table=[];s.discard=[];s.flips=1;s.known=[...s.draw];return s;
}
test('shaker moves the old top including bombs, clears knowledge, and retains a uniform alternative top',()=>{
 const counts={};
 for(let seed=1;seed<=1200;seed++){
  const s=pile(['bomb','rice','fish','paper'],seed),n=act(s,{type:'relic',id:'shaker'});
  assert.notEqual(n.draw[0],1);assert.deepEqual([...n.draw].sort(),s.draw);assert.deepEqual(n.known,[]);
  counts[n.draw[0]]=(counts[n.draw[0]]||0)+1;
  assert.throws(()=>act(n,{type:'relic',id:'shaker'}),/relic/);
 }
 assert.equal(Object.keys(counts).length,3);for(const n of Object.values(counts))assert.ok(n>320&&n<480);
});
test('another bomb can replace the original bomb and kill; singleton is not made safe',()=>{
 let deaths=0;
 for(let seed=1;seed<=120;seed++){
  let s=act(pile(['bomb','bomb','rice'],seed),{type:'relic',id:'shaker'});assert.notEqual(s.draw[0],1);
  if(card(s,s.draw[0]).kind==='bomb'){s=act(s,{type:'draw'});assert.equal(s.phase,'lost');assert.equal(s.reason,'bomb');deaths++;}
 }
 assert.ok(deaths>30&&deaths<90);
 let s=act(pile(['bomb'],5),{type:'relic',id:'shaker'});assert.deepEqual(s.draw,[1]);assert.equal(act(s,{type:'draw'}).reason,'bomb');
});
test('shaker replaces whole top bundles without splitting them',()=>{
 for(let seed=1;seed<=60;seed++){
  const s=pile(['rice','fish','rice','bomb'],seed);s.stapleId=1;s.staples=[{id:1,uids:[1,2,3],readyRound:1,permanent:true}];
  const n=act(s,{type:'relic',id:'shaker'});assert.equal(n.draw[0],4);assert.deepEqual(drawUnits(n),[[4],[1,2,3]]);assert.ok(validStaples(n));
 }
});
