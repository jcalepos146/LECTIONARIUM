/* Participation is a local choice, remembered on this device. A live host never supplies ordination status.
   Lay study (the default) shows every liturgy without its words of consecration; "priest or seminarian" shows
   them, with a warning. The first time a Eucharistic liturgy is opened, the reader is asked which applies. */
(function(){
'use strict';
const KEY='lect-participation', ASKED='lect-participation-asked';
const get=k=>{try{return localStorage.getItem(k)||sessionStorage.getItem(k);}catch(e){return null;}};
const put=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
let mode=get(KEY)==='priest'?'priest':'lay';
const isPriest=()=>mode==='priest';
/* Rites whose Eucharist only a priest may celebrate: the Catholic rites and the Orthodox and Oriental liturgies. */
const catholicMass=m=>!!m&&!m.isOffice&&['n','o','m','p','h','b','d','a','z','arm','copt','adai'].includes(m.rite);
function priestOnly(el,role=''){
 if((' '+role+' ').includes(' cel '))return true;
 for(let p=el;p&&p.nodeType===1;p=p.parentElement){if(p.hasAttribute('data-priest-only')||(' '+(p.getAttribute('data-r')||'')+' ').includes(' cel '))return true;}
 return false;
}
function setMode(value){mode=value==='priest'?'priest':'lay';put(KEY,mode);put(ASKED,'1');window.dispatchEvent(new Event('lect-participation'));}
const WARNING='Simulating the words of consecration, or any other sacrament, is a grave offence under canon law (cf. Code of Canon Law, can. 1379), and doing so in a public setting gives scandal. These texts are for study and for supervised practice in priestly formation. They do not authorize anyone to celebrate.';
/* Wording follows the tradition: Catholic and Orthodox liturgies speak of priests and of consecration; the
   Prayer Book, Lutheran, Methodist and Reformed orders of ministers and of the words of institution. */
let protestant=false;
const W=()=>protestant?{cons:'the words of institution',clergy:'Minister or ordinand',who:'ministers and to those preparing for ordination',q:'Are you an ordained minister, or preparing for ordination?',warn:'These texts are for study. The Lord\u2019s Supper is celebrated by those whom their Church has called and ordained to it; do not imitate it in a public setting. Ministers should celebrate from the authorised book of their Church.'}
 :{cons:'the words of consecration',clergy:'Priest or seminarian',who:'priests and to seminarians preparing for ordination',q:'Are you a priest, or studying as a seminarian?',warn:WARNING};
const PROT=/^(bcp\d\d|csb[a-z]*|me08|wes84o?|rca|rcus[vp]?|pres)$/;
function setRite(rite){protestant=PROT.test(rite||'');}
function controls(rite){if(rite!==undefined)setRite(rite);const w=W();return `<div class="mctlbox participation"><label class="sl" for="participation-mode">Participation <select id="participation-mode"><option value="lay"${!isPriest()?' selected':''}>Lay study</option><option value="priest"${isPriest()?' selected':''}>${w.clergy}</option></select></label><p class="note">${isPriest()?w.clergy+': '+w.cons+' are shown. '+w.warn:'Lay study: follow the readings and responses. '+w.cons[0].toUpperCase()+w.cons.slice(1)+' are not shown, and the '+(protestant?'minister\u2019s':'priest-only')+' texts are references, not assigned parts.'+(protestant?'':' Do not attempt the Eucharistic celebration or imitate its priest-only actions.')} Read-aloud omits ${protestant?'the minister\u2019s':'priest-only'} prayers in either mode.${protestant?'':' <a href="#sources" data-canon-link>Canonical guidance</a>'}</p></div>`;}
const veilText=()=>{const w=W();return w.cons[0].toUpperCase()+w.cons.slice(1)+' are not shown in lay study. Follow in silence; do not voice the '+(protestant?'minister\u2019s':'priest\u2019s')+' prayer or imitate '+(protestant?'the institution':'the consecration')+'. ('+(protestant?'Ministers and ordinands':'Priests and seminarians')+': choose Participation \u203a '+w.clergy+'.)';};
/* The first-time question. It never blocks the page: the guide is already drawn in lay study behind it. */
let dlg=null;
function ask(){
 if(get(ASKED)||dlg||typeof document==='undefined')return;
 dlg=document.createElement('dialog');dlg.className='pq';dlg.setAttribute('aria-labelledby','pq-h');
 const step1=`<h2 id="pq-h">${W().q}</h2>
  <p>Some liturgies on this site contain ${W().cons}. They are shown only to ${W().who}.</p>
  <div class="pq-btns"><button type="button" class="tbtn" data-pq="yes">Yes</button><button type="button" class="tbtn pq-alt" data-pq="no">No</button></div>
  <p class="pq-small">You can change this at any time with the Participation setting above each liturgy.</p>`;
 const step2=`<h2 id="pq-h">Before you continue</h2>
  <p class="pq-warn">${W().warn}</p>
  <p>${protestant?'This site is a study aid.':'Priests should celebrate from the approved books of their Church; this site is a study aid.'}</p>
  <div class="pq-btns"><button type="button" class="tbtn" data-pq="ok">I understand: show the full texts</button><button type="button" class="tbtn pq-alt" data-pq="back">Back</button></div>`;
 dlg.innerHTML=step1;
 const done=v=>{dlg.close();dlg.remove();dlg=null;setMode(v);};
 dlg.addEventListener('click',e=>{const b=e.target.closest('[data-pq]');if(!b)return;const a=b.dataset.pq;
  if(a==='yes'){dlg.innerHTML=step2;dlg.querySelector('[data-pq="ok"]').focus();}
  else if(a==='back'){dlg.innerHTML=step1;dlg.querySelector('[data-pq="yes"]').focus();}
  else if(a==='ok')done('priest');
  else if(a==='no')done('lay');});
 /* Escape keeps lay study but asks again next time. */
 dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.close();dlg.remove();dlg=null;});
 document.body.append(dlg);
 if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
 dlg.querySelector('[data-pq="yes"]').focus();
}
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
 /* Several veiled passages in a row read as one notice. */
 el.querySelectorAll('.mbody .veiled').forEach(n=>{let p=n.previousElementSibling;while(p&&p.classList.contains('rub'))p=p.previousElementSibling;if(p&&p.classList.contains('veiled'))n.remove();});
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
document.addEventListener('click',e=>{if(e.target.closest('[data-canon-link]')){e.preventDefault();if(dlg){dlg.close();dlg.remove();dlg=null;}document.getElementById('tab-sources').click();requestAnimationFrame(()=>document.getElementById('canonical-guidance').scrollIntoView({block:'start'}));}});
window.LectParticipation={isPriest,setMode,catholicMass,priestOnly,controls,annotate,ask,setRite,veilText,WARNING};
})();
