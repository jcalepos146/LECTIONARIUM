/* ================================================================ MUSIC ENGINE
   Gregorian chant (GABC) parser + square-note SVG renderer + WebAudio player,
   and a small ABC melody reader for hymns (notation drawn by abcjs when available). */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------------------------------------------------------------- audio */
let AC=null, current=null;
function ctx(){ if(!AC){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; AC=new C(); } if(AC.state==="suspended") AC.resume(); return AC; }
const mtof=m=>440*Math.pow(2,(m-69)/12);
function stopAll(){ if(current){ try{ current.stop(); }catch(e){} current=null; } }
function voice(ac, out, t, dur, midi, kind, vel){
  const g=ac.createGain(); g.connect(out);
  const f=mtof(midi);
  const partials = kind==="organ" ? [[1,.55],[2,.22],[3,.12],[4,.06]] : [[1,.6],[2,.18],[3,.08]];
  const oscs=partials.map(([h,a])=>{ const o=ac.createOscillator(); o.type="sine"; o.frequency.value=f*h; const og=ac.createGain(); og.gain.value=a; o.connect(og); og.connect(g); return o; });
  if(kind!=="organ"){ const lfo=ac.createOscillator(), lg=ac.createGain(); lfo.frequency.value=5.2; lg.gain.value=f*0.004; lfo.connect(lg); oscs.forEach(o=>lg.connect(o.frequency)); lfo.start(t); lfo.stop(t+dur+0.2); }
  const v=(vel||0.8)*0.22, a=kind==="organ"?0.02:0.05, r=kind==="organ"?0.06:0.12;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.setValueAtTime(v,Math.max(t+a,t+dur-r)); g.gain.linearRampToValueAtTime(0,t+dur+0.02);
  oscs.forEach(o=>{ o.start(t); o.stop(t+dur+0.1); });
}
function playEvents(events, kind, onStep, onEnd){
  const ac=ctx(); if(!ac){ alertNoAudio(); return null; }
  stopAll();
  const out=ac.createGain(); out.gain.value=0.9; out.connect(ac.destination);
  const t0=ac.currentTime+0.12;
  events.forEach(e=>voice(ac,out,t0+e.t,e.d,e.m,kind,e.v));
  const end=events.reduce((a,e)=>Math.max(a,e.t+e.d),0);
  let raf=0, stopped=false;
  const tick=()=>{ if(stopped) return; const now=ac.currentTime-t0; if(onStep) onStep(now); if(now>end+0.2){ ctl.stop(true); return; } raf=requestAnimationFrame(tick); };
  const ctl={ stop(natural){ if(stopped) return; stopped=true; cancelAnimationFrame(raf); try{ out.gain.cancelScheduledValues(ac.currentTime); out.gain.setValueAtTime(out.gain.value,ac.currentTime); out.gain.linearRampToValueAtTime(0,ac.currentTime+0.05); setTimeout(()=>out.disconnect(),120);}catch(e){} if(current===ctl) current=null; if(onEnd) onEnd(natural); } };
  current=ctl; raf=requestAnimationFrame(tick);
  return ctl;
}
function alertNoAudio(){ const n=document.getElementById("audioNote"); if(n) n.hidden=false; }

/* ---------------------------------------------------------------- GABC */
const LINE_IDX={1:3,2:5,3:7,4:9};
const SCALE=[0,2,4,5,7,9,11];
function cleanText(t){
  return t.replace(/<alt>.*?<\/alt>/g,"").replace(/<sp>V\/<\/sp>\.?/g,"℣.").replace(/<sp>R\/<\/sp>\.?/g,"℟.").replace(/<sp>\+<\/sp>/g,"✠").replace(/<sp>\*<\/sp>/g,"*")
    .replace(/<[^>]+>/g,"").replace(/[{}]/g,"").replace(/\s+/g," ");
}
function parseGabc(src){
  let g=src||""; if(g.indexOf("%%")>=0) g=g.split("%%").pop();
  g=g.replace(/^\s*"|"\s*$/g,"");
  const syl=[]; let clef={type:"c",line:4,flat:false};
  const re=/([^()]*)\(([^)]*)\)/g; let m;
  while((m=re.exec(g))){
    const text=cleanText(m[1]); const s=m[2];
    const notes=[], divs=[]; let i=0; let flats={};
    while(i<s.length){
      const rest=s.slice(i);
      const cm=/^(c|f)(b)?([1-4])/.exec(rest);
      if(cm && (i===0||/[\s(]/.test(s[i-1]||" "))){ clef={type:cm[1],line:+cm[3],flat:!!cm[2]}; i+=cm[0].length; notes.push({clef:{...clef}}); continue; }
      if(rest.startsWith("::")){ notes.push({div:"final"}); i+=2; continue; }
      const c=s[i];
      if(c===":"){ notes.push({div:"major"}); i++; continue; }
      if(c===";"){ notes.push({div:"minor"}); i++; continue; }
      if(c===","){ notes.push({div:"minima"}); i++; continue; }
      if(c==="`"){ notes.push({div:"virgula"}); i++; continue; }
      if(c==="["){ const j=s.indexOf("]",i); i = j<0? s.length : j+1; continue; }
      if(/[a-mA-M]/.test(c)){
        let j=i+1, mods="";
        while(j<s.length && /[~<>vVwos.'_0-9\-xy#rRqQ@=]/.test(s[j])){ mods+=s[j]; j++; }
        const L=c.toLowerCase().charCodeAt(0)-97;
        if(mods[0]==="x"){ flats[L]=true; notes.push({acc:"flat",L}); i=j; continue; }
        if(mods[0]==="y"){ flats[L]=false; notes.push({acc:"nat",L}); i=j; continue; }
        if(mods[0]==="#"){ notes.push({acc:"sharp",L}); i=j; continue; }
        const reps=Math.max(1,(mods.match(/v/g)||[]).length>1?(mods.match(/v/g)||[]).length:0,(mods.match(/s/g)||[]).length);
        for(let r=0;r<reps;r++) notes.push({L,dot:(mods.match(/\./g)||[]).length,ep:mods.indexOf("_")>=0,liq:/[~<>]/.test(mods),q:mods.indexOf("w")>=0,dia:c!==c.toLowerCase(),flat:!!flats[L]||(clef.flat&&isTi(L,clef)),clef:null,cl:{...clef}});
        i=j; continue;
      }
      i++;
    }
    syl.push({text,notes});
  }
  // pitches
  for(const sy of syl) for(const n of sy.notes){ if(n.L!=null && n.cl){ n.midi=toMidi(n.L,n.cl,n.flat); } }
  return syl;
}
function doIdx(cl){ const li=LINE_IDX[cl.line]; return cl.type==="c"? li : li-3; }
function isTi(L,cl){ const d=L-doIdx(cl); return ((d%7)+7)%7===6; }
function toMidi(L,cl,flat){ const d=L-doIdx(cl); const oct=Math.floor(d/7), k=((d%7)+7)%7; return 60+SCALE[k]+12*oct-(flat&&k===6?1:0); }

function chantEvents(syl, tempo, transpose){
  const beat=0.42/(tempo||1); const ev=[]; let t=0; const sylTimes=[];
  const all=[]; syl.forEach(sy=>sy.notes.forEach(n=>{ if(n.midi!=null) all.push(n.midi); }));
  if(!all.length) return {ev,sylTimes,total:0};
  const sorted=[...all].sort((a,b)=>a-b); const med=sorted[Math.floor(sorted.length/2)];
  const shift=(62-med)+(transpose||0);
  syl.forEach((sy,si)=>{
    const st=t;
    sy.notes.forEach(n=>{
      if(n.div){ t+= n.div==="final"?beat*2.2: n.div==="major"?beat*1.6: n.div==="minor"?beat*0.9: beat*0.45; return; }
      if(n.midi==null) return;
      let d=beat*(n.dot?1.9:1)*(n.ep?1.35:1)*(n.liq?0.8:1);
      ev.push({t,d:d*0.97,m:n.midi+shift,v:0.8,s:si}); t+=d;
    });
    sylTimes.push([st,t]);
  });
  return {ev,sylTimes,total:t};
}

function measure(text,font){ const c=measure.c||(measure.c=document.createElement("canvas").getContext("2d")); c.font=font; return c.measureText(text).width; }
function renderChant(el, syl, opts){
  const W=Math.max(260, el.clientWidth||600);
  const gap=7, staffH=gap*3, top=26, lyric=staffH+top+22, rowH=lyric+18;
  const font="16px "+getComputedStyle(document.body).getPropertyValue("--f-display").split(",")[0].replace(/"/g,"").trim()+", Georgia, serif";
  const NW=8, NG=1.5;
  const items=[]; // layout boxes
  syl.forEach((sy,si)=>{
    const ns=sy.notes.filter(n=>n.L!=null||n.div||n.acc);
    const nw=ns.reduce((a,n)=>a+(n.div?10:n.acc?9:NW+NG),0);
    const tw=sy.text.trim()?measure(sy.text.trim(),font)+6:0;
    items.push({si,sy,ns,w:Math.max(nw+4,tw),tw,nw});
  });
  const rows=[[]]; let x=34;
  items.forEach(it=>{ if(x+it.w>W-6 && rows[rows.length-1].length){ rows.push([]); x=34; } it.x=x; rows[rows.length-1].push(it); x+=it.w; });
  const svg=document.createElementNS(NS,"svg"); const H=rows.length*rowH+6;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`); svg.setAttribute("width","100%"); svg.setAttribute("role","img"); svg.setAttribute("aria-label",opts&&opts.label||"Chant notation");
  svg.classList.add("chant");
  let lastClef=null;
  const firstClef=(()=>{ for(const sy of syl) for(const n of sy.notes) if(n.clef) return n.clef; return {type:"c",line:4}; })();
  rows.forEach((row,ri)=>{
    const y0=ri*rowH+top;
    const yOf=L=>y0+staffH-(L-3)*(gap/2);
    for(let l=0;l<4;l++){ const ln=document.createElementNS(NS,"line"); ln.setAttribute("x1",4); ln.setAttribute("x2",W-4); ln.setAttribute("y1",y0+l*gap); ln.setAttribute("y2",y0+l*gap); ln.setAttribute("class","staff"); svg.appendChild(ln); }
    // clef at row start
    const cl=row[0] && (()=>{ let c=lastClef||firstClef; return c; })();
    if(cl){ const cy=yOf(LINE_IDX[cl.line]); const t=document.createElementNS(NS,"text"); t.setAttribute("x",8); t.setAttribute("y",cy+5); t.setAttribute("class","clef"); t.textContent=cl.type==="c"?"𝄡":"𝄢"; svg.appendChild(t);
      const tb=document.createElementNS(NS,"rect"); tb.setAttribute("x",8); tb.setAttribute("y",cy-6); tb.setAttribute("width",4); tb.setAttribute("height",12); tb.setAttribute("class","note"); svg.appendChild(tb);
      const tb2=document.createElementNS(NS,"rect"); tb2.setAttribute("x",14); tb2.setAttribute("y",cl.type==="c"?cy-6:cy-6); tb2.setAttribute("width",6); tb2.setAttribute("height",cl.type==="c"?4:5); tb2.setAttribute("class","note"); svg.appendChild(tb2);
      if(cl.type==="c"){ const tb3=tb2.cloneNode(); tb3.setAttribute("y",cy+2); svg.appendChild(tb3); }
    }
    row.forEach(it=>{
      const g=document.createElementNS(NS,"g"); g.setAttribute("data-s",it.si); g.setAttribute("class","syl");
      const hl=document.createElementNS(NS,"rect"); hl.setAttribute("x",it.x-1); hl.setAttribute("y",y0-16); hl.setAttribute("width",it.w); hl.setAttribute("height",rowH-8); hl.setAttribute("class","hl"); g.appendChild(hl);
      let nx=it.x+Math.max(0,(it.w-it.nw)/2);
      it.ns.forEach(n=>{
        if(n.clef){ lastClef=n.clef; return; }
        if(n.div){ const ln=document.createElementNS(NS,"line"); const len=n.div==="minima"||n.div==="virgula"?[y0-2,y0+gap*0.8]:n.div==="minor"?[y0+gap*0.5,y0+gap*2.5]:[y0,y0+staffH];
          ln.setAttribute("x1",nx+4); ln.setAttribute("x2",nx+4); ln.setAttribute("y1",len[0]); ln.setAttribute("y2",len[1]); ln.setAttribute("class","div"); g.appendChild(ln);
          if(n.div==="final"){ const l2=ln.cloneNode(); l2.setAttribute("x1",nx+7); l2.setAttribute("x2",nx+7); g.appendChild(l2); }
          nx+=10; return; }
        if(n.acc){ const t=document.createElementNS(NS,"text"); t.setAttribute("x",nx); t.setAttribute("y",yOf(n.L)+4); t.setAttribute("class","acc"); t.textContent=n.acc==="flat"?"♭":n.acc==="nat"?"♮":"♯"; g.appendChild(t); nx+=9; return; }
        const y=yOf(n.L);
        // ledger lines
        if(n.L<3||n.L>9){ for(let L=n.L<3?1:11; n.L<3? L>=n.L : L<=n.L; n.L<3?L-=2:L+=2){ if(L%2===1){ const lg=document.createElementNS(NS,"line"); lg.setAttribute("x1",nx-2); lg.setAttribute("x2",nx+NW+2); lg.setAttribute("y1",yOf(L)); lg.setAttribute("y2",yOf(L)); lg.setAttribute("class","staff"); g.appendChild(lg);} } }
        const r=document.createElementNS(NS,"rect");
        if(n.dia){ r.setAttribute("x",nx+1); r.setAttribute("y",y-3.2); r.setAttribute("width",6); r.setAttribute("height",6); r.setAttribute("transform",`rotate(45 ${nx+4} ${y-0.2})`); }
        else { r.setAttribute("x",nx); r.setAttribute("y",y-3.4); r.setAttribute("width",NW-(n.liq?2:0)); r.setAttribute("height",n.q?5:6.8); }
        r.setAttribute("class","note"+(n.q?" quil":"")); g.appendChild(r);
        if(n.dot){ const c=document.createElementNS(NS,"circle"); c.setAttribute("cx",nx+NW+2.5); c.setAttribute("cy",y-(n.L%2?2.6:0)); c.setAttribute("r",1.4); c.setAttribute("class","note"); g.appendChild(c); }
        if(n.ep){ const e=document.createElementNS(NS,"line"); e.setAttribute("x1",nx); e.setAttribute("x2",nx+NW); e.setAttribute("y1",y-6); e.setAttribute("y2",y-6); e.setAttribute("class","ep"); g.appendChild(e); }
        nx+=NW+NG;
      });
      if(it.sy.text.trim()){ const t=document.createElementNS(NS,"text"); t.setAttribute("x",it.x+(it.w-it.tw)/2+3); t.setAttribute("y",y0+lyric-top+4); t.setAttribute("class","lyric"); t.textContent=it.sy.text.trim(); g.appendChild(t); }
      svg.appendChild(g);
    });
  });
  el.innerHTML=""; el.appendChild(svg);
  return svg;
}

/* ---------------------------------------------------------------- ABC melody reader */
const KEYS={"C":0,"G":1,"D":2,"A":3,"E":4,"B":5,"F#":6,"C#":7,"F":-1,"Bb":-2,"Eb":-3,"Ab":-4,"Db":-5,"Gb":-6,"Cb":-7};
const SHARPS="FCGDAEB", NOTE_ST={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function keyAcc(k){ let m=/^([A-G][#b]?)(m|min|minor|dor|mix|lyd|phr|loc)?/i.exec(k||"C"); if(!m) return {}; let base=m[1], mode=(m[2]||"").toLowerCase();
  let n=KEYS[base]!=null?KEYS[base]:0; if(mode==="m"||mode==="min"||mode==="minor") n-=3; if(mode==="dor") n-=2; if(mode==="mix") n-=1;
  const acc={}; if(n>0) for(let i=0;i<n;i++) acc[SHARPS[i]]=1; if(n<0) for(let i=0;i<-n;i++) acc[SHARPS[6-i]]=-1; return acc; }
function frac(s){ if(!s) return 1; if(/^\/+$/.test(s)) return 1/Math.pow(2,s.length); const m=/^(\d*)(\/(\d*))?$/.exec(s); if(!m) return 1; const a=m[1]?+m[1]:1; if(!m[2]) return a; const b=m[3]?+m[3]:2; return a/b; }
function abcVoices(abc){
  const head={}, voices={}; let cur=null; const order=[];
  abc.split(/\n/).forEach(line=>{
    const l=line.replace(/%.*$/,"").trimEnd(); if(!l.trim()) return;
    const hm=/^([A-Za-z]):\s*(.*)$/.exec(l);
    if(hm && !/^\[/.test(l)){ const k=hm[1], v=hm[2];
      if(k==="V"){ cur=v.split(/\s/)[0]; if(!voices[cur]){ voices[cur]=""; order.push(cur);} return; }
      if(k==="w"||k==="W") return;
      if(cur===null || "LMKQ".indexOf(k)<0 || !voices[cur]) head[k]=v; else voices[cur]+=`[${k}:${v}]`; return; }
    let body=l; const vm=/^\[V:\s*([^\]\s]+)[^\]]*\]\s*(.*)$/.exec(body);
    if(vm){ cur=vm[1]; if(voices[cur]==null){ voices[cur]=""; order.push(cur);} body=vm[2]; }
    if(cur===null){ cur="_"; voices[cur]=""; order.push(cur); }
    voices[cur]+=" "+body;
  });
  return {head,voices,order};
}
function abcEvents(abc){
  const {head,voices,order}=abcVoices(abc);
  let L=frac((head.L||"1/8").trim()); const q=/(\d+\/\d+)\s*=\s*(\d+)/.exec(head.Q||"1/4=100");
  let qn=q?frac(q[1]):0.25, bpm=q?+q[2]:96; const secPerWhole=()=>60/bpm/qn;
  const pick=[order.find(v=>/S1V1|^1$|^S$/i.test(v))||order[0], order.find(v=>/S2V2|bass|^4$|^B$/i.test(v))].filter((v,i,a)=>v&&a.indexOf(v)===i);
  const ev=[];
  pick.forEach((vn,vi)=>{
    let t=0, key=keyAcc((head.K||"C").trim()), barAcc={}; const s=voices[vn]||""; let i=0, tie=null;
    let lastNote=null;
    while(i<s.length){
      const c=s[i];
      if(c==="["&&/^\[[A-Za-z]:/.test(s.slice(i))){ const j=s.indexOf("]",i); const f=s.slice(i+1,j); const k=f[0], v=f.slice(2).trim();
        if(k==="K") key=keyAcc(v); if(k==="L") L=frac(v); if(k==="Q"){ const qq=/(\d+\/\d+)\s*=\s*(\d+)/.exec(v); if(qq){ qn=frac(qq[1]); bpm=+qq[2]; } } i=j+1; continue; }
      if(c==='"'){ const j=s.indexOf('"',i+1); i=j<0?s.length:j+1; continue; }
      if(c==="!"){ const j=s.indexOf("!",i+1); i=j<0?s.length:j+1; continue; }
      if(c==="{"){ const j=s.indexOf("}",i); i=j<0?s.length:j+1; continue; }
      if(c==="|"||c===":"){ barAcc={}; i++; continue; }
      if(c==="-"&&lastNote){ tie=lastNote; i++; continue; }
      let chord=false; if(c==="["){ chord=true; i++; }
      const notes=[]; let durTok="";
      const readNote=()=>{ const m=/^(\^\^|\^|__|_|=)?([A-Ga-gz])([,']*)(\d*\/*\d*)/.exec(s.slice(i)); if(!m) return null; i+=m[0].length; return m; };
      let m;
      if(chord){ while(i<s.length && s[i]!=="]"){ m=readNote(); if(!m){ i++; continue; } notes.push(m); } i++; const dm=/^(\d*\/*\d*)/.exec(s.slice(i)); durTok=dm[0]; i+=durTok.length; if(notes.length) notes[0].durOverride=durTok; }
      else { m=readNote(); if(!m){ i++; continue; } notes.push(m); }
      if(!notes.length) continue;
      const dTok = chord ? (durTok || notes[0][4]) : notes[0][4];
      const dur=frac(dTok)*L*secPerWhole();
      const n0=notes[0];
      if(n0[2]!=="z"){
        const letter=n0[2].toUpperCase(); let oct=n0[2]===n0[2].toLowerCase()?5:4; for(const ch of n0[3]){ oct+= ch==="'"?1:-1; }
        let acc = n0[1]? ({"^":1,"^^":2,"_":-1,"__":-2,"=":0})[n0[1]] : (barAcc[letter+oct]!=null? barAcc[letter+oct] : (key[letter]||0));
        if(n0[1]) barAcc[letter+oct]=acc;
        const midi=12*(oct+1)+NOTE_ST[letter]+acc;
        if(tie && tie.m===midi){ tie.d+=dur; lastNote=tie; tie=null; }
        else { const e={t,d:dur*0.95,m:midi,v:vi?0.55:0.85}; ev.push(e); lastNote=e; tie=null; }
      } else { lastNote=null; tie=null; }
      t+=dur;
    }
  });
  ev.sort((a,b)=>a.t-b.t);
  return {ev,total:ev.reduce((a,e)=>Math.max(a,e.t+e.d),0)};
}

/* ---------------------------------------------------------------- abcjs (notation only) */
let abcjsPromise=null;
function loadAbcjs(){ if(window.ABCJS) return Promise.resolve(window.ABCJS);
  if(!abcjsPromise) abcjsPromise=new Promise(res=>{ const s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/abcjs@6.4.4/dist/abcjs-basic-min.js"; s.onload=()=>res(window.ABCJS||null); s.onerror=()=>res(null); document.head.appendChild(s); setTimeout(()=>res(window.ABCJS||null),8000); });
  return abcjsPromise; }

/* ---------------------------------------------------------------- widgets */
function chantWidget(title, gabc, meta){
  const id="c"+Math.random().toString(36).slice(2,9);
  const html=`<figure class="music chantfig" id="${id}"><figcaption><span class="mt">${esc(title)}</span>${meta?`<span class="mm">${esc(meta)}</span>`:""}
    <span class="mctl"><button type="button" class="play" aria-label="Play ${esc(title)}">▶ Play</button><label class="tp">Pitch <select aria-label="Transpose"><option value="-3">−3</option><option value="-2">−2</option><option value="-1">−1</option><option value="0" selected>0</option><option value="1">+1</option><option value="2">+2</option><option value="3">+3</option></select></label></span></figcaption>
    <div class="score"></div></figure>`;
  whenShown(id,fig=>{
    let syl; try{ syl=parseGabc(gabc); }catch(e){ fig.querySelector(".score").innerHTML=`<p class="note">This chant couldn't be read.</p>`; return; }
    const score=fig.querySelector(".score"); let svg=renderChant(score,syl,{label:title});
    let lastW=score.clientWidth; const ro=window.ResizeObserver? new ResizeObserver(()=>{ if(Math.abs(score.clientWidth-lastW)>20){ lastW=score.clientWidth; svg=renderChant(score,syl,{label:title}); } }):null; if(ro) ro.observe(score);
    const btn=fig.querySelector(".play"), sel=fig.querySelector("select");
    let ctl=null;
    btn.addEventListener("click",()=>{
      if(ctl){ ctl.stop(); return; }
      const {ev,sylTimes}=chantEvents(syl,1,+sel.value);
      let lastS=-1;
      ctl=playEvents(ev,"chant",now=>{ let s=-1; for(let k=0;k<sylTimes.length;k++){ if(now>=sylTimes[k][0]&&now<sylTimes[k][1]){ s=k; break; } }
          if(s!==lastS){ svg.querySelectorAll(".syl.on").forEach(x=>x.classList.remove("on")); const g=svg.querySelector(`.syl[data-s="${s}"]`); if(g){ g.classList.add("on"); } lastS=s; } },
        ()=>{ btn.textContent="▶ Play"; ctl=null; svg.querySelectorAll(".syl.on").forEach(x=>x.classList.remove("on")); });
      if(ctl) btn.textContent="■ Stop";
    });
  });
  return html;
}
/* A widget's markup is returned before the page puts it in the document, sometimes only after the rest of the
   service has loaded: fill it in once it is there (checking for up to a minute). */
function whenShown(id,fn,t0=Date.now()){
  const el=document.getElementById(id);
  if(el) return fn(el);
  if(Date.now()-t0<60000) setTimeout(()=>whenShown(id,fn,t0),Date.now()-t0<2000?0:250);
}
function chantSeconds(gabc){ try{ return chantEvents(parseGabc(gabc),1,0).total; }catch(e){ return 60; } }

function hymnWidget(h, slot){
  const id="h"+Math.random().toString(36).slice(2,9);
  const verses=(h.abc.match(/^w:\s*\d+\./gm)||[]).length || 1;
  const html=`<figure class="music hymnfig" id="${id}"><figcaption><span class="mt">${esc(h.t)}</span><span class="mm">Tune: ${esc(h.tune)} · ${verses} verse${verses>1?"s":""} · public domain (Open Hymnal)</span>
    <span class="mctl"><button type="button" class="play" aria-label="Play ${esc(h.t)}">▶ Play tune</button></span></figcaption>
    <div class="score"><p class="note">Loading notation…</p></div>${h.w&&h.w.length?`<div class="moreverses">${h.w.map(l=>esc(l)).join("<br>")}</div>`:""}</figure>`;
  whenShown(id,async fig=>{
    const score=fig.querySelector(".score");
    const A=await loadAbcjs();
    if(A){ try{ score.innerHTML=""; A.renderAbc(score, h.abc.replace(/^%%MIDI.*$/gm,""), {responsive:"resize", add_classes:true, staffwidth:Math.max(300,score.clientWidth-20), paddingleft:0, paddingright:0, foregroundColor:getComputedStyle(document.body).color}); }catch(e){ score.innerHTML=lyricsOnly(h); } }
    else score.innerHTML=lyricsOnly(h)+`<p class="note">Sheet music couldn't load; the tune still plays.</p>`;
    const btn=fig.querySelector(".play"); let ctl=null;
    btn.addEventListener("click",()=>{ if(ctl){ ctl.stop(); return; }
      const {ev}=abcEvents(h.abc); ctl=playEvents(ev,"organ",null,()=>{ btn.textContent="▶ Play tune"; ctl=null; }); if(ctl) btn.textContent="■ Stop"; });
  });
  return html;
}
function lyricsOnly(h){
  const lines=(h.abc.match(/^w:.*$/gm)||[]).map(l=>l.slice(2).trim());
  const k=Math.max(1,lines.filter(l=>/^\d+\./.test(l)).length);
  const verses=[]; for(let v=0;v<k;v++){ verses.push(lines.filter((_,i)=>i%k===v).join(" ")); }
  const clean=t=>t.replace(/~/g," ").replace(/-\s*/g,"").replace(/[*_|]/g,"").replace(/\s+/g," ").trim();
  return `<div class="lyrics">${verses.map(v=>`<p>${esc(clean(v))}</p>`).join("")}</div>`;
}
function hymnSeconds(h){ try{ const v=(h.abc.match(/^w:\s*\d+\./gm)||[]).length||1; return abcEvents(h.abc).total*Math.min(v,4); }catch(e){ return 180; } }

/* called from a click so later playback (started by a live host) is allowed to make sound */
function unlock(){ const ac=ctx(); if(!ac) return false; try{ const o=ac.createOscillator(), g=ac.createGain(); g.gain.value=0; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+0.02); }catch(e){} return true; }
window.LectMusic={chantWidget,hymnWidget,chantSeconds,hymnSeconds,stopAll,parseGabc,chantEvents,abcEvents,unlock};
})();
/* ================================================================ MASS GUIDE (full missal) */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const M=()=>window.LectMusic;
const cache={};
const J=n=>cache[n]||(cache[n]=fetch(n).then(r=>{ if(!r.ok) throw new Error(n); return r.json(); }));
const {DAY,toDate,easter:easterY,advent:adv1Y,fromEaster}=window.LitDate;
function hash(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619);} return Math.abs(h); }

/* ---------------------------------------------------------------- season / defaults */
function season(iso, day){
  const d=toDate(iso), Y=d.getUTCFullYear(); const E=easterY(Y), A=adv1Y(Y);
  const t=((day&&day.n&&day.n.t)||"")+" "+((day&&day.m&&day.m.t)||"");
  const off=Math.round((d-E)/DAY);
  if(/Defunct|All Souls/i.test(t)) return "dead";
  if(off===-7) return "palm";
  if(off>=-6&&off<0) return "lent";
  if(off===39) return "ascension";
  if(off>=40&&off<=49) return off===49?"pentecost":"ascension";
  if(off===56) return "trinity";
  if(off===60||/Corpus|Body and Blood|Sacred Heart|Cordis/i.test(t)) return "eucharist";
  if(/Christ the King|Jesu Christi Regis/i.test(t)) return "king";
  if(/All Saints|Omnium Sanctorum/i.test(t)) return "saints";
  if(/Mary|BVM|Mari[æa]|Assumption|Immaculat|Annunciation|Visitation|Rosar/i.test(t)) return "mary";
  if(d>=A) return d.getUTCMonth()===11&&d.getUTCDate()>=25?"christmas":"advent";
  if(d.getUTCMonth()===0&&d.getUTCDate()<=13) return d.getUTCDate()>=6?"epiphany":"christmas";
  if(off>=-46&&off<-7) return "lent";
  if(off>=0&&off<39) return "easter";
  return "general";
}
const PASCHAL=(iso)=>{ const d=toDate(iso), E=easterY(d.getUTCFullYear()); const off=Math.round((d-E)/DAY); return off>=0&&off<=55; };
function defaultMass(iso, day, rite){
  const s=season(iso,day), d=toDate(iso), sun=d.getUTCDay()===0;
  const t=day.m||{}; const rk=t.rank||0;
  if(PASCHAL(iso)) return "I";
  if(s==="mary") return "IX";
  if(s==="advent"||s==="lent"||s==="palm") return sun?"XVII":"XVIII";
  if(s==="dead") return "XVIII";
  if(sun) return "XI";
  if(/Solemnity|Duplex I|I\. classis|Feast/i.test((t.s||"")+((day.n||{}).s||""))) return "VIII";
  return rite==="n"||rite==="o"?"XVI":"XVI";
}
const hasGloriaNO=(iso,day)=>{ const s=season(iso,day), sun=toDate(iso).getUTCDay()===0; const st=(day.n&&day.n.s)||""; if(s==="advent"||s==="lent"||s==="palm"||s==="dead") return /Solemnity|Feast/.test(st)&&!/Sunday/.test(st)&&!sun?true:false; return sun||/Solemnity|Feast/.test(st); };
const hasCreedNO=(iso,day)=>toDate(iso).getUTCDay()===0||/Solemnity/.test((day.n&&day.n.s)||"");

