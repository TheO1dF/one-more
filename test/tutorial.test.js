import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialRun,tutorialAct,lesson,lessonAllows,tutorialObserve,tutorialUIAllows} from '../game/tutorial.js';
import {card,score,restore,newRun,routeTargets,act,SAVE_KEY} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';
import {cleanLegacy,META_KEY} from '../game/storage.js';
import {tutorialGuideStep} from '../game/tutorial-guide.js';
function paired(seed=600){
 let s=tutorialRun(seed);s=tutorialAct(s,{type:'draw'});
 s=tutorialObserve(s,'card');s=tutorialAct(s,{type:'draw'});return tutorialAct(s,{type:'pair',ids:[4,5]});
}
function finish(s,route='lantern'){
 if(s.lesson===7){s=tutorialAct(s,{type:'use',uid:15});s=tutorialObserve(s,'preview');s=tutorialAct(s,{type:'relic',id:'shaker'});}
 for(const a of [{type:'stop'},{type:'roll'},{type:'acceptDice',boon:'scout'}])s=tutorialAct(s,a);
 s=tutorialAct(s,{type:'chooseRoute',id:route,...(ROUTES[route].type==='event'?{}:{uid:routeTargets(s,route)[0].uid})});
 s=tutorialAct(s,{type:'add',id:s.offers[0]});return tutorialAct(s,{type:'next'});
}
function rescued(seed=600){
 let s=tutorialObserve(paired(seed),'preview');
 s=tutorialAct(s,{type:'draw'});return tutorialAct(s,{type:'draw'});
}
test('tutorial teaches table actions before the dealer lures the player into Pan intervention',()=>{
 let s=tutorialRun(44);
 assert.equal(lesson(s)[4],'draw');assert.equal(s.table.length,0);
 s=tutorialAct(s,{type:'draw'});assert.equal(lesson(s)[5].id,'inspect');
 assert.equal(tutorialUIAllows(s,'draw'),false);assert.equal(tutorialObserve(s,'preview'),s);
 s=tutorialObserve(s,'card');s=tutorialAct(s,{type:'draw'});
 assert.equal(lesson(s)[4],'pair');assert.equal(lessonAllows(s,{type:'draw'}),false);
 s=tutorialAct(s,{type:'pair',ids:[4,5]});assert.equal(score(s),8);assert.equal(s.known[0],15);
 assert.equal(tutorialGuideStep(s).selector,'.preview-slot.known');
 s=tutorialObserve(s,'preview');s=tutorialAct(s,{type:'draw'});
 assert.equal(lesson(s)[5].id,'lure');assert.equal(s.draw[0],20);
 s=tutorialAct(s,{type:'draw'});
 assert.equal(s.phase,'play');assert.equal(s.protectionLeft,0);assert.equal(score(s),8);
 assert.equal(card(s,20).zone,'deck');assert.equal(card(s,15).tapped,false);
 assert.equal(lesson(s)[0],'潘神');assert.equal(lessonAllows(s,{type:'stop'}),false);
});
test('after Pan and the peek/shuffle lesson, cash-out keeps rewards and continues the run',()=>{
 for(let seed=1;seed<=40;seed++)for(const route of ['lantern','raw']){
  const s=finish(rescued(seed),route);
  assert.equal(s.round,2);assert.equal(s.bank,8);assert.equal(lesson(s),null);
  assert.equal(s.protectionLeft,0);assert.equal(s.phase,'play');
  assert.ok(s.cards.length>20);assert.deepEqual(restore(JSON.stringify(s)),s);
  assert.equal(tutorialAct(s,{type:'draw'}).phase,'play');
 }
});
test('tool guidance progresses after rescue and peeks the actual shuffled top card',()=>{
 let s=rescued(),top=s.draw[0];
 s=tutorialAct(s,{type:'use',uid:15});assert.equal(s.known[0],top);
 assert.equal(lesson(s)[5].id,'bomb-preview');
 s=tutorialObserve(s,'preview');assert.equal(lesson(s)[4],'relic');
 assert.equal(tutorialGuideStep(s).selector,'.relic-token[data-id="shaker"]');
 s=tutorialAct(s,{type:'relic',id:'shaker'});
 assert.notEqual(s.draw[0],top);assert.equal(s.known.length,0);
 assert.equal(lesson(s)[4],'choice');assert.equal(lesson(finish(s)),null);
});
test('the second bomb kills; retry restores a single glass and keeps guidance with a fresh deal',()=>{
 let s=rescued();assert.equal(s.protectionLeft,0);
 s=restore(JSON.stringify(s));assert.equal(lesson(s)[5].id,'tool');
 s=tutorialAct(s,{type:'use',uid:15});s=tutorialObserve(s,'preview');s=tutorialAct(s,{type:'relic',id:'shaker'});
 s.draw=[20,...s.draw.filter(id=>id!==20)];
 s=tutorialAct(s,{type:'draw'});assert.equal(s.phase,'lost');assert.equal(lesson(s)[4],'retry');
 assert.equal(tutorialGuideStep(s).selector,'.result [data-action="retry"]');
 s=tutorialAct(s,{type:'retry'});
 assert.equal(s.protectionLeft,1);assert.equal(s.tutorialRetry,true);assert.equal(lesson(s)[5].id,'retry-first');
 s=tutorialAct(s,{type:'draw'});assert.equal(s.phase,'play');assert.equal(lesson(s)[5].id,'retry-play');
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('outside tutorial actions are unchanged',()=>{
 let a=newRun(144),b=structuredClone(a);
 while(a.phase==='play'){a=act(a,{type:'draw'});b=tutorialAct(b,{type:'draw'});assert.deepEqual(a,b);}
});
test('legacy cleanup preserves unrelated data and current saves on subsequent launches',()=>{
 const map=new Map([['one-more.run.v4','test'],['pushluck.save','test'],['cardeater.save','keep'],['unrelated','keep']]);
 const storage={get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 cleanLegacy(storage);assert.equal(map.has('one-more.run.v4'),false);assert.equal(map.get('cardeater.save'),'keep');
 map.set(SAVE_KEY,'current');map.set(META_KEY,'progress');cleanLegacy(storage);assert.equal(map.get(SAVE_KEY),'current');assert.equal(map.get(META_KEY),'progress');
});

test('a rescue during a randomized retry does not send the player to a missing flashlight',()=>{
 let s=tutorialRun(823,true);s=tutorialAct(s,{type:'draw'});
 s.draw=[20,...s.draw.filter(id=>id!==20)];s=tutorialAct(s,{type:'draw'});
 assert.equal(s.protectionLeft,0);assert.equal(s.lesson,10);assert.equal(lesson(s)[5].id,'retry-play');
 assert.equal(lessonAllows(s,{type:'draw'}),true);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('the rescued tutorial cannot lose its peek target by drawing before inspecting',()=>{
 let s=rescued();assert.equal(lessonAllows(s,{type:'draw'}),false);
 s=tutorialAct(s,{type:'use',uid:15});assert.equal(lessonAllows(s,{type:'draw'}),false);
 s=tutorialObserve(s,'preview');assert.equal(lessonAllows(s,{type:'draw'}),false);
 s=tutorialAct(s,{type:'relic',id:'shaker'});assert.equal(lessonAllows(s,{type:'draw'}),true);
});
