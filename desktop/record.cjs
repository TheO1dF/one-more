const fs=require('node:fs'),path=require('node:path');
exports.run=async({win,out})=>{
 const ev=async code=>{const r=await win.webContents.executeJavaScript('(async()=>{try{return {ok:true,value:await eval('+JSON.stringify(code)+')}}catch(e){return {ok:false,error:String(e),stack:e.stack}}})()');if(!r.ok)throw Error(r.error+'\n'+r.stack);return r.value;};
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const idle=async()=>{for(let n=0;n<300;n++){if(await ev('document.body.dataset.busy!=="true"'))return;await pause(20);}throw Error('Input did not release: '+JSON.stringify(await ev('({hidden:document.hidden,animations:document.getAnimations().map(a=>({state:a.playState,time:a.currentTime,end:a.effect.getComputedTiming().endTime})),text:document.body.innerText.slice(-800)})')));};
 const click=async selector=>{await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.click();})()`);await idle();};
 const reload=async()=>{const done=new Promise(r=>win.webContents.once('did-finish-load',r));win.webContents.reload();await done;};
 const plan=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.artifacts/pc-v0120/reference-plan.json'),'utf8'));
 fs.mkdirSync(out,{recursive:true});const framesDir=path.resolve(__dirname,'../.artifacts/trailer-frames');fs.mkdirSync(framesDir,{recursive:true});
 win.setContentSize(1920,1080);win.center();win.showInactive();
 const states=await ev(`(async()=>{const {newRun,act}=await import('./game/engine.js');let s=newRun(${plan.seed},{rules:2}),states=[s];for(const a of ${JSON.stringify(plan.actions)}){s=act(s,a);states.push(s);}return states;})()`);
 const load=async(s,lang='en',motion=true)=>{await ev(`(async()=>{const {SAVE_KEY,PREF_KEY}=await import('./game/engine.js');const {ACHIEVEMENTS}=await import('./game/progress.js');localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.player.v1',JSON.stringify({tutorialComplete:true,tutorialVersion:3,storySeen:true,storyVersion:3,loops:0,achievements:Object.fromEntries(Object.keys(ACHIEVEMENTS).map(k=>[k,true]))}));localStorage.setItem(SAVE_KEY,${JSON.stringify(JSON.stringify(s))});localStorage.setItem(PREF_KEY,JSON.stringify({lang:'${lang}',sound:false,music:false,motion:${motion},fps:60}));})()`);await reload();await click('[data-action=continue]');await pause(150);};
 const actUI=async a=>{
  if(a.type==='pair'){await click(`.tile[data-uid="${a.ids[0]}"]`);await pause(250);await click('[data-action=pair]');await click(`.tile[data-uid="${a.ids[1]}"]`);const n=await ev('document.querySelectorAll(".choice-list [data-action=choose]").length');if(n)await click(`[data-action=choose][data-index="${n-1}"]`);}
  else if(a.type==='chooseRoute'){await click(`[data-action=route][data-id="${a.id}"]`);if(a.uid!=null)await click(`[data-action=choose][data-uid="${a.uid}"]`);}
  else if(['add','chooseRelic'].includes(a.type))await click(`[data-action=${a.type}][data-id="${a.id}"]`);
  else if(a.type==='discover')await click('[data-action=choose][data-index="0"]');
  else if(a.type==='roll'){await click('[data-action=shake-die]');await pause(500);await click('#roll');}
  else if(a.type==='use'){await click(`.tile[data-uid="${a.uid}"]`);await pause(350);await click('[data-action=use]');}
  else if(a.type==='acceptDice')await click('#accept-dice');
  else await click(`[data-action=${a.type}]`);
 };
 const plays=states.filter(s=>s.phase==='play'&&s.table.length>=6),best=[...plays].sort((a,b)=>b.table.length-a.table.length)[0];
 const screenshots=[best,plays.find(s=>s.cards.some(c=>c.zone==='table'&&c.enchantment))||plays.at(-1),states.find(s=>s.phase==='stakes'&&s.round>=5&&s.dice.result),states.find(s=>s.phase==='draft'&&!s.added),states.find(s=>s.phase==='draft'&&s.added&&s.relicOffer.length&&!s.relicPicked)];
 for(let i=0;i<screenshots.length;i++){await load(screenshots[i],'en',true);await pause(350);fs.writeFileSync(path.join(out,`screenshot-${i+1}.png`),(await win.webContents.capturePage()).resize({width:1920,height:1080}).toPNG());}
 const triple=await ev(`(async()=>{const {newRun,act}=await import('./game/engine.js');let s=newRun(${plan.seed},{rules:2,difficulty:1});for(const a of ${JSON.stringify(plan.actions)}){if(s.round===7&&s.phase==='stakes')break;s=act(s,a);}return act(s,{type:'roll'});})()`);
 await load(triple);const tripleLayout=await ev(`(()=>{const c=[...document.querySelectorAll('canvas[data-d20=tray]')];return {count:c.length,inside:c.every(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.x>=p.x&&r.right<=p.right+1&&r.y>=p.y&&r.bottom<=p.bottom+1;})};})()`);
 if(tripleLayout.count!==3||!tripleLayout.inside)throw Error('Three dice do not fit the tray');
 fs.writeFileSync(path.resolve(__dirname,'../.artifacts/pc-v0120/three-dice-layout.json'),JSON.stringify(tripleLayout));fs.writeFileSync(path.join(out,'screenshot-6.png'),(await win.webContents.capturePage()).resize({width:1920,height:1080}).toPNG());
 let frameIndex=0,last=0,recording=false;const captured=[],scenes=[];
 win.webContents.beginFrameSubscription(false,image=>{const now=Date.now();if(!recording||now-last<32)return;last=now;const file=path.join(framesDir,String(frameIndex++).padStart(6,'0')+'.jpg');fs.writeFileSync(file,image.resize({width:1920,height:1080}).toJPEG(88));captured.push({file,time:now});});
 const captureStill=async()=>{const file=path.join(framesDir,String(frameIndex++).padStart(6,'0')+'.jpg');fs.writeFileSync(file,(await win.webContents.capturePage()).resize({width:1920,height:1080}).toJPEG(88));captured.push({file,time:Date.now()});};
 const clip=async(label,start,actions,hold=700)=>{recording=false;await load(start);scenes.push({label,frame:frameIndex});await captureStill();recording=true;last=0;await pause(hold);for(const a of actions){await actUI(a);await pause(350);}await pause(1200);recording=false;await captureStill();};
 const firstStop=plan.actions.findIndex(a=>a.type==='stop');
 await clip('Reveal cards and bank the score',states[0],plan.actions.slice(0,firstStop+1));
 const rollIndex=plan.actions.findIndex(a=>a.type==='roll');await clip('Shake and throw; dice raise the target',states[rollIndex],plan.actions.slice(rollIndex,rollIndex+2));
 const packIndex=plan.actions.findIndex(a=>a.type==='add');await clip('A package always brings trouble',states[packIndex],[plan.actions[packIndex]],1600);
 const pairIndex=plan.actions.findIndex((a,i)=>a.type==='pair'&&states[i].round>=5&&states[i].table.length>=6);
 if(pairIndex>=0)await clip('Later-table combinations',states[pairIndex],[plan.actions[pairIndex]],1400);
 const peekState=states.find(s=>s.phase==='play'&&s.cards.some(c=>c.zone==='table'&&c.kind==='torch'&&!c.tapped)&&!s.cards.some(c=>c.zone==='table'&&['oil','noise'].includes(c.kind)));
 if(peekState)await clip('A peek reveals information, not the card',peekState,[{type:'use',uid:peekState.cards.find(c=>c.zone==='table'&&c.kind==='torch'&&!c.tapped).uid}],900);
 const bombState=await ev(`(async()=>{const {newRun,act,card}=await import('./game/engine.js');let s=newRun(17,{rules:2});while(card(s,s.draw[0]).kind!=='bomb')s=act(s,{type:'draw'});return s;})()`);
 await clip('Revealing a bomb ends the run',bombState,[{type:'draw'}],900);
 win.webContents.endFrameSubscription();
 const breaks=new Set(scenes.slice(1).map(s=>s.frame));const list=captured.map((f,i)=>`file '${path.basename(f.file)}'\nduration ${breaks.has(i+1)?1/30:Math.max(1/120,((captured[i+1]?.time||f.time+33)-f.time)/1000)}`).join('\n');
 fs.writeFileSync(path.join(framesDir,'frames.ffconcat'),'ffconcat version 1.0\n'+list+`\nfile '${path.basename(captured.at(-1).file)}'\n`);
 fs.writeFileSync(path.join(out,'recording.json'),JSON.stringify({source:'Actual locally rendered PC game, fixed-seed gameplay; cuts between scenes',version:'0.12.0',seed:plan.seed,frames:frameIndex,scenes,audio:'In-game jazz soundtrack mixed under captured gameplay; no claimed live audio capture',screenshots:screenshots.map(s=>({round:s.round,phase:s.phase,table:s.table.length}))},null,2));
};
