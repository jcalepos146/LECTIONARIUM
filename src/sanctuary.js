/* Sanctuary is a lazy catalog and input layer; service rendering stays in LectApp. */
(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch(e){return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
let catalog,loading,days,open=false,returnHash='#today',returnScroll=0,returnFocus,routeSerial=0,input=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)?'touch':'keyboard',menu=false;
let focusByRoute=new Map(),previousRoute='',gameFrame=0,lastGameAction='',gameRepeatAt=0,audio,guideReturn='#/sanctuary';
let prefs=read('lect-sanctuary-prefs',{size:1,theme:'night',sound:false});
/* The Sanctuary is the default view. "Classic view" is the economical page; the choice is remembered. While the
   Sanctuary is the home view, the classic page (where the guides are drawn) wears the Sanctuary's skin. */
let homePref=read('lect-home','sanctuary')==='classic'?'classic':'sanctuary';
let recent=read('lect-sanctuary-recent',[]);if(!Array.isArray(recent))recent=[];
const root=document.createElement('section');root.id='sanctuary';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Sanctuary mode');document.body.append(root);
const isRoute=h=>/^#\/(sanctuary|study|wip|t(?:\/|$)|search(?:\/|$))/.test(h);
returnHash=isRoute(location.hash)?'#today':location.hash||'#today';
const glyphs={keyboard:'↑ ↓ ← → Move · Enter Select · Esc Back · / Search · S Exit',gamepad:'✚ / Left stick Move · A Select · B Back · Y Search · Start Menu',touch:'Tap a tile to explore · Back to return',mouse:'Click a tile to explore · Back to return'};
function prompts(){const p=root.querySelector('.san-prompts');if(p)p.textContent=glyphs[input];}
function activeInput(value){if(input!==value){input=value;prompts();}}
function applyPrefs(){root.dataset.theme=prefs.theme;root.style.setProperty('--san-scale',String(prefs.size));write('lect-sanctuary-prefs',prefs);applySkin();}
const bar=document.createElement('div');bar.id='san-bar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Sanctuary');
bar.innerHTML='<button type="button" data-bar="home">← Sanctuary</button><button type="button" data-bar="study">Study</button><button type="button" data-bar="search">Search</button><button type="button" data-bar="classic">Classic view</button><details class="san-guide-help"><summary>Guide controls</summary><p>↑ ↓ Sections · ← → Controls · Enter Select · Esc Back</p><p>Gamepad: D-pad / left stick Move · A Select · B Back · Y Search · Start Menu</p></details>';
function applySkin(){const on=homePref==='sanctuary',r=document.documentElement;
 if(on){r.dataset.skin='sanctuary';r.dataset.skinTheme=prefs.theme;r.dataset.theme=prefs.theme==='vellum'?'light':'dark';}
 else{delete r.dataset.skin;delete r.dataset.skinTheme;delete r.dataset.theme;}
 bar.hidden=!on;const b=document.getElementById('enter-sanctuary');if(b)b.innerHTML=on?'Sanctuary <kbd>S</kbd>':'Sanctuary view <kbd>S</kbd>';}
