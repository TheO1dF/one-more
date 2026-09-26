import {icon,CARDS} from './cards.js';
import {discardKind,discardMark,discardLabel} from './discard-view.js';
import {animateAtRate} from './frame-clock.js';
import {reducedMotion} from './motion.js';
import {consumptionOrigin,isToolConsumedFood} from './consumption.js';

export async function discardFeedback(c,rect,bin,sourceRect,lang='zh'){
 const kind=discardKind(c),tool=consumptionOrigin(c,CARDS)==='tool',en=lang==='en',reduced=reducedMotion();
 if(reduced&&kind==='discarded')return;
 const ghost=document.createElement('span');ghost.className=`consumed-card discard-flight discard-${kind}`;ghost.dataset.origin=tool?'tool':c.consumed?'effect':'discard';
 const label=discardLabel(c,lang);
 ghost.innerHTML=`<span class="discard-flight-art">${icon(c.kind)}</span><span class="discard-flight-stamp">${discardMark(kind)}</span><span class="discard-flight-label">${label}${isToolConsumedFood(c,CARDS)?` · ${en?'RECLAIMABLE':'可回收'}`:''}</span>`;
 const width=Math.min(rect.width,120),height=Math.min(rect.height,160),x=rect.x,y=rect.y;
 ghost.style.cssText=`left:${x}px;top:${y}px;width:${width}px;height:${height}px`;
 document.body.append(ghost);
 const dx=bin.x+bin.width/2-x-width/2,dy=bin.y+bin.height/2-y-height/2;
 const near=sourceRect?{x:(sourceRect.x+sourceRect.width/2-x-width/2)*.35,y:(sourceRect.y+sourceRect.height/2-y-height/2)*.35}:{x:0,y:-22};
 const frames=tool?[
  {opacity:1,transform:'translate(0,0) scale(1)'},
  {opacity:1,transform:`translate(${near.x}px,${near.y}px) scale(.88)`,offset:.3},
  {opacity:1,transform:`translate(${near.x}px,${near.y}px) scale(.88)`,offset:.55},
  {opacity:0,transform:`translate(${dx}px,${dy}px) scale(.12)`},
 ]:c.consumed?[
  {opacity:1,transform:'rotate(0) scale(1)'},
  {opacity:1,transform:'translateY(-15px) rotate(-12deg) scale(.8,1.04)',offset:.28},
  {opacity:.9,transform:'translateY(12px) rotate(18deg) scale(.72,.5)',offset:.58},
  {opacity:0,transform:`translate(${dx}px,${dy}px) rotate(65deg) scale(.12)`},
 ]:[{opacity:.9,transform:'translate(0,0)'},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.12)`}];
 if(reduced){ghost.style.left=Math.max(8,Math.min(innerWidth-width-8,bin.x))+'px';ghost.style.top=Math.max(8,bin.bottom+8)+'px';}
 const animations=[];
 try{
  const flight=animateAtRate(ghost,reduced?[{opacity:1},{opacity:1,offset:.75},{opacity:0}]:frames,{duration:reduced?240:kind==='discarded'?340:540,easing:'ease-in-out',fill:'both'});animations.push(flight);
  if(!reduced&&c.consumed){const stamp=animateAtRate(ghost.querySelector('.discard-flight-stamp'),[{opacity:0,scale:'1.8',rotate:'-20deg'},{opacity:1,scale:'1',rotate:'-8deg'}],{duration:180,delay:140,fill:'both',easing:'ease-out'});animations.push(stamp);}
  await Promise.all(animations.map(a=>a.finished));
 }catch{}finally{animations.forEach(a=>a.cancel());ghost.remove();}
}
