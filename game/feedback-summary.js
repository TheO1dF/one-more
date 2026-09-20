export function feedbackSummary(before,after){
 const entries=after.log.filter(e=>e.id>before.event);
 const grown=[...new Map(entries.filter(e=>e.key==='growth').map(e=>[e.uid,e])).values()];
 const relics=[...new Map(entries.filter(e=>e.key==='relicTrigger').map(e=>[e.relic,e])).values()];
 const created=after.cards.filter(c=>c.zone==='table'&&c.temporary&&!before.cards.some(b=>b.uid===c.uid));
 const removed=before.table.filter(uid=>!after.table.includes(uid));
 return {grown,relics,created,removed,combined:grown.length>=2||relics.length>=3||created.length>=3||removed.length>=3};
}
