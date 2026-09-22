import test from 'node:test';
import assert from 'node:assert/strict';
import {act,newRun,restore,score,baseScore,card,toolProblem,routeTargets,skipRewardPool} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {SKIP_REWARDS,wheelSections,wheelPick,scoreMultiplier} from '../game/momentum.js';
import {ENCHANTMENTS,enchantmentText,canEnchant} from '../game/enchantments.js';
import {registerGrowthContent,recordGrowth} from '../game/growth-lab.js';
import {activeBombCount} from '../game/stakes.js';
import {materialLayers,MATERIALS} from '../game/card-view.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);

function offer(seed=1,id=null){
 let s=newRun(seed,{rules:2});Object.assign(s,{bank:1000,phase:'stakes',dice:{rolls:[],result:null,count:1}});
 s=act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});s.skipOffer.id=id;return s;
}
const win=id=>act(offer(3,id),{type:'spinSkip'});
function next(s){
 Object.assign(s,{phase:'draft',offers:[],added:true,relicOffer:[],carry:null});return act(s,{type:'next'});
}
function board(kinds,draw=['rice','fish','rice','tea','bomb']){
 const s=newRun(7,{rules:2});s.cards=[...kinds,...draw].map((kind,i)=>({uid:i+1,kind,original:kind,zone:i<kinds.length?'table':'deck',entered:i+1}));
 s.uid=s.cards.length;s.table=s.cards.filter(c=>c.zone==='table').map(c=>c.uid);s.draw=s.cards.filter(c=>c.zone==='deck').map(c=>c.uid);s.discard=[];s.known=[];s.bank=100;s.flips=kinds.length;return s;
}
const use=(s,uid,target,food)=>act(s,{type:'use',uid,target,food});
const enchanted=(s,uid,id)=>{card(s,uid).enchantment=id;return s;};

