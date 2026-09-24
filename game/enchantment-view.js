import {CARDS,nameOf} from './cards.js';
import {ENCHANTMENTS,enchantmentText} from './enchantments.js';

const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function enchantmentHTML(card,lang='zh'){
 const pressed=card.pressWeight>1?`<span class="pressed-label">${lang==='en'?'PRESSED SCORE':'压牌计分'} ×${card.pressWeight}</span>`:'';
 const e=ENCHANTMENTS[card.enchantment];if(!e)return pressed;
 const i=lang==='en'?1:0,effect=enchantmentText(card,card.enchantment,CARDS)||e.text;
 return pressed+`<span class="card-enchantment" data-enchantment="${card.enchantment}"><b class="card-enchantment-label">${esc(e.name[i])}</b><span class="card-enchantment-effect">${esc(effect[i])}</span></span>`;
}
export function enchantedName(card,lang='zh'){
 const e=ENCHANTMENTS[card.enchantment];
 return nameOf(card.original||card.kind,lang)+(e?` · ${e.name[lang==='en'?1:0]}`:'')+(card.pressWeight>1?` · ×${card.pressWeight}`:'');
}
