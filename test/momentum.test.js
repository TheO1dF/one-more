import test from 'node:test';
import assert from 'node:assert/strict';
import {act,newRun,restore,score,card,baseScore} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES,icon} from '../game/cards.js';
import {canSkipTable,mandatoryTable,scoreMultiplier,SKIP_REWARDS} from '../game/momentum.js';
import {skipHTML} from '../game/momentum-view.js';
import {drawUnits,closedStaple} from '../game/staples.js';
import {registerGrowthContent} from '../game/growth-lab.js';

function route(round=1,seed=3,reward='relic'){
 let s=newRun(seed,{rules:2});Object.assign(s,{round,bank:500,target:20,phase:'stakes',dice:{rolls:[],result:null,count:1}});
 s=act(s,{type:'roll'});s=act(s,{type:'acceptDice',boon:'scout'});if(reward&&s.skipOffer)s.skipOffer.id=reward;return s;
}
function board(kinds,draw=[],relics=[]){
 const s=newRun(3,{rules:2});s.cards=[...kinds,...draw,'bomb'].map((kind,i)=>({uid:i+1,kind,original:kind,zone:i<kinds.length?'table':'deck',entered:i+1}));
 s.uid=s.cards.length;s.table=s.cards.filter(c=>c.zone==='table').map(c=>c.uid);s.draw=s.cards.filter(c=>c.zone==='deck').map(c=>c.uid);s.discard=[];s.known=[];s.flips=1;s.relics=['shaker',...relics];return s;
}
const next=s=>{s=act(s,{type:'chooseRoute',id:'tea'});s=act(s,{type:'add',id:s.offers[0]});if(s.relicOffer.length)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});return act(s,{type:'next'});};

