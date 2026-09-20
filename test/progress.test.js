import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act} from '../game/engine.js';
import {trackProgress} from '../game/progress.js';
test('achievements are persistent, not awarded in tutorial, and do not change gameplay state',()=>{
 let s=newRun(1);s.draw=[1,2,...s.draw.filter(x=>x!==1&&x!==2)];s=act(act(s,{type:'draw'}),{type:'draw'});
 const action={type:'pair',ids:[1,2]},after=act(s,action),copy=JSON.stringify(after),meta={};
 assert.deepEqual(trackProgress(meta,{...s,lesson:10},after,action),[]);
 assert.deepEqual(trackProgress(meta,s,after,action),['first_pair']);
 const saved=JSON.parse(JSON.stringify(meta));assert.deepEqual(trackProgress(saved,s,after,action),[]);assert.equal(JSON.stringify(after),copy);
});
