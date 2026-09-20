import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialRun,tutorialAct} from '../game/tutorial.js';
import {restore,routeTargets} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';

test('tutorial without structuredClone matches native results and preserves prior state through reloads',()=>{
 const native=globalThis.structuredClone;
 let normal=tutorialRun(600),fallback=restore(JSON.stringify(normal));
 const go=action=>{
  normal=tutorialAct(normal,action);
  const before=JSON.stringify(fallback);
  try{globalThis.structuredClone=undefined;const next=tutorialAct(fallback,action);assert.equal(JSON.stringify(fallback),before);fallback=restore(JSON.stringify(next));}
  finally{globalThis.structuredClone=native;}
  assert.deepEqual(fallback,restore(JSON.stringify(normal)));
 };
 for(let i=0;i<3;i++)go({type:'draw'});
 go({type:'pair',ids:[1,2]});go({type:'draw'});go({type:'use',uid:15});go({type:'draw'});go({type:'retry'});
 go({type:'draw'});go({type:'draw'});go({type:'pair',ids:[1,2]});go({type:'draw'});go({type:'use',uid:15});
 go({type:'relic',id:'shaker'});go({type:'stop'});go({type:'roll'});
 if(!normal.dice.result.locked)go({type:'roll'});
 go({type:'acceptDice',boon:'scout'});
 const id=normal.routeOffers[0];go({type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(normal,id)[0].uid})});
 go({type:'add',id:normal.offers[0]});go({type:'next'});
 assert.equal(fallback.round,2);assert.equal(fallback.lesson,undefined);
});
