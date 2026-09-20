let context;
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
  context??=new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});
  const t=context.currentTime;
  if(type==='bomb'){brush(context,t,.85,2400,.32);tone(context,95,t,.6,.11,'sine',28);return;}
  if(type==='fuse'){brush(context,t,.28,4500,.065);return;}
  if(type==='pair'){
   [392,494,587,784].forEach((f,i)=>{tone(context,f,t+i*.05,.4,.035,'triangle');tone(context,f*2,t+i*.05,.17,.01);});
   brush(context,t,.085,1500,.075);return;
  }
  if(type==='use'||type==='relic'){
   brush(context,t,.12,2000,.1);
   const peek=['torch','scope','sifter'].includes(kind);
   (peek?[660,990]:[220,330]).forEach((f,i)=>tone(context,f,t+i*.085,.22,.04,'triangle',f*(peek?1.3:.85)));return;
  }
  if(type==='stop'){[330,440,554,660].forEach((f,i)=>tone(context,f,t+i*.055,.28,.035,'triangle'));return;}
  if(type==='draw'){brush(context,t,.09,3000,.085);tone(context,180,t,.055,.035,'triangle',100);return;}
  if(['roll','shake-die'].includes(type)){[0,.06,.13].forEach(d=>{brush(context,t+d,.05,1200,.11);tone(context,280,t+d,.07,.025,'triangle',180);});return;}
  tone(context,370,t,.12,.035,'sine');
 }catch{}
}
