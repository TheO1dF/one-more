import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {newRun,act,restore,card,value} from '../game/engine.js';
import {registerGrowthContent} from '../game/growth-lab.js';
import {stapleCandidates,drawUnits,closedStaple,validStaples} from '../game/staples.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
const run=(seed=43)=>newRun(seed,{rules:2,growthRoute:'broth'});
function bind(seed=43){const s=run(seed);s.bank=40;s.phase='route';s.routeOffers=['staple','tea'];return act(s,{type:'chooseRoute',id:'staple'});}
function table(seed=43){const s=bind(seed);s.added=true;return act(s,{type:'next'});}
function top(s){const b=s.staples[0];s.draw=[...b.uids,...s.draw.filter(uid=>!b.uids.includes(uid))];return b;}
function prepared(kinds){const s=run();kinds.forEach((kind,i)=>{card(s,i+1).kind=card(s,i+1).original=kind;});s.stapleId=1;s.staples=[{id:1,uids:[1,2,3],readyRound:1}];top(s);return s;}

test('random binding is paid, immutable, excludes bombs, tokens, carried and already bound cards',()=>{
 const s=run();s.bank=20;s.phase='route';s.routeOffers=['staple','tea'];s.carry=1;
 const temp={...card(s,2),uid:++s.uid,temporary:true};s.cards.push(temp);
 s.stapleId=1;s.staples=[{id:1,uids:[3,4,5],readyRound:2}];
 const eligible=new Set(stapleCandidates(s).map(c=>c.uid)),old=JSON.stringify(s);
 const a=act(s,{type:'chooseRoute',id:'staple',uids:[1,2,20]}),b=act(restore(old),{type:'chooseRoute',id:'staple'});
 assert.equal(JSON.stringify(s),old);assert.equal(a.bank,16);assert.equal(a.phase,'draft');
 assert.deepEqual(a.staples,b.staples);assert.equal(a.staples[1].uids.length,3);
 assert.ok(a.staples[1].uids.every(id=>eligible.has(id)));assert.deepEqual(restore(JSON.stringify(a)),a);
 assert.throws(()=>act(a,{type:'chooseRoute',id:'staple'}));
});
test('unaffordable or too small a pool cannot consume points or reroll RNG',()=>{
 const s=run();s.phase='route';s.routeOffers=['staple','tea'];s.bank=3;const old=JSON.stringify(s);
 assert.throws(()=>act(s,{type:'chooseRoute',id:'staple'}),/routeCost/);assert.equal(JSON.stringify(s),old);
 s.bank=20;s.cards=s.cards.slice(0,2).concat(s.cards.filter(c=>c.kind==='bomb'));
 assert.throws(()=>act(s,{type:'chooseRoute',id:'staple'}),/noTarget/);
});
test('random sampling includes trouble and tools without selecting any bomb over 1000 seeds',()=>{
 const seen=new Set(),counts={};
 for(let seed=0;seed<1000;seed++){
  const s=run(seed);for(const [uid,kind] of [[3,'paper'],[4,'rust']])card(s,uid).kind=card(s,uid).original=kind;
  s.phase='route';s.routeOffers=['staple','tea'];s.bank=20;
  const result=act(s,{type:'chooseRoute',id:'staple'});
  for(const uid of result.staples[0].uids){const c=card(result,uid);assert.notEqual(c.original,'bomb');seen.add(CARDS[c.original].type);counts[uid]=(counts[uid]||0)+1;}
 }
 assert.ok(seen.has('trouble')&&seen.has('tool')&&seen.has('food'));
 assert.equal(Object.keys(counts).length,19);for(const n of Object.values(counts))assert.ok(n>100&&n<220);
});
test('packets shuffle as single units; first reveal is safe, later reshuffles can put bomb first',()=>{
 let s=table(),sawBomb=false;const b=s.staples[0];assert.notEqual(card(s,s.draw[0]).kind,'bomb');
 assert.equal(drawUnits(s).length,s.draw.length-2);
 for(let i=0;i<120;i++){
  s.flips=1;s.relicUsed={};s=act(s,{type:'relic',id:'shaker'});
  assert.ok(validStaples(s));const at=s.draw.indexOf(b.uids[0]);assert.deepEqual(s.draw.slice(at,at+3),b.uids);
  sawBomb||=card(s,s.draw[0]).kind==='bomb';
 }
 assert.ok(sawBomb);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('one draw separates exactly three cards, in order; tools remain manual and growth is preserved',()=>{
 let s=prepared(['stockpot','mincer','rice']);card(s,1).growthLevel=2;card(s,1).growthXP=6;card(s,1).enchantment='raw';
 const rest=s.draw.slice(3);s=act(s,{type:'draw'});
 assert.deepEqual(s.table,[1,2,3]);assert.equal(s.flips,3);assert.equal(s.staples.length,0);assert.deepEqual(s.draw,rest);
 assert.equal(value(s,card(s,1)),16);assert.equal(card(s,2).tapped,false);assert.ok(!s.cards.some(c=>c.kind==='mince'));
 s=act(s,{type:'use',uid:2,target:3});assert.equal(s.cards.filter(c=>c.kind==='mince').length,2);
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('trouble applies in packet order and entry effects fire once per constituent',()=>{
 let s=act(prepared(['rust','scope','wish']),{type:'draw'});assert.equal(card(s,2).tapped,true);assert.equal(s.cards.filter(c=>c.temporary&&c.kind==='wild').length,1);
 s=act(prepared(['scope','rust','wish']),{type:'draw'});assert.equal(card(s,1).tapped,false);assert.equal(s.table.length,4);
});
test('Sieve peeks one constituent, discards one and opens packet without losing or exposing the rest',()=>{
 let s=prepared(['rice','fish','paper']);const sieve=s.cards.find(c=>c.kind==='sifter');sieve.zone='table';s.table=[sieve.uid];s.draw=s.draw.filter(uid=>uid!==sieve.uid);
 s=act(s,{type:'use',uid:sieve.uid});assert.ok(s.known.includes(1));assert.ok(!s.known.includes(2)&&!s.known.includes(3));assert.ok(closedStaple(s,1));
 const before=s.draw.slice(1);s=act(s,{type:'resolveSift',discard:true});assert.equal(s.staples.length,0);assert.deepEqual(s.draw,before);assert.ok(s.discard.includes(1));assert.ok(!s.known.includes(2));assert.ok(restore(JSON.stringify(s)));
});
test('deleting a bound card shortens its packet; fewer than two dissolves it',()=>{
 let s=bind(),uids=[...s.staples[0].uids];s.phase='route';s.routeOffers=['prune','tea'];
 s=act(s,{type:'chooseRoute',id:'prune',uid:uids[0]});assert.deepEqual(s.staples[0].uids,uids.slice(1));
 s.phase='route';s.routeOffers=['prune','tea'];s=act(s,{type:'chooseRoute',id:'prune',uid:uids[1]});assert.equal(s.staples.length,0);assert.ok(card(s,uids[2]));
});
test('unopened packets persist next table, but opened cards are not automatically rebound',()=>{
 let s=table(),uids=[...s.staples[0].uids];s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.deepEqual(s.staples[0].uids,uids);assert.ok(validStaples(s));
 top(s);s=act(s,{type:'draw'});s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.equal(s.staples.length,0);assert.equal(drawUnits(s).length,s.draw.length);
});
test('bomb remains immediate death and corrupt packets cannot hide bombs or bypass save checks',()=>{
 let s=table();const bomb=s.cards.find(c=>c.kind==='bomb');s.draw=[bomb.uid,...s.draw.filter(uid=>uid!==bomb.uid)];s=act(s,{type:'draw'});assert.equal(s.reason,'bomb');assert.equal(s.phase,'lost');
 for(const mutate of [s=>s.staples[0].uids.push(20),s=>s.staples[0].uids[1]=s.staples[0].uids[0],s=>s.staples[0].uids=[20,1,2],s=>s.draw.reverse(),s=>s.staples[0].readyRound=999]){
  const corrupt=table();mutate(corrupt);assert.equal(restore(JSON.stringify(corrupt)),null);
 }
 assert.ok(restore(JSON.stringify(run())));
});
