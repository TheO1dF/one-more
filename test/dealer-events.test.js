import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {registerGrowthContent,GROWTH_ROUTES} from '../game/growth-lab.js';
import {newRun,act,restore,card,score,cashValue,eligibleDealerRoutes} from '../game/engine.js';
import {effectiveTarget,SETBACKS} from '../game/dealer-events.js';
import {nextTarget,neededScore} from '../game/pacing.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
function route(id,seed=7){const s=newRun(seed,{rules:2,growthRoute:'broth'});s.bank=30;s.target=40;s.phase='route';s.routeOffers=[id,'tea'];return s;}
const open=(id,seed)=>act(route(id,seed),{type:'chooseRoute',id});
function next(s){s=act(s,{type:'add',id:s.offers[0]});if(s.relicOffer.length)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});return act(s,{type:'next'});}
function board(s,kinds){s.table=[];s.cards.forEach(c=>c.zone='deck');s.draw=s.cards.map(c=>c.uid);s.discard=[];s.known=[];s.flips=1;for(const kind of kinds){const c={uid:++s.uid,kind,original:kind,zone:'table',tapped:false};s.cards.push(c);s.table.push(c.uid);}return s;}
function outcome(id){for(let seed=1;seed<3000;seed++){const s=open('mystery',seed);if(s.encounter.id===id)return s;}throw Error('Missing '+id);}
test('exchange quotes persist; exactly two permanent foods buy one permanent card atomically',()=>{
 let s=open('trade');const snapshot=JSON.stringify(s);assert.deepEqual(restore(snapshot),s);assert.equal(new Set(s.encounter.offers).size,3);
 const foods=s.cards.filter(c=>CARDS[c.original].type==='food'),uids=foods.slice(0,2).map(c=>c.uid),kind=s.encounter.offers[1],size=s.cards.length;
 assert.throws(()=>act(s,{type:'resolveEncounter',uids:[uids[0],uids[0]],kind}));assert.throws(()=>act(s,{type:'resolveEncounter',uids:[uids[0],20],kind}));assert.throws(()=>act(s,{type:'resolveEncounter',uids,kind:'bomb'}));assert.equal(JSON.stringify(s),snapshot);
 s=act(s,{type:'resolveEncounter',uids,kind});assert.equal(s.cards.length,size-1);assert.ok(uids.every(uid=>!card(s,uid)));assert.equal(s.cards.at(-1).original,kind);assert.ok(!s.cards.at(-1).temporary);assert.equal(s.bank,30);assert.equal(s.phase,'draft');assert.ok(restore(JSON.stringify(s)));assert.throws(()=>act(s,{type:'resolveEncounter',uids,kind}));
});
test('selling an owned pledged item gives the posted price once; declining keeps everything',()=>{
 const s=open('pawn'),quote=s.encounter.quote,id=s.relics[0],sold=act(s,{type:'resolveEncounter',relic:id});assert.equal(sold.bank,s.bank+quote);assert.ok(!sold.relics.includes(id));assert.equal(sold.cards.length,s.cards.length);assert.throws(()=>act(s,{type:'resolveEncounter',relic:'not-owned'}));
 const declined=act(s,{type:'leaveEncounter'});assert.equal(declined.bank,s.bank);assert.deepEqual(declined.relics,s.relics);
});
test('random events include services and all five losses, save the outcome, and never apply it twice',()=>{
 const counts={};for(let seed=1;seed<=700;seed++){const s=open('mystery',seed);counts[s.encounter.id]=(counts[s.encounter.id]||0)+1;assert.deepEqual(restore(JSON.stringify(s)),s);assert.deepEqual(act(route('mystery',seed),{type:'chooseRoute',id:'mystery'}).encounter,s.encounter);}
 for(const id of [...Object.keys(SETBACKS),'raw','tea','trade','pawn'])assert.ok(counts[id],id);
 for(const id of Object.keys(SETBACKS)){const s=outcome(id),before=JSON.stringify(s);assert.throws(()=>act(s,{type:'leaveEncounter'}));const done=act(s,{type:'resolveEncounter'});assert.equal(done.bank,s.bank);assert.equal(done.cards.length,s.cards.length);assert.equal(JSON.stringify(s),before);assert.throws(()=>act(done,{type:'resolveEncounter'}));}
});
test('losses remove actual permanent cards and fees do not count as growth spending',()=>{
 for(const id of ['foodLoss','toolLoss']){const s=outcome(id);assert.equal(s.cards.length,19);const lost=s.eventReceipt.removed[0];assert.equal(CARDS[lost.original].type,id==='foodLoss'?'food':'tool');assert.ok(!s.cards.some(c=>c.uid===lost.uid));for(const zone of ['draw','table','discard','known'])assert.ok(!s[zone].includes(lost.uid));assert.equal(s.cards.filter(c=>c.original==='bomb').length,1);}
 let s=outcome('levy');assert.equal(s.bank,25);assert.equal(s.eventReceipt.amount,5);assert.ok(!s.log.some(e=>e.key==='spendPoints'));
});
test('temporary double target is real cumulative target, reverts after success, and does not compound',()=>{
 let s=next(act(outcome('pressure'),{type:'resolveEncounter'}));assert.equal(s.target,40);assert.equal(effectiveTarget(s),80);assert.equal(neededScore(s),50);
 s=board(s,['fish','fish']);s.bank=72;s=act(s,{type:'pair',ids:s.table});s=act(s,{type:'stop'});assert.equal(s.bank,80);assert.equal(s.tableCondition,null);assert.equal(nextTarget(s,10),50);
 let fail=next(act(outcome('pressure'),{type:'resolveEncounter'}));fail=board(fail,['fish']);fail.bank=60;fail=act(fail,{type:'stop'});assert.equal(fail.phase,'lost');assert.equal(effectiveTarget(fail),80);
});
test('wager pays one unowned reward only after successful cash-out; a bomb gives nothing',()=>{
 let s=next(act(open('wager'),{type:'resolveEncounter'})),owned=[...s.relics];s=board(s,['fish']);s.bank=78;const win=act(s,{type:'stop'});assert.equal(win.bank,80);assert.equal(win.relics.length,owned.length+1);assert.ok(!owned.includes(win.wagerPrize.id));assert.equal(win.tableCondition,null);assert.ok(restore(JSON.stringify(win)));
 const fail=structuredClone(s);fail.draw=[20,...fail.draw.filter(uid=>uid!==20)];const dead=act(fail,{type:'draw'});assert.equal(dead.reason,'bomb');assert.deepEqual(dead.relics,owned);assert.equal(dead.wagerPrize,null);
 const rich=route('wager');rich.bank=80;assert.ok(!eligibleDealerRoutes(rich).includes('wager'));assert.throws(()=>act(rich,{type:'chooseRoute',id:'wager'}));
});
test('house limit caps cash-out and in-play bonuses, preserves prior savings and expires',()=>{
 let s=next(act(outcome('cap'),{type:'resolveEncounter'}));s=board(s,['fish','fish']);s.bank=38;assert.equal(score(s),4);assert.equal(cashValue(s),2);s=act(s,{type:'stop'});assert.equal(s.bank,40);assert.equal(s.tableCondition,null);
 let rich=outcome('cap');rich.bank=90;rich=next(act(rich,{type:'resolveEncounter'}));rich=board(rich,['fish']);assert.equal(cashValue(rich),0);assert.equal(act(rich,{type:'stop'}).bank,90);
 let bonus=next(act(outcome('cap'),{type:'resolveEncounter'}));bonus=board(bonus,['torch']);bonus.bank=39;bonus.relics.push('coinpurse');bonus=act(bonus,{type:'use',uid:bonus.table[0]});assert.equal(bonus.bank,40);
});
test('positive random service uses normal route rules and permanent removal preserves receipt',()=>{
 let s=outcome('prune'),uid=s.cards.find(c=>c.original!=='bomb').uid,kind=card(s,uid).original;s=act(s,{type:'resolveEncounter',uid});assert.equal(s.bank,26);assert.equal(s.eventReceipt.removed[0].original,kind);assert.ok(!card(s,uid));assert.ok(restore(JSON.stringify(s)));
 s=next(act(outcome('tea'),{type:'resolveEncounter'}));assert.equal(s.freePayments,2);
});
test('high ascensions retain 20 slots, bomb and growth engine while adding trouble',()=>{
 for(const difficulty of [0,1,2,3])for(const route of [null,...Object.keys(GROWTH_ROUTES)]){const s=newRun(11,{rules:2,difficulty,growthRoute:route});assert.equal(s.cards.length,20);assert.equal(s.cards.filter(c=>c.original==='bomb').length,1);if(difficulty>=2)assert.ok(s.cards.some(c=>CARDS[c.original].type==='trouble'));if(route){const r=GROWTH_ROUTES[route];assert.equal(s.cards.filter(c=>c.original===r.core).length,2);assert.ok(s.cards.some(c=>c.original===r.support));}assert.ok(restore(JSON.stringify(s)));}
 const base=newRun(1,{rules:2}),hard=newRun(1,{rules:2,difficulty:3});assert.equal(base.cards.filter(c=>CARDS[c.original].type==='food').length-hard.cards.filter(c=>CARDS[c.original].type==='food').length,1);assert.equal(base.cards.filter(c=>CARDS[c.original].type==='tool').length-hard.cards.filter(c=>CARDS[c.original].type==='tool').length,1);
});
test('malformed encounter and temporary condition saves are rejected',()=>{
 for(const mutate of [s=>s.encounter.offers=['bomb','rice','fish'],s=>s.encounter.offers=['rice','rice','fish'],s=>s.encounter.quote=-1,s=>s.encounter.id='missing']){const s=open('trade');mutate(s);assert.equal(restore(JSON.stringify(s)),null);}
 const s=newRun(1);s.tableCondition={id:'cap',round:1,cap:true,double:false,wager:false};assert.equal(restore(JSON.stringify(s)),null);
});
