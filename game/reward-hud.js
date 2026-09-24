import {economyEnabled,rewardProgress} from './table-rewards.js';
import {points} from './points.js';
import {reducedMotion} from './motion.js';

export function rewardHUD(s,lang,tableScore,target){
 const en=lang==='en',gate=s.rewardGate,locked=economyEnabled(s)&&gate&&!gate.unlocked;
 const need=Math.max(0,target-s.bank),now=locked?rewardProgress(s,tableScore):tableScore,goal=locked?gate.goal:need;
 const label=locked?`${en?'Card pack':'卡包'} ${points(Math.max(0,now))} / ${points(goal)}`:gate?.unlocked?(en?'Card pack secured · Table target progress':'卡包已解锁 · 本桌目标进度'):(en?'Table target progress':'本桌目标进度');
 return `<div class="score-box target-score reward-target" id="reward-target" data-reward-locked="${!!locked}"><small>${en?'THIS TABLE NEEDS':'本桌需得'}</small><strong>${points(need)}</strong><div class="meter ${locked?'pack-meter':''}" role="progressbar" title="${label}" aria-label="${label}" aria-valuemin="0" aria-valuemax="${Math.max(1,goal)}" aria-valuenow="${goal?Math.max(0,Math.min(goal,now)):1}"><i style="width:${goal?Math.max(0,Math.min(100,now/goal*100)):100}%"></i></div></div>`;
}

// A local, non-blocking cue. Re-rendering the HUD simply removes it.
export function rewardUnlockFeedback(lang,cue){
 const target=document.querySelector('#reward-target');if(!target)return;
 const note=document.createElement('span');note.className='pack-unlocked-note';note.role='status';note.textContent=lang==='en'?'✓ CARD PACK':'✓ 卡包已解锁';target.append(note);cue('reward');
 const quiet=reducedMotion();
 const pulse=target.querySelector('.meter').animate([{boxShadow:'0 0 0 0 #f0c66b'},{boxShadow:'0 0 0 5px #f0c66b',offset:.3},{boxShadow:'0 0 0 0 transparent'}],{duration:quiet?120:650});
 const float=note.animate(quiet?[{opacity:1},{opacity:1},{opacity:0}]:[{opacity:0,transform:'translateY(8px) scale(.92)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.15},{opacity:1,transform:'translateY(0)',offset:.8},{opacity:0,transform:'translateY(-7px)'}],{duration:1600,easing:'ease-out'});
 void float.finished.catch(()=>{}).finally(()=>note.remove());void pulse.finished.catch(()=>{});
}
