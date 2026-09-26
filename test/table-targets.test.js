import test from 'node:test';
import assert from 'node:assert/strict';
import {actionTargetIds} from '../game/action-selection.js';
import {splitTargets,targetArrow} from '../game/table-targets.js';
test('table target selection preserves exact card identity and keeps off-table choices available',()=>{
 const s={phase:'play',cards:[{uid:1,kind:'fish',zone:'table'},{uid:2,kind:'fish',zone:'discard'},{uid:3,kind:'fish',zone:'deck'}]};
 const choices=[{id:1},{id:2},{id:3},{id:'fish'},{id:null}];
 assert.deepEqual(splitTargets(s,choices),{onTable:[choices[0]],elsewhere:choices.slice(1)});
 assert.deepEqual(splitTargets({...s,phase:'route'},choices),{onTable:[],elsewhere:choices});
 assert.deepEqual(splitTargets(s),{onTable:[],elsewhere:[]});
});
test('confirmation tracks partner, cost and effect target without mutating the draft',()=>{
 const a={type:'use',uid:18,food:1,target:17},before=JSON.stringify(a);
 assert.deepEqual(actionTargetIds(a),[1,17]);assert.equal(JSON.stringify(a),before);
 assert.deepEqual(actionTargetIds({type:'pair',ids:[7,8],targets:[17,17]}),[8,17]);
 assert.deepEqual(actionTargetIds({type:'pair',ids:[1,2],target:null}),[2]);
});
test('target arrow ends on the card with a finite direction, including vertically aligned cards',()=>{
 for(const x of [20,200,400]){const a={x:200,y:300,width:100,height:150},b={x,y:300,width:100,height:150};const arrow=targetArrow(a,b);assert.equal(arrow.x,x+50);assert.equal(arrow.y,308);assert.ok(Number.isFinite(arrow.angle));assert.ok(!arrow.path.includes('NaN'));}
});
