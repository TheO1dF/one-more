import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,restore} from '../game/engine.js';
import {nextTarget} from '../game/pacing.js';
function dice(s,total){return {...s,phase:'stakes',dice:{count:1,rolls:[{total,faces:[total]}],result:{total,faces:[total]}}};}
test('early windfall cannot fund all later tables; actual dice still raise difficult stakes',()=>{
 for(let round=1;round<10;round++){
  const s=dice({...newRun(91),round,bank:1000,target:100},6),n=act(s,{type:'acceptDice'});
  assert.equal(n.target-s.bank,round+1>=5?12:8);
  assert.deepEqual(restore(JSON.stringify(n)),n);
 }
 const s=dice({...newRun(1),bank:8,target:8},19);
 assert.equal(act(s,{type:'acceptDice',boon:'scout'}).target,27);
 assert.equal(nextTarget(s),27);
});
test('old save keeps current target and applies new stakes at the next accepted roll only',()=>{
 let s={...newRun(1),bank:100,target:25};
 const old=JSON.stringify(s);assert.deepEqual(restore(old),s);
 s=act(s,{type:'draw'});s=act(s,{type:'stop'});assert.equal(s.phase,'stakes');
 s=act(s,{type:'roll'});const expected=nextTarget(s);
 const n=act(s,{type:'acceptDice',boon:'scout'});assert.equal(n.target,expected);assert.ok(n.target>n.bank);
});


test('second table adds four points once while banked windfalls remain useful',()=>{
 for(const difficulty of [0,1,2,3])for(let roll=1;roll<=20;roll++){
  const s=dice({...newRun(91,{rules:2,difficulty}),bank:100},roll);
  const expected=s.target+roll+4+(difficulty>=2?2:0);
  assert.equal(nextTarget(s),expected);
  const n=act(s,{type:'acceptDice',boon:'scout'});
  assert.equal(n.target,expected);assert.equal(n.bank,100);
  assert.deepEqual(restore(JSON.stringify(n)),n);
  assert.equal(nextTarget({...s,round:2}),s.target+roll+(difficulty>=2?2:0));
 }
 const s=dice(newRun(3,{rules:2}),10),old=JSON.stringify(s);
 assert.deepEqual(restore(old),s);
 assert.equal(nextTarget({...s,practice:true}),s.target+10);
 assert.equal(nextTarget({...s,endless:true,round:10}),s.target*2);
});
