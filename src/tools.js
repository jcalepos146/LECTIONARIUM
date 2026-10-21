/* ================================================================ SESSION TOOLS
   Timer, live sessions (shared position for a group), role views, chat script export,
   read-aloud and the printable booklet. Works on any page the Mass / Office guide renders. */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const mmss=sec=>{ sec=Math.max(0,Math.round(sec)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(s).padStart(2,"0"); };
const ls={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const P2P=!(window.claude&&window.claude.use)&&!!window.LectP2P;   // public build: sessions run browser to browser
const cap=name=>(window.claude&&window.claude.use)?window.claude.use(name).catch(()=>null):P2P?window.LectP2P.use(name).catch(()=>null):Promise.resolve(null);

let M=null, EL=null;                                   // current mount
let VIEW=ls.get("lect-view",{role:"",only:false,follow:true});
let RUN={key:"",on:false,acc:0,t0:0,h:null,cur:-1,active:false};    // local timer (host or solo)
let LIVE={mode:null,code:"",unsub:null,doc:null,last:"",room:null,peers:0,peerList:[],myPeer:"",msg:"",cast:{},play:null,playTs:0,castSeen:"",me:{name:ls.get("lect-name",""),ready:false}};
let SOUND={on:false};
let PRES={open:false,i:0,slides:[],lang:"en",follow:true,part:-1};
let SPEAK={on:false,paused:false,items:[],i:0,wait:null,rate:ls.get("lect-rate",1),mine:ls.get("lect-mine","wait")};
let PANEL="";                                          // open panel: live | script | speak | ""

/* ---------------------------------------------------------------- mount */
function mount(el, m){
  M=m; EL=el;
  const key=[m.ctx.rite,m.ctx.hour||"",m.ctx.iso].join("|");
  if(RUN.key!==key){ stopTimer(); RUN={key,on:false,acc:0,t0:0,h:null,cur:-1,active:false}; }
  RUN.cur=-1;
  const speakOK="speechSynthesis" in window && typeof SpeechSynthesisUtterance!=="undefined";
  const roleOpts=Object.entries(m.roles).map(([k,v])=>`<option value="${k}"${VIEW.role===k?" selected":""}>${esc(v)}</option>`).join("");
  el.querySelector(".tools-timer").innerHTML=timerHTML();
  el.querySelector(".tools-bar").innerHTML=`
    <div class="tbar" role="toolbar" aria-label="Session tools">
      <label class="sl tsel">My part <select id="tRole"><option value="">Everyone</option>${roleOpts}</select></label>
      <label class="ck"><input type="checkbox" id="tOnly"${VIEW.only?" checked":""}${VIEW.role?"":" disabled"}> Only my parts</label>
      <span class="tsp"></span>
      <button type="button" class="tbtn ghost" data-panel="live" aria-expanded="${PANEL==="live"}">${LIVE.mode==="host"?"Live · hosting":LIVE.mode==="follow"?"Live · following":"Live session"}</button>
      <button type="button" class="tbtn ghost" id="tPresent">Present</button>
      <button type="button" class="tbtn ghost" data-panel="script" aria-expanded="${PANEL==="script"}">Chat script</button>
      ${speakOK?`<button type="button" class="tbtn ghost" data-panel="speak" aria-expanded="${PANEL==="speak"}">Read aloud</button>`:""}
      <button type="button" class="tbtn ghost" id="tPrint">Print</button>
      <button type="button" class="tbtn ghost" id="tBook">Save booklet</button>
    </div>
    <div class="tpanel" id="tPanel"${PANEL?"":" hidden"}></div>`;
  applyView();
  el.querySelector("#tRole").addEventListener("change",e=>{ VIEW.role=e.target.value; if(!VIEW.role) VIEW.only=false; ls.set("lect-view",VIEW); el.querySelector("#tOnly").disabled=!VIEW.role; el.querySelector("#tOnly").checked=VIEW.only; applyView(); presence(); if(PANEL==="script") renderPanel(); });
  el.querySelector("#tOnly").addEventListener("change",e=>{ VIEW.only=e.target.checked; ls.set("lect-view",VIEW); applyView(); });
  el.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>{ PANEL=PANEL===b.dataset.panel?"":b.dataset.panel; el.querySelectorAll("[data-panel]").forEach(x=>x.setAttribute("aria-expanded",String(PANEL===x.dataset.panel))); renderPanel(); }));
  el.querySelector("#tPrint").addEventListener("click",printNow);
  el.querySelector("#tPresent").addEventListener("click",()=>presentOpen());
  el.querySelector(".mbody").addEventListener("click",musicClick);
  el.querySelector("#tBook").addEventListener("click",saveBooklet);
  wireTimer();
  renderPanel();
  if(LIVE.mode==="host") hostPublish(false);
  if(LIVE.mode==="follow" && LIVE.doc) applyRemote(LIVE.doc,true);
  tick();
  if(PRES.open) presentOpen(true);
}

/* ---------------------------------------------------------------- role views */
function applyView(){
  const body=EL&&EL.querySelector(".mbody"); if(!body) return;
  if(VIEW.role) body.setAttribute("data-view",VIEW.role); else body.removeAttribute("data-view");
  body.toggleAttribute("data-only",!!(VIEW.role&&VIEW.only));
}

