import {SKIP_REWARDS} from './momentum.js';
const paths={
 prune:'<circle cx="23" cy="72" r="13" fill="none" stroke="currentColor" stroke-width="9"/><circle cx="75" cy="72" r="13" fill="none" stroke="currentColor" stroke-width="9"/><path d="m31 61 37-49 8 4-35 51Zm36 0L30 12l-8 4 35 51Z"/>',
 enchant:'<path d="m31 9 8 23 23 8-23 8-8 23-8-23L0 40l23-8Zm42 31 7 19 20 7-20 7-7 20-7-20-19-7 19-7Z"/>',
 staple:'<path d="M13 38h56l21 34H13Z"/><path d="M14 16h61l12 18H18Z"/><path d="M17 75h73v12H17Z"/><path d="M20 26h12v37H20Z"/>',
 relic:'<path fill-rule="evenodd" d="M41 7a27 27 0 1 0 11 52v18h12v13h14V74H65V46A27 27 0 0 0 41 7Zm0 15a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z"/>',
 duplicate:'<path d="M14 23h13v59h45v13H14Z"/><path fill-rule="evenodd" d="M34 5h56v69H34Zm12 12v45h32V17Z"/><path d="m62 22 12 17-12 17-12-17Z"/>',
 scout:'<path fill-rule="evenodd" d="M3 50q47-61 94 0Q50 111 3 50Zm17 0q30 35 60 0Q50 15 20 50Z"/><circle cx="50" cy="50" r="15"/>',
 jackpot:'<path d="m6 31 23 16 21-33 21 33 23-16-11 45H17Z"/><path d="M17 82h66v10H17Z"/><circle cx="8" cy="23" r="6"/><circle cx="50" cy="7" r="6"/><circle cx="92" cy="23" r="6"/>',
 sanctuary:'<path fill-rule="evenodd" d="M50 5 88 20v28q0 30-38 49Q12 78 12 48V20Zm0 16L27 31v17q0 20 23 32 23-12 23-32V31Z"/><path d="m32 48 9-7 8 10 19-21 8 8-27 31Z"/>',
};
export function slotSymbol(id){return `<svg viewBox="0 0 100 100" aria-hidden="true" class="slot-symbol" fill="currentColor">${paths[id]||paths.relic}</svg>`;}
export const REEL_CELL=120;
export const REEL_TIMES=[2700,3350,4100];
// Project the crank toward the player, keeping the knob round and hinge fixed.
export function leverPose(fraction){
 const angle=Math.max(0,Math.min(1,fraction))*2,cos=Math.cos(angle),sin=Math.sin(angle);
 const x=519-20*cos+44*sin,y=375-212*cos,dx=x-519,dy=y-375,length=Math.hypot(dx,dy),nx=-dy/length*10,ny=dx/length*10;
 return {x,y,rod:`M${519+nx} ${375+ny}L${x+nx} ${y+ny}L${x-nx} ${y-ny}L${519-nx} ${375-ny}Z`,shine:`M${519+nx*.65} ${375+ny*.65}L${x+nx*.65} ${y+ny*.65}L${x+nx*.1} ${y+ny*.1}L${519+nx*.1} ${375+ny*.1}Z`};
}
function carryingHand(){return `<g class="slot-carry-hand" aria-hidden="true">
 <path d="m275-270 118 18-60 211-64-10Z" fill="#574798"/><path d="m366-257 27 5-60 211-21-4Z" fill="#161936"/>
 <path d="m270-66 66 13-6 29-67-12Z" fill="#fff8e8"/><path d="m267-43 64 11-1 8-67-12Z" fill="#81b8ba"/><circle cx="321" cy="-38" r="4" fill="#ff4928"/>
 <path d="m271-35 53 9 9 33q4 15-8 28l-15 14-47-7-12-25 7-32Z" fill="#fff8e8"/>
 <path d="m320-23 13 30q4 15-8 28l-15 14-10-3 14-23Z" fill="#81b8ba"/>
 <g class="slot-carry-fingers">
 <path d="M253 13q-8 0-8 9v29q1 10 10 10 9 0 9-9V25q-1-11-11-12Zm19-2q-8 0-8 10v33q0 10 10 10 9-1 9-11V24q0-12-11-13Zm20 3q-9 0-9 10v30q0 10 9 10 10 0 10-11V25q-1-10-10-11Zm19 6q-9-1-9 9v22q0 9 9 9t9-10V31q0-10-9-11Z" fill="#fff8e8"/>
 <path d="M247 46q8 5 15-1v9q-2 8-9 6-6-1-6-8Zm19 2q8 4 15-1v10q-3 8-9 6-6-1-6-8Zm19 1q8 4 15-1v9q-3 8-9 6-6-1-6-8Zm19-4q8 4 14-1v9q-3 8-9 6-5-1-5-8Z" fill="#81b8ba"/>
 </g>
 <g class="slot-carry-thumb"><path d="M326 3q11 6 6 16l-11 16q-4 7-13 5l-28-7q-9-3-6-11 3-7 11-5l20 4 8-13q5-8 13-5Z" fill="#fff8e8"/><path d="m281 29 28 6q7 2 12-5l-2 7q-5 5-12 3l-27-7Z" fill="#81b8ba"/></g>
 </g>`;}
