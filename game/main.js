import { BOONS, CARDS, RELICS, PACKAGES, VERSION, nameOf, typeOf, icon } from './cards.js';
import { SAVE_KEY, PREF_KEY, newRun, practiceRun, restore, act, card, onTable, active, foods, troubles, tiredTools, knownCards, partners, pairKind, value, score, toolProblem } from './engine.js';
import { dicePractice, paidFoods, needsFoodCost } from './engine.js';
import { renderView } from './view.js';
import { cancelPresentation, rememberTable, moveTable, revealCard, opening, rollDice } from './presentation.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let prefs = { lang: 'zh', sound: true, motion: true };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch {}
let state = readSave(), screen = 'home', selected = null, flow = null, lastReveal = null, toastTimer;
let busy = false, performance = null, boonChoice = 'scout';
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
    const notes = type === 'pair' ? [440, 660, 880] : type === 'bomb' ? [75, 51] : [type === 'draw' ? 250 : 370];
    notes.forEach((f, i) => { const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .065; o.type = type === 'bomb' ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.065, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .14); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + .16); });
  } catch {}
}
const ERRORS = {
  oil: ['先清理油污，工具才能使用。', 'Clear the oil spill before using tools.'],
  tapped: ['已使用；配对薄荷糖可以恢复工具。', 'Exhausted. A Mint pair can ready it.'],
  foodCost: ['需要一个可用的未配对食材。', 'An available, unpaired food is required.'],
  sealed: ['封存中，暂时不能使用。', 'Sealed cards cannot be used.'],
  noTrouble: ['目前没有可处理的麻烦牌。', 'There is no active trouble to target.'],
  fog: ['浓雾阻止交换牌堆中的牌。', 'Thick fog prevents draw-pile swaps.'],
  needKnown: ['先查看牌，需要两张已知的非炸弹牌。', 'Peek first. Two known non-bomb cards are required.'],
  noEcho: ['还没有成功结算的配对能力。', 'No pair ability has resolved yet.'],
  noTired: ['没有其他已使用的工具可恢复。', 'There is no other exhausted tool to ready.'],
  noPaid: ['没有用于支付的食材可取回。', 'No spent food can be reclaimed.'],
  chooseRelic: ['请先选择一件遗物。', 'Choose a relic first.'],
  first: ['先翻出本轮第一张牌。', 'Reveal the first card of this round first.'],
};
function errorText(code) { return ERRORS[code] ? textAt(ERRORS[code]) : tr('这个操作当前不可用，请重新选择。', 'That action is unavailable. Please choose again.'); }
async function dispatch(action) {
  if (busy) return;
  const positions = rememberTable();
  try {
    state = act(state, action); flow = null; lastReveal = action.type === 'draw' ? state.table.at(-1) : null;
    if (lastReveal) selected = lastReveal;
    if (selected && card(state, selected)?.zone !== 'table') selected = null;
    performance = action.type === 'draw' ? 'draw' : action.type === 'next' ? 'opening' : action.type === 'roll' ? 'dice' : action.type === 'relic' && action.id === 'shaker' ? 'shuffle' : 'move';
    busy = true; save(); render();
    if (performance === 'draw') await revealCard(selected, prefs.lang, state.reason === 'bomb');
    else if (performance === 'opening') await opening(prefs.lang);
    else if (performance === 'shuffle') await opening(prefs.lang, false);
    else if (performance === 'dice') await rollDice(state.dice.result, prefs.lang);
    else await moveTable(positions);
    sound(state.reason === 'bomb' ? 'bomb' : action.type);
  } catch (error) { flow = null; notify(errorText(error.message)); }
  finally { busy = false; performance = null; render(); }
}
async function start(starter = 'variety') {
  const random = new Uint32Array(1); crypto.getRandomValues(random); state = newRun(random[0], starter); screen = 'game'; selected = null; flow = null; lastReveal = null; busy = true; performance = 'opening'; save(); render(); window.scrollTo(0, 0);
  try { await opening(prefs.lang); } finally { busy = false; performance = null; render(); }
}
function ask(label, choices, choose) { flow = { label, choices, choose }; render(); }
function choice(c, detail = '') { return { id: c.uid, label: name(c.kind), kind: c.kind, detail }; }
function chooseTarget(action, kind, except = null) {
  const targets = ['rice', 'ginger'].includes(kind) ? troubles(state) : kind === 'mint' ? tiredTools(state, except) : kind === 'toast' ? paidFoods(state) : [];
  if (!targets.length || kind === 'fish') { dispatch(action); return; }
  const options = targets.map(c => choice(c));
  if (action.type === 'pair' || kind === 'ginger') options.push({ id: null, label: tr('不选择目标', 'Without a target') });
  ask(['rice', 'ginger'].includes(kind) ? tr('清理哪张麻烦？', 'Which trouble will you clear?') : kind === 'toast' ? tr('取回哪个食材？', 'Which spent food will you reclaim?') : tr('恢复哪件工具？', 'Which tool will you ready?'), options, target => dispatch({ ...action, target }));
}
function beginPair(uid) {
  const options = partners(state, uid); if (!options.length) return;
  ask(tr('选择另一半', 'Choose its partner'), options.map(c => choice(c)), id => {
    const kind = pairKind(card(state, uid), card(state, id)); chooseTarget({ type: 'pair', ids: [uid, id] }, kind);
  });
}
function beginUse(uid) {
  const c = card(state, uid), problem = toolProblem(state, c); if (problem) { notify(errorText(problem)); return; }
  const action = { type: 'use', uid };
  const finish = current => {
    if (['cloth', 'jar'].includes(c.kind)) ask(tr('选择要处理的麻烦', 'Choose a trouble card'), troubles(state).map(x => choice(x)), target => dispatch({ ...current, target }));
    else if (c.kind === 'bell') chooseTarget(current, state.lastPair, uid);
    else dispatch(current);
  };
  if (needsFoodCost(state, c)) {
    ask(tr('收走一个食材作为费用', 'Spend one unpaired food'), foods(state).map(x => choice(x, tr(`少收 ${value(state, x)} 分`, `Forgo ${value(state, x)} points`))), food => finish({ ...action, food }));
  } else if (c.kind === 'sorter') {
    const known = knownCards(state).filter(c => c.kind !== 'bomb');
    ask(tr('选择第一张已知牌', 'Choose the first known card'), known.map(c => choice(c, tr(`第 ${c.index + 1} 张`, `Position ${c.index + 1}`))), first => {
      ask(tr('与哪张牌交换？', 'Swap with which card?'), known.filter(c => c.uid !== first).map(c => choice(c, tr(`第 ${c.index + 1} 张`, `Position ${c.index + 1}`))), second => dispatch({ ...action, ids: [first, second] }));
    });
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
  const total = state.bank + score(state) - (carry ? value(state, card(state, carry)) : 0);
  if (total < state.target) ask(tr(`只有 ${total} / ${state.target} 分，离桌会结束本局。`, `Only ${total} / ${state.target}. Leaving ends this run.`), [{ id: 'stay', label: tr('留在牌桌', 'Stay at the table') }, { id: 'leave', label: tr('结束本局', 'End this run') }], id => { if (id === 'leave') dispatch({ type: 'stop', carry }); else { flow = null; render(); } });
  else dispatch({ type: 'stop', carry });
}
function beginStop() {
  const available = foods(state).filter(c => !c.temporary && state.cards.some(x => !x.temporary && x.original !== 'bomb' && x.uid !== c.uid));
  if (state.relics.includes('lunchbox') && state.round < state.maxRounds && available.length) {
    ask(tr('带一个食材到下一轮？', 'Keep a food for next round?'), [{ id: null, label: tr('全部结算', 'Cash out everything'), detail: `${score(state)}` }, ...available.map(c => choice(c, tr(`本轮收 ${score(state) - value(state, c)} 分`, `Cash out ${score(state) - value(state, c)}`)))], finishStop);
  } else finishStop();
}
function mini(kind, count = null) { return `<span class="mini" style="--card:${CARDS[kind].color}">${icon(kind)}<span>${name(kind)}${count ? ` ×${count}` : ''}</span></span>`; }
function logText(e) {
  const n = e.kind ? name(e.kind) : '';
  const entries = {
    round: [ `第 ${e.n} 轮，首张安全。`, `Round ${e.n}. First reveal is safe.` ],
    practice: ['发酵还差一次翻牌。桌面已经为你摆好。', 'One reveal left to ferment. The table is set for you.'],
    reveal: [`翻出 ${n}`, `Revealed ${n}`], pair: [`${n} 配对成功`, `${n} paired`],
    pay: [`收走 ${n}，支付工具费用`, `Spent ${n} on a tool`], clear: [`清理了 ${n}`, `Cleared ${n}`],
    ready: [`${n} 恢复可用`, `${n} is ready again`], use: [`使用 ${n}`, `Used ${n}`],
    peek: [`看到了接下来的 ${e.n} 张`, `Peeked at ${e.n} upcoming card(s)`],
    seal: [`${n} 已封存；等待两次翻牌`, `${n} sealed; wait two reveals`], ferment: ['发酵完成 → 万能酱', 'Fermentation complete → Wild sauce'],
    caught: [`保鲜膜扣住了 ${n}`, `Cling film sealed ${n}`], wish: [`许愿：${n}`, `Wished for ${n}`], wishHit: [`愿望实现：${n}`, `Wish fulfilled: ${n}`],
    swap: ['两张已知牌交换了位置', 'Swapped two known cards'], shuffle: ['剩余牌堆已重洗；已知位置作废', 'Remaining pile shuffled; known positions cleared'],
    cash: [`本轮收下 ${e.n} 分`, `Cashed out ${e.n} points`], bomb: ['炸弹。今夜到此为止。', 'Bomb. The night ends here.'],
    recover: [`取回了 ${n}`, `Reclaimed ${n}`], split: ['拆开一对，食材可以用于支付', 'Pair broken; its food can now pay costs'],
    delayedPeek: [`查看 ${e.n} 张已延迟到下次翻牌后`, `Peek ${e.n} delayed until after the next reveal`], sift: [`滤掉 ${n}，不触发翻出效果`, `Filtered ${n} without revealing it`], rusted: [`${n} 被铁锈横置`, `Rust exhausted ${n}`],
    relay: [`接力铃：${n} 下次使用免费`, `Relay bell: the next use of ${n} is free`], candle: ['连续两张麻烦，烛台照亮下一张', 'Two troubles: Candlestick reveals a glimpse'], stove: ['预热炉加快了一次发酵', 'Preheater advanced fermentation'],
    tea: ['热茶接在食材后，查看下一张', 'Tea followed food: peek at the next card'], timetable: [`时刻表：第 ${e.n} 次翻牌`, `Timetable: reveal ${e.n}`], freeUse: ['本次工具费用已免除', 'This tool cost was waived'],
    boon: [e.boon ? `临时援助：${textAt(BOONS[e.boon].name)}` : '', e.boon ? `Boon: ${textAt(BOONS[e.boon].name)}` : ''],
  };
  return textAt(entries[e.key] || ['', '']);
}
function inspector() {
  if (state.pending === 'wish') {
    const options = [...new Set(state.cards.map(c => c.original))].filter(k => CARDS[k].type === 'food' && k !== 'wild');
    return `<aside class="inspector choosing"><p class="eyebrow">${tr('许个愿', 'MAKE A WISH')}</p><h2>${tr('你在等哪一种食材？', 'Which food are you waiting for?')}</h2><div class="choice-list">${options.map(k => button('wish', mini(k), `data-id="${k}"`, false, 'choice')).join('')}</div></aside>`;
  }
  if (flow) return `<aside class="inspector choosing"><p class="eyebrow">${tr('完成这个操作', 'MAKE YOUR MOVE')}</p><h2>${flow.label}</h2><p class="fine">${tr('选定前不会消耗卡牌。', 'Nothing is spent until your choice is complete.')}</p><div class="choice-list">${flow.choices.map((c, i) => button('choose', `${c.kind ? icon(c.kind) : ''}<span>${esc(c.label)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</span>`, `data-index="${i}"`, false, 'choice')).join('')}</div>${button('cancel', tr('取消', 'Cancel'), '', false, 'outline')}</aside>`;
  const c = selected ? card(state, selected) : null;
  if (!c || c.zone !== 'table') return `<aside class="inspector"><p class="eyebrow">${tr('你的下一步', 'YOUR NEXT MOVE')}</p><h2>${state.flips ? tr('桌上还有什么机会？', 'What can this table do?') : tr('先翻开一张。', 'Turn over the first card.')}</h2><p>${tr('点击食材寻找配对，点击工具查看用法。空格翻牌，Esc 取消选择。', 'Select food to find a pair, or a tool to use it. Space to reveal; Esc to cancel.')}</p></aside>`;
  const def = CARDS[c.kind]; let actions = '';
  if (c.sealedBy) actions = `<div class="status-box">${c.ferment ? tr(`再翻出 ${c.ferment} 张非炸弹牌，变为万能酱。`, `${c.ferment} more non-bomb reveals to become Wild sauce.`) : tr('封存中。清理保鲜膜即可释放。', 'Sealed. Clear the Cling film to release it.')}</div>`;
  else if (typeOf(c) === 'food') actions = `${button('pair', tr('配对', 'Pair'), `data-uid="${c.uid}"`, !partners(state, c.uid).length, 'primary')}<p class="fine">${c.pair ? tr('这一对的能力已结算，配对加分保留到收摊。', 'This pair’s ability has resolved. Its bonus remains until cash-out.') : c.pairedOnce ? tr('已拆开，本轮不能再次配对。仍可支付工具费用。', 'Previously split: cannot pair again this round, but may pay tool costs.') : partners(state, c.uid).length ? tr('选择桌上的另一半。', 'Choose its partner on the table.') : tr('还没有合适的另一半。也可以保留它支付工具费用。', 'No partner yet. You may also save it for a tool cost.')}</p>`;
  else if (typeOf(c) === 'tool') { const problem = toolProblem(state, c); actions = `${button('use', tr('使用工具', 'Use tool'), `data-uid="${c.uid}"`, !!problem, 'primary')}<p class="fine">${problem ? errorText(problem) : c.freeCost ? tr('接力：本次使用免费。', 'Relay: this use is free.') : state.freePayments && needsFoodCost({ ...state, freePayments: 0 }, c) ? tr(`餐券剩余 ${state.freePayments} 次。`, `${state.freePayments} meal waivers left.`) : tr('使用后整张卡横置。', 'The whole card turns sideways after use.')}</p>`; }
  else if (c.kind === 'oil') actions = `${button('wipe', tr('花一个食材清理', 'Spend food to clear'), `data-uid="${c.uid}"`, !foods(state).length, 'primary')}<p class="fine">${tr('也可以配对饭团清理，不需要使用工具。', 'A Rice pair can also clear it without using a tool.')}</p>`;
  else if (['stove', 'relay', 'candle', 'rust'].includes(c.kind)) actions = `<p class="fine">${tr(`本轮已触发 ${c.triggers} 次`, `Triggered ${c.triggers} time(s) this round`)}</p>`;
  else if (c.kind === 'wish') actions = `<div class="status-box">${c.wish ? tr(`正在等待：${name(c.wish)}`, `Waiting for: ${name(c.wish)}`) : tr('本轮愿望已完成。', 'Wish completed this round.')}</div>`;
  return `<aside class="inspector"><div class="inspect-art" style="--card:${def.color}">${icon(c.kind)}</div><p class="eyebrow">${typeName(typeOf(c))}${typeOf(c) === 'food' ? ` / ${tr('当前', 'NOW')} ${value(state, c)}` : ''}</p><h2>${name(c.kind)}</h2><p class="card-rule">${textAt(def.text)}</p>${actions}</aside>`;
}
function groupedDeck() { const groups = {}; for (const c of state.cards.filter(c => !c.temporary)) { (groups[c.original] ??= []).push(c); } return groups; }
function showDialog(title, content) {
  dialog.innerHTML = `<div class="dialog-heading"><h2>${title}</h2>${button('close', tr('关闭', 'Close'))}</div>${content}`; if (!dialog.open) dialog.showModal();
}
function showRules() {
  const rules = [
    ['逐张翻牌，配对或使用工具，再决定是否收摊。首台累计目标 30 分；共五台。达标才可以顺利收摊。', 'Reveal cards, form pairs and use tools, then choose when to cash out. Meet each target to proceed. The first cumulative target is 30; survive five tables.'],
    ['每轮首张安全。牌组中永远有一张炸弹，正式翻出立即结束本局。查看不算翻出。', 'The first reveal of each round is safe. There is always one bomb: revealing it ends the run immediately. Peeking is not revealing.'],
    ['两张同名食材配对后各计 20 分，并结算一次配对能力。单张通常计 10 分，桌面会自动算好。', 'Pair two matching foods: each scores 20 and the pair resolves one ability. Unpaired food normally scores 10. Totals are automatic.'],
    ['收摊后掷两颗 d6：左十位、右个位，得到 11–66，累加到下一台目标。多赚的分数会留给后续。', 'After cash-out roll two d6: tens left, ones right, producing 11–66. Add that to the next target. Banked surplus carries forward.'],
    ['接受 ≤23：牌库加入一张纸团。接受 ≥51：选择下一轮的临时援助。可自愿重掷一次，新结果替换旧结果。', 'Accept 23 or less: add a Paper scrap. Accept 51 or more: choose a boon for the next round only. One optional reroll replaces the result.'],
    ['顺序牌只认真正翻出的牌。查看、取回、变形不算翻出。延迟查看在下一张非炸弹牌翻出后先结算，然后处理已有来源的触发，最后处理新牌自己的能力。', 'Sequence abilities count actual reveals only. Peeking, reclaiming and transforming are not reveals. Deferred peeks resolve after the next non-bomb reveal, then existing-source triggers, then the new card’s ability.'],
    ['万能酱只能与非万能食材配对。每张实体牌每轮只参与一次配对。', 'Wild sauce pairs with non-wild food only. A physical card can participate in only one pair per round.'],
    ['工具使用后横置；薄荷配对可以恢复。支付费用的食材移入本轮弃牌区，下一轮回到牌组。', 'Used tools become exhausted; a Mint pair can ready them. Spent food goes to the round’s discard area and returns to the deck next round.'],
    ['卡牌默认留桌持续生效。封存牌暂时无效；发酵只由之后真正翻出的非炸弹牌推进。', 'Cards remain on the table. Sealed cards are inactive. Only subsequent committed non-bomb reveals advance fermentation.'],
    ['同一事件按来源入桌先后自动结算。先结算完整个操作，再进行下一步；不能在炸弹出现后使用工具或遗物。', 'Simultaneous triggers resolve in table-entry order. Finish the whole operation before taking another action. No tool or relic can respond after the bomb appears.'],
    ['摇签筒只重洗剩余牌堆，包含炸弹；中途洗牌不再保护下一张。分拣夹不能选择炸弹。', 'The Shaking cup shuffles the remaining pile, including the bomb. It does not renew first-card protection. Sorting tongs cannot select the bomb.'],
    ['每轮收摊后可免费添加一组牌、删除一张牌，各一次，也可以跳过。麻烦和临时变形下轮复原。', 'After cash-out, optionally add one package and remove one card, each free and once per round. Trouble states and temporary transformations reset next round.'],
    ['组合练习采用固定牌序。随机挑战使用独立随机牌序；练习不会覆盖挑战进度。', 'Combo practice uses a fixed order. Challenges use random orders. Practice does not overwrite challenge progress.'],
  ];
  showDialog(tr('怎么玩', 'How to play'), `<ol class="rules">${rules.map(r => `<li>${textAt(r)}</li>`).join('')}</ol>`);
}
function showCatalog() {
  const counts = state ? groupedDeck() : {};
  showDialog(tr('卡牌图鉴', 'Card collection'), `${state ? `<p class="fine">${tr(`当前牌组共 ${state.cards.length} 张。显示组成，不显示牌序。`, `Your deck has ${state.cards.length} cards. Composition only; draw order stays hidden.`)}</p>` : ''}<div class="catalog-grid">${Object.entries(CARDS).map(([k, def]) => `<article class="catalog-card" style="--card:${def.color}">${icon(k)}<div><small>${typeName(def.type)}${counts[k] ? ` · ×${counts[k].length}` : ''}</small><h3>${name(k)}</h3><p>${textAt(def.text)}</p></div></article>`).join('')}</div>`);
}
function render() {
  const scroll = document.querySelector('.card-field')?.scrollTop || 0;
  document.documentElement.lang = prefs.lang === 'en' ? 'en' : 'zh-CN'; document.title = 'One More？'; document.documentElement.dataset.motion = prefs.motion === false ? 'reduced' : 'full'; document.body.dataset.busy = String(busy);
  app.innerHTML = renderView({ s: state, screen, prefs, selected, flow, busy, performance, boonChoice, inspect: state ? inspector() : '', logText, saved: readSave() });
  const field = document.querySelector('.card-field'); if (field) field.scrollTop = scroll;
}
function handle(action, node) {
  if (action === 'skip-animation') { cancelPresentation(); return; }
  if (busy) return;
  const uid = Number(node?.dataset.uid), id = node?.dataset.id;
  if (action === 'new') start();
  else if (action === 'mixed') start('mixed');
  else if (action === 'classic') start('classic');
  else if (action === 'dice-practice') { state = dicePractice(); screen = 'game'; selected = null; flow = null; render(); }
  else if (action === 'retry') start(state.starter);
  else if (action === 'practice') { state = practiceRun(); screen = 'game'; selected = 4; flow = null; lastReveal = null; render(); window.scrollTo(0, 0); }
  else if (action === 'continue') { state = readSave(); screen = 'game'; selected = null; flow = null; render(); }
  else if (action === 'home') { screen = 'home'; flow = null; state = readSave(); render(); window.scrollTo(0, 0); }
  else if (action === 'language') { prefs.lang = prefs.lang === 'en' ? 'zh' : 'en'; flow = null; savePrefs(); render(); }
  else if (action === 'sound') { prefs.sound = !prefs.sound; savePrefs(); render(); }
  else if (action === 'motion') { prefs.motion = !prefs.motion; savePrefs(); render(); }
  else if (action === 'fullscreen') { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); p?.catch(() => notify(tr('当前浏览器不支持全屏。', 'Fullscreen is unavailable in this browser.'))); }
  else if (action === 'rules') showRules();
  else if (action === 'catalog') showCatalog();
  else if (action === 'log') showDialog(tr('刚刚发生', 'What just happened'), `<ol class="rules">${state.log.slice(-20).reverse().map(e => `<li>${logText(e)}</li>`).join('')}</ol>`);
  else if (action === 'close') dialog.close();
  else if (action === 'select') {
    if (flow) { if (flow.choices.some(option => option.id === uid)) flow.choose(uid); return; }
    if (state.pending) return;
    selected = uid; lastReveal = null; render();
  }
  else if (action === 'cancel') { flow = null; render(); }
  else if (action === 'choose') { const f = flow; if (f) f.choose(f.choices[Number(node.dataset.index)].id); }
  else if (action === 'pair') beginPair(uid);
  else if (action === 'use') beginUse(uid);
  else if (action === 'wipe') ask(tr('收走哪个食材来清理油污？', 'Which food will clear the oil?'), foods(state).map(c => choice(c)), food => dispatch({ type: 'wipeOil', uid, food }));
  else if (action === 'relic') beginRelic(id);
  else if (action === 'stop') beginStop();
  else if (action === 'draw' && !flow && !state.pending) dispatch({ type: 'draw' });
  else if (action === 'wish') dispatch({ type: 'wish', kind: id });
  else if (action === 'add' || action === 'chooseRelic') dispatch({ type: action, id });
  else if (action === 'remove') dispatch({ type: 'remove', uid });
  else if (action === 'next') { dispatch({ type: 'next' }); window.scrollTo(0, 0); }
  else if (action === 'roll') dispatch({ type: 'roll' });
  else if (action === 'boon') { boonChoice = id; render(); }
  else if (action === 'acceptDice') dispatch({ type: 'acceptDice', boon: boonChoice });
}
document.addEventListener('click', e => { const node = e.target.closest('button[data-action]'); if (!node || node.disabled) return; handle(node.dataset.action, node); });
document.addEventListener('keydown', e => {
  if (e.code === 'Escape' && busy) { e.preventDefault(); cancelPresentation(); return; }
  if (dialog.open || busy) return;
  if (e.code === 'Escape' && flow) { e.preventDefault(); flow = null; render(); }
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(e.target.tagName)) return;
  if (e.code === 'Space' && !e.repeat && screen === 'game' && state?.phase === 'play' && !flow && !state.pending) { e.preventDefault(); dispatch({ type: 'draw' }); }
});
document.addEventListener('fullscreenchange', () => { if (!busy) render(); });
render();
