import {writeFile,mkdir} from 'node:fs/promises';
import {newRun,act,card} from '../game/engine.js';
import {BOMB_INTERVAL} from '../game/stakes.js';
const samples=100000,rows=[];
for(const interval of [10,15,20,25])for(const ordinary of [19,49,99,199]){
 const bombs=1+Math.floor(Math.max(0,ordinary-19)/interval);let safe10=0,safe20=0,x=0x946583;
 const rand=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
 for(let trial=0;trial<samples;trial++){
  let safe=1,remaining=ordinary+bombs-1;
  while(safe<20){if(rand()*remaining<bombs)break;remaining--;safe++;}
  safe10+=safe>=10;safe20+=safe>=20;
 }
 const exact=n=>{let p=1;for(let i=0;i<n-1;i++)p*=Math.max(0,ordinary-1-i)/(ordinary+bombs-1-i);return +(100*p).toFixed(2);};
 rows.push({interval,ordinary,bombs,total:ordinary+bombs,samples,safe10MC:+(safe10/samples*100).toFixed(2),safe10Exact:exact(10),safe20MC:+(safe20/samples*100).toFixed(2),safe20Exact:exact(20),expectedSafeReveals: +(1+(ordinary-1)/(bombs+1)).toFixed(2)});
}
let engineSafe10=0,engineFirstSafe=0;const engineSamples=10000;
for(let seed=1;seed<=engineSamples;seed++){
 let s=newRun(seed);while(s.cards.length<200){const c=structuredClone(s.cards[0]);c.uid=++s.uid;s.cards.push(c);}
 Object.assign(s,{phase:'draft',added:true,round:4,relicOffer:[],carry:null});s=act(s,{type:'next'});
 engineFirstSafe+=card(s,s.draw[0]).kind!=='bomb';engineSafe10+=s.draw.slice(0,10).every(uid=>card(s,uid).kind!=='bomb');
}
const engineCheck={interval:BOMB_INTERVAL,ordinary:199,samples:engineSamples,firstSafe:engineFirstSafe,safe10Pct:engineSafe10/engineSamples*100};
await mkdir('.artifacts/balance-v080',{recursive:true});await writeFile('.artifacts/balance-v080/risk.json',JSON.stringify({samplesPerScenario:samples,totalTrials:samples*rows.length,rows,engineCheck,notes:'Blind consecutive draws without replacement, first draw safe; no peeking, discarding, reshuffling or card effects. Exact finite-population survival provides an independent Monte Carlo cross-check.'},null,2));console.table(rows.filter(r=>r.ordinary===199));console.log(engineCheck);
