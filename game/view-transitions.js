import {animateAtRate} from './frame-clock.js';
import {reducedMotion} from './motion.js';
import {rememberTable,moveTable} from './presentation.js';

// Selection redraws keep the player's place in long event card rows.
export function retainEncounterViewport(render){
 const shell=document.querySelector('.encounter-shell');
 if(!shell){render();return;}
 const selector='.encounter-shell,.dealer-foods,.dealer-offers';
 const positions=[...document.querySelectorAll(selector)].map(el=>({left:el.scrollLeft,top:el.scrollTop}));
 const page=document.scrollingElement,top=page.scrollTop,left=page.scrollLeft;
 const active=document.activeElement;
 const focus=shell.contains(active)&&active.matches('[data-action="event-pick"]')?{...active.dataset}:null;
 render();
 if(focus){
  const replacement=[...document.querySelectorAll('.encounter-shell [data-action="event-pick"]')].find(el=>el.dataset.role===focus.role&&el.dataset.uid===focus.uid&&el.dataset.id===focus.id);
  replacement?.focus({preventScroll:true});
 }
 document.querySelectorAll(selector).forEach((el,i)=>{if(positions[i]){el.scrollLeft=positions[i].left;el.scrollTop=positions[i].top;}});
 page.scrollLeft=left;page.scrollTop=top;
}

function visibleSeats(){
 const field=document.querySelector('.card-field');if(!field)return [];
 const bounds=field.getBoundingClientRect();
 return [...field.querySelectorAll('.card-seat')].filter(el=>{
  const r=el.getBoundingClientRect();
  return el.offsetParent!==null&&r.right>bounds.left&&r.left<bounds.right&&r.bottom>bounds.top&&r.top<bounds.bottom;
 });
}

export async function animateTidyTable(change,{expanding,hiddenIds}){
 if(reducedMotion()){change();return;}
 const previous=rememberTable(),ids=new Set(hiddenIds),animations=[];
 const animate=(el,frames,duration)=>{
  if(!el.animate)return Promise.resolve();
  const animation=animateAtRate(el,frames,{duration,easing:'cubic-bezier(.2,.8,.25,1)',fill:'both'});
  animations.push(animation);return animation.finished.catch(()=>{});
 };
 try{
  if(!expanding){
   await Promise.all(visibleSeats().filter(el=>ids.has(Number(el.querySelector('.tile').dataset.uid))).map(el=>animate(el,[
    {opacity:1,scale:'1',translate:'0 0'},
    {opacity:0,scale:'.25',translate:'0 -24px'},
   ],180)));
  }
  change();
  const jobs=[moveTable(previous)];
  if(expanding)for(const el of visibleSeats()){
   if(!ids.has(Number(el.querySelector('.tile').dataset.uid)))continue;
   jobs.push(animate(el,[{opacity:0,scale:'.6',translate:'0 -18px'},{opacity:1,scale:'1',translate:'0 0'}],240));
  }
  await Promise.all(jobs);
 }finally{animations.forEach(animation=>animation.cancel());}
}
