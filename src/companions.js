/* Complete devotional alternatives. Historical service coverage is deliberately unchanged. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pending;
function load(){return pending||(pending=fetch('data/devotional-companions.json').then(r=>{if(!r.ok)throw Error('Companion texts unavailable');return r.json();}).catch(e=>{pending=null;throw e;}));}
const family=ctx=>{const r=ctx.office?.rite||ctx.rite;return /^(b|byz|byzv|byzm|byzh|byzc)$/.test(r)?'eastern-orthodox':/^(arm|copt|adai)$/.test(r)?'oriental':/^(bcp)/.test(r)?'anglican':/^csb/.test(r)?'lutheran':/^(rcus|rcusv|rcusp|rca|pres)$/.test(r)?'reformed':/^(wes|me08)/.test(r)?'methodist':'catholic';};
const p=s=>`<p>${esc(s)}</p>`;
const section=(title,body,source='Original devotional text')=>`<section class="companion-section"><h2>${esc(title)}</h2><p class="companion-source">${esc(source)}</p>${body}</section>`;
function scripture(r){return `<p class="cite">${esc(r.cite)} · King James Version</p>`+r.verses.map(v=>`<p><sup>${v.n}</sup> ${esc(v.text)}</p>`).join('');}
function prayers(P,C){return [
 section('Gathering',p(P.opening)+p('We offer this time to God, remembering those who cannot find a quiet place or a moment of rest. Amen.')),
 section('Confession and turning again',p(P.confession)+p('In silence, name a wrong to repair and a kindness to begin.')),
 section('Psalm',scripture(C.psalm),'Historical text · selected for this companion, not an appointed psalm'),
 section('Scripture',scripture(C.reading),'Historical text · selected for this companion, not a lectionary appointment'),
 section('Reflection and response',p(`Today we reflect on ${C.theme.toLowerCase()}. Which word in the reading asks for our attention? Who might need the mercy, courage or generosity it describes?`)+p('Keep a little silence. Then name one concrete act of love for today.')+p('God of truth and mercy, let what we have heard take root in what we do. Amen.')),
 section('Intercession',p(P.intercessions)+p('For those we have named and those we have forgotten, for our enemies as well as our friends: give help, healing and peace. Make us ready to take our part in answering these prayers. Amen.')),
 section('Thanksgiving',p('God of life, we thank you for the gifts we did not earn: the earth that sustains us, the people who have cared for us, and the mercy we have received in Jesus Christ. Receive our gratitude, and teach us to share freely what has been entrusted to us. Amen.')),
 section('Sending',p(P.sending)+p('Keep us in the love of the Father, in the grace of Jesus Christ, and in the fellowship of the Holy Spirit, today and always. Amen.'))
 ].join('');}
async function page(entry,key,index){const D=await load(),i=index===undefined?new Date(window.LitDate.today()+'T12:00:00Z').getUTCDay():Number(index);
 if(!Number.isInteger(i)||i<0||i>6)return '<h1>Companion not found</h1><p>Choose a companion from Works in progress.</p>';
 const P=D.profiles[entry.family]||D.profiles.catholic,C=D.cycle[i];
 return `<article class="devotional-companion"><p class="san-eyebrow">Completed devotional companion · Scripture and original prayer</p><h1>${esc(entry.title)}</h1><p class="san-lede">${esc(P.theme)} · about 10–15 minutes</p><p class="companion-notice">An original prayer companion inspired by this tradition. It is not this church’s official service, a reconstruction of its missing book, or a celebration of the Eucharist. Scripture is from the public-domain King James Version; all other prayers and reflections below are original compositions.</p>${entry.note?`<details><summary>Historical guide coverage</summary>${p(entry.note)}</details>`:''}
 <div class="companion-actions">${entry.launch?`<button data-launch="${esc(entry.launch)}">Open historical guide</button>`:''}<button data-route="${esc(entry.back)}">${entry.launch?'Back to works in progress':'Explore this tradition'}</button><button data-companion-export>Download text</button><button data-companion-print>Print</button></div>
 <nav class="companion-cycle" aria-label="Seven companion readings">${D.cycle.map((c,j)=>`<button data-route="#/companion/${esc(key)}/${j}"${i===j?' aria-current="true"':''}>${esc(c.theme)}</button>`).join('')}</nav>
 <h2 class="companion-theme">${esc(C.theme)}</h2>${prayers(P,C)}
 <footer class="companion-provenance"><h2>Sources and authorship</h2><p><a href="${esc(D.scriptureSource.url)}">${esc(D.scriptureSource.title)}</a>. References and verse numbers are printed with each passage. The seven selections are an editorial devotional cycle, not a church calendar.</p>${p(D.originalSource)}<p>Family themes describe the inspiration for these compositions, not an endorsement by any church. The historical guide and its source notices remain separate.</p></footer></article>`;
}
function supplement(text,P){
 if(/Eucharistic|consecration|Anaphora|Canon\b|words of institution|priest.only|not appointed|No .*appointed/i.test(text))return null;
 if(/Intercession|[Ll]itan|commemoration/.test(text))return P.intercessions+' For all in need of mercy and peace, hear our prayer. Amen.';
 if(/Collect|concluding prayer|Post.?Communion|Prayer after|Prayer over/i.test(text))return P.opening+' Receive our gratitude and guide us in the love of Jesus Christ. Amen.';
 if(/Antiphon|stichera|troparion|kontakion|Apolytikion|Responsory|Prokeimenon/i.test(text))return 'God of mercy, gather us in peace.\n\nLet our hearts attend to your Word, and our lives bear the fruit of love.';
 if(/Hymn/i.test(text))return 'Light of Christ, within us shine;\nTeach our hearts your love divine.\nWhere the wounded wait for care,\nSend us, Lord, your peace to share.\n\nIn our labour, in our rest,\nMay the lonely find a guest.\nWith the gifts your hands bestow,\nLet our thankful service grow. Amen.';
 if(/Preface|thanksgiving/i.test(text))return 'God of every good gift, we thank you for creation, for the hope made known in Jesus Christ, and for the Spirit who strengthens us to love. Join our praise with all who seek your peace, and make our gratitude fruitful in service. Amen.';
 if(/[Bb]lessing|[Dd]ismissal/.test(text))return P.sending+' Amen.';
 return null;
}
async function decorate(body,ctx){const token=Symbol();body.__companion=token;
 const cues=[...body.querySelectorAll('.cue:not(.veiled):not([data-priest-only])')];if(!cues.length)return;
 try{const D=await load();if(body.__companion!==token||!body.isConnected)return;const P=D.profiles[family(ctx)];let n=0;
 cues.forEach(c=>{if(c.closest('[data-priest-only]'))return;if(c.nextElementSibling?.classList.contains('mytext')||c.nextElementSibling?.classList.contains('mt-edit'))return;
 const copy=c.cloneNode(true);copy.querySelectorAll('button').forEach(b=>b.remove());const t=supplement(copy.textContent,P);if(!t)return;n++;
 const d=document.createElement('details');d.className='devotional-alternative';d.innerHTML='<summary>Devotional alternative · original text</summary><p class="note">For personal prayer. This is a newly composed alternative, not the named book’s text or its appointed proper.</p>'+t.split('\n\n').map(x=>'<p>'+esc(x).replace(/\n/g,'<br>')+'</p>').join('');c.after(d);
 });
 if(n){const note=document.createElement('p');note.className='note companion-guide-note';note.textContent=`${n} original devotional alternatives are available below the unfilled prayer cues. Open an alternative to read it; the historical guide and its coverage labels are unchanged.`;body.prepend(note);}
 }catch(e){/* The source guide remains usable if the optional companion pack cannot load. */}
}
window.addEventListener('beforeprint',()=>{if(document.body.classList.contains('san-open')&&document.querySelector('#sanctuary .devotional-companion'))document.body.classList.add('companion-print');});
window.addEventListener('afterprint',()=>document.body.classList.remove('companion-print'));
document.addEventListener('click',e=>{if(e.target.closest('[data-companion-print]')){window.print();}
 if(e.target.closest('[data-companion-export]')){const article=e.target.closest('.devotional-companion'),text=[...article.querySelectorAll('h1,h2,p,summary')].map(n=>n.innerText).join('\n\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='lectionarium-devotional-companion.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
window.LectCompanions={load,page,decorate};
})();