/* ---------------------------------------------------------------- timer */
function timerHTML(){
  if(LIVE.mode==="follow") return `<span class="timer"><span class="tlive">Live</span><span class="tnow" id="tNow">Waiting for the host…</span><label class="ck tfollow"><input type="checkbox" id="tFollow"${VIEW.follow?" checked":""}> Follow along</label><button type="button" class="tbtn${SOUND.on?" ghost":""}" id="tSound" aria-pressed="${SOUND.on}">${SOUND.on?"Sound on":"Turn on sound"}</button><button type="button" class="tbtn ghost" id="tLeave">Leave</button></span>`;
  return `<span class="timer${RUN.on||RUN.active?" live":""}"><button type="button" class="tbtn ghost" id="tPrev" aria-label="Previous part">‹</button><button type="button" class="tbtn" id="tStart" aria-pressed="${RUN.on}">${RUN.on?"Pause":RUN.acc?"Resume":"Start timer"}</button><button type="button" class="tbtn ghost" id="tNext" aria-label="Next part">›</button><button type="button" class="tbtn ghost" id="tReset"${RUN.on||RUN.active?"":" hidden"}>Reset</button><span class="tnow" id="tNow"></span>${LIVE.mode==="host"?`<span class="tlive">Live · ${esc(LIVE.code.toUpperCase())}${LIVE.peers>1?` · ${LIVE.peers-1} following`:""}</span>`:""}</span>`;
}
function elapsed(){
  if(LIVE.mode==="follow"&&LIVE.doc){ const r=LIVE.doc.run||{}; return r.on?Math.max(0,(Date.now()-r.startedAt)/1000):(r.acc||0); }
  return RUN.acc+(RUN.on?(performance.now()-RUN.t0)/1000:0);
}
function idxAt(e){ const st=M.starts; let i=st.length-1; while(i>0&&st[i]>e) i--; return i; }
function tick(){
  if(!EL||!M) return;
  const tNow=EL.querySelector("#tNow"); if(!tNow) return;
  const running=LIVE.mode==="follow"?!!(LIVE.doc&&LIVE.doc.run&&(LIVE.doc.run.on||LIVE.doc.run.active)):(RUN.on||RUN.active);
  if(!running){ if(LIVE.mode!=="follow") tNow.textContent=""; highlight(-1); return; }
  const e=elapsed(), i=idxAt(e), total=M.total;
  if(i!==RUN.cur){ highlight(i); if(LIVE.mode==="follow"&&VIEW.follow) scrollToPart(i); RUN.cur=i; if(PRES.open&&PRES.follow&&!(LIVE.mode==="follow"&&LIVE.doc&&LIVE.doc.line>=0)) presentPart(i); if(LIVE.mode==="host") hostPublish(true); }
  const next=i+1<M.starts.length?`next: ${M.parts[i+1].title} in ${mmss(M.starts[i+1]-e)}`:(e<total?`ends in ${mmss(total-e)}`:`over by ${mmss(e-total)}`);
  const paused=LIVE.mode==="follow"?!LIVE.doc.run.on:!RUN.on;
  tNow.textContent=`${mmss(e)} · ${M.parts[i].title} · ${paused?"paused":next}`;
}
function highlight(i){
  EL.querySelectorAll(".runsheet li").forEach((r,k)=>r.classList.toggle("now",k===i));
  EL.querySelectorAll(".mbody .mpart").forEach((s,k)=>s.classList.toggle("now",k===i));
}
function scrollToPart(i){ const s=EL.querySelector(`#mp-${i}`); if(s) s.scrollIntoView({behavior:"smooth",block:"start"}); }
function stopTimer(){ if(RUN.h){ clearInterval(RUN.h); RUN.h=null; } }
function ensureTicking(){ if(!RUN.h) RUN.h=setInterval(tick,1000); }
function wireTimer(){
  const q=s=>EL.querySelector(s);
  if(LIVE.mode==="follow"){
    q("#tFollow").addEventListener("change",e=>{ VIEW.follow=e.target.checked; ls.set("lect-view",VIEW); if(VIEW.follow&&RUN.cur>=0) scrollToPart(RUN.cur); presence(); });
    q("#tLeave").addEventListener("click",leave);
    q("#tSound").addEventListener("click",()=>{ if(SOUND.on){ SOUND.on=false; window.LectMusic&&window.LectMusic.stopAll(); } else { SOUND.on=!!(window.LectMusic&&window.LectMusic.unlock()); } redrawTimer(); if(SOUND.on&&LIVE.doc&&LIVE.doc.play&&LIVE.doc.play.on){ LIVE.playTs=0; applyPlay(LIVE.doc.play); } });
    ensureTicking(); return;
  }
  const jump=dir=>{ const e=elapsed(); let i=idxAt(e); i=dir>0?Math.min(M.starts.length-1,i+1):(e-M.starts[i]>5?i:Math.max(0,i-1)); setElapsed(M.starts[i]); };
  q("#tStart").addEventListener("click",()=>{ if(RUN.on){ RUN.acc=elapsed(); RUN.on=false; } else { RUN.t0=performance.now(); RUN.on=true; RUN.active=true; } redrawTimer(); hostPublish(true); });
  q("#tReset").addEventListener("click",()=>{ RUN.on=false; RUN.acc=0; RUN.cur=-1; RUN.active=false; stopTimer(); redrawTimer(); hostPublish(true); });
  q("#tPrev").addEventListener("click",()=>jump(-1));
  q("#tNext").addEventListener("click",()=>jump(1));
  if(RUN.on) ensureTicking();
}
function setElapsed(sec){ RUN.acc=sec; RUN.active=true; if(RUN.on) RUN.t0=performance.now(); RUN.cur=-1; redrawTimer(); scrollToPart(idxAt(sec)); hostPublish(true); }
function redrawTimer(){ const slot=EL.querySelector(".tools-timer"); slot.innerHTML=timerHTML(); wireTimer(); if(RUN.on) ensureTicking(); RUN.cur=-1; tick(); }

