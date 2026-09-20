// Exercise real preference controls in an isolated Electron profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/palettes-v0120');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,useContentSize:true,width:1600,height:900,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={passed:false,cases:[],errors:[]};
 const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 const timer=setTimeout(()=>{report.failure='Palette UI timeout';save();app.exit(1);},90000);
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const ev=code=>win.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const reload=()=>win.loadFile(path.join(root,'index.html'));
 const click=selector=>ev(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.click();`);
 const capture=async name=>{await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await reload();
  for(const [width,height,lang] of [[1600,900,'zh'],[1280,720,'en'],[390,844,'zh'],[360,800,'en']]){
   win.setContentSize(width,height);
   await ev(`const {practiceRun}=await import('./test/fixtures.js');const s=practiceRun();s.practice=false;s.maxRounds=10;localStorage.clear();localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.player.v1',JSON.stringify({storySeen:true,storyVersion:3,tutorialComplete:true,tutorialVersion:3}));localStorage.setItem('one-more.run.v5',JSON.stringify(s));localStorage.setItem('one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(lang)},motion:false,music:false,sound:false}));`);
   await reload();await click('[data-action=continue]');
   const saved=await ev(`return localStorage.getItem('one-more.run.v5');`),entry={width,height,lang,palettes:[]};report.cases.push(entry);
   await click('[data-action=settings]');await click('[data-action=palettes]');
   await capture(`${width}-${lang}-gallery`);
   for(const id of ['midnight','plum','ember','lagoon','graphite','casino']){
    await click('[data-action=palette][data-id="'+id+'"]');
    const status=await ev(`const {PALETTES}=await import('./game/palettes.js');const id=${JSON.stringify(id)},d=document.querySelector('dialog'),selected=d.querySelector('[aria-pressed=true]');return {id:document.documentElement.dataset.palette,pref:JSON.parse(localStorage.getItem('one-more.preferences.v2')).palette,selected:selected?.dataset.id,count:d.querySelectorAll('.palette-option').length,fits:d.scrollWidth<=d.clientWidth+1,colors:Object.entries(PALETTES[id].colors).every(([k,v])=>getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()===v),unchanged:localStorage.getItem('one-more.run.v5')===${JSON.stringify(saved)}};`);
    if(status.id!==id||status.pref!==id||status.selected!==id||status.count!==6||!status.fits||!status.colors||!status.unchanged)throw Error(JSON.stringify(status));
    await click('[data-action=close]');await capture(`${width}-${lang}-${id}`);
    await reload();await click('[data-action=continue]');
    if(!await ev(`return document.documentElement.dataset.palette===${JSON.stringify(id)}&&localStorage.getItem('one-more.run.v5')===${JSON.stringify(saved)};`))throw Error('Reload changed palette or run');
    await click('[data-action=settings]');await click('[data-action=palettes]');entry.palettes.push(id);
   }
   if(!await ev(`return !document.documentElement.style.getPropertyValue('--felt-edge')&&!document.documentElement.style.getPropertyValue('--felt-shadow');`))throw Error('Original palette retained custom inks');
   await click('[data-action=palette-settings]');
   if(!await ev(`return !!document.querySelector('dialog [data-action=palettes]');`))throw Error('Settings return failed');
   entry.passed=true;
  }
  await ev(`const p=JSON.parse(localStorage.getItem('one-more.preferences.v2'));p.palette='missing-palette';localStorage.setItem('one-more.preferences.v2',JSON.stringify(p));`);
  await reload();if(!await ev(`return document.documentElement.dataset.palette==='casino';`))throw Error('Invalid preference did not fall back');
  if(report.errors.length)throw Error(report.errors.join('; '));report.passed=true;
 }catch(e){report.failure=e.stack;}
 clearTimeout(timer);save();console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
