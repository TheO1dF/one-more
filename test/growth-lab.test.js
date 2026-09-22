import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {newRun,act,card,value,score,restore,routeTargets,toolProblem} from '../game/engine.js';
import {GROWTH_ROUTES,GROWTH_CARDS,GROWTH_RELICS,registerGrowthContent,growthBase,growthStorage} from '../game/growth-lab.js';
import {ROUTES} from '../game/routes.js';
import {nextTarget} from '../game/pacing.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
const run=(route='broth')=>newRun(600,{rules:2,growthRoute:route});
function put(s,kind,props={}){const c={uid:++s.uid,kind,original:kind,zone:'table',pairedOnce:false,tapped:false,...props};s.cards.push(c);s.table.push(c.uid);return c;}
const core=s=>card(s,1);
function nextTable(s){
 s.flips=Math.max(1,s.flips);s.bank=Math.max(s.bank,s.target);s=act(s,{type:'stop'});
 if(s.phase==='midnight')s=act(s,{type:'acceptMidnight'});
 s=act(s,{type:'roll'});s=act(s,{type:'acceptDice',boon:'scout'});
 const id=s.routeOffers[0];s=act(s,{type:'chooseRoute',id,...(['event','staple'].includes(ROUTES[id].type)?{}:{uid:routeTargets(s,id)[0].uid})});
 assert.ok(s.offers.includes('growth-'+s.growth.route));s=act(s,{type:'add',id:s.offers[0]});
 if(s.relicOffer.length)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});return act(s,{type:'next'});
}
test('six isolated 20-card presets, 14 cards, six pledged items and valid save data',()=>{
 assert.equal(Object.keys(GROWTH_CARDS).length,14);assert.equal(Object.keys(GROWTH_RELICS).length,6);
 for(const [id,r] of Object.entries(GROWTH_ROUTES)){
  const s=run(id);assert.equal(s.cards.length,20);assert.equal(card(s,s.draw[0]).kind,r.core);assert.ok(s.relics.includes(r.relic));assert.equal(s.cards.filter(c=>c.kind==='bomb').length,1);assert.deepEqual(restore(JSON.stringify(s)),s);
 }
});
test('Stock grows off-table; returned food cannot repeatedly farm consumption and no implicit residue appears',()=>{
 let s=run();const tool=put(s,'mincer'),food=put(s,'rice');
 s=act(s,{type:'use',uid:tool.uid,target:food.uid});assert.equal(card(s,food.uid).zone,'table');assert.equal(core(s).growthXP,1);
 card(s,tool.uid).tapped=false;s=act(s,{type:'use',uid:tool.uid,target:food.uid});assert.equal(core(s).growthXP,1);
 for(let i=0;i<2;i++){card(s,tool.uid).tapped=false;const f=put(s,'fish');s=act(s,{type:'use',uid:tool.uid,target:f.uid});}
 assert.equal(growthBase(core(s)),4);assert.equal(s.cards.some(c=>c.kind==='residue'),false);
 const savedXP=core(s).growthXP;s=nextTable(s);assert.equal(core(s).growthXP,savedXP);assert.equal(growthBase(core(s)),4);
 assert.equal(growthBase(core(run())),2);
});
test('food retention, free tool fees and discarding do not count as consumption',()=>{
 let s=run();const tool=put(s,'mincer'),food=put(s,'rice',{keepOnce:true});
 s=act(s,{type:'use',uid:tool.uid,target:food.uid});assert.equal(core(s).growthXP,undefined);
 const scope=put(s,'scope');s.freePayments=1;s=act(s,{type:'use',uid:scope.uid});assert.equal(core(s).growthXP,undefined);
 const sifter=put(s,'sifter');s=act(s,{type:'use',uid:sifter.uid});s=act(s,{type:'resolveSift',discard:true});assert.equal(core(s).growthXP,undefined);
 const tray=put(s,'tray'),paper=put(s,'paper');s=act(s,{type:'use',uid:tray.uid,target:paper.uid});assert.equal(core(s).growthXP,undefined);
});
test('pair growth credits actual pairs, not repeated abilities or the same re-paired physical pair',()=>{
 let s=run('dough');const a=put(s,'rice'),b=put(s,'rice');
 s=act(s,{type:'pair',ids:[a.uid,b.uid]});assert.equal(core(s).growthXP,1);assert.equal(s.cards.filter(c=>c.temporary&&c.kind==='wild').length,1);
 for(const uid of [a.uid,b.uid]){card(s,uid).pair=null;card(s,uid).pairedOnce=false;}
 s=act(s,{type:'pair',ids:[a.uid,b.uid]});assert.equal(core(s).growthXP,1);
 for(let i=0;i<2;i++){const x=put(s,'fish'),y=put(s,'fish');s=act(s,{type:'pair',ids:[x.uid,y.uid]});}
 assert.equal(growthBase(core(s)),4);
});
test('generation counts individual new foods; nursery permanent promotion happens once per table',()=>{
 let s=run('garden');const box=put(s,'sproutbox');
 s=act(s,{type:'use',uid:box.uid});card(s,box.uid).tapped=false;s=act(s,{type:'use',uid:box.uid});
 assert.equal(core(s).growthXP,4);assert.equal(growthBase(core(s)),4);
 const sprouts=s.cards.filter(c=>c.kind==='sprouts');assert.equal(sprouts.length,4);assert.equal(sprouts.filter(c=>!c.temporary).length,1);
 s=nextTable(s);assert.equal(s.cards.filter(c=>c.kind==='sprouts').length,1);assert.equal(growthBase(core(s)),4);
});
test('variety counts each kind once across tables and third-kind menu clears trouble without invalidating a Rice target',()=>{
 let s=run('banquet');
 for(const kind of ['fish','mint']){const a=put(s,kind),b=put(s,kind);s=act(s,{type:'pair',ids:[a.uid,b.uid]});}
 const paper=put(s,'paper');put(s,'rust');const a=put(s,'rice'),b=put(s,'rice');s=act(s,{type:'pair',ids:[a.uid,b.uid],target:paper.uid});
 assert.equal(growthBase(core(s)),4);assert.equal(s.table.some(uid=>['paper','rust'].includes(card(s,uid).kind)),false);
 s=nextTable(s);const x=put(s,'rice'),y=put(s,'rice');s=act(s,{type:'pair',ids:[x.uid,y.uid]});assert.equal(core(s).growthXP,3);
});
test('clearing grows Pickles and brush permanently removes only one permanent trouble per table',()=>{
 let s=run('pickle');const washer=put(s,'washpress'),a=put(s,'paper'),b=put(s,'rust');
 s=act(s,{type:'use',uid:washer.uid,target:a.uid});assert.equal(card(s,a.uid),undefined);
 card(s,washer.uid).tapped=false;s=act(s,{type:'use',uid:washer.uid,target:b.uid});assert.equal(card(s,b.uid).zone,'discard');assert.equal(growthBase(core(s)),4);
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('spending grows Vintage, first cost refunds half; Sample bottle inherits growth but ordinary Mold does not',()=>{
 let s=run('cellar');s.bank=30;const bottle=put(s,'cellarpress'),mold=put(s,'mold');
 s=act(s,{type:'draw'});core(s).growthXP=12;core(s).growthLevel=2;
 s=act(s,{type:'use',uid:bottle.uid,target:1});assert.equal(s.bank,28);
 const copy=s.cards.find(c=>c.temporary&&c.kind==='vintage');assert.equal(copy.growthLevel,2);assert.equal(value(s,copy),8);
 s=act(s,{type:'use',uid:mold.uid,target:1});assert.equal(s.bank,26);assert.equal(core(s).growthLevel,3);
 const baseCopy=s.cards.filter(c=>c.temporary&&c.kind==='vintage').find(c=>c.uid!==copy.uid);assert.equal(value(s,baseCopy),2);assert.equal(card(s,copy.uid).growthLevel,2);
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('invalid bank-cost target rolls back charge and growth; pruning costs also count',()=>{
 let s=run('cellar');s.bank=20;const tool=put(s,'cellarpress');const before=JSON.stringify(s);
 assert.throws(()=>act(s,{type:'use',uid:tool.uid,target:9999}));assert.equal(JSON.stringify(s),before);
 s.phase='route';s.routeOffers=['prune','tea'];s=act(s,{type:'chooseRoute',id:'prune',uid:4});assert.equal(core(s).growthXP,4);assert.equal(s.bank,18);
});
test('Tasting fork excludes foods present on table and discovery remains resumable',()=>{
 let s=run('banquet');const tool=put(s,'tastingfork');put(s,'rice');put(s,'fish');
 s=act(s,{type:'use',uid:tool.uid});assert.equal(s.pending.offers.length,3);assert.ok(!s.pending.offers.includes('rice'));assert.ok(!s.pending.offers.includes('fish'));
 s=restore(JSON.stringify(s));const kind=s.pending.offers[0];s=act(s,{type:'discover',kind});assert.equal(s.pending,null);assert.ok(s.cards.some(c=>c.kind===kind&&c.temporary));
});
test('newly added cores get no retroactive growth; growth changes no bomb order or instant death rule',()=>{
 let s=run('dough');const order=[...s.draw];
 for(let i=0;i<3;i++){const a=put(s,'rice'),b=put(s,'rice');s=act(s,{type:'pair',ids:[a.uid,b.uid]});}
 assert.deepEqual(s.draw,order);const fresh=put(s,'sourdough');assert.equal(growthBase(fresh),2);
 const bomb=s.cards.find(c=>c.kind==='bomb');s.draw=[bomb.uid,...s.draw.filter(uid=>uid!==bomb.uid)];s=act(s,{type:'draw'});assert.equal(s.phase,'lost');assert.equal(s.reason,'bomb');
});
test('grown scoring survives pairing and enchantment; temporary transformation does not inherit its base',()=>{
 let s=run('dough');s=act(s,{type:'draw'});Object.assign(core(s),{growthXP:9,growthLevel:3,enchantment:'raw'});
 assert.equal(value(s,core(s)),32);const wild=put(s,'wild');s=act(s,{type:'pair',ids:[1,wild.uid]});assert.equal(value(s,core(s)),32);
 core(s).kind='wild';assert.equal(value(s,core(s)),4);
});
test('target variants are fixed curves independent of bank; test storage cannot overwrite normal saves',()=>{
 const s=run();s.round=8;s.target=300;assert.equal(nextTarget(s,20),420);s.bank=9999;assert.equal(nextTarget(s,20),420);
 s.growth.curve='classic';assert.equal(nextTarget(s,20),320);
 const data=new Map([['one-more.run.v5','normal']]),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const isolated=growthStorage(storage);isolated.setItem('one-more.run.v5','test');assert.equal(storage.getItem('one-more.run.v5'),'normal');assert.equal(isolated.getItem('one-more.run.v5'),'test');
});
test('invalid growth values are rejected on restore',()=>{
 for(const level of [-1,11,1.5]){const s=run();core(s).growthLevel=level;assert.equal(restore(JSON.stringify(s)),null);}
 const s=run();s.growth.route='missing';assert.equal(restore(JSON.stringify(s)),null);
});
test('all six routes can traverse all nine reward boundaries with growth preserved in saved runs',()=>{
 for(const id of Object.keys(GROWTH_ROUTES)){
  let s=run(id);core(s).growthLevel=2;core(s).growthXP=GROWTH_ROUTES[id].every*2;
  for(let round=1;round<10;round++){
   s=nextTable(s);assert.equal(s.round,round+1);assert.ok(core(s).growthLevel>=2);
   const recovered=restore(JSON.stringify(s));assert.ok(recovered);s=recovered;
  }
  s.flips=1;s.bank=s.target;s=act(s,{type:'stop'});assert.equal(s.phase,'won');
 }
});
