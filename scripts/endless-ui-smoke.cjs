const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/dealer-events-v2');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'endless-profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={cases:[],errors:[]},ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message)});
 let lab=true;const load=()=>win.loadFile(path.join(root,'index.html'),{query:lab?{lab:'growth'}:{}}),prefix=()=>lab?'growth-lab.v1.':'';
 const click=sel=>ev(`const b=document.querySelector(${JSON.stringify(sel)});if(!b||b.disabled)throw Error('Unavailable '+${JSON.stringify(sel)});b.click();`);
 const wait=async exp=>{for(let i=0;i<600;i++){if(await ev('return '+exp))return;await pause(10);}throw Error('Timeout '+exp)};
 const idle=()=>wait("document.body.dataset.busy==='false'");
 const capture=async name=>{await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 const key=()=>prefix()+'one-more.run.v5',saved=()=>ev(`return JSON.parse(localStorage.getItem(${JSON.stringify(key())}));`);
 const watchdog=setTimeout(()=>{console.error('Timeout');app.exit(1)},120000);
 try{
  for(const cfg of [{w:1280,h:800,lang:'zh',lab:true},{w:390,h:844,lang:'en',lab:true},{w:1280,h:800,lang:'en',lab:false},{w:390,h:844,lang:'zh',lab:false}]){
   lab=cfg.lab;win.setContentSize(cfg.w,cfg.h);await load();
   await ev(`const {newRun}=await import('./game/engine.js');const s=newRun(141,{rules:2,${lab?"growthRoute:'broth',":''}});Object.assign(s,{round:10,bank:500,target:500,flips:1});localStorage.setItem(${JSON.stringify(key())},JSON.stringify(s));localStorage.setItem(${JSON.stringify(prefix()+'one-more.preferences.v2')},JSON.stringify({lang:${JSON.stringify(cfg.lang)},motion:false,music:false,sound:false}));`);
   await load();await click('[data-action=continue]');await click('#stop');await idle();await capture(`${cfg.w}-${lab?'growth':'normal'}-endless-choice`);
   if((await saved()).phase!=='won')throw Error('10 not cleared');await load();await click('[data-action=continue]');await click('[data-action=continueEndless]');await idle();
   for(const round of [11,12]){
    let s=await saved();if(s.phase!=='route'||s.target!==500*2**(round-10))throw Error('Wrong target '+round);
    await capture(`${cfg.w}-${lab?'growth':'normal'}-target-${round}`);
    await ev(`const key=${JSON.stringify(key())},s=JSON.parse(localStorage.getItem(key));s.routeOffers=['lantern','tea'];localStorage.setItem(key,JSON.stringify(s));`);await load();await click('[data-action=continue]');await click('[data-action=route][data-id=lantern]');await idle();await click('[data-action=add]');await idle();
    if((await saved()).relicOffer.length)await click('[data-action=chooseRelic]');await idle();await click('[data-action=next]');await idle();
    s=await saved();if(s.round!==round||s.phase!=='play'||!s.endless)throw Error('Next blocked');if(!await ev(`return document.querySelector('.round-plaque small').textContent.includes('∞')&&document.documentElement.scrollWidth<=innerWidth+1;`))throw Error('HUD');await capture(`${cfg.w}-${lab?'growth':'normal'}-table-${round}`);
    if(round===11){await ev(`const key=${JSON.stringify(key())},s=JSON.parse(localStorage.getItem(key));s.bank=s.target;s.flips=1;localStorage.setItem(key,JSON.stringify(s));`);await load();await click('[data-action=continue]');await click('#stop');await idle();}
   }
   report.cases.push({...cfg,endless:true});
  }
  lab=true;win.setContentSize(1280,800);await load();
  await ev(`const {newRun,act}=await import('./game/engine.js');const s=newRun(7,{rules:2,growthRoute:'broth'});Object.assign(s,{bank:30,target:40,phase:'route',routeOffers:['trade','tea']});localStorage.setItem(${JSON.stringify(key())},JSON.stringify(act(s,{type:'chooseRoute',id:'trade'})));localStorage.setItem('growth-lab.v1.one-more.preferences.v2',JSON.stringify({lang:'zh',motion:true,music:false,sound:false}));`);
  await load();await click('[data-action=continue]');await pause(300);const before=await ev(`return getComputedStyle(document.querySelector('.dealer-head')).transform`);await capture('actor-idle-a');await pause(2300);const after=await ev(`return getComputedStyle(document.querySelector('.dealer-head')).transform`);if(before===after)throw Error('Static actor');await capture('actor-idle-b');
  const clock=await ev(`return document.querySelector('.dealer-actor').getAnimations({subtree:true}).find(a=>a.animationName==='dealer-look').currentTime`);await click('[data-role=kind]');const clock2=await ev(`return document.querySelector('.dealer-actor').getAnimations({subtree:true}).find(a=>a.animationName==='dealer-look').currentTime`);if(clock2<clock-10)throw Error('Animation restarted on select');
  const performanceCode=`const {dealerPresentation}=await import('./game/presentation.js');const {newRun,act}=await import('./game/engine.js');let s=newRun(7,{rules:2,growthRoute:'broth'});Object.assign(s,{bank:30,target:40,phase:'route',routeOffers:['prune','tea']});const after=act(s,{type:'chooseRoute',id:'prune',uid:1});window.tearTask=dealerPresentation(s,after,{type:'chooseRoute',id:'prune'},'zh',cue=>(window.tearCues??=[]).push({cue,time:performance.now()}));`;
  for(const width of [1280,390]){win.setContentSize(width,width===1280?800:844);await wait('innerWidth==='+width);await pause(200);await ev(performanceCode);await wait("document.querySelector('.dealer-stage')?.dataset.stage==='grip'");await capture(width+'-grip-v2');await wait("document.querySelector('.dealer-stage')?.dataset.stage==='tear'");await capture(width+'-initial-split-v2');await wait("document.querySelector('.dealer-stage')?.dataset.stage==='peel'");await pause(100);await capture(width+'-peel-v2');await ev('await window.tearTask');if(!await ev(`return !document.querySelector('#performance').children.length`))throw Error('Tear overlay stuck');}
  const cues=await ev('return window.tearCues');report.tearCues=cues;report.animation={moving:true,keepsClockOnSelection:true};
  await ev(performanceCode);await wait("!!document.querySelector('.skip-performance')");await click('[data-action=skip-animation]');await ev('await window.tearTask');if(!await ev(`return !document.querySelector('#performance').children.length`))throw Error('Skip stuck');
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('endless-failure');}
 clearTimeout(watchdog);fs.writeFileSync(path.join(out,'endless-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
