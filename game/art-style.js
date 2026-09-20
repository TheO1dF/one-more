let style='poster';
export const setArtStyle=value=>{style=value==='classic'?'classic':'poster';};
export const getArtStyle=()=>style;
let back='casino';
export const setCardBack=value=>{back=['roulette','midnight','ivory'].includes(value)?value:'casino';};
export const getCardBack=()=>back;
