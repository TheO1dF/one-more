import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { connectSmokeTransport } from './smoke-transport.mjs';
import { newRun, act, SAVE_KEY, PREF_KEY } from '../game/engine.js';
const transport = await connectSmokeTransport(Number(process.env.EDGE_DEBUG_PORT || 9227));
const { send, errors: browserErrors } = transport;
const gameUrl = 'http://127.0.0.1:8888/';
const outputDir = resolve('.artifacts/smoke-one-more-v020');
const report = { version: '0.2.0', browser: 'Microsoft Edge headless', checks: [], captures: [], failures: [] };
await mkdir(outputDir, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
async function ready() { for (let i = 0; i < 100; i++) { if (await evaluate('!!document.querySelector(".brand")')) return; await wait(40); } throw Error('Page not ready'); }
async function idle() { for (let i = 0; i < 100; i++) { if (await evaluate('document.body.dataset.busy!=="true"')) return; await wait(45); } throw Error('Animation did not finish'); }
async function click(selector, settle = true) {
  const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable: '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Covered: '+${JSON.stringify(selector)});return {x,y};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  if (settle) { await wait(35); await idle(); }
}
function check(label, ok, detail = null) { report.checks.push({ label, ok: !!ok, detail }); if (!ok) { report.failures.push(label); console.log('FAIL', label, JSON.stringify(detail)); } }
async function state() { return JSON.parse(await evaluate(`localStorage.getItem(${JSON.stringify(SAVE_KEY)})`)); }
async function seed(s, lang = 'zh') {
  await evaluate(`localStorage.setItem(${JSON.stringify(SAVE_KEY)},${JSON.stringify(JSON.stringify(s))});localStorage.setItem(${JSON.stringify(PREF_KEY)},${JSON.stringify(JSON.stringify({ lang, sound: false, motion: true }))})`);
  await send('Page.reload', { ignoreCache: true }); await wait(120); await ready(); await click('[data-action="continue"]');
}
async function capture(name, reset = true) {
  if (reset) await evaluate('window.scrollTo(0,0)');
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(resolve(outputDir, name + '.png'), Buffer.from(r.data, 'base64')); report.captures.push(name);
}
async function audit(label, lang) {
  const r = await evaluate(`(()=>{const f=document.querySelector('.card-field'),a=document.querySelector('.table-actions'),tray=document.querySelector('.action-tray');return {width:innerWidth,scroll:document.documentElement.scrollWidth,separate:!f||!a||f.getBoundingClientRect().bottom<=a.getBoundingClientRect().top+1,tray:!tray||tray.scrollWidth<=tray.clientWidth+2,text:document.body.innerText.replace(document.querySelector('[data-action="language"]')?.innerText||'',''),desktopControls:innerWidth<1001||!a||a.getBoundingClientRect().bottom<=innerHeight};})()`);
  check(label + ' no page overflow', r.scroll <= r.width + 1, { ...r, text: undefined }); check(label + ' controls separate from cards', r.separate && r.desktopControls); check(label + ' action tray fits', r.tray);
  if (lang === 'en') check(label + ' English complete', !/[\u3400-\u9fff]/u.test(r.text), r.text.match(/[\u3400-\u9fff]+/gu));
}
function fixture(tableKinds, drawKinds = ['paper', 'fish', 'bomb']) {
  const s = newRun(312); Object.assign(s, { cards: [], uid: 0, table: [], draw: [], discard: [], known: [], flips: tableKinds.length, eventCount: tableKinds.length });
  for (const [zone, kinds] of [['table', tableKinds], ['deck', drawKinds]]) for (const kind of kinds) {
    const c = { uid: ++s.uid, original: kind, kind, zone, tapped: false, pair: null, pairedOnce: false, sealedBy: null, ferment: null, caught: null, wish: null, paid: false, entered: s.uid, triggers: 0, freeCost: false };
    s.cards.push(c); (zone === 'table' ? s.table : s.draw).push(c.uid);
  } return s;
}
function diceTier(tier) { for (let n = 1; n < 300; n++) { const s = newRun(n); s.phase = 'stakes'; s.bank = 40; s.roundEarned = 40; s.dice = { rolls: [], result: null }; s.rng = n; const rolled = act(s, { type: 'roll' }); if (rolled.dice.result.tier === tier) return rolled; } }
async function pair(a, b, target) { await click(`.tile[data-uid="${a}"]`); await click('[data-action="pair"]'); await click(`.tile[data-uid="${b}"]`); if (target) await click(`.tile[data-uid="${target}"]`); }
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.clear'); browserErrors.length = 0; await send('Log.enable');
  for (const v of [{ width: 1280, height: 800, lang: 'zh' }, { width: 1920, height: 1080, lang: 'en' }, { width: 960, height: 600, lang: 'zh' }, { width: 390, height: 844, lang: 'en' }]) {
    const label = `${v.width}-${v.height}-${v.lang}`;
    await send('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.width < 600 });
    await send('Page.navigate', { url: gameUrl }); await wait(120); await ready();
    await evaluate(`localStorage.removeItem(${JSON.stringify(SAVE_KEY)});localStorage.setItem(${JSON.stringify(PREF_KEY)},${JSON.stringify(JSON.stringify({ lang: v.lang, sound: false, motion: true }))})`);
    await send('Page.reload', { ignoreCache: true }); await wait(120); await ready(); await audit(label + ' home', v.lang); await capture(label + '-home');
    await click('[data-action="new"]', false); await wait(300);
    check(label + ' bomb insertion and stacked shuffle cards', await evaluate('!!document.querySelector(".inserting-bomb")&&document.querySelectorAll(".shuffle-card").length===12&&document.body.dataset.busy==="true"'));
    await capture(label + '-bomb-insertion', false); await idle(); const initial = await state(); check(label + ' new run 20 cards and 16 types', initial.cards.length === 20 && new Set(initial.cards.map(c => c.kind)).size === 16);
    await audit(label + ' opening table', v.lang); await click('[data-action="home"]'); const savedBefore = JSON.stringify(await state());
    await click('[data-action="practice"]'); await audit(label + ' practice start', v.lang); await capture(label + '-practice');
    await click('#deck-draw', false); await wait(330);
    check(label + ' reveal flies and flips in 3D', await evaluate('!!document.querySelector(".flying-card")&&document.querySelector(".flip-inner").getAnimations().length>0'));
    await capture(label + '-flip', false); await idle();
    check(label + ' fermentation complete', await evaluate('document.querySelector(".tile[data-uid=\\"4\\"] strong").textContent') === (v.lang === 'zh' ? '万能酱' : 'Wild sauce'));
    await pair(4, 1, 2); check(label + ' pair readies flashlight', await evaluate('!document.querySelector(".tile[data-uid=\\"2\\"]").classList.contains("tapped")&&document.querySelectorAll(".tile.paired").length===2'));
    await click('.tile[data-uid="2"]'); await click('[data-action="use"]');
    const angle = await evaluate('(()=>{const c=document.querySelector(".tile[data-uid=\\"2\\"]"),m=new DOMMatrix(getComputedStyle(c).transform);return Math.atan2(m.b,m.a)*180/Math.PI-Number(c.dataset.angle)})()');
    check(label + ' entire card rotates 90 degrees', Math.abs(angle - 90) < .1, angle); check(label + ' flashlight peeks', await evaluate('document.querySelectorAll(".preview-slot.known").length===1'));
    await audit(label + ' combo', v.lang); await capture(label + '-combo'); check(label + ' practice keeps challenge save', savedBefore === JSON.stringify(await state()));
    await click('[data-action="rules"]'); await audit(label + ' rules', v.lang); await click('[data-action="close"]');
    await click('[data-action="catalog"]'); check(label + ' 27 card types', await evaluate('document.querySelectorAll(".catalog-card").length===27')); await audit(label + ' catalog', v.lang); await click('[data-action="close"]');
    await click('#stop'); check(label + ' practice cash-out ends', await evaluate('!!document.querySelector(".result")')); await audit(label + ' result', v.lang);
    const close = fixture(['fish', 'fish', 'rice']); await seed(close, v.lang); await pair(1, 2); await click('#stop'); check(label + ' cash-out opens dice', (await state()).phase === 'stakes');
    await click('#roll', false); await wait(420); const rolled = await state();
    check(label + ' dice use six rendered faces and live 3D rotation', await evaluate('document.querySelectorAll(".die-face").length===12&&getComputedStyle(document.querySelector(".d6")).transformStyle==="preserve-3d"&&document.querySelector(".d6").getAnimations().length>0'));
    await capture(label + '-dice-throw', false); await idle(); await audit(label + ' dice result', v.lang); await capture(label + '-dice-result');
    check(label + ' dice show committed values', await evaluate('[...document.querySelectorAll(".d6")].map(x=>+x.dataset.value).join(",")') === `${rolled.dice.result.tens},${rolled.dice.result.ones}`);
    await send('Page.reload', { ignoreCache: true }); await wait(120); await ready(); await click('[data-action="continue"]'); check(label + ' dice reload unchanged', JSON.stringify((await state()).dice) === JSON.stringify(rolled.dice));
    await click('#accept-dice'); await audit(label + ' draft', v.lang); await capture(label + '-draft');
    await click('[data-action="add"]'); await click('[data-action="remove"]:not(:disabled)'); let s = await state(); check(label + ' independent free add and remove', s.added && s.removed);
    await click('#next'); s = await state(); check(label + ' next round reset', s.round === 2 && s.flips === 0); const persisted = JSON.stringify(s);
    await send('Page.reload', { ignoreCache: true }); await wait(120); await ready(); await click('[data-action="continue"]'); check(label + ' exact resume', JSON.stringify(await state()) === persisted);
    const bomb = fixture(['torch'], ['bomb', 'rice']); await seed(bomb, v.lang); await click('.tile[data-uid="1"]'); await click('[data-action="use"]'); await click('#deck-draw'); check(label + ' bomb ends before abilities', (await state()).reason === 'bomb'); await audit(label + ' bomb', v.lang);
    const win = fixture(['fish', 'fish']); win.round = 5; win.target = 60; win.bank = 20; await seed(win, v.lang); await pair(1, 2); await click('#stop'); check(label + ' final victory', (await state()).phase === 'won'); await audit(label + ' victory', v.lang);
    console.log('One More? UI verified: ' + label);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  let s = fixture(['rice', 'scope', 'sorter'], ['paper', 'fish', 'bomb']); await seed(s); await click('.tile[data-uid="2"]'); await click('[data-action="use"]'); await click('[data-action="cancel"]'); check('cancel payment is atomic', JSON.stringify(await state()) === JSON.stringify(s));
  await click('[data-action="use"]'); await click('[data-action="choose"][data-index="0"]'); await click('.tile[data-uid="3"]'); await click('[data-action="use"]'); await click('[data-action="choose"][data-index="0"]'); await click('[data-action="choose"][data-index="0"]'); check('sorter swaps only the two non-bomb cards', JSON.stringify((await state()).draw) === JSON.stringify([5, 4, 6]));
  await click('[data-action="relic"][data-id="shaker"]', false); await wait(270); await capture('1280-relic-shuffle', false); await idle(); check('shuffle clears known positions', !(await state()).known.length);
  s = fixture(['rice']); await seed(s); await click('#stop'); check('under-target cashout warns before commit', (await state()).phase === 'play' && await evaluate('!!document.querySelector(".choosing")')); await click('[data-action="choose"][data-index="0"]'); check('can stay instead of losing', (await state()).phase === 'play'); await click('#stop'); await click('[data-action="choose"][data-index="1"]'); check('confirmed early departure loses', (await state()).reason === 'target');
  s = diceTier('high'); await seed(s, 'en'); await audit('English high-dice boons', 'en'); await capture('1280-high-dice-boons'); await click('[data-action="boon"][data-id="meal"]'); await click('#accept-dice'); await click('#next'); check('selected boon becomes next-round meal', (await state()).freePayments === 2);
  s = diceTier('low'); await seed(s); const count = s.cards.length; await click('#reroll'); const afterReroll = await state(); check('reroll replaces once', afterReroll.dice.rolls.length === 2 && await evaluate('document.querySelector("#reroll").disabled')); await click('#accept-dice'); check('only accepted dice effect commits', (await state()).cards.length === count + (afterReroll.dice.result.tier === 'low' ? 1 : 0));
  s = fixture(['wish', 'mint', 'torch'], ['mint', 'paper', 'bomb']); s.pending = 'wish'; await seed(s, 'en'); await audit('English wish choices', 'en'); await click('[data-action="wish"][data-id="mint"]'); await click('#deck-draw'); check('wish resolves through UI', (await state()).known.length === 2);
  s = fixture(['toast', 'wild', 'rice', 'scope']); await seed(s, 'en'); await click('.tile[data-uid="4"]'); await click('[data-action="use"]'); await click('.tile[data-uid="3"]'); await pair(1, 2); await click('[data-action="choose"][data-index="0"]'); check('toast pair reclaims spent food through UI', (await state()).cards[0].pair && (await state()).cards[2].zone === 'table');
  s = fixture(['rice', 'rice', 'oil', 'torch']); await seed(s); await click('.tile[data-uid="4"]'); check('oil blocks tool UI', await evaluate('document.querySelector("[data-action=use]").disabled')); await pair(1, 2, 3); await click('.tile[data-uid="4"]'); await click('[data-action="use"]'); check('rice clears oil without tools', (await state()).cards[2].zone === 'discard');
  s = fixture(['rice', 'fish', 'mint', 'wild', 'tea', 'toast', 'torch', 'scope', 'cloth', 'jar', 'relay', 'candle', 'timetable', 'paper', 'noise', 'rust']); s.cards[6].tapped = true; s.cards[9].tapped = true; await seed(s, 'en'); await audit('crowded table', 'en'); await capture('1280-crowded-table');
  const overlaps = await evaluate(`(()=>{const r=[...document.querySelectorAll('.tile')].map(e=>e.getBoundingClientRect());let n=0;for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++)if(Math.min(r[i].right,r[j].right)-Math.max(r[i].left,r[j].left)>2&&Math.min(r[i].bottom,r[j].bottom)-Math.max(r[i].top,r[j].top)>2)n++;return n;})()`); check('tilted cards and sideways cards do not cover each other', overlaps === 0, overlaps);
  s = fixture(['tea'], ['toast', 'torch', 'rice', 'bomb']); await seed(s); await click('#draw', false); await evaluate('for(let i=0;i<6;i++)document.querySelector("#draw").click()'); await idle(); check('rapid clicks cannot draw during animation', (await state()).flips === s.flips + 1);
  await click('#draw', false); await click('[data-action="skip-animation"]'); check('skip animation commits exactly one draw', (await state()).flips === s.flips + 2 && await evaluate('document.body.dataset.busy==="false"'));
  await click('[data-action="motion"]'); await click('#draw'); check('reduced-motion path is playable', (await state()).flips === s.flips + 3);
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const d = diceTier('steady'); d.dice.result.tens = n; d.dice.result.ones = n; d.dice.result.total = n * 11; await seed(d);
    const front = await evaluate(`(()=>{const cube=document.querySelector('.d6'),m=new DOMMatrix(getComputedStyle(cube).transform);return [...cube.querySelectorAll('.die-face')].map(f=>{const fm=new DOMMatrix(getComputedStyle(f).transform),normal=fm.transformPoint({x:0,y:0,z:1,w:0});return {n:+f.dataset.face,z:m.transformPoint(normal).z};}).sort((a,b)=>b.z-a.z)[0].n;})()`);
    check('die settled face matches value ' + n, front === n, front);
  }
  check('browser runtime errors', browserErrors.length === 0, browserErrors);
} catch (error) { report.failures.push(error.message); await capture('failure', false).catch(() => {}); console.error(error); process.exitCode = 1; }
finally { report.date = new Date().toISOString(); await writeFile(resolve(outputDir, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ checks: report.checks.length, captures: report.captures.length, failures: report.failures, outputDir })); transport.close(); }
if (report.failures.length) process.exitCode = 1;
