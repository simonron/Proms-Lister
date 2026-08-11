/* Home page: no hamburger menu; direct Import & Transfer and Calendar controls. */
(function(){'use strict';
function apply(){
 const home=document.getElementById('homePage'); if(!home)return;
 const row=home.querySelector('.menu-row'); if(row)row.style.setProperty('display','none','important');
 const toggle=document.getElementById('homeMenuToggle'); if(toggle)toggle.style.setProperty('display','none','important');
 const panel=document.getElementById('homeMenuPanel'); if(panel)panel.style.setProperty('display','none','important');
 const nav=home.querySelector('.home-menu'); if(!nav)return;
 let links=document.getElementById('homeDirectLinks');
 if(!links){
   links=document.createElement('div'); links.id='homeDirectLinks'; links.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px';
   const imp=document.createElement('button'); imp.id='homeDirectImport'; imp.className='home-button'; imp.type='button'; imp.textContent='📥 Import & Transfer';
   imp.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(typeof showPage==='function')showPage('importPage')});
   const cal=document.createElement('button'); cal.id='homeDirectCalendar'; cal.className='home-button'; cal.type='button'; cal.textContent='📅 Calendar';
   cal.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(typeof window.PromsCalendarAction==='function')window.PromsCalendarAction();else if(typeof window.connectCalendarSync==='function')window.connectCalendarSync();else alert('Calendar is still loading. Please try again.')});
   links.append(imp,cal); nav.appendChild(links);
 }
 if(!document.getElementById('homeDirectLinksStyle')){const s=document.createElement('style');s.id='homeDirectLinksStyle';s.textContent='@media(max-width:520px){#homeDirectLinks{grid-template-columns:1fr!important}}';document.head.appendChild(s)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
setTimeout(apply,250);
})();