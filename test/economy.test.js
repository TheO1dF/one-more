import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,card,score,value,restore} from '../game/engine.js';
import {CARDS,PACKAGES} from '../game/cards.js';
import {ROUTES,ENCHANTMENTS} from '../game/routes.js';
import {pressedWeight,validPressWeight} from '../game/card-crafting.js';
import {rewardHUD} from '../game/reward-hud.js';
import {bribeOffer} from '../game/bribes.js';
import {beginRewardTable,rewardDenied} from '../game/table-rewards.js';
import {nextTarget} from '../game/pacing.js';
import {ruleDiceCount} from '../game/unlock-data.js';
import {encounterHTML} from '../game/dealer-view.js';
import {renderView} from '../game/view.js';
const clone=x=>structuredClone(x);
function board(kinds=['rice','rice'],bank=100){
 const s=newRun(71,{rules:2,economy:2});s.cards=[];s.uid=0;s.table=[];s.draw=[];s.discard=[];s.known=[];s.bank=bank;s.target=8;s.flips=1;
 for(const [i,kind] of [...kinds,'fish','bomb'].entries()){const c={uid:++s.uid,kind,original:kind,zone:i<kinds.length?'table':'deck',tapped:false};s.cards.push(c);s[c.zone==='table'?'table':'draw'].push(c.uid);}
 beginRewardTable(s);return s;
}
function route(id){const s=board(['rice','rice','fish','fish','torch','scope']);s.phase='route';s.roundRewardEligible=true;s.rewardGate.unlocked=true;s.routeOffers=[id,id==='tea'?'helper':'tea'];return act(s,{type:'chooseRoute',id});}
const openPack=s=>act(s,{type:'openRewardPack'});
function next(s){if(!s.added){s=openPack(s);s=act(s,{type:'add',id:s.offers[0]});}if(s.relicOffer.length&&!s.relicPicked)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});return act(s,{type:'next'});}
const dice=s=>act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});
const rendered=s=>renderView({s,screen:'game',prefs:{lang:'en'},busy:false,logText:()=>'',saved:null});