function setHome(v){homePref=v==='classic'?'classic':'sanctuary';write('lect-home',homePref);applySkin();startPolling();}
function sound(){if(!prefs.sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=380;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.07);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.07);}catch(e){}}
// Original geometric Christian symbols, never church insignia.
const marks={catholic:'☧','eastern-orthodox':'✚',oriental:'✣','old-catholic':'⚓',anglican:'✥',lutheran:'✝',reformed:'☷',methodist:'✙'};
let artSerial=0;
function emblem(f){const pattern="san-art-"+(++artSerial);return `<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false"><defs><pattern id="${pattern}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(${f.length*3})"><path d="M0 12h24M12 0v24" fill="none" stroke="currentColor" opacity=".12"/></pattern></defs><rect width="320" height="180" fill="url(#${pattern})"/><circle cx="160" cy="90" r="57" fill="none" stroke="currentColor"/><circle cx="160" cy="90" r="50" fill="none" stroke="currentColor" opacity=".5"/>${f==='reformed'?'<path d="M120 65 Q140 55 160 65 Q180 55 200 65 V118 Q180 108 160 118 Q140 108 120 118 Z M160 65 V118 M129 76 L151 76 M169 76 L191 76 M129 86 L151 86 M169 86 L191 86" fill="none" stroke="currentColor" stroke-width="3"/>':`<text x="160" y="112" font-family="serif" font-size="64" text-anchor="middle" fill="currentColor">${marks[f]||'✝'}</text>`}</svg>`;}
function coverage(s){return window.LectApp.coverage(s.type,s.rite,s.hour);}
function tile(id,title,subtitle='',family='catholic',chip='',action='route'){
 return `<button class="san-tile" data-${action}="${esc(id)}"><span class="san-art">${emblem(family)}${chip?`<span class="san-chip">${esc(chip)}</span>`:''}</span><span class="san-tile-title">${esc(title)}</span>${subtitle?`<span class="san-subtitle">${esc(subtitle)}</span>`:''}</button>`;
}
const KIND={rite:'Tradition',church:'Church',use:'Use','book-edition':'Book',jurisdiction:'Jurisdiction'};
const descendants=n=>{const kids=catalog.filter(c=>c.parent===n.id);return kids.concat(...kids.map(descendants));};
/* What a tile can open: complete texts, guided texts, churches to explore, or nothing yet. */
function nodeCov(n){const all=rites(),cov=n.supported.map(s=>all.find(r=>r.type===s.type&&r.rite===s.rite)?.cov).filter(Boolean);
 if(cov.includes('full'))return 'Complete text';if(cov.length)return 'Guided';return descendants(n).some(d=>d.supported.length)?'Explore':'Coming later';}
