/* Restored as one dependency-complete ticket pipeline from the known historical implementation.
   Order: PDF page objects with layout -> select correct concert page -> parse that page -> save ticketPage. */

async function pdfPages(file){
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const p=await pdf.getPage(i),c=await p.getTextContent();
    const layout=c.items.filter(x=>x.str&&x.transform).map(x=>({text:x.str,x:x.transform[4],y:x.transform[5],w:x.width||0,h:x.height||0}));
    pages.push({text:c.items.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim(),layout});
  }
  return pages;
}

function ticketPageText(page){return typeof page==='string'?page:(page&&page.text)||''}

function ticketPageScore(c,page){
  const text=ticketPageText(page),n=norm(text),titleWords=norm(c.title||'').split(' ').filter(w=>w.length>3);
  let score=titleWords.filter(w=>n.includes(w)).length*3;
  if(c.date&&dateFromText(text)===c.date)score+=12;
  const matched=matchConcert(text);
  if(matched&&keyFor(matched)===keyFor(c))score+=30;
  return score;
}

function bestTicketPage(c,pages,savedPage){
  const n=Number(savedPage||0);
  if(n>=1&&n<=pages.length){
    const savedScore=ticketPageScore(c,pages[n-1]);
    let highest=savedScore;
    for(let i=0;i<pages.length;i++)highest=Math.max(highest,ticketPageScore(c,pages[i]));
    if(savedScore===highest)return n-1;
  }
  let best=0,bestScore=-1;
  for(let i=0;i<pages.length;i++){
    const s=ticketPageScore(c,pages[i]);
    if(s>bestScore){bestScore=s;best=i}
  }
  return best;
}

function parseSpatialTicket(layout){
  if(!Array.isArray(layout)||!layout.length)return{};
  const items=layout.map(i=>({...i,text:String(i.text||'').trim()})).filter(i=>i.text);
  const ys=[];
  for(const i of items){
    let g=ys.find(r=>Math.abs(r.y-i.y)<=2.2);
    if(!g){g={y:i.y,items:[]};ys.push(g)}
    g.items.push(i);
  }
  ys.forEach(g=>g.items.sort((a,b)=>a.x-b.x));
  const labelAt=(word)=>{
    const wanted=word.toLowerCase();
    for(const g of ys){
      for(let a=0;a<g.items.length;a++){
        let txt='',x0=g.items[a].x,x1=x0;
        for(let b=a;b<Math.min(g.items.length,a+5);b++){
          const it=g.items[b];
          if(b>a&&it.x-x1>8)break;
          txt+=it.text.replace(/\s+/g,'');x1=it.x+(it.w||0);
          if(txt.toLowerCase()===wanted)return{x:x0,y:g.y,w:Math.max(24,x1-x0)};
          if(txt.length>wanted.length+2)break;
        }
      }
    }
    return null;
  };
  const nextValue=(label,xMin,xMax)=>{
    if(!label)return'';
    const candidates=items.filter(i=>i.y<label.y-1&&label.y-i.y<28&&(i.x+(i.w||0)/2)>=xMin&&(i.x+(i.w||0)/2)<xMax);
    if(!candidates.length)return'';
    const bestY=Math.max(...candidates.map(i=>i.y));
    return candidates.filter(i=>Math.abs(i.y-bestY)<=2.5).sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
  };
  const doorL=labelAt('Door'),sectionL=labelAt('Section'),rowL=labelAt('Row'),seatL=labelAt('Seat');
  const rowSplit=seatL?seatL.x-5:(rowL?rowL.x+38:395);
  return{
    door:nextValue(doorL,doorL?doorL.x-6:0,sectionL?sectionL.x+55:430),
    section:nextValue(sectionL,sectionL?sectionL.x-6:0,sectionL?sectionL.x+100:450),
    row:nextValue(rowL,rowL?rowL.x-6:0,rowSplit),
    seat:nextValue(seatL,seatL?seatL.x-6:rowSplit,seatL?seatL.x+70:470)
  };
}

