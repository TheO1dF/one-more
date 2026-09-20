import {mkdir,writeFile} from 'node:fs/promises';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {GROWTH_ROUTES,growthDeck,registerGrowthContent} from '../game/growth-lab.js';
import {newRun,act,score} from '../game/engine.js';
import {starterDeck} from '../game/starter.js';
import {playerAction} from './table-planner.mjs';
registerGrowthContent(CARDS,RELICS,PACKAGES);
const old=['rice','rice','rice','fish','fish','fish','mint','mint','tea','tea','toast','toast','wild','wild','torch','torch','scope','bell','candle','bomb'];
const variants=[['previous',null],['late-shift-food-cut',2],['last-call-food-and-tool-cut',3]];
const routes=[null,...Object.keys(GROWTH_ROUTES)],results=[];
const quantile=(xs,q)=>[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)*q)]||0;
for(const route of routes)for(const [variant,level]of variants){
 const n=route?48:200,rows=[],r=GROWTH_ROUTES[route];
 const kinds=level==null?(route?growthDeck(route):old):starterDeck(route?growthDeck(route):old,CARDS,level,r?[r.core,r.support]:[]);
 for(let seed=1;seed<=n;seed++){
  let s=newRun(seed,{rules:2,growthRoute:route,growthCurve:'classic'}),steps=0,startBank=0,incomes=[];
  s.cards.forEach((c,i)=>c.original=c.kind=kinds[i]);
  while(steps++<350){
   if(s.phase==='play'){
    const a=playerAction(s,{depth:3,width:4,greed:Math.max(0,startBank+33-s.target)});s=act(s,a);
    if(a.type==='stop'){incomes.push(s.roundEarned);if(s.round===2)break;}
   }else if(s.phase==='lost'||s.phase==='won')break;
   else if(s.phase==='stakes')s=act(s,s.dice.result?{type:'acceptDice',boon:'sauce'}:{type:'roll'});
   else if(s.phase==='route'){s.routeOffers=['lantern','tea'];s=act(s,{type:'chooseRoute',id:'lantern'});}
   else if(s.phase==='draft'){
    if(!s.added){const offers=s.offers.map(id=>PACKAGES.find(p=>p.id===id));const p=route?offers.find(p=>p.id==='growth-'+route):offers.sort((a,b)=>b.cards.filter(k=>CARDS[k].type==='food').length-a.cards.filter(k=>CARDS[k].type==='food').length)[0];s=act(s,{type:'add',id:p.id});}
    else if(s.relicOffer.length&&!s.relicPicked)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});
    else {s=act(s,{type:'next'});startBank=s.bank;}
   }else throw Error(s.phase);
  }
  if(steps>=350)throw Error('Planner stuck '+route+' '+variant+' '+seed);
  rows.push({incomes,cleared:incomes.length===2&&s.phase!=='lost',bank:s.bank,reason:s.reason});
 }
 const cleared=rows.filter(x=>x.cleared),first=rows.filter(x=>x.incomes.length).map(x=>x.incomes[0]);
 const row={route:route||'standard',variant,runs:n,composition:Object.fromEntries(['food','tool','device','trouble','bomb'].map(t=>[t,kinds.filter(k=>CARDS[k].type===t).length])),firstClearPct:100*first.length/n,firstAtLeast33Pct:100*first.filter(x=>x>=33).length/n,twoClearPct:100*cleared.length/n,bothAtLeast33Pct:100*cleared.filter(x=>x.incomes.every(n=>n>=33)).length/n,firstMedianAmongSurvivors:quantile(first,.5),firstP90AmongSurvivors:quantile(first,.9),secondBankMedianAmongSurvivors:quantile(cleared.map(x=>x.bank),.5)};
 results.push(row);console.log(JSON.stringify(row));
}
await mkdir('.artifacts/dealer-events-v2',{recursive:true});await writeFile('.artifacts/dealer-events-v2/balance.json',JSON.stringify({method:'Matched seeds; two-table runs; visible-information beam planner depth 3 width 4; targets 33 earned per table but cashes out before known bombs. Same die curve, no difficulty raise, fixed lantern event and own-route packages to isolate starter composition. Not optimal play or human win rates. Each growth cell has only 48 runs; estimates are directional.',totalRuns:results.reduce((n,r)=>n+r.runs,0),results},null,2));
