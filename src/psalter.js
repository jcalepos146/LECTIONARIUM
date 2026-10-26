/* The Psalter: the psalms of a date in three courses (the Prayer Book's monthly course in Coverdale's version, John
   Wesley's selection of 1784, the Liturgy of the Hours' four-week psalter in the Douay-Rheims), or one psalm in the
   Coverdale, Douay-Rheims and King James versions side by side. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let wesley=null;
const W=()=>wesley||(wesley=fetch("data/bcp1784-psalter.json").then(r=>r.json()).catch(e=>{wesley=null;throw e;}));
const today=window.LitDate.today;
/* Hebrew (Prayer Book, King James) numbering to the Greek and Latin numbering of the Douay-Rheims */
const vulg=n=>n<=8||n>=148?String(n):n===9||n===10?"9":n<=113?String(n-1):n===114||n===115?"113":n===116?"114–115":n<=146?String(n-1):"146–147";
const GLORIA="Glory be to the Father, and to the Son: and to the Holy Ghost; As it was in the beginning, is now, and ever shall be: world without end. Amen.";
const ord=n=>n+(["th","st","nd","rd"][n%10>3||[11,12,13].includes(n%100)?0:n%10]);
/* Wesley's table: the Prayer Book's rule for the day of the month (February borrows from January and March) */
function wesleyDay(iso){
 const d=new Date(iso+"T00:00:00Z"), mo=d.getUTCMonth()+1, dt=d.getUTCDate(), Y=d.getUTCFullYear(), leap=(Y%4===0&&Y%100!==0)||Y%400===0;
 return mo===1&&dt===31?1:mo===2?dt+1:mo===3&&dt===1?(leap?1:30):dt===31?30:dt;
}
const verses=v=>v.map(([n,t])=>`<p><sup>${n}</sup> ${esc(t)}</p>`).join("");
async function text(cite,tr){ try{ const p=await window.LectApp.passage(cite,"k",tr); return p.html; }catch(e){ return `<p class="note">The text could not load.</p>`; } }
function state(){ return {mode:document.querySelector("[data-psmode][aria-pressed=true]")?.dataset.psmode||"day", when:document.querySelector("[data-pswhen][aria-pressed=true]")?.dataset.pswhen||"m", iso:$("#psDate").value||today(), n:Math.max(1,Math.min(150,+$("#psNum").value||1))}; }
let serial=0;
async function render(){
 const out=$("#psOut"), S=state(), my=++serial; if(!out) return;
 document.querySelectorAll("[data-psfor]").forEach(el=>el.hidden=el.dataset.psfor!==S.mode);
 out.innerHTML=`<p class="note">Opening the Psalter…</p>`;
 let html="";
 if(S.mode==="day"){
  const P=await window.LectApp.psalmsOfDay(S.iso), Wd=(await W()).psalter, wn=wesleyDay(S.iso), E=S.when==="e";
  const dn=new Date(S.iso+"T00:00:00Z").getUTCDate(), bd=dn===31?30:dn;
  const bcp=E?P.bcp.e:P.bcp.m, wes=Wd[String(wn)][E?"e":"m"], loth=E?P.loth.vespers:P.loth.lauds;
  let a=`<h3>The Book of Common Prayer</h3><p class="cite">The ${ord(bd)} Day · ${E?"Evening":"Morning"} Prayer · Coverdale's version (1662)${dn===31?" · on the thirty-first the psalms of the thirtieth are read":""}</p>`;
  for(const c of bcp) a+=`<h4>${esc(c.replace("Ps ","Psalm "))}</h4>${await text(c,"cv")}<p class="gp">${GLORIA}</p>`;
  let b=`<h3>Wesley's Sunday Service</h3><p class="cite">The ${ord(wn)} Day · ${E?"Evening":"Morning"} Prayer · John Wesley's selection (1784)</p>`;
  b+=wes.map(ps=>`<h4>Psalm ${ps.p}${ps.part?` · ${esc(ps.part)}`:""}</h4>${verses(ps.v)}`).join(`<p class="gp">${GLORIA}</p>`);
  let c=`<h3>The Liturgy of the Hours</h3><p class="cite">Week ${esc(P.loth.week)} of the psalter · ${E?"Evening Prayer":"Morning Prayer"} · Douay-Rheims, in the Greek and Latin numbering</p>`;
  for(const x of loth) c+=`<h4>${esc(x.lab)}</h4>${await text(x.cit,"dr")}`;
  html=`<p class="cite">${esc(window.LectApp.longDate(S.iso))}</p><div class="ps-cols">${[a,b,c].map(x=>`<section class="ps-col">${x}</section>`).join("")}</div>`;
 }else{
  const n=S.n, Wd=(await W()).psalter, wes=[], seen=new Set();
  for(const day of Object.values(Wd)) for(const ps of [...day.m,...day.e]) if(ps.p===n&&!seen.has(ps.part)){ seen.add(ps.part); wes.push(ps); }
  const cols=[
   [`Coverdale (Book of Common Prayer)`,`Psalm ${n}`,await text("Ps "+n,"cv")],
   [`Douay-Rheims`,`Psalm ${vulg(n)} in the Douay-Rheims`,await text("Ps "+n,"dr")],
   [`King James Version`,`Psalm ${n}`,await text("Ps "+n,"kj")],
   [`Wesley (1784)`,wes.length?`Psalm ${n} in Wesley's selection`:"",wes.length?wes.map(ps=>(ps.part?`<h4>${esc(ps.part)}</h4>`:"")+verses(ps.v)).join(""):`<p class="note">Wesley left this psalm out of the Sunday Service: he omitted the psalms and verses he judged "highly improper for the mouths of a Christian congregation".</p>`]];
  html=`<div class="ps-nav"><button type="button" class="ghost" data-psstep="-1" ${n<=1?"disabled":""}>‹ Psalm ${n-1}</button><button type="button" class="ghost" data-psstep="1" ${n>=150?"disabled":""}>Psalm ${n+1} ›</button></div><div class="ps-cols four">${cols.map(([h,c,t])=>`<section class="ps-col"><h3>${esc(h)}</h3>${c?`<p class="cite">${esc(c)}</p>`:""}${t}</section>`).join("")}</div>`;
 }
 if(my!==serial) return;
 out.innerHTML=html;
 out.querySelectorAll("[data-psstep]").forEach(b=>b.addEventListener("click",()=>{ $("#psNum").value=S.n+(+b.dataset.psstep); render(); }));
}
function init(){
 const panel=document.getElementById("psalter"); if(!panel) return; let loaded=false;
 $("#psDate").value=(()=>{const t=today();return t<"2025-11-30"?"2025-11-30":t>"2030-11-30"?"2030-11-30":t;})();
 const press=(sel,b)=>{ document.querySelectorAll(sel).forEach(x=>x.setAttribute("aria-pressed",String(x===b))); render(); };
 document.querySelectorAll("[data-psmode]").forEach(b=>b.addEventListener("click",()=>press("[data-psmode]",b)));
 document.querySelectorAll("[data-pswhen]").forEach(b=>b.addEventListener("click",()=>press("[data-pswhen]",b)));
 $("#psDate").addEventListener("change",render); $("#psNum").addEventListener("change",render);
 /* the evening course after four in the afternoon */
 if(new Date().getHours()>=16) document.querySelector('[data-pswhen="e"]')?.setAttribute("aria-pressed","true"), document.querySelector('[data-pswhen="m"]')?.setAttribute("aria-pressed","false");
 const maybe=()=>{ if(!loaded&&!panel.hidden){ loaded=true; render(); } };
 document.getElementById("tab-psalter")?.addEventListener("click",()=>setTimeout(maybe,0));
 window.addEventListener("hashchange",()=>setTimeout(maybe,0)); setTimeout(maybe,0);
}
init();
})();