/* ---------------------------------------------------------------- options */
const PRESETS={
  said:{label:"Said",desc:"Spoken throughout, no music",hymns:{entrance:false,offertory:false,communion:false,recessional:false},ordinary:"said",propers:"said",asperges:false,marian:false,homily:5,communion:4,up:true,ep:"II",leonine:true,lastGospel:true},
  sung:{label:"Sung, simple",desc:"Four hymns and a sung chant Ordinary",hymns:{entrance:true,offertory:true,communion:true,recessional:true},ordinary:"sung",propers:"said",asperges:false,marian:true,homily:10,communion:6,up:true,ep:"III",leonine:false,lastGospel:true},
  chant:{label:"Full chant",desc:"Gregorian propers and Ordinary, Asperges on Sundays",hymns:{entrance:false,offertory:false,communion:true,recessional:true},ordinary:"sung",propers:"chant",asperges:true,marian:true,homily:12,communion:8,up:true,ep:"I",leonine:false,lastGospel:true},
};
function loadOpts(rite){ let o=null; try{ o=JSON.parse(localStorage.getItem("lect-mass-"+rite)||"null"); }catch(e){}
  const ap=window.__lectApplyPreset; window.__lectApplyPreset=null;
  const base={preset:"sung",...JSON.parse(JSON.stringify(PRESETS.sung)),lang:"both",choice:{},mass:"",credo:"III",target:0,veil:true};
  if(!o||!o.hymns) o={...base,...(o||{})};
  if(ap&&PRESETS[ap]) o={...o,...JSON.parse(JSON.stringify(PRESETS[ap])),preset:ap};
  if(!o.hymns) o.hymns=base.hymns;
  return o; }
function saveOpts(rite,o){ try{ localStorage.setItem("lect-mass-"+rite,JSON.stringify(o)); }catch(e){} }

/* ---------------------------------------------------------------- roles
   Every spoken line carries data-r: cel (celebrant / officiant), srv (server, deacon), lec (lector, reader),
   ppl (congregation, choir), all (everyone). A line may name several. */
let ROLE="cel";
const ALL_RE=/Glória in excélsis Deo|Credo in unum Deum|Sanctus, Sanctus, Sanctus|Agnus Dei, qui tollis|Glory be to God on high|I believe in one God|Holy, Holy, Holy|Lamb of God, Who takest/;
function roleFor(lab, lang, text){
  if(ALL_RE.test(text)) return "all";
  switch(lab){ case "S": return lang==="en"?"srv ppl":"cel"; case "M": case "R": return "srv ppl"; case "P": case "V": return "cel"; case "D": return "srv"; case "C": return "ppl"; default: return ROLE; }
}
const RB_ROLE=lab=>/Gospel|Passion/.test(lab)?"cel":/Psalm|Gradual/.test(lab)?"lec ppl":"lec";
async function RB(ctx,lab,cit,num,tr,added){ return `<div data-r="${RB_ROLE(lab)}">${await ctx.readingBlock(lab,cit,num,tr,added)}</div>`; }
function CW(title,g,meta){ const r=/^(Pater|Preface|Pax|Ite|Benedicamus)/.test(title)?"cel":"ppl"; return `<div data-r="${r}">${M().chantWidget(title,g,meta)}</div>`; }

/* ---------------------------------------------------------------- postures and actions (US customs; parishes differ) */
const POSL={stand:"Stand",sit:"Sit",kneel:"Kneel",bow:"Bow",genuflect:"Genuflect",cross:"Sign of the cross",strike:"Strike the breast",bell:"Bell",prostrate:"Prostration",incense:"Incense"};
function pos(list){ list=(list||[]).filter(Boolean); return list.length?`<p class="pos">${list.map(([k,n])=>`<span class="pg"><span class="pb pb-${k}">${POSL[k]||k}</span>${n?` <span class="pn">${esc(n)}</span>`:""}</span>`).join("")}</p>`:""; }
const TRAD_POS={
  "_hymn":{l:[["stand","for the procession"]],s:[["stand","for the procession"]]},
  "Incipit":{l:[["kneel"],["cross","at In nomine Patris and at Adjutorium nostrum"],["strike","three times at mea culpa"]],s:[["kneel","for the prayers at the foot of the altar"],["cross","at In nomine Patris"],["strike","at mea culpa"]]},
  "Incensatio#1":{s:[["stand"]]},
  "Introitus":{l:[["kneel"],["cross","with the priest at the start of the Introit"]],s:[["stand"],["cross","at the start of the Introit"]]},
  "Kyrie":{l:[["kneel"],["bow","at Adoramus te, Gratias agimus, Jesu Christe and Suscipe deprecationem"]],s:[["stand"],["sit","when the celebrant sits during the sung Gloria"],["bow","at Adoramus te, Gratias agimus, Jesu Christe"]]},
  "Oratio":{l:[["kneel"]],s:[["stand"]]},
  "Lectio":{l:[["sit"]],s:[["sit"]]},
  "Graduale":{l:[["sit"]],s:[["sit"]]},
  "Evangelium":{l:[["stand"],["cross","small crosses on forehead, lips and breast at the announcement"],["sit","for the sermon"]],s:[["stand"],["cross","on forehead, lips and breast at the announcement"],["sit","for the sermon"]]},
  "Credo":{l:[["stand"],["genuflect","with the priest at Et incarnatus est"]],s:[["stand"],["sit","when the celebrant sits"],["kneel","while Et incarnatus est is sung"]]},
  "Offertorium":{l:[["sit"]],s:[["sit"]]},
  "Incensatio#2":{l:[["kneel","from the Orate fratres (or stay seated until the Sanctus where that is the custom)"]],s:[["stand","when the people are incensed"],["sit"]]},
  "Præfatio":{l:[["kneel"],["bell","at the Sanctus"]],s:[["stand","for the Preface"],["kneel","at the Sanctus"],["bell","at the Sanctus"]]},
  "Canon":{l:[["kneel"],["bell","at Hanc igitur and three times at each elevation"],["bow","look at the Host and the Chalice: My Lord and my God"],["strike","at Nobis quoque peccatoribus"]],s:[["kneel"],["bell","at Hanc igitur and at each elevation"],["bow","look at the Host and the Chalice"],["strike","at Nobis quoque peccatoribus"]]},
  "Preparatio Communionis":{l:[["kneel"],["strike","at the Agnus Dei and three times at Domine, non sum dignus"],["bell","at Domine, non sum dignus"]],s:[["kneel"],["strike","at Domine, non sum dignus"],["bell","at Domine, non sum dignus"]]},
  "Communio":{l:[["kneel","to receive, on the tongue"]],s:[["kneel","to receive, on the tongue"]]},
  "Postcommunio":{l:[["kneel"]],s:[["stand"]]},
  "Conclusio":{l:[["kneel","for the blessing"],["cross","at the blessing"],["stand","for the Last Gospel"],["genuflect","at Et Verbum caro factum est"]],s:[["stand","for Ite, missa est"],["kneel","for the blessing"],["cross"],["stand","for the Last Gospel"],["genuflect","at Et Verbum caro factum est"]]},
  "Orationes Leonis XIII":{l:[["kneel"]],s:[["kneel"]]},
  "_after":{l:[["stand"]],s:[["stand"]]},
};
function tradPos(key,h,sung){ const t=TRAD_POS[key]||TRAD_POS[h]; return t?pos(sung?(t.s||t.l):(t.l||t.s)):""; }

/* ---------------------------------------------------------------- DO markup */
function lineHTML(l, P, lang){
  let s=(l||"").replace(/\t/g," ").trim(); if(!s||s==="_") return ""; if(/^wait\d+$/.test(s)) return "";
  s=s.replace(/wait\d+/g,"").replace(/N\.[pb]\b/g,"N.");
  if(s.startsWith("!*")) return "";
  if(s.startsWith("#")) return `<h5 class="sub">${inl(s.replace(/^#+\s*/,""))}</h5>`;
  if(s.startsWith("!!!")) return `<p class="emph" data-r="cel">${inl(s.slice(3))}</p>`;
  if(s.startsWith("!!")) return `<h5 class="sub">${inl(s.slice(2))}</h5>`;
  if(s.startsWith("!")){ const t=s.slice(1).trim(); if(/^[1-4]?\s?[A-Za-zæÆé]+\.?\s*\d/.test(t)&&t.length<60) return `<p class="cite">${esc(t)}</p>`; return `<p class="rub">${inl(t)}</p>`; }
  if(s.startsWith("$")){ const k=s.slice(1).trim(); const txt=(P&&P.prayers&&P.prayers[k])||""; return txt?txt.split("\n").map(x=>lineHTML(x,P,lang)).join(""):""; }
  if(s.startsWith("&")){ const k=s.slice(1).trim(); const map={Gloria:"Gloria",DominusVobiscum:"Dominus vobiscum"}; const txt=map[k]&&P&&P.prayers?P.prayers[map[k]]:""; return txt?txt.split("\n").map(x=>lineHTML(x,P,lang)).join(""):""; }
  const m=/^(V|R|P|S|M|C|D|v|r|Ant|Ps)\.\s*/.exec(s); let lab="";
  if(m){ s=s.slice(m[0].length); lab={V:"℣.",R:"℟.",P:"P.",S:"S.",M:"M.",C:"C.",D:"D.",Ant:"Ant.",Ps:"Ps."}[m[1]]||""; }
  return `<p data-r="${roleFor(m&&m[1],lang,s)}">${lab?`<span class="sp">${lab}</span> `:""}${inl(s)}</p>`;
}
function inl(s){ return esc(s).replace(/\(([^)]{2,})\)/g,'<i class="rubi">($1)</i>').replace(/(^|\s)\+(?=\s|$)/g,'$1<span class="cross">✠</span>').replace(/\s\+\s?/g,' <span class="cross">✠</span> '); }
function block(la,en,P,lang){
  const L=(la||[]).map(x=>lineHTML(x,{prayers:P.la},"la")).join(""), E=(en||[]).map(x=>lineHTML(x,{prayers:P.en},"en")).join("");
  if(lang==="la") return `<div class="txt one">${L}</div>`; if(lang==="en") return `<div class="txt one">${E||L}</div>`;
  return `<div class="txt two"><div lang="la">${L}</div><div lang="en">${E}</div></div>`;
}
const readSecs=(html,dflt)=>{ const n=String(html||"").replace(/<sup>[^<]*<\/sup>/g," ").replace(/<[^>]+>/g," ").split(/\s+/).filter(w=>/[A-Za-z]/.test(w)).length; return n>25?Math.max(45,n/2.5+15):dflt; };
const words=lines=>(lines||[]).join(" ").replace(/[!&$]\S*/g," ").split(/\s+/).filter(Boolean).length;

/* ---------------------------------------------------------------- shared pieces */
function cue(text){ return `<p class="cue">${esc(text)}</p>`; }
function abr(list){ list=[].concat(list).filter(Boolean); return list.length?`<p class="abr"><span class="lbl">Shortened for time</span> ${list.map(esc).join(" · ")}</p>`:""; }
const VEIL="The words of consecration are not shown in lay study. Follow in silence; do not voice the priest’s prayer or imitate the consecration. (Priests and seminarians: choose Participation › Priest or seminarian.)";
const veilCue=()=>`<p class="cue veiled" data-priest-only>${esc(window.LectParticipation&&window.LectParticipation.veilText?window.LectParticipation.veilText():VEIL)}</p>`;
/* The words of consecration in the prayer-book and Eastern texts that carry no explicit marker: the institution
   narrative as said over the gifts, and the Byzantine epiclesis. Lessons (Maundy Thursday's epistle) never pass here. */
const CONS_RE=/\b(this is my (bod(y|ye|ie)|blou?de?)|this cup is the new (testament|covenant)|this is the new (testament|covenant) in my blood|this is my blood of the new)|make this bread the precious body|make that which is in this chalice|this bread is in very truth the precious body|this chalice, in very truth the precious blood|transmuting them by thy holy spirit/i;
let VEILING=false;
/* Ordo items the abridgment levels leave out, by Latin section heading and occurrence: {level:[item indexes]} (levels are cumulative). */
const TRAD_DROP={
  "Incipit#1":{2:[4],3:[3]},
  "Incensatio#1":{1:[0]},
  "Kyrie#1":{3:[1]},
  "Credo#1":{2:[0]},
  "Offertorium#1":{1:[2],2:[4],3:[1]},
  "Incensatio#2":{1:[0,2],2:[1]},
  "Canon#1":{2:[0,1,2,3,4,9,10,11,12,13]},
  "Preparatio Communionis#1":{1:[2,5,8,9,12,14],2:[1],3:[11]},
  "Conclusio#1":{1:[2]},
};
function dropped(key, j, lvl){ const t=TRAD_DROP[key]; if(!t||!lvl) return false; for(let L=1;L<=lvl;L++) if((t[L]||[]).includes(j)) return true; return false; }
function incipitOf(lines){ const l=(lines||[]).find(x=>/^(v|V|S|M|C)\.\s*\S/.test(x.trim())&&!/^(V|R)\.\s*(Dóminus vobíscum|Et cum)/.test(x.trim()))||""; const w=l.trim().replace(/^(v|V|S|M|C)\.\s*/,"").replace(/\([^)]*\)/g,"").replace(/[+✠]/g,"").split(/\s+/).filter(Boolean).slice(0,4).join(" "); return w?w.replace(/[,:;.]$/,"")+"…":""; }
function sec(title, min, body, cls){ return {title, min, html:`<section class="mpart ${cls||""}"><h3><span>${esc(title)}</span><span class="pmin">${min>=0.5?`≈ ${Math.max(1,Math.round(min))} min`:""}</span></h3>${body}</section>`}; }
let USED=new Set();
function pickHymn(H, iso, slot, s, choice){
  if(choice&&H[choice]){ USED.add(choice); return choice; }
  const pools={entrance:[s,"general"],offertory:[s,"general"],communion:["eucharist"],recessional:[s==="dead"?"dead":s,"king","general"]}[slot];
  let list=[]; pools.forEach(p=>Object.keys(H).forEach(k=>{ if(H[k].s.includes(p)&&!list.includes(k)) list.push(k); }));
  if(!list.length) list=Object.keys(H);
  const primary=Object.keys(H).filter(k=>H[k].s.includes(pools[0]));
  let L=(primary.length>=2?primary:list).filter(k=>!USED.has(k)); if(!L.length) L=list.filter(k=>!USED.has(k)); if(!L.length) L=list;
  const k=L[hash(iso+slot)%L.length]; USED.add(k); return k;
}
function hymnSlot(H, iso, slot, s, opts, label){
  if(!opts.hymns||!opts.hymns[slot]) return {html:"",sec:0};
  const k=pickHymn(H,iso,slot,s,(opts.choice||{})[slot]); const h=H[k];
  const opt=Object.keys(H).sort((a,b)=>H[a].t.localeCompare(H[b].t)).map(x=>`<option value="${esc(x)}"${x===k?" selected":""}>${esc(H[x].t)}</option>`).join("");
  return {sec:M().hymnSeconds(h), html:`<div class="hslot" data-r="ppl"><div class="hhead"><span class="lbl">${esc(label)}</span><select class="hsel" data-slot="${slot}" aria-label="${esc(label)} hymn">${opt}</select></div>${M().hymnWidget(h,slot)}</div>`};
}
function marian(iso, C){
  const d=toDate(iso), Y=d.getUTCFullYear(), E=easterY(Y), A=adv1Y(Y), off=Math.round((d-E)/DAY), md=d.getUTCMonth()*100+d.getUTCDate();
  let k="salve", n="Salve Regina";
  if(d>=A||md<=102) { k="alma"; n="Alma Redemptoris Mater"; }
  else if(md>102&&off<-3){ k="ave"; n="Ave Regina caelorum"; }
  else if(off>=0&&off<=55){ k="regina"; n="Regina caeli"; }
  const id=C.common[k]; return id&&C.chants[id]?{name:n,gabc:C.chants[id].g}:null;
}
function ordinaryChant(C, mass, part){ const ids=(C.kyriale[mass]||{}).ids||{}; const id=ids[part]; return id&&C.chants[id]?C.chants[id].g:null; }

