(()=>{'use strict';
/* iOS HEIC/HEIF adapter. Runs before the core ticketPicker change handler.
   Do not assign input.files: that is unreliable/restricted in iOS Safari.
   Instead convert the selected HEIF file, then expose the converted File through
   a one-shot proxy of the input's files getter while re-dispatching change. */
const HEIF=/\.(heic|heif)$/i;
const picker=document.getElementById('ticketPicker');
function isHeif(f){return !!f&&(/image\/(heic|heif|heic-sequence|heif-sequence)/i.test(f.type||'')||HEIF.test(f.name||''))}
async function convert(f){
 if(!isHeif(f))return f;
 if(typeof window.heic2any!=='function')throw new Error('HEIF converter did not load');
 const result=await window.heic2any({blob:f,toType:'image/jpeg',quality:.92});
 const blob=Array.isArray(result)?result[0]:result;
 return new File([blob],(f.name||'ticket').replace(HEIF,'.jpg'),{type:'image/jpeg',lastModified:f.lastModified||Date.now()});
}
if(picker){
 picker.setAttribute('accept','.pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,image/heic,image/heif');
 let replay=false;
 picker.addEventListener('change',async e=>{
   if(replay)return;
   const original=[...(picker.files||[])];
   if(!original.some(isHeif))return; // let core handle ordinary files normally
   e.stopImmediatePropagation();
   try{
     const converted=[];for(const f of original)converted.push(await convert(f));
     const dt=new DataTransfer();converted.forEach(f=>dt.items.add(f));
     const own=Object.getOwnPropertyDescriptor(picker,'files');
     Object.defineProperty(picker,'files',{configurable:true,get:()=>dt.files});
     replay=true;
     picker.dispatchEvent(new Event('change',{bubbles:true}));
     replay=false;
     if(own)Object.defineProperty(picker,'files',own);else delete picker.files;
   }catch(err){replay=false;alert('Could not load this HEIF/HEIC photo: '+(err&&err.message?err.message:err));}
 },true);
}
})();