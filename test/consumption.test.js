import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,toolConsumedFoods,consumedFoods,restore} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {registerGrowthContent} from '../game/growth-lab.js';
import {createConsumption,consumptionOrigin} from '../game/consumption.js';
import {discardKind,discardPileHTML} from '../game/discard-view.js';
import {ruleText} from '../game/rule-text.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);

function board(kinds){
 const s=newRun(701,{rules:2,...(kinds.includes('mincer')?{growthRoute:'broth'}:{})});Object.assign(s,{cards:[],table:[],draw:[],discard:[],known:[],uid:0,flips:kinds.length,target:0,bank:100});
 for(const [zone,list] of [['table',kinds],['deck',['rice','fish','bomb']]])for(const kind of list){const c={uid:++s.uid,kind,original:kind,zone,entered:s.uid,tapped:false,pair:null,pairedOnce:false};s.cards.push(c);s[zone==='table'?'table':'draw'].push(c.uid);}s.eventCount=s.uid;s.relics=['shaker','recycler'];return s;
}
const toolKinds=['scope','bell','juicer','grill','cleaver','mincer','banquetfork','servingcloche'];
function consumeWith(kind){
 let s=board(['rice',kind,'rice','torch','toast','toast']);card(s,4).tapped=true;
 if(['cleaver','banquetfork','servingcloche'].includes(kind))s=act(s,{type:'pair',ids:[1,3]});
 return act(s,{type:'use',uid:2,food:1,target:kind==='bell'?4:1});
}
test('every food-consuming tool records one common origin and permits both Recovery tongs and Toast',()=>{
 for(const kind of toolKinds){
  const s=consumeWith(kind),c=card(s,1);
  assert.equal(c.consumptionType,'tool',kind);assert.equal(c.consumedBy,kind);assert.equal(c.consumedByUid,2);assert.ok(toolConsumedFoods(s).includes(c));
  const count=['cleaver','banquetfork','servingcloche'].includes(kind)?2:1;
  assert.equal(toolConsumedFoods(s).length,count,kind);assert.equal(s.relicProgress.consumedFoods,count,kind);
  assert.equal(s.log.filter(e=>e.key==='consume').length,count,kind);
  assert.equal(discardKind(c),'reclaimable');assert.deepEqual(restore(JSON.stringify(s)),s);
  const byTongs=act(s,{type:'relic',id:'recycler',uid:1}),byToast=act(s,{type:'pair',ids:[5,6],target:1});
  for(const n of [byTongs,byToast]){assert.equal(card(n,1).zone,'table');assert.equal(card(n,1).consumed,false);assert.equal(card(n,1).consumedBy,undefined);assert.equal(card(n,1).consumedByUid,undefined);assert.equal(card(n,1).consumptionType,undefined);}
 }
});
test('non-tool consumption stays consumed but not tool-reclaimable; repeated consumption replaces source',()=>{
 let s=board(['rice','scope','oil','scoop','toast','toast']);
 s=act(s,{type:'wipeOil',uid:3,food:1});assert.equal(card(s,1).consumptionType,'effect');assert.equal(card(s,1).consumedBy,'oil');
 assert.equal(toolConsumedFoods(s).length,0);assert.equal(consumedFoods(s).length,1);assert.equal(discardKind(card(s,1)),'effect');
 assert.throws(()=>act(s,{type:'relic',id:'recycler',uid:1}));assert.throws(()=>act(s,{type:'pair',ids:[5,6],target:1}));
 s=act(s,{type:'use',uid:4,target:1});assert.equal(card(s,1).consumedBy,undefined);
 s=act(s,{type:'use',uid:2,food:1});assert.equal(card(s,1).consumedBy,'scope');assert.equal(toolConsumedFoods(s).length,1);
 s=act(s,{type:'relic',id:'recycler',uid:1});
 const oil=card(s,3);oil.zone='table';s.table.push(3);s.discard=s.discard.filter(uid=>uid!==3);
 s=act(s,{type:'wipeOil',uid:3,food:1});assert.equal(toolConsumedFoods(s).length,0);assert.equal(card(s,1).consumptionType,'effect');
});
test('waived costs do not consume; effect consumption and explicit residue still happen normally',()=>{
 let s=board(['rice','scope']);s.freePayments=1;s=act(s,{type:'use',uid:2});assert.equal(s.discard.length,0);assert.equal(s.freePayments,0);
 s=board(['rice','scope']);card(s,1).enchantment='boiled';s=act(s,{type:'use',uid:2,food:1});assert.equal(s.discard.length,0);assert.equal(card(s,1).consumptionType,undefined);
 s=board(['rice','juicer']);s.freePayments=2;s=act(s,{type:'use',uid:2,target:1});assert.equal(toolConsumedFoods(s).length,1);assert.equal(s.freePayments,2);assert.equal(s.cards.filter(c=>c.kind==='residue').length,1);
 s=board(['rice','grill','dishwasher']);card(s,1).keepOnce=true;s=act(s,{type:'use',uid:2,target:1});assert.equal(card(s,1).zone,'table');assert.equal(s.freePayments,0);assert.equal(card(s,1).consumptionType,undefined);
});
test('discard and consumption stay distinct, trouble is never reclaimed as food, and next table clears origin',()=>{
 let s=board(['residue','compostfork']);s=act(s,{type:'use',uid:2});assert.equal(card(s,1).consumptionType,'tool');assert.equal(toolConsumedFoods(s).length,0);
 s=board(['sifter']);s=act(s,{type:'use',uid:1});s=act(s,{type:'resolveSift',discard:true});assert.equal(consumedFoods(s).length,0);assert.equal(discardKind(card(s,s.discard[0])),'discarded');
 s=consumeWith('grill');s=act({...s,phase:'draft',added:true,relicOffer:[]},{type:'next'});assert.equal(card(s,1).consumptionType,undefined);assert.equal(toolConsumedFoods(s).length,0);
 assert.equal(consumptionOrigin({consumed:true,paid:true},CARDS),'tool');assert.equal(consumptionOrigin({consumed:true},CARDS),'effect');
});
test('the two consumption APIs reject a source of the wrong type before mutating the target',()=>{
 const s=board(['rice','scope','oil']),before=JSON.stringify(s);
 const api=createConsumption({definitions:CARDS,requireRule:(ok,reason)=>{if(!ok)throw Error(reason);}});
 assert.throws(()=>api.consumeByTool(s,card(s,3),card(s,1)),/source/);
 assert.throws(()=>api.consumeByEffect(s,card(s,2),card(s,1)),/source/);assert.equal(JSON.stringify(s),before);
});
test('bin badges explain source and recovery and rule emphasis preserves meaning and escapes markup',()=>{
 const s=consumeWith('grill'),html=discardPileHTML(s,'zh');assert.match(html,/工具消耗/);assert.match(html,/来源：烤架/);assert.match(html,/回收钳/);
 assert.match(ruleText(CARDS.chili.text[0]),/恢复所有<strong class="rule-object">工具<\/strong>/);
 assert.match(ruleText(CARDS.ginger.text[0]),/已用过的<strong class="rule-object">抵押物<\/strong>/);
 for(const d of Object.values(CARDS))for(const text of d.text)assert.equal(ruleText(text).replace(/<\/?strong[^>]*>/g,''),text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'));
 assert.doesNotMatch(ruleText('<img onerror="oops"> Toolmaker tools'),/<img|>Tool</);assert.match(ruleText('tools'),/<strong/);
});
