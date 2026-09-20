const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/staple-v2');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'profile'));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={cases:[],errors:[]};win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const load=()=>win.loadFile(path.join(root,'index.html'),{query:{lab:'growth'}});
 const click=sel=>ev(`const b=document.querySelector(${JSON.stringify(sel)});if(!b||b.disabled)throw Error('Unavailable '+${JSON.stringify(sel)});b.click();`);
 const wait=async expression=>{for(let i=0;i<500;i++){if(await ev('return '+expression+';'))return;await pause(12);}throw Error('Timeout '+expression)};
 const idle=()=>wait("document.body.dataset.busy==='false'");
 const capture=async name=>{await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 const saved=()=>ev(`return JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5'));`);
 const watchdog=setTimeout(()=>{console.log('UI test timed out');app.exit(1)},60000);
 try{
  await load();
  for(const cfg of [{w:1280,h:800,lang:'zh',motion:true},{w:390,h:844,lang:'en',motion:true},{w:1280,h:720,lang:'en',motion:false},{w:390,h:844,lang:'zh',motion:true,skip:true},{w:390,h:844,lang:'en',motion:true,size:2}]){
   const label=cfg.w+'-'+cfg.lang+(cfg.skip?'-skip':cfg.motion?'':'-reduced')+(cfg.size===2?'-two':'');win.setContentSize(cfg.w,cfg.h);
   await ev(`const {newRun}=await import('./game/engine.js');const s=newRun(231,{rules:2,growthRoute:'broth'});s.bank=32;s.phase='route';s.routeOffers=['staple','tea'];localStorage.setItem('growth-lab.v1.one-more.run.v5',JSON.stringify(s));localStorage.setItem('growth-lab.v1.one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(cfg.lang)},motion:${cfg.motion},music:false,sound:false}));`);
   await load();await click('[data-action=continue]');await capture(label+'-event');
   await click('[data-action=route][data-id=staple]');
   await wait("!!document.querySelector('.staple-stage')");
   if(cfg.skip)await click('[data-action=skip-animation]');else if(cfg.motion){await wait("document.querySelector('.staple-stage')?.dataset.stage==='press'");await capture(label+'-press');await wait("document.querySelector('.staple-stage')?.dataset.stage==='stapled'");await capture(label+'-stapled');}
   await idle();const bound=await saved();if(bound.bank!==28||bound.staples.length!==1||bound.staples[0].uids.length!==3)throw Error('Binding failed');
   const uids=bound.staples[0].uids;await capture(label+'-receipt');
   if(!await ev(`return document.documentElement.scrollWidth<=innerWidth+1&&document.querySelectorAll('.staple-receipt .packet-card').length===3;`))throw Error('Receipt layout');
   const geometry=await ev(`const stack=document.querySelector('.stapled-stack'),r=stack.getBoundingClientRect(),pin=stack.querySelector('.staple-pin').getBoundingClientRect();return {anchor:[r.x+r.width*.18,r.y+r.height*.1],pin:[pin.x+pin.width/2,pin.y+pin.height/2],cards:[...stack.querySelectorAll('.packet-card')].map(c=>{const s=getComputedStyle(c);return {origin:s.transformOrigin.split(' ').map(parseFloat),left:c.offsetLeft,top:c.offsetTop,w:c.offsetWidth,h:c.offsetHeight,matrix:new DOMMatrix(s.transform).toString()}})};`);
   if(geometry.cards.some(c=>Math.abs(c.origin[0]-c.w*.18)>.1||Math.abs(c.origin[1]-c.h*.1)>.1||c.left||c.top)||Math.hypot(...geometry.anchor.map((v,i)=>v-geometry.pin[i]))>.6)throw Error('Cards do not share the staple pivot: '+JSON.stringify(geometry));
   await load();await click('[data-action=continue]');if(JSON.stringify((await saved()).staples)!==JSON.stringify(bound.staples))throw Error('Reload rerolled packet');
   await click('[data-action=add]');await idle();await click('[data-action=next]');await idle();
   if(cfg.size===2)await ev(`const s=JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5'));s.staples[0].uids.pop();localStorage.setItem('growth-lab.v1.one-more.run.v5',JSON.stringify(s));`);
   await ev(`const s=JSON.parse(localStorage.getItem('growth-lab.v1.one-more.run.v5')),ids=s.staples[0].uids;s.draw=[...ids,...s.draw.filter(uid=>!ids.includes(uid))];localStorage.setItem('growth-lab.v1.one-more.run.v5',JSON.stringify(s));`);
   await load();await click('[data-action=continue]');await click('#draw');await wait("!!document.querySelector('.unstaple-stage')");
   if(cfg.skip)await click('[data-action=skip-animation]');else if(cfg.motion){await wait("document.querySelector('.unstaple-stage')?.dataset.stage==='unpin'");await capture(label+'-unpin');await wait("document.querySelector('.unstaple-stage')?.dataset.stage==='land'");await capture(label+'-spread');}
   await idle();await pause(180);const drawn=await saved();
   const expected=cfg.size||3;if(drawn.staples.length||uids.slice(0,expected).some(uid=>!drawn.table.includes(uid))||drawn.flips!==expected)throw Error('Packet not drawn');
   if(!await ev(`return !document.querySelector('#performance').children.length&&[...document.querySelectorAll('.tile')].every(t=>getComputedStyle(t).visibility!=='hidden')&&document.documentElement.scrollWidth<=innerWidth+1;`))throw Error('Hidden card or overlay after opening');
   await capture(label+'-table');
   await click('[data-action=deck]');await click('[data-action=close]');
   await load();await click('[data-action=continue]');if((await saved()).flips!==expected)throw Error('Draw not persisted');
   report.cases.push({...cfg,packet:uids.slice(0,expected),geometry,passed:true});
  }
  if(report.errors.length)throw Error(report.errors.join(';'));report.passed=true;
 }catch(e){report.failure=e.stack;await capture('failure');}
 clearTimeout(watchdog);fs.writeFileSync(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.passed?0:1);
});
