/* ================================================================ PRAY TODAY */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const DAYS=window.LectDays.all;
const daysReady = window.LectDays.load();

/* ---------------------------------------------------------------- choices */
const MASS_RITES=[
  {id:"n",name:"Novus Ordo",d:"Roman Missal of Paul VI · Lectionary for Mass",tr:"dr"},
  {id:"o",name:"Ordinariate",d:"Divine Worship: The Missal · Roman readings with the Anglican calendar",tr:"kj"},
  {id:"m",name:"1962 Missal",d:"Missale Romanum 1962 · usus antiquior",tr:"dr"},
  {id:"p",name:"Pre-1955 Missal",d:"Divino Afflatu rubrics · older Holy Week",tr:"dr"},
  {id:"h",name:"Hybrid",d:"The proposal on this site: traditional core, more Scripture",tr:"dr"},
  {id:"b",name:"Byzantine Divine Liturgy",d:"Apostol and Gospel for every day",tr:"dr"},
  {id:"d",name:"Dominican Mass",d:"Ordo Praedicatorum · the Ordinary in Latin and English",tr:"dr",ord:1},
  {id:"a",name:"Ambrosian Mass",d:"Rite of Milan · the Ordinary and Canon in Latin and English",tr:"dr",ord:1},
  {id:"z",name:"Mozarabic Mass",d:"Old Spanish rite · the Ordinary in English",tr:"dr",ord:1},
  {id:"adai",name:"Liturgy of Adai and Mari (Qurbana)",d:"Assyrian and Ancient Church of the East · in the English of 1893, with the litanies, anthems and the priest's private prayers",tr:"kj",ord:1},
  {id:"copt",name:"Coptic Liturgy of St Basil",d:"Coptic Orthodox and Coptic Catholic · in the Marquis of Bute's English, with the incense, the lessons and the priest's private prayers",tr:"kj",ord:1},
  {id:"arm",name:"Armenian Divine Liturgy (Badarak)",d:"Armenian Apostolic Church · in the English of 1908, with the vesting, the litanies and the priest's private prayers",tr:"kj",ord:1},
  {id:"me08",name:"The Lord's Supper (Methodist Episcopal, 1908)",d:"Methodist · Wesley's order from the 1662 Prayer Book, as in the 1908 Ritual",tr:"kj",ord:1},
  {id:"wes84",name:"The Lord's Supper (Wesley's Sunday Service, 1784)",d:"Methodist · John Wesley's abridgement of the 1662 Prayer Book for America, with its Sunday collects, epistles and gospels",tr:"kj",ord:1},
  {id:"wes84o",name:"Morning and Evening Prayer (Wesley's Sunday Service, 1784)",d:"Methodist · Wesley's Lord's Day Morning and Evening Prayer and the Litany, with the book's collects and proper lessons",tr:"kj",ord:1},
  {id:"rca",name:"Lord's Day Morning (Reformed Church in America, 1882)",d:"Reformed · Order of Public Worship, with the Lord's Supper in the Form of Dort",tr:"kj",ord:1},
  {id:"rcus",name:"Lord's Day Morning (Reformed Church in the U.S., Mercersburg 1866)",d:"Reformed · the Order of Worship of the Mercersburg theologians, with the Holy Communion when celebrated",tr:"kj",ord:1},
  {id:"rcusv",name:"Lord's Day Evening (Reformed Church in the U.S., Mercersburg 1866)",d:"Reformed · the Evening Service of the Order of Worship",tr:"kj",ord:2},
  {id:"rcusp",name:"Preparation for the Holy Communion (Mercersburg 1866)",d:"Reformed · the preparatory service: the Law, the Litany and the address to communicants",tr:"kj",ord:2},
  {id:"byzv",name:"Great Vespers (Hapgood 1906)",d:"Eastern Orthodox and Byzantine Catholic · the Vespers of the All-Night Vigil in Isabel Hapgood's English",tr:"kj",ord:1},
  {id:"byzm",name:"Matins (Hapgood 1906)",d:"Eastern Orthodox and Byzantine Catholic · the Six Psalms to the Dismissal, in Isabel Hapgood's English",tr:"kj",ord:1},
  {id:"byzh",name:"The Hours (Hapgood 1906)",d:"Eastern Orthodox and Byzantine Catholic · the First, Third, Sixth and Ninth Hours and the Typical Psalms, in Isabel Hapgood's English",tr:"kj",ord:1},
  {id:"byzc",name:"Grand Compline (Hapgood 1906)",d:"Eastern Orthodox and Byzantine Catholic · Grand Compline in Isabel Hapgood's English",tr:"kj",ord:1},
  {id:"csbl",name:"The Litany (Common Service Book)",d:"Lutheran · the Litany of 1917-19, with its collects",tr:"kj",ord:3},
  {id:"csbs",name:"The Suffrages (Common Service Book)",d:"Lutheran · the Suffrages of 1917-19, for Matins or Vespers or alone",tr:"kj",ord:3},
  {id:"csbsm",name:"Morning Suffrages (Common Service Book)",d:"Lutheran · the brief morning office of 1917-19",tr:"kj",ord:3},
  {id:"csbse",name:"Evening Suffrages (Common Service Book)",d:"Lutheran · the brief evening office of 1917-19",tr:"kj",ord:3},
  {id:"pres",name:"Lord's Day Morning Service (Presbyterian, 1906)",d:"Reformed · The Book of Common Worship, with the Lord's Supper when celebrated",tr:"kj",ord:1},
  {id:"csbm",name:"Matins (Common Service Book)",d:"Lutheran · the morning office of 1917-19, with the collect of the day",tr:"kj",ord:2},
  {id:"csbv",name:"Vespers (Common Service Book)",d:"Lutheran · the evening office of 1917-19, with the collect of the day",tr:"kj",ord:2},
  {id:"csb",name:"The Service (Common Service Book)",d:"Lutheran · the Common Service of 1888 with the Introit, Collect, Epistle, Gradual and Gospel of the day",tr:"kj",ord:1},
  {id:"bcp62",name:"Holy Communion (1662 Prayer Book)",d:"Church of England · with the collect, epistle and gospel of the day",tr:"kj",ord:1},
  {id:"bcp28",name:"Holy Communion (1928 Prayer Book)",d:"Episcopal Church (USA) · with the collect, epistle and gospel of the day",tr:"kj",ord:1},
  {id:"bcp49",name:"The Supper of the Lord (1549 Prayer Book)",d:"Church of England · the first English Prayer Book, commonly called the Mass, in its own spelling",tr:"kj",ord:1},
  {id:"bcp52",name:"Holy Communion (1552 Prayer Book)",d:"Church of England · the second Edwardine book, the service in full",tr:"kj",ord:1},
  {id:"bcp59",name:"Holy Communion (1559 Prayer Book)",d:"Church of England · the Elizabethan book, the service in full",tr:"kj",ord:1},
  {id:"bcp37",name:"Holy Communion (1637 Scottish Prayer Book)",d:"Church of Scotland (Laud's Prayer Book) · the service in full",tr:"kj",ord:1},
  {id:"bcp89",name:"Holy Communion (1789 Prayer Book)",d:"Episcopal Church (USA), the first American book · the service in full",tr:"kj",ord:1},
  {id:"bcp29",name:"Scottish Liturgy (1929)",d:"Scottish Episcopal Church · the Scottish Communion Office of the 1929 Prayer Book, the service in full",tr:"kj",ord:1},
  {id:"bcp18",name:"Holy Communion (Canada 1918)",d:"Church of England in Canada · the first Canadian Prayer Book, the service in full",tr:"kj",ord:1},
  {id:"bcp92",name:"Holy Communion (1892 Prayer Book)",d:"Episcopal Church (USA) · the revision before 1928, the service in full",tr:"kj",ord:1},
  {id:"bcp62bap",name:"Publick Baptism of Infants (1662 Prayer Book)",d:"Church of England · the Ministration of Publick Baptism of Infants, to be used in the Church, with its 1662 rubrics",tr:"kj",ord:1},
  {id:"bcp62mat",name:"Solemnization of Matrimony (1662 Prayer Book)",d:"Church of England · the Form of Solemnization of Matrimony, from the Banns to the duties of man and wife",tr:"kj",ord:1},
  {id:"bcp62bur",name:"Burial of the Dead (1662 Prayer Book)",d:"Church of England · the Order for the Burial of the Dead, with its psalms and lesson",tr:"kj",ord:1},
  {id:"wes84bap",name:"Baptism of Infants (Wesley's Sunday Service, 1784)",d:"Methodist · Wesley's abridgement of the Prayer Book office, without godparents' promises",tr:"kj",ord:1},
  {id:"wes84mat",name:"Matrimony (Wesley's Sunday Service, 1784)",d:"Methodist · Wesley's form of solemnization, without the ring",tr:"kj",ord:1},
  {id:"wes84bur",name:"Burial of the Dead (Wesley's Sunday Service, 1784)",d:"Methodist · Wesley's order, with Psalm 90 in his own revision",tr:"kj",ord:1},
  {id:"csbbap",name:"Baptism of Infants (Common Service Book)",d:"Lutheran · the Order for the Baptism of Infants of 1917-19, with the alternate form of questions",tr:"kj",ord:1},
  {id:"csbmat",name:"Marriage (Common Service Book)",d:"Lutheran · the Order for Marriage of 1917-19",tr:"kj",ord:1},
  {id:"csbbur",name:"Burial of the Dead (Common Service Book)",d:"Lutheran · the Order for the Burial of the Dead of 1917-19, with the Service at the Grave",tr:"kj",ord:1},
  {id:"bcp79",name:"Holy Eucharist (1979 Prayer Book)",d:"Episcopal Church · Rites One and Two, Prayers A to D, with the collect of the day",tr:"kj",ord:1},
];
const OFFICE_RITES=[
  {id:"loth",name:"Liturgy of the Hours",d:"Liturgia Horarum (Paul VI), four-week psalter"},
  {id:"dwdo",name:"Ordinariate Daily Office",d:"Divine Worship: Daily Office · 1662 Mattins and Evensong, Coverdale psalter"},
  {id:"br62",name:"1962 Breviary",d:"Breviarium Romanum, 1960 rubrics · full Latin and English, with chant"},
  {id:"br55",name:"Pre-1955 Breviary",d:"Divino Afflatu rubrics · full Latin and English, with chant"},
  {id:"mon",name:"Monastic Office",d:"Benedictine Breviary (1963) · full Latin and English, with chant"},
  {id:"op",name:"Dominican Office",d:"Ordo Praedicatorum, 1962 · full Latin and English"},
  {id:"byz",name:"Byzantine Office",d:"Horologion · Octoechos"},
  {id:"bcp28",name:"1928 Prayer Book Office",d:"Episcopal Church (USA) · Morning and Evening Prayer"},
  {id:"bcp79",name:"1979 Prayer Book Office",d:"Episcopal Church · Morning and Evening Prayer, Noonday, Compline, with the 1979 Psalter"},
];
const HOURS={
  loth:[["or","Office of Readings"],["lauds","Morning Prayer"],["terce","Midmorning Prayer"],["sext","Midday Prayer"],["none","Midafternoon Prayer"],["vespers","Evening Prayer"],["compline","Night Prayer"]],
  dwdo:[["mattins","Mattins (Morning Prayer)"],["prime","Prime"],["terce","Terce"],["sext","Sext"],["none","None"],["evensong","Evensong (Evening Prayer)"],["compline","Compline"]],
  br:[["matins","Matins"],["lauds","Lauds"],["prime","Prime"],["terce","Terce"],["sext","Sext"],["none","None"],["vespers","Vespers"],["compline","Compline"]],
  bcp28:[["mp","Morning Prayer"],["ep","Evening Prayer"]],
  bcp79:[["mp2","Morning Prayer (Rite Two)"],["mp1","Morning Prayer (Rite One)"],["noonday","Noonday Prayer"],["ep2","Evening Prayer (Rite Two)"],["ep1","Evening Prayer (Rite One)"],["compline","Compline"]],
  byz:[["vespers","Vespers"],["compline","Compline"],["midnight","Midnight Office"],["orthros","Orthros (Matins)"],["first","First Hour"],["third","Third Hour"],["sixth","Sixth Hour"],["ninth","Ninth Hour"]],
};
const hoursFor=r=>HOURS[r]||HOURS.br;
/* What kind of service a rite is, in its own tradition's words: shown in the breadcrumb and on the Sanctuary tiles. */
function riteKind(type,id){
  if(type!=="mass") return "Daily office";
  if(/^(csbm|csbv|csbs|csbsm|csbse|byzv|byzm|byzh|byzc|wes84o|rcusv)$/.test(id)) return "Daily office";
  if(id==="csbl") return "Litany";
  if(id==="rcusp") return "Preparation";
  if(/bap$/.test(id)) return "Baptism";
  if(/mat$/.test(id)) return "Matrimony";
  if(/bur$/.test(id)) return "Burial";
  if(/^(n|o|m|p|h|d|a|z)$/.test(id)) return "Mass";
  if(/^(b|copt|arm)$/.test(id)) return "Divine Liturgy";
  if(id==="adai") return "Holy Qurbana";
  if(/^(rca|rcus|pres)$/.test(id)) return "Lord's Day service";
  if(id==="csb") return "The Service";
  if(/^(me08|wes84)$/.test(id)) return "Lord's Supper";
  return "Holy Communion";
}
/* The tradition each rite belongs to, for the tradition-first questions, the day names and the Sanctuary emblems. */
const FAMILY={wes84bap:"methodist",wes84mat:"methodist",wes84bur:"methodist",csbbap:"lutheran",csbmat:"lutheran",csbbur:"lutheran",wes84:"methodist",wes84o:"methodist",me08:"methodist",rca:"reformed",rcus:"reformed",rcusv:"reformed",rcusp:"reformed",pres:"reformed",
  csb:"lutheran",csbm:"lutheran",csbv:"lutheran",csbl:"lutheran",csbs:"lutheran",csbsm:"lutheran",csbse:"lutheran",
  bcp62:"anglican",bcp62bap:"anglican",bcp62mat:"anglican",bcp62bur:"anglican",bcp28:"anglican",bcp49:"anglican",bcp52:"anglican",bcp59:"anglican",bcp37:"anglican",bcp89:"anglican",bcp92:"anglican",bcp18:"anglican",bcp29:"anglican",bcp79:"anglican",dwdo:"catholic",
  b:"eastern-orthodox",byz:"eastern-orthodox",byzv:"eastern-orthodox",byzm:"eastern-orthodox",byzh:"eastern-orthodox",byzc:"eastern-orthodox",adai:"oriental",copt:"oriental",arm:"oriental"};
const familyOf=id=>FAMILY[id]||"catholic";
const FAMILIES=[["catholic","Catholic","Roman Missal, 1962 Missal and Breviary, Ordinariate, Dominican, Ambrosian, Mozarabic"],
  ["eastern-orthodox","Eastern Orthodox","Divine Liturgy, Vespers, Matins, the Hours and Compline · also Byzantine Catholic"],
  ["oriental","Oriental Orthodox and the Church of the East","Coptic, Armenian and East Syriac liturgies"],
  ["anglican","Anglican","The Prayer Books from 1549 to 1979"],
  ["lutheran","Lutheran","The Common Service, Matins, Vespers, the Suffrages and the Litany"],
  ["reformed","Reformed and Presbyterian","The Forms of Dort, Mercersburg and the Book of Common Worship"],
  ["methodist","Methodist","Wesley's Sunday Service and the Methodist Episcopal Ritual"]];
