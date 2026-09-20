const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('oneMoreDesktop',Object.freeze({
 resolution:value=>ipcRenderer.invoke('one-more:resolution',value),
 fullscreen:()=>ipcRenderer.invoke('one-more:fullscreen'),
 quit:()=>ipcRenderer.invoke('one-more:quit'),
}));