export function reelPlan(pool,id,column){
 const order=pool.map((_,i)=>pool[(i+column*2)%pool.length]);
 const target=id?(5+column)*order.length+order.indexOf(id):1;
 return {target,items:Array.from({length:target+3},(_,i)=>order[i%order.length])};
}
export function reelOffset(elapsed,duration,target){
 const t=Math.max(0,Math.min(1,elapsed/duration));
 return REEL_CELL*(1+(target-1)*(1-(1-t)**3));
}
export function reelsHTML(pool,id=null){return [0,1,2].map(column=>{
 const plan=reelPlan(pool,id,column),x=111+column*115;
 return `<g clip-path="url(#slot-clip-${column})"><g class="slot-reel" data-column="${column}" data-target="${plan.target}" transform="translate(${x} ${206-(id?plan.target:1)*REEL_CELL})">${plan.items.map((symbol,i)=>`<g transform="translate(0 ${i*REEL_CELL})"><path d="M-2 0h109v120H-2Z" fill="${i%2?'#fff4cb':'#ffe6bd'}"/><svg x="9" y="17" width="84" height="84" viewBox="0 0 100 100" color="#161936">${slotSymbol(symbol)}</svg></g>`).join('')}</g></g>`;
 }).join('');}
export function slotImpactArt(){return `<svg viewBox="-15 -24 640 700" aria-hidden="true">
 <g class="slot-cracks" fill="none" stroke="#080e22" stroke-width="5" stroke-linejoin="miter" stroke-linecap="square">
 <path pathLength="1" d="M126 593 90 609 65 603 38 619 13 615M65 603 60 580 42 570"/>
 <path pathLength="1" d="M180 610 153 637 120 638 92 657 62 660M153 637 163 657 147 673"/>
 <path pathLength="1" d="M283 618 268 641 286 656 271 674M268 641 235 650 226 665"/>
 <path pathLength="1" d="M394 615 424 638 413 650 445 672M424 638 464 639 483 654 516 660"/>
 <path pathLength="1" d="M520 589 553 607 575 599 603 618 621 615M575 599 584 579 609 569"/>
 </g>
 <g class="slot-crack-lips" fill="none" stroke="#535e7b" stroke-width="2" stroke-linejoin="miter">
 <path pathLength="1" d="M91 612 67 607 39 623M156 639 123 642 94 661M271 643 289 656 274 674M426 642 465 643 482 657M555 610 575 603 602 622"/>
 </g>
 </svg>`;}
