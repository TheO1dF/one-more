import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,score,restore,pairEffectTargets} from '../game/engine.js';
import {tutorialRun,tutorialHTML,tutorialText} from '../game/tutorial.js';
function table(kinds){
 const s=newRun(712,{rules:2,stakesVersion:2});s.table=kinds.map((kind,i)=>i+1);s.draw=s.draw.filter(uid=>!s.table.includes(uid));s.flips=kinds.length;s.eventCount=kinds.length;
 kinds.forEach((kind,i)=>Object.assign(card(s,i+1),{original:kind,kind,zone:'table',entered:i+1}));return s;
}
function pair(s,extra={}){return act(s,{type:'pair',ids:[1,2],chooseEffect:true,...extra});}
test('second food immediately pairs and resolves untargeted abilities without confirmation',()=>{
 const s=pair(table(['fish','fish']));assert.ok(card(s,1).pair);assert.equal(card(s,1).pair,card(s,2).pair);assert.equal(score(s),8);assert.equal(s.known.length,1);assert.equal(s.pending,null);
});
test('targeted pairs commit before selecting effects and preserve original resolution order after reload',()=>{
 for(const [kind,extra,target] of [['rice',['paper','oil','candle','houselamp'],3],['mint',['torch','scope','candle','relay'],3],['cheese',['fish','candle'],3],['hazelnut',['fish','candle'],3]]){
  const s=table([kind,kind,...extra]);if(kind==='mint')for(const uid of [3,4])card(s,uid).tapped=true;
  const direct=act(s,{type:'pair',ids:[1,2],target});const pending=pair(s);
  assert.ok(card(pending,1).pair,kind);assert.equal(card(pending,1).pair,card(pending,2).pair);assert.equal(pending.pending.type,'pairEffect');
  const snapshot=JSON.stringify(pending);assert.throws(()=>act(pending,{type:'draw'}));assert.throws(()=>act(pending,{type:'resolvePairEffect',targets:[20]}));assert.equal(JSON.stringify(pending),snapshot);
  const loaded=restore(snapshot);assert.ok(loaded,kind);const resolved=act(loaded,{type:'resolvePairEffect',targets:[target]});assert.deepEqual(resolved,direct,kind);
 }
});
test('toast reclaim is offered after pairing and remains recoverable across saves',()=>{
 let s=table(['toast','toast','fish','scope']);s=act(s,{type:'use',uid:4,food:3});
 const expected=act(s,{type:'pair',ids:[1,2],target:3});s=pair(s);assert.equal(s.pending.type,'pairEffect');assert.equal(card(s,3).zone,'discard');
 s=act(restore(JSON.stringify(s)),{type:'resolvePairEffect',targets:[3]});assert.deepEqual(s,expected);assert.equal(card(s,3).zone,'table');
});
test('skipping or choosing multiple enchanted targets never repeats the pair or its listeners',()=>{
 const s=table(['mint','mint','torch','scope','relay']);card(s,1).enchantment='fried';card(s,3).tapped=card(s,4).tapped=true;
 const pending=pair(s);assert.equal(pending.freePayments,0);
 for(const targets of [[],[3],[3,4]]){
  const resolved=act(pending,{type:'resolvePairEffect',targets});assert.deepEqual(resolved,act(s,{type:'pair',ids:[1,2],targets}));assert.equal(resolved.freePayments,1);assert.equal(resolved.log.filter(e=>e.key==='pair').length,1);
 }
 assert.throws(()=>act(pending,{type:'resolvePairEffect',targets:[3,3]}));
});
test('blocked or targetless abilities pair without a target prompt',()=>{
 for(const mode of ['empty','cold','silencer']){
  const s=table(['mint','mint',...(mode==='cold'?['cold','torch']:[])]);if(mode==='cold')card(s,4).tapped=true;if(mode==='silencer')s.relics.push('silencer');
  const result=pair(s);assert.ok(card(result,1).pair);assert.equal(result.pending,null);
 }
});
test('tutorial highlights rules inline in both languages and describes a two-click pair',()=>{
 const s=tutorialRun(44);const zh=tutorialHTML(s,'zh'),en=tutorialHTML(s,'en');
 assert.match(zh,/<b class="lesson-key">第一张<\/b>不会是炸弹/);assert.match(en,/<b class="lesson-key">first card<\/b>/);
 s.lesson=3;assert.ok(!tutorialHTML(s,'zh').includes('最后按配对'));assert.ok(!tutorialHTML(s,'en').includes('confirm'));
 assert.equal(tutorialText('**<img>** &'),'<b class="lesson-key">&lt;img&gt;</b> &amp;');
});
