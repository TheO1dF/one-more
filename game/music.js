const player=new Audio(new URL('./audio/the-empty-glass.wav',import.meta.url));
player.loop=true;player.preload='none';
player.id='soundtrack';player.hidden=true;document.body.append(player);
let unlocked=false,enabled=true,volume=.38;
function sync(){player.volume=volume;if(unlocked&&enabled&&!document.hidden)player.play().catch(()=>{});else player.pause();}
document.addEventListener('visibilitychange',sync);
export const music={
 configure(prefs){enabled=prefs.music!==false;volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(1,prefs.volume)):.38;sync();},
 unlock(){if(!unlocked){unlocked=true;sync();}}
};
