(function(){
"use strict";
const D = JSON.parse(document.getElementById("lect-data").textContent);
const T = D.T, N = D.N, H = D.H;
const X = JSON.parse(document.getElementById("lect-extra").textContent);
const B = X.BYZ, LOH = X.LOH, BRV = X.BRV;

/* ---------------------------------------------------------------- dates */
const DAY = 864e5;
const U = (y,m,d)=>new Date(Date.UTC(y,m-1,d));
const add = (dt,n)=>new Date(dt.getTime()+n*DAY);
const dow = dt=>dt.getUTCDay();
const iso = dt=>dt.toISOString().slice(0,10);
function easter(Y){ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),
  g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
  mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return U(Y,mo,da); }
function adv1(Y){ const xmas=U(Y,12,25); const w=dow(xmas); return add(xmas, -(w===0?7:w) - 21); }
function sundayIn(Y,m,d1,d2){ for(let d=d1; d<=d2; d++){ const t=U(Y,m,d); if(dow(t)===0) return t; } return null; }
function lastSundayOct(Y){ let t=U(Y,10,31); while(dow(t)!==0) t=add(t,-1); return t; }
function yearLetter(Y){ return ["C","A","B"][(Y+1)%3]; }

function fixedFeasts(Y, push){
  const Z=Y+1;
  push(U(Y,12,8),"Immaculate");
  push(U(Z,2,2),"Presentation"); push(U(Z,3,19),"StJoseph"); push(U(Z,3,25),"Annunciation");
  push(U(Z,6,24),"JohnBaptist"); push(U(Z,6,29),"PeterPaul"); push(U(Z,8,6),"Transfiguration");
  push(U(Z,8,15),"Assumption"); push(U(Z,11,1),"AllSaints");
  const souls=U(Z,11,2); push(dow(souls)===0?add(souls,1):souls,"AllSouls");
}

function tradYear(Y){
  const out=[], push=(d,k)=>out.push({d,k});
  const A=adv1(Y), Z=Y+1, E=easter(Z), nextA=adv1(Z);
  for(let i=0;i<4;i++) push(add(A,7*i),"Adv"+(i+1));
  fixedFeasts(Y,push);
  ["Christmas-Midnight","Christmas-Dawn","Christmas-Day"].forEach(k=>push(U(Y,12,25),k));
  const so=sundayIn(Y,12,26,31); if(so) push(so,"SunOctChristmas");
  push(U(Z,1,1),"Jan1");
  push(sundayIn(Z,1,2,5)||U(Z,1,2),"HolyName");
  push(U(Z,1,6),"Epiphany");
  const hf=sundayIn(Z,1,7,13); push(hf,"HolyFamily");
  const sept=add(E,-63); let s=add(hf,7), n=2;
  while(s<sept && n<=6){ push(s,"Epi"+n); n++; s=add(s,7); }
  push(sept,"Septuagesima"); push(add(E,-56),"Sexagesima"); push(add(E,-49),"Quinquagesima"); push(add(E,-46),"AshWed");
  for(let i=1;i<=5;i++) push(add(E,-49+7*i),"Lent"+i);
  push(add(E,-7),"PalmSunday"); push(add(E,-3),"HolyThursday"); push(add(E,-2),"GoodFriday"); push(add(E,-1),"EasterVigil");
  push(E,"Easter"); for(let i=1;i<=5;i++) push(add(E,7*i),"Pasc"+i);
  push(add(E,39),"Ascension"); push(add(E,42),"SunAfterAscension"); push(add(E,48),"PentecostVigil"); push(add(E,49),"Pentecost");
  push(add(E,56),"Trinity"); push(add(E,60),"CorpusChristi"); push(add(E,68),"SacredHeart");
  const suns=[]; for(let t=add(E,63); t<nextA; t=add(t,7)) suns.push(t);
  const S=suns.length, keys=[];
  if(S>=23){ for(let i=2;i<=23;i++) keys.push("Pent"+i); const extra=S-23;
    for(let j=7-extra;j<=6;j++) keys.push(j>=3?"PentEpi"+j:"PentEpi3"); keys.push("Pent24"); }
  else { for(let i=2;i<=S;i++) keys.push("Pent"+i); keys.push("Pent24"); }
  suns.forEach((t,i)=>push(t,keys[i]));
  push(lastSundayOct(Z),"ChristKing");
  return out;
}

function noYear(Y){
  const out=[], push=(d,k)=>out.push({d,k});
  const A=adv1(Y), Z=Y+1, E=easter(Z), nextA=adv1(Z), CK=add(nextA,-7);
  for(let i=0;i<4;i++) push(add(A,7*i),"Adv"+(i+1));
  fixedFeasts(Y,push);
  ["Christmas-Midnight","Christmas-Dawn","Christmas-Day"].forEach(k=>push(U(Y,12,25),k));
  push(sundayIn(Y,12,26,31)||U(Y,12,30),"HolyFamily");
  push(U(Z,1,1),"Jan1");
  const c2=sundayIn(Z,1,2,5); if(c2) push(c2,"Christmas2");
  push(U(Z,1,6),"Epiphany");
  const bap=sundayIn(Z,1,7,13); push(bap,"Baptism");
  const ash=add(E,-46); let s=add(bap,7), n=2;
  while(s<ash){ push(s,"OT"+n); n++; s=add(s,7); }
  push(ash,"AshWed"); for(let i=1;i<=5;i++) push(add(E,-49+7*i),"Lent"+i);
  push(add(E,-7),"PalmSunday"); push(add(E,-3),"HolyThursday"); push(add(E,-2),"GoodFriday"); push(add(E,-1),"EasterVigil");
  push(E,"Easter"); for(let i=2;i<=7;i++) push(add(E,7*(i-1)),"Easter"+i);
  push(add(E,39),"Ascension"); push(add(E,48),"PentecostVigil"); push(add(E,49),"Pentecost");
  push(add(E,56),"Trinity"); push(add(E,60),"CorpusChristi"); push(add(E,68),"SacredHeart");
  for(let t=add(E,63); t<CK; t=add(t,7)){ const num=34-Math.round((CK-t)/DAY/7); if(num>=2) push(t,"OT"+num); }
  push(CK,"ChristKing");
  return noPrecedence(out, E);
}
/* Table of liturgical days (Universal Norms 59-61): one celebration per date on the post-conciliar side. */
const NO_SOL=new Set(["Immaculate","StJoseph","Annunciation","JohnBaptist","PeterPaul","Assumption","AllSaints"]);
const NO_LORD=new Set(["Presentation","Transfiguration"]);
const NO_PRIV=k=>/^(Adv\d|Lent\d|Easter\d?|PalmSunday|Pentecost|AshWed|HolyThursday|GoodFriday|EasterVigil)$/.test(k);
function noPrecedence(list, E){
  const fixedKeys=new Set([...NO_SOL,...NO_LORD,"AllSouls"]);
  const byDay=new Map(); list.forEach(x=>{ const k=iso(x.d); if(!byDay.has(k)) byDay.set(k,[]); byDay.get(k).push(x); });
  const out=[], moved=[];
  for(const [day,xs] of byDay){
    const fixed=xs.filter(x=>fixedKeys.has(x.k)), other=xs.filter(x=>!fixedKeys.has(x.k));
    if(!fixed.length||!other.length){ out.push(...xs); continue; }
    const f=fixed[0], d=f.d, holyWeek=d>=add(E,-7)&&d<E, octave=d>=E&&d<=add(E,7);
    if(other.some(o=>NO_PRIV(o.k))||holyWeek||octave){
      out.push(...other);
      if(f.k==="Annunciation"&&(holyWeek||octave)) moved.push({d:add(E,8),k:f.k,moved:true});
      else if(f.k==="StJoseph"&&holyWeek) moved.push({d:add(E,-8),k:f.k,moved:true});
      else if(NO_SOL.has(f.k)) moved.push({d:add(d,1),k:f.k,moved:true});
    } else if(NO_SOL.has(f.k)||NO_LORD.has(f.k)||f.k==="AllSouls"){ out.push(f, ...other.filter(o=>!SUNDAYISH(o.k))); }
    else out.push(...xs);
  }
  return out.concat(moved);
}

/* ---------------------------------------------------------------- readings */
const OTBOOKS=new Set(["Gen","Exod","Lev","Num","Deut","Josh","Judg","Ruth","1 Sam","2 Sam","1 Kgs","2 Kgs","1 Chr","2 Chr","Ezra","Neh","Tob","Jdt","Esth","1 Macc","2 Macc","Job","Ps","Prov","Eccl","Song","Wis","Sir","Isa","Jer","Lam","Bar","Ezek","Dan","Hos","Joel","Amos","Obad","Jonah","Mic","Nah","Hab","Zeph","Hag","Zech","Mal"]);
const book=c=>{ const m=/^((?:[1-4] )?[A-Za-z]+)/.exec(c||""); return m?m[1]:""; };
const isOT=c=>OTBOOKS.has(book(c));

function noReadings(k,y){
  const e=N[k] && N[k][y]; if(!e) return [];
  const r=[];
  const lab = (k==="EasterVigil") ? "Reading" : (/^(Easter|Pentecost$|Ascension)/.test(k) && e.first[0] && e.first[0].startsWith("Acts")) ? "Acts" : "OT";
  const alt=a=>a.length?[a.join(" or ")]:[];
  if(k==="EasterVigil") e.first.forEach((c,i)=>r.push(["Reading "+(i+1), c]));
  else alt(e.first).forEach(c=>r.push([lab,c]));
  if(k!=="EasterVigil") e.psalm.slice(0,1).forEach(c=>r.push(["Psalm",c]));
  alt(e.second).forEach(c=>r.push(["Apostle",c]));
  alt(e.gospel).forEach(c=>r.push([k==="PalmSunday"||k==="GoodFriday"?"Passion":"Gospel",c]));
  if(k==="PalmSunday" && N.PalmSunday) r.unshift(["Procession", {A:"Matt 21:1-11",B:"Mark 11:1-10 or John 12:12-16",C:"Luke 19:28-40"}[y]]);
  return r;
}
function tradReadings(k,form){ const t=T[k]; if(!t) return []; return (form==="p"?t.p:t.m).map(x=>[shortLab(x[0]),x[1]]); }
function shortLab(l){ return l.replace(" (blessing of palms)"," · palms"); }

function hybridReadings(k){
  const t=T[k]; if(!t) return [];
  const h=H[k];
  if(k==="EasterVigil"||k==="PentecostVigil") return t.p.map(x=>[shortLab(x[0]),x[1],true]).map((x,i,arr)=>[x[0],x[1], k==="EasterVigil"? !t.m.some(m=>m[1]===x[1]) : !t.m.some(m=>m[1]===x[1])]);
  if(k==="PalmSunday"){ return [["Lesson · palms","Exod 15:27-16:7",true],["Gospel · palms","Matt 21:1-9"],["Prophecy",h.r,true],["Epistle","Phil 2:5-11"],["Passion","Matt 26:1-27:66",true]]; }
  const base=t.m.map(x=>[shortLab(x[0]),x[1]]);
  if(!h) return base;
  if(h.b==="apostle"){ const g=base.filter(x=>/Gospel|Passion/.test(x[0])), rest=base.filter(x=>!/Gospel|Passion/.test(x[0]));
    return [...rest.map(x=>[x[0]==="Epistle"?"Lesson":x[0],x[1]]), ["Apostle",h.r,true], ...g]; }
  if(k==="GoodFriday"){ return [...base.filter(x=>x[0]!=="Passion"), ["Lesson",h.r,true], ...base.filter(x=>x[0]==="Passion")]; }
  return [[h.b==="acts"?"Acts":"Prophecy",h.r,true], ...base];
}

/* ---------------------------------------------------------------- rows */
const SUNDAYISH=k=>/^(Adv|Epi|Pent\d|PentEpi|Septu|Sexa|Quinq|Lent|Pasc|Easter$|Easter\d|OT|SunOct|SunAfter|HolyFamily|HolyName|Baptism|Christmas2|Trinity|Pentecost$|PalmSunday)/.test(k);
const ORDER=k=>SUNDAYISH(k)?0:1;

function buildRows(Y){
  const byDate=new Map();
  const put=(list,side)=>list.forEach(({d,k})=>{ const key=iso(d); if(!byDate.has(key)) byDate.set(key,{d,t:[],n:[]}); byDate.get(key)[side].push(k); });
  put(tradYear(Y),"t"); put(noYear(Y),"n");
  const rows=[];
  [...byDate.values()].sort((a,b)=>a.d-b.d).forEach(g=>{
    const sorter=(a,b)=>ORDER(a)-ORDER(b);
    g.t.sort(sorter); g.n.sort(sorter);
    // pair identical keys first (feasts, Christmas Masses), then by order
    const tLeft=[...g.t], nLeft=[...g.n], pairs=[];
    tLeft.slice().forEach(k=>{ const alias={Pasc1:"Easter2",Pasc2:"Easter3",Pasc3:"Easter4",Pasc4:"Easter5",Pasc5:"Easter6",SunAfterAscension:"Easter7",SunOctChristmas:"HolyFamily",HolyFamily:"Baptism",HolyName:"Christmas2"}[k]||k;
      const j=nLeft.indexOf(alias); if(j>=0){ pairs.push([k,alias]); tLeft.splice(tLeft.indexOf(k),1); nLeft.splice(j,1);} });
    const ck=tLeft.indexOf("ChristKing"); if(ck>0){ tLeft.splice(ck,1); tLeft.unshift("ChristKing"); }
    while(tLeft.length||nLeft.length) pairs.push([tLeft.shift()||null, nLeft.shift()||null]);
    pairs.sort((a,b)=>(a[0]==="ChristKing"?-1:0)-(b[0]==="ChristKing"?-1:0) || Math.min(ORDER(a[0]||"x"),ORDER(a[1]||"x"))-Math.min(ORDER(b[0]||"x"),ORDER(b[1]||"x")));
    pairs.forEach(([tk,nk])=>rows.push({d:g.d,tk,nk}));
  });
  // Christ the King (1962) displaces that Sunday: mark it
  rows.forEach(r=>{ if(r.tk && /^Pent|^PentEpi/.test(r.tk) && rows.some(o=>o.tk==="ChristKing" && +o.d===+r.d)) r.displaced=true; });
  tradPrecedence(rows, Y);
  return rows;
}


/* Traditional side: a fixed feast and the Sunday it falls on (1962 and Divino Afflatu agree for these feasts). */
const T_FIX=new Set(["Immaculate","Presentation","StJoseph","Annunciation","JohnBaptist","PeterPaul","Transfiguration","Assumption","AllSaints"]);
const T_PRIV=k=>/^(Adv1|Lent\d|PalmSunday|Easter|Pasc1|Pentecost)$/.test(k);
function tradPrecedence(rows, Y){
  const E=easter(Y+1), byDay=new Map();
  rows.forEach(r=>{ if(!r.tk) return; const k=iso(r.d); if(!byDay.has(k)) byDay.set(k,[]); byDay.get(k).push(r); });
  for(const rs of byDay.values()){
    const f=rs.find(r=>T_FIX.has(r.tk)); if(!f) continue;
    const fname=(T[f.tk]&&T[f.tk].n)||f.tk, d=f.d;
    if(f.tk==="Annunciation"&&d>=add(E,-7)&&d<=add(E,7)){ f.tnote=`In Holy Week or Easter Week: transferred to Monday ${fmt.format(add(E,8))}`; continue; }
    if(f.tk==="StJoseph"&&d>=add(E,-7)&&d<E){ f.tnote="In Holy Week: transferred (see the ordo for the date)"; continue; }
    const s=rs.find(r=>r!==f&&SUNDAYISH(r.tk)); if(!s) continue;
    const sname=(T[s.tk]&&T[s.tk].n)||s.tk;
    const sundayWins=f.tk!=="Immaculate"&&(T_PRIV(s.tk)||(f.tk==="Presentation"&&/^(Septuagesima|Sexagesima|Quinquagesima)$/.test(s.tk)));
    if(sundayWins) f.tnote=`${sname} takes precedence: the feast is transferred to Monday ${fmt.format(add(d,1))}`+(f.tk==="Presentation"?" (pre-1955; in 1962 it is commemorated)":"");
    else { s.displaced=true; s.tnote=`Displaced by ${fname} (the Sunday is commemorated)`; }
  }
}

/* ---------------------------------------------------------------- Byzantine */
function ord(n){ const s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
function byzFor(d, Y){
  const md=String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");
  if(dow(d)===0 && B.FEASTS[md] && (B.KIND||{})[md]!=="lord"){ const f=B.FEASTS[md]; const s=byzSunday(d,Y,md); if(s) return {n:s.n+" · "+f[0], r:[...s.r,["Apostol · feast",f[1]],["Gospel · feast",f[2]]], sub:"Feast kept with the Sunday"}; }
  return byzSunday(d,Y,md);
}
function byzSunday(d, Y, md){
  if(dow(d)!==0){ const f=B.FEASTS[md]; if(f) return {n:f[0], r:[["Apostol",f[1]],["Gospel",f[2]]]};
    const E=easter(Y+1), off=Math.round((d-E)/DAY); const m=B.MOVE[off]; if(m) return {n:m[0], r:[["Apostol",m[1]],["Gospel",m[2]]]};
    return null; }
  const E=easter(Y+1), off=Math.round((d-E)/DAY);
  if(off>=-77 && off<=49 && B.MOVE[off]){ const m=B.MOVE[off]; return {n:m[0], r:[["Apostol",m[1]],["Gospel",m[2]]]}; }
  const f=B.FEASTS[md]; if(f && (B.KIND||{})[md]==="lord") return {n:f[0], r:[["Apostol",f[1]],["Gospel",f[2]]]};
  // Sunday after Pentecost, counted from the Pentecost that governs this date
  const P = (off>49) ? add(E,49) : add(easter(Y),49);
  const n = Math.round((d-P)/DAY/7);
  const m=d.getUTCMonth()+1, day=d.getUTCDate();
  for(const fs of B.FIXEDSUN){ if(fs[0]===m && day>=fs[1] && day<=fs[2]) return {n:fs[3], r:[["Apostol",fs[4]],["Gospel",fs[5]]], sub:ord(n)+" Sunday after Pentecost"}; }
  const cyc = P.getUTCFullYear();
  const Sx = sundayIn(cyc,9,15,21);
  let gos, sub="";
  if(d>Sx){ const k=Math.round((d-Sx)/DAY/7); if(k<=14){ gos=B.LG[k]; sub=ord(k)+" Sunday of Luke"; } else { gos="Matt 15:21-28 (back-fill)"; sub="back-fill week"; } }
  else gos = n<=17 ? B.GM[n] : "Matt 15:21-28 (back-fill)";
  const ep = n<=31 ? B.EP[n] : (n===32 ? B.EP[32] : "Back-fill per ordo");
  return {n: n===1?"Sunday of All Saints":ord(n)+" Sunday after Pentecost", r:[["Apostol",ep],["Gospel",gos]], sub};
}

/* ---------------------------------------------------------------- Ordinariate names */
function ordinariateName(d, Y, nk){
  if(!nk || dow(d)!==0) return "";
  const E=easter(Y+1), off=Math.round((d-E)/DAY);
  const bap=sundayIn(Y+1,1,7,13);
  if(nk==="Baptism") return "1st Sunday after Epiphany (Baptism of the Lord)";
  if(off===-63) return "Septuagesima"; if(off===-56) return "Sexagesima"; if(off===-49) return "Quinquagesima";
  if(off===-14) return "Passion Sunday";
  if(off===49) return "Whitsunday";
  if(/^OT/.test(nk) && off<-63) return ord(Math.round((d-bap)/DAY/7)+1)+" Sunday after Epiphany";
  if(/^OT/.test(nk) && off>56) return ord(Math.round((off-56)/7))+" Sunday after Trinity";
  return "";
}

/* ---------------------------------------------------------------- render */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:"UTC"});
const fmtW=new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"UTC"});
const COLORS={violet:"--lit-violet",rose:"--lit-rose",green:"--lit-green",red:"--lit-red",white:"--lit-white",black:"--lit-black"};

