import {tutorialRun} from '../game/tutorial.js';
import {writeFile,mkdir} from 'node:fs/promises';
export async function runTutorialSmoke({send,root,width=390,height=844,lang='en'}){
 const out=root+'/.artifacts/smoke-one-more-v0110';await mkdir(out,{recursive:true});const checks=[],steps=new Set();
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 await send('Emulation.setDeviceMetricsOverride',{width,height});
 await ev(`localStorage.setItem('one-more.run.v5',${JSON.stringify(JSON.stringify(tutorialRun(7711)))});localStorage.setItem('one-more.preferences.v2',JSON.stringify({lang:${JSON.stringify(lang)},motion:false,sound:false,music:false}));`);
 await send('Page.reload');await wait(90);
 await ev("document.querySelector('[data-action=continue]').click()");
 for(let i=0;i<50;i++){
  for(let j=0;j<120;j++){if(await ev("document.body.dataset.busy!=='true'"))break;await wait(20);}
  const step=await ev("JSON.parse(localStorage.getItem('one-more.run.v5')).lesson");if(step==null)break;steps.add(step);
  await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const target=await ev(`(()=>{const g=document.querySelector('.tutorial-guide'),b=document.querySelector('.lesson-target');if(!g||!b)throw Error('Missing guide at '+${step});const r=b.getBoundingClientRect(),x=Math.max(1,Math.min(innerWidth-1,r.x+r.width/2)),y=Math.max(1,Math.min(innerHeight-1,r.y+r.height/2));return {action:b.dataset.action,id:b.id,x,y,enabled:!b.disabled,visible:r.top>=0&&r.bottom<=innerHeight,clear:b.contains(document.elementFromPoint(x,y)),step:${step}}})()`);
  checks.push(target);if(!target.enabled||!target.visible||!target.clear)throw Error('Guide target blocked: '+JSON.stringify(target));
  if(step===13){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(out+`/tutorial-shaker-${width}.png`,Buffer.from(shot.data,'base64'));}
  for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:target.x,y:target.y,button:'left',clickCount:1});await wait(90);
 }
 const result=await ev("JSON.parse(localStorage.getItem('one-more.run.v5'))");
 if(steps.size!==20||result.lesson!=null||result.round!==2)throw Error('Tutorial did not complete: '+JSON.stringify({steps:[...steps],round:result.round,lesson:result.lesson}));
 const report={width,height,lang,steps:[...steps],checks,round:result.round,phase:result.phase};await writeFile(out+`/tutorial-${width}-${lang}.json`,JSON.stringify(report,null,2));return report;
}
