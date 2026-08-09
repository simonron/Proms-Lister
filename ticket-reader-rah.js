/* RAH ticket reader. Loaded AFTER ticket-history.js. It does not change page selection. */
(function(){
 const previousParse=window.parseTicket;
 window.parseTicket=function(page){
  const base=typeof previousParse==='function'?previousParse(page):{};
  const text=(typeof page==='string'?page:(page&&page.text)||'').replace(/\s+/g,' ').trim();
  let door='',section='',row='',seat='',reference='';

  /* Actual RAH PDF text is flattened roughly as:
     ... Henry Wood Promenade Concerts 9 Mr Simon Anthony Stalls O ... 1 105 143446017 Fri, 07 Aug 2026 ...
     The printed labels Door / Section / Row / Seat occur earlier, separately from their values. */
  let m=text.match(/Henry Wood Promenade Concerts\s+(\d{1,2})\s+(?:Mr|Mrs|Ms|Miss|Dr)\b[\s\S]{0,100}?\b(Stalls|Rausing Circle|Circle|Gallery|Arena|Choir|Grand Tier|Second Tier|Loggia|Box)\s+([A-Z]{1,2})\b/i);
  if(m){door=m[1];section=m[2]+' '+m[3].toUpperCase()}

  const order=text.match(/\b(\d{9})\s+(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)/i);
  if(order){
   reference=order[1];
   const before=text.slice(0,order.index);
   const pair=before.match(/\b(\d{1,2})\s+(\d{1,3})\s*$/);
   if(pair){row=pair[1];seat=pair[2]}
  }

  if(!section){const s=text.match(/\b(Stalls|Rausing Circle|Circle|Gallery|Arena|Choir|Grand Tier|Second Tier|Loggia|Box)\s+([A-Z]{1,2})\b/i);if(s)section=s[1]+' '+s[2].toUpperCase()}
  if(!door){const d=text.match(/Henry Wood Promenade Concerts\s+(\d{1,2})\b/i);if(d)door=d[1]}

  const result={...base};
  if(door)result.door=door;
  if(section)result.section=section;
  if(row)result.row=row;
  if(seat)result.seat=seat;
  if(reference)result.reference=reference;
  console.info('RAH selected-page reader:',{door:result.door,section:result.section,row:result.row,seat:result.seat,reference:result.reference});
  return result;
 };
 console.info('RAH selected-page ticket reader loaded; selector unchanged');
})();