/* ---------------------------------------------------------------- live sessions (db + room) */
const CODE_ALPHA="abcdefghjkmnpqrstuvwxyz23456789";
const newCode=()=>Array.from({length:6},()=>CODE_ALPHA[Math.floor(Math.random()*CODE_ALPHA.length)]).join("");
const normCode=c=>String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12);
function config(){ return {type:M.isOffice?"office":"mass", rite:M.rite, hour:M.ctx.hour||null, iso:M.ctx.iso, opts:M.opts}; }
async function host(){
  const db=await cap("db");
  if(!db){ LIVE.msg="Live sessions need this page opened in Claude, signed in. Share the page with your group so they can open it too."; renderPanel(); return; }
  LIVE.mode="host"; LIVE.code=newCode(); LIVE.msg=""; LIVE.last=""; LIVE.cast={}; LIVE.play=null;
  const ok=await hostPublish(true,true);
  if(!ok){ LIVE.mode=null; renderPanel(); return; }
  joinRoom(); redrawTimer(); renderPanel(); refreshBar();
}
let pubBusy=false, pubAgain=false;
async function hostPublish(force, first){
  if(LIVE.mode!=="host") return true;
  const run={on:RUN.on, acc:RUN.on?0:RUN.acc, startedAt:RUN.on?Date.now()-elapsed()*1000:0, active:RUN.active};
  const body={v:1, ...config(), run, idx:Math.max(0,idxAt(elapsed())), cast:LIVE.cast, play:LIVE.play, line:PRES.open?PRES.i:-1, ts:Date.now()};
  const sig=JSON.stringify({...body,ts:0,run:{on:run.on,acc:Math.round(run.acc),s:Math.round(run.startedAt/1000)}});
  if(!force&&sig===LIVE.last) return true;
  if(sig===LIVE.last) return true;
  if(pubBusy){ pubAgain=true; return true; }
  pubBusy=true;
  try{ const db=await cap("db"); await db.doc("live/"+LIVE.code).set(body); LIVE.last=sig; return true; }
  catch(e){ LIVE.msg=P2P?"Could not start the session. Check your connection and try again; some school or office networks block direct browser connections.":e&&e.code==="invalid_argument"?"You can follow live sessions on this page but not host them: hosting needs Contributor access or higher.":"Could not reach the live session store. Try again in a moment."; if(first) LIVE.mode=null; renderPanel(); return false; }
  finally{ pubBusy=false; if(pubAgain){ pubAgain=false; hostPublish(true); } }
}
async function endHost(){
  const code=LIVE.code; LIVE.mode=null; LIVE.code=""; leaveRoom();
  try{ const db=await cap("db"); if(db) await db.doc("live/"+code).delete(); }catch(e){}
  redrawTimer(); renderPanel(); refreshBar();
}
async function join(code, report){
  code=normCode(code); const say=m=>{ LIVE.msg=m; if(report) report(m); if(EL) renderPanel(); };
  if(code.length<4){ say("Enter the code the host gave you."); return; }
  const db=await cap("db");
  if(!db){ say("Live sessions need this page opened in Claude, signed in."); return; }
  if(LIVE.unsub){ LIVE.unsub(); LIVE.unsub=null; }
  if(LIVE.mode==="host") await endHost();
  say("Connecting…");
  LIVE.mode="follow"; LIVE.code=code; LIVE.doc=null;
  let seen=false;
  LIVE.unsub=db.doc("live/"+code).onSnapshot(snap=>{
    if(!snap.exists){ if(!seen){ say("No live session with that code. Check it with the host."); LIVE.mode=null; if(LIVE.unsub){ LIVE.unsub(); LIVE.unsub=null; } }
      else { leave(); say("The host ended the session."); } return; }
    seen=true; LIVE.msg=""; if(report) report("");
    applyRemote(snap.data(), false);
  }, err=>{ say("The live session stopped updating. Join again to reconnect."); });
  joinRoom();
}
/* bring this page to the host's day, rite and settings, then follow the position */
function applyRemote(d, fromMount){
  if(!d||typeof d!=="object") return;
  const run=(d.run&&typeof d.run==="object")?{on:!!d.run.on,acc:+d.run.acc||0,startedAt:+d.run.startedAt||0,active:!!d.run.active}:{on:false,acc:0,startedAt:0,active:false};
  const safe={type:d.type==="office"?"office":"mass", rite:String(d.rite||"").slice(0,12), hour:d.hour?String(d.hour).slice(0,12):null, iso:/^\d{4}-\d{2}-\d{2}$/.test(d.iso)?d.iso:null, opts:(d.opts&&typeof d.opts==="object")?d.opts:{}, run};
  safe.cast=(d.cast&&typeof d.cast==="object")?d.cast:{};
  safe.play=(d.play&&typeof d.play==="object")?{i:+d.play.i|0,on:!!d.play.on,ts:+d.play.ts||0}:null;
  safe.line=Number.isInteger(d.line)?d.line:-1;
  LIVE.doc=safe;
  const same=M&&M.following&&(M.isOffice?"office":"mass")===safe.type&&M.rite===safe.rite&&(M.ctx.hour||null)===safe.hour&&M.ctx.iso===safe.iso&&JSON.stringify(M.opts)===JSON.stringify({...M.opts,...safe.opts});
  if(!fromMount&&!same&&safe.iso&&window.LectApp){ window.LectApp.follow(safe); return; }
  RUN.cur=-1; ensureTicking(); tick();
  applyCast(); if(safe.play) applyPlay(safe.play);
  if(PRES.open&&PRES.follow&&safe.line>=0) presentGo(safe.line,true);
}
function applyCast(){
  if(LIVE.mode!=="follow"||!LIVE.myPeer||!LIVE.doc) return;
  const r=LIVE.doc.cast[LIVE.myPeer]; const key=LIVE.myPeer+":"+(r||"");
  if(r===undefined||key===LIVE.castSeen) return;
  LIVE.castSeen=key; const role=M&&(r===""||M.roles[r])?r:null; if(role===null) return;
  VIEW.role=role; if(!role) VIEW.only=false; ls.set("lect-view",VIEW);
  const sel=EL&&EL.querySelector("#tRole"); if(sel) sel.value=role; const only=EL&&EL.querySelector("#tOnly"); if(only){ only.disabled=!role; only.checked=VIEW.only; }
  applyView(); presence();
  LIVE.msg=role?`The host gave you the part: ${M.roles[role]}.`:"The host set you to follow as everyone."; renderPanel();
}
/* synced music: the host's play or stop on a chant or hymn reaches every follower who turned sound on */
function figs(){ return [...EL.querySelectorAll(".mbody figure.music")]; }
function musicClick(e){
  const btn=e.target.closest&&e.target.closest("figure.music .play"); if(!btn||LIVE.mode!=="host") return;
  const i=figs().indexOf(btn.closest("figure.music")); if(i<0) return;
  LIVE.play={i,on:btn.textContent.trim().startsWith("■"),ts:Date.now()}; hostPublish(true);
}
function applyPlay(p){
  if(!p||p.ts===LIVE.playTs) return; LIVE.playTs=p.ts;
  const f=figs()[p.i]; if(!f) return; const btn=f.querySelector(".play"); if(!btn) return;
  if(!SOUND.on){ if(p.on){ LIVE.msg="The host started music. Press Turn on sound to hear it."; renderPanel(); const b=EL.querySelector("#tSound"); if(b) b.classList.add("pulse"); } return; }
  const playing=btn.textContent.trim().startsWith("■");
  if(p.on&&!playing){ btn.click(); if(VIEW.follow) f.scrollIntoView({behavior:"smooth",block:"center"}); }
  if(!p.on&&playing) btn.click();
}
function leave(){
  if(LIVE.unsub){ LIVE.unsub(); LIVE.unsub=null; }
  const wasFollowing=LIVE.mode==="follow";
  LIVE.mode=null; LIVE.doc=null; LIVE.code=""; leaveRoom();
  if(wasFollowing&&window.LectApp){ const c=window.LectApp.current(); if(c.type) window.LectApp.follow(c); }
}
async function joinRoom(){
  try{ const room=await cap("room"); if(!room||!LIVE.code) return; const r=await room.join("lect-"+LIVE.code); LIVE.room=r;
    r.onPeers(ch=>{ LIVE.peers=ch.peers.length; LIVE.peerList=ch.peers.filter(p=>p.kind==="viewer"); const me=ch.peers.find(p=>p.sameTab); if(me&&me.peer!==LIVE.myPeer){ LIVE.myPeer=me.peer; applyCast(); } if(LIVE.mode==="host"){ const t=EL&&EL.querySelector(".tlive"); if(t) t.textContent=`Live · ${LIVE.code.toUpperCase()}${LIVE.peers>1?` · ${LIVE.peers-1} following`:""}`; } if(PANEL==="live") renderPanel(); }, ()=>{});
    presence(); }catch(e){}
}
function presence(){ try{ if(LIVE.room) LIVE.room.presence({role:VIEW.role||"", host:LIVE.mode==="host", name:String(LIVE.me.name||"").slice(0,40), ready:!!LIVE.me.ready}); }catch(e){} }
function leaveRoom(){ try{ if(LIVE.room) LIVE.room.leave(); }catch(e){} LIVE.room=null; LIVE.peers=0; }
function liveOpts(){ return LIVE.mode==="follow"&&LIVE.doc?LIVE.doc.opts:null; }
function refreshBar(){ const b=EL&&EL.querySelector('[data-panel="live"]'); if(b) b.textContent=LIVE.mode==="host"?"Live · hosting":LIVE.mode==="follow"?"Live · following":"Live session"; }

