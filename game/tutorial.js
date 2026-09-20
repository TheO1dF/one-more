import {newRun, act, card} from './engine.js';
import {strangerArt} from './art.js';
export const TUTORIAL_VERSION=3;
export const STORY = [
 ['荷官收走最后一枚筹码。你把衣兜翻了个底朝天。\n空的。\n“赢回车费就走。”刚才，你也是这么说的。','The dealer takes your last chip. You turn out your pockets.\nEmpty.\n“Just win back the fare home.” You said that last time, too.'],
 ['一只戴着白手套的手按住椅背。\n礼帽底下，一张瓷面具正朝你微笑。\n“先生，您还没输光。请坐。”','A white-gloved hand holds your chair.\nBeneath a top hat, a porcelain mask smiles at you.\n“Sir, you still have something left to lose. Sit.”'],
 ['“十桌。够分就能走。”\n他亮出一张炸弹，慢慢压进牌堆。\n“翻到它，你会死。记住这句就够了。”','“Ten tables. Meet the target, and you can leave.”\nHe shows you a bomb and slides it into the deck.\n“Draw this, and you die. Remember that part.”']
];
const LESSONS = [
 ['第一张','FIRST CARD','点 One More?。开桌第一张不会是炸弹。','Press One More? The first card of a new table is safe.','draw'],
 ['食材','FOOD','再翻一张，找一对相同食材。','Reveal another card. Look for matching food.','draw'],
 ['找一对','FIND A MATCH','食材留在桌上计分；同名食材可以配对。','Food scores while on the table. Matching food can pair.','draw'],
 ['配对','PAIR','点饭团 → 配对 → 另一张饭团：2+2 变成 4+4。','Select Rice ball → PAIR → the other Rice ball: 2+2 becomes 4+4.','pair'],
 ['再来一张','ONE MORE CARD','再翻一张。','Reveal one more card.','draw'],
 ['查看顶牌','PEEK','点小手电 → 使用，查看顶牌；用过的工具会横置。','Select Flashlight → USE to peek. Used tools turn sideways.','use'],
 ['“还敢翻吗？”','“Still want another?”','下一张是炸弹。教学中试着翻开：本局会立即结束。','The next card is a bomb. Draw it in this lesson to see how a run ends.','draw'],
 ['“再来？”','“Another game?”','翻到炸弹，本局分数全部作废。点 One More? 重开。','A bomb ends the run and wipes its score. Press One More? to restart.','retry'],
 ['重新开始','A NEW RUN','新的一局，分数归零。第一张仍然安全。','A new run. Your score is gone. The first card is safe again.','draw'],
 ['配对食材','MATCHING FOOD','再翻一张，凑成对子。','Reveal one more to make a pair.','draw'],
 ['配对得分','PAIR SCORE','把两张饭团配对，拿到8分。','Pair the two Rice balls for 8 points.','pair'],
 ['工具','TOOLS','再翻一张工具，练习避开炸弹。','Reveal a tool to learn how to avoid a bomb.','draw'],
 ['查看','PEEK','点小手电 → 使用。上方显示顶牌；查看不会翻开它。','Select Flashlight → USE. The preview shows the top card without drawing it.','use'],
 ['摇签筒','SHAKING CUP','顶牌是炸弹。点牌桌上方的摇签筒，重洗剩余牌堆；每桌一次，不保证下一张安全。','The bomb is on top. Use Shaking cup above the table to shuffle the remaining pile. Once per table; the next draw is not guaranteed safe.','relic'],
 ['收摊','CASH OUT','牌序已变，刚才的查看信息作废。现在收摊，存下8分。','The order changed, so the old preview is cleared. Cash out now to bank 8 points.','stop'],
 ['掷骰加码','RAISE THE STAKES','摇动骰子，再掷进骰盘；点数增加目标，不增加得分。','Shake the die, then throw it. The roll raises the target, not your score.','roll'],
 ['下桌目标','NEXT TARGET','每桌至少新增8分，第5桌起12分；骰子可继续加码。1和20锁定，其余可重掷一次。','Each table needs at least 8 new points, or 12 from table 5. Dice may raise that further. 1 and 20 lock; other rolls allow one reroll.','acceptDice'],
 ['选择路线','CHOOSE A PATH','选一条路线；附魔需再选食材，事件直接生效。','Choose a path. Enchantments need a food target; events resolve directly.','chooseRoute'],
 ['构筑牌组','BUILD YOUR DECK','必须带走一组牌。每组都有麻烦牌。','Take one package. Every package includes trouble.','add'],
 ['下一桌','NEXT TABLE','去下一桌。每桌重新洗牌，那张炸弹始终在。','Go to the next table. Each table reshuffles. The bomb is always there.','next']
];
export function tutorialRun(seed,secondChance=false){
 const s=newRun(seed),order=secondChance?[1,2,15,20]:[1,4,2,15,20];
 s.draw=[...order,...s.draw.filter(uid=>!order.includes(uid))];s.lesson=secondChance?8:0;s.lessonVersion=TUTORIAL_VERSION;return s;
}
export const lesson = s => Number.isInteger(s?.lesson)?LESSONS[s.lesson]:null;
export function lessonAllows(s,a){
 const l=lesson(s);if(!l)return true;
 if(a.type==='roll'&&l[4]==='acceptDice')return true;
 if(a.type!==l[4])return false;
 if(a.type==='pair')return a.ids?.length===2&&a.ids.every(uid=>card(s,uid)?.kind==='rice');
 if(a.type==='use')return card(s,a.uid)?.kind==='torch';
 if(a.type==='relic')return a.id==='shaker';return true;
}
export function tutorialAct(s,a){
 if(!lessonAllows(s,a))throw Error('lesson');
 if(s.lesson===7&&a.type==='retry')return tutorialRun((s.seed^0x9e3779b9)>>>0,true);
 const next=act(s,a);
 if(lesson(s)&&a.type===lesson(s)[4]){next.lesson=s.lesson+1;if(!LESSONS[next.lesson]){delete next.lesson;delete next.lessonVersion;}}
 return next;
}
export function tutorialHTML(s,lang,replay=false){
 const l=lesson(s);if(!l)return '';const en=lang==='en';
 return `<aside class="lesson" role="status" data-step="${s.lesson}"><span class="stranger-seal" aria-hidden="true">${strangerArt()}</span><div><strong>${l[en?1:0]}</strong><p>${l[en?3:2]}</p></div><button data-action="skip-lesson">${replay?(en?'End tutorial':'结束教学'):(en?'Skip tutorial':'跳过教学')}</button></aside>`;
}
export function storyHTML(index,lang){
 const en=lang==='en';return `<main class="story-scene scene-${index}"><div class="hanging-lamp" aria-hidden="true"></div><div class="stranger" aria-hidden="true">${strangerArt()}</div><div class="story-table" aria-hidden="true"><span class="last-chip">?</span><span class="empty-glass"></span></div><section class="story-copy"><small>${en?'ONE LAST CHANCE':'最后一次机会'}</small><p>${STORY[index][en?1:0].replaceAll('\n','<br>')}</p><button class="primary" data-action="story-next">${index===2?'One More?':en?'Continue':'继续'}</button><button class="story-skip" data-action="story-skip">${en?'Skip story':'跳过剧情'}</button></section></main>`;
}
