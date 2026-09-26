import {icon} from './cards.js';
// New runs opt in; in-progress saves retain their original stakes and protection.
export const ONBOARDING_RULES=2;
export const usesNewStakes=s=>s?.stakesVersion===ONBOARDING_RULES;
export const protectionAvailable=s=>usesNewStakes(s)&&s.difficulty<2&&s.protectionLeft===1;
export function validProtection(s){
 if(s.stakesVersion==null)return s.protectionLeft==null&&s.beginnerRescue==null;
 if(!usesNewStakes(s)||s.rules!==2||s.growth||![0,1].includes(s.protectionLeft)||s.difficulty>=2&&s.protectionLeft!==0)return false;
 const r=s.beginnerRescue;
 return r==null||s.protectionLeft===0&&r.round===s.round&&Number.isInteger(r.uid)&&s.draw.includes(r.uid)&&s.cards.some(c=>c.uid===r.uid&&c.kind==='bomb');
}
export const protectionIcon=()=>icon('relic-pangift');
export function protectionText(s,lang='zh'){
 const left=protectionAvailable(s);
 return lang==='en'?(left?'Pan will stop one bomb this run and shuffle it back. The glass does not refill at the next table.':'Pan has spent his free rescue. Changing tables will not restore it; starting a new run will.'):(left?'潘神每局替你拦一次炸弹，再洗回牌堆。换桌不会补回酒杯。':'潘神本局的援手已用完。换桌不会恢复；重新开局才补回。');
}
export function protectionHTML(s,lang='zh'){
 if(!usesNewStakes(s)||s.difficulty>=2||Number.isInteger(s.lesson)&&s.lesson<7&&!s.tutorialRetry)return '';
 const left=protectionAvailable(s),en=lang==='en';
 return `<button data-action="protection" class="run-protection relic-token ${left?'ready':'spent'}" data-tooltip="${en?'Pan’s glass · ':'潘神酒杯 · '}${protectionText(s,lang)}" aria-label="${en?'Pan’s glass. ':'潘神酒杯。'}${protectionText(s,lang)}">${protectionIcon()}<small class="relic-charge">${left?'1':'—'}</small></button>`;
}
