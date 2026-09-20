// Run with Electron against this checkout. Uses its own profile and no player saves.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/tutorial-purpose-v0120');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,useContentSize:true,width:1280,height:720,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={passed:false,cases:[],errors:[]};
 const watchdog=setTimeout(()=>{report.failure='Tutorial UI timeout';fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));app.exit(1);},90000);
 win.webContents.on('console-message',event=>{if(event.level==='error')report.errors.push(event.message);});
 const ev=code=>win.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const reload=()=>win.loadFile(path.join(root,'index.html'));
 try{
  await reload();
  for(const config of [{width:1280,height:720,lang:'zh'},{width:1600,height:900,lang:'en'},{width:390,height:844,lang:'zh'},{width:390,height:844,lang:'en'},{width:844,height:390,lang:'en'}]){
   win.setContentSize(config.width,config.height);
   await ev(`const {tutorialRun,TUTORIAL_VERSION}=await import('./game/tutorial.js');const {SAVE_KEY,PREF_KEY}=await import('./game/engine.js');localStorage.clear();localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.player.v1',JSON.stringify({storySeen:true,storyVersion:TUTORIAL_VERSION}));localStorage.setItem(SAVE_KEY,JSON.stringify(tutorialRun(600)));localStorage.setItem(PREF_KEY,JSON.stringify({lang:${JSON.stringify(config.lang)},motion:false,music:false,sound:false}));`);
   await reload();await ev(`document.querySelector('[data-action=continue]').click();`);
   const entry={...config,steps:[],actions:[],captures:[]};report.cases.push(entry);
   for(let turn=0;turn<65;turn++){
    for(let wait=0;wait<200;wait++){
     if(await ev(`return document.body.dataset.busy!=='true'&&(!document.querySelector('.lesson')||!!document.querySelector('.tutorial-guide'));`))break;
     await pause(20);
    }
    await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
    const state=await ev(`const lesson=document.querySelector('.lesson');if(!lesson)return null;
     const target=document.querySelector('.lesson-target'),guide=document.querySelector('.guide-pointer');
     if(!target||!guide)throw Error('No tutorial target');
     const r=target.getBoundingClientRect(),p=guide.getBoundingClientRect(),text=lesson.querySelector('p'),help=lesson.getBoundingClientRect();
     const x=r.x+r.width/2,y=r.y+r.height/2;
     return {step:Number(lesson.dataset.step),label:guide.querySelector('span').textContent,body:text.textContent,action:target.dataset.action,x,y,enabled:!target.disabled,clear:target.contains(document.elementFromPoint(x,y)),visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,pointerFits:p.left>=0&&p.right<=innerWidth&&p.top>=0&&p.bottom<=innerHeight,textFits:text.scrollHeight<=text.clientHeight+1,explanationVisible:help.top>=0&&help.bottom<=innerHeight,pageFits:document.documentElement.scrollWidth<=innerWidth+1};`);
    if(!state)break;
    entry.actions.push(state);if(!entry.steps.includes(state.step))entry.steps.push(state.step);
    fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({config,turn,state},null,2));
    if(!state.enabled||!state.clear||!state.visible||!state.pointerFits||!state.textFits||!state.explanationVisible||!state.pageFits)throw Error('Tutorial layout: '+JSON.stringify({...config,...state}));
    if(['HERE','点这里'].includes(state.label))throw Error('Missing action-specific instruction');
    if(state.step===16&&!entry.rerollChecked){
     entry.rerollChecked=true;
     const picked=await ev(`const e=document.querySelector('[data-action="pick-die"]:not(:disabled)');if(e){e.click();return true;}return false;`);
     if(picked){entry.rerolled=true;await pause(80);continue;}
    }
    if([3,6,13,14,15,18].includes(state.step)&&!entry.captures.includes(state.step)){
     const name=`${config.width}x${config.height}-${config.lang}-step-${state.step}.png`;
     fs.writeFileSync(path.join(out,name),(await win.webContents.capturePage()).toPNG());entry.captures.push(state.step);
    }
    for(const type of ['mouseDown','mouseUp'])win.webContents.sendInputEvent({type,x:Math.round(state.x),y:Math.round(state.y),button:'left',clickCount:1});
    await pause(80);
   }
   const saved=await ev(`return JSON.parse(localStorage.getItem('one-more.run.v5'));`);
   if(entry.steps.length!==20||saved.round!==2||saved.lesson!=null)throw Error('Tutorial did not reach free play: '+JSON.stringify({config,steps:entry.steps,savedRound:saved.round,savedLesson:saved.lesson}));
   entry.passed=true;
  }
  if(report.errors.length)throw Error('Renderer errors: '+report.errors.join('; '));
  report.passed=true;
 }catch(error){report.failure=error.stack;}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 clearTimeout(watchdog);
 console.log(JSON.stringify({passed:report.passed,cases:report.cases.map(c=>({width:c.width,height:c.height,lang:c.lang,steps:c.steps.length,actions:c.actions.length,passed:c.passed})),failure:report.failure}));
 app.exit(report.passed?0:1);
});
