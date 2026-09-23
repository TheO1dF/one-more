import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,PACKAGES,icon} from '../game/cards.js';
import {NIGHT_CARDS,NIGHT_SYSTEMS} from '../game/night-cards.js';
import {act,newRun,card,value,restore,partners,toolProblem} from '../game/engine.js';
import {bankCost} from '../game/enchantments.js';
function board(kinds,deck=['rice','fish','mint','bomb']){
 const s=newRun(701,{rules:2});Object.assign(s,{cards:[],table:[],draw:[],discard:[],known:[],uid:0,flips:kinds.length,target:0,bank:100});
 for(const [zone,list] of [['table',kinds],['deck',deck]])for(const kind of list){const c={uid:++s.uid,kind,original:kind,zone,entered:s.uid,tapped:false,pair:null,pairedOnce:false};s.cards.push(c);s[zone==='table'?'table':'draw'].push(c.uid);}s.eventCount=s.uid;return s;
}
const use=(s,uid,target,food)=>act(s,{type:'use',uid,target,food}),pair=(s,a,b)=>act(s,{type:'pair',ids:[a,b]});
const next=s=>act({...s,phase:'draft',added:true,relicOffer:[]},{type:'next'});
const count=(s,k)=>s.table.filter(uid=>card(s,uid).kind===k).length;
test('six distinct systems contain 24 obtainable cards with unique poster silhouettes',()=>{
 assert.equal(NIGHT_SYSTEMS.length,6);assert.equal(Object.keys(NIGHT_CARDS).length,24);
 assert.equal(new Set(NIGHT_SYSTEMS.flatMap(g=>g.cards)).size,24);
 assert.equal(new Set(Object.keys(NIGHT_CARDS).map(k=>icon(k))).size,24);
 for(const k of Object.keys(NIGHT_CARDS)){assert.match(icon(k),/<svg/);assert.ok(PACKAGES.some(p=>p.cards.includes(k)&&p.cards.some(c=>CARDS[c].type==='trouble')),k);}
});
test('mixed tea pairs are symmetric; transforming food trades its printed effect for a new partner',()=>{
 let s=board(['blacktea','rice','pastrymold','duetstand']);assert.equal(partners(s,1).length,0);
 s=use(s,3,2);assert.equal(card(s,2).kind,'shortbread');assert.equal(card(s,2).original,'rice');
 assert.ok(partners(s,1).some(c=>c.uid===2));assert.ok(partners(s,2).some(c=>c.uid===1));
 s=pair(s,2,1);assert.equal(value(s,card(s,4)),4);assert.equal(value(s,card(s,1)),4);assert.equal(value(s,card(s,2)),4);
 assert.equal(s.lastFoodPair,'blacktea');assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('serving paired Croutons sacrifices the pair before awarding value and creates no unstated Residue',()=>{
 let s=board(['crouton','crouton','banquetfork','sauceboat','duetstand']);s=pair(s,1,2);s=use(s,3,1);
 assert.equal(value(s,card(s,3)),16);assert.equal(value(s,card(s,4)),6);assert.equal(count(s,'rice'),4);assert.equal(count(s,'residue'),0);
 assert.deepEqual(s.discard,[1,2]);assert.equal(value(s,card(s,5)),0);
 s=board(['rice','rice','servingcloche']);s=pair(s,1,2);s=use(s,3,1);assert.equal(s.freePayments,3);
});
test('preserved food does not award consumption payoff, and a recovered Crouton cannot trigger twice',()=>{
 let s=board(['crouton','crouton','banquetfork','scoop','grill']);s=pair(s,1,2);card(s,1).keepOnce=true;
 s=use(s,3,1);assert.equal(value(s,card(s,3)),8);assert.equal(count(s,'rice'),2);assert.equal(card(s,1).zone,'table');
 s=use(s,4,2);s=use(s,5,2);assert.equal(count(s,'rice'),2);assert.equal(card(s,2).consumedAbilityUsed,true);
});
test('salvage spends limited refreshes: the Winding key stays spent after Repair ticket',()=>{
 let s=board(['torch','windingkey','repairtag']);s=use(s,1);s=use(s,2);
 assert.equal(card(s,1).tapped,false);assert.equal(card(s,2).zone,'discard');
 s=use(s,3,2);assert.equal(s.bank,96);assert.equal(card(s,2).zone,'table');assert.equal(toolProblem(s,card(s,2)),'noTarget');
 assert.throws(()=>use(s,2));assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('Pistachio and Leftovers basket each trigger only once across repeated consume and reclaim',()=>{
 let s=board(['spareparts','torch','grill','scoop','scrapbasket']);s=use(s,2);s=use(s,3,1);
 assert.equal(card(s,2).tapped,false);assert.ok(card(s,1).consumedAbilityUsed);
 s=use(s,4,1);assert.equal(count(s,'spareparts'),2);assert.ok(card(s,5).reclaimUsed);
 card(s,3).tapped=false;s=use(s,2);s=use(s,3,1);assert.equal(card(s,2).tapped,true);
 card(s,4).tapped=false;s=use(s,4,1);assert.equal(count(s,'spareparts'),2);
});
test('tomorrow preparations survive save/reload, arrive once, and cannot rescue a failed cash-out',()=>{
 let s=board(['lunchorder','lunchorder','thermos','rice','reservationbell','drygoods']);s=pair(s,1,2);s=use(s,3,4);
 assert.deepEqual(s.nextKitchen,{foods:['rice'],free:0});assert.equal(count(s,'rice'),0);assert.equal(card(s,4).zone,'stored');
 s=act(s,{type:'stop'});assert.equal(card(s,6).seasoned,1);assert.deepEqual(s.nextKitchen.foods,['rice','lunchorder']);
 s=next(restore(JSON.stringify(s)));assert.equal(count(s,'rice'),2);assert.equal(count(s,'lunchorder'),1);assert.equal(s.freePayments,0);assert.equal(s.nextKitchen,null);assert.equal(card(s,4).zone,'table');
 assert.equal(value(s,card(s,6)),3);assert.deepEqual(restore(JSON.stringify(s)),s);
 s=board(['drygoods']);s.bank=0;s.target=900;s=act(s,{type:'stop'});assert.equal(s.phase,'lost');assert.equal(card(s,1).seasoned,undefined);
});
test('Dried peel growth is permanent but capped, and transformed or temporary copies cannot farm it',()=>{
 let s=board(['drygoods','drygoods']);card(s,1).seasoned=6;card(s,2).temporary=true;s=act(s,{type:'stop'});
 assert.equal(card(s,1).seasoned,6);assert.equal(card(s,2).seasoned,undefined);
});
test('transform route changes identity without extra draws, copies, bomb movement or reveal recursion',()=>{
 let s=board(['sourcabbage','sourcabbage','paper','paletteplate','cookiepress','fish'],['harlequinpudding','bomb','rice']);
 const before=[...s.draw],n=s.cards.length;s=pair(s,1,2);assert.equal(card(s,3).kind,'rice');assert.equal(value(s,card(s,4)),3);
 s=use(s,5,6);assert.equal(card(s,6).kind,'sourcabbage');assert.equal(value(s,card(s,4)),6);assert.deepEqual(s.draw,before);assert.equal(s.cards.length,n);
 s=act(s,{type:'draw'});assert.equal(card(s,7).kind,'sourcabbage');assert.equal(card(s,7).original,'harlequinpudding');assert.equal(value(s,card(s,4)),9);
 assert.equal(s.draw[0],8);assert.equal(s.known.length,0);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('Cold stove suppresses new pair abilities; changing to the same kind is not a transformation',()=>{
 let s=board(['cold','lunchorder','lunchorder']);s=pair(s,2,3);assert.equal(s.nextKitchen,null);
 s=board(['pastrymold','shortbread','paletteplate']);assert.equal(toolProblem(s,card(s,1)),'noTarget');
});
test('tool rotation rewards distinct names, not repeats; Shift sheets cannot refresh each other forever',()=>{
 let s=board(['silvertray','torch','torch','checklist','checklist']);s=use(s,2);assert.equal(value(s,card(s,1)),2);
 s=use(s,3);assert.equal(value(s,card(s,1)),2);s=use(s,4);assert.equal(value(s,card(s,1)),4);
 s=use(s,2);s=use(s,5);assert.equal(card(s,2).tapped,true);assert.equal(card(s,4).tapped,false);
 s=use(s,4);assert.throws(()=>use(s,5));assert.equal(card(s,4).usesThisTable,2);assert.equal(card(s,5).usesThisTable,1);
 assert.ok(toolProblem(s,card(s,4)));assert.ok(toolProblem(s,card(s,5)));
});
test('Appetizer excludes used tools; discounts have a floor and reset next table',()=>{
 let s=board(['firstcourse','firstcourse','scope','scope','rice','servicepass','repairtag']);s=use(s,3,null,5);s=pair(s,1,2);
 assert.equal(card(s,3).freeCost,undefined);assert.equal(card(s,4).freeCost,true);
 s=use(s,6,7);assert.equal(bankCost(card(s,7),CARDS),2);card(s,6).tapped=false;s=use(s,6,7);assert.equal(bankCost(card(s,7),CARDS),1);
 s=next(act(s,{type:'stop'}));assert.equal(bankCost(card(s,7),CARDS),4);assert.equal(card(s,7).usesThisTable,0);
});
test('random cut preserves danger in a 40-card pile and never anchors the bomb at the bottom',()=>{
 const positions=new Set();let earlyHits=0;
 for(let seed=1;seed<=600;seed++){
  let s=board(['cardcutter'],['bomb',...Array(39).fill('rice')]);s.rng=seed;s.known=[2,3,4];
  s=use(s,1);const index=s.draw.indexOf(2);positions.add(index);if(index<8)earlyHits++;
  assert.equal(s.bank,98);assert.equal(s.known.length,0);assert.equal(s.flips,1);assert.equal(s.draw.length,40);assert.notEqual(index,0);
 }
 assert.equal(positions.size,39);assert.ok(earlyHits>70&&earlyHits<155,earlyHits);
});
