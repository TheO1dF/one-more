import {effectFor} from './tool-effects.js';
let context;
export function unlockSound(enabled=true){
 if(!enabled||document.hidden)return;
 try{
  if(!context||context.state==='closed')context=new(window.AudioContext||window.webkitAudioContext)();
  if(context.state!=='running')context.resume().catch(()=>{});
 }catch{}
}
function tone(ctx,f,time,length,volume=.04,type='sine',end=f){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();
 oscillator.type=type;oscillator.frequency.setValueAtTime(f,time);oscillator.frequency.exponentialRampToValueAtTime(end,time+length);
 gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.006);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
 oscillator.connect(gain).connect(ctx.destination);oscillator.start(time);oscillator.stop(time+length+.01);
 oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
}
function brush(ctx,time,length,frequency,volume){
 const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=b.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
 source.buffer=b;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,time);filter.frequency.exponentialRampToValueAtTime(80,time+length);gain.gain.value=volume;
 source.connect(filter).connect(gain).connect(ctx.destination);source.start(time);
 source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
export function playSound(type,enabled=true,kind=''){
 if(!enabled||document.hidden)return;
 try{
  unlockSound(enabled);if(!context)return;
  const t=context.currentTime;
  if(type==='slot-throw'){brush(context,t,.62,4200,.11);tone(context,430,t,.62,.025,'triangle',85);return;}
  if(type==='slot-land'){brush(context,t,.23,1500,.24);tone(context,105,t,.35,.11,'sine',32);tone(context,260,t,.17,.025,'triangle',100);return;}
  if(type==='slot-settle'){[0,.08,.17].forEach((d,i)=>{brush(context,t+d,.06,1200,.085/(i+1));tone(context,140,t+d,.08,.03/(i+1),'triangle',75);});return;}
  if(type==='slot-lever-grip'){brush(context,t,.04,1600,.055);tone(context,330,t,.06,.025,'triangle',220);return;}
  if(type==='slot-lever-pull'){tone(context,330,t,.29,.04,'triangle',105);tone(context,165,t,.26,.022,'sawtooth',72);brush(context,t,.22,1900,.055);return;}
  if(type==='slot-lever-ratchet'){brush(context,t,.025,3600,.08);tone(context,970,t,.035,.022,'triangle',510);return;}
  if(type==='slot-roll'){brush(context,t,.12,950,.045);tone(context,72,t,.13,.016,'triangle',67);tone(context,760,t,.018,.012,'sine',420);return;}
  if(type==='slot-reel-stop'){const note=[330,440,554][Number(kind)]||330;brush(context,t,.065,2100,.13);tone(context,125,t,.1,.035,'triangle',68);tone(context,note,t,.35,.045,'sine');return;}
  if(type==='slot-win'){[392,494,587,740,988].forEach((f,i)=>{tone(context,f,t+i*.085,.75,.035,'triangle');tone(context,f*2,t+i*.085,.35,.008);});[392,494,587,740].forEach(f=>tone(context,f,t+.48,.95,.018));brush(context,t+.47,.15,4200,.06);return;}
  if(type==='slot-claim'){[523,784,1046].forEach((f,i)=>tone(context,f,t+i*.04,.25,.025,'triangle'));return;}
  if(type==='wheel-tick'){brush(context,t,.018,2500,.09);tone(context,750,t,.035,.025,'triangle',420);return;}
  if(type==='reward'){
   [392,494,587,784,988,1175].forEach((f,i)=>{tone(context,f,t+i*.075,.8,.035,'triangle');tone(context,f*2,t+i*.075,.45,.009);});
   brush(context,t,.24,4600,.065);return;
  }
  if(type==='tear-start'){brush(context,t,.09,7600,.14);return;}
    if(type==='tear'){brush(context,t,.21,6700,.16);brush(context,t+.08,.2,2600,.11);return;}
  if(type==='paper-slide'){brush(context,t,.14,3200,.10);return;}
  if(type==='chips'){[0,.035,.08,.13].forEach((d,i)=>{brush(context,t+d,.04,2400,.1);tone(context,1100-i*90,t+d,.055,.04,'triangle',650);});return;}
  if(type==='click'){brush(context,t,.035,1800,.085);tone(context,540,t,.045,.035,'triangle',260);return;}
  if(type==='staple'){brush(context,t,.035,3600,.16);tone(context,155,t,.09,.065,'triangle',70);brush(context,t+.09,.045,2200,.07);return;}
  if(type==='unstaple'){tone(context,1600,t,.12,.032,'sine',500);brush(context,t+.045,.1,4300,.095);return;}
  if(type==='bomb'){brush(context,t,.85,2400,.32);tone(context,95,t,.6,.11,'sine',28);return;}
  if(type==='pan-chime'){[392,466,622].forEach((f,i)=>tone(context,f,t+i*.08,.7,.034,'triangle',f*.92));return;}
  if(type==='pan-muffle'){brush(context,t,.25,420,.21);tone(context,75,t,.38,.09,'sine',32);tone(context,1280,t+.02,.65,.026,'sine',980);return;}
  if(type==='pan-shatter'){brush(context,t,.38,5600,.19);[980,730,510].forEach((f,i)=>tone(context,f,t+i*.06,.22,.026,'triangle',f*.62));return;}
  if(type==='pan-shuffle'){brush(context,t,.42,2400,.12);tone(context,290,t,.4,.035,'triangle',110);return;}
  if(type==='fuse'){brush(context,t,.28,4500,.065);return;}
  if(type==='pair'){
   [392,494,587,784].forEach((f,i)=>{tone(context,f,t+i*.05,.4,.035,'triangle');tone(context,f*2,t+i*.05,.17,.01);});
   brush(context,t,.085,1500,.075);return;
  }
  if(type==='use'||type==='relic'){
   const pattern=effectFor(kind).pattern;
   if(['bell','magnet','lens','radar'].includes(pattern)){
    [587,1174,1761].forEach((f,i)=>tone(context,f,t+i*.025,.55-i*.1,.027/(i+1),'sine',f*.998));
    if(pattern==='radar')tone(context,880,t+.22,.15,.03);return;
   }
   if(['flame','grill','steam','wash','wind'].includes(pattern)){
    brush(context,t,pattern==='steam'?.5:.3,pattern==='flame'?700:2600,.1);tone(context,130,t,.2,.022,'sine',65);return;
   }
   if(['ferment','juice','scoop'].includes(pattern)){
    [320,480,380,640].forEach((f,i)=>tone(context,f,t+i*.065,.1,.032,'sine',f*1.5));return;
   }
   if(['cut','stamp','sparks','sieve'].includes(pattern)){
    brush(context,t,.1,pattern==='cut'?5500:1800,.13);tone(context,pattern==='stamp'?95:250,t,.15,.045,'triangle',65);return;
   }
   brush(context,t,.09,2000,.055);
   const note=pattern==='beam'?660:pattern==='copy'?392:pattern==='deal'?440:pattern==='seal'?494:330;
   [1,1.5,2].forEach((n,i)=>tone(context,note*n,t+i*.06,.23,.028,'triangle',note*n*1.06));return;
  }
  if(type==='stop'){[330,440,554,660].forEach((f,i)=>tone(context,f,t+i*.055,.28,.035,'triangle'));return;}
  if(type==='draw'){brush(context,t,.09,3000,.085);tone(context,180,t,.055,.035,'triangle',100);return;}
  if(type==='dice-throw'){brush(context,t,.16,2200,.045);return;}
  if(type==='dice-impact'){const volume=[1,.7,.4][Number(kind)]||1;brush(context,t,.045,1400,.12*volume);tone(context,260,t,.065,.035*volume,'triangle',140);return;}
  if(['roll','shake-die'].includes(type)){[0,.06,.13].forEach(d=>{brush(context,t+d,.05,1200,.11);tone(context,280,t+d,.07,.025,'triangle',180);});return;}
  tone(context,370,t,.12,.035,'sine');
 }catch{}
}
