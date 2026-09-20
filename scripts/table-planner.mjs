import {growthRoute,growthBase} from '../game/growth-lab.js';
import {effectiveTarget} from '../game/dealer-events.js';
import {act,card,onTable,partners,pairKind,score,value,foods,payableFoods,paidFoods,troubles,tiredTools,transformableFoods,effectTargets,toolProblem,needsFoodCost} from '../game/engine.js';
import {CARDS,typeOf} from '../game/cards.js';

const net=s=>s.bank+score(s);
const unique=cards=>{const keys=new Set();return cards.filter(c=>{const k=JSON.stringify([c.kind,c.pairedOnce,!!c.pair,c.enchantment,c.bonus,c.tapped,c.keepOnce,c.boiledUsed,c.temporary,c.extraUses]);if(keys.has(k))return false;keys.add(k);return true;});};
const top=cards=>unique(cards).slice(0,6);
export function visibleState(s){
 const v=structuredClone(s);v.rng=0;v.seed=0;v.log=[];
 const known=new Set(v.known);
 for(const c of v.cards)if(c.zone==='deck'&&!known.has(c.uid)){c.kind='paper';if(!growthRoute(c))c.original='paper';}
 return v;
}
export function boardActions(s){
 if(s.pending?.type==='discover')return s.pending.offers.map(kind=>({type:'discover',kind}));
 if(s.pending?.type==='sift')return [false,...(card(s,s.pending.uid).kind==='bomb'?[]:[true])].map(discard=>({type:'resolveSift',discard}));
 const actions=[],table=onTable(s),keys=new Set();
 const add=(a,key=JSON.stringify(a))=>{if(!keys.has(key)){keys.add(key);actions.push(a);}};
 const singles=top(foods(s)),trouble=top(troubles(s));
 for(const c of unique(table))for(const p of top(partners(s,c.uid))){
  const k=pairKind(c,p),sig=[c,p].map(x=>JSON.stringify([x.kind,x.enchantment,x.bonus,x.temporary])).sort().join('/');
  let targets=k==='rice'?trouble:k==='mint'?top(tiredTools(s)):k==='toast'?top(paidFoods(s)):k==='cheese'?singles.filter(t=>t.uid!==c.uid&&t.uid!==p.uid):[];
  for(const t of [null,...targets])add({type:'pair',ids:[c.uid,p.uid],...(t?{target:t.uid}:{})},'pair'+sig+':'+t?.uid);
 }
 for(const c of unique(table.filter(c=>typeOf(c)==='tool'&&!toolProblem(s,c)))){
  let targets=CARDS[c.kind].target?top(effectTargets(s,c)):['jar','cloth'].includes(c.kind)?trouble:c.kind==='bell'?top(tiredTools(s,c.uid)):c.kind==='stove'?top(transformableFoods(s)):['juicer','mold'].includes(c.kind)?singles:[null];
  const costs=needsFoodCost(s,c)?top(payableFoods(s)):[null];
  for(const t of targets)for(const food of costs)add({type:'use',uid:c.uid,...(t?{target:t.uid}:{}),...(food?{food:food.uid}:{})});
 }
 for(const oil of trouble.filter(c=>c.kind==='oil'))for(const food of singles)add({type:'wipeOil',uid:oil.uid,food:food.uid});
 if(s.relics.includes('recycler')&&!s.relicUsed.recycler)for(const c of top(paidFoods(s)))add({type:'relic',id:'recycler',uid:c.uid});
 if(s.relics.includes('splitter')&&!s.relicUsed.splitter)for(const c of unique(table.filter(c=>c.pair)))add({type:'relic',id:'splitter',uid:c.uid});
 return actions;
}
function boardKey(s){
 const pairs=new Map();return JSON.stringify([s.bank,s.freePayments,s.extraFood,s.clearSight,s.toolScoring,s.known,s.pending,s.relicUsed,s.draw.length,s.cards.filter(c=>growthRoute(c)).map(c=>[c.uid,c.growthXP||0,c.growthLevel||0]),s.cards.filter(c=>c.zone!=='deck').map(c=>{
  if(c.pair&&!pairs.has(c.pair))pairs.set(c.pair,pairs.size+1);
  return [c.uid,c.kind,c.zone,pairs.get(c.pair)||0,c.pairedOnce,c.pairedAs,c.tapped,c.bonus,c.melt,c.keepOnce,c.extraUses,c.boiledUsed,c.paid,c.consumed,c.temporary];
 })]);
}
function utility(s){
 const ready=onTable(s).filter(c=>typeOf(c)==='tool'&&!toolProblem(s,c)).length;
 let visible=0;for(const id of s.draw.slice(0,3)){if(!s.known.includes(id))break;visible++;}
 const growth=s.cards.filter(c=>!c.temporary&&growthRoute(c)).reduce((n,c)=>n+growthBase(c)*.04+(c.growthXP||0)/growthRoute(c).every*.2,0);
 return net(s)+growth+Math.min(3,s.freePayments)*.18+Math.min(6,ready)*.32+visible*.8+(s.pending?.type==='discover'?1.5:0);
}
export function planBoard(s,{depth=3,width=4}={}){
 const root=visibleState(s),base=utility(root),seen=new Set([boardKey(root)]);let best={rank:base,first:null,net:net(root)},beam=[{s:root,first:null}];
 for(let d=0;d<depth;d++){
  const next=[];
  for(const node of beam){
   if(node.s.pending&&!root.pending)continue;
   for(const a of boardActions(node.s)){
    let child;try{child=act(node.s,a);}catch{continue;}
    const key=boardKey(child);if(seen.has(key))continue;seen.add(key);
    const rank=utility(child)-d*.005,item={s:child,first:node.first||a,rank,net:net(child)};
    if(rank>best.rank+.001)best=item;next.push(item);
   }
  }
  next.sort((a,b)=>b.rank-a.rank);beam=next.slice(0,width);if(!beam.length)break;
 }
 return {action:best.first,net:best.net,gain:best.rank-base,nodes:seen.size};
}
export function playerAction(s,{depth=3,width=4,greed=0}={}){
 if(s.pending){const result=planBoard(s,{depth,width});return result.action||boardActions(s)[0];}
 const p=planBoard(s,{depth,width});
 if(p.action)return p.action;
 const qualified=s.flips&&net(s)>=effectiveTarget(s);
 const next=s.known.includes(s.draw[0])?card(s,s.draw[0]):null;
 if(qualified&&next&&next.kind!=='bomb'&&net(act(s,{type:'draw'}))>=net(s))return {type:'draw'};
 if(qualified&&(net(s)>=effectiveTarget(s)+greed||next?.kind==='bomb'))return {type:'stop'};
 if(next?.kind==='bomb'&&s.relics.includes('shaker')&&!s.relicUsed.shaker)return {type:'relic',id:'shaker'};
 return {type:'draw'};
}
