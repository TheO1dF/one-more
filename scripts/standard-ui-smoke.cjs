const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/standard-v0131');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'ui-profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={browser:process.versions.chrome,cases:[],errors:[]},ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const load=(query={})=>win.loadFile(path.join(root,'dist/index.html'),{query});
 const click=selector=>ev(`const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});el.click();`);
 const check=async(s,message)=>{if(!await ev('return '+s))throw Error(message)};
 const wait=async exp=>{for(let i=0;i<600;i++){if(await ev('return '+exp))return;await pause(10);}throw Error('Timeout '+exp)};
 const idle=()=>wait("document.body.dataset.busy==='false'");
 const capture=async name=>{await pause(200);await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message)});
 const watchdog=setTimeout(()=>{console.error('Timeout');app.exit(1)},120000);
 try{
  await load();
  await ev("const {newRun}=await import('./game/engine.js');localStorage.setItem('one-more.run.v5',JSON.stringify(newRun(29,{rules:2})));localStorage.setItem('growth-lab.v1.one-more.run.v5','test-save-sentinel');localStorage.setItem('one-more.player.v1',JSON.stringify({loops:17,storySeen:true,storyVersion:3,tutorialComplete:true,tutorialVersion:3}));");
  const original=await ev("return localStorage.getItem('one-more.run.v5')");
  for(const [width,height,lang] of [[1280,800,'zh'],[390,844,'en']]){
   win.setContentSize(width,height);await ev(`localStorage.setItem('one-more.preferences.v2',JSON.stringify({lang:'${lang}',motion:false,music:false,sound:false}))`);
   for(const query of [{},{lab:'growth',keep:'yes'}]){
    await load(query);await check("!location.search.includes('lab=')&&!document.querySelector('[data-action=growth-entry]')",'Playtest entry remained');if(query.keep)await check("location.search.includes('keep=yes')",'Other query removed');
    await check(`localStorage.getItem('one-more.run.v5')===${JSON.stringify(original)}&&localStorage.getItem('growth-lab.v1.one-more.run.v5')==='test-save-sentinel'`,'Save changed');
    await click('[data-action=catalog]');await check("document.querySelectorAll('.catalog-card').length===80&&!document.querySelector('[data-id=growth]')&&!document.querySelector('[data-action=growth-entry]')&&!document.querySelector('dialog').textContent.match(/成长|试桌|playtest|Growth/)",'Catalog leaked test content');await capture(width+'-'+(query.lab?'old-link':'root')+'-cards');
    await click('[data-action=relic-catalog]');await check("document.querySelectorAll('.relic-entry').length===20&&!document.querySelector('dialog').textContent.match(/成长|试桌|playtest|Growth/)",'Pledge collection leaked');await click('[data-action=close]');await click('[data-action=settings]');await check("!document.querySelector('[data-action=growth-entry]')&&!document.querySelector('[data-action=growth-journal]')",'Settings leaked');await capture(width+'-settings');await click('[data-action=close]');
    await click('[data-action=continue]');await check("document.querySelector('.version').textContent==='v0.13.1'&&!document.querySelector('.growth-entry')",'Wrong game');await capture(width+'-game');await click('#draw');await idle();await check("JSON.parse(localStorage.getItem('one-more.run.v5')).flips===1",'Normal draw failed');await ev(`localStorage.setItem('one-more.run.v5',${JSON.stringify(original)})`);
    report.cases.push({width,height,lang,query,passed:true});
   }
  }
  await ev("const {tutorialRun,tutorialAct}=await import('./game/tutorial.js');let s=tutorialRun(600);for(let i=0;i<3;i++)s=tutorialAct(s,{type:'draw'});localStorage.setItem('one-more.run.v5',JSON.stringify(s))");await load({lab:'growth'});await click('[data-action=continue]');await click('.tile[data-kind=rice]');await click('[data-action=pair]');await click('[data-action=choose]');await idle();await check("JSON.parse(localStorage.getItem('one-more.run.v5')).lesson===4",'Tutorial pair blocked');report.tutorial=true;
  await ev(`localStorage.setItem('one-more.run.v5',${JSON.stringify(original)})`);
  // Source checkout keeps the isolated experiment available for further development.
  await win.loadFile(path.join(root,'index.html'),{query:{lab:'growth'}});await click('[data-action=new]');await check("document.querySelectorAll('[data-action=growth-start]').length===6",'Source playtest removed');report.sourcePlaytestPreserved=true;
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('failure');}
 clearTimeout(watchdog);fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
