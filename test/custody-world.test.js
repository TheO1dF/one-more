import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {newRun,act,card,score,restore,reprintTargets,eligibleDealerRoutes} from '../game/engine.js';
import {CARDS,RELICS} from '../game/cards.js';
import {ROUTES} from '../game/routes.js';
import {SETBACKS,prizePool} from '../game/dealer-events.js';
import {sceneArt,WORLD_ART,SCENE_KEYS} from '../game/world-art.js';
import {encounterHTML} from '../game/dealer-view.js';
function board(kinds,relics=[]){const s=newRun(601,{rules:2});Object.assign(s,{cards:[],draw:[],table:[],discard:[],known:[],bank:100,target:0,uid:0,flips:kinds.length});s.relics.push(...relics);for(const [zone,list]of [['table',kinds],['deck',['bomb','rice','fish']]])for(const kind of list){const c={uid:++s.uid,kind,original:kind,zone,entered:s.uid,tapped:false,pair:null,pairedOnce:false,bonus:0};s.cards.push(c);s[zone==='table'?'table':'draw'].push(c.uid);}s.eventCount=s.uid;return s;}
const use=(s,uid,target,food)=>act(s,{type:'use',uid,target,food});
const pair=(s,a,b)=>act(s,{type:'pair',ids:[a,b]});
const next=s=>act({...s,phase:'draft',added:true,relicOffer:[]},{type:'next'});
const route=(s,id)=>act({...s,phase:'route',routeOffers:[id,'tea']},{type:'chooseRoute',id});
test('Thermos stores the same transformed card without consuming it; its exact per-card bonus returns',()=>{
 let s=board(['thermos','fish','rice'],['silverfork','sealclip']);Object.assign(card(s,2),{kind:'shortbread',bonus:3,enchantment:'raw'});const order=[...s.draw],before=s.bank;
 s=use(s,1,2);assert.equal(card(s,2).zone,'stored');assert.equal(s.bank,before);assert.equal(s.discard.length,0);assert.deepEqual(s.draw,order);assert.equal(score(s),2);assert.equal(card(s,2).bonus,5);assert.equal(s.log.some(e=>e.key==='consume'),false);
 s=next(restore(JSON.stringify(act(s,{type:'stop'}))));assert.equal(card(s,2).zone,'table');assert.equal(card(s,2).kind,'shortbread');assert.equal(card(s,2).original,'fish');assert.equal(card(s,2).enchantment,'raw');assert.equal(card(s,2).bonus,5);assert.equal(s.draw.includes(2),false);assert.deepEqual(s.storedFoods,[]);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('storing a paired food breaks its old pair without resetting the partner this table',()=>{
 let s=pair(board(['rice','rice','thermos']),1,2);s=use(s,3,1);assert.equal(card(s,2).pair,null);assert.equal(card(s,2).pairedOnce,true);assert.equal(score(s),2);
 s=next(act(s,{type:'stop'}));assert.equal(card(s,1).pairedOnce,false);assert.equal(card(s,1).pair,null);
});
test('stored temporary food survives the draft and exactly one next table, without becoming permanent',()=>{
 let s=board(['thermos','rice','fish']);card(s,2).temporary=true;s=use(s,1,2);s=act(s,{type:'stop'});s=route(s,'coldlocker');s=act(s,{type:'leaveEncounter'});
 assert.equal(card(s,2).zone,'stored');s=next(restore(JSON.stringify(s)));assert.equal(card(s,2).zone,'table');assert.equal(card(s,2).temporary,true);
 s.flips=1;s=next(act(s,{type:'stop'}));assert.equal(card(s,2),undefined);
});
test('storage snapshots cannot forge a bomb, duplicate a UID, or also occupy a draw slot',()=>{
 let s=use(board(['thermos','rice']),1,2);assert.ok(restore(JSON.stringify(s)));
 for(const change of [x=>x.storedFoods.push({...x.storedFoods[0]}),x=>x.storedFoods[0].kind='bomb',x=>x.draw.push(2),x=>x.cards.find(c=>c.uid===2).zone='table']){const copy=structuredClone(s);change(copy);assert.equal(restore(JSON.stringify(copy)),null);}
});
test('Reserved seat copies at most two returns and never changes the original identities',()=>{
 let s=board(['thermos','thermos','thermos','rice','fish','tea'],['reservebench']);s=use(use(use(s,1,4),2,5),3,6);s=next(act(s,{type:'stop'}));
 assert.equal(s.cards.filter(c=>c.temporary).length,2);assert.ok([4,5,6].every(uid=>card(s,uid).zone==='table'));assert.equal(s.table.length,5);
});
test('transformation pledges trigger once, not on same-kind attempts or generated copies',()=>{
 let s=board(['pastrymold','rice','blacktea','torch','rice'],['gildedmask','prismseal']);s=use(s,4);s=use(s,1,2);assert.equal(s.cards.filter(c=>c.temporary).length,1);s=pair(s,2,3);assert.equal(card(s,1).tapped,false);assert.equal(card(s,4).tapped,true);
 s=use(s,1,5);assert.equal(s.cards.filter(c=>c.temporary).length,1);assert.deepEqual(restore(JSON.stringify(s)),s);
 card(s,1).tapped=false;assert.throws(()=>use(s,1,5));
});
test('consumption pledges count actual consumed food; storing and preserving do not spend the threshold',()=>{
 let s=board(['rice','rice','banquetfork','torch','thermos','fish'],['bonechina','scrapvoucher']);s=use(s,4);s=use(s,5,6);assert.equal(s.relicProgress.consumedFoods,undefined);
 s=pair(s,1,2);s=use(s,3,1);assert.equal(card(s,3).tapped,false);assert.equal(card(s,4).tapped,true);assert.equal(s.relicProgress.consumedFoods,2);assert.equal(s.cards.filter(c=>c.temporary&&c.kind==='wild').length,1);
});
test('cold storage takes a real food from the deck for 3, keeps one identity and can be declined',()=>{
 let s=board(['rice']);s=route(s,'coldlocker');const uid=s.draw.find(uid=>card(s,uid).kind==='fish'),size=s.cards.length;s=act(s,{type:'resolveEncounter',uid});assert.equal(s.bank,97);assert.equal(card(s,uid).zone,'stored');assert.equal(s.cards.length,size);assert.deepEqual(restore(JSON.stringify(s)),s);s=next(s);assert.equal(card(s,uid).zone,'table');
 s=route(board(['rice']),'coldlocker');s=act(s,{type:'leaveEncounter'});assert.equal(s.bank,100);assert.equal(s.storedFoods.length,0);
});
test('new menu replaces one permanent food, preserves a compatible enchantment, validates offers on reload',()=>{
 let s=board(['rice','fish']);card(s,1).enchantment='raw';s=route(s,'menuchange');assert.equal(s.encounter.offers.length,3);assert.deepEqual(restore(JSON.stringify(s)),s);
 const kind=s.encounter.offers.find(k=>reprintTargets(s,k).some(c=>c.uid===1));assert.ok(kind);const n=s.cards.length;s=act(s,{type:'resolveEncounter',uid:1,kind});assert.equal(s.bank,96);assert.equal(s.cards.length,n);assert.equal(card(s,1).original,kind);assert.equal(card(s,1).enchantment,'raw');assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('closing meal shows one obtainable pledge, charges two different real foods, and excludes Pan',()=>{
 let s=route(board(['rice','fish']),'closingmeal');const prize=s.encounter.prize;assert.ok(prizePool(board(['rice','fish']),RELICS).includes(prize));assert.match(encounterHTML(s,'zh'),new RegExp(RELICS[prize].name[0]));assert.throws(()=>act(s,{type:'resolveEncounter',uids:[1,1]}));
 s=act(s,{type:'resolveEncounter',uids:[1,2]});assert.equal(card(s,1),undefined);assert.equal(card(s,2),undefined);assert.ok(s.relics.includes(prize));assert.equal(s.bank,100);assert.deepEqual(restore(JSON.stringify(s)),s);assert.ok(!prizePool(s,RELICS).includes('pangift'));
 const all=board(['rice','fish'],Object.keys(RELICS).filter(id=>id!=='shaker'));assert.ok(!eligibleDealerRoutes(all).includes('closingmeal'));
});
test('every route and setback resolves to a real illustration; dealer art retains the old vector fallback',()=>{
 for(const [name,url]of Object.entries(WORLD_ART))assert.ok(existsSync(new URL(url)),name);
 for(const id of [...Object.keys(ROUTES),...Object.keys(SETBACKS)]){
  const art=sceneArt(id);assert.match(art,/<svg/);
  if(SCENE_KEYS[id]==='dealer')assert.match(art,/dealer-painted[\s\S]*<image[\s\S]*dealer-character-v2\.png/);
  else assert.doesNotMatch(art,/<img|<image|gradient/i);
 }
 assert.match(readFileSync(new URL('../game/dealer-art.js',import.meta.url),'utf8'),/legacyDealerActor/);
 const performance=readFileSync(new URL('../game/pan-performance.js',import.meta.url),'utf8');assert.doesNotMatch(performance,/pan-witness|panArt\(|pan-scene-caption|BOMB STOPPED/);assert.match(performance,/panHandArt\(\)/);
});

test('withdrawn pledges never enter fresh runs or any reward pool but existing saves remain valid',()=>{
 const fresh=newRun(21,{rules:2});for(const [id,r]of Object.entries(RELICS).filter(([,r])=>r.retired)){assert.ok(!fresh.allowedRelics.includes(id));assert.ok(!prizePool(fresh,RELICS).includes(id));}
 const old=board(['rice'],['sealclip']);assert.deepEqual(restore(JSON.stringify(old)),old);
});
