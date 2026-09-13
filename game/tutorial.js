import {newRun, act, card} from './engine.js';

export const STORY = [
 ['最后一枚筹码滚进荷官手里。你摸了摸空口袋。\n这一次，连回家的钱也没有了。','Your last chip slides into the dealer’s hand. You search an empty pocket.\nThis time, even the fare home is gone.'],
 ['“还想再来一次？”\n阴影里的陌生人，替你拉开一把椅子。','“One more?”\nA stranger in the shadows pulls out a chair.'],
 ['“十桌。攒够分数，就让你走。”\n他把一张炸弹洗进牌里。\n“至于什么时候停手……你自己决定。”','“Ten tables. Bank enough points, and you can leave.”\nHe shuffles a bomb into the deck.\n“When to stop… that is up to you.”']
];
const LESSONS = [
 ['“第一张，算我请你。”','“The first one is on me.”','点 One More? 翻牌。第一张不会是炸弹。','Press One More? The first reveal is safe.','draw'],
 ['“两分。就满足了？”','“Two points. Satisfied already?”','再翻一张，看看能不能凑成对子。','Reveal another card. Look for a matching pair.','draw'],
 ['“鱼和饭可不算一对。”','“Fish and rice are no pair.”','再翻一张。不同食材留在桌上也会计分。','One more. Unmatched food still scores on the table.','draw'],
 ['“同样的两张，才值钱。”','“Two of a kind. Now we’re talking.”','点饭团 → 配对 → 另一张饭团：2+2 变成 4+4。','Select Rice ball → PAIR → the other Rice ball: 2+2 becomes 4+4.','pair'],
 ['“够了。但你不会就这么走吧？”','“Enough. But surely you’re not leaving?”','再翻一张，认识一件工具。','Reveal another card to find a tool.','draw'],
 ['“先看看，再做决定。”','“Look before you leap.”','点小手电 → 使用。工具用过后会横置。','Select Flashlight → USE. Used tools turn sideways.','use'],
 ['“下一张是炸弹。还要吗？”','“A bomb is next. Still want it?”','点收摊，保住桌上的10分；翻出炸弹会结束整局。','CASH OUT to bank your 10 points. A bomb ends the entire run.','stop'],
 ['“下一桌，规矩要加码。”','“The next table raises the stakes.”','摇动骰子，再掷进骰盘；点数增加的是目标，不是你的得分。','Shake the die, then throw it. The roll raises the target, not your score.','roll'],
 ['“看清价码，再点头。”','“Read the price before you agree.”','确认下一桌目标；1和20锁定，其余结果可重掷一次。','Set the next target. 1 and 20 lock; other rolls allow one reroll.','acceptDice'],
 ['“往哪边走，都有生意。”','“There’s a deal down either path.”','选一条路线；附魔需要再选食材，事件直接生效。','Choose a path. Enchantments need a food target; events resolve directly.','chooseRoute'],
 ['“好东西，总要搭点麻烦。”','“Every good deal has a catch.”','必须带走一组牌，每组都有麻烦；可点当前牌组查看。','Take one package. Every package includes trouble. Your deck is always viewable.','add'],
 ['“这回，你自己来。”','“You’re on your own now.”','去下一桌。往后每桌重新洗牌；炸弹始终留在牌组里。','Go to the next table. Each table reshuffles; the bomb never leaves your deck.','next']
];
export function tutorialRun(seed){
 const s=newRun(seed),order=[1,4,2,15,20];
 s.draw=[...order,...s.draw.filter(uid=>!order.includes(uid))];s.lesson=0;
 return s;
}
export const lesson = s => Number.isInteger(s?.lesson)?LESSONS[s.lesson]:null;
export function lessonAllows(s,a){
 const l=lesson(s);if(!l)return true;
 if(a.type==='roll'&&s.lesson===8)return true;
 if(a.type!==l[4])return false;
 if(a.type==='pair')return a.ids.length===2&&a.ids.every(uid=>card(s,uid)?.kind==='rice');
 if(a.type==='use')return card(s,a.uid)?.kind==='torch';
 return true;
}
export function tutorialAct(s,a){
 if(!lessonAllows(s,a))throw Error('lesson');
 const next=act(s,a);
 if(lesson(s)&&a.type===lesson(s)[4]){
   next.lesson=s.lesson+1;
   if(!LESSONS[next.lesson])delete next.lesson;
 }
 return next;
}
export function tutorialHTML(s,lang){
 const l=lesson(s);if(!l)return '';
 const en=lang==='en';
 return `<aside class="lesson" role="status" data-step="${s.lesson}"><span class="stranger-seal" aria-hidden="true">?</span><div><strong>${l[en?1:0]}</strong><p>${l[en?3:2]}</p></div><button data-action="skip-lesson">${en?'Skip tutorial':'跳过教学'}</button></aside>`;
}
export function storyHTML(index,lang){
 const en=lang==='en';return `<main class="story-scene scene-${index}"><div class="hanging-lamp" aria-hidden="true"></div><div class="stranger" aria-hidden="true"><i></i><b></b></div><div class="story-table" aria-hidden="true"><span class="last-chip">?</span><span class="empty-glass"></span></div><section class="story-copy"><small>${en?'ONE LAST CHANCE':'最后一次机会'}</small><p>${STORY[index][en?1:0].replaceAll('\n','<br>')}</p><button class="primary" data-action="story-next">${index===2?'One More?':en?'Continue':'继续'}</button><button class="story-skip" data-action="story-skip">${en?'Skip story':'跳过剧情'}</button></section></main>`;
}