export function slotMachineArt(offer,result=false){return `<svg class="slot-machine" viewBox="-15 -24 640 700" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="One More?">
 <defs>${[0,1,2].map(i=>`<clipPath id="slot-clip-${i}"><rect x="${109+i*115}" y="144" width="107" height="244" rx="9"/></clipPath>`).join('')}</defs>
 <path d="M86 613 493 634 591 604 490 581Z" fill="#090d26"/>
 <path d="m463 57 65 18 28 526-66 29-33-120Z" fill="#535e7b"/>
 <path d="M71 77 463 57l27 573-436-24 9-154 12-52Z" fill="#d5e8df"/>
 <path d="m71 77 392-20 1 20L84 96Z" fill="#fff8e8"/>
 <path d="M237 69V36q0-14 14-14h76q14 0 14 14v27h-13V39q0-4-4-4h-70q-4 0-4 4v29Z" fill="#535e7b"/><path d="M252 23h73v10h-73Z" fill="#8298a4"/>
 <path d="M89 110 449 90l12 321-379 1Z" fill="#8298a4"/>
 <path d="M103 135q162-24 342-5l10 267-365 0Z" fill="#161936"/>
 <g class="slot-reels">${reelsHTML(offer.pool,result?offer.id:null)}</g>
 <path d="M110 144h107v25H110Zm115 0h107v25H225Zm115 0h107v25H340Z" fill="#fff8e8" opacity=".38"/>
 <path d="M110 358h107v30H110Zm115 0h107v30H225Zm115 0h107v30H340Z" fill="#ce948b" opacity=".33"/>
 <path d="M89 406h370l24 52-414-4Z" fill="#fff8e8"/>
 <path d="m93 433 94 1 10 33-110-2Zm126 1h95l9 36-109-2Zm127 1h95l10 37-111-2Z" fill="#a90c23"/>
 <g class="slot-lights" fill="#ff3027"><path d="m97 422 91 1-1 22-94-1Z"/><path d="m221 423 94 1-1 23-95-1Z"/><path d="m347 424 94 1v24l-97-2Z"/></g>
 <path d="M80 483 461 490l7 111-391-20Z" fill="#b2cbd0"/>
 <path d="m89 493 362 7 3 74-368-13Z" fill="#8195a1"/>
 <text x="273" y="546" text-anchor="middle" fill="#fff8e8" font-family="Georgia,serif" font-weight="bold" font-style="italic" font-size="36" transform="rotate(2 273 546)">One More?</text>
 <path d="M95 255 108 266 95 277Zm365 0-13 11 13 11Z" fill="#ff4928"/>
 <path d="m491 359 38-8 17 56-39 11Z" fill="#8298a4"/><ellipse cx="524" cy="388" rx="28" ry="36" fill="#b2cbd0"/>
 <g class="slot-lever" role="button" tabindex="-1" aria-disabled="true" aria-label="PULL / SPIN">
 <path class="slot-lever-rod" d="${leverPose(0).rod}" fill="#8298a4"/><path class="slot-lever-shine" d="${leverPose(0).shine}" fill="#fff8e8"/>
 <g class="slot-lever-knob">
 <circle cx="499" cy="163" r="33" fill="#b50b27"/><path d="M466 158a33 33 0 0 1 65-3q-23 34-64 17Z" fill="#ff3027"/><circle cx="487" cy="146" r="10" fill="#fff8e8"/>
 <circle cx="499" cy="163" r="45" fill="transparent"/>
 </g></g><circle cx="519" cy="375" r="13" fill="#d5e8df"/>
 ${carryingHand()}
 </svg>`;}
export function slotPrizeHTML(id,lang='zh'){
 const r=SKIP_REWARDS[id],en=lang==='en';
 return `<div class="slot-prize-symbol">${slotSymbol(id)}</div><p class="slot-congrats">${r.rare?(en?'JACKPOT!':'大奖！'):(en?'YOU WIN!':'恭喜获奖！')}</p><h2>${r.name[en?1:0]}</h2><p class="slot-prize-rule">${r.text[en?1:0]}</p><button class="slot-confirm" type="button">${en?'CLAIM PRIZE':'确认领奖'}</button>`;
}