test('old savings cannot unlock a card pack; one safe reveal permits retreat and events but no extra cards',()=>{
 let s=board(['rice'],10000);s=act(s,{type:'stop'});assert.equal(s.bank,10002);assert.equal(s.roundRewardEligible,false);s=dice(s);
 assert.ok(rewardDenied(s));assert.match(rendered(s),/data-action="route"/);
 s=act(s,{type:'chooseRoute',id:s.routeOffers[0]});s=act(s,{type:'leaveEncounter'});assert.deepEqual(s.offers,[]);assert.ok(s.added);assert.throws(()=>openPack(s));
 s=act(s,{type:'next'});assert.equal(s.round,2);assert.equal(s.rewardGate.unlocked,false);assert.equal(s.rewardGate.bankStart,10002);assert.ok(restore(JSON.stringify(s)));
});
test('pairing unlocks once, stays unlocked after consuming food, and death grants no pack',()=>{
 let s=board(['rice','rice','grill']);s=act(s,{type:'pair',ids:[1,2]});assert.ok(s.rewardGate.unlocked);const saved=restore(JSON.stringify(s));assert.deepEqual(saved,s);
 // Lowering the table after unlocking does not relock the earned reward.
 s.cards[0].sealedBy=3;s.cards[1].sealedBy=3;s=act(s,{type:'stop'});assert.ok(s.roundRewardEligible);
 let dead=clone(saved);dead.draw.reverse();dead=act(dead,{type:'draw'});assert.equal(dead.phase,'lost');assert.throws(()=>openPack(dead));
});
test('earned draft opens once and preserves all three quotes across reload; only selected cards are added',()=>{
 let s=act(route('tea'),{type:'resolveEncounter'}),before=JSON.stringify(s);assert.equal(s.offers.length,3);assert.throws(()=>act(s,{type:'add',id:s.offers[0]}));assert.equal(JSON.stringify(s),before);
 s=openPack(s);const offers=[...s.offers];s=restore(JSON.stringify(s));assert.deepEqual(s.offers,offers);assert.throws(()=>openPack(s));
 const p=PACKAGES.find(p=>p.id===offers[0]),n=s.cards.length;s=act(s,{type:'add',id:p.id});assert.equal(s.cards.length,n+p.cards.length);assert.throws(()=>act(s,{type:'add',id:offers[1]}));
});
test('press merges same-name originals, keeps lead enchantment, scales score only and copies permanently',()=>{
 let s=route('press');card(s,1).enchantment='fried';card(s,2).enchantment='raw';const snapshot=JSON.stringify(s);
 for(const uids of [[1,1],[1,3],[1,s.cards.at(-1).uid]])assert.throws(()=>act(s,{type:'resolveEncounter',uids}));assert.equal(JSON.stringify(s),snapshot);
 s=act(s,{type:'resolveEncounter',uids:[1,2]});assert.equal(card(s,1).pressWeight,3);assert.equal(card(s,1).enchantment,'fried');assert.ok(!card(s,2));assert.ok(restore(JSON.stringify(s)));
 s=next(s);card(s,1).zone='table';s.draw=s.draw.filter(x=>x!==1);if(!s.table.includes(1))s.table.push(1);assert.equal(value(s,card(s,1)),6);
 s.phase='route';s.routeOffers=['duplicate','tea'];s.roundRewardEligible=true;s=act(s,{type:'chooseRoute',id:'duplicate'});s=act(s,{type:'resolveEncounter',uid:1});assert.equal(s.cards.at(-1).pressWeight,3);
});
test('upgraded press and duplicated copies preserve the enhanced original weight',()=>{
 let s=act(route('press'),{type:'resolveEncounter',uids:[1,2],bribe:true});assert.equal(card(s,1).pressWeight,4);assert.equal(s.bank,80);
 s=route('duplicate');card(s,1).pressWeight=4;const n=s.cards.length;s=act(s,{type:'resolveEncounter',uid:1,bribe:true});assert.equal(s.bank,70);assert.equal(s.cards.length,n+2);assert.deepEqual(s.cards.slice(-2).map(c=>c.pressWeight),[4,4]);
});
test('parcel uses the normal tool lifecycle, removes originals from scoring and returns them ready exactly once',()=>{
 let s=board(['rice','torch','packingcord','silvertray']);card(s,2).tapped=true;card(s,1).enchantment='fried';card(s,1).pressWeight=4;
 const ids=s.cards.map(c=>c.uid);s=act(s,{type:'use',uid:3,food:1,tool:2});assert.equal(card(s,1).zone,'parcel');assert.equal(card(s,2).zone,'parcel');assert.equal(card(s,3).usesThisTable,1);assert.equal(s.relicProgress.toolUses,1);assert.equal(value(s,card(s,4)),2);assert.ok(!s.discard.includes(1));
 assert.deepEqual(s.cards.map(c=>c.uid),ids);assert.ok(restore(JSON.stringify(s)));card(s,3).tapped=false;assert.throws(()=>act(s,{type:'use',uid:3,food:1,tool:2}));
 s.phase='draft';s.added=true;s.offers=[];s.relicOffer=[];s=act(s,{type:'next'});assert.deepEqual(s.parcelArrival.map(c=>c.uid),[1,2]);assert.ok(s.table.includes(1)&&s.table.includes(2));assert.equal(card(s,2).tapped,false);assert.equal(card(s,1).pressWeight,4);assert.equal(card(s,1).enchantment,'fried');assert.equal(s.sealedParcel,null);assert.ok(!s.draw.includes(1));assert.equal(card(s,s.draw[0]).kind==='bomb',false);
 s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.deepEqual(s.parcelArrival,[]);assert.ok(restore(JSON.stringify(s)));
});
test('packing rejects temporary food, a ready tool, paired food and same-card selection atomically',()=>{
 for(const mutate of [s=>card(s,1).temporary=true,s=>card(s,2).tapped=false,s=>card(s,1).pair=1]){const s=board(['rice','torch','packingcord']);card(s,2).tapped=true;mutate(s);const before=JSON.stringify(s);assert.throws(()=>act(s,{type:'use',uid:3,food:1,tool:2}));assert.equal(JSON.stringify(s),before);}
});
test('every event has a concrete bribe, insufficient funds and invalid targets charge nothing',()=>{
 for(const id of Object.keys(ROUTES).filter(x=>x!=='mystery'))assert.ok(bribeOffer(id,ENCHANTMENTS),id);
 let s=route('prune');s.bank=9;const before=JSON.stringify(s);assert.throws(()=>act(s,{type:'resolveEncounter',bribe:true,uids:[1,2]}));assert.equal(JSON.stringify(s),before);
 s.bank=100;const snap=JSON.stringify(s);assert.throws(()=>act(s,{type:'resolveEncounter',bribe:true,uids:[1,1]}));assert.equal(JSON.stringify(s),snap);
 s=act(s,{type:'resolveEncounter',bribe:true,uids:[1,2]});assert.equal(s.bank,84);assert.ok(!card(s,1)&&!card(s,2));assert.ok(restore(JSON.stringify(s)));
});
test('bribed tea, light and helper upgrades occur next table only; enchantments select two targets',()=>{
 for(const [id,check] of [['tea',s=>s.freePayments===4],['lantern',s=>s.known.length===6],['helper',s=>s.cards.filter(c=>c.kind==='torch'&&c.temporary).length===2]]){
  let s=act(route(id),{type:'resolveEncounter',bribe:true});assert.equal(s.bank,id==='lantern'?94:92);s=next(s);assert.ok(check(s),id);
  s.phase='draft';s.added=true;s.relicOffer=[];s=act(s,{type:'next'});assert.equal(s.nextRouteUpgrade,false);assert.equal(s.freePayments,0);
 }
 let s=act(route('fried'),{type:'resolveEncounter',bribe:true,uids:[1,2]});assert.equal(card(s,1).enchantment,'fried');assert.equal(card(s,2).enchantment,'fried');assert.equal(s.bank,84);
});
test('fixed target bases do not chase player savings and temporary skip multiplier affects dice only',()=>{
 const s=newRun(1,{rules:2,economy:2});s.round=6;s.target=100;const low=nextTarget(s,10);s.bank=100000;assert.equal(nextTarget(s,10),low);assert.equal(low,124);
 s.skipHistory=[{round:6,reward:'duplicate'}];assert.equal(nextTarget(s,10),134);s.round=7;assert.equal(nextTarget(s,10),128);
});
test('press event UI exposes lead enchantments, result weight and bribe selection in both languages',()=>{
 const s=route('press');card(s,1).enchantment='fried';for(const lang of ['zh','en']){const html=encounterHTML(s,lang,{uids:[1,2],bribe:true});assert.match(html,/event-bribe/);assert.match(html,/×4/);assert.match(html,/data-enchantment="fried"/);assert.ok(!/undefined/.test(html));}
});

