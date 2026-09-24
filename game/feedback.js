import {reducedMotion as reduced} from './motion.js';
import {feedbackSummary} from './feedback-summary.js';
import {points} from './points.js';
import {animateAtRate} from './frame-clock.js';
import {score} from './engine.js';
import {scoreMultiplier} from './momentum.js';
import {requestGameFrame} from './frame-clock.js';
import {icon,CARDS} from './cards.js';
import {discardFeedback} from './discard-feedback.js';
import {emitEffect,effectPoint,rectPoint,effectFor} from './tool-effects.js';

const tile=uid=>document.querySelector(`.tile[data-uid="${uid}"]`);
const visible=e=>e&&e.getClientRects().length&&e.getBoundingClientRect().right>0&&e.getBoundingClientRect().left<innerWidth;
const motion=async(el,frames,options={})=>{if(!el)return;try{await animateAtRate(el,frames,{duration:reduced()?80:450,easing:'cubic-bezier(.2,.8,.2,1)',...options,...(reduced()?{duration:80,delay:0}:{}),fill:'none'}).finished;}catch{}};
function floatAt(el,text,kind='score'){
 if(!visible(el))return Promise.resolve();const r=el.getBoundingClientRect(),label=document.createElement('span');
 label.className='feedback-float '+kind;label.textContent=text;label.style.left=r.x+r.width/2+'px';label.style.top=r.y+r.height/2+'px';document.body.append(label);
 return motion(label,[{translate:'-50% 0',opacity:0,scale:'.7'},{translate:'-50% -20px',opacity:1,scale:'1.2',offset:.2},{translate:'-50% -56px',opacity:0,scale:'1'}],{duration:650}).finally(()=>label.remove());
}
export function animateScore(from,to){
 const el=document.querySelector('.table-score strong');if(!el||from===to||reduced())return;
 const start=performance.now();
 const step=now=>{if(!el.isConnected)return;const t=Math.min(1,(now-start)/400);el.textContent=points(Math.round(from+(to-from)*(1-(1-t)**3)));if(t<1)requestGameFrame(step);};
 requestGameFrame(step);
}
export async function actionFeedback(action,before,after,lang='zh',positions=new Map()){
 const jobs=[],en=lang==='en',summary=feedbackSummary(before,after);
 // Replace stale cosmetic receipts so fast actions never queue screens of feedback.
 document.querySelectorAll('.combo-receipt,.feedback-float,.tool-emblem,.consumed-card').forEach(el=>el.remove());
 const freeChange=(after.freePayments||0)-(before.freePayments||0);
 if(freeChange){
  const badge=document.querySelector('.food-waiver');
  if(badge){
   jobs.push(motion(badge,[{scale:'1'},{scale:'1.12',offset:.35},{scale:'1'}],{duration:420}));
   jobs.push(floatAt(badge,`${freeChange>0?'+':''}${freeChange}`,'waiver'));
  }else if(before.freePayments>0)jobs.push(floatAt(document.querySelector('.table-utilities'),en?'USED UP':'已用完','waiver'));
 }
 if(summary.combined){
  const label=document.createElement('div'),delta=score(after)-score(before);label.className='combo-receipt';
  const details=[summary.grown.length&&(en?'GROWTH ×':'成长 ×')+summary.grown.length,summary.created.length&&(en?'CREATED ×':'生成 ×')+summary.created.length,summary.removed.length&&(en?'REMOVED ×':'移出 ×')+summary.removed.length,summary.relics.length&&(en?'PLEDGES ×':'抵押物 ×')+summary.relics.length].filter(Boolean);
  label.innerHTML=`<strong>${delta>0?'+'+points(delta):summary.grown.length?(en?'LEVEL UP':'成长'):en?'COMBO':'连动'}</strong><span>${details.join(' · ')}</span>`;document.body.append(label);
  jobs.push(motion(label,[{opacity:0,scale:'.75'},{opacity:1,scale:'1.08',offset:.18},{opacity:1,scale:'1',offset:.72},{opacity:0,scale:'1.05'}],{duration:700}).finally(()=>label.remove()));
 }
 const point=uid=>effectPoint(tile(uid))||rectPoint(positions.get(uid)?.rect);
 const scorePoint=effectPoint(document.querySelector('.table-score strong'));
 const pairUids=action.type==='pair'?action.ids:after.log.filter(e=>e.id>before.event&&e.key==='autoPair').flatMap(e=>e.uids);
 if(pairUids.length)for(const uid of pairUids.slice(0,6)){
  const el=tile(uid);if(!visible(el))continue;
  jobs.push(motion(el,[{filter:'brightness(1)',scale:'1'},{filter:'brightness(1.1)',scale:'1.07',offset:.35},{filter:'brightness(1)',scale:'1'}]));
  jobs.push(emitEffect('pair',point(uid),scorePoint,{pattern:'pair',color:'#f6d07f',accent:'#e1ffbd',duration:700}));
  jobs.push(floatAt(el,'♥','pair'));
 }
 if(action.type==='use'){
  const el=tile(action.uid);
  const kind=before.cards.find(c=>c.uid===action.uid)?.kind,fx=effectFor(kind),from=point(action.uid);
  const preview=[...document.querySelectorAll('.preview-slot.known')];
  const to=['beam','radar','lens','sieve'].includes(fx.pattern)?effectPoint(preview[fx.pattern==='lens'?2:0]||document.querySelector('.preview')):point(action.target)||from;
  jobs.push(emitEffect(kind,from,to));
  jobs.push(motion(el,[{filter:'brightness(1)'},{filter:`brightness(1.15)`,offset:.3},{filter:'brightness(1)'}]));
  if(from&&!reduced()){
   const emblem=document.createElement('span');emblem.className='tool-emblem';emblem.innerHTML=icon(kind);emblem.style.left=from.x-45+'px';emblem.style.top=from.y-55+'px';document.body.append(emblem);
   jobs.push(motion(emblem,[{opacity:0,scale:'.4',rotate:'-14deg'},{opacity:1,scale:'1.1',rotate:'5deg',offset:.25},{opacity:0,scale:'1.35',translate:'0 -35px',rotate:'-3deg'}],{duration:fx.duration}).finally(()=>emblem.remove()));
  }
  if(action.target)jobs.push(motion(tile(action.target),[{scale:'1'},{scale:'1.08',offset:.4},{scale:'1'}]));
 }
 for(const uid of summary.removed.slice(0,3)){
  const current=after.cards.find(c=>c.uid===uid),stored=current?.zone==='stored';
  const r=positions.get(uid)?.rect,c=before.cards.find(c=>c.uid===uid),bin=document.querySelector(stored?'.stored-shortcut':'#discard-bin')?.getBoundingClientRect();
  if(!r||!c||!bin||r.right<0||r.left>innerWidth)continue;
  if(current?.zone==='discard'){
   jobs.push(discardFeedback(current,r,bin,positions.get(current.consumedByUid)?.rect,lang));continue;
  }
  if(!stored)continue;
  const ghost=document.createElement('span');ghost.className='consumed-card';ghost.innerHTML=icon(c.kind);
  ghost.style.cssText=`left:${r.x}px;top:${r.y}px;width:${Math.min(r.width,120)}px;height:${Math.min(r.height,160)}px`;
  document.body.append(ghost);
  jobs.push(motion(ghost,[{opacity:.85,translate:'0 0',scale:'1'},{opacity:0,translate:`${bin.x-r.x}px ${bin.y-r.y}px`,scale:'.15'}],{duration:430}).finally(()=>ghost.remove()));
 }
 for(const c of after.cards.filter(c=>c.zone==='table'&&!before.table.includes(c.uid)).slice(0,3)){
  if(action.type==='draw'&&(c.uid===before.draw[0]||(before.staples||[]).some(b=>b.uids.includes(before.draw[0])&&b.uids.includes(c.uid))))continue;
  jobs.push(motion(tile(c.uid),[{opacity:0,scale:'.65',filter:'brightness(1.7)'},{opacity:1,scale:'1',filter:'brightness(1)'}]));
  jobs.push(emitEffect('generated',point(c.uid),point(c.uid),{pattern:'deal',duration:500}));
 }
 for(const id of after.relics.filter(id=>!before.relics.includes(id)))jobs.push(emitEffect('relic',effectPoint(document.querySelector('.relic-rack'))||{x:innerWidth/2,y:innerHeight/2,w:100,h:100},null,{pattern:'seal',duration:600}));
 for(const entry of summary.relics.slice(0,3)){
  const token=document.querySelector(`.relic-token[data-id="${entry.relic}"]`);
  jobs.push(motion(token,[{scale:'1',rotate:'0deg'},{scale:'1.25',rotate:'-12deg',offset:.3},{scale:'1',rotate:'0deg'}],{duration:380}));
  jobs.push(emitEffect('relic',effectPoint(token),null,{pattern:'seal',duration:460}));
 }
 for(const entry of summary.grown.slice(0,2)){
  const el=tile(entry.uid)||document.querySelector('.draft-receipt>b');jobs.push(floatAt(el,`${points(entry.from)} → ${points(entry.to)}`));
  if(visible(el))jobs.push(motion(el,[{scale:'1'},{scale:'1.13',filter:'brightness(1.3)',offset:.4},{scale:'1',filter:'brightness(1)'}],{duration:500}));
 }
 if(scoreMultiplier(after)>scoreMultiplier(before)&&after.phase==='play'){
  jobs.push(floatAt(document.querySelector('.table-score strong'),'×'+Number(scoreMultiplier(after).toPrecision(4)),'pair'));
  jobs.push(motion(document.querySelector('.score-multiplier'),[{scale:'.8'},{scale:'1.3',offset:.3},{scale:'1'}],{duration:500}));
 }
 const bankChange=after.bank-before.bank;
 if(bankChange&&action.type!=='stop')jobs.push(floatAt(document.querySelector('.bank-score strong'),(bankChange>0?'+':'')+bankChange,bankChange>0?'score':'cost'));
 const delta=score(after)-score(before),label=document.querySelector('.table-score strong');
 if(delta&&after.phase==='play'&&!summary.combined){
  jobs.push(floatAt(label,(delta>0?'+':'')+points(delta),delta>0?'score':'cost'));
  jobs.push(motion(label,[{scale:'1'},{scale:'1.2',offset:.3},{scale:'1'}]));
 }
 const readiedTools=after.cards.filter(c=>CARDS[c.kind].type==='tool'&&c.zone==='table'&&c.tapped===false&&before.cards.find(b=>b.uid===c.uid)?.tapped);
 for(const c of readiedTools.slice(0,3))jobs.push(emitEffect('ready',point(c.uid),point(c.uid),{pattern:'bell',duration:500}));
 if(readiedTools.length)jobs.push(floatAt(tile(readiedTools[0].uid),en?'TOOLS READY':'工具恢复','ready'));
 const restoredPledges=Object.keys(before.relicUsed||{}).filter(id=>before.relicUsed[id]&&!after.relicUsed?.[id]);
 if(restoredPledges.length){
  for(const id of restoredPledges){const el=document.querySelector(`.relic-token[data-id="${id}"]`);jobs.push(motion(el,[{scale:'1'},{scale:'1.2',filter:'brightness(1.35)',offset:.4},{scale:'1',filter:'brightness(1)'}],{duration:600}));jobs.push(emitEffect('relic',effectPoint(el),null,{pattern:'seal',duration:600}));}
  jobs.push(floatAt(document.querySelector('.relic-rack'),en?'PLEDGES READY':'抵押物恢复','ready'));
 }
 await Promise.all(jobs);
}
