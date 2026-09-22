import test from 'node:test';
import assert from 'node:assert/strict';
import {pairUnits} from '../game/pair-layout.js';
import {arrangeCards} from '../game/layout.js';
import {autoPairJournal,autoPairUnlocked} from '../game/reward-view.js';
import {trackProgress} from '../game/progress.js';
import {newRun,act,score} from '../game/engine.js';

test('paired cards share a display unit without changing their independent identities',()=>{
 const cards=[{uid:1,pair:7},{uid:2},{uid:3,pair:7},{uid:4,pair:8},{uid:5,pair:8}],before=JSON.stringify(cards);
 assert.deepEqual(pairUnits(cards).map(u=>u.ids),[[1,3],[2],[4,5]]);assert.equal(JSON.stringify(cards),before);
 assert.deepEqual(pairUnits([{uid:1,pair:1}]).map(u=>u.pair),[null]);
});
test('pair stacks never split across rows or pages, and mobile preserves every individual card',()=>{
 const cards=Array.from({length:72},(_,i)=>({uid:i+1,pair:i<60?Math.floor(i/2)+1:null,tapped:i>=66}));
 for(const [w,h,touch] of [[310,200,false],[720,220,false],[1300,430,false],[350,200,true]]){
  const layout=arrangeCards(cards,w,h,{touch}),flat=layout.pages.flat(2);
  assert.equal(flat.length,cards.length);assert.equal(new Set(flat).size,cards.length);
  for(let i=1;i<=59;i+=2)assert.ok(layout.pages.some(rows=>rows.some(row=>row.includes(i)&&row.includes(i+1))));
  if(touch)assert.equal(layout.pages.length,1);
 }
});
test('clear reward is recorded persistently and the journal explains availability and the switch',()=>{
 let s=newRun(9,{rules:2});s.round=10;s.flips=1;s.bank=100;const after=act(s,{type:'stop'}),meta={};
 trackProgress(meta,s,after,{type:'stop'});assert.ok(meta.specialRewards.autotongs);assert.ok(autoPairUnlocked(JSON.parse(JSON.stringify(meta))));
 const html=autoPairJournal(meta,'en');assert.match(html,/EARNED/);assert.match(html,/AUTO PAIR/);assert.match(html,/pledged-item bar/);
 assert.match(autoPairJournal({},'zh'),/locked/);assert.ok(autoPairUnlocked({achievements:{clear:true}}));
 const again=newRun(10,{rules:2});assert.ok(!again.relics.includes('autotongs'));
});
test('breaking a pair removes its stack; pairing again creates a fresh stack and correct score',()=>{
 let s=newRun(7,{rules:2});s.bank=8;s.cards=[...['rice','rice','stamp','bomb'].map((kind,i)=>({uid:i+1,kind,original:kind,zone:i===3?'deck':'table',tapped:false}))];s.table=[1,2,3];s.draw=[4];s.uid=4;
 s=act(s,{type:'pair',ids:[1,2]});assert.equal(score(s),8);assert.equal(pairUnits(s.cards.filter(c=>c.zone==='table')).length,2);
 s=act(s,{type:'use',uid:3,target:1});assert.equal(score(s),4);assert.equal(pairUnits(s.cards.filter(c=>c.zone==='table')).length,3);
 s=act(s,{type:'pair',ids:[1,2]});assert.equal(score(s),8);assert.equal(pairUnits(s.cards.filter(c=>c.zone==='table')).length,2);
});
