import test from 'node:test';
import assert from 'node:assert/strict';
import {act,newRun,restore,card,score,toolProblem,eligibleDealerRoutes,matchingFoods,reserveTools} from '../game/engine.js';
import {RELICS,CARDS} from '../game/cards.js';
import {prizePool} from '../game/dealer-events.js';
import {routeFragment,routeStoryHTML} from '../game/story-fragments.js';
import {panArt} from '../game/pan-art.js';
import {tableGroups,settledHTML} from '../game/table-groups.js';

function board(kinds,deck=['rice','fish','bomb']){
 const s=newRun(16,{rules:2});Object.assign(s,{cards:[],table:[],draw:[],discard:[],known:[],uid:0,flips:kinds.length,target:0,bank:100});
 for(const [zone,list] of [['table',kinds],['deck',deck]])for(const kind of list){const c={uid:++s.uid,original:kind,kind,zone,tapped:false,pair:null,pairedOnce:false,entered:s.uid,triggers:0};s.cards.push(c);s[zone==='table'?'table':'draw'].push(c.uid);}
 return s;
}
test('Pan alone sells the one-use gift; haggling fixes one of two prices before purchase',()=>{
 let s=newRun(66,{rules:2});Object.assign(s,{phase:'route',round:3,bank:100,routeOffers:['pan','tea']});
 assert.ok(!prizePool(s,RELICS).includes('pangift'));
 assert.ok(!eligibleDealerRoutes(s).includes('pan'));
 s=act(s,{type:'chooseRoute',id:'pan'});assert.equal(s.encounter.quote,50);
 s=act(s,{type:'haggleEncounter'});assert.ok([25,100].includes(s.encounter.quote));
 assert.throws(()=>act(s,{type:'haggleEncounter'}));assert.deepEqual(restore(JSON.stringify(s)),s);
 const price=s.encounter.quote;s=act(s,{type:'resolveEncounter'});
 assert.equal(s.bank,100-price);assert.ok(s.relics.includes('pangift'));
 assert.equal(s.eventReceipt.amount,price);assert.ok(!prizePool(s,RELICS).includes('pangift'));
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('the gift stops one bomb, returns it to the remaining draw, and cannot save the next hit',()=>{
 let s=board(['rice'],['bomb','fish','bomb']);s.relics.push('pangift');s.known=[2,3];
 s=act(s,{type:'draw'});assert.equal(s.phase,'play');assert.ok(!s.relics.includes('pangift'));
 assert.equal(s.draw.length,3);assert.ok(s.draw.includes(2));assert.equal(card(s,2).zone,'deck');
 assert.equal(s.known.length,0);assert.equal(s.log.filter(e=>e.key==='panSave').length,1);
 assert.deepEqual(restore(JSON.stringify(s)),s);
 s.draw=[2,...s.draw.filter(uid=>uid!==2)];s=act(s,{type:'draw'});
 assert.equal(s.phase,'lost');assert.equal(s.reason,'bomb');
});
test('Pan is rare, and branch fragments have separate voices',()=>{
 let offers=0;
 for(let seed=1;seed<=600;seed++){
  let s=newRun(seed,{rules:2});Object.assign(s,{round:3,bank:100,phase:'stakes',dice:{rolls:[],result:null,count:1}});
  s=act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});
  offers+=Number(s.routeOffers.includes('pan'));
 }
 assert.ok(offers>=5&&offers<=40,offers);
 assert.notEqual(routeFragment('tea','zh')[1],routeFragment('lantern','zh')[1]);
 assert.match(panArt(),/<svg.*data-character="pan"/);assert.doesNotMatch(panArt(),/<img|<image/);
});
test('table stays open until the player chooses to tidy, then reports pairs and used tools',()=>{
 const s=board(['rice','rice','fish','fish','mint','mint','tea','tea','torch','scope','bell','paper']);
 for(let i=0;i<8;i++)card(s,i+1).pair=Math.floor(i/2)+1;
 for(let i=9;i<=11;i++)card(s,i).tapped=true;
 const open=tableGroups(s,{expanded:true}),closed=tableGroups(s,{expanded:false});
 assert.equal(open.visible.length,12);assert.equal(closed.visible.length,1);
 assert.match(settledHTML(s,open,'zh',false,true),/收拢桌面/);
 assert.match(settledHTML(s,closed,'zh'),/已配对 8/);
 assert.match(settledHTML(s,closed,'zh'),/已横置 3/);
 assert.equal(score(s),score({...s,table:[...s.table]}));
});
test('House lamp is a repeatable pair engine; it clears oldest trouble after printed pair abilities',()=>{
 let s=board(['houselamp','cold','debt','paper','fish','fish','mint','mint','tea','tea']);
 s=act(s,{type:'pair',ids:[5,6]});assert.equal(card(s,2).zone,'discard');assert.equal(s.known.length,0);
 s=act(s,{type:'pair',ids:[7,8]});assert.equal(card(s,3).zone,'discard');
 s=act(s,{type:'pair',ids:[9,10]});assert.equal(card(s,4).zone,'discard');assert.equal(s.freePayments,1);
 assert.equal(s.log.filter(e=>e.key==='houseLamp').length,3);assert.deepEqual(restore(JSON.stringify(s)),s);
 let quiet=board(['houselamp','paper','rice','rice']);quiet.relics.push('silencer');quiet=act(quiet,{type:'pair',ids:[3,4]});assert.equal(card(quiet,2).zone,'table');
});
test('Cut card randomly swaps a known bomb for a cost, forgets peeks, and preserves whole stapled packets',()=>{
 let s=board(['cardcutter'],['bomb','fish','rice']);const flips=s.flips;s.known=[2];
 s=act(s,{type:'use',uid:1});assert.notEqual(s.draw[0],2);assert.deepEqual([...s.draw].sort(),[2,3,4]);assert.equal(s.bank,98);assert.equal(s.flips,flips);assert.equal(s.phase,'play');assert.deepEqual(s.known,[]);
 s=board(['cardcutter'],['rice','fish','rice','bomb']);s.stapleId=1;s.staples=[{id:1,uids:[2,3,4],readyRound:1}];
 s=act(s,{type:'use',uid:1});assert.deepEqual(s.draw,[5,2,3,4]);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=board(['cardcutter'],['bomb']);assert.equal(toolProblem(s,card(s,1)),'noTarget');assert.throws(()=>act(s,{type:'use',uid:1}));
});
test('Sharing platter fetches an existing match without reveal, creation, or extra copies',()=>{
 let s=board(['hazelnut','hazelnut','fish','rice','candle','servingbell'],['bomb','fish','rice','rice']);
 const n=s.cards.length,flips=s.flips;s.known=[7,8];
 assert.deepEqual(matchingFoods(s,[1,2]).map(c=>c.uid),[3,4]);
 s=act(s,{type:'pair',ids:[1,2],target:3});assert.equal(card(s,8).zone,'table');assert.equal(card(s,8).temporary,undefined);
 assert.deepEqual(s.draw,[7,9,10]);assert.equal(s.cards.length,n);assert.equal(s.flips,flips);assert.equal(s.phase,'play');
 assert.equal(card(s,6).bonus||0,0);assert.ok(!s.known.includes(8));assert.deepEqual(restore(JSON.stringify(s)),s);
 const old=JSON.stringify(s);assert.throws(()=>act(s,{type:'pair',ids:[1,2],target:4}));assert.equal(JSON.stringify(s),old);
 s=board(['hazelnut','hazelnut','fish','rice'],['fish','rice','bomb']);card(s,1).enchantment='fried';
 s=act(s,{type:'pair',ids:[1,2],targets:[3,4]});assert.equal(card(s,5).zone,'table');assert.equal(card(s,6).zone,'table');assert.deepEqual(s.draw,[7]);
 s=board(['hazelnut','hazelnut','fish','cold'],['fish','bomb']);s=act(s,{type:'pair',ids:[1,2],target:3});assert.equal(card(s,5).zone,'deck');
});
test('Cloakroom ticket carries the most recently used permanent tool, ready and without duplication',()=>{
 let s=board(['ledger','torch','scope','fish'],['rice','fish','bomb']);card(s,2).enchantment='smoked';s.freePayments=1;
 s=act(s,{type:'use',uid:3});s=act(s,{type:'use',uid:2});assert.equal(card(s,2).lastUsed>card(s,3).lastUsed,true);
 assert.deepEqual(reserveTools(s).map(c=>c.uid),[2]);s=act(s,{type:'stop'});assert.deepEqual(s.reservedTools,[2]);
 s=restore(JSON.stringify(s));const n=s.cards.length;Object.assign(s,{phase:'draft',added:true,relicOffer:[]});s=act(s,{type:'next'});
 assert.equal(card(s,2).zone,'table');assert.equal(card(s,2).tapped,false);assert.equal(card(s,2).enchantment,'smoked');
 assert.equal(s.draw.includes(2),false);assert.equal(s.cards.length,n);assert.equal(s.flips,0);assert.deepEqual(s.reservedTools,[]);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=board(['ledger','torch','torch']);card(s,3).temporary=true;s=act(s,{type:'use',uid:2});s=act(s,{type:'use',uid:3});assert.deepEqual(reserveTools(s).map(c=>c.uid),[2]);
});
test('route text is inline on the first visit and does not interrupt repeated routes',()=>{
 const s={round:2,routeHistory:[{round:2,id:'tea'}]};assert.match(routeStoryHTML(s),/阿穗/);
 s.round=3;s.routeHistory.push({round:3,id:'tea'});assert.match(routeStoryHTML(s),/阿穗/);assert.match(routeStoryHTML(s),/data-character="tea-room"/);assert.doesNotMatch(routeStoryHTML(s),/<img|class="route-story" open/);
 assert.notEqual(routeFragment('raw')[1],routeFragment('fried')[1]);
});
