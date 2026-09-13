import {connectSmokeTransport} from './smoke-transport.mjs';
import {SAVE_KEY,PREF_KEY} from '../game/engine.js';
import {mkdir,writeFile} from 'node:fs/promises';
const t=await connectSmokeTransport(9227),out='.artifacts/smoke-one-more-v080';await mkdir(out,{recursive:true});
const results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
async function ev(expression){const r=await t.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function idle(){for(let i=0;i<100;i++){if(await ev('document.querySelector("#app").children.length>0&&document.body.dataset.busy!=="true"&&document.body.dataset.paging!=="true"'))return;await wait(50);}throw Error('busy');}
async function click(sel){const p=await ev(`(()=>{const b=document.querySelector(${JSON.stringify(sel)});if(!b||b.disabled)throw Error('Unavailable '+${JSON.stringify(sel)});b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!b.contains(document.elementFromPoint(x,y)))throw Error('Covered '+${JSON.stringify(sel)});return{x,y}})()`);for(const type of ['mousePressed','mouseReleased'])await t.send('Input.dispatchMouseEvent',{type,...p,button:'left',clickCount:1});await wait(45);await idle();}
async function shot(name){await ev('scrollTo(0,0)');const s=await t.send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/${name}.png`,Buffer.from(s.data,'base64'));}
async function check(name,condition){if(!condition)throw Error(name);results.push(name);}
const state=()=>ev(`JSON.parse(localStorage.getItem('${SAVE_KEY}'))`);
async function audit(name,lang){const a=await ev(`(()=>{const lesson=document.querySelector('.lesson'),game=document.querySelector('main'),r=lesson?.getBoundingClientRect();return {width:document.documentElement.scrollWidth<=innerWidth+1,separate:!r||r.bottom<=game.getBoundingClientRect().top+1,text:document.querySelector('#app').innerText};})()`);await check(name+' no horizontal overflow',a.width);await check(name+' tutorial does not cover gameplay',a.separate);if(lang==='en')await check(name+' English',!/[\u3400-\u9fff]/u.test(a.text));}
try{
 await t.send('Page.enable');await t.send('Runtime.enable');await t.send('Log.enable');
 for(const [width,height,lang] of [[1280,800,'zh'],[390,844,'en']]){
  await t.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});await t.send('Page.navigate',{url:'http://127.0.0.1:8888/'});await wait(150);
  await ev(`for(const k of Object.keys(localStorage))if(k.startsWith('one-more.'))localStorage.removeItem(k);localStorage.setItem('one-more.run.v4','old test data');localStorage.setItem('unrelated-qa','retained')`);
  await t.send('Page.reload',{ignoreCache:true});await wait(180);await idle();await check(lang+' legacy data cleared',await ev("localStorage.getItem('one-more.run.v4')===null&&localStorage.getItem('unrelated-qa')==='retained'"));
  await ev(`localStorage.setItem('${PREF_KEY}',JSON.stringify({lang:'${lang}',sound:false,motion:false,music:true,volume:.2}))`);await t.send('Page.reload',{ignoreCache:true});await wait(180);await idle();
  await check(lang+' test modes removed',await ev('![...document.querySelectorAll("button")].some(b=>/^(practice|trial|trials|new-cards|dice-practice|mixed|classic)$/.test(b.dataset.action))'));
  await shot(lang+'-clean-home');await click('[data-action="new"]');
  for(let i=0;i<3;i++){await audit(lang+' story '+i,lang);if(i===1)await shot(lang+'-stranger');await click('[data-action="story-next"]');}
  await check(lang+' lesson starts',(await state()).lesson===0);await shot(lang+'-tutorial-start');
  for(let i=0;i<3;i++)await click('#draw');
  await check(lang+' fourth draw blocked',await ev('document.querySelector("#draw").disabled'));await click('.tile[data-uid="2"]');await click('[data-action="pair"]');await click('.tile[data-uid="1"]');
  await check(lang+' paired 10 points',await ev('document.querySelector(".table-score strong").textContent==="10"'));
  await click('#draw');await click('.tile[data-uid="15"]');await click('[data-action="use"]');await audit(lang+' lesson bomb',lang);await shot(lang+'-tutorial-bomb');
  await check(lang+' preview teaches real bomb',await ev('!!document.querySelector(".preview-slot.danger")'));
  await t.send('Page.reload',{ignoreCache:true});await wait(160);await click('[data-action="continue"]');await check(lang+' lesson resumes',(await state()).lesson===6);
  await click('#draw');await check(lang+' bomb really ends the run',(await state()).phase==='lost'&&(await state()).reason==='bomb'&&(await state()).lesson===7);await shot(lang+'-tutorial-death');await t.send('Page.reload',{ignoreCache:true});await wait(160);await click('[data-action="continue"]');await click('[data-action="retry"]');await check(lang+' retry is a fresh run',(await state()).lesson===8&&(await state()).bank===0);await click('#draw');await click('#draw');await click('.tile[data-uid="2"]');await click('[data-action="pair"]');await click('.tile[data-uid="1"]');await click('#stop');await check(lang+' bank preserves tutorial score',(await state()).bank===8);await audit(lang+' lesson die',lang);await shot(lang+'-tutorial-die');
  await click('#die-hand');await click('#roll');await click('#accept-dice');await audit(lang+' lesson routes',lang);
  await click('[data-action="route"]');if(await ev('!!document.querySelector(".route-target")'))await click('.route-target');
  await click('[data-action="add"]');await click('#next');await check(lang+' lesson joins table two',(await state()).round===2&&!(await state()).lesson);await check(lang+' completion remembered',await ev("JSON.parse(localStorage.getItem('one-more.player.v1')).tutorialComplete===true"));
  await click('[data-action="settings"]');await check(lang+' music loaded and playing',await ev('(()=>{const a=document.querySelector("#soundtrack");return a.readyState>=2&&!a.paused&&a.duration>100})()'));await click('[data-action="music"]');await check(lang+' music mute works',await ev('document.querySelector("#soundtrack").paused'));await click('[data-action="language"]');await click('[data-action="language"]');await shot(lang+'-settings');await click('[data-action="close"]');
  await click('[data-action="home"]');await click('[data-action="new"]');await check(lang+' later games skip story and tutorial',await ev('!document.querySelector(".lesson,.story-scene")'));await check(lang+' real fresh run',(await state()).bank===0&&(await state()).round===1);
  await ev("localStorage.setItem('one-more.player.v1',JSON.stringify({storySeen:true,storyVersion:2,tutorialComplete:false}))");await t.send('Page.reload',{ignoreCache:true});await wait(160);await click('[data-action="new"]');await click('[data-action="skip-lesson"]');await check(lang+' skip tutorial starts real game',!(await state()).lesson&&await ev('!document.querySelector(".lesson")'));
 }
 console.log('Tutorial, story, cleanup, music:',results.length,'checks passed');
}catch(e){console.error(e);await shot('tutorial-failure');process.exitCode=1;results.push({error:e.message});}
finally{await writeFile(`${out}/tutorial.json`,JSON.stringify(results,null,2));t.close();}
