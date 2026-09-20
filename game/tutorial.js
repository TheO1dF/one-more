import {availableIds} from './unlock-data.js';
import {CARDS,RELICS} from './cards.js';
import {newRun, act, card} from './engine.js';
import {strangerArt} from './art.js';
export const TUTORIAL_VERSION=3;
export const STORY = [
 ['荷官收走最后一枚筹码。你把衣兜翻了个底朝天。\n空的。\n“赢回车费就走。”刚才，你也是这么说的。','The dealer takes your last chip. You turn out your pockets.\nEmpty.\n“Just win back the fare home.” You said that last time, too.'],
 ['一只戴着白手套的手按住椅背。\n礼帽底下，一张瓷面具正朝你微笑。\n“先生，您还没输光。请坐。”','A white-gloved hand holds your chair.\nBeneath a top hat, a porcelain mask smiles at you.\n“Sir, you still have something left to lose. Sit.”'],
 ['“十桌。够分就能走。”\n他亮出一张炸弹，慢慢压进牌堆。\n“翻到它，你会死。记住这句就够了。”','“Ten tables. Meet the target, and you can leave.”\nHe shows you a bomb and slides it into the deck.\n“Draw this, and you die. Remember that part.”']
];
const LESSONS = [
 ['翻牌','DRAW A CARD','One More? 从牌堆顶翻出1张牌，放到桌上。每桌只有第一张保证不是炸弹。','One More? draws the top card onto the table. Only the first draw of each table is guaranteed safe.','draw'],
 ['桌面分数','TABLE SCORE','饭团留在桌上计2分。继续翻牌可以找对子，但也可能翻到炸弹。','The Rice ball scores 2 on the table. Keep drawing to find a match, at the risk of a bomb.','draw'],
 ['寻找对子','FIND A MATCH','不同食材先各自计分；两张同名食材可以配对，让两张牌一起翻倍。','Different foods score separately. Two matching foods can pair, doubling the points on both cards.','draw'],
 ['配对翻倍','PAIR TO DOUBLE','两张饭团原本各2分，配对后各4分；饭团的配对效果还能清理麻烦。','Each Rice ball goes from 2 to 4 points when paired. Its pair effect can also clear trouble.','pair'],
 ['已经够分了','TARGET REACHED','现在已经达到目标。多攒的分数能带到后桌；这次继续翻，学一个控制风险的工具。','You have met the target. Extra points can carry forward; draw again here to learn a tool for managing risk.','draw'],
 ['先看，再决定','PEEK BEFORE DRAWING','小手电查看下一张牌，不会抽走或改变它。使用后横置，需要恢复才能再次使用。','Flashlight reveals the next card without drawing or moving it. It turns sideways after use and must be readied to use again.','use'],
 ['看到了炸弹','BOMB AHEAD','上方第1格是下一张牌。查看没有移走炸弹；这次教学故意翻开，看看后果。','Preview slot 1 is your next draw. Peeking did not remove the bomb. Draw it now to see the consequence in this lesson.','draw'],
 ['整局结束','THE RUN IS OVER','炸弹会结束整局，装袋的分数也不能带到新局。One More? 在这里是重新开始。','A bomb ends the whole run. Even banked points cannot carry into a new run. Here, One More? starts over.','retry'],
 ['再试一局','TRY AGAIN','回到第1桌，分数归零。这次学会在看见炸弹后换个办法。','Back to table 1 with no points. This time, learn what you can do when you see a bomb coming.','draw'],
 ['准备配对','MAKE A PAIR','再找一张饭团；配对能用更少的翻牌次数攒够分数。','Look for another Rice ball. Pairing can help you reach the target with fewer draws.','draw'],
 ['把对子变成分数','SCORE THE PAIR','两张饭团配对后共8分，刚好达到本桌目标。','Pairing the two Rice balls gives 8 points, enough to meet this table’s target.','pair'],
 ['工具不靠点数','TOOLS DO MORE THAN SCORE','小手电本身不加分，它让你先知道下一张是什么。翻出它，试试查看。','Flashlight adds no points. It lets you learn what comes next. Draw it and try peeking.','draw'],
 ['查看不会翻牌','PEEKING IS NOT DRAWING','使用小手电后，看上方第1格。知道下一张是什么，再决定要不要冒险。','Use Flashlight, then look at preview slot 1. Knowing the next card helps you decide whether to risk a draw.','use'],
 ['摇签筒：改变牌序','SHAKING CUP: SHUFFLE','顶牌是炸弹。摇签筒每桌可重洗剩余牌一次；炸弹仍在，下一张不保证安全。','The bomb is on top. Shaking cup reshuffles the remaining pile once per table. The bomb stays; the next draw may still be fatal.','relic'],
 ['收摊：把分数装袋','CASH OUT: BANK YOUR POINTS','洗牌后旧的查看信息作废。收摊把本桌8分装袋，带到下一桌；装袋＋桌面分须达到目标。','Shuffling clears the old preview. Cash out to bank these 8 points. Bank + table score must meet the target to advance.','stop'],
 ['给下一桌加码','RAISE THE NEXT TARGET','先摇骰子，再掷进骰盘。骰点加在下一桌目标上，你的装袋分数不会增加。','Shake the die, then throw it into the tray. Its roll raises the next table’s target; your bank does not increase.','roll'],
 ['确认下一桌目标','CONFIRM THE NEXT TARGET','装袋分数会保留。1和20不能重掷，其余可重掷一次；确认后按新目标继续。','Your bank carries over. Rolls of 1 or 20 lock; other rolls allow one reroll. Confirm to continue with the new target.','acceptDice'],
 ['选择路线','CHOOSE A PATH','两条路线任选一条，先看收益与代价。附魔永久改变所选食材；事件立即生效。','Choose either route after checking its benefit and cost. Enchantments change a food permanently; events resolve now.','chooseRoute'],
 ['好牌也有代价','BUILD WITH A TRADE-OFF','选择会把这一组全部加入牌组，包括麻烦牌。每桌必须带一组，选能配合现有牌的。','TAKE adds the whole package, including its trouble, to your deck. Pick one each table; look for cards that work with yours.','add'],
 ['带着构筑继续','PLAY YOUR NEW DECK','分数已经装袋，新牌也已加入。下一桌重洗整个牌组、恢复工具；炸弹仍在，首张仍安全。','Your points are banked and new cards added. The next table reshuffles the deck and readies tools. The bomb stays; the first draw is safe.','next']
];
export function tutorialRun(seed,secondChance=false){
 const s=newRun(seed,{rules:2,allowedCards:availableIds({},'cards',Object.keys(CARDS)),allowedRelics:availableIds({},'relics',Object.keys(RELICS))}),order=secondChance?[1,2,15,20]:[1,4,2,15,20];
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
 return `<aside class="lesson" role="status" data-step="${s.lesson}"><span class="stranger-seal" aria-hidden="true">${strangerArt()}</span><div><strong>${l[en?1:0]}</strong><p id="tutorial-explanation">${l[en?3:2]}</p></div><button data-action="skip-lesson">${replay?(en?'End tutorial':'结束教学'):(en?'Skip tutorial':'跳过教学')}</button></aside>`;
}
export function storyHTML(index,lang){
 const en=lang==='en';return `<main class="story-scene scene-${index}"><div class="hanging-lamp" aria-hidden="true"></div><div class="stranger" aria-hidden="true">${strangerArt()}</div><div class="story-table" aria-hidden="true"><span class="last-chip">?</span><span class="empty-glass"></span></div><section class="story-copy"><small>${en?'ONE LAST CHANCE':'最后一次机会'}</small><p>${STORY[index][en?1:0].replaceAll('\n','<br>')}</p><button class="primary" data-action="story-next">${index===2?'One More?':en?'Continue':'继续'}</button><button class="story-skip" data-action="story-skip">${en?'Skip story':'跳过剧情'}</button></section></main>`;
}