const famName=f=>(FAMILIES.find(x=>x[0]===f)||FAMILIES[0])[1];
const getFave=()=>{ try{ const v=localStorage.getItem("lect-tradition"); return FAMILIES.some(f=>f[0]===v)?v:null; }catch(e){ return null; } };
const setFave=f=>{ try{ localStorage.setItem("lect-tradition",f); }catch(e){} window.dispatchEvent(new CustomEvent("lect-tradition",{detail:f})); };
/* each tradition's usual service, and its office for the time of day (none where the books keep no daily office) */
const DEF_RITE={catholic:"n","eastern-orthodox":"b",oriental:"copt",anglican:"bcp62",lutheran:"csb",reformed:"rca",methodist:"wes84"};
function defaultOffice(f){
  const h=new Date().getHours();
  if(f==="catholic") return {type:"office",rite:"br62",hour:suggestHour("br62")};
  if(f==="eastern-orthodox") return {type:"office",rite:"byz",hour:suggestHour("byz")};
  if(f==="anglican") return {type:"office",rite:"bcp28",hour:suggestHour("bcp28")};
  if(f==="lutheran") return {type:"mass",rite:h<12?"csbm":"csbv",hour:null};
  if(f==="methodist") return {type:"mass",rite:"wes84o",hour:null};
  return null;
}
/* The Coptic date (the Alexandrian calendar of the Martyrs): 1 Thout falls on 11 September, or 12 September before a Gregorian leap year. */
const COPT_MONTHS=["Thout","Paopi","Hathor","Koiak","Tobi","Meshir","Paremhat","Parmouti","Pashons","Paoni","Epip","Mesori","the Little Month"];
function copticDate(iso){
  const jd=Math.floor(toDate(iso).getTime()/864e5)+2440588, r=jd-1825030;
  const y=Math.floor((4*r+1463)/1461), start=1825030+365*(y-1)+Math.floor(y/4), doy=jd-start;
  return `${doy%30+1} ${COPT_MONTHS[Math.floor(doy/30)]} ${y} A.M.`;
}
const tcase=t=>String(t||"").toLowerCase().replace(/(^|\s)\w/g,m=>m.toUpperCase()).replace(/\b(In|Of|The|After|Before|And|To|Our|With)\b/g,m=>m.toLowerCase()).replace(/^./,m=>m.toUpperCase());
const WEEKDAY=iso=>new Intl.DateTimeFormat("en-GB",{weekday:"long",timeZone:"UTC"}).format(toDate(iso));
/* The day as each calendar names it. */
function dayNames(iso,day){
  if(!day) return [];
  const n=day.n||{}, m=day.m||{}, b=day.b||{}, o=day.o||{};
  const trad=m.t?(m.feria&&m.note?`${m.t.replace(/ · Mass of the preceding Sunday/,"")} · ${m.note}`:m.t):"";
  let pb=o.bcp?tcase(o.bcp):"";
  if(pb&&toDate(iso).getUTCDay()!==0&&/Sunday/i.test(pb)) pb=`${WEEKDAY(iso)} · week of ${pb.replace(/^the /i,"the ")}`;
  return [
    {fam:"catholic",cal:"Roman Missal",name:n.t||"",rite:"n"},
    {fam:"catholic",cal:"1962 Missal",name:trad,rite:"m"},
    {fam:"eastern-orthodox",cal:"Byzantine",name:[b.t,b.s].filter(Boolean).join(" · "),rite:"b"},
    {fam:"oriental",cal:"Coptic",name:copticDate(iso),rite:"copt"},
    {fam:"anglican",cal:"Prayer Book",name:pb,rite:"bcp62"},
    {fam:"lutheran",cal:"Lutheran",name:pb,rite:"csb"},
    {fam:"methodist",cal:"Wesley",name:pb,rite:"wes84"},
  ].filter(x=>x.name);
}

function suggestHour(rite){
  const h=new Date().getHours()+new Date().getMinutes()/60;
  const pick = h<5?"night": h<8?"morning": h<10.5?"mid1": h<13.5?"mid2": h<16.5?"mid3": h<20?"evening":"night";
  const map={loth:{morning:"lauds",mid1:"terce",mid2:"sext",mid3:"none",evening:"vespers",night:"compline"},
    dwdo:{morning:"mattins",mid1:"terce",mid2:"sext",mid3:"none",evening:"evensong",night:"compline"},
    br:{morning:"lauds",mid1:"terce",mid2:"sext",mid3:"none",evening:"vespers",night:"compline"},
    byz:{morning:"orthros",mid1:"third",mid2:"sixth",mid3:"ninth",evening:"vespers",night:"compline"},
    bcp28:{night:"ep",morning:"mp",mid1:"mp",mid2:"mp",mid3:"ep",evening:"ep"},
    bcp79:{night:"compline",morning:"mp2",mid1:"mp2",mid2:"noonday",mid3:"noonday",evening:"ep2"}};
  return (map[rite]||map.br)[pick];
}

/* ---------------------------------------------------------------- state */
const S={type:null,rite:null,hour:null,date:null,view:"ask"};
function loadPrefs(){ try{ const p=JSON.parse(localStorage.getItem("lect-pray")||"null"); if(p){ S.type=p.type; S.rite=p.rite; S.hour=p.hour; } }catch(e){} }
function savePrefs(){ try{ localStorage.setItem("lect-pray",JSON.stringify({type:S.type,rite:S.rite,hour:S.hour})); }catch(e){} }
const todayISO=window.LitDate.today;
const {DAY,toDate,easter:easterY,advent:adv1Y,fromEaster}=window.LitDate;
const isoOf=dt=>dt.toISOString().slice(0,10);
const addDays=(iso,n)=>isoOf(new Date(toDate(iso).getTime()+n*864e5));
const longDate=iso=>new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(toDate(iso));

/* ---------------------------------------------------------------- questionnaire */
function choiceBtn(group,id,title,desc,on,extra){ return `<button type="button" class="choice${on?" on":""}" data-g="${group}" data-v="${esc(id)}" aria-pressed="${on?"true":"false"}"><span class="ct">${esc(title)}</span>${desc?`<span class="cd">${esc(desc)}</span>`:""}${extra||""}</button>`; }
/* how much of each rite's text the guide prints: complete, guided (some prayers from your own book), or order and readings */
const COV_LABEL={full:"Complete text",guide:"Guided text",order:"Order and readings"};
function coverage(type,rite,hour){
  if(type==="mass"){
    if(/^(m|p|h)$/.test(rite)) return ["full","The complete historical text is available in Latin and English. Lay study keeps priest-only passages as references and veils the words of consecration."];
    if(rite==="o") return ["guide","The Prayer Book texts, the Canon and the propers of the day are printed. Divine Worship's own wording differs in places: follow your Missal there."];
    if(rite==="n") return ["guide","The readings and the Latin Ordinary, with a traditional English beside it, are printed. The collects, preface, Eucharistic Prayer and the current English wording come from your missal: press Add text to fill them in."];
    if(rite==="d") return ["order","The Ordinary of the Dominican Mass in Latin and English, from Divinum Officium. The propers of the day (Officium, collect, lessons, responsory, offertory, secret, preface, communion, postcommunion) come from your Dominican Missal."];
    if(rite==="a") return ["order","The Ordinary and Canon of the Ambrosian Mass in Latin, with Cuthbert Atchley's 1909 English, which also gives the propers of the Epiphany and several proper prefaces as examples. The lessons of the day are given from the 1954 Missale Ambrosianum on its own calendar (six Sundays of Advent, the Sundays after the Beheading of St John and after the Dedication); the Ingressa, prayers, Psalmellus and Transitorium come from your Missal."];
    if(rite==="z") return ["order","The Ordinary of the Mozarabic Mass in a traditional English translation, after the Missale mixtum. The seven variable prayers, the Inlatio and the lessons come from the Missale Hispano-Mozarabicum."];
    if(rite==="bcp79") return ["guide","The 1979 Holy Eucharist, collect and proper preface are printed. The calendar reader links to the current Episcopal RCL; enter its citations for the date. The original 1979 Eucharistic readings remain an explicit historical study option. The Office has its own two-year table."];
    if(rite==="adai") return ["guide","The Liturgy of the Holy Apostles Adai and Mari is printed in full, in the English made for the Archbishop of Canterbury's Assyrian Mission (1893). The Law, the Prophecy, the Acts, the Apostle and the Gospel of the day are given from the East Syrian lectionary in A. J. Maclean's East Syrian Daily Offices (1894), set on the Gregorian calendar as the Assyrian Church of the East keeps it; current parish tables have revised some lessons, and the anthems and the Shuraya of the day come from the Khudhra."];
    if(rite==="copt") return ["guide","The Coptic Liturgy of St Basil is printed in full, in the Marquis of Bute's English (1882, reissued 1908). Current Coptic Orthodox Katameros readings are supplied for the supported dates, with separate Matins, Vespers and Holy Week hours in the calendar reader. Three unresolved source references are flagged. Local exceptions and Coptic Catholic appointments require your church calendar."];
    if(rite==="arm") return ["guide","The Divine Liturgy of the Armenian Church is printed in full, in the English of two Armenian priests (London, 1908). The Psalm, lessons and Gospel of the day come from the Armenian lectionary, which is not yet on this site."];
    if(rite==="me08") return ["full","The Order for the Administration of the Lord's Supper from the Ritual of the Methodist Episcopal Church (1908) is printed in full."];
    if(rite==="wes84") return ["full","The Order for the Administration of the Lord's Supper from John Wesley's Sunday Service of the Methodists in North America (1784) is printed in full, with the book's own Collect, Epistle and Gospel for each Sunday and chief feast. The book keeps no saints' days or weekday propers: on other days the Sunday's are used."];
    if(rite==="wes84o") return ["full","Morning and Evening Prayer for the Lord's Day and the Litany from Wesley's Sunday Service (1784) are printed in full, with the Psalms of the day from the book's own Select Psalms, its Collect of the day and, on Sundays and the chief feasts, the lessons of its table in the King James Version. On other days the book leaves the lessons to the Minister."];
    if(rite==="rcus") return ["full","The Regular Service on the Lord's Day, and the Holy Communion, from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) are printed in full, with the Litany, and with the book's own Gospel, Epistle and Collect for every Sunday and festival of the church year, and its Festival Prayers. The hymns and the sermon are the minister's."];
    if(rite==="rcusv") return ["full","The Evening Service from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) is printed in full, with the Litany, the Collect for the day and, on Sundays, the evening lessons of the book's Table of Scripture Lessons. The hymns and the sermon are the minister's."];
    if(rite==="rcusp") return ["full","The Preparation for the Holy Communion from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) is printed in full: the Law, the Litany, the address to the communicants, the confession and the pardon."];
    if(rite==="byzv") return ["guide","Great Vespers is printed in full from Isabel Hapgood's Service Book (1906), public domain. The hymns that change with the day (the stichera, the Dogmatikon, the Gradual and the Hymn of the Feast) come from the Octoechos and Menaion, which are not in the public domain in a modern English translation: the guide marks where they go. On the eve of the Lord's Day the Sunday stichera and troparion of the tone are given, and on the eves of the Great Feasts the feast's sticheron, Litiya hymn and troparion, from Hapgood's appendix and Special Services. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzm") return ["guide","Matins is printed in full from Isabel Hapgood's Service Book (1906), public domain: the Six Psalms, the twelve Morning Prayers, the litanies, the Polyeleos, the Gospel, the Magnificat and the Great Doxology. The hymns that change with the day (the troparia, the Canon, the stichera) come from the Octoechos and Menaion, which are not in the public domain in a modern English translation (on Sundays and the Great Feasts the troparion and the feast's Great Exaltation are given from Hapgood); the Gospel of the Resurrection is read from the Gospels. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzh") return ["guide","The First, Third, Sixth and Ninth Hours (with the Interhour) and the Typical Psalms are printed in full from Isabel Hapgood's Service Book (1906), public domain, with the psalms in the Prayer Book's wording. The troparia and kontakia of the day come from the Octoechos and Menaion, which are not in the public domain in a modern English translation; the guide marks where they go. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzc") return ["guide","Grand Compline is printed in full from Isabel Hapgood's Service Book (1906), public domain, with the psalms in the Prayer Book's wording. The hymns of the day and the Great Canon of St. Andrew are not in the public domain in a modern English translation; the guide marks where they go. Hapgood's English is not any church's present authorized text."];
    if(rite==="csbl") return ["full","The Litany of the Common Service Book (1917-19) is printed in full, with its collects and the collect of the day."];
    if(rite==="csbs") return ["full","The Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day."];
    if(rite==="csbsm") return ["full","The Morning Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day. The psalm, lesson and hymn are the minister's."];
    if(rite==="csbse") return ["full","The Evening Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day. The psalm, lesson and hymn are the minister's."];
    if(rite==="rca") return ["full","The Order of Public Worship and the Office for the Lord's Supper (the Form of Dort) from the Liturgy of the Reformed Church in America (1882) are printed in full. Prayer is ordinarily free. The lessons of the day come from the book's own Order of Scripture Lessons, in the King James Version; the psalm, if one is read, is the minister's choice."];
    if(rite==="pres") return ["full","The Order of Morning Service and the Order for the Lord's Supper from the Presbyterian Book of Common Worship (1906) are printed in full. The book sets no lectionary: the Psalter portion, the lessons, the hymns and the General Prayer are chosen by the minister."];
    if(rite==="csbm") return ["full","Matins from the Common Service Book (1917-19) is printed in full, with the collect of the day. The hymn, the psalms and the lessons are chosen by the minister, as the book directs."];
    if(rite==="csbv") return ["full","Vespers from the Common Service Book (1917-19) is printed in full, with the collect of the day. The hymn, the psalms and the lessons are chosen by the minister, as the book directs."];
    if(rite==="csb") return ["full","The Service of the Common Service Book (1917-19) is printed in full, with the Introit, Collect, Epistle, Gradual and Gospel of the day. The hymns are not included."];
    if(OCCASIONAL[rite]) return ["full",OCCASIONAL[rite].cov];
    if(rite==="bcp62") return ["full","The 1662 Order for the Administration of the Lord's Supper is printed in full, with the collect, epistle and gospel of the day as the Prayer Book gives them."];
    if(rite==="bcp49") return ["full","The Supper of the Lord and the Holy Communion in the first Prayer Book of Edward VI (1549) is printed in full, in the spelling of the book, with the Introit, Collect, Epistle and Gospel of the day."];
    if(rite==="bcp52") return ["full","The Order for the Administration of the Lordes Supper in the second Prayer Book of Edward VI (1552) is printed in full, in the spelling of the book, with the Collect, Epistle and Gospel of the day."];
    if(rite==="bcp59") return ["full","The Order for the Administration of the Lordes Supper in the Elizabethan Prayer Book (1559) is printed in full, in the spelling of the book, with the Collect, Epistle and Gospel of the day."];
    if(rite==="bcp37") return ["guide","The Order of the Administration of the Lords Supper in the Scottish Prayer Book of 1637 is printed in full, in the spelling of the book. The Collect, Epistle and Gospel of the day are given from the 1662 table, which this book follows closely; its own wording differs in places, so check your Prayer Book."];
    if(rite==="bcp89") return ["guide","The Order for the Administration of the Lord's Supper in the first American Prayer Book (1789) is printed in full. The Collect, Epistle and Gospel of the day are given from the 1662 table, which this book follows closely; its own wording differs in places, so check your Prayer Book."];
    if(rite==="bcp29") return ["guide","The Scottish Liturgy of the 1929 Scottish Book of Common Prayer is printed in full: the Consecration with its Oblation and Invocation comes before the Intercession, and the Peace, the Confession and the Communion follow. The Proper Preface follows the book's own seasons. The Collect, Epistle and Gospel of the day are given from the 1662 table; the Scottish Book's own propers differ on some days, so check your Prayer Book."];
    if(rite==="bcp18") return ["guide","The Order for the Administration of the Lord's Supper in the Canadian Prayer Book of 1918 is printed in full. It keeps the 1662 service, adding the permission to say our Lord's Summary of the Law in place of the Ten Commandments (except once on Sundays and great festivals) and a Proper Preface for the Epiphany. The Collect, Epistle and Gospel of the day are given from the 1662 table, which the book keeps; check its few new propers in your Prayer Book."];
    if(rite==="bcp92") return ["guide","The Order for the Administration of the Lord's Supper in the American Prayer Book of 1892 is printed in full. The Collect, Epistle and Gospel of the day are given from the 1662 table, which this book follows closely; its own wording differs in places, so check your Prayer Book."];
    if(rite==="bcp28") return ["full","The 1928 Order for Holy Communion is printed in full, with the collect, epistle and gospel of the day as the Prayer Book gives them."];
    if(rite==="b") return ["guide","The Liturgies of St John Chrysostom, St Basil and the Presanctified Gifts are printed in full in Isabel Hapgood's 1906 English (Greco-Russian usage), with the day's readings and, on Sundays, the Resurrection troparion and kontakion of the week's tone. The hymns of the saint, the feast and the temple come from your service books."];
  } else {
    if(/^(br62|br55|mon|op)$/.test(rite)) return ["full","Every part of the hour is printed, in Latin and English."];
    if(rite==="bcp79") return ["guide","The 1979 office and collect are printed, with the two-year Daily Office lessons and appointed psalms in the King James Bible where a verified appointment is loaded. Noonday and Compline retain their fixed short lessons. Check feast transfers and any missing appointment in your book."];
    if(rite==="bcp28") return ["full","The 1928 text is printed in full, with the collect of the day and the psalms of the day of the month. The 1928 Psalter is a light revision of Coverdale's; the Coverdale text is given. Take the lessons from the 1928 (1943) lectionary."];
    if(rite==="dwdo") return /^(prime|terce|sext|none)$/.test(hour)?["full","Printed in full from The Day-Hours of the Church of England (1877), a Prayer Book English breviary, with the Coverdale psalms and the Collect of the Day. Proper antiphons and hymn endings for feasts and seasons come from your book."]:["full","The 1662 Prayer Book text is printed in full, with the Coverdale psalms. Divine Worship adapts it in places."];
    if(rite==="loth") return ["guide","The psalms, canticles and Scripture are printed. The hymns, antiphons, intercessions and prayers come from your breviary: press Add text to fill them in."];
    if(rite==="byz") return ["guide","The psalms and the fixed prayers are printed. The hymns of the day come from your Horologion, Octoechos and Menaion: press Add text to fill them in."];
  }
  return null;
}
const covBadge=c=>c?`<span class="cov cov-${c[0]}">${COV_LABEL[c[0]]}</span>`:"";
/* Occasional services: baptism, marriage and burial, from books already on the site. They keep no calendar: the date
   only fills in the Collect or psalm where a book appoints one. */
