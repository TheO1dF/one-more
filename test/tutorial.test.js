import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialRun,tutorialAct,lesson,lessonAllows} from '../game/tutorial.js';
import {card,score,restore,newRun,routeTargets,act,SAVE_KEY} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';
import {cleanLegacy,META_KEY} from '../game/storage.js';
test('first-table lesson is playable, persists, and joins the real run with rewards intact',()=>{
 let s=tutorialRun(600);const go=a=>{s=tutorialAct(s,a);assert.deepEqual(restore(JSON.stringify(s)),s);};
 assert.equal(s.cards.length,20);assert.equal(s.practice,false);
 for(let i=0;i<3;i++)go({type:'draw'});
 assert.equal(score(s),6);assert.equal(lessonAllows(s,{type:'draw'}),false);
 assert.throws(()=>tutorialAct(s,{type:'stop'}),/lesson/);
 go({type:'pair',ids:[1,2]});assert.equal(score(s),10);
 go({type:'draw'});go({type:'use',uid:15});assert.equal(card(s,15).tapped,true);assert.equal(card(s,s.known[0]).kind,'bomb');
 go({type:'stop'});assert.equal(s.bank,10);assert.equal(s.phase,'stakes');
 go({type:'roll'});go({type:'acceptDice',boon:'scout'});assert.equal(s.bank,10);
 const id=s.routeOffers[0];go({type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(s,id)[0].uid})});
 go({type:'add',id:s.offers[0]});const kinds=s.cards.map(c=>c.original).sort();go({type:'next'});
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
