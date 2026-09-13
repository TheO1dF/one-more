import {newRun, act, card} from './engine.js';
import {strangerArt} from './art.js';
export const TUTORIAL_VERSION=2;
export const STORY = [
 ['荷官收走最后一枚筹码。你把衣兜翻了个底朝天。\n空的。\n“赢回车费就走。”刚才，你也是这么说的。','The dealer takes your last chip. You turn out your pockets.\nEmpty.\n“Just win back the fare home.” You said that last time, too.'],
 ['一只戴着白手套的手按住椅背。\n礼帽底下，一张瓷面具正朝你微笑。\n“先生，您还没输光。请坐。”','A white-gloved hand holds your chair.\nBeneath a top hat, a porcelain mask smiles at you.\n“Sir, you still have something left to lose. Sit.”'],
 ['“十桌。够分就能走。”\n他亮出一张炸弹，慢慢压进牌堆。\n“翻到它，你会死。记住这句就够了。”','“Ten tables. Meet the target, and you can leave.”\nHe shows you a bomb and slides it into the deck.\n“Draw this, and you die. Remember that part.”']
];
const LESSONS = [
 ['“第一张，我请。”','“The first one is on me.”','点 One More?。开桌第一张不会是炸弹。','Press One More? The first card of a new table is safe.','draw'],
 ['“两分。够回家么？”','“Two points. Enough to get home?”','再翻一张，找一对相同食材。','Reveal another card. Look for matching food.','draw'],
 ['“不配。再试试。”','“No match. Try again.”','食材留在桌上计分；同名食材可以配对。','Food scores while on the table. Matching food can pair.','draw'],
 ['“瞧，手气回来了。”','“There. Your luck is turning.”','点饭团 → 配对 → 另一张饭团：2+2 变成 4+4。','Select Rice ball → PAIR → the other Rice ball: 2+2 becomes 4+4.','pair'],
 ['“才刚回本。现在走？”','“Only just even. Leaving already?”','再翻一张。','Reveal one more card.','draw'],
 ['“不信我？自己看。”','“Don’t trust me? Look for yourself.”','点小手电 → 使用，查看顶牌；用过的工具会横置。','Select Flashlight → USE to peek. Used tools turn sideways.','use'],
 ['面具的笑容一动不动。“翻吧。我就在这里。”','The smile does not move. “Go on. I’m right here.”','下一张是炸弹，翻开会死。你的手却又伸了出去。','The next card is a bomb. Drawing it kills you. Still, your hand reaches out.','draw'],
 ['“我说我在这里。可没说会救你。”','“I said I was here. I never said I would save you.”','十分快要到手，一瞬间，全没了。','Ten points within reach. Gone in an instant.','retry'],
 ['“再来一局。这回，听你自己的。”','“One more game. This time, trust yourself.”','新的一局，分数归零。第一张仍然安全。','A new run. Your score is gone. The first card is safe again.','draw'],
 ['他伸出一根手指。你盯着牌背。','He raises one finger. You watch the back of the card.','再翻一张，凑成对子。','Reveal one more to make a pair.','draw'],
 ['“又够了。你还想要多少？”','“Enough again. How much more do you want?”','把两张饭团配对，拿到8分。','Pair the two Rice balls for 8 points.','pair'],
 ['你把筹码拢进手心。这次，他没有说话。','You gather the chips into your palm. This time, he says nothing.','点收摊，存下8分。达到目标才能去下一桌。','CASH OUT to bank 8 points. Meet the target to move on.','stop'],
 ['他把一颗骰子推过来。“下桌的价码。”','He slides you a die. “The price of the next table.”','摇动骰子，再掷进骰盘；点数增加目标，不增加得分。','Shake the die, then throw it. The roll raises the target, not your score.','roll'],
 ['“先看清，再点头。”','“Read it before you agree.”','确认目标；1和20锁定，其余可重掷一次。','Set the target. 1 and 20 lock; other rolls allow one reroll.','acceptDice'],
 ['两条走廊，都亮着灯。','Both corridors are lit.','选一条路线；附魔需再选食材，事件直接生效。','Choose a path. Enchantments need a food target; events resolve directly.','chooseRoute'],
 ['“好东西，总搭点麻烦。”','“Every good deal has a catch.”','必须带走一组牌。每组都有麻烦牌。','Take one package. Every package includes trouble.','add'],
 ['你起身时，他已经拉开了下一把椅子。','As you stand, he pulls out the next chair.','去下一桌。每桌重新洗牌，那张炸弹始终在。','Go to the next table. Each table reshuffles. The bomb is always there.','next']
];
export function tutorialRun(seed,secondChance=false){
 const s=newRun(seed),order=secondChance?[1,2]:[1,4,2,15,20];
 s.draw=[...order,...s.draw.filter(uid=>!order.includes(uid))];s.lesson=secondChance?8:0;s.lessonVersion=TUTORIAL_VERSION;return s;
}
export const lesson = s => Number.isInteger(s?.lesson)?LESSONS[s.lesson]:null;
export function lessonAllows(s,a){
 const l=lesson(s);if(!l)return true;
 if(a.type==='roll'&&s.lesson===13)return true;
 if(a.type!==l[4])return false;
 if(a.type==='pair')return a.ids?.length===2&&a.ids.every(uid=>card(s,uid)?.kind==='rice');
 if(a.type==='use')return card(s,a.uid)?.kind==='torch';return true;
}
export function tutorialAct(s,a){
 if(!lessonAllows(s,a))throw Error('lesson');
 if(s.lesson===7&&a.type==='retry')return tutorialRun((s.seed^0x9e3779b9)>>>0,true);
 const next=act(s,a);
 if(lesson(s)&&a.type===lesson(s)[4]){next.lesson=s.lesson+1;if(!LESSONS[next.lesson]){delete next.lesson;delete next.lessonVersion;}}
 return next;
}
export function tutorialHTML(s,lang){
 const l=lesson(s);if(!l)return '';const en=lang==='en';
 return `<aside class="lesson" role="status" data-step="${s.lesson}"><span class="stranger-seal" aria-hidden="true">${strangerArt()}</span><div><strong>${l[en?1:0]}</strong><p>${l[en?3:2]}</p></div><button data-action="skip-lesson">${en?'Skip tutorial':'跳过教学'}</button></aside>`;
}
export function storyHTML(index,lang){
 const en=lang==='en';return `<main class="story-scene scene-${index}"><div class="hanging-lamp" aria-hidden="true"></div><div class="stranger" aria-hidden="true">${strangerArt()}</div><div class="story-table" aria-hidden="true"><span class="last-chip">?</span><span class="empty-glass"></span></div><section class="story-copy"><small>${en?'ONE LAST CHANCE':'最后一次机会'}</small><p>${STORY[index][en?1:0].replaceAll('\n','<br>')}</p><button class="primary" data-action="story-next">${index===2?'One More?':en?'Continue':'继续'}</button><button class="story-skip" data-action="story-skip">${en?'Skip story':'跳过剧情'}</button></section></main>`;
}
