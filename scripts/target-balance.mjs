import {simulate} from './balance.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const n=2000,results=[];
for(const target of [3,6,8]){
 let first=0,wins=0;
 for(let seed=1;seed<=n;seed++){const {s}=simulate(seed,{target,tools:true});if(s.round>1)first++;if(s.phase==='won')wins++;}
 const row={target,runs:n,first,wins,firstPassRate:first/n,winRate:wins/n};results.push(row);console.log(row);
}
await mkdir('.artifacts/balance-v044',{recursive:true});await writeFile('.artifacts/balance-v044/targets.json',JSON.stringify({unit:2,foods:14,maxRounds:10,policy:'Same deterministic tools policy at targets 3, 6 and 8; v0.4.4 cards, mandatory packages and paths; seeds 1–2000. Not human win rates.',results},null,2));
