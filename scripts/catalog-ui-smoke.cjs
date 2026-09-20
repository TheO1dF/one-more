const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/catalog-audio-v1');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'catalog-profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={cases:[],errors:[]};win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message)});
 const ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),load=()=>win.loadFile(path.join(root,'index.html'));
 const click=selector=>ev(`const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)throw Error('Missing button '+${JSON.stringify(selector)});el.click();`);
 const capture=async name=>{await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try{
  await load();
  await ev(`const {newRun}=await import('./game/engine.js');localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.run.v5',JSON.stringify(newRun(29,{rules:2})));localStorage.setItem('one-more.player.v1',JSON.stringify({loops:17,tutorialComplete:true}));`);
  const original=await ev(`return [localStorage.getItem('one-more.run.v5'),localStorage.getItem('one-more.player.v1')];`);
  for(const [width,height,lang] of [[1280,800,'zh'],[1280,800,'en'],[390,844,'zh'],[390,844,'en']]){
   win.setContentSize(width,height);
   await ev(`const p=JSON.stringify({lang:${JSON.stringify(lang)},motion:false,sound:false,music:false});localStorage.setItem('one-more.preferences.v2',p);localStorage.setItem('growth-lab.v1.one-more.preferences.v2',p);`);await load();
   await click('[data-action=catalog]');
   let details=await ev(`const {CARDS,RELICS,PACKAGES}=await import('./game/cards.js');const {GROWTH_CARDS,GROWTH_RELICS}=await import('./game/growth-lab.js');return {cards:document.querySelectorAll('.catalog-card').length,pool:Object.keys(CARDS).length,relicPool:Object.keys(RELICS).length,packages:PACKAGES.some(p=>p.id.startsWith('growth-')),newCards:Object.entries(GROWTH_CARDS).every(([id,c])=>document.querySelector('.catalog-card[data-kind='+id+'] h3')?.textContent===c.name[${lang==='en'?1:0}])};`);
   if(details.cards!==94||details.pool!==80||details.relicPool!==20||details.packages||!details.newCards)throw Error(JSON.stringify(details));
   await click('[data-action=catalog-filter][data-id=growth]');if(await ev(`return document.querySelectorAll('.catalog-card').length;`)!==14)throw Error('Growth filter');
   if(!await ev(`const d=document.querySelector('dialog');return d.scrollWidth<=d.clientWidth+1&&![...document.querySelectorAll('.catalog-card')].some(c=>c.scrollWidth>c.clientWidth+1);`))throw Error('Card collection overflow');
   await capture(`${width}-${lang}-growth-catalog`);
   await click('[data-action=relic-catalog]');
   if(!await ev(`const {GROWTH_RELICS}=await import('./game/growth-lab.js');return document.querySelectorAll('.relic-entry').length===26&&Object.keys(GROWTH_RELICS).every(id=>document.querySelector('.relic-entry[data-id='+id+'] .unlock-label').textContent)&&document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth+1;`))throw Error('Pledged collection');
   await ev(`document.querySelector('.relic-entry[data-id=heirloomladle]').scrollIntoView({block:'start'});`);await capture(`${width}-${lang}-growth-pledges`);
   await click('[data-action=close]');await click('[data-action=settings]');
   const arrived=new Promise(resolve=>win.webContents.once('did-finish-load',resolve));await click('[data-action=growth-entry]');await arrived;await click('[data-action=new]');
   if(await ev(`return document.querySelectorAll('[data-action=growth-start]').length;`)!==6)throw Error('Growth entry');
   await click('[data-action=close]');await click('[data-action=settings]');const returned=new Promise(resolve=>win.webContents.once('did-finish-load',resolve));await click('[data-action=standard-entry]');await returned;
   const kept=await ev(`return {lab:new URLSearchParams(location.search).has('lab'),save:[localStorage.getItem('one-more.run.v5'),localStorage.getItem('one-more.player.v1')]};`);
   if(kept.lab||JSON.stringify(kept.save)!==JSON.stringify(original))throw Error('Return overwrote save');
   report.cases.push({width,height,lang,...details,passed:true});
  }
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('catalog-failure');}
 fs.writeFileSync(path.join(out,'catalog-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});

