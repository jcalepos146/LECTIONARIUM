/* Participation is a local choice. A live host never supplies ordination status. */
(function(){
'use strict';
let mode='lay';try{if(sessionStorage.getItem('lect-participation')==='priest')mode='priest';}catch(e){}
const isPriest=()=>mode==='priest';
const catholicMass=m=>!!m&&!m.isOffice&&['n','o','m','p','h','b'].includes(m.rite);
function priestOnly(el,role=''){
 if((' '+role+' ').includes(' cel '))return true;
 for(let p=el;p&&p.nodeType===1;p=p.parentElement){if(p.hasAttribute('data-priest-only')||(' '+(p.getAttribute('data-r')||'')+' ').includes(' cel '))return true;}
 return false;
}
function setMode(value){mode=value==='priest'?'priest':'lay';try{sessionStorage.setItem('lect-participation',mode);}catch(e){}window.dispatchEvent(new Event('lect-participation'));}
function controls(){return `<div class="mctlbox participation"><label class="sl" for="participation-mode">Participation <select id="participation-mode"><option value="lay"${!isPriest()?' selected':''}>Lay study</option><option value="priest"${isPriest()?' selected':''}>Ordained priest</option></select></label><p class="note">${isPriest()?'Priest mode is for validly ordained priests. Use the approved books and observe applicable law; this setting does not establish faculties or permission to celebrate.':'Lay study: follow the readings and responses. Priest-only texts are references, not assigned parts. Do not attempt the Eucharistic celebration or imitate its priest-only actions.'} Read-aloud omits priest-only prayers in either mode. <a href="#sources" data-canon-link>Canonical guidance</a></p></div>`;}
function annotate(el,isOffice){
 if(isOffice)return;
 el.querySelectorAll('.mbody .cue').forEach(c=>{
  const sec=c.closest('.mpart');let heading='';
  if(sec)sec.querySelectorAll('h4.sub2').forEach(h=>{if(h.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)heading=h.textContent;});
  if(/Eucharistic Prayer|Roman Canon|Preface of the day|Prayer over the Offerings|Embolism/i.test(c.textContent)||/^(Collect|Prayer after Communion|Prayer over the Offerings)$/i.test(heading)){
   c.setAttribute('data-priest-only','');
   if(c.nextElementSibling?.classList.contains('mytext'))c.nextElementSibling.setAttribute('data-priest-only','');
  }
 });
 el.querySelectorAll('.mbody .canon, .mbody [data-r]').forEach(n=>{if(n.classList.contains('canon')||(' '+(n.getAttribute('data-r')||'')+' ').includes(' cel '))n.setAttribute('data-priest-only','');});
 el.querySelectorAll('.mbody > section.mpart').forEach(sec=>{
  const title=sec.querySelector('h3 span')?.textContent||'';
  if(/^(Canon|Anaphora)(\b|$)/i.test(title)){
   sec.setAttribute(title==='Canon'?'data-priest-only':'data-priest-section','');
   if(!isPriest()){
    const ref=document.createElement('details');ref.className='priest-reference';
    const summary=document.createElement('summary');summary.textContent='Priest-only text · study reference';ref.append(summary);
    [...sec.childNodes].filter(n=>n.nodeName!=='H3').forEach(n=>ref.append(n));sec.append(ref);
   }
  }
 });
 if(!isPriest())el.querySelectorAll('.mbody details.canon').forEach(n=>{n.open=false;const s=n.querySelector('summary');if(s)s.textContent='Priest-only Canon · study reference';});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-canon-link]')){e.preventDefault();document.getElementById('tab-sources').click();requestAnimationFrame(()=>document.getElementById('canonical-guidance').scrollIntoView({block:'start'}));}});
window.LectParticipation={isPriest,setMode,catholicMass,priestOnly,controls,annotate};
})();
