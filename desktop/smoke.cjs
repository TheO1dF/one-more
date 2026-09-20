const fs=require('node:fs');
const path=require('node:path');
exports.run=async({win,app,resize,reportPath})=>{
 const checks=[],errors=[];const check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error(name);};
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
 const ev=code=>win.webContents.executeJavaScript(code);
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 await pause(100);
 check('Local offline menu renders',await ev('!!document.querySelector("#new")'));
 check('Sandbox has no Node globals',await ev('typeof require==="undefined"&&typeof process==="undefined"'));
 check('Narrow desktop bridge available',await ev('Object.keys(window.oneMoreDesktop).sort().join(",")==="fullscreen,quit,resolution"'));
 const persistence=await ev('localStorage.getItem("one-more.desktop-smoke")');
 await ev('localStorage.setItem("one-more.desktop-smoke","retained")');
 win.webContents.reload();await new Promise(r=>win.webContents.once('did-finish-load',r));
 check('Storage survives reload',await ev('localStorage.getItem("one-more.desktop-smoke")==="retained"'));
 for(const resolution of ['1280x720','1600x900','1920x1080','2560x1440','3840x2160']){resize(resolution);await pause(60);check('Resolution '+resolution,await ev('document.documentElement.scrollWidth<=innerWidth+1&&!!document.querySelector("#new")'));}
 await ev('window.oneMoreDesktop.fullscreen()');await pause(150);check('Native fullscreen enabled',win.isFullScreen());await ev('window.oneMoreDesktop.fullscreen()');
 for(const lang of ['zh','en']){
  await ev(`(async()=>{const {PREF_KEY}=await import('./game/engine.js');localStorage.setItem(PREF_KEY,JSON.stringify({lang:'${lang}',music:false,motion:false,fps:30}));})()`);win.webContents.reload();await new Promise(r=>win.webContents.once('did-finish-load',r));
  check(lang+' localization',await ev(`document.documentElement.lang==='${lang==='zh'?'zh-CN':'en'}'`));
 }
 const frames=await ev(`(async()=>{const m=await import('./game/frame-clock.js');let report=[];for(const fps of [30,60,120]){m.setFrameRate(fps);let n=0;await new Promise(resolve=>{const begin=performance.now();const loop=now=>{n++;if(now-begin>=600)resolve();else m.requestGameFrame(loop);};m.requestGameFrame(loop);});report.push({setting:fps,measured:n/.6});}return report;})()`);
 check('Frame pacing 30/60/120 selected',frames[0].measured<=36&&frames[1].measured<=70&&frames[2].measured<=135);
 check('Music file decodes',await ev('(async()=>{const response=await fetch("./game/audio/the-empty-glass.wav");const context=new AudioContext();const buffer=await context.decodeAudioData(await response.arrayBuffer());await context.close();return buffer.duration>1;})()'));
 resize('1600x900');await pause(80);fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(path.join(path.dirname(reportPath),'pc-menu.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(reportPath,JSON.stringify({passed:true,packaged:app.isPackaged,version:app.getVersion(),runtime:process.versions.electron,restartPersistence:persistence==='retained',checks,frames,errors},null,2));
};
