// Public consumption entries accept a source, never a caller-chosen recovery flag.
export function consumptionOrigin(c,definitions){
 if(!c.consumed&&!c.paid)return null;
 if(['tool','effect'].includes(c.consumptionType))return c.consumptionType;
 if(c.paid||definitions[c.consumedBy]?.type==='tool')return 'tool';
 return 'effect';
}
export const isToolConsumedFood=(c,definitions)=>c.zone==='discard'&&definitions[c.kind]?.type==='food'&&consumptionOrigin(c,definitions)==='tool';
export function clearConsumption(c){c.paid=false;c.consumed=false;delete c.consumedBy;delete c.consumedByUid;delete c.consumptionType;}

export function createConsumption({definitions,active,onTable,discard,onFoodConsumed,log,requireRule}){
 function consume(s,source,c,origin){
  requireRule(source?.zone==='table'&&definitions[source.kind],'source');
  requireRule(origin==='tool'?definitions[source.kind].type==='tool':definitions[source.kind].type!=='tool','source');
  requireRule(c?.zone==='table'&&['food','trouble'].includes(definitions[c.kind]?.type)&&active(c),'target');
  if(c.keepOnce){c.keepOnce=false;log(s,'retained',{kind:c.kind});return false;}
  if(c.pair)onTable(s).filter(x=>x.pair===c.pair).forEach(x=>x.pair=null);
  discard(s,c);
  c.consumed=true;c.consumptionType=origin;c.consumedBy=source.kind;c.consumedByUid=source.uid;
  // Keep existing saves/readers compatible; all tool consumption has this flag.
  c.paid=origin==='tool';
  log(s,'consume',{kind:c.kind,uid:c.uid,source:source.kind,origin});
  if(definitions[c.kind].type==='food')onFoodConsumed(s,c);
  return true;
 }
 return {
  consumeByTool:(s,tool,c)=>consume(s,tool,c,'tool'),
  consumeByEffect:(s,source,c)=>consume(s,source,c,'effect'),
 };
}