function rdHTML(list){ return list.map(([l,c,addd])=>`<div class="rd${addd?" add":""}"><span class="l">${esc(l)}</span><span class="c">${esc(c)}</span></div>`).join(""); }
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

let state={Y:null,f:"all",q:""};
function currentLiturgicalYear(){ const now=new Date(); const y=now.getUTCFullYear(); return (now>=adv1(y))?y:y-1; }

function render(){
  const Y=state.Y, L=yearLetter(Y);
  $("#noHead").textContent=`Novus Ordo · Year ${L}`;
  $("#yearNote").innerHTML=`Advent ${fmt.format(adv1(Y))} ${Y} to ${fmt.format(add(adv1(Y+1),-1))} ${Y+1}. Easter falls on <b>${fmt.format(easter(Y+1))}</b>. The new lectionary reads <b>Year ${L}</b> (Sundays) and <b>Year ${(Y+1)%2? "I":"II"}</b> (weekdays).`;
  const rows=buildRows(Y);
  const q=state.q.trim().toLowerCase();
  const shown=[]; const tot={p:[0,0],m:[0,0],n:[0,0],h:[0,0],b:[0,0]};
  let html="";
  rows.forEach(r=>{
    const t=r.tk&&T[r.tk], nn=r.nk&&N[r.nk];
    const P=r.tk?tradReadings(r.tk,"p"):[], M=r.tk?tradReadings(r.tk,"m"):[], NR=r.nk?noReadings(r.nk,L):[], HR=r.tk?hybridReadings(r.tk):[];
    const firstOfDate = !rows.some(o=>+o.d===+r.d && rows.indexOf(o)<rows.indexOf(r));
    const BZ = firstOfDate || (r.tk==="Christmas-Day") ? byzFor(r.d, Y) : null;
    const BZshow = (r.tk && /^Christmas-(Midnight|Dawn)$/.test(r.tk)) ? null : BZ;
    const ordN = ordinariateName(r.d, Y, r.nk);
    const sun = dow(r.d)===0;
    const isFeast = !sun || (r.tk && !SUNDAYISH(r.tk)) || (r.nk && !SUNDAYISH(r.nk)) || /Palm|Easter$|Pentecost$/.test(r.tk||"");
    const diff = r.tk && !same(P,M);
    if(state.f==="sun" && !sun) return;
    if(state.f==="feast" && !isFeast) return;
    if(state.f==="diff" && !diff) return;
    const hay=[t&&t.n, nn&&nn.n, ordN, BZshow&&BZshow.n, ...(BZshow?BZshow.r.map(x=>x[1]):[]), ...P.map(x=>x[1]), ...M.map(x=>x[1]), ...NR.map(x=>x[1]), ...HR.map(x=>x[1])].join(" | ").toLowerCase();
    if(q && !hay.includes(q)) return;
    shown.push(r);
    [["p",P],["m",M],["n",NR],["h",HR],["b",BZshow?BZshow.r.filter(x=>!/back-fill|per ordo/i.test(x[1])):[]]].forEach(([k,l])=>{ const real=l.filter(x=>x[0]!=="Psalm"); tot[k][0]+=real.length; tot[k][1]+=real.filter(x=>isOT(x[1])).length; });
    const col = t ? t.c : (r.nk && /Lent|Adv|AshWed/.test(r.nk) ? "violet" : /OT/.test(r.nk||"") ? "green" : "white");
    const nm = t ? t.n : "";
    const tradCell = (list, label, isPre) => {
      if(!r.tk) return `<div class="cell"><span class="mlabel">${label}</span><span class="occ na">No proper Mass (weekday)</span></div>`;
      if(isPre && same(P,M)) return `<div class="cell"><span class="mlabel">${label}</span><span class="occ">${esc(nm)}</span><span class="same">Same as 1962</span></div>`;
      return `<div class="cell"><span class="mlabel">${label}</span><span class="occ">${esc(nm)}</span>${isPre&&diff?'<span class="diffmark">Differs from 1962</span>':''}${r.tnote?`<span class="note">${esc(r.tnote)}</span>`:(r.displaced&&!isPre?'<span class="note">Displaced by Christ the King (commemorated)</span>':'')}${rdHTML(list)}</div>`;
    };
    html+=`<div class="row">
      <div class="when"><span class="date">${fmt.format(r.d)}</span><span class="dow">${fmtW.format(r.d)}</span><span class="chip"><i style="background:var(${COLORS[col]||"--lit-white"})"></i>${col}</span></div>
      ${tradCell(P,"Pre-1955",true)}
      ${tradCell(M,"1962 Missal",false)}
      <div class="cell"><span class="mlabel">Novus Ordo · Year ${L}</span>${nn?`<span class="occ">${esc(nn.n)}</span>${ordN?`<span class="ord"><b>Ordinariate</b> ${esc(ordN)}</span>`:""}${rdHTML(NR)}`:`<span class="occ na">${r.displaced?"Same Sunday as the row above":r.tk==="HolyName"?"Weekday of Christmas Time":"Weekday or no proper reading"}</span>`}</div>
      <div class="cell"><span class="mlabel">Hybrid</span>${r.tk?`<span class="occ">${esc(nm)}</span>${rdHTML(HR)}`:`<span class="occ na">Weekday course</span>`}</div>
      <div class="cell"><span class="mlabel">Byzantine</span>${BZshow?`<span class="occ">${esc(BZshow.n)}</span>${BZshow.sub?`<span class="note">${esc(BZshow.sub)}</span>`:""}${rdHTML(BZshow.r)}`:`<span class="occ na">${(r.tk&&/^Christmas-(Midnight|Dawn)$/.test(r.tk))?"One Liturgy: see the Mass during the Day":firstOfDate?"No proper Liturgy readings listed":"See the row above"}</span>`}</div>
    </div>`;
  });
  $("#rows").innerHTML = html || `<p class="empty">No days match. Clear the search or choose another filter.</p>`;
  const S=(k,lab)=>`<div class="stat"><span class="k">${lab}</span><span class="v">${tot[k][0]} <small>readings · ${tot[k][1]} OT</small></span></div>`;
  $("#stats").innerHTML = S("p","Pre-1955")+S("m","1962 Missal")+S("n","Novus Ordo")+S("h","Hybrid")+S("b","Byzantine");
  renderOffice();
}


