export async function connectSmokeTransport(port) {
 const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
 const target=targets.find(t=>t.type==='page');
 if(!target) throw new Error('No debuggable Edge page found');
 const socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 let id=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}
  if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  if(m.method==='Log.entryAdded'&&(m.params.entry.level==='error'||m.params.entry.text.includes('AudioContext was not allowed to start')))errors.push(m.params.entry.text);
 });
 return {errors,send:(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));}),close:()=>socket.close()};
}
