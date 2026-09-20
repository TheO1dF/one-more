const P={cream:'#fff8e8',red:'#ff4928',yellow:'#edbd38',green:'#339563',purple:'#574798',ink:'#161936',blue:'#81b8ba'};
const p=(d,color)=>`<path d="${d}" fill="${P[color]}"/>`,c=(x,y,r,color)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${P[color]}"/>`;
const art={
 stockpot:p('M13 35h70v37L71 85H26L13 72Z','red')+p('M4 38h14v14H4Zm74 0h14v14H78Z','purple')+p('M12 29h72v8H12Zm29-12h15v12H41Z','yellow')+p('M24 52h48v19H24Z','cream')+c(49,61,6,'green'),
 sourdough:p('M9 61Q6 18 48 17q43 0 39 44L73 80H25Z','yellow')+p('M11 61h75L73 80H25Z','red')+p('m25 40 8-12 5 3-8 12Zm18 0 8-12 5 3-8 12Zm18 0 8-12 5 3-8 12Z','cream'),
 motherstarter:p('M27 18h44l5 62H21Z','cream')+p('M22 49h53l1 31H21Z','yellow')+p('M24 10h49v12H24Z','purple')+c(36,58,5,'red')+c(58,69,7,'red')+c(53,38,4,'green')+c(38,27,3,'green'),
 tastingplate:c(48,48,39,'cream')+c(48,48,30,'purple')+p('M47 19v28H20Z','yellow')+p('m52 23 25 23H52Z','red')+p('M24 52h23v25Z','green')+c(64,64,11,'blue'),
 pickle:p('M27 21h42l9 22-5 39H23l-5-39Z','green')+p('M25 13h47v13H25Z','purple')+p('M21 41h55v30H21Z','cream')+p('m28 53 30-8 5 7-30 9Zm14 10 22-9 5 8-22 9Z','green'),
 vintage:p('M37 11h23v27l11 12v34H27V50l10-12Z','purple')+p('M34 9h29v10H34Z','yellow')+p('M28 57h42v19H28Z','cream')+p('m49 59 8 8-8 8-8-8Z','red'),
 mincer:p('M13 35h60v23H34v25H13Z','blue')+p('M17 20h34l-6 15H23Z','yellow')+c(67,47,17,'purple')+c(67,47,9,'cream')+p('M79 44h11v31H79ZM9 82h46v7H9Z','red')+c(65,44,2,'ink')+c(69,50,2,'ink'),
 doughpress:p('M15 17h65v10H15Zm6 10h8v56h-8Zm48 0h8v56h-8Z','purple')+p('M42 8h12v40H42ZM32 44h34v10H32Z','blue')+p('M20 70q25-31 54 0v11H20Z','yellow')+p('M10 82h77v7H10Z','red'),
 sproutbox:p('M12 44h73L75 84H22Z','yellow')+p('m47 67-3-37h7l2 37Z','green')+p('M46 43Q13 44 20 15q27 1 26 28Zm6-5Q79 39 79 13 54 14 52 38Z','green')+p('M16 60h65l-4 11H19Z','red'),
 tastingfork:p('M24 13h7v20h8V13h7v20h8V13h7v29L48 54v33H35V54L24 42Z','yellow')+c(69,68,17,'red')+p('m63 64 6-11 6 11-6 11Z','cream'),
 washpress:p('M12 35h73L73 80H24Z','blue')+p('M9 30h79v9H9Z','purple')+p('m29 42 5 30h6l-4-30Zm21 0v30h6V42Zm18 0-5 30h6l6-30Z','cream')+c(29,19,7,'blue')+c(62,15,10,'blue'),
 cellarpress:p('M24 33h49v51H24Z','blue')+p('M29 18h39v20H29Z','purple')+p('M34 9h29v14H34Z','yellow')+p('M24 53h49v20H24Z','cream')+p('m39 57 10 8-10 8Zm13 0 10 8-10 8Z','red'),
 mince:p('m15 60 9-26 28-12 28 20 4 30-23 13-32-4Z','red')+p('m29 47 9-11 5 4-9 11Zm21 15 9-11 5 4-9 11Zm-22 7 9-11 5 4-9 11Z','cream'),
 sprouts:p('m29 77 11-52 6 2-11 52Zm23 6 10-48 6 2-10 48Z','cream')+p('M42 35Q14 24 28 9q22 1 14 26Zm20 13q-12-33 11-31 15 17-11 31Z','green'),
 'relic-heirloomladle':p('m60 9 12 6-28 54-11-6Z','yellow')+p('M10 58q28-11 44 10Q38 97 14 80Z','red'),
 'relic-proofingcloth':p('m12 28 57-17 17 59-57 18Z','purple')+p('m20 40 54-16 3 8-55 16Zm6 24 54-16 3 8-55 16Z','cream')+c(48,48,12,'yellow'),
 'relic-nurserypot':p('M20 48h58L68 86H30Z','red')+p('M15 40h68v14H15Z','yellow')+p('M46 47V16h7v31Z','green')+p('M49 36Q18 35 23 13q26 0 26 23Zm3-5Q74 34 81 12 56 10 52 31Z','green'),
 'relic-banquetmenu':p('m21 8 58 11-14 69L7 77Z','cream')+p('m30 19 34 7-2 8-34-7Zm-5 23 33 7-2 7-33-7Zm-4 20 34 7-2 7-34-7Z','purple')+c(70,70,17,'red'),
 'relic-bristlebrush':p('m16 53 53-21 17 23-53 21Z','yellow')+p('m31 75 56-22-1 19-49 19Z','purple')+p('m46 40-7-24 13-6 9 25Z','red')+p('m42 75 4-2-1 13-4 1Zm14-6 4-2-1 15-4 1Zm14-5 4-2-1 14-4 1Z','cream'),
 'relic-pawnreceipt':p('M18 9h59v77l-10-7-10 7-10-7-10 7-10-7-9 7Z','cream')+p('M28 23h37v7H28Zm0 16h27v7H28Z','purple')+c(63,65,21,'yellow')+p('m61 52 8 7-8 7-8-7Zm-5 19h16v5H56Z','red'),
};
export function growthIcon(kind,extra=''){return art[kind]?`<svg class="art ${extra}" viewBox="0 0 96 96" aria-hidden="true">${art[kind]}</svg>`:null;}
