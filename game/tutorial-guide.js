import {lesson} from './tutorial.js';
let root,context,frame,shaken=false,lastStep=null;
export function noteTutorialShake(){shaken=true;place();}
export function updateTutorialGuide(s,{selected,flow,busy,lang='zh',screen,diceInHand}={}){
 if(lastStep!==s?.lesson){lastStep=s?.lesson;shaken=false;}
 context=screen==='game'&&lesson(s)&&!busy?{s,selected,flow,lang,diceInHand}:null;
 cancelAnimationFrame(frame);root?.remove();root=null;
 if(context)frame=requestAnimationFrame(place);
}
export function tutorialGuideStep(s,{selected,flow,shaken=false,diceInHand=false,lang='zh'}={}){
 const current=lesson(s);if(!current)return null;
 const action=current[4],en=lang==='en',label=(zh,eng)=>en?eng:zh;
 const step=(selector,zh,eng)=>({selector,label:label(zh,eng)});
 if(flow){
  const selector='.choice-list [data-action="choose"]:not(:disabled),.route-targets [data-action="choose"]:not(:disabled)';
  if(action==='pair')return step(selector,'选另一张饭团','Choose the other Rice ball');
  return step(selector,'选择要改变的牌','Choose the card to change');
 }
 if(action==='pair')return s.cards.find(c=>c.uid===selected)?.kind==='rice'
  ?step('[data-action="pair"]:not(:disabled)','配对 · 两张都翻倍','PAIR · double both cards')
  :step('.tile[data-kind="rice"]:not(:disabled)','选饭团，准备配对','Select Rice ball to pair');
 if(action==='use')return s.cards.find(c=>c.uid===selected)?.kind==='torch'
  ?step('[data-action="use"]:not(:disabled)','使用 · 查看下一张','USE · peek at the next card')
  :step('.tile[data-kind="torch"]:not(:disabled)','选小手电，查看牌顶','Select Flashlight to peek');
 if(action==='draw')return step('#draw',s.lesson===6?'翻开炸弹 · 体验出局':s.lesson===0||s.lesson===8?'翻开首张 · 安全':'翻开下一张',s.lesson===6?'Draw the bomb · end this run':s.lesson===0||s.lesson===8?'Draw the first card · safe':'Draw the next card');
 if(action==='roll')return shaken?step('#roll','掷出 · 增加目标','THROW · raise the target'):step('#die-hand','摇动骰子','Shake the die');
 if(action==='acceptDice'&&diceInHand)return step('#roll','重掷 · 替换当前结果','REROLL · replace this result');
 const steps={
  retry:['.result [data-action="retry"]','从第1桌重开','Start again at table 1'],
  relic:['.relic-token[data-id="shaker"]','摇签筒 · 重洗剩余牌','Shaking cup · shuffle the pile'],
  stop:['#stop','收摊 · 存下8分','CASH OUT · bank 8 points'],
  acceptDice:['#accept-dice','确认下桌目标','Confirm the next target'],
  chooseRoute:['.route-grid [data-action="route"]','任选一条路线','Choose either route'],
  add:['.package-grid [data-action="add"]','带走整组 · 含麻烦牌','Take a package · trouble too'],
  next:['#next','带上新牌，进入第2桌','Take your new cards to table 2']
 };
 return steps[action]?step(...steps[action]):null;
}
function place(){
 root?.remove();root=null;if(!context||document.querySelector('dialog[open]'))return;
 document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
 const instruction=tutorialGuideStep(context.s,{...context,shaken});
 const target=instruction&&document.querySelector(instruction.selector);if(!target||target.disabled)return;
 const r=target.getBoundingClientRect();if(!r.width||!r.height)return;
 target.classList.add('lesson-target');
 target.setAttribute('aria-describedby',[...new Set([...(target.getAttribute('aria-describedby')||'').split(' ').filter(Boolean),'tutorial-explanation'])].join(' '));
 for(let parent=target.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
  const css=getComputedStyle(parent),box=parent.getBoundingClientRect();
  if(/auto|scroll/.test(css.overflowY)&&parent.scrollHeight>parent.clientHeight+2&&(r.bottom>box.bottom-8||r.top<box.top+8)){
   parent.scrollTop+=r.y+r.height/2-box.y-box.height/2;frame=requestAnimationFrame(place);return;
  }
 }
 if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth){target.scrollIntoView({block:'center',inline:'center',behavior:'instant'});frame=requestAnimationFrame(place);return;}
 const help=document.querySelector('.lesson')?.getBoundingClientRect(),safeTop=Math.max(8,(help?.bottom||0)+8);
 if(r.height<innerHeight-safeTop-16&&(r.top<safeTop||r.bottom>innerHeight-8)){
  const before=window.scrollY;window.scrollBy({top:r.top<safeTop?r.top-safeTop:r.bottom-innerHeight+8,behavior:'instant'});
  if(window.scrollY!==before){frame=requestAnimationFrame(place);return;}
 }
 const x=Math.max(6,Math.min(innerWidth-6,r.x)),y=Math.max(6,r.y),w=Math.min(r.width,innerWidth-x-6),h=Math.min(r.height,innerHeight-y-6);
 const below=y-safeTop<90,tipY=below?y+h+8:y-8;
 root=document.createElement('div');root.className='tutorial-guide';root.dataset.target=target.id||target.dataset.id||target.dataset.action;root.setAttribute('aria-hidden','true');
 root.innerHTML=`<i class="guide-box" style="left:${x-4}px;top:${y-4}px;width:${w+8}px;height:${h+8}px"></i><div class="guide-pointer ${below?'below':''}" style="top:${tipY}px"><span></span><svg viewBox="0 0 44 38"><path d="M17 0h10v19h14L22 38 3 19h14Z"/></svg></div>`;
 root.querySelector('span').textContent=instruction.label;
 document.body.append(root);
 const pointer=root.querySelector('.guide-pointer'),half=pointer.getBoundingClientRect().width/2;
 const tipX=Math.max(half+8,Math.min(innerWidth-half-8,x+w*.5));pointer.style.left=tipX+'px';
 pointer.querySelector('svg').style.translate=`${x+w*.5-tipX}px 0`;
}
if(typeof window!=='undefined'){
 window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);});
 document.addEventListener('scroll',()=>{if(context){cancelAnimationFrame(frame);frame=requestAnimationFrame(place);}},{capture:true,passive:true});
}
