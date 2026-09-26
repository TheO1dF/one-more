import {lesson} from './tutorial.js';
let root,context,frame,shaken=false,lastStep=null;
export function noteTutorialShake(){shaken=true;place();}
export function updateTutorialGuide(s,{selected,flow,busy,lang='zh',screen,diceInHand}={}){
 const id=lesson(s)?.[5].id;
 if(lastStep!==id){lastStep=id;shaken=false;}
 context=screen==='game'&&lesson(s)&&!busy?{s,selected,flow,lang,diceInHand}:null;
 cancelAnimationFrame(frame);root?.remove();root=null;
 if(context)frame=requestAnimationFrame(place);
}
export function tutorialGuideStep(s,{selected,flow,shaken=false,diceInHand=false,lang='zh'}={}){
 const l=lesson(s);if(!l)return null;
 const en=lang==='en',step=(selector,zh,eng)=>({selector,label:en?eng:zh});
 if(flow?.confirmation)return step('[data-action="confirm-action"]','使用 · 确认','USE · confirm');
 if(flow)return step('.card-row .tile.targetable,.choice-list [data-action="choose"]:not(:disabled),.route-targets [data-action="choose"]:not(:disabled)','选择另一张牌','Choose the other card');
 if(l[4]==='inspect')return l[5].observe==='card'?step('.tile[data-kind="fish"]','点牌，看效果','Tap for its effect'):step('.preview-slot.known','查看下一张的详情','Inspect the next card');
 if(l[4]==='pair')return step('.card-row .tile[data-kind="fish"]:not(:disabled)','点一张，再点另一张','Tap one, then the other');
 if(l[4]==='use')return step('.tile[data-kind="torch"]:not(:disabled)','点手电 · 只看不抽','Tap the flashlight · peek, not draw');
 if(l[4]==='roll')return shaken?step('#roll','掷出 · 提高下桌目标','THROW · raise the next target'):step('#die-hand','点骰子摇动','Tap to shake');
 if(l[4]==='acceptDice'&&diceInHand)return step('#roll','掷出骰子','Throw the die');
 const steps={
 draw:['#draw','翻开一张','Draw a card'],
 choice:['.action-cluster','收摊存分，或再拿一张','Bank your points, or draw again'],
 relic:['.relic-token[data-id="shaker"]','摇签筒 · 换走顶牌','Shaking cup · move the top card'],
 retry:['.result [data-action="retry"]','从第一桌再来','Start again at table one'],
 acceptDice:['#accept-dice','确定下桌目标','Set the next target'],
 chooseRoute:['.route-grid [data-action="route"]','选一条路线','Choose a route'],
 event:['[data-action="event-confirm"]:not(:disabled),[data-action="event-pick"],[data-action="event-leave"]','处理这次事件','Resolve this event'],
 add:['[data-action="open-reward"],.package-grid [data-action="add"]','选一包带走','Take one package'],
 next:['#next','进入下一桌','Next table'],
 };
 return steps[l[4]]?step(...steps[l[4]]):null;
}
function overlap(a,b){return Math.max(0,Math.min(a.x+a.width,b.right)-Math.max(a.x,b.left))*Math.max(0,Math.min(a.y+a.height,b.bottom)-Math.max(a.y,b.top));}
function place(){
 root?.remove();root=null;
 const coach=document.querySelector('.lesson');if(coach)coach.style.visibility='hidden';
 if(!context||!coach||document.querySelector('dialog[open]'))return;
 document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
 const instruction=tutorialGuideStep(context.s,{...context,shaken});
 const target=instruction&&[...document.querySelectorAll(instruction.selector)].find(el=>!el.disabled&&el.getClientRects().length)||document.querySelector('.action-cluster,.result-buttons');
 if(!target){coach.style.left='12px';coach.style.top='70px';coach.style.visibility='visible';return;}
 let r=target.getBoundingClientRect();if(!r.width||!r.height)return;
 // Scroll the actual control into view, then anchor the explanation beside it.
 if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth){target.scrollIntoView({block:'center',inline:'center',behavior:'instant'});frame=requestAnimationFrame(place);return;}
 target.classList.add('lesson-target');target.setAttribute('aria-describedby','tutorial-explanation');
 const c=coach.getBoundingClientRect(),gap=16,margin=12,top=62;
 const clamp=(x,y)=>({x:Math.max(margin,Math.min(innerWidth-c.width-margin,x)),y:Math.max(top,Math.min(innerHeight-c.height-margin,y)),width:c.width,height:c.height});
 const candidates=[clamp(r.x+r.width/2-c.width/2,r.y-c.height-gap),clamp(r.x+r.width/2-c.width/2,r.bottom+gap),clamp(r.left-c.width-gap,r.top),clamp(r.right+gap,r.top),clamp(innerWidth/2-c.width/2,innerHeight/2-c.height/2)];
 const obstacles=[...document.querySelectorAll('.action-cluster,.action-tray:not(:has(.empty-inspector)),.preview,.table-utilities,.tile,.score-rail,#deck-draw,.result-stats,.result h1,.result-art')].filter(el=>el!==target).map(el=>el.getBoundingClientRect());
 for(const o of obstacles)for(const x of [r.x+r.width/2-c.width/2,innerWidth/2-c.width/2]){
  candidates.push(clamp(x,o.top-c.height-gap),clamp(x,o.bottom+gap));
 }
 candidates.sort((a,b)=>cost(a)-cost(b));
 function cost(p){return overlap(p,r)*100+obstacles.reduce((n,o)=>n+overlap(p,o)*4,0)+Math.hypot(p.x+c.width/2-r.x-r.width/2,p.y+c.height/2-r.y-r.height/2);}
 const p=candidates[0];coach.style.left=p.x+'px';coach.style.top=p.y+'px';coach.style.visibility='visible';
 root=document.createElement('div');root.className='tutorial-guide';root.dataset.target=target.id||target.dataset.id||target.dataset.action;root.setAttribute('aria-hidden','true');
 root.innerHTML='<i class="guide-box"></i>';
 const box=root.firstChild;Object.assign(box.style,{left:Math.max(3,r.x-4)+'px',top:Math.max(3,r.y-4)+'px',width:Math.min(innerWidth-6,r.width+8)+'px',height:r.height+8+'px'});
 document.body.append(root);
}
if(typeof window!=='undefined'){
 window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);});
 document.addEventListener('scroll',()=>{if(context){cancelAnimationFrame(frame);frame=requestAnimationFrame(place);}},{capture:true,passive:true});
}
