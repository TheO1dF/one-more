// Production boundary for optional playtest imports. No test content or storage access.
export const GROWTH_AVAILABLE=false,GROWTH_LAB=false,GROWTH_LIMIT=0;
export const GROWTH_ROUTES={},GROWTH_CARDS={},GROWTH_RELICS={},GROWTH_PACKAGES=[];
export const DRAFT_SERVICES={};
export const growthRoute=()=>undefined;
export const growthBase=()=>2;
export const growthCap=()=>0;
export const growthCurve=()=>Array(9).fill(1);
export const growthRaise=(_state,roll)=>roll;
export const growthProgress=()=>'';
export const growthMenu=()=>'';
export const growthJournal=()=>'';
export const growthIcon=()=>null;
export const growthStorage=storage=>storage;
export const registerGrowthContent=()=>{};
export const recordGrowth=()=>{};
export const validGrowth=state=>!state.growth;
export const draftTargets=()=>[];
export const packageById=(id,packages)=>packages.find(p=>p.id===id);
export function growthDeck(){throw Error('Playtest content is not included in this release');}
