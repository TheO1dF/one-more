import test from 'node:test';
import assert from 'node:assert/strict';
import {reelPlan,reelOffset,REEL_CELL,REEL_TIMES} from '../game/slot-art.js';
import {SKIP_REWARDS} from '../game/momentum.js';
import {playSound} from '../game/sound.js';

test('all saved prizes stop at the centre of all three reels, including reduced pools',()=>{
 for(const pool of [Object.keys(SKIP_REWARDS),['duplicate','scout','jackpot','sanctuary']])for(const id of pool)for(let column=0;column<3;column++){
  const {items,target}=reelPlan(pool,id,column);
  assert.equal(items[target],id);
  assert.equal(reelOffset(REEL_TIMES[column],REEL_TIMES[column],target),target*REEL_CELL);
  assert.equal(reelOffset(REEL_TIMES[column]+500,REEL_TIMES[column],target),target*REEL_CELL);
  assert.ok(items.length>target+1);
 }
});
test('rolling decelerates monotonically without reversing or jumping at the end',()=>{
 for(const duration of REEL_TIMES){let old=REEL_CELL,speed=Infinity;
  for(let i=1;i<=120;i++){const offset=reelOffset(duration*i/120,duration,48),step=offset-old;assert.ok(step>=-1e-8);assert.ok(step<=speed+1e-8);speed=step;old=offset;}
  assert.ok(speed<.01);assert.equal(old,48*REEL_CELL);
 }
 assert.ok(REEL_TIMES[0]<REEL_TIMES[1]&&REEL_TIMES[1]<REEL_TIMES[2]);
});
test('every mechanical sound cue creates finite audio nodes; disabled sound remains silent',()=>{
 let nodes=0,starts=0;
 const param=()=>({setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));},linearRampToValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(v)&&Number.isFinite(t));}});
 const node=()=>({connect(){return this;},disconnect(){},start(t){assert.ok(Number.isFinite(t));starts++;},stop(t){assert.ok(Number.isFinite(t));},frequency:param(),gain:param()});
 class FakeAudio {state='running';currentTime=10;sampleRate=8000;destination={};createOscillator(){nodes++;return node();}createGain(){return node();}createBiquadFilter(){return node();}createBuffer(ch,length){assert.ok(length>0);return {getChannelData:()=>new Float32Array(length)};}createBufferSource(){nodes++;return node();}}
 const priorDocument=globalThis.document,priorWindow=globalThis.window;
 globalThis.document={hidden:false};globalThis.window={AudioContext:FakeAudio};
 try{
  for(const cue of ['slot-throw','slot-land','slot-settle','slot-lever-grip','slot-lever-pull','slot-lever-ratchet','slot-roll','slot-reel-stop','slot-win','slot-claim']){
   const before=starts;playSound(cue,true,'2');assert.ok(starts>before,cue);
  }
  assert.ok(nodes>30);const before=starts;playSound('slot-win',false);assert.equal(starts,before);
  document.hidden=true;playSound('slot-roll');assert.equal(starts,before);
 }finally{globalThis.document=priorDocument;globalThis.window=priorWindow;}
});
