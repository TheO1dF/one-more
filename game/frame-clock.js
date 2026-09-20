let fps=60,last=0,native=0,next=1;
const queue=new Map();
export const frameRate=()=>fps;
export function setFrameRate(value){fps=[30,60,120].includes(Number(value))?Number(value):60;if(typeof document!=='undefined')document.documentElement.style.setProperty('--animation-fps',fps);}
function tick(now){
 native=0;
 if(now-last>=1000/fps-.5){last=now;const callbacks=[...queue.values()];queue.clear();for(const fn of callbacks)fn(now);}
 if(queue.size&&!native)native=requestAnimationFrame(tick);
}
export function requestGameFrame(callback){const id=next++;queue.set(id,callback);if(!native)native=requestAnimationFrame(tick);return id;}
export function cancelGameFrame(id){queue.delete(id);if(!queue.size&&native){cancelAnimationFrame(native);native=0;}}
export function animateAtRate(element,keyframes,options){
 const animation=element.animate(keyframes,options),start=performance.now();
 const timing=animation.effect.getComputedTiming();animation.pause();
 let pending=0;
 const step=now=>{const elapsed=now-start;if(elapsed>=timing.endTime){animation.finish();return;}animation.currentTime=elapsed;pending=requestGameFrame(step);};
 pending=requestGameFrame(step);
 const cancel=animation.cancel.bind(animation);animation.cancel=()=>{cancelGameFrame(pending);cancel();};
 animation.finished.then(()=>cancelGameFrame(pending),()=>cancelGameFrame(pending));return animation;
}