function parseTicket(page){
  const text=ticketPageText(page);
  const spatial=parseSpatialTicket(page&&page.layout);
  const after=(label)=>{const m=text.match(new RegExp(label+'\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9 –\\-]{0,24})','i'));return m?m[1].trim():''};
  let section=spatial.section||'';
  if(!section){
    const m=text.match(/(?:Section\s*[:\-]?\s*)?((?:Stalls|Rausing Circle|Circle|Gallery|Arena|Choir|Grand Tier|Second Tier|Loggia|Box)(?:\s+[A-Z0-9]{1,4})?)/i);
    section=m?m[1].replace(/\s+/g,' ').trim():'';
  }
  const row=spatial.row||after('Row').split(/\s+/)[0]||'';
  const seat=spatial.seat||after('Seat(?:s)?').split(/\s+/)[0]||'';
  const door=spatial.door||after('Door').split(/\s+/)[0]||'';
  const ref=(text.match(/(?:Order(?: Number)?|Booking(?: Reference)?|Reference)\s*[:#\-]?\s*([A-Z0-9-]{5,})/i)||[])[1]||'';
  return{section,row,seat,door,reference:ref,notes:/restricted view/i.test(text)?'Restricted view':''};
}

async function importPdfs(files){
  let ok=0,fail=[];
  for(const file of files){
    try{
      const isPdf=file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');
      const pages=isPdf?await pdfPages(file):[await imageText(file)];
      const storedType=file.type||mimeForName(file.name)||'application/octet-stream';
      const storedBlob=new Blob([file],{type:storedType});

      if(window.attachTarget){
        const c=window.attachTarget;
        const idx=bestTicketPage(c,pages,0);
        const parsed=parseTicket(pages[idx]);
        const all=loadTickets(),k=keyFor(c),old=all[k]||{};
        all[k]={...old,...parsed,hasTicket:true,pdfName:file.name,fileType:storedType,ticketPage:idx+1,updatedAt:Date.now()};
        saveTickets(all);
        await pdfPut(k,storedBlob,file.name);
        ok++;
      }else{
        for(let i=0;i<pages.length;i++){
          const c=matchConcert(ticketPageText(pages[i]));
          if(!c)continue;
          const parsed=parseTicket(pages[i]);
          const all=loadTickets(),k=keyFor(c),old=all[k]||{};
          all[k]={...old,...parsed,hasTicket:true,pdfName:file.name,fileType:storedType,ticketPage:i+1,updatedAt:Date.now()};
          saveTickets(all);
          await pdfPut(k,storedBlob,file.name);
          ok++;
        }
      }
      window.attachTarget=null;
    }catch(e){
      console.error(e);fail.push(file.name);window.attachTarget=null;
    }
  }
  render();
  const status=document.getElementById('importStatus');
  if(status)status.textContent=`Imported ${ok} ticket${ok===1?'':'s'}${fail.length?`; could not read: ${fail.join(', ')}`:''}`;
  if(selected)openDetail(selected);
  writeCalendarSyncFile();
}

async function openPdf(c){
  const k=keyFor(c),rec=await pdfGet(k);
  if(!rec){alert('No ticket is attached to this concert.');return}
  const type=rec.blob.type||mimeForName(rec.name)||'application/octet-stream';
  const blob=new Blob([rec.blob],{type}),u=URL.createObjectURL(blob),t=ticketFor(c);
  if(type!=='application/pdf'&&!String(rec.name||'').toLowerCase().endsWith('.pdf')){
    window.open(u,'_blank');setTimeout(()=>URL.revokeObjectURL(u),120000);return;
  }
  let page=Number(t.ticketPage||0);
  if(!page){
    try{
      const pages=await pdfPages(rec.blob),all=loadTickets(),idx=bestTicketPage(c,pages,0);
      page=idx+1;all[k]={...t,ticketPage:page,updatedAt:Date.now()};saveTickets(all);
    }catch(e){console.warn('Could not determine ticket page',e);page=1}
  }
  const w=window.open(u+'#page='+page+'&zoom=page-width','_blank');
  if(!w)alert('Please allow pop-ups so the ticket can be displayed.');
  setTimeout(()=>URL.revokeObjectURL(u),300000);
}

console.info('Historical layout-aware ticket selector enabled');
