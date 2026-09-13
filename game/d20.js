const phi=(1+Math.sqrt(5))/2;
const raw=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]];
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>a.map(x=>x/Math.hypot(...a));
export const vertices=raw.map(norm);
const triangles=[];
for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(let c=b+1;c<12;c++)if([sub(raw[a],raw[b]),sub(raw[b],raw[c]),sub(raw[c],raw[a])].every(v=>Math.abs(Math.hypot(...v)-2)<1e-7)){
 let ids=[a,b,c],normal=norm(cross(sub(vertices[b],vertices[a]),sub(vertices[c],vertices[a]))),center=vertices[a].map((x,i)=>(x+vertices[b][i]+vertices[c][i])/3);
 if(dot(normal,center)<0){ids=[a,c,b];normal=normal.map(x=>-x);}triangles.push({ids,normal,center,value:0});
}
let n=1;for(const f of triangles)if(!f.value){f.value=n;triangles.find(g=>dot(f.normal,g.normal)<-.999).value=21-n;n++;}
export const faces=triangles;
const multiply=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((sum,x,k)=>sum+x*b[k][j],0)));
const rotate=(m,v)=>m.map(row=>dot(row,v));
const rx=a=>[[1,0,0],[0,Math.cos(a),-Math.sin(a)],[0,Math.sin(a),Math.cos(a)]];
const ry=a=>[[Math.cos(a),0,Math.sin(a)],[0,1,0],[-Math.sin(a),0,Math.cos(a)]];
const rz=a=>[[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
export function orientation(value=20){const f=faces.find(f=>f.value===value);const up=norm(sub(vertices[f.ids[0]],f.center)),right=norm(cross(up,f.normal));return [right,up,f.normal];}
export function drawD20(canvas,{value=20,spin=[0,0,0],x=.5,y=.5,size=62,lift=0,shadow=true}={}){
 if(!canvas)return;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,r.width),h=Math.max(1,r.height);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const cx=w*x,cy=h*y;const m=multiply(multiply(rz(spin[2]),multiply(ry(spin[1]),rx(spin[0]))),orientation(value));
 if(shadow){ctx.fillStyle=`rgba(5,16,11,${.3*(1-lift*.65)})`;ctx.beginPath();ctx.ellipse(cx,cy+size*.78,size*(.65+lift*.18),size*.19,0,0,Math.PI*2);ctx.fill();}
 const vs=vertices.map(v=>rotate(m,v)), project=v=>[cx+v[0]*size*(4/(4-v[2])),cy-v[1]*size*(4/(4-v[2]))];
 const visible=faces.map(f=>({...f,n:rotate(m,f.normal),c:rotate(m,f.center)})).filter(f=>f.n[2]>.035).sort((a,b)=>a.c[2]-b.c[2]);
 for(const f of visible){const p=f.ids.map(i=>project(vs[i]));ctx.beginPath();ctx.moveTo(...p[0]);ctx.lineTo(...p[1]);ctx.lineTo(...p[2]);ctx.closePath();const light=Math.max(0,dot(f.n,norm([-.6,.9,1.1])));ctx.fillStyle=`hsl(76 22% ${37+light*38}%)`;ctx.fill();ctx.strokeStyle='#21392d';ctx.lineWidth=1.5;ctx.stroke();
  const c=project(f.c),a=p[0],b=p[1],d=p[2],base=[(b[0]+d[0])/2,(b[1]+d[1])/2],up=norm([a[0]-base[0],a[1]-base[1],0]),height=Math.hypot(a[0]-base[0],a[1]-base[1]);
  ctx.save();ctx.clip();ctx.translate(c[0],c[1]);ctx.rotate(Math.atan2(up[1],up[0])+Math.PI/2);ctx.scale(1,Math.max(.18,f.n[2]));ctx.fillStyle=f.value===20?'#502f17':'#20372b';ctx.font=`bold ${Math.max(9,size*.29)}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(f.value),0,2);if(f.value===6||f.value===9){ctx.fillRect(-size*.045,size*.17,size*.09,1);}ctx.restore();
 }
 canvas.dataset.face=value;canvas.dataset.faces=20;
}
export function diceSize(canvas){return canvas.dataset.d20==='tray'?(canvas.parentElement.querySelectorAll('canvas').length>1?52:62):(canvas.parentElement.querySelectorAll('canvas').length>1?27:45);}
export function initDice(){for(const canvas of document.querySelectorAll('canvas[data-d20]'))drawD20(canvas,{value:+canvas.dataset.value||20,size:diceSize(canvas)});}
export function dieHTML(value=20,location='hand',held=false,index=0){return `<canvas data-d20="${location}" data-value="${value}" data-held="${held}" data-index="${index}" aria-label="d20 · ${value}${held?' · LOCKED':''}"></canvas>`;}
