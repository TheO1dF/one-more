import {icon} from './cards.js';
import {animateAtRate} from './frame-clock.js';
import {reducedMotion} from './motion.js';
import {cancelEffects,emitEffect,effectPoint,rectPoint} from './tool-effects.js';

let current;
export function cancelCardPerformance(){
 if(!current)return;
 const session=current;current=null;
 session.animations.forEach(a=>a.cancel());session.root.remove();cancelEffects();
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelCardPerformance();});
const tile=uid=>document.querySelector(`.tile[data-uid="${uid}"]`);
const onscreen=p=>p&&p.x+p.w/2>0&&p.x-p.w/2<innerWidth&&p.y+p.h/2>0&&p.y-p.h/2<innerHeight;

export async function playCardPerformance(plan,positions=new Map()){
 cancelCardPerformance();
 if(!plan.active||reducedMotion()||document.hidden)return;
 const root=document.createElement('div');root.className='card-performance';root.setAttribute('aria-hidden','true');document.body.append(root);
 const session=current={root,animations:new Set()},jobs=[],budget={objects:0};
 const pos=uid=>effectPoint(tile(uid)?.querySelector(':scope > .art'))||effectPoint(tile(uid))||rectPoint(positions.get(uid)?.rect);
 const covered=new Set(),style=document.createElement('style');root.append(style);
 function cover(uid){covered.add(uid);updateCovers();}
 function uncover(uid){covered.delete(uid);updateCovers();}
 function updateCovers(){style.textContent=[...covered].map(id=>`.card-row .tile[data-uid="${id}"] > .art{opacity:0!important}`).join('');}
 const source=pos(plan.source?.uid),fx=plan.tool;
 const bin=effectPoint(document.querySelector('#discard-bin')),deck=effectPoint(document.querySelector('#deck-draw'));
 const peekSlot=plan.peeked[0]!=null?document.querySelector(`.preview-slot[data-uid="${plan.peeked[0]}"]`):document.querySelector(plan.source?.kind==='magnifier'?'.preview-slot:nth-child(3)':'.preview-slot.known');
 const preview=effectPoint(peekSlot)||effectPoint(document.querySelector('.preview'));
 const size=Math.min(108,Math.max(58,(source?.w||100)*.85));
 function animate(node,frames,duration=480,delay=0){
  const a=animateAtRate(node,frames,{duration,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'both'});session.animations.add(a);
  const p=a.finished.catch(()=>{}).finally(()=>{session.animations.delete(a);node.remove();});jobs.push(p);return p;
 }
 function object(kind,p,role='object',width=size){
  if(!onscreen(p)||budget.objects++>=9)return null;
  const el=document.createElement('span');el.className='performance-object';el.dataset.role=role;el.dataset.kind=kind;
  el.innerHTML=icon(kind);Object.assign(el.style,{left:p.x-width/2+'px',top:p.y-width/2+'px',width:width+'px',height:width+'px'});root.append(el);return el;
 }
 function travel(kind,a,b,role,duration=700,delay=180,arrivalUid=null){
  const el=object(kind,a,role,Math.min(size,86));if(!el||!b){el?.remove();return false;}
  const dx=b.x-a.x,dy=b.y-a.y;
  if(arrivalUid!=null)cover(arrivalUid);
  animate(el,[{opacity:0,transform:'translate(0,0) scale(.85)'},{opacity:1,transform:'translate(0,-8px) scale(1)',offset:.16},{opacity:1,transform:`translate(${dx*.5}px,${dy*.5-18}px) scale(1.05)`,offset:.48},{opacity:1,transform:`translate(${dx}px,${dy}px) scale(1)`,offset:.78},{opacity:1,transform:`translate(${dx}px,${dy}px) scale(1)`}],duration,delay).finally(()=>{if(arrivalUid!=null)uncover(arrivalUid);});return true;
 }
 function beat(kind,p,motion,duration){
  const el=object(kind,p,'tool');if(!el)return;
  const poses={
   scan:['rotate(-12deg) scale(.8)','rotate(12deg) scale(1)','rotate(12deg) scale(.85)'],
   sift:['translateX(-9px) rotate(-8deg)','translateX(9px) rotate(8deg)','translateX(-5px) rotate(-5deg)'],
   wipe:['translate(-28px,12px) rotate(-20deg)','translate(25px,-8px) rotate(15deg)','translate(38px,-14px) rotate(18deg)'],
   wash:['rotate(-20deg)','rotate(28deg)','rotate(35deg)'],fan:['rotate(-18deg)','rotate(22deg)','rotate(-12deg)'],
   stir:['translate(-9px,-8px) rotate(-15deg)','translate(10px,6px) rotate(16deg)','translate(-5px,0) rotate(-8deg)'],
   cook:['translateY(9px) scale(.8)','translateY(0) scale(1)','translateY(0) scale(1)'],steam:['translateY(12px)','translateY(0)','translateY(-6px)'],
   crush:['translateY(-18px) scaleY(1.12)','translateY(6px) scaleY(.87)','translateY(0) scaleY(1)'],
   cut:['translate(-18px,-24px) rotate(-32deg)','translate(7px,8px) rotate(18deg)','translate(18px,-5px) rotate(24deg)'],
   press:['translateY(-27px) scale(1.06)','translateY(7px) scale(.93)','translateY(-14px) scale(1)'],
   stamp:['translateY(-22px) scale(1.1)','translateY(7px) scale(.9)','translateY(-12px) scale(1)'],
   serve:['translate(-18px,15px) rotate(-12deg)','translate(4px,-7px) rotate(8deg)','translate(18px,-15px) rotate(12deg)'],
   ring:['rotate(-15deg)','rotate(16deg)','rotate(-5deg)'],check:['rotate(-8deg) scale(.85)','rotate(4deg) scale(1)','rotate(0deg) scale(1)'],
   wind:['rotate(-55deg)','rotate(60deg)','rotate(120deg)'],sharpen:['translate(-18px,6px) rotate(-25deg)','translate(18px,-6px) rotate(12deg)','translate(-8px,3px) rotate(-15deg)'],
   lift:['translateY(16px) rotate(-12deg)','translateY(-10px) rotate(10deg)','translateY(-20px) rotate(15deg)'],
   pull:['translateX(18px) rotate(15deg)','translateX(-8px) rotate(-12deg)','translateX(-15px) rotate(-12deg)'],repair:['rotate(-16deg)','rotate(12deg)','rotate(0deg)'],
   grow:['translateY(10px) scale(.7)','translateY(-4px) scale(1.07)','translateY(-8px) scale(1)'],
   store:['translateY(12px) rotate(-10deg)','translateY(0) rotate(4deg)','translateY(-8px) rotate(0deg)'],
   cover:['translateY(-30px) scale(1.1)','translateY(4px) scale(1)','translateY(4px) scale(1)'],
   tie:['rotate(-22deg) scale(.7)','rotate(18deg) scale(1.06)','rotate(0deg) scale(1)'],
   copy:['translateX(-12px) scale(.85)','translateX(9px) scale(1)','translateX(18px) scale(.9)'],
   fanout:['rotate(-12deg) scale(.8)','rotate(10deg) scale(1)','rotate(0deg) scale(1)'],
   return:['translateX(-16px)','translateX(16px)','translateX(28px)'],cutdeck:['translate(-24px,-8px) rotate(-30deg)','translate(12px,6px) rotate(20deg)','translate(28px,0) rotate(25deg)'],
   keep:['translateY(12px) scale(.8)','translateY(-8px) scale(1)','translateY(0) scale(.9)'],deal:['rotate(-12deg) scale(.8)','rotate(10deg) scale(1)','rotate(0deg) scale(.9)'],
  }[motion]||['scale(.8)','scale(1)','scale(.9)'];
  animate(el,[{opacity:0,transform:poses[0]},{opacity:1,transform:poses[0],offset:.12},{opacity:1,transform:poses[0],offset:.23},{opacity:1,transform:poses[1],offset:.47},{opacity:1,transform:poses[1],offset:.62},{opacity:1,transform:poses[2],offset:.87},{opacity:0,transform:poses[2]}],duration);
 }
 const recipient=pos(plan.targets[0]),target=recipient||source;
 if(fx&&source){
  const remote=['scan','sift'].includes(fx.motion)?preview||deck:fx.motion==='cutdeck'?deck:target;
  // Routine peeks stay small at the tool. Processing tools work beside the affected object.
  const at=['scan','sift','deal','fanout','ring','check','wind'].includes(fx.motion)?source:remote?{...remote,x:Math.max(size/2,Math.min(innerWidth-size/2,remote.x+Math.min(34,remote.w*.25))),y:remote.y-10}:source;
  beat(plan.source.kind,at,fx.motion,fx.duration);
  if(!['copy','return','store','keep','deal','fanout'].includes(fx.motion))jobs.push(emitEffect(plan.source.kind,source,remote,{pattern:fx.pattern,duration:fx.duration}));
  if(fx.motion==='return'&&plan.removed[0])travel(plan.removed[0].from.kind,rectPoint(positions.get(plan.removed[0].from.uid)?.rect)||target,deck,'return');
  if(fx.motion==='store'&&plan.removed[0])travel(plan.removed[0].from.kind,rectPoint(positions.get(plan.removed[0].from.uid)?.rect)||target,source,'store',760);
  if(fx.motion==='tie')for(const c of plan.sealed.slice(0,2))travel(c.kind,pos(c.uid)||source,source,'seal',820);
 }
 for(const {from,to} of plan.transformed.slice(0,2)){
  const p=pos(to.uid);if(!onscreen(p))continue;
  const old=object(from.kind,p,'transform-before',p.w),next=object(to.kind,p,'transform-after',p.w);
  if(next)cover(to.uid);
  if(old)animate(old,[{opacity:1,clipPath:'inset(0 0 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)',offset:.2},{opacity:1,clipPath:'inset(0 0 100% 0)',offset:.7},{opacity:0,clipPath:'inset(0 0 100% 0)'}],740);
  if(next)animate(next,[{opacity:1,clipPath:'inset(100% 0 0 0)',transform:'scale(1)'},{opacity:1,clipPath:'inset(100% 0 0 0)',transform:'scale(1)',offset:.2},{opacity:1,clipPath:'inset(0 0 0 0)',transform:'scale(1.06)',offset:.7},{opacity:1,clipPath:'inset(0 0 0 0)',transform:'scale(1)',offset:.86},{opacity:1,clipPath:'inset(0 0 0 0)',transform:'scale(1)'}],900).finally(()=>uncover(to.uid));
 }
 for(const {card,origin} of plan.arrivals.slice(0,3)){
  const end=pos(card.uid),start=origin==='discard'?bin:origin==='deck'?deck:source||end;
  travel(card.kind,start,end,origin==='discard'?'reclaim':origin==='deck'?'fetch':'create',700,200,card.uid);
 }
 // Mass recovery is one simultaneous ripple, never a per-card animation queue.
 for(const c of plan.readied.slice(0,4)){
  const p=pos(c.uid);if(!p)continue;
  jobs.push(emitEffect('ready',source||p,p,{pattern:'ready',duration:650}));
 }
 if(!fx&&plan.peeked.length&&source)jobs.push(emitEffect('peek',source,preview||source,{pattern:'beam',duration:500}));
 await Promise.all(jobs);
 root.remove();if(current===session)current=null;
}
