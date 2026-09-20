const original={night:'#161936',paper:'#fff8e8',felt:'#339563',scarlet:'#ff4928',violet:'#574798',gold:'#edbd38',blue:'#81b8ba'};
const inks=(night,paper,felt,scarlet,violet,gold,edge,shadow)=>({night,paper,felt,scarlet,violet,gold,blue:edge,'felt-edge':edge,'felt-shadow':shadow,'felt-print':edge,'felt-preview':shadow,'felt-hover':felt,'felt-success':shadow,'button-hover':violet,'action-hover':scarlet});
export const PALETTES=Object.freeze({
 casino:{name:['赌场绿','Casino'],colors:original},
 midnight:{name:['午夜蓝','Midnight'],colors:inks('#101a30','#fff1d5','#244c75','#c14153','#484194','#efc066','#7097b5','#17364f')},
 plum:{name:['梅子紫','Mulberry'],colors:inks('#22152c','#ffefdc','#683a65','#b93958','#493c86','#f0c86e','#b58ba9','#472746')},
 ember:{name:['赤陶橙','Terracotta'],colors:inks('#281f2b','#fff0d4','#a34a35','#334f89','#574274','#edc966','#e4ac85','#713426')},
 lagoon:{name:['孔雀青','Lagoon'],colors:inks('#132c35','#fff3dc','#276a68','#a93055','#40588f','#f1ca69','#8cbbb2','#194b4b')},
 graphite:{name:['石墨灰','Graphite'],colors:inks('#1a1c27','#f7f2e8','#454b59','#9e3653','#4d507e','#dfc583','#a5aab5','#303542')},
});
export const paletteId=value=>Object.hasOwn(PALETTES,value)?value:'casino';
const properties=[...new Set(Object.values(PALETTES).flatMap(p=>Object.keys(p.colors)))];
export function applyPalette(value,root=document.documentElement){
 const id=paletteId(value),colors=PALETTES[id].colors;
 root.dataset.palette=id;
 for(const key of properties){if(colors[key])root.style.setProperty('--'+key,colors[key]);else root.style.removeProperty('--'+key);}
 root.style.setProperty('--ink',colors.paper);
 root.style.setProperty('--muted',id==='casino'?'#dce7c4':colors.paper);
 root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors.night);
}
export function paletteGallery(selected,lang='zh'){
 const en=lang==='en',active=paletteId(selected);
 return `<div class="palette-gallery">${Object.entries(PALETTES).map(([id,p])=>`<button class="palette-option" data-action="palette" data-id="${id}" aria-pressed="${id===active}" style="${Object.entries(p.colors).map(([k,v])=>`--${k}:${v}`).join(';')}"><span class="palette-preview" aria-hidden="true"><i class="palette-mini-score">12</i><i class="palette-mini-card first">♠</i><i class="palette-mini-card second">♥</i><i class="palette-mini-action">One More?</i></span><span class="palette-caption"><strong>${p.name[en?1:0]}</strong><small>${id===active?(en?'✓ Selected':'✓ 使用中'):(en?'Use':'使用')}</small></span><span class="palette-swatches" aria-hidden="true">${['felt','scarlet','violet','gold','paper'].map(c=>`<i style="background:${p.colors[c]}"></i>`).join('')}</span></button>`).join('')}</div><button class="palette-return" data-action="palette-settings">${en?'← Settings':'← 设置'}</button>`;
}
