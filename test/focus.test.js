import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,act,restore,score,card} from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../game/cards.js';
import {registerGrowthContent,GROWTH_ROUTES,growthBase,growthCap,growthRaise} from '../game/growth-lab.js';
import {draftTargets} from '../game/draft-services.js';
import {tableGroups} from '../game/table-groups.js';
import {feedbackSummary} from '../game/feedback-summary.js';
import {diceTargetHTML,tableTargetLabel} from '../game/target-view.js';
registerGrowthContent(CARDS,RELICS,PACKAGES);
function draft(round=4,options={}){const s=newRun(6,{rules:2,growthRoute:'broth',...options});Object.assign(s,{round,phase:'route',bank:90,target:80,routeOffers:['tea','lantern']});return act(s,{type:'chooseRoute',id:'tea'});}
function table(s,kinds){for(const kind of kinds){const c={uid:++s.uid,kind,original:kind,zone:'table',tapped:false};s.cards.push(c);s.table.push(c.uid);}return s;}
test('ordinary growth curve is gentler, high stakes retains steep targets, and notices match rules',()=>{
 for(const difficulty of [0,1,2,3]){const s=newRun(1,{rules:2,growthRoute:'broth',difficulty});const expected=difficulty>=2?[1,1,2,3,4,6,9,13,18]:[1,1,2,2,3,4,5,6,8];for(let round=1;round<10;round++){s.round=round;assert.equal(growthRaise(s,1),expected[round-1]);}}
 const s=draft(8);s.phase='stakes';s.dice={result:{total:13,faces:[6,7]}};
 const hidden=diceTargetHTML(s,'en',false),shown=diceTargetHTML(s,'en',true);assert.ok(hidden.includes('×6'));assert.ok(!hidden.includes('13 ×'));assert.ok(shown.includes('13 × 6'));assert.ok(shown.includes('+78'));assert.ok(shown.includes('80 → 158'));
 s.phase='play';s.round=9;assert.equal(tableTargetLabel(s,'en'),'DICE ×6');s.growth.curve='classic';assert.equal(tableTargetLabel(s,'en'),'ORIGINAL TARGETS');
});
test('focus rewards appear from table five preparation; selection is atomic and mandatory',()=>{
 assert.ok(!draft(3).offers.some(id=>id.startsWith('focus-')));
 let s=draft();assert.deepEqual(s.offers,['growth-broth','focus-upgrade','focus-prune']);const before=JSON.stringify(s),size=s.cards.length;
 assert.throws(()=>act(s,{type:'next'}));assert.throws(()=>act(s,{type:'add',id:'focus-upgrade',uid:20}));assert.throws(()=>act(s,{type:'add',id:'focus-upgrade',uid:4}));assert.equal(JSON.stringify(s),before);
 const order=[...s.draw];s=act(s,{type:'add',id:'focus-upgrade',uid:1});assert.equal(s.cards.length,size+1);assert.equal(card(s,1).growthLevel,1);assert.equal(growthBase(card(s,1)),4);assert.equal(s.cards.at(-1).original,'paper');assert.deepEqual(s.draw,order);assert.equal(s.bank,90);assert.equal(s.draftReceipt.to,4);assert.throws(()=>act(s,{type:'add',id:'focus-upgrade',uid:2}));assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('pruning is net zero cards, permanently removes the chosen entity, preserves bomb and shortens staples',()=>{
 let s=draft();s.staples=[{id:1,uids:[1,2,4],readyRound:5}];s.stapleId=1;
 assert.throws(()=>act(s,{type:'add',id:'focus-prune',uid:20}));const count=s.cards.length;
 s=act(s,{type:'add',id:'focus-prune',uid:4});assert.equal(s.cards.length,count);assert.ok(!card(s,4));assert.deepEqual(s.staples[0].uids,[1,2]);assert.equal(s.cards.at(-1).kind,'paper');assert.ok(card(s,20));assert.equal(s.draftReceipt.removed.uid,4);assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('growth cap rises by two per endless table; rewards and normal triggers work above level ten',()=>{
 for(const route of Object.keys(GROWTH_ROUTES)){
  let s=draft(10,{growthRoute:route});s.endless=true;s=restore(JSON.stringify(s));const r=GROWTH_ROUTES[route],c=card(s,1);Object.assign(c,{growthLevel:10,growthXP:r.every*10});s.offers=['growth-'+route,'focus-upgrade','focus-prune'];
  assert.equal(growthCap(s),12);s=act(s,{type:'add',id:'focus-upgrade',uid:1});assert.equal(growthBase(card(s,1)),4096);assert.equal(card(s,1).growthXP,r.every*11);assert.deepEqual(restore(JSON.stringify(s)),s);
 }
 let s=draft(10,{growthRoute:'dough'});s.phase='play';s.round=11;s.endless=true;Object.assign(card(s,1),{growthLevel:10,growthXP:32});s=table(s,['rice','rice']);s=act(s,{type:'pair',ids:s.table.slice(-2)});assert.equal(card(s,1).growthLevel,11);assert.equal(growthBase(card(s,1)),4096);assert.ok(restore(JSON.stringify(s)));
 const old=draft();for(const c of draftTargets(old,'focus-upgrade'))Object.assign(c,{growthLevel:10,growthXP:30});assert.equal(draftTargets(old,'focus-upgrade').length,0);assert.throws(()=>act(old,{type:'add',id:'focus-upgrade',uid:1}));
 const nearCap=draft();Object.assign(card(nearCap,1),{growthLevel:9,growthXP:29});const capped=act(nearCap,{type:'add',id:'focus-upgrade',uid:1});assert.equal(card(capped,1).growthXP,30);assert.equal(card(capped,1).growthLevel,10);assert.deepEqual(restore(JSON.stringify(capped)),capped);
});
test('folding preserves battlefield identities, score and effect targets; choices expand the table',()=>{
 const s=table(newRun(4,{rules:2,growthRoute:'broth'}),['rice','rice','fish','fish','torch','scope','bell','mint','mint','candle','cloth','tea']);
 for(const [i,c] of s.cards.filter(c=>c.zone==='table').entries()){if(i<4){c.pair=Math.floor(i/2)+1;c.pairedOnce=true;}if(['torch','scope','bell'].includes(c.kind))c.tapped=true;}
 const before=JSON.stringify(s),banked=score(s),g=tableGroups(s);assert.equal(g.folded.length,7);assert.equal(g.visible.length,5);assert.equal(score(s),banked);assert.equal(JSON.stringify(s),before);
 assert.equal(tableGroups(s,{flow:{choices:[]}}).folded.length,0);assert.equal(tableGroups(s,{expanded:true}).visible.length,12);
 assert.equal(tableGroups(s,{selected:s.table[0]}).visible.length,7);s.lesson=3;assert.equal(tableGroups(s).folded.length,0);
});
test('combined feedback deduplicates visual triggers without changing any rule event',()=>{
 const before=newRun(3,{rules:2,growthRoute:'dough'});const s=table(structuredClone(before),['rice','rice']);s.cards[0].growthXP=s.cards[1].growthXP=2;const after=act(s,{type:'pair',ids:s.table});const snapshot=JSON.stringify(after);const summary=feedbackSummary(s,after);assert.equal(summary.grown.length,2);assert.ok(summary.combined);assert.equal(JSON.stringify(after),snapshot);assert.equal(after.cards[0].growthLevel,1);assert.equal(after.cards[1].growthLevel,1);
});
