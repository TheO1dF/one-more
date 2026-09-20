import {score,onTable} from './engine.js';
export const ACHIEVEMENTS={
 first_pair:{name:['开张','First match'],text:['完成一次配对。','Make a pair.']},
 three_pairs:{name:['三份齐上','Three courses'],text:['桌上同时有三对食材。','Have three pairs on the table.']},
 forty:{name:['满载而归','A full tray'],text:['一次收摊获得40分。','Cash out 40 points at once.']},
 midnight:{name:['过了子夜','After midnight'],text:['到达第五桌。','Reach table five.']},
 clear:{name:['十桌赢家','Ten tables'],text:['完成十桌。','Clear all ten tables.']},
 tools:{name:['熟练工','Well equipped'],text:['累计使用50次工具。','Use tools 50 times across runs.']},
};
export function trackProgress(meta,before,after,action){
 if(before.practice||Number.isInteger(before.lesson))return [];
 meta.achievements??={};meta.stats??={tools:0,runsWon:0,bestCash:0};
 if(action.type==='use')meta.stats.tools++;
 if(action.type==='stop')meta.stats.bestCash=Math.max(meta.stats.bestCash,after.roundEarned);
 if(before.phase!=='won'&&after.phase==='won')meta.stats.runsWon++;
 const paired=new Set(onTable(after).filter(c=>c.pair).map(c=>c.pair)).size;
 const qualifies={first_pair:action.type==='pair',three_pairs:paired>=3,forty:action.type==='stop'&&after.roundEarned>=40,midnight:after.round>=5,clear:after.phase==='won',tools:meta.stats.tools>=50};
 const added=[];for(const [id,yes] of Object.entries(qualifies))if(yes&&!meta.achievements[id]){meta.achievements[id]=true;added.push(id);}
 return added;
}
