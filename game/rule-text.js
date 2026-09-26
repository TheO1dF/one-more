import {CARDS,RELICS} from './cards.js';
import {bindRelicTooltips} from './relic-tooltip.js';

const escapeHTML=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let pattern,definitionCount=0;
function objectPattern(){
 const definitions=[...Object.values(CARDS),...Object.values(RELICS)];
 if(pattern&&definitions.length===definitionCount)return pattern;
 definitionCount=definitions.length;
 const names=definitions.flatMap(d=>d.name);
 const objects=['抵押物','工具','食材','散食材','装置','麻烦','炸弹','牌库','牌组','牌堆','弃牌堆','垃圾桶','桌面','装袋分数','目标分数','临时牌','永久牌','对子','残渣','分数','pledged items','pledged item','tools','tool','foods','food','devices','device','trouble','bombs','bomb','draw pile','discard pile','discard','deck','banked points','bank','score','points','pairs','pair','tokens','token','residues','residue'];
 const words=[...new Set([...objects,...names])].sort((a,b)=>b.length-a.length);
 pattern=new RegExp(words.map(w=>/^[\x00-\x7f]+$/.test(w)?`\\b${escapeRE(w)}\\b`:escapeRE(w)).join('|'),'gi');return pattern;
}
export function ruleText(text){
 const value=String(text),re=objectPattern();let out='',end=0;
 for(const m of value.matchAll(re)){out+=escapeHTML(value.slice(end,m.index))+`<strong class="rule-object">${escapeHTML(m[0])}</strong>`;end=m.index+m[0].length;}
 return out+escapeHTML(value.slice(end));
}
// Only rules and choices, never dialogue, flavour text or attributes.
export function emphasizeRules(root){
 bindRelicTooltips(root,ruleText);
 const selectors=['.card-rule','.catalog-card p','.package p','.relic-entry p','.preview-detail p','.card-enchantment-effect','.deal-card p','.choice small','.route-target>small','.route-card>p','.route-effect','.boon-choice small','.event-heading>p:not(.event-narrative)','.pawn-select small','.closing-prize p','.pan-gift-terms p','.rules li','.run-options span','.milestone p','.draft-taken>span','.food-waiver-details p'];
 for(const element of root.querySelectorAll(selectors.join(','))){
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];let node;
  while((node=walker.nextNode()))if(node.textContent.trim()&&!node.parentElement.closest('.rule-object,.item-lore'))nodes.push(node);
  for(const n of nodes){const html=ruleText(n.textContent);if(!html.includes('class="rule-object"'))continue;const template=document.createElement('template');template.innerHTML=html;n.replaceWith(template.content);}
 }
}
