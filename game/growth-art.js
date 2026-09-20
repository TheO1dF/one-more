import {PALETTE as P,renderPosterArt} from './poster-art.js';

const p=(d,c)=>`<path d="${d}" fill="${P[c]}"/>`;
const o=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P[c]}"/>`;
const line=(d,c,w=4)=>`<path d="${d}" fill="none" stroke="${P[c]}" stroke-width="${w}"/>`;
const dots=(points,c,r=3)=>points.map(([x,y])=>o(x,y,r,r,c)).join('');

const art={
 stockpot:
  p('M8 42h17v8H14v9H8ZM72 36h16v17H77v-7h-5Z','purple')+
  p('M19 40h57v32q-3 15-28 15T19 72Z','orange')+
  p('M57 40h19v32q-2 11-20 14Z','purple')+
  o(47,39,29,11,'yellow')+o(47,36,29,10,'cream')+
  p('M35 25v-7h20v7h-6v-3h-8v3Z','purple')+
  p('M28 52h23v18H28Z','yellow')+p('M38 65q-10-11 1-10 12-11 7 1Z','green'),
 sourdough:
  p('M10 65 61 49 86 65 38 87Z','yellow')+p('M10 65v9l28 18 48-20v-7L38 87Z','purple')+
  p('M17 58q-5-19 9-27 0-16 18-16 20-9 29 10 18 6 10 27-6 19-35 20-27 1-31-14Z','cream')+
  p('M69 23q21 7 14 29-6 19-35 20l4-11q25-4 17-38Z','yellow')+
  p('M33 30q-9 9-6 22l5-3q-1-9 6-17ZM48 25q-10 11-8 26l5-3q-1-11 8-19ZM64 28q-9 7-9 18l5-2q0-6 8-12Z','orange'),
 motherstarter:
  p('M26 27h43l7 16v34q-6 10-29 10t-23-10V43Z','blue')+
  p('M29 30h30l4 15v34q-18 7-33-1V43Z','cream')+
  p('M27 55q15-7 34 0v25q-19 7-34-2Z','yellow')+
  p('M61 53h14v24q-1 6-14 8Z','orange')+
  dots([[36,64],[48,73],[52,56]],'cream',4)+dots([[37,43],[50,37]],'yellow',3)+
  o(47,25,25,9,'purple')+p('M23 21 34 15h26l12 8-8 16-15-8-15 7-12-9Z','pink')+
  p('m34 15 7 1 8 15-7 3Z','cream'),
 tastingplate:
  o(48,59,39,23,'purple')+o(45,51,39,23,'cream')+o(45,51,30,16,'blue')+
  p('M18 47 30 27h9l12 22-6 7H25Z','yellow')+
  p('M41 36q16-18 37 3L68 53 44 47Z','orange')+p('M52 41 70 44 68 53 44 47Z','pink')+
  p('M31 63q9-20 23-9 14-11 21 2-14 19-44 7Z','green')+
  line('M51 58 63 60','cream',3)+o(67,35,3,3,'cream'),
 pickle:
  p('M28 29h38q17 8 16 25l-7 27q-27 14-52-1l-7-27q-1-16 12-24Z','green')+
  p('M62 29q21 8 20 25l-7 27q-8 5-17 5l8-30Z','purple')+
  o(47,29,25,9,'cream')+p('M25 20h44v9H25Z','orange')+o(47,20,22,7,'pink')+
  p('M33 43 60 41l-2 28-26 3Z','cream')+
  p('M39 61q-5-16 12-14 9 9-6 19Z','green')+line('m39 67 12-18','yellow',3),
 vintage:
  p('M36 16h23v23l13 12v31q-23 10-47-1V51l11-12Z','purple')+
  p('M36 24h8v20L33 55v24l-8 2V51l11-12Z','blue')+
  p('M34 10h27v15H34Z','orange')+p('M53 10h8v15h-8Z','pink')+
  o(47,10,13,4,'yellow')+p('M36 56 66 53v21l-30 4Z','cream')+
  p('m50 56 9 8-7 11-9-8Z','orange')+p('M57 23h6v15l-4-3-4 4Z','yellow'),
 mincer:
  p('M22 50h17v30l16 5v7H11v-8l11-6Z','purple')+
  p('M17 35 60 26 74 39 37 51 17 45Z','cream')+
  p('M17 45 37 51v17L17 61Z','blue')+p('M37 51 70 38v21L37 68Z','purple')+
  p('M20 18 49 12l12 10-26 9Z','yellow')+p('M20 18 35 31l7 10-15 4Z','orange')+
  o(68,50,15,18,'blue')+o(65,48,12,15,'cream')+
  dots([[61,41],[69,45],[60,51],[67,57]],'purple',2.5)+
  line('M17 43H9v21h10','blue',5)+o(19,66,5,8,'orange')+
  line('M59 63v9l8 7m0-14v7l10 8','pink',5),
 doughpress:
  p('M11 68 61 52 85 70 36 88Z','orange')+p('M11 68v9l25 17 49-16v-8L36 88Z','purple')+
  p('M16 33 61 19 78 30 35 44Z','cream')+p('M16 33 35 44v29L16 62Z','blue')+
  p('M35 44 78 30v32L35 77Z','purple')+
  line('M38 48 72 37M39 58 72 47','blue',6)+
  p('M42 58 69 49v18L54 83 35 75l9-10Z','yellow')+
  line('M50 58v12l-8 7m16-22v14l-9 10m16-27v16l-10 11','cream',2.5)+
  line('M78 39 88 36v18','blue',5)+o(88,57,5,8,'orange'),
 sproutbox:
  p('M10 52 61 36 85 49 36 68Z','cream')+p('M10 52 36 68v20L15 74Z','yellow')+
  p('M36 68 85 49l-5 24-44 15Z','purple')+p('M20 53 59 41l15 8-38 13Z','ink')+
  line('M30 55V30m18 19V22m16 22V17','cream',4)+
  p('M30 42Q10 39 17 24q15 0 13 18Zm1-6q1-19 16-17 3 14-16 17ZM48 35Q30 29 35 15q17 2 13 20Zm1-8q6-16 20-12-2 15-20 12ZM64 30q-1-20 16-19 6 13-16 19Z','green')+
  p('M45 72 70 62v6l-25 9Z','pink'),
 tastingfork:
  '<g transform="translate(6 7) scale(.88)">'+
  p('m25 60 8 7-16 21-9-7Z','orange')+p('m32 64 4 4-16 21-3-1Z','purple')+
  p('m28 62 27-32-6-10 5-6 7 7 6-7-7-7 5-5 7 7 6-6 5 5-22 25-28 35Z','blue')+
  p('m28 59 27-32-3-5 3-3 7 8-30 35Z','cream')+
  p('M54 31 72 21l15 13-18 11Z','yellow')+p('M54 31 69 45v18L54 50Z','orange')+
  p('M69 45 87 34v17L69 63Z','purple')+line('m60 38 5 4','cream',3)+'</g>',
 washpress:
  p('M14 38h68L74 76Q46 92 24 76Z','blue')+p('M53 39h29L74 76q-8 8-21 8Z','purple')+
  o(48,37,36,13,'cream')+o(48,37,28,8,'blue')+
  p('M29 39q1-20 17-9 16-14 23 4L51 45Z','green')+
  p('m26 51 5 2 3 21-5-2Zm12 4 5 1 1 22-5-1Zm23-2 5-2-3 22-5 2Zm12-6 5-2-4 20-5 3Z','cream')+
  o(28,15,5,5,'blue')+o(45,9,3,3,'cream')+p('m70 5 7 13q-1 9-9 5-6-3 2-18Z','blue'),
 cellarpress:
  p('M32 23 57 19v14l18 10v37L35 89 20 78V45l12-13Z','blue')+
  p('M57 33 75 43v37L58 84V48l-9-9Z','purple')+
  p('M25 53 57 48v32l-22 5-10-9Z','orange')+p('M25 53 57 48v8l-32 6Z','pink')+
  p('M29 12 53 8l9 6v12l-24 5-9-6Z','yellow')+p('M53 8 62 14v12l-9 2Z','orange')+
  p('M28 62 54 57v16l-26 6Z','cream')+p('m35 63 6 5-5 7-5-5Zm11-2 6 5-5 7-5-5Z','purple'),
 mince:
  p('M9 52 56 24 87 49 67 83 28 88Z','cream')+p('M67 64 87 49 67 83 28 88l12-13Z','blue')+
  p('M19 60 29 42 50 32l25 13 4 19-22 16-28-7Z','orange')+
  p('M29 42 50 32l25 13-5 12-25 12-26-9Z','pink')+
  line('m28 54 16-11 6 4-10 9m10 2 12-9 6 4-10 8','cream',4)+
  p('m52 71 7-5 9 4-9 7Z','pink'),
 sprouts:
  line('M34 29q-15 22-12 42l10 7M51 23q-20 32-11 54l9 5M69 33Q47 55 58 77l10 5','cream',6)+
  p('M34 33Q13 25 23 12q19-3 11 21Zm2-6q0-18 17-15 7 12-17 15ZM51 25Q34 14 46 5q18 1 5 20ZM68 38q-15-12-6-23 18 0 6 23Zm1-8q3-16 19-9 0 14-19 9Z','green')+
  o(32,79,6,4,'yellow')+o(50,82,6,4,'yellow')+o(69,81,6,4,'yellow'),
 'relic-heirloomladle':
  p('m58 10 8-4 9 6-32 59-9-6Z','yellow')+p('m69 11 6 1L43 71l-5-3Z','orange')+
  o(24,70,21,16,'purple')+p('M6 63q17-15 40-1l-6 17q-16 13-30-2Z','orange')+
  o(26,61,20,10,'cream')+o(26,61,13,5,'yellow')+o(65,14,3,3,'purple'),
 'relic-proofingcloth':
  p('M15 54h67L72 79q-29 16-49 0Z','purple')+o(47,53,34,14,'yellow')+
  p('M11 47q7-26 38-25 26 0 37 24L75 73 55 64 37 85 23 68 8 72Z','cream')+
  p('M49 22q26 0 37 24L75 73 55 64l6-19Z','pink')+
  p('M37 85 42 49 55 64Z','blue')+p('M17 36 23 30l9 35-7 9-2-6Z','orange')+
  p('M64 29 71 34 79 61l-4 12-3-1Z','cream'),
 'relic-nurserypot':
  p('M22 50h56L68 82q-21 12-37-1Z','orange')+p('M56 50h22L68 82l-16 6Z','purple')+
  o(49,49,31,11,'yellow')+o(49,46,31,10,'cream')+o(49,46,24,6,'ink')+
  line('M49 50 45 18','cream',5)+
  p('M47 34Q17 34 22 10q28 0 25 24Zm2-9Q59 3 80 14 78 36 49 25Z','green')+
  p('m27 15 18 14-1 5q-17-1-17-19Z','blue')+p('M34 59h13v13H34Z','pink'),
 'relic-banquetmenu':
  p('M11 21 41 15l15 5 25-5 4 65-30 7-17-5-22 6Z','green')+
  p('M16 26 39 21l15 5 22-5 3 51-25 7-14-6-19 6Z','cream')+
  p('M39 21 54 26v53l-14-6Z','blue')+
  line('m23 39 11-3m-9 14 9-3m-8 14 9-3m24-20 12-3m-12 15 13-3','purple',3)+
  o(69,69,14,14,'orange')+o(67,66,8,8,'pink')+p('m63 65 4-4 4 5-4 6Z','cream'),
 'relic-bristlebrush':
  p('M17 56 37 69 84 49v19L38 88 20 75Z','purple')+
  p('M20 58 38 70v14L23 73Z','blue')+
  p('m41 69 6-2v15l-6 3Zm11-5 6-2v15l-6 3Zm11-4 6-2v15l-6 3Zm11-5 6-2v15l-6 3Z','cream')+
  p('M14 48 60 29 86 46 37 66Z','yellow')+p('M14 48 37 66v7L16 57Z','orange')+
  p('M37 66 86 46v8L37 73Z','purple')+p('M39 41 32 16l12-7 12 25Z','orange')+
  p('M44 9 56 34l-7 4-12-25Z','pink'),
 'relic-pawnreceipt':
  p('M21 13 63 7l13 72-8-4-6 8-9-4-7 9-9-4-6 7Z','blue')+
  p('M17 10 59 4l12 73-8-4-6 8-8-4-7 9-9-4-6 8Z','cream')+
  line('m26 24 24-4m-22 15 25-4m-23 14 17-3','purple',4)+
  p('m31 54 22-3 2 11-22 3Z','orange')+
  o(68,73,19,17,'orange')+o(65,66,19,17,'yellow')+o(65,66,12,11,'cream')+
  p('m65 57 6 8-6 9-6-8Z','orange'),
};

export function growthIcon(kind,extra=''){
 return art[kind]?renderPosterArt(kind,art[kind],extra):null;
}
