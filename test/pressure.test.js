import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,restore} from '../game/engine.js';
import {diceEffects,diceFaces,bombGrowth,BOMB_INTERVAL} from '../game/stakes.js';
import {arrangeCards} from '../game/layout.js';

test('phone cards keep finger-sized faces in a single continuous row when a deck grows',()=>{
 for(const [w,h] of [[272,280],[312,310],[365,300],[670,128]]){
  const cards=Array.from({length:200},(_,uid)=>({uid,tapped:uid%9===8}));
  const small=arrangeCards(cards.slice(0,4),w,h,{touch:true}),large=arrangeCards(cards,w,h,{touch:true});
  assert.equal(small.scale,large.scale);assert.ok(large.cardW>=77);assert.ok(large.cardH>=110);assert.equal(large.pages.length,1);
  assert.equal(large.pages[0].length,1);assert.deepEqual(large.pages.flat(2),cards.map(c=>c.uid));
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
test('large decks add bombs without any position cap, new table safe, relic shuffle can kill immediately',()=>{
 const positions=new Set(),shaken=new Set();
 for(let seed=1;seed<=350;seed++){
  let s=late(seed,200),index=s.draw.findIndex(id=>card(s,id).kind==='bomb');positions.add(index);
  const bombs=1+Math.floor(180/BOMB_INTERVAL);assert.ok(index>=1);assert.equal(s.cards.length,199+bombs);assert.equal(s.cards.filter(c=>c.original==='bomb').length,bombs);
  assert.ok(s.draw.some((uid,i)=>i>32&&card(s,uid).kind==='bomb'));
  s=act(s,{type:'draw'});s.known=[...s.draw];s=act(s,{type:'relic',id:'shaker'});index=s.draw.findIndex(id=>card(s,id).kind==='bomb');shaken.add(index);
  assert.ok(index>=0);assert.equal(s.known.length,0);assert.equal(s.draw.filter(uid=>card(s,uid).kind==='bomb').length,bombs);assert.deepEqual(restore(JSON.stringify(s)),s);
 }
 assert.ok(Math.max(...positions)>32);assert.ok(shaken.has(0));assert.ok(Math.max(...shaken)>32);
});
test('growth thresholds count permanent non-bombs only and synchronize at the next table',()=>{
 for(const extra of [0,BOMB_INTERVAL-1,BOMB_INTERVAL,BOMB_INTERVAL*2-1,BOMB_INTERVAL*2,180]){
  const s=late(93,20+extra);assert.equal(bombGrowth(s).current,1+Math.floor(extra/BOMB_INTERVAL));assert.equal(bombGrowth(s).added,0);
 }
 let s=late(93,20+BOMB_INTERVAL-1);const template=s.cards[0];
 for(let i=0;i<80;i++)s.cards.push({...structuredClone(template),uid:++s.uid,temporary:true});
 assert.equal(bombGrowth(s).added,0);s.cards.at(-1).temporary=false;assert.equal(bombGrowth(s).added,1);
 const saved=restore(JSON.stringify(s));assert.equal(bombGrowth(saved).current,1);assert.deepEqual(saved.draw,s.draw);
 Object.assign(saved,{phase:'draft',added:true,relicOffer:[],carry:null});s=act(saved,{type:'next'});assert.equal(bombGrowth(s).current,2);assert.equal(s.bombsAddedThisTable,1);
 Object.assign(s,{phase:'draft',added:true,relicOffer:[],carry:null});s=act(s,{type:'next'});assert.equal(bombGrowth(s).current,2);assert.equal(s.bombsAddedThisTable,0);
});
test('added bombs survive shrinking the deck and cannot be removed or disguised in a save',()=>{
 let s=late(83,20+BOMB_INTERVAL*2);s.cards=s.cards.filter(c=>c.original==='bomb'||c.uid===1||c.uid===2);Object.assign(s,{phase:'draft',added:true,relicOffer:[],carry:null});s=act(s,{type:'next'});
 assert.equal(bombGrowth(s).current,3);assert.equal(bombGrowth(s).added,0);assert.notEqual(card(s,s.draw[0]).kind,'bomb');
 s.phase='route';s.routeOffers=['prune','raw'];s.bank=20;const uid=s.cards.find(c=>c.original==='bomb').uid;assert.throws(()=>act(s,{type:'chooseRoute',id:'prune',uid}));
 card(s,uid).kind='rice';assert.equal(restore(JSON.stringify(s)),null);
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
