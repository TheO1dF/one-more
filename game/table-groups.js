import {typeOf,icon} from './cards.js';
import {onTable,value} from './engine.js';
import {points} from './points.js';

// Display only: every folded card remains on the battlefield for rules/targeting.
export function tableGroups(s,{expanded=false,flow=null,selected=null}={}){
 const all=onTable(s),pair=all.find(c=>c.uid===selected)?.pair;
 const eligible=all.filter(c=>c.uid!==selected&&!(pair&&c.pair===pair)&&(c.pair||typeOf(c)==='tool'&&c.tapped));
 const enabled=!Number.isInteger(s.lesson)&&all.length>=10&&eligible.length>=4;
 const folded=enabled&&!expanded&&!flow?eligible:[];
 const ids=new Set(folded.map(c=>c.uid));
 return {visible:all.filter(c=>!ids.has(c.uid)),folded,eligible,enabled,expanded:!!(expanded||flow)};
}
export function settledHTML(s,groups,lang='zh',busy=false,pulse=false){
 if(!groups.enabled)return '';
 const en=lang==='en',paired=groups.eligible.filter(c=>c.pair),spent=groups.eligible.filter(c=>!c.pair);
 return `<div class="settled-tray"><button class="${pulse&&groups.expanded?'collapse-pulse':''}" data-action="table-expand" aria-expanded="${groups.expanded}" ${busy?'disabled':''}>
 <span class="settled-icons" aria-hidden="true">${groups.eligible.slice(0,3).map(c=>icon(c.kind)).join('')}</span>
 <span>${groups.expanded?en?'Too many cards? Tidy the table':'牌多了？收拢桌面':`${paired.length?`${en?'Paired':'已配对'} ${paired.length} · ${points(paired.reduce((n,c)=>n+value(s,c),0))}${en?' pts':'分'}`:''}${paired.length&&spent.length?' / ':''}${spent.length?`${en?'Spent tools':'已横置'} ${spent.length}`:''}`}</span>
 <b>${groups.expanded?(en?'TIDY':'收拢'):(en?'EXPAND':'展开')}</b></button></div>`;
}
