import {CARDS,icon,nameOf} from './cards.js';
import {ruleText} from './rule-text.js';
import {consumptionOrigin,isToolConsumedFood} from './consumption.js';

export function discardKind(c){
 if(isToolConsumedFood(c,CARDS))return 'reclaimable';
 if(consumptionOrigin(c,CARDS)==='tool')return 'tool';
 if(c.consumed)return 'effect';
 return 'discarded';
}
export function discardMark(kind){
 const path=kind==='reclaimable'?'<path d="m7 13 5 5 9-11"/>':kind==='tool'?'<path d="m7 7 14 14M21 7 7 21"/><circle cx="14" cy="14" r="11"/>':kind==='effect'?'<path d="m16 2-5 10 7 3-6 11 2-10-7-3Z"/>':'<path d="M8 9h12l-1 14H9ZM5 6h18M11 3h6"/>';
 return `<svg class="discard-mark" viewBox="0 0 28 28" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
}
export function discardLabel(c,lang='zh'){
 const en=lang==='en',kind=discardKind(c);
 return kind==='reclaimable'||kind==='tool'?(en?'TOOL CONSUMED':'工具消耗'):kind==='effect'?(en?'OTHER EFFECT':'非工具消耗'):(en?'DISCARDED':'弃置 / 清理');
}
export function discardPileHTML(s,lang='zh'){
 const en=lang==='en',counts=s.discard.map(uid=>s.cards.find(c=>c.uid===uid)),eligible=counts.filter(c=>isToolConsumedFood(c,CARDS)).length;
 const legend=en?`Recovery tongs and Toast reclaim ✓ tool-consumed foods. Slotted spoon can reclaim any consumed food.`:`回收钳与吐司取回带 ✓ 的工具消耗食材；漏勺可取回任意已消耗食材。`;
 return `<p class="discard-guide">${ruleText(legend)}</p><p class="discard-count">${en?'Tool-consumed foods':'工具消耗食材'} <b>${eligible}</b> / ${en?'Cards in bin':'垃圾桶牌数'} ${counts.length}</p><div class="catalog-grid discard-pile">${counts.reverse().map(c=>{
  const kind=discardKind(c),source=CARDS[c.consumedBy]?nameOf(c.consumedBy,lang):null;
  const canReclaim=CARDS[c.kind].type==='food'?(isToolConsumedFood(c,CARDS)?(en?'Recovery tongs / Toast ✓':'回收钳 / 吐司 ✓'):(en?'Recovery tongs / Toast ×':'回收钳 / 吐司 ×')):'';
  return `<article class="catalog-card discard-entry discard-${kind}" data-uid="${c.uid}">${icon(c.kind)}<div><span class="discard-label">${discardMark(kind)}${discardLabel(c,lang)}</span><h3>${nameOf(c.kind,lang)}</h3>${source?`<small class="discard-source">${en?'Source: ':'来源：'}${source}</small>`:''}${canReclaim?`<span class="reclaim-status">${ruleText(canReclaim)}</span>`:''}${c.temporary?`<small>${en?'Temporary':'临时牌'}</small>`:''}<p>${ruleText(CARDS[c.kind].text[en?1:0])}</p></div></article>`;
 }).join('')}</div>${counts.length?'':`<p>${en?'No discarded cards':'还没有弃牌'}</p>`}`;
}
