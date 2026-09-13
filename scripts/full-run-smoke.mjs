import { routeTargets } from '../game/engine.js';
import { ROUTES } from '../game/routes.js';
import { newRun, act, onTable, partners, score, SAVE_KEY, PREF_KEY } from '../game/engine.js';
import { connectSmokeTransport } from './smoke-transport.mjs';
import { writeFile } from 'node:fs/promises';
function nextAction(s) {
  if (s.phase === 'play') {
    if (s.pending) return { type: 'wish', kind: 'rice' };
    for (const c of onTable(s)) { const p = partners(s, c.uid); if (p.length) return { type: 'pair', ids: [c.uid, p[0].uid] }; }
    if (s.flips && s.bank + score(s) >= s.target) return { type: 'stop' };
    return { type: 'draw' };
  }
  if (s.phase === 'stakes') return s.dice.result ? { type: 'acceptDice', boon: 'sauce' } : { type: 'roll' };
  if(s.phase==='route'){const id=s.routeOffers[0];return {type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(s,id)[0].uid})};}
  if(s.phase==='draft'&&!s.added)return {type:'add',id:s.offers[0]};
  if (s.phase === 'draft') return s.relicOffer.length && !s.relicPicked ? { type: 'chooseRelic', id: 'recycler' } : { type: 'next' };
}
let winner, actions;
for (let seed = 1; seed < 500; seed++) {
  let s = newRun(seed), route = [];
  for (let n = 0; n < 200 && !['won', 'lost'].includes(s.phase); n++) { const a = nextAction(s); s = act(s, a); route.push(a); }
  if (s.phase === 'won') { winner = { seed, bank: s.bank, target: s.target }; actions = route; break; }
}
if (!winner) throw Error('No complete reference route');
console.log('Deterministic full-run reference', winner, actions.length, 'actions');
if (process.argv.includes('--plan-only')) process.exit(0);
const t = await connectSmokeTransport(Number(process.env.EDGE_DEBUG_PORT || 9227));
const report = { ...winner, actions, browser: 'Microsoft Edge', verified: false };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression) { const r = await t.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
async function click(selector) {
  const p = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await t.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...p, button: 'left', clickCount: 1 }); await t.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p, button: 'left', clickCount: 1 });
  await wait(20); for (let n = 0; n < 100; n++) { if (await evaluate('document.body.dataset.busy!=="true"')) return; await wait(40); } throw Error('Busy timeout');
}
try {
  await t.send('Page.enable'); await t.send('Runtime.enable'); await t.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await t.send('Page.navigate', { url: 'http://127.0.0.1:8888/' }); await wait(200);
  await evaluate(`localStorage.setItem(${JSON.stringify(SAVE_KEY)},${JSON.stringify(JSON.stringify(newRun(winner.seed)))});localStorage.setItem(${JSON.stringify(PREF_KEY)},${JSON.stringify(JSON.stringify({ lang: 'zh', sound: false, motion: false }))})`);
  await t.send('Page.reload', { ignoreCache: true }); await wait(180); await click('[data-action="continue"]');
  for (const a of actions) {
    if (a.type === 'pair') { await click(`.tile[data-uid="${a.ids[0]}"]`); await click('[data-action="pair"]'); await click(`.tile[data-uid="${a.ids[1]}"]`); const count = await evaluate('document.querySelectorAll(".choice-list [data-action=choose]").length'); if (count) await click(`[data-action="choose"][data-index="${count - 1}"]`); }
    else if(a.type==='chooseRoute'){await click(`[data-action="route"][data-id="${a.id}"]`);if(a.uid!=null)await click(`[data-action="choose"][data-uid="${a.uid}"]`);}
    else if(a.type==='add')await click(`[data-action="add"][data-id="${a.id}"]`);
    else if (a.type === 'wish') await click('[data-action="wish"][data-id="rice"]');
    else if (a.type === 'chooseRelic') await click('[data-action="chooseRelic"][data-id="recycler"]');
    else if (a.type === 'roll') await click('#roll');
    else if (a.type === 'acceptDice') await click('#accept-dice');
    else await click(`[data-action="${a.type}"]`);
  }
  const final = await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}))`);
  if (final.phase !== 'won' || final.bank !== winner.bank || final.target !== winner.target || final.round !== final.maxRounds || final.maxRounds !== 10) throw Error('Full-run browser diverged from engine');
  report.verified = true; report.round = final.round; report.checkpoints = final.goalHistory; report.paths = final.routeHistory; if(final.routeHistory.length!==9)throw Error("Expected nine path selections");
  await evaluate('window.scrollTo(0,0)'); const shot = await t.send('Page.captureScreenshot', { format: 'png' }); await writeFile('.artifacts/smoke-one-more-v044/full-ten-table-victory.png', Buffer.from(shot.data, 'base64'));
  console.log('Completed ten tables through actual UI', final.bank, '/', final.target);
} finally { await writeFile('.artifacts/smoke-one-more-v044/full-run.json', JSON.stringify(report, null, 2)); t.close(); }
