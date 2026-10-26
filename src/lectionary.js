/* Sourced appointments and a date-scoped Bible reader. No remote Scripture APIs. */
(function(){
"use strict";
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {DAY,iso}=window.LitDate, date=window.LitDate.toDate;
const cache={};
const json=p=>cache[p]||(cache[p]=fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json();}).catch(e=>{delete cache[p];throw e;}));
const {easter,advent}=window.LitDate;
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
 a:['Archdiocese of Milan · current Ambrosian calendar','https://www.chiesadimilano.it/letture-rito-ambrosiano','Use Milan’s current dated Ambrosian readings, including its own six-week Advent and cycles; they are not bundled here, so enter them below. The ordinary below is historical; current calendar readings do not make it the modern approved service.'],
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
/* The East Syrian year (Maclean's Kalendar, 1894) on the Gregorian calendar with Gregorian Easter, as the Assyrian Church of
   the East keeps it: Annunciation, Nativity, Epiphany (with the Rogation of the Ninevites), the Great Fast, the Resurrection,
   the Apostles, Summer, Eliya and the Cross, Mar Mushi and the Hallowing of the Church. Returns the day's keys in the table. */
function esyDay(isoS){
 const d=date(isoS),y=d.getUTCFullYear(),E=easter(y),off=Math.round((d-E)/DAY),dow=d.getUTCDay(),md=isoS.slice(5);
 const at=(m,dd)=>new Date(Date.UTC(y,m-1,dd)),wk=n=>new Date(+d+n*DAY),same=(a,b)=>+a===+b;
 const FIX={'12-25':'nativity','01-06':'epiphany','04-24':'giwargis','07-03':'tuma','08-06':'transfig','09-13':'cross'};
 const MOV={'-69':'nin1','-68':'nin2','-67':'nin3','-66':'nin4','-51':'departed','-49':'fast1','-48':'f1mon','-47':'f1tue','-46':'f1wed','-45':'f1thu','-44':'f1fri',
  '-42':'fast2','-37':'f2fri','-35':'fast3','-30':'f3fri','-28':'fast4','-27':'f4mon','-26':'f4tue','-25':'f4wed','-24':'f4thu','-23':'f4fri','-21':'fast5','-16':'f5fri',
  '-14':'fast6','-9':'f6fri','-7':'hosannas','-6':'f7mon','-5':'f7tue','-4':'f7wed','-3':'passover','-2':'passion','-1':'sabbath','0':'easter','1':'ww1','2':'ww2','3':'ww3',
  '4':'ww4','5':'confessors','7':'res2','14':'res3','15':'hurmizd','19':'shmuni','21':'res4','28':'res5','35':'res6','39':'ascension','42':'postasc','49':'pentecost',
  '54':'gold','56':'ap2','63':'ap3','70':'ap4','77':'ap5','84':'ap6','91':'ap7','96':'seventy','98':'su1','105':'su2','112':'su3','119':'su4','126':'su5','133':'su6',
  '138':'shimun','140':'su7'};
 const keys=[];
 if(FIX[md])keys.push(FIX[md]);
 if(MOV[off])keys.push(MOV[off]);
 const A1=advent(y),H1=new Date(+A1-28*DAY);
 if(!dow){
  if(d>=A1&&d<at(12,25))keys.push('annun'+(Math.round((d-A1)/DAY/7)+1));
  else if(d>=H1&&d<A1)keys.push('ha'+(Math.round((d-H1)/DAY/7)+1));
  else if(md>='12-26'||md<'01-06'){const x=new Date(Date.UTC(md>='12-26'?y:y-1,11,25));keys.push('nat'+Math.ceil((d-x)/DAY/7));}
  else if(off>=147&&d<H1){   /* Eliya and Mar Mushi: the fourth Sunday of Eliya is the first Sunday after the Cross */
   const F=new Date(+E+147*DAY),cr=at(9,13),C=new Date(+cr+((7-cr.getUTCDay())%7||7)*DAY),k=Math.round((C-F)/DAY/7);
   const seq=k<=0?['el1','el4','el5','el6','el7']:[...['el1','el2','el3','el5','el6','el7'].slice(0,k),'el4',...['el5','el6','el7'].filter((e,i)=>!['el1','el2','el3','el5','el6','el7'].slice(0,k).includes(e))];
   seq.push('mo1','mo2','mo3','mo4');const i=Math.round((d-F)/DAY/7);keys.push(seq[Math.min(i,seq.length-1)]);
  }
  else if(off<=-56&&md>'01-06'){   /* the Sundays of the Epiphany, joined in Maclean's order when there are fewer than eight */
   const ep=at(1,6),first=new Date(+ep+((7-ep.getUTCDay())%7||7)*DAY),S=Math.round((+E-56*DAY-first)/DAY/7)+1;
   let g=[[1],[2],[3],[4],[5],[6],[7],[8]];const join=(a,b)=>{const ia=g.findIndex(x=>x.includes(a)),ib=g.findIndex(x=>x.includes(b));if(ia<0||ib<0||ia===ib)return;g[ia]=[...g[ia],...g[ib]];g.splice(ib,1);};
   for(const [a,b] of [[7,8],[2,3],[4,5],[5,6],[1,2],[3,4],[6,7]]){if(g.length<=S)break;join(a,b);}
   const grp=g[Math.round((d-first)/DAY/7)]||g[g.length-1];grp.forEach(n=>keys.push('epi'+n));
  }
 }else if(dow===5&&!keys.length){
  const x=new Date(Date.UTC(md>='12-26'?y:y-1,11,25)),n1=new Date(+x+((7-x.getUTCDay())%7||7)*DAY),fri=new Date(+n1+5*DAY),ep=at(1,6);
  const mary=fri<new Date(Date.UTC(x.getUTCFullYear()+1,0,6))?fri:new Date(+x+((5-x.getUTCDay()+7)%7||7)*DAY);
  if(same(d,mary))keys.push('mary');
  const bap=new Date(+ep+((5-ep.getUTCDay()+7)%7||7)*DAY);
  if(same(d,bap))keys.push('baptist');
  else if(d>bap&&off<-51){const first=new Date(+ep+((7-ep.getUTCDay())%7||7)*DAY),slot=Math.round((d-5*DAY-first)/DAY/7)+1;
   const M=[null,'peterpaul','evangelists','stephen','greek','syrian','awa','martyrs'];if(M[slot])keys.push(M[slot]);}
 }
 return keys;
}
/* The Ambrosian year of the 1954 Missal: six Sundays of Advent from the second Sunday before the Roman Advent; the Sundays
   after Pentecost until the Beheading of St John (29 August), then the Sundays after the Beheading, the Sundays of October
   (the third is the Dedication of the Cathedral) and the Sundays after the Dedication; the last Sunday of October is Christ
   the King. Weekdays in Lent have their own lessons; other weekdays take the Sunday's. Returns [key, of-the-Sunday?]. */
