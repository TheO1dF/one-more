// Keep 20 slots and preserve the two growth cores plus their support card.
export function starterDeck(kinds,cards,difficulty=0,protectedKinds=[]){
 const result=[...kinds],protectedSet=new Set(protectedKinds);
 const replace=type=>{
  const candidates=result.map((k,i)=>({k,i,count:result.filter(x=>x===k).length})).filter(x=>cards[x.k].type===type&&!protectedSet.has(x.k));
  candidates.sort((a,b)=>(a.count===3?0:a.count===1?1:2)-(b.count===3?0:b.count===1?1:2)||result.indexOf(a.k)-result.indexOf(b.k)||b.i-a.i);
  if(candidates.length)result[candidates[0].i]='paper';
 };
 if(difficulty>=2)replace('food');
 if(difficulty>=3)replace('tool');
 return result;
}
