import {score,onTable} from './engine.js';
import {CARDS} from './cards.js';
export const ACHIEVEMENTS={
 first_pair:{name:['开张','First match'],text:['完成一次配对。','Make a pair.']},
 three_pairs:{name:['三份齐上','Three courses'],text:['桌上同时有三对食材。','Have three pairs on the table.']},
 forty:{name:['满载而归','A full tray'],text:['一次收摊获得40分。','Cash out 40 points at once.']},
 midnight:{name:['过了子夜','After midnight'],text:['到达第五桌。','Reach table five.']},
 clear:{name:['十桌赢家','Ten tables'],text:['完成十桌。','Clear all ten tables.']},
 tools:{name:['熟练工','Well equipped'],text:['累计使用50次工具。','Use tools 50 times across runs.']},
 ten_tools:{name:['趁手','Getting the hang of it'],text:['累计使用10次工具。','Use tools ten times across runs.']},
 consume:{name:['物尽其用','Waste nothing'],text:['实际消耗一张食材。','Consume one food.']},
 create:{name:['加一道菜','Another serving'],text:['生成一张临时食材。','Create one temporary food.']},
};
export function trackProgress(meta,before,after,action){
 if(before.practice||Number.isInteger(before.lesson))return [];
 meta.achievements??={};meta.stats={tools:0,runsWon:0,bestCash:0,...meta.stats};
 if(action.type==='use')meta.stats.tools=(meta.stats.tools||0)+1;
 if(action.type==='stop')meta.stats.bestCash=Math.max(meta.stats.bestCash,after.roundEarned);
 if(before.phase!=='won'&&after.phase==='won'){meta.stats.runsWon=(meta.stats.runsWon||0)+1;meta.ascensionWins??={};meta.challengeWins??={};if(!after.challenge||after.challenge==='standard')meta.ascensionWins[after.difficulty||0]=true;else meta.challengeWins[after.challenge]=true;}
 const paired=new Set(onTable(after).filter(c=>c.pair).map(c=>c.pair)).size;
 const freshLog=after.log.filter(e=>e.id>before.event);
 const qualifies={first_pair:action.type==='pair',three_pairs:paired>=3,forty:action.type==='stop'&&after.roundEarned>=40,midnight:after.round>=5,clear:after.phase==='won',tools:meta.stats.tools>=50,ten_tools:meta.stats.tools>=10,consume:freshLog.some(e=>e.key==='consume'&&CARDS[e.kind]?.type==='food'),create:after.cards.some(c=>c.temporary&&CARDS[c.kind]?.type==='food'&&!before.cards.some(b=>b.uid===c.uid))};
 if(!['won','lost'].includes(before.phase)&&['won','lost'].includes(after.phase)){meta.history??=[];meta.history.unshift({seed:after.seed,round:after.round,bank:after.bank,target:after.target,reason:after.reason,difficulty:after.difficulty||0,challenge:after.challenge||'standard'});meta.history=meta.history.slice(0,12);}
 const added=[];for(const [id,yes] of Object.entries(qualifies))if(yes&&!meta.achievements[id]){meta.achievements[id]=true;added.push(id);}
 return added;
}
