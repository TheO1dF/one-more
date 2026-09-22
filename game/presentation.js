import {animateAtRate} from './frame-clock.js';
import {requestGameFrame,cancelGameFrame} from './frame-clock.js';
import { icon } from './cards.js';
import {diceFaces} from './stakes.js';
import { drawD20, diceSize } from './d20.js';
import {cardBackArt} from './art.js';
import {cancelEffects,emitEffect} from './tool-effects.js';
import {stapleStack,dealerStapler} from './staple-view.js';
import {dealerHand,dealerGrip,eventCard} from './dealer-art.js';
import {autoPairArt} from './reward-view.js';

const layer = () => document.querySelector('#performance');
let generation = 0;
const running = new Set();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
export function cancelPresentation() {
  cancelEffects();
  generation++;
  for (const animation of running) animation.cancel();
  running.clear();
  if (layer()) { layer().innerHTML = ''; layer().className = ''; delete layer().dataset.blast; }
}
function begin(type, lang) {
  cancelPresentation();
  const token = generation;
  layer().className = 'performing ' + type;
  layer().innerHTML = `<button class="skip-performance" data-action="skip-animation">${lang === 'en' ? 'Skip animation' : '跳过动画'}</button>`;
  return token;
}
async function animate(el, frames, options = {}) {
  if (!el?.animate) return;
  const animation = animateAtRate(el,frames, { duration: reduced() ? 60 : 450, easing: 'ease-in-out', fill: 'both', ...options, ...(reduced() ? { duration: 60, delay: 0 } : {}) });
  running.add(animation);
  try { await animation.finished; } catch {}
  running.delete(animation);
}
function rect(selector) { return document.querySelector(selector)?.getBoundingClientRect(); }
function back() { return `<div class="flying-back">${cardBackArt()}</div>`; }
export function rememberTable() {
  return new Map([...document.querySelectorAll('.card-seat')].filter(el=>el.offsetParent!==null).map(el => {
    const tile = el.querySelector('.tile');
    return [Number(tile.dataset.uid), { rect: el.getBoundingClientRect(), angle: Number(tile.dataset.angle), tapped: tile.classList.contains('tapped'),pair:Number(tile.dataset.pair)||null,cardHeight:parseFloat(getComputedStyle(tile).height) }];
  }));
}
export async function moveTable(previous) {
  const jobs = [];
  for (const seat of document.querySelectorAll('.card-seat')) {
    if(seat.offsetParent===null) continue;
    const tile = seat.querySelector('.tile'), old = previous.get(Number(tile.dataset.uid));
    if (!old) continue;
    const now = seat.getBoundingClientRect(), tapped = tile.classList.contains('tapped'), angle = Number(tile.dataset.angle);
    if (old.tapped !== tapped) jobs.push(animate(tile, [{ transform: `rotate(${old.angle + (old.tapped ? 90 : 0)}deg)` }, { transform: `rotate(${angle + (tapped ? 90 : 0)}deg)` }], { duration: 280, easing: 'cubic-bezier(.2,.85,.3,1)', fill: 'none' }));
    const dx = old.rect.x+old.rect.width/2-now.x-now.width/2, dy = old.rect.y+old.rect.height/2-now.y-now.height/2, scale=(old.cardHeight||old.rect.height)/(parseFloat(getComputedStyle(tile).height)||now.height);
    const joining=!!tile.dataset.pair&&Number(tile.dataset.pair)!==old.pair;
    if(joining){
      jobs.push(animate(seat,[{transform:`translate(${dx}px,${dy}px) scale(${scale})`},{transform:`translate(${dx*.32}px,${dy*.3-20}px) scale(1.06)`,offset:.55},{transform:'translate(0,0) scale(1)'}],{duration:340,easing:'cubic-bezier(.2,.8,.25,1)',fill:'none'}));
      jobs.push(animate(tile,[{transform:`rotate(${old.angle}deg)`},{transform:`rotate(${angle}deg)`}],{duration:340,fill:'none'}));
    }else if (Math.abs(dx)+Math.abs(dy)>2||Math.abs(scale-1)>.01) jobs.push(animate(seat, [{ transform: `translate(${dx}px,${dy}px) scale(${scale})` }, { transform: 'translate(0,0) scale(1)' }], { duration: 240, fill: 'none' }));
  }
  await Promise.all(jobs);
}
export async function autoPairReward(lang='zh',cue=()=>{}){
 const token=begin('reward-performance',lang),stage=document.createElement('section');stage.className='reward-stage';stage.setAttribute('role','status');
 const en=lang==='en';
 stage.innerHTML=`<small>${en?'TEN TABLES CLEARED':'十桌通关奖励'}</small><div class="reward-trophy"><svg class="reward-rays" viewBox="-100 -100 200 200" aria-hidden="true">${Array.from({length:12},(_,i)=>`<path d="M0 0 98 -9 98 9Z" transform="rotate(${i*30})"/>`).join('')}</svg>${autoPairArt()}<span class="reward-sheen"></span></div><h2>${en?'Auto-pair tongs':'自动配对钳'}</h2><p>${en?'In endless mode, switch AUTO PAIR on in the pledged-item bar. Revealed foods pair automatically.':'进入无限后，在抵押物栏开启「自动配对」。翻出食材，即可自动配对。'}</p>`;
 layer().append(stage);
 if(generation!==token)return;
 cue('reward');
 for(let i=0;i<24;i++){const star=document.createElement('i'),angle=i*2.39996,r=110+(i%5)*26;star.className='reward-spark';star.style.cssText=`--x:${Math.cos(angle)*r}px;--y:${Math.sin(angle)*r}px;--size:${9+i%4*5}px;--delay:${i%6*.07}s`;stage.append(star);}
 await animate(stage,[{opacity:0,scale:'.72',translate:'0 35px'},{opacity:1,scale:'1.035',translate:'0 -5px',offset:.7},{opacity:1,scale:'1',translate:'0 0'}],{duration:420,easing:'cubic-bezier(.2,.9,.3,1)'});
 if(generation!==token)return;
 await animate(stage,[{opacity:1},{opacity:1}],{duration:2100});
 if(generation===token)cancelPresentation();
}
export async function revealCard(uid, lang = 'zh', isBomb = false, onBlast = () => {}) {
  const token = begin('reveal-performance', lang);
  const target = document.querySelector(`.tile[data-uid="${uid}"]`), field = document.querySelector('.card-field');
  if (!target) { cancelPresentation(); return; }

  const end = target.getBoundingClientRect(), origin = rect('#deck-draw') || end, table = rect('.casino-table') || end;
  const computed=getComputedStyle(target),width=parseFloat(computed.width),height=parseFloat(computed.height);
  const x = end.x + end.width / 2 - width / 2, y = end.y + end.height / 2 - height / 2;
  const midX = table.x + table.width * .5 - width / 2, midY = table.y + table.height * .44 - height / 2;
  const flying = document.createElement('div'); flying.className = 'flying-card';
  flying.style.cssText = `left:${origin.x}px;top:${origin.y}px;width:${width}px;height:${height}px;--card:${getComputedStyle(target).getPropertyValue('--card')}`;
  flying.innerHTML = `<div class="flip-inner"><div class="flip-back">${back()}</div><div class="flip-front"></div></div>`;
  const face=target.cloneNode(true),sources=[target,...target.querySelectorAll('*')],copies=[face,...face.querySelectorAll('*')];
  sources.forEach((source,i)=>{const style=getComputedStyle(source);copies[i].style.cssText=[...style].filter(p=>p!=='visibility').map(p=>`${p}:${style.getPropertyValue(p)};`).join('');copies[i].style.visibility='visible';});
  face.classList.add('flying-face');face.removeAttribute('data-action');face.removeAttribute('data-uid');
  Object.assign(face.style,{position:'relative',left:'auto',top:'auto',margin:'0',transform:'none',translate:'none',rotate:'none',visibility:'visible',transition:'none',animation:'none',pointerEvents:'none',width:width+'px',height:height+'px',borderWidth:(Math.ceil(parseFloat(computed.borderTopWidth)*1000)/1000)+'px'});
  flying.querySelector('.flip-front').append(face);
  layer().append(flying); target.style.visibility = 'hidden';
  const angle = Number(target.dataset.angle) + (target.classList.contains('tapped') ? 90 : 0);
  await Promise.all([
    animate(flying, [
      { transform: 'translate(0,0) scale(.76) rotate(-7deg)', offset: 0 },
      { transform: `translate(${midX - origin.x}px,${midY - origin.y}px) scale(1.14) rotate(3deg)`, offset: .42 },
      { transform: `translate(${x - origin.x}px,${y - origin.y}px) scale(1) rotate(${angle}deg)`, offset: 1 },
    ], { duration: 480, easing: 'cubic-bezier(.22,.62,.32,1)' }),
    animate(flying.querySelector('.flip-inner'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)', offset: .16 }, { transform: 'rotateY(180deg)', offset: .58 }, { transform: 'rotateY(180deg)' }], { duration: 480 }),
  ]);
  if (generation !== token) return;
  target.style.visibility = '';
  if (isBomb) {
    flying.remove();
    await explode(token, target, table, onBlast);
  }
  if (generation === token) { layer().innerHTML = ''; layer().className = ''; }
}
export async function stapleCards(s,bundle,lang='zh',cue=()=>{}){
 const token=begin('staple-performance',lang),stage=document.createElement('div');stage.className='staple-stage';
 stage.innerHTML=`<div class="staple-caption">${lang==='en'?'RANDOM STAPLE':'随机装订'}<small>${bundle.permanent?(lang==='en'?'3 cards · FREE · REBINDS EACH TABLE':'3张牌 · 免费 · 每桌重新装订'):(lang==='en'?'3 cards · 4 banked points':'3张牌 · 消耗4分')}</small></div>${stapleStack(s,bundle,lang)}`;
 const stack=stage.querySelector('.stapled-stack');stack.insertAdjacentHTML('beforeend',`<div class="staple-machine">${dealerStapler()}</div>`);layer().append(stage);
 const machine=stage.querySelector('.staple-machine'),pin=stage.querySelector('.staple-pin');
 pin.style.visibility='hidden';machine.style.opacity='0';stage.dataset.stage='gather';
 await Promise.all([...stage.querySelectorAll('.packet-card')].map((el,i)=>animate(el,[{translate:`${(i-1)*170}px ${100+i*18}px`,rotate:`${i%2?24:-22}deg`,opacity:0},{translate:'0 0',rotate:'0deg',opacity:1}],{duration:300,delay:i*65})));
 if(generation!==token)return;
 await animate(machine,[{translate:'-95px -240px',opacity:0},{translate:'-16px -24px',opacity:1,offset:.7},{translate:'0 0',opacity:1}],{duration:290});
 if(generation!==token)return;stage.dataset.stage='press';
 await animate(machine,[{scale:'1'},{scale:'.975'}],{duration:120,easing:'cubic-bezier(.6,0,1,.6)'});
 if(generation!==token)return;cue('staple');pin.style.visibility='visible';stage.dataset.stage='stapled';
 await animate(machine,[{scale:'.975'},{scale:'.975',offset:.25},{scale:'1'}],{duration:150});
 if(generation!==token)return;
 await animate(machine,[{translate:'0 0',opacity:1},{translate:'-95px -240px',opacity:0}],{duration:280});
 if(generation===token){layer().innerHTML='';layer().className='';}
}
export async function revealStapledCards(before,bundle,lang='zh',cue=()=>{}){
 const token=begin('unstaple-performance',lang);
 const targets=bundle.uids.map(uid=>document.querySelector(`.tile[data-uid="${uid}"]`));
 if(targets.some(el=>!el)){cancelPresentation();return;}
 const rects=targets.map(el=>el.getBoundingClientRect()),width=Math.min(128,Math.floor((innerWidth-60)/bundle.uids.length)),height=width*182/128;
 const cx=innerWidth/2,cy=Math.max(150,Math.min(innerHeight-190,innerHeight*.46));
 const origin=rect('#deck-draw')||rects[0],stage=document.createElement('div');stage.className='unstaple-stage';stage.style.cssText=`left:${cx-width/2}px;top:${cy-height/2}px`;
 stage.innerHTML=stapleStack(before,bundle,lang,true);const stack=stage.querySelector('.stapled-stack');stack.style.setProperty('--packet-w',width+'px');stack.style.setProperty('--packet-h',height+'px');layer().append(stage);targets.forEach(el=>el.style.visibility='hidden');
 try{
  stage.dataset.stage='draw';await animate(stage,[{translate:`${origin.x-cx+width/2}px ${origin.y-cy+height/2}px`,scale:'.65',rotate:'-8deg'},{translate:'0 0',scale:'1',rotate:'0deg'}],{duration:270});
  if(generation!==token)return;
  stage.dataset.stage='unpin';cue('unstaple');const pin=stage.querySelector('.staple-pin');
  await animate(pin,[{translate:'0 0',scale:'1',rotate:'0deg',opacity:1},{translate:'0 -5px',scale:'1.08',rotate:'-8deg',opacity:1,offset:.25},{translate:'25px -45px',scale:'1',rotate:'35deg',opacity:1,offset:.6},{translate:'90px -25px',scale:'.9',rotate:'145deg',opacity:0}],{duration:270});
  if(generation!==token)return;stage.querySelector('.packet-size').style.visibility='hidden';stage.dataset.stage='fan';
  const cards=[...stage.querySelectorAll('.packet-card')],middle=(cards.length-1)/2,spread=Math.min(146,(innerWidth-width-40)/(cards.length-1));
  // Preserve the same screen position when the freed cards change their pivot to the centre.
  const starts=cards.map(el=>{const style=getComputedStyle(el),[ox,oy]=style.transformOrigin.split(' ').map(parseFloat),matrix=new DOMMatrix(style.transform),dx=ox-width/2,dy=oy-height/2;const centered=new DOMMatrix().translate(dx,dy).multiply(matrix).translate(-dx,-dy).toString();el.style.transformOrigin='center';el.style.transform=centered;return centered;});
  const fan=i=>`translate(${(i-middle)*spread}px,${Math.abs(i-middle)*9}px) rotate(${(i-middle)*7}deg)`;
  await Promise.all(cards.flatMap((el,i)=>[
   animate(el,[{transform:starts[i]},{transform:fan(i)}],{duration:300,delay:i*45}),
   animate(el.querySelector('.packet-flip'),[{transform:'rotateY(180deg)'},{transform:'rotateY(0deg)'}],{duration:270,delay:i*45})
  ]));
  if(generation!==token)return;cue('draw');stage.dataset.stage='land';
  await Promise.all(cards.map((el,i)=>{
   const r=rects[i],angle=Number(targets[i].dataset.angle),w=parseFloat(getComputedStyle(targets[i]).width),h=parseFloat(getComputedStyle(targets[i]).height);
   return animate(el,[{transform:fan(i)},{transform:`translate(${r.x+r.width/2-cx}px,${r.y+r.height/2-cy}px) scale(${w/width},${h/height}) rotate(${angle}deg)`}],{duration:280,delay:i*35});
  }));
 }finally{
  targets.forEach(el=>el.style.visibility='');
  if(generation===token){layer().innerHTML='';layer().className='';}
 }
}
export async function dealerPresentation(before,after,action,lang='zh',cue=()=>{}){
 const receipt=after.eventReceipt,prize=action.type==='stop'?after.wagerPrize:null,en=lang==='en';
 const token=begin('dealer-performance',lang),stage=document.createElement('div');stage.className='dealer-stage';layer().append(stage);
 const hand=(side)=>{const el=document.createElement('div');el.className='dealer-stage-hand';el.style.cssText=`left:${side==='left'?'-65%':'65%'};top:-5%;rotate:${side==='left'?-16:16}deg`;el.innerHTML=dealerHand();stage.append(el);return el;};
 const right=hand('right');
 if(receipt?.removed?.length&&receipt.id!=='trade'){
  right.remove();stage.classList.add('tear-stage');
  const c=receipt.removed[0],zig='50% 0,49% 9%,52% 19%,48% 32%,52% 44%,47% 57%,51% 68%,48% 83%,50% 100%';
  stage.innerHTML=`<div class="tear-intact">${eventCard(c,lang)}</div>`+['left','right'].map(side=>`<div class="tear-grip-group tear-${side}"><div class="tear-piece" style="clip-path:polygon(${side==='left'?'0 0,'+zig+',0 100%':zig+',100% 100%,100% 0'})">${eventCard(c,lang)}</div><div class="tear-hand">${dealerGrip(side)}</div></div>`).join('')+`<h2>${en?'REMOVED FROM DECK':'永久移出牌组'}</h2>`;
  const groups=[...stage.querySelectorAll('.tear-grip-group')],hands=[...stage.querySelectorAll('.tear-hand')];
  stage.dataset.stage='grip';
  await Promise.all(hands.map((el,i)=>animate(el,[{translate:`${i?60:-60}px -45px`,opacity:0},{translate:'0 0',opacity:1}],{duration:280})));
  if(generation!==token)return;stage.dataset.stage='bend';cue('paper-slide');
  await Promise.all(groups.map((el,i)=>animate(el,[{transform:'rotate(0deg)'},{transform:`rotate(${i?-2:2}deg) rotateY(${i?-7:7}deg)`}],{duration:180})));
  if(generation!==token)return;stage.dataset.stage='tear';cue('tear-start');
  await Promise.all(groups.map((el,i)=>animate(el,[{transform:`rotate(${i?-2:2}deg) rotateY(${i?-7:7}deg)`},{transform:`rotate(${i?5:-5}deg) rotateY(${i?9:-9}deg)`}],{duration:200,easing:'cubic-bezier(.7,0,.3,1)'})));
  if(generation!==token)return;stage.dataset.stage='peel';cue('tear');
  await Promise.all(groups.map((el,i)=>animate(el,[{transform:`rotate(${i?5:-5}deg) rotateY(${i?9:-9}deg)`},{transform:`translate(${i?52:-52}px,${i?-16:16}px) rotate(${i?16:-16}deg) rotateY(${i?16:-16}deg)`}],{duration:360})));
  if(generation!==token)return;stage.dataset.stage='discard';
  await Promise.all(groups.map((el,i)=>animate(el,[{transform:`translate(${i?52:-52}px,${i?-16:16}px) rotate(${i?16:-16}deg) rotateY(${i?16:-16}deg)`,opacity:1},{transform:`translate(${i?190:-190}px,120px) rotate(${i?36:-36}deg)`,opacity:0}],{duration:280})));
 }else if(receipt?.id==='duplicate'){
  stage.innerHTML=`<div class="dealer-trade-card copy-original">${eventCard(receipt.copied,lang)}</div><div class="dealer-trade-card copy-new">${eventCard(receipt.copied,lang)}</div><h2>${en?'PERMANENT COPY':'永久复制'}</h2>`;
  cue('paper-slide');await Promise.all([animate(stage.querySelector('.copy-original'),[{translate:'0 0',rotate:'0deg'},{translate:'-65px 0',rotate:'-9deg'}],{duration:440}),animate(stage.querySelector('.copy-new'),[{translate:'0 0',rotate:'0deg',opacity:.2},{translate:'65px 0',rotate:'9deg',opacity:1}],{duration:440})]);
 }else if(receipt?.id==='trade'){
  stage.innerHTML=receipt.removed.map((c,i)=>`<div class="dealer-trade-card" style="transform:translate(${i?65:-65}px,25px) rotate(${i?8:-8}deg)">${eventCard(c,lang)}</div>`).join('')+`<h2>${en?'EXCHANGED':'成交'}</h2>`;const h=hand('right');
  await animate(h,[{translate:'100px -180px',opacity:0},{translate:'0 0',opacity:1}],{duration:210});if(generation!==token)return;cue('paper-slide');
  stage.dataset.stage='collect';await Promise.all([...stage.querySelectorAll('.dealer-trade-card'),h].map(el=>animate(el,[{translate:'0 0',opacity:1},{translate:'40px -300px',opacity:0}],{duration:300})));
  if(generation!==token)return;const gain=document.createElement('div');gain.className='dealer-trade-card';gain.innerHTML=eventCard(receipt.gained,lang);stage.append(gain);stage.dataset.stage='deliver';cue('paper-slide');await animate(gain,[{translate:'30px -250px',rotate:'8deg',opacity:0},{translate:'0 0',rotate:'0deg',opacity:1}],{duration:320});
 }else if(receipt?.id==='pawn'||prize){
  stage.insertAdjacentHTML('afterbegin',`<div class="dealer-object">${icon('relic-'+(prize?.id||receipt.relic))}</div><h2>${prize?(en?'WAGER WON':'赌约兑现'):(en?'SOLD':'典当成交')}</h2>`);
  const object=stage.querySelector('.dealer-object');stage.dataset.stage='appraise';
  await Promise.all([animate(right,[{translate:'80px -170px',opacity:0},{translate:'0 0',opacity:1}],{duration:240}),animate(object,[{rotate:'-9deg'},{rotate:'8deg',offset:.55},{rotate:'-2deg'}],{duration:330})]);
  if(generation!==token)return;cue('chips');
  if(!prize){await Promise.all([object,right].map(el=>animate(el,[{translate:'0 0',opacity:1},{translate:'50px -250px',opacity:0}],{duration:240})));if(generation!==token)return;stage.insertAdjacentHTML('beforeend',`<div class="dealer-chips"><b>+${receipt.amount}</b></div>`);await animate(stage.querySelector('.dealer-chips'),[{translate:'0 -160px',rotate:'-18deg',opacity:0},{translate:'0 5px',rotate:'4deg',opacity:1,offset:.75},{translate:'0 0',rotate:'0deg',opacity:1}],{duration:320});}
 }else{
  const {SETBACKS}=await import('./dealer-events.js'),{ROUTES}=await import('./routes.js');const definition=SETBACKS[receipt?.id]||ROUTES[receipt?.id]||{name:['确认','CONFIRMED'],icon:'relic-scale'};
  stage.insertAdjacentHTML('afterbegin',`<div class="dealer-object">${icon(definition.icon)}</div><h2>${definition.name[en?1:0]}${receipt?.amount?` −${receipt.amount}`:''}</h2>`);
  await animate(right,[{translate:'90px -200px',opacity:0},{translate:'0 0',opacity:1,offset:.7},{translate:'0 6px',opacity:1}],{duration:340});if(generation!==token)return;cue('staple');await animate(right,[{translate:'0 6px',opacity:1},{translate:'90px -200px',opacity:0}],{duration:210});
 }
 if(generation===token){layer().innerHTML='';layer().className='';}
}
async function explode(token, target, table, onBlast) {
  const box=target.getBoundingClientRect(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  const stage=document.createElement('div');stage.className='print-blast';stage.style.cssText=`--blast-x:${cx}px;--blast-y:${cy}px`;
  stage.innerHTML=`<div class="impact-vignette"></div><div class="impact-bomb" style="left:${cx-85}px;top:${cy-85}px">${icon('bomb')}</div>`;layer().append(stage);layer().dataset.blast='fuse';
  const bomb=stage.querySelector('.impact-bomb');
  await animate(bomb,[{scale:'.7',rotate:'-14deg'},{scale:'1.25',rotate:'5deg',offset:.7},{scale:'1.16',rotate:'-2deg'}],{duration:250});
  if(generation!==token)return;
  // A single cut to cream, then an ink silhouette: impact without strobing.
  const cut=document.createElement('div');cut.className='impact-cut';stage.append(cut);layer().dataset.blast='impact';onBlast();
  await animate(cut,[{opacity:1},{opacity:1}],{duration:75});
  if(generation!==token)return;
  cut.remove();bomb.remove();target.style.visibility='hidden';layer().dataset.blast='burst';
  const burst=(n,inner,outer)=>Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n,r=i%2?inner:outer;return `${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ');
  stage.insertAdjacentHTML('beforeend',`<svg class="impact-burst" viewBox="-500 -500 1000 1000" style="left:${cx-400}px;top:${cy-400}px"><polygon points="${burst(13,155,460)}" fill="#161936"/><polygon points="${burst(11,105,335)}" fill="#ff4928"/><polygon points="${burst(9,68,230)}" fill="#edbd38"/><polygon points="${burst(8,32,120)}" fill="#fff8e8"/></svg><div class="impact-wave" style="left:${cx}px;top:${cy}px"></div>`);
  const jobs=[animate(stage.querySelector('.impact-burst'),[{scale:'.2',rotate:'-12deg',opacity:1},{scale:'1.05',rotate:'2deg',opacity:1,offset:.17},{scale:'1.2',rotate:'5deg',opacity:1,offset:.38},{scale:'1.35',rotate:'8deg',opacity:0}],{duration:720,easing:'cubic-bezier(.15,.8,.25,1)'}),animate(stage.querySelector('.impact-wave'),[{scale:'.1',opacity:1},{scale:'17',opacity:0}],{duration:560})];
  for(let i=0;i<30;i++){
    const shard=document.createElement('i');shard.className='impact-debris';const a=i*2.399,r=180+i%7*58,x=Math.cos(a)*r,y=Math.sin(a)*r;
    shard.style.cssText=`left:${cx}px;top:${cy}px;width:${8+i%4*7}px;height:${11+i%3*9}px;background:${['#161936','#574798','#fff8e8','#ff4928'][i%4]};clip-path:polygon(0 0,100% 25%,70% 100%,15% 80%)`;stage.append(shard);
    jobs.push(animate(shard,[{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${x}px ${y}px`,rotate:`${i*37}deg`,opacity:1,offset:.65},{translate:`${x*1.18}px ${y+130}px`,rotate:`${i*59}deg`,opacity:0}],{duration:800+i%5*35}));
  }
  if(!reduced()){
    jobs.push(animate(document.querySelector('.game-room'),[{translate:'0 0'},{translate:'-13px 7px'},{translate:'11px -6px'},{translate:'-7px 3px'},{translate:'3px -2px'},{translate:'0 0'}],{duration:310,fill:'none'}));
    for(const tile of document.querySelectorAll('.card-row .tile')){if(tile===target)continue;const r=tile.getBoundingClientRect(),dx=(r.x+r.width/2-cx)*.32,dy=(r.y+r.height/2-cy)*.25; jobs.push(animate(tile,[{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${dx}px ${dy-26}px`,rotate:`${dx*.12}deg`,opacity:.8,offset:.38},{translate:`${dx*1.3}px ${dy+70}px`,rotate:`${dx*.2}deg`,opacity:0}],{duration:800,fill:'none'}));}
  }
  await Promise.all(jobs);if(generation===token)delete layer().dataset.blast;
}
export async function opening(lang = 'zh', bomb = true, count = 1, added = 0) {
  const token = begin('opening-performance', lang);
  const table = rect('.casino-table') || { x: innerWidth * .2, y: 100, width: innerWidth * .65, height: innerHeight * .6 };
  const center = { x: table.x + table.width / 2 - 53, y: table.y + table.height / 2 - 77 };
  const stage = document.createElement('div'); stage.className = 'shuffle-stage'; stage.style.cssText = `left:${center.x}px;top:${center.y}px;`;
  stage.innerHTML = `<div class="shuffle-caption">${bomb?`${lang==='en'?'BOMBS':'炸弹'} ×${count}${added?` · +${added}`:''}`:lang==='en'?'SHUFFLE':'洗牌'}</div><div class="shuffle-pack">${Array.from({ length: 12 }, (_, i) => `<div class="shuffle-card" style="--i:${i}">${back()}</div>`).join('')}</div>${bomb ? `<div class="inserting-bomb">${icon('bomb')}<b>${lang === 'en' ? 'BOMBS' : '炸弹'} ×${count}</b></div>` : ''}`;
  layer().append(stage);
  if (bomb) {
    await animate(stage.querySelector('.inserting-bomb'), [{ transform: 'translate(-140px,-45px) rotate(-12deg)', opacity: 0 }, { transform: 'translate(-140px,-45px) rotate(-12deg)', opacity: 1, offset: .25 }, { transform: 'translate(0,0) rotateY(180deg)', opacity: 1, offset: .88 }, { transform: 'translate(0,0) rotateY(180deg)', opacity: 0 }], { duration: 800 });
    if (generation !== token) return;
    stage.querySelector('.shuffle-caption').textContent = lang === 'en' ? 'SHUFFLE' : '洗牌';
  }
  await Promise.all([...stage.querySelectorAll('.shuffle-card')].map((el, i) => animate(el, [
    { transform: `translate(${i * .7}px,${-i * .55}px) rotate(0deg)` },
    { transform: `translate(${i % 2 ? 85 : -85}px,${i * -4}px) rotate(${i % 2 ? 13 : -13}deg)`, offset: .35 },
    { transform: `translate(${i % 2 ? -20 : 20}px,${i * -1.5}px) rotate(${i % 2 ? -4 : 4}deg)`, offset: .68 },
    { transform: `translate(${i * .7}px,${-i * .55}px) rotate(0deg)` },
  ], { duration: 820, delay: i * 17 })));
  if (generation !== token) return;
  const deck = rect('#deck-draw');
  if (deck) await animate(stage, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${deck.x - center.x}px,${deck.y - center.y}px) scale(.75)`, opacity: 0 }], { duration: 250 });
  if (generation === token) { layer().innerHTML = ''; layer().className = ''; }
}

let shakeSerial=0;
export async function shakeDice(){
 const canvases=[...document.querySelectorAll('canvas[data-d20="hand"]')];if(!canvases.length)return;
 const serial=++shakeSerial,start=performance.now();
 await new Promise(resolve=>{function frame(now){if(serial!==shakeSerial||!canvases[0].isConnected){resolve();return;}const t=Math.min(1,(now-start)/(reduced()?70:430));
  for(const c of canvases){const size=diceSize(c),value=+c.dataset.value;if(c.dataset.held==='true'){drawD20(c,{value,size});continue;}c.dataset.shaking=t<1?'true':'false';drawD20(c,{value,spin:t<1?[Math.sin(t*Math.PI*5)*(1-t),t*Math.PI*4,Math.sin(t*Math.PI*4)*.35]:[0,0,0],x:.5+Math.sin(t*Math.PI*6)*.07*(1-t),size});}
  if(t<1)requestGameFrame(frame);else resolve();}requestGameFrame(frame);});
}
export async function rollDice(result,lang='zh',gesture={},onSound=()=>{}){
 const token=begin('dice-performance',lang);shakeSerial++;
 const canvases=[...document.querySelectorAll('canvas[data-d20="tray"]')];if(!canvases.length){cancelPresentation();return;}
 const quiet=reduced(),start=performance.now(),duration=quiet?90:1450,faces=diceFaces(result);
 let impact=0;onSound(quiet?'dice-impact':'dice-throw',0);
 const side=Math.max(-1,Math.min(1,gesture.dx||0));
 await new Promise(resolve=>{function frame(now){if(generation!==token||!canvases[0].isConnected){resolve();return;}const t=Math.min(1,(now-start)/duration);
  if(!quiet)while(impact<3&&t>=[.38,.64,.83][impact])onSound('dice-impact',impact++);
  canvases.forEach((canvas,j)=>{const value=faces[j],size=diceSize(canvas);if(result.held?.[j]){drawD20(canvas,{value,size});canvas.dataset.rolling='false';return;}
   const nodes=[[j?.82:.18,.98],[j?.25:.76+side*.05,.28],[j?.62:.38,.52],[.53,.47],[.5,.5]],stops=[0,.38,.64,.83,1];let i=0;while(i<3&&t>stops[i+1])i++;
   const u=(t-stops[i])/(stops[i+1]-stops[i]),x=nodes[i][0]+(nodes[i+1][0]-nodes[i][0])*u,y=nodes[i][1]+(nodes[i+1][1]-nodes[i][1])*u,spin=(1-t)**2;
   canvas.dataset.rolling=t<1?'true':'false';drawD20(canvas,{value,spin:[spin*(Math.PI*6+side),spin*Math.PI*(8+j),spin*Math.PI*2],x,y:y-Math.sin(u*Math.PI)*.13*(1-t),size:size*(1+Math.sin(u*Math.PI)*.15*(1-t)),lift:Math.sin(u*Math.PI)*(1-t)});
  });
  if(t<1)requestGameFrame(frame);else resolve();}requestGameFrame(frame);});
 if(generation===token){layer().innerHTML='';layer().className='';}
}