const OCCASIONAL={
  bcp62bap:{title:"Publick Baptism of Infants",sub:"The Book of Common Prayer (1662)",cov:"The Ministration of Publick Baptism of Infants from the 1662 Prayer Book is printed in full, with the 1662 rubrics.",foot:"The Book of Common Prayer (1662), from Lynda M. Howell's transcription, proofread, with the 1662 rubrics restored from a London printing of 1800 where current printings revise them. Crown copyright in the United Kingdom; public domain elsewhere."},
  bcp62mat:{title:"The Solemnization of Matrimony",sub:"The Book of Common Prayer (1662)",cov:"The Form of Solemnization of Matrimony from the 1662 Prayer Book is printed in full, with both psalms and the duties of man and wife.",foot:"The Book of Common Prayer (1662), from Lynda M. Howell's transcription, proofread, with the 1662 rubrics on the Banns and the Sermon restored from a London printing of 1800. Crown copyright in the United Kingdom; public domain elsewhere."},
  wes84bap:{title:"The Ministration of Baptism of Infants",sub:"Wesley's Sunday Service (1784)",cov:"Wesley's Ministration of Baptism of Infants is printed in full.",foot:"John Wesley, The Sunday Service of the Methodists in North America (London, 1784), public domain, transcribed from the Internet Archive scan and set against the 1662 office Wesley abridged; his changes are kept."},
  wes84mat:{title:"The Solemnization of Matrimony",sub:"Wesley's Sunday Service (1784)",cov:"Wesley's Form of Solemnization of Matrimony is printed in full.",foot:"John Wesley, The Sunday Service of the Methodists in North America (London, 1784), public domain, transcribed from the Internet Archive scan and set against the 1662 office Wesley abridged; his changes are kept."},
  wes84bur:{title:"The Burial of the Dead",sub:"Wesley's Sunday Service (1784)",cov:"Wesley's Order for the Burial of the Dead is printed in full, with Psalm 90 in his revision.",foot:"John Wesley, The Sunday Service of the Methodists in North America (London, 1784), public domain, transcribed from the Internet Archive scan and set against the 1662 office Wesley abridged; his changes are kept."},
  csbbap:{title:"The Baptism of Infants",sub:"Common Service Book (1917-19)",cov:"The Order for the Baptism of Infants is printed in full, with the alternate form of questions.",foot:"Common Service Book of the Lutheran Church (Philadelphia, 1917-19), public domain in the United States, transcribed from the Internet Archive scan of the 1918 printing and proofread against the page images; the chant notation is left out."},
  csbmat:{title:"Marriage",sub:"Common Service Book (1917-19)",cov:"The Order for Marriage is printed in full.",foot:"Common Service Book of the Lutheran Church (Philadelphia, 1917-19), public domain in the United States, transcribed from the Internet Archive scan of the 1918 printing and proofread against the page images; the chant notation is left out."},
  csbbur:{title:"The Burial of the Dead",sub:"Common Service Book (1917-19)",cov:"The Order for the Burial of the Dead is printed in full, with its psalms, canticle and collects, the first of its lessons and the Service at the Grave; the chant settings are left out.",foot:"Common Service Book of the Lutheran Church (Philadelphia, 1917-19), public domain in the United States, transcribed from the Internet Archive scan of the 1918 printing and proofread against the page images; the chant notation is left out."},
  bcp62bur:{title:"The Burial of the Dead",sub:"The Book of Common Prayer (1662)",cov:"The Order for the Burial of the Dead from the 1662 Prayer Book is printed in full, with Psalms 39 and 90 and the lesson from 1 Corinthians 15.",foot:"The Book of Common Prayer (1662), from Lynda M. Howell's transcription, proofread against the Coverdale psalter and the King James Bible. Crown copyright in the United Kingdom; public domain elsewhere."}
};
/* every service of one tradition, the Eucharist first, then the offices, the Litany and the preparation */
const KIND_ORDER=k=>k==="Daily office"?1:k==="Litany"?2:k==="Preparation"?3:/^(Baptism|Matrimony|Burial)$/.test(k)?4:0;
function famRites(f){
  return [...MASS_RITES.map(r=>({type:"mass",...r})),...OFFICE_RITES.map(r=>({type:"office",...r}))].filter(r=>familyOf(r.id)===f)
    .map((r,i)=>({...r,i,k:riteKind(r.type,r.id)})).sort((a,b)=>KIND_ORDER(a.k)-KIND_ORDER(b.k)||a.i-b.i);
}
function renderAsk(){
  if(!S.fam) S.fam=S.rite?familyOf(S.rite):getFave();
  const famHTML=FAMILIES.map(([id,n,d])=>choiceBtn("fam",id,n,d,S.fam===id)).join("");
  let riteHTML="", hourHTML="";
  if(S.fam){ riteHTML=famRites(S.fam).map(r=>choiceBtn("rite",r.type+"|"+r.id,r.name,r.k+" · "+r.d,S.type===r.type&&S.rite===r.id,covBadge(coverage(r.type,r.id,"vespers")))).join(""); }
  const riteOK = S.type && (S.type==="mass"?MASS_RITES:OFFICE_RITES).some(r=>r.id===S.rite) && familyOf(S.rite)===S.fam;
  if(S.type==="office" && riteOK){ const sug=suggestHour(S.rite); hourHTML=hoursFor(S.rite).map(([id,n])=>choiceBtn("hour",id,n,id===sug?"Suggested for now":"",S.hour===id)).join(""); }
  const TIMED=["timed","Timed session","Fit to a set length, from 15 minutes up · for study sessions"];
  const LENGTHS=S.rite==="b"||ORD_ONLY(S.rite)?[["full","Full "+(riteKind("mass",S.rite)==="Mass"?"Mass":riteKind("mass",S.rite)==="Divine Liturgy"?"Liturgy":"service"),"As usually celebrated"],TIMED]:[["said","Said","Spoken, no music · shortest"],["sung","Sung, simple","Hymns and a chant Ordinary"],["chant","Full chant","Gregorian propers and Ordinary · longest"],TIMED];
  let lenHTML=""; if(S.type==="mass"&&riteOK){ let st={}; try{ st=JSON.parse(localStorage.getItem("lect-mass-"+S.rite)||"null")||{}; }catch(e){}
    if(!S.len||!LENGTHS.some(x=>x[0]===S.len)) S.len=st.target?"timed":(S.rite==="b"||ORD_ONLY(S.rite)?"full":(st.preset&&st.preset!=="custom"?st.preset:"sung"));
    S.mins=S.mins||st.target||20;
    lenHTML=LENGTHS.map(([id,n,d])=>choiceBtn("len",id,n,d,S.len===id)).join("");
    if(S.len==="timed") lenHTML+=`<div class="tchips minrow" role="group" aria-label="Minutes">${[15,20,30,45,60,90].map(m=>`<button type="button" class="tchip${S.mins===m?" on":""}" data-mins="${m}" aria-pressed="${S.mins===m}">${m} min</button>`).join("")}</div>`; }
  const hourOK = S.type==="mass" || (riteOK && hoursFor(S.rite).some(h=>h[0]===S.hour));
  const ready = S.type && riteOK && hourOK;
  $("#ask").innerHTML=`
    <form class="joinlive" id="joinForm" autocomplete="off"><label for="joinCode">Join a live session</label><input id="joinCode" name="code" inputmode="text" maxlength="12" placeholder="Code" aria-describedby="joinMsg"><button type="submit" class="ghost">Join</button><span class="note" id="joinMsg" aria-live="polite"></span></form>
    <ol class="steps">
      <li class="step"><h3><span class="sn">1</span>Which tradition?</h3><div class="choices two">${famHTML}</div></li>
      ${S.fam?`<li class="step"><h3><span class="sn">2</span>Which service?</h3><div class="choices">${riteHTML}</div><p class="note covkey"><span class="cov cov-full">Complete text</span> every word is printed · <span class="cov cov-guide">Guided text</span> some prayers come from your own book (add them once with <b>Add text</b>) · <span class="cov cov-order">Order and readings</span> the structure and Scripture, with the prayers from your book</p></li>`:""}
      ${S.type==="office"&&riteOK?`<li class="step"><h3><span class="sn">3</span>Which hour?</h3><div class="choices">${hourHTML}</div></li>`:""}
      ${S.type==="mass"&&riteOK?`<li class="step"><h3><span class="sn">3</span>How long${S.rite==="b"?"":", and with what music"}?</h3><div class="choices">${lenHTML}</div><p class="note">${S.len==="timed"?"The guide shortens the service step by step to fit: music first, then optional prayers, then the texts themselves, and lists what it left out. You can change the length on the next page.":"You can fine-tune hymns, chant settings, homily and Communion time, or set a time limit, on the next page."}</p></li>`:""}
      ${ready?`<li class="step"><h3><span class="sn">${S.type==="office"||S.type==="mass"?4:3}</span>For which day?</h3>
        <div class="dayrow"><input type="date" id="dayPick" value="${S.date||todayISO()}" min="2025-11-30" max="2030-11-30" aria-label="Date">
        <button type="button" class="ghost" data-day="0">Today</button><button type="button" class="ghost" data-day="1">Tomorrow</button><button type="button" class="ghost" data-day="sun">Next Sunday</button></div>
        <button type="button" class="go" id="goBtn">Open the ${S.type==="office"?"hour":riteKind("mass",S.rite)==="Mass"?"Mass":"service"}</button></li>`:""}
    </ol>`;
  $("#ask").querySelectorAll(".choice").forEach(b=>b.addEventListener("click",()=>{
    const g=b.dataset.g, v=b.dataset.v;
    if(g==="fam"){ if(S.fam!==v){ S.type=null; S.rite=null; S.hour=null; } S.fam=v; setFave(v); renderBand(); }
    if(g==="rite"){ const [t,id]=v.split("|"); S.type=t; S.rite=id; if(t==="office" && !hoursFor(id).some(h=>h[0]===S.hour)) S.hour=suggestHour(id); }
    if(g==="hour"){ S.hour=v; }
    if(g==="len"){ S.len=v; }
    renderAsk();
  }));
  $("#ask").querySelectorAll("[data-mins]").forEach(b=>b.addEventListener("click",()=>{ S.mins=+b.dataset.mins; renderAsk(); }));
  const jf=$("#joinForm"); if(jf) jf.addEventListener("submit",async ev=>{ ev.preventDefault(); const c=$("#joinCode").value.trim(); if(!c) return;
    try{ await window.LectLoad.service(); }catch(e){}   /* the live-session tools come with the service code */
    if(!window.LectTools){ $("#joinMsg").textContent="Live sessions are not available here."; return; }
    window.LectTools.join(c,msg=>{ const m=$("#joinMsg"); if(m) m.textContent=msg; }); });
  const dp=$("#dayPick"); if(dp) dp.addEventListener("change",()=>{ S.date=dp.value; });
  $("#ask").querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>{
    let iso=todayISO(); const v=b.dataset.day;
    if(v==="1") iso=addDays(iso,1);
    if(v==="sun"){ const w=toDate(iso).getUTCDay(); iso=addDays(iso,(7-w)%7||7); }
    S.date=iso; if(dp) dp.value=iso; open();
  }));
  const go=$("#goBtn"); if(go) go.addEventListener("click",()=>{ S.date=(dp&&dp.value)||todayISO(); open(); });
}
function open(){ savePrefs();
  if(S.type==="mass"&&S.len){ try{ const k="lect-mass-"+S.rite; const o=JSON.parse(localStorage.getItem(k)||"null")||{};
    if(S.len==="timed") localStorage.setItem(k,JSON.stringify({...o,target:S.mins||20}));
    else if(S.len==="full") localStorage.setItem(k,JSON.stringify({...o,target:0}));
    else if(o.preset!==S.len||o.target) localStorage.setItem(k,JSON.stringify({...o,preset:S.len,target:0,__apply:o.preset!==S.len})); }catch(e){} }
  S.view="session"; render(); window.scrollTo({top:0}); }

