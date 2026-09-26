import {CARDS} from './cards.js';

const cue=(motion,pattern,duration=850)=>Object.freeze({motion,pattern,duration});
// Tools share physical verbs, not rules. Outcomes below come only from committed state.
export const TOOL_PERFORMANCES=Object.freeze({
 torch:cue('scan','beam',560),scope:cue('scan','radar',650),magnifier:cue('scan','lens',600),sifter:cue('sift','sieve',650),
 sorter:cue('deal','deal',650),tastingfork:cue('deal','deal',650),
 cloth:cue('wipe','wipe',720),washbucket:cue('wash','wash',850),fan:cue('fan','wind',650),washpress:cue('wash','wash',850),
 jar:cue('stir','ferment',950),stove:cue('cook','flame',950),grill:cue('cook','grill',950),steamer:cue('steam','steam',900),
 juicer:cue('crush','juice',1000),mincer:cue('crush','cut',1000),cleaver:cue('cut','cut',850),banquetfork:cue('serve','scoop',900),
 mold:cue('copy','copy',1000),cookiepress:cue('press','stamp',950),pastrymold:cue('press','stamp',1000),doughpress:cue('press','stamp',950),cellarpress:cue('copy','copy',1000),
 bell:cue('ring','bell',650),checklist:cue('check','bell',650),windingkey:cue('wind','sparks',850),whetstone:cue('sharpen','sparks',800),
 scoop:cue('lift','scoop',950),magnet:cue('pull','magnet',950),repairtag:cue('repair','magnet',950),
 compostfork:cue('grow','roots',950),sproutbox:cue('grow','roots',950),
 stamp:cue('stamp','stamp',800),servicepass:cue('stamp','stamp',720),menu:cue('fanout','menu',650),
 tray:cue('return','return',900),cardcutter:cue('cutdeck','cut',720),
 thermos:cue('store','steam',1000),packingcord:cue('tie','seal',1100),servingcloche:cue('cover','seal',950),ladle:cue('keep','seal',850),
});

export function cardPerformancePlan(action,before,after){
 const old=new Map(before.cards.map(c=>[c.uid,c])),now=new Map(after.cards.map(c=>[c.uid,c]));
 const sourceId=action.type==='resolvePairEffect'?before.pending?.ids?.[0]:action.uid??action.ids?.[0]??before.pending?.source??(action.type==='draw'?before.draw[0]:null);
 const source=old.get(sourceId),tool=action.type==='use'?TOOL_PERFORMANCES[source?.kind]:null;
 const revealed=new Set(action.type==='draw'?[before.draw[0],...(before.staples||[]).filter(b=>b.uids.includes(before.draw[0])).flatMap(b=>b.uids)]:[]);
 const transformed=after.cards.filter(c=>old.has(c.uid)&&old.get(c.uid).kind!==c.kind&&c.zone==='table').map(c=>({from:old.get(c.uid),to:c}));
 const arrivals=after.cards.filter(c=>c.zone==='table'&&old.get(c.uid)?.zone!=='table'&&!revealed.has(c.uid)).map(c=>({card:c,origin:old.get(c.uid)?.zone||'created'}));
 const removed=before.cards.filter(c=>c.zone==='table'&&now.get(c.uid)?.zone!=='table').map(c=>({from:c,to:now.get(c.uid)}));
 const readied=after.cards.filter(c=>c.zone==='table'&&CARDS[c.kind]?.type==='tool'&&old.get(c.uid)?.tapped&&!c.tapped);
 const sealed=after.cards.filter(c=>c.zone==='parcel'&&old.get(c.uid)?.zone!=='parcel');
 const entries=after.log.filter(e=>e.id>before.event);
 const peeked=entries.some(e=>e.key==='peek')?after.known.filter(uid=>!before.known.includes(uid)):[];
 const targets=[...new Set([action.target,...(action.targets||[]),...transformed.map(x=>x.to.uid),...removed.map(x=>x.from.uid)])].filter(Number.isInteger);
 return {source,tool,transformed,arrivals,removed,readied,sealed,peeked,targets,
  consumed:removed.filter(x=>x.to?.zone==='discard'&&x.to.consumed),
  // A normal pair needs only table movement and its score. No generic burst.
  active:!!tool||!!(transformed.length||arrivals.length||removed.length||readied.length||peeked.length),
 };
}
