import {Resvg} from '@resvg/resvg-js';
import {mkdir,writeFile} from 'node:fs/promises';
import {posterIcon,posterBack,posterDealer} from '../game/poster-art.js';
const out=new URL('../releases/steam-kit-v0.12.0/',import.meta.url);await mkdir(out,{recursive:true});
const ink='#161936',cream='#fff8e8',orange='#ff4928',green='#339563',purple='#574798',gold='#edbd38';
const inner=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const icon=(id,x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size/104})">${inner(posterIcon(id))}</g>`;
const card=(id,x,y,scale=1,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle} 85 115) scale(${scale})"><rect x="7" y="12" width="170" height="232" rx="10" fill="${ink}"/><rect width="170" height="232" rx="10" fill="${cream}"/><path d="M0 0h170v40H0Z" fill="${id==='bomb'?orange:purple}"/>${icon(id,12,46,146)}<text x="18" y="221" font-family="Georgia" font-size="28" font-weight="bold" fill="${ink}">${id==='bomb'?'?':'2'}</text><path d="m143 196 9 12-9 12-9-12Z" fill="${orange}"/></g>`;
const title=(x,y,size,center=false)=>`<text x="${x}" y="${y}" text-anchor="${center?'middle':'start'}" font-family="Georgia" font-weight="bold" font-style="italic" font-size="${size}" fill="${cream}">One More<tspan fill="${gold}" font-style="normal">?</tspan></text>`;
function artwork(w,h,type){
 const vertical=type==='vertical'||type==='library',small=type==='small';
 let body=`<rect width="${w}" height="${h}" fill="${ink}"/><path d="M0 ${h*.1}Q${w*.6} ${-h*.2} ${w} ${h*.2}V${h}H0Z" fill="${green}"/><path d="M${w*.55} 0H${w}V${h}L${w*.85} ${h}Z" fill="${purple}"/>`;
 if(type==='hero'){body+=card('fish',w*.38,h*.18,2.4,-15)+card('bomb',w*.48,h*.25,2.4,12);body=body.replace(/<text[\s\S]*?<\/text>/g,'');}
 else if(small)body+=title(w/2,h*.65,w*.16,true);
 else if(vertical)body+=`<g transform="translate(${w*.14} ${h*.25}) scale(${w/470})">${inner(posterDealer())}</g>`+card('fish',w*.04,h*.62,w/620,-19)+card('bomb',w*.53,h*.60,w/600,15)+title(w*.50,h*.17,w*.154,true);
 else body+=card('rice',w*.53,h*.12,h/320,-16)+card('fish',w*.69,h*.06,h/320,5)+card('bomb',w*.78,h*.17,h/320,20)+title(w*.06,h*.51,w*.086);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}
const files=[['header-capsule',920,430,'wide'],['library-header',920,430,'wide'],['small-capsule',462,174,'small'],['main-capsule',1232,706,'wide'],['vertical-capsule',748,896,'vertical'],['library-capsule',600,900,'library'],['library-hero',3840,1240,'hero'],['page-background',1438,810,'wide']];
for(const [name,w,h,type] of files){const svg=artwork(w,h,type);await writeFile(new URL(name+'.svg',out),svg);await writeFile(new URL(name+'.png',out),new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());}
const logo=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="300" viewBox="0 0 1280 300">${title(640,208,190,true)}</svg>`;
await writeFile(new URL('library-logo.png',out),new Resvg(logo).render().asPng());
for(const [id,zh,en] of [['pairs','配对，让小牌打出大分。','Small cards. Big combinations.'],['stakes','够分了。还要再来一张？','Enough to leave. One more?'],['unlocks','下一局，换一种打法。','Another run. Another way to play.']]){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="220"><rect width="1200" height="220" fill="${purple}"/><path d="M0 0h230L110 220H0Z" fill="${orange}"/>${icon(id==='pairs'?'fish':id==='stakes'?'bomb':'relic-shaker',26,24,175)}<text x="240" y="105" font-family="Microsoft YaHei" font-size="40" font-weight="bold" fill="${cream}">${zh}</text><text x="240" y="165" font-family="Georgia" font-size="30" fill="${cream}">${en}</text></svg>`;
 await writeFile(new URL('section-'+id+'.png',out),new Resvg(svg).render().asPng());
}
await writeFile(new URL('asset-manifest.json',out),JSON.stringify({version:'0.12.0',style:'Original game SVG assets; flat casino inks',capsules:files.map(([name,width,height])=>({name:name+'.png',width,height})),sources:['https://partner.steamgames.com/doc/store/assets/standard','https://partner.steamgames.com/doc/store/assets/libraryassets'],status:'Local draft. Not published on Steam.'},null,2));
console.log(out.pathname);
