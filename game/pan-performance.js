import {icon} from './cards.js';
import {cardBackArt} from './art.js';
import {panHandArt,giftGlassArt} from './pan-art.js';

export async function playPanIntervention({layer,animate,current,lang='zh',intro=false,cue=()=>{},onBeat=()=>{},onStep=async()=>{}}){
 const stage=document.createElement('section');stage.className='pan-intervention';
 stage.innerHTML=`<div class="pan-stage"><div class="pan-danger-card">${icon('bomb')}<i class="pan-fuse-spark"></i></div><div class="pan-reaching-hand">${panHandArt()}</div><div class="pan-shield-cup">${giftGlassArt()}</div><div class="pan-contained-blast"><svg viewBox="-100 -100 200 200"><path d="m0-96 18 66 60-38-41 59 61 11-62 19 39 62-58-42-17 67-19-63-66 37 48-56-61-24 69-10-34-60 47 35Z" fill="#fff8e8"/><path d="m0-59 18 35 37-7-24 33 16 42-42-17-39 20 13-43-30-32 40 3Z" fill="#ff4928"/></svg></div><div class="pan-return-card">${icon('bomb')}</div></div>`;
 if(intro)stage.insertAdjacentHTML('beforeend','<p class="pan-dialogue" aria-live="polite"></p>');
 layer.append(stage);
 const get=s=>stage.querySelector(s);
 const lines=lang==='en'?{
  fuse:['THE DEALER','There it is. Your last card.'],intercept:['PAN','Not yet.'],
  crack:['PAN','One glass, one save. That is all you get this run.'],
  return:['PAN','The bomb goes back in. I would check before drawing again.']
 }:{fuse:['荷官','“这就对了。您的最后一张。”'],intercept:['潘神','“还没轮到你收账。”'],
  crack:['潘神','“一只杯子，替你挡一次。这局就帮到这儿。”'],return:['潘神','“炸弹还在牌里。下回先看清楚。”']};
 const beat=id=>{stage.dataset.beat=id;if(intro&&lines[id]){const [who,line]=lines[id];stage.querySelector('.pan-dialogue').innerHTML='<b>'+who+'</b><span>'+line+'</span>';}onBeat(id);};
 const bomb=get('.pan-danger-card'),cup=get('.pan-shield-cup'),hand=get('.pan-reaching-hand');
 beat('fuse');cue('fuse');
 await animate(bomb,[{scale:'.65',rotate:'-12deg',opacity:0},{scale:'1.05',rotate:'3deg',opacity:1,offset:.6},{scale:'1',rotate:'-2deg',opacity:1}],{duration:500});
 await animate(bomb,[{opacity:1},{opacity:1}],{duration:intro?950:550});await onStep('fuse');
 if(!current())return;
 beat('intercept');cue('pan-chime');
 await Promise.all([
  animate(hand,[{translate:'-480px -100px',rotate:'-14deg',opacity:0},{translate:'0 0',rotate:'0deg',opacity:1}],{duration:600,easing:'cubic-bezier(.16,.85,.22,1)'}),
  animate(cup,[{translate:'-430px -150px',rotate:'-22deg',opacity:0},{translate:'0 0',rotate:'0deg',opacity:1}],{duration:600,easing:'cubic-bezier(.16,.85,.22,1)'})]);
 await animate(cup,[{opacity:1},{opacity:1}],{duration:500});await onStep('intercept');
 if(!current())return;
 beat('impact');cue('pan-muffle');
 bomb.style.visibility='hidden';
 await Promise.all([
  animate(get('.pan-contained-blast'),[{scale:'.08',opacity:1},{scale:'1.15',opacity:1,offset:.18},{scale:'.4',opacity:0}],{duration:360}),
  animate(cup,[{translate:'0 0',rotate:'0deg'},{translate:'5px -8px',rotate:'5deg',offset:.15},{translate:'-4px 3px',rotate:'-4deg',offset:.38},{translate:'0 0',rotate:'0deg'}],{duration:360}),
  animate(hand,[{translate:'0 0'},{translate:'-8px 5px',offset:.25},{translate:'0 0'}],{duration:360})]);
 await animate(cup,[{opacity:1},{opacity:1}],{duration:600});await onStep('impact');
 if(!current())return;
 beat('crack');cue('pan-shatter');
 get('.gift-cracks').style.opacity='1';
 await animate(cup,[{rotate:'0deg'},{rotate:'-4deg'}],{duration:250});
 await animate(cup,[{opacity:1},{opacity:1}],{duration:intro?1350:500});await onStep('crack');
 if(!current())return;
 const shards=Array.from({length:7},(_,i)=>{const el=document.createElement('i');el.className='pan-glass-shard';el.style.setProperty('--shard',i);el.style.background=i%3?'#edbd38':'#fff8e8';get('.pan-stage').append(el);return el;});
 get('.gift-bowl').style.visibility='hidden';
 await Promise.all([
  ...shards.map((el,i)=>animate(el,[{translate:'0 0',rotate:'0deg',opacity:1},{translate:`${(i-3)*33}px ${80+(i%3)*27}px`,rotate:`${(i-3)*37}deg`,opacity:0}],{duration:540,easing:'cubic-bezier(.33,.01,.79,.62)'})),
  animate(cup,[{translate:'0 0',rotate:'-4deg',opacity:1},{translate:'-220px 85px',rotate:'-35deg',opacity:0}],{duration:520}),
  animate(hand,[{translate:'0 0',opacity:1},{translate:'-350px 40px',opacity:0}],{duration:520})]);
 if(!current())return;
 beat('return');cue('paper-slide');
 const returning=get('.pan-return-card');
 await animate(returning,[{scale:'.5',rotate:'-15deg',opacity:0},{scale:'1',rotate:'5deg',opacity:1}],{duration:300});
 await animate(returning,[{opacity:1},{opacity:1}],{duration:600});await onStep('return');
 if(!current())return;
 const box=returning.getBoundingClientRect(),deck=document.querySelector('#deck-draw')?.getBoundingClientRect();
 const target={x:deck?deck.x+deck.width/2:innerWidth*.84,y:deck?deck.y+deck.height/2:innerHeight*.24};
 cue('pan-shuffle');
 await animate(returning,[{translate:'0 0',rotate:'5deg',scale:'1',opacity:1},{translate:`${target.x-box.x-box.width/2}px ${target.y-box.y-box.height/2}px`,rotate:'185deg',scale:'.3',opacity:0}],{duration:500,easing:'cubic-bezier(.45,.01,.65,1)'});
 if(!current())return;
 beat('shuffle');
 const stack=document.createElement('div');stack.className='pan-return-stack';stack.style.cssText=`left:${target.x}px;top:${target.y}px`;stack.innerHTML=Array.from({length:3},()=>`<i>${cardBackArt()}</i>`).join('');stage.append(stack);
 await Promise.all([...stack.children].map((el,i)=>animate(el,[{translate:`${(i-1)*7}px 0`,rotate:`${(i-1)*5}deg`,opacity:1},{translate:`${(i-1)*38}px ${i%2?-15:6}px`,rotate:`${(i-1)*15}deg`,opacity:1,offset:.35},{translate:'0 0',rotate:'0deg',opacity:0}],{duration:480})));
 await onStep('shuffle');
 if(current())onBeat('done');
}
