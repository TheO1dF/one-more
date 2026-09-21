import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,relicProblem,restore} from '../game/engine.js';

function board(kinds){
 const s=newRun(51);
 s.cards=[...kinds,'fish','bomb'].map((kind,i)=>({uid:i+1,kind,original:kind,zone:i<kinds.length?'table':'deck',tapped:false,pair:null,pairedOnce:false}));
 s.table=s.cards.filter(c=>c.zone==='table').map(c=>c.uid);s.draw=s.cards.filter(c=>c.zone==='deck').map(c=>c.uid);
 s.discard=[];s.known=[];s.uid=s.cards.length;s.flips=kinds.length;s.relics=['recycler'];return s;
}
for(const freePayments of [0,2])test(`Recovery tongs retrieve Juicer food with ${freePayments} free food costs`,()=>{
 let s=board(['rice','juicer']);s.freePayments=freePayments;
 s=act(s,{type:'use',uid:2,target:1});
 assert.equal(card(s,1).consumed,true);assert.equal(card(s,1).paid,true);
 assert.equal(relicProblem(s,'recycler'),null);
 s=restore(JSON.stringify(s));s=act(s,{type:'relic',id:'recycler',uid:1});
 assert.equal(card(s,1).zone,'table');assert.equal(card(s,1).paid,false);
 assert.ok(!s.discard.includes(1));assert.equal(s.table.filter(uid=>uid===1).length,1);
 assert.equal(s.freePayments,freePayments);assert.equal(s.relicUsed.recycler,true);
 assert.equal(s.cards.filter(c=>c.kind==='juice').length,1);assert.equal(s.cards.filter(c=>c.kind==='residue').length,1);
 assert.throws(()=>act(s,{type:'relic',id:'recycler',uid:1}));
});
test('Recovery tongs still retrieve tool-cost food and preserve card history',()=>{
 let s=board(['rice','scope']);Object.assign(card(s,1),{enchantment:'boiled',boiledUsed:true,pairedOnce:true,bonus:5});
 s=act(s,{type:'use',uid:2,food:1});assert.equal(card(s,1).paid,true);
 s=act(s,{type:'relic',id:'recycler',uid:1});
 assert.equal(card(s,1).paid,false);
 assert.equal(card(s,1).boiledUsed,true);assert.equal(card(s,1).pairedOnce,true);assert.equal(card(s,1).bonus,5);
});
test('A waived or protected food cost does not invent a recovery target',()=>{
 for(const protection of ['free','boiled','retained']){
  let s=board(['rice','scope']);if(protection==='free')s.freePayments=2;
  if(protection==='boiled')card(s,1).enchantment='boiled';if(protection==='retained')card(s,1).keepOnce=true;
  s=act(s,{type:'use',uid:2,food:1});assert.equal(card(s,1).zone,'table');
  assert.equal(relicProblem(s,'recycler'),'noPaid');assert.equal(s.relicUsed.recycler,undefined);
 }
});
test('Recovery rejects merely discarded food, residue, tools and bombs without spending its use',()=>{
 let s=act(board(['rice','juicer','tea','torch']),{type:'use',uid:2,target:1});
 for(const uid of [3,4,s.cards.find(c=>c.kind==='bomb').uid]){
  const t=card(s,uid);t.zone='discard';s.table=s.table.filter(id=>id!==uid);s.draw=s.draw.filter(id=>id!==uid);s.discard.push(uid);
 }
 const old=JSON.stringify(s),residue=s.cards.find(c=>c.kind==='residue').uid;
 for(const uid of [3,4,residue,s.cards.find(c=>c.kind==='bomb').uid,999])assert.throws(()=>act(s,{type:'relic',id:'recycler',uid}));
 assert.equal(JSON.stringify(s),old);assert.equal(relicProblem(s,'recycler'),null);
});
test('Oil cleanup remains ineligible for Recovery tongs and Toast',()=>{
 let s=board(['rice','oil','toast','toast']);s=act(s,{type:'wipeOil',uid:2,food:1});
 assert.equal(card(s,1).consumed,true);assert.equal(card(s,1).paid,false);
 assert.throws(()=>act(s,{type:'pair',ids:[3,4],target:1}));
 assert.equal(relicProblem(s,'recycler'),'noPaid');assert.throws(()=>act(s,{type:'relic',id:'recycler',uid:1}));
});
test('Toast can reclaim the same tool-consumption record created by Juicer',()=>{
 let s=act(board(['rice','juicer','toast','toast']),{type:'use',uid:2,target:1});
 s=act(s,{type:'pair',ids:[3,4],target:1});assert.equal(card(s,1).zone,'table');
 assert.equal(card(s,1).paid,false);assert.equal(relicProblem(s,'recycler'),'noPaid');
});
test('A retained Juicer ingredient does not become a discarded or recoverable food',()=>{
 let s=board(['rice','juicer']);card(s,1).keepOnce=true;s.freePayments=2;
 s=act(s,{type:'use',uid:2,target:1});assert.equal(card(s,1).zone,'table');assert.equal(s.discard.length,0);
 assert.equal(relicProblem(s,'recycler'),'noPaid');assert.equal(s.freePayments,2);
});
