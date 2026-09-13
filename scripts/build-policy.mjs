import {PACKAGES,CARDS} from '../game/cards.js';
import {routeTargets} from '../game/engine.js';
import {ROUTES} from '../game/routes.js';
import {policy} from './balance.mjs';
const troubleValue={paper:0,rust:-6,oil:-7,noise:-6,wrap:-5,debt:-4,cold:-6,flies:-4,grease:-3,fog:-3,clutter:-3};
function deckValue(kinds){
 const counts={};for(const k of kinds)counts[k]=(counts[k]||0)+1;
 const n=kinds.length,foods=kinds.filter(k=>CARDS[k].type==='food'),pairable=foods.filter(k=>!CARDS[k].noPair),peek=(counts.torch||0)+(counts.scope||0)+(counts.candle||0)+(counts.fish||0)/2;
 let v=foods.length*2+(pairable.length/n)*8+Math.min(4,peek)*3;
 for(const [k,count]of Object.entries(counts)){
  if(CARDS[k].type==='trouble')v+=(troubleValue[k]??-2)*count;
  if(CARDS[k].type==='food'&&!CARDS[k].noPair)v+=Math.floor(count/2)*3;
 }
 v+=(counts.wild||0)*3+(counts.dumpling||0)*2+(counts.marshmallow===1?3:0);
 v+=(counts.cake||0)*pairable.length*.35+(counts.salad||0)*new Set(foods).size*.4+(counts.fridge||0)*(counts.fish||0)*.5;
 const consume=(counts.juicer||0)+(counts.grill||0)+(counts.cleaver||0),supply=(counts.egg||0)+(counts.scoop||0)+(counts.mint||0)+(counts.chili||0);
 v+=Math.min(consume,supply)*3+Math.min(consume,(counts.choppingboard||0)+(counts.servingbell||0)+(counts.composter||0))*3;
 v+=Math.min(counts.jar||0,kinds.filter(k=>CARDS[k].type==='trouble').length)*3;
 return v;
}
export function buildPolicy(s,interval){
 const kinds=s.cards.filter(c=>!c.temporary&&c.original!=='bomb').map(c=>c.original),bombs=s.cards.filter(c=>c.original==='bomb').length;
 if(s.phase==='draft'&&!s.added){
  const packages=s.offers.map(id=>PACKAGES.find(p=>p.id===id));
  const grade=p=>deckValue([...kinds,...p.cards])-deckValue(kinds)-Math.max(0,1+Math.floor(Math.max(0,kinds.length+p.cards.length-19)/interval)-bombs)*8;
  packages.sort((a,b)=>grade(b)-grade(a));return {type:'add',id:packages[0].id};
 }
 if(s.phase==='route'){
  const pruneStopsBomb=Math.floor(Math.max(0,kinds.length-19)/interval)>Math.floor(Math.max(0,kinds.length-20)/interval);
  const rank=['lantern','raw','helper','tea','fried','boiled','prune'];if(pruneStopsBomb)rank.unshift('prune');
  const id=[...s.routeOffers].sort((a,b)=>rank.indexOf(a)-rank.indexOf(b))[0];
  if(ROUTES[id].type==='event')return {type:'chooseRoute',id};
  const targets=routeTargets(s,id);targets.sort((a,b)=>id==='prune'?(troubleValue[a.original]??1)-(troubleValue[b.original]??1):(b.kind==='wild'?1:0)-(a.kind==='wild'?1:0));
  return {type:'chooseRoute',id,uid:targets[0].uid};
 }
 return policy(s,{tools:true});
}
