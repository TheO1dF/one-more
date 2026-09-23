export const MOMENTUM_CARDS={
 stackcake:{type:'food',name:['叠叠饼','Stack cakes'],text:['不可配对；2分，桌上每多1张同名牌，此牌分数翻倍。','Cannot pair; 2 points, doubled for each other Stack cakes in play.'],noPair:true,color:'#edbd38',icon:'stackcake'},
 metronome:{type:'device',name:['节拍器','Metronome'],text:['在场时每翻出3张食材，本桌倍率×1.2。','Every three foods revealed while this is in play multiply this table’s score by 1.2.'],color:'#81b8ba',icon:'metronome'},
 sweeper:{type:'device',name:['清扫车','Table sweeper'],text:['在场时每翻出3张食材，清理最早入桌的1张麻烦。','Every three foods revealed while this is in play clear the oldest trouble.'],color:'#339563',icon:'sweeper'},
};
export const MOMENTUM_PACKAGES=[
 {id:'stackcakes',name:['越叠越高','Stack them high'],cards:['stackcake','stackcake','debt']},
 {id:'metronome',name:['跟上节拍','Keep the beat'],cards:['metronome','rice','paper']},
 {id:'sweeper',name:['一路清场','Sweep the table'],cards:['sweeper','fish','rust']},
];
export const SKIP_REWARDS={
 prune:{weight:20,name:['清仓','Clear out'],text:['免费永久删除2张非炸弹牌。','Permanently remove two non-bomb cards for free.'],icon:'relic-splitter'},
 enchant:{weight:22,name:['双份特调','Double special'],text:['为2张不同的适用牌各选1种附魔。','Choose an enchantment for each of two different eligible cards.'],icon:'stove'},
 staple:{weight:16,name:['永久装订','Lasting staple'],text:['随机装订3张非炸弹永久牌，以后每桌重新装订。','Bind three random permanent non-bomb cards; rebind them every table.'],icon:'stapler'},
 relic:{weight:15,name:['抵押物','Pledged item'],text:['获得1件尚未拥有的随机抵押物。','Gain one random pledged item you do not own.'],icon:'relic-oldkey'},
 duplicate:{weight:17,name:['复写','Carbon copy'],text:['免费永久复制1张非炸弹牌，保留附魔与成长。','Permanently copy one non-bomb card, including its enchantment and growth.'],icon:'carboncopy'},
 scout:{weight:6,name:['侦察补给','Scout kit'],text:['仅下一桌：开局查看5张，前2次工具食材费用为0。','Next table only: peek five at the start; the first two tool food costs are zero.'],icon:'scope'},
 jackpot:{weight:3.5,rare:true,name:['金桌大奖','Golden table'],text:['仅下一桌：整桌最终计分 ×1.2。','Next table only: multiply the final table score by 1.2.'],icon:'relic-scale'},
 sanctuary:{weight:.5,rare:true,name:['平安夜大奖','Bomb-free night'],text:['仅下一桌：移开全部炸弹，再下一桌全部归还。','Next table only: set every bomb aside; all return the following table.'],icon:'relic-luckybone'},
};
export function wheelSections(pool){
 const normal=pool.filter(id=>!SKIP_REWARDS[id].rare),sum=normal.reduce((n,id)=>n+SKIP_REWARDS[id].weight,0),rare=pool.filter(id=>SKIP_REWARDS[id].rare).reduce((n,id)=>n+SKIP_REWARDS[id].weight,0);
 let angle=0;return pool.map(id=>{const r=SKIP_REWARDS[id],chance=r.rare?r.weight:r.weight/sum*(100-rare),start=angle;angle+=chance*3.6;return {id,chance,start,end:angle,mid:(start+angle)/2};});
}
export function wheelPick(pool,roll){const sections=wheelSections(pool);return sections.find(x=>roll*360<x.end)||sections.at(-1);}
export const mandatoryTable=round=>round===10;
export const skipTargetPenalty=(s,round=s.round+1)=>Number(!s.endless&&!!s.skipHistory?.some(x=>x.round===round-1));
export const rolledForNextTable=s=>!!s.dice?.rolls?.length&&!!s.dice?.result&&s.goalHistory?.at(-1)?.round===s.round+1&&!!s.goalHistory.at(-1).dice;
export const canSkipTable=s=>s.rules===2&&!s.endless&&!s.practice&&!Number.isInteger(s.lesson)&&s.phase==='route'&&rolledForNextTable(s)&&s.bank>=s.target&&s.round>=1&&s.round<9;
export const scoreMultiplier=s=>2**(s.tableDoublings||0)*1.2**(s.metronomeStacks||0)*(s.tablePrize==='jackpot'?1.2:1);
export function validMomentum(s){
 const whole=n=>Number.isInteger(n)&&n>=0&&n<=100000;
 if(s.tableDoublings!=null&&!whole(s.tableDoublings)||s.metronomeStacks!=null&&!whole(s.metronomeStacks)||s.foodStreak!=null&&!whole(s.foodStreak))return false;
 if(s.lastSkipped!=null&&(!whole(s.lastSkipped)||s.lastSkipped<2||s.lastSkipped>s.round||mandatoryTable(s.lastSkipped)))return false;
 if(s.skipHistory!=null&&(!Array.isArray(s.skipHistory)||s.skipHistory.some(x=>!whole(x.round)||x.round>s.round||mandatoryTable(x.round)||!SKIP_REWARDS[x.reward])))return false;
 if(s.skipOffer!=null){const o=s.skipOffer;if(o.id!=null&&!SKIP_REWARDS[o.id]||!Number.isInteger(o.round)||o.round<2||o.round>9)return false;if(o.pool!=null&&(!Array.isArray(o.pool)||!o.pool.length||new Set(o.pool).size!==o.pool.length||o.pool.some(id=>!SKIP_REWARDS[id])||o.id!=null&&!o.pool.includes(o.id)))return false;}
 if(s.phase==='skipReward'&&(!s.skipOffer?.pool||!s.skipOffer.id||s.skipOffer.round!==s.round+1||!Number.isFinite(s.skipOffer.rotation)))return false;
 if(s.tablePrize!=null&&!['jackpot','sanctuary','scout'].includes(s.tablePrize))return false;
 if(s.nextSkipPrize!=null&&(!['jackpot','sanctuary','scout'].includes(s.nextSkipPrize.id)||!Number.isInteger(s.nextSkipPrize.round)||s.nextSkipPrize.round!==s.round+1))return false;
 return Number.isFinite(scoreMultiplier(s));
}
