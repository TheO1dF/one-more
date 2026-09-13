import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,score} from '../game/engine.js';
import {planBoard,boardActions,playerAction} from '../scripts/table-planner.mjs';
function board(){const s=newRun(89),base=s.cards[0];s.cards=[];s.uid=0;s.table=[];s.draw=[];s.target=1000;s.flips=6;s.relics=[];for(const k of ['egg','egg','juicer','scoop','choppingboard','servingbell','rice','bomb']){const c={...structuredClone(base),uid:++s.uid,kind:k,original:k,zone:s.uid<=6?'table':'deck'};s.cards.push(c);s[c.zone==='table'?'table':'draw'].push(c.uid);}return s;}
test('bounded planner finds a consume-reclaim-pair line beyond immediate pairing',()=>{
 let s=board();const before=score(s),first=planBoard(s,{depth:5,width:8});assert.equal(first.action.type,'use');
 const actions=[];for(let i=0;i<12;i++){const p=planBoard(s,{depth:5,width:8});if(!p.action)break;actions.push(p.action);s=act(s,p.action);}
 assert.equal(score(s),18,JSON.stringify(actions));assert.ok(score(s)>before+4);
 let optimum=before,nodes=0;function visit(t,depth){nodes++;optimum=Math.max(optimum,score(t));if(!depth)return;for(const a of boardActions(t)){try{visit(act(t,a),depth-1);}catch{}}}
 visit(board(),6);assert.equal(score(s),optimum);assert.ok(nodes>1);
});
test('planning does not choose using unseen order, identities or RNG state',()=>{
 const a=board(),b=structuredClone(a);b.draw.reverse();b.rng=2398113;b.seed=9;for(const id of b.draw){const c=b.cards.find(c=>c.uid===id);c.kind=c.original=c.kind==='bomb'?'salad':'bomb';}
 assert.deepEqual(planBoard(a,{depth:5,width:8}).action,planBoard(b,{depth:5,width:8}).action);
 assert.deepEqual(playerAction(a),playerAction(b));
});
