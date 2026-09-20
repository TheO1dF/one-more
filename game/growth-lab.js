// Optional run-long progression prototype. Content is registered only in its test entry.
export const GROWTH_AVAILABLE=true;
export const GROWTH_LAB=typeof location!=='undefined'&&new URLSearchParams(location.search).get('lab')==='growth';
export const GROWTH_LIMIT=10;
export const GROWTH_CURVES={gentle:[1,1,2,2,3,4,5,6,8],steep:[1,1,2,3,4,6,9,13,18]};
export const growthCurve=difficulty=>GROWTH_CURVES[difficulty>=2?'steep':'gentle'];
export const growthCap=s=>GROWTH_LIMIT+(s?.endless?2*Math.max(0,s.round+(['route','encounter','draft'].includes(s.phase)?1:0)-10):0);
export const GROWTH_ROUTES={
 broth:{name:['老卤慢炖','Slow simmer'],core:'stockpot',support:'mincer',relic:'heirloomladle',event:'consume',every:3,verb:['消耗食材','foods consumed'],text:['消耗食材养老卤，再把食材取回来继续运转。','Feed your Stock, then reclaim ingredients to keep working.'],allies:['scope','scoop','egg','toast']},
 dough:{name:['起面成双','Proof in pairs'],core:'sourdough',support:'doughpress',relic:'proofingcloth',event:'pair',every:3,verb:['完成配对','pairs made'],text:['配对养大面团，临时原版负责补齐另一半。','Grow Sourdough through pairs; fresh base copies supply partners.'],allies:['wild','mint','stamp','splitter']},
 garden:{name:['生生不息','Growing nursery'],core:'motherstarter',support:'sproutbox',relic:'nurserypot',event:'create',every:4,verb:['生成食材','foods created'],text:['不断生成食材养母种，也要留意永久牌组越来越厚。','Create food to grow your Starter; permanent additions thicken the deck.'],allies:['popcorn','tofu','wish','redseal']},
 banquet:{name:['百味宴席','Tasting banquet'],core:'tastingplate',support:'tastingfork',relic:'banquetmenu',event:'variety',every:2,verb:['不同配对种类','different pair kinds'],text:['寻找尚未配对过的食材种类，让拼盘跨桌成长。','Seek new kinds of pairs to grow your Platter across tables.'],allies:['fish','rice','mint','wild']},
 pickle:{name:['清台腌坊','Clean counter'],core:'pickle',support:'washpress',relic:'bristlebrush',event:'clear',every:2,verb:['清理麻烦','trouble cleared'],text:['清理麻烦养泡菜，逐渐清掉牌组里的杂物。','Grow Pickles by clearing trouble and pruning clutter from the deck.'],allies:['rice','cloth','washbucket','mushroom']},
 cellar:{name:['陈酿投资','Cellar investment'],core:'vintage',support:'cellarpress',relic:'pawnreceipt',event:'spend',every:6,verb:['消耗装袋分','banked points spent'],text:['把装袋分数投入陈酿，再复制养成后的高分食材。','Invest banked points in Vintage, then copy a grown food.'],allies:['mold','oldkey','polishingstone','trashpass']},
};
const def=(type,name,text,extra={})=>({type,name,text,color:'#edbd38',experimental:true,...extra});
export const GROWTH_CARDS={
 stockpot:def('food',['老卤','Stock'],['本局每消耗3张食材，基础分翻倍，同一张每桌计一次。','Every 3 foods consumed doubles this base; each card counts once per table.']),
 sourdough:def('food',['起面团','Sourdough'],['本局每完成3次配对，基础分翻倍，同一对每桌计一次。','Every 3 pairs doubles this base; each exact pair counts once per table.']),
 motherstarter:def('food',['母种','Starter'],['本局每生成4张临时食材，此牌基础分翻倍。','Every 4 temporary foods created this run doubles this card’s base score.']),
 tastingplate:def('food',['百味拼盘','Tasting platter'],['本局每配对2种不同食材，此牌基础分翻倍。','Every 2 different food kinds paired this run doubles this card’s base score.']),
 pickle:def('food',['老坛泡菜','Aged pickles'],['本局每清理2张麻烦，基础分翻倍，同一张每桌计一次。','Every 2 trouble cleared doubles this base; each card counts once per table.']),
 vintage:def('food',['陈酿','Vintage'],['本局每消耗6分装袋分数作为费用，此牌基础分翻倍。','Every 6 banked points spent on costs this run doubles this card’s base score.']),
 mincer:def('tool',['绞肉机','Mincer'],['消耗1张未配对食材，生成2张临时碎肉。','Consume one unpaired food to create two temporary Mince.'],{target:'food'}),
 doughpress:def('tool',['压面机','Dough press'],['生成1张临时起面团原版。','Create one temporary base Sourdough.']),
 sproutbox:def('tool',['育芽箱','Sprout box'],['生成2张临时豆芽。','Create two temporary Sprouts.']),
 tastingfork:def('tool',['试味叉','Tasting fork'],['从桌面未出现的3种食材中选1张，临时上桌。','Choose one of three food kinds absent from the table to create temporarily.']),
 washpress:def('tool',['清洗篮','Washing basket'],['清理1张麻烦，生成1张临时豆芽。','Clear one trouble to create one temporary Sprout.'],{target:'trouble'}),
 cellarpress:def('tool',['留样瓶','Sample bottle'],['消耗4分装袋分数，临时复制1张未配对食材及其成长。','Spend 4 banked points to make a temporary copy of an unpaired food, including its growth.'],{target:'food',bankCost:4}),
 mince:def('food',['碎肉','Mince'],['1分。','Scores 1.'],{baseScore:1,tokenOnly:true}),
 sprouts:def('food',['豆芽','Sprouts'],['1分。','Scores 1.'],{baseScore:1,tokenOnly:true}),
};
const relic=(name,text)=>({name,text,mode:'passive',cost:0,experimental:true});
export const GROWTH_RELICS={
 heirloomladle:relic(['传家汤勺','Heirloom ladle'],['每桌首次消耗食材后将其取回，配对次数不重置。','Reclaim the first food consumed each table without resetting its pairing eligibility.']),
 proofingcloth:relic(['发酵布','Proofing cloth'],['每桌首次配对，生成1张临时万能酱。','Your first pair each table creates one temporary Wild sauce.']),
 nurserypot:relic(['育种盆','Nursery pot'],['每桌首张生成的临时食材加入永久牌组。','The first temporary food created each table joins the permanent deck.']),
 banquetmenu:relic(['宴席名册','Banquet menu'],['每桌第三种食材首次配对时，清理桌面所有麻烦。','Pairing a third food kind each table clears all trouble in play.']),
 bristlebrush:relic(['硬毛刷','Bristle brush'],['每桌首张被清理的非临时麻烦从牌组永久删除。','Permanently remove the first non-temporary trouble cleared each table.']),
 pawnreceipt:relic(['典当收据','Pawn receipt'],['每桌首次消耗装袋分数作为费用，返还一半，向下取整。','Refund half the first banked-point cost each table, rounded down.']),
};
for(const [id,r] of Object.entries(GROWTH_RELICS))r.icon='relic-'+id;
export const GROWTH_PACKAGES=Object.entries(GROWTH_ROUTES).map(([id,r])=>({id:'growth-'+id,name:r.name,cards:[r.core,r.support,id==='pickle'?'oil':'paper']}));
export function registerGrowthContent(cards,relics,packages){
 Object.assign(cards,GROWTH_CARDS);Object.assign(relics,GROWTH_RELICS);
 for(const p of GROWTH_PACKAGES)if(!packages.some(x=>x.id===p.id))packages.push(p);
}
export const growthRoute=c=>Object.values(GROWTH_ROUTES).find(r=>r.core===c.original);
export const growthBase=c=>2*2**Math.max(0,c.growthLevel||0);
export function growthProgress(c,lang='zh',s=null){
 const r=growthRoute(c);if(!r)return '';
 const en=lang==='en',level=c.growthLevel||0,cap=growthCap(s);
 if(c.temporary)return en?`Temporary · base ${growthBase(c)} · does not grow`:`临时 · 基础 ${growthBase(c)} 分 · 不再成长`;
 return en?`Base ${growthBase(c)} · Lv ${level}/${cap} · ${level>=cap?'MAX':`${(c.growthXP||0)%r.every}/${r.every} ${r.verb[1]} → ${growthBase({...c,growthLevel:level+1})}`}`
 :`基础 ${growthBase(c)} 分 · ${level}/${cap}级 · ${level>=cap?'已满级':`${(c.growthXP||0)%r.every}/${r.every} ${r.verb[0]} → ${growthBase({...c,growthLevel:level+1})}分`}`;
}
export function recordGrowth(s,event,data,log){
 if(!s.growth)return;
 const seen=s.growth.seen??={};
 const unique=event==='pair'?data.ids.slice().sort((a,b)=>a-b).join('-'):data.uid;
 if(event!=='spend'){
  const key=`${s.round}:${event}:${unique}`;
  if(seen[key])return;seen[key]=true;
 }
 for(const c of s.cards){
  const r=growthRoute(c);if(!r||c.temporary)continue;
  let amount=0;
  if(r.event===event)amount=event==='spend'?data.n:1;
  if(r.event==='variety'&&event==='pair'){
   c.growthKinds??=[];
   if(!c.growthKinds.includes(data.kind)){c.growthKinds.push(data.kind);amount=1;}
  }
  if(!amount)continue;
  const old=c.growthLevel||0;c.growthXP=Math.min(r.every*growthCap(s),(c.growthXP||0)+amount);
  c.growthLevel=Math.floor(c.growthXP/r.every);
  if(c.growthLevel>old)log(s,'growth',{kind:c.original,uid:c.uid,from:2*2**old,to:growthBase(c)});
 }
}
export function validGrowth(s){
 if(!s.growth)return !s.cards.some(c=>GROWTH_CARDS[c.original]);
 if(!GROWTH_ROUTES[s.growth.route]||!['classic','rising'].includes(s.growth.curve)||!s.growth.seen||typeof s.growth.seen!=='object')return false;
 return s.cards.every(c=>{const r=growthRoute(c);return !r||(Number.isInteger(c.growthLevel??0)&&(c.growthLevel??0)>=0&&(c.growthLevel??0)<=growthCap(s)&&Number.isFinite(growthBase(c))&&Number.isInteger(c.growthXP??0)&&(c.growthXP??0)>=0&&(c.growthXP??0)<=r.every*growthCap(s)&&(!c.growthKinds||Array.isArray(c.growthKinds)));});
}
export const growthRaise=(s,roll)=>s.growth?.curve==='rising'?roll*(growthCurve(s.difficulty)[s.round-1]||growthCurve(s.difficulty).at(-1)):roll;
export function growthDeck(route){
 const r=GROWTH_ROUTES[route];
 const base=['rice','rice','fish','fish','mint','mint','tea','tea','wild','wild','toast','torch','scope','sifter','cloth','candle','bomb'];
 if(route==='broth')base[7]='scoop';
 if(route==='garden'){base[0]='popcorn';base[1]='popcorn';}
 if(route==='pickle'){base[6]='paper';base[7]='oil';}
 if(route==='cellar')base[7]='mold';
 return [r.core,r.core,r.support,...base];
}
export function growthStorage(storage){return {getItem:k=>storage.getItem('growth-lab.v1.'+k),setItem:(k,v)=>storage.setItem('growth-lab.v1.'+k,v),removeItem:k=>storage.removeItem('growth-lab.v1.'+k)};}