test('eight weighted sectors cover the wheel; every result lands under the pointer',()=>{
 const pool=Object.keys(SKIP_REWARDS),sectors=wheelSections(pool);
 assert.equal(sectors.length,8);assert.ok(Math.abs(sectors.at(-1).end-360)<1e-10);
 assert.deepEqual(sectors.map(x=>Number(x.chance.toFixed(2))),[20,22,16,15,17,6,3.5,.5]);
 for(const part of sectors){
  const s=win(part.id);assert.equal(wheelPick(pool,part.mid/360).id,part.id);
  const pointing=((360-s.skipOffer.rotation%360)%360+360)%360;
  assert.ok(pointing>part.start&&pointing<part.end,part.id);assert.deepEqual(restore(JSON.stringify(s)),s);
  assert.throws(()=>act(s,{type:'spinSkip'}));assert.throws(()=>act(s,{type:'chooseRoute',id:s.routeOffers[0]}));
 }
 const noRemovals=wheelSections(pool.filter(id=>!['prune','enchant','relic'].includes(id)));
 assert.equal(noRemovals.find(x=>x.id==='sanctuary').chance,.5);assert.equal(noRemovals.find(x=>x.id==='jackpot').chance,3.5);
 assert.ok(Math.abs(noRemovals.reduce((n,x)=>n+x.chance,0)-100)<1e-10);
});
test('actual seeded spins approximate published probabilities across 10000 fresh runs',()=>{
 const counts=Object.fromEntries(Object.keys(SKIP_REWARDS).map(id=>[id,0]));
 for(let seed=1;seed<=10000;seed++){const s=act(offer(seed),{type:'spinSkip'});counts[s.skipOffer.id]++;}
 for(const [id,r] of Object.entries(SKIP_REWARDS)){
  const expected=100*r.weight,sigma=Math.sqrt(10000*r.weight/100*(1-r.weight/100));
  assert.ok(Math.abs(counts[id]-expected)<5*sigma,`${id}: ${counts[id]}`);
 }
 console.log('Wheel sample (10000):',JSON.stringify(counts));
});
test('old revealed skip rewards migrate without rerolling; reload after spinning cannot change the result',()=>{
 let s=offer(4,'relic');delete s.skipOffer.pool;s=restore(JSON.stringify(s));assert.ok(s.skipOffer.pool.includes('relic'));
 s=act(s,{type:'spinSkip'});assert.equal(s.skipOffer.id,'relic');assert.equal(restore(JSON.stringify(s)).skipOffer.id,'relic');
 assert.throws(()=>act(s,{type:'skipTable',id:'sanctuary'}));
});
test('double enchant requires two distinct eligible cards, supports tools and rejects route IDs atomically',()=>{
 const s=win('enchant'),before=JSON.stringify(s),a={uid:1,enchantment:'fried'},b={uid:15,enchantment:'smoked'};
 for(const enchants of [[a],[a,a],[a,{uid:20,enchantment:'raw'}],[a,{uid:2,enchantment:'prune'}],[a,{uid:2,enchantment:'smoked'}]]){
  assert.throws(()=>act(s,{type:'skipTable',id:'enchant',enchants}));assert.equal(JSON.stringify(s),before);
 }
 let n=act(s,{type:'skipTable',id:'enchant',enchants:[a,b]});assert.equal(n.skipReceipt.enchanted.length,2);
 assert.equal(card(n,1).enchantment,'fried');assert.equal(card(n,15).enchantment,'smoked');assert.equal(n.bank,s.bank);
 n=next(n);assert.equal(card(n,15).extraUses,1);assert.deepEqual(restore(JSON.stringify(n)),n);
 const none=offer();none.cards.forEach(c=>{if(c.original!=='bomb')c.enchantment='boiled';});assert.ok(!skipRewardPool(none).includes('enchant'));
});
test('free permanent copy preserves original identity and enhancement, not this-table state or binding',()=>{
 const s=win('duplicate');Object.assign(card(s,1),{kind:'wild',enchantment:'raw',bonus:70,pair:8,pairedOnce:true});
 assert.throws(()=>act(s,{type:'skipTable',id:'duplicate',uid:20}));
 const n=act(s,{type:'skipTable',id:'duplicate',uid:1}),c=n.cards.at(-1);
 assert.notEqual(c.uid,1);assert.equal(c.kind,'rice');assert.equal(c.original,'rice');assert.equal(c.enchantment,'raw');
 assert.equal(c.bonus,0);assert.equal(c.pair,null);assert.equal(c.pairedOnce,false);assert.equal(n.bank,s.bank);assert.deepEqual(restore(JSON.stringify(n)),n);
});
test('bomb-free prize holds every bomb for exactly the next played table, including added bombs',()=>{
 let s=act(win('sanctuary'),{type:'skipTable',id:'sanctuary'});
 const bombIds=s.cards.filter(c=>c.original==='bomb').map(c=>c.uid);
 for(let i=0;i<45;i++)s.cards.push({uid:++s.uid,kind:'rice',original:'rice',zone:'deck'});
 s=next(s);assert.equal(s.round,3);assert.equal(s.tablePrize,'sanctuary');assert.equal(activeBombCount(s),0);
 const bombs=s.cards.filter(c=>c.original==='bomb');assert.equal(bombs.length,3);assert.ok(bombIds.every(id=>bombs.some(c=>c.uid===id)));
 assert.ok(bombs.every(c=>c.zone==='held'&&!s.draw.includes(c.uid)));assert.deepEqual(restore(JSON.stringify(s)),s);
 const corrupt=structuredClone(s);corrupt.draw.push(bombs[0].uid);assert.equal(restore(JSON.stringify(corrupt)),null);
 s=act(s,{type:'draw'});s=act(s,{type:'relic',id:'shaker'});while(s.draw.length)s=act(s,{type:'draw'});
 assert.equal(s.phase,'play');assert.equal(s.table.length,s.cards.length-bombs.length);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=next(s);assert.equal(s.tablePrize,null);assert.equal(activeBombCount(s),3);assert.ok(bombs.every(c=>s.draw.includes(c.uid)));assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('golden table multiplies table score, stacks with devices, and never multiplies the bank or later tables',()=>{
 let s=act(win('jackpot'),{type:'skipTable',id:'jackpot'});const bank=s.bank;s=next(s);
 s=act(s,{type:'draw'});assert.equal(scoreMultiplier(s),1.2);assert.equal(score(s),Math.floor(baseScore(s)*1.2));assert.equal(s.bank,bank);
 s.tableDoublings=3;assert.equal(score(s),Math.floor(baseScore(s)*8*1.2));
 const n=act(s,{type:'stop'});assert.equal(n.bank,bank+score(s));assert.equal(next(n).tablePrize,null);
});
test('temporary rewards expire on skipping their table; scouting stacks once with dice and route boons',()=>{
 for(const id of ['sanctuary','jackpot','scout']){
  let s=act(win(id),{type:'skipTable',id});s=act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});
  s.skipOffer.id='duplicate';s=act(s,{type:'spinSkip'});s=act(s,{type:'skipTable',id:'duplicate',uid:1});
  assert.equal(s.nextSkipPrize,null);assert.equal(next(s).tablePrize,null);
 }
 let s=act(win('scout'),{type:'skipTable',id:'scout'});s.nextBoon='meal';s.nextRouteReward='tea';s=next(s);
 assert.equal(s.freePayments,6);assert.equal(s.known.length,5);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=next(s);assert.equal(s.freePayments,0);assert.equal(s.known.length,0);assert.equal(s.tablePrize,null);
});
test('five enchantments have material layers and per-card eligibility with no bomb or token enchantments',()=>{
 assert.equal(Object.keys(ENCHANTMENTS).length,5);
 for(const id of Object.keys(ENCHANTMENTS)){assert.ok(MATERIALS[id]);assert.match(materialLayers(id),/cooking-vfx/);assert.doesNotMatch(materialLayers(id),/undefined/);assert.ok(!canEnchant({kind:'bomb',original:'bomb'},id,CARDS));}
 assert.ok(!canEnchant({kind:'torch',temporary:true},'smoked',CARDS));assert.ok(!canEnchant({kind:'rice',enchantment:'raw'},'fried',CARDS));
 for(const [id,kind] of [['raw','rice'],['fried','torch'],['boiled','scope'],['smoked','torch'],['glazed','cola']]){
  let s=offer();card(s,1).kind=card(s,1).original=kind;s.routeOffers=[id,'tea'];assert.ok(routeTargets(s,id).some(c=>c.uid===1));
  s=act(s,{type:'chooseRoute',id,uid:1});s=next(s);assert.equal(card(s,1).enchantment,id);assert.deepEqual(restore(JSON.stringify(s)),s);
  assert.ok(enchantmentText(card(s,1),id,CARDS).every(t=>t.length>0));
 }
});
test('Fried upgrades peek amounts, multiple pair targets and juice output without duplicating residue or costs',()=>{
 let s=use(enchanted(board(['torch']),1,'fried'),1);assert.equal(s.known.length,2);
 s=board(['rice','rice','paper','rust']);card(s,1).enchantment='fried';
 assert.throws(()=>act(s,{type:'pair',ids:[1,2],targets:[3,3]}));s=act(s,{type:'pair',ids:[1,2],targets:[3,4]});assert.equal(s.discard.length,2);assert.equal(s.freePayments,0);
 s=use(enchanted(board(['juicer','fish']),1,'fried'),1,2);assert.equal(card(s,2).zone,'discard');
 assert.equal(s.cards.filter(c=>c.kind==='juice').length,2);assert.equal(s.cards.filter(c=>c.kind==='residue').length,1);assert.equal(s.bank,100);
});
test('Boiled tool costs are reflected in availability and deduction; food waivers are not spent',()=>{
 let s=enchanted(board(['scope']),1,'boiled');s.freePayments=2;assert.equal(toolProblem(s,card(s,1)),null);s=use(s,1);assert.equal(s.known.length,3);assert.equal(s.freePayments,2);
 s=board(['stamp','rice','rice']);s=act(s,{type:'pair',ids:[2,3]});card(s,1).enchantment='boiled';s.bank=1;
 assert.equal(toolProblem(s,card(s,1)),null);s=use(s,1,2);assert.equal(s.bank,0);assert.equal(card(s,2).pair,null);
});
test('Smoked tools get exactly one extra use per table and devices trigger every two revealed foods',()=>{
 let s=win('enchant');s=act(s,{type:'skipTable',id:'enchant',enchants:[{uid:15,enchantment:'smoked'},{uid:1,enchantment:'raw'}]});s=next(s);
 s.draw=s.draw.filter(uid=>uid!==15);card(s,15).zone='table';s.table=[15];s.flips=1;
 s=use(s,15);assert.equal(card(s,15).tapped,false);s=use(s,15);assert.equal(card(s,15).tapped,true);assert.throws(()=>use(s,15));
 s=next(s);assert.equal(card(s,15).extraUses,1);assert.equal(card(s,15).tapped,false);
 s=board(['metronome','sweeper','paper']);card(s,1).enchantment=card(s,2).enchantment='smoked';
 s=act(act(s,{type:'draw'}),{type:'draw'});assert.equal(scoreMultiplier(s),2);assert.equal(card(s,3).zone,'discard');
});
test('Glazed upgrades collection values and doubles only the enchanted permanent card’s growth',()=>{
 let s=board(['cola','cola']);card(s,1).enchantment=card(s,2).enchantment='glazed';assert.equal(score(s),7);
 s=board(['rice','rice','cake','fridge','fish']);card(s,3).enchantment=card(s,4).enchantment='glazed';s=act(s,{type:'pair',ids:[1,2]});assert.equal(score(s),15);
 s=newRun(2,{rules:2,growthRoute:'broth'});card(s,1).enchantment='glazed';recordGrowth(s,'consume',{uid:5},()=>{});
 assert.equal(card(s,1).growthXP,2);assert.equal(card(s,2).growthXP,1);recordGrowth(s,'consume',{uid:5},()=>{});assert.equal(card(s,1).growthXP,2);
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
