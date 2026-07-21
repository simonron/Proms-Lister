import { createClient } from 'npm:@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Expose-Headers':'x-ticket-name, content-type'}
const json=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...cors,'Content-Type':'application/json'}})
const sha256=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('')
const safe=(v:string)=>btoa(unescape(encodeURIComponent(v))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
const merge=(a:Record<string,any>={},b:Record<string,any>={})=>{const o={...a};for(const[k,v]of Object.entries(b)){if(!o[k]||Number(v?.updatedAt||0)>Number(o[k]?.updatedAt||0))o[k]=v}return o}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
 try{
  const ct=req.headers.get('content-type')||'';let body:any,file:File|null=null
  if(ct.includes('multipart/form-data')){const f=await req.formData();body=Object.fromEntries(f.entries());file=f.get('file') as File|null}else body=await req.json()
  const action=String(body.action||''),syncId=String(body.syncId||'').trim(),syncKey=String(body.syncKey||'')
  if(!syncId||!syncKey)return json({error:'Sync ID and key are required.'},400)
  const hash=await sha256(syncKey)
  const {data:acct,error:readErr}=await sb.from('proms_sync_accounts').select('sync_id,secret_hash,payload').eq('sync_id',syncId).maybeSingle()
  if(readErr)throw readErr
  if(action==='register'){
   if(acct&&acct.secret_hash!==hash)return json({error:'This Sync ID already exists with a different key.'},403)
   if(!acct){const {error}=await sb.from('proms_sync_accounts').insert({sync_id:syncId,secret_hash:hash,payload:{}});if(error)throw error}
   return json({ok:true})
  }
  if(!acct||acct.secret_hash!==hash)return json({error:'Incorrect Sync ID or Sync Key.'},403)
  if(action==='sync'){const merged=merge(acct.payload||{},body.tickets||{});const {error}=await sb.from('proms_sync_accounts').update({payload:merged,updated_at:new Date().toISOString()}).eq('sync_id',syncId);if(error)throw error;return json({ok:true,tickets:merged})}
  const ticketKey=String(body.ticketKey||'');if(!ticketKey)return json({error:'ticketKey is required.'},400)
  const path=`${safe(syncId)}/${safe(ticketKey)}`
  if(action==='file-put'){
   if(!file)return json({error:'Ticket file missing.'},400)
   const bytes=await file.arrayBuffer(),type=String(body.type||file.type||'application/octet-stream')
   const {error}=await sb.storage.from('proms-tickets').upload(path,bytes,{upsert:true,contentType:type});if(error)throw error
   return json({ok:true})
  }
  if(action==='file-get'){
   const {data,error}=await sb.storage.from('proms-tickets').download(path)
   if(error)return json({error:'Ticket file not found.'},404)
   const t=(acct.payload||{})[ticketKey]||{}
   return new Response(data,{headers:{...cors,'Content-Type':t.fileType||data.type||'application/octet-stream','x-ticket-name':encodeURIComponent(t.pdfName||'ticket')}})
  }
  if(action==='file-delete'){await sb.storage.from('proms-tickets').remove([path]);return json({ok:true})}
  return json({error:'Unknown action.'},400)
 }catch(e){console.error(e);return json({error:e instanceof Error?e.message:String(e)},500)}
})
