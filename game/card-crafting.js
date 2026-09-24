export const pressWeight=c=>c.pressWeight||1;
export const pressCandidates=(s,defs,main=null)=>s.cards.filter(c=>!c.temporary&&defs[c.original]?.type==='food'&&c.zone!=='stored'&&c.zone!=='parcel'&&(!main||c.uid!==main.uid&&c.original===main.original));
export const pressedWeight=(a,b,upgraded=false)=>(pressWeight(a)+pressWeight(b))*(upgraded?2:1.5);
export const validPressWeight=n=>Number.isFinite(n)&&n>=1&&n<=Number.MAX_SAFE_INTEGER;
export const parcelFoods=(s,defs)=>s.cards.filter(c=>c.zone==='table'&&!c.temporary&&!c.pair&&!c.sealedBy&&defs[c.kind]?.type==='food'&&defs[c.original]?.type==='food');
export const parcelTools=(s,defs,source)=>s.cards.filter(c=>c.zone==='table'&&!c.temporary&&c.tapped&&!c.sealedBy&&c.uid!==source&&defs[c.kind]?.type==='tool'&&defs[c.original]?.type==='tool');
export function sealParcel(s,food,tool,{unfasten,log}){
 for(const c of [food,tool]){
  unfasten(s,c.uid);
  for(const zone of ['table','draw','discard','known'])s[zone]=s[zone].filter(uid=>uid!==c.uid);
  c.zone='parcel';c.pair=null;c.sealedBy=null;
 }
 s.sealedParcel={round:s.round+1,uids:[food.uid,tool.uid]};s.parcelUsedRound=s.round;
 log(s,'sealParcel',{uids:[food.uid,tool.uid]});
}
export function validCrafting(s,defs){
 if(s.cards.some(c=>c.pressWeight!=null&&(!validPressWeight(c.pressWeight)||defs[c.original]?.type!=='food')))return false;
 const p=s.sealedParcel;
 if(p&&(p.round!==s.round+1||!Array.isArray(p.uids)||p.uids.length!==2||new Set(p.uids).size!==2||p.uids.some((uid,i)=>{const c=s.cards.find(c=>c.uid===uid);return !c||c.temporary||c.zone!=='parcel'||defs[c.original]?.type!==(i?'tool':'food')||[...s.table,...s.draw,...s.discard].includes(uid);})))return false;
 return !s.cards.some(c=>c.zone==='parcel'&&!p?.uids.includes(c.uid));
}