/* ---------------------------------------------------------------- 1962 / pre-1955 / hybrid */
async function buildTrad(ctx, form, opts){
  const {iso, day} = ctx;
  const [O,C,H,PR]=await Promise.all([J("ordo.json"),J("chant.json"),J("hymns.json"),J(form==="pre55"?"propers-pre55.json":"propers-1962.json")]);
  const tday = form==="pre55"?day.p:day.m;
  const key=`${form}|${tday.path}|${tday.feria?1:0}`;
  const P=PR.map[key]!=null?PR.data[PR.map[key]]:null;
  if(!P) return [sec("Propers unavailable",0,cue("The propers for this day could not be found."))];
  const CM=C.map[key]||{};
  const PRAY={la:O.Latin.prayers,en:O.English.prayers};
  const lang=opts.lang||"both";
  const sung=opts.ordinary==="sung", chantProp=opts.propers==="chant";
  const mass=opts.mass||defaultMass(iso,day,ctx.rite);
  const s=season(iso,day), sun=toDate(iso).getUTCDay()===0;
  const defunct=/11-02|Defunct/.test(tday.path+tday.t);
  const passiontide=/Tempora\/Quad[56]-/.test(tday.path);
  const paschal=PASCHAL(iso);
  const glr=P.glr!=null?P.glr:(P.gloria?1:0);
  const gloria = !defunct && (tday.feria ? paschal : (glr===1 || (glr===0 && (sun || /^Sancti\//.test(tday.path) || /Tempora\/Pasc/.test(tday.path)))));
  const hyb=ctx.rite==="h"?day.h:null;
  const AB=opts.abridge||0;
  const hybWeekday=hyb&&/weekday/i.test(hyb.s||"");
  const out=[];
  const chantFig=(title,id,meta)=>{ const c=C.chants[id]; return c?CW(title,c.g,meta||`Mode ${c.m||"—"} · GregoBase (CC0)`):""; };
  const chantSecs=id=>C.chants[id]?M().chantSeconds(C.chants[id].g):0;
  const part=(n)=>P.parts[n]||null;
  const propBlock=(n,label,chantKey,role)=>{
    const p=part(n); if(!p) return {html:"",sec:0};
    ROLE=role||(/^(Lectio|Graduale|Tractus|Sequentia)/.test(n)?"lec":"cel"); let html=block(p[0],p[1],PRAY,lang); ROLE="cel"; let secs=words(p[1]||p[0])/2.3;
    if(chantProp&&chantKey&&CM[chantKey]){ html+=CM[chantKey].map(id=>chantFig(`${label} · ${C.chants[id].i}`,id)).join(""); secs=CM[chantKey].reduce((a,id)=>a+chantSecs(id),0); }
    return {html,sec:secs};
  };
  const conditions=(item)=>{
    const first=(item.match(/^!\*\S+/m)||[""])[0];
    if(!first) return true;
    const f=first.slice(2);
    if(f.startsWith("&")){ const fn=f.slice(1);
      if(fn==="Introibo") return !(defunct||passiontide) && AB<1;
      if(fn==="GloriaM") return gloria;
      if(fn==="Credo") return !!P.credo&&!defunct;
      if(fn==="CheckQuiDixisti") return !defunct;
      if(fn==="CheckPax") return sung&&!defunct;
      if(fn==="CheckBlessing") return !defunct;
      if(fn==="CheckUltimaEv") return opts.lastGospel!==false && !(form==="1962"&&/12-25m3/.test(tday.path));
      return true; }
    if(/nD/.test(f)&&defunct) return false;
    if(/^S/.test(f)&&!sung) return false;
    if(/^R/.test(f)&&sung) return false;
    if(/^D/.test(f)&&!defunct) return false;
    return true;
  };
  const OL=O.Latin.ordo, OE=O.English.ordo;
  let curTitle="Before Mass", curHTML="", curSec=0, agnusDone=false, curDrop=[], canonW=0, curPos=tradPos("_hymn","",sung);
  const seen={};
  const flush=()=>{ if(curDrop.length) curHTML+=abr(curDrop); if(curHTML) out.push(sec(curTitle,curSec/60,curPos+curHTML)); curHTML=""; curSec=0; curDrop=[]; curPos=""; };
  // entrance hymn / Asperges
  const ent=hymnSlot(H,iso,"entrance",s,opts,"Processional hymn");
  if(ent.html){ curHTML+=ent.html; curSec+=ent.sec; }
  for(let k=0;k<OL.length;k++){
    const secLa=OL[k], secEn=OE[k]||{items:[]};
    const head=secEn.h&&secEn.h!=="_start"?secEn.h:secLa.h;
    if(k>0 && head!=="_start"){ flush(); curTitle=head==="Evangelium"?"Gospel":head; }
    const key=secLa.h+"#"+(seen[secLa.h]=(seen[secLa.h]||0)+1);
    if(k>0 && head!=="_start") curPos=tradPos(key,secLa.h,sung);
    if(head==="Leonine Prayers"||secLa.h.startsWith("Orationes Leonis")){ if(!opts.leonine||sung){ continue; } }
    // A heading-level marker governs the section's first paragraph; only one-paragraph sections are skipped whole.
    const secSkip=!!(secLa.cond && !conditions(secLa.cond));
    if(secSkip && secLa.items.length<=1) continue;
    if(key==="Incensatio#2") curTitle=secSkip||dropped(key,0,AB)?"Lavabo and Orate fratres":"Incense, Lavabo, Orate fratres";
    if(key==="Credo#1"&&!conditions(secLa.items[0])) { continue; }
    for(let j=0;j<secLa.items.length;j++){
      const la=secLa.items[j], en=(secEn.items[j]||"");
      if(j===0&&secSkip) continue;
      if(!conditions(la)) continue;
      if(dropped(key,j,AB)){ const nm=incipitOf(la.split("\n")); if(nm) curDrop.push(nm); continue; }
      if(opts.veil&&key==="Canon#1"&&/HOC EST ENIM|HIC EST ENIM/.test(la)){ const host=/HOC EST ENIM/.test(la); curHTML+=veilCue(); curSec+=30; continue; }
      // split on placeholders
      const segL=la.split("\n"), segE=en.split("\n");
      const phs=segL.filter(l=>/^&[A-Za-z_]+\s*$/.test(l.trim())&&!/^&(Gloria|DominusVobiscum)\s*$/.test(l.trim())).map(l=>l.trim().slice(1));
      const cutL=[], cutE=[]; let bufL=[], bufE=[];
      segL.forEach(l=>{ if(/^&[A-Za-z_]+\s*$/.test(l.trim())&&phs.includes(l.trim().slice(1))){ cutL.push(bufL); bufL=[]; } else bufL.push(l); }); cutL.push(bufL);
      segE.forEach(l=>{ if(/^&[A-Za-z_]+\s*$/.test(l.trim())&&phs.includes(l.trim().slice(1))){ cutE.push(bufE); bufE=[]; } else bufE.push(l); }); cutE.push(bufE);
      for(let q=0;q<cutL.length;q++){
        const tl=cutL[q], te=cutE[q]||[];
        if(tl.some(x=>x.trim()&&!x.startsWith("!*"))){
          curHTML+=block(tl,te,PRAY,lang); if(curTitle!=="Canon") curSec+=words(te.length?te:tl)/2.4; else canonW+=words(te.length?te:tl);
          const latJoined=tl.join(" ");
          if(sung){
            if(/Kýrie, eléison/.test(latJoined)&&curTitle==="Kyrie"&&!/Glória in excélsis/.test(latJoined)){ const g=ordinaryChant(C,mass,"Kyrie"); if(g){ curHTML+=CW(`Kyrie ${mass} · ${C.kyriale[mass].name}`,g); curSec+=M().chantSeconds(g)-words(te)/2.4; } }
            if(/Glória in excélsis Deo\. Et in terra/.test(latJoined)){ const g=ordinaryChant(C,mass,"Gloria")||ordinaryChant(C,"VIII","Gloria"); if(g){ curHTML+=CW(`Gloria ${C.kyriale[mass].ids.Gloria?mass:"VIII"}`,g); curSec+=M().chantSeconds(g)-words(te)/2.4; } }
            if(/Credo in unum Deum/.test(latJoined)){ const id=C.credo[opts.credo||"III"]; if(id&&C.chants[id]){ curHTML+=CW(`Credo ${opts.credo||"III"}`,C.chants[id].g); curSec+=M().chantSeconds(C.chants[id].g)-words(te)/2.4; } }
            if(/Sanctus, Sanctus, Sanctus/.test(latJoined)){ const g=ordinaryChant(C,mass,"Sanctus"); if(g){ curHTML+=CW(`Sanctus ${mass}`,g); curSec+=M().chantSeconds(g); } }
            if(/Pater noster, qui es in cælis/.test(latJoined)&&C.chants[C.common.pater]){ curHTML+=CW("Pater noster",C.chants[C.common.pater].g,"Gregorian tone · GregoBase (CC0)"); curSec+=M().chantSeconds(C.chants[C.common.pater].g)-words(te)/2.4; }
            if(/Agnus Dei, qui tollis peccáta mundi: miserére nobis/.test(latJoined)&&!agnusDone){ agnusDone=true; const g=ordinaryChant(C,mass,"Agnus"); if(g){ curHTML+=CW(`Agnus Dei ${mass}`,g); curSec+=M().chantSeconds(g); } }
            if(/Sursum corda/.test(latJoined)&&C.chants[C.common.pref_sol]){ const id=(sun||gloria)?C.common.pref_sol:C.common.pref_fer; curHTML+=CW("Preface dialogue",C.chants[id].g,(sun||gloria)?"Solemn tone":"Ferial tone"); }
          }
          if(curTitle==="Canon") curSec+=0; // canon timing added once below
        }
        if(q<phs.length){
          const ph=phs[q]; let r={html:"",sec:0};
          if(ph==="Vidiaquam"){ if(opts.asperges&&sun&&sung&&!defunct){ const nm=paschal?"Vidi aquam":"Asperges me"; const pl=(O.Latin.prayers[nm]||"").split("\n"), pe=(O.English.prayers[nm]||"").split("\n"); r.html=`<h4 class="sub2">${nm}</h4>`+block(pl,pe,PRAY,lang)+chantFig(nm,paschal?C.common.vidi:C.common.asperges); r.sec=chantSecs(paschal?C.common.vidi:C.common.asperges)+60; } }
          else if(ph==="introitus"){ r=propBlock("Introitus","Introit","Introitus"); }
          else if(ph==="collect"){ r=propBlock("Oratio"); }
          else if(ph==="lectio"){
            if(hyb&&AB<1){ const add=hyb.r.filter(x=>x[3]); for(const x of add){ r.html+=await RB(ctx,x[0],x[1],"n","dr",true); r.sec+=90; } }
            if(hyb&&AB>=1&&hyb.r.some(x=>x[3])) r.html+=abr("the hybrid's added Old Testament reading");
            if(P.ember&&AB>=1) r.html+=abr(`${P.ember.filter(e=>/Lectio/.test(e[0])).length} extra Ember-day lessons`);
            if(P.ember&&AB<1){ P.ember.forEach(([nm,la2,en2])=>{ ROLE=/Oratio/.test(nm)?"cel":"lec"; r.html+=`<h4 class="sub2">${/Lectio/.test(nm)?"Lesson":/Graduale/.test(nm)?"Gradual":"Collect"}</h4>`+block(la2,en2,PRAY,lang); ROLE="cel"; r.sec+=words(en2||la2)/2.3; }); }
            if(hybWeekday){ for(const x of hyb.r.filter(x=>/First|Psalm/.test(x[0]))){ if(AB>=3||(AB>=2&&/Psalm/.test(x[0]))){ r.html+=abr(/Psalm/.test(x[0])?"the Psalm":"the First Reading"); continue; } const rb=await RB(ctx,x[0],x[1],"n","dr",false); r.html+=rb; r.sec+=readSecs(rb,100); } }
            else if(AB>=3) r.html+=abr("the Epistle (only the Gospel is read)");
            else { const p=propBlock("Lectio"); r.html+=p.html; r.sec+=p.sec; }
          }
          else if(ph==="graduale"){
            let gk = paschal&&part("GradualeP")?"GradualeP": (tday.feria&&s==="advent"&&part("GradualeF")?"GradualeF":"Graduale");
            if(AB>=2){ r={html:abr(`the ${part("Tractus")&&!paschal?"Gradual and Tract":"Gradual and Alleluia"}${part("Sequentia")?", Sequence":""}`),sec:0}; }
            else { r=propBlock(gk,"Gradual",gk);
            if(part("Sequentia")&&AB<1){ const q2=propBlock("Sequentia","Sequence","Sequentia"); r.html+=`<h4 class="sub2">Sequence</h4>`+q2.html; r.sec+=q2.sec; }
            else if(part("Sequentia")) r.html+=abr("the Sequence"); }
          }
          else if(ph==="evangelium"){
            if(hybWeekday){ const g=hyb.r.find(x=>x[0]==="Gospel"); if(g){ r.html=await RB(ctx,"Gospel",g[1],"n","dr",false); r.sec=readSecs(r.html,150); } }
            else { r=propBlock("Evangelium"); const ev=part("Evangelium");
              if(AB>=2&&ev&&words(ev[1]||ev[0])>700){ r={html:`<details class="fold"><summary>Show the full Gospel (the Passion)</summary>${r.html}</details>`+abr("the Passion: read only its final section, from the death of our Lord"),sec:AB>=3?150:240}; } }
            if(opts.homily>0 && !/Ultima/.test(curTitle)) { r.html+=`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; r.sec+=opts.homily*60; }
          }
          else if(ph==="offertorium"){ r=propBlock("Offertorium","Offertory","Offertorium"); const h=hymnSlot(H,iso,"offertory",s,opts,"Offertory hymn"); r.html+=h.html; r.sec+=h.sec; }
          else if(ph==="secreta"){ r=propBlock("Secreta"); }
          else if(ph==="prefatio"&&AB>=3){ r.html=abr("the Preface (the dialogue leads straight to the Sanctus)"); }
          else if(ph==="prefatio"){ const pk=P.pref||(sun?"Trinitate":paschal?"Pasch":s==="lent"?"Quad":s==="christmas"?"Nat":s==="epiphany"?"Epi":"Communis"); const pl=(O.Latin.pref[pk]||O.Latin.pref.Communis||"").split("\n"), pe=(O.English.pref[pk]||O.English.pref.Communis||"").split("\n"); r.html=`<p class="cite">Preface: ${esc(pk)}</p>`+block(pl,pe,PRAY,lang); r.sec=words(pe)/2.4; }
          else if(ph==="Communio_Populi"){ const cl=(O.Latin.communio||"").split("\n").filter(x=>!/^\[/.test(x)), ce=(O.English.communio||"").split("\n").filter(x=>!/^\[/.test(x)); r.html=block(cl,ce,PRAY,lang)+`<div class="homily" data-r="all"><span class="lbl">Communion of the faithful</span> ≈ ${opts.communion} min</div>`; r.sec=opts.communion*60; }
          else if(ph==="communio"){ r=propBlock("Communio","Communion","Communio"); const h=hymnSlot(H,iso,"communion",s,opts,"Communion hymn"); r.html+=h.html; r.sec+=h.sec; }
          else if(ph==="postcommunio"){ r=propBlock("Postcommunio"); }
          else if(ph==="itemissaest"){
            const il=(O.Latin.prayers.IteMissa||"").split("\n"), ie=(O.English.prayers.IteMissa||"").split("\n");
            const ben=(form==="pre55"&&!gloria);
            const pick=/Pasc0-/.test(tday.path)?[2,3]:defunct?[6,7]:ben?[4,5]:[0,1];
            r.html=block(pick.map(i=>il[i]),pick.map(i=>ie[i]),PRAY,lang);
            if(sung){ const ids=(C.kyriale[mass]||{}).ids||{}; const id=ben?ids.Benedicamus:(ids.Ite||ids.Benedicamus); if(id&&C.chants[id]) r.html+=chantFig(ben?"Benedicamus Domino":"Ite, missa est",id); }
            r.sec=20;
          }
          else if(ph==="Ultimaev"){ const ul=(O.Latin.prayers["Ultima Evangelium"]||"").split("\n"), ue=(O.English.prayers["Ultima Evangelium"]||"").split("\n"); r.html=block(ul,ue,PRAY,lang); r.sec=words(ue)/2.4; }
          else if(ph==="communicantes"||ph==="hancigitur"){ }
          curHTML+=r.html; curSec+=r.sec;
        }
      }
    }
    if(head==="Canon") curSec+= AB>=3 ? canonW/2.6+40 : AB>=2 ? canonW/2.2+90 : (sung?8*60:7*60);
  }
  flush();
  // after Mass
  let after=""; let asec=0;
  const rec=hymnSlot(H,iso,"recessional",s,opts,"Recessional hymn"); after+=rec.html; asec+=rec.sec;
  if(opts.marian){ const ma=marian(iso,C); if(ma){ after+=CW(ma.name,ma.gabc,"Seasonal Marian antiphon · GregoBase (CC0)"); asec+=M().chantSeconds(ma.gabc); } }
  if(after) out.push(sec("After Mass",asec/60,tradPos("_after","",sung)+after));
  return out;
}

/* ---------------------------------------------------------------- Ordinary-only rites: Dominican, Ambrosian, Mozarabic
   The Ordinary comes from Divinum Officium's Ordo files (data/ordo-rites.json, built by tools/do_ordo.py).
   Latin and English are re-sectioned at matching anchor lines so the two columns stay together. */
const ORDO_ONLY={
  d:{key:"op",lat:true,name:"Dominican",lect:"rom62",parts:[
    ["Preparation of the chalice",null,null],
    ["Prayers at the foot of the altar",/^!The priest says in a low voice/,/^!The priest says in a low voice/],
    ["Kyrie",/^P\.\s*Kyrie eleison/,/^!After making the sign of the cross on the altar/],
    ["Gloria and Collect",/^Gloria in excelsis Deo/,/^!Then follows the Gloria/],
    ["Epistle, Responsory and Gospel",/^!At the end of the Collect/,/^!At the end of the Collect/],
    ["Creed",/^!After the Gospel the priest/,/^!After the Gospel the priest/],
    ["Offertory, Lavabo, Orate fratres",/^P\.\s*Dominus vobiscum\.\s*S\./,/^P\.\s+The Lord be with you\.\s*$/],
    ["Preface and Sanctus",/^!After the Secret prayers/,/^!After the Secret prayers/],
    ["Canon",/^!The Canon of the Mass/,/^!The Canon of the Mass/],
    ["Lord's Prayer, Agnus Dei and Communion",/^OREMUS/,/^!Oremus/],
    ["Postcommunion and Dismissal",/^!When the priest has purified/,/^!When the priest has purified/],
    ["Last Gospel",/^!Turning towards the Gospel side/,/^!Turning towards the Gospel side/],
    ["Prayers after Low Mass",/^!To be said kneeling/,/^!To be said kneeling/]]},
  a:{key:"a",lat:true,appt:true,name:"Ambrosian",byHead:{_start:"Preparation and prayers at the altar steps",Ingressa:"Ingressa",Gloria:"Gloria and Prayer over the People","Lectio (Prokeimenon).":"Prophecy, Psalmellus and Epistle",Evangelium:"Gospel","Antiphona post Evangelium":"Antiphon after the Gospel and Offertory",Credo:"Creed",Prefatio:"Preface and Sanctus","Incipit Canon.":"Canon, Lord's Prayer and Communion",Transitorium:"Transitorium",Postcommunio:"Postcommunion and Dismissal"}},
  z:{key:"mz",lat:false,name:"Mozarabic",byHead:{_start:"Preparation and prayers at the altar steps",Gloria:"Gloria",COLLECT:"Collect",Lesson:"Lessons and Epistle","The GOSPEL":"Gospel, Lauda and Offertory",Lavabo:"Lavabo and the first prayer (Missa)","II. PRAYER":"Second prayer: the Diptychs","III. PRAYER":"Third prayer: Post Nomina","IV. PRAYER":"Fourth prayer: Ad Pacem; the Inlatio and Sanctus","V. PRAYER":"Fifth prayer: Post Sanctus and the Institution","VI. PRAYER":"Sixth prayer: Post Pridie; the Creed","AD CONFRACTIONEM, varying.":"The Fraction","VII. PRAYER":"Seventh prayer: the Lord's Prayer and Communion","The COMMUNION, which varies.":"Communion and Dismissal"}},
};
const ordoClean=l=>{ let x=String(l).replace(/\t/g," ").replace(/^!x!!?/,"!").replace(/^!x!/,""); if(/^!\[:.*:\]$/.test(x.trim())||/^!\*/.test(x.trim())) return ""; if(/^\[.*\]$/.test(x.trim())) x="!"+x.trim().slice(1,-1); if(/^!\[/.test(x)) x="!"+x.slice(2).replace(/\]$/,""); if(x.trim()==="...") x="!(The proper text of the day.)"; if(x.trim()==="[INSERT PREFACE HERE]") x="!(The Preface of the day.)"; return x; };
function ordoLines(secs){ const out=[]; secs.forEach(s=>s.items.forEach(it=>it.split("\n").forEach(l=>{ const c=ordoClean(l); if(c&&c.trim()) out.push(c); }))); return out; }
function ordoSplit(lines,res){ const cut=[0]; let at=0; for(let i=1;i<res.length;i++){ const re=res[i]; let k=-1; if(re) for(let j=at+1;j<lines.length;j++){ if(re.test(lines[j].trim())){ k=j; break; } } cut.push(k<0?null:k); if(k>=0) at=k; }
  return cut.map((c,i)=>{ if(c==null) return []; let e=lines.length; for(let j=i+1;j<cut.length;j++){ if(cut[j]!=null){ e=cut[j]; break; } } return lines.slice(c,e); }); }
const INST_RE=/HOC EST ENIM|HIC EST ENIM|THIS IS MY BODY|THIS IS THE CHALICE|FOR THIS IS MY BODY|FOR THIS IS THE CHALICE|^HOC EST CORPUS|^HIC EST CALIX/;
async function buildOrdoOnly(ctx,opts){
  const R=await J("data/ordo-rites.json"), cfg=ORDO_ONLY[ctx.rite], D=R[cfg.key];
  const lang=cfg.lat?(opts.lang||"both"):"en", P={la:{},en:{}};
  let parts;
  if(cfg.parts){ const L=ordoLines(D.Latin), E=ordoLines(D.English), sl=ordoSplit(L,cfg.parts.map(x=>x[1])), se=ordoSplit(E,cfg.parts.map(x=>x[2])); parts=cfg.parts.map((x,i)=>({t:x[0],la:sl[i],en:se[i]})); }
  else { const src=cfg.lat?D.Latin:D.English; parts=src.map(s=>({t:cfg.byHead[s.h]||s.h,la:cfg.lat?ordoLines([s]):[],en:cfg.lat?ordoLines(D.English.filter(e=>e.h===s.h)):ordoLines([s])})).filter(p=>(p.la.length||p.en.length)); }
  if(cfg.key==="op"&&!opts.leonine) parts=parts.filter(p=>p.t!=="Prayers after Low Mass");
  if(opts.lastGospel===false) parts=parts.filter(p=>p.t!=="Last Gospel");
  const out=[];
  /* the day's lessons, from the lectionary of the rite (or the nearest one, labelled), at the part that reads them */
  const LL=window.LectCalendar.custom({...ctx,type:"mass"})||(cfg.appt?await window.LectCalendar.appointments({...ctx,type:"mass"}):cfg.lect&&LECT[cfg.lect]?await LECT[cfg.lect](ctx,opts):null), LI=LL?await lectItems(ctx,LL):[]; let lectHeaded=false;
  for(const p of parts){
    let la=p.la, en=p.en, html="";
    { const pick=LI.filter(x=>!x.used&&(x.slot?x.slot.test(p.t):/Epistle|Lesson|Prophecy|Gospel/.test(p.t)));
      if(pick.length){ html+=(lectHeaded?"":lectHead(LL)); lectHeaded=true; pick.forEach(x=>{ x.used=true; html+=x.html; }); p.lectSecs=pick.reduce((a,x)=>a+x.secs,0); } }
    if(opts.veil){ const hide=a=>{ let hit=false; const r=a.filter(l=>{ if(INST_RE.test(l)){ hit=true; return false; } return true; }); return [r,hit]; }; const [la2,h1]=hide(la), [en2,h2]=hide(en); la=la2; en=en2; if(h1||h2) p.veiled=true; }
    if(!cfg.lat||!la.length) html+=`<div class="txt one">${(en.length?en:la).map(l=>lineHTML(l,P,"en")).join("")}</div>`;
    else html+=block(la,en,P,lang);
    if(p.veiled) html+=veilCue();
    const spoken=x=>x.filter(l=>!l.trim().startsWith("!"));
    let secs=words(spoken(la.length?la:en))/2.4+(p.veiled?30:0)+(p.lectSecs||0);   /* the Latin has no seasonal variants, so it times the Mass better */
    if(!out.comm&&/Communion/.test(p.t)&&!/Postcommunion/.test(p.t)){ out.comm=1; html+=`<div class="homily" data-r="all"><span class="lbl">Communion of the faithful</span> ≈ ${opts.communion} min</div>`; secs+=opts.communion*60; }
    if(!out.hom&&/Gospel/.test(p.t)&&!/Last|after the Gospel/.test(p.t)&&opts.homily>0){ out.hom=1; html+=`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; secs+=opts.homily*60; }
    out.push(sec(p.t,secs/60,html));
  }
  return out;
}

/* ---------------------------------------------------------------- Prayer Book Holy Communion (1928, USA)
   data/bcp1928.json (tools/bcp1928.py): the Order with its rubrics, and the collects, epistles and gospels. */
function pbItem(it){
  const [k,t,r,lab]=it;
  if(VEILING&&k==="v"&&CONS_RE.test(t)) return veilCue();
  if(k==="rub") return `<p class="rub">${esc(t)}</p>`;
  if(k==="cite") return `<p class="cite">${esc(t)}</p>`;
  if(k==="h") return `<h4 class="sub2">${esc(t)}</h4>`;
  return `<p data-r="${r||"all"}">${lab?`<span class="sp">${lab}</span> `:""}${inl(t)}</p>`;
}
function scotPreface(s,iso){
  const d=toDate(iso), E=easterY(d.getUTCFullYear()), off=Math.round((d-E)/DAY), md=iso.slice(5);
  if(md>="12-25"||md<="01-05") return "upon christmas day"; if(md>="01-06"&&md<="01-13") return "upon the epiphany";
  if(off===-3) return "upon maundy thursday"; if(off>=-46&&off<=-15) return "from ash wednesday"; if(off>=-14&&off<=-4) return "from passion sunday";
  if(off>=0&&off<39) return "upon easter day"; if(off>=39&&off<49) return "upon ascension day"; if(off>=49&&off<56) return "upon pentecost"; if(off===56) return "trinity";
  if(md==="02-02") return "purification"; if(md==="03-25") return "annunciation"; if(md==="08-06") return "transfiguration";
  if(["11-01","06-24","06-09","01-13","03-17","09-16","11-16"].includes(md)) return "all saints";
  if(["11-30","12-21","01-25","02-24","04-25","05-01","06-11","06-29","07-25","08-24","09-21","10-18","10-28"].includes(md)) return "apostles";
  if(s==="advent") return "advent"; return "";
}
const PB_PREFACE=(s,iso)=>{ const E=easterY(toDate(iso).getUTCFullYear()), off=Math.round((toDate(iso)-E)/DAY);
  if(s==="christmas") return "Christmas"; if(s==="epiphany") return "Epiphany"; if(off>=0&&off<39) return "Easter"; if(off>=39&&off<49) return "Ascension"; if(off>=49&&off<56) return "Whitsuntide"; if(off===56) return "Trinity Sunday"; return ""; };
/* Holy Week has no o.bcp in the day table: name its days by their distance from Easter, as the 1662 book heads them. */
const PB_HOLYWEEK={"-6":"MONDAY BEFORE EASTER","-5":"TUESDAY BEFORE EASTER","-4":"WEDNESDAY BEFORE EASTER","-3":"THURSDAY BEFORE EASTER","-2":"GOOD FRIDAY","-1":"EASTER EVEN"};
function pbPropers(B,iso,day,days){
  const off=fromEaster(iso);
  const k=PB_HOLYWEEK[off]&&B.propers[PB_HOLYWEEK[off]]?PB_HOLYWEEK[off]:(day.o&&day.o.bcp);
  const pr=k&&B.propers[k]?B.propers[k]:null;
  /* A book that keeps only the Sundays and chief feasts (Wesley's Sunday Service): any other day takes the Sunday's. */
  if(!pr&&B.fallback==="sunday"&&toDate(iso).getUTCDay()){ const si=new Date(toDate(iso)-toDate(iso).getUTCDay()*DAY).toISOString().slice(0,10); return pbPropers(B,si,(days&&days[si])||{}); }
  return pr;
}
/* The two English-language Prayer Book orders share one builder. Each book differs in where the collect, the
   epistle and the gospel go into its Order, which steps a shortened session leaves out, and which are not said at
   the celebration itself (the 1662 exhortations giving warning of a Communion). */
const PB_BOOKS={
  bcp28:{file:"data/bcp1928.json", decalogue:"The Decalogue", decalogueAbr:"the Decalogue (the Summary of the Law and the Kyrie are said instead)",
    collectAt:/Collect of the Day/, epistleAt:null, gospelAt:/Glory be to thee, O Lord/, notSaid:[], prefaceHead:p=>p},
  bcp62:{file:"data/bcp1662.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments",
    collectAt:/^Then shall be said the Collect of the Day/, epistleAt:/^The Epistle \(or,/, gospelAt:/^The holy Gospel is written/,
    notSaid:["Exhortations","Collects and rubrics"], prefaceHead:p=>({Whitsuntide:"Whitsunday","Trinity Sunday":"Trinity"})[p]||p},
  /* The earlier books (data/bcp<year>.json, tools/bcp_early.py) carry the service without a day-by-day table of collects,
     epistles and gospels, so those three are cued from the book. */
  bcp49:{file:"data/bcp1549.json", decalogue:"", decalogueAbr:"", introitStep:"Introit and Kyrie",
    collectAt:/^Then shall folowe the Collect of the daie/, epistleAt:/^The Epistle of sainct Paule/, gospelAt:/^Glory be to thee, O Lorde/,
    notSaid:["Collects and rubrics","Exhortations"], prefaceHead:p=>({Christmas:"Christmas","Easter":"Easter",Ascension:"Assencion",Whitsuntide:"Whitsonday","Trinity Sunday":"Trinitie"})[p]||p},
  bcp52:{file:"data/bcp1552.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments",
    collectAt:/^Then shall folowe the Collecte of the daye/, epistleAt:/^The Epistle written/, gospelAt:/^The Gospell wrytten/,
    notSaid:["Exhortations of warning","Collects and rubrics"], prefaceHead:p=>({Christmas:"Christmas",Easter:"Easter",Ascension:"Ascencion",Whitsuntide:"Whitsonday","Trinity Sunday":"Trinitie"})[p]||p},
  bcp59:{file:"data/bcp1559.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments",
    collectAt:/^Then shall folowe the Collect of the day/, epistleAt:/^The Epystle written/, gospelAt:/^The Gospell wrytten/,
    notSaid:["Exhortations of warning","Collects and rubrics"], prefaceHead:p=>({Christmas:"Christmas",Easter:"Easter",Ascension:"Ascencion",Whitsuntide:"Wytsonday","Trinity Sunday":"Trinitie"})[p]||p},
  bcp37:{file:"data/bcp-hc.json", part:"bcp1637", propersFrom:"data/bcp1662.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments", collectBeforeEpistle:true,
    collectAt:null, epistleAt:/^Immediately after the Collects/, gospelAt:/^And the Epistle ended, the Gospel/,
    notSaid:["Exhortations of warning","Collects and rubrics"], prefaceHead:p=>({Christmas:"Christmas",Easter:"Easter",Ascension:"Ascension",Whitsuntide:"Whitsunday","Trinity Sunday":"Trinity"})[p]||p},
  bcp89:{file:"data/bcp-hc.json", part:"bcp1789", propersFrom:"data/bcp1662.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments (the Summary of the Law is said instead)",
    collectAt:/^Then shall be said the Collect of the day/, epistleAt:/^The Epistle \[/, gospelAt:/^Glory be to thee, O Lord/,
    notSaid:["Collects and rubrics"], prefaceHead:p=>({Whitsuntide:"Whitsun","Trinity Sunday":"Trinity"})[p]||p},
  wes84:{file:"data/bcp1784.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments", prefaceDayOnly:true,
    collectAt:/^Then shall be said the Collect of the day/, epistleAt:/^The Epistle \[or/, gospelAt:/^The holy Gospel is written/,
    notSaid:[], prefaceHead:p=>({Whitsuntide:"Whitsunday","Trinity Sunday":"Trinity"})[p]||p},
  /* The Scottish Liturgy (1929): its own seasons of Proper Prefaces (Advent, Lent, Passiontide, Maundy Thursday and
     the Scottish saints' days), picked by date; the 1662 propers stand in for the Scottish Book's own. */
  bcp29:{file:"data/bcp1929.json", showNotes:true, decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments (the Summary of the Law or the Kyrie is said instead)",
    collectAt:/^Let us pray\.$/, epistleAt:/^Then the Presbyter, or some other Presbyter or Deacon, turning to the people, shall read the Epistle/, gospelAt:/^Glory be to thee, O Lord/,
    notSaid:["General Rubrics","The Order for a Second Consecration","Post-Communions","Collects","Exhortations"], prefaceHead:p=>p, prefaceFn:scotPreface},
  bcp18:{file:"data/bcp-hc.json", part:"bcp1918", propersFrom:"data/bcp1662.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments (the Summary of the Law is said instead)",
    collectAt:null, epistleAt:/^Then shall be said the Collect of the day/, gospelAt:/^Then, the people all standing up/, collectBeforeEpistle:true,
    notSaid:["Rubrics before the Communion","Collects and rubrics","Exhortations of warning"], prefaceHead:p=>({Whitsuntide:"Whitsun","Trinity Sunday":"Trinity"})[p]||p},
  bcp92:{file:"data/bcp-hc.json", part:"bcp1892", propersFrom:"data/bcp1662.json", decalogue:"The Ten Commandments", decalogueAbr:"the Ten Commandments (the Summary of the Law is said instead)",
    collectAt:/^Then shall be said the Collect of the Day/, epistleAt:/^The Epistle \[/, gospelAt:/^Glory be to thee, O Lord/,
    notSaid:["Collects and rubrics","Exhortations of warning"], prefaceHead:p=>({Whitsuntide:"Whitsun","Trinity Sunday":"Trinity"})[p]||p}
};
const isPB=r=>!!PB_BOOKS[r];
async function buildPB(ctx,opts,book){
  const C=PB_BOOKS[book||"bcp28"], B=C.part?(await J(C.file))[C.part]:await J(C.file), iso=ctx.iso, day=ctx.day||{};
  /* a book whose own table of collects, epistles and gospels is not on the site takes the 1662 table, which it follows */
  const PBk=C.propersFrom&&!Object.keys(B.propers||{}).length?await J(C.propersFrom):B;
  let pr=pbPropers(PBk,iso,day,B.fallback?await window.LectDays.load(iso):null);
  if(!pr&&PBk!==B){ const days=await window.LectDays.load(iso), si=lectSun(iso); pr=pbPropers(PBk,si,days[si]||{}); }
  const set=pr?pr.sets[0]:null, same=pr&&pr.same?PBk.propers[pr.same]:null;
  const collect=set&&set.collect.length?set.collect:(same?same.sets[0].collect:[]);
  const AB=opts.abridge||0, out=[];
  /* r.head: the book's own heading ("The Lesson", for a reading from the Old Testament, the Acts or the Revelation in the
     Epistle's place); r.alt: the reading the book gives as "Or this". */
  const reading=(lab,r,role)=>r?`<section class="reading"><header><span class="rl">${esc(r.head?r.head.replace(/^The /,""):lab)}</span><span class="rc">${esc(r.cite)}</span></header><div class="rtext">${r.text.map(t=>`<p data-r="${role}">${esc(t)}</p>`).join("")}</div></section>`+
    (r.alt?`<details class="fold"><summary>Or this ${esc((r.alt.head||lab).replace(/^The /,""))}: ${esc(r.alt.cite)}</summary><div class="rtext">${r.alt.text.map(t=>`<p data-r="${role}">${esc(t)}</p>`).join("")}</div></details>`:""):cue(`The ${lab} of the day, from the Prayer Book.`);
  /* the book's optional collects and anthems for the day (an Additional Collect for Christmastide) and its rubrics */
  const extras=set&&set.extra?set.extra.filter(e=>!/^At Morning Prayer/.test(e.head)).map(e=>`<details class="fold"><summary>${esc(e.head)}</summary>${e.text.map(t=>`<p data-r="cel">${esc(t)}</p>`).join("")}</details>`).join(""):"";
  const dayNotes=C.showNotes&&pr&&pr.notes?pr.notes.map(n=>`<p class="note">${esc(n)}</p>`).join(""):"";
  const spoken=its=>its.filter(i=>i[0]==="v").map(i=>i[1]).join(" ").split(/\s+/).filter(Boolean).length;
  /* Wesley prints the proper prefaces for the feast itself only, not its octave. */
  const d0=toDate(iso), off0=fromEaster(d0);
  const pref=C.prefaceFn?C.prefaceFn(season(iso,day),iso):C.prefaceDayOnly?((d0.getUTCMonth()===11&&d0.getUTCDate()===25)?"Christmas":({0:"Easter",39:"Ascension",49:"Whitsuntide",56:"Trinity Sunday"})[off0]||""):PB_PREFACE(season(iso,day),iso), prefH=C.prefaceHead(pref).toLowerCase();
  const at=(its,re)=>re?its.findIndex(x=>re.test(x[1])):-1;
  for(const st of B.hc){
    let html="", secs=spoken(st.items)/2.4;
    if(st.t===C.decalogue&&AB>=1){ out.push(sec(st.t,0,abr(C.decalogueAbr))); continue; }
    if(C.notSaid.includes(st.t)){ out.push(sec(st.t,0,`<details class="fold"><summary>Not said at the celebration itself: shown for reference</summary><div class="txt one">${st.items.map(pbItem).join("")}</div></details>`)); continue; }
    if(st.t==="Proper Prefaces"){
      const its=st.items, i0=pref?its.findIndex(x=>x[0]==="h"&&x[1].replace(/[.,]$/,"").toLowerCase().includes(prefH)):-1;
      let today="";
      if(i0>=0){ let j=i0+1; const pick=[]; while(j<its.length&&its[j][0]!=="h"){ pick.push(its[j]); j++; } today=`<p class="cite">Proper Preface: ${esc(its[i0][1].replace(/[.,]$/,""))}</p>`+pick.map(pbItem).join(""); secs=spoken(pick)/2.4; }
      else { secs=0; today=`<p class="note">No proper preface today: the Sanctus follows the common preface directly.</p>`; }
      html=today+`<details class="fold"><summary>All the proper prefaces</summary>${its.map(pbItem).join("")}</details>`;
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    html=st.items.map(pbItem).join("");
    if(C.introitStep&&st.t===C.introitStep&&set&&set.introit&&st.items.length){
      html=pbItem(st.items[0])+`<h4 class="sub2">The Introit of the Day</h4><p class="cite">${esc(set.introit.head)}</p>`+set.introit.text.map(t=>`<p data-r="all">${esc(t)}</p>`).join("")+st.items.slice(1).map(pbItem).join("");
    }
    if(st.slot==="collect"){
      const its=st.items, k=C.collectBeforeEpistle?at(its,C.epistleAt)-1:at(its,C.collectAt), ke=Math.max(k,at(its,C.epistleAt));
      const coll=collect.length?`<h4 class="sub2">The Collect of the Day</h4><p class="cite">${esc(pr.t)}${same&&!(set&&set.collect.length)?` (the Collect of ${esc(same.t)})`:""}${PBk!==B?" · from the 1662 table, which this book follows; its own wording differs in places":""}</p>`+collect.map(t=>`<p data-r="cel">${esc(t)}</p>`).join("")+dayNotes+extras:cue("The Collect of the Day, from the Prayer Book.");
      const ep=AB>=3?abr("the Epistle"):reading("Epistle",set&&set.epistle,"lec");
      html=its.slice(0,k+1).map(pbItem).join("")+coll+its.slice(k+1,ke+1).map(pbItem).join("")+ep+its.slice(ke+1).map(pbItem).join("");
      secs+=(collect.length?collect.join(" ").split(/\s+/).length/2.4:20)+(AB>=3?0:(set&&set.epistle?set.epistle.text.join(" ").split(/\s+/).length/2.6:90));
    }
    if(st.slot==="gospel"){
      const g=set&&(set.gospel||(pr.sets.find(x=>x.gospel)||{}).gospel);
      const its=st.items, k=Math.max(0,at(its,C.gospelAt));
      html=its.slice(0,k+1).map(pbItem).join("")+reading("Gospel",g,"cel")+its.slice(k+1).map(pbItem).join("");
      secs+=g?g.text.join(" ").split(/\s+/).length/2.6:120;
      if(pr&&pr.sets.length>1){ const lab=x=>x.label?`at the ${x.label} Communion`:"for another celebration"; html+=`<p class="note">Shown: the set ${esc(lab(pr.sets[0]))}. The Prayer Book also gives a set ${pr.sets.slice(1).map(x=>esc(lab(x))).join(" and ")}.</p>`; }
    }
    if(st.slot==="sermon"&&opts.homily>0){ html+=`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; secs+=opts.homily*60; }
    if(st.slot==="communion"){ html+=`<div class="homily" data-r="all"><span class="lbl">Communion of the people</span> ≈ ${opts.communion} min</div>`; secs+=opts.communion*60; }
    out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`));
  }
  return out;
}
window.LectPB={propers:pbPropers};

/* ---------------------------------------------------------------- The Common Service (Lutheran, Common Service Book 1917-19)
   data/lutheran-csb.json (tools/csb.py). csbDay(iso, D) applies the book's calendar rubrics: the propers of a
   Sunday serve the week; a Greater Festival keeps its propers until the next Sunday; a Lesser Festival takes
   its day, and on a Sunday that is not a Greater Day it takes the Sunday too (the Sunday's collect follows). */
const CSB_ORD=["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth","Eleventh","Twelfth","Thirteenth","Fourteenth","Fifteenth","Sixteenth","Seventeenth","Eighteenth","Nineteenth","Twentieth","Twenty-First","Twenty-Second","Twenty-Third","Twenty-Fourth","Twenty-Fifth","Twenty-Sixth","Twenty-Seventh"];
const CSB_GREATER_FIXED={"12-25":"christmas","01-01":"circumcision","01-06":"epiphany","10-31":"f-10-31"};
function csbSundayKey(s){
  const Y=s.getUTCFullYear(), E=easterY(Y), off=Math.round((s-E)/DAY), A=adv1Y(Y);
  if(s>=A){ const n=Math.round((s-A)/DAY/7)+1; if(n<=4) return "adv"+n; }
  const md=(s.getUTCMonth()+1)*100+s.getUTCDate();
  if(md>=1226&&md<=1231) return "xmas-s1";
  if(md>=1202&&md<1226){ const n=Math.round((s-A)/DAY/7)+1; return "adv"+Math.min(4,n); }
  if(md>=102&&md<=105) return "xmas-s2";
  if(md===101) return "circumcision";
  if(off<-63){ const ep=new Date(Date.UTC(Y,0,6)); const first=new Date(ep.getTime()+(7-ep.getUTCDay())*DAY);
    const n=Math.round((s-first)/DAY/7)+1, N=Math.round((new Date(E.getTime()-70*DAY)-first)/DAY/7)+1;
    if(n<1) return "epiphany";
    return N>1&&n===N?"transfiguration":"epi"+Math.min(n,5); }
  const T={"-63":"septuagesima","-56":"sexagesima","-49":"quinquagesima","-42":"lent1","-35":"lent2","-28":"lent3","-21":"lent4","-14":"lent5","-7":"palm","0":"easter","7":"easter1","14":"easter2","21":"easter3","28":"easter4","35":"easter5","42":"exaudi","49":"pentecost","56":"trinity"}[off];
  if(T) return T;
  const k=Math.round((off-56)/7); if(new Date(s.getTime()+7*DAY)>=A) return "trin27"; return "trin"+Math.min(k,26);
}
const CSB_GREATER_SUNDAYS=/^(adv\d|septuagesima|sexagesima|quinquagesima|lent\d|palm|easter|exaudi|pentecost|trinity|transfiguration)$/;
function csbDay(iso,D){
  const d=toDate(iso), dow=d.getUTCDay(), Y=d.getUTCFullYear(), E=easterY(Y), off=Math.round((d-E)/DAY), md=iso.slice(5);
  const sun=new Date(d.getTime()-dow*DAY), sk=csbSundayKey(sun);
  let key=sk, note="", second=null;
  // a Greater Festival in the week keeps its propers until the next Sunday (Christmas, the Circumcision, the Epiphany, the Reformation, the Ascension, Ash Wednesday)
  for(let i=dow;i>=1;i--){ const x=new Date(d.getTime()-(dow-i)*DAY), m=String(x.getUTCMonth()+1).padStart(2,"0")+"-"+String(x.getUTCDate()).padStart(2,"0"), o=fromEaster(x);
    const g=CSB_GREATER_FIXED[m]||(o===39?"ascension":o===-46?"ash":null); if(g){ key=g; break; } }
  if(CSB_GREATER_FIXED[md]) key=CSB_GREATER_FIXED[md];
  const mov={"-46":"ash","-6":"hw1","-5":"hw2","-4":"hw3","-3":"hw4","-2":"hw5","-1":"hw6","1":"easter-mon","39":"ascension","50":"pentecost-mon"}[off];
  if(mov) key=mov;
  const fest=D["f-"+md];
  if(fest&&mov) note=`${fest.t} falls on a Greater Day this year (${D[mov].t}): the book lets the festival be observed on the first open day after.`;
  if(fest&&!mov&&!CSB_GREATER_FIXED[md]){
    if(dow===0&&CSB_GREATER_SUNDAYS.test(sk)) note=`${fest.t} falls on a Greater Day this year: the book keeps the Sunday and lets the festival be observed on the first open day after.`;
    else { if(dow===0) second=sk; key="f-"+md; }
  }
  if(dow===0&&md>="10-24"&&md<="10-30") note=note||"The book allows the Sunday before the Festival of the Reformation (31 October) to be observed as Reformation Sunday, with the Festival's propers.";
  if(dow===0&&md==="11-01"&&new Date(Date.UTC(Y,9,31)).getUTCDay()===6) note="With 31 October on a Saturday this year, the book allows today to be observed as Reformation Sunday.";
  const pref=off>=-46&&off<0?"For Lent":off>=0&&off<39?"For Easter":off>=39&&off<49?"For the Festival of the Ascension":off>=49&&off<56?"For the Festival of Pentecost":off>=56&&off<63?"For the Festival of the Holy Trinity":
    (md>="12-25"||md<="01-05")?"For Christmas":(off<-63&&md>="01-06")||key==="transfiguration"?"For Epiphany":"";
  return {key, day:D[key], second:second&&D[second]?D[second]:null, sunday:D[sk], note, preface:pref, weekday:dow&&key===sk};
}
const CSB_GLORIA="Glory be to the Father, and to the Son, and to the Holy Ghost: as it was in the beginning, is now, and ever shall be, world without end. Amen.";
async function buildCSB(ctx,opts){
  const B=await J("data/lutheran-csb.json"), iso=ctx.iso, C=csbDay(iso,B.days), P=C.day, S=P?P.sets[P.sets.length>1&&opts.csbset==="early"?0:P.sets.length-1]:null;
  const ante=opts.csbcomm==="no", AB=opts.abridge||0, out=[];
  const words=t=>String(t).split(/\s+/).filter(Boolean).length;
  const spoken=its=>its.filter(i=>i[0]==="v").map(i=>i[1]).join(" ").split(/\s+/).filter(Boolean).length;
  const vp=(t,r)=>`<p data-r="${r}">${inl(t==="Glory be to the Father, etc."?CSB_GLORIA:t)}</p>`;
  const from=p=>S&&S.from&&S.from[p]?`<p class="cite">${esc(p[0].toUpperCase()+p.slice(1))} of ${esc(S.from[p])}</p>`:"";
  const lesson=async(lab,L)=>{
    if(!L) return [cue(`The ${lab} for the Day, from the Common Service Book.`),90];
    let body=L.text.length?L.text.map(t=>`<p data-r="lec">${esc(t)}</p>`).join(""):"";
    if(!body&&L.ref&&window.LectApp&&window.LectApp.passage){ try{ const r=await window.LectApp.passage(L.ref,null,"kj"); body=`<div data-r="lec">${r.html}</div><p class="note">The book cites this lesson; the King James text is supplied from the site's Bible.</p>`; }catch(e){} }
    if(!body) body=cue(`Read ${L.cite} from the Bible.`);
    const pas=L.passage?`<p class="note">Or the History of the Passion (Common Service Book, p. 364), which is not yet on this site.</p>`:"";
    return [`<section class="reading"><header><span class="rl">${esc(lab)}</span><span class="rc">${esc(L.cite)}</span></header><div class="rtext">${body}</div>${pas}</section>`, Math.max(60,words(body.replace(/<[^>]+>/g," "))/2.6)];
  };
  for(const st of B.service){
    let its=st.items, html="", secs=spoken(its)/2.4;
    const at=re=>its.findIndex(x=>re.test(x[1]));
    const emit=(a,b)=>its.slice(a,b).map(pbItem).join("");
    if(st.slot==="introit"){
      const k=at(/^The Introit$/)+1, intr=S&&S.introit.length?S.introit:null;
      html=emit(0,k+1);
      if(intr){ html+=`<p class="cite">${esc(P.t)}${S.label?` · ${esc(S.label)}`:""}</p>`+from("introit")+intr[0].map(t=>vp(t,"all")).join("");
        if(intr.length>1) html+=`<details class="fold"><summary>Or this Introit</summary>${intr.slice(1).map(a=>a.map(t=>vp(t,"all")).join("")).join("<hr>")}</details>`;
        secs=intr[0].join(" ").split(/\s+/).length/2.2+20; }
      else { html+=emit(k+1)+cue("No Introit is appointed for this day."); }
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    if(st.slot==="collect"){
      const k=at(/^The Collect$/);
      const col=S&&S.collect.length?S.collect:[];
      let ch=col.length?`<p class="cite">${esc(P.t)}</p>`+from("collect")+vp(col[0],"cel"):cue("The Collect for the Day, from the Common Service Book.");
      if(col.length>1) ch+=`<details class="fold"><summary>${P.t.startsWith("Apostles")||(S.from&&/Apostles/.test(S.from.collect||""))?"The other Collects for Apostles' Days":"Or this Collect"}</summary>${col.slice(1).map(t=>vp(t,"cel")).join("")}</details>`;
      if(C.second&&C.second.sets[0].collect.length) ch+=`<h4 class="sub2">The Collect for the Sunday</h4><p class="cite">${esc(C.second.t)}</p>`+vp(C.second.sets[0].collect[0],"cel");
      if(P&&P.more&&P.more.length) ch+=`<details class="fold"><summary>Other Collects for the season</summary>${P.more.map(t=>vp(t,"cel")).join("")}</details>`;
      html=emit(0,k+1)+ch+emit(k+1);
      secs+=col.length?words(col[0])/2.4:25; if(C.second) secs+=30;
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    if(st.slot==="epistle"){
      const k=at(/^The Epistle$/);
      const [eh,es]=AB>=3?[abr("the Epistle"),0]:await lesson("Epistle",S&&S.epistle);
      let alt=""; if(S&&S.epistle_alt){ const [ah]=await lesson("Or this Epistle",S.epistle_alt); alt=`<details class="fold"><summary>Or this lesson: ${esc(S.epistle_alt.cite)}</summary>${ah}</details>`; }
      html=emit(0,k+1)+eh+alt+emit(k+1); secs+=es;
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    if(st.slot==="gradual"){
      const k=at(/^The Gradual$/), g=S&&S.gradual.length?S.gradual:null;
      html=emit(0,k+1)+(g?`<p class="cite">${esc(P.t)}</p>`+from("gradual")+g.map(t=>vp(t,"all")).join(""):cue("No Gradual is appointed for this day."))+emit(k+1);
      secs=g?g.join(" ").split(/\s+/).length/2.2:0;
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    if(st.slot==="hallelujah"){ out.push(sec(st.t,0,`<details class="fold"><summary>Sung only when the Gradual is omitted</summary><div class="txt one">${emit(0)}</div></details>`)); continue; }
    if(st.slot==="gospel"){
      const k=at(/^Glory be to Thee, O Lord\.$/);
      const [gh,gs]=await lesson("Gospel",S&&S.gospel);
      html=emit(0,k+1)+gh+emit(k+1); secs+=gs;
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue;
    }
    if(st.slot==="sermon"&&opts.homily>0){ html=emit(0)+`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; secs+=opts.homily*60; out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`)); continue; }
    if(st.slot==="ante"){
      if(!ante){ out.push(sec(st.t,0,`<details class="fold"><summary>When there is no Communion: the Lord's Prayer, a Hymn and the Benediction end The Service here</summary><div class="txt one">${emit(0)}</div></details>`)); continue; }
      out.push(sec(st.t,secs/60,`<div class="txt one">${emit(0)}</div>`)); break;
    }
    if(st.slot==="prefaces"){
      const i0=C.preface?its.findIndex(x=>x[0]==="h"&&x[1]===C.preface):-1;
      let today="";
      if(i0>=0){ const pick=[]; let j=i0+1; while(j<its.length&&its[j][0]!=="h"&&its[j][0]!=="rub"){ pick.push(its[j]); j++; } today=`<p class="cite">Proper Preface: ${esc(C.preface.replace(/^For (the Festival of )?/,""))}</p>`+pick.map(pbItem).join(""); secs=spoken(pick)/2.4; }
      else { secs=0; today=`<p class="note">No Proper Preface is appointed today: "Therefore with Angels" follows at once.</p>`; }
      out.push(sec(st.t,secs/60,`<div class="txt one">${today}<details class="fold"><summary>All the Proper Prefaces</summary>${emit(0)}</details></div>`)); continue;
    }
    html=emit(0);
    if(st.slot==="communion"){ html+=`<div class="homily" data-r="all"><span class="lbl">Communion of the people</span> ≈ ${opts.communion} min</div>`; secs+=opts.communion*60; }
    out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`));
  }
  return out;
}
window.LectCSB={day:csbDay};

/* ---------------------------------------------------------------- Orders of service printed in full (Reformed, Methodist, ...)
   data/orders.json (tools/orders.py, from the hand-proofread texts in tools/texts/order-*.txt). ORDER_RITES says
   which orders make up each rite's service; slots (hymn, psalter, lessons, sermon, offering, prayer, communion)
   become timed cues, and alternatives fold away under their summary. */
/* ---------------------------------------------------------------- the day's lessons, from the lectionary each rite belongs to
   LECT[name](ctx, opts) gives {src, note, items:[{lab, cite, text?, num, tr, slot?}]}: the readings of the day in the table
   the rite's own book keeps or, where the book leaves the lessons to the minister, the table its tradition used (the user's
   choice: the historic one-year Epistles and Gospels). lectHTML draws them; orders put them at their @lessons slots. */
const lectSun=iso=>{ const d=toDate(iso); return new Date(d-d.getUTCDay()*DAY).toISOString().slice(0,10); };
const LECT={
  /* the 1662 Prayer Book's Epistle and Gospel of the day (a weekday takes the Sunday's) */
  async hist(ctx){ const B=await J("data/bcp1662.json"), days=await window.LectDays.load(ctx.iso);
    let pr=pbPropers(B,ctx.iso,ctx.day||{}); if(!pr){ const si=lectSun(ctx.iso); pr=pbPropers(B,si,days[si]||{}); }
    if(!pr) return null; const S=pr.sets[0], g=S.gospel||(pr.sets.find(x=>x.gospel)||{}).gospel;
    return {src:`${pr.t} · the Epistle and Gospel of the 1662 Book of Common Prayer`, items:[S.epistle&&{lab:"The Epistle",cite:S.epistle.cite,text:S.epistle.text,slot:/Epistle|Lesson|Scripture|lessons/i},g&&{lab:"The Gospel",cite:g.cite,text:g.text,slot:/Gospel|Lesson|Scripture|lessons/i}].filter(Boolean)}; },
  /* the Common Service Book's own Epistle and Gospel of the day */
  async csb(ctx){ const B=await J("data/lutheran-csb.json"), C=csbDay(ctx.iso,B.days), P=C&&C.day; if(!P) return null;
    const S=P.sets[P.sets.length-1]; return {src:`${P.t} · the Epistle and Gospel of the day in the Common Service Book`, note:"The book leaves the lessons of Matins, Vespers and the Suffrages to the minister; given here are its own Epistle and Gospel of the day.",
      items:[S.epistle&&{lab:"The Epistle",cite:S.epistle.cite,text:S.epistle.text},S.gospel&&{lab:"The Gospel",cite:S.gospel.cite,text:S.gospel.text}].filter(Boolean)}; },
  /* the Roman Missal of 1962, whose Epistles and Gospels the Dominican Missal shares on most days */
  async rom62(ctx){ const m=(ctx.day||{}).m; if(!m||!m.r) return null;
    return {src:`${m.t} · the Epistle and Gospel of the Roman Missal (1962)`, note:"The Dominican Missal reads the Roman Epistles and Gospels on most days; on the Order's own feasts and in a few seasons it appoints its own, so check your Missal.",
      items:m.r.filter(x=>!/Psalm|Gradual/.test(x[0])).map(x=>({lab:x[0],cite:x[1],num:x[2]||"v",tr:"dr",slot:/Gospel/.test(x[0])?/Gospel/:/Epistle|Lesson|Prophecy/}))}; }
};
async function lectItems(ctx,L){ const out=[];
  for(const it of (L&&L.items)||[]){
    let html;
    if(it.issue) html=`<p class="note">${esc(it.lab)} · ${esc(it.cite)}: ${esc(it.issue)}</p>`;
    else if(it.text) html=`<section class="reading"><header><span class="rl">${esc(it.lab)}</span><span class="rc">${esc(it.cite)}</span></header><div class="rtext">${it.text.map(t=>`<p data-r="lec">${esc(t)}</p>`).join("")}</div></section>`;
    else html=await RB(ctx,it.lab,it.cite,it.num||"k",it.tr||"kj");
    let slot=typeof it.slot==="string"?it.slot==="gospel"?/Gospel/i:it.slot==="psalter"?/Psalm|Psalter|Kathisma/i:/Epistle|Lesson|Lection|Apostle|Paul|Prophet/i:it.slot||null;
    if(ctx.rite==="copt"&&it.slot){slot=/^Ps /.test(it.cite)?/Psalm before/:/^(Matt|Mark|Luke|John) /.test(it.cite)?/^The Gospel of the day/:/^Acts /.test(it.cite)?/Acts/:/^(Jas|[123] (Pet|John)|Jude) /.test(it.cite)?/Catholic/:/S\. Paul/;}
    if(ctx.rite==="adai"&&it.slot){slot=/^(Matt|Mark|Luke|John) /.test(it.cite)?/Gospel/:/^(Rom|[12] Cor|Gal|Eph|Phil|Col|[12] Thess|[12] Tim|Titus|Phlm|Heb) /.test(it.cite)?/Paul/:/Lections/;}
    if(ctx.rite==="arm"&&it.slot){slot=/^(Matt|Mark|Luke|John) /.test(it.cite)?/^The Gospel/:/Psalm of the day/;}
    out.push({html,secs:readSecs(html,90),slot,kind:it.slot||"lessons",used:false});
  }
  return out; }
const lectHead=L=>L?`<p class="cite">${esc(L.src)}</p>${L.note?`<p class="note">${esc(L.note)}</p>`:""}`:"";

const ORDER_RITES={
  pres:{lect:"hist", parts:o=>o.supper==="yes"?[["bcw1906-morning",null,"Hymn and Sermon"],["bcw1906-communion"]]:[["bcw1906-morning"]], supper:true},
  me08:{lect:"hist", lectNote:"The 1908 Ritual's Lord's Supper has no lessons of its own and the book sets no table: these are the historic Epistle and Gospel of the day, as the 1662 Prayer Book that Wesley's order comes from appoints them.", parts:o=>[["me1908-supper"]]},
  adai:{parts:o=>[["adai1893"]], optional:["The Approach to the Altar"], optLabel:"The priest's approach to the altar left out"},
  copt:{parts:o=>[["coptic1908"]], optional:["The Preparation of the Altar"], optLabel:"The preparation of the altar left out"},
  arm:{parts:o=>[["armenian1908"]], optional:["The Vesting of the Priest","The Approach to the Altar"], optLabel:"The vesting and the prayers of approach left out"},
  rca:{rcaLessons:true, parts:o=>o.supper==="yes"?[["rca1882-morning",null,"Sermon and Prayer"],["rca1882-supper"],["rca1882-morning","Singing and Benediction"]]:[["rca1882-morning"]], supper:true},
  rcus:{merc:true, parts:o=>o.supper==="yes"?[["rcus1866-communion"]]:[["rcus1866-morning"]], supper:true},
  rcusv:{merc:true, parts:o=>[["rcus1866-evening"]]},
  rcusp:{parts:o=>[["rcus1866-preparation"]]},
  bcp62bap:{parts:o=>[["bcp1662-baptism"]]},
  bcp62mat:{parts:o=>[["bcp1662-matrimony"]]},
  bcp62bur:{parts:o=>[["bcp1662-burial"]]},
  wes84bap:{parts:o=>[["wes1784-baptism"]]},
  wes84mat:{parts:o=>[["wes1784-matrimony"]]},
  wes84bur:{parts:o=>[["wes1784-burial"]]},
  csbbap:{parts:o=>[["csb-baptism"]]},
  csbmat:{parts:o=>[["csb-matrimony"]]},
  csbbur:{parts:o=>[["csb-burial"]]},
  csbm:{lect:"csb", parts:o=>[["csb-matins"]], csbCollect:true},
  csbv:{lect:"csb", parts:o=>[["csb-vespers"]], csbCollect:true}
};
ORDER_RITES.csbl={parts:o=>[["csb-litany"]], csbCollect:true};
ORDER_RITES.csbs={parts:o=>[["csb-suffrages"]], csbCollect:true};
ORDER_RITES.csbsm={lect:"csb", parts:o=>[["csb-suffrages-morning"]], csbCollect:true};
ORDER_RITES.csbse={lect:"csb", parts:o=>[["csb-suffrages-evening"]], csbCollect:true};
ORDER_RITES.byzv={byzFeast:"v", parts:o=>[["byz-vespers"]], optional:["The Litiya","The Blessing of the Loaves"], optLabel:"The Litiya and the blessing of the loaves left out"};
ORDER_RITES.byzm={byzFeast:"m", parts:o=>[["byz-matins"]], optional:["The Opening, when Matins is said apart from the Vigil"], optLabel:"The opening for Matins said apart from the Vigil left out"};
ORDER_RITES.byzc={parts:o=>[["byz-compline"]]};
/* Wesley's Sunday Service (1784): Morning and Evening Prayer for the Lord's Day and the Litany for Wednesdays and Fridays,
   with the book's Collect of the day and its table of proper lessons (data/bcp1784.json). */
ORDER_RITES.wes84o={parts:o=>o.hour==="e"?[["wes1784-evening"]]:o.hour==="l"?[["wes1784-litany"]]:[["wes1784-morning"]], wesley:true,
  optional:["A Prayer and Thanksgiving for the Lord's Day"], optLabel:"The Prayer and General Thanksgiving for the Lord's Day left out",
  sel:{key:"hour",label:"The Service",opts:[["m","Morning Prayer"],["e","Evening Prayer"],["l","The Litany (Wednesdays and Fridays)"]]}};

const BYZH={"1":["The First Hour"],"3":["The Third Hour"],"6":["The Sixth Hour"],"9":["The Ninth Hour","The Interhour"]};
ORDER_RITES.byzh={parts:o=>{ const h=o.hour||"1"; if(h==="t") return [["byz-typical"]]; const s=BYZH[h]; return [["byz-hours",s[0],s[s.length-1]]]; },
  sel:{key:"hour",label:"The Hour",opts:[["1","The First Hour"],["3","The Third Hour"],["6","The Sixth Hour"],["9","The Ninth Hour, with the Interhour"],["t","The Typical Psalms"]]}};const ORDER_SLOT={hymn:["Hymn",3],psalter:["A portion of the Psalter, chanted or read responsively",3],lessons:["The lessons from the Old and New Testaments, chosen by the Minister",6],
  offering:["The Offering",3],prayer:["The General Prayer, in the Minister's own words or from the Treasury of Prayers",5]};
function orderStep(st,opts){
  let html="", words=0, depth=0, extra=0, cons=false;
  for(const it of st.items){
    const [k,t]=it;
    /* Marked words of consecration: shown to priests and seminarians, a notice in lay study; timed either way. */
    if(k==="cons"){ cons=true; if(opts.veil) html+=veilCue(); continue; }
    if(k==="/cons"){ cons=false; continue; }
    if(cons&&opts.veil){ if(k==="v"&&!depth) words+=t.split(/\s+/).length; continue; }
    if(k==="or"){ html+=`<details class="fold"><summary>${esc(t)}</summary>`; depth++; continue; }
    if(k==="/or"){ html+=`</details>`; depth--; continue; }
    if(k==="slot"){
      if(t==="sermon"){ if(opts.homily>0){ html+=`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; extra+=opts.homily*60; } continue; }
      if(t==="communion"){ html+=`<div class="homily" data-r="all"><span class="lbl">Communion of the people</span> ≈ ${opts.communion} min</div>`; extra+=opts.communion*60; continue; }
      if(t==="prayer"&&it[2]==="The Collect for the Day"&&opts._coll){ html+=opts._coll; extra+=30; continue; }
      if(opts._less&&opts._less[t+":"+(it[2]||"")]){ const [h,m]=opts._less[t+":"+(it[2]||"")]; html+=h; extra+=m*60; continue; }
      if((t==="lessons"||t==="gospel"||t==="psalter")&&opts._lect&&opts._lect.items.some(x=>!x.used)){ const lab=it[2]||t, I=opts._lect.items;
        let pick=I.filter(x=>!x.used&&(x.slot?x.slot.test(lab):t==="lessons"));
        if(pick.length){
        if(!opts._lect.headed){ opts._lect.headed=true; html+=lectHead(opts._lect.L); }
        pick.forEach(x=>{ x.used=true; html+=x.html; extra+=x.secs; }); continue; } }
      const [lab0,min0]=ORDER_SLOT[t]||[t==="gospel"?"The appointed Gospel":"The appointed text",3], lab=it[2]||lab0, min=t!=="lessons"?min0:/^The Psalm before/.test(lab)?1:/^The (Gospel|Lesson)/.test(lab)?3:min0; html+=`<div class="homily" data-r="all"><span class="lbl">${esc(lab)}</span> ≈ ${min} min</div>`; extra+=min*60; continue;
    }
    html+=pbItem(it);
    if(k==="v"&&!depth) words+=t.split(/\s+/).length;
  }
  return [html, words/2.4+extra];
}
async function buildOrders(ctx,opts,rite){
  const O=await J("data/orders.json"), R=ORDER_RITES[rite], out=[];
  if(R.csbCollect){   /* the Common Service Book's collect of the day (the Sunday's too, when a festival takes the day) */
    const B=await J("data/lutheran-csb.json"), C=csbDay(ctx.iso,B.days), P=C.day, S=P?P.sets[P.sets.length-1]:null;
    const col=S&&S.collect.length?S.collect:[], p=t=>`<p data-r="cel">${esc(t)}</p>`;
    let h=col.length?`<p class="cite">${esc(P.t)}</p>`+p(col[0])+(col.length>1?`<details class="fold"><summary>Or this Collect</summary>${col.slice(1).map(p).join("")}</details>`:""):cue("The Collect for the Day, from the Common Service Book.");
    if(C.second&&C.second.sets[0].collect.length) h+=`<h4 class="sub2">The Collect for the Sunday</h4><p class="cite">${esc(C.second.t)}</p>`+p(C.second.sets[0].collect[0]);
    opts={...opts,_coll:h};
  }
  if(R.rcaLessons){   /* the 1882 Liturgy's Order of Scripture Lessons: Christmas, Easter and Pentecost seasons */
    const T=await J("data/rca1882-lessons.json"), L=window.LectCalendar.rcaLessonDay(T,ctx.iso), less={};
    if(L){
      const [ot,nt]=L.m;
      less["lessons:"]=[`<p class="cite">${esc(L.t)} · the Order of Scripture Lessons (1882)</p>`+await RB(ctx,"The Lesson from the Old Testament",ot,"k","kj")+await RB(ctx,"The Lesson from the New Testament",nt,"k","kj")+`<p class="note">For the evening service the table appoints ${esc(L.e[0])} and ${esc(L.e[1])}.</p>`,9];
    }
    opts={...opts,_less:less};
  }
  if(R.byzFeast){   /* Hapgood's hymns of the Sunday tone and of the Great Feasts; Great Vespers is the vigil of the next day */
    const D=await J("data/byz-liturgy.json"), V=R.byzFeast==="v", less={};
    const day=V?new Date(toDate(ctx.iso).getTime()+DAY).toISOString().slice(0,10):ctx.iso;
    const FX=byzFeasts(day,D).filter(f=>!V||f.lic), sun=toDate(day).getUTCDay()===0, tone=sun?byzToneOf(day):0, T=tone&&D.tones?D.tones[tone]:null;
    const hy=(lab,t)=>`<p class="rub">${esc(lab)}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(t)}</p>`;
    const src=FX.length?cue(`The hymns of ${FX.map(f=>f.t).join(" and ")} are from the Special Services of Hapgood's Service Book.`):"";
    const resTrop=T&&!FX.some(f=>f.t==="Holy Pascha")?hy(`Troparion of the Resurrection, Tone ${tone}`,T.troparion):"";
    const fTrop=FX.map(f=>hy(`Troparion of ${f.t}${BYZ_TONE(f.troparion_tone)}`,f.troparion)).join("");
    if(V){
      let st="";
      if(T) st+=`<h4 class="sub2">Stichera of the Resurrection, Tone ${tone}</h4>`+T.lic.map(x=>`<p data-r="ppl">${inl(x)}</p>`).join("");
      for(const f of FX) st+=`<h4 class="sub2">Sticheron of ${esc(f.t)}${BYZ_TONE(f.lic_tone)}</h4><p data-r="ppl">${inl(f.lic)}</p>`;
      if(st) less["hymn:The Stikhiry of the Tone"]=[st+cue("Then the other stichera of the day from the Octoechos and Menaion.")+src,3];
      less["hymn:The Canticles of the Litiya"]=FX.some(f=>f.lity)?[FX.filter(f=>f.lity).map(f=>`<h4 class="sub2">Sticheron at the Litiya${BYZ_TONE(f.lity_tone)}</h4><p data-r="ppl">${inl(f.lity)}</p>`).join(""),1.5]:["",0];
      less["hymn:The Hymn of the Feast"]=FX.length?[cue("On the feast, in place of the hymn above (thrice):")+fTrop,1]:T?[cue("On the eve of the Lord's Day, in place of the hymn above:")+resTrop+hy("Theotokion",T.theotokion),1]:["",0];
    } else {
      if(FX.length||T) less["hymn:The Hymns (Troparia) of the Feast, or of the Saint, or of the Tone, and the Hymn to the Birth-giver of God"]=[resTrop+fTrop+(T&&!FX.length?hy("Theotokion",T.theotokion):cue("Then the Hymn to the Birth-giver of God of the tone."))+src,1.5];
      less["hymn:The Great Exaltation of the Feast"]=FX.some(f=>f.exalt)?[FX.filter(f=>f.exalt).map(f=>hy("The Great Exaltation",f.exalt)).join(""),1]:["",0];
    }
    opts={...opts,_less:{...(opts._less||{}),...less}};
  }
  if(R.merc){   /* the Order of Worship's own Gospel, Epistle and Collect, and its Table of Scripture Lessons for Sundays */
    const T=await J("data/mercersburg.json"), D=window.LectCalendar.mercDay(ctx.iso), P=T.propers[D.k], p=t=>`<p data-r="cel">${esc(t)}</p>`, less={};
    const mine=!!window.LectCalendar.custom({...ctx,type:"mass",hour:opts.hour||ctx.hour});   /* a congregation's own selections replace the book's lessons */
    const head=P?`<p class="cite">${esc(P.t)}${D.weekday&&!D.fest?" · the propers of the Sunday":""}</p>`:"";
    if(P){
      const alt=(c,w)=>c?`<p class="note">Or ${w}: ${esc(c)}.</p>`:"";
      const ge=head+await RB(ctx,"The Gospel",P.g,"k","kj")+alt(P.ga,"this Gospel")+await RB(ctx,"The Epistle",P.e,"k","kj")+alt(P.ea,"this Epistle");
      if(!mine) less["lessons:The Gospel and Epistle for the day"]=[ge,6];
      const coll=head+p(P.c.replace(/\s*Amen\.$/,""))+`<p data-r="ppl"><span class="sp">℟.</span> Amen.</p>`;
      const fest=(P.f||[]).map(t=>p(t.replace(/\s*Amen\.$/,""))+`<p data-r="ppl"><span class="sp">℟.</span> Amen.</p>`).join("");
      const note=T.notes[D.k]?`<p class="note">${esc(T.notes[D.k])}</p>`:"";
      less["prayer:The Collect for the Day"]=[coll+(fest&&rite==="rcus"?`<h4 class="sub2">The Festival Prayer</h4><p class="note">On Festival days it takes the place of the first two Collects of the General Prayer.</p>`+fest:"")+note,1.5];
      less["prayer:The Collect for the Day and the Festival Prayer"]=[coll+(fest?`<h4 class="sub2">The Festival Prayer</h4>`+fest:"")+note,fest?3:1];
    }
    const L=T.lessons[D.k];
    if(mine);
    else if(L) less["lessons:The Evening Lessons, from the Table of Scripture Lessons"]=[`<p class="cite">${esc(P?P.t:"")} · the Table of Scripture Lessons${D.weekday?" (for the Sunday)":""}</p>`+await RB(ctx,"The First Lesson",L.e[0],"k","kj")+await RB(ctx,"The Second Lesson",L.e[1],"k","kj")+`<p class="note">For the morning the table appoints ${esc(L.m[0])} and ${esc(L.m[1])}, which the Minister may add to the Gospel and Epistle.</p>`,8];
    else less["lessons:The Evening Lessons, from the Table of Scripture Lessons"]=[cue("The Table of Scripture Lessons appoints lessons for Sundays only: on a festival or weekday the Minister chooses them."),6];
    opts={...opts,_less:less};
  }
  if(R.wesley){   /* the Sunday Service's Collect of the day, proper lessons and proper psalms */
    const B=await J("data/bcp1784.json"), days=await window.LectDays.load(ctx.iso), day=ctx.day||{}, iso=ctx.iso;
    const pr=pbPropers(B,iso,day,days), p=t=>`<p data-r="cel">${esc(t)}</p>`;
    const col=pr?(pr.sets[0].collect.length?pr.sets[0].collect:[]):[];
    const coll=col.length?`<p class="cite">${esc(pr.t)}</p>`+col.map(p).join("")+`<p data-r="ppl"><span class="sp">℟.</span> Amen.</p>`:cue("The Collect of the Day, from the Sunday Service.");
    const off=fromEaster(iso);
    const key=(PB_HOLYWEEK[off]&&B.lessons[PB_HOLYWEEK[off]])?PB_HOLYWEEK[off]:day.o&&day.o.bcp;
    const L=key&&B.lessons[key]&&(toDate(iso).getUTCDay()===0||/CHRISTMAS DAY|GOOD FRIDAY|ASCENSION DAY/.test(key))?B.lessons[key]:null;
    const H=opts.hour==="e"?"e":"m", less={};
    if(L){
      less["lessons:The First Lesson"]=[await RB(ctx,"The First Lesson",L[H][0],"k","kj"),5];
      less["lessons:The Second Lesson"]=L[H][1]?[await RB(ctx,"The Second Lesson",L[H][1],"k","kj"),4]:[cue(H==="m"?"The Second Lesson: a chapter out of the Four Gospels or the Acts of the Apostles, in regular rotation, as the book's table directs.":"The Second Lesson: a chapter out of the Epistles, in regular rotation, as the book's table directs."),4];
    } else {
      less["lessons:The First Lesson"]=[cue("The book's table appoints proper lessons for the Sundays and for Christmas, Good Friday and Ascension Day only: on other days the Minister chooses a chapter of the Old Testament."),5];
      less["lessons:The Second Lesson"]=[cue("The Second Lesson: a chapter out of the "+(H==="m"?"Four Gospels or the Acts of the Apostles":"Epistles")+", in regular rotation."),4];
    }
    const PS=key&&B.psalms[key]&&B.psalms[key][H];
    if(opts.hour!=="l"){
      const P=(await J("data/bcp1784-psalter.json")).psalter;
      /* The Psalter is read through each month (the 1662 rule: February borrows the last day of January and the first of
         March; the thirty-first day of a month repeats the thirtieth). The Proper Psalms take the place of the day's. */
      const dd=toDate(iso), mo=dd.getUTCMonth()+1, dt=dd.getUTCDate(), Y=dd.getUTCFullYear(), leap=(Y%4===0&&Y%100!==0)||Y%400===0;
      const dayN=mo===1&&dt===31?1:mo===2?dt+1:mo===3&&dt===1?(leap?1:30):dt===31?30:dt;
      const all=Object.values(P).flatMap(x=>[...x.m,...x.e]);
      const list=PS?PS.flatMap(n=>all.filter(x=>x.p===n)):P[String(dayN)][H];
      let h=`<p class="cite">${PS?`The Proper Psalms for ${esc(pr?pr.t:"the day")}`:`The ${dayN}${["th","st","nd","rd"][dayN%10>3||[11,12,13].includes(dayN)?0:dayN%10]} Day: ${H==="m"?"Morning":"Evening"} Prayer`}</p>`, words=0;
      list.forEach((ps,i)=>{
        h+=`<h4 class="sub2">Psalm ${ps.p}${ps.part?` · ${esc(ps.part)}`:""}</h4>`+ps.v.map(([n,t])=>{ words+=t.split(/\s+/).length; return `<p data-r="all"><sup>${n}</sup> ${esc(t)}</p>`; }).join("");
        if(i<list.length-1) h+=`<p data-r="all">Glory be to the Father, and to the Son, and to the Holy Ghost; As it was in the beginning, is now, and ever shall be, world without end. Amen.</p>`;
      });
      less["psalter:The Psalms appointed"]=[h,words/2.4/60];
    }
    opts={...opts,_coll:coll,_less:less};
  }
  { const local=window.LectCalendar.custom({...ctx,type:"mass",hour:opts.hour||ctx.hour});
    const L=local||(/^(copt|adai)$/.test(rite)?await window.LectCalendar.appointments({...ctx,type:"mass"}):/^byz[vm]$/.test(rite)?window.LectCalendar.byzantine(ctx,rite):R.lect&&LECT[R.lect]?await LECT[R.lect](ctx,opts):null);
    if(L)opts={...opts,_lect:{L,items:await lectItems(ctx,L),headed:false}};
  }
  for(const [id,from,upto] of R.parts(opts)){
    const ord=O[id]; let on=!from;
    if(!ord) continue;
    if(R.parts(opts).length>1&&!from) out.push(sec(ord.title,0,`<p class="cite">${esc(ord.book)}</p>`));
    for(const st of ord.steps){
      if(!on&&st.t===from) on=true;
      if(!on) continue;
      if((opts.abridge||0)>=1&&R.optional&&R.optional.includes(st.t)){ out.push(sec(st.t,0,abr(st.t.toLowerCase()))); continue; }
      const [html,secs]=orderStep(st,opts);
      out.push(sec(st.t,secs/60,`<div class="txt one">${html}</div>`));
      if(upto&&st.t===upto) break;
    }
  }
  /* an order with no place for the lessons (a Lord's Supper that follows the preaching service): the day's lessons first */
  if(opts._lect&&opts._lect.items.length&&opts._lect.items.every(x=>!x.used)){ const I=opts._lect.items;
    out.unshift(sec("The Lessons of the Day",I.reduce((a,x)=>a+x.secs,0)/60,`<div class="txt one">${lectHead(opts._lect.L)}<p class="note">${esc(R.lectNote||"The order itself has no lessons: these are the lessons of the day, for the service of the Word that goes before it.")}</p>${I.map(x=>x.html).join("")}</div>`)); }
  if(rite==="copt"&&opts._lect&&!opts._lect.items.length)out.unshift(sec("Calendar readings",0,lectHead(opts._lect.L)));
  return out;
}

/* ---------------------------------------------------------------- 1979 Prayer Book (USA)
   data/bcp1979.json (tools/bcp1979.py). pb79Day(iso, collects) names the day's collect by the 1979 calendar. */
const ORD79=["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth"];
const MON79=["January","February","March","April","May","June","July","August","September","October","November","December"];
const LORD79=/^(The Holy Name|The Presentation|The Transfiguration|All Saints' Day)$/;
function pb79Day(iso, C){
  const d=toDate(iso), Y=d.getUTCFullYear(), dow=d.getUTCDay(), s=new Date(d-dow*DAY);
  const off=x=>Math.round((x-easterY(Y))/DAY), o=off(d), os=off(s);
  const md=`${MON79[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const fixed=Object.keys(C).find(k=>C[k].sub===md);
  let season=null;
  const A1=adv1Y(Y), A1p=adv1Y(Y-1);
  const xmas=dd=>Date.UTC(dd,11,25);
  if(d>=A1&&d<xmas(Y)) season=`${ORD79[Math.floor((s-A1)/DAY/7)]} Sunday of Advent`;
  else if(d.getTime()===xmas(Y)) season="The Nativity of Our Lord: Christmas Day";
  else if(d>xmas(Y)||(d.getUTCMonth()===0&&d.getUTCDate()<6)){
    const cy=d.getUTCMonth()===11?Y:Y-1, sun1=new Date(xmas(cy)+((7-new Date(xmas(cy)).getUTCDay())%7||7)*DAY);
    season= s>=sun1&&s<new Date(sun1.getTime()+7*DAY)?"First Sunday after Christmas Day": s>=new Date(sun1.getTime()+7*DAY)?"Second Sunday after Christmas Day":"The Nativity of Our Lord: Christmas Day";
    if(d.getUTCMonth()===0&&d.getUTCDate()===1) season="The Holy Name";
  }
  else if(o<-46){ const ep=Date.UTC(Y,0,6); if(d<new Date(ep)) season="Second Sunday after Christmas Day";
    else { const sunE=new Date(ep+((7-new Date(ep).getUTCDay())%7||7)*DAY); const n=Math.floor((s-sunE)/DAY/7);
      season= s<sunE?"The Epiphany": os===-49?"Last Sunday after the Epiphany": n===0?"First Sunday after the Epiphany: The Baptism of our Lord":`${ORD79[n]} Sunday after the Epiphany`; } }
  else if(o<-42) season="Ash Wednesday";
  else if(o<-7) season=`${ORD79[Math.floor((os+42)/7)]} Sunday in Lent`;
  else if(o===-7) season="Sunday of the Passion: Palm Sunday";
  else if(o<0) season=["Monday in Holy Week","Tuesday in Holy Week","Wednesday in Holy Week","Maundy Thursday","Good Friday","Holy Saturday"][o+6];
  else if(o===0) season="Easter Day";
  else if(o<7) season=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][o-1]+" in Easter Week";
  else if(o>=39&&o<42) season="Ascension Day";
  else if(o<42) season=`${ORD79[os/7]} Sunday of Easter`;
  else if(o<49) season="Seventh Sunday of Easter: The Sunday after Ascension Day";
  else if(o<56) season="The Day of Pentecost: Whitsunday";
  else if(o===56) season="First Sunday after Pentecost: Trinity Sunday";
  else { const base=Date.UTC(Y,4,11); let n=Math.round((s-base)/DAY/7)+1; if(os===56) n=Math.round((s-base)/DAY/7)+1; n=Math.max(1,Math.min(29,n)); season=`Proper ${n}`; }
  if(o===56&&dow===0) season="First Sunday after Pentecost: Trinity Sunday";
  let title=season;
  const protectedDay=(o>=-7&&o<=7)||season==="Ash Wednesday"&&o===-46||/Christmas Day|The Epiphany$|Easter Day|Ascension Day|Pentecost|Trinity Sunday/.test(season)&&(dow===0||o>=39&&o<=39);
  if(fixed&&!protectedDay&&(dow!==0||LORD79.test(fixed))) title=fixed;
  return {title, season, fixed};
}
const PB79_PREF={"Advent":"Advent","the Incarnation":"Incarnation","the Epiphany":"Epiphany","Lent":"Lent","Holy Week":"Holy Week","Easter":"Easter","the Ascension":"Ascension","Pentecost":"Pentecost","Trinity Sunday":"Trinity Sunday","All Saints":"All Saints","a Saint":"A Saint","Apostles":"Apostles and Ordinations","the Apostles":"Apostles and Ordinations","Baptism":"Baptism","the Dedication of a Church":"Dedication of a Church"};
function pb79Preface(P, pref, sun, iso){
  const m=/^Preface (?:of|for) (.+?)(?:,| or |$)/.exec(pref||""); let name=m?m[1]:"";
  if(name==="the Lord's Day"){ if(!sun) return null; const k=["1. Of God the Father","2. Of God the Son","3. Of God the Holy Spirit"][Math.floor(toDate(iso)/DAY/7)%3]; return P[k]?[k,P[k]]:null; }
  const k=PB79_PREF[name]; return k&&P[k]?[k,P[k]]:null;
}
function pb79Items(its, fill){
  let h="";
  for(const it of its){
    if(it[0]==="slot"){ h+=fill(it[1])||""; continue; }
    const [k,t,r,lab]=it;
    if(k==="rub") h+=`<p class="rub">${esc(t)}</p>`;
    else if(k==="cite") h+=`<p class="cite">${esc(t)}</p>`;
    else if(k==="h") h+=`<h4 class="sub2">${esc(t)}</h4>`;
    else if(VEILING&&k==="v"&&CONS_RE.test(t)) h+=veilCue();
    else h+=`<p data-r="${r||"all"}">${lab?`<span class="sp">${esc(lab)}</span> `:""}${esc(t)}</p>`;
  }
  return h;
}
const pbWords=its=>its.filter(i=>i[0]==="v").map(i=>i[1]).join(" ").split(/\s+/).filter(Boolean).length;
async function buildPB79(ctx,opts){
  const B=await J("data/bcp1979.json"), iso=ctx.iso, sun=toDate(iso).getUTCDay()===0;
  const key=opts.p79||"II-A", rite=key.startsWith("I-")?"1":"2", form=rite==="1"?"t":"c";
  const C=B.collects[form], day=pb79Day(iso,C), col=C[day.title]||C[day.season];
  const pre=pb79Preface(B.prefaces[rite]||{}, col&&col.preface, sun, iso);
  const pop=(opts.pop79||"I");
  const lessons=window.LectCalendar.custom({...ctx,type:"mass"})||await window.LectCalendar.appointments({...ctx,type:"mass"});
  const lessonHTML=await window.LectCalendar.html(ctx,{...lessons,items:[...lessons.items.slice(0,1),...(lessons.psalms||[]).map(cite=>({lab:"Psalm",cite,tr:"bcp79"})),...lessons.items.slice(1)]});
  const out=[];
  for(const st of B["he"+rite]){
    let secs=pbWords(st.items)/2.4, extra=0;
    const fill=name=>{
      if(name==="collect"){ if(!col) return cue("The Collect of the Day, from the Prayer Book."); extra+=pbWords(col.text.map(t=>["v",t]))/2.4; return `<p class="cite">${esc(day.title)}</p>`+col.text.map(t=>`<p data-r="cel">${esc(t)}</p>`).join(""); }
      if(name==="lessons"){ extra+=readSecs(lessonHTML,300); return lessonHTML; }
      if(name==="sermon"){ if(!(opts.homily>0)) return ""; extra+=opts.homily*60; return `<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; }
      if(name==="pop"){ const f=B.pop.find(x=>x.t==="Form "+pop); if(!f) return ""; extra+=pbWords(f.items)/2.4; return `<h4 class="sub2">Prayers of the People: Form ${esc(pop)}</h4>`+pb79Items(f.items,()=>""); }
      if(name==="eprayer"){ const P=B.prayers[key]||[]; extra+=pbWords(P)/2.4; return `<h4 class="sub2">Eucharistic Prayer ${esc(key.split("-")[1])}</h4>`+pb79Items(P,fill); }
      if(name==="preface"){ if(!pre) return `<p class="note">No proper preface today.</p>`; extra+=pbWords(pre[1].map(t=>["v",t]))/2.4; return `<p class="cite">Proper Preface: ${esc(pre[0])}</p>`+pre[1].map(t=>`<p data-r="cel">${esc(t)}</p>`).join(""); }
      return "";
    };
    let html=pb79Items(st.items,fill);
    if(st.t==="The Breaking of the Bread"){ html+=`<div class="homily" data-r="all"><span class="lbl">Communion of the people</span> ≈ ${opts.communion} min</div>`; extra+=opts.communion*60; }
    out.push(sec(st.t,(secs+extra)/60,`<div class="txt one">${html}</div>`));
  }
  return out;
}
window.LectPB79={day:pb79Day, items:pb79Items};

/* ---------------------------------------------------------------- Novus Ordo (Heritage Missal order) */
const LAT={
  sign:"In nómine Patris, et Fílii, ✠ et Spíritus Sancti. ℟. Amen.",
  greet:"Dóminus vobíscum. ℟. Et cum spíritu tuo.",
  kyrie:"Kýrie, eléison. ℟. Kýrie, eléison. Christe, eléison. ℟. Christe, eléison. Kýrie, eléison. ℟. Kýrie, eléison.",
  gloria:"Glória in excélsis Deo et in terra pax homínibus bonæ voluntátis. Laudámus te, benedícimus te, adorámus te, glorificámus te, grátias ágimus tibi propter magnam glóriam tuam, Dómine Deus, Rex cæléstis, Deus Pater omnípotens. Dómine Fili unigénite, Iesu Christe, Dómine Deus, Agnus Dei, Fílius Patris, qui tollis peccáta mundi, miserére nobis; qui tollis peccáta mundi, súscipe deprecatiónem nostram. Qui sedes ad déxteram Patris, miserére nobis. Quóniam tu solus Sanctus, tu solus Dóminus, tu solus Altíssimus, Iesu Christe, cum Sancto Spíritu: in glória Dei Patris. Amen.",
  credo:"Credo in unum Deum, Patrem omnipoténtem, factórem cæli et terræ, visibílium ómnium et invisibílium. Et in unum Dóminum Iesum Christum, Fílium Dei unigénitum, et ex Patre natum ante ómnia sǽcula. Deum de Deo, lumen de lúmine, Deum verum de Deo vero, génitum, non factum, consubstantiálem Patri: per quem ómnia facta sunt. Qui propter nos hómines et propter nostram salútem descéndit de cælis. Et incarnátus est de Spíritu Sancto ex María Vírgine, et homo factus est. Crucifíxus étiam pro nobis sub Póntio Piláto; passus et sepúltus est, et resurréxit tértia die, secúndum Scriptúras, et ascéndit in cælum, sedet ad déxteram Patris. Et íterum ventúrus est cum glória, iudicáre vivos et mórtuos, cuius regni non erit finis. Et in Spíritum Sanctum, Dóminum et vivificántem: qui ex Patre Filióque procédit. Qui cum Patre et Fílio simul adorátur et conglorificátur: qui locútus est per prophétas. Et unam, sanctam, cathólicam et apostólicam Ecclésiam. Confíteor unum baptísma in remissiónem peccatórum. Et exspécto resurrectiónem mortuórum, et vitam ventúri sǽculi. Amen.",
  sursum:"Dóminus vobíscum. ℟. Et cum spíritu tuo. Sursum corda. ℟. Habémus ad Dóminum. Grátias agámus Dómino Deo nostro. ℟. Dignum et iustum est.",
  sanctus:"Sanctus, Sanctus, Sanctus Dóminus Deus Sábaoth. Pleni sunt cæli et terra glória tua. Hosánna in excélsis. Benedíctus qui venit in nómine Dómini. Hosánna in excélsis.",
  pater:"Pater noster, qui es in cælis, sanctificétur nomen tuum; advéniat regnum tuum; fiat volúntas tua, sicut in cælo et in terra. Panem nostrum cotidiánum da nobis hódie; et dimítte nobis débita nostra, sicut et nos dimíttimus debitóribus nostris; et ne nos indúcas in tentatiónem; sed líbera nos a malo.",
  agnus:"Agnus Dei, qui tollis peccáta mundi: miserére nobis. Agnus Dei, qui tollis peccáta mundi: miserére nobis. Agnus Dei, qui tollis peccáta mundi: dona nobis pacem.",
  ecce:"Ecce Agnus Dei, ecce qui tollit peccáta mundi. Beáti qui ad cenam Agni vocáti sunt. ℟. Dómine, non sum dignus, ut intres sub tectum meum: sed tantum dic verbo, et sanábitur ánima mea.",
  bless:"Dóminus vobíscum. ℟. Et cum spíritu tuo. Benedícat vos omnípotens Deus, Pater, et Fílius, ✠ et Spíritus Sanctus. ℟. Amen.",
  ite:"Ite, missa est. ℟. Deo grátias.",
  lord:"Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil.",
};
/* traditional English of the same ancient texts (public domain); the Missal's current English is ICEL's */
const ENG={
  sign:"In the name of the Father, and of the Son, ✠ and of the Holy Ghost. ℟. Amen.",
  greet:"The Lord be with you. ℟. And with thy spirit.",
  kyrie:"Lord, have mercy. ℟. Lord, have mercy. Christ, have mercy. ℟. Christ, have mercy. Lord, have mercy. ℟. Lord, have mercy.",
  gloria:"Glory to God in the highest, and on earth peace to men of good will. We praise thee; we bless thee; we adore thee; we glorify thee; we give thee thanks for thy great glory, O Lord God, heavenly King, God the Father almighty. O Lord Jesus Christ, the only-begotten Son; O Lord God, Lamb of God, Son of the Father, who takest away the sins of the world, have mercy on us; who takest away the sins of the world, receive our prayer; who sittest at the right hand of the Father, have mercy on us. For thou alone art holy; thou alone art the Lord; thou alone, O Jesus Christ, art most high, together with the Holy Ghost, in the glory of God the Father. Amen.",
  credo:"I believe in one God, the Father almighty, maker of heaven and earth, and of all things visible and invisible. And in one Lord Jesus Christ, the only-begotten Son of God, born of the Father before all ages; God of God, Light of Light, true God of true God; begotten, not made; consubstantial with the Father, by whom all things were made. Who for us men and for our salvation came down from heaven, and became incarnate by the Holy Ghost of the Virgin Mary, and was made man. He was crucified also for us, suffered under Pontius Pilate, and was buried. And the third day he rose again according to the Scriptures; and ascended into heaven, and sitteth at the right hand of the Father; and he shall come again with glory to judge the living and the dead, of whose kingdom there shall be no end. And in the Holy Ghost, the Lord and giver of life, who proceedeth from the Father and the Son; who together with the Father and the Son is adored and glorified; who spoke by the prophets. And one, holy, catholic and apostolic Church. I confess one baptism for the remission of sins. And I look for the resurrection of the dead, and the life of the world to come. Amen.",
  sursum:"The Lord be with you. ℟. And with thy spirit. Lift up your hearts. ℟. We have lifted them up to the Lord. Let us give thanks to the Lord our God. ℟. It is meet and just.",
  sanctus:"Holy, holy, holy, Lord God of hosts. Heaven and earth are full of thy glory. Hosanna in the highest. Blessed is he that cometh in the name of the Lord. Hosanna in the highest.",
  pater:"Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil.",
  pax:"The peace of the Lord be always with you. ℟. And with thy spirit.",
  agnus:"Lamb of God, who takest away the sins of the world, have mercy on us. Lamb of God, who takest away the sins of the world, have mercy on us. Lamb of God, who takest away the sins of the world, grant us peace.",
  ecce:"Behold the Lamb of God, behold him who taketh away the sins of the world. Blessed are they who are called to the supper of the Lamb. ℟. Lord, I am not worthy that thou shouldst enter under my roof; but only say the word, and my soul shall be healed.",
  bless:"The Lord be with you. ℟. And with thy spirit. May almighty God bless you, the Father, and the Son, ✠ and the Holy Ghost. ℟. Amen.",
  ite:"Go, the Mass is ended. ℟. Thanks be to God.",
};
/* Latin with the traditional English beside it */
function bil(k,cls,role,la){ const L=para(la||LAT[k],cls||"lat",role), E=ENG[k]?para(ENG[k],"",role):""; return E?`<div class="txt two"><div lang="la">${L}</div><div lang="en">${E}</div></div>`:L; }
const ICEL="The Roman Missal's current English (ICEL) differs from the traditional translation beside the Latin";
const fmtTxt=t=>esc(t).replace(/✠/g,'<span class="cross">✠</span>');
/* Splits a text at each ℟.: the response (its first sentence) is the people's, the rest the speaker's. */
function para(t,cls,role){
  role=role||"cel";
  if(!/℟\./.test(t)) return `<p class="${cls||""}" data-r="${role}">${fmtTxt(t)}</p>`;
  const segs=t.split(/℟\.\s*/); let h=segs[0].trim()?`<span data-r="${role}">${fmtTxt(segs[0].trim())}</span> `:"";
  for(let i=1;i<segs.length;i++){ const m=/^(.*?[.!?:;])(\s+(?=[A-ZÁÉÍÓÚÆŒ]).*)?$/s.exec(segs[i].trim()); const resp=m?m[1]:segs[i].trim(), rest=m&&m[2]?m[2].trim():"";
    h+=`<span data-r="ppl"><span class="sp">℟.</span> ${fmtTxt(resp)}</span> `; if(rest) h+=`<span data-r="${role}">${fmtTxt(rest)}</span> `; }
  return `<p class="${cls||""}">${h.trim()}</p>`;
}
async function buildNO(ctx, opts){
  const {iso,day}=ctx; const [C,H]=await Promise.all([J("chant.json"),J("hymns.json")]);
  const r=ctx.rite==="o"?day.o:day.n; const s=season(iso,day); const sun=toDate(iso).getUTCDay()===0;
  const sung=opts.ordinary==="sung"; const mass=opts.mass||defaultMass(iso,day,ctx.rite);
  const gl=hasGloriaNO(iso,day), cr=hasCreedNO(iso,day); const paschal=PASCHAL(iso);
  const HM="Heritage Missal"; const AB=opts.abridge||0;
  const out=[]; const ch=(t,id,meta)=>C.chants[id]?CW(t,C.chants[id].g,meta||"GregoBase (CC0)"):"";
  const chs=id=>C.chants[id]?M().chantSeconds(C.chants[id].g):0;
  const ord=(part,title)=>{ const g=ordinaryChant(C,mass,part)||(part==="Gloria"?ordinaryChant(C,"VIII","Gloria"):null); return g?{html:CW(title,g,`Mass ${mass} · ${C.kyriale[mass].name} · GregoBase (CC0)`),sec:M().chantSeconds(g)}:{html:"",sec:0}; };
  // Introductory rites
  let h=pos([["stand","from the entrance through the Collect"],["cross","at the opening sign of the cross"]]), t=0;
  const ent=hymnSlot(H,iso,"entrance",s,opts,"Entrance hymn"); h+=ent.html||cue(`Entrance Antiphon: read it from today's Mass propers in the ${HM}.`); t+=ent.sec||(AB>=3?20:40);
  h+=`<h4 class="sub2">Sign of the Cross and Greeting</h4>`+bil("sign","")+bil("greet","")+cue(`${ICEL}: ${HM}, Order of Mass, Introductory Rites.`); t+=AB>=3?30:50;
  if(opts.asperges&&sun&&sung){ h+=`<h4 class="sub2">Rite of Sprinkling (in place of the Penitential Act)</h4>`+ch(paschal?"Vidi aquam":"Asperges me",paschal?C.common.vidi:C.common.asperges); t+=chs(paschal?C.common.vidi:C.common.asperges)+60; }
  else if(AB>=3){ h+=`<h4 class="sub2">Penitential Act</h4>`+cue(`Brief form: a moment of silence, then the Kyrie (${HM}, Order of Mass).`); t+=15; }
  else { h+=`<h4 class="sub2">Penitential Act</h4>`+pos([["strike","at through my fault"]])+cue(`I confess to almighty God… (${HM}, Order of Mass).`); t+=60; }
  h+=`<h4 class="sub2">Kyrie</h4>`+bil("kyrie",""); if(sung){ const k=ord("Kyrie",`Kyrie ${mass}`); h+=k.html; t+=k.sec; } else t+=20;
  if(gl&&AB>=3) h+=abr("the Gloria");
  else if(gl){ h+=`<h4 class="sub2">Gloria</h4>`+bil("gloria","lat","all")+cue(`${ICEL}: ${HM}, Order of Mass.`); if(sung){ const g=ord("Gloria","Gloria"); h+=g.html; t+=g.sec; } else t+=60; }
  h+=`<h4 class="sub2">Collect</h4>`+cue(`Let us pray… then the Collect of the day, from the ${HM} propers.`); t+=40;
  out.push(sec("Introductory Rites",t/60,h));
  // Word
  h=pos([["sit","for the readings and the Psalm"]]); t=0;
  const NOdrop=[];
  for(const x of r.r){
    const lab=x[0];
    if(AB>=1&&lab==="Second Reading"){ NOdrop.push("the Second Reading"); continue; }
    if(AB>=2&&/^(First Reading|Responsorial Psalm)$/.test(lab)){ NOdrop.push(lab==="First Reading"?"the First Reading":"the Responsorial Psalm"); continue; }
    if(/^Reading [1-7]$/.test(lab)&&(AB>=2||(AB>=1&&lab!=="Reading 3"))){ NOdrop.push(`Vigil ${lab}`); continue; }
    if(lab==="Procession Gospel"&&AB>=2){ h+=cue("Procession with palms: a brief blessing of palms, then a short procession while all sing or say Hosanna."); t+=60; continue; }
    if(lab==="Procession Gospel"){ h+=await RB(ctx,"Procession with palms · Gospel",x[1],"n",ctx.tr,false); t+=120; continue; }
    if(/Psalm/.test(lab)){ h+=await RB(ctx,"Responsorial Psalm",x[1],"n",ctx.tr,false)+cue(`Sung setting with refrain: ${HM} (Respond & Acclaim). Said: the reader proclaims the verses and all repeat the refrain.`); t+=sung?180:90; continue; }
    if(/Gospel|Passion/.test(lab)){
      h+=`<h4 class="sub2">Gospel Acclamation</h4>`+pos([["stand"],["cross","small crosses on forehead, lips and breast at the Gospel's announcement"]])+(s==="lent"||s==="palm"?cue(`Lenten acclamation (no Alleluia), with the verse from the ${HM}.`):para("Allelúia, allelúia, allelúia.","","ppl")+cue(`Verse before the Gospel: ${HM}, readings for the day.`)); t+=sung?60:25;
      { const rb=await RB(ctx,lab,x[1],"n",ctx.tr,false); h+=rb; t+=/Passion/.test(lab)?(AB>=2?540:900):readSecs(rb,180); }
      if(/Passion/.test(lab)&&AB>=2) h+=abr("the Passion in its short form (the Missal marks the shorter reading)");
      if(opts.homily>0){ h+=pos([["sit","for the homily"]])+`<div class="homily" data-r="cel"><span class="lbl">Homily</span> ≈ ${opts.homily} min</div>`; t+=opts.homily*60; }
      continue;
    }
    { const rb=await RB(ctx,lab,x[1],"n",ctx.tr,false); h+=rb; t+=readSecs(rb,/Reading \d/.test(lab)?150:110); }
  }
  if(NOdrop.length) h=abr(NOdrop)+h;
  if(cr&&AB>=2) h+=abr("the Profession of Faith");
  else if(cr){ h+=`<h4 class="sub2">Profession of Faith</h4>`+pos([["stand"],["bow","at and by the Holy Spirit was incarnate (genuflect at Christmas and the Annunciation)"]])+bil("credo","lat","all")+cue(`${ICEL}: the Nicene Creed (or Apostles' Creed) in the ${HM}.`); if(sung){ const id=C.credo[opts.credo||"III"]; if(id){ h+=ch(`Credo ${opts.credo||"III"}`,id); t+=chs(id); } } else t+=90; }
  if(opts.up){ h+=`<h4 class="sub2">Universal Prayer</h4>`+cue("Intentions for the Church, the world, the suffering, and the local community, each answered: Lord, hear our prayer."); t+=150; }
  out.push(sec("Liturgy of the Word",t/60,h));
  // Eucharist
  h=""; t=0;
  const off=hymnSlot(H,iso,"offertory",s,opts,"Offertory hymn"); h+=`<h4 class="sub2">Preparation of the Gifts</h4>`+pos([["sit"],["stand","at Pray, brethren"]])+(off.html||cue(AB>=2?"The gifts are placed on the altar in silence.":"The gifts are brought forward; the priest's prayers may be said aloud with the response: Blessed be God for ever."))+cue(`Pray, brethren… and the Prayer over the Offerings: ${HM}.`); t+=(off.sec||(AB>=3?20:AB>=2?30:90))+(AB>=3?30:AB>=2?40:60);
  h+=`<h4 class="sub2">Preface Dialogue</h4>`+bil("sursum","")+(sung?ch("Preface dialogue",C.common.pref_sol,"Solemn tone · GregoBase (CC0)"):"")+cue(`Preface of the day: ${HM}.`); t+=sung?120:AB>=3?50:75;
  h+=`<h4 class="sub2">Sanctus</h4>`+bil("sanctus","","all")+pos([["kneel","after the Sanctus until after the Great Amen (USA)"],["bell","at the epiclesis and at each elevation, where customary"]]); if(sung){ const k=ord("Sanctus",`Sanctus ${mass}`); h+=k.html; t+=k.sec; } else t+=25;
  const EPT={I:8,II:AB>=3?2.5:3.5,III:5,IV:7};
  h+=`<div data-priest-only><h4 class="sub2">Eucharistic Prayer ${esc(opts.ep||"II")}</h4>`+cue(`Eucharistic Prayer ${opts.ep||"II"}: ${HM}, Order of Mass. Kneel from after the Sanctus until after the Great Amen (in the United States).`)+(opts.veil?cue(VEIL):"")+`</div>`;
  h+=`<h4 class="sub2">Mystery of Faith</h4>`+para("Mortem tuam annuntiámus, Dómine, et tuam resurrectiónem confitémur, donec vénias.","","ppl")+(sung?ch("Mortem tuam",C.common.mortem):"")+cue(`English forms: ${HM}.`)+`<h4 class="sub2">Doxology and Great Amen</h4>`+para("Per ipsum, et cum ipso, et in ipso… ℟. Amen."); t+=(EPT[opts.ep||"II"]||4)*60+40;
  out.push(sec("Liturgy of the Eucharist",t/60,h));
  // Communion
  h=""; t=0;
  h+=`<h4 class="sub2">The Lord's Prayer</h4>`+pos([["stand","for the Lord's Prayer and the Sign of Peace"]])+bil("pater","lat","all")+(sung?ch("Pater noster",C.common.pater):"")+cue(`Embolism and doxology (For the kingdom…): ${HM}.`); t+=sung?120:60;
  h+=`<h4 class="sub2">Sign of Peace</h4>`+bil("pax","","cel","Pax Dómini sit semper vobíscum. ℟. Et cum spíritu tuo.")+(sung?ch("Pax Domini",C.common.paxdomini):""); t+=AB>=3?15:40;
  h+=`<h4 class="sub2">Lamb of God</h4>`+bil("agnus","","all")+pos([["kneel","after the Lamb of God (USA)"],["strike","where customary, at Lord, I am not worthy"]]); if(sung){ const a=ord("Agnus",`Agnus Dei ${mass}`); h+=a.html; t+=a.sec; } else t+=25;
  h+=`<h4 class="sub2">Invitation to Communion</h4>`+bil("ecce","")+cue(`${ICEL}: ${HM}.`); t+=30;
  const com=hymnSlot(H,iso,"communion",s,opts,"Communion hymn"); h+=`<h4 class="sub2">Communion</h4>`+pos([["bow","before receiving"],["sit","or kneel after Communion"]])+cue(`Communion Antiphon: ${HM} propers.`)+com.html+`<div class="homily" data-r="all"><span class="lbl">Distribution of Communion</span> ≈ ${opts.communion} min</div>`; t+=Math.max(com.sec,opts.communion*60);
  h+=`<h4 class="sub2">Prayer after Communion</h4>`+pos([["stand"]])+cue(`From the ${HM} propers.`); t+=AB>=3?30:45;
  out.push(sec("Communion Rite",t/60,h));
  // Conclusion
  h=""; t=0;
  h+=pos([["cross","at the blessing"]])+bil("bless","")+bil("ite","","cel",paschal&&(fromEaster(iso)<=7||/Pentecost/.test(r.t))?"Ite, missa est, allelúia, allelúia. ℟. Deo grátias, allelúia, allelúia.":LAT.ite)+cue(`${ICEL}: ${HM}.`);
  if(sung){ const ids=(C.kyriale[mass]||{}).ids||{}; const id=ids.Ite||C.common.ite_no; h+=ch("Ite, missa est",id); t+=chs(id); } t+=40;
  const rec=hymnSlot(H,iso,"recessional",s,opts,"Recessional hymn"); h+=rec.html; t+=rec.sec;
  if(opts.marian){ const ma=marian(iso,C); if(ma){ h+=CW(ma.name,ma.gabc,"Seasonal Marian antiphon · GregoBase (CC0)"); t+=M().chantSeconds(ma.gabc); } }
  out.push(sec("Concluding Rites",t/60,h));
  return out;
}

/* ---------------------------------------------------------------- Ordinariate (Prayer Book texts) */
const BCP={
  purity:"Almighty God, unto whom all hearts be open, all desires known, and from whom no secrets are hid: Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. Amen.",
  law:"Hear what our Lord Jesus Christ saith: Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. This is the first and great commandment. And the second is like unto it: Thou shalt love thy neighbour as thyself. On these two commandments hang all the Law and the Prophets.",
  gloria:"Glory be to God on high, and in earth peace, good will towards men. We praise thee, we bless thee, we worship thee, we glorify thee, we give thanks to thee for thy great glory, O Lord God, heavenly King, God the Father Almighty. O Lord, the only-begotten Son Jesu Christ; O Lord God, Lamb of God, Son of the Father, that takest away the sins of the world, have mercy upon us. Thou that takest away the sins of the world, receive our prayer. Thou that sittest at the right hand of God the Father, have mercy upon us. For thou only art holy; thou only art the Lord; thou only, O Christ, with the Holy Ghost, art most high in the glory of God the Father. Amen.",
  creed:"I believe in one God the Father Almighty, Maker of heaven and earth, and of all things visible and invisible: And in one Lord Jesus Christ, the only-begotten Son of God, begotten of his Father before all worlds, God of God, Light of Light, very God of very God, begotten, not made, being of one substance with the Father, by whom all things were made: who for us men, and for our salvation came down from heaven, and was incarnate by the Holy Ghost of the Virgin Mary, and was made man, and was crucified also for us under Pontius Pilate. He suffered and was buried, and the third day he rose again according to the Scriptures, and ascended into heaven, and sitteth on the right hand of the Father. And he shall come again with glory to judge both the quick and the dead: whose kingdom shall have no end. And I believe in the Holy Ghost, the Lord and giver of life, who proceedeth from the Father and the Son, who with the Father and the Son together is worshipped and glorified, who spake by the Prophets. And I believe one Catholick and Apostolick Church. I acknowledge one Baptism for the remission of sins. And I look for the Resurrection of the dead, and the life of the world to come. Amen.",
  invite:"Ye that do truly and earnestly repent you of your sins, and are in love and charity with your neighbours, and intend to lead a new life, following the commandments of God, and walking from henceforth in his holy ways: Draw near with faith, and make your humble confession to Almighty God, meekly kneeling upon your knees.",
  confess:"Almighty God, Father of our Lord Jesus Christ, Maker of all things, judge of all men; We acknowledge and bewail our manifold sins and wickedness, which we from time to time most grievously have committed, by thought, word, and deed, against thy Divine Majesty, provoking most justly thy wrath and indignation against us. We do earnestly repent, and are heartily sorry for these our misdoings; the remembrance of them is grievous unto us; the burden of them is intolerable. Have mercy upon us, have mercy upon us, most merciful Father; for thy Son our Lord Jesus Christ's sake, forgive us all that is past; and grant that we may ever hereafter serve and please thee in newness of life, to the honour and glory of thy Name; through Jesus Christ our Lord. Amen.",
  absolve:"Almighty God, our heavenly Father, who of his great mercy hath promised forgiveness of sins to all them that with hearty repentance and true faith turn unto him; Have mercy upon you; pardon and deliver you from all your sins; confirm and strengthen you in all goodness; and bring you to everlasting life; through Jesus Christ our Lord. Amen.",
  comfortable:"Hear what comfortable words our Saviour Christ saith unto all that truly turn to him. Come unto me all that travail and are heavy laden, and I will refresh you. So God loved the world, that he gave his only-begotten Son, to the end that all that believe in him should not perish, but have everlasting life. Hear also what Saint Paul saith. This is a true saying, and worthy of all men to be received, That Christ Jesus came into the world to save sinners. Hear also what Saint John saith. If any man sin, we have an Advocate with the Father, Jesus Christ the righteous; and he is the propitiation for our sins.",
  sursum:"The Lord be with you. ℟. And with thy spirit. Lift up your hearts. ℟. We lift them up unto the Lord. Let us give thanks unto our Lord God. ℟. It is meet and right so to do.",
  sanctus:"Holy, holy, holy, Lord God of hosts, heaven and earth are full of thy glory: Glory be to thee, O Lord most High. Blessed is he that cometh in the Name of the Lord: Hosanna in the highest.",
  lord:"Our Father, who art in heaven, hallowed be thy Name; thy kingdom come; thy will be done, in earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, as we forgive them that trespass against us. And lead us not into temptation; but deliver us from evil.",
  agnus:"O Lamb of God, that takest away the sins of the world, have mercy upon us. O Lamb of God, that takest away the sins of the world, have mercy upon us. O Lamb of God, that takest away the sins of the world, grant us thy peace.",
  access:"We do not presume to come to this thy Table, O merciful Lord, trusting in our own righteousness, but in thy manifold and great mercies. We are not worthy so much as to gather up the crumbs under thy Table. But thou art the same Lord, whose property is always to have mercy: Grant us therefore, gracious Lord, so to eat the flesh of thy dear Son Jesus Christ, and to drink his blood, that our sinful bodies may be made clean by his body, and our souls washed through his most precious blood, and that we may evermore dwell in him, and he in us. Amen.",
  thanks:"Almighty and everliving God, we most heartily thank thee, for that thou dost vouchsafe to feed us who have duly received these holy mysteries, with the spiritual food of the most precious Body and Blood of thy Son our Saviour Jesus Christ; and dost assure us thereby of thy favour and goodness towards us; and that we are very members incorporate in the mystical body of thy Son, which is the blessed company of all faithful people; and are also heirs through hope of thy everlasting kingdom, by the merits of the most precious death and passion of thy dear Son. And we most humbly beseech thee, O heavenly Father, so to assist us with thy grace, that we may continue in that holy fellowship, and do all such good works as thou hast prepared for us to walk in; through Jesus Christ our Lord, to whom, with thee and the Holy Ghost, be all honour and glory, world without end. Amen.",
  blessing:"The peace of God, which passeth all understanding, keep your hearts and minds in the knowledge and love of God, and of his Son Jesus Christ our Lord: And the blessing of God Almighty, the Father, the Son, and the Holy Ghost, be amongst you and remain with you always. Amen.",
};
async function buildOrd(ctx, opts){
  const {iso,day}=ctx; const [C,H,O,PR,BO]=await Promise.all([J("chant.json"),J("hymns.json"),J("ordo.json"),J("propers-1962.json"),J("bcp-office.json").catch(()=>({collects:{}}))]);
  const r=day.o;
  /* the propers in public-domain English: the 1662 collect of the Sunday, and the rest from the Roman Missal (1962) for this day */
  const tm=day.m||{}, P62=PR.map[`1962|${tm.path}|${tm.feria?1:0}`]; const PP=P62!=null?PR.data[P62]:null;
  const PRE={prayers:O.English.prayers};
  const en=(n,role)=>{ const p=PP&&PP.parts[n]; if(!p||!p[1]) return ""; ROLE=role||"cel"; const h=`<div class="txt one">${[].concat(p[1]).join("\n").split("\n").map(l=>lineHTML(l,PRE,"en")).join("")}</div>`; ROLE="cel"; return h; };
  const from62=`<p class="note">From the Roman Missal (1962) in English for this day; ${"Divine Worship: The Missal"} has its own wording and may appoint a different proper.</p>`;
  const bcpCol=r.bcp&&BO.collects&&BO.collects[r.bcp]; const s=season(iso,day); const sun=toDate(iso).getUTCDay()===0; const sung=opts.ordinary==="sung"; const mass=opts.mass||defaultMass(iso,day,"o");
  const gl=hasGloriaNO(iso,day), cr=hasCreedNO(iso,day);
  const DW="Divine Worship: The Missal"; const AB=opts.abridge||0;
  const out=[]; const ch=(t,id,meta)=>C.chants[id]?CW(t,C.chants[id].g,meta||"GregoBase (CC0)"):"";
  const ord=(part,title)=>{ const g=ordinaryChant(C,mass,part)||(part==="Gloria"?ordinaryChant(C,"VIII","Gloria"):null); return g?{html:CW(title,g,`Latin chant, Mass ${mass} · GregoBase (CC0)`),sec:M().chantSeconds(g)}:{html:"",sec:0}; };
  let h=pos([["stand","for the entrance, the Gloria and the Collect"]])+cue("Postures follow common Ordinariate custom; follow your parish."),t=0;
  const ent=hymnSlot(H,iso,"entrance",s,opts,"Entrance hymn"); h+=ent.html||(en("Introitus","ppl")?`<h4 class="sub2">Introit</h4>`+en("Introitus","ppl")+from62:cue(`Introit: ${DW}, proper of the day.`)); t+=ent.sec||(AB>=3?20:40);
  if(AB<3){ h+=`<h4 class="sub2">Collect for Purity</h4>`+para(BCP.purity); t+=30; }
  if(AB<1){ h+=`<h4 class="sub2">Summary of the Law</h4>`+para(BCP.law)+para("Lord, have mercy upon us, and write both these thy laws in our hearts, we beseech thee."); t+=60; }
  h+=abr([AB>=3?"the Collect for Purity":"",AB>=1?"the Summary of the Law":""]);
  h+=`<h4 class="sub2">Kyrie</h4>`+para("Lord, have mercy upon us. Christ, have mercy upon us. Lord, have mercy upon us.","","all"); if(sung){ const k=ord("Kyrie",`Kyrie ${mass}`); h+=k.html; t+=k.sec; } else t+=20;
  if(gl&&AB>=3) h+=abr("the Gloria in excelsis");
  else if(gl){ h+=`<h4 class="sub2">Gloria in excelsis</h4>`+para(BCP.gloria,"","all"); if(sung){ const g=ord("Gloria","Gloria (Latin)"); h+=g.html; t+=g.sec; } else t+=60; }
  h+=`<h4 class="sub2">Collect of the Day</h4>`+para("The Lord be with you. ℟. And with thy spirit. Let us pray.");
  if(bcpCol) h+=`<p class="cite">${esc(r.bcp.toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()))} · Book of Common Prayer (1662)</p>`+para(bcpCol.replace(/\s*Amen\.?\s*$/,"")+" ℟. Amen.");
  else if(en("Oratio")) h+=en("Oratio")+from62;
  else h+=cue(`The Collect: ${DW}.`);
  h+=cue(`On feasts and in some seasons ${DW} appoints its own collect.`); t+=40;
  out.push(sec("Introductory Rites",t/60,h));
  h=pos([["sit","for the lessons"]]); t=0;
  const ODrop=[];
  for(const x of r.r){ const lab=x[0];
    if(AB>=1&&lab==="Second Reading"){ ODrop.push("the Second Reading"); continue; }
    if(AB>=2&&/^(First Reading|Responsorial Psalm|Procession Gospel)$/.test(lab)){ ODrop.push(lab==="Responsorial Psalm"?"the Gradual":"the "+lab); continue; }
    if(/^Reading [1-7]$/.test(lab)&&(AB>=2||(AB>=1&&lab!=="Reading 3"))){ ODrop.push(`Vigil ${lab}`); continue; }
    if(/Psalm/.test(lab)){ h+=await RB(ctx,"Gradual or Psalm",x[1],"n","kj",false); t+=90; continue; }
    if(/Gospel|Passion/.test(lab)){ h+=pos([["stand"],["cross","on forehead, lips and breast at the announcement"]]); const rb=await RB(ctx,lab,x[1],"n","kj",false); h+=rb; t+=/Passion/.test(lab)?(AB>=2?540:900):readSecs(rb,180); if(opts.homily>0){ h+=pos([["sit","for the sermon"]])+`<div class="homily" data-r="cel"><span class="lbl">Sermon</span> ≈ ${opts.homily} min</div>`; t+=opts.homily*60; } continue; }
    { const rb=await RB(ctx,lab,x[1],"n","kj",false); h+=rb; t+=readSecs(rb,120); } }
  if(ODrop.length) h=abr(ODrop)+h;
  if(cr&&AB>=2) h+=abr("the Nicene Creed");
  else if(cr){ h+=`<h4 class="sub2">Nicene Creed</h4>`+pos([["stand"],["genuflect","or bow at and was incarnate"]])+para(BCP.creed,"","all")+cue(`${DW} reads "one, holy, catholic, and apostolic Church".`); t+=sung?240:90; if(sung){ const id=C.credo[opts.credo||"III"]; if(id) h+=ch(`Credo ${opts.credo||"III"} (Latin)`,id); } }
  if(opts.up){ h+=`<h4 class="sub2">Prayers of the People</h4>`+pos([["kneel","for the Prayers of the People and the Penitential Rite"]])+cue(`Intercessions as in ${DW}.`); t+=150; }
  if(AB>=3){ h+=`<h4 class="sub2">Penitential Rite</h4>`+cue("Brief form: a moment of silent confession, then the Absolution.")+para(BCP.absolve); t+=35; }
  else { h+=`<h4 class="sub2">Penitential Rite</h4>`+(AB<2?para(BCP.invite):"")+para(BCP.confess,"","all")+para(BCP.absolve); t+=AB<2?150:110; }
  if(AB<1){ h+=`<h4 class="sub2">Comfortable Words</h4>`+para(BCP.comfortable); t+=50; }
  h+=abr([AB>=2?"the Invitation to confession":"",AB>=3?"the General Confession said silently":"",AB>=1?"the Comfortable Words":""]);
  out.push(sec("Liturgy of the Word",t/60,h));
  h=""; t=0;
  const off=hymnSlot(H,iso,"offertory",s,opts,"Offertory hymn"); h+=`<h4 class="sub2">Offertory</h4>`+pos([["sit"]])+(off.html||(en("Offertorium","ppl")?`<p class="cite">Offertory</p>`+en("Offertorium","ppl"):cue(`Offertory sentence: ${DW}.`)))+para("Pray, brethren, that my sacrifice and yours may be acceptable to God the Father almighty. ℟. May the Lord receive the sacrifice at thy hands, to the praise and glory of his Name, to our benefit and that of all his holy Church.")+(en("Secreta")?`<p class="cite">Prayer over the Offerings</p>`+en("Secreta")+from62:cue(`Prayer over the Offerings: ${DW}.`)); t+=(off.sec||(AB>=3?20:AB>=2?40:90))+(AB>=3?30:60);
  h+=`<h4 class="sub2">Sursum corda</h4>`+pos([["stand"]])+para(BCP.sursum)+(()=>{ const sun=toDate(iso).getUTCDay()===0, paschal=PASCHAL(iso); const pk=(PP&&PP.pref)||(sun?"Trinitate":paschal?"Pasch":s==="lent"?"Quad":s==="christmas"?"Nat":s==="epiphany"?"Epi":"Communis"); const pe=(O.English.pref[pk]||O.English.pref.Communis||""); if(!pe) return cue(`Proper Preface: ${DW}.`); ROLE="cel"; const x=`<p class="cite">Preface: ${esc(pk)}</p><div class="txt one">${pe.split("\n").filter(l=>!/^(Sanctus|v\. Holy)/.test(l)).map(l=>lineHTML(l,PRE,"en")).join("")}</div>`+from62; return x; })()+`<h4 class="sub2">Sanctus and Benedictus</h4>`+para(BCP.sanctus,"","all")+pos([["kneel","from the Sanctus through Communion"],["bell","at the Sanctus and at each elevation"]]); if(sung){ const k=ord("Sanctus",`Sanctus ${mass} (Latin)`); h+=k.html; t+=k.sec; } t+=AB>=3?60:90;
  const canonL=(O.English.ordo.find(x=>x.h==="Canon")||{items:[]}).items.filter((it,j)=>!(AB>=2&&TRAD_DROP["Canon#1"][2].includes(j)));
  const canonH=canonL.map(it=>opts.veil&&/!!!\s*FOR THIS IS/.test(it)?veilCue():it.split("\n").map(l=>lineHTML(l,{prayers:O.English.prayers},"en")).join("")).join("");
  h+=`<h4 class="sub2">Roman Canon${AB>=2?" (core)":""}</h4>`+`<details class="canon"><summary>Show the Canon (traditional English${AB>=2?"; core only":""})</summary><div class="txt one">${canonH}</div></details>`+(AB>=2?abr("the Canon's intercessions; the institution narrative and doxology are kept"):"")+cue(`${DW} prints the Roman Canon in its own traditional-language translation; this text is the older English version of the same prayer. Eucharistic Prayer II may be used on weekdays.`); t+=AB>=3?3*60:AB>=2?4*60:8*60;
  out.push(sec("Offertory and Canon",t/60,h));
  h=""; t=0;
  h+=`<h4 class="sub2">The Lord's Prayer</h4>`+para(BCP.lord,"","all")+`<h4 class="sub2">Peace</h4>`+para("The peace of the Lord be always with you. ℟. And with thy spirit.")+`<h4 class="sub2">Agnus Dei</h4>`+para(BCP.agnus,"","all"); if(sung){ const a=ord("Agnus",`Agnus Dei ${mass} (Latin)`); h+=a.html; t+=a.sec; } t+=AB>=3?90:120;
  h+=`<h4 class="sub2">Prayer of Humble Access</h4>`+para(BCP.access,"","all")+`<h4 class="sub2">Invitation</h4>`+para("Behold the Lamb of God, behold him that taketh away the sins of the world. ℟. Lord, I am not worthy that thou shouldest come under my roof, but speak the word only, and my soul shall be healed."); t+=90;
  const com=hymnSlot(H,iso,"communion",s,opts,"Communion hymn"); h+=`<h4 class="sub2">Communion</h4>`+pos([["kneel","at the altar rail, where that is the custom"]])+com.html+`<div class="homily" data-r="all"><span class="lbl">Distribution of Communion</span> ≈ ${opts.communion} min</div>`; t+=Math.max(com.sec,opts.communion*60);
  if(AB>=2){ h+=`<h4 class="sub2">Post-Communion</h4>`+(en("Postcommunio")||cue(`Post-Communion prayer: ${DW}.`))+abr("the Prayer of Thanksgiving"); t+=30; }
  else { h+=`<h4 class="sub2">Post-Communion and Thanksgiving</h4>`+(en("Postcommunio")?en("Postcommunio")+from62:cue(`Post-Communion prayer: ${DW}.`))+para(BCP.thanks); t+=90; }
  out.push(sec("Communion",t/60,h));
  h=""; t=0;
  h+=`<h4 class="sub2">Blessing</h4>`+pos([["kneel"],["cross"]])+para(BCP.blessing)+`<h4 class="sub2">Dismissal</h4>`+para("Go in peace. ℟. Thanks be to God."); t+=60;
  if(opts.lastGospel){ const ue=(O.English.prayers["Ultima Evangelium"]||"").split("\n"); h+=`<h4 class="sub2">Last Gospel (optional)</h4>`+pos([["stand"],["genuflect","at and the Word was made flesh"]])+`<div class="txt one">${ue.map(l=>lineHTML(l,{prayers:O.English.prayers},"en")).join("")}</div>`; t+=90; }
  const rec=hymnSlot(H,iso,"recessional",s,opts,"Recessional hymn"); h+=rec.html; t+=rec.sec;
  if(opts.marian){ const ma=marian(iso,C); if(ma){ h+=CW(ma.name,ma.gabc,"Marian antiphon · GregoBase (CC0)"); t+=M().chantSeconds(ma.gabc); } }
  out.push(sec("Conclusion",t/60,h));
  return out;
}

/* ---------------------------------------------------------------- Byzantine */
/* Which Liturgy the day calls for (Byzantine Catholic use, Gregorian Pascha). */
function byzLiturgy(iso){
  const d=toDate(iso), Y=d.getUTCFullYear(), E=easterY(Y), off=Math.round((d-E)/DAY), w=d.getUTCDay(), md=(d.getUTCMonth()+1)*100+d.getUTCDate();
  const eve=(m)=>{ const f=toDate(`${Y}-${String(Math.floor(m/100)).padStart(2,"0")}-${String(m%100).padStart(2,"0")}`).getUTCDay(); return f; };
  if(off===-2) return {k:"none",why:"Great and Holy Friday is aliturgical: the Royal Hours and Vespers of the Burial are served instead."};
  if([-42,-35,-28,-21,-14].includes(off)||off===-3||off===-1||md===101) return {k:"basil",why:off===-3?"Holy Thursday":off===-1?"Holy Saturday, with Vespers":md===101?"the feast of St Basil the Great":"a Sunday of the Great Fast"};
  if((md===1224&&![0,6].includes(w))||(md===1225&&[0,1].includes(w))) return {k:"basil",why:"the Nativity"};
  if((md===105&&![0,6].includes(w))||(md===106&&[0,1].includes(w))) return {k:"basil",why:"the Theophany"};
  if(md!==325&&((off>=-48&&off<=-9&&(w===3||w===5))||(off>=-6&&off<=-4))) return {k:"pres",why:off>=-6?"Great and Holy Week":"a weekday of the Great Fast"};
  if(md!==325&&off>=-48&&off<=-9&&[1,2,4].includes(w)) return {k:"chrys",why:"",note:"Weekdays of the Great Fast are normally aliturgical (no Divine Liturgy). The Liturgy is shown for practice."};
  return {k:"chrys",why:""};
}
/* Each part: title, minutes at abridgment levels 0–3, the order, and what each level shortens. */
function byzParts(kind, sun, veil){
  const inst=veil?"Priest-only Eucharistic prayer: follow silently; do not simulate the consecration":"Words of institution: Take, eat… Drink of this, all of you…";
  if(kind==="pres") return [
    {t:"Vespers: Opening and Kathisma",m:[18,12,6,3],o:["Blessed is the Kingdom… (the Presanctified begins as Vespers)","Introductory Psalm 103 (104)","Great Litany","Kathisma 18 (Psalms 119–133) with Little Litanies; the Presanctified Gifts are prepared on the altar"],a:[[],["Kathisma in part"],["Introductory Psalm in part","one stasis of the Kathisma"],["Kathisma omitted"]]},
    {t:"Lord, I Have Cried and Entrance",m:[10,7,4,2],o:["Psalm 140 (141) and following, with the stichera of the day","Entrance with the censer (or with the Gospel book)","O Joyful Light"],a:[[],["fewer stichera"],["two stichera only"],["Entrance and O Joyful Light only"]]},
    {t:"Readings and Let My Prayer Arise",read:true,m:[12,9,6,3],o:["Prokeimenon; reading from Genesis","The Light of Christ illumines all","Prokeimenon; reading from Proverbs","Let my prayer arise (Psalm 140), sung kneeling"],a:[[],[],["one Old Testament reading"],["Let my prayer arise only"]]},
    {t:"Litanies",m:[6,3,1.5,0.5],o:["Litany of Fervent Supplication","Litany for the Catechumens (and, from Mid-Lent, for those preparing for Illumination)","Litanies of the Faithful"],a:[[],["Catechumens' litanies omitted"],["one short litany"],["litanies omitted"]]},
    {t:"Great Entrance",m:[6,5,3,2],o:["Now the powers of heaven… (the Presanctified Gifts carried in silence, all prostrate)","Litany and prayer of the offering"],a:[[],[],["litany shortened"],["the hymn only"]]},
    {t:"Communion",m:[6,5,3.5,2],o:["Litany before the Lord's Prayer; Our Father","The Presanctified Holy Things for the holy","Communion hymn: O taste and see","Communion; I will bless the Lord at all times"],a:[[],[],["litany shortened"],["Our Father and Communion only"]],comm:true},
    {t:"Dismissal",m:[4,3,2,1],o:["Litany of thanksgiving","Prayer before the Ambo","Blessed be the name of the Lord; Dismissal"],a:[[],[],["litany omitted"],["Dismissal only"]]},
  ];
  const basil=kind==="basil";
  return [
    {t:"Opening and Great Litany",m:[5,4,2,1],o:["Blessed is the Kingdom of the Father, and of the Son, and of the Holy Spirit","Great Litany (Litany of Peace)"],a:[[],[],["Great Litany shortened to its opening and closing petitions"],["one petition and the doxology"]]},
    {t:sun?"Typika and Beatitudes":"Antiphons",m:[sun?8:6,5,3,1],o:sun?["Psalm 102 (103) (the first Typikon)","Little Litany","Psalm 145 (146) and Only-begotten Son","Little Litany","Beatitudes with troparia of the day"]:["First Antiphon with its refrain","Little Litany","Second Antiphon and Only-begotten Son","Little Litany","Third Antiphon"],a:[[],["one or two verses of each"],["refrains only; Little Litanies omitted"],["Only-begotten Son only"]]},
    {t:"Little Entrance and Trisagion",m:[7,5,3,1],o:["Little Entrance with the Gospel book: Come, let us worship…","Troparia and kontakia of the day","Trisagion: Holy God, Holy Mighty, Holy Immortal, have mercy on us"],a:[[],[],["one troparion and one kontakion"],["Trisagion sung once"]]},
    {t:"Prokeimenon, Apostol and Gospel",m:[7,6,5,2.5],o:null,a:[[],[],["Alleluia verses shortened"],["the Apostol omitted; Gospel only"]],read:true},
    {t:"Litanies after the Gospel",m:[sun?6:7,3,1.5,0.5],o:["Litany of Fervent Supplication"].concat(sun?[]:["Litany for the Departed"],["Litany for the Catechumens","Litanies of the Faithful"]),a:[[],[sun?"Catechumens' litanies omitted":"Departed and Catechumens' litanies omitted"],["one short litany"],["litanies omitted"]]},
    {t:"Cherubic Hymn and Great Entrance",m:[14,11,7,2.5],o:["Cherubic Hymn","Great Entrance with the Gifts","Litany of the Offering","Kiss of Peace: Let us love one another…","Symbol of Faith (the Creed)"],a:[[],["Cherubic Hymn at a brisker tempo"],["Litany of the Offering shortened; Creed recited"],["Creed omitted"]]},
    {t:`Anaphora${basil?" of St Basil":""}`,m:basil?[20,15,8,3]:[10,8,6,3],o:["Let us stand well… A mercy of peace, a sacrifice of praise","It is right and just… Holy, holy, holy",inst,"Your own of your own we offer to you… (anamnesis)","Epiclesis: the calling down of the Holy Spirit",basil?"Hymn to the Theotokos: In you, O full of grace, all creation rejoices":"Hymn to the Theotokos: It is truly right (or the hymn of the feast)","Commemorations: And all mankind…"],a:[[],[basil?"anaphora prayers said quietly while the people sing":"anaphora prayers said quietly"],["commemorations shortened"],["core only: dialogue, Holy holy, institution, epiclesis, Amen"]]},
    {t:"Lord's Prayer and Communion",m:[6,5,3.5,1.5],o:["Litany before the Lord's Prayer","Our Father","Holy Things for the holy. One is holy…","Communion hymn","Prayer before Communion: I believe, O Lord, and I confess…","Communion","We have seen the true light…; Let our mouths be filled…"],a:[[],[],["litany shortened"],["Our Father, I believe O Lord, Communion"]],comm:true},
    {t:"Thanksgiving and Dismissal",m:[5,3.5,2,1],o:["Litany of Thanksgiving","Prayer before the Ambo","Blessed be the name of the Lord"+(sun?"":" and Psalm 33 (34)"),"Dismissal"],a:[[],sun?[]:["Psalm 33 (34) omitted"],["litany omitted"],["Dismissal only"]]},
  ];
}
const BYZ_POS={
  "Opening and Great Litany":[["stand","throughout, as is the Byzantine custom"],["cross","at each doxology"]],
  "Little Entrance and Trisagion":[["bow","as the Gospel book passes"],["cross","at each Holy God"]],
  "Prokeimenon, Apostol and Gospel":[["sit","for the Apostol, where customary"],["stand","for the Gospel"],["cross","before and after the Gospel"]],
  "Litanies after the Gospel":[["bow","at Bow your heads unto the Lord"]],
  "Cherubic Hymn and Great Entrance":[["bow","as the Gifts pass"]],
  "Anaphora":[["stand","on Sundays and in Paschaltide"],["kneel","on weekdays where customary, at the epiclesis"],["cross","at Amen, Amen, Amen"]],
  "Lord's Prayer and Communion":[["bow","at Bow your heads"],["cross","before receiving"]],
  "Thanksgiving and Dismissal":[["cross","at the dismissal"],["bow","venerate the cross and receive the antidoron"]],
  "Vespers: Opening and Kathisma":[["stand"],["cross","at each doxology"]],
  "Readings and Let My Prayer Arise":[["sit","for the readings"],["kneel","during Let my prayer arise"]],
  "Great Entrance":[["prostrate","as the Presanctified Gifts pass in silence"]],
  "Dismissal":[["prostrate","at the Prayer of St Ephrem"]],
};
function byzRole(x){
  if(/^Words of institution/.test(x)) return "cel";
  if(/Litany|Litanies/.test(x)) return "srv ppl";
  if(/^Prokeimenon/.test(x)) return "lec ppl";
  if(/reading from|^The Light of Christ/.test(x)) return "lec";
  if(/Entrance|Blessed is the Kingdom|Anaphora|anamnesis|Epiclesis|Commemorations|Prayer before the Ambo|^Dismissal|Holy Things|Let us stand well|It is right and just|prayer of the offering|^Blessed is the Kingdom|Words of institution|Priest-only Eucharistic prayer/i.test(x)) return /Entrance/.test(x)?"cel srv":"cel";
  return "all";
}
/* Full text of the Liturgies of St John Chrysostom and St Basil from Hapgood's Service Book (1906, public
   domain), compiled by tools/byz_texts.py into data/byz-liturgy.json. Parts map onto byzParts() by index. */
const BYZ_PART={opening:0,antiphons:1,entrance:2,readings:3,litanies:4,faithful:4,cherubic:5,offering:5,creed:5,anaphora:6,prelord:7,communion:7,thanks:8,after:8};
const BYZ_PRES={"pres-vespers":0,"pres-lic":1,"pres-readings":2,"pres-litanies":3,"pres-faithful":3,"pres-entrance":4,"pres-communion":5,"pres-dismissal":6};
const BYZ_WHO={P:["cel","Priest"],D:["srv","Deacon"],C:["ppl","Choir"],R:["lec","Reader"],L:["all","All"],PD:["cel srv","Priest and Deacon"]};
/* Same reckoning as byzTone() in today.js: Thomas Sunday begins Tone 1; Palm Sunday and Holy Week have none. */
function byzToneOf(iso){
  const d=toDate(iso); let E=easterY(d.getUTCFullYear()); if(d<E) E=easterY(d.getUTCFullYear()-1);
  const sun=new Date(d.getTime()-d.getUTCDay()*DAY), thomas=new Date(E.getTime()+7*DAY);
  if(d<thomas) return 0;
  const nextE=easterY(E.getUTCFullYear()+1); if(d>=new Date(nextE.getTime()-7*DAY)) return 0;
  return ((Math.round((sun-thomas)/DAY/7))%8+8)%8+1;
}
function byzEnv(iso,kind){
  const d=toDate(iso), off=fromEaster(d), sun=d.getUTCDay()===0, pascha=off>=0&&off<=38;
  return {kind,pascha,departed:!sun&&!pascha,tone:sun?byzToneOf(iso):0,sun,illum:off>=-25&&off<=-4};
}
/* Hapgood's propers of the Great Feasts (data/byz-liturgy.json "feasts"), by fixed date or by distance from Pascha;
   Bright Week keeps the Paschal hymns. Two may meet (the Annunciation in Holy Week): both are returned. */
function byzFeasts(iso,D){
  if(!D||!D.feasts) return [];
  const d=toDate(iso), off=fromEaster(d), md=iso.slice(5);
  return [D.feasts[md], D.feasts["p"+(off>=0&&off<7?0:off)]].filter(Boolean);
}
const BYZ_TONE=n=>n?`, Tone ${["","I","II","III","IV","V","VI","VII","VIII"][n]}`:"";
function byzOk(it,env){ return (it.if||[]).every(c=>c==="chrys"?env.kind==="chrys":c==="basil"?env.kind==="basil":c==="pascha"?env.pascha:c==="departed"?env.departed:c==="feast"?env.feast:c==="illumination"?env.illum:/^tone\d$/.test(c)?env.tone===+c.slice(4):false); }
async function byzFull(ctx,kind,veil,AB){
  let D; try{ D=await J("data/byz-liturgy.json"); }catch(e){ return null; }
  const env=byzEnv(ctx.iso,kind), b=ctx.day.b, out=Array(9).fill(""), MAP=kind==="pres"?BYZ_PRES:BYZ_PART;
  const rd=b?b.r:[], vesp=rd.filter(x=>/^Vespers/.test(x[0]));
  env.feast=rd.some(x=>/^Gospel/.test(x[0]));
  const FX=kind==="pres"?[]:byzFeasts(ctx.iso,D), FXN=FX.length?cue("The hymns of the feast are from the Special Services in Hapgood's Service Book."):"";
  for(const part of D.parts){
    const n=MAP[part.key]; if(n===undefined||(part.key==="after"&&AB>=1)) continue;
    let h="", quiet=[];
    /* Prayers said quietly (with the rubrics between them) fold into one closed block. */
    const flush=()=>{ if(!quiet.length) return; const sp=quiet.filter(x=>x.t==="s"), who=sp.every(x=>x.w==="D")?"the deacon":sp.some(x=>x.w==="D")?"the priest and deacon":"the priest"; h+=`<details class="secret"><summary>Said quietly by ${who}</summary><div class="txt one">${quiet.map(x=>x.t==="r"?`<p class="rub">${inl(x.x)}</p>`:veil&&x.w==="P"&&CONS_RE.test(x.x||"")?veilCue():`<p data-r="${BYZ_WHO[x.w][0]}"><span class="sp">${BYZ_WHO[x.w][1]}.</span> ${inl(x.x)}</p>`).join("")}</div></details>`; quiet=[]; };
    const items=part.items.filter(it=>byzOk(it,env));
    const quietNext=i=>{ for(let k=i+1;k<items.length;k++){ if(items[k].t==="r") continue; return items[k].t==="s"&&!!items[k].q; } return false; };
    for(let i=0;i<items.length;i++){
      const it=items[i];
      if(it.t==="s"&&it.q){ quiet.push(it); continue; }
      if(it.t==="r"&&quiet.length&&quietNext(i)){ quiet.push(it); continue; }
      if(it.t==="r"&&!quiet.length&&quietNext(i)&&/secretly|privately|low voice|to himself|silently/i.test(it.x)){ quiet.push(it); continue; }
      flush();
      if(it.t==="r"){ h+=`<p class="rub">${inl(it.x)}</p>`; if(/^Here shall be sung the Second Antiphon/.test(it.x)) h+=FX.filter(f=>f.ant2).map(f=>`<p class="rub">On ${esc(f.t)}, the refrain of the second festal antiphon:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(f.ant2)}</p>`).join(""); continue; }
      if(it.t==="slot"){
        if(it.n==="troparia"&&FX.length){
          const T=env.tone&&D.tones?D.tones[env.tone]:null;
          if(T&&!FX.some(f=>f.t==="Holy Pascha")) h+=`<p class="rub">Troparion of the Resurrection, Tone ${env.tone}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(T.troparion)}</p>`;
          for(const f of FX) h+=`<p class="rub">Troparion of ${esc(f.t)}${BYZ_TONE(f.troparion_tone)}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(f.troparion)}</p>`;
          for(const f of FX) if(f.kontakion) h+=`<p class="rub">Kontakion of ${esc(f.t)}${BYZ_TONE(f.kontakion_tone)}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(f.kontakion)}</p>`;
          if(FX.some(f=>!f.kontakion)) h+=cue("Hapgood gives no kontakion for this feast: take it from your church's books.");
          h+=FXN;
        }
        else if(it.n==="prokeimenon"&&FX.some(f=>f.prokeimenon)){ for(const f of FX) if(f.prokeimenon) h+=`<p class="rub">Prokeimenon of the feast${BYZ_TONE(f.prokeimenon_tone)}:</p><p data-r="lec"><span class="sp">Reader.</span> ${inl(f.prokeimenon)}</p>`; }
        else if(it.n==="alleluia"&&FX.some(f=>f.alleluia)){ for(const f of FX) if(f.alleluia) h+=`<p class="rub">Alleluia of the feast${BYZ_TONE(f.alleluia_tone)}, with the verse:</p><p data-r="lec"><span class="sp">Reader.</span> ${inl(f.alleluia)}</p>`; }
        else if(it.n==="troparia"){
          const T=env.tone&&D.tones?D.tones[env.tone]:null;
          if(T) h+=`<p class="rub">Troparion of the Resurrection, Tone ${env.tone}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(T.troparion)}</p>`+cue("Then the troparion of the temple and of the saint of the day, from your church's books.")+`<p class="rub">Kontakion of the Resurrection, Tone ${env.tone}:</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(T.kontakion)}</p>`+cue("Then the other kontakia of the day, ending with the kontakion of the Birth-giver of God.");
          else h+=cue("Troparia and kontakia of the day: from the Octoechos, Menaion or Triodion (your church's books).");
        }
        else if(it.n==="prokeimenon"&&!env.tone) h+=cue("Prokeimenon of the day (on weekdays and feasts it replaces the Sunday prokeimenon of the tone below).");
        else if(it.n==="alleluia") h+=cue("Alleluia with the verses of the tone or of the day.");
        else if((it.n==="epistle"||it.n==="gospel")&&b){ const lab=it.n==="epistle"?"Apostol":"Gospel"; for(const x of b.r) if(x[0].split(" · ")[0]===lab) h+=await RB(ctx,x[0],x[1],"n","dr",false); }
        else if(it.n==="genesis"||it.n==="proverbs"){ const x=vesp[it.n==="genesis"?0:1]; h+=x?await RB(ctx,x[0].replace(/^Vespers · /,""),x[1],"n","dr",false):cue(`The ${it.n==="genesis"?"first":"second"} Old Testament reading of the day (Genesis, or in Holy Week Exodus).`); }
        else if(it.n==="psalm104") h+=cue("Psalm 103 (104), Bless the Lord, O my soul, read by the Reader.");
        else if(it.n==="stichera"||it.n==="dogmatikon") h+=cue(it.n==="stichera"?"Stichera of the day from the Triodion and Menaion (your church's books).":"Theotokion (dogmatikon) in the tone of the week (your church's books).");
        else if(/^prokeimenon\d$/.test(it.n)) h+=cue("Prokeimenon of the day from the Triodion.");
        else if(it.n==="gospel"&&!b) h+=cue("Today's Apostol and Gospel follow the weekday lectionary; see the Byzantine lectionary.");
        continue;
      }
      /* the feast's own hymns where the book appoints a substitute */
      if(FX.length&&it.t==="s"){
        const sub=(key,lab)=>FX.filter(f=>f[key]).map(f=>`<p class="rub">${lab} (${esc(f.t)}):</p><p data-r="ppl"><span class="sp">Choir.</span> ${inl(f[key])}</p>`).join("");
        if(/^Meet is it, in truth/.test(it.x)&&FX.some(f=>f.meet)){ h+=sub("meet","In place of Meet is it"); continue; }
        if(/^O Holy God, Holy Mighty.*Five times/.test(it.x)&&FX.some(f=>f.trisagion)){ h+=sub("trisagion","In place of the Thrice-Holy"); continue; }
        if(/^Praise ye the Lord from heaven/.test(it.x)&&FX.some(f=>f.communion)){ h+=sub("communion","The Communion Hymn of the feast"); continue; }
        if(/^O come, let us worship and fall down before Christ/.test(it.x)&&FX.some(f=>f.introit)){ h+=`<p data-r="ppl"><span class="sp">Choir.</span> ${inl(it.x)}</p>`+sub("introit","The Introit of the feast"); continue; }
      }
      if(it.i||(veil&&it.w==="P"&&CONS_RE.test(it.x||""))){ h+=veil?veilCue():`<p class="emph" data-r="cel"><span class="sp">Priest.</span> ${inl(it.x)}</p>`; continue; }
      const [role,lab]=BYZ_WHO[it.w];
      h+=`<p data-r="${role}"><span class="sp">${lab}.</span> ${inl(it.x)}${it.re?` <span class="resp" data-r="ppl"><span class="sp">℟.</span> ${esc(it.re)}</span>`:""}</p>`;
    }
    flush();
    if(h) out[n]+=`<div class="txt one">${h}</div>`;
  }
  return {html:out,source:D.source,url:D.url};
}
async function buildByz(ctx, opts){
  const {iso,day}=ctx; const b=day.b; const out=[]; const AB=opts.abridge||0;
  const sun=toDate(iso).getUTCDay()===0;
  const L=byzLiturgy(iso); const kind=opts.byzlit&&opts.byzlit!=="auto"?opts.byzlit:(L.k==="none"?"chrys":L.k);
  const NAME={chrys:"The Divine Liturgy of St John Chrysostom",basil:"The Divine Liturgy of St Basil the Great",pres:"The Liturgy of the Presanctified Gifts"};
  const FULL=AB<2?await byzFull(ctx,kind,!!opts.veil,AB):null;
  let intro=cue(FULL?`${NAME[kind]}${L.why&&kind===L.k?`, as appointed for ${L.why}`:""}, in the English of Isabel Hapgood's Service Book (1906): the Russian (Greco-Russian) usage of that time, in public domain. Your church's current translation, commemorations and customs differ in places.`:`${NAME[kind]}${L.why&&kind===L.k?`, as appointed for ${L.why}`:""}. Shortened: the order is given in outline, with today's Scripture.`);
  if(L.k==="none") intro+=cue(L.why+" The Liturgy is shown for practice.");
  if(L.note&&kind==="chrys") intro+=cue(L.note);
  if(kind==="pres") intro+=cue("The Presanctified is Vespers joined to Holy Communion from Gifts consecrated at the previous Sunday's Liturgy; there is no anaphora.");
  const parts=byzParts(kind,sun,!!opts.veil);
  for(let n=0;n<parts.length;n++){
    const p=parts[n]; let h=n===0?intro:"";
    const lo=Math.min(Math.floor(AB),3), f=AB-lo; let min=p.m[lo]+(f>0&&lo<3?(p.m[lo+1]-p.m[lo])*f:0); /* fractional levels: a brisker or slower pace between two levels */
    h+=pos(BYZ_POS[p.t]||(/^Anaphora/.test(p.t)?BYZ_POS.Anaphora:null));
    if(FULL&&FULL.html[n]){
      h+=FULL.html[n];
      if(p.read&&opts.homily>0){ h+=pos([["sit","for the homily"]])+`<div class="homily" data-r="cel"><span class="lbl">Homily</span> ≈ ${opts.homily} min</div>`; min+=opts.homily; }
    } else if(p.read){
      if(b){ h+=`<p class="cite">${esc(b.t)}${b.s?` · ${esc(b.s)}`:""}</p>`; for(const x of b.r){ if(AB>=3&&x[0]==="Apostol") continue; if(x[0]==="Apostol") h+=cue("Prokeimenon in the tone of the day."); h+=await RB(ctx,x[0],x[1],"n","dr",false); if(x[0]==="Apostol") h+=cue("Alleluia with verses of the tone."); } }
      else h+=cue("Prokeimenon, Apostol, Alleluia and Gospel: today's readings follow the weekday lectionary; see the Byzantine lectionary.");
      if(p.o) h+=`<ol class="order">${p.o.map(x=>`<li data-r="${byzRole(x)}">${esc(x)}</li>`).join("")}</ol>`;
      if(opts.homily>0){ h+=pos([["sit","for the homily"]])+`<div class="homily" data-r="cel"><span class="lbl">Homily</span> ≈ ${opts.homily} min</div>`; min+=opts.homily; }
    } else h+=`<ol class="order">${p.o.map(x=>`<li data-r="${byzRole(x)}">${esc(x)}</li>`).join("")}</ol>`;
    if(p.hom&&opts.homily>0){ h+=`<div class="homily" data-r="cel"><span class="lbl">Homily</span> ≈ ${opts.homily} min</div>`; min+=opts.homily; }
    if(p.comm){ h+=`<div class="homily" data-r="all"><span class="lbl">Communion of the faithful</span> ≈ ${opts.communion} min</div>`; min+=opts.communion; }
    const cut=[]; for(let l=1;l<=Math.round(AB);l++) cut.push(...(p.a[l]||[]).filter(Boolean)); h+=abr(cut);
    out.push(sec(p.t,min,h));
  }
  return out;
}

/* ---------------------------------------------------------------- controls + render */
const MASS_NUM=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII"];
const TG_MAX=125; /* slider value meaning "full length" */
const TG_CHIPS=[15,20,30,45,60,0];
function controls(rite, opts, iso, day, auto){
  const P=Object.entries(PRESETS).map(([k,v])=>`<button type="button" class="pre${opts.preset===k?" on":""}" data-pre="${k}" aria-pressed="${opts.preset===k}"><b>${v.label}</b><span>${v.desc}</span></button>`).join("");
  const trad=rite==="m"||rite==="p"||rite==="h", oo=!!ORDO_ONLY[rite]||isPB(rite)||rite==="bcp79"||rite==="csb"||!!ORDER_RITES[rite], byz=rite==="b"||oo;
  const chk=(id,lab,on)=>`<label class="ck"><input type="checkbox" data-o="${id}"${on?" checked":""}> ${lab}</label>`;
  const tg=+opts.target||0;
  const target=`<div class="target">
      <div class="trow"><label for="tgRange" class="lbl">Session length</label><output id="tgOut" for="tgRange">${tg?`${tg} minutes`:"Full length"}</output></div>
      <input type="range" id="tgRange" min="15" max="${TG_MAX}" step="5" value="${tg||TG_MAX}" data-o="target" aria-valuetext="${tg?tg+" minutes":"Full length"}">
      <div class="tscale" aria-hidden="true"><span>15 min</span><span>1 hour</span><span>Full</span></div>
      <div class="tchips" role="group" aria-label="Quick lengths">${TG_CHIPS.map(v=>`<button type="button" class="tchip${tg===v?" on":""}" data-tg="${v}" aria-pressed="${tg===v}">${v?v+" min":"Full"}</button>`).join("")}</div>
    </div>`;
  const music=byz?"":`<fieldset><legend>Hymns</legend>${chk("hymns.entrance",trad?"Processional":"Entrance",opts.hymns.entrance)}${chk("hymns.offertory","Offertory",opts.hymns.offertory)}${chk("hymns.communion","Communion",opts.hymns.communion)}${chk("hymns.recessional","Recessional",opts.hymns.recessional)}</fieldset>
        <fieldset><legend>Chant</legend>
          <label class="sl">Ordinary <select data-o="ordinary"><option value="sung"${opts.ordinary==="sung"?" selected":""}>Sung</option><option value="said"${opts.ordinary==="said"?" selected":""}>Said</option></select></label>
          <label class="sl">Setting <select data-o="mass"><option value="">Of the day (Mass ${auto})</option>${MASS_NUM.map(n=>`<option value="${n}"${opts.mass===n?" selected":""}>Mass ${n}</option>`).join("")}</select></label>
          <label class="sl">Credo <select data-o="credo">${["I","III","IV"].map(n=>`<option${(opts.credo||"III")===n?" selected":""}>${n}</option>`).join("")}</select></label>
          ${trad?`<label class="sl">Propers <select data-o="propers"><option value="chant"${opts.propers==="chant"?" selected":""}>Gregorian chant</option><option value="said"${opts.propers!=="chant"?" selected":""}>Said</option></select></label>`:""}
          ${chk("asperges","Asperges / Vidi aquam on Sundays",opts.asperges)}${chk("marian","Marian antiphon at the end",opts.marian)}
        </fieldset>`;
  return `<div class="mctlbox">
    ${target}
    ${byz?"":`<div class="presets" role="group" aria-label="Music">${P}</div>`}
    <details class="custom"${opts.openCustom?" open":""}><summary>Customize ${byz?"timing":"music and timing"}</summary>
      <div class="cgrid">
        ${music}
        <fieldset><legend>Timing</legend>
          ${rite==="bcp79"?`<label class="sl">Rite and prayer <select data-o="p79">${[["II-A","Rite Two · Prayer A"],["II-B","Rite Two · Prayer B"],["II-C","Rite Two · Prayer C"],["II-D","Rite Two · Prayer D"],["I-I","Rite One · Prayer I"]].map(([v,n])=>`<option value="${v}"${(opts.p79||"II-A")===v?" selected":""}>${n}</option>`).join("")}</select></label><label class="sl">Prayers of the People <select data-o="pop79">${["I","II","III","IV","V","VI"].map(v=>`<option${(opts.pop79||"I")===v?" selected":""}>Form ${v}</option>`.replace(`<option`,`<option value="${v}"`)).join("")}</select></label>`:""}
          ${ORDER_RITES[rite]&&ORDER_RITES[rite].sel?`<label class="sl">${ORDER_RITES[rite].sel.label} <select data-o="${ORDER_RITES[rite].sel.key}">${ORDER_RITES[rite].sel.opts.map(([v,n])=>`<option value="${v}"${(opts[ORDER_RITES[rite].sel.key]||ORDER_RITES[rite].sel.opts[0][0])===v?" selected":""}>${n}</option>`).join("")}</select></label>`:""}
          ${ORDER_RITES[rite]&&ORDER_RITES[rite].supper?`<label class="sl">The Lord's Supper <select data-o="supper"><option value="no"${opts.supper!=="yes"?" selected":""}>Not celebrated</option><option value="yes"${opts.supper==="yes"?" selected":""}>Celebrated after the Sermon</option></select></label>`:""}
          ${rite==="csb"&&iso&&iso.slice(5)==="12-25"?`<label class="sl">Christmas <select data-o="csbset"><option value="later"${opts.csbset!=="early"?" selected":""}>For a later service</option><option value="early"${opts.csbset==="early"?" selected":""}>For an early service</option></select></label>`:""}
          ${rite==="csb"?`<label class="sl">Holy Communion <select data-o="csbcomm"><option value="yes"${opts.csbcomm!=="no"?" selected":""}>Celebrated</option><option value="no"${opts.csbcomm==="no"?" selected":""}>Not celebrated (The Service ends after the General Prayer)</option></select></label>`:""}
          ${rite==="b"?`<label class="sl">Liturgy <select data-o="byzlit">${[["auto","Of the day"],["chrys","St John Chrysostom"],["basil","St Basil the Great"],["pres","Presanctified Gifts"]].map(([v,n])=>`<option value="${v}"${(opts.byzlit||"auto")===v?" selected":""}>${n}</option>`).join("")}</select></label>`:""}
          <label class="sl">${rite==="o"||trad||oo?"Sermon":"Homily"} <select data-o="homily">${[0,3,5,8,10,12,15,20].map(n=>`<option value="${n}"${+opts.homily===n?" selected":""}>${n?n+" min":"None"}</option>`).join("")}</select></label>
          <label class="sl">Communion <select data-o="communion">${[2,4,6,8,10,15].map(n=>`<option value="${n}"${+opts.communion===n?" selected":""}>${n} min</option>`).join("")}</select></label>
          ${rite==="n"?`<label class="sl">Eucharistic Prayer <select data-o="ep">${["I","II","III","IV"].map(n=>`<option${opts.ep===n?" selected":""}>${n}</option>`).join("")}</select></label>${chk("up","Universal Prayer",opts.up)}`:""}
          ${rite==="o"?chk("up","Prayers of the People",opts.up)+chk("lastGospel","Last Gospel",opts.lastGospel):""}
          ${trad||rite==="d"?chk("leonine","Leonine prayers after Low Mass",opts.leonine)+chk("lastGospel","Last Gospel",opts.lastGospel!==false):""}
          ${trad||(ORDO_ONLY[rite]&&ORDO_ONLY[rite].lat)?`<label class="sl">Text <select data-o="lang"><option value="both"${opts.lang==="both"?" selected":""}>Latin and English</option><option value="la"${opts.lang==="la"?" selected":""}>Latin</option><option value="en"${opts.lang==="en"?" selected":""}>English</option></select></label>`:""}
        </fieldset>
      </div>
    </details>
    <p class="note" id="audioNote" hidden>This browser can't play audio here. The notation and texts still work for singing or speaking.</p>
  </div>`;
}
/* Steps that shorten a session, gentlest first, for each rite. The fitter applies them in order and stops once the target is met. */
function ladder(rite){
  const trad=rite==="m"||rite==="p"||rite==="h", byz=rite==="b";
  if(rite==="bcp79") return [["Sermon held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }],
    ["Prayers of the People: Form IV; Eucharistic Prayer A", o=>{ o.pop79="IV"; if(String(o.p79||"II-A").startsWith("II")) o.p79="II-A"; }],
    ["No sermon; Communion 2 minutes", o=>{ o.homily=0; o.communion=Math.min(+o.communion,2); }]];
  if(ORDER_RITES[rite]) return [["Sermon held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }],
    ["No sermon; Communion 2 minutes", o=>{ o.homily=0; o.communion=Math.min(+o.communion,2); }],
    ...(ORDER_RITES[rite].supper?[["Without the Lord's Supper", o=>{ o.supper="no"; }]]:[]),
    ...(ORDER_RITES[rite].optional?[[ORDER_RITES[rite].optLabel, o=>{ o.abridge=1; },"ab"]]:[])];
  if(rite==="csb") return [["Sermon held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }],
    ["No sermon; Communion 2 minutes", o=>{ o.homily=0; o.communion=Math.min(+o.communion,2); }],
    ["Without Holy Communion", o=>{ o.csbcomm="no"; }],
    ["The Epistle left out", o=>{ o.abridge=3; },"ab"]];
  if(isPB(rite)) return [["Sermon held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }],
    [rite==="bcp28"?"The Decalogue left out (Summary of the Law instead)":"The Ten Commandments left out", o=>{ o.abridge=1; },"ab"],
    ["No sermon; Communion 2 minutes", o=>{ o.homily=0; o.communion=Math.min(+o.communion,2); }],
    ["The Epistle left out", o=>{ o.abridge=3; },"ab"]];
  if(ORDO_ONLY[rite]) return [["Sermon held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }],
    ["Last Gospel and prayers after Mass left out", o=>{ o.lastGospel=false; o.leonine=false; }],
    ["No sermon; Communion 2 minutes", o=>{ o.homily=0; o.communion=Math.min(+o.communion,2); }]];
  const S=[];
  if(!byz){
    S.push(["Asperges and Marian antiphon left out", o=>{ o.asperges=false; o.marian=false; },"music"]);
    if(trad) S.push(["Propers said rather than chanted", o=>{ o.propers="said"; },"music"]);
    S.push(["Offertory hymn left out", o=>{ o.hymns.offertory=false; },"music"],
           ["Entrance and recessional hymns left out", o=>{ o.hymns.entrance=false; o.hymns.recessional=false; },"music"],
           ["Communion hymn left out", o=>{ o.hymns.communion=false; },"music"],
           ["Ordinary said rather than sung", o=>{ o.ordinary="said"; },"music"]);
  }
  S.push(["Homily held to 5 minutes, Communion to 4", o=>{ o.homily=Math.min(+o.homily,5); o.communion=Math.min(+o.communion,4); }]);
  if(trad) S.push(["Leonine prayers and Last Gospel left out", o=>{ o.leonine=false; o.lastGospel=false; }]);
  if(rite==="n") S.push(["Universal Prayer left out; Eucharistic Prayer II", o=>{ o.up=false; o.ep="II"; }]);
  if(rite==="o") S.push(["Prayers of the People and Last Gospel left out", o=>{ o.up=false; o.lastGospel=false; }]);
  S.push([trad?"Light abridgment: Psalm 42 (Júdica me), the celebrant's private prayers, incense, extra lessons":rite==="o"?"Light abridgment: Second Reading, Summary of the Law, Comfortable Words":byz?"Light abridgment: antiphons in part; Litanies for the Departed and the Catechumens left out":"Light abridgment: Second Reading left out", o=>{ o.abridge=1; },"ab"],
         ["Homily 2 minutes, Communion 2", o=>{ o.homily=Math.min(+o.homily,2); o.communion=Math.min(+o.communion,2); }],
         [trad?"Consolidated: no Creed or Gradual, the Canon reduced to its core":rite==="o"?"Consolidated: Gospel only, no Creed, the Canon reduced to its core":byz?"Consolidated: refrains only, one troparion and kontakion, litanies shortened":"Consolidated: Gospel only, no Creed", o=>{ o.abridge=2; },"ab"],
         ["No homily", o=>{ o.homily=0; }],
         ["Skeleton: only the essential dialogues and prayers", o=>{ o.abridge=3; },"ab"],
         ["Communion of the faithful held to 1 minute", o=>{ o.communion=Math.min(+o.communion,1); }]);
  return S;
}
const clone=o=>JSON.parse(JSON.stringify(o));
const sumMin=parts=>parts.reduce((a,p)=>a+(p.min||0),0);
const mmss=sec=>{ sec=Math.max(0,Math.round(sec)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(s).padStart(2,"0"); };

/* ---------------------------------------------------------------- Divine Office: timed steps
   The hours are given as an order of steps (official texts are mostly not reproduced). Each step gets an
   estimated length and a shortening profile: the factor applied at abridgment levels 0-3. */
const OFF_KINDS=[
  [/Kathisma/i,15,[1,.5,.25,.1],"psalms","one stasis of the kathisma","a few verses","omitted"],
  [/Nocturns/i,22,[1,.6,.35,.15],"psalms","one nocturn, fewer psalms","one psalm and one lesson","a psalm verse and a short lesson"],
  [/Six Psalms/i,8,[1,.6,.35,.15],"psalms","in part","two psalms","one psalm"],
  [/Psalm 50 and Psalm 118/i,22,[1,.5,.25,.1],"psalms","Psalm 118 in part","one stasis of Psalm 118","Psalm 50 only"],
  [/canon/i,15,[1,.4,.15,0],"canon","odes 1, 3, 6, 8 and 9 only","one ode","omitted"],
  [/Lord, I have cried|stichera|Aposticha|Lauds \(Pss/i,7,[1,.6,.3,.1],"hymnody","fewer stichera","two stichera","one sticheron"],
  [/Great Doxology/i,3,[1,1,.6,.4],"hymnody","","said","said"],
  [/^(Psalmody|The Psalms|Psalmi|Psalms?\b|Five psalms|Three psalms|Small Compline|Psalms under|@psalms|The psalms appointed|Psalms \(|Psalms 5|Psalms 16|Psalms 53|Psalms 83)/i,6,[1,.6,.35,.2],"psalms","fewer psalms or sections","one psalm","a few verses of one psalm"],
  [/Hymn|Te lucis|Jam lucis/i,1.5,[1,1,0,0],"hymn","","omitted","omitted"],
  [/Te Deum|Benedicite/i,2.5,[1,1,0,0],"canticle","","omitted","omitted"],
  [/Invitatory|Venite|Jubilate/i,2.5,[1,.6,.3,0],"canticle","psalm in part","antiphon and first verse","omitted"],
  [/Benedictus|Magnificat/i,2,[1,1,1,.7],"gospel canticle","","","said briskly"],
  [/Nunc dimittis|Song of Simeon/i,1,[1,1,1,1],"gospel canticle","","",""],
  [/Second reading|Second Lesson/i,6,[1,.7,.4,0],"reading","shorter passage","a few lines","omitted"],
  [/First reading|First Lesson|Old Testament readings|paremias|Resurrection Gospel|Evlogitaria/i,5,[1,.8,.5,.3],"reading","shorter passage","a few lines","one verse"],
  [/Short reading|Chapter|short lesson/i,.75,[1,1,1,1],"reading","","",""],
  [/Responsor|Verse|versicle|Preces|Acclamation|Prokeimenon/i,.5,[1,1,.6,0],"responsory","","said once","omitted"],
  [/Intercessions|Suffrages|Prayers and thanksgivings|Prayers; dismissal|Troparia and prayers/i,2.5,[1,.6,.3,0],"prayers","fewer intentions","one intention","omitted"],
  [/Great Litany|Litan/i,3,[1,.6,.3,.1],"litany","fewer petitions","opening and closing petitions","one petition"],
  [/Martyrology/i,2,[1,0,0,0],"optional","omitted","omitted","omitted"],
  [/Examination|Confession|Confiteor|penitence/i,2,[1,1,.5,.25],"penitence","","brief silence","a moment of silence"],
  [/Marian|antiphon to the Blessed|Anthem/i,1,[1,1,0,0],"optional","","omitted","omitted"],
  [/Creed|Credo/i,1,[1,1,.6,0],"creed","","said","omitted"],
  [/Entrance|Phos hilaron|O Joyful Light/i,2,[1,1,.6,.4],"entrance","","brief","O Joyful Light only"],
  [/Troparion|kontakion|Kontakion|Apolytikion/i,1.5,[1,1,.5,.5],"hymnody","","one troparion","one troparion"],
  [/Trisagion prayers/i,1.5,[1,1,1,.7],"prayers","","",""],
  [/Lord's Prayer|Pater|Our Father|Lesser Litany and Lord/i,.75,[1,1,1,1],"prayer","","",""],
  [/Collect|prayer|Prayer|Blessing|Dismissal|dismissal|Grace|Deus in adjutorium|Introductory|opening|Opening|Royal beginning|Jube domne|Converte nos/i,.75,[1,1,1,1],"prayer","","",""],
];
const OFF_ROLE={psalms:"all",hymn:"all",canticle:"all","gospel canticle":"all",hymnody:"all",creed:"all",prayer:"cel",prayers:"cel ppl",litany:"cel ppl",reading:"lec",responsory:"lec ppl",penitence:"all",optional:"all",entrance:"cel",canon:"all"};
function officeEst(text){
  for(const [re,min,f,kind,...notes] of OFF_KINDS) if(re.test(text)){
    let m=min; if(kind==="psalms"){ const n=(text.match(/\b(two|three|five) psalms\b/i)||[])[1]; if(n) m={two:4.5,three:6,five:9}[n.toLowerCase()]||m; }
    return {min:m,f,kind,notes:["",...notes]};
  }
  return {min:1,f:[1,1,.6,.4],kind:"prayer",notes:["","","in brief","in brief"]};
}
/* generated Breviary text carries chant as <pre class=gabc>: turn it into playable widgets */
function gchWidgets(html){
  let secs=0;
  const out=html.replace(/<div class=gch data-r=all data-t="([^"]*)"><pre class=gabc>([\s\S]*?)<\/pre><\/div>/g,(m,t,g)=>{
    const gabc=g.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,"&");
    const name=(/name:\s*([^;\n]*)/.exec(gabc)||[])[1]||t||"Chant";
    secs+=M().chantSeconds(gabc);
    return `<div data-r="all">${M().chantWidget(name.trim(),gabc,"Divinum Officium · Gregorian chant")}</div>`;
  });
  return {html:out,secs};
}
async function buildOffice(ctx,o){
  const AB=o.abridge||0, lo=Math.min(Math.floor(AB),3), fr=AB-lo, out=[];
  const steps=o.chant&&ctx.office.alt?ctx.office.alt:ctx.office.steps;
  steps.forEach((x,i)=>{
    const e=officeEst(x.t); if(x.min) e.min=x.min;
    let slot=x.slot||""; if(slot.includes("class=gch")){ const g=gchWidgets(slot); slot=g.html; if(g.secs) e.min=Math.max(e.min,g.secs/60); }
    const fac=e.f[lo]+(fr>0&&lo<3?(e.f[lo+1]-e.f[lo])*fr:0), lvl=Math.round(AB);
    const m=/^([^:;(]+?)\s*[:;]\s*(.+)$/.exec(x.t); const title=m&&m[1].length<48?m[1]:x.t.split(/\s*\(/)[0].slice(0,60);
    const note=lvl>0?e.notes[Math.min(lvl,3)]:"";
    let h=i===0?(ctx.office.intro||""):"";
    if(fac<=0.001){ h+=abr(`${title.toLowerCase()}${note&&note!=="omitted"?": "+note:""}`); out.push(sec(title,0,h,"ostep")); return; }
    h+=`<div data-r="${OFF_ROLE[e.kind]||"all"}">${m&&m[1].length<48&&!x.slot?cue(m[2]):(title!==x.t&&!x.slot?cue(x.t):"")}${slot}</div>`;
    if(note) h+=abr(`${title.toLowerCase()}: ${note}`);
    let min=e.min*fac; if(x.slot&&!x.min){ const w=readSecs(x.slot,0)/60; if(w>min&&e.kind!=="psalms") min=w*Math.max(fac,.3); }
    out.push(sec(title,min,h,"ostep"));
  });
  return out;
}

/* Steps that shorten a session, gentlest first, for each rite. The fitter applies them in order and stops once the target is met. */
function officeLadder(){ return [["Lighter: fewer psalms, shorter readings, optional parts left out",o=>{o.abridge=1;},"ab"],["Consolidated: one psalm, short readings, no hymn",o=>{o.abridge=2;},"ab"],["Skeleton: opening, a psalm verse, the Gospel canticle and the prayers",o=>{o.abridge=3;},"ab"]]; }

async function render(el, ctx){
  const isOffice=!!ctx.office, rite=isOffice?"office-"+ctx.office.rite:ctx.rite, store=isOffice?rite+"-"+ctx.office.hour:rite;
  const following=!!ctx.liveOpts;
  let opts=following?{...loadOpts(store),...clone(ctx.liveOpts)}:loadOpts(store);
  const OCC=/(bap|mat|bur)$/.test(rite);
  const noun=isOffice?"hour":OCC?"service":/^(b|copt|arm|adai)$/.test(rite)?"Liturgy":/^(n|o|m|p|h|d|a|z)$/.test(rite)?"Mass":/^(csbm|csbv|csbs|csbsm|csbse|byzv|byzm|byzh|byzc|wes84o|rcusv|csbl|rcusp)$/.test(rite)?"office":"service";
  const build=async(o)=>{ USED=new Set(); ROLE="cel";
    if(isOffice) return buildOffice(ctx,o);
    if(rite==="m") return buildTrad(ctx,"1962",o);
    if(rite==="p") return buildTrad(ctx,"pre55",o);
    if(rite==="h") return buildTrad(ctx,"1962",o);
    if(rite==="o") return buildOrd(ctx,o);
    if(rite==="b") return buildByz(ctx,o);
    if(ORDO_ONLY[rite]) return buildOrdoOnly(ctx,o);
    if(isPB(rite)) return buildPB(ctx,o,rite);
    if(rite==="csb") return buildCSB(ctx,o);
    if(ORDER_RITES[rite]) return buildOrders(ctx,o,rite);
    if(rite==="bcp79") return buildPB79(ctx,o);
    return buildNO(ctx,o); };
  const continuous=isOffice||rite==="b";
  const fit=async(base)=>{
    const tgt=+base.target||0; let o=clone(base); o.abridge=0;
    let parts=await build(o), tot=sumMin(parts); const full=tot, cuts=[], adds=[];
    if(!tgt) return {parts,tot,full,cuts,adds,tgt,o};
    if(tot>tgt+0.49){
      const L=isOffice?officeLadder():ladder(rite), on=[]; const make=idx=>{ const n=clone(base); n.abridge=0; idx.forEach(k=>L[k][1](n)); return n; };
      for(let k=0;k<L.length;k++){ const n=make(on.concat(k)); if(JSON.stringify(n)===JSON.stringify(o)) continue;
        on.push(k); o=n; parts=await build(o); tot=sumMin(parts); if(tot<=tgt+0.49) break; }
      /* Byzantine parts and Office steps shorten continuously (tempo, number of verses): settle between the last two levels */
      if(continuous&&on.length&&L[on[on.length-1]][2]==="ab"&&tot<=tgt+0.49){ const hi=o.abridge; let a=0,z=1;
        for(let it=0;it<7;it++){ const f=(a+z)/2, n=clone(o); n.abridge=hi-1+f; const p2=await build(n), t2=sumMin(p2); if(t2<=tgt+0.49){ z=f; o=n; parts=p2; tot=t2; } else a=f; } }
      /* the last step can overshoot: put back earlier music cuts that still fit, latest first */
      for(let q=on.length-2;q>=0&&tgt-tot>=1.5;q--){ if(L[on[q]][2]!=="music") continue; const trial=on.filter((_,x)=>x!==q); const n=make(trial); const p2=await build(n), t2=sumMin(p2);
        if(t2<=tgt+0.49&&t2>tot+0.2){ on.splice(q,1); o=n; parts=p2; tot=t2; } }
      on.forEach(k=>cuts.push(L[k][0]));
      /* then give back homily and Communion time, up to the chosen values and in proportion to the session */
      const room=tgt-tot;
      if(room>=1.5&&!isOffice){ const n=clone(o); let d=room;
        const hm=Math.min(Math.min(+base.homily||0,Math.round(tgt*0.12))-(+n.homily||0),Math.floor(d)); if(hm>0){ n.homily=(+n.homily||0)+hm; d-=hm; }
        const cm=Math.min(Math.min(+base.communion||0,Math.max(2,Math.round(tgt*0.1)))-(+n.communion||0),Math.floor(d)); if(cm>0){ n.communion=(+n.communion||0)+cm; }
        if(JSON.stringify(n)!==JSON.stringify(o)){ const p2=await build(n), t2=sumMin(p2); if(t2<=tgt+0.49){ o=n; parts=p2; tot=t2; adds.push(`Homily ${n.homily} min and Communion ${n.communion} min, to use the time left`); } } }
    } else if(tgt-tot>=1.5&&!isOffice){
      const n=clone(o); let d=tgt-tot;
      const hm=Math.min(20-(+n.homily||0),Math.round(d*0.6)); if(hm>0){ n.homily=(+n.homily||0)+hm; d-=hm; adds.push(`homily lengthened to ${n.homily} minutes`); }
      const cm=Math.min(15-(+n.communion||0),Math.round(d)); if(cm>0){ n.communion=(+n.communion||0)+cm; adds.push(`Communion time ${n.communion} minutes`); }
      if(adds.length){ o=n; parts=await build(n); tot=sumMin(parts); }
    }
    return {parts,tot,full,cuts,adds,tgt,o};
  };
  const draw=async()=>{
    if(!isOffice){ opts.veil=!window.LectParticipation.isPriest(); window.LectParticipation.setRite(rite); }
    VEILING=!!opts.veil&&!isOffice;
    window.LectMusic&&window.LectMusic.stopAll();
    const auto=isOffice?"":defaultMass(ctx.iso,ctx.day,rite);
    const ctl=following?`<div class="mctlbox"><p class="note livenote">Following a live session: the host sets the length and music.</p></div>`:(isOffice?officeControls(opts,!!ctx.office.alt):controls(rite,opts,ctx.iso,ctx.day,auto));
    /* Phones open on the service itself: the settings and the timeline fold away (and keep whatever the reader chose). */
    const wide=matchMedia("(min-width:701px)").matches, was=k=>{ const d=el.querySelector("details."+k); return d?d.open:wide; };
    const sOpen=was("msettings"), rOpen=was("mrun");
    el.innerHTML=`<details class="msettings"${sOpen?" open":""}><summary>Settings<span class="msum"> · ${isOffice||OCC?"length and music":following?"live session":"length, music and participation"}</span></summary>${(isOffice||OCC?"":window.LectParticipation.controls(rite))+ctl}</details><div class="mtotal" aria-live="polite">Building the ${noun}…</div><div class="mbody"></div>`;
    let F;
    try{ F=await fit(opts); }
    catch(e){ F={parts:[sec(`Could not build the ${noun}`,0,cue("Some of the data for this day failed to load. Try again, or choose another day."))],tot:0,full:0,cuts:[],adds:[],tgt:0,o:opts}; console.error(e); }
    const {parts,tot,full,cuts,adds,tgt}=F; el.__fit={tot,full,cuts,adds,tgt,parts:parts.map(p=>[p.title,+(p.min||0).toFixed(2)])};
    let at=0; const starts=parts.map(p=>{ const s0=at; at+=Math.max(0,p.min||0)*60; return s0; });
    const status=!tgt?"":tot<=tgt+0.49?`<span class="tg ok">Fits ${tgt} min${cuts.length?` · shortened from ${Math.round(full)}`:""}</span>`:`<span class="tg over">Shortest this ${noun} goes is about ${Math.round(tot)} min</span>`;
    const changes=cuts.length||adds.length?`<details class="cuts"><summary>${cuts.length?`What was shortened (${cuts.length} step${cuts.length>1?"s":""})`:"What was lengthened"}</summary><ol>${cuts.concat(adds).map(c=>`<li>${esc(c)}</li>`).join("")}</ol>${tgt&&tot<tgt-1.5&&!cuts.length?`<p class="note">Still about ${Math.round(tgt-tot)} min short: ${isOffice?"the hour is shorter than that.":"add hymns or chant above to fill it."}</p>`:""}</details>`:"";
    el.querySelector(".mtotal").innerHTML=`<div class="tophead"><span class="tt">About ${Math.max(1,Math.round(tot))} minute${Math.round(tot)===1?"":"s"}</span>${status}<span class="tools-timer"></span></div>
      <details class="mrun"${rOpen?" open":""}><summary>Timeline · ${parts.filter(p=>(p.min||0)>=0.1).length} parts</summary><ol class="runsheet">${parts.map((p,i)=>`<li data-i="${i}"${(p.min||0)<0.1?" hidden":""}><time>${mmss(starts[i])}</time> <a href="#mp-${i}">${esc(p.title)}</a> <b>${(p.min||0)<0.5?"&lt;1":Math.round(p.min)}′</b></li>`).join("")}</ol>${changes}</details><div class="tools-bar"></div>`;
    el.querySelector(".mbody").innerHTML=parts.map((p,i)=>p.html.replace('<section class="mpart','<section id="mp-'+i+'" data-i="'+i+'" class="mpart')).join("");
    if(window.LectTexts) window.LectTexts.decorate(el.querySelector(".mbody"),ctx,()=>draw());
    window.LectParticipation.annotate(el,isOffice);
    if(!isOffice&&!OCC&&!following) window.LectParticipation.ask();
    const modeSelect=el.querySelector("#participation-mode");
    if(modeSelect)modeSelect.addEventListener("change",()=>window.LectParticipation.setMode(modeSelect.value));
    if(window.LectTools) window.LectTools.mount(el,{parts:parts.map(p=>({title:p.title,min:p.min})),starts,total:at,ctx,opts:clone(opts),noun,isOffice,rite:ctx.rite,following,
      roles:isOffice?{cel:"Officiant",lec:"Reader",ppl:"All"}:{cel:"Celebrant",srv:rite==="b"?"Deacon":"Server",lec:"Lector",ppl:"Congregation"}});
    const calendar=el.parentElement?.querySelector("#lessonCalendar");
    if(calendar)window.LectCalendar.mount(calendar,{...ctx,type:isOffice?"office":"mass",hour:ctx.hour||opts.hour||null},ctx.readingBlock,()=>isOffice?window.LectApp.follow(window.LectApp.current()):el.__redraw());
    if(following) return;
    // controls
    const keepOpen=()=>{ const d=el.querySelector("details.custom"); opts.openCustom=!!(d&&d.open); };
    el.querySelectorAll(".pre").forEach(b=>b.addEventListener("click",()=>{ keepOpen(); const k=b.dataset.pre; opts={...opts,...clone(PRESETS[k]),preset:k}; saveOpts(store,opts); draw(); }));
    el.querySelectorAll(".tchip[data-tg]").forEach(b=>b.addEventListener("click",()=>{ keepOpen(); opts.target=+b.dataset.tg; saveOpts(store,opts); draw(); }));
    const rg=el.querySelector("#tgRange"), out=el.querySelector("#tgOut");
    if(rg){ rg.addEventListener("input",()=>{ const v=+rg.value; out.textContent=v>=+rg.max?"Full length":`${v} minutes`; rg.setAttribute("aria-valuetext",out.textContent); }); }
    el.querySelectorAll("[data-o]").forEach(inp=>inp.addEventListener("change",()=>{ keepOpen(); const k=inp.dataset.o; let v=inp.type==="checkbox"?inp.checked:(/^(homily|communion|target)$/.test(k)?+inp.value:inp.value);
      if(k==="target"){ opts.target=v>=+inp.max?0:v; saveOpts(store,opts); draw(); return; }
      if(k.startsWith("hymns.")){ opts.hymns={...opts.hymns,[k.slice(6)]:v}; } else opts[k]=v; if(!/^(veil|lang|byzlit)$/.test(k)) opts.preset="custom"; saveOpts(store,opts); draw(); }));
    el.querySelectorAll(".hsel").forEach(sel=>sel.addEventListener("change",()=>{ keepOpen(); opts.choice={...(opts.choice||{}),[sel.dataset.slot]:sel.value}; saveOpts(store,opts); draw(); }));
  };
  el.__redraw=draw;
  /* A change of participation (the Participation setting or the first-time question) redraws this guide. */
  if(el.__onMode){ window.removeEventListener("lect-participation",el.__onMode); el.__onMode=null; }
  if(!isOffice){ const onMode=()=>{ if(!el.isConnected){ window.removeEventListener("lect-participation",onMode); return; } if(el.__redraw===draw&&opts.veil===window.LectParticipation.isPriest()) draw(); }; el.__onMode=onMode; window.addEventListener("lect-participation",onMode); }
  await draw();
}
function officeControls(opts,chant){
  const tg=+opts.target||0, MAXO=opts.__max||65;
  return `<div class="mctlbox"><div class="target">
      <div class="trow"><label for="tgRange" class="lbl">Length of the hour</label><output id="tgOut" for="tgRange">${tg?`${tg} minutes`:"Full length"}</output></div>
      <input type="range" id="tgRange" min="5" max="${MAXO}" step="5" value="${tg||MAXO}" data-o="target" aria-valuetext="${tg?tg+" minutes":"Full length"}">
      <div class="tscale" aria-hidden="true"><span>5 min</span><span>30 min</span><span>Full</span></div>
      <div class="tchips" role="group" aria-label="Quick lengths">${[5,10,15,20,30,0].map(v=>`<button type="button" class="tchip${tg===v?" on":""}" data-tg="${v}" aria-pressed="${tg===v}">${v?v+" min":"Full"}</button>`).join("")}</div>
    </div>${chant?`<label class="ck"><input type="checkbox" data-o="chant"${opts.chant?" checked":""}> Chant: antiphons and psalms in Gregorian chant (Latin), with notation and playback</label>`:""}<p class="note">Times are estimates for saying the hour at a steady pace; sung or choir recitation takes longer.</p></div>`;
}
window.LectMass={render};
})();
