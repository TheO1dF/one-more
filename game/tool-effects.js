import {requestGameFrame,cancelGameFrame} from './frame-clock.js';
const effect=(pattern,color,accent,duration=660)=>({pattern,color,accent,duration});
export const TOOL_EFFECTS=Object.freeze({
 torch:effect('beam','#ffe79c','#f6fff0'),scope:effect('radar','#a5e6e4','#f2ffd7',760),magnifier:effect('lens','#d7f6c8','#ffedb0'),
 sifter:effect('sieve','#d4efb6','#ffe6a2'),sorter:effect('deal','#ffd696','#f1fff1'),
 cloth:effect('wipe','#d2ebc3','#fff5db'),washbucket:effect('wash','#9ce6df','#ebffff',740),fan:effect('wind','#c9f2e0','#fff0bb'),
 jar:effect('ferment','#c8e89a','#f2ca7e',780),stove:effect('flame','#f3a558','#ffeaaa'),grill:effect('grill','#ffbf68','#ffebba'),
 steamer:effect('steam','#d1f1ed','#ffffff',780),juicer:effect('juice','#ffd161','#fbeaa2',740),
 mold:effect('copy','#badccc','#ffe8b8'),cleaver:effect('cut','#fff5d0','#e5a86c',550),
 bell:effect('bell','#f6d385','#fff6d5',760),scoop:effect('scoop','#c2e8da','#ffdf9d'),magnet:effect('magnet','#edb0a0','#a9e6e0'),
 compostfork:effect('roots','#cee99a','#eac989'),stamp:effect('stamp','#f0b08c','#ffeac7',580),
 tray:effect('return','#c9dfcd','#f8d89b'),menu:effect('menu','#f6df9f','#fffcde'),
 whetstone:effect('sparks','#ffe6ac','#ffd26c'),ladle:effect('seal','#e7d198','#eaffd5'),
 mincer:effect('cut','#ff4928','#edbd38',550),doughpress:effect('stamp','#edbd38','#fff8e8',580),
 sproutbox:effect('roots','#339563','#edbd38'),tastingfork:effect('deal','#edbd38','#fff8e8'),
 washpress:effect('wash','#81b8ba','#fff8e8',740),cellarpress:effect('copy','#574798','#fff8e8'),
});
export const effectFor=kind=>TOOL_EFFECTS[kind]||effect('pulse','#dbecc0','#ffdf9e');

