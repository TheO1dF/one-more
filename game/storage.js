export const META_KEY='one-more.player.v1';
const CLEAN_KEY='one-more.clean.v060';
export function cleanLegacy(storage){
 if(storage.getItem(CLEAN_KEY))return;
 const keys=Array.from({length:storage.length},(_,i)=>storage.key(i));
 for(const key of keys)if(key&&(/^(one-more[.:-]|onemore[.:-]|pushluck[.:-]|push-luck[.:-])/i.test(key)))storage.removeItem(key);
 storage.setItem(CLEAN_KEY,'1');
}
export function playerMeta(storage){try{return {...{tutorialComplete:false,storySeen:false,loops:0},...JSON.parse(storage.getItem(META_KEY)||'{}')};}catch{return {tutorialComplete:false,storySeen:false,loops:0};}}
export function writeMeta(storage,meta){try{storage.setItem(META_KEY,JSON.stringify(meta));}catch{}}