/* ---------------------------------------------------------------- text extraction (script, read-aloud) */
const ROLE_ORDER=["cel","srv","lec","ppl"];
function speaker(r){
  const t=(r||"").split(/\s+/).filter(Boolean), n=M.roles;
  if(!t.length) return "";
  if(t.includes("all")) return "All";
  if(t.length>1&&t.includes("ppl")) return `${n[t.find(x=>x!=="ppl")]||""} and all`.trim();
  return t.map(x=>n[x]||x).join(" and ");
}
function textOf(node){
  const c=node.cloneNode(true);
  c.querySelectorAll("sup, .mctl, button, select, label.tp, .sp").forEach(x=>x.remove());
  return c.textContent.replace(/\s+/g," ").replace(/\s([,.;:!?])/g,"$1").trim();
}
function extract(lang){
  const out=[], body=EL.querySelector(".mbody"); if(!body) return out;
  const walk=(node,role)=>{
    for(const el of node.children){
      if(el.matches("[lang=la]")&&lang==="en"&&el.parentElement.classList.contains("two")) continue;
      if(el.matches("[lang=en]")&&lang==="la"&&el.parentElement.classList.contains("two")) continue;
      if(el.matches("h3")) continue;
      if(el.matches("h4.sub2,h5.sub")){ out.push({k:"h2",t:textOf(el),el}); continue; }
      if(el.matches("p.pos")){ out.push({k:"pos",t:[...el.querySelectorAll(".pg")].map(g=>textOf(g)).join(" · "),el}); continue; }
      if(el.matches("p.abr")){ const c=el.cloneNode(true); const l=c.querySelector(".lbl"); if(l) l.remove(); out.push({k:"cue",t:"Shortened for time: "+textOf(c),el}); continue; }
      if(el.matches("p.cue,p.rub,p.note,.homily:not([data-r])")){ out.push({k:"cue",t:textOf(el),el}); continue; }
      if(el.matches("p.cite")){ out.push({k:"cite",t:textOf(el),el}); continue; }
      if(el.matches("figure.music")){ const t=el.querySelector(".mt"); out.push({k:"music",t:t?t.textContent:"",el,r:role}); continue; }
      if(el.matches("details")){ walk(el,role); continue; }
      if(el.matches("section.reading")){ const h=el.querySelector("header"); out.push({k:"cite",t:h?textOf(h).replace(/\s*(\S+ \d.*)$/," — $1"):"",el}); const tx=el.querySelector(".rtext"); if(tx) out.push({k:"line",r:role||"lec",t:textOf(tx),el:tx}); continue; }
      const r=el.getAttribute("data-r");
      if(r!=null){ if(el.querySelector("[data-r]")||el.querySelector("section.reading,figure.music,h4,h5,p.cue,p.pos,ol")) { walk(el,r); continue; }
        const t=textOf(el); if(t) out.push({k:"line",r,t,el}); continue; }
      if(el.matches("p")){ if(el.querySelector("[data-r]")){ walk(el,role); continue; } const t=textOf(el); if(t) out.push({k:"line",r:role||"",t,el}); continue; }
      if(el.children.length) walk(el,role);
    }
  };
  body.querySelectorAll(":scope > section.mpart").forEach(sec=>{ out.push({k:"h",t:sec.querySelector("h3 span").textContent.trim(),el:sec}); walk(sec,""); });
  return out;
}
const mineOf=(r,role)=>!role||!r||(" "+r+" ").includes(" "+role+" ")||(" "+r+" ").includes(" all ");

/* ---------------------------------------------------------------- chat script */
const FORMATS={discord:{label:"Discord (2,000 characters)",max:1900},minecraft:{label:"Minecraft chat (256 characters)",max:250},plain:{label:"Plain text",max:Infinity}};
function scriptLines(fmt,opt){
  const items=extract(opt.lang), L=[];
  const role=opt.mine?VIEW.role:"";
  for(const it of items){
    if(it.k==="h"){ L.push(fmt==="discord"?`**__${it.t}__**`:fmt==="minecraft"?`== ${it.t} ==`:`\n${it.t.toUpperCase()}`); continue; }
    if(it.k==="h2"){ L.push(fmt==="discord"?`**${it.t}**`:fmt==="minecraft"?`- ${it.t} -`:it.t); continue; }
    if(it.k==="pos"){ if(opt.rubrics) L.push(fmt==="discord"?`*(${it.t})*`:`(${it.t})`); continue; }
    if(it.k==="cue"){ if(opt.rubrics) L.push(fmt==="discord"?`*${it.t}*`:`(${it.t})`); continue; }
    if(it.k==="cite"){ if(!role||mineOf("lec",role)) L.push(fmt==="discord"?`__${it.t}__`:it.t); continue; }
    if(it.k==="music"){ if(opt.rubrics) L.push(fmt==="discord"?`♪ *Sung: ${it.t}*`:`(Sung: ${it.t})`); continue; }
    if(it.k==="line"){ if(!mineOf(it.r,role)) continue; const sp=speaker(it.r);
      L.push(sp?(fmt==="discord"?`**${sp}:** ${it.t}`:fmt==="minecraft"?`[${sp}] ${it.t}`:`${sp}: ${it.t}`):it.t); }
  }
  return L.filter(Boolean);
}
function splitLong(line,max){
  if(line.length<=max) return [line];
  const pre=(/^(\[[^\]]+\] |\*\*[^*]+:\*\* |[A-Z][^:]{0,30}: )/.exec(line)||[""])[0];
  const parts=line.slice(pre.length).split(/(?<=[.;:!?])\s+/); const out=[]; let cur="";
  for(let p of parts){
    while((pre+p).length>max){ const cut=p.lastIndexOf(" ",max-pre.length-2)>20?p.lastIndexOf(" ",max-pre.length-2):max-pre.length-2; if(cur){ out.push(pre+cur); cur=""; } out.push(pre+p.slice(0,cut)+"…"); p=p.slice(cut).trim(); }
    if((pre+cur+" "+p).length>max){ if(cur) out.push(pre+cur); cur=p; } else cur=cur?cur+" "+p:p;
  }
  if(cur) out.push(pre+cur);
  return out;
}
function chunks(fmt,opt){
  const max=FORMATS[fmt].max, lines=scriptLines(fmt,opt);
  if(max===Infinity) return [lines.join("\n")];
  if(fmt==="minecraft") return lines.flatMap(l=>splitLong(l,max));
  const out=[]; let cur="";
  for(const l of lines.flatMap(l=>splitLong(l,max))){ if((cur+"\n"+l).length>max){ if(cur) out.push(cur); cur=l; } else cur=cur?cur+"\n"+l:l; }
  if(cur) out.push(cur);
  return out;
}
async function copyText(t, ta){
  try{ await navigator.clipboard.writeText(t); return true; }catch(e){}
  try{ if(ta){ ta.focus(); ta.select(); return document.execCommand("copy"); } }catch(e){}
  return false;
}
async function saveFile(name, data){
  const d=await cap("downloads");
  if(d){ try{ await d.save({filename:name,data}); return "saved"; }catch(e){ if(e&&e.code==="declined") return "declined"; } }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:name.endsWith(".html")?"text/html":"text/plain"})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); return "saved"; }catch(e){ return "failed"; }
}