function ambDay(isoS){
 const d=date(isoS),y=d.getUTCFullYear(),E=easter(y),off=Math.round((d-E)/DAY),dow=d.getUTCDay(),md=isoS.slice(5);
 const at=(m,dd)=>new Date(Date.UTC(y,m-1,dd)),after=(x)=>new Date(+x+((7-x.getUTCDay())%7||7)*DAY),wk=(a,b)=>Math.round((a-b)/DAY/7);
 const FIX={'12-25':'xmas','01-01':'circ','01-06':'epi'},MOV={'-7':'palm','-6':'hw1','-5':'hw2','-4':'hw3','-3':'hw4','-1':'hs','0':'easter','39':'asc','42':'ascsun','49':'pent','56':'trin','60':'corpus'};
 if(FIX[md])return [FIX[md],false];
 if(MOV[off])return [MOV[off],false];
 if(off>=1&&off<=6)return ['ew'+off,false];
 if(off>=-41&&off<=-15&&dow!==0&&dow!==5)return ['lent'+(Math.floor((off+42)/7)+1)+'-'+dow,false];
 if(off>=-41&&off<=-15&&dow===5)return [null,false];   /* the Fridays of Lent are aliturgical */
 const sun=new Date(+d-dow*DAY),so=Math.round((sun-E)/DAY),smd=iso(sun).slice(5),sy=sun.getUTCFullYear();
 const A1=new Date(+advent(sy)-14*DAY),key=(()=>{
  if(sun>=A1&&smd<'12-25')return 'adv'+(wk(sun,A1)+1);
  if(smd>='12-26'||smd<='01-05')return 'xsun';
  if(so<=-63-1&&smd>'01-06'){const f=after(new Date(Date.UTC(sy,0,6)));return 'epi'+Math.min(6,wk(sun,f)+1);}
  const S={'-63':'sept','-56':'sexa','-49':'quinq','-42':'lent1','-35':'lent2','-28':'lent3','-21':'lent4','-14':'lent5','7':'east1','14':'east2','21':'east3','28':'east4','35':'east5'}[so];
  if(S)return S;
  if(so>=63){const D1=after(new Date(Date.UTC(sy,7,29))),O1=new Date(Date.UTC(sy,9,1+(7-new Date(Date.UTC(sy,9,1)).getUTCDay())%7)),O3=new Date(+O1+14*DAY);
   const lastOct=new Date(Date.UTC(sy,9,31-new Date(Date.UTC(sy,9,31)).getUTCDay()));
   if(sun<D1)return 'pent'+Math.min(15,(so-49)/7);
   if(sun<O1)return 'dec'+Math.min(5,wk(sun,D1)+1);
   if(sun<=O3)return 'oct'+(wk(sun,O1)+1);
   if(+sun===+lastOct)return 'ck';
   return 'ded'+Math.min(3,wk(sun,O3));}
  return null;})();
 return [key,dow!==0];
}
/* ---------------------------------------------------------------- the shared lectionary layer
   A lectionary is a table and a calendar. The table (data/<name>.json) has one shape for every tradition:
     {source, url, method?, cols:{col: label}, days:{key: {t: title, r: [[col, cite, "dr"?], ...], as?: key}}}
   where a third element "dr" reads that lesson in the Douay-Rheims with Vulgate numbering, and "as" borrows the
   lessons of another day under this day's own title. The calendar is a function iso → {keys, weekday?, empty?}
   naming the day's keys (several when two observances meet), whether a weekday takes its Sunday's lessons, and
   what to say when there are none. A church whose current calendar is not bundled offers it as a choice: SOURCES
   holds that calendar's link and note, and the choice is kept in localStorage under "lect-calendar-<rite>". */