test('normal difficulty uses fixed base plus one d20 through ten tables; high ascensions retain extra dice',()=>{
 for(let round=1;round<10;round++){
  const s=newRun(round,{rules:2,economy:2});s.round=round;assert.equal(ruleDiceCount(s),1);
  s.difficulty=1;if(round>=4)assert.equal(ruleDiceCount(s),round>=7?3:2);
 }
 let s=board(['rice'],10000);s.round=4;beginRewardTable(s);s=act(s,{type:'stop'});assert.equal(s.phase,'stakes');s=act(s,{type:'roll'});assert.equal(s.dice.result.faces.length,1);
});

test('sealed originals survive repeated skips and reload, opening at the next actually played table',()=>{
 let s=board(['rice','torch','packingcord'],10000);card(s,2).tapped=true;s=act(s,{type:'use',uid:3,food:1,tool:2});s=act(s,{type:'stop'});
 for(let i=0;i<2;i++){
  s=dice(s);s.skipOffer.pool=['scout'];s=act(s,{type:'spinSkip'});s=act(s,{type:'skipTable',id:'scout'});assert.deepEqual(s.sealedParcel.uids,[1,2]);assert.equal(s.sealedParcel.round,s.round+1);assert.ok(restore(JSON.stringify(s)));s=restore(JSON.stringify(s));
 }
 s=dice(s);s.routeOffers=['tea','helper'];s=act(s,{type:'chooseRoute',id:'tea'});s=act(s,{type:'leaveEncounter'});s=next(s);assert.equal(s.round,4);assert.deepEqual(s.parcelArrival.map(c=>c.uid),[1,2]);assert.equal(s.cards.filter(c=>c.uid===1).length,1);assert.equal(card(s,2).tapped,false);
});