/* ---------------------------------------------------------------- read aloud */
function voiceFor(lang){
  const vs=speechSynthesis.getVoices(); const want=lang==="la"?["it","la","es"]:["en"];
  for(const w of want){ const v=vs.find(x=>x.lang&&x.lang.toLowerCase().startsWith(w)); if(v) return v; }
  return null;
}
function speakStart(lang){
  speakStop();
  const items=extract(lang).filter(it=>it.k==="line"||it.k==="cite"||it.k==="h");
  let start=0; const e=RUN.cur>=0?RUN.cur:-1;
  if(e>=0){ const sec=EL.querySelector(`#mp-${e}`); const k=items.findIndex(it=>it.el===sec); if(k>=0) start=k; }
  SPEAK={...SPEAK,on:true,paused:false,items,i:start,lang};
  speakNext();
}
function sentences(t){ const out=[]; t.split(/(?<=[.;:!?])\s+/).forEach(s=>{ while(s.length>220){ const c=s.lastIndexOf(" ",220); out.push(s.slice(0,c)); s=s.slice(c+1); } if(s) out.push(s); }); return out; }
function speakNext(){
  if(!SPEAK.on) return;
  EL&&EL.querySelectorAll(".speaking").forEach(x=>x.classList.remove("speaking"));
  if(SPEAK.i>=SPEAK.items.length){ speakStop(); renderPanel(); return; }
  const it=SPEAK.items[SPEAK.i];
  const target=it.el&&it.el.closest?it.el:null; if(target){ target.classList.add("speaking"); if(VIEW.follow||!LIVE.mode) target.scrollIntoView({behavior:"smooth",block:"center"}); }
  const mine=it.k==="line"&&VIEW.role&&it.r&&(" "+it.r+" ").includes(" "+VIEW.role+" ");
  if(mine&&SPEAK.mine!=="read"){
    if(SPEAK.mine==="skip"){ SPEAK.i++; speakNext(); return; }
    const secs=Math.max(2,it.t.split(/\s+/).length/2.4);
    SPEAK.wait={until:Date.now()+secs*1000}; renderPanel();
    SPEAK.waitT=setTimeout(()=>{ if(SPEAK.wait){ SPEAK.wait=null; SPEAK.i++; renderPanel(); speakNext(); } },secs*1000);
    return;
  }
  const text=(it.k==="h"?it.t+".":it.t).replace(/[✠℟℣]\.?/g," ").replace(/\s+/g," ").trim();
  const lang=SPEAK.lang==="la"||/[áéíóúýæœǽ]/i.test(text)?"la":"en";
  const parts=sentences(text); let j=0;
  const say=()=>{ if(!SPEAK.on) return; if(j>=parts.length){ SPEAK.i++; speakNext(); return; }
    const u=new SpeechSynthesisUtterance(parts[j++]); const v=voiceFor(lang); if(v) u.voice=v; u.lang=v?v.lang:(lang==="la"?"it-IT":"en-US"); u.rate=SPEAK.rate; u.onend=say; u.onerror=say; speechSynthesis.speak(u); };
  say();
}
function speakStop(){ SPEAK.on=false; SPEAK.wait=null; clearTimeout(SPEAK.waitT); try{ speechSynthesis.cancel(); }catch(e){} EL&&EL.querySelectorAll(".speaking").forEach(x=>x.classList.remove("speaking")); }
function speakContinue(){ if(SPEAK.wait){ clearTimeout(SPEAK.waitT); SPEAK.wait=null; SPEAK.i++; renderPanel(); speakNext(); } }

/* ---------------------------------------------------------------- print and booklet */
function withDetailsOpen(fn){
  const ds=[...EL.querySelectorAll(".mbody details")], was=ds.map(d=>d.open); ds.forEach(d=>d.open=true);
  try{ return fn(); } finally{ setTimeout(()=>ds.forEach((d,i)=>d.open=was[i]),500); }
}
function printNow(){
  document.documentElement.classList.add("printing");
  withDetailsOpen(()=>{ try{ window.print(); }catch(e){} });
  setTimeout(()=>document.documentElement.classList.remove("printing"),800);
}
function bookletHTML(){
  const head=document.querySelector("#session .dayname"), sub=document.querySelector("#session .daysub"), crumbs=document.querySelector("#session .crumbs"), date=document.querySelector("#session .dlabel");
  const body=EL.querySelector(".mbody").cloneNode(true);
  body.querySelectorAll("button, select, .mctl, label.tp, .hsel, input").forEach(x=>x.remove());
  body.querySelectorAll("details").forEach(d=>d.setAttribute("open",""));
  body.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));
  body.removeAttribute("data-view"); body.removeAttribute("data-only");
  const role=VIEW.role&&M.roles[VIEW.role];
  const css=`body{font:16px/1.55 Georgia,"Times New Roman",serif;color:#1b1b1b;background:#fff;margin:0;padding:24px 16px}main{max-width:780px;margin:0 auto}
h1{font-size:1.7rem;margin:0 0 4px}h3{font-size:1.25rem;border-top:2px solid #1b1b1b;padding-top:8px;margin:26px 0 8px;display:flex;justify-content:space-between;gap:12px}
h3 .pmin{font-size:.8rem;color:#666;font-weight:normal}h4,h5{font-size:1rem;color:#8b1a1a;margin:14px 0 4px}
.meta{color:#555;margin:0 0 16px}.rub,.rubi,.cue,.abr,.note{color:#8b1a1a;font-size:.92rem}.cue,.abr{font-style:italic}
.txt.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}.sp{color:#8b1a1a;font-weight:bold}.cross{color:#8b1a1a}
.pos{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.85rem;margin:6px 0}.pb{border:1px solid #8b1a1a;color:#8b1a1a;border-radius:4px;padding:0 5px;font-weight:bold}
.reading header{display:flex;justify-content:space-between;font-weight:bold;margin-top:10px}.reading .rc{color:#555;font-weight:normal}
figure.music{margin:10px 0;break-inside:avoid}figure.music svg{max-width:100%;height:auto}figcaption .mm{color:#666;font-size:.8rem;margin-left:8px}
ol.order{padding-left:1.3em}.homily{border:1px dashed #999;padding:6px 10px;border-radius:6px;font-size:.9rem;color:#555}
.mine{background:#fbeaea}.legend{font-size:.85rem;color:#555}section{break-inside:auto}
@media (max-width:640px){.txt.two{grid-template-columns:1fr}}@media print{body{padding:0}h3{break-after:avoid}}`;
  if(role) body.querySelectorAll("[data-r]").forEach(x=>{ if(mineOf(x.getAttribute("data-r"),VIEW.role)) x.classList.add("mine"); });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(head?head.textContent:"Lectionarium")}</title><style>${css}</style></head><body><main>
