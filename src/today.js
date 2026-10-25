/* ================================================================ PRAY TODAY */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let DAYS=null;
const daysReady = fetch("days.json").then(r=>r.json()).then(j=>{DAYS=j;}).catch(()=>{DAYS={};});

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
  {id:"bcp92",name:"Holy Communion (1892 Prayer Book)",d:"Episcopal Church (USA) · the revision before 1928, the service in full",tr:"kj",ord:1},
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
const todayISO=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const toDate=iso=>{ const [y,m,d]=iso.split("-").map(Number); return new Date(Date.UTC(y,m-1,d)); };
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
    if(rite==="a") return ["order","The Ordinary and Canon of the Ambrosian Mass in Latin, with Cuthbert Atchley's 1909 English, which also gives the propers of the Epiphany and several proper prefaces as examples. The Ingressa, prayers, lessons, Psalmellus, Transitorium and the Milanese calendar come from your Missale Ambrosianum."];
    if(rite==="z") return ["order","The Ordinary of the Mozarabic Mass in a traditional English translation, after the Missale mixtum. The seven variable prayers, the Inlatio and the lessons come from the Missale Hispano-Mozarabicum."];
    if(rite==="bcp79") return ["guide","The 1979 Holy Eucharist is printed in full (Rite One or Two, any of Eucharistic Prayers I, A, B, C or D, and the Prayers of the People), with the collect and proper preface of the day. Take the lessons from the Revised Common Lectionary, which is not reproduced."];
    if(rite==="adai") return ["guide","The Liturgy of the Holy Apostles Adai and Mari is printed in full, in the English made for the Archbishop of Canterbury's Assyrian Mission (1893). The lections, the Apostle and the Gospel of the day come from the East Syrian lectionary, which is not yet on this site."];
    if(rite==="copt") return ["guide","The Coptic Liturgy of St Basil is printed in full, in the Marquis of Bute's English (1882, reissued 1908). The lessons and Gospel of the day come from the Coptic lectionary (the Katameros), which is not yet on this site."];
    if(rite==="arm") return ["guide","The Divine Liturgy of the Armenian Church is printed in full, in the English of two Armenian priests (London, 1908). The Psalm, lessons and Gospel of the day come from the Armenian lectionary, which is not yet on this site."];
    if(rite==="me08") return ["full","The Order for the Administration of the Lord's Supper from the Ritual of the Methodist Episcopal Church (1908) is printed in full."];
    if(rite==="wes84") return ["full","The Order for the Administration of the Lord's Supper from John Wesley's Sunday Service of the Methodists in North America (1784) is printed in full, with the book's own Collect, Epistle and Gospel for each Sunday and chief feast. The book keeps no saints' days or weekday propers: on other days the Sunday's are used."];
    if(rite==="wes84o") return ["guide","Morning and Evening Prayer for the Lord's Day and the Litany from Wesley's Sunday Service (1784) are printed in full, with the book's Collect of the day and, on Sundays, the lessons of its table in the King James Version. The Psalms are cued: the book's own selection from the Psalter is not on the site yet."];
    if(rite==="rcus") return ["full","The Regular Service on the Lord's Day, and the Holy Communion, from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) are printed in full, with the Litany. The Epistle and Gospel, the hymns and the sermon are the minister's."];
    if(rite==="rcusv") return ["full","The Evening Service from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) is printed in full, with the Litany. The lessons, the hymns and the sermon are the minister's."];
    if(rite==="rcusp") return ["full","The Preparation for the Holy Communion from the Order of Worship of the Reformed Church in the United States (Mercersburg, 1866) is printed in full: the Law, the Litany, the address to the communicants, the confession and the pardon."];
    if(rite==="byzv") return ["guide","Great Vespers is printed in full from Isabel Hapgood's Service Book (1906), public domain. The hymns that change with the day (the stichera, the Dogmatikon, the Gradual and the Hymn of the Feast) come from the Octoechos and Menaion, which are not in the public domain in a modern English translation: the guide marks where they go. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzm") return ["guide","Matins is printed in full from Isabel Hapgood's Service Book (1906), public domain: the Six Psalms, the twelve Morning Prayers, the litanies, the Polyeleos, the Gospel, the Magnificat and the Great Doxology. The hymns that change with the day (the troparia, the Canon, the stichera) come from the Octoechos and Menaion, which are not in the public domain in a modern English translation; the Gospel of the Resurrection is read from the Gospels. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzh") return ["guide","The First, Third, Sixth and Ninth Hours (with the Interhour) and the Typical Psalms are printed in full from Isabel Hapgood's Service Book (1906), public domain, with the psalms in the Prayer Book's wording. The troparia and kontakia of the day come from the Octoechos and Menaion, which are not in the public domain in a modern English translation; the guide marks where they go. Hapgood's English is not any church's present authorized text."];
    if(rite==="byzc") return ["guide","Grand Compline is printed in full from Isabel Hapgood's Service Book (1906), public domain, with the psalms in the Prayer Book's wording. The hymns of the day and the Great Canon of St. Andrew are not in the public domain in a modern English translation; the guide marks where they go. Hapgood's English is not any church's present authorized text."];
    if(rite==="csbl") return ["full","The Litany of the Common Service Book (1917-19) is printed in full, with its collects and the collect of the day."];
    if(rite==="csbs") return ["full","The Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day."];
    if(rite==="csbsm") return ["full","The Morning Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day. The psalm, lesson and hymn are the minister's."];
    if(rite==="csbse") return ["full","The Evening Suffrages of the Common Service Book (1917-19) are printed in full, with the collect of the day. The psalm, lesson and hymn are the minister's."];
    if(rite==="rca") return ["full","The Order of Public Worship and the Office for the Lord's Supper (the Form of Dort) from the Liturgy of the Reformed Church in America (1882) are printed in full. Prayer is ordinarily free; the lessons and psalms are chosen by the minister."];
    if(rite==="pres") return ["full","The Order of Morning Service and the Order for the Lord's Supper from the Presbyterian Book of Common Worship (1906) are printed in full. The book sets no lectionary: the Psalter portion, the lessons, the hymns and the General Prayer are chosen by the minister."];
    if(rite==="csbm") return ["full","Matins from the Common Service Book (1917-19) is printed in full, with the collect of the day. The hymn, the psalms and the lessons are chosen by the minister, as the book directs."];
    if(rite==="csbv") return ["full","Vespers from the Common Service Book (1917-19) is printed in full, with the collect of the day. The hymn, the psalms and the lessons are chosen by the minister, as the book directs."];
    if(rite==="csb") return ["full","The Service of the Common Service Book (1917-19) is printed in full, with the Introit, Collect, Epistle, Gradual and Gospel of the day. The hymns are not included."];
    if(rite==="bcp62") return ["full","The 1662 Order for the Administration of the Lord's Supper is printed in full, with the collect, epistle and gospel of the day as the Prayer Book gives them."];
    if(rite==="bcp49") return ["full","The Supper of the Lord and the Holy Communion in the first Prayer Book of Edward VI (1549) is printed in full, in the spelling of the book, with the Introit, Collect, Epistle and Gospel of the day."];
    if(rite==="bcp52") return ["full","The Order for the Administration of the Lordes Supper in the second Prayer Book of Edward VI (1552) is printed in full, in the spelling of the book, with the Collect, Epistle and Gospel of the day."];
    if(rite==="bcp59") return ["full","The Order for the Administration of the Lordes Supper in the Elizabethan Prayer Book (1559) is printed in full, in the spelling of the book, with the Collect, Epistle and Gospel of the day."];
    if(rite==="bcp37") return ["guide","The Order of the Administration of the Lords Supper in the Scottish Prayer Book of 1637 is printed in full, in the spelling of the book. The Collect, Epistle and Gospel of the day come from your Prayer Book."];
    if(rite==="bcp89") return ["guide","The Order for the Administration of the Lord's Supper in the first American Prayer Book (1789) is printed in full. The Collect, Epistle and Gospel of the day come from your Prayer Book."];
    if(rite==="bcp92") return ["guide","The Order for the Administration of the Lord's Supper in the American Prayer Book of 1892 is printed in full. The Collect, Epistle and Gospel of the day come from your Prayer Book."];
    if(rite==="bcp28") return ["full","The 1928 Order for Holy Communion is printed in full, with the collect, epistle and gospel of the day as the Prayer Book gives them."];
    if(rite==="b") return ["guide","The Liturgies of St John Chrysostom, St Basil and the Presanctified Gifts are printed in full in Isabel Hapgood's 1906 English (Greco-Russian usage), with the day's readings and, on Sundays, the Resurrection troparion and kontakion of the week's tone. The hymns of the saint, the feast and the temple come from your service books."];
  } else {
    if(/^(br62|br55|mon|op)$/.test(rite)) return ["full","Every part of the hour is printed, in Latin and English."];
    if(rite==="bcp79") return ["full","The 1979 office is printed in full, with the 1979 Psalter's psalms for the day of the month and the collect of the day. Take the lessons from the Daily Office Lectionary."];
    if(rite==="bcp28") return ["full","The 1928 text is printed in full, with the collect of the day and the psalms of the day of the month. The 1928 Psalter is a light revision of Coverdale's; the Coverdale text is given. Take the lessons from the 1928 (1943) lectionary."];
    if(rite==="dwdo") return /^(prime|terce|sext|none)$/.test(hour)?["full","Printed in full from The Day-Hours of the Church of England (1877), a Prayer Book English breviary, with the Coverdale psalms and the Collect of the Day. Proper antiphons and hymn endings for feasts and seasons come from your book."]:["full","The 1662 Prayer Book text is printed in full, with the Coverdale psalms. Divine Worship adapts it in places."];
    if(rite==="loth") return ["guide","The psalms, canticles and Scripture are printed. The hymns, antiphons, intercessions and prayers come from your breviary: press Add text to fill them in."];
    if(rite==="byz") return ["guide","The psalms and the fixed prayers are printed. The hymns of the day come from your Horologion, Octoechos and Menaion: press Add text to fill them in."];
  }
  return null;
}
const covBadge=c=>c?`<span class="cov cov-${c[0]}">${COV_LABEL[c[0]]}</span>`:"";
function renderAsk(){
  const typeHTML = choiceBtn("type","mass","Mass","A full guide to the Mass, with music",S.type==="mass")+choiceBtn("type","office","Divine Office","Liturgy of the Hours, Breviary, Daily Office",S.type==="office");
  let riteHTML="", hourHTML="";
  if(S.type){ const list=S.type==="mass"?MASS_RITES:OFFICE_RITES; riteHTML=list.map(r=>choiceBtn("rite",r.id,r.name,r.d,S.rite===r.id,covBadge(coverage(S.type,r.id,"vespers")))).join(""); }
  const riteOK = S.type && (S.type==="mass"?MASS_RITES:OFFICE_RITES).some(r=>r.id===S.rite);
  if(S.type==="office" && riteOK){ const sug=suggestHour(S.rite); hourHTML=hoursFor(S.rite).map(([id,n])=>choiceBtn("hour",id,n,id===sug?"Suggested for now":"",S.hour===id)).join(""); }
  const TIMED=["timed","Timed session","Fit to a set length, from 15 minutes up · for study sessions"];
  const LENGTHS=S.rite==="b"||ORD_ONLY(S.rite)?[["full",S.rite==="b"?"Full Liturgy":"Full Mass","As usually celebrated"],TIMED]:[["said","Said","Spoken, no music · shortest"],["sung","Sung, simple","Hymns and a chant Ordinary"],["chant","Full chant","Gregorian propers and Ordinary · longest"],TIMED];
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
      <li class="step"><h3><span class="sn">1</span>What are you praying?</h3><div class="choices two">${typeHTML}</div></li>
      ${S.type?`<li class="step"><h3><span class="sn">2</span>Which rite or use?</h3><div class="choices">${riteHTML}</div><p class="note covkey"><span class="cov cov-full">Complete text</span> every word is printed · <span class="cov cov-guide">Guided text</span> some prayers come from your own book (add them once with <b>Add text</b>) · <span class="cov cov-order">Order and readings</span> the structure and Scripture, with the prayers from your book</p></li>`:""}
      ${S.type==="office"&&riteOK?`<li class="step"><h3><span class="sn">3</span>Which hour?</h3><div class="choices">${hourHTML}</div></li>`:""}
      ${S.type==="mass"&&riteOK?`<li class="step"><h3><span class="sn">3</span>How long${S.rite==="b"?"":", and with what music"}?</h3><div class="choices">${lenHTML}</div><p class="note">${S.len==="timed"?"The guide shortens the service step by step to fit: music first, then optional prayers, then the texts themselves, and lists what it left out. You can change the length on the next page.":"You can fine-tune hymns, chant settings, homily and Communion time, or set a time limit, on the next page."}</p></li>`:""}
      ${ready?`<li class="step"><h3><span class="sn">${S.type==="office"||S.type==="mass"?4:3}</span>For which day?</h3>
        <div class="dayrow"><input type="date" id="dayPick" value="${S.date||todayISO()}" min="2025-11-30" max="2030-11-30" aria-label="Date">
        <button type="button" class="ghost" data-day="0">Today</button><button type="button" class="ghost" data-day="1">Tomorrow</button><button type="button" class="ghost" data-day="sun">Next Sunday</button></div>
        <button type="button" class="go" id="goBtn">Open the ${S.type==="mass"?"Mass":"hour"}</button></li>`:""}
    </ol>`;
  $("#ask").querySelectorAll(".choice").forEach(b=>b.addEventListener("click",()=>{
    const g=b.dataset.g, v=b.dataset.v;
    if(g==="type"){ if(S.type!==v){ S.rite=null; S.hour=null; } S.type=v; }
    if(g==="rite"){ S.rite=v; if(S.type==="office" && !hoursFor(v).some(h=>h[0]===S.hour)) S.hour=suggestHour(v); }
    if(g==="hour"){ S.hour=v; }
    if(g==="len"){ S.len=v; }
    renderAsk();
  }));
  $("#ask").querySelectorAll("[data-mins]").forEach(b=>b.addEventListener("click",()=>{ S.mins=+b.dataset.mins; renderAsk(); }));
  const jf=$("#joinForm"); if(jf) jf.addEventListener("submit",ev=>{ ev.preventDefault(); const c=$("#joinCode").value.trim(); if(!c) return;
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
  const m=/^((?:[1-4] )?[A-Za-z]+)\.?\s+(.*)$/.exec(s); if(!m) return {skip:"unparsed",raw:cit};
  const bk=m[1], file=BOOKFILE[bk]; if(!file) return {skip:"book",raw:cit};
  const rest=m[2].replace(/\+/g,", ").replace(/—|–/g,"-");
  const segs=[]; let chap=null;
  for(const part0 of rest.split(/[;,]\s*/)){
    const part=part0.trim().replace(/([0-9])[a-e]+/g,"$1"); if(!part) continue;
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
  return commonShift(bk,c,v);
}
function commonShift(bk,c,v){
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
const DAY=864e5;
function easterY(Y){ const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(Date.UTC(Y,mo-1,da)); }
function adv1Y(Y){ const x=new Date(Date.UTC(Y,11,25)); const w=x.getUTCDay(); return new Date(x.getTime()-((w===0?7:w)+21)*DAY); }
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

/* ---------------------------------------------------------------- Byzantine fixed texts (traditional English, public domain) */
const BYZ_TX={
 tris:[["cel","Blessed is our God, always, now and ever, and unto ages of ages."],["ppl","Amen."],
   ["all","Holy God, Holy Mighty, Holy Immortal, have mercy on us. (Three times)"],
   ["all","Glory to the Father, and to the Son, and to the Holy Spirit, now and ever, and unto ages of ages. Amen."],
   ["all","O most holy Trinity, have mercy on us. O Lord, cleanse us from our sins. O Master, pardon our transgressions. O Holy One, visit and heal our infirmities, for thy name's sake."],
   ["all","Lord, have mercy. (Three times)"],["all","Glory to the Father, and to the Son, and to the Holy Spirit, now and ever, and unto ages of ages. Amen."],
   ["all","Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done, on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil."],
   ["cel","For thine is the kingdom, and the power, and the glory, of the Father, and of the Son, and of the Holy Spirit, now and ever, and unto ages of ages."],["ppl","Amen."]],
 creed:[["all","I believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible. And in one Lord Jesus Christ, the Son of God, the only-begotten, begotten of the Father before all ages; Light of Light, true God of true God; begotten, not made; of one essence with the Father, by whom all things were made; who for us men and for our salvation came down from heaven, and was incarnate of the Holy Spirit and the Virgin Mary, and became man; and was crucified for us under Pontius Pilate, and suffered, and was buried; and rose again on the third day according to the Scriptures; and ascended into heaven, and sits at the right hand of the Father; and he shall come again with glory to judge the living and the dead; whose kingdom shall have no end. And in the Holy Spirit, the Lord, the Giver of Life, who proceeds from the Father; who with the Father and the Son together is worshipped and glorified; who spoke by the prophets. In one holy, catholic and apostolic Church. I confess one baptism for the remission of sins. I look for the resurrection of the dead, and the life of the world to come. Amen."]],
 phos:[["all","Hail, gladdening Light, of his pure glory poured, who is the immortal Father, heavenly, blest, holiest of holies, Jesus Christ our Lord! Now we are come to the sun's hour of rest; the lights of evening round us shine; we hymn the Father, Son, and Holy Spirit divine. Worthiest art thou at all times to be sung with undefiled tongue, Son of our God, giver of life, alone: therefore in all the world thy glories, Lord, they own."]],
 vouch:[["all","Vouchsafe, O Lord, to keep us this evening without sin. Blessed art thou, O Lord, the God of our fathers, and praised and glorified is thy name for ever. Amen. Let thy mercy, O Lord, be upon us, as we have set our hope on thee. Blessed art thou, O Lord; teach me thy statutes. Blessed art thou, O Master; make me to understand thy statutes. Blessed art thou, O Holy One; enlighten me with thy statutes. Thy mercy, O Lord, endures for ever; despise not the works of thy hands. To thee belongs praise, to thee belongs song, to thee belongs glory, to the Father, and to the Son, and to the Holy Spirit, now and ever, and unto ages of ages. Amen."]],
 godlord:[["cel","God is the Lord, and hath appeared unto us: blessed is he that cometh in the name of the Lord."],["all","God is the Lord, and hath appeared unto us: blessed is he that cometh in the name of the Lord."],["cel","O give thanks unto the Lord, for he is good: for his mercy endureth for ever."],["all","God is the Lord, and hath appeared unto us: blessed is he that cometh in the name of the Lord."],["cel","All nations compassed me about: but in the name of the Lord will I destroy them."],["all","God is the Lord, and hath appeared unto us: blessed is he that cometh in the name of the Lord."],["cel","This is the Lord's doing, and it is marvellous in our eyes."],["all","God is the Lord, and hath appeared unto us: blessed is he that cometh in the name of the Lord."]],
 fhp:[["cel","O Christ, the true Light, who enlightenest and sanctifiest every man that cometh into the world: let the light of thy countenance be signed upon us, that in it we may behold the light unapproachable; and direct our steps in the doing of thy commandments; through the intercessions of thy most pure Mother, and of all thy saints."],["ppl","Amen."]],
 doxo:[["cel","Glory to thee who hast shown us the light!"],["all","Glory to God in the highest, and on earth peace, good will towards men. We praise thee, we bless thee, we worship thee, we glorify thee, we give thanks to thee for thy great glory. O Lord, heavenly King, God the Father Almighty; O Lord, the only-begotten Son, Jesus Christ, and the Holy Spirit. O Lord God, Lamb of God, Son of the Father, that takest away the sin of the world, have mercy on us; thou that takest away the sins of the world, receive our prayer; thou that sittest at the right hand of the Father, have mercy on us. For thou only art holy, thou only art the Lord, Jesus Christ, to the glory of God the Father. Amen."],
   ["all","Every day will I bless thee, and praise thy name for ever, and for ever and ever. Vouchsafe, O Lord, to keep us this day without sin. Blessed art thou, O Lord, the God of our fathers, and praised and glorified is thy name for ever. Amen. Let thy mercy, O Lord, be upon us, as we have set our hope on thee. Blessed art thou, O Lord; teach me thy statutes. (Three times) Lord, thou hast been our refuge from generation to generation. I said: Lord, have mercy on me; heal my soul, for I have sinned against thee. Lord, I flee unto thee; teach me to do thy will, for thou art my God. For with thee is the fountain of life; in thy light shall we see light. Continue thy mercy unto them that know thee."],
   ["all","Holy God, Holy Mighty, Holy Immortal, have mercy on us. (Three times) Glory to the Father, and to the Son, and to the Holy Spirit, now and ever, and unto ages of ages. Amen. Holy Immortal, have mercy on us. Holy God, Holy Mighty, Holy Immortal, have mercy on us."]],
};
const byzTx=k=>`<div class="txt one">${BYZ_TX[k].map(([r,t])=>`<p data-r="${r}">${esc(t).replace(/\((Three times)\)/g,'<i class="rubi">($1)</i>')}</p>`).join("")}</div>`;
/* psalms of the Byzantine hours, numbered as in the Septuagint (= the Douay-Rheims) */
const BYZ_PS={vespers:{lic:[140,141,129,116]},compline:{ps:[50,69,142]},midnight:{ps:[50,118]},orthros:{six:[3,37,62,87,102,142],lauds:[148,149,150]},
  first:{ps:[5,89,100]},third:{ps:[16,24,50]},sixth:{ps:[53,54,90]},ninth:{ps:[83,84,85]}};
/* ---------------------------------------------------------------- hour orders */
const ORDER={
 loth:{
  or:["Introductory verse (or the Invitatory, if this is the first hour of the day)","Hymn","@psalms|Psalmody: three psalms or sections, each with antiphon","Verse","@first|First reading: Scripture, with responsory","Second reading: Fathers or saints, with responsory","Te Deum (Sundays outside Lent, solemnities, feasts)","Concluding prayer","Acclamation"],
  lauds:["@invit|Invitatory (Psalm 95) or introductory verse","Hymn","@psalms|Psalmody: morning psalm, Old Testament canticle, psalm of praise","Short reading","Responsory","@bened|Gospel canticle: Benedictus (Luke 1:68-79)","Intercessions","Lord's Prayer","Concluding prayer","Dismissal"],
  terce:["Introductory verse","Hymn","@psalms|Psalmody: three psalms or sections (current psalmody)","Short reading","Verse","Concluding prayer","Acclamation"],
  vespers:["Introductory verse","Hymn","@psalms|Psalmody: two psalms and a New Testament canticle","Short reading","Responsory","@magn|Gospel canticle: Magnificat (Luke 1:46-55)","Intercessions","Lord's Prayer","Concluding prayer","Dismissal"],
  compline:["Introductory verse","Examination of conscience and act of penitence","Hymn","@psalms|Psalmody","Short reading","Responsory: Into your hands, Lord","@nunc|Gospel canticle: Nunc dimittis (Luke 2:29-32)","Concluding prayer","Blessing","Antiphon to the Blessed Virgin Mary"]},
 dwdo:{
  mattins:["Opening sentence; Confession and Absolution (required in public worship)","Preces: O Lord, open thou our lips","@venite|Venite (Psalm 95), or the Easter Anthems in Eastertide","@psalms|The psalms appointed for the morning of this day of the month","First Lesson (Old Testament)","Te Deum laudamus, or Benedicite","Second Lesson (New Testament)","@bened|Benedictus (Luke 1:68-79)","Apostles' Creed","Lesser Litany and Lord's Prayer","Suffrages","Collect of the Day; Collect for Peace; Collect for Grace","Prayers and thanksgivings; the Grace"],
  prime:["Opening versicles","Hymn Jam lucis orto sidere","Psalms (with the Quicunque vult on Sundays)","Chapter and responsory","Prayers (weekdays)","Collect for Grace","Conclusion"],
  terce:["Opening versicles","Hymn","Psalm 119:33-80","Chapter and responsory","Week-day Prayers (weekdays)","Collect of the Day","Conclusion"],
  sext:["Opening versicles","Hymn","Psalm 119:81-128","Chapter and responsory","Week-day Prayers (weekdays)","Collect of the Day","Conclusion"],
  none:["Opening versicles","Hymn","Psalm 119:129-176","Chapter and responsory","Week-day Prayers (weekdays)","Collect of the Day","Conclusion"],
  evensong:["Opening sentence; Confession and Absolution (required in public worship)","Preces: O Lord, open thou our lips","@psalms|The psalms appointed for the evening of this day of the month","First Lesson (Old Testament)","@magn|Magnificat (Luke 1:46-55)","Second Lesson (New Testament)","@nunc|Nunc dimittis (Luke 2:29-32)","Apostles' Creed","Lesser Litany and Lord's Prayer","Suffrages","Collect of the Day; Collect for Peace; Collect for Aid against all Perils","Anthem; prayers and thanksgivings; the Grace"],
  compline:["Opening sentence and confession","@psalms|Psalms (4, 31:1-6, 91, 134)","Short reading","@resp|Responsory: Into thy hands, O Lord","@nunc|Nunc dimittis","Prayers","Blessing"]},
 br:{
  matins:["Pater, Ave, Credo; Domine labia mea","Invitatory (Psalm 94 Vulgate)","Hymn","Nocturns: psalms with antiphons; three lessons per nocturn (one nocturn on ferias)","Responsories","Te Deum (Sundays and feasts outside penitential seasons)"],
  lauds:["Deus in adjutorium","Five psalms (the fourth an Old Testament canticle) with antiphons","Chapter","Hymn and versicle","@bened|Benedictus with antiphon","Collect; commemorations","Marian antiphon if the last hour said in choir"],
  prime:["Deus in adjutorium","Hymn Jam lucis orto sidere","Psalms","Chapter, short responsory, versicle","Prayer","Martyrology and the Chapter Office"],
  terce:["Deus in adjutorium","Hymn","Three psalms (or sections) under one antiphon","Chapter","Short responsory and versicle","Collect"],
  vespers:["Deus in adjutorium","Five psalms with antiphons","Chapter","Hymn and versicle","@magn|Magnificat with antiphon","Collect; commemorations"],
  compline:["Jube domne benedicere; short lesson (1 Pet 5:8-9)","Confiteor","Converte nos; Deus in adjutorium","Psalms under one antiphon","Hymn Te lucis ante terminum","@nunc|Chapter, short responsory, Nunc dimittis","Prayer Visita quaesumus","Blessing; seasonal Marian antiphon"]},
 byz:{
  vespers:["@ps104|Opening blessing; Psalm 103 (104)","Great Litany","Kathisma of the Psalter","@lic|Lord, I have cried (Pss 140, 141, 129, 116) with stichera of the tone and the Menaion","@phos|Entrance; Phos hilaron (O Joyful Light)","Prokeimenon; Old Testament readings (paremias) on feasts","@vouch|Litanies; Vouchsafe, O Lord","Aposticha","@nunc|Song of Simeon (Luke 2:29-32)","@tris|Trisagion prayers","Apolytikion (troparion of the day); dismissal"],
  compline:["@ps|Small Compline: Psalms 50, 69, 142","@creed|Doxology; Creed","Canon (if appointed)","@tris|Trisagion prayers","Kontakion of the day","Prayers; dismissal"],
  midnight:["@ps|Psalm 50 and Psalm 118 (119)","@creed|Creed","@tris|Trisagion prayers","Troparia and prayers","Dismissal"],
  orthros:["@six|Royal beginning; Six Psalms (3, 37, 62, 87, 102, 142)","@godlord|Great Litany; God is the Lord with the troparia","Kathismata of the Psalter","@eoth|On Sundays: Evlogitaria; Resurrection Gospel (eothinon)","@ps50|Psalm 50; canon","@magn|Magnificat with the Magnificat refrain (9th ode)","@lauds|Lauds (Pss 148-150) with stichera; Great Doxology","Litanies; Aposticha; dismissal"],
  first:["@ps|Psalms 5, 89, 100","Troparion and kontakion of the day","@tris|Trisagion prayers","@fhp|Prayer of the First Hour (O Christ, the true Light)"],
  third:["@ps|Psalms 16, 24, 50","Troparion and kontakion of the day","@tris|Trisagion prayers","Prayer of the hour"],
  sixth:["@ps|Psalms 53, 54, 90","Troparion and kontakion of the day","@tris|Trisagion prayers","Prayer of the hour"],
  ninth:["@ps|Psalms 83, 84, 85","Troparion and kontakion of the day","@tris|Trisagion prayers","Prayer of the hour"]},
};
ORDER.loth.sext=ORDER.loth.terce; ORDER.loth.none=ORDER.loth.terce;
ORDER.br.sext=ORDER.br.terce; ORDER.br.none=ORDER.br.terce;

const DO_VERSION={br62:"Rubrics 1960 - 1960",br55:"Divino Afflatu - 1954",mon:"Monastic - 1963",op:"Ordo Praedicatorum - 1962"};
/* ---------------------------------------------------------------- The Day-Hours (1877): Prime, Terce, Sext, None */
function dhEnv(iso){
  const d=toDate(iso), Y=d.getUTCFullYear(), E=easterY(Y), off=Math.round((d-E)/DAY), dow=d.getUTCDay();
  const xmas=Date.UTC(Y,11,25), adv=new Date(xmas-(((new Date(xmas).getUTCDay())||7)+21)*DAY);
  const advent=d>=adv&&d<new Date(xmas), lent=off>=-46&&off<-14, passion=off>=-14&&off<0;
  return {sun:dow===0, wkd:dow!==0, sept:off>=-63&&off<=-4, septE:off>=-63&&off<0, easter:off>=0&&off<56,
    advent, lent, passion, ord:!advent&&!lent&&!passion, penit:dow!==0&&off>=-46&&off<0};
}
function dhOk(it,env){ return !(it.if||[]).some(c=>c.startsWith("no")?env[c.slice(2,3).toLowerCase()+c.slice(3)]:!env[c]); }
const DH_LP="Our Father, which art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done, in earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive them that trespass against us. And lead us not into temptation; But deliver us from evil. Amen.";
const DH_CREED="I believe in God the Father Almighty, Maker of heaven and earth: And in Jesus Christ his only Son our Lord, Who was conceived by the Holy Ghost, Born of the Virgin Mary, Suffered under Pontius Pilate, Was crucified, dead, and buried, He descended into hell; The third day he rose again from the dead, He ascended into heaven, And sitteth on the right hand of God the Father Almighty; From thence he shall come to judge the quick and the dead. I believe in the Holy Ghost; The holy Catholick Church; The Communion of Saints; The Forgiveness of sins; The Resurrection of the body, And the life everlasting. Amen.";
const DH_GLORIA=`<p data-r="all">Glory be to the Father, and to the Son : and to the Holy Ghost;</p><p data-r="all">As it was in the beginning, is now, and ever shall be : world without end. Amen.</p>`;
const DH_DAYPS={1:"Ps 24",2:"Ps 25",3:"Ps 26",4:"Ps 23",5:"Ps 22"};
async function dhItems(items,env,o){
  let h="";
  const ps=async ref=>(await o.blk(ref.replace("Ps ","Psalm "),ref,"cv"))+DH_GLORIA;
  for(const it of items){
    if(!dhOk(it,env)) continue;
    const x=it.x;
    switch(it.k){
      case "r": h+=`<p class="rub">${esc(x)}</p>`; break;
      case "v": h+=`<p data-r="cel"><span class="sp">℣.</span> ${esc(x)}</p>`; break;
      case "r2": h+=`<p data-r="ppl"><span class="sp">℟.</span> ${esc(x)}</p>`; break;
      case "a": h+=`<p data-r="all"><span class="sp">Ant.</span> ${esc(x)}</p>`; break;
      case "c": h+=`<p data-r="lec">${esc(x)}</p>`; break;
      case "o": h+=`<p data-r="cel">${esc(x)}</p>`; break;
      case "p": h+=`<p data-r="cel" data-priest-only="1"><span class="sp">Priest.</span> ${esc(x)}</p>`; break;
      case "l": case "s": h+=`<p data-r="all">${esc(x)}</p>`; break;
      case "h": h+=`<p class="hymn" data-r="all">${x.map(esc).join("<br>")}</p>`; break;
      case "slot":
        if(it.n==="ps") h+=await ps(it.a);
        else if(it.n==="day-ps"){ const r=DH_DAYPS[o.dow]; if(r) h+=await ps(r); }
        else if(it.n==="gloria") h+=DH_GLORIA;
        else if(it.n==="lords-prayer") h+=`<p data-r="all">${DH_LP}</p>`;
        else if(it.n==="creed") h+=`<p data-r="all">${DH_CREED}</p>`;
        else if(it.n==="preces") h+=await dhItems(o.preces,env,{...o,lent:it.a});
        else if(it.n==="lent-ps"){ if(env.penit&&o.lent){ h+=`<p class="rub">In Lent is said here Psalm 51, ${o.lent==="67"?"preceded":"followed"} by Psalm ${o.lent}.</p>`; for(const r of (o.lent==="67"?["Ps 67","Ps 51"]:["Ps 51","Ps "+o.lent])) h+=await ps(r); } }
        else if(it.n==="collect") h+=o.col?`<p class="cite">${esc(titleCase(o.nm))}</p><p data-r="cel">${esc(o.col)}</p>`:`<p class="cue">The Collect of the Day, from the Prayer Book or Divine Worship.</p>`;
        break;
    }
  }
  return h;
}
/* ---------------------------------------------------------------- 1662 offices and the generated Breviary */
const bcpCache={};
function bcpOffice(){ return bcpCache.o||(bcpCache.o=fetch("bcp-office.json").then(r=>r.json())); }
const titleCase=t=>String(t).toLowerCase().replace(/(^|[\s-])([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(In|After|Before|The|Of|And)\b/g,w=>w.toLowerCase()).replace(/^./,c=>c.toUpperCase());
function bcpItem(it){
  const [k,t,r,lab]=it;
  if(k==="rub") return `<p class="rub">${esc(t)}</p>`;
  if(k==="cite") return `<p class="cite">${esc(t)}</p>`;
  if(k==="h") return `<h5 class="sub">${esc(t)}</h5>`;
  return `<p data-r="${r||"all"}">${lab?`<span class="sp">${lab}</span> `:""}${esc(t)}</p>`;
}
const DO_KEY={br62:"br62",br55:"br55",mon:"mon",op:"op"};
const doCache={};
const doJSON=p=>doCache[p]||(doCache[p]=fetch(p).then(r=>{ if(!r.ok) throw new Error(p); return r.json(); }));
async function doTable(base, man, kind, ids){
  const ranges=man[kind==="l"?"lines":"rows"], need=new Set();
  ids.forEach(id=>{ let lo=0,hi=ranges.length-1; while(lo<hi){ const mid=(lo+hi+1)>>1; if(ranges[mid][0]<=id) lo=mid; else hi=mid-1; } need.add(lo); });
  const shards={}; await Promise.all([...need].map(async n=>{ shards[n]=await doJSON(`${base}/${kind}-${String(n).padStart(3,"0")}.json`); }));
  return id=>{ for(const n of need){ const sh=shards[n]; if(id>=sh.start&&id<sh.start+sh.v.length) return sh.v[id-sh.start]; } return null; };
}
async function doHour(R,H,iso){
  const key=DO_KEY[R], hour=DO_HOUR[H]; if(!key||!hour) return null;
  const base=`breviary/${key}`;
  let man, month;
  try{ man=await doJSON(`${base}/manifest.json`); if(!(man.years||[]).includes(iso.slice(0,4))) return null; month=await doJSON(`${base}/y-${iso.slice(0,4)}.json`); }catch(e){ return null; }
  const day=month[iso]; if(!day||!day[hour]) return null;
  const variants=[day[hour], day["c:"+hour]].filter(Boolean);
  const rowIds=[...new Set(variants.flatMap(v=>v[1]))];
  const row=await doTable(base,man,"r",rowIds);
  const lineIds=[...new Set(rowIds.flatMap(id=>{ const r=row(id); return r?r[0].concat(r[1]):[]; }))];
  const line=await doTable(base,man,"l",lineIds);
  const plain=h=>h.replace(/<[^>]+>/g,"").trim();
  // one step per headed row; a row with no heading (a psalm continuing, a second lesson part) joins the step before it
  const steps=v=>{ const out=[];
    v[1].forEach(id=>{ const r=row(id); if(!r) return;
      let la=r[0].map(line).join(""), en=r[1].map(line).join("");
      const th=/<h5 class=sub>(.*?)<\/h5>/.exec(en)||/<h5 class=sub>(.*?)<\/h5>/.exec(la);
      la=la.replace(/<h5 class=sub>.*?<\/h5>/,""); en=en.replace(/<h5 class=sub>.*?<\/h5>/,"");
      const words=plain(en.replace(/<sup>.*?<\/sup>/g,"")).split(/\s+/).length;
      const block=`<div class="txt two dooff"><div lang="la">${la}</div><div lang="en">${en}</div></div>`;
      if(!th&&out.length){ const p=out[out.length-1]; p.slot+=block; p.min+=words/2.4/60; return; }
      out.push({t:th?plain(th[1]):"Opening", slot:block, min:Math.max(0.2,words/2.4/60)});
    });
    return out; };
  return {title:day[hour][0], steps:steps(day[hour]), chant:day["c:"+hour]?steps(day["c:"+hour]):null};
}
const DO_HOUR={matins:"Matutinum",lauds:"Laudes",prime:"Prima",terce:"Tertia",sext:"Sexta",none:"Nona",vespers:"Vespera",compline:"Completorium"};
const UNIV_HOUR={or:"readings",lauds:"lauds",terce:"terce",sext:"sext",none:"none",vespers:"vespers",compline:"compline"};
const doDate=iso=>{ const [y,m,d]=iso.split("-"); return `${m}-${d}-${y}`; };

/* ---------------------------------------------------------------- session render */
async function readingBlock(lab,cit,num,tr,added){
  let body;
  try{ const p=await passage(cit,num,tr); body=p.html+(p.fallback?`<p class="note">This passage is not in the King James Version, so it is given in the Douay-Rheims.</p>`:""); }
  catch(e){ body=`<p class="note">The text could not be loaded.</p>`; }
  const alt=parseCit(cit).alt;
  return `<section class="reading${added?" added":""}"><header><span class="rl">${esc(lab)}${added?" · hybrid addition":""}</span><span class="rc">${esc(cit.split(" or ")[0])}</span></header>${alt?`<p class="note">Or: ${esc(alt.replace(/^or\s+/,""))}</p>`:""}<div class="rtext">${body}</div></section>`;
}
const RITE_TR={n:"dr",o:"kj",m:"dr",p:"dr",h:"dr",b:"dr",d:"dr",a:"dr",z:"dr",bcp28:"kj",bcp62:"kj",bcp49:"kj",bcp52:"kj",bcp59:"kj",bcp37:"kj",bcp89:"kj",wes84:"kj",wes84o:"kj",bcp92:"kj",bcp79:"kj",csb:"kj",csbm:"kj",csbv:"kj",pres:"kj",rca:"kj",csbse:"kj",byzc:"kj",byzv:"kj",byzm:"kj",byzh:"kj",csbsm:"kj",csbs:"kj",csbl:"kj",rcus:"kj",rcusv:"kj",rcusp:"kj",me08:"kj",arm:"kj",copt:"kj",adai:"kj"};
const ORD_ONLY=r=>!!(MASS_RITES.find(x=>x.id===r)||{}).ord;
async function renderSession(){
  await daysReady;
  const iso=S.date||todayISO();
  window.dispatchEvent(new CustomEvent("lect-session",{detail:{type:S.type,rite:S.rite,hour:S.hour,iso,label:(S.type==="mass"?MASS_RITES:OFFICE_RITES).find(r=>r.id===S.rite)?.name}}));
  const crumbs=[S.type==="mass"?"Mass":"Divine Office", (S.type==="mass"?MASS_RITES:OFFICE_RITES).find(r=>r.id===S.rite).name];
  if(S.type==="office") crumbs.push(hoursFor(S.rite).find(h=>h[0]===S.hour)[1]);
  const day=DAYS[iso];
  let head=`<div class="sesbar"><button type="button" class="ghost" id="backAsk">← Change</button><span class="crumbs">${crumbs.map(esc).join(" › ")}</span>
    <span class="daynav"><button type="button" class="ghost" id="prevDay" aria-label="Previous day">‹</button><span class="dlabel">${esc(longDate(iso))}</span><button type="button" class="ghost" id="nextDay" aria-label="Next day">›</button></span></div>`;
  { const c=coverage(S.type,S.rite,S.hour); if(c) head+=`<p class="covline">${covBadge(c)} ${esc(c[1])}</p>`; }
  let body="", officeData=null;
  if(!day){ body=`<p class="empty">This page covers 30 November 2025 to 30 November 2030. Choose a date in that range.</p>`; }
  else if(S.type==="mass"&&S.rite==="bcp79"){
    const B=await fetch("data/bcp1979.json").then(r=>r.json()), D=window.LectPB79?window.LectPB79.day(iso,B.collects.c):null;
    body=`<h2 class="dayname">${esc(D?D.title:"")}</h2><p class="daysub">The Book of Common Prayer (1979)${D&&D.title!==D.season?` · ${esc(D.season)}`:""}</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer (Episcopal Church, 1979), which is not under copyright, as presented by The Online Book of Common Prayer (bcponline.org). The lessons come from the Revised Common Lectionary, which is not reproduced here.</p></footer>`;
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
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">Morning and Evening Prayer · The Sunday Service of the Methodists in North America (1784)</p><div id="massGuide"></div><footer class="sesfoot"><p>John Wesley, The Sunday Service of the Methodists in North America (London, 1784), public domain, transcribed from the Internet Archive scan and checked against the 1662 Prayer Book it abridges. Wesley appointed these services for the Lord's Day and the Litany for Wednesdays and Fridays, "praying extempore on all other days". The lessons are those of the book's table, in the King James Version.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="wes84"){
    const B=await fetch("data/bcp1784.json").then(r=>r.json()), pr=window.LectPB?window.LectPB.propers(B,iso,day,DAYS):null;
    const wk=pr&&toDate(iso).getUTCDay()&&/SUNDAY/i.test(pr.t);
    body=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">The Sunday Service of the Methodists in North America (1784)${wk?" · the Sunday's collect, epistle and gospel serve the week":""}</p><div id="massGuide"></div><footer class="sesfoot"><p>John Wesley, The Sunday Service of the Methodists in North America, with Other Occasional Services (London, 1784), public domain, transcribed from the Internet Archive scan of the Princeton Theological Seminary copy and checked against the 1662 Prayer Book it abridges. Wesley numbers the Sundays from Christmas to Lent as Sundays after Christmas; the 1662 name of each is given beside it. The epistles and gospels are the King James text the book prints.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp89"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1789)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Protestant Episcopal Church in the United States of America (1789), public domain, as transcribed by the Society of Archbishop Justus. The Collect, Epistle and Gospel of the day are not yet printed for this book: take them from your Prayer Book.</p></footer>`;
  }
  else if(S.type==="mass"&&S.rite==="bcp92"){
    body=`<h2 class="dayname">${esc((day.o&&day.o.t)||"")}</h2><p class="daysub">The Book of Common Prayer (1892)</p><div id="massGuide"></div><footer class="sesfoot"><p>The Book of Common Prayer of the Protestant Episcopal Church in the United States of America (1892), public domain, as transcribed by the Society of Archbishop Justus. The Collect, Epistle and Gospel of the day are not yet printed for this book: take them from your Prayer Book.</p></footer>`;
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
  const R=S.rite, H=S.hour, d=toDate(iso), dow=d.getUTCDay();
  const hourName=hoursFor(R).find(x=>x[0]===H)[1];
  const slots={};
  const blk=(lab,cit,tr)=>readingBlock(lab,cit,"n",tr);
  let h="";
  const ord = R==="loth"?ORDER.loth[H]: R==="dwdo"?ORDER.dwdo[H]: R==="byz"?ORDER.byz[H]: ORDER.br[H];
  if(R==="loth"){
    h+=`<h2 class="dayname">${esc(day.n.t)}</h2><p class="daysub">Psalter Week ${psalterWeek(iso)} · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The psalms and canticles of the four-week psalter are given in full in the Douay-Rheims, a public-domain translation from the Latin (the Liturgy of the Hours uses the Grail or Abbey Psalms, so the wording differs, and the psalms keep their Latin numbering in brackets). The hymns, antiphons, intercessions and prayers of the official books are copyrighted: press <b>Add text</b> beside any of them to fill it in from your own breviary, or <a href="https://universalis.com/${iso.replace(/-/g,"")}/${UNIV_HOUR[H]}.htm" target="_blank" rel="noopener">open today's ${esc(hourName)} at Universalis</a>. Solemnities and feasts have proper psalms.</p>`;
    { let x=""; for(const ps of lothPsalms(iso,H,day)) x+=await blk(ps.lab,ps.cit,"dr"); slots.psalms=x||`<p class="note">No psalmody is listed for this hour.</p>`; }
    if(H==="lauds"||H==="or") slots.invit=`<details class="canon"><summary>Invitatory: Psalm 95 (94), if this is the first hour of the day</summary>${await blk("Psalm 95 (94)","Ps 95","dr")}</details>`;
    slots.bened=await blk("Benedictus","Luke 1:68-79","dr"); slots.magn=await blk("Magnificat","Luke 1:46-55","dr"); slots.nunc=await blk("Nunc dimittis","Luke 2:29-32","dr");
    if(H==="or"){ let LOH={}; try{ LOH=JSON.parse(document.getElementById("lect-extra").textContent).LOH; }catch(e){}
      const c=day.nk && LOH[day.nk];
      slots.first = (dow===0 && c && /\d/.test(c)) ? await blk("Biblical reading · one-year cycle",c,"dr") : `<p class="note">Weekday biblical readings follow the Office's own course; see Universalis for today's.</p>`; }
  } else if(R==="bcp79"){
    const B=await fetch("data/bcp1979.json").then(r=>r.json()), rite1=/1$/.test(H), C=B.collects[rite1?"t":"c"];
    const D=window.LectPB79.day(iso,C), col=C[D.title]||C[D.season];
    const dom=Math.min(30,d.getUTCDate()), eve=/^ep|compline/.test(H);
    h+=`<h2 class="dayname">${esc(D.title)}</h2><p class="daysub">Day ${dom} of the month · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The text is the Book of Common Prayer of the Episcopal Church (1979), with the psalms appointed for the ${dom}${[,"st","nd","rd"][dom%10>3||Math.floor(dom/10)===1?0:dom%10]||"th"} day of the month in the 1979 Psalter. Take the lessons from the Daily Office Lectionary.</p>`;
    const fill=name=>{
      if(name==="psalms") return B.psalter[(eve?"e":"m")+dom].map(p=>`<h5 class="sub">Psalm ${esc(p.n)}${p.latin?` <i>${esc(p.latin)}</i>`:""}</h5>`+p.v.map(([n,t])=>n?`<p data-r="all"><sup>${n}</sup> ${esc(t)}</p>`:`<p class="rub">${esc(t)}</p>`).join("")).join("");
      if(name==="lessons") return `<p class="cue">The lessons appointed for today in the Daily Office Lectionary.</p>`;
      if(name==="collect"&&col) return `<h5 class="sub">The Collect of the Day</h5><p class="cite">${esc(D.title)}</p>`+col.text.map(t=>`<p data-r="cel">${esc(t)}</p>`).join("");
      return "";
    };
    const steps=B.offices[H].map(st=>({t:st.t||hourName, slot:`<div class="txt">${window.LectPB79.items(st.items,fill)}</div>`}));
    return {h, steps, hourName};
  } else if(R==="bcp28"){
    const B=await fetch("data/bcp1928.json").then(r=>r.json()), pr=day.o&&day.o.bcp&&B.propers[day.o.bcp];
    h+=`<h2 class="dayname">${esc(pr?pr.t:(day.o&&day.o.t)||"")}</h2><p class="daysub">Day ${Math.min(30,d.getUTCDate())} of the month · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The text is the Book of Common Prayer of the Episcopal Church (1928), with the psalms of the day of the month. Take the lessons from the 1928 (1943) lectionary.</p>`;
    const steps=[];
    for(const st of B[H]){
      let x="";
      const its=st.items.map(bcpItem);
      if(st.slot==="psalms"){ x+=its[0]||""; for(const p of bcpPsalms(iso,H==="ep")) x+=await blk(p.replace("Ps ","Psalm "),p,"cv"); x+=its.slice(1).join(""); }
      else x=its.join("");
      if(st.slot==="lesson1"||st.slot==="lesson2") x+=`<p class="cue">${st.slot==="lesson1"?"The First Lesson":"The Second Lesson"} appointed for today in the 1928 Prayer Book lectionary.</p>`;
      if(st.slot==="collect"&&pr){ const c=pr.sets[0].collect; x=its[0]+`<h5 class="sub">The Collect of the Day</h5><p class="cite">${esc(pr.t)}</p>`+c.map(t=>`<p data-r="cel">${esc(t)}</p>`).join("")+its.slice(1).join(""); }
      steps.push({t:st.t, slot:`<div class="txt">${x}</div>`});
    }
    return {h, steps, hourName};
  } else if(R==="dwdo"){
    const on=(day.o&&day.o.s||"").startsWith("Divine Worship: ")?day.o.s.replace("Divine Worship: ",""):"";
    h+=`<h2 class="dayname">${esc(on||day.o.t)}</h2><p class="daysub">Day ${Math.min(30,d.getUTCDate())} of the month · ${esc(hourName)}</p>`;
    if(H==="mattins"||H==="evensong"){
      h+=`<p class="callout">The text is the 1662 Book of Common Prayer, the traditional-language base of Divine Worship: Daily Office, with the psalms of the day from its Coverdale psalter. Divine Worship adapts some parts (the suffrages and the prayers for the Church, for example): follow your book where it differs. Take the lessons from the Divine Worship lectionary.</p>`;
      const BO=await bcpOffice(), steps=[];
      for(const st of BO[H]){
        let x=st.items.length?`<div class="txt">${st.items.map(bcpItem).join("")}</div>`:"";
        if(st.slot==="psalms"){ for(const p of bcpPsalms(iso,H==="evensong")) x+=await blk(p.replace("Ps ","Psalm "),p,"cv"); }
        if(st.slot==="lesson1"||st.slot==="lesson2") x+=`<p class="cue">${st.slot==="lesson1"?"The Old Testament lesson":"The New Testament lesson"} appointed for today in the Divine Worship lectionary.</p>`;
        if(st.slot==="collect"){ const nm=day.o.bcp, c=nm&&BO.collects[nm]; if(c) x=`<div class="txt"><h5 class="sub">The Collect of the Day</h5><p class="cite">${esc(titleCase(nm))}</p><p data-r="cel">${esc(c)}</p><p data-r="ppl"><span class="sp">℟.</span> Amen.</p></div>`+x; }
        steps.push({t:st.t, slot:x});
      }
      return {h, steps, hourName};
    }
    if(/^(prime|terce|sext|none)$/.test(H)){
      h+=`<p class="callout">The text is The Day-Hours of the Church of England (1877), which sets the old little hours in Prayer Book English, with the Coverdale psalms. It gives the Sunday and weekday forms; on feasts and in the great seasons it appoints proper antiphons and hymn endings, which you take from your book.</p>`;
      const [DH,BO]=await Promise.all([fetch("data/dayhours.json").then(r=>r.json()),bcpOffice()]);
      const env=dhEnv(iso), steps=[];
      const nm=day.o.bcp, col=nm&&BO.collects[nm];
      for(const st of DH.hours[H]){
        if(!dhOk(st,env)) continue;
        const x=await dhItems(st.items,env,{blk,col,nm,preces:DH.hours.preces[0].items,dow});
        if(x) steps.push({t:st.t, slot:`<div class="txt">${x}</div>`});
      }
      return {h, steps, hourName};
    }
    h+=`<p class="callout">The psalms are given from the Coverdale psalter of the 1662 Book of Common Prayer. Take the other texts from your book.</p>`;
    if(H==="compline"){ let x=""; for(const p of ["Ps 4","Ps 31:1-6","Ps 91","Ps 134"]) x+=await blk(p.replace("Ps ","Psalm "),p,"cv"); slots.psalms=x; }
    slots.resp=`<div class="txt one"><p data-r="cel">Into thy hands, O Lord, I commend my spirit.</p><p data-r="ppl"><span class="sp">℟.</span> Into thy hands, O Lord, I commend my spirit.</p><p data-r="cel">For thou hast redeemed me, O Lord, thou God of truth.</p><p data-r="ppl"><span class="sp">℟.</span> I commend my spirit.</p><p data-r="cel">Glory be to the Father, and to the Son, and to the Holy Ghost.</p><p data-r="ppl"><span class="sp">℟.</span> Into thy hands, O Lord, I commend my spirit.</p></div>`;
    slots.venite = d.getUTCDate()===19 ? `<p class="note">Psalm 95 falls in today's course, so the Jubilate (Psalm 100) replaces it.</p>`+await blk("Jubilate","Ps 100","cv") : await blk("Venite","Ps 95","cv");
    slots.bened=await blk("Benedictus","Luke 1:68-79","kj"); slots.magn=await blk("Magnificat","Luke 1:46-55","kj"); slots.nunc=await blk("Nunc dimittis","Luke 2:29-32","kj");
  } else if(R==="byz"){
    const tone=byzTone(iso), eo=eothinon(iso), b=day.b;
    h+=`<h2 class="dayname">${esc(b?b.t:"Weekday")}</h2><p class="daysub">${tone?`Tone ${tone} of the Octoechos`:"Paschal or Holy Week propers"} · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The psalms are given in full in the Douay-Rheims, numbered as in the Septuagint, with the fixed prayers in traditional English. The hymnody of the day (stichera, troparia, kontakia, canons) varies between churches and translations: press <b>Add text</b> to fill it in from your Horologion, Octoechos and Menaion.</p>`;
    slots.ps104=await blk("Psalm 103 (104)","Ps 104","dr"); slots.nunc=await blk("Song of Simeon","Luke 2:29-32","dr"); slots.ps50=await blk("Psalm 50 (51)","Ps 51","dr");
    { const P=BYZ_PS[H]||{}; for(const [slot,list] of Object.entries(P)){ let x=""; for(const n of list) x+=await readingBlock(`Psalm ${n}`,"Ps "+n,"v","dr"); slots[slot]=x; } }
    /* Sunday tone hymns from Hapgood's Appendix A (1906, public domain); Saturday Vespers takes the coming Sunday's tone. */
    const BZ=await fetch("data/byz-liturgy.json").then(r=>r.ok?r.json():null).catch(()=>null);
    const sunTone=dow===0?tone:(dow===6&&H==="vespers")?byzTone(new Date(toDate(iso).getTime()+DAY).toISOString().slice(0,10)):null;
    const TN=sunTone&&BZ&&BZ.tones?BZ.tones[sunTone]:null;
    const hy=(lab,t)=>`<p class="rub">${esc(lab)}</p><p data-r="ppl">${esc(t)}</p>`;
    const hapNote=`<p class="note">Sunday hymns of Tone ${sunTone}, from Isabel Hapgood's Service Book (1906).</p>`;
    slots.godlord=byzTx("godlord")+(TN&&H==="orthros"?hy(`Troparion of the Resurrection, Tone ${sunTone} (twice)`,TN.troparion)+`<p class="note">Glory…: the troparion of the saint, if any. Both now…:</p>`+hy("Theotokion",TN.theotokion)+hapNote:`<p class="note">Then the troparia of the day (Add text to fill them in from your Octoechos and Menaion).</p>`); slots.fhp=byzTx("fhp");
    if(TN&&H==="vespers"){ slots.lic=(slots.lic||"")+`<h4 class="sub2">Stichera of the Resurrection, Tone ${sunTone}</h4>`+TN.lic.map(x=>`<p data-r="ppl">${esc(x)}</p>`).join("")+`<p class="note">Then the stichera of the Menaion. Glory… Both now…:</p>`+hy("Dogmatikon",TN.dogmatikon)+hapNote;
      slots.nunc=(slots.nunc||"")+`<h4 class="sub2">Apolytikion</h4>`+hy(`Troparion of the Resurrection, Tone ${sunTone}`,TN.troparion)+`<p class="note">Glory…: the troparion of the saint, if any. Both now…:</p>`+hy("Theotokion",TN.theotokion); }
    if(TN&&/^(first|third|sixth|ninth)$/.test(H)) slots.tris=(slots.tris||"")+hy(`Troparion of the Resurrection, Tone ${sunTone}`,TN.troparion)+hy(`Kontakion, Tone ${sunTone}`,TN.kontakion);
    if(H==="orthros") slots.magn=await blk("Magnificat","Luke 1:46-55","dr")+`<p class="note">Between the verses: More honourable than the Cherubim, and beyond compare more glorious than the Seraphim, who without corruption gavest birth to God the Word, true Theotokos, we magnify thee.</p>`;
    slots.tris=byzTx("tris")+(slots.tris||""); slots.creed=byzTx("creed"); slots.phos=byzTx("phos")+`<p class="note">Phos hilaron in John Keble's translation (1834).</p>`; slots.vouch=byzTx("vouch");
    if(H==="orthros") slots.lauds=(slots.lauds||"")+`<h4 class="sub2">The Great Doxology</h4>`+byzTx("doxo");
    slots.eoth = eo ? await blk(`Resurrection Gospel · Eothinon ${eo}`,EOTHINA[eo],"dr") : `<p class="note">${dow===0?"From Pascha to Pentecost the Sunday Gospels are proper to the Pentecostarion.":"Read on Sundays only."}</p>`;
  } else {
    const full=await doHour(R,H,iso);
    if(full){
      h+=`<h2 class="dayname">${esc(full.title||((R==="br55"?day.p:day.m)||{}).t||"")}</h2><p class="daysub">${esc(hourName)}</p>`;
      h+=`<p class="callout">The full text of the hour in Latin and English, generated with the Divinum Officium engine (MIT licence) from its data. ${R==="mon"||R==="op"?"The Benedictine and Dominican calendars and psalters are followed.":""}${full.chant?" Turn on Chant above the order to sing the antiphons and psalms in Gregorian chant.":""}</p>`;
      return {h, steps:full.steps, alt:full.chant, hourName};
    }
    const t=(R==="br55"?day.p:day.m)||{};
    h+=`<h2 class="dayname">${esc(t.t||"")}</h2><p class="daysub">${esc(t.s||"")} · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The full ${esc(hourName)} for this date, in Latin and English, is at <a href="https://www.divinumofficium.com/cgi-bin/horas/officium.pl?date1=${doDate(iso)}&version=${encodeURIComponent(DO_VERSION[R])}&command=pray${DO_HOUR[H]}&lang2=English" target="_blank" rel="noopener">Divinum Officium</a>. ${R==="mon"||R==="op"?"The day named above follows the Roman 1962 calendar; the Benedictine and Dominican calendars differ on some saints' days.":""}</p>`;
    slots.bened=await blk("Benedictus","Luke 1:68-79","dr"); slots.magn=await blk("Magnificat","Luke 1:46-55","dr"); slots.nunc=await blk("Nunc dimittis","Luke 2:29-32","dr");
  }
  const steps=(ord||[]).map(x=>{ const m=/^@(\w+)\|(.*)$/.exec(x); return m?{t:m[2],slot:slots[m[1]]||""}:{t:x}; });
  return {h, steps, hourName};
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
  const c=(day.n&&day.n.c)||"green", n=day.n||{}, m=day.m||{}, b=day.b||{};
  const trad=m.t?(m.feria&&m.note?`${m.t.replace(/ · Mass of the preceding Sunday/,"")} · ${m.note}`:m.t):"";
  const oRite=OFFICE_RITES.find(r=>r.id===(S.type==="office"&&S.rite?S.rite:"br62"))||OFFICE_RITES[0];
  el.innerHTML=`<div class="tband" data-c="${esc(c)}" style="--lc:var(${LITC[c]||"--lit-green"})">
    <div><div class="tb-date">${esc(longDate(iso))}<span class="sw">${esc(c.charAt(0).toUpperCase()+c.slice(1))}</span></div>
      <p class="tb-main">${esc(n.t||"")}</p>
      <dl class="tb-days">${n.s?`<div><dt>Roman Missal</dt><dd>${esc(n.s)}</dd></div>`:""}${trad?`<div><dt>1962 Missal</dt><dd>${esc(trad)}</dd></div>`:""}${b.t?`<div><dt>Byzantine</dt><dd>${esc(b.t)}</dd></div>`:""}</dl></div>
    <div class="tb-go"><button type="button" class="go" data-quick="mass">Pray today's Mass</button><button type="button" class="ghost" data-quick="office" title="${esc(oRite.name)}">Pray the hour now</button></div></div>`;
  el.querySelectorAll("[data-quick]").forEach(btn=>btn.addEventListener("click",()=>{
    const t=btn.dataset.quick; S.date=todayISO();
    if(t==="mass"){ if(S.type!=="mass"||!MASS_RITES.some(r=>r.id===S.rite)) S.rite="n"; S.type="mass"; }
    else { if(S.type!=="office"||!OFFICE_RITES.some(r=>r.id===S.rite)) S.rite="br62"; S.type="office"; S.hour=suggestHour(S.rite); }
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
  passage,
  coverage(type,rite,hour){ return COV_LABEL[coverage(type,rite,hour)?.[0]]||"Guided text"; },
  /* open the session a live host is running */
  follow(d){ S.type=d.type; S.rite=d.rite; S.hour=d.hour||null; S.date=d.iso; S.view="session"; render(); },
  current(){ return {type:S.type, rite:S.rite, hour:S.hour||null, iso:S.date}; }
};
loadPrefs(); S.date=todayISO(); render();
})();
