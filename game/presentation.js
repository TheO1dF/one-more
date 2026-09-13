import { icon } from './cards.js';
import {diceFaces} from './stakes.js';
import { drawD20, diceSize } from './d20.js';
import {cardBackArt} from './art.js';

const layer = () => document.querySelector('#performance');
let generation = 0;
const running = new Set();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
export function cancelPresentation() {
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
      { transform: `translate(${midX - origin.x}px,${midY - origin.y}px) scale(1.45) rotate(2deg)`, offset: .37 },
      { transform: `translate(${midX - origin.x}px,${midY - origin.y}px) scale(1.45) rotate(0deg)`, offset: .7 },
      { transform: `translate(${x - origin.x}px,${y - origin.y}px) scale(1) rotate(${angle}deg)`, offset: 1 },
    ], { duration: 820, easing: 'cubic-bezier(.24,.6,.28,1)' }),
    animate(flying.querySelector('.flip-inner'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)', offset: .16 }, { transform: 'rotateY(180deg)', offset: .65 }, { transform: 'rotateY(180deg)' }], { duration: 820 }),
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
  const stage=document.createElement('div');stage.className='bomb-stage';
  const cx=Math.max(100,Math.min(innerWidth-100,table.x+table.width*.5)),cy=Math.max(130,Math.min(innerHeight-140,table.y+table.height*.46));
  stage.style.cssText=`left:${cx-90}px;top:${cy-110}px`;
  layer().insertAdjacentHTML('beforeend','<div class="bomb-scrim"></div>');
  stage.innerHTML=`<div class="burning-bomb">${icon('bomb')}<i class="fuse-ember"></i></div>`;layer().append(stage);
  layer().dataset.blast='fuse';
  await Promise.all([
    animate(stage.querySelector('.burning-bomb'),[{transform:'scale(.72) rotate(-8deg)'},{transform:'scale(1) rotate(4deg)',offset:.6},{transform:'scale(1.12) rotate(-3deg)'}],{duration:420}),
    animate(stage.querySelector('.fuse-ember'),[{transform:'scale(.5) rotate(0deg)'},{transform:'scale(1.7) rotate(90deg)'},{transform:'scale(.9) rotate(200deg)'},{transform:'scale(2) rotate(360deg)'}],{duration:420})
  ]);
  if(generation!==token)return;
  layer().dataset.blast='burst';onBlast();target.style.visibility='hidden';
  stage.innerHTML=`<div class="blast-ring"></div>${Array.from({length:10},()=>'<i class="blast-smoke"></i>').join('')}<div class="blast-mark"><svg viewBox="0 0 200 200" aria-hidden="true"><path d="m100 8 16 38 28-28 2 39 41-8-22 31 29 17-35 13 25 34-43-5-1 42-28-28-22 39-10-43-39 16 13-35-44-5 33-23-30-26 42 1-3-37 32 27Z" fill="#e8b76c" stroke="#423524" stroke-width="4"/><path d="m102 36 12 39 39-15-20 28 34 19-38 6 10 29-34-18-25 32 1-36-40-8 34-18-17-30 30 12Z" fill="#f5d99a"/></svg><b>BOOM!</b></div>${Array.from({length:24},()=>'<i class="blast-shard"></i>').join('')}`;
  const jobs=[animate(stage.querySelector('.blast-mark'),[{transform:'scale(.15) rotate(-12deg)',opacity:0},{transform:'scale(1.12) rotate(3deg)',opacity:1,offset:.19},{transform:'scale(1) rotate(0deg)',opacity:1,offset:.62},{transform:'scale(1.2)',opacity:0}],{duration:940}),animate(stage.querySelector('.blast-ring'),[{transform:'scale(.1)',opacity:1},{transform:'scale(4)',opacity:0}],{duration:740})];
  for(const [i,node] of [...stage.querySelectorAll('.blast-smoke')].entries()){const a=i*Math.PI*2/10,x=Math.cos(a)*115,y=Math.sin(a)*95; jobs.push(animate(node,[{transform:'translate(0,0) scale(.1)',opacity:0},{transform:`translate(${x*.5}px,${y*.5}px) scale(1)`,opacity:.8,offset:.3},{transform:`translate(${x}px,${y-70}px) scale(1.65)`,opacity:0}],{duration:1100,delay:i*10}));}
  for(const [i,node] of [...stage.querySelectorAll('.blast-shard')].entries()){const a=i*2.4,r=100+i%6*28,x=Math.cos(a)*r,y=Math.sin(a)*r; jobs.push(animate(node,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${x}px,${y}px) rotate(${i*43}deg)`,opacity:1,offset:.65},{transform:`translate(${x*1.1}px,${y+65}px) rotate(${i*63}deg)`,opacity:0}],{duration:850+i%4*60}));}
  if(!reduced()){
    jobs.push(animate(document.querySelector('.casino-table'),[{transform:'translate(0,0)'},{transform:'translate(-9px,4px)'},{transform:'translate(8px,-3px)'},{transform:'translate(-4px,0)'},{transform:'translate(0,0)'}],{duration:380,fill:'none'}));
    for(const tile of document.querySelectorAll('.card-row .tile')){if(tile===target)continue;const r=tile.getBoundingClientRect(),dx=(r.x+r.width/2-cx)*.14,dy=(r.y+r.height/2-cy)*.1; jobs.push(animate(tile,[{translate:'0 0',opacity:1},{translate:`${dx}px ${dy}px`,opacity:.65},{translate:`${dx*1.3}px ${dy+25}px`,opacity:.25}],{duration:850,fill:'none'}));}
  }
  await Promise.all(jobs);
  if(generation===token)delete layer().dataset.blast;
}
export async function opening(lang = 'zh', bomb = true) {
  const token = begin('opening-performance', lang);
  const table = rect('.casino-table') || { x: innerWidth * .2, y: 100, width: innerWidth * .65, height: innerHeight * .6 };
  const center = { x: table.x + table.width / 2 - 53, y: table.y + table.height / 2 - 77 };
  const stage = document.createElement('div'); stage.className = 'shuffle-stage'; stage.style.cssText = `left:${center.x}px;top:${center.y}px;`;
  stage.innerHTML = `<div class="shuffle-caption">${lang === 'en' ? bomb ? 'BOMB' : 'SHUFFLE' : bomb ? '炸弹' : '洗牌'}</div><div class="shuffle-pack">${Array.from({ length: 12 }, (_, i) => `<div class="shuffle-card" style="--i:${i}">${back()}</div>`).join('')}</div>${bomb ? `<div class="inserting-bomb">${icon('bomb')}<b>${lang === 'en' ? 'BOMB' : '炸弹'}</b></div>` : ''}`;
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
export async function rollDice(result,lang='zh',gesture={}){
 const token=begin('dice-performance',lang);shakeSerial++;
 const canvases=[...document.querySelectorAll('canvas[data-d20="tray"]')];if(!canvases.length){cancelPresentation();return;}
 const start=performance.now(),duration=reduced()?90:1450,faces=diceFaces(result);
 const side=Math.max(-1,Math.min(1,gesture.dx||0));
 await new Promise(resolve=>{function frame(now){if(generation!==token||!canvases[0].isConnected){resolve();return;}const t=Math.min(1,(now-start)/duration);
  canvases.forEach((canvas,j)=>{const value=faces[j],size=diceSize(canvas);if(result.held?.[j]){drawD20(canvas,{value,size});canvas.dataset.rolling='false';return;}
   const nodes=[[j?.82:.18,.98],[j?.25:.76+side*.05,.28],[j?.62:.38,.52],[.53,.47],[.5,.5]],stops=[0,.38,.64,.83,1];let i=0;while(i<3&&t>stops[i+1])i++;
   const u=(t-stops[i])/(stops[i+1]-stops[i]),x=nodes[i][0]+(nodes[i+1][0]-nodes[i][0])*u,y=nodes[i][1]+(nodes[i+1][1]-nodes[i][1])*u,spin=(1-t)**2;
   canvas.dataset.rolling=t<1?'true':'false';drawD20(canvas,{value,spin:[spin*(Math.PI*6+side),spin*Math.PI*(8+j),spin*Math.PI*2],x,y:y-Math.sin(u*Math.PI)*.13*(1-t),size:size*(1+Math.sin(u*Math.PI)*.15*(1-t)),lift:Math.sin(u*Math.PI)*(1-t)});
  });
  if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
 if(generation===token){layer().innerHTML='';layer().className='';}
}
