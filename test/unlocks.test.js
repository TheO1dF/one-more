import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,restore,score,card} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {UNLOCKS,availableIds,unlockSet,maxDifficulty,ruleDiceCount,stageRaise} from '../game/unlock-data.js';
import {trackProgress} from '../game/progress.js';
import {nextTarget} from '../game/pacing.js';
import {bombGrowth} from '../game/stakes.js';
const options=meta=>({rules:2,allowedCards:availableIds(meta,'cards',Object.keys(CARDS)),allowedRelics:availableIds(meta,'relics',Object.keys(RELICS))});
test('fresh pool can draft and discover; every reward references real content',()=>{
 let meta={};for(const [achievement,r] of Object.entries(UNLOCKS)){
  for(const id of r.cards||[])assert.ok(CARDS[id],id);for(const id of r.relics||[])assert.ok(RELICS[id],id);
  const ids=options(meta).allowedCards;assert.ok(PACKAGES.filter(p=>p.cards.every(k=>ids.includes(k))).length>=3);
  for(const type of ['food','tool'])assert.ok(ids.filter(k=>CARDS[k].type===type&&!CARDS[k].tokenOnly).length>=4);
  meta.achievements={...meta.achievements,[achievement]:true};
 }assert.equal(options(meta).allowedCards.length,Object.keys(CARDS).length);assert.equal(options(meta).allowedRelics.length,20);
});
test('milestones open pools without changing initial deck or current-run snapshot',()=>{
 const meta={};const before=newRun(71,options(meta));meta.achievements={first_pair:true};const after=newRun(71,options(meta));
 assert.deepEqual(before.cards,after.cards);assert.deepEqual(before.draw,after.draw);assert.ok(!before.allowedCards.includes('dumpling'));assert.ok(after.allowedCards.includes('dumpling'));assert.ok(unlockSet(meta,'backs').has('roulette'));assert.deepEqual(restore(JSON.stringify(after)),after);
});
test('cumulative rules preserve early profit; higher stages raise pressure predictably',()=>{
 const s=newRun(7,{rules:2});s.bank=200;s.target=80;s.round=7;s.dice={result:{faces:[10,11,12],total:33}};
 assert.equal(nextTarget(s),113);s.difficulty=2;assert.equal(nextTarget(s),121);
 assert.deepEqual([4,5,7,8,10].map(r=>ruleDiceCount({...s,difficulty:0},r)),[1,2,2,2,2]);assert.equal(ruleDiceCount(s,8),3);assert.equal(stageRaise(s,8),8);
});
test('challenges change rules without meta point bonuses; bomb thresholds respect ascension',()=>{
 const pair=newRun(2,{rules:2,challenge:'pairs'});let a=act(pair,{type:'draw'});assert.equal(score(a),0);
 const hands=newRun(2,{rules:2,challenge:'barehands'});assert.equal(hands.cards.filter(c=>CARDS[c.kind].type==='tool').length,0);
 for(let seed=1;seed<=200;seed++){const s=newRun(seed,{rules:2,challenge:'doublebomb'});assert.equal(s.cards.filter(c=>c.kind==='bomb').length,2);assert.notEqual(card(s,s.draw[0]).kind,'bomb');}
 const s=newRun(3,{rules:2,difficulty:3});assert.equal(bombGrowth(s,14).added,0);assert.equal(bombGrowth(s,15).added,1);
});
test('winning unlocks exactly the next stakes; tutorial and malformed metadata do not',()=>{
 const before=newRun(3,{rules:2,difficulty:1}),after={...before,phase:'won',reason:'complete',round:10};const m={};trackProgress(m,before,after,{type:'stop'});assert.equal(maxDifficulty(m),2);assert.equal(m.history.length,1);assert.ok(m.achievements.clear);
 const lesson={...before,lesson:3},n={};trackProgress(n,lesson,after,{type:'stop'});assert.equal(maxDifficulty(n),0);assert.equal(maxDifficulty({ascensionWins:{oops:true}}),0);
});
test('new three-die stakes retain locked extremes across save and reroll',()=>{
 let s=newRun(10,{rules:2,difficulty:1});s.round=7;s.bank=200;s.flips=1;s=act(s,{type:'stop'});assert.equal(s.dice.count,3);s=act(s,{type:'roll'});assert.equal(s.dice.result.faces.length,3);assert.ok(restore(JSON.stringify(s)));const faces=s.dice.result.faces;
 if(!s.dice.result.locked){s=act(s,{type:'roll'});faces.forEach((n,i)=>{if(n===1||n===20)assert.equal(s.dice.result.faces[i],n);});}
});
