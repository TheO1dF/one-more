import { BOONS, CARDS, RELICS, PACKAGES, VERSION, nameOf, typeOf, icon } from './cards.js';
import { SAVE_KEY, PREF_KEY, newRun, practiceRun, restore, act, card, onTable, active, foods, troubles, tiredTools, knownCards, partners, pairKind, value, score, toolProblem } from './engine.js';
import { dicePractice, paidFoods, needsFoodCost, payableFoods, transformableFoods, INITIAL_TARGET, MAX_ROUNDS } from './engine.js';
import { renderView } from './view.js';
import { cancelPresentation, rememberTable, moveTable, revealCard, opening, rollDice, shakeDice } from './presentation.js';

import { layoutTable } from './layout.js';
import { initDice } from './d20.js';
import { ENCHANTMENTS, ROUTES } from './routes.js';
import { routeTargets, cashValue, kitchenPractice, systemPractice, effectTargets, hasTrouble } from './engine.js';
import {EXTRA_CARDS} from './extra-cards.js';
import {TRIALS} from './trials.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let prefs = { lang: 'zh', sound: true, motion: true };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch {}
let state = readSave(), screen = 'home', selected = null, flow = null, lastReveal = null, toastTimer;
let busy = false, performance = null, boonChoice = 'sauce', diceInHand = true, tablePage = 0, focusCardUid = null, drag = null, suppressClickUntil = 0;
const tr = (zh, en) => prefs.lang === 'en' ? en : zh;
const textAt = values => values[prefs.lang === 'en' ? 1 : 0];
const name = kind => nameOf(kind, prefs.lang);
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const typeName = type => ({ food: tr('食材', 'FOOD'), tool: tr('工具', 'TOOL'), device: tr('装置', 'DEVICE'), trouble: tr('麻烦', 'TROUBLE'), bomb: tr('炸弹', 'BOMB') })[type];
const button = (action, label, extra = '', disabled = false, cls = '') => `<button data-action="${action}" ${extra} ${disabled || busy ? 'disabled' : ''} class="${cls}">${label}</button>`;
function readSave() { try { return restore(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
function save() {
  try { if (state && !state.practice) localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { notify(tr('浏览器未能保存进度；保持此页打开可继续玩。', 'Progress could not be saved. Keep this page open to continue.')); }
}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} }
function notify(message) { const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3000); }
let audio;
function sound(type) {
  if (!prefs.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {});
    if(type==='bomb'){
      const t=audio.currentTime,buffer=audio.createBuffer(1,audio.sampleRate*.65,audio.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**2;
      const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(1800,t);filter.frequency.exponentialRampToValueAtTime(90,t+.6);gain.gain.value=.22;source.connect(filter).connect(gain).connect(audio.destination);source.start(t);return;
    }
    const notes = type === 'pair' ? [440, 660, 880] : type === 'bomb' ? [75, 51] : [type === 'draw' ? 250 : 370];
    notes.forEach((f, i) => { const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .065; o.type = type === 'bomb' ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.065, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + .16); });
  } catch {}
}
const ERRORS = {
  oil: ['先清理油污，工具才能使用。', 'Clear the oil spill before using tools.'],
  tapped: ['已使用；配对薄荷糖可以恢复工具。', 'Exhausted. A Mint pair can ready it.'],
  foodCost: ['需要1张可作为费用消耗的食材。', 'One food that can be consumed as a cost is required.'],
  sealed: ['封存中，暂时不能使用。', 'Sealed cards cannot be used.'],
  noTrouble: ['目前没有可处理的麻烦牌。', 'There is no active trouble to target.'],
  fog: ['浓雾阻止交换牌堆中的牌。', 'Thick fog prevents draw-pile swaps.'],
  needKnown: ['先查看牌，需要两张已知的非炸弹牌。', 'Peek first. Two known non-bomb cards are required.'],
  noEcho: ['还没有成功结算的配对能力。', 'No pair ability has resolved yet.'],
  noTired: ['没有其他已使用的工具可恢复。', 'There is no other exhausted tool to ready.'],
  noPaid: ['没有作为工具费用消耗的食材可取回。', 'No food consumed as a tool cost can be reclaimed.'],
  noFood: ['需要一个未配对的普通食材。', 'An unpaired non-wild food is required.'],
  noTarget: ['没有符合卡牌效果的目标。','No valid target for this effect.'],
  noPeek: ['先清理杂音，才能查看未知顶牌。', 'Clear Interference to peek at an unknown top card.'],
  empty: ['牌库已空。', 'The deck is empty.'],
  chooseRelic: ['请先选择一件遗物。', 'Choose a relic first.'],
  choosePackage: ['先选一组牌，再去下一桌。', 'Take one package before the next table.'],
  pointsCost: ['已装袋分数不足。','Not enough banked points.'],
  routeCost: ['已装袋分数不足。', 'Not enough banked points.'],
  first: ['先翻出本轮第一张牌。', 'Reveal the first card of this round first.'],
};
function errorText(code) { return ERRORS[code] ? textAt(ERRORS[code]) : tr('这个操作当前不可用，请重新选择。', 'That action is unavailable. Please choose again.'); }
async function dispatch(action, gesture = {}) {
  if (busy) return;
  const positions = rememberTable();
  const drawnUid = action.type === 'draw' ? state.draw[0] : null;
  try {
    state = act(state, action); flow = null;
    if(action.type==='roll') diceInHand=false;
    if(action.type==='stop'||action.type==='next') diceInHand=true;
    if(action.type==='next')tablePage=0;
    if(action.type==='draw')focusCardUid=drawnUid; lastReveal = drawnUid;
    if (lastReveal) selected = lastReveal;
    if (selected && card(state, selected)?.zone !== 'table') selected = null;
    performance = action.type === 'draw' ? 'draw' : action.type === 'next' ? 'opening' : action.type === 'roll' ? 'dice' : action.type === 'relic' && action.id === 'shaker' ? 'shuffle' : 'move';
    busy = true; save(); render();
    if (performance === 'draw') await revealCard(selected, prefs.lang, state.reason === 'bomb',()=>sound('bomb'));
    else if (performance === 'opening') await opening(prefs.lang);
    else if (performance === 'shuffle') await opening(prefs.lang, false);
    else if (performance === 'dice') await rollDice(state.dice.result, prefs.lang, gesture);
    else await moveTable(positions);
    if(state.reason!=='bomb')sound(action.type);
  } catch (error) { flow = null; notify(errorText(error.message)); }
  finally { busy = false; performance = null; render(); }
}
async function start(starter = 'variety') {
  const random = new Uint32Array(1); crypto.getRandomValues(random); state = newRun(random[0], starter); tablePage=0; diceInHand=true; screen = 'game'; selected = null; flow = null; lastReveal = null; busy = true; performance = 'opening'; save(); render(); window.scrollTo(0, 0);
  try { await opening(prefs.lang); } finally { busy = false; performance = null; render(); }
}
function ask(label, choices, choose) { flow = { label, choices, choose }; render(); }
function choice(c, detail = '') { return { id: c.uid, label: name(c.kind), kind: c.kind, detail }; }
function beginRoute(id) {
  const route = ROUTES[id]; if (!state.routeOffers?.includes(id)) return;
  if (route.type === 'event') { dispatch({ type: 'chooseRoute', id }); return; }
  const label = route.type === 'remove'
    ? tr(`删去1张牌 · 装袋 ${state.bank} → ${state.bank - route.cost}`, `Remove one card · Bank ${state.bank} → ${state.bank - route.cost}`)
    : textAt(route.name) + ' · ' + textAt(ENCHANTMENTS[id].text);
  ask(label, routeTargets(state, id).map(c => ({ id: c.uid, kind: c.original, label: name(c.original), detail: textAt(CARDS[c.original].text), enchantment: c.enchantment })), uid => dispatch({ type: 'chooseRoute', id, uid }));
}
function chooseTarget(action, kind, except = null) {
  if(action.type==='pair'&&hasTrouble(state,'cold')){dispatch(action);return;}
  const targets = kind === 'rice' ? troubles(state) : kind === 'mint' ? tiredTools(state, except) : kind === 'toast' ? paidFoods(state) : kind==='cheese'?foods(state).filter(c=>!action.ids.includes(c.uid)):[];
  if (!targets.length || kind === 'fish') { dispatch(action); return; }
  const options = targets.map(c => choice(c));
  if (action.type === 'pair') options.push({ id: null, label: tr('不选择目标', 'Without a target') });
  ask(['rice', 'ginger'].includes(kind) ? tr('清理', 'CLEAR') : kind === 'toast' ? tr('取回', 'RECLAIM') : kind==='cheese'?tr('复制','COPY'):tr('恢复', 'READY'), options, target => dispatch({ ...action, target }));
}
function beginPair(uid) {
  const options = partners(state, uid); if (!options.length) return;
  ask(tr('配对', 'PAIR'), options.map(c => choice(c)), id => {
    const kind = pairKind(card(state, uid), card(state, id)); chooseTarget({ type: 'pair', ids: [uid, id] }, kind);
  });
}
function beginUse(uid) {
  const c = card(state, uid), problem = toolProblem(state, c); if (problem) { notify(errorText(problem)); return; }
  const action = { type: 'use', uid };
  const finish = current => {
    if(CARDS[c.kind].target)ask(textAt(CARDS[c.kind].text),effectTargets(state,c).map(x=>choice(x,textAt(CARDS[x.kind].text))),target=>dispatch({...current,target}));
    else if (['cloth', 'jar'].includes(c.kind)) ask(c.kind==='jar'?tr('制酱','MAKE SAUCE'):tr('清理', 'CLEAR'), troubles(state).map(x => choice(x)), target => dispatch({ ...current, target }));
    else if (c.kind === 'bell') chooseTarget(current, 'mint', uid);
    else if (c.kind === 'stove') ask(tr('调味','MAKE SAUCE'), transformableFoods(state).map(x=>choice(x)),target=>dispatch({...current,target}));
    else if (['mold','juicer'].includes(c.kind)) ask(c.kind==='mold'?tr(`复制 · 装袋 ${state.bank} → ${state.bank-CARDS[c.kind].bankCost}`,`Copy · Bank ${state.bank} → ${state.bank-CARDS[c.kind].bankCost}`):tr('消耗1食材，生成果汁和残渣各1张','Consume one food; create one Juice and one Residue'), foods(state).map(x=>choice(x)), target=>dispatch({...current,target}));
    else dispatch(current);
  };
  if (needsFoodCost(state, c)) {
    ask(tr('消耗食材', 'CONSUME FOOD'), payableFoods(state).map(x => choice(x, x.enchantment==='boiled'&&!x.boiledUsed?tr('水煮：无需消耗，留在桌上','Boiled: not consumed; stays in play'):x.pair?tr('拆开对子，消耗此牌','Break pair; consume this food'):tr('消耗此牌','Consume this food'))), food => finish({ ...action, food }));
  } else finish(action);
}
function beginRelic(id) {
  if (id === 'shaker') dispatch({ type: 'relic', id });
  if (id === 'recycler') ask(tr('取回哪个食材？', 'Reclaim which food?'), state.cards.filter(c => c.zone === 'discard' && c.paid && typeOf(c) === 'food').map(c => choice(c)), uid => dispatch({ type: 'relic', id, uid }));
  if (id === 'splitter') {
    const seen = new Set(); const options = onTable(state).filter(c => { if (!c.pair || seen.has(c.pair)) return false; seen.add(c.pair); return true; });
    ask(tr('拆开哪一对？本轮不能再次配对。', 'Break which pair? It cannot pair again this round.'), options.map(c => choice(c)), uid => dispatch({ type: 'relic', id, uid }));
  }
}
function finishStop(carry = null) {
  const total = state.bank + cashValue(state, carry);
  if (total < state.target) ask(tr(`只有 ${total} / ${state.target} 分，离桌会结束本局。`, `Only ${total} / ${state.target}. Leaving ends this run.`), [{ id: 'stay', label: tr('留在牌桌', 'Stay at the table') }, { id: 'leave', label: tr('结束本局', 'End this run') }], id => { if (id === 'leave') dispatch({ type: 'stop', carry }); else { flow = null; render(); } });
  else dispatch({ type: 'stop', carry });
}
function beginStop() {
  const available = foods(state).filter(c => !c.temporary && state.cards.some(x => !x.temporary && x.original !== 'bomb' && x.uid !== c.uid));
  if (state.relics.includes('lunchbox') && state.round < state.maxRounds && available.length) {
    ask(tr('带一个食材到下一轮？', 'Keep a food for next round?'), [{ id: null, label: tr('全部结算', 'Cash out everything'), detail: `${score(state)}` }, ...available.map(c => choice(c, tr(`本轮收 ${cashValue(state, c.uid)} 分`, `Cash out ${cashValue(state, c.uid)}`)))], finishStop);
  } else finishStop();
}
function mini(kind, count = null) { return `<span class="mini" style="--card:${CARDS[kind].color}">${icon(kind)}<span>${name(kind)}${count ? ` ×${count}` : ''}</span></span>`; }
function logText(e) {
  const n = e.kind ? name(e.kind) : '';
  const entries = {
    round: [ `第 ${e.n} 台`, `Table ${e.n}` ],
    practice: ['练习', 'Practice'],
    reveal: [`翻出 ${n}`, `Revealed ${n}`], pair: [`${n} 配对成功`, `${n} paired`],
    pay: [`消耗 ${n} 作为工具费用`, `Consumed ${n} as a tool cost`], clear: [`清理了 ${n}`, `Cleared ${n}`],
    ready: [`${n} 恢复可用`, `${n} is ready again`], use: [`使用 ${n}`, `Used ${n}`],
    peek: [e.offset?`查看第 ${e.offset+1} 张`:`看到了接下来的 ${e.n} 张`,e.offset?`Peeked at card ${e.offset+1}`:`Peeked at ${e.n} upcoming card(s)`],
    ferment: ['变成万能酱', 'Turned into Wild sauce'],
    swap: ['两张已知牌交换了位置', 'Swapped two known cards'], shuffle: ['剩余牌堆已重洗；已知位置作废', 'Remaining pile shuffled; known positions cleared'],
    cash: [`装袋 ${e.n}`, `Banked ${e.n}`], bomb: ['爆炸', 'Bomb'],
    recover: [`取回了 ${n}`, `Reclaimed ${n}`], split: ['拆开一对，食材可作为费用消耗', 'Pair broken; its food can now be consumed as a cost'],
    tickets: [`工具食材费用为0：+${e.n}次`, `Tool food cost 0: +${e.n} uses`], relicReady: ['遗物已恢复', 'Relics refreshed'], gift: ['获得临时万能酱', 'Gained temporary Wild sauce'], blockedPeek: ['杂音阻止查看', 'Interference blocked the peek'],
    sift: [`弃置顶牌：${n}`, `Discarded top card: ${n}`], rusted: [`${n} 横置入桌`, `${n} entered exhausted`], freeUse: ['本次工具费用无需消耗食材', 'No food consumed for this tool cost'],
    boon: [e.boon ? `临时援助：${textAt(BOONS[e.boon].name)}` : '', e.boon ? `Boon: ${textAt(BOONS[e.boon].name)}` : ''],
    boiled: [`水煮：${n} 无需消耗，留在桌上`, `Boiled: ${n} was not consumed and stayed in play`],
    generate: [`生成临时 ${n}`, `Created temporary ${n}`],
    spendPoints: [`消耗 ${e.n} 分装袋分数`, `Consumed ${e.n} banked points`],
    consume: [`消耗 ${n}`, `Consumed ${n}`],
    retained:[`${n} 留在桌上，未被消耗`,`${n} stayed in play without being consumed`],
    protectedFood:[`${n} 下次被消耗时留桌`,`${n} will stay in play when next consumed`],
    clearSight:['本桌查看不受浓雾与杂音影响','Peeks ignore Fog and Interference this table'],
    toolScoring:['本桌已横置工具额外计1分','Exhausted tools score 1 extra point this table'],
    allReady:['所有工具已恢复','All tools readied'],
    foodQueued:['下次生成临时食材多1张','Next temporary food creation gets one extra copy'],
    extraFood:[`额外生成 ${e.n} 张临时食材`,`Created ${e.n} extra temporary food(s)`],
    pairReset:[`${n} 重新可配对`,`${n} can pair again`],
    bottom:[`${n} 放到牌堆底部`,`${n} put on the bottom of the draw pile`],
    doubleUse:[`${n} 接下来可使用2次`,`${n} has two uses before exhausting`],
    permanentFood:[`${n} 收入永久牌组`,`${n} added to the permanent deck`],
    discover: [`从牌组外获得临时 ${n}`, `Discovered temporary ${n}`],
    routeReward: [e.route ? textAt(ROUTES[e.route].name) : '', e.route ? textAt(ROUTES[e.route].name) : ''],
  };
  return textAt(entries[e.key] || ['', '']);
}
function inspector() {
  if(flow)return `<aside class="inspector choosing"><h2>${flow.label}</h2><div class="choice-list">${flow.choices.map((c,i)=>button('choose',`${c.kind?icon(c.kind):''}<span>${esc(c.label)}${c.detail?`<small>${esc(c.detail)}</small>`:''}</span>`,`data-index="${i}"`,false,'choice')).join('')}</div>${state?.pending?'':button('cancel',tr('取消','CANCEL'),' ',false,'outline')}</aside>`;
  const c=selected?card(state,selected):null;
  if(!c||c.zone!=='table')return '<aside class="inspector empty-inspector"></aside>';
  let action='';
  if(c.sealedBy)action=`<span class="status-box">${tr(c.ferment?'发酵':'封存',c.ferment?'FERMENT':'SEALED')}</span>`;
  else if(typeOf(c)==='food')action=CARDS[c.kind].noPair?`<span class="status-box">${tr('不可配对','CANNOT PAIR')}</span>`:button('pair',tr('配对','PAIR'),`data-uid="${c.uid}"`,!partners(state,c.uid).length,'primary');
  else if(typeOf(c)==='tool')action=button('use',tr('使用','USE'),`data-uid="${c.uid}" title="${toolProblem(state,c)?esc(errorText(toolProblem(state,c))):''}"`,!!toolProblem(state,c),'primary');
  else if(c.kind==='oil')action=button('wipe',tr('清理','CLEAR'),`data-uid="${c.uid}"`,!foods(state).length,'primary');
  return `<aside class="inspector"><div class="inspect-art">${icon(c.kind)}</div><p class="eyebrow">${typeName(typeOf(c))}</p><h2>${name(c.kind)}</h2><p class="card-rule">${textAt(CARDS[c.kind].text)}${c.enchantment?`<span class="enchant-rule"><b>${textAt(ENCHANTMENTS[c.enchantment].name)}</b> · ${textAt(ENCHANTMENTS[c.enchantment].text)}${c.enchantment==='boiled'&&c.boiledUsed?tr('（本轮已用）',' (used this round)'):''}</span>`:''}</p>${c.keepOnce?`<p class="card-status">${tr('下次被消耗时留在桌上','Stays in play when next consumed')}</p>`:''}${c.extraUses?`<p class="card-status">${tr('还可使用2次后横置','Two uses before exhausting')}</p>`:''}${action}</aside>`;
}
function groupedDeck() { const groups = {}; for (const c of state.cards.filter(c => !c.temporary)) { (groups[c.original] ??= []).push(c); } return groups; }
function showDialog(title, content) {
  dialog.innerHTML = `<div class="dialog-heading"><h2>${title}</h2>${button('close', tr('关闭', 'Close'))}</div>${content}`; if (!dialog.open) dialog.showModal();
}
function showRules(){
 const rules=[
 ['普通食材2分，配对4＋4；散牌指未配对食材。','Regular food: 2. A pair: 4 + 4; unpaired food is not in a pair.'],
 [`首台目标${INITIAL_TARGET}分，共${MAX_ROUNDS}台，装袋分数保留。`,`${MAX_ROUNDS} tables, starting target ${INITIAL_TARGET}; banked points carry over.`],
 ['首张安全，炸弹翻出即死亡。','First reveal is safe; revealing the bomb kills you.'],
 ['点击骰子摇动，拖入骰盘掷出。','Click to shake; drag into the tray to throw.'],
 ['d20点数累加到下一台目标，可重掷一次。','Add the d20 result to the next target; one reroll.'],
 ['1：加入赊账单、生锈、纸团；20：下桌获得12分临时盛宴；两者锁定。','1: add Tab, Rust and Scrap; 20: a temporary 12-point Feast; both lock.'],
 ['2–5：加入纸团；15–19：选择临时奖励。','2–5: add Scrap; 15–19: choose a temporary boon.'],
 ['轮末选择一条岔路，再选一组牌；每组都带麻烦。','Choose one of two paths, then take one package; every package includes trouble.'],
 ['每张食材最多1种永久附魔；回收摊扣除已装袋分数来删牌。','Each food holds one permanent enchantment; the Salvage stall removes cards for banked points.'],
 ['消耗的食材进入垃圾桶；只有明确写出生成残渣的效果才会生成残渣。','Consumed food enters the discard pile; Residue is created only when the effect explicitly says so.'],
 ['可乐合计1／5／9／13…分，不参与配对；冰箱按桌上鱼干数量计分。','Colas together score 1 / 5 / 9 / 13… and cannot pair; Fridge scores per Dried fish in play.'],
 ['装置持续生效；查看、变形和生成临时牌不算翻牌。','Devices stay active; peeking, transforming and creating tokens are not reveals.'],
 ['使用工具后横置；配对每张每轮一次；封存时失效。','Used tools turn sideways; each card pairs once per round; sealed cards are inactive.'],
 ];showDialog(tr('规则','RULES'),`<ol class="rules">${rules.map(r=>`<li>${textAt(r)}</li>`).join('')}</ol>`);
}
function showCatalog(filter='all') {
 const counts=state?groupedDeck():{},entries=Object.entries(CARDS).filter(([k,d])=>filter==='all'||filter==='new'&&EXTRA_CARDS[k]||d.type===filter);
 const filters=[['all',tr('全部80','All 80')],['new',tr('新增44','New 44')],...['food','tool','device','trouble'].map(t=>[t,typeName(t)])];
 showDialog(tr('卡牌图鉴 · 80种','CARD COLLECTION · 80'),`<div class="catalog-filters">${filters.map(([id,label])=>button('catalog-filter',label,`data-id="${id}" aria-pressed="${filter===id}"`,false,filter===id?'primary':'')).join('')}${button('trials',tr('试新牌','Try cards'))}</div><div class="catalog-grid">${entries.map(([k,def])=>`<article class="catalog-card" data-kind="${k}" style="--card:${def.color}">${icon(k)}<div><small>${typeName(def.type)}${EXTRA_CARDS[k]?tr(' · 新',' · NEW'):def.tokenOnly?tr(' · 生成牌',' · TOKEN'):''}${counts[k]?` · ×${counts[k].length}`:''}</small><h3>${name(k)}</h3><p>${textAt(def.text)}</p></div></article>`).join('')}</div>`);
}
function showTrials(){showDialog(tr('试新牌','TRY NEW CARDS'),`<div class="trial-grid">${Object.entries(TRIALS).map(([id,t])=>button('trial',`<div class="trial-art">${t.cards.slice(0,3).map(k=>icon(k)).join('')}</div><strong>${textAt(t.name)}</strong>`,`data-id="${id}"`,false,'trial-choice')).join('')}</div>`);}
function showDeck(){
  if(!state)return;
  const groups=groupedDeck(),order={food:0,tool:1,device:2,trouble:3,bomb:4},entries=Object.entries(groups).sort(([a],[b])=>order[CARDS[a].type]-order[CARDS[b].type]);
  const counts={};for(const [kind,copies] of entries)counts[CARDS[kind].type]=(counts[CARDS[kind].type]||0)+copies.length;
  const total=Object.values(groups).reduce((n,a)=>n+a.length,0);
  showDialog(tr('当前牌组','CURRENT DECK'),`<div class="deck-summary"><strong>${total} ${tr('张','CARDS')}</strong>${Object.entries(counts).map(([type,n])=>`<span>${typeName(type)} <b>${n}</b></span>`).join('')}</div><div class="catalog-grid owned-deck">${entries.map(([kind,copies])=>`<article class="catalog-card owned-card" data-kind="${kind}" data-count="${copies.length}" style="--card:${CARDS[kind].color}">${icon(kind)}<div><small>${typeName(CARDS[kind].type)}</small><h3>${name(kind)} <b>×${copies.length}</b></h3><p>${textAt(CARDS[kind].text)}</p>${Object.entries(ENCHANTMENTS).filter(([id])=>copies.some(c=>c.enchantment===id)).map(([id,e])=>`<span class="deck-enchantment" title="${esc(textAt(e.text))}">${textAt(e.name)} ×${copies.filter(c=>c.enchantment===id).length}</span>`).join('')}</div></article>`).join('')}</div>`);
}
function showDiscard(){
  if(!state)return;
  showDialog(tr('垃圾桶 · 弃牌堆','BIN · DISCARD PILE'),`<p class="fine">${tr('本桌弃置与消耗的牌','Cards discarded or consumed this table')} · ${state.discard.length}</p><div class="catalog-grid discard-pile">${[...state.discard].reverse().map(uid=>{const c=card(state,uid);return `<article class="catalog-card" data-uid="${uid}">${icon(c.kind)}<div><small>${c.paid?tr('作为工具费用消耗','CONSUMED AS A TOOL COST'):c.consumed?tr('已消耗','CONSUMED'):tr('已弃置','DISCARDED')}${c.temporary?tr(' · 临时',' · TEMPORARY'):''}</small><h3>${name(c.kind)}</h3><p>${textAt(CARDS[c.kind].text)}</p></div></article>`;}).join('')}</div>${state.discard.length?'':`<p>${tr('还没有弃牌','No discarded cards')}</p>`}`);
}
function render() {
  if (screen === 'game' && state?.pending?.type === 'discover') {
    flow = { label: state.pending.pool==='tool'?tr('选1件临时工具','Choose one temporary tool'):tr('备餐：选1张临时食材', 'SERVE: choose one temporary food'), choices: state.pending.offers.map(kind => ({ id: kind, kind, label: name(kind), detail: textAt(CARDS[kind].text) })), choose: kind => dispatch({ type: 'discover', kind }) };
  }
  if(screen==='game'&&state?.pending?.type==='sift'){
    const top=card(state,state.pending.uid);
    flow={label:tr('筛选：','SIFT: ')+name(top.kind),choices:[{id:false,label:tr('留在顶端','KEEP ON TOP'),kind:top.kind},...(top.kind==='bomb'?[]:[{id:true,label:tr('弃置','DISCARD'),kind:top.kind}])],choose:discard=>dispatch({type:'resolveSift',discard})};
  }
  document.documentElement.lang = prefs.lang === 'en' ? 'en' : 'zh-CN'; document.title = 'One More？'; document.documentElement.dataset.motion = prefs.motion === false ? 'reduced' : 'full'; document.body.dataset.busy = String(busy);
  app.innerHTML = renderView({ s: state, screen, prefs, selected, flow, busy, performance, boonChoice, inspect: state ? inspector() : '', logText, saved: readSave(), diceInHand });
  tablePage=layoutTable({page:tablePage,focusUid:focusCardUid,lang:prefs.lang}).page;focusCardUid=null;initDice();
}
function handle(action, node) {
  if (action === 'skip-animation') { cancelPresentation(); return; }
  if (busy) return;
  const uid = Number(node?.dataset.uid), id = node?.dataset.id;
  if (action === 'new') start();
  else if (action === 'mixed') start('mixed');
  else if (action === 'classic') start('classic');
  else if (action === 'dice-practice') { state = dicePractice(); diceInHand=true; screen = 'game'; selected = null; flow = null; render(); }
  else if (action === 'retry') start(state.starter);
  else if (action === 'new-cards'||action==='trials')showTrials();
  else if(action==='trial'){dialog.close();state=systemPractice(id);tablePage=0;screen='game';selected=id==='kitchen'?6:state.table[0];flow=null;lastReveal=null;render();window.scrollTo(0,0);}
  else if (action === 'practice') { state = practiceRun(); tablePage=0; screen = 'game'; selected = 4; flow = null; lastReveal = null; render(); window.scrollTo(0, 0); }
  else if (action === 'continue') { state = readSave(); diceInHand=!state?.dice?.result; tablePage=0; screen = 'game'; selected = null; flow = null; render(); }
  else if (action === 'home') { screen = 'home'; flow = null; state = readSave(); render(); window.scrollTo(0, 0); }
  else if (action === 'language') { prefs.lang = prefs.lang === 'en' ? 'zh' : 'en'; flow = null; savePrefs(); render(); }
  else if (action === 'sound') { prefs.sound = !prefs.sound; savePrefs(); render(); }
  else if (action === 'motion') { prefs.motion = !prefs.motion; savePrefs(); render(); }
  else if (action === 'fullscreen') { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); p?.catch(() => notify(tr('当前浏览器不支持全屏。', 'Fullscreen is unavailable in this browser.'))); }
  else if (action === 'rules') showRules();
  else if (action === 'catalog') showCatalog();
  else if(action==='catalog-filter')showCatalog(id);
  else if (action === 'deck') showDeck();
  else if (action === 'discard') showDiscard();
  else if (action === 'log') showDialog(tr('刚刚发生', 'What just happened'), `<ol class="rules">${state.log.slice(-20).reverse().map(e => `<li>${logText(e)}</li>`).join('')}</ol>`);
  else if (action === 'close') dialog.close();
  else if (action === 'select') {
    if (flow) { if (flow.choices.some(option => option.id === uid)) flow.choose(uid); return; }
    if (state.pending) return;
    selected = uid; lastReveal = null; render();
  }
  else if (action === 'cancel') { if(state?.pending?.type==='sift')dispatch({type:'resolveSift',discard:false});else if(!state?.pending){flow = null; render();} }
  else if (action === 'choose') { const f = flow; if (f) f.choose(f.choices[Number(node.dataset.index)].id); }
  else if (action === 'pair') beginPair(uid);
  else if (action === 'use') beginUse(uid);
  else if (action === 'wipe') ask(tr('消耗哪个食材来清理油污？', 'Consume which food to clear the oil?'), foods(state).map(c => choice(c)), food => dispatch({ type: 'wipeOil', uid, food }));
  else if (action === 'relic') beginRelic(id);
  else if (action === 'stop') beginStop();
  else if (action === 'draw' && !flow && !state.pending) dispatch({ type: 'draw' });
  else if (action === 'wish') dispatch({ type: 'wish', kind: id });
  else if (action === 'add' || action === 'chooseRelic') dispatch({ type: action, id });
  else if (action === 'route') beginRoute(id);
  else if (action === 'next') { dispatch({ type: 'next' }); window.scrollTo(0, 0); }
  else if (action === 'throw-die' && diceInHand) dispatch({type:'roll'});
  else if (action === 'shake-die') shakeDice();
  else if (action === 'pick-die' && !state.dice.result?.locked && state.dice.rolls.length<2) {diceInHand=true;render();shakeDice();}
  else if (action === 'table-page') {tablePage=Number(node.dataset.page);render();}
  else if (action === 'boon') { boonChoice = id; render(); }
  else if (action === 'acceptDice') dispatch({ type: 'acceptDice', boon: boonChoice });
}
document.addEventListener('click', e => { const node = e.target.closest('button[data-action]'); if (!node || node.disabled || window.performance.now()<suppressClickUntil) return; handle(node.dataset.action, node); });
document.addEventListener('keydown', e => {
  if (e.code === 'Escape' && busy) { e.preventDefault(); cancelPresentation(); return; }
  if (dialog.open || busy) return;
  if (e.code === 'Escape' && flow) { e.preventDefault(); handle('cancel'); }
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(e.target.tagName)) return;
  if (e.code === 'Space' && !e.repeat && screen === 'game' && state?.phase === 'play' && !flow && !state.pending) { e.preventDefault(); dispatch({ type: 'draw' }); }
});
document.addEventListener('fullscreenchange', () => { if (!busy) render(); });
render();

document.addEventListener('pointerdown',e=>{const node=e.target.closest('#die-hand');if(!node||busy)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,node,moved:false};node.setPointerCapture(e.pointerId);});
document.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(drag.moved){drag.node.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(dx/5)+'deg)';drag.node.classList.add('dragging');}});
document.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;d.node.style.transform='';d.node.classList.remove('dragging');if(!d.moved)return;suppressClickUntil=window.performance.now()+300;const r=document.querySelector('#dice-tray')?.getBoundingClientRect();if(r&&e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top&&e.clientY<r.bottom)dispatch({type:'roll'},{dx:(e.clientX-d.x)/Math.max(r.width,1)});});
document.addEventListener('pointercancel',()=>{if(drag){drag.node.style.transform='';drag.node.classList.remove('dragging');drag=null;}});
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!busy&&!drag)render();});});
