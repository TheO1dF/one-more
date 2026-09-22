import {showSlotMachine} from './slot-machine.js';
import {SKIP_REWARDS} from './momentum.js';
import {canEnchant,enchantmentText,bankCost} from './enchantments.js';
import {pairTargetLimit} from './engine.js';
import {autoPairUnlocked} from './reward-view.js';
import {DRAFT_SERVICES,draftTargets} from './draft-services.js';
import {growthBase} from './growth-lab.js';
import {points} from './points.js';
import {GROWTH_LAB,GROWTH_ROUTES,GROWTH_CARDS,GROWTH_RELICS,registerGrowthContent,growthStorage,growthProgress} from './growth-lab.js';
import {growthMenu,growthJournal} from './growth-view.js';
import {effectiveTarget,SETBACKS} from './dealer-events.js';
import {closedStaple} from './staples.js';
import {stapleReceipt} from './staple-view.js';
import {setCardBack,setArtStyle} from './art-style.js';
import {PALETTES,paletteId,applyPalette,paletteGallery} from './palettes.js';
import {updateTutorialGuide,noteTutorialShake} from './tutorial-guide.js';
import {CardScene,materialLayers,MATERIALS} from './card-view.js';
import {ACHIEVEMENTS,trackProgress} from './progress.js';
import {availableIds,unlockSet,maxDifficulty,CHALLENGES} from './unlock-data.js';
import {journalHTML,runSetupHTML,lockLabel} from './progress-view.js';
import {setFrameRate} from './frame-clock.js';
import {playSound,unlockSound} from './sound.js';
import {actionFeedback,animateScore} from './feedback.js';
import { BOONS, CARDS, RELICS, PACKAGES, VERSION, nameOf, typeOf, icon } from './cards.js';
import { SAVE_KEY, PREF_KEY, newRun, restore, card, onTable, active, foods, troubles, tiredTools, knownCards, partners, pairKind, value, score, toolProblem, relicProblem } from './engine.js';
import { paidFoods, needsFoodCost, payableFoods, transformableFoods, INITIAL_TARGET, MAX_ROUNDS } from './engine.js';
import { renderView } from './view.js';
import { cancelPresentation, rememberTable, moveTable, revealCard, stapleCards, revealStapledCards, dealerPresentation, autoPairReward, opening, rollDice, shakeDice } from './presentation.js';

import { layoutTable } from './layout.js';
import {dragPage,turnPage} from './paging.js';
import {BOMB_INTERVAL,bombGrowth,activeBombCount} from './stakes.js';
import { initDice } from './d20.js';
import { ENCHANTMENTS, ROUTES } from './routes.js';
import { routeTargets, cashValue, effectTargets, hasTrouble } from './engine.js';
import {EXTRA_CARDS} from './extra-cards.js';
import {tutorialRun, tutorialAct, lesson, lessonAllows, tutorialHTML, storyHTML, TUTORIAL_VERSION} from './tutorial.js';
import {cleanLegacy, playerMeta, writeMeta} from './storage.js';
import {music} from './music.js';
import {initialPreferences} from './locale.js';
if(GROWTH_LAB)registerGrowthContent(CARDS,RELICS,PACKAGES);
try{if(!GROWTH_LAB)cleanLegacy(localStorage);}catch{}
const storage=GROWTH_LAB?growthStorage(localStorage):localStorage;
let meta=playerMeta(storage),storyIndex=0;

