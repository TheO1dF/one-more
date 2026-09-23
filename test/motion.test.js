import test from 'node:test';
import assert from 'node:assert/strict';
import {reducedMotion} from '../game/motion.js';
import {animateAtRate,setFrameRate} from '../game/frame-clock.js';

function systemMotion(t,matches) {
  const old=Object.getOwnPropertyDescriptor(globalThis,'matchMedia'),query={matches};
  globalThis.matchMedia=()=>query;
  t.after(()=>{if(old)Object.defineProperty(globalThis,'matchMedia',old);else delete globalThis.matchMedia;});
  return query;
}

test('full game animations override a reduced-motion system preference',t=>{
  systemMotion(t,true);
  assert.equal(reducedMotion('full'),false);
  assert.equal(reducedMotion(true),false);
});

test('the game can still disable motion even when the system permits it',t=>{
  systemMotion(t,false);
  assert.equal(reducedMotion('reduced'),true);
  assert.equal(reducedMotion(false),true);
});

test('views without a game preference follow the system preference',t=>{
  const system=systemMotion(t,true);
  assert.equal(reducedMotion(),true);
  system.matches=false;
  assert.equal(reducedMotion(),false);
});

test('changing the game setting updates the shared motion policy immediately',t=>{
  systemMotion(t,true);
  const old=Object.getOwnPropertyDescriptor(globalThis,'document');
  globalThis.document={documentElement:{dataset:{motion:'full'}}};
  t.after(()=>{if(old)Object.defineProperty(globalThis,'document',old);else delete globalThis.document;});
  assert.equal(reducedMotion(),false);
  document.documentElement.dataset.motion='reduced';
  assert.equal(reducedMotion(),true);
  document.documentElement.dataset.motion='full';
  assert.equal(reducedMotion(),false);
});

test('30, 60 and 120 FPS preserve real animation duration and delay',async t=>{
  const originalRequest=globalThis.requestAnimationFrame,originalCancel=globalThis.cancelAnimationFrame;
  const pending=new Map();let next=0,clock=0;
  globalThis.requestAnimationFrame=fn=>{pending.set(++next,fn);return next;};
  globalThis.cancelAnimationFrame=id=>pending.delete(id);
  t.mock.method(performance,'now',()=>clock);
  try {
    for(const fps of [30,60,120]) {
      setFrameRate(fps);
      let finish,endedAt;
      const animation={effect:{getComputedTiming:()=>({endTime:700})},pause(){},cancel(){},finish(){endedAt=clock;finish();},finished:new Promise(resolve=>finish=resolve)};
      const start=clock;
      animateAtRate({animate:()=>animation},[],{duration:600,delay:100});
      for(let elapsed=0;elapsed<800&&endedAt===undefined;elapsed+=5){
        clock=start+elapsed;
        const frames=[...pending.values()];pending.clear();frames.forEach(fn=>fn(clock));
      }
      await animation.finished;
      assert.ok(endedAt-start>=700,`${fps} FPS must not speed up the animation`);
      assert.ok(endedAt-start<=740,`${fps} FPS must finish within one frame of its duration`);
      clock+=1000;
    }
  } finally {
    globalThis.requestAnimationFrame=originalRequest;globalThis.cancelAnimationFrame=originalCancel;setFrameRate(60);
  }
});
