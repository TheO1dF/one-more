const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/entry-v0131');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'ui-profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={browser:process.versions.chrome,cases:[],errors:[]},ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const load=(query={})=>win.loadFile(path.join(root,'dist/index.html'),{query});
 const click=selector=>ev(`const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});el.click();`);
 const check=async(s,message)=>{if(!await ev('return '+s))throw Error(message)};
 const wait=async exp=>{for(let i=0;i<600;i++){if(await ev('return '+exp))return;await pause(10);}throw Error('Timeout '+exp)};
 const capture=async name=>{await pause(200);await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message)});
 const watchdog=setTimeout(()=>{console.error('Timeout');app.exit(1)},120000);
 try{
  await load();await ev("const {newRun}=await import('./game/engine.js');localStorage.setItem('one-more.run.v5',JSON.stringify(newRun(29,{rules:2})));localStorage.setItem('one-more.player.v1',JSON.stringify({loops:17,storySeen:true,storyVersion:3,tutorialComplete:true,tutorialVersion:3}));");
  const original=await ev("return localStorage.getItem('one-more.run.v5')");
  for(const [width,height,lang] of [[1280,800,'zh'],[390,844,'en']]){
   win.setContentSize(width,height);await ev(`const p=JSON.stringify({lang:'${lang}',motion:false,music:false,sound:false});localStorage.setItem('one-more.preferences.v2',p);localStorage.setItem('growth-lab.v1.one-more.preferences.v2',p)`);await load();
   await click('[data-action=catalog]');await check("document.querySelectorAll('.catalog-card').length===94&&!document.querySelector('[data-action=growth-entry]')",'Cards or hidden entry');await click('[data-action=catalog-filter][data-id=growth]');await check("document.querySelectorAll('.catalog-card').length===14",'New cards missing');await capture(width+'-new-cards');
   await click('[data-action=relic-catalog]');await check("document.querySelectorAll('.relic-entry').length===26&&!document.querySelector('[data-action=growth-entry]')",'Pledges or entry');await click('[data-action=close]');await click('[data-action=settings]');await check("!document.querySelector('[data-action=growth-entry]')",'Settings entry remained');await capture(width+'-settings');await click('[data-action=close]');
   await load({lab:'growth'});await check("location.search.includes('lab=growth')",'Old link changed');await click('[data-action=new]');await check("document.querySelectorAll('[data-action=growth-start]').length===6",'Routes removed');await click('[data-action=growth-start][data-id=broth]');await wait("document.body.dataset.busy==='false'");await click('#draw');await wait("document.body.dataset.busy==='false'");await check("document.querySelector('.tile[data-kind=stockpot]')!==null&&JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5')).growth.route==='broth'",'New cards no longer playable');await capture(width+'-retained-gameplay');
   await check(`localStorage.getItem('one-more.run.v5')===${JSON.stringify(original)}`,'Normal save overwritten');report.cases.push({width,height,lang,hiddenEntry:true,cards:94,pledges:26,playableGrowth:true,normalSavePreserved:true});
  }
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('failure');}
 clearTimeout(watchdog);fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
