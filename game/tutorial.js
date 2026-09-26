import {availableIds} from './unlock-data.js';
import {CARDS,RELICS} from './cards.js';
import {newRun,act,card,score} from './engine.js';
import {strangerArt} from './art.js';
export const TUTORIAL_VERSION=8;
export const STORY_VERSION=4;
export const STORY=[['“十桌，打完就结账。”\n荷官把牌推到您面前。\n“规矩边打边讲。先翻一张。”','“Ten tables, then we settle up.”\nThe dealer slides the deck toward you.\n“I will explain as we play. Take a card.”']];
const step=(id,action,zh,en,copy,enCopy,observe)=>[zh,en,copy,enCopy,action,{id,observe}];
const STEPS=[
 step('first','draw','荷官','THE DEALER','“先拿一张。这桌要**8分**，**第一张**不会是炸弹。”','“Take a card. **Eight points** this table. The **first card** cannot be a bomb.”'),
 step('inspect','inspect','荷官','THE DEALER','“**点鱼干**。角上是**分数**，下方写着它的**效果**。”','“**Tap the fish**. Its corner is the **score**; its **ability** appears below.”','card'),
 step('second','draw','荷官','THE DEALER','“再拿一张。两张**相同的食材**，可以配成一对。”','“Another. Two **matching foods** make a pair.”'),
 step('pair','pair','荷官','THE DEALER','“**点一张鱼干**，再**点另一张**，就配好了。2＋2变4＋4。”','“**Tap one fish**, then **tap the other**. That makes a pair. 2 + 2 becomes 4 + 4.”'),
 step('preview','inspect','荷官','THE DEALER','“鱼干替您看了顶牌。点**第1格**看看，牌**还没抽出来**。”','“The fish peeked ahead. Tap **slot 1**. That card is **still in the deck**.”','preview'),
 step('choice','draw','荷官','THE DEALER','“手电？拿着吧。总有人用得上。”','“A flashlight? Take it. Someone always needs one.”'),
 step('lure','draw','荷官','THE DEALER','“工具又不值分。再拿一张，我给您留了好牌。”','“Tools pay nothing. Take another. I saved you a good one.”'),
 step('tool','use','潘神','PAN','“差点就让他得手了。我**每局只救一次**。**点一下手电**，先看牌。”','“He nearly had you. I can save you **once per run**. **Tap the flashlight** to peek first.”'),
 step('bomb-preview','inspect','潘神','PAN','“点**第1格**。这才是下一张；看清了再决定。”','“Tap **slot 1**. That is your next card. Look before deciding.”','preview'),
 step('shaker','relic','潘神','PAN','“**摇签筒**在上面。**每桌洗一次**，换走顶牌；**炸弹不会消失**。”','“The **shaking cup** is above. **Once per table**, shuffle and move the top card. **The bomb stays**.”'),
 step('free','choice','潘神','PAN','“**收摊**，桌上的分才进袋子。想多拿？再抽到炸弹，我可拦不住了。”','“**CASH OUT** puts those points in your bag. Want another? I cannot stop a **second bomb**.”'),
];
export function tutorialRun(seed,retry=false){
 const s=newRun(seed,{rules:2,stakesVersion:2,allowedCards:availableIds({},'cards',Object.keys(CARDS)),allowedRelics:availableIds({},'relics',Object.keys(RELICS))});
 // Only the teaching table has a disclosed, reproducible opening. No card is added.
 if(!retry){const order=[4,5,15,20];s.draw=[...order,...s.draw.filter(uid=>!order.includes(uid))];}
 s.lesson=retry?10:0;s.lessonVersion=TUTORIAL_VERSION;s.tutorialRetry=retry;return s;
}
export function lesson(s){
 if(!Number.isInteger(s?.lesson))return null;
 if(s.phase==='lost')return step('retry','retry','潘神','PAN','“按 **One More?**，从第一桌重来。新一局，我能再替你挡一次。”','“Press **One More?** to restart at table one. I can stop one bomb in the new run.”');
 if(s.phase==='stakes'||s.phase==='midnight')return s.dice?.result?step('keep','acceptDice','这是下桌的目标','The next target','“骰点加在**下桌目标**上，**不进您的袋子**。认这个点数，就按确认。”','“The die raises the **next target**, **not your bank**. Confirm to keep this result.”'):step('roll','roll','摇一摇，再掷出去','Shake, then throw','“先**点骰子摇动**，再**掷进盘里**。它决定下桌目标涨多少。”','“**Tap the die** to shake it, then **throw it into the tray**. It raises the next target.”');
 if(s.phase==='route')return step('route','chooseRoute','顺路办件事','Choose a stop','“两条路，只去一处。**效果和费用**都在牌下面，选适合您的。”','“One of two stops. Each shows its **effect and price**. Pick what suits your deck.”');
 if(s.phase==='encounter')return step('event','event','先看条件，再成交','Read the offer','“选好要交给我的东西，再按**成交**。不合适，也可以**离开**。”','“Pick what you want to hand over, then **confirm**. You may **leave** instead.”');
 if(s.phase==='draft')return !s.added?step('pack','add','整组带走','Take the whole pack','“卡包进度条只算**本桌新赚的分**。您这桌够了，选一包，**好牌和麻烦**一起带走。”','“Only **points earned this table** fill the pack meter. You earned a pack. Pick one: **good cards and trouble** together.”'):step('next','next','带上新牌','Take your new cards','“袋里的分留着。下一桌重新洗牌，工具恢复；免死保护**不会补回**。”','“Keep your bank. Next table: reshuffle and ready your tools. Bomb protection **does not refill**.”');

 if(s.tutorialRetry&&s.flips===0)return step('retry-first','draw','重新入座','A fresh table','“先拿一张，**第一张**还是安全的。**点牌看效果**，够分后随时收摊。”','“Take your safe **first card**. **Tap cards for their effects**; cash out when you have enough.”');
 if(s.lesson===10&&s.tutorialRetry)return step('retry-play','choice','看这一桌','Play this table','“本桌已有'+score(s)+'分，还差'+Math.max(0,s.target-s.bank-score(s))+'分。**点牌看效果**；**摇签筒**在上方。”','“'+score(s)+' points on the table; '+Math.max(0,s.target-s.bank-score(s))+' still needed. **Tap cards for effects**. The **shaking cup** is above.”');
 return STEPS[s.lesson]||null;
}
export const lessonReady=()=>true;
export function tutorialObserve(s,kind){
 return lesson(s)?.[5].observe===kind?{...s,lesson:s.lesson+1}:s;
}
export function lessonAllows(s,a){
 const l=lesson(s);if(!l)return true;
 if(['lost','won'].includes(s.phase))return a.type==='retry';
 if(s.phase!=='play')return true;
 // Finish the short peek/shuffle lesson before opening free play.
 if(s.lesson>=10)return true;
 return a.type===l[4]&&(a.type!=='pair'||a.ids?.length===2&&a.ids.every(uid=>card(s,uid)?.kind==='fish'));
}
export function tutorialAct(s,a){
 if(!lessonAllows(s,a))throw Error('lesson');
 if(lesson(s)&&a.type==='retry')return tutorialRun((s.seed^0x9e3779b9)>>>0,true);
 const leaving=Number.isInteger(s.lesson)&&a.type==='next';
 const source=leaving?{...s,economy:2}:s;
 if(leaving){delete source.lesson;delete source.lessonVersion;delete source.tutorialRetry;}
 const next=act(source,a);if(!Number.isInteger(s.lesson))return next;
 if(s.phase==='play'){
  if(s.lesson===0&&a.type==='draw')next.lesson=1;
  if(s.lesson===2&&a.type==='draw')next.lesson=3;
  if(s.lesson===3&&a.type==='pair')next.lesson=4;
  if(s.lesson===5&&a.type==='draw')next.lesson=6;
  if(s.lesson===7&&a.type==='use')next.lesson=8;
  if(s.lesson>=7&&a.type==='relic')next.lesson=10;
  if(s.lesson===6&&!s.tutorialRetry&&a.type==='draw'&&next.beginnerRescue)next.lesson=7;
 }
 if(a.type==='acceptDice')next.routeOffers=['lantern','raw'];
 if(a.type==='chooseRoute')next.offers=['mint','tea','wild'];
 if(a.type==='next'){delete next.lesson;delete next.lessonVersion;delete next.tutorialRetry;}
 return next;
}
export function tutorialText(text){
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return String(text).split(/\*\*(.*?)\*\*/g).map((part,i)=>i%2?'<b class="lesson-key">'+escape(part)+'</b>':escape(part)).join('');
}
export function tutorialHTML(s,lang,replay=false,busy=false){
 const l=lesson(s);if(!l)return '';const en=lang==='en';
 const pan=l[0]==='潘神';
 return '<aside data-speaker="'+(pan?'pan':'dealer')+'" class="lesson" role="region" aria-label="'+(en?'Dealer tutorial':'荷官教学')+'" data-step="'+s.lesson+'" data-lesson="'+l[5].id+'"><div class="lesson-copy"><strong>'+((l[0]==='潘神'||l[0]==='荷官')?l[en?1:0]:(en?'THE DEALER':'荷官'))+'</strong><p id="tutorial-explanation" aria-live="polite">'+tutorialText(l[en?3:2])+'</p></div><button class="lesson-skip" aria-label="'+(en?'Skip lesson':'跳过教学')+'" title="'+(en?'Skip lesson':'跳过教学')+'" data-action="skip-lesson" '+(busy?'disabled':'')+'>'+'×'+'</button></aside>';
}
export function tutorialUIAllows(s,action){
 if(!lesson(s)||s.phase!=='play'||s.lesson>=10)return true;
 if(['select','deck','log','discard','preview','protection','table-page'].includes(action))return true;
 return {draw:['draw'],inspect:[],pair:['pair','choose','cancel'],use:['use','choose','cancel','confirm-action'],relic:['relic']}[lesson(s)[4]]?.includes(action)||false;
}
export function storyHTML(index,lang){
 const en=lang==='en';return '<main class="story-scene"><div class="stranger" aria-hidden="true">'+strangerArt()+'</div><section class="story-copy"><p>'+STORY[0][en?1:0].replaceAll('\n','<br>')+'</p><button class="primary" data-action="story-skip">One More?</button></section></main>';
}
