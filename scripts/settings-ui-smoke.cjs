const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/settings-tutorial-v0120');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'settings-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,useContentSize:true,width:1280,height:720,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={passed:false,cases:[],errors:[]};
 const timer=setTimeout(()=>{console.log('Settings check timeout');app.exit(1);},60000);
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`);
 const reload=()=>win.loadFile(path.join(root,'index.html'));
 const click=selector=>ev(`const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('Unavailable control '+${JSON.stringify(selector)});b.click();`);
 try{
  await reload();
  for(const [width,height,lang,desktop] of [[1280,720,'zh',false],[1280,720,'en',true],[390,844,'zh',false],[360,800,'en',false],[844,390,'en',false]]){
   win.setContentSize(width,height);
   await ev(`localStorage.clear();localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(lang)},motion:false,music:false,sound:false}));`);
   await reload();
   if(desktop)await ev(`window.oneMoreDesktop={resolution:async v=>v,fullscreen:()=>{},quit:()=>{}};`);
   await click('[data-action=settings]');
   for(const action of ['sound','motion','music']){
    await click('dialog [data-action='+action+']');
    if(!await ev(`return document.querySelector('dialog [data-action=${action}]').getAttribute('aria-pressed')==='true';`))throw Error('Stale toggle '+action);
    await click('dialog [data-action='+action+']');
   }
   await ev(`const fps=document.querySelector('#frame-rate');fps.value='120';fps.dispatchEvent(new Event('change',{bubbles:true}));`);
   const checked=await ev(`const d=document.querySelector('dialog'),groups=[...d.querySelectorAll('.settings-grid')],issues=[];
    for(const g of groups){const controls=[...g.children].filter(e=>!e.classList.contains('music-volume'));
     for(let i=0;i<controls.length;i++){const e=controls[i],r=e.getBoundingClientRect();if(e.scrollWidth>e.clientWidth+1)issues.push('overflow '+e.textContent);if(i%2===1){const a=controls[i-1].getBoundingClientRect();if(Math.abs(a.y-r.y)>1||Math.abs(a.height-r.height)>1||Math.abs(a.width-r.width)>1)issues.push('misaligned row');}}
    }
    const range=d.querySelector('.music-volume'),r=range.getBoundingClientRect(),input=range.querySelector('input').getBoundingClientRect();
    if(input.right>r.right+1||input.left<r.left)issues.push('volume overflow');
    if(d.scrollWidth>d.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1)issues.push('dialog overflow');
    return {issues,sections:groups.length,fps:JSON.parse(localStorage.getItem('one-more.preferences.v2')).fps};`);
   if(checked.issues.length||checked.sections!==3||checked.fps!==120)throw Error(JSON.stringify({width,height,lang,...checked}));
   await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
   fs.writeFileSync(path.join(out,`${width}x${height}-${lang}${desktop?'-pc':''}-settings.png`),(await win.webContents.capturePage()).toPNG());
   report.cases.push({width,height,lang,desktop,passed:true});
  }
  if(report.errors.length)throw Error(report.errors.join('; '));report.passed=true;
 }catch(e){report.failure=e.stack;}
 clearTimeout(timer);fs.writeFileSync(path.join(out,'settings-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
