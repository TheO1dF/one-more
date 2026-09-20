const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/dealer-events-v2');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'ui-profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={cases:[],errors:[]},ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const load=()=>win.loadFile(path.join(root,'index.html'),{query:{lab:'growth'}});
 const click=sel=>ev(`const b=document.querySelector(${JSON.stringify(sel)});if(!b||b.disabled)throw Error('Unavailable '+${JSON.stringify(sel)});b.click();`);
 const wait=async exp=>{for(let i=0;i<500;i++){if(await ev('return '+exp))return;await pause(10);}throw Error('Timeout '+exp)};
 const idle=()=>wait("document.body.dataset.busy==='false'");
 const capture=async name=>{await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 const saved=()=>ev(`return JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5'));`);
 const watchdog=setTimeout(()=>{console.error('Timeout');app.exit(1)},120000);
 try{
  await load();
  for(const cfg of [{w:1280,h:800,lang:'zh',motion:true},{w:390,h:844,lang:'en',motion:false}]){
   win.setContentSize(cfg.w,cfg.h);
   for(const id of ['trade','pawn','wager','prune','levy','pressure','cap','foodLoss','toolLoss','raw','tea']){
    const direct=['trade','pawn','wager','prune'].includes(id),source=direct?id:'mystery',label=cfg.w+'-'+id;
    await ev(`const {newRun,act}=await import('./game/engine.js');let s;for(let seed=1;seed<3000;seed++){s=newRun(seed,{rules:2,growthRoute:'broth'});Object.assign(s,{bank:30,target:40,phase:'route',routeOffers:[${JSON.stringify(source)},'tea']});if(${direct}||act(s,{type:'chooseRoute',id:'mystery'}).encounter.id===${JSON.stringify(id)})break;}localStorage.setItem('growth-lab.v1.one-more.run.v5',JSON.stringify(s));localStorage.setItem('growth-lab.v1.one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(cfg.lang)},motion:${cfg.motion},music:false,sound:false}));`);
    await load();await click('[data-action=continue]');await click(`[data-action=route][data-id=${source}]`);
    if(['foodLoss','toolLoss'].includes(id)&&cfg.motion){await wait("document.querySelector('.dealer-stage')?.dataset.stage==='peel'");await capture(label+'-tear');}
    await idle();
    if(id==='prune'){await click('[data-action=choose][data-index="0"]');if(cfg.motion){await wait("document.querySelector('.dealer-stage')?.dataset.stage==='peel'");await capture(label+'-tear');}await idle();}
    else{
     const before=await saved();await load();await click('[data-action=continue]');const restored=await saved();if(JSON.stringify(before)!==JSON.stringify(restored))throw Error('Reload changed '+id);
     await capture(label+'-offer');
     if(!await ev(`return document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('[data-action=event-confirm]');`))throw Error('Encounter layout '+label);
     if(id==='trade'){
      await click('[data-role=kind]');await click('[data-role=food]');const uid=await ev(`return document.querySelectorAll('[data-role=food]')[1].dataset.uid`);await click(`[data-role=food][data-uid="${uid}"]`);
      if(!await ev(`return document.querySelectorAll('[data-role=food][aria-pressed=true]').length===2`))throw Error('Food selection');
     }else if(id==='pawn')await click('[data-role=relic]');else if(id==='raw')await click('[data-role=target]');
     await click('[data-action=event-confirm]');
     if(id==='trade'&&cfg.motion){await wait("document.querySelector('.dealer-stage')?.dataset.stage==='collect'");await capture(label+'-collect');}
     if(id==='pawn'&&cfg.motion){await wait("document.querySelector('.dealer-stage')?.dataset.stage==='appraise'");await capture(label+'-appraise');}
     await idle();
    }
    let s=await saved();if(s.phase!=='draft')throw Error('Not in draft '+id);await capture(label+'-receipt');
    await click('[data-action=add]');await idle();s=await saved();if(s.relicOffer.length)await click('[data-action=chooseRelic]');await idle();await click('[data-action=next]');await idle();
    s=await saved();if(s.phase!=='play'||s.round!==2)throw Error('Next table blocked '+id);
    if(['wager','pressure','cap'].includes(id)){if(!await ev(`return !!document.querySelector('.condition-banner');`))throw Error('Missing condition');await capture(label+'-table');}
    if(id==='wager'){
     await ev(`const key='growth-lab.v1.one-more.run.v5',s=JSON.parse(localStorage.getItem(key));s.bank=78;s.draw=[1,...s.draw.filter(uid=>uid!==1)];localStorage.setItem(key,JSON.stringify(s));`);await load();await click('[data-action=continue]');await click('#draw');await idle();await click('#stop');await idle();s=await saved();if(!s.wagerPrize)throw Error('Missing wager prize');
    }
    if(!await ev(`return !document.querySelector('#performance').children.length&&document.documentElement.scrollWidth<=innerWidth+1;`))throw Error('Overlay or overflow '+label);
    report.cases.push({id,...cfg,passed:true});
   }
  }
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('failure');}
 clearTimeout(watchdog);fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