/* ---------------------------------------------------------------- citations → text */
const BOOKFILE={"Gen":"Gen","Exod":"Exod","Lev":"Lev","Num":"Num","Deut":"Deut","Josh":"Josh","Judg":"Judg","Ruth":"Ruth","1 Sam":"1Sam","2 Sam":"2Sam","1 Kgs":"1Kgs","2 Kgs":"2Kgs","1 Chr":"1Chr","2 Chr":"2Chr","Ezra":"Ezra","Neh":"Neh","Tob":"Tob","Jdt":"Jdt","Esth":"Esth","Est":"Esth","1 Macc":"1Macc","2 Macc":"2Macc","1 Mac":"1Macc","Job":"Job","Ps":"Ps","Prov":"Prov","Eccl":"Eccl","Song":"Song","Cant":"Song","Wis":"Wis","Sir":"Sir","Isa":"Isa","Jer":"Jer","Lam":"Lam","Bar":"Bar","Ezek":"Ezek","Dan":"Dan","Hos":"Hos","Joel":"Joel","Amos":"Amos","Obad":"Obad","Jonah":"Jonah","Mic":"Mic","Nah":"Nah","Hab":"Hab","Zeph":"Zeph","Hag":"Hag","Zech":"Zech","Mal":"Mal","Matt":"Matt","Mark":"Mark","Luke":"Luke","John":"John","Acts":"Acts","Rom":"Rom","1 Cor":"1Cor","2 Cor":"2Cor","Gal":"Gal","Eph":"Eph","Phil":"Phil","Col":"Col","1 Thess":"1Thess","2 Thess":"2Thess","1 Tim":"1Tim","2 Tim":"2Tim","Titus":"Titus","Phlm":"Phlm","Heb":"Heb","Jas":"Jas","1 Pet":"1Pet","2 Pet":"2Pet","1 John":"1John","2 John":"2John","3 John":"3John","Jude":"Jude","Rev":"Rev","Levit":"Lev","1 Kings":"1Kgs","Qoh":"Eccl"};
const BOOKALIAS={"Joh":"John","1 Mach":"1 Macc","2 Mach":"2 Macc"}, ONECHAP=new Set(["Obad","Phlm","2 John","3 John","Jude"]);
const cache={};
/* Bible books are packed several to a file (tools/shard_bible.py writes this index). */
const BIB=/*BIBLE-SHARDS*/{"cv":{"Ps":0},"dr":{"1Chr":0,"1Cor":0,"1John":0,"1Kgs":0,"1Macc":1,"1Pet":1,"1Sam":1,"1Thess":1,"1Tim":1,"2Chr":2,"2Cor":2,"2John":2,"2Kgs":2,"2Macc":2,"2Pet":2,"2Sam":3,"2Thess":3,"2Tim":3,"3John":3,"Acts":3,"Amos":3,"Bar":3,"Col":3,"Dan":3,"Deut":4,"Eccl":4,"Eph":4,"Esth":4,"Exod":4,"Ezek":5,"Ezra":5,"Gal":5,"Gen":6,"Hab":6,"Hag":6,"Heb":6,"Hos":6,"Isa":7,"Jas":7,"Jdt":7,"Jer":8,"Job":8,"Joel":8,"John":9,"Jonah":9,"Josh":9,"Jude":9,"Judg":9,"Lam":9,"Lev":10,"Luke":10,"Mal":10,"Mark":10,"Matt":11,"Mic":11,"Nah":11,"Neh":11,"Num":11,"Obad":11,"Phil":11,"Phlm":11,"Prov":12,"Ps":12,"Rev":12,"Rom":13,"Ruth":13,"Sir":13,"Song":13,"Titus":13,"Tob":13,"Wis":13,"Zech":13,"Zeph":13},"kj":{"1Chr":0,"1Cor":0,"1John":0,"1Kgs":0,"1Macc":1,"1Pet":1,"1Sam":1,"1Thess":1,"1Tim":1,"2Chr":2,"2Cor":2,"2John":2,"2Kgs":2,"2Macc":2,"2Pet":2,"2Sam":3,"2Thess":3,"2Tim":3,"3John":3,"Acts":3,"Amos":3,"Bar":3,"Col":3,"Dan":3,"Deut":4,"Eccl":4,"Eph":4,"Esth":4,"Exod":4,"Ezek":5,"Ezra":5,"Gal":5,"Gen":6,"Hab":6,"Hag":6,"Heb":6,"Hos":6,"Isa":7,"Jas":7,"Jdt":7,"Jer":8,"Job":8,"Joel":8,"John":9,"Jonah":9,"Josh":9,"Jude":9,"Judg":9,"Lam":9,"Lev":10,"Luke":10,"Mal":10,"Mark":10,"Matt":11,"Mic":11,"Nah":11,"Neh":11,"Num":11,"Obad":11,"Phil":12,"Phlm":12,"Prov":12,"Ps":12,"Rev":12,"Rom":13,"Ruth":13,"Sir":13,"Song":13,"Titus":13,"Tob":13,"Wis":13,"Zech":13,"Zeph":13}}/*END-BIBLE-SHARDS*/;
function book(tr,f){ const n=(BIB[tr]||{})[f]; if(n===undefined) return Promise.reject(new Error("missing")); const k=tr+"/s"+n; if(!cache[k]) cache[k]=fetch(`bible/${tr}/s${n}.json`).then(r=>{ if(!r.ok) throw new Error("missing"); return r.json(); }); return cache[k].then(s=>{ if(!s[f]) throw new Error("missing"); return s[f]; }); }

