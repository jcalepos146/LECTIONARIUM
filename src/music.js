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
