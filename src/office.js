/* ================================================================ THE DAILY OFFICE
   The builders of an hour of the Office (the Liturgy of the Hours, the Breviaries, the Prayer Book offices, the
   Day-Hours and the Byzantine hours), split from today.js and loaded with the service code (window.LectLoad):
   the Pray-today page needs them only when an hour is opened. today.js calls LectOffice.body(iso, day, env)
   with the calendar helpers it keeps for the rest of the page. */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const {DAY,toDate,easter:easterY,fromEaster}=window.LitDate;
const doDate=iso=>{ const [y,m,d]=iso.split("-"); return `${m}-${d}-${y}`; };
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


async function officeBody(iso, day, env){
  const {S, hoursFor, readingBlock, bcpPsalms, byzTone, eothinon, lothPsalms, psalterWeek, EOTHINA}=env;
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
    const L=window.LectCalendar.custom({type:"office",rite:R,hour:H,iso})||await window.LectCalendar.pb79({iso,day},true,eve);
    const lessonHTML=await window.LectCalendar.html({readingBlock},L);
    let psalmHTML="";for(const cite of L.psalms||[])psalmHTML+=await window.LectCalendar.psalm79(cite,"Appointed Psalm");
    h+=`<h2 class="dayname">${esc(D.title)}</h2><p class="daysub">Day ${dom} of the month · ${esc(hourName)}</p>`;
    h+=`<p class="callout">The text is the Book of Common Prayer of the Episcopal Church (1979), with two-year Daily Office lessons in the King James Bible and appointed psalms from the 1979 Psalter. Where an appointment is missing, check your book; the monthly 1979 Psalter remains available. Noonday and Compline retain their fixed short lessons.</p>`;
    const fill=name=>{
      if(name==="psalms") return psalmHTML||B.psalter[(eve?"e":"m")+dom].map(p=>`<h5 class="sub">Psalm ${esc(p.n)}${p.latin?` <i>${esc(p.latin)}</i>`:""}</h5>`+p.v.map(([n,t])=>n?`<p data-r="all"><sup>${n}</sup> ${esc(t)}</p>`:`<p class="rub">${esc(t)}</p>`).join("")).join("");
      if(name==="lessons") return lessonHTML;
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
    /* The Great Feasts from Hapgood's Special Services: Vespers is the vigil of the coming day's feast. */
    { const fx=i=>{ if(!BZ||!BZ.feasts) return []; const d=toDate(i), off=fromEaster(d); return [BZ.feasts[i.slice(5)],BZ.feasts["p"+(off>=0&&off<7?0:off)]].filter(Boolean); };
      const TONE=n=>n?`, Tone ${n}`:"";
      const FX=H==="vespers"?fx(new Date(toDate(iso).getTime()+DAY).toISOString().slice(0,10)).filter(f=>f.lic):fx(iso);
      if(FX.length){
        const note=`<p class="note">The hymns of ${esc(FX.map(f=>f.t).join(" and "))} are from the Special Services of Hapgood's Service Book (1906); the rest of the feast's hymnody is in your Menaion or Triodion.</p>`;
        const tk=(kont)=>FX.map(f=>hy(`Troparion of the feast${TONE(f.troparion_tone)}`,f.troparion)+(kont&&f.kontakion?hy(`Kontakion of the feast${TONE(f.kontakion_tone)}`,f.kontakion):"")).join("");
        if(H==="vespers"){
          slots.lic=(slots.lic||"")+FX.map(f=>`<h4 class="sub2">Sticheron of the feast${TONE(f.lic_tone)}</h4><p data-r="ppl">${esc(f.lic)}</p>`+(f.lity?`<h4 class="sub2">At the Litiya${TONE(f.lity_tone)}</h4><p data-r="ppl">${esc(f.lity)}</p>`:"")).join("")+note;
          slots.nunc=(slots.nunc||"")+`<h4 class="sub2">Apolytikion of the feast</h4>`+tk(false);
        }
        if(H==="orthros"){ slots.godlord=byzTx("godlord")+tk(false)+note; }
        if(/^(first|third|sixth|ninth)$/.test(H)) slots.tris=tk(true)+note;
      }
      slots._fx=FX; }
    if(H==="orthros"&&slots._fx.some(f=>f.exalt)) slots.magn=slots._fx.filter(f=>f.exalt).map(f=>`<h4 class="sub2">Magnification of the feast</h4><p data-r="ppl">${esc(f.exalt)}</p>`).join("")+`<p class="note">On the feast the magnification is sung before the Polyeleos Gospel; at the ninth ode the festal refrains replace More honourable than the Cherubim.</p>`+await blk("Magnificat","Luke 1:46-55","dr");
    else if(H==="orthros") slots.magn=await blk("Magnificat","Luke 1:46-55","dr")+`<p class="note">Between the verses: More honourable than the Cherubim, and beyond compare more glorious than the Seraphim, who without corruption gavest birth to God the Word, true Theotokos, we magnify thee.</p>`;
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
window.LectOffice={body:officeBody};
})();
