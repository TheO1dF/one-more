import test from 'node:test';
import assert from 'node:assert/strict';
import {act,newRun,restore,score,card} from '../game/engine.js';
import {CARDS,RELICS,icon,classicIcon} from '../game/cards.js';
import {POSTER_SHAPES} from '../game/poster-art.js';
import {NIGHT_ART} from '../game/night-art.js';
function fixture(kinds,relics=[]){
 const s=newRun(104);s.cards=kinds.concat(['bomb','fish','mint','tea','rice']).map((kind,i)=>({uid:i+1,kind,original:kind,zone:i<kinds.length?'table':'deck',entered:i+1}));
 s.table=s.cards.filter(c=>c.zone==='table').map(c=>c.uid);s.draw=s.cards.filter(c=>c.zone==='deck').map(c=>c.uid);s.discard=[];s.known=[];s.uid=s.cards.length;s.eventCount=s.uid;s.flips=1;s.bank=10;s.relics=['shaker',...relics];return s;
}
test('111 cards and 30 relics have distinct complete poster assets; originals remain available',()=>{
 assert.equal(Object.keys(RELICS).length,30);
 const kinds=[...Object.keys(CARDS),...Object.values(RELICS).map(r=>r.icon)];
 const art={...POSTER_SHAPES,...NIGHT_ART};assert.equal(kinds.length,141);assert.equal(new Set(kinds.map(k=>art[k])).size,141);
 for(const k of kinds){assert.ok(art[k],k);assert.match(icon(k),/poster-art|night-art/);assert.doesNotMatch(icon(k),/Gradient|filter=/);}
 assert.match(classicIcon('rice'),/<svg/);assert.notEqual(classicIcon('rice'),icon('rice'));
});
test('first peek expands once, Interference does not spend it and Fog still caps it',()=>{
 let s=fixture(['torch','torch'],['pocketwatch']);s=act(s,{type:'use',uid:1});assert.equal(s.known.length,2);s.known=[];s=act(s,{type:'use',uid:2});assert.equal(s.known.length,1);
 s=fixture(['noise','torch'],['pocketwatch']);s=act(s,{type:'use',uid:2});assert.equal(s.known.length,0);assert.equal(s.relicProgress.pocketwatch,undefined);
 s=fixture(['fog','torch'],['pocketwatch']);s=act(s,{type:'use',uid:2});assert.equal(s.known.length,1);
});
test('pair bonuses are flat and Ginger does not refresh passive first-pair triggers',()=>{
 let s=fixture(['rice','wild','ginger','ginger','tea','tea'],['matchbox','shellpair']);s=act(s,{type:'pair',ids:[1,2]});assert.equal(card(s,1).bonus,2);assert.equal(card(s,2).bonus,1);
 s.relicUsed.shaker=true;s=act(s,{type:'pair',ids:[3,4]});assert.equal(s.relicUsed.shaker,undefined);assert.equal(s.relicProgress.matchbox,true);
 s=act(s,{type:'pair',ids:[5,6]});assert.equal(card(s,5).bonus,undefined);
});
test('Silver fork counts actual consumption, not a retained or boiled payment',()=>{
 let s=fixture(['rice','scope'],['silverfork']);s.cards[0].enchantment='boiled';s=act(s,{type:'use',uid:2,food:1});assert.equal(s.bank,10);assert.equal(s.relicProgress.silverfork,undefined);
 s.cards[1].tapped=false;s=act(s,{type:'use',uid:2,food:1});assert.equal(s.bank,11);assert.equal(s.cards.filter(c=>c.kind==='residue').length,0);
});
test('clearing linen peeks after removing Interference',()=>{
 let s=fixture(['noise','cloth'],['linen']);s=act(s,{type:'use',uid:2,target:1});assert.equal(s.known.length,1);assert.equal(card(s,1).zone,'discard');
});
test('tool counters give the first bank reward and exactly one third-use peek',()=>{
 let s=fixture(['mold','rice'],['coinpurse','luckybone']);
 for(let i=0;i<4;i++){s.cards[0].tapped=false;s=act(s,{type:'use',uid:1,target:2});assert.equal(s.bank,10-(i+1)*2+2);assert.equal(s.known.length,i>=2?2:0);}
});
test('wax seal duplicates one base food once, with no enchantment and no residues',()=>{
 let s=fixture(['mold','rice'],['redseal']);s.cards[1].enchantment='fried';s=act(s,{type:'use',uid:1,target:2});let made=s.cards.filter(c=>c.temporary);assert.equal(made.length,2);assert.ok(made.every(c=>!c.enchantment&&c.kind==='rice'));
 s.cards[0].tapped=false;s=act(s,{type:'use',uid:1,target:2});assert.equal(s.cards.filter(c=>c.temporary).length,3);
});
test('two different pair types refresh earliest exhausted tool only once',()=>{
 let s=fixture(['rice','rice','fish','fish','torch','scope','tea','tea'],['recipebook']);card(s,5).tapped=card(s,6).tapped=true;
 s=act(s,{type:'pair',ids:[1,2]});assert.equal(card(s,5).tapped,true);s=act(s,{type:'pair',ids:[3,4]});assert.equal(card(s,5).tapped,false);assert.equal(card(s,6).tapped,true);s=act(s,{type:'pair',ids:[7,8]});assert.equal(card(s,6).tapped,true);
});
test('start relics reset per table and do not inflate the permanent deck',()=>{
 let s=fixture([],['emptyplate','bottlestopper']);s.phase='draft';s.added=true;s.relicOffer=[];s.relicProgress={pocketwatch:true};const n=s.cards.length;
 s=act(s,{type:'next'});assert.equal(s.cards.length,n+1);assert.equal(s.table.length,1);assert.equal(card(s,s.table[0]).temporary,true);assert.equal(s.freePayments,1);assert.deepEqual(s.relicProgress,{});assert.notEqual(card(s,s.draw[0]).kind,'bomb');
});
test('Neon sign expands discovery, round-trips its pending choice and rejects invalid saves',()=>{
 let s=fixture(['sorter'],['neonsign']);s=act(s,{type:'use',uid:1});assert.equal(s.pending.offers.length,4);assert.ok(restore(JSON.stringify(s)));const chosen=s.pending.offers[3];s=act(s,{type:'discover',kind:chosen});assert.equal(s.cards.at(-1).kind,chosen);
 s=fixture(['sorter']);s=act(s,{type:'use',uid:1});assert.equal(s.pending.offers.length,3);
});
test('exact cash-out reward cannot rescue a short table',()=>{
 let s=fixture(['rice'],['scale']);s.target=s.bank+score(s);s=act(s,{type:'stop'});assert.equal(s.bank,16);assert.equal(s.phase,'stakes');
 s=fixture(['rice'],['scale']);s.target=13;s=act(s,{type:'stop'});assert.equal(s.phase,'lost');assert.equal(s.bank,12);
});
test('bank-cost relics resolve atomically and do not generate residue',()=>{
 let s=fixture(['torch','oil'],['oldkey','polishingstone','trashpass']);card(s,1).tapped=true;
 s=act(s,{type:'relic',id:'oldkey'});assert.equal(s.bank,7);assert.equal(s.known.length,1);assert.throws(()=>act(s,{type:'relic',id:'oldkey'}),/relic/);
 const before=JSON.stringify(s);assert.throws(()=>act(s,{type:'relic',id:'polishingstone',uid:2}),/target/);assert.equal(JSON.stringify(s),before);
 s=act(s,{type:'relic',id:'polishingstone',uid:1});assert.equal(s.bank,5);assert.equal(card(s,1).tapped,false);
 s=act(s,{type:'relic',id:'trashpass',uid:2});assert.equal(s.bank,3);assert.equal(card(s,2).zone,'discard');assert.equal(s.cards.some(c=>c.kind==='residue'),false);
 s.bank=1;s.relicUsed={};assert.throws(()=>act(s,{type:'relic',id:'oldkey'}),/pointsCost/);
});
test('all added relics can appear in later drafts, without duplicates or already-owned relics',()=>{
 const seen=new Set();for(let seed=1;seed<=160;seed++){let s=newRun(seed);s.round=4;s.bank=50;s.phase='route';s.routeOffers=['tea','helper'];s=act(s,{type:'chooseRoute',id:'tea'});assert.equal(s.relicOffer.length,3);assert.equal(new Set(s.relicOffer).size,3);assert.ok(!s.relicOffer.includes('shaker'));s.relicOffer.forEach(id=>seen.add(id));}
 assert.equal(seen.size,21);
});
