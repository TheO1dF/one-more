import {newRun,act,score} from '../game/engine.js';
import {policy} from './balance.mjs';
import {playerAction} from './table-planner.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';

export const ARCHETYPES={
 pairs:['rice','rice','fish','fish','mint','mint','wild','wild','dumpling','dumpling','torch','scope','tea','tea','paper','rust'],
 collection:['salad','salad','cake','cake','fridge','fish','fish','rice','rice','cola','cola','dumpling','wild','torch','paper','rust'],
 kitchen:['egg','egg','pear','pear','rice','rice','wild','mint','juicer','scoop','grill','steamer','choppingboard','servingbell','glasscase','composter','paper','rust'],
};
const rngFor=seed=>{let x=seed>>>0;return()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
export const expectedBombs=(ordinary,interval)=>1+Math.floor(Math.max(0,ordinary-19)/interval);
export function scenario(seed,ordinary,archetype,interval){
 const s=newRun(seed),template=s.cards[0],kinds=ARCHETYPES[archetype],random=rngFor(seed^0x393fa521),bombs=expectedBombs(ordinary,interval);
 s.cards=[];s.draw=[];s.uid=0;
 for(let i=0;i<ordinary+bombs;i++){const k=i<ordinary?kinds[i%kinds.length]:'bomb';s.cards.push({...structuredClone(template),uid:++s.uid,kind:k,original:k});s.draw.push(s.uid);}
 for(let i=s.draw.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[s.draw[i],s.draw[j]]=[s.draw[j],s.draw[i]];}
 if(s.draw[0]>ordinary){const safe=s.draw.map((uid,index)=>({uid,index})).filter(x=>x.uid<=ordinary),j=safe[Math.floor(random()*safe.length)].index;[s.draw[0],s.draw[j]]=[s.draw[j],s.draw[0]];}
 const dice=rngFor(seed^0x875deb);
 s.round=6;s.bank=30;s.target=30+2+Math.floor(dice()*20)+Math.floor(dice()*20);s.midnight=false;
 return s;
}
function ci(w,n){const z=1.96,p=w/n,a=z*z/n,c=(p+a/2)/(1+a),d=z*Math.sqrt(p*(1-p)/n+a/(4*n))/(1+a);return [+(100*(c-d)).toFixed(1),+(100*(c+d)).toFixed(1)];}
export async function run(samples=100,intervals=[10,15,20,25],strategies=['greedy','planner']){
 const rows=[],start=performance.now();
 for(const interval of intervals)for(const archetype of Object.keys(ARCHETYPES))for(const ordinary of [19,49,99,199])for(const strategy of strategies){
  let passed=0,bombs=0,total=0,draws=0,steps=0,censored=0;const earned=[];
  for(let seed=1;seed<=samples;seed++){
   let s=scenario(seed,ordinary,archetype,interval),n=0;
   while(s.phase==='play'&&n++<160){const a=strategy==='greedy'?policy(s,{tools:true}):playerAction(s,{depth:strategy==='deep'?5:3,width:strategy==='deep'?6:3});s=act(s,a);}
   if(n>=160&&s.phase==='play'){censored++;continue;}
   passed+=s.phase!=='lost';bombs+=s.reason==='bomb';total+=s.bank;draws+=s.flips;steps+=n;
   if(s.phase!=='lost')earned.push(s.bank-30);
  }
  earned.sort((a,b)=>a-b);const effective=samples-censored;
  const row={interval,archetype,ordinary,bombs:expectedBombs(ordinary,interval),strategy,samples,censored,passed,passPct:+(passed/effective*100).toFixed(1),ci95:ci(passed,effective),meanDraws:+(draws/effective).toFixed(2),meanSteps:+(steps/effective).toFixed(1),meanBank:+(total/effective).toFixed(2),p90Earned:earned[Math.floor(earned.length*.9)]??null};rows.push(row);console.log(JSON.stringify(row));
  await mkdir('.artifacts/balance-v080',{recursive:true});await writeFile(`.artifacts/balance-v080/results-${intervals.join('-')}-${strategies.join('-')}.json`,JSON.stringify({samples,elapsedSeconds:(performance.now()-start)/1000,rows},null,2));
 }
 return rows;
}
if(process.argv[1]?.endsWith('bomb-balance.mjs'))await run(Number(process.argv[2]||100),process.argv[3]?process.argv[3].split(',').map(Number):undefined,process.argv[4]?process.argv[4].split(','):undefined);