/* ---------------------------------------------------------------- office */
function firstSunday(Y,m,form){ // form 'pre55': Sunday nearest the 1st; '1962': first Sunday in the month
  const first=U(Y,m,1), w=dow(first);
  if(form==="1962") return add(first,(7-w)%7);
  return w<=3 ? add(first,-w) : add(first,7-w);
}
function breviary(d, tk, form){
  if(!tk) return null;
  const Yd=d.getUTCFullYear();
  if(/^(Pent\d|PentEpi)/.test(tk)){
    const aug=firstSunday(Yd,8,form);
    if(d<aug){ const v=BRV.tempora[tk]; return v?{c:v[form]}:{c:null, note:"Kings course ended before this Sunday"}; }
    let m=8; for(let mm=8;mm<=11;mm++){ if(d>=firstSunday(Yd,mm,form)) m=mm; }
    if(d>=firstSunday(Yd,12,form) && m===11) m=11;
    const w=Math.min(5, Math.round((d-firstSunday(Yd,m,form))/DAY/7)+1);
    const v=BRV.month[String(m).padStart(2,"0")+w];
    const mon=["","","","","","","","","August","September","October","November"][m];
    return v?{c:v[form], note:`${ord(w)} week of ${mon}`}:null;
  }
  const v=BRV.tempora[tk]; return v?{c:v[form]}:null;
}
function renderOffice(){
  const Y=state.Y, rows=buildRows(Y);
  $("#lohHead").textContent="Liturgia Horarum · Office of Readings";
  let html="";
  rows.forEach(r=>{
    if(dow(r.d)!==0 || r.displaced) return;
    const pa=breviary(r.d,r.tk,"pre55"), mb=breviary(r.d,r.tk,"1962");
    const lo=r.nk?LOH[r.nk]:null;
    if(!pa && !mb && !lo) return;
    const cell=(lab,o)=>`<div class="cell"><span class="mlabel">${lab}</span>${o&&o.c?`<div class="rd"><span class="l">${o.note?esc(o.note):"Lessons i–iii"}</span><span class="c">${esc(o.c)}</span></div>`:`<span class="occ na">${o&&o.note?esc(o.note):"Lessons of the feast or octave"}</span>`}</div>`;
    const differs = pa && mb && pa.c!==mb.c;
    html+=`<div class="office-grid r"><div class="when"><span class="date">${fmt.format(r.d)}</span><span class="dow">${esc(r.tk&&T[r.tk]?T[r.tk].n:(r.nk&&N[r.nk]?N[r.nk].n:""))}</span>${differs?'<span class="diffmark">Forms differ</span>':''}</div>
      ${cell("Pre-1955 Matins",pa)}${cell("1962 Matins",mb)}
      <div class="cell"><span class="mlabel">Liturgia Horarum</span>${lo?`<div class="rd"><span class="l">Reading I</span><span class="c">${esc(lo)}</span></div>`:`<span class="occ na">Proper of the day</span>`}</div></div>`;
  });
  $("#officeRows").innerHTML=html;
  $("#officeNote").textContent=`The first-nocturn lessons of Sunday Matins against the Sunday Office of Readings, for ${Y}–${String(Y+1).slice(2)}. Change the year on the Compare tab. Sundays where the pre-1955 and 1962 rules for the "first Sunday of the month" put a different lesson are marked.`;
}

