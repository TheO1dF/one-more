import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialRun,tutorialAct,lesson,lessonAllows,tutorialObserve,lessonReady} from '../game/tutorial.js';
import {card,score,restore,newRun,routeTargets,act,SAVE_KEY} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';
import {cleanLegacy,META_KEY} from '../game/storage.js';
import {tutorialGuideStep} from '../game/tutorial-guide.js';
test('first-table lesson is playable, persists, and joins the real run with rewards intact',()=>{
 let s=tutorialRun(600);const read=()=>{while(lesson(s)?.[4]==='lessonNext'){const observe=lesson(s)[5].observe;if(observe)s=tutorialObserve(s,observe);s=tutorialAct(s,{type:'lessonNext'});}};
 const go=a=>{read();s=tutorialAct(s,a);assert.deepEqual(restore(JSON.stringify(s)),s);};
 read();
 assert.equal(s.cards.length,20);assert.equal(s.practice,false);
 for(let i=0;i<3;i++)go({type:'draw'});
 assert.equal(score(s),6);assert.equal(lessonAllows(s,{type:'draw'}),false);
 assert.throws(()=>tutorialAct(s,{type:'stop'}),/lesson/);
 go({type:'pair',ids:[1,2]});assert.equal(score(s),10);
 go({type:'draw'});go({type:'use',uid:15});assert.equal(card(s,15).tapped,true);assert.equal(card(s,s.known[0]).kind,'bomb');
 go({type:'draw'});assert.equal(s.phase,'lost');assert.equal(s.reason,'bomb');assert.equal(lesson(s)[4],'retry');assert.equal(s.bank,0);
 assert.equal(lessonAllows(s,{type:'draw'}),false);go({type:'retry'});assert.equal(lesson(s)[5].id,'action-8');assert.equal(s.phase,'play');assert.equal(s.bank,0);assert.equal(s.table.length,0);assert.equal(s.cards.length,20);
 go({type:'draw'});go({type:'draw'});go({type:'pair',ids:[1,2]});
 go({type:'draw'});go({type:'use',uid:15});assert.equal(card(s,s.known[0]).kind,'bomb');
 assert.equal(lessonAllows(s,{type:'draw'}),false);go({type:'relic',id:'shaker'});
 assert.equal(s.known.length,0);assert.equal(s.relicUsed.shaker,true);
 go({type:'stop'});assert.equal(s.bank,8);assert.equal(s.phase,'stakes');
 go({type:'roll'});go({type:'acceptDice',boon:'scout'});assert.equal(s.bank,8);
 const id=s.routeOffers[0];go({type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(s,id)[0].uid})});
 go({type:'add',id:s.offers[0]});const kinds=s.cards.map(c=>c.original).sort();go({type:'next'});read();
 assert.equal(s.round,2);assert.equal(s.maxRounds,10);assert.equal(lesson(s),null);assert.deepEqual(s.cards.filter(c=>!c.temporary).map(c=>c.original).sort(),kinds);assert.equal(s.cards.filter(c=>c.original==='bomb').length,1);
 assert.equal(tutorialAct(s,{type:'draw'}).flips,1);
});
test('outside tutorial the same random action sequence has identical results',()=>{
 let a=newRun(144),b=structuredClone(a);
 while(a.phase==='play'){a=act(a,{type:'draw'});b=tutorialAct(b,{type:'draw'});assert.deepEqual(a,b);}
});
test('legacy cleanup deletes only this game’s keys, once; current progress survives subsequent launches',()=>{
 const map=new Map([['one-more.run.v4','test'],['pushluck.save','test'],['cardeater.save','keep'],['unrelated','keep']]);
 const storage={get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 cleanLegacy(storage);assert.equal(map.has('one-more.run.v4'),false);assert.equal(map.has('pushluck.save'),false);assert.equal(map.get('cardeater.save'),'keep');
 map.set(SAVE_KEY,'current');map.set(META_KEY,'progress');cleanLegacy(storage);assert.equal(map.get(SAVE_KEY),'current');assert.equal(map.get(META_KEY),'progress');
});


test('reading checkpoints require real inspection, persist, and do not change game state',()=>{
 let s=tutorialRun(123);const before=structuredClone(s);
 assert.equal(lesson(s)[5].id,'goal');assert.equal(lessonAllows(s,{type:'draw'}),false);
 s=tutorialAct(s,{type:'lessonNext'});assert.deepEqual(s.cards,before.cards);assert.deepEqual(s.draw,before.draw);
 s=tutorialAct(s,{type:'draw'});assert.equal(lesson(s)[5].id,'inspect');assert.equal(lessonReady(s),false);
 assert.equal(tutorialGuideStep(s).selector,'.tile[data-kind=rice]');
 assert.throws(()=>tutorialAct(s,{type:'lessonNext'}),/lesson/);
 assert.equal(tutorialObserve(s,'preview'),s);
 s=tutorialObserve(s,'card');assert.equal(lessonReady(restore(JSON.stringify(s))),true);
 assert.equal(tutorialGuideStep(s).selector,'.inspector');
 const inspected=structuredClone(s);s=tutorialAct(s,{type:'lessonNext'});
 assert.deepEqual(s.table,inspected.table);assert.equal(s.bank,0);assert.equal(s.lessonObserved,undefined);
});

test('both tutorial paths and all packages finish across different dice outcomes',()=>{
 for(let seed=1;seed<=40;seed++)for(const route of ['lantern','raw']){
  let s=tutorialRun(seed);let guard=0;
  while(lesson(s)&&guard++<45){
   const type=lesson(s)[4];let a={type};
   if(type==='lessonNext'){
    if(lesson(s)[5].id==='ready'){
     assert.equal(lessonReady(s),false);
     assert.equal(tutorialGuideStep(s,{lang:'en'}).selector,'#current-deck');
    }
    s=tutorialObserve(s,lesson(s)[5].observe);
   }
   if(type==='pair')a.ids=[1,2];
   if(type==='use')a.uid=15;
   if(type==='relic')a.id='shaker';
   if(type==='acceptDice')a.boon='scout';
   if(type==='chooseRoute'){assert.deepEqual(s.routeOffers,['lantern','raw']);a.id=route;if(route==='raw')a.uid=routeTargets(s,route)[0].uid;}
   if(type==='add')a.id=s.offers[seed%3];
   s=tutorialAct(s,a);assert.deepEqual(restore(JSON.stringify(s)),s);
  }
  assert.ok(guard<45);assert.equal(lesson(s),null);assert.equal(s.phase,'play');assert.equal(s.round,2);assert.equal(s.bank,8);
  assert.equal(s.cards.filter(c=>c.original==='bomb').length,1);
 }
});
