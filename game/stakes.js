export const MIDNIGHT_TABLE=5;
export const BOMB_CUT=32;
export const diceFaces=d=>d?.faces||[d?.total||20];
export const fixedDie=n=>n===1||n===20;
export function diceEffects(d){
 const faces=diceFaces(d),trouble=faces.flatMap(n=>n===1?['debt','rust','paper']:n<=5?['paper']:[]);
 return {trouble,boon:faces.includes(20)?'feast':faces.some(n=>n>=15)?'choose':null};
}
export function diceCount(s){return s.dice?.count||(s.dice?.result&&!s.dice.result.faces?1:s.round+1>=MIDNIGHT_TABLE?2:1);}
