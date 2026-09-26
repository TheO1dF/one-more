// Selection drafts never mutate the run or spend its randomness/costs.
export function actionTargetIds(action){
 return [...new Set([...(action.ids?.slice(1)||[]),action.food,action.tool,action.target,...(action.targets||[])].filter(Number.isInteger))];
}

// Pair/kind effects have one canonical rules target; any visible member can select it.
export function toolTargetChoices(cards,targets,type){
 return targets.flatMap(target=>{
  const members=['pair','foodKind'].includes(type)?cards.filter(c=>c.zone==='table'&&!c.sealedBy&&(type==='pair'?c.pair===target.pair:c.kind===target.kind)):[target];
  return members.map(card=>({card,target:target.uid}));
 });
}
