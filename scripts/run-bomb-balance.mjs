import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {policy} from './balance.mjs';
import {playerAction} from './table-planner.mjs';
import {buildPolicy} from './build-policy.mjs';

async function variant(interval){
 const stakes=(await readFile('game/stakes.js','utf8')).replace(/BOMB_INTERVAL=\d+/,`BOMB_INTERVAL=${interval}`);
 const uri='data:text/javascript;base64,'+Buffer.from(stakes).toString('base64');
 const engine=(await readFile('game/engine.js','utf8')).replace(/from '\.\/([^']+)'/g,(_,name)=>`from '${name==='stakes.js'?uri:pathToFileURL(resolve('game',name)).href}'`);
 return import('data:text/javascript;base64,'+Buffer.from(engine).toString('base64'));
}
const n=Number(process.argv[2]||500),intervals=(process.argv[3]||'10,15,20,25').split(',').map(Number),strategies=(process.argv[4]||'greedy,planner').split(',');
const rows=[];await mkdir('.artifacts/balance-v080',{recursive:true});
for(const interval of intervals){
 const e=await variant(interval);
 for(const strategy of strategies){
  let wins=0,censored=0;const reached=Array(10).fill(0),bombDeaths=Array(10).fill(0),scores=[],decks=[];
  for(let seed=1;seed<=n;seed++){
   let s=e.newRun(seed),steps=0;
   while(!['won','lost'].includes(s.phase)&&steps++<1500){
    const strong=['deep','builder'].includes(strategy);
    const a=s.phase==='play'&&strategy!=='greedy'?playerAction(s,{depth:strong?5:3,width:strong?6:3}):strategy==='builder'?buildPolicy(s,interval):policy(s,{tools:true});
    s=e.act(s,a);
   }
   if(!['won','lost'].includes(s.phase)){censored++;continue;}
   wins+=s.phase==='won';for(let i=0;i<s.round;i++)reached[i]++;if(s.reason==='bomb')bombDeaths[s.round-1]++;
   if(s.phase==='won'){scores.push(s.bank-s.target);decks.push(s.cards.filter(c=>!c.temporary).length);}
  }
  const row={interval,strategy,samples:n,wins,winPct:+(100*wins/n).toFixed(1),censored,reached,bombDeaths,meanSurplusAtWin:scores.length?+(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2):null,meanFinalDeck:decks.length?+(decks.reduce((a,b)=>a+b,0)/decks.length).toFixed(2):null};rows.push(row);console.log(JSON.stringify(row));
  await writeFile(`.artifacts/balance-v080/full-${intervals.join('-')}-${strategies.join('-')}.json`,JSON.stringify({samples:n,rows,notes:'Ten-table actual engine variants differ only in BOMB_INTERVAL. Same seeds per variant. Policy knows only current observations, not RNG or unseen draw order. Fixed heuristic draft/route choices, limited-width board search; not a human win rate or proven optimum.'},null,2));
 }
}