<h1>${esc(head?head.textContent:"")}</h1><p class="meta">${esc([date&&date.textContent,crumbs&&crumbs.textContent,sub&&sub.textContent].filter(Boolean).join(" · "))}</p>
${role?`<p class="legend">Highlighted: the ${esc(role.toLowerCase())}'s parts.</p>`:""}
${body.innerHTML}
<p class="meta" style="margin-top:28px">Made with Lectionarium. Texts: Divinum Officium (MIT), Douay-Rheims and King James Bibles, the 1662 Book of Common Prayer; chant from GregoBase (CC0); hymns from the Open Hymnal (public domain). Consult the approved liturgical books for celebration.</p>
</main></body></html>`;
}
async function saveBooklet(){
  const name=`lectionarium-${M.ctx.iso}-${M.isOffice?"office-"+M.rite+"-"+(M.ctx.hour||""):M.rite}.html`;
  const html=withDetailsOpen(()=>bookletHTML());
  const r=await saveFile(name,html);
  const b=EL.querySelector("#tBook"); if(b){ const t=b.textContent; b.textContent=r==="saved"?"Booklet saved":r==="declined"?"Not saved":"Could not save"; setTimeout(()=>{ b.textContent=t; },2500); }
}

/* ---------------------------------------------------------------- connection check */
let CHECK=[];
async function runCheck(){
  CHECK=[{ok:true,t:"Running…"}]; renderPanel(); const out=[];
  const db=await cap("db");
  out.push(db?{ok:true,t:P2P?"Live sessions run browser to browser on this page (no sign-in).":"Shared session store is available on this page."}:{ok:false,t:"No shared store: open this page in Claude while signed in. Pages opened from a saved file or outside Claude can't join."});
  if(db){
    try{ await db.doc("live/zz-check").get(); out.push({ok:true,t:P2P?"The connection server can be reached, so you can host and follow.":"Reading sessions works, so you can follow."}); }catch(e){ out.push({ok:false,t:P2P?"The connection server could not be reached. A firewall or blocker may be stopping it.":"Reading sessions failed ("+(e&&e.code||"error")+")."}); }
    if(!P2P) try{ const ref=db.doc("live/zz-check-"+Math.random().toString(36).slice(2,8)); await ref.set({t:Date.now()}); await ref.delete(); out.push({ok:true,t:"Writing works, so you can host."}); }
    catch(e){ out.push({ok:false,t:e&&e.code==="invalid_argument"?"You can follow but not host: hosting needs Contributor access or higher on this page.":"Writing failed ("+(e&&e.code||"error")+")."}); }
  }
  const room=await cap("room");
  if(!room) out.push({ok:false,t:"Presence is unavailable here: the host won't see your name or ready status, but following still works."});
  else { const c=await new Promise(res=>{ let done=false; const off=room.onConnection(v=>{ if(v&&!done){ done=true; res(true); off(); } },()=>{ if(!done){ done=true; res(false); } }); setTimeout(()=>{ if(!done){ done=true; res(room.connected()); try{ off(); }catch(e){} } },4000); });
    out.push(c?{ok:true,t:"Presence is connected: names, ready status and part assignment work."}:{ok:false,t:"Presence did not connect within 4 seconds. Following still works; part assignment may not."}); }
  const ac=window.AudioContext||window.webkitAudioContext; out.push(ac?{ok:true,t:"This browser can play the music."}:{ok:false,t:"This browser can't play audio."});
  CHECK=out; renderPanel();
}

/* ---------------------------------------------------------------- presenter view */
function slidesFrom(lang){
  const items=extract(lang), out=[]; let dir=[], part=-1;
  const secs=[...EL.querySelectorAll(".mbody > section.mpart")];
  for(const it of items){
    if(it.k==="h"){ part=secs.indexOf(it.el); out.push({k:"h",t:it.t,part,dir:[]}); dir=[]; continue; }
    if(it.k==="pos"||it.k==="cue"){ dir.push(it.t); continue; }
    if(it.k==="h2"){ dir.push(it.t); continue; }
    if(it.k==="cite"){ out.push({k:"cite",t:it.t,part,dir,r:"lec"}); dir=[]; continue; }
    if(it.k==="music"){ out.push({k:"music",t:"Sung: "+it.t,part,dir,r:it.r||"ppl"}); dir=[]; continue; }
    if(it.k==="line"){
      const chunks=[]; let cur=""; it.t.split(/(?<=[.;:!?])\s+/).forEach(x=>{ if((cur+" "+x).length>380&&cur){ chunks.push(cur); cur=x; } else cur=cur?cur+" "+x:x; }); if(cur) chunks.push(cur);
      chunks.forEach((c,j)=>out.push({k:"line",t:c,part,dir:j?[]:dir,r:it.r,more:chunks.length>1?`${j+1}/${chunks.length}`:""})); dir=[];
    }
  }
  return out;
}
function presentOpen(remount){
  PRES.open=true;
  const hasLa=!!EL.querySelector(".mbody [lang=la]");
  if(!hasLa) PRES.lang="en";
  PRES.slides=slidesFrom(PRES.lang);
  let ov=document.getElementById("presenter");
  if(!ov){ ov=document.createElement("div"); ov.id="presenter"; ov.className="presenter"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true"); ov.setAttribute("aria-label","Presenter view"); document.body.appendChild(ov);
    document.addEventListener("keydown",presentKey); }
  ov.innerHTML=`<header class="pr-top"><span class="pr-part" id="prPart"></span><span class="pr-time" id="prTime"></span>
      <span class="pr-ctl"><button type="button" class="tbtn ghost" id="prPrev" aria-label="Previous line">‹</button><span class="pr-n" id="prN"></span><button type="button" class="tbtn ghost" id="prNext" aria-label="Next line">›</button>
      ${hasLa?`<button type="button" class="tbtn ghost" id="prLang">${PRES.lang==="la"?"English":"Latin"}</button>`:""}
      <label class="ck"><input type="checkbox" id="prFollow"${PRES.follow?" checked":""}> Follow ${LIVE.mode==="follow"?"the host":"the timer"}</label>
      <button type="button" class="tbtn ghost" id="prFull">Full screen</button><button type="button" class="tbtn" id="prClose">Close</button></span></header>
    <main class="pr-main" aria-live="polite"><p class="pr-dir" id="prDir"></p><p class="pr-who" id="prWho"></p><div class="pr-text" id="prText"></div></main>
    <footer class="pr-next"><span class="lbl">Next</span> <span id="prNextT"></span></footer>`;
  ov.hidden=false; document.documentElement.classList.add("presenting");
  const q=x=>ov.querySelector(x);
  q("#prPrev").addEventListener("click",()=>presentGo(PRES.i-1));
  q("#prNext").addEventListener("click",()=>presentGo(PRES.i+1));
  q("#prClose").addEventListener("click",presentClose);
  q("#prFollow").addEventListener("change",e=>{ PRES.follow=e.target.checked; });
  q("#prFull").addEventListener("click",()=>{ try{ if(document.fullscreenElement) document.exitFullscreen(); else ov.requestFullscreen&&ov.requestFullscreen().catch(()=>{}); }catch(e){} });
  q("#prLang")&&q("#prLang").addEventListener("click",()=>{ const cur=PRES.slides[PRES.i]; PRES.lang=PRES.lang==="la"?"en":"la"; const keep=cur?cur.part:-1; presentOpen(true); const k=PRES.slides.findIndex(x=>x.part===keep); presentGo(k<0?0:k,true); });
  if(!remount){ const start=RUN.cur>=0?PRES.slides.findIndex(x=>x.part===RUN.cur):0; PRES.i=Math.max(0,start); }
  if(LIVE.mode==="follow"&&LIVE.doc&&LIVE.doc.line>=0&&PRES.follow) PRES.i=LIVE.doc.line;
  presentShow(); q("#prNext").focus();
  if(LIVE.mode==="host") hostPublish(true);
}
function presentClose(){
  PRES.open=false; const ov=document.getElementById("presenter"); if(ov) ov.hidden=true; document.documentElement.classList.remove("presenting");
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  const b=EL&&EL.querySelector("#tPresent"); if(b) b.focus();
  if(LIVE.mode==="host") hostPublish(true);
}
function presentKey(e){
  if(!PRES.open||e.target.closest&&e.target.closest("input,select,textarea")) return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){ e.preventDefault(); presentGo(PRES.i+1); }
  else if(["ArrowLeft","PageUp"].includes(e.key)){ e.preventDefault(); presentGo(PRES.i-1); }
  else if(e.key==="Escape"){ presentClose(); }
}
function presentPart(i){ const k=PRES.slides.findIndex(x=>x.part===i); if(k>=0) presentGo(k,true); }
function presentGo(i,fromRemote){
  if(!PRES.slides.length) return;
  PRES.i=Math.max(0,Math.min(PRES.slides.length-1,i)); presentShow();
  if(!fromRemote&&LIVE.mode==="host") hostPublish(true);
}
function presentShow(){
  const ov=document.getElementById("presenter"); if(!ov||!PRES.slides.length) return;
  const sl=PRES.slides[PRES.i], nx=PRES.slides[PRES.i+1];
  const q=x=>ov.querySelector(x);
  const partT=sl.part>=0&&M.parts[sl.part]?M.parts[sl.part].title:"";
  q("#prPart").textContent=partT; q("#prN").textContent=`${PRES.i+1} / ${PRES.slides.length}`;
  q("#prTime").textContent=(RUN.on||RUN.active||LIVE.mode==="follow")?mmss(elapsed()):"";
  q("#prDir").textContent=(sl.dir||[]).join(" · ");
  const mine=VIEW.role&&sl.r&&(" "+sl.r+" ").includes(" "+VIEW.role+" ");
  q("#prWho").textContent=sl.k==="h"?"":(mine?"You · ":"")+(speaker(sl.r)||"");
  const t=q("#prText"); t.textContent=sl.t; t.className="pr-text"+(sl.k==="h"?" h":"")+(mine?" mine":"")+(sl.t.length>260?" long":"")+(sl.k==="cite"||sl.k==="music"?" cite":"");
  q("#prNextT").textContent=nx?((nx.k==="h"?"— ":"")+(speaker(nx.r)&&nx.k!=="h"?speaker(nx.r)+": ":"")+nx.t).slice(0,160)+(nx.t.length>160?"…":""):"End";
}
setInterval(()=>{ if(PRES.open){ const t=document.getElementById("prTime"); if(t) t.textContent=(RUN.on||RUN.active||LIVE.mode==="follow")?mmss(elapsed()):""; } },1000);

/* ---------------------------------------------------------------- panels */
function renderPanel(){
  const p=EL&&EL.querySelector("#tPanel"); if(!p) return;
  p.hidden=!PANEL;
  if(PANEL==="live") p.innerHTML=livePanel();
  else if(PANEL==="script") p.innerHTML=scriptPanel();
  else if(PANEL==="speak") p.innerHTML=speakPanel();
  else p.innerHTML="";
  wirePanel(p);
}
function livePanel(){
  const msg=LIVE.msg?`<p class="note" role="status">${esc(LIVE.msg)}</p>`:"";
  const check=`<details class="lvcheck"${CHECK.length?" open":""}><summary>Check the connection</summary><div class="trow2"><button type="button" class="tbtn ghost" id="lvCheck">Run check</button></div>${CHECK.length?`<ul class="checks">${CHECK.map(c=>`<li class="${c.ok?"ok":"bad"}"><b>${c.ok?"OK":"Problem"}</b> ${esc(c.t)}</li>`).join("")}</ul>`:""}</details>`;
  if(LIVE.mode==="host"){
    const others=LIVE.peerList.filter(p=>!p.sameTab), ready=others.filter(p=>p.presence&&p.presence.ready).length;
    const roleSel=(peer,cur)=>`<select data-cast="${esc(peer)}" aria-label="Part"><option value="">Everyone</option>${Object.entries(M.roles).map(([k,v])=>`<option value="${k}"${cur===k?" selected":""}>${esc(v)}</option>`).join("")}</select>`;
    return `<h4 class="tph">Hosting a live session</h4>
    <p class="livecode" aria-label="Session code">${esc(LIVE.code.toUpperCase())}</p>
    <p>Anyone who can open this page joins with that code: Pray today → Join a live session. They see this ${esc(M.noun)}, your length and music settings, and the part you are on. Move everyone along with the timer and the ‹ › buttons; music you play here plays for everyone who turned sound on.</p>
    ${others.length?`<table class="cast"><thead><tr><th>Who</th><th>Ready</th><th>Part</th></tr></thead><tbody>${others.map(p=>{ const pr=p.presence||{}; return `<tr><td class="who"></td><td>${pr.ready?"✓":"…"}</td><td>${roleSel(p.peer,LIVE.cast[p.peer]!==undefined?LIVE.cast[p.peer]:(pr.role||""))}</td></tr>`; }).join("")}</tbody></table><p class="note">${ready} of ${others.length} ready.</p>`:`<p class="note">Nobody has joined yet. ${P2P?"Send people this page's link and the code; they open the page, choose Live session and enter the code. Keep this tab open: the session runs from your browser.":"Followers must be signed in to Claude; people outside your organization need the page shared with them."}</p>`}
    <div class="trow2"><button type="button" class="tbtn" id="lvCopy">Copy invite</button><button type="button" class="tbtn ghost" id="lvEnd">End session</button></div>${msg}${check}`;
  }
  if(LIVE.mode==="follow") return `<h4 class="tph">Following live session ${esc((LIVE.code||"").toUpperCase())}</h4>
    <p>The page moves to the part the host is on. Turn off "Follow along" to read ahead. Turn on sound to hear the music the host plays.</p>
    <div class="trow2"><label class="sl">Your name <input id="lvName" maxlength="40" value="${esc(LIVE.me.name)}" placeholder="Shown to the host"></label><label class="ck"><input type="checkbox" id="lvReady"${LIVE.me.ready?" checked":""}> I'm ready</label><button type="button" class="tbtn ghost" id="lvLeave">Leave</button></div>${msg}${check}`;
  return `<h4 class="tph">Live session</h4>
    <p>Host this ${esc(M.noun)} for a group: everyone who joins sees the same day, length and music, and follows the part you are on.</p>
    <div class="trow2"><button type="button" class="tbtn" id="lvHost">Host with these settings</button></div>
    <form class="joinlive inpanel" id="lvJoin" autocomplete="off"><label for="lvCode">Or join one</label><input id="lvCode" maxlength="12" placeholder="Code"><button type="submit" class="tbtn ghost">Join</button></form>${msg}${check}`;
}
function scriptPanel(){
  const st=ls.get("lect-script",{fmt:"discord",rubrics:true,mine:false,lang:"en"});
  const hasLa=!!EL.querySelector(".mbody [lang=la]");
  const list=chunks(st.fmt,{...st,mine:st.mine&&!!VIEW.role});
  return `<h4 class="tph">Chat script</h4>
    <div class="trow2">
      <label class="sl">Format <select id="scFmt">${Object.entries(FORMATS).map(([k,v])=>`<option value="${k}"${st.fmt===k?" selected":""}>${esc(v.label)}</option>`).join("")}</select></label>
      ${hasLa?`<label class="sl">Text <select id="scLang"><option value="en"${st.lang!=="la"?" selected":""}>English</option><option value="la"${st.lang==="la"?" selected":""}>Latin</option></select></label>`:""}
      <label class="ck"><input type="checkbox" id="scRub"${st.rubrics?" checked":""}> Directions and postures</label>
      <label class="ck"><input type="checkbox" id="scMine"${st.mine&&VIEW.role?" checked":""}${VIEW.role?"":" disabled"}> Only my part${VIEW.role?` (${esc(M.roles[VIEW.role])})`:""}</label>
    </div>
    <p class="note">${list.length} message${list.length===1?"":"s"}. Paste them yourself, one at a time; nothing is sent for you.</p>
    <div class="trow2"><button type="button" class="tbtn" id="scAll">Copy all</button><button type="button" class="tbtn ghost" id="scSave">Save as .txt</button></div>
    <ol class="chunks">${list.map((c,i)=>`<li><textarea readonly rows="${Math.min(6,Math.max(2,Math.ceil(c.length/90)))}" aria-label="Message ${i+1}">${esc(c)}</textarea><button type="button" class="tbtn ghost" data-copy="${i}">Copy</button></li>`).join("")}</ol>`;
}
function speakPanel(){
  const hasLa=!!EL.querySelector(".mbody [lang=la]");
  const waiting=SPEAK.wait?`<p class="mineturn" role="status">Your line. <button type="button" class="tbtn" id="spCont">Continue</button></p>`:"";
  return `<h4 class="tph">Read aloud</h4>
    <p class="note">Uses this device's voices. Starts at the part the timer is on, or at the top.</p>
    <div class="trow2">
      <button type="button" class="tbtn" id="spPlay">${SPEAK.on?"Stop":"Start"}</button>
      ${hasLa?`<label class="sl">Text <select id="spLang"><option value="en">English</option><option value="la">Latin (Italian voice)</option></select></label>`:""}
      <label class="sl">Speed <select id="spRate">${[0.8,0.9,1,1.15,1.3].map(r=>`<option value="${r}"${+SPEAK.rate===r?" selected":""}>${r}×</option>`).join("")}</select></label>
      ${VIEW.role?`<label class="sl">At my lines <select id="spMine"><option value="wait"${SPEAK.mine==="wait"?" selected":""}>Pause for me</option><option value="read"${SPEAK.mine==="read"?" selected":""}>Read them too</option><option value="skip"${SPEAK.mine==="skip"?" selected":""}>Skip them</option></select></label>`:`<span class="note">Pick "My part" to have it pause for your lines.</span>`}
    </div>${waiting}`;
}
function wirePanel(p){
  const q=s=>p.querySelector(s);
  if(PANEL==="live"){
    q("#lvHost")&&q("#lvHost").addEventListener("click",host);
    q("#lvEnd")&&q("#lvEnd").addEventListener("click",endHost);
    q("#lvLeave")&&q("#lvLeave").addEventListener("click",()=>leave());
    q("#lvCopy")&&q("#lvCopy").addEventListener("click",async e=>{ const t=`Join my live session in Lectionarium: open the page, choose Pray today → Join a live session, and enter ${LIVE.code.toUpperCase()}.`; const ok=await copyText(t); e.target.textContent=ok?"Copied":"Code: "+LIVE.code.toUpperCase(); setTimeout(()=>{ e.target.textContent="Copy invite"; },2500); });
    q("#lvJoin")&&q("#lvJoin").addEventListener("submit",e=>{ e.preventDefault(); join(q("#lvCode").value); });
    q("#lvCheck")&&q("#lvCheck").addEventListener("click",runCheck);
    p.querySelectorAll("[data-cast]").forEach(sel=>sel.addEventListener("change",()=>{ LIVE.cast={...LIVE.cast,[sel.dataset.cast]:sel.value}; hostPublish(true); }));
    /* names come from other viewers: set as text, never as markup */
    const others=LIVE.peerList.filter(x=>!x.sameTab); p.querySelectorAll(".cast td.who").forEach((td,k)=>{ const pr=(others[k]&&others[k].presence)||{}; td.textContent=(typeof pr.name==="string"&&pr.name.trim())?pr.name.trim().slice(0,40):`Guest ${k+1}`; });
    q("#lvName")&&q("#lvName").addEventListener("change",e=>{ LIVE.me.name=e.target.value.trim().slice(0,40); ls.set("lect-name",LIVE.me.name); presence(); });
    q("#lvReady")&&q("#lvReady").addEventListener("change",e=>{ LIVE.me.ready=e.target.checked; presence(); });
  }
  if(PANEL==="script"){
    const save=()=>{ const st={fmt:q("#scFmt").value,lang:q("#scLang")?q("#scLang").value:"en",rubrics:q("#scRub").checked,mine:q("#scMine").checked}; ls.set("lect-script",st); renderPanel(); };
    ["#scFmt","#scLang","#scRub","#scMine"].forEach(s=>q(s)&&q(s).addEventListener("change",save));
    p.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{ const ta=b.previousElementSibling; const ok=await copyText(ta.value,ta); b.textContent=ok?"Copied":"Select and copy"; b.closest("li").classList.add("done"); setTimeout(()=>{ b.textContent="Copy"; },2000); }));
    q("#scAll").addEventListener("click",async e=>{ const all=[...p.querySelectorAll(".chunks textarea")].map(t=>t.value).join("\n\n"); const ok=await copyText(all); e.target.textContent=ok?"Copied":"Use Save instead"; setTimeout(()=>{ e.target.textContent="Copy all"; },2000); });
    q("#scSave").addEventListener("click",async e=>{ const all=[...p.querySelectorAll(".chunks textarea")].map(t=>t.value).join("\n\n"); const r=await saveFile(`lectionarium-script-${M.ctx.iso}.txt`,all); e.target.textContent=r==="saved"?"Saved":"Not saved"; setTimeout(()=>{ e.target.textContent="Save as .txt"; },2000); });
  }
  if(PANEL==="speak"){
    q("#spPlay").addEventListener("click",()=>{ if(SPEAK.on){ speakStop(); } else speakStart(q("#spLang")?q("#spLang").value:"en"); renderPanel(); });
    q("#spRate").addEventListener("change",e=>{ SPEAK.rate=+e.target.value; ls.set("lect-rate",SPEAK.rate); });
    q("#spMine")&&q("#spMine").addEventListener("change",e=>{ SPEAK.mine=e.target.value; ls.set("lect-mine",SPEAK.mine); });
    q("#spCont")&&q("#spCont").addEventListener("click",speakContinue);
  }
}

window.addEventListener("beforeunload",()=>{ try{ speechSynthesis.cancel(); }catch(e){} });
window.LectTools={mount, join, liveOpts, leave, saveFile};
})();
