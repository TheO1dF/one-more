import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,restore} from '../game/engine.js';
import {diceEffects,diceFaces} from '../game/stakes.js';
import {arrangeCards} from '../game/layout.js';

test('phone cards keep finger-sized faces when a deck grows, with bounded rows and pagination',()=>{
 for(const [w,h] of [[272,280],[312,310],[365,300],[670,128]]){
  const cards=Array.from({length:200},(_,uid)=>({uid,tapped:uid%9===8}));
  const small=arrangeCards(cards.slice(0,4),w,h,{touch:true}),large=arrangeCards(cards,w,h,{touch:true});
  assert.equal(small.scale,large.scale);assert.ok(large.cardW>=77);assert.ok(large.cardH>=110);assert.ok(large.pages.length>1);
  assert.ok(large.pages.every(p=>p.length<=2));assert.deepEqual(large.pages.flat(2),cards.map(c=>c.uid));
  for(const page of large.pages)for(const row of page)assert.ok(row.reduce((n,uid)=>n+(cards[uid].tapped?large.cardH:large.cardW)+large.gap,0)<=w+.001);
 }
});

function late(seed,n=120){
 const s=newRun(seed);while(s.cards.length<n){const c=structuredClone(s.cards[0]);c.uid=++s.uid;s.cards.push(c);}
 Object.assign(s,{round:4,phase:'draft',added:true,relicOffer:[],carry:null});return act(s,{type:'next'});
}
test('midnight is an explicit event after table four, before two-die stakes',()=>{
 let s=newRun(9);s.round=4;s.target=0;s=act(act(s,{type:'draw'}),{type:'stop'});
 assert.equal(s.phase,'midnight');assert.equal(s.dice.count,2);assert.deepEqual(restore(JSON.stringify(s)),s);
 assert.throws(()=>act(s,{type:'roll'}),/phase/);s=act(s,{type:'acceptMidnight'});s=act(s,{type:'roll'});
 assert.equal(s.dice.result.faces.length,2);assert.equal(s.dice.result.total,s.dice.result.faces.reduce((a,b)=>a+b));
});
test('large decks use one uniformly cut bomb, new table safe, relic shuffle can be immediately lethal',()=>{
 const positions=new Set(),shaken=new Set();
 for(let seed=1;seed<=350;seed++){
  let s=late(seed,200),index=s.draw.findIndex(id=>card(s,id).kind==='bomb');positions.add(index);
  assert.ok(index>=1&&index<32);assert.equal(s.cards.length,200);assert.equal(s.cards.filter(c=>c.original==='bomb').length,1);
  s=act(s,{type:'draw'});s.known=[...s.draw];s=act(s,{type:'relic',id:'shaker'});index=s.draw.findIndex(id=>card(s,id).kind==='bomb');shaken.add(index);
  assert.ok(index>=0&&index<32);assert.equal(s.known.length,0);assert.deepEqual(restore(JSON.stringify(s)),s);
 }
 assert.equal(positions.size,31);assert.ok(shaken.has(0));assert.ok(shaken.has(31));
});
test('small decks keep safe first draw and all non-bomb positions; negatives never rearrange the bomb',()=>{
 for(let seed=1;seed<60;seed++){
  let s=late(seed,20);assert.notEqual(card(s,s.draw[0]).kind,'bomb');assert.equal(s.draw.length,20);
  card(s,s.draw[0]).kind=card(s,s.draw[0]).original='debt';const expected=s.draw.slice(1);s=act(s,{type:'draw'});assert.deepEqual(s.draw,expected);
 }
});
test('each critical face stays fixed on the only reroll; result and save keep both dice',()=>{
 const cases=new Set();
 for(let seed=1;seed<400;seed++){
  let s=newRun(seed);Object.assign(s,{phase:'stakes',round:4,dice:{count:2,rolls:[],result:null}});s=act(s,{type:'roll'});const old=diceFaces(s.dice.result);
  if(s.dice.result.locked){assert.throws(()=>act(s,{type:'roll'}),/rollLimit/);continue;}
  s=act(s,{type:'roll'});old.forEach((n,i)=>{if(n===1||n===20){assert.equal(s.dice.result.faces[i],n);cases.add(n);assert.equal(s.dice.result.held[i],true);}});
  assert.throws(()=>act(s,{type:'roll'}),/rollLimit/);assert.deepEqual(restore(JSON.stringify(s)),s);
 }
 assert.equal(cases.size,2);
});
test('each die adds trouble but boons never double, including mixed 1 and 20',()=>{
 assert.deepEqual(diceEffects({faces:[1,20]}),{trouble:['debt','rust','paper'],boon:'feast'});
 assert.deepEqual(diceEffects({faces:[1,1]}).trouble,['debt','rust','paper','debt','rust','paper']);
 assert.equal(diceEffects({faces:[20,20]}).boon,'feast');
 assert.equal(diceEffects({faces:[1,18]}).boon,'choose');
 let s=newRun(7);Object.assign(s,{phase:'stakes',round:4,dice:{count:2,rolls:[],result:{faces:[1,20],total:21,locked:true,tier:'criticalHigh'}}});
 const count=s.cards.length,target=s.target;s=act(s,{type:'acceptDice'});assert.equal(s.target,target+21);assert.equal(s.cards.length,count+3);assert.equal(s.nextBoon,'feast');
});
test('legacy completed die rolls resume as one die, malformed faces are rejected',()=>{
 let s=newRun(8);s.phase='stakes';s.dice={rolls:[{total:7,tier:'steady',locked:false}],result:{total:7,tier:'steady',locked:false}};
 assert.ok(restore(JSON.stringify(s)));s=act(s,{type:'roll'});assert.equal(s.dice.result.faces.length,1);
 s.dice.result.faces=[0,21];assert.equal(restore(JSON.stringify(s)),null);
});
