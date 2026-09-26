export function interfaceScale(width,height,preference='auto'){
 if(width<=950||height<=500)return 1;
 const fit=Math.max(1,Math.min(2,width/1280,height/720));
 const wanted=preference==='auto'?Math.min(width/1600,height/900):Number(preference);
 return Math.max(1,Math.min(fit,Number.isFinite(wanted)?wanted:1));
}
export function applyUIScale(preference='auto'){
 const n=interfaceScale(innerWidth,innerHeight,preference);
 document.documentElement.style.setProperty('--ui-scale',n);
 return n;
}
