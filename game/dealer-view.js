import {bribeHTML,eventSelectionCount,eventBaseCost,bribeOffer} from './bribes.js';
import {pressCandidates,pressedWeight} from './card-crafting.js';
import {points} from './points.js';
import {CARDS,RELICS,icon} from './cards.js';
import {ROUTES,ENCHANTMENTS} from './routes.js';
import {SETBACKS,permanentFoods,effectiveTarget,tableCondition} from './dealer-events.js';
import {routeTargets,reprintTargets} from './engine.js';
import {eventCard} from './dealer-art.js';
import {panEncounterHTML} from './pan-view.js';
import {sceneArt} from './world-art.js';
import {routeFragment} from './story-fragments.js';
import {enchantedName} from './enchantment-view.js';
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function conditionHTML(s,lang='zh'){
 const c=tableCondition(s);if(!c)return '';const en=lang==='en',next=c.round>s.round;
 if(c.cap)return `<div class="condition-banner">${en?'HOUSE LIMIT · Surplus is not banked':'封顶结算 · 超额不入袋'}</div>`;
 return `<div class="condition-banner doubled-target" role="status" data-target-before="${s.target}" data-target-after="${effectiveTarget(s)}"><b>×2</b><span>${en?(next?'NEXT TABLE ONLY':'THIS TABLE ONLY'):(next?'仅下桌累计目标翻倍':'本桌累计目标翻倍')}</span><strong>${points(s.target)} → ${points(effectiveTarget(s))}</strong>${c.wager?`<small>${en?`Cash out successfully: +${c.prizes||1} random pledged item(s)`:`达标收摊：随机抵押物 +${c.prizes||1}`}</small>`:''}</div>`;
}
export function receiptHTML(s,lang='zh'){
 const r=s.eventReceipt;if(!r)return '';const en=lang==='en',tx=a=>a[en?1:0],d=SETBACKS[r.id]||ROUTES[r.id];
 const detail=r.id==='press'?`${en?'Merged score':'压牌计分'} ×${r.pressed.pressWeight}`:r.id==='pan'?`${tx(RELICS.pangift.name)} · −${r.amount}`:r.id==='pawn'?`${tx(RELICS[r.relic].name)} → ${r.receivedRelic?tx(RELICS[r.receivedRelic].name):'+'+r.amount}`:r.id==='closingmeal'?`${r.removed.map(c=>tx(CARDS[c.original].name)).join(' / ')} → ${tx(RELICS[r.relic].name)}`:r.id==='coldlocker'?`${en?'Stored for next table':'留到下桌'} · ${(r.storedIds||[r.stored]).map(uid=>tx(CARDS[s.cards.find(c=>c.uid===uid)?.kind||'rice'].name)).join(' / ')} · −3`:r.id==='levy'?`−${r.amount}`:r.gained?`+ ${r.copied?enchantedName(r.copied,lang):tx(CARDS[r.gained].name)}${r.amount?` · −${r.amount}`:''}`:r.removed?.length?r.removed.map(c=>tx(CARDS[c.original].name)).join(' / '):d?.text?tx(d.text):'';
 return `<div class="dealer-receipt"><strong>${tx(d.name)}</strong><span>${esc(detail)}${r.copies?` ×${r.copies}`:''}${r.bribe?` · ${en?'Bribe':'贿赂'} −${r.bribe}`:''}${r.refund?` · +${r.refund}`:''}${r.recovered?` · ${en?'Recovered':'已赎回'}`:''}</span></div>`;
}
export function encounterHTML(s,lang,pick={},busy=false){
 if(s.encounter.id==='pan')return panEncounterHTML(s,lang,busy,pick);
 const en=lang==='en',tr=(a,b)=>en?b:a,tx=a=>a[en?1:0],e=s.encounter,r=SETBACKS[e.id]||ROUTES[e.id],ids=pick.uids||[],up=pick.bribe===true,count=eventSelectionCount(e.id,up);
 const totalCost=eventBaseCost(e)+(up?(bribeOffer(e.id,ENCHANTMENTS,s)?.cost||0):0);
 const button=(a,label,attrs='',disabled=false,cls='outline')=>`<button class="${cls}" data-action="${a}" ${attrs} ${disabled||busy?'disabled':''}>${label}</button>`;
 const selectCard=(c,role,selected)=>`<button class="deal-select ${selected?'chosen':''}" data-action="event-pick" data-role="${role}" ${role==='kind'?`data-id="${c}"`:`data-uid="${c.uid}"`} aria-pressed="${selected}" ${busy?'disabled':''}>${eventCard(c,lang)}</button>`;
 let body='',ready=e.applied||['lantern','tea','helper','wager'].includes(e.id);
 if(e.id==='press'){
  const lead=s.cards.find(c=>c.uid===ids[0]),choices=pressCandidates(s,CARDS).filter(c=>!lead||c.uid===lead.uid||c.original===lead.original);
  body=`<p>${tr('先选保留附魔的主牌，再选同名食材。','Choose the lead card first, then a matching food.')}</p><div class="dealer-foods">${choices.map(c=>selectCard(c,'food',ids.includes(c.uid))).join('')}</div>${ids.length===2?`<div class="press-preview">${tr('合成后计分','MERGED SCORE')} ×${pressedWeight(lead,s.cards.find(c=>c.uid===ids[1]),up)}<small>${tr('只保留一张牌，能力触发一次','One card; abilities trigger once')}</small></div>`:''}`;ready=ids.length===count;
 }else if(e.applied)body=`${receiptHTML(s,lang)}${s.eventReceipt?.removed.map(c=>eventCard(c,lang)).join('')||''}`;
 else if(e.id==='coldlocker'){
  const choices=permanentFoods(s,CARDS).filter(c=>c.zone!=='stored'&&c.zone!=='parcel'&&CARDS[c.kind].type==='food');body=`<div class="dealer-foods">${choices.map(c=>selectCard(c,up?'food':'target',up?ids.includes(c.uid):pick.uid===c.uid)).join('')}</div>`;ready=up?ids.length===2:choices.some(c=>c.uid===pick.uid);
 }else if(e.id==='menuchange'){
  const choices=reprintTargets(s,pick.kind);body=`<h2>${tr('换成哪张？','REPLACE WITH')}</h2><div class="dealer-offers">${e.offers.map(k=>selectCard(k,'kind',pick.kind===k)).join('')}</div><h2>${tr('交出1张食材 · 保留兼容附魔','GIVE ONE FOOD · COMPATIBLE ENCHANTMENTS KEPT')}</h2><div class="dealer-foods">${choices.map(c=>selectCard(c,'target',pick.uid===c.uid)).join('')}</div>`;ready=s.bank>=4&&e.offers.includes(pick.kind)&&choices.some(c=>c.uid===pick.uid);
 }else if(e.id==='closingmeal'){
  const pledge=RELICS[e.prize];body=`<div class="closing-prize">${icon(pledge.icon)}<strong>${tx(pledge.name)}</strong><p>${tx(pledge.text)}</p></div><h2>${tr(`永久移除食材 · ${ids.length}/${count}`,`REMOVE FOODS · ${ids.length}/${count}`)}</h2><div class="dealer-foods">${permanentFoods(s,CARDS).map(c=>selectCard(c,'food',ids.includes(c.uid))).join('')}</div>`;ready=ids.length===count;
 }else if(e.id==='trade'){
  body=`<h2>${tr('荷官的报价 · 选1张','THE OFFER · CHOOSE ONE')}</h2><div class="dealer-offers">${e.offers.map(k=>selectCard(k,'kind',pick.kind===k)).join('')}</div><h2>${tr(`交出食材 · ${ids.length}/${count}`,`GIVE FOODS · ${ids.length}/${count}`)}</h2><div class="dealer-foods">${permanentFoods(s,CARDS).map(c=>selectCard(c,'food',ids.includes(c.uid))).join('')}</div>`;ready=ids.length===count&&e.offers.includes(pick.kind);
 }else if(e.id==='duplicate'){
  const cards=s.cards.filter(c=>!c.temporary&&c.original!=='bomb');
  body=`<div class="dealer-foods">${cards.map(c=>selectCard(c,'target',pick.uid===c.uid)).join('')}</div>`;ready=s.bank>=6&&cards.some(c=>c.uid===pick.uid);
 }else if(e.id==='pawn'){
  const pledge=(id,role,selected)=>button('event-pick',`${icon(RELICS[id].icon)}<strong>${tx(RELICS[id].name)}</strong><small>${tx(RELICS[id].text)}</small>`,`data-role="${role}" data-id="${id}" aria-pressed="${selected}"`,false,'pawn-select '+(selected?'chosen':''));
  body=`<p class="dealer-price">${up?tr('以物换物 · 不领取典当分数','TRADE ITEMS · NO POINTS PAYOUT'):'+'+e.quote+' '+tr('装袋分数','BANKED POINTS')}</p><h2>${tr('交出1件抵押物','GIVE ONE PLEDGED ITEM')}</h2><div class="dealer-foods">${s.relics.map(id=>pledge(id,'relic',pick.relic===id)).join('')}</div>${up?`<h2>${tr('换取1件抵押物','RECEIVE ONE PLEDGED ITEM')}</h2><div class="dealer-offers pawn-offers">${(e.pledgeOffers||[]).map(id=>pledge(id,'prize',pick.prize===id)).join('')}</div>`:''}`;
  ready=s.relics.includes(pick.relic)&&(!up||e.pledgeOffers?.includes(pick.prize));
 }else if(e.id==='wager')body=`<div class="wager-contract"><small>${tr('下一桌累计目标','NEXT CUMULATIVE TARGET')}</small><b>${s.target} → ${s.target*2}</b><span>${tr(`已有 ${s.bank} 分，仍需 ${Math.max(0,s.target*2-s.bank)} 分`,`Banked ${s.bank}; earn ${Math.max(0,s.target*2-s.bank)} more`)}</span><p>${tr(`达标收摊：随机抵押物 +${up?2:1}`,`Successful cash-out: +${up?2:1} random pledged item(s)`)}</p></div>`;
 else if(ENCHANTMENTS[e.id]||e.id==='prune'){
  body=`${e.id==='prune'?`<p>${tr('消耗4分装袋分数','Consume 4 banked points')}</p>`:`<p>${tx(ENCHANTMENTS[e.id].text)}</p>`}<div class="dealer-foods">${routeTargets(s,e.id).map(c=>selectCard(c,up?'food':'target',up?ids.includes(c.uid):pick.uid===c.uid)).join('')}</div>`;ready=up?ids.length===2:routeTargets(s,e.id).some(c=>c.uid===pick.uid);
 }else {body=`<div class="event-service-art">${icon(r.icon)}</div>`;ready=['lantern','tea','helper','staple'].includes(e.id);}
 ready=ready&&s.bank>=totalCost;
 return `<main class="encounter-shell illustrated-encounter"><section class="event-intro">${sceneArt(e.id,lang,{illustrated:true})}<header class="event-heading"><small>${esc(routeFragment(e.id,lang)[0])}</small><h1>${tx(r.name)}</h1><p class="event-narrative">${esc(routeFragment(e.id,lang)[1])}</p><p>${tx(r.text)}</p><span>${tr('已装袋','BANKED')} ${s.bank}</span></header></section><section class="event-body">${body}${bribeHTML(s,lang,up,busy,ENCHANTMENTS)}</section><footer class="event-actions">${!e.applied?button('event-leave',tr('不成交，继续','PASS'),'',false):''}${button('event-confirm',e.applied?tr('继续','CONTINUE'):tr('确认','CONFIRM'),'',!ready,'primary')}</footer></main>`;
}
