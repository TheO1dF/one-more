// Presentation groups only. Card identity, rules and targets stay independent.
export function pairUnits(cards){
 const groups=new Map();
 for(const c of cards)if(c.pair){const g=groups.get(c.pair)||[];g.push(c);groups.set(c.pair,g);}
 const seen=new Set(),units=[];
 for(const c of cards){
  if(seen.has(c.uid))continue;
  const group=c.pair&&groups.get(c.pair)?.length===2?groups.get(c.pair):[c];
  group.forEach(x=>seen.add(x.uid));
  units.push({uid:c.uid,ids:group.map(x=>x.uid),pair:group.length===2?c.pair:null,tapped:group.length===1&&c.tapped});
 }
 return units;
}
