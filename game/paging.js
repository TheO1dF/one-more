import {reducedMotion as reduced} from './motion.js';
import {animateAtRate} from './frame-clock.js';

const rows=field=>[...field.querySelectorAll(':scope > .card-row')];
export function dragPage(field,dx,edge=false){
 const distance=reduced()?0:Math.max(-field.clientWidth*.85,Math.min(field.clientWidth*.85,dx))*(edge?.2:1);
 field.classList.add('page-moving');field.dataset.dragOffset=distance;
 for(const row of rows(field)){row.style.transform=`translateX(${distance}px)`;row.style.opacity=1-Math.min(.25,Math.abs(distance)/field.clientWidth*.25);}
 return distance;
}
async function move(field,from,to,enter=false){
 const jobs=rows(field).map((row,i)=>{
  const animation=animateAtRate(row,[{transform:`translateX(${from}px)`,opacity:enter?.4:1},{transform:`translateX(${to}px)`,opacity:to===0?1:.2}],{duration:reduced()?0:enter?230:160,delay:reduced()?0:i*12,easing:'cubic-bezier(.2,.8,.25,1)',fill:'both'});
  return animation.finished.catch(()=>{}).then(()=>{animation.cancel();row.style.transform='';row.style.opacity='';});
 });
 await Promise.all(jobs);field.classList.remove('page-moving');delete field.dataset.dragOffset;
}
export async function turnPage(change,direction,offset=0){
 const field=document.querySelector('.card-field');if(!field)return;
 field.classList.add('page-moving');
 if(reduced()){change();return;}
 if(!direction){await move(field,offset,0);return;}
 await move(field,offset,-direction*field.clientWidth);
 change();const next=document.querySelector('.card-field');if(!next)return;
 next.classList.add('page-moving');await move(next,direction*next.clientWidth,0,true);
}
