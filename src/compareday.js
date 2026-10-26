/* Readings by day: one date, every lectionary on the site, side by side. Each row says how its church names the
   day, lists the Scripture it appoints for the Eucharist (or the Lord's Day service), and opens as a service. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cache={};
const J=p=>cache[p]||(cache[p]=fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json();}).catch(e=>{delete cache[p];throw e;}));
const today=window.LitDate.today;
const shift=(iso,n)=>new Date(Date.parse(iso+"T00:00:00Z")+n*864e5).toISOString().slice(0,10);
const tcase=t=>String(t||"").toLowerCase().replace(/(^|\s)\w/g,m=>m.toUpperCase()).replace(/\b(In|Of|The|After|Before|And|To|Our|With)\b/g,m=>m.toLowerCase()).replace(/^./,m=>m.toUpperCase());
const R=(lab,cite,num,tr)=>({lab,cite,num:num||"k",tr:tr||"kj"});

/* A lectionary of the shared layer (LectCalendar.fromTable): its own calendar's lessons, ignoring a local choice. */
async function table(rite,iso){ const L=window.LectCalendar.TABLES[rite]; if(!L) return null;
  const T=await J(L.file), K=L.calendar(iso), reads=[], names=[];
  for(const k of K.keys){ let D=T.days[k]; if(!D) continue; names.push(D.t); if(D.as) D={...T.days[D.as],t:D.t};
    for(const [col,cite,ver] of D.r||[]){ const dr=(ver||L.tr)==="dr"; reads.push(R(T.cols[col],cite,dr?"v":L.num,dr?"dr":"kj")); } }
  return {name:names.join(" · ")+(names.length&&K.weekday?" (the Sunday's lessons)":""),reads,note:reads.length?"":K.empty}; }
