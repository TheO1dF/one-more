// Isolated Electron renderer audit; never reads or modifies a player's profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.artifacts/english-ui-v0120');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'profile'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,useContentSize:true,width:1280,height:720,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 const report={passed:false,cases:[],errors:[]};
 const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 const timer=setTimeout(()=>{report.failure='Renderer audit timeout';save();app.exit(1);},150000);
 win.webContents.on('console-message',e=>{if(e.level==='error')report.errors.push(e.message);});
 const ev=code=>win.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const reload=()=>win.loadFile(path.join(root,'index.html'));
 let current;
 const audit=async(name,capture=false)=>{
  await ev('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');
  const result=await ev(`
   const issues=[],dialog=document.querySelector('dialog[open]');
   if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page',width:document.documentElement.scrollWidth});
   if(dialog&&dialog.scrollWidth>dialog.clientWidth+1)issues.push({type:'dialog',width:dialog.scrollWidth,container:dialog.clientWidth});
   const scope=dialog||document.querySelector('#app');
   const overlaps=(a,b)=>{if(!a||!b)return false;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width&&y.width&&Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1;};
   if(!dialog&&overlaps(document.querySelector('header .brand'),document.querySelector('header nav')))issues.push({type:'header-overlap'});
   if(!dialog&&overlaps(document.querySelector('.inspector>h2'),document.querySelector('.inspector>.eyebrow')))issues.push({type:'inspector-heading-overlap'});
   for(const e of scope.querySelectorAll('.choice-list>.choice')){const text=e.querySelector('span');if(!text)continue;const a=e.getBoundingClientRect(),b=text.getBoundingClientRect();if(b.top<a.top-1||b.bottom>a.bottom+1)issues.push({type:'choice-text-height',text:text.textContent});}
   for(const el of scope.querySelectorAll('button,h1,h2,h3,p,label,small,strong,.deck-count')){
    if(el.closest('svg,.tile,.menu-card,.preview-slot,.card-back,.die-hand,.tray-die-button,.card-field,.choice-list,.relic-rack'))continue;
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    if(!r.width||!r.height||cs.display==='none')continue;
    if(el.scrollWidth>el.clientWidth+2&&!['auto','scroll'].includes(cs.overflowX)&&cs.textOverflow!=='ellipsis')issues.push({type:'text-width',tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,100),width:el.scrollWidth,container:el.clientWidth});
   }
   const counter=dialog?null:document.querySelector('.deck-count');
   if(counter){const a=counter.getBoundingClientRect();for(const e of counter.children){const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();if(r.left<a.left-1||r.right>a.right+1||r.top<a.top-1||r.bottom>a.bottom+1)issues.push({type:'counter',text:e.textContent,box:{x:a.x,y:a.y,w:a.width,h:a.height},textBox:{x:r.x,y:r.y,w:r.width,h:r.height}});}}
   return {issues,title:dialog?.querySelector('h2')?.textContent||document.querySelector('main')?.className};`);
  current.screens.push({name,...result});
  if(capture)fs.writeFileSync(path.join(out,`${current.width}x${current.height}-${name}.png`),(await win.webContents.capturePage()).toPNG());
 };
 const click=async(selector)=>ev(`const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.click();`);
 const fixture=async(code,continuing=true)=>{
  await ev(`const {newRun,card,addCard,SAVE_KEY}=await import('./game/engine.js');const {CARDS,RELICS,PACKAGES}=await import('./game/cards.js');const {practiceRun}=await import('./test/fixtures.js');const s=practiceRun();s.practice=false;s.maxRounds=10;${code};localStorage.setItem(SAVE_KEY,JSON.stringify(s));`);
  await reload();if(continuing)await click('[data-action=continue]');
 };
 try{
  await reload();
  for(const size of [[1280,720],[1920,1080],[768,1024],[360,800],[390,844],[844,390]]){
   current={width:size[0],height:size[1],screens:[]};report.cases.push(current);win.setContentSize(...size);
   await ev(`localStorage.clear();localStorage.setItem('one-more.clean.v060','1');localStorage.setItem('one-more.player.v1',JSON.stringify({storySeen:true,storyVersion:3,tutorialComplete:true,tutorialVersion:3}));localStorage.setItem('one-more.preferences.v2',JSON.stringify({lang:'en',motion:false,music:false,sound:false}));`);
   await reload();await audit('menu');
   for(const action of ['settings','run-setup','achievements','catalog']){
    await click('[data-action='+action+']');await audit(action,true);
    if(action==='achievements'){await ev(`const d=document.querySelector('dialog');d.scrollTop=d.scrollHeight;`);await audit('card-backs',true);}
    if(action==='catalog'){await click('[data-action=relic-catalog]');await audit('pledged-collection',true);}
    await click('[data-action=close]');
   }
   await fixture(`s.known=s.draw.slice(0,3);s.relics=Object.keys(RELICS).slice(0,6);s.freePayments=2;s.boon='meal';`);
   await audit('table',true);
   for(const count of [0,9,19,99,128,999]){
    await ev(`document.querySelector('.deck-count b').textContent=${JSON.stringify(String(count))};`);await audit('counter-'+count);
   }
   for(const action of ['deck','preview','discard','log']){
    await click('[data-action='+action+']');await audit(action,true);await click('[data-action=close]');
   }
   await click('.tile[data-uid="4"]');await audit('food-inspector',true);
   await click('.tile[data-uid="3"]');await audit('tool-inspector',true);
   await fixture(`card(s,3).kind=card(s,3).original='choppingboard';card(s,4).enchantment='boiled';`);
   await click('.tile[data-uid="3"]');await audit('long-name-inspector',true);
   await click('.tile[data-uid="4"]');await audit('enchanted-inspector',true);
   await fixture(`s.pending={type:'discover',pool:'tool',offers:['sorter','torch','sifter']};`);await audit('discovery',true);
   await fixture(`s.phase='stakes';s.round=4;s.dice={count:2,rolls:[17],result:{faces:[17,14],total:31,locked:false}};`);await audit('two-dice-reward',true);
   await fixture(`s.phase='stakes';s.dice={count:1,rolls:[],result:null};`);await audit('die-hand',true);
   await fixture(`s.phase='route';s.routeOffers=['boiled','prune'];s.bank=100;`);await audit('route',true);
   await click('[data-action=route][data-id=boiled]');await audit('enchant-choice',true);
   await fixture(`s.phase='draft';s.round=3;s.offers=PACKAGES.slice(-3).map(p=>p.id);s.added=false;s.relicOffer=[];`);await audit('packages',true);
   await fixture(`s.phase='draft';s.round=3;s.added=true;s.relicPicked=false;s.relicOffer=Object.keys(RELICS).slice(-3);`);await audit('pledged-choice',true);
   await fixture(`s.phase='lost';s.reason='bomb';s.bank=126;s.target=170;`,false);
   // Terminal saves return to the menu; render the result through the same view entry point.
   await ev(`const {renderView}=await import('./game/view.js');const s=JSON.parse(localStorage.getItem('one-more.run.v5'));document.querySelector('#app').innerHTML=renderView({s,screen:'game',prefs:{lang:'en'},busy:false});`);await audit('result',true);
   save();
  }
  report.passed=!report.errors.length&&report.cases.every(c=>c.screens.every(s=>!s.issues.length));
 }catch(e){report.failure=e.stack;}
 clearTimeout(timer);save();console.log(JSON.stringify({passed:report.passed,screens:report.cases.reduce((n,c)=>n+c.screens.length,0),issues:report.cases.flatMap(c=>c.screens.filter(s=>s.issues.length).map(s=>({size:c.width+'x'+c.height,...s}))),errors:report.errors,failure:report.failure}));app.exit(report.passed?0:1);
});