const TABLES={
 adai:{file:'data/eastsyriac-1894.json', src:'East Syrian Lectionary · Maclean 1894', num:'k', tr:'kj',
  calendar:iso=>({keys:esyDay(iso), empty:'No lessons are appointed in the Liturgy for this day.'}),
  note:()=>'The lessons of the Liturgy in A. J. Maclean’s East Syrian Daily Offices (1894), from the Urmi Lectionary of 1889, set on the Gregorian calendar with Gregorian Easter as the Assyrian Church of the East now keeps it. The Ancient Church of the East and the Chaldean Catholic Church keep other calendars, and current parish tables have revised some lessons: choose the local calendar to enter them.',
  choice:{alt:'local', options:[['maclean','Church of the East · Maclean’s lectionary (1894)'],['local','Current parish or Chaldean calendar · enter citations']]}},
 a:{file:'data/ambrosian-1954.json', src:'Ambrosian Missal · 1954', num:'v', tr:'dr',
  calendar:iso=>{const [k,weekday]=ambDay(iso);return {keys:k?[k]:[],weekday,empty:k===null&&date(iso).getUTCDay()===5?'The Fridays of Lent are aliturgical in the Ambrosian rite: no Mass is said.':'The 1954 Missal has no proper lessons for this day in the table here: the Mass of the saint or a votive Mass is said.'};},
  note:T=>'The lessons of the Ambrosian Missal of 1954 (the last edition before the reform), on its own calendar: '+T.method,
  choice:{alt:'current', options:[['1954','Ambrosian Missal of 1954 · historical table'],['current','Current Ambrosian calendar (Milan) · enter citations']]}}
};
const choiceOf=rite=>{const C=TABLES[rite]?.choice;if(!C)return null;try{return localStorage.getItem('lect-calendar-'+rite)===C.alt?C.alt:C.options[0][0];}catch(e){return C.options[0][0];}};
/* The day's lessons from a table: {src, url, title, note, items:[{lab, cite, num, tr, slot}]} */
async function fromTable(rite,c){
 const L=TABLES[rite];
 if(L.choice&&choiceOf(rite)===L.choice.alt){const [src,url,note]=SOURCES[rite];return {src,url,note,items:[]};}
 const T=await json(L.file),K=L.calendar(c.iso),items=[],names=[];
 for(const k of K.keys){let D=T.days[k];if(!D)continue;names.push(D.t);if(D.as)D={...T.days[D.as],t:D.t};
  for(const [col,cite,ver] of D.r||[]){const dr=(ver||L.tr)==='dr';items.push({lab:T.cols[col],cite,num:dr?'v':L.num,tr:dr?'dr':'kj',slot:/^gos/.test(col)?'gospel':'lessons'});}}
 const title=names.join(' · ')+(names.length&&K.weekday?' (the Sunday)':'');
 const note=L.note(T)+(K.weekday&&names.length?' This weekday takes the lessons of the Sunday.':'')+(names.length?'':' '+K.empty);
 return {src:L.src,url:T.url,title,note:note.trim(),items};
}
const eastSyriac=c=>fromTable('adai',{...c,rite:'adai'}), ambrosian=c=>fromTable('a',{...c,rite:'a'});
const storageKey=c=>'lect-lessons:'+JSON.stringify([c.type||'mass',c.rite,c.hour||'',c.iso]);
function local(c){try{const v=JSON.parse(localStorage.getItem(storageKey(c)));return Array.isArray(v)?v:[];}catch(e){return [];}}
function custom(c){const rows=local(c);return rows.length?{src:'Your readings for '+c.iso,note:'Citations selected on this device for this rite, hour and date. Check them against your church calendar.',items:rows}:null;}
async function appointments(c){
 if(c.rite==='bcp79')return c.type==='office'?pb79(c,true,/^ep/.test(c.hour||'')):calendarMode()==='1979'?pb79(c):currentEpiscopal(c);
 if(c.rite==='copt')return coptic(c);
 if(TABLES[c.rite])return fromTable(c.rite,c);
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
 if(TABLES[c.rite]?.choice){
  const C=TABLES[c.rite].choice;
  out.insertAdjacentHTML('beforebegin',`<p><label>Church calendar <select class="lesson-church">${C.options.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label></p>`);
  const select=el.querySelector('.lesson-church');select.value=choiceOf(c.rite);
  select.addEventListener('change',()=>{try{localStorage.setItem('lect-calendar-'+c.rite,select.value);reload();}catch(e){el.querySelector('.lesson-status').textContent='The church calendar choice could not be saved.';}});
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
window.LectCalendar={pb79,psalm79,byzantine,eastSyriac,esyDay,ambDay,ambrosian,fromTable,TABLES,appointments,custom,html,mount,officeKey,psalmRefs};
})();
