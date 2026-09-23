import {availableIds} from './unlock-data.js';
import {CARDS,RELICS} from './cards.js';
import {newRun, act, card} from './engine.js';
import {strangerArt} from './art.js';
export const TUTORIAL_VERSION=5;
export const STORY_VERSION=4;
export const STORY = [
 ['最后一枚筹码也输了。您把手伸进口袋，又空着手拿出来。\n荷官没催，只把已经收起的牌重新拆开。\n“还坐吗？”','Your last chip is gone. You check your pocket and take your hand out empty.\nThe dealer unpacks the cards he has just put away.\n“Staying?”'],
 ['礼帽压得很低，那张白面具仍笑得客气。\n“十桌。打完，之前的账一笔勾销。”\n他推来一张收据，拇指压着最下面一行。','His hat sits low; the white mask still wears a courteous smile.\n“Ten tables. Clear them and we settle your old account.”\nHe slides over a receipt, his thumb covering the bottom line.'],
 ['荷官亮出一张炸弹牌，等您看清才放回去。\n“这张得先说明白。翻出来，整局结束，袋里的分也全归我。”\n他把收据翻了面。\n“听明白了，咱们就开始。”','He holds up a bomb card and waits before putting it back.\n“This one ends the entire run. Everything you have banked goes with it.”\nHe turns the receipt face down.\n“If that is clear, we can begin.”']
];
const ACTION_LESSONS = [
 ['翻第一张','FIRST DRAW','请按 One More?。每桌第一张不会是炸弹，您可以放心拿。往后就得自己决定了。','Press One More? The first card of each table cannot be a bomb. After that, the decision is yours.','draw'],
 ['桌上这两分','TWO POINTS ON THE TABLE','饭团，2分。还没够目标。再按一次 One More?，牌会接着摆到桌上。','A Rice ball. Two points. Short of the target yet. Press One More? again; each card stays on the table.','draw'],
 ['找一对','FIND A PAIR','鱼干也是2分。要是再来一张饭团，两张饭团就能配成一对，各自翻倍。要试试吗？','The Dried fish is worth two as well. Another Rice ball would make a pair, doubling both Rice balls. Shall we?','draw'],
 ['把它们配上','PAIR THEM','点饭团、点「配对」，再点另一张。各2分变各4分。叠牌上的♥编号只标记这一对。','Tap a Rice ball, PAIR, then the other one. Each rises from 2 to 4. The matching ♥ number marks the pair, not its score.','pair'],
 ['够分，还要？','ENOUGH. ANOTHER?','现在收摊，这桌就过了。多赚的分也能带到后面，您想多留些本钱，我很理解。再拿一张？','You can cash out and clear this table. Surplus carries forward. I understand wanting a little more to work with. Another?','draw'],
 ['先照一眼','TAKE A LOOK','用小手电看看顶牌。只看，不抽，也不换位置。用过的工具会横过来。','Use the Flashlight to see the top card. Seeing is not drawing, and it does not move the card. The used tool turns sideways.','use'],
 ['还翻吗？','DRAW IT ANYWAY?','第1格是炸弹。您都看见了……还想翻？那就请吧。桌上这十分，可挡不了它。','Slot one is a bomb. You have seen it. Still reaching for the deck? Be my guest. Those ten points will not stop it.','draw'],
 ['重新入座','TAKE YOUR SEAT','别摸口袋了，分数已经结清。刚才够分时收摊，本来就能过桌。再坐一回？这次我教您把炸弹换走。','No need to check your pockets. That account is settled. Cashing out earlier would have cleared the table. Sit again? I will show you how to move that bomb.','retry'],
 ['第一桌','TABLE ONE','还是第一桌，从零开始。别急，刚才那张炸弹已经重新洗进去了，首张照旧安全。','Table one, starting from zero. The bomb is back in the shuffle. Your first card is safe as usual.','draw'],
 ['再翻一张','ONE MORE','再找一张饭团。配对能省几次冒险。','Find another Rice ball. A pair can spare you a few risky draws.','draw'],
 ['八分','EIGHT POINTS','把两张饭团配上，桌上就有8分。看，本桌目标正好也是8。','Pair those Rice balls and the table has 8 points. Look: this table needs exactly 8.','pair'],
 ['一件工具','A TOOL','还有一件小手电，翻出来吧。它不计分，不过能让您先看清顶牌。','There is a Flashlight, too. Draw it. No points, but it will show you the top card.','draw'],
 ['灯照到哪儿','WHERE THE LIGHT FALLS','用手电后，请看上方第1格。那就是下一张，牌还在原处。','Use the Flashlight, then look at slot 1 above. That is your next card, still in its place.','use'],
 ['摇签筒','SHAKING CUP','顶牌不妙？点上方抵押物栏里的摇签筒。它洗牌并换走原顶牌；小小的1，表示本桌还能用一次。炸弹不会消失。','Bad top card? Use the Shaking cup above. It shuffles and moves the old top away. The little 1 means one use this table. The bomb remains.','relic'],
 ['收摊','CASH OUT','顶牌又是未知。按「收摊」，这8分才会装袋。没够目标就收摊，也算输。','The top is unknown again. CASH OUT banks those 8 points. Cashing out short of the target is a loss.','stop'],
 ['把骰子掷下去','THROW THE DIE','骰子交给您。点它摇动，再点「掷出」或拖进骰盘。点数加在下桌目标上，袋里的分不会增加。','The die is yours. Shake it, then THROW or drag it into the tray. Its result raises the next target, not your bank.','roll'],
 ['认这个点数？','KEEP THAT ROLL?','装袋分还在。1和20不能重掷，其余可再赌一次。认了，就按新目标开桌。','Your bank stays. A 1 or 20 is final; other rolls get one more try. Keep it and the next table uses the new target.','acceptDice'],
 ['两条路','TWO DOORS','换桌前，您可以去一处。两边能办什么，都写在下面；挑一个适合这副牌的。收费的地方，我会先报数。','One stop before the next table. Each service is written below; pick what suits your deck. Where there is a fee, you will see it first.','chooseRoute'],
 ['整组带走','TAKE THE WHOLE PACK','请挑一组。好牌和麻烦都要收，不能拆卖。麻烦不会直接炸死您，但会妨碍得分或操作；点开看看，再决定。','Choose a pack. Good cards and trouble together; I do not sell them separately. Trouble will not kill you outright, but it can hinder scoring or actions. Read it before you decide.','add'],
 ['下一桌','NEXT TABLE','新牌已入库。下一桌重新洗牌，工具恢复，首张仍安全。那枚炸弹？还在。','Your new cards are in. The next table reshuffles, tools ready, and the first card is safe. The bomb? Still in there.','next']
];
const chapters=[['看懂牌桌','READ THE TABLE'],['配对得分','BUILD A PAIR'],['炸弹与查看','KNOW THE RISK'],['保住分数','BANK YOUR POINTS'],['准备下桌','BUILD YOUR DECK']];
const read=(id,chapter,title,enTitle,zh,en,target,observe)=>[title,enTitle,zh,en,'lessonNext',{id,chapter,target,observe}];
const LESSONS=[
 read('goal',0,'先看目标','READ THE TARGET','请看左边。装袋分加桌面分，要够「本局目标」才能过桌。「本桌需得」已经扣掉袋里的分，告诉您这桌还要赚多少。先过这一桌，再谈后面的九桌。','Look at the left. Your bank plus the table score must meet RUN TARGET to clear. THIS TABLE NEEDS has already deducted your bank. That is what you still need to earn here. One table at a time.','.target-score'),
 ...ACTION_LESSONS.flatMap((l,i)=>{
  const chapter=i<1?0:i<5?1:i<8?2:i<15?3:4;
  const action=[...l,{id:'action-'+i,chapter}];
  if(i===0)return [action,read('inspect',0,'牌上写着什么','READ THE CARD','请点饭团。角上是它现在值几分，下方写着效果和可用操作。遇到不认识的牌，也这样点开看。','Tap the Rice ball, please. Its corner shows its current score; below are its effect and available actions. Do the same with any unfamiliar card.','.inspector','card')];
  if(i===3)return [action,read('scores',1,'还没装袋','NOT BANKED YET','饭团4＋4，鱼干2，「本桌得分」是10。「装袋」还是0，收摊才入袋。您现在可以收，也可以继续赚；再翻会有什么风险，咱们还没说完。','Rice 4 + 4, Fish 2: TABLE SCORE is 10. BANKED stays at 0 until you cash out. You can stop or keep earning. We have not finished discussing the risks of another draw.','.table-score')];
  if(i===5)return [action,read('preview',2,'看清第一格','READ SLOT ONE','点开第1格。那就是下一张；2、3格是更后面的牌，问号是未知。「剩余」只是牌的张数，别当成安全次数。','Open slot 1. That is your next card; slots 2 and 3 are farther down. ? means unknown. REMAINING counts cards, not safe draws.','.preview-slot.known','preview')];
  return [action];
 }),
 read('ready',4,'该你做决定了','YOUR CALL','目标变了，装袋分还在。点牌看效果，点「当前牌组」看整副牌。够分就能收摊；想赚更多，就再翻一张。设置里能重玩这桌。','New target, same bank. Tap a card for its effect; CURRENT DECK shows every card you own. You can cash out once you have enough. For more, draw again. Replay this table in Settings.','.target-score','deck')
];
export function tutorialRun(seed,secondChance=false){
 const s=newRun(seed,{rules:2,allowedCards:availableIds({},'cards',Object.keys(CARDS)),allowedRelics:availableIds({},'relics',Object.keys(RELICS))}),order=secondChance?[1,2,15,20]:[1,4,2,15,20];
 s.draw=[...order,...s.draw.filter(uid=>!order.includes(uid))];s.lesson=secondChance?LESSONS.findIndex(l=>l[5].id==='action-8'):0;s.lessonVersion=TUTORIAL_VERSION;return s;
}
export const lesson = s => Number.isInteger(s?.lesson)?LESSONS[s.lesson]:null;
export const lessonReady=s=>!lesson(s)?.[5].observe||s.lessonObserved===lesson(s)[5].id;
export function tutorialObserve(s,kind){
 return lesson(s)?.[5].observe===kind?{...s,lessonObserved:lesson(s)[5].id}:s;
}
export function lessonAllows(s,a){
 const l=lesson(s);if(!l)return true;
 if(a.type==='roll'&&l[4]==='acceptDice')return true;
 if(a.type!==l[4])return false;
 if(a.type==='lessonNext')return lessonReady(s);
 if(a.type==='pair')return a.ids?.length===2&&a.ids.every(uid=>card(s,uid)?.kind==='rice');
 if(a.type==='use')return card(s,a.uid)?.kind==='torch';
 if(a.type==='relic')return a.id==='shaker';return true;
}
export function tutorialAct(s,a){
 if(!lessonAllows(s,a))throw Error('lesson');
 if(lesson(s)?.[4]==='retry'&&a.type==='retry')return tutorialRun((s.seed^0x9e3779b9)>>>0,true);
 const next=a.type==='lessonNext'?{...s}:act(s,a);
 // Only the guided first table uses a small, dependable reward pool.
 if(lesson(s)&&a.type==='acceptDice')next.routeOffers=['lantern','raw'];
 if(lesson(s)&&a.type==='chooseRoute')next.offers=['mint','tea','wild'];
 if(lesson(s)&&a.type===lesson(s)[4]){next.lesson=s.lesson+1;delete next.lessonObserved;if(!LESSONS[next.lesson]){delete next.lesson;delete next.lessonVersion;}}
 return next;
}
export function tutorialHTML(s,lang,replay=false,busy=false){
 const l=lesson(s);if(!l)return '';const en=lang==='en',info=l[5],reading=l[4]==='lessonNext';
 const copy=info.id==='ready'?(en?`You have ${s.bank} banked; the run target is ${s.target}. This table needs ${Math.max(0,s.target-s.bank)} more. Open CURRENT DECK to check your new cards. From here, the draws and the cash-out are your call. If you need another lesson, it is in Settings.`:`您已装袋${s.bank}分，本局目标${s.target}分，这桌还需${Math.max(0,s.target-s.bank)}分。请打开「当前牌组」看看新拿的牌。之后拿几张、什么时候收摊，就由您决定了。需要重温规矩，可以在设置里重玩教学。`):l[en?3:2];
 return `<aside class="lesson" role="region" aria-label="${en?'Dealer tutorial':'荷官教学'}" data-step="${s.lesson}" data-lesson="${info.id}"><span class="stranger-seal" aria-hidden="true">${strangerArt()}</span><div class="lesson-copy"><small class="lesson-chapter">${en?'THE DEALER':'荷官'} · ${info.chapter+1}/5 · ${chapters[info.chapter][en?1:0]}</small><strong>${l[en?1:0]}</strong><p id="tutorial-explanation" aria-live="polite">${copy}</p></div><div class="lesson-controls">${reading?`<button data-action="lesson-next" ${lessonReady(s)&&!busy?'':'disabled'}>${info.id==='ready'?(replay?(en?'Finish lesson':'完成教学'):(en?'Play on my own':'我来试试')):en?'Got it':'明白了'}</button>`:''}<button class="lesson-skip" data-action="skip-lesson" ${busy?'disabled':''}>${replay?(en?'Leave lesson':'结束教学'):(en?'Skip':'跳过教学')}</button></div></aside>`;
}
export function storyHTML(index,lang){
 const en=lang==='en';return `<main class="story-scene scene-${index}"><div class="hanging-lamp" aria-hidden="true"></div><div class="stranger" aria-hidden="true">${strangerArt()}</div><div class="story-table" aria-hidden="true"><span class="last-chip">?</span><span class="empty-glass"></span></div><section class="story-copy"><small>${en?'ONE LAST CHANCE':'最后一次机会'}</small><p>${STORY[index][en?1:0].replaceAll('\n','<br>')}</p><button class="primary" data-action="story-next">${index===2?'One More?':en?'Continue':'继续'}</button><button class="story-skip" data-action="story-skip">${en?'Skip story':'跳过剧情'}</button></section></main>`;
}
