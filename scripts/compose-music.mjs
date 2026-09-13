import {writeFile,mkdir} from 'node:fs/promises';
const tempo=76, beats=128, tracks=[[],[],[],[]];
const note=(track,start,duration,pitch,velocity=65)=>tracks[track].push({start,duration,pitch,velocity});
const harmony=[
 [38,[53,57,60,64],[38,45,48,49]], [43,[53,57,58,62],[43,50,53,52]],
 [36,[52,55,58,62],[36,43,46,47]], [41,[52,55,57,60],[41,48,52,51]],
 [34,[50,53,57,60],[34,41,45,44]], [40,[50,55,58,62],[40,46,50,49]],
 [33,[49,55,58,64],[33,40,43,37]], [38,[53,57,60,64],[38,45,41,37]]
];
const motifs=[[[0,69,1.1],[1.66,65,.6],[2.66,64,.7]],[[.66,62,.5],[1.66,65,.7],[3,69,.8]],[[0,67,1.2],[2,64,.6],[2.66,62,.8]],[[.66,60,.6],[2,64,1.2]],[[0,65,.8],[1.66,64,.6],[2.66,60,.6]],[[1,62,.7],[2.66,65,.6],[3.66,64,.3]],[[0,61,1],[1.66,58,.6],[3,57,.7]],[[0,62,1.8],[3.66,64,.3]]];
for(let bar=0;bar<32;bar++){
 const b=bar*4,h=harmony[bar%8],chorus=Math.floor(bar/8);
 for(const [i,t] of [0,1.66,3].entries())for(const [j,p] of h[1].entries())note(0,b+t+j*.012,i===0?1.15:.7,p,43+(bar*7+j*3+i*5)%12);
 h[2].forEach((p,i)=>note(1,b+i+.015,.83,p,65+(bar+i)%9));
 if(bar%8!==7||chorus>0)for(const [t,p,d] of motifs[bar%8])note(2,b+t+.025,d,p+(chorus===2?12:0),chorus===2?48:58+(bar%3)*3);
 for(let q=0;q<4;q++){
   note(3,b+q,.08,42,27+(q%2)*8);
   note(3,b+q+.66,.07,51,21+(bar+q)%6);
 }
 note(3,b,.12,36,40);note(3,b+2,.12,36,33);
 note(3,b+1,.15,38,31);note(3,b+3,.15,38,35);
}
const vlq=n=>{let a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;};
const u16=n=>[(n>>8)&255,n&255],u32=n=>[n>>>24,(n>>>16)&255,(n>>>8)&255,n&255];
const chunk=(name,data)=>[...Buffer.from(name),...u32(data.length),...data];
const meta=(type,text)=>[255,type,...vlq(Buffer.byteLength(text)),...Buffer.from(text)];
let midi=[...Buffer.from('MThd'),...u32(6),...u16(1),...u16(5),...u16(480)];
const mpq=Math.round(60000000/tempo);
midi.push(...chunk('MTrk',[0,...meta(3,'One More - The Empty Glass'),0,255,81,3,(mpq>>16)&255,(mpq>>8)&255,mpq&255,0,255,88,4,4,2,24,8,0,255,47,0]));
const programs=[4,32,11,0],names=['Velvet piano','Walking bass','Last-chip motif','Brushed time'];
for(let i=0;i<4;i++){
 const ch=i===3?9:i,events=tracks[i].flatMap(n=>[{t:Math.round(n.start*480),bytes:[144+ch,n.pitch,n.velocity]},{t:Math.round((n.start+n.duration)*480),bytes:[128+ch,n.pitch,0]}]).sort((a,b)=>a.t-b.t||a.bytes[0]-b.bytes[0]);
 let data=[0,...meta(3,names[i]),0,192+ch,programs[i]],last=0;
 for(const e of events){data.push(...vlq(e.t-last),...e.bytes);last=e.t;}
 data.push(...vlq(beats*480-last),255,47,0);midi.push(...chunk('MTrk',data));
}
await mkdir('game/audio',{recursive:true});await writeFile('game/audio/the-empty-glass.mid',Buffer.from(midi));
await writeFile('game/audio/score.json',JSON.stringify({title:'The Empty Glass',tempo,beats,tracks}));
console.log('Original score:',tracks.map(t=>t.length),'notes,',beats*60/tempo,'seconds');
