import {slotSymbol} from './slot-art.js';
import {SKIP_REWARDS,canSkipTable,mandatoryTable,scoreMultiplier,rolledForNextTable} from './momentum.js';
import {points} from './points.js';
import {icon,CARDS,RELICS} from './cards.js';
import {enchantedName} from './enchantment-view.js';

export function skipHTML(s,lang='zh',busy=false){
 if(s.rules!==2||s.endless||s.practice||Number.isInteger(s.lesson))return '';
 const en=lang==='en',round=s.round+1;
 if(mandatoryTable(round))return `<div class="checkpoint-banner">${en?'FINAL TABLE':'最后一桌'} · ${round} <span>${en?'Cannot skip':'不可跳过'}</span></div>`;
 if(!rolledForNextTable(s))return `<div class=skip-locked>${en?'Roll and confirm the target before skipping.':'先掷骰并确认目标，再决定是否跳桌。'}</div>`;
 if(s.phase!=='skipReward'&&!canSkipTable(s))return `<div class="skip-locked">${en?'Skip unlocks at':'装袋达到'} ${points(s.target)} ${en?'banked points.':'分，可跳过此桌。'}</div>`;
 const id=s.skipOffer?.id;if(!s.skipOffer?.pool||s.skipOffer.round!==round)return '';
 if(s.phase==='skipReward')return `<section class="slot-entry slot-unclaimed"><button data-action="open-slot" ${busy?'disabled':''}>${slotSymbol(id)}${en?'CLAIM PRIZE':'领取奖励'}</button></section>`;
 return `<section class="slot-entry"><button data-action="open-slot" ${busy?'disabled':''}>${en?'SKIP TABLE '+round:'跳过第 '+round+' 桌'}</button><p>${en?'Forfeit ordinary rewards · next table target multiplier +1 only.':'放弃普通奖励 · 仅下一桌目标倍率 +1'}</p></section>`;
}
export function momentumHUD(s,lang='zh'){
 const en=lang==='en',m=scoreMultiplier(s);
 return `${mandatoryTable(s.round)?`<span class="checkpoint-label">${en?'FINAL TABLE':'最后一桌'}</span>`:''}${m!==1?`<span class="score-multiplier">${en?'SCORE':'计分'} ×${Number(m.toPrecision(4))}</span>`:''}`;
}
export function skipReceiptHTML(s,lang='zh'){
 const r=s.skipReceipt;if(!r||r.round!==s.round)return '';const en=lang==='en',tx=a=>a[en?1:0];
 const detail=r.relic?tx(RELICS[r.relic].name):r.removed.length?r.removed.map(c=>tx(CARDS[c.original].name)).join(' / '):r.enchanted?r.enchanted.map(c=>tx(CARDS[c.original].name)).join(' / '):r.card?enchantedName(r.card,lang):tx(SKIP_REWARDS[r.id].name);
 return `<p class="skip-receipt">${en?'SKIPPED TABLE ':'已跳过第 '}${r.round}${en?'':' 桌'} · ${detail}</p>`;
}
