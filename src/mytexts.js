/* ================================================================ YOUR TEXTS
   Where a text is copyrighted the guide prints a cue ("Collect of the day: Heritage Missal"). Here the
   user can type or paste that text from their own book once; it is kept in this browser only and shown
   in place from then on: for every day (the Ordinary) or for this day (a proper). Export and import as a
   file move a collection between devices. Nothing is sent anywhere, and live sessions do not share it. */
(function(){
"use strict";
const KEY="lect-mytexts";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function load(){ try{ const v=JSON.parse(localStorage.getItem(KEY)||"{}"); return v&&typeof v==="object"?v:{}; }catch(e){ return {}; } }
function save(db){ try{ localStorage.setItem(KEY,JSON.stringify(db)); return true; }catch(e){ return false; } }

/* which cues stand in for a text (as opposed to a plain instruction) */
const TEXTY=/Heritage Missal|Divine Worship|propers?\b|Collect|Preface|Prayer|Antiphon|[Vv]erse|Eucharistic|Creed|English|not reproduced|Psalm|psalm|stichera|troparion|Troparion|Apolytikion|[Ll]itan|Intercession|[Rr]eading|Responsory|[Cc]anticle|Doxology|[Bb]lessing|[Dd]ismissal|commemoration|[Kk]ontakion|Phos|Lauds|Aposticha|versicle|Into (thy|your) hands|Prokeimenon|Alleluia|Introit|Offertory|Hymn|hymn|Vouchsafe|Embolism|forms|Penitential|I confess|Gospel/;
const NOT=/^(Postures follow|Brief form|The words of|Some of the data|Procession with palms|The gifts are|Intentions for the Church|Read on Sundays|From Pascha)/;
/* propers change with the day; the Ordinary does not */
const DAYLY=/of the day|propers?\b|Collect|Prayer over|Post-?Communion|Preface of the day|Proper Preface|Antiphon|Verse before|readings for the day|stichera|troparion|Troparion|Apolytikion|[Kk]ontakion|Aposticha|commemoration|Intercession|Prokeimenon|Alleluia with|Introit|Offertory sentence|paremias|of the tone|[Rr]eading|Responsory|Hymn\b|hymn\b|Lenten acclamation|Gospel/;
const norm=t=>String(t).replace(/\s+/g," ").replace(/\d{4}-\d{2}-\d{2}/g,"").trim().slice(0,160);

let CTX=null;
function baseKey(cueText){ return [CTX.rite, CTX.hour||"", norm(cueText)].join("|"); }
function find(db, cueText){ const b=baseKey(cueText); return db[b+"|"+CTX.iso]?{k:b+"|"+CTX.iso,day:true,...db[b+"|"+CTX.iso]}:db[b]?{k:b,day:false,...db[b]}:null; }

/* a typed text becomes paragraphs; lines starting V./℣. or R./℟. are versicle and response */
function toHTML(t, role){
  return String(t).split(/\n\s*\n|\r\n\s*\r\n/).map(par=>{
    const lines=par.split(/\n/).map(l=>l.trim()).filter(Boolean); if(!lines.length) return "";
    if(lines.some(l=>/^(V|R|℣|℟)\.\s/.test(l))) return lines.map(l=>{ const m=/^(V|R|℣|℟)\.\s+(.*)$/.exec(l);
      if(!m) return `<p data-r="${role}">${esc(l)}</p>`; const resp=m[1]==="R"||m[1]==="℟";
      return `<p data-r="${resp?"ppl":role}"><span class="sp">${resp?"℟.":"℣."}</span> ${esc(m[2])}</p>`; }).join("");
    return `<p data-r="${role}">${lines.map(esc).join("<br>")}</p>`;
  }).join("");
}
const ROLES_MASS=[["all","Everyone"],["cel","Celebrant"],["srv","Server or deacon"],["lec","Lector"],["ppl","Congregation"]];
const ROLES_OFF=[["all","All"],["cel","Officiant"],["lec","Reader"]];
function guessRole(t){ return /Collect|Prayer over|Post-?Communion|Preface|Eucharistic|[Bb]lessing|Embolism|Pray, brethren|Prayer after|[Pp]riest/.test(t)?"cel":/[Rr]eading|Lesson|Epistle/.test(t)?"lec":"all"; }

function editor(cueEl, cueText, cur){
  const roles=CTX.office?ROLES_OFF:ROLES_MASS, day=cur?cur.day:DAYLY.test(cueText);
  const f=document.createElement("form"); f.className="mt-edit";
  f.innerHTML=`<label class="lbl" for="mtT">Text from your book</label>
    <textarea id="mtT" rows="6" placeholder="Type or paste the text. A blank line starts a new paragraph; start a line with V. or R. for versicle and response.">${esc(cur?cur.t:"")}</textarea>
    <div class="mt-row"><label>Said by <select name="r">${roles.map(([k,v])=>`<option value="${k}"${(cur?cur.r:guessRole(cueText))===k?" selected":""}>${v}</option>`).join("")}</select></label>
    <fieldset class="mt-scope"><legend class="sr-only">Use it</legend><label><input type="radio" name="s" value="day"${day?" checked":""}> This day only</label><label><input type="radio" name="s" value="all"${day?"":" checked"}> Every day</label></fieldset></div>
    <div class="mt-row"><button type="submit" class="tbtn">Save</button><button type="button" class="tbtn ghost" data-a="cancel">Cancel</button>${cur?`<button type="button" class="tbtn ghost" data-a="del">Remove</button>`:""}</div>
    <p class="note">Saved in this browser only. Use Export below to copy your texts to another device.</p>`;
  cueEl.after(f); f.querySelector("textarea").focus();
  const close=()=>{ f.remove(); };
  f.addEventListener("submit",e=>{ e.preventDefault(); const t=f.querySelector("textarea").value.trim(); const db=load(); const b=baseKey(cueText);
    delete db[b]; delete db[b+"|"+CTX.iso];
    if(t) db[f.s.value==="day"?b+"|"+CTX.iso:b]={t,r:f.r.value,ts:Date.now()};
    if(!save(db)){ alertNote(f,"This browser would not save it (storage is full or blocked)."); return; }
    close(); redraw(); });
  f.querySelector('[data-a="cancel"]').addEventListener("click",close);
  const del=f.querySelector('[data-a="del"]'); if(del) del.addEventListener("click",()=>{ const db=load(); delete db[cur.k]; save(db); close(); redraw(); });
}
function alertNote(f,msg){ let n=f.querySelector(".mt-err"); if(!n){ n=document.createElement("p"); n.className="note mt-err"; f.appendChild(n); } n.textContent=msg; }
let REDRAW=null; function redraw(){ if(REDRAW) REDRAW(); }

function decorate(body, ctx, redrawFn){
  CTX={rite:ctx.office?("office-"+ctx.office.rite):ctx.rite, hour:ctx.office?ctx.office.hour:"", iso:ctx.iso, office:!!ctx.office};
  REDRAW=redrawFn; const db=load(); let n=0, filled=0;
  body.querySelectorAll(".cue").forEach(cueEl=>{
    const text=cueEl.textContent.trim(); if(!TEXTY.test(text)||NOT.test(text)) return; n++;
    const cur=find(db,text);
    cueEl.classList.add("cue-t");
    const btn=document.createElement("button"); btn.type="button"; btn.className="mt-btn"; btn.textContent=cur?"Edit your text":"Add text";
    btn.setAttribute("aria-label",(cur?"Edit your text for: ":"Add your text for: ")+text.slice(0,80));
    btn.addEventListener("click",()=>{ const open=cueEl.nextElementSibling; if(open&&open.classList.contains("mt-edit")){ open.remove(); return; } editor(cueEl,text,cur); });
    cueEl.appendChild(btn);
    if(cur){ filled++; const d=document.createElement("div"); d.className="mytext"; d.innerHTML=`<span class="mt-lbl">From your book${cur.day?" · this day":""}</span>`+toHTML(cur.t,cur.r||"all"); cueEl.after(d); }
  });
  if(n){ const total=Object.keys(db).length; const bar=document.createElement("div"); bar.className="mt-bar";
    bar.innerHTML=`<span><b>Your texts</b> · ${filled} of ${n} cues here filled from your book · ${total} saved in all</span>
      <button type="button" class="tbtn ghost" data-a="exp">Export</button><label class="tbtn ghost mt-imp">Import<input type="file" accept=".json,application/json" hidden></label>
      <details class="mt-help"><summary>What is this?</summary><p class="note">Some texts (the modern Missal and Breviary translations, Divine Worship, Byzantine Daily Worship) are copyrighted, so the guide names them instead of printing them. Press <b>Add text</b> beside any of those notes to type or paste the text from your own book. It is kept in this browser and shown in its place from then on, for every day or just this day.</p></details>`;
    body.prepend(bar);
    bar.querySelector('[data-a="exp"]').addEventListener("click",async()=>{ const data=JSON.stringify({lectionarium:"texts",v:1,texts:load()},null,1);
      const r=window.LectTools&&window.LectTools.saveFile?await window.LectTools.saveFile("lectionarium-my-texts.json",data):null;
      if(!r){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:"application/json"})); a.download="lectionarium-my-texts.json"; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); } });
    bar.querySelector(".mt-imp input").addEventListener("change",async e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return;
      try{ const j=JSON.parse(await f.text()); const t=j&&j.texts; if(!t||typeof t!=="object") throw 0; const db=load(); let k=0;
        for(const [key,v] of Object.entries(t)){ if(typeof key==="string"&&key.length<400&&v&&typeof v.t==="string"&&v.t.length<20000){ db[key]={t:v.t,r:/^(all|cel|srv|lec|ppl)$/.test(v.r)?v.r:"all",ts:+v.ts||Date.now()}; k++; } }
        save(db); redraw(); }catch(err){ const s=bar.querySelector("span"); if(s) s.textContent="That file is not a Lectionarium texts export."; } });
  }
}
window.LectTexts={decorate, count:()=>Object.keys(load()).length};
})();
