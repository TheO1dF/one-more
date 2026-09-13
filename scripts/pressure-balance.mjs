import {newRun,act,score} from '../game/engine.js';
import {policy} from './balance.mjs';
import {mkdir,writeFile} from 'node:fs/promises';

export const DECKS={
 pairs:['rice','rice','fish','fish','mint','mint','wild','wild','dumpling','dumpling','torch','scope','tea','tea','paper','rust'],
 collection:['salad','salad','cake','cake','fridge','fish','fish','rice','rice','cola','cola','dumpling','wild','torch','paper','rust'],
 kitchen:['egg','egg','pear','pear','rice','rice','wild','wild','juicer','choppingboard','servingbell','glasscase','composter','torch','paper','rust']
};
export function stressDeck(seed,n,kind,window=Infinity,extraTrouble=false){
 let rng=seed>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const s=newRun(seed),template=s.cards[0],kinds=DECKS[kind];s.cards=[];s.uid=0;
 for(let i=0;i<n-1;i++){const k=extraTrouble&&i%6===0?'debt':kinds[i%kinds.length];s.cards.push({...structuredClone(template),uid:++s.uid,kind:k,original:k});}
 s.cards.push({...structuredClone(template),uid:++s.uid,kind:'bomb',original:'bomb'});
 s.draw=s.cards.filter(c=>c.kind!=='bomb').map(c=>c.uid);
 for(let i=s.draw.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[s.draw[i],s.draw[j]]=[s.draw[j],s.draw[i]];}
 s.draw.splice(1+Math.floor(random()*(Math.min(n,window)-1)),0,n);
 s.round=6;s.target=1000000;s.relics=[];s.relicUsed={shaker:true};return s;
}
const variants=[{id:'one-d20',dice:1},{id:'two-d20',dice:2},{id:'two-d20-deck-scale',dice:2,scale:true},{id:'two-d20-extra-debt',dice:2,trouble:true},{id:'two-d20-open-cut32',dice:2,window:32}];
export async function runPressure(samples=250){
 const rows=[],cache=new Map();
 for(const [deck]of Object.entries(DECKS))for(const n of [20,40,80,120,200])for(const variant of variants){
  let passed=0,burst=0,sum=0,flips=0;const peaks=[];
  for(let seed=1;seed<=samples;seed++){
   let s=stressDeck(seed,n,deck,variant.window,variant.trouble),peak=0,steps=0;
   let r=(seed^0xb5ad4ece)>>>0;const die=()=>{r=(r+0x6d2b79f5)>>>0;let t=r;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return 1+Math.floor(((t^(t>>>14))>>>0)/4294967296*20);};
   const target=(die()+(variant.dice===2?die():0))*(variant.scale?Math.ceil(n/20):1);
   const key=[deck,n,seed,variant.window,variant.trouble].join(':'),cached=cache.get(key);
   if(cached){peak=cached.peak;s.flips=cached.flips;}
   while(!cached&&s.phase==='play'&&steps++<500){const a=policy(s,{tools:true,greed:Infinity});s=act(s,a);if(s.phase==='play')peak=Math.max(peak,score(s));}
   if(!cached)cache.set(key,{peak,flips:s.flips});
   if(steps>=500)throw Error('Stress policy loop');
   passed+=peak>=target;burst+=peak>=100;sum+=peak;flips+=s.flips;peaks.push(peak);
  }
  peaks.sort((a,b)=>a-b);rows.push({deck,n,variant:variant.id,samples,canReachPct:+(passed/samples*100).toFixed(1),burst100Pct:+(burst/samples*100).toFixed(1),meanPeak:+(sum/samples).toFixed(1),p90:peaks[Math.floor(samples*.9)],meanReveals:+(flips/samples).toFixed(1)});console.log(JSON.stringify(rows.at(-1)));
 }
 await mkdir('.artifacts/balance-v070',{recursive:true});await writeFile('.artifacts/balance-v070/pressure.json',JSON.stringify({samples,rows,limitations:'Fixed archetypes, real scoring and pairing engine; limited heuristic tool policy. Peak score before bomb is an opportunity bound, not a player win rate. No hidden cards inspected by policy. No relic shuffle in this isolated table experiment. Deck-scaled targets and additional-debt variant are experimental, not shipped.'},null,2));
 console.table(rows.filter(r=>r.deck==='collection'));return rows;
}
if(process.argv[1]?.endsWith('pressure-balance.mjs'))await runPressure(Number(process.argv[2]||250));
