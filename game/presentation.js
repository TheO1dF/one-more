import { icon } from './cards.js';
import {diceFaces} from './stakes.js';
import { drawD20, diceSize } from './d20.js';
import {cardBackArt} from './art.js';
import {cancelEffects,emitEffect} from './tool-effects.js';

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
  const animation = el.animate(frames, { duration: reduced() ? 60 : 450, easing: 'ease-in-out', fill: 'both', ...options, ...(reduced() ? { duration: 60, delay: 0 } : {}) });
  running.add(animation);
  try { await animation.finished; } catch {}
  running.delete(animation);
}
function rect(selector) { return document.querySelector(selector)?.getBoundingClientRect(); }
function back() { return `<div class="flying-back">${cardBackArt()}</div>`; }
export function rememberTable() {
  return new Map([...document.querySelectorAll('.card-seat')].filter(el=>el.offsetParent!==null).map(el => {
    const tile = el.querySelector('.tile');
    return [Number(tile.dataset.uid), { rect: el.getBoundingClientRect(), angle: Number(tile.dataset.angle), tapped: tile.classList.contains('tapped') }];
  }));
}
export async function moveTable(previous) {
  const jobs = [];
  for (const seat of document.querySelectorAll('.card-seat')) {
    if(seat.offsetParent===null) continue;
    const tile = seat.querySelector('.tile'), old = previous.get(Number(tile.dataset.uid));
    if (!old) continue;
    const now = seat.getBoundingClientRect(), tapped = tile.classList.contains('tapped'), angle = Number(tile.dataset.angle);
    if (old.tapped !== tapped) jobs.push(animate(tile, [{ transform: `rotate(${old.angle + (old.tapped ? 90 : 0)}deg)` }, { transform: `rotate(${angle + (tapped ? 90 : 0)}deg)` }], { duration: 380, easing: 'cubic-bezier(.2,.85,.3,1)', fill: 'none' }));
    const dx = old.rect.x+old.rect.width/2-now.x-now.width/2, dy = old.rect.y+old.rect.height/2-now.y-now.height/2, scale=old.rect.height/now.height;
    if (Math.abs(dx)+Math.abs(dy)>2||Math.abs(scale-1)>.01) jobs.push(animate(seat, [{ transform: `translate(${dx}px,${dy}px) scale(${scale})` }, { transform: 'translate(0,0) scale(1)' }], { duration: 320, fill: 'none' }));
  }
  await Promise.all(jobs);
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
  if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
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
  if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
 if(generation===token){layer().innerHTML='';layer().className='';}
}
