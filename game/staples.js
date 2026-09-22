export const STAPLE_COST=4;
export const STAPLE_SIZE=3;

export function stapleCandidates(s){
 const bound=new Set((s.staples||[]).flatMap(b=>b.uids));
 return s.cards.filter(c=>!c.temporary&&c.original!=='bomb'&&c.kind!=='bomb'&&c.uid!==s.carry&&!bound.has(c.uid));
}
export function stapleFor(s,uid){return (s.staples||[]).find(b=>b.uids.includes(uid));}
export function closedStaple(s,uid){
 const b=stapleFor(s,uid);
 return b&&b.openedRound!==s.round&&b.readyRound<=s.round&&b.uids.every(id=>s.draw.includes(id))?b:null;
}
export function drawUnits(s){
 if(!s.staples?.length)return s.draw.map(uid=>[uid]);
 const units=[],seen=new Set();
 for(const uid of s.draw){
  if(seen.has(uid))continue;
  const ids=closedStaple(s,uid)?.uids||[uid];ids.forEach(id=>seen.add(id));units.push([...ids]);
 }
 return units;
}
export function tidyStaples(s){
 if(!s.staples)return;
 const live=new Set(s.cards.filter(c=>!c.temporary&&c.original!=='bomb').map(c=>c.uid));
 s.staples=s.staples.map(b=>({...b,uids:b.uids.filter(uid=>live.has(uid))})).filter(b=>b.uids.length>=2);
}
export function unfasten(s,uid){
 const b=stapleFor(s,uid);if(!b||b.openedRound===s.round)return null;if(b.permanent)b.openedRound=s.round;else s.staples=s.staples.filter(x=>x.id!==b.id);return b;
}
export function validStaples(s){
 if(s.staples==null)return true;
 if((!s.growth&&s.rules!==2)||!Array.isArray(s.staples)||!Number.isSafeInteger(s.stapleId)||s.stapleId<0)return false;
 const seen=new Set(),groups=new Set();
 for(const b of s.staples){
  if(!Number.isSafeInteger(b.id)||b.id<1||b.id>s.stapleId||groups.has(b.id)||!Number.isInteger(b.readyRound)||b.readyRound<1||b.readyRound>s.round+1||!Array.isArray(b.uids)||b.uids.length<2||b.uids.length>STAPLE_SIZE)return false;
  groups.add(b.id);
  for(const uid of b.uids){const c=s.cards.find(c=>c.uid===uid);if(seen.has(uid)||!c||c.temporary||c.original==='bomb'||c.kind==='bomb')return false;seen.add(uid);}
  if(b.permanent!=null&&b.permanent!==true||b.openedRound!=null&&(!b.permanent||b.openedRound!==s.round))return false;
  if(['play','lost','won'].includes(s.phase)&&b.readyRound<=s.round&&b.openedRound!==s.round){const at=s.draw.indexOf(b.uids[0]);if(at<0||b.uids.some((uid,i)=>s.draw[at+i]!==uid))return false;}
 }
 return true;
}