test('skipping requires a real roll and accepted next-table target, and is atomic on failure',()=>{
 const s=route(),before=JSON.stringify(s);assert.ok(canSkipTable(s));
 for(const changed of [{dice:null},{dice:{result:s.dice.result,rolls:[]}},{goalHistory:[]},{bank:s.target-1},{practice:true},{lesson:1},{endless:true}]){
  const invalid={...s,...changed};assert.ok(!canSkipTable(invalid));assert.throws(()=>act(invalid,{type:'skipTable',id:'relic'}));
 }
 assert.throws(()=>act(s,{type:'skipTable',id:'gold'}));assert.equal(JSON.stringify(s),before);
});
test('only table ten is mandatory; consecutive skips are allowed after another roll',()=>{
 assert.ok(mandatoryTable(10));assert.ok(!canSkipTable(route(9)));
 for(const table of [2,3,4,5,6,7,8,9]){assert.ok(!mandatoryTable(table));assert.ok(canSkipTable(route(table-1)));}
 let s=act(route(3),{type:'skipTable',id:'relic'});assert.equal(s.phase,'midnight');s=act(s,{type:'acceptMidnight'});s=act(s,{type:'roll'});s=act(s,{type:'acceptDice',boon:'scout'});assert.ok(canSkipTable(s));assert.match(skipHTML(s,'en'),/Only table 10/);
});
test('skip forfeits draft and boon, preserves bank and target, and owes another roll',()=>{
 const s=route(),n=act({...s,nextBoon:'feast'},{type:'skipTable',id:'relic'});
 assert.equal(n.round,2);assert.equal(n.phase,'stakes');assert.equal(n.bank,s.bank);assert.equal(n.target,s.target);assert.equal(n.nextBoon,null);assert.equal(n.dice.result,null);assert.equal(n.relics.length,s.relics.length+1);assert.equal(n.cards.length,s.cards.length);
 assert.equal(scoreMultiplier(n),1);assert.ok(!n.skipTags);assert.deepEqual(restore(JSON.stringify(n)),n);assert.throws(()=>act(n,{type:'skipTable',id:'relic'}));
 const rolled=act(n,{type:'roll'}),accepted=act(rolled,{type:'acceptDice',boon:'scout'});assert.ok(accepted.target>n.target);assert.equal(accepted.phase,'route');assert.ok(canSkipTable(accepted));
});
test('free pruning removes two selected permanent non-bombs with no fee or junk',()=>{
 const s=route(1,3,'prune'),n=act(s,{type:'skipTable',id:'prune',uids:[1,2]});assert.equal(n.cards.length,s.cards.length-2);assert.equal(n.bank,s.bank);assert.ok(!card(n,1)&&!card(n,2));assert.deepEqual(restore(JSON.stringify(n)),n);
 for(const uids of [[1,1],[1,20],[1],[1,999]])assert.throws(()=>act(s,{type:'skipTable',id:'prune',uids}));
});
test('free enchantment validates target and enchantment without introducing flat score rewards',()=>{
 const s=route(1,3,'enchant');const n=act(s,{type:'skipTable',id:'enchant',uid:1,enchantment:'fried'});assert.equal(card(n,1).enchantment,'fried');assert.equal(n.bank,s.bank);assert.equal(n.cards.length,s.cards.length);assert.equal(scoreMultiplier(n),1);
 assert.deepEqual(restore(JSON.stringify(n)),n);assert.throws(()=>act(s,{type:'skipTable',id:'enchant',uid:20,enchantment:'raw'}));assert.throws(()=>act(s,{type:'skipTable',id:'enchant',uid:1,enchantment:'fake'}));
});
test('permanent staple is random, excludes bombs, rebinds next table and survives save after opening',()=>{
 let s=act(route(1,3,'staple'),{type:'skipTable',id:'staple'});const original=[...s.staples[0].uids];assert.equal(original.length,3);assert.ok(!original.includes(20));assert.deepEqual(restore(JSON.stringify(s)),s);
 s=act(s,{type:'roll'});s=act(s,{type:'acceptDice',boon:'scout'});s.routeOffers=['tea','lantern'];s=next(s);
 const bundle=s.staples[0];assert.ok(bundle.permanent);const units=drawUnits(s),unit=units.find(ids=>ids.length===3);assert.deepEqual(unit,original);
 s.draw=[...unit,...s.draw.filter(id=>!unit.includes(id))];const n=act(s,{type:'draw'});assert.ok(original.every(uid=>n.table.includes(uid)));assert.equal(n.staples.length,1);assert.equal(n.staples[0].openedRound,3);assert.deepEqual(restore(JSON.stringify(n)),n);assert.equal(closedStaple(n,unit[0]),null);
 Object.assign(n,{phase:'draft',added:true,relicOffer:[],carry:null});s=act(n,{type:'next'});assert.ok(drawUnits(s).some(ids=>ids.length===3));assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('new score routes produce the stated numbers; generated foods do not count as reveals',()=>{
 for(let n=1;n<=5;n++){const s=board(Array(n).fill('stackcake'));assert.equal(score(s),n*2**n);}
 let s=board(['metronome','sweeper','paper','oil'],['rice','fish','tea','rice','fish','tea']);
 for(let i=0;i<3;i++)s=act(s,{type:'draw'});
 assert.equal(scoreMultiplier(s),2);assert.equal(card(s,3).zone,'discard');assert.equal(card(s,4).zone,'table');assert.equal(score(s),baseScore(s)*2);
 for(let i=0;i<3;i++)s=act(s,{type:'draw'});assert.equal(scoreMultiplier(s),4);assert.equal(card(s,4).zone,'discard');assert.deepEqual(restore(JSON.stringify(s)),s);
 const dead=act(s,{type:'draw'});assert.equal(dead.reason,'bomb');assert.equal(dead.phase,'lost');
 s=board(['metronome','popcorn','popcorn']);s=act(s,{type:'pair',ids:[2,3]});assert.ok(!card(s,1).revealTicks);assert.equal(scoreMultiplier(s),1);
});
test('streak counter resets on other cards and cannot be farmed with generated foods',()=>{
 let s=board([],['rice','fish','tea','paper','rice','fish','tea','mint'],['streakcounter']);
 for(let i=0;i<7;i++)s=act(s,{type:'draw'});assert.equal(scoreMultiplier(s),1);s=act(s,{type:'draw'});assert.equal(scoreMultiplier(s),2);
});
test('Silent bell suppresses pair abilities, devices, enchantments and pledged triggers while doubling pair score',()=>{
 let s=board(['fish','fish','candle','relay'],['rice'],['silencer','matchbox']);card(s,1).enchantment='fried';
 s=act(s,{type:'pair',ids:[1,2]});assert.equal(score(s),16);assert.equal(s.known.length,0);assert.equal(s.freePayments,0);assert.ok(!s.relicProgress.matchbox);assert.equal(s.lastPair,null);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=board(['rice','rice','paper'],[],['silencer']);s=act(s,{type:'pair',ids:[1,2],target:999});assert.equal(card(s,3).zone,'table');
});
test('copy event preserves permanent enhancements but not temporary scoring or pair state',()=>{
 let s=route(2);assert.ok(s.routeOffers.includes('duplicate'));card(s,1).enchantment='raw';card(s,1).bonus=99;card(s,1).pair=5;card(s,1).pairedOnce=true;
 s=act(s,{type:'chooseRoute',id:'duplicate'});const before=JSON.stringify(s),size=s.cards.length,bank=s.bank;
 assert.throws(()=>act(s,{type:'resolveEncounter',uid:20}));assert.equal(JSON.stringify(s),before);
 s=act(s,{type:'resolveEncounter',uid:1});const copy=s.cards.at(-1);assert.equal(s.cards.length,size+1);assert.equal(copy.original,'rice');assert.equal(copy.enchantment,'raw');assert.equal(copy.bonus,0);assert.equal(copy.pair,null);assert.equal(copy.pairedOnce,false);assert.equal(s.bank,bank-6);assert.equal(s.phase,'draft');assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('growth copies retain earned level independently, and new content is obtainable',()=>{
 registerGrowthContent(CARDS,RELICS,PACKAGES);let s=newRun(8,{rules:2,growthRoute:'broth'});Object.assign(s,{phase:'route',routeOffers:['duplicate','tea'],bank:20});card(s,1).growthXP=8;card(s,1).growthLevel=2;
 s=act(s,{type:'chooseRoute',id:'duplicate'});s=act(s,{type:'resolveEncounter',uid:1});assert.equal(s.cards.at(-1).growthLevel,2);assert.equal(s.cards.at(-1).growthXP,8);assert.deepEqual(restore(JSON.stringify(s)),s);
 for(const k of ['stackcake','metronome','sweeper']){assert.ok(PACKAGES.some(p=>p.cards.includes(k)));assert.match(icon(k),/poster-art/);}
 assert.deepEqual(Object.keys(SKIP_REWARDS),['prune','enchant','staple','relic']);
});


test('table ten awards auto-pair exactly once and ordinary rewards exclude it',()=>{
 let s=board(['juice']);Object.assign(s,{round:10,bank:100,target:8});s=act(s,{type:'stop'});
 assert.equal(s.phase,'won');assert.ok(s.relics.includes('autotongs'));assert.equal(s.autoPairEnabled,false);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=act(s,{type:'continueEndless'});assert.equal(s.relics.filter(id=>id==='autotongs').length,1);
 for(let seed=1;seed<=150;seed++){const r=act(route(1,seed),{type:'skipTable',id:'relic'});assert.ok(!r.relics.includes('autotongs'));}
});

test('auto-pair toggle is optional, pairs matching names before wilds and stops on bombs',()=>{
 let s=board(['wild','fish'],['fish','rice'],['autotongs']);s=act(s,{type:'toggleAutoPair'});assert.equal(s.autoPairEnabled,true);
 s=act(s,{type:'draw'});assert.equal(card(s,1).pair,undefined);assert.equal(card(s,2).pair,card(s,3).pair);assert.ok(card(s,2).pair);assert.ok(s.known.includes(4));
 s=act(s,{type:'toggleAutoPair'});s=act(s,{type:'draw'});assert.ok(!card(s,4).pair);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=act(s,{type:'draw'});assert.equal(s.reason,'bomb');assert.throws(()=>act(board(['rice']),{type:'toggleAutoPair'}));
});

test('old cleared and endless saves receive the reward once, without replacing a pawned reward',()=>{
 let s=board(['juice']);Object.assign(s,{round:10,bank:100,target:8,phase:'won',reason:'complete'});
 const restored=restore(JSON.stringify(s));assert.ok(restored.relics.includes('autotongs'));assert.equal(restored.autoPairEnabled,false);
 s=act(s,{type:'continueEndless'});assert.ok(s.relics.includes('autotongs'));assert.ok(s.autoPairRewardClaimed);
 s.relics=s.relics.filter(id=>id!=='autotongs');assert.ok(!restore(JSON.stringify(s)).relics.includes('autotongs'));
 delete s.autoPairRewardClaimed;assert.ok(restore(JSON.stringify(s)).relics.includes('autotongs'));
});

test('automatic target effects choose the oldest legal target and Silent bell still suppresses them',()=>{
 let s=board(['rice','paper','oil'],['rice'],['autotongs']);s.autoPairEnabled=true;s=act(s,{type:'draw'});assert.equal(card(s,2).zone,'discard');assert.equal(card(s,3).zone,'table');
 s=board(['rice','paper'],['rice'],['autotongs','silencer']);s.autoPairEnabled=true;s=act(s,{type:'draw'});assert.equal(card(s,2).zone,'table');assert.equal(score(s),16);
});

test('auto-pair pauses for discovery and resumes pending packet reveals without overwriting a choice',()=>{
 let s=board(['shrimp','rice'],['shrimp','rice','tea'],['autotongs']);s.autoPairEnabled=true;s.staples=[{id:1,uids:[3,4,5],readyRound:1,permanent:true}];s.stapleId=1;
 s=act(s,{type:'draw'});assert.equal(s.pending.type,'discover');assert.deepEqual(s.autoPairQueue,[4,5]);assert.ok(!card(s,4).pair);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=act(s,{type:'discover',kind:s.pending.offers[0]});assert.equal(card(s,2).pair,card(s,4).pair);assert.equal(s.autoPairQueue.length,0);assert.equal(s.pending,null);assert.deepEqual(restore(JSON.stringify(s)),s);
});
