/* ================================================================ MASS GUIDE (full missal) */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const M=()=>window.LectMusic;
const cache={};
const J=n=>cache[n]||(cache[n]=fetch(n).then(r=>{ if(!r.ok) throw new Error(n); return r.json(); }));
const DAY=864e5;
const toDate=iso=>{ const [y,m,d]=iso.split("-").map(Number); return new Date(Date.UTC(y,m-1,d)); };
function easterY(Y){ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(Date.UTC(Y,mo-1,da)); }
function adv1Y(Y){ const x=new Date(Date.UTC(Y,11,25)); const w=x.getUTCDay(); return new Date(x.getTime()-((w===0?7:w)+21)*DAY); }
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
const VEIL="Priest-only Eucharistic prayer: follow silently in lay study. Do not voice the priest’s prayer or imitate the consecration and elevation. See the canonical guidance in Sources.";
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
      if(opts.veil&&key==="Canon#1"&&/HOC EST ENIM|HIC EST ENIM/.test(la)){ const host=/HOC EST ENIM/.test(la); curHTML+=cue(VEIL); curSec+=30; continue; }
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
              if(AB>=2&&ev&&words(ev[1]||ev[0])>700){ r={html:`<details class="canon"><summary>Show the full Gospel (the Passion)</summary>${r.html}</details>`+abr("the Passion: read only its final section, from the death of our Lord"),sec:AB>=3?150:240}; } }
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
  h+=pos([["cross","at the blessing"]])+bil("bless","")+bil("ite","","cel",paschal&&(Math.round((toDate(iso)-easterY(toDate(iso).getUTCFullYear()))/DAY)<=7||/Pentecost/.test(r.t))?"Ite, missa est, allelúia, allelúia. ℟. Deo grátias, allelúia, allelúia.":LAT.ite)+cue(`${ICEL}: ${HM}.`);
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
  const canonH=canonL.map(it=>opts.veil&&/!!!\s*FOR THIS IS/.test(it)?cue(VEIL):it.split("\n").map(l=>lineHTML(l,{prayers:O.English.prayers},"en")).join("")).join("");
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
  const d=toDate(iso), off=Math.round((d-easterY(d.getUTCFullYear()))/DAY), sun=d.getUTCDay()===0, pascha=off>=0&&off<=38;
  return {kind,pascha,departed:!sun&&!pascha,tone:sun?byzToneOf(iso):0,sun,illum:off>=-25&&off<=-4};
}
function byzOk(it,env){ return (it.if||[]).every(c=>c==="chrys"?env.kind==="chrys":c==="basil"?env.kind==="basil":c==="pascha"?env.pascha:c==="departed"?env.departed:c==="feast"?env.feast:c==="illumination"?env.illum:/^tone\d$/.test(c)?env.tone===+c.slice(4):false); }
async function byzFull(ctx,kind,veil,AB){
  let D; try{ D=await J("data/byz-liturgy.json"); }catch(e){ return null; }
  const env=byzEnv(ctx.iso,kind), b=ctx.day.b, out=Array(9).fill(""), MAP=kind==="pres"?BYZ_PRES:BYZ_PART;
  const rd=b?b.r:[], vesp=rd.filter(x=>/^Vespers/.test(x[0]));
  env.feast=rd.some(x=>/^Gospel/.test(x[0]));
  for(const part of D.parts){
    const n=MAP[part.key]; if(n===undefined||(part.key==="after"&&AB>=1)) continue;
    let h="", quiet=[];
    /* Prayers said quietly (with the rubrics between them) fold into one closed block. */
    const flush=()=>{ if(!quiet.length) return; const sp=quiet.filter(x=>x.t==="s"), who=sp.every(x=>x.w==="D")?"the deacon":sp.some(x=>x.w==="D")?"the priest and deacon":"the priest"; h+=`<details class="secret"><summary>Said quietly by ${who}</summary><div class="txt one">${quiet.map(x=>x.t==="r"?`<p class="rub">${inl(x.x)}</p>`:`<p data-r="${BYZ_WHO[x.w][0]}"><span class="sp">${BYZ_WHO[x.w][1]}.</span> ${inl(x.x)}</p>`).join("")}</div></details>`; quiet=[]; };
    const items=part.items.filter(it=>byzOk(it,env));
    const quietNext=i=>{ for(let k=i+1;k<items.length;k++){ if(items[k].t==="r") continue; return items[k].t==="s"&&!!items[k].q; } return false; };
    for(let i=0;i<items.length;i++){
      const it=items[i];
      if(it.t==="s"&&it.q){ quiet.push(it); continue; }
      if(it.t==="r"&&quiet.length&&quietNext(i)){ quiet.push(it); continue; }
      if(it.t==="r"&&!quiet.length&&quietNext(i)&&/secretly|privately|low voice|to himself|silently/i.test(it.x)){ quiet.push(it); continue; }
      flush();
      if(it.t==="r"){ h+=`<p class="rub">${inl(it.x)}</p>`; continue; }
      if(it.t==="slot"){
        if(it.n==="troparia"){
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
      if(it.i){ h+=veil?cue(VEIL):`<p class="emph" data-r="cel"><span class="sp">Priest.</span> ${inl(it.x)}</p>`; continue; }
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
  const trad=rite==="m"||rite==="p"||rite==="h", byz=rite==="b";
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
          ${byz?`<label class="sl">Liturgy <select data-o="byzlit">${[["auto","Of the day"],["chrys","St John Chrysostom"],["basil","St Basil the Great"],["pres","Presanctified Gifts"]].map(([v,n])=>`<option value="${v}"${(opts.byzlit||"auto")===v?" selected":""}>${n}</option>`).join("")}</select></label>`:""}
          <label class="sl">${rite==="o"||trad?"Sermon":"Homily"} <select data-o="homily">${[0,3,5,8,10,12,15,20].map(n=>`<option value="${n}"${+opts.homily===n?" selected":""}>${n?n+" min":"None"}</option>`).join("")}</select></label>
          <label class="sl">Communion <select data-o="communion">${[2,4,6,8,10,15].map(n=>`<option value="${n}"${+opts.communion===n?" selected":""}>${n} min</option>`).join("")}</select></label>
          ${rite==="n"?`<label class="sl">Eucharistic Prayer <select data-o="ep">${["I","II","III","IV"].map(n=>`<option${opts.ep===n?" selected":""}>${n}</option>`).join("")}</select></label>${chk("up","Universal Prayer",opts.up)}`:""}
          ${rite==="o"?chk("up","Prayers of the People",opts.up)+chk("lastGospel","Last Gospel",opts.lastGospel):""}
          ${trad?chk("leonine","Leonine prayers after Low Mass",opts.leonine)+chk("lastGospel","Last Gospel",opts.lastGospel!==false):""}
          ${trad?`<label class="sl">Text <select data-o="lang"><option value="both"${opts.lang==="both"?" selected":""}>Latin and English</option><option value="la"${opts.lang==="la"?" selected":""}>Latin</option><option value="en"${opts.lang==="en"?" selected":""}>English</option></select></label>`:""}
        </fieldset>
      </div>
    </details>
    <p class="note" id="audioNote" hidden>This browser can't play audio here. The notation and texts still work for singing or speaking.</p>
  </div>`;
}
/* Steps that shorten a session, gentlest first, for each rite. The fitter applies them in order and stops once the target is met. */
function ladder(rite){
  const trad=rite==="m"||rite==="p"||rite==="h", byz=rite==="b";
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
  const noun=isOffice?"hour":rite==="b"?"Liturgy":"Mass";
  const build=async(o)=>{ USED=new Set(); ROLE="cel";
    if(isOffice) return buildOffice(ctx,o);
    if(rite==="m") return buildTrad(ctx,"1962",o);
    if(rite==="p") return buildTrad(ctx,"pre55",o);
    if(rite==="h") return buildTrad(ctx,"1962",o);
    if(rite==="o") return buildOrd(ctx,o);
    if(rite==="b") return buildByz(ctx,o);
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
    if(!isOffice) opts.veil=!window.LectParticipation.isPriest();
    window.LectMusic&&window.LectMusic.stopAll();
    const auto=isOffice?"":defaultMass(ctx.iso,ctx.day,rite);
    const ctl=following?`<div class="mctlbox"><p class="note livenote">Following a live session: the host sets the length and music.</p></div>`:(isOffice?officeControls(opts,!!ctx.office.alt):controls(rite,opts,ctx.iso,ctx.day,auto));
    el.innerHTML=(isOffice?"":window.LectParticipation.controls())+ctl+`<div class="mtotal" aria-live="polite">Building the ${noun}…</div><div class="mbody"></div>`;
    let F;
    try{ F=await fit(opts); }
    catch(e){ F={parts:[sec(`Could not build the ${noun}`,0,cue("Some of the data for this day failed to load. Try again, or choose another day."))],tot:0,full:0,cuts:[],adds:[],tgt:0,o:opts}; console.error(e); }
    const {parts,tot,full,cuts,adds,tgt}=F; el.__fit={tot,full,cuts,adds,tgt,parts:parts.map(p=>[p.title,+(p.min||0).toFixed(2)])};
    let at=0; const starts=parts.map(p=>{ const s0=at; at+=Math.max(0,p.min||0)*60; return s0; });
    const status=!tgt?"":tot<=tgt+0.49?`<span class="tg ok">Fits ${tgt} min${cuts.length?` · shortened from ${Math.round(full)}`:""}</span>`:`<span class="tg over">Shortest this ${noun} goes is about ${Math.round(tot)} min</span>`;
    const changes=cuts.length||adds.length?`<details class="cuts"><summary>${cuts.length?`What was shortened (${cuts.length} step${cuts.length>1?"s":""})`:"What was lengthened"}</summary><ol>${cuts.concat(adds).map(c=>`<li>${esc(c)}</li>`).join("")}</ol>${tgt&&tot<tgt-1.5&&!cuts.length?`<p class="note">Still about ${Math.round(tgt-tot)} min short: ${isOffice?"the hour is shorter than that.":"add hymns or chant above to fill it."}</p>`:""}</details>`:"";
    el.querySelector(".mtotal").innerHTML=`<div class="tophead"><span class="tt">About ${Math.max(1,Math.round(tot))} minute${Math.round(tot)===1?"":"s"}</span>${status}<span class="tools-timer"></span></div>
      <ol class="runsheet">${parts.map((p,i)=>`<li data-i="${i}"${(p.min||0)<0.1?" hidden":""}><time>${mmss(starts[i])}</time> <a href="#mp-${i}">${esc(p.title)}</a> <b>${(p.min||0)<0.5?"&lt;1":Math.round(p.min)}′</b></li>`).join("")}</ol>${changes}<div class="tools-bar"></div>`;
    el.querySelector(".mbody").innerHTML=parts.map((p,i)=>p.html.replace('<section class="mpart','<section id="mp-'+i+'" data-i="'+i+'" class="mpart')).join("");
    if(window.LectTexts) window.LectTexts.decorate(el.querySelector(".mbody"),ctx,()=>draw());
    window.LectParticipation.annotate(el,isOffice);
    const modeSelect=el.querySelector("#participation-mode");
    if(modeSelect)modeSelect.addEventListener("change",()=>{window.LectParticipation.setMode(modeSelect.value);draw();});
    if(window.LectTools) window.LectTools.mount(el,{parts:parts.map(p=>({title:p.title,min:p.min})),starts,total:at,ctx,opts:clone(opts),noun,isOffice,rite:ctx.rite,following,
      roles:isOffice?{cel:"Officiant",lec:"Reader",ppl:"All"}:{cel:"Celebrant",srv:rite==="b"?"Deacon":"Server",lec:"Lector",ppl:"Congregation"}});
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
