const fs=require('node:fs'),path=require('node:path');
exports.run=async({win,reportPath})=>{
 const ev=async code=>{const r=await win.webContents.executeJavaScript('(async()=>{try{return {ok:true,value:await eval('+JSON.stringify(code)+')}}catch(e){return {ok:false,error:String(e),stack:e.stack}}})()');if(!r.ok)throw Error(r.error+'\n'+r.stack);return r.value;},pause=ms=>new Promise(r=>setTimeout(r,ms));
 const report={actions:0,passed:false};
 const idle=async()=>{for(let i=0;i<200;i++){if(await ev('document.body.dataset.busy!=="true"'))return;await pause(15);}throw Error('Animation did not release input');};
 const click=async selector=>{await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.click();})()`);await idle();};
 const reload=async()=>{const loaded=new Promise(r=>win.webContents.once('did-finish-load',r));win.webContents.reload();await loaded;};
 const plan=await ev(`(async()=>{
 const {newRun,act,onTable,partners,score,routeTargets}=await import('./game/engine.js'),{ROUTES}=await import('./game/routes.js');
 function next(s){if(s.phase==='midnight')return {type:'acceptMidnight'};if(s.phase==='play'){if(s.pending?.type==='discover')return {type:'discover',kind:s.pending.offers[0]};for(const c of onTable(s)){const p=partners(s,c.uid);if(p.length)return {type:'pair',ids:[c.uid,p[0].uid]};}return s.flips&&s.bank+score(s)>=s.target?{type:'stop'}:{type:'draw'};}if(s.phase==='stakes')return s.dice.result?{type:'acceptDice',boon:'sauce'}:{type:'roll'};if(s.phase==='route'){const id=s.routeOffers[0];return {type:'chooseRoute',id,...(ROUTES[id].type==='event'?{}:{uid:routeTargets(s,id)[0].uid})};}if(!s.added)return {type:'add',id:s.offers[0]};return s.relicOffer.length&&!s.relicPicked?{type:'chooseRelic',id:s.relicOffer.find(id=>id!=='lunchbox')||s.relicOffer[0]}:{type:'next'};}
 for(let seed=1;seed<10000;seed++){let s=newRun(seed,{rules:2}),actions=[];for(let i=0;i<350&&!['won','lost'].includes(s.phase);i++){const a=next(s);s=act(s,a);actions.push(a);}if(s.phase==='won')return {seed,actions,bank:s.bank,target:s.target};}throw Error('No winning reference seed');})()`);
 report.seed=plan.seed;
 await ev(`(async()=>{const {newRun,SAVE_KEY,PREF_KEY}=await import('./game/engine.js');const {ACHIEVEMENTS}=await import('./game/progress.js');localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.player.v1',JSON.stringify({tutorialComplete:true,tutorialVersion:3,storySeen:true,storyVersion:3,loops:0,achievements:Object.fromEntries(Object.keys(ACHIEVEMENTS).map(k=>[k,true]))}));localStorage.setItem(SAVE_KEY,JSON.stringify(newRun(${plan.seed},{rules:2})));localStorage.setItem(PREF_KEY,JSON.stringify({lang:'en',sound:false,music:false,motion:false,fps:60}));})()`);
 await reload();await click('[data-action=continue]');
 for(const a of plan.actions){
  if(a.type==='pair'){await click(`.tile[data-uid="${a.ids[0]}"]`);await click('[data-action=pair]');await click(`.tile[data-uid="${a.ids[1]}"]`);const n=await ev('document.querySelectorAll(".choice-list [data-action=choose]").length');if(n)await click(`[data-action=choose][data-index="${n-1}"]`);}
  else if(a.type==='chooseRoute'){await click(`[data-action=route][data-id="${a.id}"]`);if(a.uid!=null)await click(`[data-action=choose][data-uid="${a.uid}"]`);}
  else if(['add','chooseRelic'].includes(a.type))await click(`[data-action=${a.type}][data-id="${a.id}"]`);
  else if(a.type==='discover')await click('[data-action=choose][data-index="0"]');
  else if(a.type==='roll')await click('#roll');
  else if(a.type==='acceptDice')await click('#accept-dice');
  else await click(`[data-action=${a.type}]`);
  report.actions++;
 }
 const final=await ev(`(async()=>{const {SAVE_KEY}=await import('./game/engine.js');return JSON.parse(localStorage.getItem(SAVE_KEY));})()`);
 if(final.phase!=='won'||final.bank!==plan.bank||final.target!==plan.target)throw Error('Packaged ten-table UI diverged from rules');
 report.passed=true;report.round=final.round;report.bank=final.bank;report.target=final.target;report.routes=final.routeHistory.length;
 fs.writeFileSync(path.join(path.dirname(reportPath),'ten-tables.png'),(await win.webContents.capturePage()).toPNG());
 await click('[data-action=home]');await click('[data-action=achievements]');
 report.unlockBook=await ev('document.querySelectorAll(".milestone.unlocked").length===9&&document.querySelectorAll(".back-gallery button:not(:disabled)").length===4');
 await click('[data-action=close]');await click('[data-action=run-setup]');report.nextDifficulty=await ev(`!document.querySelector('[data-action=difficulty][data-id="1"]').disabled`);
 if(!report.unlockBook||!report.nextDifficulty)throw Error('Unlock UI did not match completed run');
 await click('[data-action=close]');
 fs.writeFileSync(path.join(path.dirname(reportPath),'reference-plan.json'),JSON.stringify(plan));return report;
};
