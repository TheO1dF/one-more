export const MOMENTUM_CARDS={
 stackcake:{type:'food',name:['叠叠饼','Stack cakes'],text:['不可配对；2分，桌上每多1张同名牌，此牌分数翻倍。','Cannot pair; 2 points, doubled for each other Stack cakes in play.'],noPair:true,color:'#edbd38',icon:'stackcake'},
 metronome:{type:'device',name:['节拍器','Metronome'],text:['在场时每翻出3张食材，本桌倍率×2。','Every three foods revealed while this is in play multiply this table’s score by 2.'],color:'#81b8ba',icon:'metronome'},
 sweeper:{type:'device',name:['清扫车','Table sweeper'],text:['在场时每翻出3张食材，清理最早入桌的1张麻烦。','Every three foods revealed while this is in play clear the oldest trouble.'],color:'#339563',icon:'sweeper'},
};
export const MOMENTUM_PACKAGES=[
 {id:'stackcakes',name:['越叠越高','Stack them high'],cards:['stackcake','stackcake','debt']},
 {id:'metronome',name:['跟上节拍','Keep the beat'],cards:['metronome','rice','paper']},
 {id:'sweeper',name:['一路清场','Sweep the table'],cards:['sweeper','fish','rust']},
];
export const SKIP_REWARDS={
 prune:{name:['清仓','Clear out'],text:['免费永久删除2张非炸弹牌。','Permanently remove two non-bomb cards for free.'],icon:'relic-splitter'},
 enchant:{name:['特调','House special'],text:['任选一种附魔，免费赋予1张食材。','Choose any enchantment for one food, free of charge.'],icon:'stove'},
 staple:{name:['永久装订','Lasting staple'],text:['随机装订3张非炸弹永久牌，以后每桌重新装订。','Bind three random permanent non-bomb cards; rebind them every table.'],icon:'stapler'},
 relic:{name:['抵押物','Pledged item'],text:['获得1件尚未拥有的随机抵押物。','Gain one random pledged item you do not own.'],icon:'relic-oldkey'},
};
export const mandatoryTable=round=>round===10;
export const skipTargetPenalty=(s,round=s.round+1)=>Number(!s.endless&&!!s.skipHistory?.some(x=>x.round===round-1));
export const rolledForNextTable=s=>!!s.dice?.rolls?.length&&!!s.dice?.result&&s.goalHistory?.at(-1)?.round===s.round+1&&!!s.goalHistory.at(-1).dice;
export const canSkipTable=s=>s.rules===2&&!s.endless&&!s.practice&&!Number.isInteger(s.lesson)&&s.phase==='route'&&rolledForNextTable(s)&&s.bank>=s.target&&s.round>=1&&s.round<9;
export const scoreMultiplier=s=>2**(s.tableDoublings||0);
export function validMomentum(s){
 const whole=n=>Number.isInteger(n)&&n>=0&&n<=100000;
 if(s.tableDoublings!=null&&!whole(s.tableDoublings)||s.foodStreak!=null&&!whole(s.foodStreak))return false;
 if(s.lastSkipped!=null&&(!whole(s.lastSkipped)||s.lastSkipped<2||s.lastSkipped>s.round||mandatoryTable(s.lastSkipped)))return false;
 if(s.skipHistory!=null&&(!Array.isArray(s.skipHistory)||s.skipHistory.some(x=>!whole(x.round)||x.round>s.round||mandatoryTable(x.round)||!SKIP_REWARDS[x.reward])))return false;
 if(s.skipOffer!=null&&(!SKIP_REWARDS[s.skipOffer.id]||!Number.isInteger(s.skipOffer.round)||s.skipOffer.round<2||s.skipOffer.round>9))return false;
 return Number.isFinite(scoreMultiplier(s));
}
