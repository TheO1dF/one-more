import {parcelArt,pressArt} from './reward-art.js';
import {eventCard,dealerGrip} from './dealer-art.js';

// Same timings in game and previews. The shared animator handles reduced motion and cancellation.
export async function performEconomy(kind,{stage,animate,current,cue,lang='zh',cards=[],receipt}){
 const en=lang==='en',move=(el,frames,duration)=>animate(el,frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)'});
 const pause=ms=>move(stage,[{opacity:1},{opacity:1}],ms);
 const cardMarkup=c=>`<div class="craft-card">${eventCard(c,lang)}</div>`;
 const debris=()=>`<div class="craft-sparks">${Array.from({length:16},()=>'<i></i>').join('')}</div>`;
 const setScene=html=>{stage.innerHTML=`<div class="craft-shadow"></div>${html}${debris()}`;};
 const burst=(y=52)=>Promise.all([...stage.querySelectorAll('.craft-sparks i')].map((el,i)=>{
  el.style.top=y+'%';const angle=i*Math.PI*2/16,radius=95+(i%4)*23,x=Math.cos(angle)*radius,dy=Math.sin(angle)*radius;
  return move(el,[{opacity:0,transform:'translate3d(0,0,0) scale(.3)'},{opacity:1,transform:`translate3d(${x*.4}px,${dy*.4}px,45px) rotate(${i*17}deg)`,offset:.22},{opacity:0,transform:`translate3d(${x}px,${dy+30}px,-40px) rotateX(160deg) rotateZ(${i*39}deg) scale(.5)`}],650);
 }));
 const glint=async card=>{
  const strip=document.createElement('span');strip.className='craft-glint';strip.innerHTML='<i></i>';card.append(strip);
  await move(strip.firstElementChild,[{transform:'translateX(-170px) skewX(-20deg)'},{transform:'translateX(190px) skewX(-20deg)'}],550);strip.remove();
 };
 const settle=(el,duration=500)=>move(el,[{transform:'translate3d(0,-22px,60px) rotateX(13deg) rotateY(-15deg) rotateZ(-7deg)'},{transform:'translate3d(0,4px,0) rotateX(-4deg) rotateY(6deg) rotateZ(3deg)',offset:.7},{transform:'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'}],duration);
 const untie=async band=>{cue('parcel-open');await Promise.all([move(band,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:'translate(25px,-15px) rotate(-8deg)',opacity:1,offset:.2},{transform:'translate(140px,-120px) rotate(45deg)',opacity:0}],650),burst()]);};
 stage.classList.add('craft-stage',`craft-${kind}`);
 if(kind==='press'){
  setScene(`<div class="press-inputs">${receipt.inputs.map(cardMarkup).join('')}</div>${pressArt()}<div class="press-result">${cardMarkup(receipt.pressed)}<b>×${receipt.pressed.pressWeight}</b></div><h2>${en?'PRESSED · ABILITY TRIGGERS ONCE':'压牌完成 · 能力仍触发一次'}</h2>`);
  const title=stage.querySelector('h2');title.style.visibility='hidden';
  cue('paper-slide');await Promise.all([...stage.querySelectorAll('.press-inputs .craft-card')].map((el,i)=>move(el,[{transform:`translate3d(${i?210:-210}px,-65px,80px) rotateX(38deg) rotateY(${i?-24:24}deg) rotateZ(${i?18:-18}deg)`},{transform:`translate3d(${i?5:-5}px,0,0) rotateX(62deg) rotateZ(${i?3:-3}deg)`}],550)));if(!current())return;
  const ram=stage.querySelector('.press-ram');cue('press-wind');await move(ram,[{translate:'0 0'},{translate:'0 70px',offset:.75},{translate:'0 96px'}],650);if(!current())return;
  cue('press-impact');await Promise.all([burst(68),move(stage,[{translate:'0 0'},{translate:'0 7px',offset:.16},{translate:'0 -3px',offset:.3},{translate:'0 2px',offset:.45},{translate:'0 0'}],320)]);if(!current())return;
  stage.querySelector('.press-inputs').style.visibility='hidden';
  await move(ram,[{translate:'0 96px'},{translate:'0 0'}],430);if(!current())return;
  const result=stage.querySelector('.press-result');result.style.visibility='visible';title.style.visibility='visible';cue('reward');
  await move(result,[{transform:'translate3d(0,64px,-50px) rotateX(58deg) scale(.7)'},{transform:'translate3d(0,-5px,50px) rotateX(-8deg) scale(1.04)',offset:.78},{transform:'translate3d(0,0,0) rotateX(0deg) scale(1)'}],600);if(!current())return;
  await glint(result.querySelector('.craft-card'));await pause(350);
 }else if(kind==='seal'||kind==='parcel-open'){
  const opening=kind==='parcel-open';setScene(`<div class="craft-parcel">${parcelArt()}</div><div class="parcel-contents">${cards.map(cardMarkup).join('')}</div><div class="craft-hand">${dealerGrip('right')}</div><h2>${opening?(en?'READY AT YOUR TABLE':'封包送达 · 就绪上桌'):(en?'SEALED FOR NEXT TABLE':'封包完成 · 下桌送达')}</h2>`);
  const parcel=stage.querySelector('.craft-parcel'),band=stage.querySelector('.parcel-band'),contents=[...stage.querySelectorAll('.craft-card')],hand=stage.querySelector('.craft-hand'),title=stage.querySelector('h2');title.style.visibility='hidden';
  if(!opening)band.style.opacity='0';
  cue('paper-slide');await Promise.all([settle(parcel),move(hand,[{transform:'translate3d(150px,-140px,60px) rotateZ(-18deg)',opacity:0},{transform:'translate3d(0,0,0) rotateZ(0deg)',opacity:1}],450)]);if(!current())return;
  if(opening){
   await untie(band);if(!current())return;
   await Promise.all([move(parcel,[{opacity:1},{opacity:0}],280),...contents.map((el,i)=>move(el,[{transform:'translate3d(0,20px,-40px) rotateX(35deg)',opacity:0},{transform:`translate3d(${i?95:-95}px,0,30px) rotateY(${i?-8:8}deg) rotateZ(${i?7:-7}deg)`,opacity:1}],650))]);
  }else{
   await Promise.all(contents.map((el,i)=>move(el,[{transform:`translate3d(${i?150:-150}px,-35px,100px) rotateY(${i?-22:22}deg) rotateZ(${i?12:-12}deg)`,opacity:1},{transform:'translate3d(0,8px,-20px) rotateX(10deg)',opacity:0}],650)));if(!current())return;
   cue('parcel-tie');await move(band,[{transform:'scale(1.45)',opacity:0},{transform:'scale(.96)',opacity:1,offset:.8},{transform:'scale(1)',opacity:1}],450);if(!current())return;
   await Promise.all([settle(parcel,350),burst()]);
  }
  if(!current())return;title.style.visibility='visible';cue('reward');
  await move(hand,[{transform:'translate3d(0,0,0)',opacity:1},{transform:'translate3d(160px,-100px,80px) rotateZ(12deg)',opacity:0}],350);if(!current())return;
  if(opening)await Promise.all(contents.map(glint));else await pause(500);
 }else if(kind==='open-reward'||kind==='take-pack'){
  const taking=kind==='take-pack';
  setScene(`${taking?'':`<div class="reward-bundle">${parcelArt()}</div>`}<div class="reward-fan">${taking?cards.map(cardMarkup).join(''):[0,1,2].map(()=>`<div class="craft-card">${parcelArt(false)}</div>`).join('')}</div><h2>${taking?(en?'ADDED TO YOUR DECK':'已加入牌组'):(en?'CHOOSE ONE PACKAGE':'三包选一')}</h2>`);
  const title=stage.querySelector('h2');title.style.visibility='hidden';
  if(!taking){await settle(stage.querySelector('.reward-bundle'),360);if(!current())return;await untie(stage.querySelector('.reward-bundle .parcel-band'));if(!current())return;}
  const items=[...stage.querySelectorAll('.reward-fan .craft-card')],mid=(items.length-1)/2;
  cue('paper-slide');await Promise.all([...(taking?[]:[move(stage.querySelector('.reward-bundle'),[{opacity:1},{opacity:0}],250)]),...items.map((el,i)=>move(el,[{transform:'translate3d(0,15px,-50px) rotateX(28deg)',opacity:0},{transform:`translate3d(${(i-mid)*125}px,${Math.abs(i-mid)*10}px,${20-Math.abs(i-mid)*10}px) rotateY(${(mid-i)*9}deg) rotateZ(${(i-mid)*7}deg)`,opacity:1}],700))]);if(!current())return;
  title.style.visibility='visible';cue('reward');await Promise.all(items.map(glint));await pause(400);if(!current())return;
  if(taking){cue('paper-slide');await Promise.all(items.map((el,i)=>move(el,[{opacity:1},{transform:`translate3d(${105+i*3}px,115px,-140px) rotateY(-25deg) rotateZ(8deg) scale(.6)`,opacity:0}],500)));}
 }
}