let canvas,ctx,frame=0,items=[];
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='reduced';
const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height});
export function effectPoint(node){if(!node||!node.getClientRects().length)return null;const r=node.getBoundingClientRect();if(r.right<0||r.left>innerWidth)return null;return center(r);}
export const rectPoint=r=>r?center(r):null;
function surface(){
 if(canvas?.isConnected)return;
 canvas=document.createElement('canvas');canvas.className='table-effects';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
}
export function cancelEffects(){cancelGameFrame(frame);frame=0;items.splice(0).forEach(x=>x.resolve());canvas?.remove();canvas=ctx=null;}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelEffects();});
export function emitEffect(kind,from,to=from,{pattern,color,accent,duration}={}){
 if(!from||document.hidden)return Promise.resolve();
 if(!to)to=from;
 const style={...effectFor(kind),...Object.fromEntries(Object.entries({pattern,color,accent,duration}).filter(([,v])=>v!==undefined))};
 const warm=['flame','grill','juice','cut','sparks','stamp','seal'].includes(style.pattern);
 style.color=warm?'#ff4928':['wash','steam','wind','wipe'].includes(style.pattern)?'#81b8ba':'#edbd38';style.accent=warm?'#edbd38':'#fff8e8';
 if(reduced())return Promise.resolve();
 surface();if(!ctx){cancelEffects();return Promise.resolve();}
 return new Promise(resolve=>{
  const seed=[...kind].reduce((n,c)=>n+c.charCodeAt(0),0);
  items.push({kind,from,to,...style,seed,start:performance.now(),resolve});
  if(!frame)frame=requestGameFrame(tick);
 });
}
function ring(p,r,color,alpha=1,width=2){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width*1.6;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.1,r),0,Math.PI*2);ctx.stroke();}
function line(a,b,color,width=2,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width*1.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function star(x,y,size,color,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.3,y-size*.3);ctx.lineTo(x+size,y);ctx.lineTo(x+size*.3,y+size*.3);ctx.lineTo(x,y+size);ctx.lineTo(x-size*.3,y+size*.3);ctx.lineTo(x-size,y);ctx.lineTo(x-size*.3,y-size*.3);ctx.closePath();ctx.fill();}
function draw(e,t){
 const a=e.from,b=e.to,fade=Math.sin(Math.PI*t),q=1-(1-t)**3,r=Math.max(36,Math.min(95,b.w*.58||60)),p=e.pattern;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='square';
 if(['beam','radar','lens'].includes(p)){
  const reach=Math.min(1,t*3),head={x:a.x+(b.x-a.x)*reach,y:a.y+(b.y-a.y)*reach};
  ctx.fillStyle=e.color;ctx.globalAlpha=fade*.75;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(head.x-r*.7,head.y);ctx.lineTo(head.x+r*.7,head.y);ctx.closePath();ctx.fill();
  line(a,head,e.accent,1,fade*.5);ring(b,r*(p==='lens'?1.2-.5*q:q),e.color,fade,2);
  if(p==='radar'){ring(b,r*.55,e.accent,fade*.6);line(b,{x:b.x+Math.cos(t*8)*r,y:b.y+Math.sin(t*8)*r},e.color,2,fade);}
  if(p==='lens')for(let i=0;i<4;i++){const ang=i*Math.PI/2;line({x:b.x+Math.cos(ang)*r*.45,y:b.y+Math.sin(ang)*r*.45},{x:b.x+Math.cos(ang)*r*.85,y:b.y+Math.sin(ang)*r*.85},e.accent,2,fade);}
 }else if(['bell','magnet','pulse'].includes(p)){
  for(let i=0;i<3;i++){const u=(t+i*.23)%1;ring(b,r*(p==='magnet'?1.5*(1-u):.3+u*1.5),i%2?e.accent:e.color,Math.sin(Math.PI*u)*fade,2+i);}
 }else if(['wipe','sieve','wind','grill','cut','sparks'].includes(p)){
  const x=b.x-r+q*r*2;
  if(p==='cut'){for(let i=0;i<3;i++)line({x:b.x-r+q*r*.3,y:b.y-r+i*11},{x:b.x+r*q,y:b.y+r*q+i*11},e.accent,Math.max(1,(1-t)*8-i),fade);}
  else for(let i=-3;i<=3;i++){
   if(p==='grill')line({x:b.x-r,y:b.y+i*13},{x:b.x+r,y:b.y+i*13},e.color,4,fade*.55);
   else if(p==='wind'){ctx.globalAlpha=fade*.6;ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-r,b.y+i*14);ctx.bezierCurveTo(b.x-r*.3,b.y+i*14-15,b.x+r*.3,b.y+i*14+15,b.x+r,b.y+i*14);ctx.stroke();}
   else line({x:x-12+i*4,y:b.y-r},{x:x+12+i*4,y:b.y+r},e.accent,p==='wipe'?6:1,fade*.4);
  }
  if(p==='sieve')for(let i=-3;i<=3;i++)line({x:b.x-r,y:b.y+i*16},{x:b.x+r,y:b.y+i*16},e.color,1,fade*.7);
 }else if(['copy','deal','return','seal','stamp','menu'].includes(p)){
  const count=p==='deal'?3:p==='copy'?2:1;
  for(let i=0;i<count;i++){
   ctx.save();ctx.globalAlpha=fade*.7;ctx.strokeStyle=e.accent;ctx.lineWidth=p==='stamp'?4:2;
   ctx.translate(a.x+(b.x-a.x)*q+(i-(count-1)/2)*30*q,a.y+(b.y-a.y)*q-Math.sin(t*Math.PI)*20);
   ctx.rotate((i-(count-1)/2)*.2);const size=p==='stamp'?1.8-q:1;ctx.scale(size,size);
   ctx.strokeRect(-r*.46,-r*.65,r*.92,r*1.3);ctx.strokeRect(-r*.38,-r*.57,r*.76,r*1.14);ctx.restore();
  }
 }else if(['wash','ferment','juice','roots','scoop'].includes(p)){
  for(let i=0;i<4;i++){const angle=t*5+i*Math.PI*.5;ctx.globalAlpha=fade*.65;ctx.strokeStyle=i%2?e.accent:e.color;ctx.lineWidth=p==='wash'?6:3;ctx.beginPath();ctx.arc(b.x,b.y,r*(.3+i*.2)*Math.sin(Math.PI*t*.8),angle,angle+Math.PI*.9);ctx.stroke();}
 }
 // Shape, direction and palette all derive from the tool, never gameplay RNG.
 const count=p==='pair'?34:p==='bomb'?64:20;
 for(let i=0;i<count;i++){
  const h=(i*137+e.seed)%360/180*Math.PI,vel=30+(i*23%80),delay=(i%4)*.025,u=Math.max(0,(t-delay)/(1-delay));
  let x=b.x+Math.cos(h)*vel*u,y=b.y+Math.sin(h)*vel*u+u*u*25;
  const steam=p==='steam',fire=p==='flame'||p==='grill',liquid=['wash','ferment','juice'].includes(p);
  if(steam||fire){x=b.x+Math.cos(h)*r*.65+Math.sin(u*6+i)*12;y=b.y+r*.5-u*(steam?130:90);}
  if(p==='pair'){x=a.x+(b.x-a.x)*q+Math.sin(h)*28*Math.sin(Math.PI*t);y=a.y+(b.y-a.y)*q-Math.sin(Math.PI*t)*75+Math.cos(h)*16;}
  if(p==='bomb'){x=b.x+Math.cos(h)*vel*u*3.7;y=b.y+Math.sin(h)*vel*u*3.1+u*u*90;}
  const size=(steam?14:liquid?4:fire?7:2+i%3)*(1-u*.6),alpha=Math.sin(Math.PI*u)*(steam?.7:1);
  if(steam||liquid){ctx.globalAlpha=alpha;ctx.fillStyle=i%2?e.color:e.accent;ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x-size*.3,y-size);ctx.lineTo(x+size,y-size*.6);ctx.lineTo(x+size*.7,y+size*.6);ctx.lineTo(x-size*.5,y+size);ctx.closePath();ctx.fill();}
  else star(x,y,size,i%2?e.color:e.accent,alpha);
 }
 ctx.restore();
}
function tick(now){
 frame=0;if(!ctx)return;ctx.clearRect(0,0,innerWidth,innerHeight);
 const done=[];
 try{for(const e of items){const t=Math.max(0,Math.min(1,(now-e.start)/e.duration));if(t<1)draw(e,t);else done.push(e);}}
 catch(error){console.error('Effect rendering failed',error);cancelEffects();return;}
 items=items.filter(e=>!done.includes(e));done.forEach(e=>e.resolve());
 if(items.length&&!document.hidden)frame=requestGameFrame(tick);else cancelEffects();
}
