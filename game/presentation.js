import { icon } from './cards.js';
import { drawD20 } from './d20.js';

const layer = () => document.querySelector('#performance');
let generation = 0;
const running = new Set();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
export function cancelPresentation() {
  generation++;
  for (const animation of running) animation.cancel();
  running.clear();
  if (layer()) { layer().innerHTML = ''; layer().className = ''; }
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
function back() { return '<div class="flying-back"><span>?</span><i>ONE MORE</i></div>'; }
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
    const dx = old.rect.x - now.x, dy = old.rect.y - now.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) jobs.push(animate(seat, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }], { duration: 320, fill: 'none' }));
  }
  await Promise.all(jobs);
}
export async function revealCard(uid, lang = 'zh', isBomb = false) {
  const token = begin('reveal-performance', lang);
  const target = document.querySelector(`.tile[data-uid="${uid}"]`), field = document.querySelector('.card-field');
  if (!target) { cancelPresentation(); return; }

  const end = target.getBoundingClientRect(), origin = rect('#deck-draw') || end, table = rect('.casino-table') || end;
  const width = target.offsetWidth, height = target.offsetHeight;
  const x = end.x + end.width / 2 - width / 2, y = end.y + end.height / 2 - height / 2;
  const midX = table.x + table.width * .5 - width / 2, midY = table.y + table.height * .44 - height / 2;
  const flying = document.createElement('div'); flying.className = 'flying-card';
  flying.style.cssText = `left:${origin.x}px;top:${origin.y}px;width:${width}px;height:${height}px;--card:${getComputedStyle(target).getPropertyValue('--card')}`;
  flying.innerHTML = `<div class="flip-inner"><div class="flip-back">${back()}</div><div class="flip-front"><div class="flying-face">${target.innerHTML}</div></div></div>`;
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
    layer().insertAdjacentHTML('beforeend', '<div class="bomb-flare"></div>');
    await animate(document.querySelector('.casino-table'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-.4deg)' }, { transform: 'translateX(8px) rotate(.4deg)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 420, fill: 'none' });
  }
  if (generation === token) { layer().innerHTML = ''; layer().className = ''; }
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
 const canvas=document.querySelector('canvas[data-d20="hand"]');if(!canvas)return;
 const serial=++shakeSerial,start=performance.now();canvas.dataset.shaking='true';
 await new Promise(resolve=>{function frame(now){if(serial!==shakeSerial||!canvas.isConnected){resolve();return;}const t=Math.min(1,(now-start)/(reduced()?70:430));drawD20(canvas,{value:20,spin:[Math.sin(t*Math.PI*5)*(1-t),t*Math.PI*4,Math.sin(t*Math.PI*4)*.35],x:.5+Math.sin(t*Math.PI*6)*.07*(1-t),size:45});if(t<1)requestAnimationFrame(frame);else{canvas.dataset.shaking='false';drawD20(canvas,{size:45});resolve();}}requestAnimationFrame(frame);});
}
export async function rollDice(result,lang='zh',gesture={}){
 const token=begin('dice-performance',lang);shakeSerial++;
 const canvas=document.querySelector('canvas[data-d20="tray"]');if(!canvas){cancelPresentation();return;}
 const start=performance.now(),duration=reduced()?90:1450;
 const side=Math.max(-1,Math.min(1,gesture.dx||0)), nodes=[[.18,.98],[.76+side*.05,.28],[.38,.52],[.53,.47],[.5,.5]],stops=[0,.38,.64,.83,1];
 canvas.dataset.rolling='true';
 await new Promise(resolve=>{function frame(now){if(generation!==token||!canvas.isConnected){resolve();return;}const t=Math.min(1,(now-start)/duration);let i=0;while(i<3&&t>stops[i+1])i++;const u=(t-stops[i])/(stops[i+1]-stops[i]),x=nodes[i][0]+(nodes[i+1][0]-nodes[i][0])*u,y=nodes[i][1]+(nodes[i+1][1]-nodes[i][1])*u;const spin=(1-t)**2;
  drawD20(canvas,{value:result.total,spin:[spin*(Math.PI*6+side),spin*Math.PI*8,spin*Math.PI*2],x,y:y-Math.sin(u*Math.PI)*.13*(1-t),size:62*(1+Math.sin(u*Math.PI)*.15*(1-t)),lift:Math.sin(u*Math.PI)*(1-t)});
  if(t<1)requestAnimationFrame(frame);else{canvas.dataset.rolling='false';drawD20(canvas,{value:result.total,size:62});resolve();}}requestAnimationFrame(frame);});
 if(generation===token){layer().innerHTML='';layer().className='';}
}
