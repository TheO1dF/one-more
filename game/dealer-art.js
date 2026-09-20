import {PALETTE as P} from './poster-art.js';
import {icon,nameOf,CARDS} from './cards.js';
// Short sleeve, broad palm, bent fingers. The grip points inward at (190, 83).
export function dealerGrip(side='left'){return `<svg viewBox="0 0 210 160" aria-hidden="true"><g transform="${side==='right'?'translate(210 0) scale(-1 1)':''}">
<path d="M0 39 66 49l13 69-79 20Z" fill="${P.purple}"/><path d="m0 113 75-12 4 17-79 20Z" fill="${P.blue}"/>
<path d="m59 47 24-2 14 68-24 10Z" fill="${P.cream}"/><path d="m66 101 27-5 4 17-24 10Z" fill="${P.blue}"/><circle cx="80" cy="106" r="4" fill="${P.orange}"/>
<path d="M83 55q18-23 41-22l32 9q10 3 17 15l12 19q4 10-5 15l-8 0 6 10q5 10-5 15l-11 0q-1 13-14 14l-23-2q-19 2-36-16Z" fill="${P.cream}"/>
<path d="m93 91 15 21q24 18 51 2l14-11 4 8q-1 7-15 6-1 13-14 14l-23-3q-20 0-36-17Z" fill="${P.blue}"/>
<path d="M119 46q8-7 14-2l24 16 12 25q4 10-4 13-9 3-13-6l-11-20-20-10Z" fill="${P.blue}"/>
<path d="m119 45 17 3 23 21 7 20q3 7-4 8-7 0-10-7l-11-20-22-10Z" fill="${P.cream}"/>
<path d="M111 75q8-13 21-11l22 9 25 1q12-1 15 7 3 11-9 15l-28 2-27 15-19-6Z" fill="${P.cream}"/>
<path d="m137 101 18-10 29-1q10-2 10-9 6 11-9 15l-28 2-27 15-19-6Z" fill="${P.blue}"/>
<path d="m179 79 9 0q4 1 3 5l-3 5-11 0Z" fill="${P.blue}"/>
<path d="m112 84 7 6m13-35 8 5m-34 32 8 7" fill="none" stroke="${P.blue}" stroke-width="2.5" stroke-linecap="round"/>
</g></svg>`;}
export function dealerHand(){return dealerGrip('right');}
export function dealerActor(mood='offer'){
 return `<svg class="dealer-actor" data-mood="${mood}" viewBox="0 0 340 310" aria-hidden="true"><g class="dealer-body">
<path d="M75 300 70 182q3-27 30-36l47-13h64l42 17q23 10 24 34l-12 116Z" fill="${P.ink}"/>
<path d="m146 136 31 22 29-23-5 150h-62Z" fill="${P.cream}"/>
<path d="m141 135-36 11 6 41 23 5-8 20 34 75-8-98Z" fill="${P.purple}"/>
<path d="m210 135 30 12-7 43-21 4 9 17-34 76 9-96Z" fill="${P.purple}"/>
<path d="m153 160 21 9 24-8-2 23-22-7-22 7Z" fill="${P.orange}"/><circle cx="174" cy="175" r="5" fill="${P.ink}"/>
<path d="m226 216 23-3 1 8-23 3Z" fill="${P.cream}"/>
<g class="dealer-head"><path d="m151 112 2 30 20 14 27-17-5-35Z" fill="${P.blue}"/>
<path d="M133 67q0-30 38-31 40-1 40 32l-4 44q-6 28-31 35-24-4-35-30Z" fill="${P.cream}"/>
<path d="m191 51 19 15-3 46q-6 28-31 35l10-22 5-26Z" fill="${P.blue}"/>
<path d="M142 86q10-11 20-1l-1 6q-10-5-19 1Zm36 0q10-12 23-3l-1 8q-12-5-21 0Z" fill="${P.ink}"/>
<path d="m171 89-5 16 11 1Z" fill="${P.blue}"/>
<path d="M146 107q28 16 50-3-6 24-27 25-16-3-23-22Z" fill="${P.ink}"/>
<path d="M150 110q23 9 42-3l-7 10q-17 7-30-1Z" fill="${P.cream}"/>
<path d="m130 17 65-9 14 45 25 6-1 12q-62 9-113-1l-8-11 21-7Z" fill="${P.purple}"/>
<path d="m134 18 11 3 4 30-13 2Z" fill="${P.ink}"/><path d="m133 43 71-8 5 18-73 9Z" fill="${P.orange}"/></g>
<g class="dealer-left-arm"><path d="M99 150q-25 5-32 34l-18 53q-6 18 8 30l29 6 14-23-14-12 29-67Z" fill="${P.purple}"/>
<g class="dealer-left-wrist"><path d="m62 237 59-13 17 32-61 19q-25 3-29-19Z" fill="${P.ink}"/><path d="m117 224 17-4 12 32-14 8Z" fill="${P.blue}"/>
<path d="m132 223 20-12 27 7 13 18-8 9-18-13-13 9 18 3 18 5-1 9-32 2-19-8Z" fill="${P.cream}"/>
<g class="dealer-fingers"><path d="m156 243 34 1 10 7-3 8-40-2Z" fill="${P.cream}"/><path d="m165 250 26 1m-28 5 23 1" stroke="${P.blue}" stroke-width="2.5" stroke-linecap="round"/></g></g></g>
<g class="dealer-right-arm"><path d="M245 151q21 7 28 32l21 54q9 21-8 32l-29 4-13-24 17-15-31-66Z" fill="${P.purple}"/>
<g class="dealer-right-wrist"><path d="m277 237-51-17-17 33 59 20q20 2 26-18Z" fill="${P.ink}"/><path d="m226 220-18-5-13 31 16 9Z" fill="${P.blue}"/>
<path d="m209 218-15-12-20-2-15 12 5 9 18-7 12 11-13 10 3 10 20-1 12-19Z" fill="${P.cream}"/><path d="m184 237-15 1-7 9 6 8 26-7 10-9Z" fill="${P.cream}"/><path d="m175 244 14-1m-15 7 13-3" stroke="${P.blue}" stroke-width="2.5" stroke-linecap="round"/></g></g>
</g></svg>`;
}
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function eventCard(c,lang='zh'){
 const k=c.original||c.kind||c,en=lang==='en';
 return `<div class="deal-card" data-card-kind="${k}"><small>${en?'PERMANENT':'永久牌'}</small>${icon(k)}<strong>${nameOf(k,lang)}</strong><p>${esc(CARDS[k].text[en?1:0])}</p></div>`;
}
