import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {registerGrowthContent} from '../game/growth-lab.js';
import {newRun,act,card} from '../game/engine.js';
import {cardPerformancePlan,TOOL_PERFORMANCES} from '../game/card-performance-plan.js';
import {tutorialRun,tutorialAct,tutorialObserve} from '../game/tutorial.js';
import {tutorialGuideStep} from '../game/tutorial-guide.js';
import {toolTargetChoices} from '../game/action-selection.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);

function table(kinds){
 const s=newRun(718,{rules:2,stakesVersion:2});s.bank=80;s.table=kinds.map((_,i)=>i+1);s.draw=s.draw.filter(uid=>!s.table.includes(uid));s.flips=kinds.length;s.eventCount=kinds.length;
 kinds.forEach((kind,i)=>Object.assign(card(s,i+1),{original:kind,kind,zone:'table',entered:i+1}));return s;
}
const plan=(s,a)=>cardPerformancePlan(a,s,act(s,a));

test('every tool has a bounded short cue, including registered growth tools',()=>{
 for(const [kind,c] of Object.entries(CARDS).filter(([,c])=>c.type==='tool')){
  assert.ok(TOOL_PERFORMANCES[kind],kind);assert.ok(TOOL_PERFORMANCES[kind].duration>=500&&TOOL_PERFORMANCES[kind].duration<=1200,kind);
 }
});
test('ordinary pairing has no performance; meaningful pair effects use actual outcomes',()=>{
 assert.equal(plan(table(['blacktea','shortbread']),{type:'pair',ids:[1,2]}).active,false);
 const copied=plan(table(['cheese','cheese','rice']),{type:'pair',ids:[1,2],target:3});
 assert.equal(copied.arrivals.length,1);assert.equal(copied.arrivals[0].card.kind,'rice');assert.equal(copied.arrivals[0].origin,'created');
 const blocked=plan(table(['cheese','cheese','rice','cold']),{type:'pair',ids:[1,2]});assert.equal(blocked.arrivals.length,0);
});
test('free costs and retained food do not falsely fly to the bin',()=>{
 const s=table(['scope','fish']);s.freePayments=1;
 const free=plan(s,{type:'use',uid:1});assert.equal(free.consumed.length,0);assert.equal(free.removed.length,0);
 const paid=plan({...s,freePayments:0},{type:'use',uid:1,food:2});assert.equal(paid.consumed[0].from.uid,2);assert.equal(paid.consumed[0].to.consumptionType,'tool');
 const kept=table(['juicer','fish']);card(kept,2).keepOnce=true;
 const result=plan(kept,{type:'use',uid:1,target:2});assert.equal(result.consumed.length,0);assert.equal(result.arrivals.filter(x=>x.card.kind==='juice').length,1);
});
test('transforms use the old and new object; copies are not a second transform',()=>{
 const s=table(['pastrymold','fish']),action={type:'use',uid:1,target:2},before=JSON.stringify(s),after=act(s,action),snapshot=JSON.stringify(after);
 const p=cardPerformancePlan(action,s,after);assert.equal(p.transformed[0].from.kind,'fish');assert.equal(p.transformed[0].to.kind,'shortbread');assert.equal(p.arrivals.length,0);
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(after),snapshot);
 const copy=plan(table(['mold','fish']),{type:'use',uid:1,target:2});assert.equal(copy.transformed.length,0);assert.equal(copy.arrivals[0].card.kind,'fish');
});
test('recovery, fetching, storage and packing use distinct real zones',()=>{
 let s=table(['scope','fish','scoop']);s=act(s,{type:'use',uid:1,food:2});
 const recovered=plan(s,{type:'use',uid:3,target:2});assert.equal(recovered.arrivals[0].origin,'discard');
 s=table(['hazelnut','hazelnut','fish']);const fetched=plan(s,{type:'pair',ids:[1,2],target:3});assert.equal(fetched.arrivals[0].origin,'deck');
 const stored=plan(table(['thermos','fish']),{type:'use',uid:1,target:2});assert.equal(stored.removed[0].to.zone,'stored');assert.equal(stored.consumed.length,0);
 s=table(['packingcord','fish','torch']);card(s,3).tapped=true;
 const sealed=plan(s,{type:'use',uid:1,food:2,tool:3});assert.deepEqual(sealed.sealed.map(c=>c.uid),[2,3]);assert.equal(sealed.consumed.length,0);
});
test('mass recovery is an outcome list; exhausted recovery is not readiness',()=>{
 const s=table(['chili','chili','torch','scope']);card(s,3).tapped=card(s,4).tapped=true;
 assert.deepEqual(plan(s,{type:'pair',ids:[1,2]}).readied.map(c=>c.uid),[3,4]);
});
test('ordinary drawing has no creation performance and a new card is not duplicated',()=>{
 const s=table([]);s.draw=[1,...s.draw.filter(uid=>uid!==1)];card(s,1).kind='blacktea';card(s,1).original='blacktea';
 const p=plan(s,{type:'draw'});assert.equal(p.arrivals.length,0);assert.equal(p.active,false);
});
test('either stacked food selects the same legal pair without changing the rules target',()=>{
 const s=act(table(['banquetfork','blacktea','shortbread','blacktea']),{type:'pair',ids:[2,3]});
 const options=toolTargetChoices(s.cards,[card(s,2)],'pair');assert.deepEqual(options.map(x=>[x.card.uid,x.target]),[[2,2],[3,2]]);
 const after=act(s,{type:'use',uid:1,target:options.find(x=>x.card.uid===3).target});assert.equal(card(after,2).zone,'discard');assert.equal(card(after,3).zone,'discard');assert.equal(card(after,4).zone,'table');
 assert.deepEqual(toolTargetChoices(s.cards,[card(s,2)],'foodKind').map(x=>x.card.uid),[2,4]);
});
test('tutorial points straight to the flashlight and advances on its single use',()=>{
 let s=tutorialRun(42);s=tutorialAct(s,{type:'draw'});s=tutorialObserve(s,'card');s=tutorialAct(s,{type:'draw'});s=tutorialAct(s,{type:'pair',ids:[4,5]});s=tutorialObserve(s,'preview');s=tutorialAct(s,{type:'draw'});s=tutorialAct(s,{type:'draw'});
 assert.equal(tutorialGuideStep(s,{selected:15}).selector,'.tile[data-kind="torch"]:not(:disabled)');
 s=tutorialAct(s,{type:'use',uid:15});assert.equal(tutorialGuideStep(s).selector,'.preview-slot.known');
});
