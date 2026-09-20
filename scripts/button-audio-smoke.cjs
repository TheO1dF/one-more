const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/catalog-audio-v1');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const ev=s=>win.webContents.executeJavaScript(`(async()=>{${s}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const load=()=>win.loadFile(path.join(root,'index.html'));
 const click=async selector=>{const p=await ev(`const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing button');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);for(const type of ['mouseDown','mouseUp'])win.webContents.sendInputEvent({type,...p,button:'left',clickCount:1});await pause(350);};
 try{
  await load();await ev(`localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.preferences.v2',JSON.stringify({sound:true,music:false,motion:false,lang:'en'}));`);await load();
  await ev(`const Native=window.AudioContext;window.audioEvidence={starts:[],contexts:[],peak:0};window.AudioContext=class extends Native{constructor(){super();const ctx=this;this.probe=this.createAnalyser();this.probe.fftSize=256;this.probe.connect(this.destination);audioEvidence.contexts.push(this);const buffer=new Float32Array(256);setInterval(()=>{this.probe.getFloatTimeDomainData(buffer);audioEvidence.peak=Math.max(audioEvidence.peak,...buffer.map(Math.abs));},3);}createOscillator(){const node=super.createOscillator(),start=node.start.bind(node),ctx=this;node.start=(time)=>{audioEvidence.starts.push({time,now:ctx.currentTime,state:ctx.state});start(time)};return node;}createGain(){const node=super.createGain(),connect=node.connect.bind(node),ctx=this;node.connect=dest=>connect(dest===ctx.destination?ctx.probe:dest);return node;}};`);
  await click('[data-action=settings]');
  for(let i=0;i<40;i++){if(await ev('return audioEvidence.peak>0;'))break;await pause(50);}const first=await ev(`return {starts:audioEvidence.starts,peak:audioEvidence.peak,contexts:audioEvidence.contexts.map(x=>x.state),times:audioEvidence.contexts.map(x=>x.currentTime),hidden:document.hidden};`);
  if(first.starts.length!==1||first.peak<=0||first.contexts[0]!=='running')throw Error('First click silent '+JSON.stringify(first));
  await click('[data-action=sound]');const muted=await ev(`return audioEvidence.starts.length;`);
  await click('[data-action=language]');if(await ev(`return audioEvidence.starts.length;`)!==muted)throw Error('Mute not respected');
  await click('[data-action=sound]');if(await ev(`return audioEvidence.starts.length;`)!==muted+1)throw Error('Unmute has no preview');
  await ev(`document.querySelector('[data-action=close]').focus();`);const before=await ev(`return audioEvidence.starts.length;`);
  win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled',{enabled:true});await win.webContents.debugger.sendCommand('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await win.webContents.debugger.sendCommand('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(350);
  if(await ev(`return audioEvidence.starts.length;`)!==before+1)throw Error('Keyboard click silent '+JSON.stringify(await ev(`return {active:document.activeElement.outerHTML,starts:audioEvidence.starts,dialog:document.querySelector('dialog').open};`)));
  await ev(`document.querySelector('[data-action=settings]').disabled=true;`);await click('[data-action=settings]');if(await ev(`return audioEvidence.starts.length;`)!==before+1)throw Error('Disabled control sounds');
  const waveform=await ev(`const Offline=window.OfflineAudioContext;let ctx;window.AudioContext=function(){ctx=new Offline(1,12000,48000);ctx.resume=()=>Promise.resolve();return ctx;};const {playSound}=await import('./game/sound.js?offline');playSound('click');const rendered=await ctx.startRendering();const data=rendered.getChannelData(0);return {peak:Math.max(...data.map(Math.abs)),firstSample:data.findIndex(x=>Math.abs(x)>.001)};`);if(waveform.peak<=0||waveform.firstSample>480)throw Error('Click waveform silent or late');const report={passed:true,waveform,firstClick:first,mute:true,unmutePreview:true,keyboard:true,disabledSilent:true};fs.writeFileSync(path.join(out,'audio-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});






