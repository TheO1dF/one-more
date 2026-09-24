import {characterArt} from './character-art.js';
// Event interiors and recaps use portraits; route entrances retain their icons.
const asset=name=>new URL(`./assets/world/${name}-character-v2.png`,import.meta.url).href;
export const WORLD_ART=Object.fromEntries(['dealer','tea-room','kitchen','workshop','pawn-counter','corridor'].map(k=>[k,asset(k)]));
WORLD_ART.pan=new URL('./assets/pan/pan-character-v4.png',import.meta.url).href;
export const SCENE_KEYS={press:'workshop',tea:'tea-room',helper:'tea-room',lantern:'corridor',prune:'workshop',staple:'workshop',duplicate:'workshop',pawn:'pawn-counter',trade:'dealer',wager:'dealer',raw:'kitchen',fried:'kitchen',boiled:'kitchen',smoked:'kitchen',glazed:'kitchen',mystery:'corridor',levy:'corridor',pressure:'corridor',cap:'dealer',foodLoss:'corridor',toolLoss:'dealer',coldlocker:'corridor',menuchange:'kitchen',closingmeal:'kitchen'};
const head='M160 0H658L713 150 727 184 691 250 668 320 674 400 637 505 577 552 529 545 463 505 412 455 362 370 321 342 250 340 185 291Z';
const cards='M137 814 248 646 356 623 487 650 473 801 413 910 359 1005 236 1109 132 1056 138 895Z';
const hand='M797 1047 860 1023 991 1042 1002 1140 950 1258 949 1367 889 1367 863 1304 838 1371 777 1382 763 1270 720 1329 654 1327 650 1288 679 1214 687 1170Z';
let actorId=0;
export function editorialDealer(mood='offer'){
 return rasterDealerReference(mood);
}
export function rasterDealerReference(mood='offer'){
 const id=`host-cut-${++actorId}`,url=WORLD_ART.dealer;
 const image=`<image href="${url}" width="1122" height="1402"/>`;
 return `<svg class="dealer-actor dealer-editorial dealer-painted" data-mood="${mood}" viewBox="0 0 1122 1402" role="img" aria-label="The smiling dealer"><defs><clipPath id="${id}-base"><path clip-rule="evenodd" d="M0 0H1122V1402H0Z ${head} ${cards} ${hand}"/></clipPath><clipPath id="${id}-head"><path d="${head}"/></clipPath><clipPath id="${id}-cards"><path d="${cards}"/></clipPath><clipPath id="${id}-hand"><path d="${hand}"/></clipPath></defs><g clip-path="url(#${id}-base)">${image}</g><g class="editorial-head"><g clip-path="url(#${id}-head)">${image}</g></g><g class="editorial-cards"><g clip-path="url(#${id}-cards)">${image}</g></g><g class="editorial-fingers"><g clip-path="url(#${id}-hand)">${image}</g></g></svg>`;
}
export function sceneArt(id,lang='zh',{illustrated=false}={}){
 const key=id==='pan'?'pan':SCENE_KEYS[id]||'corridor';
 const portrait=key==='dealer'?editorialDealer(id==='wager'?'offer':'take'):illustrated?`<img class="settlement-portrait" data-character="${key}" src="${WORLD_ART[key]}" alt="">`:characterArt(key);
 return `<figure class="world-scene scene-${key}" data-scene="${id}">${portrait}</figure>`;
}
