import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import * as production from '../dist/game/engine.js';
import * as source from '../game/engine.js';
import {CARDS,RELICS,PACKAGES} from '../dist/game/cards.js';
import {GROWTH_AVAILABLE,GROWTH_LAB,registerGrowthContent} from '../dist/game/standard-content.js';
assert.equal(GROWTH_AVAILABLE,false);assert.equal(GROWTH_LAB,false);
registerGrowthContent(CARDS,RELICS,PACKAGES);
assert.equal(Object.keys(CARDS).length,80);assert.equal(Object.keys(RELICS).length,20);
assert.ok(PACKAGES.every(p=>!p.id.startsWith('growth-')));
assert.ok(!production.newRun(1,{rules:2,growthRoute:'broth'}).growth);
assert.equal(production.restore(JSON.stringify({...production.newRun(1,{rules:2}),growth:{route:'broth',curve:'rising',seen:{}}})),null);
for(const name of ['growth-lab.js','growth-view.js','growth-art.js','growth.css','draft-services.js'])await assert.rejects(access(new URL('../dist/game/'+name,import.meta.url)));
assert.ok(!(await readFile(new URL('../dist/index.html',import.meta.url),'utf8')).includes('growth.css'));
for(const name of await readdir(new URL('../dist/game/',import.meta.url))){
 if(!name.endsWith('.js'))continue;
 const text=await readFile(new URL('../dist/game/'+name,import.meta.url),'utf8');
 for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g))await access(resolve('dist/game',match[1]));
}
let transitions=0;
for(let seed=1;seed<=20;seed++){
 let a=source.newRun(seed,{rules:2}),b=production.newRun(seed,{rules:2});
 const step=action=>{a=source.act(a,action);b=production.act(b,action);assert.deepEqual(a,b);assert.deepEqual(production.restore(JSON.stringify(b)),b);transitions++;};
 assert.deepEqual(a,b);
 // Controlled scores isolate lifecycle compatibility, not win rate or balance.
 for(let round=1;round<=11;round++){
  if(round>1){
   if(a.phase==='midnight')step({type:'acceptMidnight'});
   if(a.phase==='stakes'){step({type:'roll'});step({type:'acceptDice',boon:'scout'});}
   a.routeOffers=b.routeOffers=['tea','lantern'];step({type:'chooseRoute',id:'tea'});
   step({type:'add',id:a.offers[0]});if(a.relicOffer.length)step({type:'chooseRelic',id:a.relicOffer[0]});step({type:'next'});
  }
  step({type:'draw'});assert.equal(a.phase,'play');
  a.bank=b.bank=1e7;step({type:'stop'});
  if(round===10)step({type:'continueEndless'});
 }
}
console.log(`Standard release boundary passed: 80 cards, 20 pledges, no playtest assets; ${transitions} matching normal/endless lifecycle transitions.`);
