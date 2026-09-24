import {PALETTE as C} from './poster-art.js';
const p=(d,c)=>`<path d="${d}" fill="${C[c]}"/>`,e=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C[c]}"/>`,r=(x,y,w,h,c,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${C[c]}"/>`;
const cup=(c='orange')=>p('M25 35h45v31q0 15-20 15T25 66Z',c)+p('M62 38h17q16 19-9 26v-9q15-6 6-10H62Z',c)+e(47,35,23,7,'cream')+e(47,35,18,4,'ink');
const tray=()=>e(48,72,38,12,'purple')+e(44,64,38,12,'cream')+e(44,62,30,8,'blue');
const ticket=(color='cream')=>p('m19 14 52 5 7 64-50-2Z',color)+p('m64 19 7 0 7 64-10-6Z','purple')+r(28,32,30,5,'orange')+r(30,46,23,4,'purple');
const lid=()=>e(48,76,37,9,'purple')+p('M13 66q1-39 35-39t35 39Z','cream')+p('M49 27q32 1 34 39H49Z','blue')+r(12,66,73,7,'orange')+e(48,23,8,6,'yellow');
export const NIGHT_ART={
 packingcord:p('m21 18 53-5 10 70-54 6Z','purple')+p('m27 17 51 9-11 61-51-9Z','blue')+r(23,17,49,66,'cream',4)+r(28,23,39,54,'green')+p('m47 29 14 22-14 19-13-19Z','purple')+r(19,43,57,9,'orange')+r(43,13,9,76,'yellow')+p('m47 47-14-11 3 12 11 4 17-12-5 12-12 0Z','purple'),
 'relic-gildedmask':p('M23 20q25-12 51 1l-5 38-21 24-22-24Z','yellow')+p('m25 34 18 5-6 8-13-4m29-4 17-5-1 9-15 4','ink')+p('m38 59 21-3-9 12Z','purple')+p('m49 18 25 3-5 38-20 23Z','orange'),
 'relic-prismseal':p('m18 50 33-37 29 34-30 37Z','purple')+p('m18 50 33-37-1 36Z','cream')+p('m51 13 29 34-30 2Z','blue')+p('m18 50 32-1v35Z','orange')+p('m50 49 30-2-30 37Z','yellow'),
 'relic-bonechina':tray()+p('m30 43 10 5 17-8 10 5-6 6-23 4-12-6Z','yellow')+e(45,63,12,5,'orange'),
 'relic-scrapvoucher':ticket('yellow')+p('m44 29 17 12-17 12v-8H31v-9h13Z','green')+p('m46 55-16 12 16 12v-8h18v-9H46Z','purple'),
 'relic-sealclip':p('M18 23h62v45H18Zm9 9v25h44V32Z','yellow')+p('m18 68 62 0-8 11H25Z','purple')+r(13,22,72,11,'orange')+r(43,31,12,31,'cream'),
 'relic-reservebench':p('m26 13 45 2 3 37-51-2Z','purple')+p('m20 49 56 2 7 13-67-2Z','orange')+p('m20 62 9 0-3 26h-8m49-23 10 0 4 25h-8','yellow')+r(38,24,22,16,'cream'),
 blacktea:e(46,82,33,7,'purple')+cup('orange')+p('M38 26q-8-9 2-20 8 9-2 20M51 24q-5-8 3-17 7 9-3 17','blue'),
 shortbread:p('m16 47 42-25 25 17v25L41 85 16 69Z','purple')+p('m16 42 43-24 24 18-42 25Z','yellow')+p('m16 42 25 19v19L16 64Z','orange')+[[38,39],[51,32],[52,47],[65,40]].map(([x,y])=>e(x,y,3,2,'cream')).join(''),
 pastrymold:p('M19 27h57v47H19Zm10 9v29h38V36Z','blue')+p('m19 27 8-9h56l-7 9Z','cream')+p('m76 27 7-9v48l-7 8Z','purple')+p('m37 44 11-8 12 8-4 16H42Z','orange'),
 duetstand:e(49,83,25,7,'purple')+r(44,17,8,63,'yellow')+e(47,62,37,11,'cream')+e(48,32,26,8,'cream')+p('M27 50h18v12H24Z','orange')+p('m52 50 14-4 9 12-18 6Z','yellow')+'<g transform="translate(26 1) scale(.38)">'+cup('green')+'</g>',
 crouton:[[14,36],[44,21],[51,53]].map(([x,y])=>p(`m${x} ${y} 20-6 15 12-21 7Z`,'yellow')+p(`m${x} ${y} 14 13v21l-14-9Z`,'orange')+p(`m${x+14} ${y+13} 21-7v20l-21 8Z`,'purple')).join(''),
 banquetfork:p('m17 17 8-5 35 54-9 11Z','purple')+p('m19 13 8-5 15 25-8 5Z','cream')+p('m28 7 5-3 17 26-5 4Z','cream')+p('m37 2 5-2 17 27-5 3Z','cream')+p('m54 64 9-6 19 26-13 8Z','orange'),
 servingcloche:lid(),
 sauceboat:tray()+p('M15 35q35 18 65-7l-9 32q-24 18-49-2Z','orange')+p('m68 35 16-16 8 5-10 26Z','cream')+e(45,40,22,6,'yellow'),
 spareparts:[[34,39,-22],[61,63,19]].map(([x,y,a])=>`<g transform="rotate(${a} ${x} ${y})">`+e(x,y,18,26,'cream')+e(x+3,y,11,22,'purple')+e(x+1,y,8,17,'green')+`</g>`).join(''),
 scrapbasket:p('M14 35h68L72 83H25Z','orange')+p('m61 35 21 0-10 48H58Z','purple')+r(11,30,73,8,'yellow')+p('M23 30V16h14v14M39 30V11h18v19M61 30V20h13v10','cream')+r(31,48,7,24,'cream')+r(46,48,7,24,'cream'),
 windingkey:p('M42 39C7 56-5 4 26 14q18 6 20 18 11-27 30-19 27 22-23 32v36H42Z','yellow')+e(24,29,8,6,'ink')+e(65,29,8,6,'ink')+p('M48 43h8v38h-8Z','orange')+r(36,80,26,8,'purple'),
 repairtag:ticket('blue')+p('M46 40 38 48l17 25 8-6-18-25Z','cream')+p('M32 40 38 49l9-5-4-13 10 3 6 15-10 10-13-3-7-12Z','orange'),
 lunchorder:ticket()+p('m40 52 22 5-4 16-23-4Z','green')+r(24,70,31,4,'yellow')+r(68,7,5,18,'orange')+e(70,7,8,5,'purple'),
 thermos:p('M27 28h36l10 9v48H25Z','green')+p('M59 29h7l9 11v45H59Z','purple')+r(26,16,37,12,'cream')+r(28,9,33,9,'orange')+r(24,46,39,21,'cream')+p('M75 36h12v32H75v-8h5V44h-5Z','yellow'),
 reservationbell:lid()+ticket('yellow').replaceAll('19 14','30 7').replaceAll('52 5','30 5'),
 drygoods:p('M19 67q-18-29 8-47 35-18 52 20 4 35-29 43Z','orange')+p('M25 31q23-13 39 15-10 29-34 14-12-11-5-29Z','cream')+p('M32 35q16-3 22 12-8 16-21 8Z','yellow')+p('m30 71 18 12 25-13-22 4Z','purple'),
 harlequinpudding:tray()+p('M31 20h34l13 39q-25 21-53 0Z','cream')+p('M48 20h17l13 39q-14 12-30 10Z','purple')+e(48,20,17,6,'orange')+p('M37 24q9 20 26 11l6 14q-18 9-32-13Z','yellow'),
 cookiepress:p('M29 15h39v10H55v23h17v32H23V48h18V25H29Z','purple')+r(19,48,56,12,'orange')+r(24,69,45,11,'cream')+p('m43 53 8-7 8 7-8 7Z','yellow'),
 paletteplate:p('M19 23q34-27 63 8 20 36-8 50-18 5-17-10 4-18-16-11-35 7-22-37Z','cream')+e(67,43,8,10,'ink')+e(34,30,9,8,'orange')+e(25,46,7,7,'green')+e(50,24,8,6,'purple')+e(74,65,6,6,'yellow'),
 sourcabbage:tray()+p('M20 52q-7-20 15-22-3-19 14-12 25-5 24 17 18 16-4 25Z','green')+p('M28 50q9-23 20-19l5 31Z','yellow')+p('M53 58q0-23 12-26l-4 33Z','cream')+p('M26 49q23 17 47 0l-8 18H33Z','orange'),
 servicepass:ticket('purple')+e(46,58,14,14,'yellow')+p('m46 46 4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1Z','orange'),
 firstcourse:tray()+p('M20 44 32 28l14 19-9 10Z','orange')+p('M48 40 63 25l16 21-11 9Z','green')+p('m27 43 7-27 5 1-7 29M61 44l5-32 5 1-5 34','yellow'),
 checklist:ticket()+p('m27 34 4 5 9-13 4 3-13 18-8-10Z','green')+p('m30 61 4 5 9-13 4 3-13 18-8-10Z','green')+r(51,35,11,4,'purple')+r(52,62,11,4,'purple'),
 silvertray:e(48,67,43,18,'purple')+e(44,56,41,17,'blue')+e(44,53,34,12,'cream')+e(44,53,28,8,'purple')+p('m18 25 8-9 8 9-8 9ZM59 18l9-10 9 10-9 10Z','yellow')+p('m41 35 9-9 9 9-9 9Z','orange'),
};
export function nightIcon(kind,extra=''){return NIGHT_ART[kind]?`<svg class="art night-art ${extra}" viewBox="0 0 96 96" aria-hidden="true">${NIGHT_ART[kind]}</svg>`:null;}
