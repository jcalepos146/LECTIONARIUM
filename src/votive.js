/* ================================================================ VOTIVE MASSES
   A Mass for an occasion in place of the Mass of the day: a coronation, a funeral, a feast of Our Lady, the nation,
   peace, the sick. window.LectVotive lists the votive Masses a rite has and names them; mass.js builds them
   (buildTrad for the 1962, pre-1955 and hybrid Missals from data/votive-trad.json, buildPB79 for the 1979 Prayer
   Book's Various Occasions from data/bcp1979-occasions.json and the collects in data/bcp1979.json). The choice is
   part of the session (opts.votive), so a live session's followers get it with the rest of the host's settings,
   and it is never stored: a new day opens on the Mass of the day. */
window.LectVotive=(()=>{
"use strict";
const RITES={m:"trad",p:"trad",h:"trad",bcp79:"pb79"};
const cache={};
const J=u=>cache[u]||(cache[u]=fetch(u).then(r=>{ if(!r.ok) throw new Error(u); return r.json(); }).catch(e=>{ delete cache[u]; throw e; }));
const title79=o=>o.collect.replace(/^\d+\.\s*/,"")+(o.form?` · ${o.form}`:"");
async function list(rite){
  const k=RITES[rite]; if(!k) return [];
  if(k==="trad"){ const V=await J("data/votive-trad.json"); return Object.entries(V.masses).map(([id,m])=>({id,name:m.en,la:m.la,use:m.use})); }
  const O=await J("data/bcp1979-occasions.json"), B=await J("data/bcp1979.json"), C=B.collects.c;
  return O.occasions.map(o=>{ const t=(C[o.collect]||{}).text||[]; const head=o.form&&t.find(x=>new RegExp("^"+o.form+"\\. ").test(x));
    return {id:o.id,name:title79(o)+(head?` (${head.replace(/^[IV]+\.\s*/,"")})`:""),use:o.lessons?"":"lessons from your Prayer Book"}; });
}
async function get(rite,id){ if(!id) return null; const L=await list(rite); return L.find(x=>x.id===id)||null; }
return {has:rite=>!!RITES[rite], list, get, data:J};
})();