function parseCit(cit){
  // returns {book, segs:[[c1,v1,c2,v2]], alt:"or …", skip:reason}
  let s=String(cit).trim(), alt="";
  const orIdx=s.indexOf(" or "); if(orIdx>0){ alt=s.slice(orIdx+1); s=s.slice(0,orIdx); }
  if(/\((selections|composite)\)/.test(s)) return {skip:"selections", raw:cit};
  s=s.replace(/\s*\(.*?\)\s*/g,"").replace(/\[.*?\]/g,"").replace(/Eccl\/Qoh/,"Eccl");
  const m=/^((?:[1-4] )?[A-Za-z]+)\.?(?:\s+(.*))?$/.exec(s); if(!m) return {skip:"unparsed",raw:cit};
  const bk=BOOKALIAS[m[1]]||m[1], file=BOOKFILE[bk]; if(!file) return {skip:"book",raw:cit};
  /* a book of one chapter is cited by verse alone (Phlm 7-20) or not at all (Jude) */
  let rest=(m[2]||"").replace(/\+/g,", ").replace(/—|–/g,"-");
  if(ONECHAP.has(bk)&&!rest.includes(":")) rest=rest.trim()?"1:"+rest.trim():"1";
  if(!rest.trim()) return {skip:"unparsed",raw:cit};
  const segs=[]; let chap=null;
  /* after a semicolon a bare number followed by verses names the chapter: Sir 44:16-27; 45, 3-20 */
  const parts=[]; rest.split(/;\s*/).forEach((g,gi)=>{ const ps=g.split(/,\s*/); if(gi&&ps.length>1&&/^\d+$/.test(ps[0].trim())&&/^\d/.test(ps[1].trim())){ parts.push("@"+ps[0].trim()); ps.shift(); } parts.push(...ps); });
  for(const part0 of parts){
    if(part0.startsWith("@")){ chap=+part0.slice(1); continue; }
    const part=part0.trim().replace(/([0-9])[a-z]+/g,"$1"); if(!part) continue;
    if(chap===null){const whole=/^(\d+)-(\d+)$/.exec(part);if(whole){for(let c=+whole[1];c<=+whole[2];c++)segs.push([c,1,c,999]);chap=+whole[2];continue;}}
    let mm=/^(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(part);
    if(!mm){ const wc=/^(\d+)-(\d+)$/.exec(part); if(wc && chap===null){ for(let c=+wc[1];c<=+wc[2];c++) segs.push([c,1,c,999]); continue; } return {skip:"unparsed",raw:cit}; }
    let [ ,c1,v1,c2,v2]=mm;
    if(c1) chap=+c1;
    if(chap===null){ chap=+v1; segs.push([chap,1,chap,999]); continue; }
    const ec=c2?+c2:chap, ev=v2?+v2:+v1;
    segs.push([chap,+v1,ec,ev]); chap=ec;
  }
  return {book:bk,file,segs,alt};
}
// NAB/Hebrew numbering → Vulgate (Douay-Rheims)
function toVulgate(bk,c,v){
  if(bk==="Ps"){
    if(c===10) return ["Ps",9,v+21];
    if(c>=11&&c<=113) return ["Ps",c-1,v];
    if(c===114) return ["Ps",113,v];
    if(c===115) return ["Ps",113,v+8];
    if(c===116) return v<=9?["Ps",114,v]:["Ps",115,v-9];
    if(c>=117&&c<=146) return ["Ps",c-1,v];
    if(c===147) return v<=11?["Ps",146,v]:["Ps",147,v-11];
    return ["Ps",c,v];
  }
  // where the Douay-Rheims keeps the Hebrew division, the Hebrew numbers are already its own
  if(HEB_ENG.some(r=>r[0]===bk&&r[1]===c&&r[2]<=v&&v<=r[3]&&!r[6])) return [bk,c,v];
  const [b,cc,vv]=commonShift(bk,c,v,true), m=VERSEMAP.find(r=>r[0]===b&&r[1]===cc&&r[2]<=vv&&vv<=r[3]);
  return m?[b,m[4],vv+m[5]]:[b,cc,vv];
}
/* King James to Douay-Rheims verse numbers where the Vulgate divides a chapter otherwise (tools/build_versemap.py):
   [book, KJV chapter, first verse, last verse, Douay-Rheims chapter, verse offset]. */
const VERSEMAP=[["Gen",5,32,32,5,-1],["Gen",49,33,33,49,-1],["Gen",50,23,26,50,-1],["Exod",40,16,24,40,-2],["Exod",40,27,35,40,-2],["Exod",40,37,37,40,-1],["Exod",40,38,38,40,-2],["Lev",26,4,4,26,-1],["Lev",26,46,46,26,-1],["Num",11,35,35,11,-1],["Num",12,9,9,12,-1],["Num",12,16,16,13,-15],["Num",13,1,33,13,1],["Num",20,23,23,20,-1],["Num",20,29,29,20,1],["Num",29,40,40,30,-39],["Num",30,2,3,30,1],["Num",30,6,10,30,1],["Num",30,13,16,30,1],["Josh",4,15,15,4,-1],["Josh",4,24,24,4,1],["Josh",5,15,15,5,1],["Josh",21,38,38,21,-1],["Josh",21,39,45,21,-2],["Judg",21,9,9,21,-1],["Judg",21,25,25,21,-1],["1 Sam",23,29,29,24,-28],["1 Sam",24,1,22,24,1],["2 Sam",13,39,39,13,-1],["1 Kgs",22,44,53,22,1],["1 Chr",11,34,34,11,-1],["1 Chr",11,47,47,11,-1],["1 Chr",20,8,8,20,-1],["Neh",3,32,32,3,-1],["Neh",12,34,47,12,-1],["Tob",1,3,3,1,-1],["Tob",1,10,12,1,1],["Tob",1,15,15,1,3],["Tob",1,16,16,1,4],["Tob",1,17,22,1,3],["Tob",2,9,9,2,1],["Tob",2,11,13,2,8],["Tob",3,11,11,3,1],["Tob",3,12,14,3,2],["Tob",3,16,16,3,7],["Tob",3,17,17,3,8],["Tob",4,2,2,4,-1],["Tob",4,5,5,4,1],["Tob",4,9,20,4,1],["Tob",4,21,21,4,2],["Tob",5,3,3,5,1],["Tob",5,5,9,5,2],["Tob",5,10,13,5,6],["Tob",5,15,16,5,5],["Tob",5,17,22,5,6],["Tob",6,3,8,6,1],["Tob",6,12,14,6,1],["Tob",6,16,16,6,2],["Tob",7,4,6,7,1],["Tob",7,9,9,7,1],["Tob",7,13,18,7,2],["Tob",8,5,7,8,2],["Tob",8,9,9,8,1],["Tob",8,10,13,8,2],["Tob",8,16,19,8,2],["Tob",8,21,21,8,3],["Tob",9,2,2,9,1],["Tob",9,5,5,9,1],["Tob",9,6,6,9,4],["Tob",10,4,4,10,-1],["Tob",11,11,15,11,2],["Tob",11,19,19,11,2],["Tob",13,6,6,13,1],["Tob",13,7,10,13,2],["Tob",13,12,16,13,4],["Tob",13,17,18,13,5],["Tob",14,2,2,14,1],["Tob",14,3,5,14,2],["Tob",14,9,9,14,2],["Tob",14,12,14,14,2],["Jdt",1,4,4,1,-1],["Jdt",1,10,13,1,-1],["Jdt",2,6,6,2,-1],["Jdt",2,11,11,2,-5],["Jdt",2,12,12,2,-6],["Jdt",2,14,14,2,-7],["Jdt",2,15,15,2,-8],["Jdt",2,17,18,2,-9],["Jdt",2,19,19,2,-8],["Jdt",2,20,22,2,-9],["Jdt",2,23,28,2,-10],["Jdt",3,4,4,3,1],["Jdt",3,6,6,3,2],["Jdt",3,7,7,3,3],["Jdt",3,8,8,3,4],["Jdt",4,4,9,4,-1],["Jdt",4,11,12,4,-2],["Jdt",4,15,15,4,1],["Jdt",5,10,13,5,-1],["Jdt",5,15,15,5,2],["Jdt",5,16,23,5,4],["Jdt",7,7,7,7,-1],["Jdt",7,10,10,7,-2],["Jdt",7,13,13,7,-4],["Jdt",7,16,16,7,-6],["Jdt",7,20,20,7,-9],["Jdt",7,21,21,7,-10],["Jdt",7,23,29,7,-11],["Jdt",7,30,30,7,-7],["Jdt",7,31,32,7,-8],["Jdt",8,10,12,8,-1],["Jdt",8,16,17,8,-1],["Jdt",8,20,22,8,-1],["Jdt",8,25,25,8,-1],["Jdt",8,31,32,8,-2],["Jdt",8,34,35,8,-1],["Jdt",8,36,36,8,-2],["Jdt",9,4,6,9,-1],["Jdt",9,7,7,9,2],["Jdt",9,8,8,9,3],["Jdt",9,9,14,9,5],["Jdt",10,4,4,10,-1],["Jdt",10,12,12,10,-1],["Jdt",10,17,19,10,-1],["Jdt",10,21,21,10,-2],["Jdt",10,23,23,10,-3],["Jdt",11,5,5,11,-1],["Jdt",11,6,10,11,-2],["Jdt",11,13,13,11,-1],["Jdt",11,16,17,11,-3],["Jdt",11,19,19,11,-4],["Jdt",11,20,23,11,-2],["Jdt",13,3,3,13,2],["Jdt",13,6,13,13,2],["Jdt",13,14,14,13,3],["Jdt",13,15,16,13,4],["Jdt",13,17,18,13,5],["Jdt",13,19,19,13,6],["Jdt",13,20,20,13,5],["Jdt",14,5,7,13,23],["Jdt",14,8,8,14,-7],["Jdt",14,11,11,14,-4],["Jdt",14,12,14,14,-1],["Jdt",14,16,19,14,-2],["Jdt",15,4,9,15,1],["Jdt",15,11,11,15,2],["Jdt",16,3,8,16,1],["Jdt",16,9,13,16,2],["Jdt",16,14,17,16,3],["Jdt",16,18,22,16,4],["Jdt",16,24,25,16,5],["1 Macc",1,4,11,1,1],["1 Macc",1,14,20,1,1],["1 Macc",1,21,21,1,2],["1 Macc",1,22,30,1,1],["1 Macc",1,31,34,1,2],["1 Macc",1,35,35,1,1],["1 Macc",1,37,41,1,2],["1 Macc",1,42,42,1,1],["1 Macc",1,43,45,1,2],["1 Macc",1,46,48,1,3],["1 Macc",1,49,51,1,2],["1 Macc",1,52,62,1,3],["1 Macc",1,63,63,1,2],["1 Macc",1,64,64,1,3],["1 Macc",13,53,53,13,1],["2 Macc",2,19,32,2,1],["2 Macc",15,37,39,15,1],["Job",16,5,22,16,1],["Job",40,2,5,39,30],["Job",40,6,24,40,-5],["Job",41,1,9,40,19],["Job",41,10,34,41,-9],["Job",42,17,17,42,-1],["Eccl",5,1,1,4,16],["Eccl",5,2,20,5,-1],["Eccl",6,12,12,7,-11],["Eccl",7,1,29,7,1],["Song",1,2,17,1,-1],["Song",6,1,1,5,16],["Song",6,2,13,6,-1],["Wis",2,4,4,2,-1],["Wis",5,15,23,5,1],["Wis",6,1,22,6,1],["Wis",6,23,25,6,2],["Wis",11,5,26,11,1],["Wis",17,10,21,17,-1],["Wis",19,13,21,19,-1],["Wis",19,22,22,19,-2],["Sir",1,3,3,1,-1],["Sir",1,14,14,1,2],["Sir",1,17,18,1,4],["Sir",1,19,20,1,5],["Sir",1,21,25,1,6],["Sir",1,26,27,1,7],["Sir",1,28,29,1,8],["Sir",1,30,30,1,9],["Sir",2,11,14,2,2],["Sir",2,15,17,2,3],["Sir",2,18,18,2,4],["Sir",3,1,8,3,1],["Sir",3,9,13,3,2],["Sir",3,14,15,3,1],["Sir",3,16,18,3,2],["Sir",3,20,23,3,1],["Sir",3,24,24,3,2],["Sir",3,26,26,3,1],["Sir",3,27,29,3,2],["Sir",3,30,31,3,3],["Sir",4,11,17,4,1],["Sir",4,18,18,4,2],["Sir",4,19,20,4,3],["Sir",4,21,22,4,4],["Sir",4,23,31,4,5],["Sir",5,7,7,5,1],["Sir",5,8,14,5,2],["Sir",5,15,15,5,3],["Sir",7,11,16,7,1],["Sir",7,17,30,7,2],["Sir",7,31,31,7,3],["Sir",7,32,36,7,4],["Sir",8,3,8,8,1],["Sir",8,9,9,8,2],["Sir",8,10,19,8,3],["Sir",9,9,9,9,3],["Sir",9,10,10,9,4],["Sir",9,11,13,9,5],["Sir",9,14,14,9,7],["Sir",9,16,16,9,6],["Sir",9,17,18,9,7],["Sir",10,10,10,10,1],["Sir",10,11,13,10,2],["Sir",10,14,17,10,3],["Sir",10,18,20,10,4],["Sir",10,22,31,10,3],["Sir",11,20,21,11,1],["Sir",11,22,23,11,2],["Sir",11,24,24,11,3],["Sir",11,25,34,11,2],["Sir",12,6,6,12,1],["Sir",12,14,15,12,-1],["Sir",12,18,18,12,1],["Sir",13,3,7,13,1],["Sir",13,8,8,13,2],["Sir",13,9,13,13,3],["Sir",13,14,22,13,4],["Sir",13,23,23,13,5],["Sir",13,24,26,13,6],["Sir",15,8,8,15,-1],["Sir",15,16,20,15,1],["Sir",16,2,2,16,-1],["Sir",16,4,14,16,1],["Sir",16,28,30,16,1],["Sir",17,2,2,17,1],["Sir",17,6,9,17,-1],["Sir",17,10,15,17,-2],["Sir",17,17,20,17,-3],["Sir",17,22,25,17,-4],["Sir",17,26,26,17,-3],["Sir",17,28,28,17,-2],["Sir",17,29,32,17,-1],["Sir",19,6,6,19,-1],["Sir",19,22,30,19,-3],["Sir",20,1,1,19,27],["Sir",20,2,2,20,-1],["Sir",20,16,17,20,1],["Sir",20,18,25,20,2],["Sir",20,27,27,20,1],["Sir",20,28,31,20,2],["Sir",21,3,11,21,1],["Sir",21,12,12,21,2],["Sir",21,13,28,21,3],["Sir",22,8,8,22,1],["Sir",22,12,13,22,1],["Sir",22,14,18,22,3],["Sir",22,19,23,22,5],["Sir",22,24,27,22,6],["Sir",23,11,11,23,1],["Sir",23,12,12,23,3],["Sir",23,13,14,23,4],["Sir",23,15,16,23,5],["Sir",23,17,17,23,6],["Sir",23,18,18,23,7],["Sir",23,19,19,23,8],["Sir",23,20,21,23,9],["Sir",23,22,28,23,10],["Sir",24,3,3,24,2],["Sir",24,4,6,24,3],["Sir",24,7,8,24,4],["Sir",24,9,10,24,5],["Sir",24,11,14,24,4],["Sir",24,15,15,24,5],["Sir",24,16,18,24,6],["Sir",24,19,20,24,7],["Sir",24,21,22,24,8],["Sir",24,23,23,24,9],["Sir",24,25,29,24,10],["Sir",24,30,31,24,11],["Sir",24,32,32,24,12],["Sir",24,33,34,24,13],["Sir",25,2,2,25,1],["Sir",25,3,7,25,2],["Sir",25,8,11,25,3],["Sir",25,12,12,25,4],["Sir",25,13,13,25,5],["Sir",25,14,14,25,6],["Sir",25,15,22,25,7],["Sir",25,23,23,25,8],["Sir",25,24,25,25,9],["Sir",25,26,26,25,10],["Sir",26,6,6,26,2],["Sir",26,7,14,26,3],["Sir",26,15,15,26,4],["Sir",26,16,18,26,5],["Sir",26,28,28,26,-2],["Sir",26,29,29,26,-1],["Sir",27,3,16,27,1],["Sir",27,18,20,27,2],["Sir",27,21,30,27,3],["Sir",28,7,7,28,1],["Sir",28,8,14,28,2],["Sir",28,15,26,28,4],["Sir",29,6,6,29,1],["Sir",29,7,13,29,3],["Sir",29,14,15,29,4],["Sir",29,16,16,29,5],["Sir",29,17,17,29,4],["Sir",29,18,18,29,5],["Sir",29,19,28,29,6],["Sir",30,2,2,30,-1],["Sir",30,20,23,30,1],["Sir",30,24,25,30,2],["Sir",31,13,13,31,1],["Sir",31,14,14,31,2],["Sir",31,16,20,31,3],["Sir",31,21,22,31,4],["Sir",31,23,26,31,5],["Sir",31,27,27,31,7],["Sir",31,28,28,31,8],["Sir",31,29,29,31,9],["Sir",31,30,31,31,10],["Sir",32,3,3,32,1],["Sir",32,4,6,32,2],["Sir",32,7,7,32,3],["Sir",32,9,18,32,4],["Sir",32,19,20,32,5],["Sir",32,21,24,32,4],["Sir",33,9,9,33,1],["Sir",33,14,14,33,1],["Sir",33,17,27,33,1],["Sir",33,28,28,33,2],["Sir",33,29,30,33,1],["Sir",34,5,5,34,1],["Sir",34,11,13,34,1],["Sir",34,14,15,34,2],["Sir",34,16,18,34,3],["Sir",34,20,22,34,4],["Sir",34,23,26,34,5],["Sir",35,2,12,35,2],["Sir",35,13,15,35,3],["Sir",35,17,18,35,4],["Sir",35,19,19,35,5],["Sir",35,20,20,35,6],["Sir",36,7,7,36,1],["Sir",36,8,26,36,2],["Sir",37,7,8,37,1],["Sir",37,9,11,37,2],["Sir",37,12,12,37,3],["Sir",37,13,16,37,4],["Sir",37,18,31,37,3],["Sir",38,18,28,38,1],["Sir",38,30,30,38,3],["Sir",38,31,32,38,4],["Sir",38,33,34,38,5],["Sir",39,5,5,39,1],["Sir",39,6,6,39,2],["Sir",39,7,9,39,3],["Sir",39,10,14,39,4],["Sir",39,15,22,39,5],["Sir",39,23,23,39,6],["Sir",39,24,28,39,5],["Sir",39,29,35,39,6],["Sir",40,27,29,40,1],["Sir",40,30,30,40,2],["Sir",41,2,2,41,1],["Sir",41,3,4,41,2],["Sir",41,5,15,41,3],["Sir",41,16,19,41,4],["Sir",41,20,21,41,5],["Sir",41,22,22,41,6],["Sir",41,24,24,42,-23],["Sir",42,22,25,42,1],["Sir",43,9,17,43,1],["Sir",43,18,29,43,2],["Sir",43,30,30,43,3],["Sir",43,31,33,43,4],["Sir",44,12,12,44,1],["Sir",44,18,21,44,1],["Sir",44,22,22,44,3],["Sir",45,6,9,45,1],["Sir",45,10,13,45,2],["Sir",45,14,15,45,3],["Sir",45,16,19,45,4],["Sir",45,20,23,45,5],["Sir",45,24,25,45,6],["Sir",45,26,26,45,5],["Sir",46,2,6,46,1],["Sir",46,7,12,46,2],["Sir",46,13,20,46,3],["Sir",47,5,8,47,1],["Sir",47,9,13,47,2],["Sir",47,14,18,47,1],["Sir",47,19,22,47,2],["Sir",47,23,23,47,5],["Sir",47,24,25,47,6],["Sir",48,12,15,48,1],["Sir",48,16,20,48,2],["Sir",48,21,25,48,3],["Sir",49,2,4,49,1],["Sir",49,5,15,49,2],["Sir",49,16,16,49,3],["Sir",50,10,12,50,1],["Sir",50,13,13,50,2],["Sir",50,14,14,50,1],["Sir",50,16,29,50,2],["Sir",51,2,3,51,1],["Sir",51,4,6,51,2],["Sir",51,7,8,51,3],["Sir",51,9,12,51,4],["Sir",51,13,17,51,5],["Sir",51,18,19,51,6],["Sir",51,20,20,51,7],["Sir",51,21,30,51,8],["Isa",13,22,22,14,-21],["Isa",45,24,25,45,1],["Isa",46,12,13,46,-1],["Jer",37,5,21,37,-1],["Bar",3,17,17,3,1],["Bar",3,35,37,3,1],["Bar",6,2,15,6,-1],["Bar",6,16,17,6,-2],["Bar",6,18,42,6,-1],["Bar",6,52,73,6,-1],["Ezek",2,10,10,2,-1],["Dan",3,24,30,3,67],["Dan",4,1,3,3,97],["Dan",4,4,37,4,-3],["Hos",10,15,15,11,-14],["Hos",13,16,16,14,-15],["Hos",14,1,9,14,1],["Amos",6,11,14,6,1],["Jonah",1,17,17,2,-16],["Jonah",2,1,10,2,1],["Mic",5,13,15,5,-1],["Hag",1,15,15,2,-14],["Hag",2,1,23,2,1],["Matt",17,15,27,17,-1],["Mark",4,41,41,4,-1],["Mark",9,1,1,8,38],["Mark",9,2,50,9,-1],["John",6,52,71,6,1],["John",11,57,57,11,-1],["Acts",7,56,60,7,-1],["Acts",14,7,28,14,-1],["Acts",19,41,41,19,-1],["2 Cor",1,24,24,1,-1],["2 Cor",13,13,14,13,-1],["1 Thess",4,12,18,4,-1],["2 Thess",2,11,17,2,-1]];
/* Where the Hebrew chapter-and-verse numbering of a modern lectionary (NAB, NRSV) differs from the English (KJV):
   [book, Hebrew chapter, first verse, last verse, English chapter, verse offset, does the Douay-Rheims divide it as
   the English does?]. The last column was set by comparing the bundled Douay-Rheims and KJV chapter lengths; where
   the Vulgate keeps its own division, a Douay-Rheims reading keeps the Hebrew numbers. */
const HEB_ENG=[["Gen",32,1,1,31,54,1],["Gen",32,2,33,32,-1,1],["Exod",7,26,29,8,-25,1],["Exod",8,1,28,8,4,1],["Exod",21,37,37,22,-36,1],["Exod",22,1,30,22,1,1],["Lev",5,20,26,6,-19,1],["Lev",6,1,23,6,7,1],["Num",17,1,15,16,35,1],["Num",17,16,28,17,-15,1],["Num",30,1,1,29,39,0],["Num",30,2,17,30,-1,0],["Deut",13,1,1,12,31,1],["Deut",13,2,19,13,-1,1],["Deut",23,1,1,22,29,1],["Deut",23,2,26,23,-1,1],["Deut",28,69,69,29,-68,1],["Deut",29,1,28,29,1,1],["1 Sam",21,1,1,20,41,0],["1 Sam",21,2,16,21,-1,1],["1 Sam",24,1,1,23,28,0],["1 Sam",24,2,23,24,-1,0],["2 Sam",19,1,1,18,32,1],["2 Sam",19,2,44,19,-1,1],["1 Kgs",5,1,14,4,20,1],["1 Kgs",5,15,32,5,-14,1],["2 Kgs",12,1,1,11,20,1],["2 Kgs",12,2,22,12,-1,1],["1 Chr",5,27,41,6,-26,1],["1 Chr",6,1,66,6,15,1],["2 Chr",1,18,18,2,-17,1],["2 Chr",2,1,17,2,1,1],["2 Chr",13,23,23,14,-22,1],["2 Chr",14,1,14,14,1,1],["Neh",3,33,38,4,-32,0],["Neh",4,1,17,4,6,1],["Neh",10,1,1,9,37,1],["Neh",10,2,40,10,-1,1],["Job",40,25,32,41,-24,0],["Job",41,1,26,41,8,0],["Eccl",4,17,17,5,-16,0],["Eccl",5,1,19,5,1,0],["Song",7,1,1,6,12,0],["Song",7,2,14,7,-1,1],["Isa",63,19,19,64,-18,1],["Isa",64,1,11,64,1,1],["Jer",8,23,23,9,-22,1],["Jer",9,1,25,9,1,1],["Ezek",21,1,5,20,44,1],["Ezek",21,6,37,21,-5,1],["Hos",2,1,2,1,9,0],["Hos",2,3,25,2,-2,0],["Hos",12,1,1,11,11,1],["Hos",12,2,15,12,-1,1],["Hos",14,1,1,13,15,0],["Hos",14,2,10,14,-1,0],["Jonah",2,1,1,1,16,0],["Jonah",2,2,11,2,-1,0],["Mic",4,14,14,5,-13,0],["Mic",5,1,14,5,1,0],["Nah",2,1,1,1,14,1],["Nah",2,2,14,2,-1,1],["Zech",2,1,4,1,17,1],["Zech",2,5,17,2,-4,1]];
function commonShift(bk,c,v,dr){
  for(const [b,hc,a,z,ec,d,vg] of HEB_ENG) if(b===bk&&hc===c&&v>=a&&v<=z) return dr&&!vg?[bk,c,v]:[bk,ec,v+d];
  if(bk==="Mal"&&c===3&&v>=19) return ["Mal",4,v-18];
  if(bk==="Joel"&&c===3) return ["Joel",2,v+27];
  if(bk==="Joel"&&c===4) return ["Joel",3,v];
  if(bk==="Isa"&&c===8&&v===23) return ["Isa",9,1];
  if(bk==="Isa"&&c===9) return ["Isa",9,v+1];
  return [bk,c,v];
}
async function kjPsOffset(c){ // titles counted in NAB/Vulgate but not in KJV
  try{ const [dr,kj]=await Promise.all([book("dr","Ps"),book("kj","Ps")]); const vc=toVulgate("Ps",c,1)[1];
    if(c===10||c===114||c===115||c===116||c===147||c===9) return 0;
    const off=(dr[vc-1]||[]).length-(kj[c-1]||[]).length; return off>0&&off<=2?off:0; }catch(e){ return 0; }
}
async function passage(cit, numbering, tr){
  const p=parseCit(cit);
  if(p.skip) return {html:`<p class="note">${p.skip==="selections"?"Read in selections; the full text is not reproduced here.":"Text not available for this citation."}</p>`};
  const refs=async(trx)=>{
    let psOff=0; if(trx==="kj" && p.book==="Ps") psOff=await kjPsOffset(p.segs[0][0]);
    const out=[], seen=new Set();
    for(const [c1,v1,c2,v2] of p.segs){
      for(let c=c1;c<=c2;c++){
        const vs=c===c1?v1:1, ve=c===c2?v2:300;
        for(let v=vs; v<=ve; v++){
          let [bk,cc,vv]=[p.book,c,v];
          if(trx==="dr" && numbering!=="v") [bk,cc,vv]=toVulgate(p.book,c,v);
          if(trx==="kj"&&numbering!=="k"){ [bk,cc,vv]=commonShift(p.book,c,v); if(bk==="Ps") vv=Math.max(1,vv-psOff); }
          const key=cc+":"+vv; if(seen.has(key)) continue; seen.add(key);
          out.push([cc,vv]);
        }
      }
    }
    return out;
  };
  const load=async(trx)=>{ const rr=await refs(trx); let b; try{ b=await book(trx,p.file); }catch(e){ return []; }
    return rr.map(([cc,vv])=>[vv,(b[cc-1]||[])[vv-1]]).filter(x=>x[1]); };
  let got=await load(tr), fallback=false;
  if(tr==="kj"){ const want=(await refs("kj")).filter(x=>x[1]<300).length; const capped=p.segs.some(s=>s[3]>=999);
    if(!got.length || (!capped && got.length<want*0.67)){ const dr=await load("dr"); if(dr.length>got.length){ got=dr; fallback=true; } } }
  if(!got.length) return {html:`<p class="note">Text not available for this citation.</p>`};
  return {html:`<p class="scripture">${got.map(([vv,t])=>`<sup>${vv}</sup>${esc(t.replace(/^\s+/,""))}`).join(" ")}</p>`, fallback};
}

/* ---------------------------------------------------------------- liturgical helpers (Office) */

function psalterWeek(iso){
  const d=toDate(iso), Y=d.getUTCFullYear();
  const A=adv1Y(Y)<=d?adv1Y(Y):adv1Y(Y-1);
  const E=easterY(A.getUTCFullYear()+1), ash=new Date(E.getTime()-46*DAY), lent1=new Date(E.getTime()-42*DAY);
  const sunBefore=x=>new Date(x.getTime()-x.getUTCDay()*DAY);
  const wk=(start)=>Math.floor((sunBefore(d)-sunBefore(start))/DAY/7);
  const xmas=new Date(Date.UTC(A.getUTCFullYear(),11,25));
  const bapY=A.getUTCFullYear()+1; let bap=new Date(Date.UTC(bapY,0,7)); while(bap.getUTCDay()!==0) bap=new Date(bap.getTime()+DAY);
  let n;
  if(d<xmas) n=wk(A);
  else if(d<=bap) n=wk(A);      // Christmastide continues the Advent count (GILH 133)
  else if(d<ash) n=wk(new Date(bap.getTime()+DAY));
  else if(d<lent1) n=3;          // Ash Wednesday week is Week IV
  else if(d<E) n=wk(lent1);
  else if(d<new Date(E.getTime()+56*DAY)) n=wk(E);
  else { const nA=adv1Y(A.getUTCFullYear()+1), CK=new Date(nA.getTime()-7*DAY); const otw=34-Math.round((CK-sunBefore(d))/DAY/7); n=otw-1; }
  return ["I","II","III","IV"][((n%4)+4)%4];
}
const BCP=[null,["1-5","6-8"],["9-11","12-14"],["15-17","18"],["19-21","22-23"],["24-26","27-29"],["30-31","32-34"],["35-36","37"],["38-40","41-43"],["44-46","47-49"],["50-52","53-55"],["56-58","59-61"],["62-64","65-67"],["68","69-70"],["71-72","73-74"],["75-77","78"],["79-81","82-85"],["86-88","89"],["90-92","93-94"],["95-97","98-101"],["102-103","104"],["105","106"],["107","108-109"],["110-113","114-115"],["116-118","119:1-32"],["119:33-72","119:73-104"],["119:105-144","119:145-176"],["120-125","126-131"],["132-135","136-138"],["139-141","142-143"],["144-146","147-150"]];
function bcpPsalms(iso,evening){ let day=toDate(iso).getUTCDate(); if(day===31) day=30; const s=BCP[day][evening?1:0];
  if(s.includes(":")) return ["Ps "+s];
  const [a,b]=s.split("-").map(Number); const out=[]; for(let p=a;p<=(b||a);p++) out.push("Ps "+p); return out; }
function byzTone(iso){
  const d=toDate(iso); let E=easterY(d.getUTCFullYear()); if(d<E) E=easterY(d.getUTCFullYear()-1);
  const s=new Date(d.getTime()-d.getUTCDay()*DAY);
  const thomas=new Date(E.getTime()+7*DAY);
  if(d<thomas) return null;
  const n=Math.round((s-thomas)/DAY/7);
  const nextE=easterY(E.getUTCFullYear()+1); if(d>=new Date(nextE.getTime()-7*DAY)) return null;
  return ((n%8)+8)%8+1;
}
const EOTHINA=[null,"Matt 28:16-20","Mark 16:1-8","Mark 16:9-20","Luke 24:1-12","Luke 24:12-35","Luke 24:36-53","John 20:1-10","John 20:11-18","John 20:19-31","John 21:1-14","John 21:15-25"];
function eothinon(iso){
  const d=toDate(iso); if(d.getUTCDay()!==0) return null;
  let E=easterY(d.getUTCFullYear()); if(d<E) E=easterY(d.getUTCFullYear()-1);
  const allSaints=new Date(E.getTime()+56*DAY); if(d<allSaints) return null;
  const nextE=easterY(E.getUTCFullYear()+1); if(d>=new Date(nextE.getTime()-7*DAY)) return null;
  const n=Math.round((d-allSaints)/DAY/7); return (n%11)+1;
}


/* ---------------------------------------------------------------- Liturgy of the Hours: the four-week psalter
   Hebrew numbering, as in the Liturgy of the Hours (checked against Felix Just's psalter index). Per week, per day
   (Sun..Sat): or = Office of Readings ("x|y": Ordinary Time | other seasons), la = Morning Prayer, dp = Daytime Prayer,
   ve = Evening Prayer (Evening Prayer II on Sunday), e1 = Evening Prayer I of Sunday (said on Saturday evening). */
const LP={
 1:[{or:"Ps 1;Ps 2;Ps 3",la:"Ps 63:2-9;Dan 3:57-88, 56;Ps 149",dp:"Ps 118",ve:"Ps 110:1-5, 7;Ps 114;Rev 19:1-7",e1:"Ps 141:1-9;Ps 142;Phil 2:6-11"},
    {or:"Ps 6;Ps 9:2-21",la:"Ps 5:2-10, 12-13;1 Chr 29:10-13;Ps 29",dp:"Ps 19:8-15;Ps 7",ve:"Ps 11;Ps 15;Eph 1:3-10"},
    {or:"Ps 10;Ps 12",la:"Ps 24;Tob 13:1-8;Ps 33",dp:"Ps 119:1-8;Ps 13;Ps 14",ve:"Ps 20;Ps 21:2-8, 14;Rev 4:11;Rev 5:9-10, 12"},
    {or:"Ps 18:2-30",la:"Ps 36;Jdt 16:2-3, 13-15;Ps 47",dp:"Ps 119:9-16;Ps 17",ve:"Ps 27;Col 1:12-20"},
    {or:"Ps 18:31-51",la:"Ps 57;Jer 31:10-14;Ps 48",dp:"Ps 119:17-24;Ps 25",ve:"Ps 30;Ps 32;Rev 11:17-18;Rev 12:10-12"},
    {or:"Ps 35:1-2, 3, 9-19, 22-23, 27-28",la:"Ps 51;Isa 45:15-25;Ps 100",dp:"Ps 119:25-32;Ps 26;Ps 28:1-3, 6-9",ve:"Ps 41;Ps 46;Rev 15:3-4"},
    {or:"Ps 131;Ps 132|Ps 105",la:"Ps 119:145-152;Exod 15:1-4, 8-13, 17-18;Ps 117",dp:"Ps 119:33-40;Ps 34"}],
 2:[{or:"Ps 104",la:"Ps 118;Dan 3:52-57;Ps 150",dp:"Ps 23;Ps 76",ve:"Ps 110:1-5, 7;Ps 115;Rev 19:1-7",e1:"Ps 119:105-112;Ps 16;Phil 2:6-11"},
    {or:"Ps 31:2-17, 20-25",la:"Ps 42;Sir 36:1-5, 10-13;Ps 19:2-7",dp:"Ps 119:41-48;Ps 40:2-14, 17-18",ve:"Ps 45;Eph 1:3-10"},
    {or:"Ps 37",la:"Ps 43;Isa 38:10-14, 17-20;Ps 65",dp:"Ps 119:49-56;Ps 53;Ps 54:3-6, 8-9",ve:"Ps 49;Rev 4:11;Rev 5:9-10, 12"},
    {or:"Ps 39;Ps 52",la:"Ps 77;1 Sam 2:1-10;Ps 97",dp:"Ps 119:57-64;Ps 55:2-15, 17-24",ve:"Ps 62;Ps 67;Col 1:12-20"},
    {or:"Ps 44",la:"Ps 80;Isa 12:1-6;Ps 81",dp:"Ps 119:65-72;Ps 56:2-7, 9-14;Ps 57",ve:"Ps 72;Rev 11:17-18;Rev 12:10-12"},
    {or:"Ps 38",la:"Ps 51;Hab 3:2-4, 13, 15-19;Ps 147:12-20",dp:"Ps 119:73-80;Ps 59:2-5, 10-11, 17-18;Ps 60",ve:"Ps 116:1-9;Ps 121;Rev 15:3-4"},
    {or:"Ps 136|Ps 106",la:"Ps 92;Deut 32:1-12;Ps 8",dp:"Ps 119:81-88;Ps 61;Ps 64"}],
 3:[{or:"Ps 145",la:"Ps 93;Dan 3:57-88, 56;Ps 148",dp:"Ps 118",ve:"Ps 110:1-5, 7;Ps 111;Rev 19:1-7",e1:"Ps 113;Ps 116:10-19;Phil 2:6-11"},
    {or:"Ps 50",la:"Ps 84;Isa 2:2-5;Ps 96",dp:"Ps 119:89-96;Ps 71",ve:"Ps 123;Ps 124;Eph 1:3-10"},
    {or:"Ps 68",la:"Ps 85;Isa 26:1-4, 7-9, 12;Ps 67",dp:"Ps 119:97-104;Ps 74",ve:"Ps 125;Ps 131;Rev 4:11;Rev 5:9-10, 12"},
    {or:"Ps 89:2-38",la:"Ps 86;Isa 33:13-16;Ps 98",dp:"Ps 119:105-112;Ps 70;Ps 75",ve:"Ps 126;Ps 127;Col 1:12-20"},
    {or:"Ps 89:39-53;Ps 90",la:"Ps 87;Isa 40:10-17;Ps 99",dp:"Ps 119:113-120;Ps 79:1-5, 8-11, 13;Ps 80",ve:"Ps 132;Rev 11:17-18;Rev 12:10-12"},
    {or:"Ps 69:2-22, 30-37",la:"Ps 51;Jer 14:17-21;Ps 100",dp:"Ps 22",ve:"Ps 135;Rev 15:3-4"},
    {or:"Ps 107",la:"Ps 119:145-152;Wis 9:1-6, 9-11;Ps 117",dp:"Ps 119:121-128;Ps 34"}],
 4:[{or:"Ps 24;Ps 66",la:"Ps 118;Dan 3:52-57;Ps 150",dp:"Ps 23;Ps 76",ve:"Ps 110:1-5, 7;Ps 112;Rev 19:1-7",e1:"Ps 122;Ps 130;Phil 2:6-11"},
    {or:"Ps 73",la:"Ps 90;Isa 42:10-16;Ps 135:1-12",dp:"Ps 119:129-136;Ps 82;Ps 120",ve:"Ps 136;Eph 1:3-10"},
    {or:"Ps 102",la:"Ps 101;Dan 3:26-27, 29, 34-41;Ps 144:1-10",dp:"Ps 119:137-144;Ps 88",ve:"Ps 137:1-6;Ps 138;Rev 4:11;Rev 5:9-10, 12"},
    {or:"Ps 103",la:"Ps 108;Isa 61:10-62:5;Ps 146",dp:"Ps 119:145-152;Ps 94",ve:"Ps 139:1-18, 23-24;Col 1:12-20"},
    {or:"Ps 44",la:"Ps 143:1-11;Isa 66:10-14;Ps 147:1-11",dp:"Ps 119:153-160;Ps 128;Ps 129",ve:"Ps 144;Rev 11:17-18;Rev 12:10-12"},
    {or:"Ps 55:2-15, 17-24|Ps 78:1-39",la:"Ps 51;Tob 13:8-11, 13-15;Ps 147:12-20",dp:"Ps 119:161-168;Ps 133;Ps 140:1-9, 13-14",ve:"Ps 145;Rev 15:3-4"},
    {or:"Ps 50|Ps 78:40-72",la:"Ps 92;Ezek 36:24-28;Ps 8",dp:"Ps 119:169-176;Ps 45"}]};
/* Night Prayer keeps a one-week cycle; Saturday's is after Evening Prayer I of Sunday */
const LP_NIGHT=["Ps 91","Ps 86","Ps 143:1-11","Ps 31:1-6;Ps 130","Ps 16","Ps 88","Ps 4;Ps 134"];
const CANT_NAME={Dan:"Daniel",Exod:"Exodus",Deut:"Deuteronomy","1 Chr":"1 Chronicles","1 Sam":"1 Samuel",Tob:"Tobit",Jdt:"Judith",Sir:"Sirach",Wis:"Wisdom",Isa:"Isaiah",Jer:"Jeremiah",Ezek:"Ezekiel",Hab:"Habakkuk",Phil:"Philippians",Eph:"Ephesians",Col:"Colossians",Rev:"Revelation","1 Pet":"1 Peter"};
function lothPsalms(iso, H, day){
  const d=toDate(iso), dow=d.getUTCDay(), t=(day.n&&day.n.t)||"", seasonal=/Advent|Christmas|Lent|Easter|Holy Week|Palm Sunday|Octave|Epiphany/.test(t), lent=/Lent|Holy Week|Palm Sunday/.test(t);
  const wn=x=>({I:1,II:2,III:3,IV:4})[psalterWeek(x)]||1, w=wn(iso), D=LP[w][dow];
  let list;
  if(H==="compline") list=LP_NIGHT[dow];
  else if(H==="vespers"&&dow===6) list=LP[wn(addDays(iso,1))][0].e1;
  else if(H==="vespers") list=D.ve;
  else if(H==="lauds") list=D.la;
  else if(H==="or"){ const [ot,alt]=D.or.split("|"); list=seasonal&&alt?alt:ot; }
  else list=D.dp;
  if(!list) return [];
  let cits=list.split(";");
  if(lent) cits=cits.map(c=>c==="Rev 19:1-7"?"1 Pet 2:21-24":c);
  // a canticle cited in two parts (Rev 4:11; 5:9-10, 12) is one canticle
  const out=[]; cits.forEach(c=>{ const prev=out[out.length-1]; const bk=c.replace(/\s+\d.*$/,"");
    if(prev&&bk!=="Ps"&&prev.bk===bk&&bk!=="Dan") prev.c+="; "+c.replace(/^.*?\s(?=\d+:)/,""); else out.push({bk,c}); });
  return out.map(({bk,c})=>{
    if(bk==="Ps"){ const m=/^Ps (\d+)/.exec(c), n=+m[1], v=toVulgate("Ps",n,1)[1]; return {lab:`Psalm ${n}${v!==n?` (${v})`:""}${/:/.test(c)?c.replace(/^Ps \d+/,""):""}`, cit:c}; }
    return {lab:`Canticle · ${CANT_NAME[bk]||bk} ${c.replace(/^.*?\s(?=\d)/,"")}`, cit:c};
  });
}

const doDate=iso=>{ const [y,m,d]=iso.split("-"); return `${m}-${d}-${y}`; };
/* ---------------------------------------------------------------- session render */
async function readingBlock(lab,cit,num,tr,added){
  let body;
  try{ const p=await passage(cit,num,tr); body=p.html+(p.fallback?`<p class="note">This passage is not in the King James Version, so it is given in the Douay-Rheims.</p>`:""); }
  catch(e){ body=`<p class="note">The text could not be loaded.</p>`; }
  const alt=parseCit(cit).alt;
  return `<section class="reading${added?" added":""}"><header><span class="rl">${esc(lab)}${added?" · hybrid addition":""}</span><span class="rc">${esc(cit.split(" or ")[0])}</span></header>${alt?`<p class="note">Or: ${esc(alt.replace(/^or\s+/,""))}</p>`:""}<div class="rtext">${body}</div></section>`;
}
const RITE_TR={n:"dr",o:"kj",m:"dr",p:"dr",h:"dr",b:"dr",d:"dr",a:"dr",z:"dr",bcp28:"kj",bcp62:"kj",bcp49:"kj",bcp52:"kj",bcp59:"kj",bcp37:"kj",bcp89:"kj",wes84:"kj",wes84o:"kj",bcp92:"kj",bcp18:"kj",bcp29:"kj",bcp79:"kj",csb:"kj",csbm:"kj",csbv:"kj",pres:"kj",rca:"kj",csbse:"kj",byzc:"kj",byzv:"kj",byzm:"kj",byzh:"kj",csbsm:"kj",csbs:"kj",csbl:"kj",rcus:"kj",rcusv:"kj",rcusp:"kj",me08:"kj",arm:"kj",copt:"kj",adai:"kj"};
const ORD_ONLY=r=>!!(MASS_RITES.find(x=>x.id===r)||{}).ord;
async function renderSession(){
  await daysReady;
  try{ await window.LectLoad.service(); }catch(e){}
  const iso=S.date||todayISO();
  window.dispatchEvent(new CustomEvent("lect-session",{detail:{type:S.type,rite:S.rite,hour:S.hour,iso,label:(S.type==="mass"?MASS_RITES:OFFICE_RITES).find(r=>r.id===S.rite)?.name}}));
  const rname=(S.type==="mass"?MASS_RITES:OFFICE_RITES).find(r=>r.id===S.rite).name, rk=riteKind(S.type,S.rite);
  const crumbs=rname.toLowerCase().startsWith(rk.toLowerCase())?[rname]:[rk,rname];
  if(S.type==="office") crumbs.push(hoursFor(S.rite).find(h=>h[0]===S.hour)[1]);
  await window.LectDays.load(iso);
  const day=DAYS[iso];
  let head=`<div class="sesbar"><button type="button" class="ghost" id="backAsk">← Change</button><span class="crumbs">${crumbs.map(esc).join(" › ")}</span>
    <span class="daynav"><button type="button" class="ghost" id="prevDay" aria-label="Previous day">‹</button><span class="dlabel">${esc(longDate(iso))}</span><button type="button" class="ghost" id="nextDay" aria-label="Next day">›</button></span></div>`;
  { const c=coverage(S.type,S.rite,S.hour); if(c) head+=`<details class="covline"${matchMedia("(min-width:701px)").matches?" open":""}><summary>${covBadge(c)}<span class="covabout">About this text</span></summary>${esc(c[1])}</details>`; }
  let body="", officeData=null;
  if(!day){ body=`<p class="empty">This page covers 30 November 2025 to 30 November 2030. Choose a date in that range.</p>`; }
  else if(S.type==="mass"&&S.rite==="bcp79"){
    const B=await fetch("data/bcp1979.json").then(r=>r.json()), D=window.LectPB79?window.LectPB79.day(iso,B.collects.c):null;
    body=`<h2 class="dayname">${esc(D?D.title:"")}</h2><p class="daysub">The Book of Common Prayer (1979)${D&&D.title!==D.season?` · ${esc(D.season)}`:""}</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer (Episcopal Church, 1979), which is not under copyright, as presented by The Online Book of Common Prayer (bcponline.org). The current-calendar option links to the Episcopal RCL. The original 1979 Eucharistic table is available for historical study through the calendar selector. Bundled Scripture uses public-domain Bibles. Local feast transfers require your church calendar.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="adai"){
    body=`<h2 class="dayname">The Hallowing of the Apostles</h2><p class="daysub">The Church of the East</p><div id="massGuide"></div><footer class="sesfoot"><p>The Liturgy of the Holy Apostles Adai and Mari, translated for the Archbishop of Canterbury's Assyrian Mission (London, 1893), public domain, transcribed from the Internet Archive scan. The translators' notes are kept. Chaldean Catholic use differs (the Words of Institution are written into the anaphora and the commemorations are changed); follow your own book.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="copt"){
    body=`<h2 class="dayname">The Liturgy of St Basil</h2><p class="daysub">The Coptic Church</p><div id="massGuide"></div><footer class="sesfoot"><p>The Coptic Morning Service for the Lord's Day, translated into English by John, Marquis of Bute (London: Cope and Fenwick, 1908), public domain, transcribed from the Internet Archive scan. Bute translated the Coptic Missal printed at Rome and noted where Coptic Catholic and Coptic Orthodox use differ; his notes are kept. Follow your own book.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="arm"){
    body=`<h2 class="dayname">The Divine Liturgy</h2><p class="daysub">The Holy Apostolic Church of Armenia</p><div id="massGuide"></div><footer class="sesfoot"><p>The Divine Liturgy of the Holy Apostolic Church of Armenia, translated into English by two Armenian priests (London: Cope and Fenwick, 1908), public domain in the United States, transcribed from the Internet Archive scan. Armenian Catholic use differs in its commemorations; follow your own book.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="me08"){
    body=`<h2 class="dayname">The Lord's Supper</h2><p class="daysub">Ritual of the Methodist Episcopal Church (1908)</p><div id="massGuide"></div><footer class="sesfoot"><p>Ritual of the Methodist Episcopal Church (New York: Eaton &amp; Mains, 1908), public domain, transcribed from the Internet Archive scan. The order descends from John Wesley's Sunday Service of 1784.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="rcus"){
    body=`<h2 class="dayname">The Lord's Day</h2><p class="daysub">Regular Service and Holy Communion · Order of Worship, Reformed Church in the United States (Mercersburg, 1866)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Order of Worship for the Reformed Church in the United States (Philadelphia, 1866), public domain, transcribed from the Internet Archive scan and checked against the later editions.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="rcusv"){
    body=`<h2 class="dayname">The Lord's Day</h2><p class="daysub">Evening Service · Order of Worship, Reformed Church in the United States (Mercersburg, 1866)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Order of Worship for the Reformed Church in the United States (Philadelphia, 1866), public domain, transcribed from the Internet Archive scan and checked against the later editions.</p></footer>`;
  }
  else if(S.type==="mass"&&OCCASIONAL[S.rite]){
    const O=OCCASIONAL[S.rite];
    body=`<h2 class="dayname">${esc(O.title)}</h2><p class="daysub">${esc(O.sub)}</p><div id="massGuide"></div><footer class="sesfoot"><p>${esc(O.foot)}</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="rcusp"){
    body=`<h2 class="dayname">The Lord's Day</h2><p class="daysub">Preparation for the Holy Communion · Order of Worship, Reformed Church in the United States (Mercersburg, 1866)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Order of Worship for the Reformed Church in the United States (Philadelphia, 1866), public domain, transcribed from the Internet Archive scan and checked against the later editions.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="byzv"){
    body=`<h2 class="dayname">Great Vespers</h2><p class="daysub">The Eastern Orthodox Church · the All-Night Vigil</p><div id="massGuide"></div><footer class="sesfoot"><p>Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church, translated by Isabel Florence Hapgood (Boston and New York: Houghton, Mifflin, 1906), public domain in the United States, transcribed from the Internet Archive scan. Hapgood's English is a historical translation, not any church's present authorized text.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="byzm"){
    body=`<h2 class="dayname">Matins</h2><p class="daysub">The Eastern Orthodox Church · the All-Night Vigil</p><div id="massGuide"></div><footer class="sesfoot"><p>Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church, translated by Isabel Florence Hapgood (Boston and New York: Houghton, Mifflin, 1906), public domain in the United States, transcribed from the Internet Archive scan. Hapgood's English is a historical translation, not any church's present authorized text.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="byzh"){
    body=`<h2 class="dayname">The Hours</h2><p class="daysub">The Eastern Orthodox Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church, translated by Isabel Florence Hapgood (Boston and New York: Houghton, Mifflin, 1906), public domain in the United States, transcribed from the Internet Archive scan. Hapgood's English is a historical translation, not any church's present authorized text.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="byzc"){
    body=`<h2 class="dayname">Grand Compline</h2><p class="daysub">The Eastern Orthodox Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church, translated by Isabel Florence Hapgood (Boston and New York: Houghton, Mifflin, 1906), public domain in the United States, transcribed from the Internet Archive scan. Hapgood's English is a historical translation, not any church's present authorized text.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbl"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">The Litany · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the Internet Archive scan of the 1919 text edition.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbs"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">The Suffrages · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the Internet Archive scan of the 1919 text edition.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbsm"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">Morning Suffrages · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the Internet Archive scan of the 1919 text edition.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbse"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">Evening Suffrages · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the Internet Archive scan of the 1919 text edition.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="rca"){
    body=`<h2 class="dayname">The Lord's Day</h2><p class="daysub">The Liturgy of the Reformed Church in America (1882)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Liturgy of the Reformed Church in America, for use in public worship (New York, 1882), public domain, transcribed from the Internet Archive scan. Its Office for the Lord's Supper is the Form of the Synod of Dort.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="pres"){
    body=`<h2 class="dayname">The Lord's Day</h2><p class="daysub">The Book of Common Worship (Presbyterian Church in the U.S.A., 1906)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Worship, prepared by the Committee of the General Assembly of the Presbyterian Church in the United States of America (Philadelphia, 1906), public domain, transcribed from the Internet Archive scan.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbm"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">Matins · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the typed edition and proofread against the Internet Archive scans.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csbv"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">Vespers · Common Service Book of the Lutheran Church</p><div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the typed edition and proofread against the Internet Archive scans.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="csb"){
    const B=await fetch("data/lutheran-csb.json").then(r=>r.json()), C=window.LectCSB?window.LectCSB.day(iso,B.days):null, P=C&&C.day;
    body=`<h2 class="dayname">${esc(P?P.t:"")}</h2><p class="daysub">Common Service Book of the Lutheran Church${C&&C.weekday?" · the Sunday's propers serve the week":""}${C&&C.second?` · with the Collect of ${esc(C.second.t)}`:""}</p>${C&&C.note?`<p class="callout">${esc(C.note)}</p>`:""}<div id="massGuide"></div><footer class="sesfoot"><p>Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain, transcribed from the Internet Archive scan of the 1919 text edition and proofread against the 1917 and 1918 printings. Lessons the book only cites are supplied in the King James Version.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp62"){
    const B=await fetch("data/bcp1662.json").then(r=>r.json()), pr=window.LectPB?window.LectPB.propers(B,iso,day):(day.o&&day.o.bcp&&B.propers[day.o.bcp]);
    const wk=pr&&toDate(iso).getUTCDay()&&!/BEFORE EASTER|FRIDAY|EVEN|WEEK|DAY$/i.test(pr.t.toUpperCase())&&/SUNDAY/i.test(pr.t);
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1662)${wk?" · the Sunday's collect, epistle and gospel serve the week":""}</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer (1662), as transcribed by Lynda M. Howell (eskimo.com/~lhowell/bcp1662), with the 1662 wording of the opening rubrics restored from her notes on later changes. The epistles and gospels are the Prayer Book's own King James text. Within the United Kingdom the Prayer Book is Crown property, administered by the King's Printer.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp49"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1549)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Church of England (1549), public domain, as transcribed by the Society of Archbishop Justus, in the spelling of the book. The Introit, Collect, Epistle and Gospel of the day are from the same Justus transcription of the book's Epistles and Gospels table; where the three Prayer Books differ in a day's wording, the margin notes decide.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp52"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1552)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Church of England (1552), public domain, as transcribed by the Society of Archbishop Justus, in the spelling of the book. The Collect, Epistle and Gospel of the day are from the same Justus transcription of the book's table; where the books differ in a day's wording, the margin notes decide.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp59"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1559)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Church of England (1559), public domain, as transcribed by the Society of Archbishop Justus, in the spelling of the book. The Collect, Epistle and Gospel of the day are from the same Justus transcription of the book's table; where the books differ in a day's wording, the margin notes decide.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp37"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Booke of Common Prayer (Scotland, 1637)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Booke of Common Prayer for the Church of Scotland (1637), public domain, as transcribed by the Society of Archbishop Justus, in the spelling of the book. The Collect, Epistle and Gospel of the day are from the same Justus transcription of the book's table; where the books differ in a day's wording, the margin notes decide.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="wes84o"){
    const B=await fetch("data/bcp1784.json").then(r=>r.json()), pr=window.LectPB?window.LectPB.propers(B,iso,day,DAYS):null;
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">Morning and Evening Prayer · The Sunday Service of the Methodists in North America (1784)</p><div id="massGuide"></div><footer class="sesfoot"><p>John Wesley, The Sunday Service of the Methodists in North America (London, 1784), public domain, transcribed from the Internet Archive scan and checked against the 1662 Prayer Book it abridges. Wesley appointed these services for the Lord's Day and the Litany for Wednesdays and Fridays, "praying extempore on all other days". The Psalms are Wesley's Select Psalms, read through each month; the lessons are those of the book's table, in the King James Version.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="wes84"){
    const B=await fetch("data/bcp1784.json").then(r=>r.json()), pr=window.LectPB?window.LectPB.propers(B,iso,day,DAYS):null;
    const wk=pr&&toDate(iso).getUTCDay()&&/SUNDAY/i.test(pr.t);
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">The Sunday Service of the Methodists in North America (1784)${wk?" · the Sunday's collect, epistle and gospel serve the week":""}</p><div id="massGuide"></div><footer class="sesfoot"><p>John Wesley, The Sunday Service of the Methodists in North America, with Other Occasional Services (London, 1784), public domain, transcribed from the Internet Archive scan of the Princeton Theological Seminary copy and checked against the 1662 Prayer Book it abridges. Wesley numbers the Sundays from Christmas to Lent as Sundays after Christmas; the 1662 name of each is given beside it. The epistles and gospels are the King James text the book prints.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp89"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1789)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Protestant Episcopal Church in the United States of America (1789), public domain, as transcribed by the Society of Archbishop Justus. The Collect, Epistle and Gospel of the day are given from the 1662 Prayer Book, whose table this book follows closely.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp29"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Scottish Book of Common Prayer (1929)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Scottish Liturgy (the Scottish Communion Office) of the Scottish Book of Common Prayer (1929), public domain in the United States, proofread from the Internet Archive scan of the separately printed Liturgy (a later impression naming the Queen). The Collect, Epistle and Gospel of the day are given from the 1662 Prayer Book.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp18"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (Canada, 1918)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer according to the Use of the Church of England in the Dominion of Canada (1918), public domain, from the Society of Archbishop Justus transcription checked against its typeset edition. The Collect, Epistle and Gospel of the day are given from the 1662 Prayer Book, whose table this book keeps.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp92"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1892)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Protestant Episcopal Church in the United States of America (1892), public domain, as transcribed by the Society of Archbishop Justus. The Collect, Epistle and Gospel of the day are given from the 1662 Prayer Book, whose table this book follows closely.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp28"){
    const B=await fetch("data/bcp1928.json").then(r=>r.json()), pr=day.o&&day.o.bcp&&B.propers[day.o.bcp];
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1928)${pr&&toDate(iso).getUTCDay()?" · the Sunday's collect, epistle and gospel serve the week":""}</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Protestant Episcopal Church in the United States of America (1928), public domain, as transcribed by the Society of Archbishop Justus. The epistles and gospels are the Prayer Book's own King James text.</p></footer>`;
  }
  else if(S.type==="mass"&&ORD_ONLY(S.rite)){
    const nm=MASS_RITES.find(x=>x.id===S.rite).name;
    const src={d:"The Ordinary is Divinum Officium's Dominican Ordo (MIT licence): the Latin of the Missale Ordinis Praedicatorum with a volunteer English translation.",
      a:"The Latin Ordinary and Canon are Divinum Officium's Ambrosian Ordo (MIT licence). The English is E. G. Cuthbert F. Atchley, The Ambrosian Liturgy (London, 1909), public domain, transcribed from the Internet Archive scan.",
      z:"The English Ordinary is Divinum Officium's Mozarabic Ordo (MIT licence), a traditional translation following the Missale mixtum. Divinum Officium's Latin follows the reformed Missale Hispano-Mozarabicum (1991), a modern edition, and is not reproduced."}[S.rite];
    body=`<h2 class="dayname">${esc(nm)}: the Ordinary</h2><p class="callout">The fixed texts of the Mass are printed in full. This rite keeps its own calendar and propers, which are not on this site yet: the guide marks where they go.</p><div id="massGuide"></div><footer class="sesfoot"><p>${src}</p></footer>`;
  }
  else if(S.type==="mass"){
    const r=day[S.rite], tr=RITE_TR[S.rite];
    const trName=tr==="kj"?"King James Version (with Apocrypha)":"Douay-Rheims (Challoner)";
    if(!r){
      body=`<h2 class="dayname">No proper readings listed</h2><p class="lede">No Divine Liturgy readings are appointed for this day (for example, Great and Holy Friday). For the full lectionary, see the <a href="https://byzcath.org/index.php/bible/byzantine-lectionary" target="_blank" rel="noopener">Byzantine lectionary</a>.</p>`;
      if(S.rite==="b") body+=`<div id="massGuide"></div>`;
    } else {
      const sub=[r.s, S.rite==="n"||S.rite==="o"?`Sunday cycle Year ${day.L} · weekday Year ${day.yr}`:""].filter(Boolean).join(" · ");
      body=`<h2 class="dayname">${esc(r.t)}</h2>${sub?`<p class="daysub">${esc(sub)}</p>`:""}${r.c?`<p class="chip"><i style="background:var(--lit-${esc(r.c)})"></i>${esc(r.c)}</p>`:""}
        ${r.note?`<p class="callout">${esc(r.note)}</p>`:""}`;
      body+=`<div id="massGuide"></div>`;
      const links=[];
      if(S.rite==="n"||S.rite==="o"){ const [y,m,d]=iso.split("-"); links.push(`<a href="https://bible.usccb.org/bible/readings/${m}${d}${y.slice(2)}.cfm" target="_blank" rel="noopener">USCCB daily readings (NABRE)</a>`); }
      if(S.rite==="m"||S.rite==="p"||S.rite==="h") links.push(`<a href="https://www.divinumofficium.com/cgi-bin/missa/missa.pl?date1=${doDate(iso)}&version=${encodeURIComponent(S.rite==="p"?"Divino Afflatu":"Rubrics 1960")}&lang2=English" target="_blank" rel="noopener">This Mass at Divinum Officium</a>`);
      const src = S.rite==="n" ? "Order and cues follow the Heritage Missal (OCP), whose texts and music are copyrighted and not reproduced; use your copy where the guide says so. Latin Ordinary texts are the ancient public-domain texts." :
        S.rite==="o" ? "Prayers in full are from the Book of Common Prayer (1662), public domain, on which Divine Worship draws; Divine Worship's own texts are copyrighted and marked as cues." :
        S.rite==="b" ? "" : "Ordinary and propers in Latin and English from the Divinum Officium project (MIT licence).";
      body+=`<footer class="sesfoot"><p>${src} Chant: GregoBase transcriptions (CC0). Hymns: the Open Hymnal Project (public domain). Scripture: ${trName}, public domain${S.rite==="o"?"; the Ordinariate reads the RSV-2CE, which is copyrighted, so the KJV stands in for it":""}. Verse numbers follow the edition used and may differ slightly from the printed lectionary.</p>${links.length?`<p>${links.join(" · ")}</p>`:""}</footer>`;
    }
  } else {
    officeData=await officeBody(iso, day);
    body=officeData.h+`<h3 class="ordhead">${esc(officeData.hourName)}</h3><div id="massGuide"></div>`;
  }
  body=body.replace('<div id="massGuide">','<div id="lessonCalendar"></div><div id="massGuide">');
  $("#session").innerHTML=head+`<article class="sesbody${S.type==="mass"?" wide":""}">${body}</article>`;
  const mg=document.getElementById("massGuide");
  if(mg && window.LectMass){
    try{ const k="lect-mass-"+S.rite; const o=JSON.parse(localStorage.getItem(k)||"null"); if(o&&o.__apply){ delete o.__apply; localStorage.setItem(k,JSON.stringify(o)); window.__lectApplyPreset=o.preset; } }catch(e){}
    const liveOpts=window.LectTools&&window.LectTools.liveOpts?window.LectTools.liveOpts():null;
    if(officeData) window.LectMass.render(mg,{iso,day,rite:S.rite,hour:S.hour,office:{rite:S.rite,hour:S.hour,steps:officeData.steps,alt:officeData.alt||null},readingBlock,liveOpts});
    else window.LectMass.render(mg,{iso,day,rite:S.rite,hour:null,tr:RITE_TR[S.rite],readingBlock,liveOpts});
  }
  $("#backAsk").addEventListener("click",()=>{ S.view="ask"; render(); });
  $("#prevDay").addEventListener("click",()=>{ S.date=addDays(iso,-1); render(); });
  $("#nextDay").addEventListener("click",()=>{ S.date=addDays(iso,1); render(); });
}

async function officeBody(iso, day){
  await window.LectLoad.service();
  return window.LectOffice.body(iso, day, {S, hoursFor, readingBlock, bcpPsalms, byzTone, eothinon, lothPsalms, psalterWeek, EOTHINA});
}

/* ---------------------------------------------------------------- top */
/* the day at a glance, above the questions */
const LITC={green:"--lit-green",violet:"--lit-violet",purple:"--lit-violet",rose:"--lit-rose",red:"--lit-red",white:"--lit-white",black:"--lit-black",gold:"--lit-white"};
async function renderBand(){
  const el=$("#tband"); if(!el) return;
  if(S.view!=="ask"){ el.hidden=true; return; }
  await daysReady; const iso=todayISO(), day=DAYS[iso];
  if(!day){ el.hidden=true; return; }
  el.hidden=false;
  const c=(day.n&&day.n.c)||"green";
  const fave=getFave(), F=fave||"catholic", names=dayNames(iso,day);
  /* Anglican, Lutheran and Methodist books share the Prayer Book's names for the Sundays: one row serves all three. */
  const rows=[], seen=new Set();
  const order=[F,...FAMILIES.map(f=>f[0]).filter(f=>f!==F)];
  order.forEach(f=>names.filter(x=>x.fam===f).forEach(x=>{
    const pb=/^(anglican|lutheran|methodist)$/.test(x.fam);
    const key=pb?"pb":x.cal; if(seen.has(key)) return; seen.add(key);
    rows.push({cal:pb?(x.fam===F?x.cal:"Prayer Book"):x.cal,name:x.name,on:x.fam===F});
  }));
  const main=(names.find(x=>x.fam===F)||names[0]||{}).name||"";
  const rite=(S.rite&&familyOf(S.rite)===F&&S.type==="mass"&&MASS_RITES.some(r=>r.id===S.rite))?S.rite:DEF_RITE[F];
  const R=MASS_RITES.find(r=>r.id===rite)||MASS_RITES[0], off=defaultOffice(F);
  const offName=off?((off.type==="office"?OFFICE_RITES:MASS_RITES).find(r=>r.id===off.rite)||{}).name:"";
  const kind=riteKind("mass",rite);
  el.innerHTML=`<div class="tband" data-c="${esc(c)}" style="--lc:var(${LITC[c]||"--lit-green"})">
    <div><div class="tb-date">${esc(longDate(iso))}<span class="sw">${esc(c.charAt(0).toUpperCase()+c.slice(1))}</span></div>
      <p class="tb-main">${esc(main)}</p>
      <dl class="tb-days">${rows.map(r=>`<div${r.on?' class="on"':""}><dt>${esc(r.cal)}</dt><dd>${esc(r.name)}</dd></div>`).join("")}</dl></div>
    <div class="tb-go"><label class="tb-fam">Your tradition <select id="tbFam">${FAMILIES.map(([id,n])=>`<option value="${id}"${id===F?" selected":""}>${esc(n)}</option>`).join("")}</select></label>
      <button type="button" class="go" data-quick="mass" title="${esc(R.name)}">Pray today${kind==="Mass"?"'s Mass":kind==="Divine Liturgy"?"'s Liturgy":""}<small>${esc(R.name)}</small></button>${off?`<button type="button" class="ghost" data-quick="office" title="${esc(offName)}">Pray the hour now<small>${esc(offName)}</small></button>`:""}</div></div>`;
  el.querySelector("#tbFam").addEventListener("change",e=>{ setFave(e.target.value); S.fam=e.target.value; if(S.rite&&familyOf(S.rite)!==S.fam){ S.type=null; S.rite=null; S.hour=null; } render(); });
  el.querySelectorAll("[data-quick]").forEach(btn=>btn.addEventListener("click",()=>{
    const t=btn.dataset.quick; S.date=todayISO(); S.fam=F;
    if(t==="mass"){ S.type="mass"; S.rite=rite; }
    else { S.type=off.type; S.rite=off.rite; S.hour=off.hour; }
    open();
  }));
}
/* reading size: five steps, remembered in this browser */
const FS=[0.9,1,1.12,1.25,1.4];
function applyFs(i){ i=Math.max(0,Math.min(FS.length-1,i)); document.documentElement.style.setProperty("--fs",FS[i]); try{ localStorage.setItem("lect-fs",String(i)); }catch(e){}
  document.querySelectorAll(".fsctl [data-fs]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.fs==="0"?i===1:false))); return i; }
let FSI=1; try{ const v=localStorage.getItem("lect-fs"); if(v!=null) FSI=+v; }catch(e){}
FSI=applyFs(FSI);
document.querySelectorAll(".fsctl [data-fs]").forEach(b=>b.addEventListener("click",()=>{ const d=+b.dataset.fs; FSI=applyFs(d===0?1:FSI+d); }));
function render(){
  document.body.classList.toggle("in-session",S.view==="session");
  renderBand();
  $("#ask").hidden = S.view!=="ask";
  $("#session").hidden = S.view!=="session";
  if(S.view==="ask") renderAsk(); else renderSession();
}
window.LectApp={
  passage, riteKind, familyOf,
  /* the psalms of a date: the Prayer Book's course by the day of the month, and the Liturgy of the Hours' four-week psalter */
  async psalmsOfDay(iso){ await window.LectDays.load(iso); const day=DAYS[iso]||{}; return {bcp:{m:bcpPsalms(iso,false),e:bcpPsalms(iso,true)},loth:{lauds:lothPsalms(iso,"lauds",day),vespers:lothPsalms(iso,"vespers",day),week:psalterWeek(iso)}}; }, dayNames, getFave, setFave, FAMILIES, DEF_RITE, defaultOffice, longDate,
  coverage(type,rite,hour){ return COV_LABEL[coverage(type,rite,hour)?.[0]]||"Guided text"; },
  /* every rite the guide can open, with how much of its text is printed (the home page lists the complete ones and the
     work-in-progress page the rest) */
  rites(){ return [...MASS_RITES.map(r=>({type:"mass",hour:null,...r})),...OFFICE_RITES.map(r=>({type:"office",hour:suggestHour(r.id),...r}))]
    .map(r=>{ const c=coverage(r.type,r.id,r.hour); return {type:r.type,rite:r.id,hour:r.hour,name:r.name,d:r.d,kind:riteKind(r.type,r.id),cov:c?c[0]:"guide",covLabel:COV_LABEL[c?c[0]:"guide"],note:c?c[1]:""}; }); },
  /* open the session a live host is running */
  /* An hour this rite does not have (a stale link, a bookmark from another rite) opens its first hour instead. */
  follow(d){ S.type=d.type; S.rite=d.rite; S.hour=d.hour||null; S.date=d.iso; S.view="session";
    if(S.type==="office"){ const H=hoursFor(S.rite)||[]; if(!H.some(h=>h[0]===S.hour)) S.hour=(H[0]||[])[0]||null; }
    render(); },
  current(){ return {type:S.type, rite:S.rite, hour:S.hour||null, iso:S.date}; }
};
/* Sources, home and WIP all use the same coverage policy. */
const covBody=document.getElementById('coverage-body');
if(covBody)covBody.innerHTML=window.LectApp.rites().map(r=>`<tr><td>${esc(r.name)}</td><td>${covBadge([r.cov,r.note])}</td><td>${esc(r.note)}</td></tr>`).join('');
window.addEventListener("lect-tradition",e=>{ if(S.view==="ask"&&e.detail!==S.fam){ S.fam=e.detail; if(S.rite&&familyOf(S.rite)!==S.fam){ S.type=null; S.rite=null; S.hour=null; } render(); } });
loadPrefs(); S.date=todayISO(); render();
})();
