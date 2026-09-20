import {lesson} from './tutorial.js';
let root,context,frame,shaken=false,lastStep=null;
export function noteTutorialShake(){shaken=true;place();}
export function updateTutorialGuide(s,{selected,flow,busy,lang='zh',screen}={}){
 if(lastStep!==s?.lesson){lastStep=s?.lesson;shaken=false;}
 context=screen==='game'&&lesson(s)&&!busy?{s,selected,flow,lang}:null;
 cancelAnimationFrame(frame);root?.remove();root=null;
 if(context)frame=requestAnimationFrame(place);
}
function targetSelector(){
 const {s,selected,flow}=context,action=lesson(s)[4];
 if(flow)return '.choice-list [data-action="choose"]:not(:disabled),.route-targets [data-action="choose"]:not(:disabled)';
 if(action==='pair')return s.cards.find(c=>c.uid===selected)?.kind==='rice'?'[data-action="pair"]:not(:disabled)':'.tile[data-kind="rice"]:not(:disabled)';
 if(action==='use')return s.cards.find(c=>c.uid===selected)?.kind==='torch'?'[data-action="use"]:not(:disabled)':'.tile[data-kind="torch"]:not(:disabled)';
 return {draw:'#draw',retry:'.result [data-action="retry"]',relic:'.relic-token[data-id="shaker"]',stop:'#stop',roll:shaken?'#roll':'#die-hand',acceptDice:'#accept-dice',chooseRoute:'.route-grid [data-action="route"]',add:'.package-grid [data-action="add"]',next:'#next'}[action];
}
function place(){
 root?.remove();root=null;if(!context||document.querySelector('dialog[open]'))return;
 document.querySelectorAll('.lesson-target').forEach(el=>el.classList.remove('lesson-target'));
 const target=document.querySelector(targetSelector());if(!target||target.disabled)return;
 const r=target.getBoundingClientRect();if(!r.width||!r.height)return;
 target.classList.add('lesson-target');
 for(let parent=target.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
  const css=getComputedStyle(parent),box=parent.getBoundingClientRect();
  if(/auto|scroll/.test(css.overflowY)&&parent.scrollHeight>parent.clientHeight+2&&(r.bottom>box.bottom-8||r.top<box.top+8)){
   parent.scrollTop+=r.y+r.height/2-box.y-box.height/2;frame=requestAnimationFrame(place);return;
  }
 }
 if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth){target.scrollIntoView({block:'center',inline:'center',behavior:'instant'});frame=requestAnimationFrame(place);return;}
 const x=Math.max(6,Math.min(innerWidth-6,r.x)),y=Math.max(6,r.y),w=Math.min(r.width,innerWidth-x-6),h=Math.min(r.height,innerHeight-y-6);
 const below=y<110,tipX=Math.max(46,Math.min(innerWidth-46,x+w*.5)),tipY=below?y+h+8:y-8;
 const label=context.lang==='en'?'HERE':'点这里';
 root=document.createElement('div');root.className='tutorial-guide';root.dataset.target=target.id||target.dataset.id||target.dataset.action;root.setAttribute('aria-hidden','true');
 root.innerHTML=`<i class="guide-box" style="left:${x-4}px;top:${y-4}px;width:${w+8}px;height:${h+8}px"></i><div class="guide-pointer ${below?'below':''}" style="left:${tipX}px;top:${tipY}px"><span>${label}</span><svg viewBox="0 0 44 38"><path d="M17 0h10v19h14L22 38 3 19h14Z"/></svg></div>`;
 document.body.append(root);
}
if(typeof window!=='undefined'){
 window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);});
 document.addEventListener('scroll',()=>{if(context){cancelAnimationFrame(frame);frame=requestAnimationFrame(place);}},{capture:true,passive:true});
}
