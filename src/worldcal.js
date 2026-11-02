/* ================================================================ WORLD CALENDAR
   A translation layer from an invented calendar (a game, a LARP, a story) to the church year. The world's year may
   be any length: its days are spread over one liturgical year of the site's data (Advent to the eve of Advent), so
   an eight-week world year passes through Advent, Christmas, Lent, Holy Week, Easter and the time after Pentecost
   in eight weeks. Each world year follows one church year: the same one every time, or the five on the site in turn.

   The compression works season by season. The seasons are sized in proportion to their real length (times a weight
   the user may change); Holy Week may be kept day by day; each season opens on its first day (Advent Sunday,
   Christmas, Ash Wednesday, Palm Sunday, Easter, Pentecost); inside a season the days are spaced evenly and, when the
   spacing is a week or more, moved to the Sunday; the feasts the user pins are always met.

   A real-date clock (an epoch and a pace: one world day per real day, per week, …) says which world day it is now.
   All the logic is pure and exposed as window.LectWorld; the config is kept in localStorage ("lect-world"). */
window.LectWorld=(()=>{
"use strict";
const {DAY,toDate,iso,add,easter,advent}=window.LitDate;
const KEY="lect-world";
/* the church years in days/<year>.json, named by their Easter: 2026 is Advent 2025 to the eve of Advent 2026 */
const YEARS=[2026,2027,2028,2029,2030];
const SEASONS=[["advent","Advent"],["christmas","Christmastide"],["epiphany","After Epiphany"],["lent","Lent"],["holyweek","Holy Week"],["easter","Eastertide"],["pentecost","After Pentecost"]];
/* feasts that can be pinned: the day each falls on in the church year that ends at Easter year Y */
const PINS=[
  ["christmas","Christmas",Y=>U(Y-1,12,25)],["epiphany","Epiphany",Y=>U(Y,1,6)],["candlemas","Candlemas (Presentation)",Y=>U(Y,2,2)],
  ["ash","Ash Wednesday",Y=>add(easter(Y),-46)],["annunciation","Annunciation",Y=>U(Y,3,25)],["palm","Palm Sunday",Y=>add(easter(Y),-7)],
  ["holythu","Maundy Thursday",Y=>add(easter(Y),-3)],["goodfri","Good Friday",Y=>add(easter(Y),-2)],["easter","Easter Day",Y=>easter(Y)],
  ["ascension","Ascension",Y=>add(easter(Y),39)],["pentecost","Pentecost",Y=>add(easter(Y),49)],["trinity","Trinity Sunday",Y=>add(easter(Y),56)],
  ["corpus","Corpus Christi",Y=>add(easter(Y),60)],["baptist","Nativity of St John the Baptist",Y=>U(Y,6,24)],["peterpaul","Ss Peter and Paul",Y=>U(Y,6,29)],
  ["assumption","Assumption (St Mary the Virgin)",Y=>U(Y,8,15)],["michaelmas","Michaelmas",Y=>U(Y,9,29)],["allsaints","All Saints",Y=>U(Y,11,1)],
  ["allsouls","All Souls",Y=>U(Y,11,2)],["ctk","Christ the King (Sunday before Advent)",Y=>add(advent(Y),-7)]];
function U(y,m,d){ return new Date(Date.UTC(y,m-1,d)); }
const DEFAULT={on:false,name:"",yearLen:56,weekdays:[],months:[],era:"Year",firstYear:1,epoch:"2026-11-29",pace:1,
  cycle:"rotate",litYear:2027,shift:0,keepHolyWeek:true,snap:true,weights:{},pins:["christmas","epiphany","ash","palm","holythu","goodfri","easter","ascension","pentecost","trinity","allsaints","ctk"],dates:[]};
const days=(a,b)=>Math.round((b-a)/DAY);
const clampInt=(v,lo,hi,d)=>{ v=Math.round(+v); return Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):d; };
const str=(v,n)=>String(v==null?"":v).trim().slice(0,n);
/* any stored or imported config, made safe and complete */
function normalize(c){
  c=c&&typeof c==="object"?c:{};
  const o={...DEFAULT,...c};
  o.on=!!c.on; o.name=str(c.name,60);
  o.months=(Array.isArray(c.months)?c.months:[]).slice(0,40).map(m=>({name:str(m&&m.name,30)||"Month",days:clampInt(m&&m.days,1,400,30)}));
  const msum=o.months.reduce((a,m)=>a+m.days,0);
  o.yearLen=msum?clampInt(msum,7,1000,56):clampInt(c.yearLen,7,1000,DEFAULT.yearLen);
  if(msum!==o.yearLen) o.months=[];
  o.weekdays=(Array.isArray(c.weekdays)?c.weekdays:[]).map(w=>str(w,24)).filter(Boolean).slice(0,30);
  o.era=str(c.era==null?DEFAULT.era:c.era,24); o.firstYear=clampInt(c.firstYear,-99999,99999,1);
  o.epoch=/^\d{4}-\d{2}-\d{2}$/.test(c.epoch||"")?c.epoch:DEFAULT.epoch;
  o.pace=Math.min(366,Math.max(0.05,+c.pace||1));
  o.cycle=c.cycle==="fixed"?"fixed":"rotate"; o.litYear=YEARS.includes(+c.litYear)?+c.litYear:DEFAULT.litYear; o.shift=clampInt(c.shift,0,YEARS.length-1,0);
  o.keepHolyWeek=c.keepHolyWeek!==false; o.snap=c.snap!==false;
  o.weights={}; SEASONS.forEach(([k])=>{ const w=+((c.weights||{})[k]); o.weights[k]=Number.isFinite(w)&&w>0?Math.min(10,Math.max(0.1,w)):1; });
  o.pins=(Array.isArray(c.pins)?c.pins:DEFAULT.pins).filter(p=>PINS.some(x=>x[0]===p));
  o.dates=(Array.isArray(c.dates)?c.dates:[]).filter(d=>/^\d{2}-\d{2}$/.test(d)).slice(0,40);
  return o;
}
function load(){ try{ return normalize(JSON.parse(localStorage.getItem(KEY)||"null")); }catch(e){ return normalize(null); } }
function save(c){ const n=normalize(c); try{ localStorage.setItem(KEY,JSON.stringify(n)); }catch(e){} window.dispatchEvent(new CustomEvent("lect-world",{detail:n})); return n; }
/* the seasons of the church year ending at Easter year Y: [key, first day, number of days] */
function seasons(Y){
  const A=advent(Y-1), A2=advent(Y), E=easter(Y), X=U(Y-1,12,25), J=U(Y,1,14), ash=add(E,-46), palm=add(E,-7), pent=add(E,49);
  const b=[A,X,J,ash,palm,E,pent,A2];
  return SEASONS.map(([k],i)=>({key:k,start:b[i],len:days(b[i],b[i+1])}));
}
/* world days per season: kept seasons day by day, the rest by largest remainder in proportion to length × weight,
   at least one day each */
function allot(c,S){
  const N=c.yearLen, out=S.map(()=>0);
  let keep=S.map(s=>c.keepHolyWeek&&s.key==="holyweek");
  if(S.reduce((a,s,i)=>a+(keep[i]?s.len:0),0)>N-(S.length-1)) keep=S.map(()=>false);
  let left=N; S.forEach((s,i)=>{ if(keep[i]){ out[i]=s.len; left-=s.len; } });
  const free=S.map((s,i)=>keep[i]?0:s.len*c.weights[s.key]), tot=free.reduce((a,b)=>a+b,0);
  const open=S.map((s,i)=>!keep[i]); const nOpen=open.filter(Boolean).length;
  left-=nOpen; /* one day each first */
  const want=free.map(f=>tot?f/tot*left:0), base=want.map(Math.floor);
  let rest=left-base.reduce((a,b)=>a+b,0);
  want.map((w,i)=>[w-base[i],i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{ if(rest>0&&open[i]){ base[i]++; rest--; } });
  S.forEach((s,i)=>{ if(open[i]) out[i]=1+base[i]; });
  /* a world year no longer than the church year never gives a season more days than it has: pass the excess on */
  if(N<=S.reduce((a,s)=>a+s.len,0)){
    for(let guard=0;guard<50;guard++){
      const over=S.findIndex((s,i)=>out[i]>s.len); if(over<0) break;
      let x=out[over]-S[over].len; out[over]=S[over].len;
      while(x>0){ let bi=-1; S.forEach((s,i)=>{ if(out[i]<s.len&&(bi<0||out[i]/s.len<out[bi]/S[bi].len)) bi=i; }); if(bi<0) break; out[bi]++; x--; }
    }
  }
  return out;
}
function pinDates(c,Y){
  const ds=PINS.filter(p=>c.pins.includes(p[0])).map(p=>p[2](Y));
  c.dates.forEach(md=>{ const [m,d]=md.split("-").map(Number); const A=advent(Y-1); let x=U(Y,m,d); if(x>=advent(Y)) x=U(Y-1,m,d); if(x<A) x=U(Y,m,d); ds.push(x); });
  return ds;
}
/* the liturgical date of each day of a world year that follows church year Y */
const memo=new Map();
function plan(c,Y){
  const k=JSON.stringify([c.yearLen,c.keepHolyWeek,c.snap,c.weights,c.pins,c.dates,Y]);
  if(memo.has(k)) return memo.get(k);
  const S=seasons(Y), n=allot(c,S), pins=pinDates(c,Y), out=[], segs=[];
  S.forEach((s,i)=>{
    const m=s.len, cnt=n[i], at=[];
    for(let j=0;j<cnt;j++) at.push(Math.floor(j*m/cnt));
    if(cnt<m){
      const step=m/cnt;
      if(c.snap&&step>=6){ /* a week or more apart: keep each to the Sunday nearest its place */
        /* the time after Epiphany has no feast of its own to open it: it opens on its first Sunday */
        if(s.key==="epiphany"){ const f=(7-s.start.getUTCDay())%7; if(f<m) at[0]=f; }
        const used=new Set([at[0]]);
        for(let j=1;j<cnt;j++){ const d=add(s.start,at[j]), w=d.getUTCDay(); let best=null;
          for(const o of [-w,7-w].sort((a,b)=>Math.abs(a)-Math.abs(b))){ const t=at[j]+o; if(t>0&&t<m&&!used.has(t)){ best=t; break; } }
          if(best!==null) at[j]=best; used.add(at[j]); }
        at.sort((a,b)=>a-b);
        for(let j=1;j<cnt;j++) if(at[j]<=at[j-1]) at[j]=at[j-1]+1;   /* never two world days on one date */
        for(let j=cnt-1;j>0&&at[j]>=m;j--){ at[j]=Math.min(at[j],(j+1<cnt?at[j+1]:m)-1); }
      }
      /* pinned feasts in this season replace the nearest day that is not already a pin (the opening day stays) */
      const fixed=new Set([at[0]]);
      pins.map(p=>days(s.start,p)).filter(t=>t>0&&t<m).sort((a,b)=>a-b).forEach(t=>{
        if(at.includes(t)){ fixed.add(t); return; }
        let bi=-1; at.forEach((v,j)=>{ if(j>0&&!fixed.has(v)&&(bi<0||Math.abs(v-t)<Math.abs(at[bi]-t))) bi=j; });
        if(bi>=0){ at[bi]=t; fixed.add(t); at.sort((a,b)=>a-b); }
      });
    }
    segs.push({key:s.key,name:SEASONS[i][1],from:out.length,count:cnt,realDays:m,start:iso(s.start)});
    at.forEach(t=>out.push(iso(add(s.start,t))));
  });
  const r={Y,days:out,segs};
  if(memo.size>40) memo.clear(); memo.set(k,r); return r;
}
/* the church year (Easter year) that world year y follows */
function churchYear(c,y){
  if(c.cycle==="fixed") return c.litYear;
  const i=((y-c.firstYear+c.shift)%YEARS.length+YEARS.length)%YEARS.length; return YEARS[i];
}
/* world day number (0 = the first day of the first year) → {index, year, doy} */
function at(c,index){ const N=c.yearLen, q=Math.floor(index/N); return {index, year:c.firstYear+q, doy:index-q*N}; }
function indexOf(c,year,doy){ return (year-c.firstYear)*c.yearLen+doy; }
/* the world day on a real date */
function today(c,real){ const d=days(toDate(c.epoch),toDate(real||window.LitDate.today())); return at(c,Math.floor(d/c.pace)); }
/* the real date on which a world day begins */
function realOf(c,index){ return iso(add(toDate(c.epoch),Math.ceil(index*c.pace-1e-9))); }
/* the liturgical date of a world day */
function liturgical(c,index){ const w=at(c,index); return plan(c,churchYear(c,w.year)).days[w.doy]; }
function season(c,index){ const w=at(c,index), P=plan(c,churchYear(c,w.year)); return P.segs.find(s=>w.doy>=s.from&&w.doy<s.from+s.count); }
function label(c,index){
  const w=at(c,index); let d=`Day ${w.doy+1}`;
  if(c.months.length){ let r=w.doy; for(const m of c.months){ if(r<m.days){ d=`${r+1} ${m.name}`; break; } r-=m.days; } }
  const wl=c.weekdays.length, wd=wl?c.weekdays[((index%wl)+wl)%wl]+", ":"";
  return `${wd}${d}, ${c.era?c.era+" ":""}${w.year}`;
}
/* the world days, in this world year, whose liturgy is the given date (none when the date falls between them) */
function find(c,year,litIso){ const P=plan(c,churchYear(c,year)); const r=[]; P.days.forEach((x,i)=>{ if(x===litIso) r.push(indexOf(c,year,i)); }); return r; }
/* the shape of the config as text, for sharing with a group */
function exportText(c){ const n=normalize(c); return JSON.stringify({...n,on:undefined},null,1); }
function importText(t){ const o=JSON.parse(t); if(!o||typeof o!=="object"||Array.isArray(o)) throw new Error("not a calendar"); return normalize({...o,on:true}); }
return {KEY,YEARS,SEASONS,PINS:PINS.map(([k,n])=>({key:k,name:n})),DEFAULT:normalize(null),normalize,load,save,seasons,plan,churchYear,at,indexOf,today,realOf,liturgical,season,label,find,exportText,importText};
})();

