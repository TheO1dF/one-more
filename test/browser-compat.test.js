import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialRun,tutorialAct,lesson,tutorialObserve} from '../game/tutorial.js';
import {restore,routeTargets} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';

test('tutorial without structuredClone matches native results and preserves prior state through reloads',()=>{
 const native=globalThis.structuredClone;
 let normal=tutorialRun(600),fallback=restore(JSON.stringify(normal));
 const apply=action=>{
  normal=tutorialAct(normal,action);
  const before=JSON.stringify(fallback);
  try{globalThis.structuredClone=undefined;const next=tutorialAct(fallback,action);assert.equal(JSON.stringify(fallback),before);fallback=restore(JSON.stringify(next));}
  finally{globalThis.structuredClone=native;}
  assert.deepEqual(fallback,restore(JSON.stringify(normal)));
 };
 const read=()=>{if(lesson(normal)?.[4]==='inspect'){const kind=lesson(normal)[5].observe;normal=tutorialObserve(normal,kind);fallback=tutorialObserve(fallback,kind);}};
 const go=action=>{read();apply(action);};
 go({type:'draw'});go({type:'draw'});go({type:'pair',ids:[4,5]});go({type:'draw'});go({type:'draw'});go({type:'use',uid:15});
 go({type:'relic',id:'shaker'});go({type:'stop'});go({type:'roll'});
 if(!normal.dice.result.locked)go({type:'roll'});
 go({type:'acceptDice',boon:'scout'});
 const id=normal.routeOffers[0];go({type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(normal,id)[0].uid})});
 go({type:'add',id:normal.offers[0]});go({type:'next'});read();
 assert.equal(fallback.round,2);assert.equal(fallback.lesson,undefined);
});