/* Each source: tradition, book, the rite it opens, and a function giving {name, reads, note} for a date. */
const SOURCES=[
 {fam:"catholic",book:"Roman Missal · Lectionary for Mass",rite:"n",get:async(iso,day)=>day.n&&{name:day.n.t,reads:(day.n.r||[]).map(x=>R(x[0],x[1],"n","dr"))}},
 {fam:"catholic",book:"Divine Worship: The Missal (Ordinariate)",rite:"o",get:async(iso,day)=>day.o&&{name:day.o.s&&/Divine Worship:/.test(day.o.s)?day.o.s.replace(/^Divine Worship: /,""):day.o.t,reads:(day.o.r||[]).map(x=>R(x[0],x[1],"n","kj")),same:"n"}},
 {fam:"catholic",book:"Roman Missal of 1962",rite:"m",get:async(iso,day)=>day.m&&{name:day.m.t,reads:(day.m.r||[]).map(x=>R(x[0],x[1],x[2]||"v","dr"))}},
 {fam:"catholic",book:"Roman Missal before 1955",rite:"p",get:async(iso,day)=>day.p&&{name:day.p.t,reads:(day.p.r||[]).map(x=>R(x[0],x[1],x[2]||"v","dr")),same:"m"}},
 {fam:"catholic",book:"Ambrosian Missal of 1954 (Milan)",rite:"a",get:iso=>table("a",iso)},
 {fam:"eastern-orthodox",book:"Byzantine Apostol and Gospel",rite:"b",get:async(iso,day)=>day.b&&{name:[day.b.t,day.b.s].filter(Boolean).join(" · "),reads:(day.b.r||[]).map(x=>R(x[0],x[1],"n","dr"))}},
 {fam:"oriental",book:"Coptic Orthodox Katameros",rite:"copt",get:async iso=>{const L=await window.LectCalendar.appointments({rite:"copt",type:"mass",iso});
   const nm=(window.LectApp.dayNames(iso,{})||[]).find(x=>x.fam==="oriental");return L&&{name:nm?nm.name:"",reads:(L.items||[]).filter(x=>!x.issue).map(x=>R(x.lab,x.cite,x.num,x.tr)),note:L.items&&!L.items.length?"No Liturgy appointment in the snapshot for this date.":""};}},
 {fam:"oriental",book:"Church of the East · Maclean's lectionary (1894)",rite:"adai",get:iso=>table("adai",iso)},
 {fam:"anglican",book:"Book of Common Prayer 1662",rite:"bcp62",get:async(iso,day,days)=>pb("data/bcp1662.json",iso,day,days)},
 {fam:"anglican",book:"Book of Common Prayer 1928 (USA)",rite:"bcp28",get:async(iso,day,days)=>pb("data/bcp1928.json",iso,day,days)},
 {fam:"anglican",book:"Book of Common Prayer 1979 (USA) · original Eucharistic table",rite:"bcp79",get:async iso=>{const L=await window.LectCalendar.pb79({rite:"bcp79",type:"mass",iso});
   return L&&{name:L.title||"",reads:(L.items||[]).map(x=>R(x.lab,x.cite,x.num,x.tr)).concat((L.psalms||[]).map(c=>R("Psalm",c))),note:L.items&&L.items.length?"The Episcopal Church now reads the Revised Common Lectionary.":""};}},
 {fam:"lutheran",book:"Common Service Book (1917-19)",rite:"csb",get:async iso=>{const B=await J("data/lutheran-csb.json"),C=window.LectCSB.day(iso,B.days),P=C&&C.day;if(!P)return null;
   const S=P.sets[P.sets.length-1];return {name:P.t+(C.weekday?" (the Sunday's propers)":""),reads:[S.epistle&&R("The Epistle",S.epistle.ref||S.epistle.cite),S.gospel&&R("The Gospel",S.gospel.ref||S.gospel.cite)].filter(Boolean),printed:[S.epistle&&S.epistle.cite,S.gospel&&S.gospel.cite].filter(Boolean)};}},
 {fam:"methodist",book:"Wesley's Sunday Service (1784)",rite:"wes84",get:async(iso,day,days)=>pb("data/bcp1784.json",iso,day,days)},
 {fam:"reformed",book:"Reformed Church in America Liturgy (1882) · Order of Scripture Lessons",rite:"rca",get:async iso=>{const T=await J("data/rca1882-lessons.json"),L=window.LectReformed.rca(T,iso);
   return L&&{name:L.t,reads:[R("Old Testament",L.m[0]),R("New Testament",L.m[1])],note:`Evening: ${L.e.join("; ")}.`};}},
 {fam:"reformed",book:"Mercersburg Order of Worship (1866)",rite:"rcus",get:async iso=>{const T=await J("data/mercersburg.json"),D=window.LectReformed.merc(iso),P=T.propers[D.k];if(!P)return null;
   const L=T.lessons[D.k];return {name:P.t+(D.weekday&&!D.fest?" (the Sunday's propers)":""),reads:[R("The Gospel",P.g),R("The Epistle",P.e)],note:L?`Table of lessons, morning: ${L.m.join("; ")}; evening: ${L.e.join("; ")}.`:""};}}
];
const FAMS={catholic:"Catholic","eastern-orthodox":"Eastern Orthodox and Byzantine Catholic",oriental:"Oriental Orthodox and the Church of the East",anglican:"Anglican",lutheran:"Lutheran",methodist:"Methodist",reformed:"Reformed"};
/* The Prayer Book cites its lessons as printed ("Rom. 13, 8."): the Bible text needs the plain form, so the KJV opening verse is enough to read from. */
function bookCite(c){
 const m=/^(?:St\.\s*)?((?:[1-3]\s*)?[A-Za-z]+)\.?\s*([ivxlc]+|\d+)[.,]?\s*(\d+)?/i.exec(String(c||"").trim()); if(!m) return null;
 const ab={gen:"Gen",exod:"Exod",isai:"Isa",isa:"Isa",jer:"Jer",mal:"Mal",joel:"Joel",matth:"Matt",matt:"Matt",mark:"Mark",luke:"Luke",john:"John",acts:"Acts",rom:"Rom",cor:"Cor",gal:"Gal",eph:"Eph",ephes:"Eph",phil:"Phil",philipp:"Phil",col:"Col",thess:"Thess",tim:"Tim",tit:"Titus",heb:"Heb",jam:"Jas",james:"Jas",pet:"Pet",jude:"Jude",rev:"Rev",zech:"Zech",zeph:"Zeph",wisd:"Wis"};
 let b=m[1].replace(/\s+/g," "), n=""; const mm=/^(\d)\s*([A-Za-z]+)$/.exec(b); if(mm){ n=mm[1]+" "; b=mm[2]; }
 const B=ab[b.toLowerCase()]; if(!B) return null;
 const ch=/^\d+$/.test(m[2])?+m[2]:roman(m[2]); return `${n}${B} ${ch}${m[3]?":"+m[3]:""}`;
}
function roman(s){const v={i:1,v:5,x:10,l:50,c:100};let t=0;s=s.toLowerCase();for(let i=0;i<s.length;i++){const a=v[s[i]],b=v[s[i+1]]||0;t+=a<b?-a:a;}return t;}
async function pb(file,iso,day,days){
 const B=await J(file), pr=window.LectPB.propers(B,iso,day||{},days); if(!pr) return null; const S=pr.sets[0]||{};
 const reads=[], printed=[];
 for(const [lab,k] of [["The Epistle","epistle"],["The Gospel","gospel"]]){ const L=S[k]; if(!L) continue; printed.push(L.cite); const c=bookCite(L.cite); reads.push(c?{...R(lab,c),text:L.text}:{lab,cite:L.cite,text:L.text}); }
 return {name:tcase(pr.t),reads,printed};
}
let serial=0;
async function render(iso){
 const out=$("#cdOut"); if(!out) return; const my=++serial;
 try{ await window.LectLoad.service(); }catch(e){}
 $("#cdDate").value=iso; out.innerHTML=`<p class="note">Gathering the lectionaries for ${esc(window.LectApp.longDate(iso))}…</p>`;
 const days=await window.LectDays.load(iso);
 const day=days[iso]||{};
 const rows=await Promise.all(SOURCES.map(async s=>{ try{ return {s,v:await s.get(iso,day,days)}; }catch(e){ console.warn(e); return {s,v:null}; } }));
 if(my!==serial) return;
 const by={}; rows.forEach(r=>{ (by[r.s.fam]=by[r.s.fam]||[]).push(r); });
 const key=v=>v?JSON.stringify(v.reads.map(x=>x.cite)):"";
 const html=Object.entries(FAMS).filter(([f])=>by[f]).map(([f,label])=>`<section class="cd-fam"><h3>${esc(label)}</h3>${by[f].map(({s,v})=>{
   if(!v) return `<article class="cd-row cd-none"><h4>${esc(s.book)}</h4><p class="note">No appointment for this date.</p></article>`;
   const twin=v.same&&rows.find(r=>r.s.rite===v.same), dup=twin&&twin.v&&key(twin.v)===key(v);
   return `<article class="cd-row"><header><h4>${esc(s.book)}</h4><button type="button" class="ghost cd-open" data-rite="${esc(s.rite)}">Open the service</button></header>
    <p class="cd-name">${esc(v.name||"")}</p>
    ${dup?`<p class="note">The same readings as the ${esc(twin.s.book)}.</p>`:v.reads.length?`<ul class="cd-reads">${v.reads.map((x,i)=>`<li><span class="cd-lab">${esc(x.lab)}</span> <button type="button" class="cd-cite" data-i="${i}" aria-expanded="false">${esc(v.printed&&v.printed[i]&&v.printed[i]!==x.cite?v.printed[i]:x.cite)}</button><div class="cd-text" hidden></div></li>`).join("")}</ul>`:""}
    ${v.note?`<p class="note">${esc(v.note)}</p>`:""}</article>`;}).join("")}</section>`).join("");
 out.innerHTML=html+`<p class="note">The Armenian lectionary, the Mozarabic lectionary and the Revised Common Lectionary are not yet on this site. Dates follow the Gregorian calendar throughout; churches that keep the Julian calendar read these lessons thirteen days later.</p>`;
 out.querySelectorAll(".cd-open").forEach(b=>b.addEventListener("click",()=>{ const r=b.dataset.rite; document.getElementById("tab-today").click(); window.LectApp.follow({type:"mass",rite:r,hour:null,iso}); }));
 out.querySelectorAll(".cd-cite").forEach(b=>b.addEventListener("click",async()=>{
   const art=b.closest(".cd-row"), fam=b.closest(".cd-fam"), book=art.querySelector("h4").textContent;
   const row=rows.find(r=>r.s.book===book), x=row&&row.v&&row.v.reads[+b.dataset.i], box=b.nextElementSibling;
   const open=b.getAttribute("aria-expanded")!=="true"; b.setAttribute("aria-expanded",String(open)); box.hidden=!open;
   if(!open||box.dataset.done) return; box.dataset.done="1";
   if(x&&x.text&&x.text.length){ box.innerHTML=x.text.map(t=>`<p>${esc(t)}</p>`).join(""); return; }
   try{ const p=await window.LectApp.passage(x.cite,x.num,x.tr); box.innerHTML=p.html; }catch(e){ box.textContent="The text could not load."; }
 }));
}
function init(){
 const inp=$("#cdDate"); if(!inp) return; let cur=today();
 if(cur<inp.min) cur=inp.min; if(cur>inp.max) cur=inp.max;
 let loaded=false; const go=iso=>{ if(iso<inp.min||iso>inp.max) return; cur=iso; render(iso); };
 inp.addEventListener("change",()=>{ if(inp.value) go(inp.value); });
 document.querySelectorAll("[data-cd]").forEach(b=>b.addEventListener("click",()=>{ const n=+b.dataset.cd; go(n?shift(cur,n):today()); }));
 const tab=document.getElementById("tab-day"), panel=document.getElementById("day");
 const maybe=()=>{ if(!loaded&&panel&&!panel.hidden){ loaded=true; go(cur); } };
 if(tab) tab.addEventListener("click",()=>setTimeout(maybe,0));
 window.addEventListener("hashchange",()=>setTimeout(maybe,0)); setTimeout(maybe,0);
}
init();
})();