const app = document.querySelector('#app');
const cardScene = new CardScene();
const dialog = document.querySelector('#dialog');
let prefs = initialPreferences();
try { prefs = initialPreferences(storage.getItem(PREF_KEY)); } catch {}
if(meta.achievements?.clear){meta.ascensionWins??={};meta.ascensionWins[0]=true;}
if(prefs.artStyle==='classic'){meta.legacyArt=true;writeMeta(storage,meta);}
let state = readSave(), screen = 'home', selected = null, flow = null, lastReveal = null, toastTimer;
let busy = false, performance = null, boonChoice = 'sauce', diceInHand = true, tablePage = 0, focusCardUid = null, drag = null, suppressClickUntil = 0;
if(state?.autoPairRewardClaimed&&!GROWTH_LAB){meta.specialRewards??={};meta.specialRewards.autotongs=true;writeMeta(storage,meta);}
let paging=false,replayingTutorial=false,eventPick={},tableExpanded=false;
async function changeTablePage(page,offset=0){
 if(busy||paging)return;
 const pages=Number(document.querySelector('.card-field')?.dataset.pages||1),next=Math.max(0,Math.min(pages-1,page)),direction=Math.sign(next-tablePage);
 paging=true;document.body.dataset.paging='true';
 try{await turnPage(()=>{tablePage=next;render();},direction,offset);}
 finally{paging=false;delete document.body.dataset.paging;}
}
const tr = (zh, en) => prefs.lang === 'en' ? en : zh;
const textAt = values => values[prefs.lang === 'en' ? 1 : 0];
const name = kind => nameOf(kind, prefs.lang);
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const typeName = type => ({ food: tr('食材', 'FOOD'), tool: tr('工具', 'TOOL'), device: tr('装置', 'DEVICE'), trouble: tr('麻烦', 'TROUBLE'), bomb: tr('炸弹', 'BOMB') })[type];
const button = (action, label, extra = '', disabled = false, cls = '') => `<button data-action="${action}" ${extra} ${disabled || busy ? 'disabled' : ''} class="${cls}">${label}</button>`;
function readSave() { try { const s=restore(storage.getItem(SAVE_KEY));return s?.practice?null:Number.isInteger(s?.lesson)&&s.lessonVersion!==TUTORIAL_VERSION?tutorialRun(s.seed):s; } catch { return null; } }
function save() {
  try { if (state && !state.practice && !replayingTutorial) storage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { notify(tr('浏览器未能保存进度；保持此页打开可继续玩。', 'Progress could not be saved. Keep this page open to continue.')); }
}
function savePrefs() { try { storage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} }
function notify(message) { const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3000); }
function sound(type,kind=''){playSound(type,prefs.sound,kind);}
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
  chooseRelic: ['请先选择一件抵押物。', 'Choose a pledged item first.'],
  choosePackage: ['先选一组牌，再去下一桌。', 'Take one package before the next table.'],
  pointsCost: ['已装袋分数不足。','Not enough banked points.'],
  routeCost: ['已装袋分数不足。', 'Not enough banked points.'],
  first: ['先翻出本轮第一张牌。', 'Reveal the first card of this round first.'],
};
function errorText(code) { return ERRORS[code] ? textAt(ERRORS[code]) : tr('这个操作当前不可用，请重新选择。', 'That action is unavailable. Please choose again.'); }
async function dispatch(action, gesture = {}) {
  if (busy || !lessonAllows(state,action)) return;
  const before = state, positions = rememberTable();
  let deferredFeedback,finishedReplay=false;
  const drawnUid = action.type === 'draw' ? state.draw[0] : null;
  const packet=drawnUid?closedStaple(state,drawnUid):null;
  try {
    const wasLesson=!!lesson(state);state = tutorialAct(state, action);if(!replayingTutorial&&!GROWTH_LAB){const unlocked=trackProgress(meta,before,state,action);if(unlocked.length)notify(tr('已解锁 · ','Unlocked · ')+unlocked.map(id=>textAt(ACHIEVEMENTS[id].name)).join(' / '));writeMeta(storage,meta);if(wasLesson&&!lesson(state)){meta.tutorialComplete=true;meta.tutorialVersion=TUTORIAL_VERSION;writeMeta(storage,meta);}}else finishedReplay=wasLesson&&!lesson(state); flow = null;
    if(action.type==='roll') diceInHand=false;
    if(['stop','next','skipTable'].includes(action.type)) diceInHand=true;
    if(action.type==='next'){tablePage=0;tableExpanded=false;}
    if(['chooseRoute','resolveEncounter','leaveEncounter'].includes(action.type))eventPick={};
    if(action.type==='draw')focusCardUid=drawnUid; lastReveal = drawnUid;
    if (lastReveal) selected = lastReveal;
    if (selected && card(state, selected)?.zone !== 'table') selected = null;
    const draftPrune=action.type==='add'&&state.draftReceipt?.removed;
    const skipPrune=action.type==='skipTable'&&state.skipReceipt?.id==='prune';
    const dealerAction=skipPrune||draftPrune||action.type==='chooseRoute'&&(action.id==='prune'||state.encounter?.applied)||action.type==='resolveEncounter'&&!before.encounter?.applied||action.type==='stop'&&state.wagerPrize;
    performance = dealerAction?'dealer':action.type === 'draw' ? packet?'unstaple':'draw' : (action.type==='chooseRoute'&&action.id==='staple'||action.type==='skipTable'&&action.id==='staple')?'staple':['next','retry'].includes(action.type) ? 'opening' : action.type === 'roll' ? 'dice' : action.type === 'relic' && action.id === 'shaker' ? 'shuffle' : 'move';
    busy = true; save(); render();
    if (performance === 'draw') {await Promise.all([moveTable(positions),revealCard(selected, prefs.lang, state.reason === 'bomb',()=>sound('bomb'))]);if(state.reason!=='bomb'){const after=state,lang=prefs.lang;deferredFeedback=()=>actionFeedback(action,before,after,lang,positions);}}
    else if(performance==='staple')await stapleCards(state,state.staples.find(b=>b.id===state.stapleId),prefs.lang,cue=>sound(cue));
    else if(performance==='unstaple'){await revealStapledCards(before,packet,prefs.lang,cue=>sound(cue));const after=state,lang=prefs.lang;deferredFeedback=()=>actionFeedback(action,before,after,lang,positions);}
    else if(performance==='dealer')await dealerPresentation(before,skipPrune?{...state,eventReceipt:{id:'prune',removed:state.skipReceipt.removed}}:draftPrune?{...state,eventReceipt:{id:'prune',removed:[state.draftReceipt.removed]}}:state,action,prefs.lang,cue=>sound(cue));
    else if (performance === 'opening') await opening(prefs.lang,true,activeBombCount(state),state.bombsAddedThisTable);
    else if (performance === 'shuffle') await opening(prefs.lang, false);
    else if (performance === 'dice') await rollDice(state.dice.result, prefs.lang, gesture,(cue,impact)=>sound(cue,String(impact)));
    else { sound(action.type,card(before,action.uid)?.kind); const feedback=actionFeedback(action,before,state,prefs.lang,positions);await moveTable(positions);void feedback.catch(console.error); }
    if(state.reason!=='bomb'&&!['move','dice','staple','unstaple','dealer'].includes(performance))sound(action.type,card(before,action.uid)?.kind);
    if(action.type!=='pair'&&state.log.some(e=>e.id>before.event&&e.key==='autoPair'))sound('pair');
    if(state.phase==='won'&&state.relics.includes('autotongs')&&!state.autoPairRewardPresented){performance='reward';render();await autoPairReward(prefs.lang,cue=>sound(cue));state.autoPairRewardPresented=true;save();}
  } catch (error) {
    flow = null; cancelPresentation();
    console.error('[One More] Action failed: '+action.type,error);
    notify(error instanceof TypeError||error instanceof ReferenceError
      ?tr('页面运行出错，请刷新后继续。','Something went wrong. Reload the page to continue.')
      :errorText(error.message));
  }
  finally { busy = false; performance = null; render();if(state?.phase==='play'&&before?.phase==='play')animateScore(score(before),score(state)); }
  if(deferredFeedback)void deferredFeedback().catch(console.error);
  if(finishedReplay){leaveTutorial();notify(tr('教学完成','Tutorial complete'));}
}
async function resumeReward(){
 if(state?.phase!=='won'||!state.relics.includes('autotongs')||state.autoPairRewardPresented)return;
 busy=true;performance='reward';render();
 try{await autoPairReward(prefs.lang,cue=>sound(cue));state.autoPairRewardPresented=true;save();}
 finally{busy=false;performance=null;render();}
}
function leaveTutorial(){replayingTutorial=false;state=readSave();screen='home';flow=null;selected=null;render();}
async function replayTutorial(){
 dialog.close();replayingTutorial=true;state=tutorialRun(crypto.getRandomValues(new Uint32Array(1))[0]);
 screen='game';selected=null;flow=null;lastReveal=null;tablePage=0;diceInHand=true;busy=true;performance='opening';render();
 try{await opening(prefs.lang);}finally{busy=false;performance=null;render();}
}
async function start(growthRoute=null) {
  if(GROWTH_LAB&&!GROWTH_ROUTES[growthRoute]){showGrowthMenu();return;}
  if(GROWTH_LAB){meta.storySeen=true;meta.storyVersion=TUTORIAL_VERSION;meta.tutorialComplete=true;meta.tutorialVersion=TUTORIAL_VERSION;}
  if(!meta.storySeen||meta.storyVersion!==TUTORIAL_VERSION){storyIndex=0;screen='story';render();return;}
  meta.loops++;writeMeta(storage,meta);
  const random = new Uint32Array(1); crypto.getRandomValues(random); state = GROWTH_LAB?newRun(random[0],{rules:2,growthRoute,growthCurve:prefs.growthCurve||'rising',difficulty:prefs.growthDifficulty||0}):meta.tutorialComplete&&meta.tutorialVersion===TUTORIAL_VERSION?newRun(random[0],{rules:2,difficulty:Math.min(maxDifficulty(meta),prefs.difficulty||0),challenge:unlockSet(meta,'challenges').has(prefs.challenge)?prefs.challenge:'standard',allowedCards:availableIds(meta,'cards',Object.keys(CARDS)),allowedRelics:availableIds(meta,'relics',Object.keys(RELICS))}):tutorialRun(random[0]); tablePage=0; diceInHand=true; screen = 'game'; selected = null; flow = null; lastReveal = null; busy = true; performance = 'opening'; save(); render(); window.scrollTo(0, 0);
  try { await opening(prefs.lang); } finally { busy = false; performance = null; render(); }
}
function ask(label, choices, choose) { flow = { label, choices, choose }; render(); }
function choice(c, detail = '') { return { id: c.uid, label: name(c.kind), kind: c.kind, detail }; }
function beginAdd(id){
 const service=DRAFT_SERVICES[id];if(!service){dispatch({type:'add',id});return;}
 ask(textAt(service.text),draftTargets(state,id).map(c=>({id:c.uid,kind:c.original,label:name(c.original)+' #'+c.uid,detail:service.service==='upgrade'?points(growthBase(c))+' → '+points(growthBase({...c,growthLevel:(c.growthLevel||0)+1})):textAt(CARDS[c.original].text)})),uid=>dispatch({type:'add',id,uid}));
}
async function openSkipMachine(){
 if(busy||!state?.skipOffer||!['route','skipReward'].includes(state.phase))return;
 busy=true;render();let confirmed=false;
 try{confirmed=await showSlotMachine({offer:state.skipOffer,lang:prefs.lang,claimed:state.phase==='skipReward',motion:prefs.motion,cue:(type,index)=>sound(type,index),commit:()=>{state=tutorialAct(state,{type:'spinSkip'});save();return state.skipOffer;}});}
 catch(error){console.error('[One More] Slot machine',error);notify(tr('请重新打开领取奖励。','Please reopen to claim your prize.'));}
 finally{busy=false;render();}
 if(confirmed)beginSkip(state.skipOffer.id);
}
function beginSkip(id){
 if(state.phase!=='skipReward'||state.skipOffer?.id!==id||state.skipOffer.round!==state.round+1)return;
 const dispatchSkip=extra=>dispatch({type:'skipTable',id,...extra});
 if(id==='prune'){
  const cards=state.cards.filter(c=>!c.temporary&&c.original!=='bomb');
  ask(tr('免费删牌 · 选择第1张','FREE REMOVAL · FIRST CARD'),cards.map(c=>choice(c)),first=>{
   ask(tr('免费删牌 · 选择第2张','FREE REMOVAL · SECOND CARD'),cards.filter(c=>c.uid!==first).map(c=>choice(c)),second=>dispatchSkip({uids:[first,second]}));
  });
 }else if(id==='enchant'){
  const pick=(enchants=[])=>{
   if(enchants.length===2){dispatchSkip({enchants});return;}
   const cards=state.cards.filter(c=>!enchants.some(e=>e.uid===c.uid)&&Object.keys(ENCHANTMENTS).some(key=>canEnchant(c,key,CARDS)));
   ask(tr(`双份特调 · 第${enchants.length+1}张牌`,`DOUBLE SPECIAL · CARD ${enchants.length+1} OF 2`),cards.map(c=>({id:c.uid,kind:c.original,label:name(c.original)+' #'+c.uid,detail:textAt(CARDS[c.original].text)})),uid=>{
    const c=card(state,uid);
    ask(name(c.original)+' · '+tr('选择附魔','CHOOSE ENCHANTMENT'),Object.entries(ENCHANTMENTS).filter(([key])=>canEnchant(c,key,CARDS)).map(([key,e])=>({id:key,kind:e.icon,label:textAt(e.name),detail:textAt(enchantmentText(c,key,CARDS))})),enchantment=>pick([...enchants,{uid,enchantment}]));
   });
  };pick();
 }else if(id==='duplicate'){
  ask(tr('免费复制1张牌','COPY ONE CARD FOR FREE'),state.cards.filter(c=>!c.temporary&&c.original!=='bomb').map(c=>({id:c.uid,kind:c.original,label:name(c.original)+' #'+c.uid,detail:textAt(CARDS[c.original].text),enchantment:c.enchantment})),uid=>dispatchSkip({uid}));
 }else dispatchSkip({});
}
function beginRoute(id) {
  const route = ROUTES[id]; if (!state.routeOffers?.includes(id)) return;
  if (route.type === 'event'||route.type==='staple'||route.type==='dealer') { dispatch({ type: 'chooseRoute', id }); return; }
  const label = route.type === 'remove'
    ? tr(`删去1张牌 · 装袋 ${state.bank} → ${state.bank - route.cost}`, `Remove one card · Bank ${state.bank} → ${state.bank - route.cost}`)
    : textAt(route.name) + ' · ' + textAt(ENCHANTMENTS[id].text);
  ask(label, routeTargets(state, id).map(c => ({ id: c.uid, kind: c.original, label: name(c.original), detail: route.type==='enchant'?textAt(enchantmentText(c,id,CARDS)):textAt(CARDS[c.original].text), enchantment: c.enchantment })), uid => dispatch({ type: 'chooseRoute', id, uid }));
}
function chooseTarget(action, kind, except = null) {
  if(action.type==='pair'&&(hasTrouble(state,'cold')||state.relics.includes('silencer'))){dispatch(action);return;}
  const targets = kind === 'rice' ? troubles(state) : kind === 'mint' ? tiredTools(state, except) : kind === 'toast' ? paidFoods(state) : kind==='cheese'?foods(state).filter(c=>!action.ids.includes(c.uid)):[];
  if (!targets.length || kind === 'fish') { dispatch(action); return; }
  const limit=action.type==='pair'?pairTargetLimit(state,action.ids):1;
  if(limit>1){
   const pick=(chosen=[])=>{
    const remaining=targets.filter(c=>!chosen.includes(c.uid));
    if(chosen.length===limit||!remaining.length){dispatch({...action,targets:chosen});return;}
    ask(tr(`选择目标 ${chosen.length}/${Math.min(limit,targets.length)}`,`CHOOSE TARGETS ${chosen.length}/${Math.min(limit,targets.length)}`),[...remaining.map(c=>choice(c)),{id:null,label:tr('完成选择','DONE')}],uid=>uid==null?dispatch({...action,targets:chosen}):pick([...chosen,uid]));
   };pick();return;
  }
  const options = targets.map(c => choice(c));
  if (action.type === 'pair') options.push({ id: null, label: tr('不选择目标', 'Without a target') });
  ask(['rice', 'ginger'].includes(kind) ? tr('清理', 'CLEAR') : kind === 'toast' ? tr('取回', 'RECLAIM') : kind==='cheese'?tr('复制','COPY'):tr('恢复', 'READY'), options, target => dispatch({ ...action, target }));
}
function beginPair(uid) {
  const options = partners(state, uid); if (!options.length) return;
  if(!lesson(state)&&options.length===1&&card(state,uid).kind!=='wild'&&options[0].kind!=='wild'){chooseTarget({type:'pair',ids:[uid,options[0].uid]},pairKind(card(state,uid),options[0]));return;}
  ask(tr('配对', 'PAIR'), options.map(c => choice(c)), id => {
    const kind = pairKind(card(state, uid), card(state, id)); chooseTarget({ type: 'pair', ids: [uid, id] }, kind);
  });
}
function beginUse(uid) {
  const c = card(state, uid), problem = toolProblem(state, c); if (problem) { notify(errorText(problem)); return; }
  const action = { type: 'use', uid };
  const finish = current => {
    if(CARDS[c.kind].target)ask(textAt(enchantmentText(c,c.enchantment,CARDS)||CARDS[c.kind].text),effectTargets(state,c).map(x=>choice(x,c.kind==='stamp'?tr('拆开此对子 · 两张均可重新配对','Break this pair · both foods can pair again'):textAt(CARDS[x.kind].text))),target=>dispatch({...current,target}));
    else if (['cloth', 'jar'].includes(c.kind)) ask(c.kind==='jar'?tr('制酱','MAKE SAUCE'):tr('清理', 'CLEAR'), troubles(state).map(x => choice(x)), target => dispatch({ ...current, target }));
    else if (c.kind === 'bell') chooseTarget(current, 'mint', uid);
    else if (c.kind === 'stove') ask(tr('调味','MAKE SAUCE'), transformableFoods(state).map(x=>choice(x)),target=>dispatch({...current,target}));
    else if (['mold','juicer'].includes(c.kind)) ask(c.kind==='mold'?tr(`复制 · 装袋 ${state.bank} → ${state.bank-bankCost(c,CARDS)}`,`Copy · Bank ${state.bank} → ${state.bank-bankCost(c,CARDS)}`):textAt(enchantmentText(c,c.enchantment,CARDS)||CARDS[c.kind].text), foods(state).map(x=>choice(x)), target=>dispatch({...current,target}));
    else dispatch(current);
  };
  if (needsFoodCost(state, c)) {
    ask(tr('消耗食材', 'CONSUME FOOD'), payableFoods(state).map(x => choice(x, x.enchantment==='boiled'&&!x.boiledUsed?tr('水煮：无需消耗，留在桌上','Boiled: not consumed; stays in play'):x.pair?tr('拆开对子，消耗此牌','Break pair; consume this food'):tr('消耗此牌','Consume this food'))), food => finish({ ...action, food }));
  } else finish(action);
}
function beginRelic(id) {
  const relic=RELICS[id];if(!relic)return;
  if(relic.mode==='passive'){showDialog(textAt(relic.name),`<div class=single-relic>${icon(relic.icon)}<p>${textAt(relic.text)}</p></div>`);return;}
  const problem=relicProblem(state,id);if(problem){notify(errorText(problem));return;}
  if(id==='oldkey')ask(textAt(relic.name),[{id:true,label:textAt(relic.text)}],()=>dispatch({type:'relic',id}));
  if(['polishingstone','trashpass'].includes(id))ask(textAt(relic.text),(id==='trashpass'?troubles(state):tiredTools(state)).map(c=>choice(c)),uid=>dispatch({type:'relic',id,uid}));
  if (id === 'shaker') dispatch({ type: 'relic', id });
  if (id === 'recycler') ask(tr('取回哪个食材？', 'Reclaim which food?'), state.cards.filter(c => c.zone === 'discard' && c.paid && typeOf(c) === 'food').map(c => choice(c)), uid => dispatch({ type: 'relic', id, uid }));
  if (id === 'splitter') {
    const seen = new Set(); const options = onTable(state).filter(c => { if (!c.pair || seen.has(c.pair)) return false; seen.add(c.pair); return true; });
    ask(tr('拆开哪一对？本轮不能再次配对。', 'Break which pair? It cannot pair again this round.'), options.map(c => choice(c)), uid => dispatch({ type: 'relic', id, uid }));
  }
}
function finishStop(carry = null) {
  const total = state.bank + cashValue(state, carry),target=effectiveTarget(state);
  if (total < target) ask(tr(`只有 ${total} / ${target} 分，离桌会结束本局。`, `Only ${total} / ${target}. Leaving ends this run.`), [{ id: 'stay', label: tr('留在牌桌', 'Stay at the table') }, { id: 'leave', label: tr('结束本局', 'End this run') }], id => { if (id === 'leave') dispatch({ type: 'stop', carry }); else { flow = null; render(); } });
  else dispatch({ type: 'stop', carry });
}
function beginStop() {
  const available = foods(state).filter(c => !c.temporary && state.cards.some(x => !x.temporary && x.original !== 'bomb' && x.uid !== c.uid));
  if (state.relics.includes('lunchbox') && (state.endless || state.round < state.maxRounds) && available.length) {
    ask(tr('带一个食材到下一轮？', 'Keep a food for next round?'), [{ id: null, label: tr('全部结算', 'Cash out everything'), detail: `${score(state)}` }, ...available.map(c => choice(c, tr(`本轮收 ${cashValue(state, c.uid)} 分`, `Cash out ${cashValue(state, c.uid)}`)))], finishStop);
  } else finishStop();
}
function mini(kind, count = null) { return `<span class="mini" style="--card:${CARDS[kind].color}">${icon(kind)}<span>${name(kind)}${count ? ` ×${count}` : ''}</span></span>`; }
function logText(e) {
  const n = e.kind ? name(e.kind) : '';
  const entries = {
    dealerEvent:[`${textAt((SETBACKS[e.route]||ROUTES[e.route]||{name:['','']}).name)}${e.amount?' · '+e.amount:''}${n?' · '+n:''}`,`${textAt((SETBACKS[e.route]||ROUTES[e.route]||{name:['','']}).name)}${e.amount?' · '+e.amount:''}${n?' · '+n:''}`],
    wagerReward:e.relic?[`赌约奖励：${textAt(RELICS[e.relic].name)}`,`Wager won: ${textAt(RELICS[e.relic].name)}`]:['',''],
    growth:[`${n} 基础分 ${e.from} → ${e.to}`,`${n} base ${e.from} → ${e.to}`],
    growthPrune:[`${n} 已永久移除`,`${n} permanently removed`],
    round: [ `第 ${e.n} 台`, `Table ${e.n}` ],
    gainBank:[`装袋 +${e.n}`,`Bank +${e.n}`],
    relicTrigger:e.relic?RELICS[e.relic].name:['',''],
    reveal: [`翻出 ${n}`, `Revealed ${n}`], pair: [`${n} 配对成功`, `${n} paired`],
    pay: [`消耗 ${n} 作为工具费用`, `Consumed ${n} as a tool cost`], clear: [`清理了 ${n}`, `Cleared ${n}`],
    ready: [`${n} 恢复可用`, `${n} is ready again`], use: [`使用 ${n}`, `Used ${n}`],
    peek: [e.offset?`查看第 ${e.offset+1} 张`:`看到了接下来的 ${e.n} 张`,e.offset?`Peeked at card ${e.offset+1}`:`Peeked at ${e.n} upcoming card(s)`],
    ferment: ['变成万能酱', 'Turned into Wild sauce'],
    swap: ['两张已知牌交换了位置', 'Swapped two known cards'], shuffle: ['剩余牌堆已重洗；已知位置作废', 'Remaining pile shuffled; known positions cleared'],
    cash: [`装袋 ${e.n}`, `Banked ${e.n}`], bomb: ['爆炸', 'Bomb'],
    recover: [`取回了 ${n}`, `Reclaimed ${n}`], split: ['拆开一对，食材可作为费用消耗', 'Pair broken; its food can now be consumed as a cost'],
    tickets: [`工具食材费用为0：+${e.n}次`, `Tool food cost 0: +${e.n} uses`], relicReady: ['抵押物已恢复', 'Pledged items refreshed'], gift: ['获得临时万能酱', 'Gained temporary Wild sauce'], blockedPeek: ['杂音阻止查看', 'Interference blocked the peek'],
    sift: [`弃置顶牌：${n}`, `Discarded top card: ${n}`], rusted: [`${n} 横置入桌`, `${n} entered exhausted`], freeUse: ['本次工具费用无需消耗食材', 'No food consumed for this tool cost'],
    boon: [e.boon ? `临时援助：${textAt(BOONS[e.boon].name)}` : '', e.boon ? `Boon: ${textAt(BOONS[e.boon].name)}` : ''],
    boiled: [`水煮：${n} 无需消耗，留在桌上`, `Boiled: ${n} was not consumed and stayed in play`],
    generate: [`生成临时 ${n}`, `Created temporary ${n}`],
    spendPoints: [`消耗 ${e.n} 分装袋分数`, `Consumed ${e.n} banked points`],
    staple:[`随机装订 ${e.n} 张牌`,`Stapled ${e.n} random cards`],
    unstaple:[`拆钉，${e.n} 张牌依次上桌`,`Unstapled; ${e.n} cards entered in order`],
    unstapleSift:['筛网拆开牌叠，其余牌留在原位','Sieve opened the packet; other cards stayed in place'],
    consume: [`消耗 ${n}`, `Consumed ${n}`],
    retained:[`${n} 留在桌上，未被消耗`,`${n} stayed in play without being consumed`],
    protectedFood:[`${n} 下次被消耗时留桌`,`${n} will stay in play when next consumed`],
    clearSight:['本桌查看不受浓雾与杂音影响','Peeks ignore Fog and Interference this table'],
    toolScoring:['本桌已横置工具额外计1分','Exhausted tools score 1 extra point this table'],
    allReady:['所有工具已恢复','All tools readied'],
    foodQueued:['下次生成临时食材多1张','Next temporary food creation gets one extra copy'],
    extraFood:[`额外生成 ${e.n} 张临时食材`,`Created ${e.n} extra temporary food(s)`],
    pairReset:[`${n} 对子已拆开，两张均可重新配对`,`${n} pair broken; both foods can pair again`],
    autoPair:[`自动配对：${n}`,`Auto-paired: ${n}`],
    autoPairReward:['获得自动配对钳','Gained Auto-pair tongs'],
    multiply:[`本桌倍率 ×${e.factor}`,`Table multiplier ×${e.factor}`],
    wheel:[`老虎机：${e.reward?textAt(SKIP_REWARDS[e.reward].name):''}`,`Slots: ${e.reward?textAt(SKIP_REWARDS[e.reward].name):''}`],
    skipBoon:[`本桌奖励：${e.reward?textAt(SKIP_REWARDS[e.reward].name):''}`,`Table reward: ${e.reward?textAt(SKIP_REWARDS[e.reward].name):''}`],
    skipTable:[`跳过第 ${e.round} 桌，获得特殊奖励`,`Skipped table ${e.round}; special reward claimed`],
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
  return `<aside class="inspector"><div class="inspect-art ${MATERIALS[c.enchantment]?.className||''}">${icon(c.kind)}${materialLayers(c.enchantment)}</div><p class="eyebrow">${typeName(typeOf(c))}</p><h2>${name(c.kind)}</h2><p class="card-rule">${textAt(CARDS[c.kind].text)}${state.growth&&growthProgress(c,prefs.lang,state)?`<small class="growth-progress">${growthProgress(c,prefs.lang,state)}</small>`:''}${c.enchantment?`<span class="enchant-rule"><b>${textAt(ENCHANTMENTS[c.enchantment].name)}</b> · ${textAt(enchantmentText(c,c.enchantment,CARDS)||ENCHANTMENTS[c.enchantment].text)}${c.enchantment==='boiled'&&c.boiledUsed?tr('（本轮已用）',' (used this round)'):''}</span>`:''}</p>${c.pairedOnce&&!c.pair?`<p class="card-status">${tr('本桌已配对过，不能再次配对。','Already paired this table; cannot pair again.')}</p>`:''}${c.keepOnce?`<p class="card-status">${tr('下次被消耗时留在桌上','Stays in play when next consumed')}</p>`:''}${c.extraUses?`<p class="card-status">${tr('还可使用2次后横置','Two uses before exhausting')}</p>`:''}${action}</aside>`;
}
function groupedDeck() { const groups = {}; for (const c of state.cards.filter(c => !c.temporary)) { (groups[c.original] ??= []).push(c); } return groups; }
function showDialog(title, content) {
  dialog.innerHTML = `<div class="dialog-heading"><h2>${title}</h2>${button('close', tr('关闭', 'Close'))}</div>${content}`; if (!dialog.open) dialog.showModal();
}
function showRules(){
 const rules=[
 ['普通食材2分，配对4＋4；散牌指未配对食材。','Regular food: 2. A pair: 4 + 4; unpaired food is not in a pair.'],
 [`首台目标${INITIAL_TARGET}分，共${MAX_ROUNDS}台，装袋分数保留。`,`${MAX_ROUNDS} tables, starting target ${INITIAL_TARGET}; banked points carry over.`],
 ['骰子在上一桌目标上加码；装袋分数全部保留。进阶可增加骰子和目标。','Dice raise the previous target. All banked points carry over. Higher stakes add dice and target raises.'],
 ['首张安全，炸弹翻出即死亡。','First reveal is safe; revealing the bomb kills you.'],
 ...(GROWTH_LAB?[["装订摊消耗4分，随机装订3张永久非炸弹牌；麻烦牌也可能入选。抽出时拆开，按顺序上桌。","The Staple stand consumes 4 banked points to bind 3 random permanent non-bomb cards, including trouble. Draw them in order and separate."],["洗牌保持整叠；查看仍按单张计数。未拆开的牌叠保留到下一桌，拆开后不自动重订。","Shuffle packets together; peeks count individual cards. Unopened packets carry over, but opened cards are not automatically stapled again."]]:[]),
 ['点击骰子摇动，拖入骰盘掷出。','Click to shake; drag into the tray to throw.'],
 ['第5桌起掷两颗d20，点数合计增加目标；重掷时只重掷非1、非20的骰子。','From table 5, roll two d20s and add their sum to the target. A reroll keeps every 1 and 20.'],
 [`在起始19张非炸弹牌外，每增加${BOMB_INTERVAL}张永久非炸弹牌，下桌追加1枚不可移除的炸弹；临时牌不计入。`,`Beyond the starting 19 non-bomb cards, every ${BOMB_INTERVAL} extra permanent non-bomb cards adds an unremovable bomb at the next table; temporary cards do not count.`],
 ['炸弹可出现在整个牌堆；只有开桌首张安全，抵押物重洗不保首张安全。','Bombs may be anywhere in the pile. Only a new table guarantees a safe first card.'],
 ['1：加入赊账单、生锈、纸团；20：下桌获得12分临时盛宴；两者锁定。','1: add Tab, Rust and Scrap; 20: a temporary 12-point Feast; both lock.'],
 ['每颗骰子分别带来麻烦；奖励每桌最多一份，有20时优先盛宴。','Each die adds its own trouble. At most one boon per table; a 20 takes priority with Feast.'],
 ['2–5：加入纸团；15–19：选择临时奖励。','2–5: add Scrap; 15–19: choose a temporary boon.'],
 ['轮末选择一条岔路，再选一组牌；每组都带麻烦。','Choose one of two paths, then take one package; every package includes trouble.'],
 ['每张牌最多1种永久附魔；回收摊扣除已装袋分数来删牌。','Each eligible card holds one permanent enchantment; the Salvage stall removes cards for banked points.'],
 ['消耗的食材进入垃圾桶；只有明确写出生成残渣的效果才会生成残渣。','Consumed food enters the discard pile; Residue is created only when the effect explicitly says so.'],
 ['可乐合计1／5／9／13…分，不参与配对；冰箱按桌上鱼干数量计分。','Colas together score 1 / 5 / 9 / 13… and cannot pair; Fridge scores per Dried fish in play.'],
 ['装置持续生效；查看、变形和生成临时牌不算翻牌。','Devices stay active; peeking, transforming and creating tokens are not reveals.'],
 ['使用工具后横置；配对每张每轮一次；封存时失效。','Used tools turn sideways; each card pairs once per round; sealed cards are inactive.'],
 ];showDialog(tr('规则','RULES'),`<ol class="rules">${rules.map(r=>`<li>${textAt(r)}</li>`).join('')}</ol>`);
}
function showPalettes(){showDialog(tr('配色','PALETTES'),paletteGallery(prefs.palette,prefs.lang));}
function showSettings(){
 const toggle=(id,label)=>button(id,`<span>${label}</span><b>${prefs[id]?tr('开','ON'):tr('关','OFF')}</b>`,`aria-pressed="${!!prefs[id]}"`,false,'setting-toggle');
 const field=(id,label,options)=>`<label class="setting-field" for="${id}"><span>${label}</span><select id="${id}">${options}</select></label>`;
 const section=(title,content)=>`<section class="settings-section"><h3>${title}</h3><div class="settings-grid">${content}</div></section>`;
 showDialog(tr('设置','SETTINGS'),`<div class="settings-panel">${section(tr('音频','AUDIO'),
   toggle('music',tr('音乐','Music'))+toggle('sound',tr('音效','Sound effects'))+
   `<label class="music-volume" for="music-volume"><span>${tr('音乐音量','Music volume')}</span><input id="music-volume" type="range" min="0" max="100" value="${Math.round(prefs.volume*100)}"></label>`
 )}${section(tr('显示','DISPLAY'),
   button('palettes',tr('配色 · ','Palette · ')+textAt(PALETTES[paletteId(prefs.palette)].name))+
   button('art-style',tr('图案 · '+(prefs.artStyle==='classic'?'旧版':'赌场印刷'),'Art · '+(prefs.artStyle==='classic'?'Original':'Casino print')),'',!meta.legacyArt&&!unlockSet(meta,'art').has('classic'))+
   button('achievements',tr('解锁簿 · 卡背','Unlocks · card backs'))+toggle('motion',tr('动画','Animation'))+
   field('frame-rate',tr('动画帧率','Animation FPS'),[30,60,120].map(n=>`<option value="${n}" ${n===(prefs.fps||60)?'selected':''}>${n}</option>`).join(''))+
   button('language',tr('语言 · 中文','Language · English'))+
   button('fullscreen',tr('切换全屏','Toggle fullscreen'))+
   (window.oneMoreDesktop?field('pc-resolution',tr('窗口分辨率','Window resolution'),['1280x720','1600x900','1920x1080','2560x1440','3840x2160'].map(r=>`<option ${r===(prefs.resolution||'1600x900')?'selected':''}>${r}</option>`).join('')):'')
 )}${section(tr('游戏','GAME'),
   button('rules',tr('规则','Rules'))+(GROWTH_LAB?button('growth-journal',tr('成长簿','Growth journal')):button('replay-tutorial',tr('重玩教程','Replay tutorial')))+
   button('catalog',tr('卡牌图鉴','Collection'))+growthEntryButton()+(screen==='game'?button('home',tr('离开牌桌','Leave table')):'')+
   (window.oneMoreDesktop?button('quit',tr('退出游戏','Quit game')):'')
 )}</div>`);
}
function growthEntryButton(){return GROWTH_LAB?button('standard-entry',tr('返回常规牌局','Standard game')):'';}
function growthContentLabel(id,type){
 const route=Object.values(GROWTH_ROUTES).find(r=>type==='relics'?r.relic===id:[r.core,r.support].includes(id));
 return tr('成长试桌','Growth playtest')+(route?' · '+textAt(route.name):'');
}
function showRelics(){
 const relics={...RELICS,...GROWTH_RELICS},total=Object.keys(relics).length,growth=Object.keys(GROWTH_RELICS).length;
 showDialog(tr(`抵押物图鉴 · ${total}件`,`PLEDGED ITEMS · ${total}`),`<div class="catalog-filters">${button('catalog',tr('卡牌','Cards'))}${growthEntryButton()}</div><p class="collection-note">${tr(`${total-growth}件常规 · ${growth}件成长试桌`,`${total-growth} standard · ${growth} growth playtest`)}</p><div class="relic-gallery">${Object.entries(relics).map(([id,r])=>`<article class="relic-entry" data-id="${id}">${icon(r.icon)}<h3>${textAt(r.name)}</h3><p>${textAt(r.text)}</p><small class=unlock-label>${r.experimental?growthContentLabel(id,'relics'):lockLabel(meta,id,'relics',prefs.lang)}</small></article>`).join('')}</div>`);
}
function showAchievements(){if(autoPairUnlocked(meta)){meta.autoPairUnlockSeen=true;writeMeta(storage,meta);render();}showDialog(tr('解锁簿','UNLOCKS'),journalHTML(meta,prefs));}
function showGrowthMenu(){showDialog(tr('养成试桌','GROWTH TABLES'),growthMenu(prefs.lang,prefs.growthCurve||'rising',prefs.growthDifficulty||0));}
function showRunSetup(){if(GROWTH_LAB){showGrowthMenu();return;}showDialog(tr('牌局设置','RUN SETUP'),runSetupHTML(meta,prefs));}
function showCatalog(filter='all') {
 const catalog={...CARDS,...GROWTH_CARDS},total=Object.keys(catalog).length,growth=Object.keys(GROWTH_CARDS).length;
 const counts=state?groupedDeck():{},entries=Object.entries(catalog).filter(([k,d])=>filter==='all'||(filter==='growth'?d.experimental:d.type===filter));
 const filters=[['all',tr('全部'+total,'All '+total)],['growth',tr('成长新牌 · '+growth,'Growth · '+growth)],...['food','tool','device','trouble'].map(t=>[t,typeName(t)])];
 showDialog(tr('卡牌图鉴 · '+total+'种','CARD COLLECTION · '+total),`<div class="catalog-filters">${button('relic-catalog',tr('抵押物','Pledged items'))}${button('achievements',tr('成就','Achievements'))}${growthEntryButton()}${filters.map(([id,label])=>button('catalog-filter',label,`data-id="${id}" aria-pressed="${filter===id}"`,false,filter===id?'primary':'')).join('')}</div><p class="collection-note">${tr(`${total-growth}种常规 · ${growth}种成长试桌；试桌使用独立存档。`,`${total-growth} standard · ${growth} growth playtest; separate playtest save.`)}</p><div class="catalog-grid">${entries.map(([k,def])=>`<article class="catalog-card" data-kind="${k}" style="--card:${def.color}">${icon(k)}<div><small>${typeName(def.type)}${def.tokenOnly?tr(' · 生成牌',' · TOKEN'):''}${counts[k]?` · ×${counts[k].length}`:''}</small><h3>${textAt(def.name)}</h3><p>${textAt(def.text)}</p><small class=unlock-label>${def.experimental?growthContentLabel(k,'cards'):lockLabel(meta,k,'cards',prefs.lang)}</small></div></article>`).join('')}</div>`);
}
function showDeck(){
  if(!state)return;
  const groups=groupedDeck(),order={food:0,tool:1,device:2,trouble:3,bomb:4},entries=Object.entries(groups).sort(([a],[b])=>order[CARDS[a].type]-order[CARDS[b].type]);
  const counts={};for(const [kind,copies] of entries)counts[CARDS[kind].type]=(counts[CARDS[kind].type]||0)+copies.length;
  const total=Object.values(groups).reduce((n,a)=>n+a.length,0);
  showDialog(tr('当前牌组','CURRENT DECK'),`${state.staples?.length?`<div class="staple-deck-list">${state.staples.map(b=>stapleReceipt(state,b,prefs.lang)).join('')}</div>`:''}<div class="deck-summary"><strong>${total} ${tr('张','CARDS')}</strong>${Object.entries(counts).map(([type,n])=>`<span>${typeName(type)} <b>${n}</b></span>`).join('')}</div><p class="deck-growth">${tr(`永久非炸弹牌 ${bombGrowth(state).ordinary} 张 · 每增 ${bombGrowth(state).interval} 张追加炸弹`,`Permanent non-bomb cards: ${bombGrowth(state).ordinary} · +1 bomb per ${bombGrowth(state).interval} extra`)}<br>${bombGrowth(state).added?tr(`下桌追加 ${bombGrowth(state).added} 枚炸弹；已加入的炸弹不可移除。`,`Next table: +${bombGrowth(state).added} bomb(s); added bombs cannot be removed.`):tr(`再增加 ${bombGrowth(state).until} 张触发下一枚；临时牌不计入。`,`${bombGrowth(state).until} more until the next bomb; temporary cards do not count.`)}</p><div class="catalog-grid owned-deck">${entries.map(([kind,copies])=>`<article class="catalog-card owned-card" data-kind="${kind}" data-count="${copies.length}" style="--card:${CARDS[kind].color}">${icon(kind)}<div><small>${typeName(CARDS[kind].type)}</small><h3>${name(kind)} <b>×${copies.length}</b></h3><p>${textAt(CARDS[kind].text)}</p>${state.growth?copies.map(c=>growthProgress(c,prefs.lang,state)?`<small class="growth-progress">#${c.uid} · ${growthProgress(c,prefs.lang,state)}</small>`:'').join(''):''}${Object.entries(ENCHANTMENTS).filter(([id])=>copies.some(c=>c.enchantment===id)).map(([id,e])=>`<span class="deck-enchantment" title="${esc(textAt(enchantmentText(copies[0],id,CARDS)||e.text))}">${textAt(e.name)} ×${copies.filter(c=>c.enchantment===id).length}</span>`).join('')}</div></article>`).join('')}</div>`);
}
function showPreview(uid){
 if(!state||!state.draw.slice(0,3).includes(uid))return;
 const position=state.draw.indexOf(uid)+1;
 if(!state.known.includes(uid)){showDialog(tr('尚未查看','Unknown card'),`<p>${tr('使用查看效果后，这里会显示牌面。','Use a peek effect to reveal this card here.')}</p>`);return;}
 const c=card(state,uid),enchantment=ENCHANTMENTS[c.enchantment],packet=closedStaple(state,uid);
 showDialog(tr('牌顶第'+position+'张','Card '+position+' from top'),`<article class="preview-detail"><div class="preview-detail-art">${icon(c.kind)}</div><div><small>${typeName(typeOf(c))}</small><h3>${name(c.kind)}</h3><p>${textAt(CARDS[c.kind].text)}</p>${state.growth&&growthProgress(c,prefs.lang,state)?`<p class="growth-progress">${growthProgress(c,prefs.lang,state)}</p>`:''}${packet?`<p class="preview-staple-note">${tr(`已装订 · ${packet.uids.length}张一起抽取；筛网弃置会拆开整叠，其余牌保留。`,`Stapled · draw ${packet.uids.length} together. Sieve discards one and separates the rest in place.`)}</p>`:''}${enchantment?`<p class="preview-enchantment">${textAt(enchantment.name)} · ${textAt(enchantmentText(c,c.enchantment,CARDS)||enchantment.text)}</p>`:''}</div></article>`);
}
function showDiscard(){
  if(!state)return;
  showDialog(tr('垃圾桶 · 弃牌堆','BIN · DISCARD PILE'),`<p class="fine">${tr('本桌弃置与消耗的牌','Cards discarded or consumed this table')} · ${state.discard.length}</p><div class="catalog-grid discard-pile">${[...state.discard].reverse().map(uid=>{const c=card(state,uid);return `<article class="catalog-card" data-uid="${uid}">${icon(c.kind)}<div><small>${c.paid?tr('作为工具费用消耗','CONSUMED AS A TOOL COST'):c.consumed?tr('已消耗','CONSUMED'):tr('已弃置','DISCARDED')}${c.temporary?tr(' · 临时',' · TEMPORARY'):''}</small><h3>${name(c.kind)}</h3><p>${textAt(CARDS[c.kind].text)}</p></div></article>`;}).join('')}</div>${state.discard.length?'':`<p>${tr('还没有弃牌','No discarded cards')}</p>`}`);
}
function render() {
  applyPalette(prefs.palette);
  setArtStyle(prefs.artStyle);setCardBack(prefs.cardBack);setFrameRate(prefs.fps);document.documentElement.dataset.art=prefs.artStyle==='classic'?'classic':'poster';
  const mobileScroll=document.querySelector('.card-field[data-touch="true"]')?.scrollLeft||0;
  if (screen === 'game' && state?.pending?.type === 'discover') {
    flow = { label: state.pending.pool==='tool'?tr('选1件临时工具','Choose one temporary tool'):tr('备餐：选1张临时食材', 'SERVE: choose one temporary food'), choices: state.pending.offers.map(kind => ({ id: kind, kind, label: name(kind), detail: textAt(CARDS[kind].text) })), choose: kind => dispatch({ type: 'discover', kind }) };
  }
  if(screen==='game'&&state?.pending?.type==='sift'){
    const top=card(state,state.pending.uid);
    flow={label:tr('筛选：','SIFT: ')+name(top.kind),choices:[{id:false,label:tr('留在顶端','KEEP ON TOP'),kind:top.kind},...(top.kind==='bomb'?[]:[{id:true,label:tr('弃置','DISCARD'),kind:top.kind}])],choose:discard=>dispatch({type:'resolveSift',discard})};
  }
  document.documentElement.lang = prefs.lang === 'en' ? 'en' : 'zh-CN'; document.title = 'One More？'; document.documentElement.dataset.motion = prefs.motion === false ? 'reduced' : 'full'; document.body.dataset.busy = String(busy);
  document.body.classList.toggle('learning',screen==='game'&&!!lesson(state));
  music.configure(prefs);
  const oldActor=app.querySelector('.dealer-actor');
  const actorTimes=oldActor?.getAnimations({subtree:true}).map(a=>[a.animationName,a.currentTime])||[];
  app.innerHTML = screen==='story'?storyHTML(storyIndex,prefs.lang):renderView({ s: state, screen, prefs, selected, flow, busy, performance, boonChoice, inspect: state ? inspector() : '', logText, saved: readSave(), diceInHand, eventPick, tableExpanded, rewardNotice:autoPairUnlocked(meta)&&!meta.autoPairUnlockSeen });
  const newActor=app.querySelector('.dealer-actor');
  if(newActor?.dataset.mood===oldActor?.dataset.mood)for(const a of newActor?.getAnimations({subtree:true})||[]){const t=actorTimes.find(([name])=>name===a.animationName);if(t)a.currentTime=t[1];}
  if(GROWTH_LAB){const v=app.querySelector('.version');if(v)v.textContent=tr('养成试桌','GROWTH TEST');const menu=app.querySelector('.main-menu');if(menu)menu.insertAdjacentHTML('afterbegin',`<p class="growth-entry">${tr('六套预组 · 独立存档','Six decks · separate save')}</p>`);}
  cardScene.reconcile(app);
  if(screen==='game'&&lesson(state)){app.querySelector('header').insertAdjacentHTML('afterend',tutorialHTML(state,prefs.lang,replayingTutorial));const allowed={draw:['draw'],pair:['select','pair','choose','cancel'],use:['select','use'],relic:['relic'],stop:['stop'],roll:['shake-die','throw-die'],acceptDice:['acceptDice','pick-die','shake-die','throw-die','boon'],chooseRoute:['route','choose','cancel'],add:['add'],next:['next'],retry:['retry']}[lesson(state)[4]];for(const b of app.querySelectorAll('main button[data-action]'))if(!['deck','log','discard','table-page','preview'].includes(b.dataset.action)&&!allowed.includes(b.dataset.action))b.disabled=true;for(const b of app.querySelectorAll('main button[data-action]'))if(allowed.includes(b.dataset.action)&&!b.disabled)b.classList.add('lesson-target');}
  tablePage=layoutTable({page:tablePage,focusUid:focusCardUid,lang:prefs.lang,scrollLeft:mobileScroll}).page;focusCardUid=null;initDice();updateTutorialGuide(state,{selected,flow,busy,lang:prefs.lang,screen,diceInHand});
}
function handle(action, node) {
  if (action === 'skip-animation') { sound('click');cancelPresentation(); return; }
  if (busy||paging) return;
  if(action!=='sound')sound('click');
  if(action==='growth-difficulty'&&GROWTH_LAB){prefs.growthDifficulty=Math.max(0,Math.min(3,Number(node.dataset.id)));savePrefs();showGrowthMenu();return;}
  if(action==='growth-curve'&&GROWTH_LAB){prefs.growthCurve=node.dataset.id==='classic'?'classic':'rising';savePrefs();showGrowthMenu();return;}
  const uid = Number(node?.dataset.uid), id = node?.dataset.id;
  if(action==='growth-entry'||action==='standard-entry'){
   const url=new URL(location.href);if(action==='growth-entry')url.searchParams.set('lab','growth');else url.searchParams.delete('lab');location.assign(url.href);return;
  }
  if(action==='growth-start'&&GROWTH_LAB){dialog.close();start(id);}
  else if(action==='growth-journal'&&GROWTH_LAB)showDialog(tr('成长簿','GROWTH JOURNAL'),growthJournal(state,prefs.lang));
  else if(action==='story-next'){if(storyIndex<2){storyIndex++;render();}else{meta.storySeen=true;meta.storyVersion=TUTORIAL_VERSION;writeMeta(storage,meta);start();}}
  else if(action==='story-skip'){meta.storySeen=true;meta.storyVersion=TUTORIAL_VERSION;writeMeta(storage,meta);start();}
  else if(action==='relic-catalog'){showRelics();}
  else if(action==='achievements'){showAchievements();}
  else if(action==='run-setup')showRunSetup();
  else if(action==='difficulty'){const level=Number(id);if(Number.isInteger(level)&&level>=0&&level<=maxDifficulty(meta)){prefs.difficulty=level;savePrefs();showRunSetup();}}
  else if(action==='challenge'){if(id==='standard'||unlockSet(meta,'challenges').has(id)){prefs.challenge=id;savePrefs();showRunSetup();}}
  else if(action==='card-back'){if(id==='casino'||unlockSet(meta,'backs').has(id)){prefs.cardBack=id;savePrefs();render();showAchievements();}}
  else if(action==='quit')window.oneMoreDesktop?.quit();
  else if(action==='replay-tutorial')replayTutorial();
  else if(action==='skip-lesson'){if(replayingTutorial){leaveTutorial();return;}meta.tutorialComplete=true;meta.tutorialVersion=TUTORIAL_VERSION;writeMeta(storage,meta);start();}
  else if (action === 'new') start();


  else if (action === 'retry') {if(state?.lesson===7){if(!replayingTutorial){meta.loops++;writeMeta(storage,meta);}selected=null;tablePage=0;dispatch({type:'retry'});}else start();}
  else if(action==='continueEndless')dispatch({type:'continueEndless'});
  else if (action === 'continue') { state = readSave(); diceInHand=!state?.dice?.result; tablePage=0; screen = 'game'; selected = null; flow = null; render(); resumeReward(); }
  else if (action === 'home') { replayingTutorial=false;dialog.close();screen = 'home'; flow = null; state = readSave(); render(); window.scrollTo(0, 0); }
  else if(action==='art-style'){if(!meta.legacyArt&&!unlockSet(meta,'art').has('classic'))return;prefs.artStyle=prefs.artStyle==='classic'?'poster':'classic';savePrefs();render();showSettings();}
  else if (action === 'language') { prefs.lang = prefs.lang === 'en' ? 'zh' : 'en'; flow = null; savePrefs(); render(); if(dialog.open)showSettings(); }
  else if (action === 'sound') { prefs.sound = !prefs.sound; savePrefs(); sound('click');render(); showSettings(); }
  else if (action === 'motion') { prefs.motion = !prefs.motion; savePrefs(); render(); showSettings(); }
  else if (action === 'fullscreen') { if(window.oneMoreDesktop){window.oneMoreDesktop.fullscreen();return;}dialog.close(); const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); p?.catch(() => notify(tr('当前浏览器不支持全屏。', 'Fullscreen is unavailable in this browser.'))); }
  else if (action === 'settings'||action==='palette-settings') showSettings();
  else if(action==='palettes')showPalettes();
  else if(action==='palette'){prefs.palette=paletteId(id);savePrefs();applyPalette(prefs.palette);showPalettes();dialog.querySelector(`[data-id="${prefs.palette}"]`)?.focus({preventScroll:true});}
  else if(action==='music'){prefs.music=!prefs.music;savePrefs();music.configure(prefs);showSettings();}
  else if (action === 'rules') showRules();
  else if (action === 'catalog') showCatalog();
  else if(action==='catalog-filter')showCatalog(id);
  else if (action === 'deck') showDeck();
  else if (action === 'discard') showDiscard();
  else if (action === 'preview') showPreview(uid);
  else if (action === 'log') showDialog(tr('刚刚发生', 'What just happened'), `<ol class="rules">${state.log.slice(-20).reverse().map(e => `<li>${logText(e)}</li>`).join('')}</ol>`);
  else if (action === 'close') dialog.close();
  else if (action === 'select') {
    if (flow) { if (flow.choices.some(option => option.id === uid)) flow.choose(uid); return; }
    if (state.pending) return;
    selected = uid; focusCardUid=uid; lastReveal = null; render();
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
  else if(action==='add')beginAdd(id);
  else if(action==='chooseRelic')dispatch({type:action,id});
  else if(action==='table-expand'){tableExpanded=!tableExpanded;tablePage=0;render();}
  else if(action==='event-pick'){const role=node.dataset.role;if(role==='food'){const ids=eventPick.uids||[];eventPick.uids=ids.includes(uid)?ids.filter(x=>x!==uid):ids.length<2?[...ids,uid]:ids;}else if(role==='target')eventPick.uid=uid;else eventPick[role]=id;render();}
  else if(action==='event-confirm')dispatch({type:'resolveEncounter',...eventPick});
  else if(action==='event-leave')dispatch({type:'leaveEncounter'});
  else if (action === 'toggle-auto-pair') dispatch({type:'toggleAutoPair'});
  else if(action==='open-slot')openSkipMachine();
  else if (action === 'skip-table') beginSkip(id);
  else if (action === 'route') beginRoute(id);
  else if (action === 'next') { dispatch({ type: 'next' }); window.scrollTo(0, 0); }
  else if (action === 'throw-die' && diceInHand) dispatch({type:'roll'});
  else if (action === 'shake-die') {noteTutorialShake();sound('shake-die');shakeDice();}
  else if (action === 'pick-die' && !state.dice.result?.locked && state.dice.rolls.length<2) {diceInHand=true;render();sound('shake-die');shakeDice();}
  else if (action === 'table-page') changeTablePage(Number(node.dataset.page));
  else if (action === 'boon') { boonChoice = id; render(); }
  else if(action==='acceptMidnight')dispatch({type:'acceptMidnight'});
  else if (action === 'acceptDice') dispatch({ type: 'acceptDice', boon: boonChoice });
}
function unlockAudio(){music.unlock();unlockSound(prefs.sound);}
document.addEventListener('pointerdown',unlockAudio,{capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
document.addEventListener('input',e=>{if(e.target.id==='music-volume'){prefs.volume=Number(e.target.value)/100;savePrefs();music.configure(prefs);}});
document.addEventListener('click', e => { const node = e.target.closest('button[data-action]'); if (!node || node.disabled || window.performance.now()<suppressClickUntil) return; handle(node.dataset.action, node); });
document.addEventListener('keydown', e => {
  if (e.code === 'Escape' && busy) { e.preventDefault(); cancelPresentation(); return; }
  if (dialog.open || busy || paging) return;
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
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!busy&&!drag&&!paging&&!tableSwipe)render();});});