function nodeSub(n){const k=KIND[n.kind]||'';const c=new Set(n.supported.map(s=>s.type+s.rite)).size;return c?`${k} · ${c} service${c>1?'s':''}`:k;}
function nodeTile(n,subtitle){return tile('#/t/'+n.id,n.name,subtitle??nodeSub(n),n.family,nodeCov(n));}
function shelf(title,tiles,empty=''){return `<section class="san-shelf"><h2>${esc(title)}</h2>${tiles?`<div class="san-row" aria-label="${esc(title)}">${tiles}</div>`:`<p class="san-muted">${esc(empty)}</p>`}</section>`;}
function parentOf(n){return n&&n.parent?catalog.find(x=>x.id===n.parent):null;}
function go(hash){if(location.hash===hash)render();else location.hash=hash;}
function back(){if(menu){menu=false;render();return;}const bits=location.hash.slice(2).split('/');if(bits[0]==='t'){const n=catalog?.find(x=>x.id===bits.at(-1));const parent=parentOf(n);go(parent?'#/t/'+parent.id:'#/sanctuary');}else if(bits[0]==='search'||bits[0]==='wip'||bits[0]==='study')go('#/sanctuary');else close();}
function close(hash=returnHash){go(isRoute(hash)?'#today':hash||'#today');}
function enter(){if(open)return;open=true;returnFocus=document.activeElement;returnScroll=window.scrollY;document.querySelector('.wrap').inert=true;document.body.classList.add('san-open');root.hidden=false;applyPrefs();startPolling();}
function leave(){if(!open)return;open=false;++routeSerial;root.hidden=true;document.querySelector('.wrap').inert=false;document.body.classList.remove('san-open');cancelAnimationFrame(gameFrame);gameFrame=0;startPolling();menu=false;requestAnimationFrame(()=>{window.scrollTo(0,returnScroll);returnFocus?.focus({preventScroll:true});});}
function saveFocus(){const el=document.activeElement;if(root.contains(el))focusByRoute.set(previousRoute,el.dataset.route||el.dataset.pray||el.id||el.dataset.action);}
function focus(el){if(!el)return;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
function controls(){return [...root.querySelectorAll('button:not([disabled]),input,a[href],select,summary')].filter(e=>e.getClientRects().length);}
function move(direction){const list=controls(),cur=document.activeElement;if(!list.length)return;if(!list.includes(cur)){focus(list[0]);return;}
 const row=cur.closest('.san-row');if(row&&(direction==='left'||direction==='right')){const siblings=[...row.querySelectorAll('button')];const i=siblings.indexOf(cur);focus(siblings[(i+(direction==='left'?-1:1)+siblings.length)%siblings.length]);sound();return;}
 const a=cur.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;
 const scored=list.filter(e=>e!==cur).map(el=>{const b=el.getBoundingClientRect(),dx=b.x+b.width/2-ax,dy=b.y+b.height/2-ay;const forward=direction==='down'?dy:direction==='up'?-dy:direction==='right'?dx:-dx;const side=Math.abs(direction==='down'||direction==='up'?dx:dy);return {el,forward,score:forward+side*2};}).filter(x=>x.forward>4).sort((a,b)=>a.score-b.score);
 focus(scored[0]?.el||list[(list.indexOf(cur)+(direction==='up'||direction==='left'?-1:1)+list.length)%list.length]);sound();}
function guideActive(){return !open&&homePref==='sanctuary'&&!document.getElementById('today')?.hidden&&!document.getElementById('session')?.hidden&&!document.querySelector('dialog[open]')&&![...document.querySelectorAll('[aria-modal="true"]')].some(e=>e!==root&&e.getClientRects().length)&&!!document.querySelector('#massGuide .mbody .mpart');}
function guideMove(direction){
 const parts=[...document.querySelectorAll('#massGuide .mbody .mpart')].filter(e=>e.getClientRects().length);if(!parts.length)return;
 const active=document.activeElement,part=active?.closest('.mpart');let i=parts.indexOf(part);
 if(i<0)i=Math.max(0,parts.findIndex(e=>e.getBoundingClientRect().bottom>100));
 if(direction==='up'||direction==='down'){
  if(part)i=Math.max(0,Math.min(parts.length-1,i+(direction==='up'?-1:1)));
  const target=parts[i];target.tabIndex=-1;target.setAttribute('aria-label',target.querySelector('h3')?.textContent||'Service section');focus(target);
 }else{
  const list=[...parts[i].querySelectorAll('button:not([disabled]),a[href],summary,input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(e=>e.getClientRects().length);
  if(!list.length){parts[i].tabIndex=-1;focus(parts[i]);return;}
  const n=list.indexOf(active),step=direction==='left'?-1:1;focus(list[n<0?(step>0?0:list.length-1):(n+step+list.length)%list.length]);
 }
 sound();
}
async function load(){if(catalog)return;if(!loading)loading=fetch('data/traditions.json').then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();}).then(j=>{catalog=j;}).catch(e=>{loading=null;throw e;});return loading;}
/* The rites the guide can open, from LectApp, with the tradition each belongs to (for its emblem). */
const RITE_FAMILY=new Proxy({},{get:(o,id)=>typeof id==='string'&&window.LectApp?.familyOf?window.LectApp.familyOf(id):'catholic'});
const FAMILY_NAME={catholic:'Catholic','eastern-orthodox':'Eastern Orthodox',oriental:'Oriental Orthodox and the Church of the East','old-catholic':'Old Catholic',anglican:'Anglican',lutheran:'Lutheran',reformed:'Reformed and Presbyterian',methodist:'Methodist'};
function rites(){try{return window.LectApp.rites();}catch(e){return [];}}
const kindOf=s=>{try{return window.LectApp.riteKind(s.type,s.rite);}catch(e){return '';}};
const HOUR_NAME={or:'Office of Readings',lauds:'Lauds',terce:'Terce',sext:'Sext',none:'None',vespers:'Vespers',compline:'Compline',matins:'Matins',prime:'Prime',mattins:'Mattins',evensong:'Evensong',mp:'Morning Prayer',ep:'Evening Prayer',mp1:'Morning Prayer',mp2:'Morning Prayer',ep1:'Evening Prayer',ep2:'Evening Prayer',noonday:'Noonday Prayer',orthros:'Orthros',midnight:'Midnight Office',first:'First Hour',third:'Third Hour',sixth:'Sixth Hour',ninth:'Ninth Hour'};
const hourName=s=>HOUR_NAME[s.hour]||s.hour;
const COV_SHORT={full:'Complete text',guide:'Guided',order:'Order and readings'};
function riteTile(r,subtitle){return `<button class="san-tile" data-launch="${esc(r.type+'|'+r.rite+'|'+(r.hour||''))}"><span class="san-art">${emblem(RITE_FAMILY[r.rite]||'catholic')}<span class="san-chip">${esc(COV_SHORT[r.cov]||r.covLabel)}</span></span><span class="san-tile-title">${esc(r.name)}</span><span class="san-subtitle">${esc(subtitle||r.kind+' · '+r.d)}</span></button>`;}
const nice=iso=>{try{return window.LectApp.longDate(iso);}catch(e){return iso;}};
function completeList(list){const order=['catholic','eastern-orthodox','oriental','anglican','lutheran','reformed','methodist'];const fam=r=>RITE_FAMILY[r.rite]||'catholic';
 return order.filter(f=>list.some(r=>fam(r)===f)).map(f=>`<h3 class="san-wip-fam">${esc(FAMILY_NAME[f])}</h3><ul class="san-wip san-complete">${list.filter(r=>fam(r)===f).map(r=>`<li><button class="san-wip-open" data-launch="${esc(r.type+'|'+r.rite+'|'+(r.hour||''))}">${esc(r.name)}</button><p>${esc(r.kind+' · '+r.d)}</p></li>`).join('')}</ul>`).join('');}
function wip(){const all=rites(),guide=all.filter(r=>r.cov==='guide'),order=all.filter(r=>r.cov==='order');
 const row=r=>`<li><button class="san-wip-open" data-launch="${esc(r.type+'|'+r.rite+'|'+(r.hour||''))}">${esc(r.name)}</button> <span class="san-chip">${esc(r.covLabel)}</span><p>${esc(r.note)}</p></li>`;
 const none=catalog.filter(n=>!n.supported.length&&!catalog.some(c=>c.parent===n.id));
 const fams=[...new Set(none.map(n=>n.family))];
 return `<p class="san-eyebrow">Work in progress</p><h1>Not yet complete</h1><p class="san-lede">These rites can be prayed here, but part of their text still comes from your own book, because it is not yet on the site or is still under copyright. Each note says what is missing.</p>
 <section class="san-shelf"><h2>Guided text · ${guide.length}</h2><ul class="san-wip">${guide.map(row).join('')}</ul></section>
 <section class="san-shelf"><h2>Order and readings · ${order.length}</h2><ul class="san-wip">${order.map(row).join('')}</ul></section>
 <section class="san-shelf"><h2>Churches and books with no service yet · ${none.length}</h2>${fams.map(f=>`<h3 class="san-wip-fam">${esc(FAMILY_NAME[f]||f)}</h3><div class="san-grid">${none.filter(n=>n.family===f).map(n=>nodeTile(n)).join('')}</div>`).join('')}</section>`;}
const STUDY=[['compare','Compare the year','Dated readings across the calendars'],['lectionaries','Every lectionary','How the traditions arrange Scripture'],['hybrid','Hybrid proposal','Explore the proposed expanded traditional cycle'],['changes','1955 vs 1962','Compare the older Roman Holy Week and rubrics'],['office','Divine Office','Compare daily offices and their books'],['sources','Sources and coverage','Text coverage, provenance and edition limits']];
function study(){return `<p class="san-eyebrow">Study</p><h1>Study the liturgy</h1><p class="san-lede">Compare calendars, explore the books, and check the sources.</p><div class="san-grid">${STUDY.map(([id,title,desc])=>tile(id,title,desc,'anglican','','study')).join('')}</div>`;}
async function home(){
 if(!days){try{const r=await fetch('days.json');if(!r.ok)throw Error();days=await r.json();}catch(e){days={};}}
 const iso=today(),d=days[iso];
 const A=window.LectApp,all=rites(),fave=A.getFave?A.getFave():null;
 const filter=read('lect-today-filter',fave||'all');
 const names=d&&A.dayNames?A.dayNames(iso,d):[];
 const byRite=(type,id)=>all.find(r=>r.type===type&&r.rite===id);
 /* Each tradition's services for today, named as its own calendar names the day. */
 const TODAY={catholic:['n','m','o'],'eastern-orthodox':['b','byzv'],oriental:['copt','arm','adai'],anglican:['bcp62','bcp28','bcp79'],lutheran:['csb'],reformed:['rca','rcus','pres'],methodist:['wes84']};
 const famTiles=f=>{const out=[];
  TODAY[f].forEach(id=>{const r=byRite('mass',id);if(!r)return;const nm=names.find(x=>x.rite===id)||names.find(x=>x.fam===f&&f!=='catholic'&&f!=='oriental');
   out.push(riteTile(r,nm?nm.name:(f==='reformed'&&new Date(iso+'T12:00Z').getUTCDay()===0?'The Lord’s Day':r.kind)));});
  const off=A.defaultOffice?A.defaultOffice(f):null;if(off){const r=byRite(off.type,off.rite);if(r)out.push(riteTile({...r,hour:off.hour},'Pray the hour now · '+r.kind));}
  return out.join('');};
 const fams=A.FAMILIES||[];
 const shown=filter==='all'?[...fams.filter(f=>f[0]===fave),...fams.filter(f=>f[0]!==fave)]:fams.filter(f=>f[0]===filter);
 const chips=`<div class="san-filter" role="group" aria-label="Show traditions"><button data-tfilter="all" aria-pressed="${filter==='all'}">All</button>${fams.map(([id,n])=>`<button data-tfilter="${id}" aria-pressed="${filter===id}">${esc(n.replace(' and the Church of the East',''))}${id===fave?' ★':''}</button>`).join('')}</div>`;
 const todayShelf=`<section class="san-shelf san-today"><h2>Today · ${esc(nice(iso))}</h2>${chips}${d?shown.map(([id,n])=>`<h3 class="san-wip-fam">${esc(n)}</h3><div class="san-row" aria-label="${esc(n)}">${famTiles(id)}</div>`).join(''):'<p class="san-muted">This date is outside the calendar the site covers (30 November 2025 to 30 November 2030).</p>'}</section>`;
 return `<p class="san-eyebrow">A place to begin</p><h1>Sanctuary</h1><p class="san-lede">Explore traditions, find a book, and return to prayer.</p>`+
 shelf('Continue',recent.slice(0,8).map((r,i)=>tile(String(i),r.label,`${nice(r.iso)} · ${r.hour?hourName(r):kindOf(r)}`,r.family||RITE_FAMILY[r.rite]||'catholic',coverage(r),'resume')).join(''),'Your recent guides will appear here, stored only in this browser.')+
 todayShelf+(()=>{const full=rites().filter(r=>r.cov==='full');return `<section class="san-shelf"><h2>Complete texts · ${full.length}</h2><p class="san-muted">Every word of these services is printed here.</p>${completeList(full)}</section>`+shelf('Work in progress',tile('#/wip','Not yet complete',`${rites().filter(r=>r.cov!=='full').length} rites with text still to come, and the churches with no service yet`,'catholic','WIP'));})()+shelf('Traditions',catalog.filter(n=>!n.parent).map(n=>nodeTile(n)).join(''))+
 shelf('Study',tile('#/study','Study the liturgy','Calendars, lectionaries, comparisons and sources','anglican'))+
 shelf('Explore',tile('#/search','All churches and books','Search names, places, and editions','anglican'));
}
const CAL={gregorian:'Gregorian calendar',julian:'Julian calendar (Old Style)','revised-julian':'Revised Julian calendar for fixed feasts; Pascha by the Julian reckoning'};
const FAM_CAL={catholic:'Gregorian calendar in the Latin Church; the Eastern Catholic churches keep the Gregorian or the Julian calendar by local custom.','eastern-orthodox':'Fixed feasts by the Julian or the Revised Julian calendar, as each church keeps; Pascha by the Julian reckoning.',oriental:'Each church keeps its own calendar: the Coptic and Ethiopian calendars of the Martyrs, the Armenian, Syriac and East Syriac reckonings.','old-catholic':'Gregorian calendar.',anglican:'Gregorian calendar (the 1662 book and its predecessors were first printed for the Julian).',lutheran:'Gregorian calendar.',reformed:'Gregorian calendar; many Reformed churches keep only the Lord’s Day and a few evangelical feasts.',methodist:'Gregorian calendar.'};
/* A node without its own entry takes the calendar or books of the church above it. */
function calendarOf(n){for(let x=n;x;x=parentOf(x))if(x.calendar)return CAL[x.calendar]||x.calendar;return FAM_CAL[n.family]||'';}
const GENERIC=/consult the local ordo|does not compute|establishes affiliation|require local verification/i;
const noteOf=n=>GENERIC.test(n.calendar_note||'')?'':n.calendar_note;
function booksOf(n){for(let x=n;x;x=parentOf(x))if(x.books.length)return x.books;return [];}
const STATUS={'public-domain':'Public domain','open-licence':'Open licence',copyright:'In copyright'};
function detail(n){const children=catalog.filter(x=>x.parent===n.id),parent=parentOf(n);
 return `<p class="san-eyebrow">${esc(n.kind)}${parent?' · '+esc(parent.name):''}</p><div class="san-hero"><div>${emblem(n.family)}</div><section><h1>${esc(n.name)}</h1><p class="san-lede">${esc(n.self_description)}</p></section></div>
 <dl class="san-facts"><div><dt>Calendar</dt><dd>${esc(calendarOf(n))}${noteOf(n)?`<p>${esc(noteOf(n))}</p>`:''}</dd></div><div><dt>Lectionary</dt><dd>${esc(n.lectionary)}</dd></div>${booksOf(n).length?`<div><dt>Books</dt><dd>${booksOf(n).map(b=>`<p><a href="${esc(b.source)}" target="_blank" rel="noopener">${esc(b.title)}${b.year?' · '+b.year:''}</a> <span class="san-chip">${esc(STATUS[b.status]||b.status)}</span><small>${esc(b.rights_note)}</small></p>`).join('')}${n.books.length?'':`<p class="san-muted">The books of ${esc(parentOf(n)?.name||'this tradition')}.</p>`}</dd></div>`:''}</dl>
 ${children.length?shelf('Churches, uses and books',children.map(c=>nodeTile(c)).join('')):''}
 ${n.supported.length?shelf('Pray now',n.supported.map((s,i)=>tile(n.id+':'+i,s.label,`${s.type==='office'?hourName(s):kindOf(s)} · today`,n.family,coverage(s),'pray')).join('')):!children.length?`<section class="san-coming"><h2>Coming later</h2><p>No service guide is mapped to this entry yet.</p>${(()=>{const rel=rites().filter(r=>RITE_FAMILY[r.rite]===n.family);return rel.length?`<p>Meanwhile, the ${esc(FAMILY_NAME[n.family]||'')} books this site does print:</p><div class="san-row">${rel.slice(0,8).map(r=>riteTile(r)).join('')}</div>`:'';})()}<p>${esc(n.pd_texts_available.join(' · ')||'An edition with verified public-domain or open-licence texts, a sourced calendar and a lectionary would make a guide possible.')}</p></section>`:''}
 <details><summary>Sources and rights review</summary><p>${esc(n.source_review)}</p><ul>${n.sources.map(u=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join('')}</ul></details>`;
}
function results(q){const words=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);return catalog.filter(n=>words.every(w=>[n.name,...n.also_called,...n.regions,...n.books.map(b=>b.title)].join(' ').toLocaleLowerCase().includes(w)));}
function search(){return `<h1>All churches and books</h1><label for="san-query">Search names, alternative names, books or countries</label><input id="san-query" type="search" autocomplete="off" placeholder="Try 1928, Ruthenian, or Scotland"><p id="san-count" role="status"></p><div id="san-results" class="san-grid"></div>`;}
function updateSearch(q){const found=results(q);root.querySelector('#san-count').textContent=`${found.length} results`;root.querySelector('#san-results').innerHTML=found.map(n=>nodeTile(n)).join('')||'<p>No matches. Try another name or year.</p>';}
function menuHTML(){return `<h1>Sanctuary menu</h1><div class="san-settings"><button data-action="size">Text size · ${Math.round(prefs.size*100)}%</button><button data-action="theme">Theme · ${esc(prefs.theme)}</button><button data-action="sound">Sound · ${prefs.sound?'on':'off'}</button><button data-action="dismiss">Return to browsing</button><button data-action="exit">Switch to classic view</button></div>`;}
async function render(){
 if(!isRoute(location.hash)){leave();return;}
 const hash=location.hash;if(!open)enter();saveFocus();previousRoute=hash;
 const serial=++routeSerial;
 const atHome=hash==='#/sanctuary'&&!menu;
 const shell=body=>`<header class="san-toolbar">${atHome?'':'<button data-action="back" aria-label="Back">←<span class="san-long"> Back</span></button>'}<button data-route="#/sanctuary"${atHome?' aria-current="page"':''}>Sanctuary</button><button data-route="#/search" aria-label="Search">Search<span class="san-long"> /</span></button><button data-action="menu" aria-label="Open menu">Menu</button><button data-action="exit" aria-label="Switch to the classic view"><span class="san-long">Classic view</span><span class="san-short">Classic</span></button></header><main class="san-content">${body}</main><footer class="san-prompts" aria-live="polite">${glyphs[input]}</footer>`;
 root.innerHTML=shell('<p role="status">Opening the library…</p>');
 try{await load();if(serial!==routeSerial)return;let body;
  if(menu)body=menuHTML();else if(hash==='#/search')body=search();else if(hash==='#/study')body=study();else if(hash==='#/sanctuary')body=await home();else if(hash==='#/wip')body=wip();else {const bits=hash.slice(2).split('/');const n=catalog.find(x=>x.id===bits.at(-1));if(n&&bits.length<=3&&(bits.length===2||n.parent===bits[1]))body=detail(n);else body='<h1>Entry not found</h1><p>Use Search to find a church or book.</p>';}
  if(serial!==routeSerial)return;root.innerHTML=shell(body);applyPrefs();if(hash==='#/search'&&!menu)updateSearch('');
  const saved=focusByRoute.get(hash);const el=saved&&controls().find(e=>(e.dataset.route||e.dataset.pray||e.id||e.dataset.action)===saved);
  if(!saved)root.scrollTop=0;
  focus(el||root.querySelector('#san-query')||root.querySelector('.san-settings button')||(hash==='#/wip'?root.querySelector('.san-wip-open'):null)||(hash.startsWith('#/t/')?controls()[0]:root.querySelector('.san-tile'))||controls()[0]);
 }catch(e){if(serial!==routeSerial)return;root.innerHTML=shell('<h1>The library could not load</h1><p>Check your connection and try again.</p><button data-action="retry">Try again</button>');focus(root.querySelector('[data-action="retry"]'));}
}
function launch(s,label,family){if(!s)return;guideReturn=location.hash;saveFocus();const session={...s,iso:s.iso||today(),label,family};recent=[session,...recent.filter(r=>!(r.rite===session.rite&&r.hour===session.hour&&r.iso===session.iso))].slice(0,8);write('lect-sanctuary-recent',recent);returnScroll=0;returnFocus=bar.querySelector('[data-bar="home"]');close('#today');document.getElementById('tab-today').click();window.LectApp.follow(session);}
root.addEventListener('click',e=>{const b=e.target.closest('[data-study]');if(!b)return;returnScroll=0;returnFocus=bar.querySelector('[data-bar="study"]');close('#'+b.dataset.study);document.getElementById('tab-'+b.dataset.study)?.click();});
root.addEventListener('click',e=>{const b=e.target.closest('[data-tfilter]');if(!b)return;e.stopPropagation();const f=b.dataset.tfilter;write('lect-today-filter',f);if(f!=='all'&&window.LectApp?.setFave)window.LectApp.setFave(f);focusByRoute.set('#/sanctuary','');render().then(()=>focus(root.querySelector(`[data-tfilter="${f}"]`)));},true);
root.addEventListener('input',e=>{if(e.target.id==='san-query')updateSearch(e.target.value);});
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sound();if(b.dataset.route)go(b.dataset.route);else if(b.dataset.pray){const [id,i]=b.dataset.pray.split(':');const n=catalog.find(n=>n.id===id);launch(n.supported[+i],n.name+' · '+n.supported[+i].label,n.family);}else if(b.dataset.resume!==undefined){const r=recent[+b.dataset.resume];launch(r,r.label,r.family);}else if(b.dataset.launch){const [type,rite,hour]=b.dataset.launch.split('|');const r=rites().find(x=>x.type===type&&x.rite===rite);launch({type,rite,hour:hour||null},r?r.name:rite,RITE_FAMILY[rite]||'catholic');}else switch(b.dataset.action){case'back':back();break;case'exit':setHome('classic');close();break;case'menu':menu=true;render();break;case'dismiss':menu=false;render();break;case'size':prefs.size=prefs.size>=1.2?1:Math.round((prefs.size+.1)*10)/10;render();break;case'theme':prefs.theme=prefs.theme==='night'?'vellum':'night';render();break;case'sound':prefs.sound=!prefs.sound;render();break;case'retry':render();break;}});
root.addEventListener('pointerdown',e=>activeInput(e.pointerType==='touch'?'touch':'mouse'));
document.getElementById('enter-sanctuary').addEventListener('pointerdown',e=>activeInput(e.pointerType==='touch'?'touch':'mouse'));
document.getElementById('enter-sanctuary').addEventListener('click',e=>{if(e.detail===0)activeInput('keyboard');setHome('sanctuary');returnHash=location.hash||'#today';go('#/sanctuary');});
window.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||(e.repeat&&e.key.toLowerCase()==='s'))return;
 const edit=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
 if(!open){if(!edit&&e.key.toLowerCase()==='s'){e.preventDefault();activeInput('keyboard');returnHash=location.hash||'#today';go('#/sanctuary');return;}
  if(!edit&&guideActive()){
   if(e.key.startsWith('Arrow')){e.preventDefault();activeInput('keyboard');guideMove(e.key.slice(5).toLowerCase());}
   else if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();go(guideReturn);}
   else if(e.key==='/'){e.preventDefault();go('#/search');}
  }return;}
 activeInput('keyboard');
 if(edit){if(e.target.id==='san-query'&&e.key==='ArrowDown'){e.preventDefault();focus(root.querySelector('#san-results button'));return;}if(e.key==='Escape'){e.preventDefault();back();}return;}
 if(e.key==='s'||e.key==='S'){e.preventDefault();close();}else if(e.key==='/'||e.key==='y'){e.preventDefault();go('#/search');}
 else if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back();}
 else if(e.key.startsWith('Arrow')){e.preventDefault();move(e.key.slice(5).toLowerCase());}
 else if(e.key==='Enter'&&e.target===root){e.preventDefault();controls()[0]?.click();}
 else if(e.key==='Tab'){const list=controls(),i=list.indexOf(document.activeElement);if((e.shiftKey&&i<=0)||(!e.shiftKey&&i===list.length-1)){e.preventDefault();focus(e.shiftKey?list.at(-1):list[0]);}}
});
function startPolling(){if(!gameFrame&&(open||homePref==='sanctuary'))gameFrame=requestAnimationFrame(pollGamepad);}
function pollGamepad(now){gameFrame=0;let pads=[];try{pads=navigator.getGamepads?.()||[];}catch(e){}const pad=[...pads].find(p=>p&&p.connected!==false);let action='';if(pad){const pressed=i=>pad.buttons[i]?.pressed;
 action=pressed(0)?'select':pressed(1)?'back':pressed(3)?'search':pressed(9)?'menu':pressed(12)||pad.axes[1]<-.55?'up':pressed(13)||pad.axes[1]>.55?'down':pressed(14)||pad.axes[0]<-.55?'left':pressed(15)||pad.axes[0]>.55?'right':'';
 if(action&&(open||guideActive())){activeInput('gamepad');const directional=['up','down','left','right'].includes(action);if(action!==lastGameAction||(directional&&now>=gameRepeatAt)){const changed=action!==lastGameAction;gameRepeatAt=now+(changed?360:140);if(directional){if(open)move(action);else guideMove(action);}else if(action==='select')document.activeElement?.click();else if(action==='back'){if(open)back();else go(guideReturn);}else if(action==='search')go('#/search');else {menu=!menu;if(open)render();else go('#/sanctuary');}}}}
 lastGameAction=action;startPolling();
}
window.addEventListener('lect-session',e=>{const s=e.detail;if(!s?.rite)return;const known=catalog?.find(n=>n.supported.some(v=>v.type===s.type&&v.rite===s.rite));const session={...s,label:known?.name||s.label||s.rite,family:known?.family||'catholic'};recent=[session,...recent.filter(r=>!(r.rite===session.rite&&r.hour===session.hour&&r.iso===session.iso))].slice(0,8);write('lect-sanctuary-recent',recent);});
window.addEventListener('hashchange',e=>{if(isRoute(location.hash)&&!open){try{const old=new URL(e.oldURL).hash;if(!isRoute(old))returnHash=old||'#today';}catch(err){}}render();});
window.LectSanctuary={open:()=>go('#/sanctuary'),close};
bar.addEventListener('click',e=>{const b=e.target.closest('[data-bar]');if(!b)return;const a=b.dataset.bar;
 if(a==='classic'){setHome('classic');return;}returnHash=location.hash||'#today';go(a==='search'?'#/search':a==='study'?'#/study':'#/sanctuary');});
document.querySelector('.wrap')?.prepend(bar);applySkin();
/* The page script may already have written #today; the address the visitor actually opened decides. */
const openedHash=(()=>{try{return new URL(performance.getEntriesByType('navigation')[0]?.name||location.href).hash;}catch(e){return location.hash;}})();
if(homePref==='sanctuary'&&(!openedHash||openedHash==='#')&&!isRoute(location.hash)){returnHash=location.hash||'#today';history.replaceState(null,'','#/sanctuary');}
if(isRoute(location.hash))render();
window.LectSanctuary.setHome=setHome;
startPolling();
})();