test('bribed exchanges, storage and pawning retain the exact promised quantities',()=>{
 let s=route('trade'),count=s.cards.length,kind=s.encounter.offers[0];s=act(s,{type:'resolveEncounter',kind,uids:[1],bribe:true});assert.equal(s.cards.length,count);assert.equal(s.bank,90);
 s=route('closingmeal');const relic=s.encounter.prize;count=s.cards.length;s=act(s,{type:'resolveEncounter',uids:[1],bribe:true});assert.equal(s.cards.length,count-1);assert.ok(s.relics.includes(relic));assert.equal(s.bank,86);
 s=act(route('coldlocker'),{type:'resolveEncounter',uids:[1,2],bribe:true});assert.deepEqual(s.storedFoods.map(c=>c.uid),[1,2]);assert.equal(s.bank,89);s=next(s);assert.ok([1,2].every(uid=>card(s,uid).zone==='table'));
 s=route('menuchange');kind=s.encounter.offers.find(k=>k!=='rice');count=s.cards.length;s=act(s,{type:'resolveEncounter',uid:1,kind,bribe:true});assert.equal(card(s,1).original,kind);assert.equal(s.cards.at(-1).original,kind);assert.equal(s.cards.length,count+1);assert.equal(s.bank,80);
 s=route('pawn');const prize=s.encounter.pledgeOffers[0];s=act(s,{type:'resolveEncounter',relic:'shaker',prize,bribe:true});assert.equal(s.bank,84);assert.ok(!s.relics.includes('shaker'));assert.ok(s.relics.includes(prize));assert.equal(s.eventReceipt.amount,0);
 s=act(route('staple'),{type:'resolveEncounter',bribe:true});assert.equal(s.bank,66);assert.equal(s.staples[0].permanent,true);assert.equal(s.staples[0].uids.length,3);
});

test('bribed negative encounters undo the stated penalty once without unlocking a card pack',()=>{
 const seen=new Set();
 for(let seed=1;seed<=1500&&seen.size<5;seed++){
  let s=board(['rice','rice','torch'],100);s.phase='route';s.roundRewardEligible=false;s.routeOffers=['mystery','tea'];s.rng=seed;s=act(s,{type:'chooseRoute',id:'mystery'});if(!s.encounter.applied||seen.has(s.encounter.id))continue;
  const id=s.encounter.id;seen.add(id);const previous=JSON.stringify(s),cost=bribeOffer(id,ENCHANTMENTS,s).cost,paid=s.bank,receipt=clone(s.eventReceipt);s=act(s,{type:'resolveEncounter',bribe:true});assert.equal(s.roundRewardEligible,false);assert.equal(s.offers.length,0);assert.throws(()=>act(s,{type:'resolveEncounter',bribe:true}));
  if(id==='levy')assert.equal(s.bank,paid-cost+receipt.amount);
  else if(id==='pressure'||id==='cap')assert.equal(s.tableCondition,null);
  else {assert.equal(s.cards.at(-1).original,receipt.removed[0].original);assert.equal(s.bank,paid-cost);}
  assert.ok(restore(previous));assert.ok(restore(JSON.stringify(s)));
 }assert.equal(seen.size,5);
});

test('bribed Pan and wager keep the rescue singular and grant only the declared extra benefits',()=>{
 let s=route('pan');s.encounter.quote=25;s.encounter.haggled=true;s=act(s,{type:'resolveEncounter',bribe:true});assert.equal(s.bank,67);assert.equal(s.relics.filter(id=>id==='pangift').length,1);s=next(s);assert.equal(s.known.length,3);
 s=route('wager');s.target=100;s=act(s,{type:'resolveEncounter',bribe:true});s=next(s);assert.equal(s.tableCondition.prizes,2);const owned=s.relics.length;s.bank=200;s=act(s,{type:'draw'});s=act(s,{type:'stop'});assert.equal(s.relics.length,owned+2);assert.equal(new Set(s.wagerPrize.ids).size,2);assert.ok(restore(JSON.stringify(s)));
});

test('legacy rewards remain claimable while the new economy starts only at the next table',()=>{
 let s=newRun(11,{rules:2});s.bank=1000;s.phase='route';s.routeOffers=['tea','helper'];s.economyPending=2;s=act(s,{type:'chooseRoute',id:'tea'});assert.equal(s.phase,'draft');assert.equal(s.economy,undefined);s=act(s,{type:'add',id:s.offers[0]});s=act(s,{type:'next'});assert.equal(s.economy,2);assert.equal(s.rewardGate.round,2);assert.equal(s.rewardGate.bankStart,1000);assert.ok(restore(JSON.stringify(s)));
});

