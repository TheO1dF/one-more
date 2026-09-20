const {app,BrowserWindow,ipcMain,screen,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const testReport=process.argv.find(a=>a.startsWith('--smoke-report='))?.slice(15);
if(testReport)app.setPath('userData',path.resolve(path.dirname(testReport),'test-profile'));
app.setName('One More');
const settingsPath=()=>path.join(app.getPath('userData'),'desktop-settings.json');
let settings={resolution:'1600x900',fullscreen:false};
try{settings={...settings,...JSON.parse(fs.readFileSync(settingsPath(),'utf8'))};}catch{}
let win;
const sizes=['1280x720','1600x900','1920x1080','2560x1440','3840x2160'];
function saveSettings(){fs.mkdirSync(app.getPath('userData'),{recursive:true});fs.writeFileSync(settingsPath(),JSON.stringify(settings));}
function resize(value){
 if(!sizes.includes(value))throw Error('Invalid resolution');
 const [w,h]=value.split('x').map(Number),display=screen.getDisplayMatching(win.getBounds()).workAreaSize;
 const scale=Math.min(1,display.width/w,(display.height-50)/h);
 if(win.isFullScreen())win.setFullScreen(false);
 win.setContentSize(Math.round(w*scale),Math.round(h*scale));win.center();settings.resolution=value;settings.fullscreen=false;saveSettings();return value;
}
function authorized(event){if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Invalid sender');}
app.whenReady().then(async()=>{
 Menu.setApplicationMenu(null);
 win=new BrowserWindow({width:1600,height:940,minWidth:960,minHeight:640,show:false,title:'One More?',backgroundColor:'#161936',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',e=>e.preventDefault());
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 ipcMain.handle('one-more:resolution',(e,value)=>{authorized(e);return resize(value);});
 ipcMain.handle('one-more:fullscreen',e=>{authorized(e);settings.fullscreen=!win.isFullScreen();win.setFullScreen(settings.fullscreen);saveSettings();return settings.fullscreen;});
 ipcMain.handle('one-more:quit',e=>{authorized(e);app.quit();});
 win.webContents.on('before-input-event',(e,input)=>{if(input.type==='keyDown'&&input.key==='F11'){e.preventDefault();settings.fullscreen=!win.isFullScreen();win.setFullScreen(settings.fullscreen);saveSettings();}});
 const fullscreen=settings.fullscreen;resize(sizes.includes(settings.resolution)?settings.resolution:'1600x900');if(fullscreen){win.setFullScreen(true);settings.fullscreen=true;}
 await win.loadFile(path.join(__dirname,'../dist/index.html'));
 if(testReport){try{await require('./smoke.cjs').run({win,app,resize,reportPath:path.resolve(testReport)});app.exit(0);}catch(e){fs.writeFileSync(testReport,JSON.stringify({passed:false,error:String(e),stack:e.stack},null,2));app.exit(1);}}
 else win.show();
});
app.on('window-all-closed',()=>app.quit());