/* ---------------------------------------------------------------- hybrid table */
function hybridTable(){
  const order=Object.keys(T).filter(k=>H[k] && !/^PentEpi/.test(k));
  const lab={match:"Same Gospel",parallel:"Parallel",chosen:"Chosen",apostle:"Apostle",acts:"Acts"};
  $("#hybridTable tbody").innerHTML = order.map(k=>{ const t=T[k], h=H[k]; const g=(t.m.filter(x=>/Gospel|Passion/.test(x[0])).slice(-1)[0]||["",""])[1];
    return `<tr><td>${esc(t.n)}</td><td class="num">${esc(g)}</td><td class="num">${esc(h.r)}</td><td><span class="basis b-${h.b}">${lab[h.b]}</span></td><td>${esc(h.f)}</td></tr>`; }).join("")
    + `<tr><td>Easter Vigil</td><td class="num">Matt 28:1-7</td><td>Twelve prophecies restored</td><td><span class="basis b-chosen">Pre-1955</span></td><td>Pre-1955 Holy Saturday</td></tr>`
    + `<tr><td>Vigil of Pentecost</td><td class="num">John 14:15-21</td><td>Six prophecies restored</td><td><span class="basis b-chosen">Pre-1955</span></td><td>Pre-1955 Vigil of Pentecost</td></tr>`;
}

