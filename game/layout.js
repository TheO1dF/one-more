export function arrangeCards(cards, width, height, {touch=false}={}) {
  const baseW=118, baseH=168, gap=18, rowH=190;
  const pack=(items,scale,maxRows=Infinity)=>{
    const rows=[[]];let used=0;
    for(const c of items){const w=(c.tapped?baseH+gap:baseW+gap)*scale;
      if(used+w>width&&rows.at(-1).length){if(rows.length===maxRows)return {rows,rest:items.slice(rows.flat().length)};rows.push([]);used=0;}
      rows.at(-1).push(c.uid);used+=w;
    }return {rows,rest:[]};
  };
  const maxScale=Math.min(1.16,Math.max(.48,width/760));
  if(touch){
    const columns=Math.max(3,Math.floor(width/100));
    const scale=Math.max(.66,Math.min(.82,width/(columns*(baseW+gap)),height/180));
    const rows=Math.max(1,Math.min(2,Math.floor(height/(180*scale))));
    const pages=[];let rest=cards;
    do{const p=pack(rest,scale,rows);pages.push(p.rows);rest=p.rest;}while(rest.length);
    return {pages,scale,cardW:baseW*scale,cardH:baseH*scale,rowH:180*scale,gap:gap*scale};
  }
  let scale=maxScale,rowsWanted=2;
  for(let rows=2;rows<=4;rows++){
    scale=Math.min(maxScale,Math.max(.24,(height-8)/(rows*rowH)));
    const test=pack(cards,scale,rows);
    rowsWanted=rows;if(!test.rest.length)break;
  }
  const pages=[];let remaining=cards;
  do{const p=pack(remaining,scale,rowsWanted);pages.push(p.rows);remaining=p.rest;}while(remaining.length);
  return {pages,scale,cardW:baseW*scale,cardH:baseH*scale,rowH:rowH*scale,gap:gap*scale};
}
export function layoutTable({page=0,focusUid=null,lang='zh'}={}){
  const field=document.querySelector('.card-field');if(!field)return {page:0,pages:1};
  const seats=[...field.querySelectorAll('.card-seat')], cards=seats.map(e=>({uid:+e.querySelector('.tile').dataset.uid,tapped:e.classList.contains('landscape')}));
  const touch=matchMedia('(max-width:600px), (max-width:950px) and (max-height:500px)').matches;
  const bounds=field.getBoundingClientRect(), layout=arrangeCards(cards,Math.max(80,bounds.width-24),Math.max(70,bounds.height-(touch?4:8)),{touch});
  page=Math.min(page,layout.pages.length-1);
  if(focusUid!=null){const p=layout.pages.findIndex(rows=>rows.flat().includes(focusUid));if(p>=0)page=p;}
  field.style.setProperty('--card-w',layout.cardW+'px');field.style.setProperty('--card-h',layout.cardH+'px');field.style.setProperty('--card-scale',layout.scale);field.style.setProperty('--seat-gap',layout.gap+'px');field.style.setProperty('--row-h',layout.rowH+'px');
  field.dataset.scale=layout.scale;field.dataset.rows=layout.pages[page].length;field.dataset.pages=layout.pages.length;field.dataset.page=page;
  field.dataset.density=layout.scale<.5?'compact':'normal';
  field.dataset.touch=String(touch);
  const map=new Map(seats.map(e=>[+e.querySelector('.tile').dataset.uid,e]));
  const storage=document.createElement('div');storage.className='card-storage';storage.hidden=true;seats.forEach(e=>storage.append(e));
  const fragment=document.createDocumentFragment();
  for(const ids of layout.pages[page]){const row=document.createElement('div');row.className='card-row';for(const uid of ids)row.append(map.get(uid));fragment.append(row);}
  field.replaceChildren(fragment,storage);
  const pager=document.querySelector('.table-pager');
  if(pager)pager.innerHTML=layout.pages.length>1?touch?`<button data-action="table-page" data-page="${page-1}" ${page===0?'disabled':''} aria-label="${lang==='en'?'Previous page':'上一页'}">‹</button><span class="page-label">${page+1} / ${layout.pages.length}</span><button data-action="table-page" data-page="${page+1}" ${page===layout.pages.length-1?'disabled':''} aria-label="${lang==='en'?'Next page':'下一页'}">›</button>`:layout.pages.map((rows,i)=>`<button data-action="table-page" data-page="${i}" class="${i===page?'current':''}" aria-label="${lang==='en'?'Page':'第'} ${i+1}${lang==='en'?'':'页'}" aria-current="${i===page?'page':'false'}">${i+1}</button>`).join(''):'';
  return {page,pages:layout.pages.length};
}
