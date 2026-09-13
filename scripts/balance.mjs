import { newRun, act, onTable, partners, pairKind, score, foods, troubles, tiredTools, paidFoods, toolProblem, card } from '../game/engine.js';
import { CARDS, PACKAGES, typeOf } from '../game/cards.js';
import { mkdir, writeFile } from 'node:fs/promises';
export function policy(s, {tools=true, greed=0, reroll=true}={}) {
 if(s.phase==='stakes'){
  if(!s.dice.result)return {type:'roll'};
  const d=s.dice.result;
  if(reroll&&!d.locked&&s.dice.rolls.length===1&&d.total>=10&&d.total<15)return {type:'roll'};
  return {type:'acceptDice',boon:'sauce'};
 }
 if(s.phase==='draft'){
  if(!s.added){const p=s.offers.map(id=>PACKAGES.find(p=>p.id===id)).sort((a,b)=>b.cards.filter(k=>CARDS[k].type==='food').length-a.cards.filter(k=>CARDS[k].type==='food').length)[0];return {type:'add',id:p.id};}
  if(!s.removed){const priorities=['debt','oil','noise','rust','fog','paper'];const c=priorities.map(k=>s.cards.find(c=>!c.temporary&&c.original===k)).find(Boolean);if(c)return {type:'remove',uid:c.uid};}
  if(s.relicOffer.length&&!s.relicPicked)return {type:'chooseRelic',id:'recycler'};
  return {type:'next'};
 }
 if(s.phase!=='play')return null;
 for(const c of onTable(s)){
  const p=partners(s,c.uid)[0];if(!p)continue;const k=pairKind(c,p);
  const target=k==='rice'?troubles(s).sort((a,b)=>(a.kind==='debt'?-1:0)-(b.kind==='debt'?-1:0))[0]?.uid:k==='mint'?tiredTools(s)[0]?.uid:k==='toast'?paidFoods(s)[0]?.uid:undefined;
  return {type:'pair',ids:[c.uid,p.uid],target};
 }
 const qualified=s.flips&&s.bank+score(s)>=s.target;
 const nextKnown=s.known.includes(s.draw[0])?card(s,s.draw[0]):null;
 if(qualified&&(s.bank+score(s)>=s.target+greed||nextKnown?.kind==='bomb'))return {type:'stop'};
 if(tools){
  if(nextKnown?.kind==='bomb'&&!s.relicUsed.shaker)return {type:'relic',id:'shaker'};
  const food=foods(s)[0]?.uid;
  if(troubles(s).some(c=>c.kind==='oil')&&food)return {type:'wipeOil',uid:troubles(s).find(c=>c.kind==='oil').uid,food};
  if(s.relics.includes('recycler')&&!s.relicUsed.recycler&&paidFoods(s).length)return {type:'relic',id:'recycler',uid:paidFoods(s)[0].uid};
  for(const k of ['torch','jar','cloth','scope','bell']){
   const c=onTable(s).find(c=>c.kind===k&&!toolProblem(s,c));if(!c)continue;
   if(k==='torch'&&nextKnown)continue;
   if(k==='scope'&&s.draw.slice(0,3).every(id=>s.known.includes(id)))continue;
   if(k==='cloth'&&!troubles(s).some(t=>['debt','noise','fog'].includes(t.kind)))continue;
   const target=['jar','cloth'].includes(k)?troubles(s)[0]?.uid:k==='bell'?tiredTools(s,c.uid).find(t=>t.kind==='torch'||t.kind==='jar'||t.kind==='scope')?.uid:undefined;
   if(['jar','cloth','bell'].includes(k)&&!target)continue;
   return {type:'use',uid:c.uid,food,target};
  }
 }
 return {type:'draw'};
}
export function simulate(seed, options={}) {
 let s=newRun(seed), steps=0;const seen=[];
 while(!['won','lost'].includes(s.phase)&&steps++<300){const a=policy(s,options);const before=s;s=act(s,a);if(a.type==='next')seen.push({table:s.round,die:before.dice.result.total,bank:s.bank,target:s.target});}
 if(steps>=300)throw Error('policy loop '+seed);
 return {s,steps,seen};
}
export async function runBalance(n=2000){
 const results=[];
 for(const options of [{name:'pairs-only',tools:false,greed:0},{name:'tools',tools:true,greed:0},{name:'greedy+2',tools:true,greed:2}]){
  const r={strategy:options.name,runs:n,wins:0,reached:[0,0,0,0,0],died:[0,0,0,0,0],dice:Object.fromEntries(Array.from({length:20},(_,i)=>[i+1,{nextTables:0,passed:0}]))};
  for(let seed=1;seed<=n;seed++){
   const {s,seen}=simulate(seed,options);if(s.phase==='won')r.wins++;for(let i=0;i<s.round;i++)r.reached[i]++;if(s.reason==='bomb')r.died[s.round-1]++;
   for(const d of seen){r.dice[d.die].nextTables++;if(s.round>d.table||s.phase==='won')r.dice[d.die].passed++;}
  }
  r.winRate=+(r.wins/n*100).toFixed(2);results.push(r);console.log(options.name,r.winRate+'%',r.reached);
 }
 await mkdir('.artifacts/balance-v030',{recursive:true});await writeFile('.artifacts/balance-v030/report.json',JSON.stringify({unit:1,pair:[2,2],die:'d20',initialTarget:3,results,notes:'Deterministic heuristic policies. Decisions never inspect hidden cards. These are regression/balance probes, not human win-rate estimates.'},null,2));
 return results;
}
if(process.argv[1]?.endsWith('balance.mjs'))await runBalance(Number(process.argv[2]||2000));