/* ---------------------------------------------------------------- the settings panel
   LectWorld.panel(el, {names}) draws the settings into el: the world's calendar, its clock, the translation to the
   church year, a table of one world year, and the calendar as text to share with a group. names(iso) resolves to
   the celebration of a liturgical date (the caller knows which tradition to name it by). */
(function(W){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const longDate=iso=>new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(window.LitDate.toDate(iso));
let OPEN=false, PREVIEW=null;
function yearName(Y){ return `${Y-1}–${String(Y).slice(2)} (Advent ${Y-1} to Advent ${Y})`; }
function form(c){
  const wt=W.SEASONS.map(([k,n])=>`<label class="wc-wt">${esc(n)} <input type="number" name="w.${k}" min="0.1" max="10" step="0.1" value="${c.weights[k]}"></label>`).join("");
  const pins=W.PINS.map(p=>`<label class="ck"><input type="checkbox" name="pin" value="${p.key}"${c.pins.includes(p.key)?" checked":""}> ${esc(p.name)}</label>`).join("");
  const yrs=W.YEARS.map(Y=>`<option value="${Y}"${c.litYear===Y?" selected":""}>${esc(yearName(Y))}</option>`).join("");
  const shift=W.YEARS.map((Y,i)=>`<option value="${i}"${c.shift===i?" selected":""}>${esc(yearName(Y))}</option>`).join("");
  const pace=[[1,"every real day"],[7,"every real week"],[14,"every two real weeks"],[0.25,"every six real hours"]];
  const paceOpt=pace.some(p=>p[0]===c.pace)?c.pace:"custom";
  return `<form class="wc-form" autocomplete="off">
    <label class="ck wc-on"><input type="checkbox" name="on"${c.on?" checked":""}> Use a world calendar: open each day of the world with the liturgy of the church-year day it stands for</label>
    <fieldset><legend>The world's calendar</legend>
      <div class="wc-grid">
        <label>Name <input name="name" maxlength="60" value="${esc(c.name)}" placeholder="The Reckoning of the Realm"></label>
        <label>Year label <input name="era" maxlength="24" value="${esc(c.era)}" placeholder="Year"></label>
        <label>First year <input type="number" name="firstYear" value="${c.firstYear}"></label>
        <label>Days in a year <input type="number" name="yearLen" min="7" max="1000" value="${c.yearLen}"${c.months.length?" disabled":""}></label>
      </div>
      <label>Months, one a line as <i>Name: days</i> (their days make the year; leave empty for numbered days)<textarea name="months" rows="3" placeholder="Frostmoon: 14&#10;Thawmoon: 14">${esc(c.months.map(m=>m.name+": "+m.days).join("\n"))}</textarea></label>
      <label>Days of the week, in order, separated by commas (leave empty for none)<input name="weekdays" maxlength="400" value="${esc(c.weekdays.join(", "))}" placeholder="Sunsday, Moonsday, …"></label>
    </fieldset>
    <fieldset><legend>The world's clock</legend>
      <div class="wc-grid">
        <label>The first day of the first year began on <input type="date" name="epoch" value="${esc(c.epoch)}"></label>
        <label>A world day passes <select name="paceSel">${pace.map(([v,n])=>`<option value="${v}"${paceOpt===v?" selected":""}>${n}</option>`).join("")}<option value="custom"${paceOpt==="custom"?" selected":""}>every … real days</option></select></label>
        <label>Real days per world day <input type="number" name="pace" min="0.05" max="366" step="0.05" value="${c.pace}"${paceOpt==="custom"?"":" disabled"}></label>
      </div>
    </fieldset>
    <fieldset><legend>Into the church year</legend>
      <label>Each world year follows <select name="cycle"><option value="rotate"${c.cycle==="rotate"?" selected":""}>the next church year on this site, in turn</option><option value="fixed"${c.cycle==="fixed"?" selected":""}>the same church year every time</option></select></label>
      <label class="wc-rot"${c.cycle==="fixed"?" hidden":""}>Starting with <select name="shift">${shift}</select></label>
      <label class="wc-fix"${c.cycle==="fixed"?"":" hidden"}>Church year <select name="litYear">${yrs}</select></label>
      <label class="ck"><input type="checkbox" name="keepHolyWeek"${c.keepHolyWeek?" checked":""}> Keep Holy Week day by day, Palm Sunday to Holy Saturday</label>
      <label class="ck"><input type="checkbox" name="snap"${c.snap?" checked":""}> When world days stand a week or more apart, take the Sunday</label>
      <details class="wc-more"><summary>Season sizes</summary><p class="note">Each season gets world days in proportion to its real length times this weight. 2 doubles a season's share; 0.5 halves it.</p><div class="wc-wts">${wt}</div></details>
      <details class="wc-more"><summary>Feasts that always get a world day</summary><div class="wc-pins">${pins}</div>
        <label>Other dates, as month-day, separated by commas <input name="dates" maxlength="400" value="${esc(c.dates.join(", "))}" placeholder="12-08, 08-06"></label></details>
    </fieldset>
    <p><button type="submit">Save the world calendar</button> <span class="wc-status note" role="status"></span></p>
    <details class="wc-more wc-share"><summary>Share this calendar with your group</summary>
      <p class="note">Send this text to the others; they paste it below and press Load. It holds the calendar only, nothing else from this device.</p>
      <textarea class="wc-out" rows="5" readonly>${esc(W.exportText(c))}</textarea>
      <p><button type="button" class="ghost wc-copy">Copy</button></p>
      <label>Paste a calendar<textarea class="wc-in" rows="4"></textarea></label>
      <p><button type="button" class="ghost wc-load">Load</button></p>
    </details>
    <details class="wc-more wc-prev"${PREVIEW!==null?" open":""}><summary>A world year, day by day</summary>
      <p><label>World year <input type="number" class="wc-py" value="${PREVIEW!==null?PREVIEW:W.today(c).year}"></label></p>
      <div class="wc-table" aria-live="polite"></div>
    </details>
  </form>`;
}
function read(f,c){
  const v=n=>f.elements[n]?f.elements[n].value:"";
  const months=v("months").split(/\n/).map(l=>l.trim()).filter(Boolean).map(l=>{ const m=/^(.*?)\s*[:=]\s*(\d+)\s*$/.exec(l); return m?{name:m[1],days:+m[2]}:null; }).filter(Boolean);
  const paceSel=v("paceSel");
  const weights={}; W.SEASONS.forEach(([k])=>{ weights[k]=+v("w."+k); });
  return W.normalize({...c,on:f.elements.on.checked,name:v("name"),era:v("era"),firstYear:+v("firstYear"),yearLen:+v("yearLen")||c.yearLen,months,
    weekdays:v("weekdays").split(",").map(s=>s.trim()).filter(Boolean),epoch:v("epoch"),pace:paceSel==="custom"?+v("pace"):+paceSel,
    cycle:v("cycle"),shift:+v("shift"),litYear:+v("litYear"),keepHolyWeek:f.elements.keepHolyWeek.checked,snap:f.elements.snap.checked,weights,
    pins:[...f.querySelectorAll('input[name="pin"]:checked')].map(x=>x.value),dates:v("dates").split(",").map(s=>s.trim()).filter(Boolean)});
}
async function table(el,c,year,names){
  const Y=W.churchYear(c,year), P=W.plan(c,Y);
  const rows=await Promise.all(P.days.map(async(iso,doy)=>{ const i=W.indexOf(c,year,doy); return {i,iso,real:W.realOf(c,i),name:await names(iso).catch(()=>"")}; }));
  el.innerHTML=`<p class="note">World year ${year} follows the church year ${esc(yearName(Y))}. ${P.segs.map(s=>`${esc(s.name)}: ${s.count} day${s.count===1?"":"s"} for ${s.realDays}`).join(" · ")}.</p>
    <div class="wc-scroll"><table class="wc-tab"><thead><tr><th scope="col">World day</th><th scope="col">Begins</th><th scope="col">Church year</th><th scope="col">Celebration</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(W.label(c,r.i))}</td><td>${esc(longDate(r.real))}</td><td>${esc(longDate(r.iso))}</td><td>${esc(r.name)}</td></tr>`).join("")}</tbody></table></div>`;
}
function panel(el,{names,onSave}){
  let c=W.load();
  el.innerHTML=`<details class="worldcal"${OPEN?" open":""}><summary>World calendar<span class="note"> · for games, LARPs and stories${c.on?` · on: ${esc(c.name||W.label(c,W.today(c).index))}`:""}</span></summary>${form(c)}</details>`;
  const d=el.querySelector("details.worldcal"), f=el.querySelector(".wc-form"), st=f.querySelector(".wc-status");
  d.addEventListener("toggle",()=>{ OPEN=d.open; });
  f.elements.cycle.addEventListener("change",()=>{ const fx=f.elements.cycle.value==="fixed"; f.querySelector(".wc-rot").hidden=fx; f.querySelector(".wc-fix").hidden=!fx; });
  f.elements.paceSel.addEventListener("change",()=>{ f.elements.pace.disabled=f.elements.paceSel.value!=="custom"; });
  f.elements.months.addEventListener("input",()=>{ f.elements.yearLen.disabled=!!f.elements.months.value.trim(); });
  const prev=f.querySelector(".wc-prev"), py=f.querySelector(".wc-py"), tab=f.querySelector(".wc-table");
  const show=()=>{ if(!prev.open) return; PREVIEW=+py.value||W.today(c).year; table(tab,c,PREVIEW,names); };
  prev.addEventListener("toggle",()=>{ if(prev.open) show(); else PREVIEW=null; });
  py.addEventListener("change",show);
  if(prev.open) show();
  f.addEventListener("submit",e=>{ e.preventDefault(); c=W.save(read(f,c)); st.textContent=c.on?`Saved. Today is ${W.label(c,W.today(c).index)}.`:"Saved. The world calendar is off."; f.querySelector(".wc-out").value=W.exportText(c); if(onSave) onSave(c); });
  f.querySelector(".wc-copy").addEventListener("click",async()=>{ const t=f.querySelector(".wc-out"); try{ await navigator.clipboard.writeText(t.value); st.textContent="Copied."; }catch(e){ t.select(); st.textContent="Select the text and copy it."; } });
  f.querySelector(".wc-load").addEventListener("click",()=>{ try{ c=W.save(W.importText(f.querySelector(".wc-in").value)); if(onSave) onSave(c); else panel(el,{names,onSave}); }catch(e){ st.textContent="That text is not a world calendar."; } });
}
W.panel=panel;
})(window.LectWorld);
