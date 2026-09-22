import {nextTarget,targetSurcharge,targetFactor} from './pacing.js';
import {skipTargetPenalty} from './momentum.js';
import {points} from './points.js';

export function diceTargetHTML(s,lang='zh',showResult=false){
 if(s.rules!==2||s.endless)return '';
 const en=lang==='en',factor=targetFactor(s),extra=targetSurcharge(s),d=showResult?s.dice?.result:null;
 const raise=d?nextTarget(s,d.total)-s.target:0;
 return `<section class="target-notice" data-target-factor="${factor}" aria-label="${en?'Next table target calculation':'下桌目标计算'}">
  <b class="target-multiplier">×${factor}</b><div><small>${en?'TABLE '+(s.round+1)+' · '+(s.growth?.curve==='rising'?'RISING TARGETS':'TARGET RAISE'):'第'+(s.round+1)+'桌 · '+(s.growth?.curve==='rising'?'成长目标':'目标加码')}</small><strong>${en?'DICE TOTAL × '+factor:'骰点合计 × '+factor}</strong><span>${en?'Raises the target. Your bank stays unchanged.':'增加累计目标，装袋分数不变。'}${skipTargetPenalty(s)?(en?' Includes +1 for this target only.':' 含仅本次目标生效的临时加码 +1。'):''}</span></div>
  <div class="target-equation" aria-live="polite">${d?`<span>${d.total} × ${factor}${extra?' + '+extra:''} = <b>+${points(raise)}</b></span><strong>${en?'TARGET':'累计目标'} ${points(s.target)} → ${points(nextTarget(s,d.total))}</strong>`:`<span>${en?'Next target':'下桌累计目标'} = ${points(s.target)} + ${en?'dice total':'骰点合计'} × ${factor}${extra?' + '+extra:''}</span>`}</div>
 </section>`;
}

export function tableTargetLabel(s,lang='zh'){
 const en=lang==='en';
 if(s.endless)return en?'ENDLESS · TARGET ×2':'无限 · 目标 ×2';
 const round=['route','encounter','draft'].includes(s.phase)?s.round+1:s.round;
 if(!s.growth&&!skipTargetPenalty(s,round))return '';
 if(s.growth?.curve!=='rising'&&!skipTargetPenalty(s,round))return en?'ORIGINAL TARGETS':'原版目标';
 return round===1?(en?'RISING TARGETS':'成长目标'):(en?'DICE ×':'骰点 ×')+(s.goalHistory.find(x=>x.round===round)?.factor??targetFactor({...s,round:round-1}));
}
