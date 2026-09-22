import {posterIcon} from './poster-art.js';
export const autoPairUnlocked=meta=>!!(meta?.achievements?.clear||meta?.specialRewards?.autotongs);
export const autoPairArt=()=>posterIcon('relic-autotongs','auto-pair-art');
export function autoPairJournal(meta,lang='zh'){
 const en=lang==='en',open=autoPairUnlocked(meta);
 return `<section class="reward-journal ${open?'unlocked':'locked'}" data-reward="autotongs">${autoPairArt()}<div><small>${open?(en?'EARNED · TABLE 10':'已获得 · 十桌通关'):(en?'TABLE 10 REWARD':'十桌通关奖励')}</small><h3>${en?'Auto-pair tongs':'自动配对钳'}</h3><p>${en?'Clear table 10 to receive it each run. In endless mode, switch AUTO PAIR on in the pledged-item bar.':'每局通关第10桌获得。进入无限后，在抵押物栏开启「自动配对」。'}</p><p>${en?'Revealed foods pair automatically; matching names first. You still choose discovery rewards.':'翻出的食材自动配对，同名优先；发现奖励仍由你选择。'}</p></div></section>`;
}
