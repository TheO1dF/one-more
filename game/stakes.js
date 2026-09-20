import {ruleDiceCount} from './unlock-data.js';
export const MIDNIGHT_TABLE=5;
export const BOMB_INTERVAL=20;
export const STARTING_ORDINARY=19;
export function bombGrowth(s,extra=0){
 const ordinary=s.cards.filter(c=>!c.temporary&&c.original!=='bomb').length+extra;
 const current=s.cards.filter(c=>!c.temporary&&c.original==='bomb').length;
 const interval=s.difficulty>=3?15:BOMB_INTERVAL,base=s.challenge==='doublebomb'?2:1;
 const required=base+Math.floor(Math.max(0,ordinary-STARTING_ORDINARY)/interval);
 const total=Math.max(current,required);
 return {ordinary,current,total,added:total-current,interval,until:STARTING_ORDINARY+(total-base+1)*interval-ordinary};
}
export const diceFaces=d=>d?.faces||[d?.total||20];
export const fixedDie=n=>n===1||n===20;
export function diceEffects(d){
 const faces=diceFaces(d),trouble=faces.flatMap(n=>n===1?['debt','rust','paper']:n<=5?['paper']:[]);
 return {trouble,boon:faces.includes(20)?'feast':faces.some(n=>n>=15)?'choose':null};
}
export function diceCount(s){return s.dice?.count||(s.dice?.result&&!s.dice.result.faces?1:ruleDiceCount(s));}
