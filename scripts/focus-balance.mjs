import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {newRun,act,score,value,card} from '../game/engine.js';
import {GROWTH_ROUTES,GROWTH_CURVES,registerGrowthContent,growthRoute,growthBase} from '../game/growth-lab.js';
import {draftTargets} from '../game/draft-services.js';
import {tableGroups} from '../game/table-groups.js';
import {playerAction} from './table-planner.mjs';
registerGrowthContent(CARDS,RELICS,PACKAGES);
const runs=Number(process.argv[2]||20),out='.artifacts/focus-v1',rows=[];
await mkdir(out,{recursive:true});
const percentile=(xs,p)=>xs.length?[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)*p)]:null;
const summary=list=>({n:list.length,p50:percentile(list,.5),p90:percentile(list,.9)});
for(const route of Object.keys(GROWTH_ROUTES))for(const variant of ['steep-expand','gentle-expand','gentle-focus']){
 const results=[];
 for(let seed=1;seed<=runs;seed++){
  let s=newRun(seed*7919,{rules:2,growthRoute:route}),actions=0,metrics=[],tableActions=0,peak=0,visiblePeak=0,steps=0;
  while(!['won','lost'].includes(s.phase)&&steps++<1100){
   if(s.phase==='play'){
    peak=Math.max(peak,s.table.length);visiblePeak=Math.max(visiblePeak,tableGroups(s).visible.length);
    const a=playerAction(s,{depth:2,width:2,greed:0});
    if(a.type==='stop'){
     const positive=s.table.map(uid=>card(s,uid)).filter(c=>value(s,c)>0),total=positive.reduce((n,c)=>n+value(s,c),0),core=positive.filter(growthRoute).reduce((n,c)=>n+value(s,c),0);
     metrics.push({round:s.round,actions:tableActions+1,deck:s.cards.filter(c=>!c.temporary).length,tablePeak:peak,visiblePeak,score:score(s),coreShare:total?core/total:0});tableActions=0;peak=0;visiblePeak=0;
    }else tableActions++;
    s=act(s,a);actions++;
   }else if(s.phase==='midnight')s=act(s,{type:'acceptMidnight'});
   else if(s.phase==='stakes'){
    if(!s.dice.result)s=act(s,{type:'roll'});
    else{const old=s,target=s.target+GROWTH_CURVES.steep[s.round-1]*s.dice.result.total;s=act(s,{type:'acceptDice',boon:'scout'});if(variant==='steep-expand'){s.target=target;s.goalHistory.at(-1).target=target;}if(old.bank!==s.bank)throw Error('Dice changed bank');}
   }else if(s.phase==='route'){
    // Hold the service constant so the comparison concerns targets and reward strategy.
    s.routeOffers=['lantern','tea'];s=act(s,{type:'chooseRoute',id:'lantern'});
   }else if(s.phase==='draft'){
    if(!s.added){
     let a={type:'add',id:'growth-'+route};
     if(variant==='gentle-focus'&&s.round>=4){
      const preferred=draftTargets(s,'focus-upgrade').filter(c=>c.original===GROWTH_ROUTES[route].core).sort((a,b)=>a.uid-b.uid).slice(0,2).sort((a,b)=>growthBase(a)-growthBase(b));
      if(s.offers.includes('focus-upgrade')&&preferred.length)a={type:'add',id:'focus-upgrade',uid:preferred[0].uid};
      else if(s.offers.includes('focus-prune')){const target=draftTargets(s,'focus-prune').filter(c=>!growthRoute(c)).sort((a,b)=>(CARDS[b.original].type==='trouble')-(CARDS[a.original].type==='trouble'))[0];if(target)a={type:'add',id:'focus-prune',uid:target.uid};}
     }
     s=act(s,a);
    }else if(s.relicOffer.length&&!s.relicPicked)s=act(s,{type:'chooseRelic',id:s.relicOffer[0]});
    else s=act(s,{type:'next'});
   }else throw Error('Unhandled '+s.phase);
  }
  results.push({seed,phase:s.phase,round:s.round,reason:s.reason,actions,metrics,stalled:steps>=1100});
 }
 const late=results.flatMap(r=>r.metrics.filter(m=>m.round>=7)),row={route,variant,runs,clears:results.filter(r=>r.phase==='won').length,reached7:results.filter(r=>r.round>=7).length,stalls:results.filter(r=>r.stalled).length,lateActions:summary(late.map(m=>m.actions)),lateDeck:summary(late.map(m=>m.deck)),lateTable:summary(late.map(m=>m.tablePeak)),lateVisible:summary(late.map(m=>m.visiblePeak)),lateCoreShare:summary(late.map(m=>m.coreShare))};
 rows.push({...row,results});console.log(JSON.stringify(row));await writeFile(out+'/balance-progress.json',JSON.stringify(rows,null,2));
}
await writeFile(out+'/balance.json',JSON.stringify({method:'Fixed starting seeds, 6 routes, no rerolls, fixed lantern service. Visible-information beam search depth 2 width 2; it sees owned growth statistics but never hidden card identities in deck order. Baselines override only the target curve after the roll. Reward policy either expands or concentrates upgrades on two original cores. Reported actions are engine commands, not clicks or human completion times. Late metrics are conditional on reaching/clearing those tables, so inspect sample counts. A bounded heuristic, not optimal play or a prediction of human win rate.',rows},null,2));