test('all ten tables and entry into endless stay reachable with locked and unlocked card rewards',()=>{
 let s=board(['rice','rice'],10000);s=act(s,{type:'pair',ids:[1,2]});
 for(let round=1;round<=10;round++){
  assert.equal(s.round,round);if(!s.flips)s=act(s,{type:'draw'});s=act(s,{type:'stop'});assert.ok(restore(JSON.stringify(s)));
  if(round===10)break;
  s=dice(s);s=act(s,{type:'chooseRoute',id:s.routeOffers[0]});s=act(s,{type:s.encounter.applied?'resolveEncounter':'leaveEncounter'});s=next(s);assert.equal(s.rewardGate.round,round+1);assert.ok(restore(JSON.stringify(s)));
 }
 assert.equal(s.phase,'won');const target=s.target;s=act(s,{type:'continueEndless'});assert.equal(s.target,target*2);s=act(s,{type:'chooseRoute',id:s.routeOffers[0]});s=act(s,{type:s.encounter.applied?'resolveEncounter':'leaveEncounter'});s=next(s);assert.equal(s.round,11);assert.ok(s.endless);assert.ok(s.relics.includes('autotongs'));assert.ok(restore(JSON.stringify(s)));
});


test('press uses 1.5x combined weight; repeated fractional weights survive copying and save/restore',()=>{
 assert.equal(pressedWeight({},{}),3);assert.equal(pressedWeight({},{},true),4);
 let s=route('press');card(s,1).pressWeight=6;card(s,2).pressWeight=3;
 s=act(s,{type:'resolveEncounter',uids:[1,2]});assert.equal(card(s,1).pressWeight,13.5);assert.equal(value(s,card(s,1)),27);assert.ok(restore(JSON.stringify(s)));
 for(const weight of [NaN,Infinity,-2,0,Number.MAX_SAFE_INTEGER+1])assert.equal(validPressWeight(weight),false);
 s.phase='route';s.routeOffers=['duplicate','tea'];s=act(s,{type:'chooseRoute',id:'duplicate'});s=act(s,{type:'resolveEncounter',uid:1});assert.equal(s.cards.at(-1).pressWeight,13.5);assert.ok(restore(JSON.stringify(s)));
});

test('bribe quotes scale with the benefit, match displayed price and do not chase savings',()=>{
 assert.ok(bribeOffer('staple').cost>bribeOffer('tea').cost);
 assert.ok(bribeOffer('duplicate').cost>bribeOffer('fried',ENCHANTMENTS).cost);
 for(const id of ['levy','pressure','cap']){
  const s=route('tea');s.encounter={id,quote:160,applied:id!=='pawn'};s.eventReceipt={id,amount:120,removed:[]};s.target=400;
  const cost=bribeOffer(id,ENCHANTMENTS,s).cost;assert.equal(cost,{levy:60,pressure:60,cap:40}[id]);
  s.bank=5000;assert.equal(bribeOffer(id,ENCHANTMENTS,s).cost,cost);
  const html=encounterHTML(s,'en',{bribe:true});assert.ok(html.includes(`Total cost: ${cost} points.`));
  s.bank=cost-1;const snap=JSON.stringify(s);assert.throws(()=>act(s,{type:'resolveEncounter',bribe:true,relic:'shaker'}));assert.equal(JSON.stringify(s),snap);
 }
});

test('reward HUD keeps one progress bar, no chains and no oversized reward badge',()=>{
 const s=board();const html=rewardHUD(s,'en',4,120);
 assert.equal((html.match(/role="progressbar"/g)||[]).length,1);assert.match(html,/>20<\/strong>/);assert.match(html,/Card pack 4 \/ 8/);assert.ok(!/chain|earned-pack|<svg/.test(html));
 s.rewardGate.unlocked=true;assert.match(rewardHUD(s,'en',10,120),/width:50%/);
});

test('opening reward packs hides choices until the presentation is complete, without tying opened cards',()=>{
 let s=act(route('tea'),{type:'resolveEncounter'});assert.match(rendered(s),/closed-draft/);s=openPack(s);
 const html=renderView({s,screen:'game',prefs:{lang:'en'},busy:true,performance:'craft-open-reward'});
 assert.match(html,/opening-pack/);assert.ok(!html.includes('data-action="add"'));
 const done=rendered(s);assert.equal((done.match(/data-action="add"/g)||[]).length,3);assert.ok(!done.includes('tied-fan'));
 assert.ok(restore(JSON.stringify(s)).rewardPackOpened);
});
