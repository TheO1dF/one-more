// Reward eligibility is independent of the cumulative survival target.
export const economyEnabled=s=>s.economy===2&&!s.practice&&!s.growth&&!Number.isInteger(s.lesson);
export const fixedRaise=round=>[0,0,4,4,6,8,10,14,18,24,32][Math.min(10,round)]||0;
export const rewardRequirement=s=>Math.max(8,s.goalHistory?.find(x=>x.round===s.round)?.dice?.total||8);
export function beginRewardTable(s){
 if(!economyEnabled(s))return;
 s.rewardGate={round:s.round,goal:rewardRequirement(s),bankStart:s.bank,unlocked:false};
 s.roundRewardEligible=null;s.rewardPackOpened=false;
}
export function rewardProgress(s,tableScore=0){
 const g=s.rewardGate;
 return g?Math.max(0,s.bank-g.bankStart+(s.phase==='play'?tableScore:0)):0;
}
export function unlockTableReward(s,tableScore=0){
 if(!economyEnabled(s)||!s.rewardGate||s.phase!=='play')return;
 if(!s.rewardGate.unlocked&&rewardProgress(s,tableScore)>=s.rewardGate.goal)s.rewardGate.unlocked=true;
}
export const rewardDenied=s=>economyEnabled(s)&&s.roundRewardEligible===false;
export function validRewards(s){
 const g=s.rewardGate;
 return (s.economy==null||s.economy===2)&&(!g||(g.round===s.round&&Number.isFinite(g.bankStart)&&Number.isInteger(g.goal)&&g.goal>=1&&typeof g.unlocked==='boolean'))
  &&(s.roundRewardEligible==null||typeof s.roundRewardEligible==='boolean')&&(s.rewardPackOpened==null||typeof s.rewardPackOpened==='boolean');
}