/* ---------------------------------------------------------------- wiring */
function initYears(){
  const sel=$("#yearSel"), cur=currentLiturgicalYear();
  for(let y=cur-2;y<=cur+4;y++){ const o=document.createElement("option"); o.value=y; o.textContent=`${y}–${String(y+1).slice(2)} · Year ${yearLetter(y)}${y===cur?" (current)":""}`; sel.appendChild(o); }
  sel.value=cur; state.Y=cur;
  sel.addEventListener("change",()=>{ state.Y=+sel.value; render(); });
}
document.querySelectorAll("#filterSeg button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#filterSeg button").forEach(x=>x.setAttribute("aria-pressed", x===b?"true":"false"));
  state.f=b.dataset.f; render(); }));
let qt; $("#q").addEventListener("input",e=>{ clearTimeout(qt); qt=setTimeout(()=>{ state.q=e.target.value; render(); },120); });

const TABS=["today","day","compare","lectionaries","hybrid","changes","office","sources"];
function show(id){ if(id.startsWith("/")) return; if(!TABS.includes(id)) id="today";
  TABS.forEach(t=>{ document.getElementById(t).hidden = t!==id; document.getElementById("tab-"+t).setAttribute("aria-selected", t===id?"true":"false"); });
  try{ history.replaceState(null,"","#"+id); }catch(e){}
}
TABS.forEach(t=>document.getElementById("tab-"+t).addEventListener("click",()=>{ show(t); window.scrollTo({top:0}); }));
window.addEventListener("hashchange",()=>show(location.hash.slice(1)));

initYears(); render(); hybridTable(); show(location.hash.slice(1));
})();
