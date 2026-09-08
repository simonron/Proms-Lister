(()=>{'use strict';
const STORAGE='promsTicketsV2',DB='PromsListerPDFs',DBV=2,PDFS='pdfs';
function records(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}}
function saveRecord(key,v){const a=records();a[key]=Object.assign({},a[key]||{},v);localStorage.setItem(STORAGE,JSON.stringify(a))}
function openDB(){return new Promise((ok,no)=>{const q=indexedDB.open(DB,DBV);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains(PDFS))d.createObjectStore(PDFS)};q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
async function put(key,val){const d=await openDB();return new Promise((ok,no)=>{const q=d.transaction(PDFS,'readwrite').objectStore(PDFS).put(val,key);q.onsuccess=()=>ok();q.onerror=()=>no(q.error)})}
function parseSeat(text){const u=String(text||'').replace(/\s+/g,' ').toUpperCase();const door=(u.match(/\bDOOR\s*[:#-]?\s*([A-Z0-9]+)/)||[])[1]||'';let section='',m=u.match(/\b(STALLS|CIRCLE)\s+([A-Z])\b/);if(m)section=m[1][0]+m[1].slice(1).toLowerCase()+' '+m[2];else{m=u.match(/\b(EAST CHOIR|WEST CHOIR|CHOIR|ARENA|GALLERY|GRAND TIER|SECOND TIER|RAUSING CIRCLE|LOGGIA)\b/);if(m)section=m[1].toLowerCase().replace(/\b\w/g,x=>x.toUpperCase())}return{door,section,row:(u.match(/\bROW\s*[:#-]?\s*([A-Z0-9]+)/)||[])[1]||'',seat:(u.match(/\bSEAT(?:S)?\s*[:#-]?\s*(\d+)/)||[])[1]||''}}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function dateForms(iso){if(!iso)return[];const [y,m,d]=iso.split('-'),months=['','january','february','march','april','may','june','july','august','september','october','november','december'],mon=months[+m]||'';return[`${+d} ${mon} ${y}`,`${+d} ${mon}`,`${d}/${m}/${y}`,`${d}/${m}/${y.slice(2)}`,`${d}-${m}-${y}`]}
function scorePage(text,c){const u=norm(text),title=norm(c.title),venue=norm(c.venue);let score=0;if(title){if(u.includes(title))score+=120;const words=title.split(' ').filter(w=>w.length>3);score+=words.filter(w=>u.includes(w)).length*8}if(venue&&u.includes(venue))score+=10;for(const f of dateForms(c.date))if(u.includes(norm(f))){score+=80;break}if(c.time&&u.includes(norm(c.time)))score+=15;return score}
async function pages(file){const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,out=[];for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n),t=await p.getTextContent();out.push({page:n,text:t.items.map(x=>x.str).join(' ')})}return out}
function keyFromTarget(target){return target||''}
async function processPdf(file,target){const ps=await pages(file),concerts=window.PromsListerConcerts||[],targetConcert=target&&concerts.find(c=>String(c.id??`${c.date}|${c.time}|${c.title}`)===target);let matches=[];
 if(targetConcert){let best=null;for(const p of ps){const s=scorePage(p.text,targetConcert);if(!best||s>best.score)best={...p,score:s}}if(best)matches=[{c:targetConcert,p:best}]}
 else{for(const c of concerts){let best=null;for(const p of ps){const s=scorePage(p.text,c);if(!best||s>best.score)best={...p,score:s}}if(best&&best.score>=80)matches.push({c,p:best})}}
 if(!matches.length)return false;
 for(const {c,p} of matches){const key=String(c.id??`${c.date}|${c.time}|${c.title}`),seat=parseSeat(p.text);await put(key,{name:file.name,type:file.type,blob:file,lastModified:file.lastModified,page:p.page});saveRecord(key,Object.assign({hasTicket:true,ticketName:file.name,ticketPage:p.page},seat))}
 return true}
function picker(){return document.getElementById('ticketPicker')}
document.addEventListener('change',async e=>{if(e.target!==picker())return;const files=[...e.target.files],target=keyFromTarget(e.target.dataset.target);if(!files.length)return;const pdfs=files.filter(f=>f.type.includes('pdf')||f.name.toLowerCase().endsWith('.pdf'));if(!pdfs.length)return; e.preventDefault();e.stopImmediatePropagation();try{for(const f of pdfs){const ok=await processPdf(f,target);if(!ok)alert('No matching Prom page could be identified in '+f.name)}location.reload()}catch(err){alert('Ticket PDF import failed: '+err.message)}finally{e.target.dataset.target='';e.target.value=''}},true);
window.PromsListerProcessPdfPages=processPdf;
})();