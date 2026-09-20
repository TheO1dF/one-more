import {newRun,act,score} from '../game/engine.js';
import {policy} from './balance.mjs';
import {playerAction} from './table-planner.mjs';
import {scenario} from './bomb-balance.mjs';
import {nextTarget} from '../game/pacing.js';
import {mkdir,writeFile} from 'node:fs/promises';
const variants={legacy:(s,d)=>s.target+d,floor:nextTarget,rebase:(s,d)=>Math.max(s.target,s.bank)+d};
const samples=Number(process.argv[2]||120),rows=[];
for(const [variant,target] of Object.entries(variants)){
 let wins=0,reached=Array(10).fill(0),trivial=0,tables=0;
 for(let seed=1;seed<=samples*3;seed++){
  let s=newRun(seed),steps=0;
  while(!['won','lost'].includes(s.phase)&&steps++<1000){
   const a=policy(s,{tools:true,greed:4}),before=s;s=act(s,a);
   if(a.type==='acceptDice')s.target=target(before,before.dice.result.total);
   if(a.type==='next'){tables++;trivial+=s.target<=s.bank+2;}
  }
  if(steps>=1000)throw Error('Full-run policy limit');
  wins+=s.phase==='won';for(let i=0;i<s.round;i++)reached[i]++;
 }
 rows.push({variant,mode:'full-run-heuristic',samples:samples*3,wins,reached,trivial,tables});console.log(JSON.stringify(rows.at(-1)));
 for(const ordinary of [49,99,199])for(const archetype of ['pairs','collection','kitchen']){
  let passed=0,draws=0,censored=0;
  for(let seed=1;seed<=samples;seed++){
   let s=scenario(seed,ordinary,archetype,20);s.bank=200;
   s.target=target({...s,round:5,target:150},21);let steps=0;
   while(s.phase==='play'&&steps++<160)s=act(s,playerAction(s,{depth:3,width:3}));
   censored+=s.phase==='play';passed+=s.phase!=='lost'&&s.phase!=='play';draws+=s.flips;
  }
  rows.push({variant,mode:'large-deck-planner',ordinary,archetype,samples,passed,censored,meanDraws:+(draws/samples).toFixed(2)});console.log(JSON.stringify(rows.at(-1)));
 }
}
await mkdir('.artifacts/pacing-v090',{recursive:true});
await writeFile('.artifacts/pacing-v090/report.json',JSON.stringify({rows,limitations:'Paired seeds, actual engine. Full runs use a heuristic; large decks use depth-3 width-3 visible-information beam search (no hidden deck identities). Bank=200 versus legacy target=150 is an explicit early-score windfall stress case. Fixed deck archetypes are not optimal humans. Censored episodes are reported, not wins.'},null,2));
