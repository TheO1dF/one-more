import {slotMachineArt,slotImpactArt,slotPrizeHTML,reelsHTML,reelPlan,reelOffset,REEL_TIMES,leverPose} from './slot-art.js';
import {requestGameFrame,cancelGameFrame} from './frame-clock.js';

export async function showSlotMachine({offer,lang='zh',claimed=false,commit,cue=()=>{},motion=true}){
 const en=lang==='en',quiet=!motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const modal=document.createElement('dialog');modal.className='slot-dialog';modal.dataset.phase=claimed?'won':'arrival';
 modal.setAttribute('aria-label',en?'Skip-table prize machine':'跳桌奖励老虎机');
 modal.innerHTML=`<button class="slot-close" type="button" aria-label="${en?'Close':'关闭'}">×</button><div class="slot-scene"><div class="slot-floor"></div><div class="slot-impact">${slotImpactArt()}</div><div class="slot-body">${slotMachineArt(offer,claimed)}</div><div class="slot-pull-hint" aria-hidden="true">↓</div><p class="slot-prompt" role="status"></p></div><section class="slot-award" aria-live="polite"></section>`;
 document.body.append(modal);modal.showModal();document.documentElement.classList.add('slot-machine-open');
 const body=modal.querySelector('.slot-body'),machine=modal.querySelector('.slot-machine'),lever=modal.querySelector('.slot-lever'),prompt=modal.querySelector('.slot-prompt'),close=modal.querySelector('.slot-close'),hand=modal.querySelector('.slot-carry-hand'),fingers=modal.querySelector('.slot-carry-fingers'),thumb=modal.querySelector('.slot-carry-thumb');
 let phase=claimed?'won':'arrival',alive=true,frame=0,finishFrame=null,fastForward=false,drag=null,result=offer,resolveChoice;
 const choice=new Promise(resolve=>resolveChoice=resolve);
 const arm=f=>{const pose=leverPose(f);lever.querySelector('.slot-lever-rod').setAttribute('d',pose.rod);lever.querySelector('.slot-lever-shine').setAttribute('d',pose.shine);lever.querySelector('.slot-lever-knob').setAttribute('transform',`translate(${pose.x-499} ${pose.y-163})`);};
 const phaseTo=p=>{phase=p;modal.dataset.phase=p;lever.setAttribute('aria-disabled',String(p!=='ready'));lever.setAttribute('tabindex',p==='ready'?'0':'-1');close.setAttribute('aria-label',['pull','roll'].includes(p)?(en?'Skip animation':'跳过动画'):(en?'Close':'关闭'));};
 lever.setAttribute('aria-label',en?'Pull lever to spin':'拉下摇杆开始');
 const vibrate=pattern=>{if(!quiet&&typeof navigator.vibrate==='function')try{navigator.vibrate(pattern);}catch{}};
 function run(duration,draw){return new Promise(resolve=>{
  const start=performance.now(),length=quiet?Math.min(duration,100):duration;finishFrame=resolve;
  const step=now=>{if(!alive){finishFrame=null;resolve();return;}const elapsed=fastForward?duration:Math.min(duration,(now-start)/length*duration);draw(elapsed,duration);if(elapsed>=duration){finishFrame=null;resolve();}else frame=requestGameFrame(step);};frame=requestGameFrame(step);
 });}
 function done(confirm){if(!alive)return;alive=false;cancelGameFrame(frame);finishFrame?.();modal.close();modal.remove();document.documentElement.classList.remove('slot-machine-open');resolveChoice(confirm);}
 function leave(){if(['pull','roll'].includes(phase)){fastForward=true;return;}done(false);}
 close.addEventListener('click',leave);modal.addEventListener('cancel',e=>{e.preventDefault();leave();});
 modal.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();leave();}},{capture:true});
 function award(){
  if(!alive)return;phaseTo('won');arm(0);body.style.transform='';prompt.textContent='';
  const box=modal.querySelector('.slot-award');box.innerHTML=slotPrizeHTML(result.id,lang);
  box.querySelector('button').addEventListener('click',()=>{cue('slot-claim');done(true);});box.querySelector('button').focus({preventScroll:true});
 }
 async function pull(initial=0){
  if(phase!=='ready'||!alive)return;
  phaseTo('pull');prompt.textContent='';fastForward=false;
  try{result=commit();}catch{phaseTo('ready');prompt.textContent=en?'Please try again.':'请再拉一次。';arm(0);return;}
  cue('slot-lever-pull');vibrate(35);
  let teeth=0;
  await run(500,(t,d)=>{const p=t/d,down=p<.55?initial+(1-initial)*(1-(1-p/.55)**2):1-(p-.55)/.45;arm(down);
   if(!quiet){body.style.transform=`translate(${Math.sin(t*.075)*2}px,${Math.cos(t*.092)*1.5}px)`;const tooth=Math.floor(Math.min(.55,p)*8);if(tooth>teeth&&!fastForward){teeth=tooth;cue('slot-lever-ratchet');}}
  });
  if(!alive)return;phaseTo('roll');arm(0);
  const plans=[0,1,2].map(i=>reelPlan(offer.pool,result.id,i));
  // All three strips show the same saved prize; visual reels never roll game RNG.
  modal.querySelector('.slot-reels').innerHTML=reelsHTML(offer.pool,result.id);
  const reels=[...modal.querySelectorAll('.slot-reel')],stopped=[false,false,false];let lastTick=-200;
  reels.forEach((el,i)=>el.setAttribute('transform',`translate(${111+i*115} 86)`));
  await run(REEL_TIMES[2]+480,t=>{
   const running=REEL_TIMES.some(d=>t<d),amplitude=quiet?0:running?2.5:.6*Math.max(0,1-(t-REEL_TIMES[2])/200);
   body.style.transform=`translate(${Math.sin(t*.081)*amplitude}px,${Math.sin(t*.063)*amplitude}px) rotate(${Math.sin(t*.054)*amplitude*.13}deg)`;
   reels.forEach((el,i)=>{const offset=reelOffset(t,REEL_TIMES[i],plans[i].target);el.setAttribute('transform',`translate(${111+i*115} ${206-offset})`);
    if(!stopped[i]&&t>=REEL_TIMES[i]){stopped[i]=true;el.classList.add('slot-reel-stopped');cue('slot-reel-stop',String(i));vibrate(18);}
   });
   const gap=55+125*Math.min(1,(t/REEL_TIMES[2])**2);
   if(running&&t-lastTick>=gap&&!quiet&&!fastForward){cue('slot-roll');lastTick=t;}
  });
  if(!alive)return;body.style.transform='';cue('slot-win');vibrate([30,40,30]);award();
 }
 lever.addEventListener('pointerdown',e=>{if(phase!=='ready'||e.button>0)return;e.preventDefault();drag={id:e.pointerId,y:e.clientY,f:0,teeth:0};lever.setPointerCapture(e.pointerId);cue('slot-lever-grip');modal.classList.add('slot-pulling');});
 lever.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||phase!=='ready')return;drag.f=Math.max(0,Math.min(1,(e.clientY-drag.y)/(machine.getBoundingClientRect().height*.2)));arm(drag.f);if(!quiet)body.style.transform=`translate(${Math.sin(drag.f*35)*1.6}px,${Math.cos(drag.f*30)*1.6}px)`;const tooth=Math.floor(drag.f*4);if(tooth>drag.teeth){drag.teeth=tooth;cue('slot-lever-ratchet');}});
 lever.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;modal.classList.remove('slot-pulling');if(lever.hasPointerCapture(e.pointerId))lever.releasePointerCapture(e.pointerId);e.preventDefault();if(Math.abs(e.clientY-d.y)<8||d.f>=.45)void pull(d.f);else{arm(0);body.style.transform='';}});
 lever.addEventListener('pointercancel',()=>{drag=null;modal.classList.remove('slot-pulling');arm(0);body.style.transform='';});
 lever.addEventListener('click',e=>{e.stopPropagation();if(e.detail===0)void pull();});
 lever.addEventListener('keydown',e=>{if(['Space','Enter','ArrowDown'].includes(e.code)){e.preventDefault();e.stopPropagation();void pull();}});
 if(claimed){award();return choice;}
 cue('slot-throw');
 let impact=false,settle=false;
 await run(1400,t=>{
  if(quiet){body.style.opacity=String(Math.min(1,t/500));hand.style.opacity='0';return;}
  const p=Math.min(1,t/710),carry=Math.min(1,t/480),release=Math.max(0,Math.min(1,(t-480)/230)),start=-Math.max(innerHeight,700);
  const landed=t>=710,z=landed?(t-710)/690:0,amplitude=landed?(1-z)**2:0;
  const y=landed?-Math.abs(Math.sin(z*Math.PI*3))*26*amplitude:t<480?start+(-50-start)*(1-(1-carry)**3):-50*(1-release*release);
  const tilt=landed?Math.sin(z*Math.PI*7)*7*amplitude:t<480?-10+7*carry:-3+9*release;
  body.style.transform=`translate(${landed?Math.sin(z*30)*5*amplitude:40*(1-p)}px,${y}px) rotate(${tilt}deg) scale(1)`;
  hand.style.opacity=String(t<480?1:Math.max(0,1-(t-480)/210));hand.style.transform=`translateY(${-Math.max(0,t-480)*1.3}px)`;fingers.style.transform=`rotate(${-release*27}deg) translateY(${-release*12}px)`;thumb.style.transform=`rotate(${release*35}deg)`;
  modal.querySelector('.slot-floor').style.transform=`scale(${.45+.55*p})`;modal.querySelector('.slot-floor').style.opacity=String(.15+.85*p);
  if(landed&&!impact){impact=true;cue('slot-land');vibrate(60);modal.classList.add('slot-hit');}
  if(t>=1020&&!settle){settle=true;cue('slot-settle');}
 });
 if(alive){if(quiet)cue('slot-land');body.style.transform='';body.style.opacity='1';hand.style.opacity='0';phaseTo('ready');prompt.textContent=en?'PULL THE LEVER':'拉下摇杆';lever.focus({preventScroll:true});}
 return choice;
}
