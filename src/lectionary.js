/* Sourced appointments and a date-scoped Bible reader. No remote Scripture APIs. */
(function(){
"use strict";
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY=864e5, date=s=>new Date(s+'T00:00:00Z'), iso=d=>d.toISOString().slice(0,10);
const cache={};
const json=p=>cache[p]||(cache[p]=fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json();}).catch(e=>{delete cache[p];throw e;}));
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return new Date(Date.UTC(y,Math.floor(n/31)-1,n%31+1));}
function advent(y){const x=new Date(Date.UTC(y,11,25));return new Date(+x-((x.getUTCDay()||7)+21)*DAY);}
const sunday=d=>new Date(+d-d.getUTCDay()*DAY);
const ord=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth'];
const PB_ALIAS={"The Nativity of Our Lord: Christmas Day":"Christmas Day I","The Holy Name":"Holy Name","First Sunday after Christmas Day":"First Sunday after Christmas","Second Sunday after Christmas Day":"Second Sunday after Christmas","First Sunday after the Epiphany: The Baptism of our Lord":"First Sunday after Epiphany","Sunday of the Passion: Palm Sunday":"Palm Sunday: Passion","The Day of Pentecost: Whitsunday":"Pentecost","First Sunday after Pentecost: Trinity Sunday":"Trinity Sunday","Seventh Sunday of Easter: The Sunday after Ascension Day":"Seventh Sunday of Easter","Saint Andrew":"St. Andrew","Saint Thomas":"St. Thomas"};
function pbLabel(s){return (PB_ALIAS[s]||s).replace(/ after the Epiphany/,' after Epiphany').replace(/\bSaint\b/g,'St.').replace(/^SS\./,'St.').replace(/ and /g,' & ').replace(/& St\. /g,'& ').replace(/^The Holy Innocents$/,'Holy Innocents').replace(/^The Nativity of St\./,'Nativity of St.').replace(/’/g,"'");}
function officeKey(s){const d=date(s),y=d.getUTCFullYear(),E=easter(y),off=Math.round((d-E)/DAY),su=sunday(d),os=Math.round((su-E)/DAY),A=advent(y);
 if(d>=A&&d<new Date(Date.UTC(y,11,25)))return 'advent'+(Math.floor((su-A)/DAY/7)+1);
 if(off>=-46&&off<-42)return 'ash';
 if(off>=-42&&off<-7)return 'lent'+(Math.floor((os+42)/7)+1);
 if(off>=-7&&off<0)return 'holy';
 if(off>=0&&off<7)return 'easter0';
 if(off>=7&&off<49)return 'easter'+(Math.floor(off/7)+1);
 if(off>=49)return 'proper'+Math.max(1,Math.min(29,Math.round((su-Date.UTC(y,4,11))/DAY/7)+1));
 if(os===-49)return 'last-epiphany';
 const ep=new Date(Date.UTC(y,0,6)),first=new Date(+ep+((7-ep.getUTCDay())%7||7)*DAY);
 if(d>=first)return 'epiphany'+(Math.floor((su-first)/DAY/7)+1);
 return null;
}
function psalmRefs(s){
 // Parentheses and brackets in the source are optional verses; use the long form.
 s=s.split(' or ')[0].replace(/\d+\*+\s*&\s*/g,'').replace(/[\[\]*]/g,'').replace(/(?<=\d)\(/g,',').replace(/\)(?=\d)/g,',').replace(/[()]/g,'').trim();
 return s.split(/,\s*(?=\d+(?:\s*$|:))/).filter(t=>/^\d/.test(t)).map(t=>'Ps '+t.replace(/\s/g,''));
}
const readings=refs=>refs.map((cite,i)=>({lab:/^Ps /.test(cite)?'Psalm':/^(Matt|Mark|Luke|John) /.test(cite)?'Gospel':i===0?'First Lesson':'Second Lesson',cite,num:'k',tr:'kj'}));
async function psalm79(cite,lab='Psalm'){
 const B=await json('data/bcp1979.json'),m=/^Ps (\d+)(?::([\d,\-]+))?$/.exec(cite);
 const P=m&&Object.values(B.psalter).flat().find(p=>(p.n==='I'?'1':p.n)===m[1]);
 if(!P)return `<p class="note">${esc(cite)}: check the appointed Psalm in your Prayer Book.</p>`;
 const wanted=m[2]?m[2].split(',').flatMap(s=>{const [a,b]=s.split('-').map(Number);return Array.from({length:(b||a)-a+1},(_,i)=>a+i);}):P.v.filter(([v])=>v).map(([v])=>v);
 const verses=wanted.map(v=>P.v.find(([n])=>n===v));
 if(verses.some(v=>!v))return `<p class="note">${esc(cite)}: the complete appointment could not be found in the bundled 1979 Psalter. Check your book.</p>`;
 return `<section class="reading"><header><span class="rl">${esc(lab)}</span><span class="rc">${esc(cite)}</span></header><p class="cite">Book of Common Prayer (1979) Psalter</p><p class="scripture">${verses.map(([n,t])=>`<sup>${n}</sup> ${esc(t)}`).join(' ')}</p></section>`;
}
async function pb79(ctx,office=false,eve=false){
 const T=await json('data/bcp1979-lectionary.json'),B=await json('data/bcp1979.json'),d=date(ctx.iso),y=d.getUTCFullYear(),ly=y+(d>=advent(y)?1:0),cycle='ABC'[(ly+2)%3],year=ly%2?'1':'2';
 const title=window.LectPB79.day(ctx.iso,B.collects.c).title,label=pbLabel(title);
 let row,refs=[],ps=[];
 if(!office){row=Object.values(T.sunday[cycle]).find(r=>pbLabel(r.label)===label);
  // A Sunday appointment is a clearly identified study selection on an otherwise unappointed weekday.
  if(!row&&d.getUTCDay()){const su=iso(sunday(d)),st=window.LectPB79.day(su,B.collects.c).title;row=Object.values(T.sunday[cycle]).find(r=>pbLabel(r.label)===pbLabel(st));}
  if(row){refs=row.readings;ps=psalmRefs(row.ps);}
 }else{
  const special=T.special[year],holy=Object.values(T.holydays).find(r=>pbLabel(r.label)===label||pbLabel(r.label).replace(/^SS\./,'St.')===label);
  const fixed={"12-25":"Christmas Day","01-01":"Holy Name","01-06":"Epiphany"};
  const md=ctx.iso.slice(5),key=officeKey(ctx.iso),dow=d.getUTCDay(),off=Math.round((d-easter(y))/DAY);
  let name=fixed[md]||({'-7':'Palm Sunday','-3':'Maundy Thursday','-2':'Good Friday','-1':'Holy Saturday','0':'Easter Day','39':'Ascension Day','49':'The Day of Pentecost','56':'Trinity Sunday'})[off];
  if(title==='Ash Wednesday'&&off===-46)name='Ash Wednesday';
  if(/Sunday after Christmas/.test(label))name=label;
  if(!name&&d.getUTCMonth()===11&&d.getUTCDate()>=24)name='Dec. '+d.getUTCDate();
  const ep=new Date(Date.UTC(y,0,6)),epSunday=new Date(+ep+((7-ep.getUTCDay())%7||7)*DAY);
  if(!name&&d.getUTCMonth()===0&&d.getUTCDate()>=2&&d.getUTCDate()<=12&&d<epSunday)name='Jan. '+d.getUTCDate();
  if(eve){if(md==='12-24')name='Christmas Eve';else if(md==='12-31')name='Eve of Holy Name';else if(md==='01-05')name='Eve of Epiphany';else if(off===38)name='Eve of Ascension';else if(off===48)name='Eve of Pentecost';else if(off===55)name='Eve of Trinity Sunday';}
  if(holy){row=holy;refs=holy[eve?'e':'m'];}
  else{row=name&&special[name]||key&&T.office[year][key+'-'+dow];
   if(row){refs=row[eve?'e':'m']||(eve&&(name?.startsWith('Eve ')||name==='Christmas Eve')?row.readings:eve?[row.readings[year==='1'?2:1]]:[row.readings[0],row.readings[year==='1'?1:2]]);}}
  if(row)ps=psalmRefs(row.ps[eve?1:0]);
 }
 const info={src:`Book of Common Prayer (1979) · ${office?'Daily Office Year '+year:'original Eucharistic Year '+cycle}`,url:T.source.url,note:office?'The two-year Office lectionary, with its morning/evening distribution. Local feast transfers must be checked in your church calendar.':'The historical 1979 lectionary, before the RCL replaced it in 2007. On weekdays without a proper, the preceding Sunday is a study selection. Local transfers must be checked.',title:row?.label||title,items:readings(refs.filter(Boolean)),psalms:ps};
 if(!row)info.note+=' No verified appointment is loaded for this date; enter citations from your book below.';
 return info;
}
/* Psalm boundaries in Septuagint numbering; Scripture is rendered in the bundled Douay-Rheims. */
const K=[null,[1,8],[9,16],[17,23],[24,31],[32,36],[37,45],[46,54],[55,63],[64,69],[70,76],[77,84],[85,90],[91,100],[101,104],[105,108],[109,117],[118,118],[119,133],[134,142],[143,150]];
const EOTH=[null,'Matt 28:16-20','Mark 16:1-8','Mark 16:9-20','Luke 24:1-12','Luke 24:12-35','Luke 24:36-53','John 20:1-10','John 20:11-18','John 20:19-31','John 21:1-14','John 21:15-25'];
function byzantine(ctx,hour){
 const d=date(ctx.iso),y=d.getUTCFullYear(),off=Math.round((d-easter(y))/DAY),dow=d.getUTCDay(),md=+ctx.iso.slice(5).replace('-','');
 const matins=hour==='orthros'||hour==='byzm',vespers=hour==='vespers'||hour==='byzv';
 const summer=(md>=1220||md<=114)||(md>=115&&off>=-63&&off<=-49)||(off>=7&&md<=921);
 let ks=[];let note='The ordinary Greco-Russian Psalter course. Dates use Gregorian Pascha, as does this site’s existing Byzantine calendar; churches keeping Julian Pascha or a different fixed calendar must check their book. Feast and vigil exceptions take precedence.';
 if(matins)ks=(summer?[[2,3],[4,5],[7,8],[10,11],[13,14],[19,20],[16,17]]:[[2,3],[4,5,6],[7,8,9],[10,11,12],[13,14,15],[19,20],[16,17]])[dow];
 if(vespers)ks=(summer?[[],[6],[9],[12],[15],[18],[1]]:[[],[18],[18],[18],[18],[18],[1]])[dow];
 if(off>=0&&off<7){ks=[];note='Bright Week has no kathisma. Use the Paschal Hours and the services of the Pentecostarion.';}
 else if(off>=-48&&off<0){ks=[];note='The Great Fast and Holy Week require their special Psalter and readings tables. Enter the appointed citations from your Triodion; the ordinary course is not substituted.';}
 const items=ks.flatMap(k=>Array.from({length:K[k][1]-K[k][0]+1},(_,i)=>({lab:`Kathisma ${k} · Psalm ${K[k][0]+i} (LXX)`,cite:'Ps '+(K[k][0]+i),num:'v',tr:'dr',slot:'psalter'})));
 if(matins&&dow===0){let E=easter(y);if(d<E)E=easter(y-1);const n=Math.round((d-E)/DAY);
  if(n>=56&&!(off>=-7&&off<0)){const eo=(Math.floor((n-56)/7)%11)+1;items.push({lab:'Resurrection Gospel · Eothinon '+eo,cite:EOTH[eo],num:'k',tr:'kj',slot:'gospel'});}
 }
 return {src:'Byzantine Office · Psalter and Resurrection Gospel',url:'https://www.oca.org/liturgics/outlines/kathisma-readings-at-matins',note,items};
}
const SOURCES={
 adai:['Assyrian Church of the East · current parish calendar','https://www.maryosipparish.org/documents/assyrian/propers2026.html','The linked Mar Yosip parish table covers Sundays and principal feasts in 2026. Its readings have not been imported. Enter the citations for the selected date. Ancient Church of the East and Chaldean Catholic calendars require their own source. The service text below is historical.'],
 arm:['Armenian Apostolic Church · current Prelacy calendar','https://westernprelacy.org/daily-bible-readings/','Use the current annual readings prepared by the Eastern Prelacy. Its appointments have not been imported. Armenian Catholic and other local calendars require their own source. The service text below is historical.'],
 a:['Archdiocese of Milan · current Ambrosian calendar','https://www.chiesadimilano.it/letture-rito-ambrosiano','Use Milan’s current dated Ambrosian readings, including its own six-week Advent and cycles. The automatic table is not yet imported. The ordinary below is historical; current calendar readings do not make it the modern approved service.'],
 z:['Toledo · current Hispano-Mozarabic calendar','https://www.catedralprimada.es/culto/rito-hispano-mozarabe/','Use the current Missale Hispano-Mozarabicum and Liber Commicus with your church’s ordo. The Toledo link provides current rite information, not a complete daily reading table. Verified automatic readings remain to be imported. The ordinary below is historical.'],
 rcus:['RCUS · congregation’s Scripture selections','https://rcus.org/worship/','The service below prints the Mercersburg book’s own Gospel, Epistle and Collect and its Sunday lessons. The current RCUS Directory of Worship leaves Scripture to the minister and congregation: enter a congregation’s selections below to use them instead.']
};
SOURCES.rcusv=SOURCES.rcusp=SOURCES.rcus;
function calendarMode(){try{return localStorage.getItem('lect-calendar-bcp79')==='1979'?'1979':'current';}catch(e){return 'current';}}
function currentEpiscopal(c){const [y,m]=c.iso.split('-');return {src:'Episcopal Church · current Revised Common Lectionary',url:`https://lectionary.episcopalchurch.org/${y}/${+m}`,note:'Use the current Episcopal RCL calendar for the selected date. Its automatic citations are not bundled here; enter them below. You can explicitly select the original 1979 Eucharistic table for historical study. The Daily Office continues to use the Prayer Book’s two-year table.',items:[]};}
const COPT_HOURS={1:'Vespers',2:'Matins',4:'First Hour',5:'Third Hour',6:'Sixth Hour',7:'Ninth Hour',8:'Eleventh Hour',9:'Eve · First Hour',10:'Eve · Third Hour',11:'Eve · Sixth Hour',12:'Eve · Ninth Hour',13:'Eve · Eleventh Hour',14:'Twelfth Hour'};
const COPT_READINGS={1:['Psalm','psalter'],2:['Gospel','gospel'],3:['Pauline Epistle','pauline'],4:['Catholic Epistle','catholic'],5:['Acts','acts'],7:['Prophecy','prophecy'],8:['Gospel','gospel']};
function copticMode(){try{return localStorage.getItem('lect-calendar-copt')==='local'?'local':'orthodox';}catch(e){return 'orthodox';}}
function copticItems(rows,T){return (rows||[]).flatMap(([id,refs])=>refs.map(cite=>({lab:COPT_READINGS[id][0],slot:COPT_READINGS[id][1],cite,num:T.douay.includes(cite)?'v':'k',tr:T.douay.includes(cite)?'dr':'kj',issue:T.issues[cite]||null})));}
async function coptic(c){
 if(copticMode()==='local')return {src:'Coptic Catholic or local church calendar',note:'Enter the readings from your church’s current calendar below. Automatic appointments have not been imported for this profile. The Bute service text below is historical.',items:[]};
 const T=await json('data/coptic-lectionary.json'),table=T.tables[T.days[c.iso]],items=copticItems(table?.['3'],T);
 const [y,m,d]=c.iso.split('-'),url=`https://copticchurch.net/readings?g_year=${y}&g_month=${m}&g_day=${d}`;
 let note='Coptic Orthodox appointments, using a community-maintained Katameros snapshot for 30 November 2025–30 November 2030. Scripture uses the bundled public-domain Bibles. Local exceptions take precedence; choose the Catholic or local profile for other appointments. The Bute service text below is historical.';
 if(!table)note+=' No verified appointments are loaded outside this date range.';
 else if(!items.length)note+=' This snapshot has Holy Week hours rather than a separate Liturgy appointment today. Choose an hour in the calendar reader; its readings are not inserted into the historical Mass.';
 return {src:'Coptic Orthodox Katameros',url,note,items,hours:Object.entries(table||{}).filter(([id])=>id!=='3').map(([id,rows])=>({title:COPT_HOURS[id],items:copticItems(rows,T)}))};
}
const storageKey=c=>'lect-lessons:'+JSON.stringify([c.type||'mass',c.rite,c.hour||'',c.iso]);
function local(c){try{const v=JSON.parse(localStorage.getItem(storageKey(c)));return Array.isArray(v)?v:[];}catch(e){return [];}}
function custom(c){const rows=local(c);return rows.length?{src:'Your readings for '+c.iso,note:'Citations selected on this device for this rite, hour and date. Check them against your church calendar.',items:rows}:null;}
async function appointments(c){
 if(c.rite==='bcp79')return c.type==='office'?pb79(c,true,/^ep/.test(c.hour||'')):calendarMode()==='1979'?pb79(c):currentEpiscopal(c);
 if(c.rite==='copt')return coptic(c);
 if(c.rite==='byz'||/^byz[vmhc]$/.test(c.rite))return byzantine(c,c.hour||c.rite);
 if(SOURCES[c.rite]){const [src,url,note]=SOURCES[c.rite];return {src,url,note,items:[]};}
 return null;
}
async function html(ctx,L){let h=L?`<p class="cite">${L.url?`<a href="${esc(L.url)}" target="_blank" rel="noopener">${esc(L.src)}</a>`:esc(L.src)}${L.title?' · '+esc(L.title):''}</p><p class="note">${esc(L.note||'')}</p>`:'';
 for(const it of L?.items||[])h+=it.issue?`<p class="note">${esc(it.lab)} · ${esc(it.cite)}: ${esc(it.issue)}</p>`:it.tr==='bcp79'?await psalm79(it.cite,it.lab):await ctx.readingBlock(it.lab,it.cite,it.num||'k',it.tr||'kj');
 return h;
}
async function mount(el,c,reader,reload){
 const L=await appointments(c),mine=custom(c),src=L?.src||'The lectionary of this service';
 if(!el.isConnected)return;
 el.innerHTML=`<details class="lesson-calendar"><summary>Lectionary calendar and Bible</summary><p><label>Date <input type="date" class="lesson-date" min="2025-11-30" max="2030-11-30" value="${esc(c.iso)}"></label></p><p class="cite">${esc(src)}</p>${L?.url?`<p><a href="${esc(L.url)}" target="_blank" rel="noopener">Open the source calendar or book</a></p>`:''}<p class="note">${esc(L?.note||'The day’s readings are printed in the service below. Use this reader for additional passages or a local calendar’s appointments.')}</p><div class="calendar-readings"></div><form class="lesson-form"><label>Readings from your calendar, one per line <textarea rows="4" maxlength="3000" placeholder="Epistle | Rom 8:1-11\nGospel | John 6:35-40">${esc(local(c).map(r=>r.lab+' | '+r.cite).join('\n'))}</textarea></label><p class="note">Use book abbreviations such as Gen, Isa, Ps, Matt, Rom and 1 Cor. These selections are saved for this rite, hour and date on this device.</p><button type="submit">Save readings</button> <button type="button" class="lesson-clear">Clear local readings</button><p class="lesson-status" role="status"></p></form></details>`;
 const out=el.querySelector('.calendar-readings'),details=el.querySelector('details');let loaded=false;
 if(c.rite==='bcp79'&&c.type!=='office'){
  out.insertAdjacentHTML('beforebegin',`<p><label>Calendar <select class="lesson-edition"><option value="current">Current Episcopal RCL · source calendar</option><option value="1979">Original 1979 Eucharistic table · historical study</option></select></label></p>`);
  const select=el.querySelector('.lesson-edition');select.value=calendarMode();
  select.addEventListener('change',()=>{try{localStorage.setItem('lect-calendar-bcp79',select.value);reload();}catch(e){el.querySelector('.lesson-status').textContent='The calendar choice could not be saved.';}});
 }
 if(c.rite==='copt'){
  out.insertAdjacentHTML('beforebegin','<p><label>Church calendar <select class="lesson-church"><option value="orthodox">Coptic Orthodox · Katameros snapshot</option><option value="local">Coptic Catholic or local calendar · enter citations</option></select></label></p>');
  const select=el.querySelector('.lesson-church');select.value=copticMode();
  select.addEventListener('change',()=>{try{localStorage.setItem('lect-calendar-copt',select.value);reload();}catch(e){el.querySelector('.lesson-status').textContent='The church calendar choice could not be saved.';}});
 }
 if(L?.hours?.length)out.insertAdjacentHTML('beforebegin',`<p><label>Readings <select class="lesson-hour"><option value="">Liturgy${mine?' · your selections':''}</option>${L.hours.map((h,i)=>`<option value="${i}">${esc(h.title)}</option>`).join('')}</select></label></p>`);
 let renderVersion=0;
 async function show(){const version=++renderVersion;try{const hour=el.querySelector('.lesson-hour')?.value,H=hour?L.hours[+hour]:null;
   let selected=H?{...L,...H}:mine||L;
   if(selected?.psalms?.length){const ps=selected.psalms.map(cite=>({lab:'Appointed Psalm',cite,tr:'bcp79'}));selected={...selected,items:c.type==='office'?[...ps,...selected.items]:[...selected.items.slice(0,1),...ps,...selected.items.slice(1)]};}
   const content=await html({readingBlock:reader},selected);if(version===renderVersion&&el.isConnected)out.innerHTML=content;
  }catch(e){loaded=false;if(version===renderVersion)out.textContent='Readings could not load. Close this panel and open it to retry.';}}
 details.addEventListener('toggle',()=>{if(!details.open||loaded)return;loaded=true;show();});
 el.querySelector('.lesson-hour')?.addEventListener('change',show);
 el.querySelector('.lesson-date').addEventListener('change',e=>{if(e.target.checkValidity()&&e.target.value)window.LectApp.follow({...c,iso:e.target.value});});
 el.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const status=el.querySelector('.lesson-status'),lines=el.querySelector('textarea').value.split('\n').map(x=>x.trim()).filter(Boolean),rows=[];
  if(lines.length>12){status.textContent='Use at most 12 readings per service.';return;}
  try{for(const line of lines){const bits=line.split('|');if(bits.length!==2||!bits[0].trim()||!bits[1].trim()){status.textContent='Use Label | citation on each line, for example Gospel | John 1:1-14.';return;}
    const [lab,cite]=bits.map(x=>x.trim());if(cite.length>200||[...cite.matchAll(/\d+/g)].some(m=>+m[0]>200)){status.textContent='Use a single, bounded Bible citation on each line.';return;}
    const p=await window.LectApp.passage(cite,'k','kj');if(!p.html.includes('class="scripture"')){status.textContent='No text found for '+cite+'. Check the citation.';return;}
    const slot=/gospel/i.test(lab)?'gospel':/^Ps /i.test(cite)?'psalter':'lessons';rows.push({lab,cite,num:'k',tr:'kj',slot});}
   localStorage.setItem(storageKey(c),JSON.stringify(rows));reload();
  }catch(err){status.textContent='The readings could not be saved. Check storage and the local Bible files, then try again.';}
 });
 el.querySelector('.lesson-clear').addEventListener('click',()=>{try{localStorage.removeItem(storageKey(c));reload();}catch(e){el.querySelector('.lesson-status').textContent='Local storage is unavailable.';}});
}
window.LectCalendar={pb79,psalm79,byzantine,appointments,custom,html,mount,officeKey,psalmRefs};
})();
