// Hooks receive rule operations rather than importing the engine back into itself.
export function createNightRules(api){
 const {card,CARDS,live,foods,tiredTools,pairGroups,consume,temporary,discard,returnFromDiscard,boost,value,log,requireRule,bankCost,hasFoodCost,storeFood,triggerRelic}=api;
 const note=(s,c,effect,n=1)=>log(s,'nightEffect',{kind:c.kind,uid:c.uid,effect,n});
 const ready=(s,list)=>{for(const c of list){c.tapped=false;log(s,'ready',{kind:c.kind});}};
 const queue=s=>s.nextKitchen??={foods:[],free:0};
 const transform=(s,c,kind)=>{
  requireRule(c&&c.kind!=='bomb'&&CARDS[kind]?.type==='food','target');
  if(c.kind===kind)return false;
  const from=c.kind;c.kind=kind;
  for(const source of live(s).filter(x=>x.kind==='paletteplate'))boost(source,3);
  if(triggerRelic(s,'gildedmask'))temporary(s,kind);
  log(s,'transformFood',{uid:c.uid,from,kind});return true;
 };
 return {
  transform,
  value(s,c){
   if(c.kind==='duetstand')return pairGroups(s).filter(g=>g.length===2&&g[0].kind!==g[1].kind).length*4;
   if(c.kind==='silvertray')return 2**Math.min(5,(c.usedNames||[]).length);
   if(c.kind==='drygoods')return (2+(c.seasoned||0))*(c.pair||c.enchantment==='raw'?2:1);
  },
  toolProblem(s,c){
   if(c.kind==='cookiepress'&&(!s.lastFoodPair||!foods(s).some(x=>x.kind!==s.lastFoodPair)))return 'noTarget';
   if(c.kind==='windingkey'&&(c.usesThisTable||0)>0)return 'noTarget';
   if(c.kind==='windingkey'&&!tiredTools(s,c.uid).length)return 'noTired';
   if(c.kind==='checklist'&&!tiredTools(s,c.uid).some(x=>x.usesThisTable===1))return 'noTired';
  },
  pair(s,kind){
   if(kind==='lunchorder'){queue(s).foods.push('rice');log(s,'nextMeal',{kind:'rice'});return true;}
   if(kind==='firstcourse'){for(const c of live(s).filter(c=>CARDS[c.kind].type==='tool'&&!c.usesThisTable&&hasFoodCost(c)))c.freeCost=true;log(s,'firstService');return true;}
   if(kind==='sourcabbage'){const c=live(s).filter(c=>CARDS[c.kind].type==='trouble').sort((a,b)=>a.entered-b.entered)[0];if(c)transform(s,c,'rice');return true;}
  return false;
  },
  paired(s,pair){
   if(pair.some(c=>c.kind!==c.original)&&triggerRelic(s,'prismseal'))ready(s,tiredTools(s).sort((a,b)=>a.entered-b.entered).slice(0,1));
  },
  consumed(s,c){
   s.relicProgress.consumedFoods=(s.relicProgress.consumedFoods||0)+1;
   if(s.relicProgress.consumedFoods===2&&triggerRelic(s,'bonechina'))temporary(s,'wild');
   if(c.pairedOnce&&triggerRelic(s,'scrapvoucher'))ready(s,tiredTools(s).sort((a,b)=>a.entered-b.entered).slice(0,1));
   if(c.pairedOnce)for(const source of live(s).filter(x=>x.kind==='sauceboat'))boost(source,3);
   if(c.consumedAbilityUsed)return;
   if(c.kind==='crouton'&&c.pairedOnce){c.consumedAbilityUsed=true;temporary(s,'rice');temporary(s,'rice');note(s,c,'crumbs',2);}
   if(c.kind==='spareparts'){c.consumedAbilityUsed=true;ready(s,tiredTools(s).sort((a,b)=>a.entered-b.entered).slice(0,1));note(s,c,'repair');}
  },
  reclaimed(s,c){
   if(CARDS[c.kind].type!=='food')return;
   for(const source of live(s).filter(x=>x.kind==='scrapbasket'&&!x.reclaimUsed)){source.reclaimUsed=true;temporary(s,c.kind);note(s,source,'copy');}
  },
  use(s,c,t){
   if(c.kind==='pastrymold')transform(s,t,'shortbread');
   if(c.kind==='cookiepress')transform(s,t,s.lastFoodPair);
   if(c.kind==='servicepass'){t.costDiscount=(t.costDiscount||0)+2;note(s,c,'discount');}
   if(['banquetfork','servingcloche'].includes(c.kind)){
    const pair=pairGroups(s).find(g=>g.length===2&&g.some(x=>x.uid===t.uid));requireRule(pair,'target');
    const amounts=pair.map(x=>value(s,x)),consumed=pair.map(x=>consume(s,x));
    if(c.kind==='banquetfork')boost(c,amounts.reduce((n,v,i)=>n+(consumed[i]?v:0),0)*2);
    else if(consumed.every(Boolean)){s.freePayments+=3;log(s,'tickets',{n:3});}
   }
   if(c.kind==='thermos')storeFood(s,t);
   if(c.kind==='windingkey'){discard(s,c);ready(s,tiredTools(s,c.uid));}
   if(c.kind==='repairtag')returnFromDiscard(s,t,false);
   if(c.kind==='checklist')ready(s,tiredTools(s,c.uid).filter(x=>x.usesThisTable===1));
  },
  used(s,c){
   for(const source of live(s).filter(x=>x.kind==='silvertray')){
    source.usedNames??=[];if(!source.usedNames.includes(c.kind)){source.usedNames.push(c.kind);note(s,source,'service',source.usedNames.length);}
   }
  },
  revealed(s,c){if(c.kind==='harlequinpudding'&&s.lastFoodPair)transform(s,c,s.lastFoodPair);},
  cash(s){
   for(const c of live(s)){
    if(c.kind==='drygoods'&&c.original==='drygoods'&&!c.temporary&&(c.seasoned||0)<6){c.seasoned=(c.seasoned||0)+1;note(s,c,'seasoned',c.seasoned+2);}
    if(c.kind==='reservationbell'&&s.lastFoodPair){queue(s).foods.push(s.lastFoodPair);log(s,'nextMeal',{kind:s.lastFoodPair});}
   }
  },
  start(s){
   const next=s.nextKitchen;s.nextKitchen=null;s.lastFoodPair=null;
   if(next){next.foods.forEach(kind=>temporary(s,kind));s.freePayments+=next.free;log(s,'kitchenReady',{n:next.foods.length,free:next.free});}
  },
 };
}
