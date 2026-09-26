import {actionTargetIds} from './action-selection.js';
export function splitTargets(s,choices=[]){
 const table=new Set((s?.phase==='play'?s.cards:[]).filter(c=>c.zone==='table').map(c=>c.uid));
 return {onTable:choices.filter(c=>Number.isInteger(c.id)&&table.has(c.id)),elsewhere:choices.filter(c=>!Number.isInteger(c.id)||!table.has(c.id))};
}
export function targetArrow(a,b){
 const x=a.x+a.width/2,y=a.y+10,tx=b.x+b.width/2,ty=b.y+8;
 const cx=(x+tx)/2,cy=Math.min(y,ty)-Math.min(100,Math.max(42,Math.abs(tx-x)*.26));
 return {path:`M${x} ${y} Q${cx} ${cy} ${tx} ${ty}`,x:tx,y:ty,angle:Math.atan2(ty-cy,tx-cx)*180/Math.PI};
}
let overlay=null,sourceUid=null,lockedUid=null;
const visible=el=>el&&el.getClientRects().length;
function drawArrow(target){
 if(!overlay||!visible(target)){if(overlay)overlay.style.opacity='0';return;}
 const source=document.querySelector('.card-row .tile[data-uid="'+sourceUid+'"]');
 const anchor=visible(source)?source:document.querySelector('.inspect-art,.table-target-prompt h2');
 if(!visible(anchor)||anchor===target){overlay.style.opacity='0';return;}
 const arrow=targetArrow(anchor.getBoundingClientRect(),target.getBoundingClientRect());
 overlay.style.opacity='1';overlay.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);
 overlay.querySelectorAll('path').forEach(p=>p.setAttribute('d',arrow.path));
 overlay.querySelector('.target-arrow-tip').setAttribute('transform',`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`);
}
function lockedTarget(){return lockedUid==null?null:document.querySelector('.card-row .tile[data-uid="'+lockedUid+'"]');}
export function syncTargeting(flow,s,selected){
 overlay?.remove();overlay=null;sourceUid=flow?.source??selected;lockedUid=flow?.confirmation?actionTargetIds(flow.confirmation).at(-1):null;
 const ids=splitTargets(s,flow?.choices).onTable.map(c=>c.id),marked=splitTargets(s,(flow?.marked||[]).map(id=>({id}))).onTable;
 document.body.classList.toggle('choosing-on-table',!!flow&&(ids.length>0||marked.length>0));
 if(!flow||(!ids.length&&!marked.length))return;
 overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.classList.add('target-arrow');overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML='<path class="target-arrow-shadow"/><path class="target-arrow-stem"/><polygon class="target-arrow-tip" points="2,0 -22,-12 -18,0 -22,12"/>';
 document.body.append(overlay);drawArrow(lockedTarget());
}
function aim(event){
 if(!overlay)return;
 drawArrow(event.target.closest?.('.tile.targetable')||lockedTarget());
}
if(typeof document!=='undefined'){
 document.addEventListener('pointerover',aim);document.addEventListener('focusin',aim);
 document.addEventListener('scroll',()=>drawArrow(lockedTarget()),{passive:true,capture:true});
}
