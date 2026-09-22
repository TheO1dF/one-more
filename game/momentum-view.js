import {SKIP_REWARDS,canSkipTable,mandatoryTable,scoreMultiplier,rolledForNextTable} from './momentum.js';
import {nextTarget,targetFactor} from './pacing.js';
import {ruleDiceCount} from './unlock-data.js';
import {points} from './points.js';
import {icon,CARDS,RELICS} from './cards.js';

export function skipHTML(s,lang='zh',busy=false){
 if(s.rules!==2||s.endless||s.practice||Number.isInteger(s.lesson))return '';
 const en=lang==='en',round=s.round+1;
 if(mandatoryTable(round))return `<div class="checkpoint-banner">${en?'FINAL TABLE':'最后一桌'} · ${round} <span>${en?'Cannot skip':'不可跳过'}</span></div>`;
 if(!rolledForNextTable(s))return `<div class=skip-locked>${en?'Roll and confirm the target before skipping.':'先掷骰并确认目标，再决定是否跳桌。'}</div>`;
 if(!canSkipTable(s))return `<div class="skip-locked">${en?'Skip unlocks at':'装袋达到'} ${points(s.target)} ${en?'banked points.':'分，可跳过此桌。'}</div>`;
 const id=s.skipOffer?.id,r=SKIP_REWARDS[id];if(!r||s.skipOffer.round!==round)return '';
 const next={...s,round,skipHistory:[...(s.skipHistory||[]),{round,reward:id}]},count=ruleDiceCount(next),low=nextTarget(next,count),high=nextTarget(next,count*20);
 return `<section class="skip-offer"><header><h2>${en?'SKIP TABLE '+round:'跳过第 '+round+' 桌'}</h2><span>${en?'Only table 10 cannot be skipped':'仅第10桌不可跳过'}</span></header><p>${en?'Forgo this table, its route, draft and starting boon. This randomly assigned reward is fixed for this table.':'放弃本桌牌局、路线、构筑与开局奖励。本桌随机奖励已确定，不可重抽。'}</p><p class="skip-penalty">${en?'NEXT TABLE ONLY: MULTIPLIER +1':'仅下一桌：目标倍率 +1'}<strong>${en?'TABLE '+(round+1)+' DICE TOTAL':'第 '+(round+1)+' 桌骰点合计'} ×${targetFactor(next)} · ${en?'Does not stack':'不累计'}</strong></p><p class="skip-target">${en?'TABLE '+(round+1)+' TARGET':'第 '+(round+1)+' 桌累计目标'} <b>${points(low)}${high===low?'':'–'+points(high)}</b> · ${en?'BANKED':'已装袋'} ${points(s.bank)}</p><div class="skip-tags"><button data-action="skip-table" data-id="${id}" ${busy?'disabled':''}>${icon(r.icon)}<strong>${r.name[en?1:0]}</strong><span>${r.text[en?1:0]}</span><b>${en?'SKIP & TAKE':'跳桌领取'}</b></button></div></section>`;
}
export function momentumHUD(s,lang='zh'){
 const en=lang==='en',m=scoreMultiplier(s);
 return `${mandatoryTable(s.round)?`<span class="checkpoint-label">${en?'FINAL TABLE':'最后一桌'}</span>`:''}${m!==1?`<span class="score-multiplier">${en?'SCORE':'计分'} ×${Number(m.toPrecision(4))}</span>`:''}`;
}
export function skipReceiptHTML(s,lang='zh'){
 const r=s.skipReceipt;if(!r||r.round!==s.round)return '';const en=lang==='en',tx=a=>a[en?1:0];
 const detail=r.relic?tx(RELICS[r.relic].name):r.removed.length?r.removed.map(c=>tx(CARDS[c.original].name)).join(' / '):r.card?tx(CARDS[r.card.original].name):tx(SKIP_REWARDS[r.id].name);
 return `<p class="skip-receipt">${en?'SKIPPED TABLE ':'已跳过第 '}${r.round}${en?'':' 桌'} · ${detail}</p>`;
}
