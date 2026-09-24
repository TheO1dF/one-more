import {systemPractice} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,PACKAGES} from '../game/cards.js';
import {EXTRA_CARDS} from '../game/extra-cards.js';
import {EXTRA_ART} from '../game/extra-art.js';
import {newRun,act,card,onTable,score,value,restore,toolProblem,effectTargets} from '../game/engine.js';
import {TRIALS} from '../test/trials.js';
function board(kinds,deck=['rice','fish','pear','bomb']){
 const s=newRun(501);Object.assign(s,{cards:[],table:[],draw:[],discard:[],known:[],uid:0,flips:kinds.length,bank:16,target:0});
 for(const [zone,list]of [['table',kinds],['deck',deck]])for(const kind of list){const c={uid:++s.uid,kind,original:kind,zone,tapped:false,pair:null,pairedOnce:false,entered:s.uid};s.cards.push(c);s[zone==='table'?'table':'draw'].push(c.uid);}s.eventCount=s.uid;return s;
}
const use=(s,uid,target,food)=>act(s,{type:'use',uid,target,food});
const pair=(s,a,b,target)=>act(s,{type:'pair',ids:[a,b],target});
const count=(s,k)=>onTable(s).filter(c=>c.kind===k).length;
test('112 actual definitions, 48 unique new drawings, every new card obtainable in a legal package',()=>{
 assert.equal(Object.keys(CARDS).length,112);assert.equal(Object.keys(EXTRA_CARDS).length,48);assert.equal(new Set(Object.values(EXTRA_ART)).size,48);
 for(const k of Object.keys(EXTRA_CARDS)){assert.ok(EXTRA_ART[k],k);assert.ok(PACKAGES.some(p=>p.cards.includes(k)),k);}
 for(const p of PACKAGES){assert.ok(p.cards.every(k=>CARDS[k]&&!CARDS[k].tokenOnly),p.id);assert.ok(p.cards.some(k=>CARDS[k].type==='trouble'),p.id);}
 assert.equal(new Set(PACKAGES.map(p=>p.id)).size,PACKAGES.length);
 for(const lang of [0,1])assert.equal(new Set(Object.values(CARDS).map(d=>d.name[lang])).size,112);
});
test('Dumpling grants both members 2 extra, including a Wild partner',()=>{let s=pair(board(['dumpling','wild']),1,2);assert.equal(score(s),12);assert.equal(value(s,card(s,1)),6);});
test('Egg consumption creates Rice without creating Residue',()=>{let s=use(board(['egg','scope']),2,null,1);assert.equal(count(s,'rice'),1);assert.ok(onTable(s).find(c=>c.kind==='rice').temporary);assert.equal(count(s,'residue'),0);assert.equal(s.flips,2);});
test('Pear consumption peeks two without moving or revealing the bomb',()=>{let s=board(['pear','oil'],['bomb','rice','fish']);const order=[...s.draw];s=act(s,{type:'wipeOil',uid:2,food:1});assert.deepEqual(s.known,order.slice(0,2));assert.deepEqual(s.draw,order);assert.equal(s.phase,'play');});
test('Mushroom clears every Residue but leaves other trouble alone',()=>{let s=pair(board(['mushroom','mushroom','residue','residue','paper']),1,2);assert.equal(count(s,'residue'),0);assert.equal(count(s,'paper'),1);assert.equal(s.discard.length,2);});
test('Lemon bypasses both peek blockers for the table, including Sieve eligibility',()=>{let s=board(['lemon','lemon','fog','noise','scope','sifter']);assert.equal(toolProblem(s,card(s,6)),'noPeek');s=pair(s,1,2);s.freePayments=1;s=use(s,5);assert.equal(s.known.length,3);assert.equal(toolProblem(s,card(s,6)),null);});
test('Shrimp discovers tools, persists the choice, blocks actions and never fires reveal',()=>{let s=pair(board(['shrimp','shrimp','rust']),1,2);assert.equal(s.pending.pool,'tool');assert.ok(s.pending.offers.every(k=>CARDS[k].type==='tool'));assert.throws(()=>act(s,{type:'draw'}));const order=[...s.draw];s=restore(JSON.stringify(s));s=act(s,{type:'discover',kind:s.pending.offers[0]});assert.equal(s.cards.at(-1).tapped,false);assert.ok(s.cards.at(-1).temporary);assert.deepEqual(s.draw,order);assert.equal(s.flips,3);});
test('Noodles score exhausted tools only, repeated pairs stack and readying removes that score',()=>{let s=board(['noodle','noodle','noodle','noodle','torch','bell']);card(s,5).tapped=true;s=pair(s,1,2);assert.equal(value(s,card(s,5)),1);s=pair(s,3,4);assert.equal(value(s,card(s,5)),2);s.freePayments=1;s=use(s,6,5);assert.equal(value(s,card(s,5)),0);assert.equal(value(s,card(s,6)),2);});
test('Cheese creates a fresh base copy, not a paired or enchanted duplicate',()=>{let s=board(['cheese','cheese','fish']);card(s,3).enchantment='raw';s=pair(s,1,2,3);const c=s.cards.at(-1);assert.equal(c.kind,'fish');assert.ok(c.temporary);assert.equal(c.pairedOnce,false);assert.equal(c.enchantment,undefined);assert.throws(()=>pair(board(['cheese','cheese']),1,2,1));});
test('Chili readies every exhausted tool',()=>{let s=board(['chili','chili','torch','scope']);card(s,3).tapped=card(s,4).tapped=true;s=pair(s,1,2);assert.equal(card(s,3).tapped,false);assert.equal(card(s,4).tapped,false);});
test('Coffee restores earliest exhausted tool only and its own reveal does not melt itself',()=>{let s=board(['scope','torch'],['coffee','icecream','paper','bomb']);card(s,1).tapped=card(s,2).tapped=true;s=act(s,{type:'draw'});assert.equal(card(s,1).tapped,false);assert.equal(card(s,2).tapped,true);s=act(s,{type:'draw'});assert.equal(value(s,card(s,4)),6);s=act(s,{type:'draw'});assert.equal(value(s,card(s,4)),5);});
test('Cake counts pairs, Salad distinct food, Marshmallow its exclusivity, Cookie parity',()=>{
 let s=pair(board(['cake','salad','marshmallow','cookie','cookie','cookie','rice','rice']),7,8);
 assert.equal(value(s,card(s,1)),2);assert.equal(value(s,card(s,2)),5);assert.equal(value(s,card(s,3)),6);assert.equal(value(s,card(s,4)),3);
 s=board(['marshmallow','marshmallow','cookie','cookie']);assert.equal(score(s),0);
});
test('Skewer counts consumed food still in discard, not all discarded food',()=>{let s=use(board(['skewer','rice','scope','scoop']),3,null,2);assert.equal(value(s,card(s,1)),1);s=use(s,4,2);assert.equal(value(s,card(s,1)),0);});
test('Tofu increases only the next creation and Service bell counts every created food',()=>{let s=board(['tofu','tofu','sushi','sushi','servingbell','sorter']);s=pair(s,1,2);s=pair(s,3,4);assert.equal(count(s,'fish'),2);assert.equal(value(s,card(s,5)),2);assert.equal(s.extraFood,0);s=use(s,6);s=act(s,{type:'discover',kind:s.pending.offers[0]});assert.equal(value(s,card(s,5)),3);});
test('Grill transfers twice food score and explicitly generates exactly one Residue',()=>{let s=board(['rice','grill']);card(s,1).enchantment='raw';s=use(s,2,1);assert.equal(value(s,card(s,2)),8);assert.equal(count(s,'residue'),1);assert.equal(score(s),7);assert.match(CARDS.grill.text[0],/生成.*残渣/);});
test('Steamer retention stops consume triggers, is used once, and does not erase a printed product',()=>{
 let s=board(['egg','steamer','scope','bell','dishwasher','choppingboard']);s=use(s,2,1);s=use(s,3,null,1);
 assert.equal(card(s,1).zone,'table');assert.equal(card(s,1).keepOnce,false);assert.equal(count(s,'rice'),0);assert.equal(s.freePayments,0);assert.equal(value(s,card(s,6)),0);assert.ok(!s.log.some(e=>e.key==='pay'));
 s=use(s,4,3,1);assert.equal(card(s,1).zone,'discard');assert.equal(count(s,'rice'),1);assert.equal(s.freePayments,1);assert.equal(value(s,card(s,6)),2);
 s=use(use(board(['rice','steamer','grill']),2,1),3,1);assert.equal(card(s,1).zone,'table');assert.equal(count(s,'residue'),1);assert.equal(value(s,card(s,3)),4);
});
test('Cleaver consumes exactly one pair, retains history, creates three unpaired Rice and no Residue',()=>{let s=pair(board(['fish','fish','cleaver']),1,2);s=use(s,3,1);assert.equal(s.discard.length,2);assert.equal(card(s,1).pairedOnce,true);assert.equal(card(s,2).pair,null);assert.equal(count(s,'rice'),3);assert.ok(onTable(s).filter(c=>c.kind==='rice').every(c=>!c.pair));assert.equal(count(s,'residue'),0);});
test('Slotted spoon retrieves effect-consumed food; Compost fork consumes trouble without food triggers',()=>{
 let s=use(board(['egg','juicer','scoop']),2,1);s=use(s,3,1);assert.equal(card(s,1).zone,'table');assert.equal(card(s,1).consumed,false);
 s=use(board(['residue','residue','compostfork','dishwasher','choppingboard','spicejar','rice']),3);assert.equal(value(s,card(s,3)),4);assert.equal(s.freePayments,0);assert.equal(value(s,card(s,5)),0);assert.equal(value(s,card(s,7)),2);assert.ok(s.cards.slice(0,2).every(c=>c.consumed));
});
test('Reheat stamp costs two bank, breaks a complete pair and restores both foods without clearing enhancements',()=>{
 let s=board(['rice','rice','stamp','wild']);s=pair(s,1,2);card(s,1).enchantment='fried';card(s,1).bonus=3;
 const bank=s.bank,old=JSON.stringify(s);assert.throws(()=>use({...s,bank:1},3,1));assert.throws(()=>use(s,3,4));assert.equal(JSON.stringify(s),old);
 s=use(s,3,1);assert.equal(s.bank,bank-2);assert.ok(card(s,3).tapped);assert.equal(s.freePayments,0);
 for(const id of [1,2]){assert.equal(card(s,id).pair,null);assert.equal(card(s,id).pairedOnce,false);assert.equal(card(s,id).pairedAs,null);}
 assert.equal(card(s,1).enchantment,'fried');assert.equal(card(s,1).bonus,3);assert.equal(count(s,'residue'),0);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=pair(s,1,4);assert.equal(s.freePayments,0);assert.ok(card(s,1).pair);assert.ok(!card(s,2).pair);
});
test('Probe sees precisely slot three, not an implicit top-three peek',()=>{let s=board(['magnifier'],['rice','fish','bomb']);const order=[...s.draw];s=use(s,1);assert.deepEqual(s.known,[order[2]]);assert.deepEqual(s.draw,order);assert.equal(s.phase,'play');});
test('Fan clears information blockers; Wash bucket clears all trouble and consumes only bank',()=>{let s=use(board(['fan','fog','noise','paper']),1);assert.equal(count(s,'paper'),1);assert.equal(count(s,'fog'),0);assert.equal(count(s,'noise'),0);s=use(board(['washbucket','residue','cold','paper']),1);assert.equal(s.bank,13);assert.equal(s.discard.length,3);assert.equal(count(s,'residue'),0);});
test('Return tray moves only trouble to bottom without moving bombs or triggering clear and consumption',()=>{
 let s=board(['noise','tray','spicejar','rice','fish']);s.relics=['linen'];const order=[...s.draw],old=JSON.stringify(s);
 assert.throws(()=>use(s,2,4));assert.throws(()=>use(s,2,s.draw.at(-1)));assert.equal(JSON.stringify(s),old);
 s=use(s,2,1);assert.deepEqual(s.draw,[...order,1]);assert.ok(s.known.includes(1));assert.equal(card(s,1).zone,'deck');assert.equal(s.flips,5);assert.equal(value(s,card(s,4)),2);
 assert.ok(!s.log.some(e=>['clear','consume','peek'].includes(e.key)));assert.equal(s.discard.length,0);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('House menu adds points only to matching food already in play',()=>{let s=use(board(['cola','cola','fish','menu']),4,1);assert.equal(score(s),9);assert.equal(value(s,card(s,3)),2);});
test('Magnet reclaims a discarded tool exhausted, without a reveal',()=>{let s=board(['sifter','magnet'],['torch','bomb']);s=use(s,1);s=act(s,{type:'resolveSift',discard:true});s=use(s,2,3);assert.equal(card(s,3).zone,'table');assert.equal(card(s,3).tapped,true);assert.equal(s.flips,2);});
test('Whetstone permits two actual uses, both still consume costs',()=>{let s=use(board(['whetstone','scope','rice','fish']),1,2);s=use(s,2,null,3);assert.equal(card(s,2).tapped,false);s=use(s,2,null,4);assert.equal(card(s,2).tapped,true);assert.equal(s.discard.length,2);assert.throws(()=>use(s,2));});
test('Shopping bag turns a generated food permanent, costing bank, and it survives next round',()=>{let s=board(['sorter','ladle']);s=use(s,1);s=act(s,{type:'discover',kind:s.pending.offers[0]});const uid=s.cards.at(-1).uid,kind=card(s,uid).kind;s=use(s,2,uid);assert.equal(s.bank,12);assert.equal(card(s,uid).temporary,false);assert.equal(card(s,uid).original,kind);s=act(s,{type:'stop'});s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.equal(card(s,uid).kind,kind);assert.equal(card(s,uid).zone,'deck');});
test('Picnic scores distinct pair kinds, Pantry only permanent singles, Display only temporary food',()=>{let s=board(['picnic','pantry','glasscase','rice','rice','fish','wild','egg']);s=pair(s,4,5);s=pair(s,6,7);card(s,8).temporary=true;assert.equal(value(s,card(s,1)),4);assert.equal(value(s,card(s,2)),0);assert.equal(value(s,card(s,3)),1);});
test('Spice jar buffs earliest unpaired food for each actual clear; Recycling sack counts discarded trouble',()=>{let s=use(board(['spicejar','rice','fish','residue','paper','washbucket','recyclingbag']),6);assert.equal(value(s,card(s,2)),4);assert.equal(value(s,card(s,3)),2);assert.equal(value(s,card(s,7)),2);});
test('Timer and Grime trigger once per use; Clutter counts tools, including exhausted',()=>{let s=use(board(['timer','grease','clutter','torch']),4);assert.equal(value(s,card(s,1)),1);assert.equal(value(s,card(s,2)),-1);assert.equal(value(s,card(s,3)),-1);});
test('use listeners retain their identity if a tool transforms their source',()=>{let s=use(board(['grease','jar']),2,1);assert.equal(card(s,1).kind,'wild');assert.equal(value(s,card(s,1)),1);});
test('Fruit flies zero temporary food only; Cold stove disables printed pair effects but not devices',()=>{
 let s=board(['flies','rice','fish','glasscase']);card(s,2).temporary=true;assert.equal(value(s,card(s,2)),0);assert.equal(value(s,card(s,3)),2);assert.equal(value(s,card(s,4)),1);
 s=pair(board(['cold','tofu','tofu','relay','candle']),2,3);assert.equal(s.extraFood,0);assert.equal(s.freePayments,1);assert.equal(s.known.length,1);assert.equal(score(s),8);
});
test('every targeted new tool rejects an illegal target atomically and has a usable fixture',()=>{
 for(const [kind,def]of Object.entries(EXTRA_CARDS).filter(([,d])=>d.target)){
  let s=board([kind,'rice','fish','torch','residue']);card(s,2).pairedOnce=true;card(s,3).temporary=true;
  if(def.target==='pair'){card(s,2).pair=card(s,3).pair=1;}
  if(def.target==='consumed'){card(s,2).zone='discard';card(s,2).consumed=true;s.table=s.table.filter(u=>u!==2);s.discard=[2];}
  if(def.target==='discardTool'){card(s,4).zone='discard';s.table=s.table.filter(u=>u!==4);s.discard=[4];}
  if(def.target==='knownTop')s.known=[s.draw[1]];
  assert.equal(toolProblem(s,card(s,1)),null,kind);assert.ok(effectTargets(s,card(s,1)).length,kind);const old=JSON.stringify(s);
  assert.throws(()=>use(s,1,s.draw.at(-1)),kind);assert.equal(JSON.stringify(s),old,kind);
 }
});
test('all six trial tables are valid and new state survives reload; round effects reset',()=>{
 for(const id of Object.keys(TRIALS)){const s=systemPractice(id);assert.equal(s.practice,true);assert.deepEqual(restore(JSON.stringify(s)),s);}
 let s=pair(board(['tofu','tofu','lemon','lemon','noodle','noodle']),1,2);s=pair(s,3,4);s=pair(s,5,6);s=act(s,{type:'stop'});s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.equal(s.extraFood,0);assert.equal(s.clearSight,false);assert.equal(s.toolScoring,false);assert.ok(s.cards.every(c=>!c.bonus&&!c.melt&&!c.keepOnce&&!c.extraUses));
});
