import {points as scoreText} from './points.js';
import {CARDS, icon, nameOf, typeOf} from './cards.js';
import {onTable, partners, value} from './engine.js';
import {ENCHANTMENTS} from './routes.js';
import {enchantmentText} from './enchantments.js';

const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export const MATERIALS=Object.freeze({
 raw:{className:'material-raw',label:['生腌','RAW']},
 fried:{className:'material-fried',label:['油炸','FRIED']},
 boiled:{className:'material-boiled',label:['水煮','BOILED']},
 smoked:{className:'material-smoked',label:['烟熏','SMOKED']},
 glazed:{className:'material-glazed',label:['蜜渍','GLAZED']},
});
export function materialLayers(enchantment){
 if(!MATERIALS[enchantment])return '';
 const effects={
  fried:[18,33,76,88,24,82].map((x,i)=>`<circle class="oil-pop" cx="${x}" cy="${i%2?69:77}" r="${i%2?2.6:3.4}" style="--i:${i}"/>`).join(''),
  boiled:[25,49,73].map((x,i)=>`<path class="steam-wisp" d="M${x} 51c-9-10 9-14 0-26" style="--i:${i}"/>`).join(''),
  raw:[19,78,85].map((x,i)=>`<path class="brine-drop" d="M${x} ${50+i*9}q-7 10 0 10t0-10Z"/>`).join(''),
  smoked:[23,52,80].map((x,i)=>`<path class="smoke-wisp" d="M${x} 85c-16-10 12-19 0-31s8-18 4-26" style="--i:${i}"/>`).join(''),
  glazed:[22,57,82].map((x,i)=>`<path class="glaze-drop" d="M${x} 22v${13+i*7}q-5 7 0 9t0-9" style="--i:${i}"/>`).join(''),
 };
 return `<span class="card-material" aria-hidden="true"><svg class="cooking-vfx" viewBox="0 0 104 104">${effects[enchantment]}</svg><span class="cooking-sheen"></span></span>`;
}
export function cardHTML(c,{s,lang='zh',selected,flow,performance}={}){
 const en=lang==='en',tr=(a,b)=>en?b:a,tx=a=>a[en?1:0],type=typeOf(c);
 const types={food:tr('食材','FOOD'),tool:tr('工具','TOOL'),device:tr('装置','DEVICE'),trouble:tr('麻烦','TROUBLE'),bomb:tr('炸弹','BOMB')};
 const matches=partners(s,c.uid).length>0,angle=c.uid*37%9-4,target=flow?.choices.some(x=>x.id===c.uid);
 const badge=c.ferment?tr('发酵','FERMENT'):c.sealedBy?tr('封存','SEALED'):c.pair?`♥ ${c.pair}`:c.tapped?'↷':c.keepOnce?tr('留桌','RETAIN'):c.extraUses?tr('连用2次','2 USES'):c.freeCost?tr('费用0','COST 0'):c.temporary?tr('临时','LOAN'):matches?'♥':types[type];
 const points=type==='food'||CARDS[c.kind].scoring||(s.toolScoring&&type==='tool');
 const material=MATERIALS[c.enchantment];
 return `<div class="card-seat ${c.tapped?'landscape':''}" style="--offset:${c.uid*13%7-3}px"><button class="tile ${type} ${selected===c.uid?'selected':''} ${c.pair?'paired':''} ${c.tapped?'tapped':''} ${c.sealedBy?'sealed':''} ${target?'targetable':''} ${flow?.marked?.includes(c.uid)?'chosen-target':''} ${material?.className||''}" data-action="select" data-uid="${c.uid}" data-kind="${c.kind}" data-pair="${c.pair||''}" data-material="${c.enchantment||'paper'}" data-angle="${angle}" style="--tilt:${angle}deg;--material-phase:${-(c.uid%7)}s;${performance==='draw'&&c.uid===selected?'visibility:hidden;':''}" aria-label="${esc(nameOf(c.kind,lang)+' · '+badge+(material?' · '+tx(material.label):''))}" aria-pressed="${selected===c.uid||!!flow?.marked?.includes(c.uid)}"><span class="tile-top"><span>${types[type]}</span>${points?`<b>${c.kind==='cola'?'Σ'+scoreText(onTable(s).filter(x=>x.kind==='cola').reduce((n,x)=>n+value(s,x),0)):scoreText(value(s,c))}</b>`:''}</span>${icon(c.kind)}${materialLayers(c.enchantment)}${material?`<span class="enchant-stamp ${c.enchantment}" title="${esc(tx(enchantmentText(c,c.enchantment,CARDS)||ENCHANTMENTS[c.enchantment].text))}">${tx(ENCHANTMENTS[c.enchantment].stamp)}</span>`:''}<strong>${nameOf(c.kind,lang)}</strong>${c.pressWeight>1?`<span class="press-stamp">×${c.pressWeight}</span>`:''}<span class="tile-badge ${matches?'match':''}">${badge}</span></button></div>`;
}

// A card keeps its DOM identity while the surrounding HUD changes.
// Rules own the card data; this instance owns only its presentation.
export class CardInstance {
 constructor(seat){
  this.seat=seat;this.node=seat.querySelector('.tile');this.content=this.node.innerHTML;
  this.node.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||document.documentElement.dataset.motion==='reduced')return;
   const r=this.node.getBoundingClientRect();this.node.style.setProperty('--light-x',Math.round((event.clientX-r.x)/r.width*100)+'%');this.node.style.setProperty('--light-y',Math.round((event.clientY-r.y)/r.height*100)+'%');
  });
 }
 update(next){
  const button=next.querySelector('.tile');
  for(const name of this.seat.getAttributeNames())if(!next.hasAttribute(name))this.seat.removeAttribute(name);
  for(const {name,value} of next.attributes)this.seat.setAttribute(name,value);
  for(const name of this.node.getAttributeNames())if(!button.hasAttribute(name))this.node.removeAttribute(name);
  for(const {name,value} of button.attributes)this.node.setAttribute(name,value);
  if(this.content!==button.innerHTML){this.node.innerHTML=button.innerHTML;this.content=button.innerHTML;}
  return this.seat;
 }
 dispose(){this.node.getAnimations().forEach(a=>a.cancel());this.seat.remove();}
}
export class CardScene {
 constructor(){this.instances=new Map();}
 reconcile(root){
  const live=new Set();
  for(const seat of root.querySelectorAll('.card-seat')){
   const uid=Number(seat.querySelector('.tile').dataset.uid);live.add(uid);
   const instance=this.instances.get(uid);
   if(instance)seat.replaceWith(instance.update(seat));else this.instances.set(uid,new CardInstance(seat));
  }
  for(const [uid,instance] of this.instances)if(!live.has(uid)){instance.dispose();this.instances.delete(uid);}
 }
}
