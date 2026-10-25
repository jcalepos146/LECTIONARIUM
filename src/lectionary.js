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
async function pb79(ctx,office=false,eve=false){
 const T=await json('data/bcp1979-lectionary.json'),B=await json('data/bcp1979.json'),d=date(ctx.iso),y=d.getUTCFullYear(),ly=y+(d>=advent(y)?1:0),cycle='ABC'[(ly+1)%3],year=ly%2?'1':'2';
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
 adai:['East Syriac Qurbana','https://archive.org/details/eastsyriandailyo00macluoft','The East Syriac seasonal lectionary has not yet been transcribed and checked. Enter the lessons from your Hudra or approved calendar.'],
 copt:['Coptic Katameros','https://www.copticchurch.net/readings','Use the Katameros for the Coptic date, movable season and local commemoration. Its complete calendar has not yet been imported.'],
 arm:['Armenian Lectionary','https://armenianchurch.us/','The Armenian calendar has its own movable commemorations. Enter the readings from your church’s calendar; a Byzantine table is not substituted.'],
 a:['Ambrosian Lectionary','https://www.chiesadimilano.it/','Select the historical or current Ambrosian book you use. Its six-week Advent and reading cycles differ from the Roman calendar; no Roman fallback is used.'],
 z:['Mozarabic Liber Commicus','https://archive.org/details/missalemixtumsec00unkngoog','The historic Mozarabic lectionary differs from the Roman calendar and the modern reformed missal. Enter the citations from the edition you use.'],
 rcus:['Mercersburg Order of Worship (1866–67)','https://archive.org/details/orderofworshipfo00refo','The book appoints its own Gospel and Epistle and a separate evening lesson table. Their full transcription is still under review.'],
 rcusv:['Mercersburg evening lesson table (1867)','https://archive.org/details/orderofworshipfo00refo','Use the Evening Lessons in the book’s table, not the morning Gospel and Epistle.'],
 rcusp:['Mercersburg preparation for Communion','https://archive.org/details/orderofworshipfo00refo','This preparatory order has no additional daily lectionary of its own. Scripture selections may be entered for study.']
};
const storageKey=c=>'lect-lessons:'+JSON.stringify([c.type||'mass',c.rite,c.hour||'',c.iso]);
function local(c){try{const v=JSON.parse(localStorage.getItem(storageKey(c)));return Array.isArray(v)?v:[];}catch(e){return [];}}
function custom(c){const rows=local(c);return rows.length?{src:'Your readings for '+c.iso,note:'Citations selected on this device for this rite, hour and date. Check them against your church calendar.',items:rows}:null;}
async function appointments(c){
 if(c.rite==='bcp79')return pb79(c,c.type==='office',/^ep/.test(c.hour||''));
 if(c.rite==='byz'||/^byz[vmhc]$/.test(c.rite))return byzantine(c,c.hour||c.rite);
 if(SOURCES[c.rite]){const [src,url,note]=SOURCES[c.rite];return {src,url,note,items:[]};}
 return null;
}
async function html(ctx,L){let h=L?`<p class="cite">${esc(L.src)}${L.title?' · '+esc(L.title):''}</p><p class="note">${esc(L.note||'')}</p>`:'';
 for(const it of L?.items||[])h+=await ctx.readingBlock(it.lab,it.cite,it.num||'k',it.tr||'kj');
 return h;
}
async function mount(el,c,reader,reload){
 const L=await appointments(c),mine=custom(c),src=L?.src||'The lectionary of this service';
 if(!el.isConnected)return;
 el.innerHTML=`<details class="lesson-calendar"><summary>Lectionary calendar and Bible</summary><p><label>Date <input type="date" class="lesson-date" min="2025-11-30" max="2030-11-30" value="${esc(c.iso)}"></label></p><p class="cite">${esc(src)}</p>${L?.url?`<p><a href="${esc(L.url)}" target="_blank" rel="noopener">Open the source calendar or book</a></p>`:''}<p class="note">${esc(L?.note||'The day’s readings are printed in the service below. Use this reader for additional passages or a local calendar’s appointments.')}</p><div class="calendar-readings"></div><form class="lesson-form"><label>Readings from your calendar, one per line <textarea rows="4" maxlength="3000" placeholder="Epistle | Rom 8:1-11\nGospel | John 6:35-40">${esc(local(c).map(r=>r.lab+' | '+r.cite).join('\n'))}</textarea></label><p class="note">Use book abbreviations such as Gen, Isa, Ps, Matt, Rom and 1 Cor. These selections are saved for this rite, hour and date on this device.</p><button type="submit">Save readings</button> <button type="button" class="lesson-clear">Clear local readings</button><p class="lesson-status" role="status"></p></form></details>`;
 const out=el.querySelector('.calendar-readings'),details=el.querySelector('details');let loaded=false;
 details.addEventListener('toggle',async()=>{if(!details.open||loaded)return;loaded=true;try{out.innerHTML=await html({readingBlock:reader},mine||L);}catch(e){loaded=false;out.textContent='Readings could not load. Close this panel and open it to retry.';}});
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
window.LectCalendar={pb79,byzantine,appointments,custom,html,mount,officeKey,psalmRefs};
})();
