const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/growth-lab-v1');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={passed:false,cases:[],errors:[]};
 const timer=setTimeout(()=>{console.log('Growth UI timeout');app.exit(1);},120000);
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`);
 const load=lab=>win.loadFile(path.join(root,'index.html'),lab?{query:{lab:'growth'}}:{});
 const click=selector=>ev(`const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing control '+${JSON.stringify(selector)});e.click();`);
 const idle=async()=>{for(let n=0;n<250;n++){if(await ev(`return document.body.dataset.busy!=='true';`)){await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');return;}await pause(20);}throw Error('Still busy');};
 const capture=async name=>fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());
 try{
  await load(false);
  await ev(`const {newRun}=await import('./game/engine.js');localStorage.setItem('one-more.run.v5',JSON.stringify(newRun(99,{rules:2})));localStorage.setItem('one-more.player.v1',JSON.stringify({loops:23,storySeen:true,tutorialComplete:true}));`);
  const original=await ev(`return [localStorage.getItem('one-more.run.v5'),localStorage.getItem('one-more.player.v1')];`);
  for(const [width,height,lang] of [[1280,800,'zh'],[390,844,'en']]){
   win.setContentSize(width,height);
   await ev(`localStorage.setItem('growth-lab.v1.one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(lang)},motion:false,music:false,sound:false}));`);
   await load(true);
   for(const route of ['broth','dough','garden','banquet','pickle','cellar']){
    await click('[data-action=new]');
    const menu=await ev(`return {routes:document.querySelectorAll('[data-action=growth-start]').length,fits:document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth+1};`);
    if(menu.routes!==6||!menu.fits)throw Error('Route selector '+JSON.stringify(menu));
    if(route==='broth')await capture(`${width}-${lang}-routes`);
    await click('[data-action=growth-start][data-id='+route+']');await idle();
    await click('#draw');await idle();
    const current=await ev(`const s=JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5'));return {route:s.growth.route,round:s.round,flips:s.flips,cards:s.cards.length,progress:document.querySelector('.inspector .growth-progress')?.textContent,toast:document.querySelector('#toast').textContent,pageFits:document.documentElement.scrollWidth<=innerWidth+1};`);
    if(current.route!==route||current.cards!==20||current.flips!==1||!current.progress||current.toast||!current.pageFits)throw Error(JSON.stringify(current));
    if(!await ev(`const e=document.querySelector('.inspector .growth-progress'),r=e.getBoundingClientRect(),p=e.parentElement,b=p.getBoundingClientRect();return r.width>100&&r.bottom<=b.bottom+1&&p.scrollHeight<=p.clientHeight+1;`))throw Error('Growth inspector clipped '+route);
    await capture(`${width}-${lang}-${route}`);
    await click('[data-action=deck]');if(!await ev(`return document.querySelectorAll('.owned-deck .growth-progress').length===2;`))throw Error('Core progress missing from deck');
    await click('[data-action=close]');await click('[data-action=settings]');await click('[data-action=growth-journal]');
    if(!await ev(`return document.querySelectorAll('.growth-journal article').length===2;`))throw Error('Journal missing cores');
    await click('[data-action=close]');await load(true);await click('[data-action=continue]');await idle();
    if(!await ev(`return JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5')).flips===1;`))throw Error('Reload lost progress');
    await click('header [data-action=home]');
    report.cases.push({width,height,lang,route,passed:true});
   }
  }
  // Exercise a growth trigger through the actual pair controls, then resume it.
  await ev(`const {newRun}=await import('./game/engine.js');const s=newRun(600,{rules:2,growthRoute:'dough'});s.cards[0].growthXP=2;s.cards[1].growthXP=2;s.draw=[1,2,...s.draw.filter(x=>x!==1&&x!==2)];localStorage.setItem('growth-lab.v1.one-more.run.v5',JSON.stringify(s));`);
  await load(true);await click('[data-action=continue]');await click('#draw');await idle();await click('#draw');await idle();
  await click('[data-action=pair]');await click('[data-action=choose]');await idle();
  const grown=await ev(`const s=JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5'));return {levels:s.cards.slice(0,2).map(c=>c.growthLevel),values:[...document.querySelectorAll('.tile[data-kind=sourdough] .tile-top b')].map(e=>e.textContent)};`);
  if(grown.levels.some(v=>v!==1)||grown.values.some(v=>v!=='8'))throw Error('Pair growth '+JSON.stringify(grown));
  await capture('390-en-grown-pair');
  await load(true);await click('[data-action=continue]');await click('[data-action=deck]');await capture('390-en-grown-deck');
  await load(false);await click('[data-action=catalog]');
  const normal=await ev(`return {cards:document.querySelectorAll('.catalog-card').length,labCard:!!document.querySelector('.catalog-card[data-kind=stockpot]'),save:[localStorage.getItem('one-more.run.v5'),localStorage.getItem('one-more.player.v1')]};`);
  if(normal.cards!==80||normal.labCard||JSON.stringify(normal.save)!==JSON.stringify(original))throw Error('Normal game changed '+JSON.stringify(normal));
  report.normalSavePreserved=true;
  if(report.errors.length)throw Error(report.errors.join('; '));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('failure');}
 clearTimeout(timer);fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