let tableSwipe=null;
let stripDrag=null;
document.addEventListener('pointerdown',e=>{
 const field=e.target.closest('.card-field[data-touch="true"]');
 if(!field||e.pointerType!=='mouse'||e.button!==0||busy||paging)return;
 stripDrag={field,id:e.pointerId,x:e.clientX,left:field.scrollLeft,moved:false};
});
document.addEventListener('pointermove',e=>{
 const d=stripDrag;if(!d||d.id!==e.pointerId)return;
 const dx=e.clientX-d.x;if(!d.moved&&Math.abs(dx)<6)return;
 if(!d.moved){d.moved=true;d.field.setPointerCapture(e.pointerId);}
 d.field.scrollLeft=d.left-dx;e.preventDefault();
});
function endStripDrag(e){const d=stripDrag;if(!d||d.id!==e.pointerId)return;stripDrag=null;if(d.moved){suppressClickUntil=window.performance.now()+350;if(d.field.hasPointerCapture(e.pointerId))d.field.releasePointerCapture(e.pointerId);}}
document.addEventListener('pointerup',endStripDrag);
document.addEventListener('pointercancel',endStripDrag);
document.addEventListener('pointerdown',e=>{
 const table=e.target.closest('.casino-table'),field=table?.querySelector('.card-field[data-touch="true"]');
 if(busy||paging||dialog.open||tableSwipe||!e.isPrimary||!field||Number(field.dataset.pages)<2||e.button>0||e.target.closest('button:not(.tile),a,input,select,textarea'))return;
 tableSwipe={id:e.pointerId,x:e.clientX,y:e.clientY,started:window.performance.now(),field,offset:0,moved:false};
});
document.addEventListener('pointermove',e=>{
 if(!tableSwipe||tableSwipe.id!==e.pointerId)return;const d=tableSwipe,dx=e.clientX-d.x,dy=e.clientY-d.y;
 if(!d.moved){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){tableSwipe=null;return;}if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.5)return;d.moved=true;d.field.setPointerCapture(e.pointerId);}
 const edge=dx>0?tablePage===0:tablePage>=Number(d.field.dataset.pages)-1;d.offset=dragPage(d.field,dx,edge);
});
document.addEventListener('pointerup',e=>{
 if(!tableSwipe||tableSwipe.id!==e.pointerId)return;const d=tableSwipe;tableSwipe=null;if(!d.moved)return;
 if(d.field.hasPointerCapture(e.pointerId))d.field.releasePointerCapture(e.pointerId);
 suppressClickUntil=window.performance.now()+350;
 const dx=e.clientX-d.x,elapsed=Math.max(1,window.performance.now()-d.started);
 const threshold=Math.min(60,Math.max(28,d.field.clientWidth*.1));
 const flip=Math.abs(dx)>=threshold||(Math.abs(dx)>=18&&Math.abs(dx)/elapsed>=.35);
 changeTablePage(tablePage+(flip?(dx<0?1:-1):0),d.offset);
});
document.addEventListener('pointercancel',e=>{if(tableSwipe?.id!==e.pointerId)return;const d=tableSwipe;tableSwipe=null;if(d.moved)changeTablePage(tablePage,d.offset);});

document.addEventListener('change',async e=>{if(e.target.id==='frame-rate'){prefs.fps=Number(e.target.value);setFrameRate(prefs.fps);savePrefs();}if(e.target.id==='pc-resolution'&&window.oneMoreDesktop){prefs.resolution=await window.oneMoreDesktop.resolution(e.target.value);savePrefs();showSettings();}});
