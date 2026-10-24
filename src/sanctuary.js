/* Sanctuary is a lazy catalog and input layer; service rendering stays in LectApp. */
(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch(e){return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
let catalog,loading,days,open=false,returnHash='#today',returnScroll=0,returnFocus,routeSerial=0,input='keyboard',menu=false;
let focusByRoute=new Map(),previousRoute='',gameFrame=0,lastGameAction='',gameRepeatAt=0,audio;
let prefs=read('lect-sanctuary-prefs',{size:1,theme:'night',sound:false});
/* The Sanctuary is the default view. "Classic view" is the economical page; the choice is remembered. While the
   Sanctuary is the home view, the classic page (where the guides are drawn) wears the Sanctuary's skin. */
let homePref=read('lect-home','sanctuary')==='classic'?'classic':'sanctuary';
let recent=read('lect-sanctuary-recent',[]);if(!Array.isArray(recent))recent=[];
const root=document.createElement('section');root.id='sanctuary';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Sanctuary mode');document.body.append(root);
const isRoute=h=>/^#\/(sanctuary|t(?:\/|$)|search(?:\/|$))/.test(h);
returnHash=isRoute(location.hash)?'#today':location.hash||'#today';
const glyphs={keyboard:'↑ ↓ ← → Move · Enter Select · Esc Back · / Search · S Exit',gamepad:'✚ / Left stick Move · A Select · B Back · Y Search · Start Menu',touch:'Tap a tile to explore · Back to return',mouse:'Click a tile to explore · Back to return'};
function prompts(){const p=root.querySelector('.san-prompts');if(p)p.textContent=glyphs[input];}
function activeInput(value){if(input!==value){input=value;prompts();}}
function applyPrefs(){root.dataset.theme=prefs.theme;root.style.setProperty('--san-scale',String(prefs.size));write('lect-sanctuary-prefs',prefs);applySkin();}
const bar=document.createElement('div');bar.id='san-bar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Sanctuary');
bar.innerHTML='<button type="button" data-bar="home">← Sanctuary</button><button type="button" data-bar="search">Search</button><button type="button" data-bar="classic">Classic view</button>';
function applySkin(){const on=homePref==='sanctuary',r=document.documentElement;
 if(on){r.dataset.skin='sanctuary';r.dataset.skinTheme=prefs.theme;r.dataset.theme=prefs.theme==='vellum'?'light':'dark';}
 else{delete r.dataset.skin;delete r.dataset.skinTheme;delete r.dataset.theme;}
 bar.hidden=!on;const b=document.getElementById('enter-sanctuary');if(b)b.innerHTML=on?'Sanctuary <kbd>S</kbd>':'Sanctuary view <kbd>S</kbd>';}
function setHome(v){homePref=v==='classic'?'classic':'sanctuary';write('lect-home',homePref);applySkin();}
function sound(){if(!prefs.sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=380;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.07);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.07);}catch(e){}}
// Original geometric Christian symbols, never church insignia.
const marks={catholic:'☧','eastern-orthodox':'✚',oriental:'✣','old-catholic':'⚓',anglican:'✥',lutheran:'✝',reformed:'☷',methodist:'✙'};
let artSerial=0;
function emblem(f){const pattern="san-art-"+(++artSerial);return `<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false"><defs><pattern id="${pattern}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(${f.length*3})"><path d="M0 12h24M12 0v24" fill="none" stroke="currentColor" opacity=".12"/></pattern></defs><rect width="320" height="180" fill="url(#${pattern})"/><circle cx="160" cy="90" r="57" fill="none" stroke="currentColor"/><circle cx="160" cy="90" r="50" fill="none" stroke="currentColor" opacity=".5"/>${f==='reformed'?'<path d="M120 65 Q140 55 160 65 Q180 55 200 65 V118 Q180 108 160 118 Q140 108 120 118 Z M160 65 V118 M129 76 L151 76 M169 76 L191 76 M129 86 L151 86 M169 86 L191 86" fill="none" stroke="currentColor" stroke-width="3"/>':`<text x="160" y="112" font-family="serif" font-size="64" text-anchor="middle" fill="currentColor">${marks[f]||'✝'}</text>`}</svg>`;}
function coverage(s){return window.LectApp.coverage(s.type,s.rite,s.hour);}
function tile(id,title,subtitle='',family='catholic',chip='',action='route'){
 return `<button class="san-tile" data-${action}="${esc(id)}"><span class="san-art">${emblem(family)}${chip?`<span class="san-chip">${esc(chip)}</span>`:''}</span><span class="san-tile-title">${esc(title)}</span>${subtitle?`<span class="san-subtitle">${esc(subtitle)}</span>`:''}</button>`;
}
function nodeTile(n,subtitle){return tile('#/t/'+n.id,n.name,subtitle??n.kind,n.family,n.supported.length?'Guides available':'Explore');}
function shelf(title,tiles,empty=''){return `<section class="san-shelf"><h2>${esc(title)}</h2>${tiles?`<div class="san-row" aria-label="${esc(title)}">${tiles}</div>`:`<p class="san-muted">${esc(empty)}</p>`}</section>`;}
function parentOf(n){return n&&n.parent?catalog.find(x=>x.id===n.parent):null;}
function go(hash){if(location.hash===hash)render();else location.hash=hash;}
function back(){if(menu){menu=false;render();return;}const bits=location.hash.slice(2).split('/');if(bits[0]==='t'){const n=catalog?.find(x=>x.id===bits.at(-1));const parent=parentOf(n);go(parent?'#/t/'+parent.id:'#/sanctuary');}else if(bits[0]==='search')go('#/sanctuary');else close();}
function close(hash=returnHash){go(isRoute(hash)?'#today':hash||'#today');}
function enter(){if(open)return;open=true;returnFocus=document.activeElement;returnScroll=window.scrollY;document.querySelector('.wrap').inert=true;document.body.classList.add('san-open');root.hidden=false;applyPrefs();gameFrame=requestAnimationFrame(pollGamepad);}
function leave(){if(!open)return;open=false;++routeSerial;root.hidden=true;document.querySelector('.wrap').inert=false;document.body.classList.remove('san-open');cancelAnimationFrame(gameFrame);menu=false;requestAnimationFrame(()=>{window.scrollTo(0,returnScroll);returnFocus?.focus({preventScroll:true});});}
function saveFocus(){const el=document.activeElement;if(root.contains(el))focusByRoute.set(previousRoute,el.dataset.route||el.dataset.pray||el.id||el.dataset.action);}
function focus(el){if(!el)return;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
function controls(){return [...root.querySelectorAll('button:not([disabled]),input,a[href],select,summary')].filter(e=>e.getClientRects().length);}
function move(direction){const list=controls(),cur=document.activeElement;if(!list.length)return;if(!list.includes(cur)){focus(list[0]);return;}
 const row=cur.closest('.san-row');if(row&&(direction==='left'||direction==='right')){const siblings=[...row.querySelectorAll('button')];const i=siblings.indexOf(cur);focus(siblings[(i+(direction==='left'?-1:1)+siblings.length)%siblings.length]);sound();return;}
 const a=cur.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;
 const scored=list.filter(e=>e!==cur).map(el=>{const b=el.getBoundingClientRect(),dx=b.x+b.width/2-ax,dy=b.y+b.height/2-ay;const forward=direction==='down'?dy:direction==='up'?-dy:direction==='right'?dx:-dx;const side=Math.abs(direction==='down'||direction==='up'?dx:dy);return {el,forward,score:forward+side*2};}).filter(x=>x.forward>4).sort((a,b)=>a.score-b.score);
 focus(scored[0]?.el||list[(list.indexOf(cur)+(direction==='up'||direction==='left'?-1:1)+list.length)%list.length]);sound();}
async function load(){if(catalog)return;if(!loading)loading=fetch('data/traditions.json').then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();}).then(j=>{catalog=j;}).catch(e=>{loading=null;throw e;});return loading;}
async function home(){
 if(!days){try{const r=await fetch('days.json');if(!r.ok)throw Error();days=await r.json();}catch(e){days={};}}
 const iso=today(),d=days[iso];
 const dayTiles=['roman-modern','divine-worship','roman-1962','roman-pre55','hybrid-proposal','catholic-ruthenian'].map(id=>catalog.find(n=>n.id===id)).filter(Boolean).map(n=>{const rite=n.supported[0].rite;const v=d?.[rite];const label=typeof v==='string'?v:Array.isArray(v)?v.filter(x=>typeof x==='string').join(' · '):v?.name||v?.title||v?.t||'';return nodeTile(n,label|| (d?'Open the guide for today’s readings':'Date outside the supported calendar'));}).join('');
 return `<p class="san-eyebrow">A place to begin</p><h1>Sanctuary</h1><p class="san-lede">Explore traditions, find a book, and return to prayer.</p>`+
 shelf('Continue',recent.slice(0,8).map((r,i)=>tile(String(i),r.label,`${r.iso} · ${r.hour||'Mass'}`,r.family||'catholic',coverage(r),'resume')).join(''),'Your recent guides will appear here, stored only in this browser.')+
 shelf('Today · '+iso,dayTiles)+shelf('Traditions',catalog.filter(n=>!n.parent).map(n=>nodeTile(n)).join(''))+
 shelf('Explore',tile('#/search','All churches and books','Search names, places, and editions','anglican'));
}
function detail(n){const children=catalog.filter(x=>x.parent===n.id),parent=parentOf(n);
 return `<p class="san-eyebrow">${esc(n.kind)}${parent?' · '+esc(parent.name):''}</p><div class="san-hero"><div>${emblem(n.family)}</div><section><h1>${esc(n.name)}</h1><p class="san-lede">${esc(n.self_description)}</p></section></div>
 <dl class="san-facts"><div><dt>Calendar</dt><dd>${esc(n.calendar||'Varies by locality')}<p>${esc(n.calendar_note)}</p></dd></div><div><dt>Lectionary</dt><dd>${esc(n.lectionary)}</dd></div><div><dt>Books</dt><dd>${n.books.length?n.books.map(b=>`<p><a href="${esc(b.source)}" target="_blank" rel="noopener">${esc(b.title)}${b.year?' · '+b.year:''}</a> <span class="san-chip">${esc(b.status)}</span><small>${esc(b.rights_note)}</small></p>`).join(''):'See the sources for local books; no edition asserted here.'}</dd></div></dl>
 ${children.length?shelf('Churches, uses and books',children.map(c=>nodeTile(c)).join('')):''}
 ${n.supported.length?shelf('Pray now',n.supported.map((s,i)=>tile(n.id+':'+i,s.label,`${s.type==='office'?s.hour:'Mass'} · ${today()}`,n.family,coverage(s),'pray')).join('')):!children.length?`<section class="san-coming"><h2>Coming later</h2><p>No service guide is mapped to this entry yet.</p><p>${esc(n.pd_texts_available.join(' · ')||'An edition with verified public-domain or open-licence texts, a sourced calendar and a lectionary would make a guide possible.')}</p></section>`:''}
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
 const shell=body=>`<header class="san-toolbar"><button data-action="back" aria-label="Back">← Back</button><button data-route="#/sanctuary">Sanctuary</button><button data-route="#/search" aria-label="Search">Search /</button><button data-action="menu" aria-label="Open menu">Menu</button><button data-action="exit" aria-label="Switch to the classic view">Classic view</button></header><main class="san-content">${body}</main><footer class="san-prompts" aria-live="polite">${glyphs[input]}</footer>`;
 root.innerHTML=shell('<p role="status">Opening the library…</p>');
 try{await load();if(serial!==routeSerial)return;let body;
  if(menu)body=menuHTML();else if(hash==='#/search')body=search();else if(hash==='#/sanctuary')body=await home();else {const bits=hash.slice(2).split('/');const n=catalog.find(x=>x.id===bits.at(-1));if(n&&bits.length<=3&&(bits.length===2||n.parent===bits[1]))body=detail(n);else body='<h1>Entry not found</h1><p>Use Search to find a church or book.</p>';}
  if(serial!==routeSerial)return;root.innerHTML=shell(body);applyPrefs();if(hash==='#/search'&&!menu)updateSearch('');
  const saved=focusByRoute.get(hash);const el=saved&&controls().find(e=>(e.dataset.route||e.dataset.pray||e.id||e.dataset.action)===saved);
  if(!saved)root.scrollTop=0;
  focus(el||root.querySelector('#san-query')||root.querySelector('.san-settings button')||(hash.startsWith('#/t/')?controls()[0]:root.querySelector('.san-tile'))||controls()[0]);
 }catch(e){if(serial!==routeSerial)return;root.innerHTML=shell('<h1>The library could not load</h1><p>Check your connection and try again.</p><button data-action="retry">Try again</button>');focus(root.querySelector('[data-action="retry"]'));}
}
function launch(s,label,family){if(!s)return;const session={...s,iso:s.iso||today(),label,family};recent=[session,...recent.filter(r=>!(r.rite===session.rite&&r.hour===session.hour&&r.iso===session.iso))].slice(0,8);write('lect-sanctuary-recent',recent);returnScroll=0;returnFocus=document.getElementById('tab-today');close('#today');document.getElementById('tab-today').click();window.LectApp.follow(session);}
root.addEventListener('input',e=>{if(e.target.id==='san-query')updateSearch(e.target.value);});
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sound();if(b.dataset.route)go(b.dataset.route);else if(b.dataset.pray){const [id,i]=b.dataset.pray.split(':');const n=catalog.find(n=>n.id===id);launch(n.supported[+i],n.name+' · '+n.supported[+i].label,n.family);}else if(b.dataset.resume!==undefined){const r=recent[+b.dataset.resume];launch(r,r.label,r.family);}else switch(b.dataset.action){case'back':back();break;case'exit':setHome('classic');close();break;case'menu':menu=true;render();break;case'dismiss':menu=false;render();break;case'size':prefs.size=prefs.size>=1.2?1:Math.round((prefs.size+.1)*10)/10;render();break;case'theme':prefs.theme=prefs.theme==='night'?'vellum':'night';render();break;case'sound':prefs.sound=!prefs.sound;render();break;case'retry':render();break;}});
root.addEventListener('pointerdown',e=>activeInput(e.pointerType==='touch'?'touch':'mouse'));
document.getElementById('enter-sanctuary').addEventListener('pointerdown',e=>activeInput(e.pointerType==='touch'?'touch':'mouse'));
document.getElementById('enter-sanctuary').addEventListener('click',e=>{if(e.detail===0)activeInput('keyboard');setHome('sanctuary');returnHash=location.hash||'#today';go('#/sanctuary');});
window.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||(e.repeat&&e.key.toLowerCase()==='s'))return;
 const edit=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
 if(!open){if(!edit&&e.key.toLowerCase()==='s'){e.preventDefault();activeInput('keyboard');returnHash=location.hash||'#today';go('#/sanctuary');}return;}
 activeInput('keyboard');
 if(edit){if(e.target.id==='san-query'&&e.key==='ArrowDown'){e.preventDefault();focus(root.querySelector('#san-results button'));return;}if(e.key==='Escape'){e.preventDefault();back();}return;}
 if(e.key==='s'||e.key==='S'){e.preventDefault();close();}else if(e.key==='/'||e.key==='y'){e.preventDefault();go('#/search');}
 else if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back();}
 else if(e.key.startsWith('Arrow')){e.preventDefault();move(e.key.slice(5).toLowerCase());}
 else if(e.key==='Enter'&&e.target===root){e.preventDefault();controls()[0]?.click();}
 else if(e.key==='Tab'){const list=controls(),i=list.indexOf(document.activeElement);if((e.shiftKey&&i<=0)||(!e.shiftKey&&i===list.length-1)){e.preventDefault();focus(e.shiftKey?list.at(-1):list[0]);}}
});
function pollGamepad(now){if(!open)return;let pads=[];try{pads=navigator.getGamepads?.()||[];}catch(e){}const pad=[...pads].find(p=>p&&p.connected!==false);let action='';if(pad){const pressed=i=>pad.buttons[i]?.pressed;
 action=pressed(0)?'select':pressed(1)?'back':pressed(3)?'search':pressed(9)?'menu':pressed(12)||pad.axes[1]<-.55?'up':pressed(13)||pad.axes[1]>.55?'down':pressed(14)||pad.axes[0]<-.55?'left':pressed(15)||pad.axes[0]>.55?'right':'';
 if(action){activeInput('gamepad');const directional=['up','down','left','right'].includes(action);if(action!==lastGameAction||(directional&&now>=gameRepeatAt)){const changed=action!==lastGameAction;gameRepeatAt=now+(changed?360:140);if(directional)move(action);else if(action==='select')document.activeElement?.click();else if(action==='back')back();else if(action==='search')go('#/search');else {menu=!menu;render();}}}}
 lastGameAction=action;gameFrame=requestAnimationFrame(pollGamepad);
}
window.addEventListener('lect-session',e=>{const s=e.detail;if(!s?.rite)return;const known=catalog?.find(n=>n.supported.some(v=>v.type===s.type&&v.rite===s.rite));const session={...s,label:known?.name||s.label||s.rite,family:known?.family||'catholic'};recent=[session,...recent.filter(r=>!(r.rite===session.rite&&r.hour===session.hour&&r.iso===session.iso))].slice(0,8);write('lect-sanctuary-recent',recent);});
window.addEventListener('hashchange',e=>{if(isRoute(location.hash)&&!open){try{const old=new URL(e.oldURL).hash;if(!isRoute(old))returnHash=old||'#today';}catch(err){}}render();});
window.LectSanctuary={open:()=>go('#/sanctuary'),close};
bar.addEventListener('click',e=>{const b=e.target.closest('[data-bar]');if(!b)return;const a=b.dataset.bar;
 if(a==='classic'){setHome('classic');return;}returnHash=location.hash||'#today';go(a==='search'?'#/search':'#/sanctuary');});
document.querySelector('.wrap')?.prepend(bar);applySkin();
/* The page script may already have written #today; the address the visitor actually opened decides. */
const openedHash=(()=>{try{return new URL(performance.getEntriesByType('navigation')[0]?.name||location.href).hash;}catch(e){return location.hash;}})();
if(homePref==='sanctuary'&&(!openedHash||openedHash==='#')&&!isRoute(location.hash)){returnHash=location.hash||'#today';history.replaceState(null,'','#/sanctuary');}
if(isRoute(location.hash))render();
window.LectSanctuary.setHome=setHome;
})();
