import {growthRoute,growthCap} from './growth-lab.js';

export const DRAFT_SERVICES={
 'focus-upgrade':{id:'focus-upgrade',service:'upgrade',name:['强化包','Refine'],cards:['paper'],icon:'relic-heirloomladle',text:['选1张成长食材升1级，加入1张纸团。','Raise one growth food by one level; add one Paper scrap.']},
 'focus-prune':{id:'focus-prune',service:'prune',name:['整备包','Prune'],cards:['paper'],icon:'relic-splitter',text:['永久删除1张非炸弹牌，加入1张纸团。','Permanently remove one non-bomb card; add one Paper scrap.']},
};
export function draftTargets(s,id){
 const service=DRAFT_SERVICES[id]?.service;
 return s.cards.filter(c=>!c.temporary&&(service==='upgrade'?growthRoute(c)&&(c.growthLevel||0)<growthCap(s):service==='prune'&&c.original!=='bomb'));
}
export const packageById=(id,packages)=>DRAFT_SERVICES[id]||packages.find(p=>p.id===id);
