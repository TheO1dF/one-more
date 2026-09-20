// Flat spot-colour artwork. Coordinates are shared; silhouettes are hand-defined.
export const PALETTE={ink:'#161936',cream:'#fff8e8',orange:'#ff4928',green:'#339563',purple:'#574798',pink:'#df5196',yellow:'#edbd38',blue:'#81b8ba'};
const P=PALETTE,p=(d,c='ink')=>`<path d="${d}" fill="${P[c]||c}"/>`,r=(x,y,w,h,c='ink',rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${P[c]||c}"/>`,o=(x,y,rx,ry,c='ink')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P[c]||c}"/>`,line=(d,c='cream',w=4)=>`<path d="${d}" fill="none" stroke="${P[c]||c}" stroke-width="${w}"/>`;
const dots=(points,c='ink',size=3)=>points.map(([x,y])=>o(x,y,size,size,c)).join('');
const bowl=(c='orange')=>p('M13 43h68L69 77H27Z',c)+p('M47 43h34L69 77H47Z','purple')+o(47,43,34,11,'cream')+o(47,43,27,7,'green');
const cup=(c='cream')=>line('M67 37h15v22H67',c,7)+p('M21 28h48v44H31L21 60Z',c)+p('M53 28h16v44H53Z','purple')+o(45,28,24,7,'ink');
const bottle=(c='orange')=>r(39,9,20,13,'ink')+p('M38 22h22v12l12 14v36H26V48l12-14Z',c)+p('M59 22v13l13 13v36H58Z','purple')+r(27,50,31,21,'cream');
const box=(c='green')=>p('M16 29 63 17 83 31 35 44Z','cream')+p('M16 29 35 44v42L16 69Z',c)+p('M35 44 83 31v42L35 86Z','purple');
const tin=(c='orange')=>r(23,23,47,58,c)+o(46.5,23,23.5,8,'cream')+r(57,26,13,54,'purple')+o(46,23,16,4,'ink');
const plate=()=>o(48,63,38,20,'purple')+o(43,54,36,19,'cream')+o(43,54,27,12,'blue');
const bell=(c='yellow')=>p('M15 67h68v11H15Z','ink')+p('M21 65q0-39 28-39t28 39Z',c)+p('M50 26q27 0 27 39H50Z','orange')+r(45,17,8,12)+r(36,14,26,6,'cream');
const tongs=()=>line('M27 13 60 76 77 67M28 13 36 81 17 81','blue',9)+p('M24 12h10l4 18H22Z','orange');
const bag=(c='orange')=>line('M30 29V16h29v13','ink',6)+p('M17 29h55l9 53H11Z',c)+p('M59 29h13l9 53H58Z','purple');
const stamp=()=>p('M33 15h30v14L55 45l26 10v24H16V55l26-10-9-16Z','purple')+r(16,56,65,13,'orange')+r(22,73,53,9,'cream');
const bin=()=>p('M20 28h58l-6 55H27Z','green')+p('M54 28h24l-6 55H55Z','purple')+r(15,19,69,11,'ink')+r(36,10,26,9,'orange');
const paper=()=>p('M24 12h46l9 69H18Z','cream')+p('M61 12h9l9 69H65Z','blue');
const spade=p('M48 14C37 31 16 34 18 51c1 14 20 21 27 6l-4 23h17l-5-23c9 14 27 8 27-6C81 35 62 30 48 14Z');
export const POSTER_SHAPES={
 rice:p('M13 72 40 18h13l29 54-7 10H19Z','cream')+p('M49 18h4l29 54-7 10H56Z','blue')+p('M30 55h30v27H30Z','green')+dots([[31,39],[45,30],[57,45]],'orange',2),
 fish:p('M9 25 30 40Q57 9 87 45 64 75 30 55L9 71Z','orange')+p('M30 47h57Q63 75 30 55Z','purple')+p('M43 37 53 19l12 13Z','yellow')+o(71,40,4,4,'cream')+o(72,40,2,2)+line('M38 40 48 46 38 53','cream',3),
 mint:p('M22 33 5 20v45l20-9M72 33l19-13v45L72 56','purple')+o(48,46,27,27,'green')+p('M48 19a27 27 0 0 1 27 27H48V19M48 46v27A27 27 0 0 1 21 46Z','cream')+o(48,46,9,9,'pink'),
 wild:bottle()+p('m43 52 4 5 7-2-2 7 4 4-7 1-4 6-2-7-6-2 6-4Z','green'),
 cola:tin()+p('M23 38 57 49v14L23 51Z','cream')+r(34,16,19,4,'purple'),
 popcorn:p('M18 43h61L69 84H29Z','orange')+p('M34 43h8v41h-6Zm20 0h9l-4 41h-8Z','cream')+p('M18 43 13 27l13-11 12 6 11-12 17 8-1 10 18 1-4 17Z','yellow')+dots([[29,30],[48,26],[63,35]],'cream',7),
 tea:cup('green')+r(9,80,74,5,'cream')+line('M34 15V3m17 12V3','cream',5),
 toast:p('M23 41C-2 12 91 0 79 33l-5 11v40H23Z','orange')+p('M30 38C8 19 76 10 70 32l-5 13v31H31Z','yellow')+dots([[39,36],[52,46],[40,60],[57,65]],'orange',3),
 ginger:p('M16 64 28 52 21 28 34 21 44 40 51 9 66 13 62 40 78 33 86 47 67 58 76 77 59 87 46 66 30 79Z','yellow')+p('M46 66 62 40l5 18 9 19-17 10Z','orange')+line('m29 43 9-4m15-17 10 3','cream',4),
 dumpling:p('M11 57q7-45 69-34L75 70 38 85Z','yellow')+p('M11 57 40 65l40-42-5 47-37 15Z','orange')+line('m18 44 15 10m-4-21 12 13m3-19 8 12m8-17 3 9','cream',5),
 egg:o(53,54,29,35,'purple')+p('M45 9C29 9 9 44 16 65c8 30 59 23 61-1C79 41 61 9 45 9Z','cream')+o(46,56,17,19,'yellow')+p('M47 39q20 1 16 22L47 74Z','orange'),
 mushroom:p('M37 44h21l10 39H29Z','cream')+p('M48 44h10l10 39H48Z','blue')+p('M9 51Q43-25 87 47l-3 9H12Z','orange')+dots([[35,27],[63,36],[24,46]],'cream',6),
 lemon:p('M10 41 22 36q13-32 48-12l14-4-3 17Q72 77 34 70l-9 5-3-12Z','yellow')+p('M22 63 81 37Q71 78 34 70l-9 5Z','orange')+p('M65 18q1-16 24-13L76 24Z','green'),
 shrimp:p('M80 24 57 8 24 20 9 48 24 75 50 81l24-14-6-17-17 12-18-8 5-16 19-5 17 4Z','pink')+line('m25 22 16 15M14 41l22 4M22 67l17-14m4 26 5-18','cream',5)+p('M76 44 90 45 80 60l8 13-21-4Z','orange'),
 noodle:bowl('yellow')+line('M21 42q4-20 12 0t15 0 16 0 10 0','yellow',4)+line('M39 8 70 48M50 5l29 42','ink',4),
 cheese:p('M15 41 70 17 81 70 19 85Z','yellow')+p('M15 41 19 85 37 76 34 38Z','orange')+dots([[49,46],[65,37],[59,66],[26,60]],'cream',5),
 chili:p('M72 22q28 36-49 66L10 80q41-15 37-50Z','orange')+p('M47 30 57 13l15 9 11 2-9 13Z','green')+line('M63 18 67 5','ink',5),
 coffee:cup('orange')+o(45,28,16,4,'yellow')+p('M31 47h14v18H31Z','cream')+line('M34 28v20','cream',2),
 cake:p('M16 39 69 18 83 67 28 84Z','pink')+p('M16 39 28 84 48 77 37 34Z','orange')+p('M16 39 69 18 78 29 27 51Z','cream')+line('m26 65 53-18','cream',6)+o(57,20,8,8,'orange')+line('m58 13 4-8','green',3),
 salad:bowl('pink')+p('M16 40 23 23 36 33 44 19 56 36 70 28l10 15Z','green')+dots([[30,38],[63,38]],'orange',7)+line('m42 36 7 5','yellow',4),
 marshmallow:p('M25 18h41l13 14v47H33L19 65V29Z','cream')+p('M66 18 79 32v47H64Z','pink')+p('M25 18h41L53 32H19Z','blue'),
 cookie:o(51,54,33,30,'purple')+o(45,46,33,30,'yellow')+dots([[27,36],[49,25],[61,47],[38,56],[24,53],[50,65]],'ink',4)+dots([[39,36],[54,54]],'orange',4),
 skewer:line('M15 87 79 10','ink',5)+p('m21 58 12-13 23 19-13 14Z','orange')+p('m37 36 13-14 24 17-13 14Z','yellow')+p('m56 17 12-10 18 13-10 13Z','green'),
 pear:p('M39 21c-12 3-9 22-18 33C-5 86 79 99 80 66c0-21-20-26-21-42Z','yellow')+p('M56 24c3 19 24 24 24 42 0 14-15 22-30 20L56 24Z','orange')+line('M47 25 49 6','ink',5)+p('M49 11 69 4l-7 16Z','green'),
 tofu:box('cream')+p('M16 29 63 17 83 31 35 44Z','yellow')+line('m35 24 22 14M50 21l20 14','cream',2),
 icecream:p('M28 51h41L48 91Z','yellow')+p('M48 91 69 51H49Z','orange')+o(35,40,19,20,'pink')+o(59,37,20,23,'cream')+p('M19 49h59v9H19Z','purple'),
 sushi:p('M16 37 57 15 80 34 76 69 33 87 16 72Z','ink')+p('M16 37 57 15 80 34 37 57Z','cream')+p('M24 37 55 22 70 34 38 49Z','orange')+p('M35 33 54 24l12 10-23 9Z','yellow'),
 juice:p('M24 23h51L66 84H33Z','cream')+p('M29 40h40l-5 39H35Z','orange')+line('M53 61 68 8h18','purple',5)+o(23,27,14,14,'yellow')+o(23,27,8,8,'orange'),
 torch:p('M17 69 52 32 73 51 35 87Z','orange')+p('M37 45 49 20 67 13 89 35 80 53 58 63Z','purple')+p('M49 20 67 13 89 35 80 53Z','cream')+p('M67 13 78 0h18v26l-7 9Z','yellow')+r(35,58,7,10,'cream'),
 scope:p('M19 15h54v26H49v43H23V56h10V30H19Z','blue')+r(62,10,21,35,'orange')+r(69,13,14,27)+r(16,73,39,13,'purple')+r(34,33,8,35,'cream'),
 sorter:tongs(),
 cloth:p('M14 24 66 12 83 75 30 86Z','pink')+p('M14 24 31 37 83 25 66 12Z','cream')+line('m24 49 53-12m-47 25 49-11m-38-31 14 63','orange',7),
 jar:o(49,62,32,24,'purple')+p('M24 27h48l9 20-4 32H20l-5-32Z','orange')+r(18,17,60,13,'cream')+r(23,48,48,22,'yellow')+p('m46 49 9 7-6 10-8-8Z','ink'),
 wish:p('M29 14 63 6 79 81 44 89Z','pink')+o(46,24,5,5,'ink')+line('M44 22 24 5','cream',4)+line('m45 43 18-4m-14 18 18-4m-14 18 18-4','ink',4),
 bell:bell()+line('M13 23 7 17m76 6 6-6','pink',5),
 stove:r(15,36,66,49,'purple')+r(10,30,76,10,'cream')+r(24,50,44,32,'ink')+p('M36 76q-12-17 8-31-1 15 9 9 17 18 4 22Z','orange')+p('M46 76q-7-13 4-17l5 17Z','yellow'),
 relay:bell('pink')+p('M64 9h21v21l-7-7-12 12-7-7 12-12Z','green'),
 candle:r(34,33,26,41,'cream')+r(51,33,9,41,'blue')+p('M47 28C19 13 53-2 50 3c17 13 11 22-3 25Z','orange')+p('M47 25 42 13l8 5Z','yellow')+r(17,78,64,8,'purple')+r(42,70,12,13,'purple'),
 sifter:line('M58 58 85 87','orange',12)+o(40,37,30,30,'ink')+o(40,37,23,23,'cream')+line('M21 28h39M18 39h44M25 50h28M29 18v36M41 15v44M52 21v31','blue',3),
 timetable:paper()+r(24,24,45,12,'purple')+line('M26 46h38M28 58h36M31 69h32','ink',3)+line('M41 39v36','orange',4),
 fridge:r(23,10,51,74,'blue')+r(64,10,12,74,'purple')+line('M23 35h51','ink',4)+r(30,20,5,9,'cream')+r(30,42,5,20,'cream')+r(28,84,8,5,'ink')+r(64,84,8,5,'ink'),
 juicer:p('M23 10h53l-8 48H32Z','cream')+p('M29 29h42l-6 26H35Z','orange')+line('M77 19h11v26H72','purple',5)+r(25,63,50,22,'purple')+p('M33 56h33l9 8H25Z','blue')+o(49,74,6,6,'yellow'),
 mold:p('M11 29 65 12 86 66 30 85Z','purple')+p('M17 32 61 19 78 60 32 74Z','blue')+p('m23 39 18-8 9 20-19 8Zm29-7 10-3 9 23-11 3Z','ink'),
 composter:bin()+p('M33 57q-2-16 15-16v20l14-17q12 15-10 24Z','yellow'),
 dishwasher:r(16,12,64,72,'blue')+r(16,12,64,16,'purple')+o(69,20,4,4,'orange')+r(25,38,46,36,'ink')+line('M33 45v22m13-22v22m13-22v22','cream',5),
 grill:line('M25 59 15 85m56-26 11 26','ink',6)+p('M11 36h75L72 65H25Z','orange')+o(48,36,37,15,'ink')+line('m23 28 9 18m7-24 9 28m7-27 9 24m6-17 5 9','cream',3),
 steamer:o(49,67,34,16,'purple')+r(15,32,68,34,'yellow')+o(49,32,34,16,'cream')+line('M22 48h54M25 56h49','orange',4)+p('M17 30 47 8 79 30Z','yellow')+r(41,7,15,8,'orange'),
 cleaver:p('M12 19h65v42H42L12 47Z','cream')+p('M12 47 42 61h35v-9H42Z','blue')+p('M57 61h20v29H57Z','orange')+o(23,29,4,4,'ink'),
 scoop:line('M63 51 86 86','orange',11)+o(36,31,27,25,'blue')+o(36,30,22,20,'cream')+dots([[26,23],[41,21],[50,33],[33,35],[25,40]],'ink',3),
 compostfork:line('M21 12v30h42V12M42 9v75','blue',8)+p('M29 65h25v23H29Z','orange')+r(27,84,29,7,'purple'),
 stamp:stamp(),
 magnifier:line('M59 57 85 83','orange',12)+o(38,35,29,29,'purple')+o(38,35,22,22,'cream')+o(38,35,15,15,'blue')+line('M38 24v22M27 35h22','ink',3),
 fan:r(10,12,77,73,'blue')+o(48,48,32,32,'ink')+p('M45 46C1 48 34 1 48 30l5 14C70 3 99 54 65 56l-12-3C73 89 19 94 32 65Z','cream')+o(48,48,8,8,'orange'),
 washbucket:p('M17 30h65L71 84H28Z','blue')+p('M57 30h25L71 84H58Z','purple')+line('M23 38V17q25-23 49 0v21','ink',5)+o(49,31,32,8,'cream')+dots([[34,28],[54,29],[47,15]],'cream',7),
 tray:plate()+p('M25 26h37v-9l20 19-20 18V43H25Z','orange'),
 menu:p('M14 18 45 23 77 14v68l-32 8-31-7Z','purple')+p('M19 24 43 28v53l-24-4Z','cream')+p('M48 28 71 23v51l-23 7Z','yellow')+line('M25 40h12m-12 11h12m18-15 12-3m-12 15 12-3','ink',3),
 magnet:p('M15 15h23v43q10 20 22 0V15h23v45q-10 53-57 21L15 60Z','orange')+r(15,15,23,21,'cream')+r(60,15,23,21,'blue')+p('M60 58q-8 25-22 0l-9 10q23 36 40-2Z','purple'),
 whetstone:p('M10 50 63 26 88 44 35 70Z','blue')+p('M10 50 35 70v15L10 65Z','purple')+p('M35 70 88 44v14L35 85Z','ink')+p('M27 21 51 11 67 33 43 45Z','cream')+p('m59 4 7 12 11-8-5 14 13 4-15 4Z','yellow'),
 ladle:bag('green')+p('m30 49 15 3 8-13 4 17 14 2-12 9 1 13-12-9-13 4 5-14Z','cream'),
 picnic:box('orange')+line('M29 31 39 4l33 5 4 18','ink',7)+line('m42 55 34-9m-32 21 31-9','yellow',5),
 pantry:r(17,13,61,71,'purple')+r(22,18,22,59,'yellow')+r(49,18,23,59,'cream')+r(37,42,4,14,'ink')+r(52,42,4,14,'orange'),
 servingbell:bell('cream')+p('M9 40 1 34l-1 14 9-1M85 36l10-6v14l-10-1','pink'),
 choppingboard:p('M27 30V13h30v17h24v56H12V30Z','yellow')+p('M57 30h24v56H59Z','orange')+o(42,19,5,5,'ink')+line('M24 46 64 71M26 59l26 16','cream',4),
 spicejar:bottle('green')+dots([[34,58],[44,60],[51,66],[39,67]],'orange',3),
 timer:r(39,7,21,10,'orange')+o(49,51,34,35,'pink')+o(49,49,27,27,'cream')+p('M49 49V22a27 27 0 0 1 27 27Z','yellow')+line('M49 29v20l16 9','ink',5),
 recyclingbag:bag('blue')+p('m42 43 12 2 6 13-9-3-9 14-7-4 10-16-6-4M30 54l-6 14 9 9-1-9 13 1v-7Z','green'),
 glasscase:box('blue')+p('M36 47 78 36v33L36 81Z','cream')+p('M43 48 73 40 45 73Z','blue')+line('M53 42v31','ink',3),
 oil:o(52,70,37,16,'ink')+p('M19 20 46 15 53 48 28 56Z','orange')+p('M20 14 40 9l10 9-28 8Z','cream')+p('M58 43q-9 16 1 16t0-16Z','yellow'),
 wrap:p('M15 27 69 15 85 64 31 81Z','blue')+p('M22 30 69 20 40 65Z','cream')+line('M41 35 63 30M50 47l16-4','purple',3)+p('M10 20h14l19 58-11 8Z','purple'),
 debt:paper()+r(26,22,37,9,'orange')+line('M28 41h34M28 51h26M28 61h36','ink',3)+p('m53 57 21 8-6 17-20-8Z','pink')+line('M56 65 63 76m-5-2 9-6','cream',3),
 fog:p('M9 35 17 21 33 24 41 8 63 16 68 29 82 26 90 43H9Z','blue')+r(8,51,69,8,'cream')+r(24,66,64,7,'purple')+r(13,80,46,6,'cream'),
 paper:p('M22 21 52 9 78 29 88 59 60 85 25 75 9 47Z','cream')+p('M52 9 42 43 78 29M42 43 60 85 88 59M9 47l33-4-17 32Z','blue')+p('M22 21 42 43 25 75Z','purple'),
 rust:p('M38 8 62 15l2 12 16 4-6 19-18 8-10 31-21-6 10-33-15-7 6-17 13-4Z','orange')+p('M44 30 60 31l-6 12-11-2Z','ink')+dots([[31,35],[50,67],[48,18]],'yellow',3),
 noise:r(10,21,76,58,'purple')+r(18,27,60,44,'ink')+p('M21 47 35 41 40 55 49 29 56 59 63 43 76 48v8L66 53 58 71 50 50 42 67 32 52 21 56Z','pink')+line('M69 21 83 4','cream',4),
 grease:p('M20 16h57v65H20Z','purple')+p('M20 20q14-10 16 6v23q10 13 10-6V28q13-16 15 4v36q13 4 16-3v16H20Z','ink')+dots([[31,65],[60,77]],'orange',4),
 clutter:r(13,46,41,31,'purple')+p('M40 17 72 10 86 52 55 58Z','orange')+p('M18 13h31v30H18Z','yellow')+line('M9 83 89 69','ink',8),
 flies:o(39,33,17,24,'cream')+o(69,41,17,24,'blue')+o(49,56,14,23,'ink')+line('M43 50 24 51m24 7-21 12m28-18 22 10m-29 7 24 12','purple',4)+dots([[44,42],[55,44]],'orange',3),
 cold:r(13,33,71,50,'purple')+r(24,49,46,29,'ink')+line('M48 8v58M24 20l48 33M23 52 73 19','blue',6)+line('M37 13 48 22l11-9M36 61l12-10 13 10','cream',3),
 residue:p('M8 74 29 49l15 8 9-19 34 33-13 15H22Z','purple')+p('M17 67 29 49l15 8-12 19Z','orange')+p('M53 38 78 61 61 74 44 60Z','yellow')+p('M21 23 39 16 42 31 28 41Z','green'),
 bomb:o(46,57,32,32,'ink')+p('M43 27a32 32 0 0 1 16 60L43 73Z','purple')+p('M54 23 63 11 80 20 71 32Z','orange')+line('M74 17 77 7h10','ink',5)+p('m84 1 2 8 9-2-5 7 6 5-9-1-4 8-1-9-8-1 8-5Z','yellow')+p('M24 49q5-16 19-17l-1 9q-7 1-10 10Z','cream'),
};
const relicShapes={
 shaker:p('M22 37h54l-5 48H29Z','orange')+p('M53 37h23l-5 48H56Z','purple')+o(49,37,27,7,'ink')+line('M32 42 24 10M44 42 46 6M57 41 69 14','cream',6)+r(29,57,28,13,'yellow'),
 lunchbox:p('M10 37 66 20 86 36 30 54Z','cream')+p('M10 37 30 54v29L10 66Z','orange')+p('M30 54 86 36v30L30 83Z','purple')+line('M30 27V14h25v7','ink',5)+r(44,53,11,12,'yellow'),
 recycler:tongs()+p('M65 8 80 9l7 16-9-4-12 11-6-6 11-12Z','green'),
 splitter:line('M46 44 24 10M46 44 76 10M46 44v43','blue',9)+p('m11 14 17-8 9 20-15 8Zm50 5 16-15 13 14-17 16Z','orange')+o(46,44,9,9,'yellow'),
 pocketwatch:o(48,53,33,34,'yellow')+o(48,50,26,27,'cream')+line('M48 30v22l15 9','ink',5)+r(40,9,17,10,'purple')+line('M38 10Q18-8 11 15','orange',5),
 matchbox:p('M14 27 62 14 84 32 37 47Z','yellow')+p('M14 27 37 47v38L14 65Z','orange')+p('M37 47 84 32v35L37 85Z','purple')+line('M48 59 71 53','cream',7)+line('M8 69 42 32','cream',5)+o(42,32,6,6,'orange'),
 silverfork:line('M31 8v31h32V8M47 8v76','blue',7)+p('M36 67h22v22H36Z','blue')+p('m72 43 4 7 8 2-8 4-4 8-2-8-8-4 8-2Z','yellow'),
 linen:p('M12 69 47 10 86 72 48 87Z','cream')+p('M47 10 48 87 86 72Z','pink')+p('M12 69 48 52v35Z','purple'),
 coinpurse:bag('pink')+o(42,61,17,16,'yellow')+o(42,59,11,10,'orange')+r(28,25,38,8,'ink'),
 redseal:o(46,52,30,31,'orange')+o(44,48,20,20,'pink')+p('m28 71-7 23 20-10 9 10 4-24Z','purple')+p('m44 31 5 11 13 2-9 9 2 12-11-6-10 6 2-12-10-9 14-2Z','cream'),
 recipebook:p('M16 12h57l8 67-56 8-9-8Z','orange')+p('M25 20h40l6 53-39 6Z','cream')+line('M16 12 25 87','purple',9)+p('M35 41 39 30h17l8 15-4 7H38Z','green')+line('M36 62h27','ink',3),
 luckybone:p('M20 14C0 8 0 37 21 36l39 32C50 88 79 96 81 75c22 1 13-28-3-22L38 24C42 4 22-4 20 14Z','yellow')+p('M21 36 60 68l7-11-30-23Z','orange'),
 emptyplate:plate()+o(43,54,19,8,'cream')+p('m66 13 4 10 11 1-9 7 2 10-8-6-9 6 2-10-8-7 11-1Z','yellow'),
 bottlestopper:p('M26 16h41l8 15-10 49-30 8-14-58Z','yellow')+p('M54 32 75 31 65 80l-18 5Z','orange')+o(47,20,21,9,'cream')+dots([[34,43],[41,58],[35,73],[57,22]],'purple',3),
 neonsign:r(8,22,81,48,'purple')+r(15,29,67,34,'pink')+r(20,34,57,24,'ink')+line('M27 52 33 41l6 11m9-1 8-10m6 0v11','yellow',3)+line('M26 22V8m47 14V8','cream',4),
 scale:r(43,18,8,61,'purple')+r(24,79,45,8,'ink')+line('M15 29 80 20','orange',6)+line('M20 29 10 55h23L20 29M74 21 63 48h23L74 21','cream',3)+p('M8 54h27l-5 13H14ZM61 47h27l-6 12H67Z','yellow')+o(47,16,7,7,'orange'),
 oldkey:o(33,28,23,23,'yellow')+o(33,28,11,11,'ink')+p('M40 46 50 38l37 36-10 13-10-10-7 6-9-10 7-7Z','yellow')+p('M77 87 50 59l7-7 30 22Z','orange'),
 polishingstone:p('M12 55 61 28 88 45 41 75Z','pink')+p('M12 55 41 75v15L12 71Z','purple')+p('M41 75 88 45v14L41 90Z','ink')+p('m38 4 6 14 16 2-15 7-7 15-4-16-14-7 15-2Z','cream'),
 trashpass:p('M12 28 75 10 89 68 27 88l-5-10 4-8-9-5 4-9-8-5 5-10Z','yellow')+p('M35 37 65 28 72 59 41 68Z','green')+line('M42 39 47 60m6-24 5 21m6-24 5 22','cream',3)+o(27,36,5,5,'orange'),
 shellpair:p('M9 51C-1 9 59 3 57 47L34 70Z','pink')+line('M15 26 34 65m-4-48 4 48m14-44L34 65','cream',3)+p('M39 67C38 28 93 23 89 62L67 84Z','yellow')+line('M47 44 66 79m-6-41 6 41m12-38L66 79','orange',3),
};
for(const [id,shape] of Object.entries(relicShapes))POSTER_SHAPES['relic-'+id]=shape;
export function posterIcon(kind,extra=''){
 const shape=POSTER_SHAPES[kind];if(!shape)throw Error('Missing poster art: '+kind);
 return `<svg class="art poster-art ${extra}" data-art-id="${kind}" viewBox="0 0 104 104" aria-hidden="true"><path d="M15 82 43 100 101 77 68 56Z" fill="${P.purple}"/><g transform="translate(2 0) rotate(-7 48 48)" stroke="${P.ink}" stroke-width=".45" stroke-linejoin="round">${shape}</g></svg>`;
}
export function posterBack(){return `<svg class="back-art" viewBox="0 0 118 168" aria-hidden="true"><rect width="118" height="168" rx="5" fill="${P.cream}"/><path d="M7 7h104v154H7Z" fill="${P.purple}"/><path d="M7 7h65L7 116ZM111 161H49l62-109Z" fill="${P.ink}"/><path d="M58 28 98 83l-40 55L19 83Z" fill="${P.orange}"/><path d="M58 36 91 83l-33 47-33-47Z" fill="none" stroke="${P.cream}" stroke-width="2"/><text x="59" y="108" text-anchor="middle" font-family="Georgia,serif" font-size="73" font-weight="bold" fill="${P.cream}">?</text><path d="M12 15h16v4H12Zm79 134h16v4H91Z" fill="${P.cream}"/></svg>`;}
export function posterDealer(){return `<svg class="host-portrait poster-dealer" viewBox="0 0 320 340" aria-hidden="true"><path d="M5 340 31 229 109 204h103l82 43 26 93Z" fill="${P.ink}"/><path d="m109 204 51 50 52-50-14 136H96Z" fill="${P.cream}"/><path d="m31 229 79-25 18 65-34-6 24 77H5Zm181-25 82 43 26 93H186l27-69-23-3Z" fill="${P.purple}"/><path d="m141 243 20 8 23-9-4 30-19-12-19 11Z" fill="${P.orange}"/><path d="M104 89h109v74q-5 50-55 60-51-23-57-68Z" fill="${P.cream}"/><path d="m177 91 36-2v74q-5 50-55 60l17-37Z" fill="${P.blue}"/><path d="M115 129q14-16 28 0l-2 9q-13-10-25 2Zm57 2q17-18 28-3l-1 12q-13-10-24-1Z" fill="${P.ink}"/><path d="M126 164q30 28 65-2-15 41-42 27Z" fill="${P.ink}"/><path d="M130 165q25 17 56-1l-6 9q-27 11-45 0Z" fill="${P.cream}"/><path d="M95 21 199 4l16 79 35 8-1 16-179 6-9-15 39-14Z" fill="${P.ink}"/><path d="m95 21 20 7 3 57-18-1Z" fill="${P.purple}"/><path d="m100 67 111-7 4 23-115 7Z" fill="${P.orange}"/><path d="m28 287 72-10 12 48-72 11Z" fill="${P.cream}"/><path d="m70 289 34-22 13 35-30 18Z" fill="${P.pink}"/><circle cx="258" cy="292" r="27" fill="${P.orange}"/><circle cx="254" cy="285" r="23" fill="none" stroke="${P.cream}" stroke-width="3"/></svg>`;}
