// The rack can scroll. Its tooltip must never participate in that scroll area.
let active;
const bound=new WeakSet();
export function hideRelicTooltip(){
 if(!active)return;
 active.anchor.removeAttribute('aria-describedby');active.tip.remove();active=null;
}
function show(anchor,format){
 hideRelicTooltip();
 const tip=document.createElement('div');tip.id='relic-tooltip';tip.className='relic-tooltip';tip.setAttribute('role','tooltip');
 tip.innerHTML=format(anchor.dataset.tooltip);document.body.append(tip);
 active={anchor,tip};anchor.setAttribute('aria-describedby',tip.id);
 const r=anchor.getBoundingClientRect(),t=tip.getBoundingClientRect(),edge=12,gap=12;
 const left=Math.max(edge,Math.min(innerWidth-t.width-edge,r.left+(r.width-t.width)/2));
 const top=r.bottom+gap+t.height<=innerHeight-edge?r.bottom+gap:Math.max(edge,r.top-gap-t.height);
 Object.assign(tip.style,{left:left+'px',top:top+'px',visibility:'visible'});
}
export function bindRelicTooltips(root,format){
 if(active&&!active.anchor.isConnected)hideRelicTooltip();
 for(const token of root.querySelectorAll('.relic-token[data-tooltip]')){
  token.setAttribute('aria-description',token.dataset.tooltip);token.removeAttribute('title');
  if(bound.has(token))continue;bound.add(token);
  token.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')show(token,format);});
  token.addEventListener('pointerleave',()=>{if(active?.anchor===token)hideRelicTooltip();});
  token.addEventListener('focus',()=>{if(token.matches(':focus-visible'))show(token,format);});
  token.addEventListener('blur',()=>{if(active?.anchor===token)hideRelicTooltip();});
 }
}
if(typeof document!=='undefined'){
 document.addEventListener('scroll',hideRelicTooltip,true);
 document.addEventListener('pointerdown',hideRelicTooltip,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideRelicTooltip();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hideRelicTooltip();});
 globalThis.addEventListener('resize',hideRelicTooltip);
}
