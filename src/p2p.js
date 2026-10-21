/* ================================================================ PEER-TO-PEER LIVE SESSIONS
   For the public (GitHub Pages) build, where there is no shared store. The host's browser holds the
   session: it claims a PeerJS id made from the session code, and followers connect to it directly over
   WebRTC. This object answers the same small db / room interface the session tools use, so the tools
   run unchanged. PeerJS (MIT) is loaded only when someone hosts, joins or runs the check. */
(function(){
"use strict";
const PREFIX="lectionarium-v1-";
const PEERJS="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js";
const OPTS=()=>Object.assign({debug:0}, window.LECT_PEER_OPTS||{});   // e.g. a self-hosted PeerJS server
const fail=(code,msg)=>Object.assign(new Error(msg||code),{code});
let lib=null;
function load(){
  if(window.Peer) return Promise.resolve();
  return lib||(lib=new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=PEERJS; s.async=true;
    s.onload=()=>res(); s.onerror=()=>{ lib=null; rej(fail("unavailable","Could not load the connection library.")); }; document.head.appendChild(s); }));
}
const codeOf=path=>{ const m=/^live\/([a-z0-9]{4,12})$/.exec(String(path)); return m?m[1]:null; };
const snap=v=>({exists:v!=null, data:()=>v});

/* one network per session: the host's, or a follower's link to the host */
let NET=null;
function newNet(code, host){
  return {code, host, peer:null, conns:new Map(), link:null, doc:null, docL:new Set(), errL:new Set(),
          pres:new Map(), myPres:null, peerL:new Set(), myId:"", open:null, dead:false};
}
function kill(n){ if(!n||n.dead) return; n.dead=true; try{ n.peer&&n.peer.destroy(); }catch(e){} if(NET===n) NET=null; }
function send(c,m){ try{ if(c&&c.open) c.send(m); }catch(e){} }
function peersList(n){ return [...n.pres].map(([peer,presence])=>({peer, kind:"viewer", presence})); }
function notifyPeers(n, list){ n.lastPeers=list; const out={peers:list.map(p=>({...p, sameTab:p.peer===n.myId}))}; n.peerL.forEach(f=>{ try{ f(out); }catch(e){} }); }
function hostPeers(n){ const list=peersList(n); n.conns.forEach(c=>send(c,{t:"peers",v:list})); notifyPeers(n,list); }

function startHost(code){
  if(NET&&NET.code===code&&NET.host) return NET.open;
  kill(NET); const n=NET=newNet(code,true);
  n.open=load().then(()=>new Promise((res,rej)=>{
    const p=n.peer=new window.Peer(PREFIX+code,OPTS());
    p.on("open",id=>{ n.myId=id; if(n.myPres) n.pres.set(id,n.myPres); res(); });
    p.on("error",e=>{ const t=e&&e.type; if(!n.myId){ kill(n); rej(fail(t==="unavailable-id"?"already_exists":"unavailable","Could not start the session ("+(t||"error")+").")); } });
    p.on("disconnected",()=>{ if(!n.dead) try{ p.reconnect(); }catch(e){} });   // lost the signalling server; open links keep working
    p.on("connection",c=>{
      c.on("open",()=>{ n.conns.set(c.peer,c); send(c,{t:"doc",v:n.doc}); send(c,{t:"peers",v:peersList(n)}); });
      c.on("data",m=>{ if(!m||typeof m!=="object") return;
        if(m.t==="pres"&&m.v&&typeof m.v==="object"){ n.pres.set(c.peer,{role:String(m.v.role||"").slice(0,12), host:false, name:String(m.v.name||"").slice(0,40), ready:!!m.v.ready}); hostPeers(n); } });
      const gone=()=>{ if(n.conns.get(c.peer)===c){ n.conns.delete(c.peer); n.pres.delete(c.peer); hostPeers(n); } };
      c.on("close",gone); c.on("error",gone);
    });
  }));
  return n.open;
}
function startFollow(code){
  if(NET&&NET.code===code&&!NET.host) return NET;
  kill(NET); const n=NET=newNet(code,false);
  let settled=false;
  const lost=why=>{ if(n.dead) return; if(!settled){ settled=true; n.docL.forEach(f=>f(snap(null))); } else n.errL.forEach(f=>f(fail("unavailable",why))); };
  load().then(()=>{
    if(n.dead) return;
    const p=n.peer=new window.Peer(OPTS());
    p.on("open",id=>{ n.myId=id;
      const c=n.link=p.connect(PREFIX+code,{reliable:true});
      c.on("open",()=>{ if(n.myPres) send(c,{t:"pres",v:n.myPres}); });
      c.on("data",m=>{ if(!m||typeof m!=="object") return;
        if(m.t==="doc"){ settled=true; n.doc=m.v; n.docL.forEach(f=>f(snap(m.v))); }
        else if(m.t==="peers"&&Array.isArray(m.v)) notifyPeers(n,m.v.slice(0,200)); });
      c.on("close",()=>lost("The host's connection closed."));
      c.on("error",()=>lost("The connection to the host failed."));
    });
    p.on("error",e=>{ const t=e&&e.type; if(t==="peer-unavailable") lost("No session"); else lost("Connection error ("+(t||"error")+")."); });
    setTimeout(()=>{ if(!settled&&!n.dead) lost("Timed out"); },15000);
  }).catch(()=>{ n.errL.forEach(f=>f(fail("unavailable"))); n.docL.forEach(f=>f(snap(null))); });
  return n;
}

/* a quick test that the signalling server can be reached */
function probe(){ return load().then(()=>new Promise(res=>{ let done=false; const p=new window.Peer(OPTS());
  const end=v=>{ if(done) return; done=true; try{ p.destroy(); }catch(e){} res(v); };
  p.on("open",()=>end(true)); p.on("error",()=>end(false)); setTimeout(()=>end(false),6000); })).catch(()=>false); }

const db={
  doc(path){
    const code=codeOf(path);
    return {
      async get(){ if(!(await probe())) throw fail("unavailable","The connection server could not be reached."); return snap(null); },
      async set(body){
        if(!code) { if(!(await probe())) throw fail("unavailable"); return; }
        await startHost(code); const n=NET; n.doc=body; n.conns.forEach(c=>send(c,{t:"doc",v:body}));
      },
      async delete(){
        if(!code) return;
        const n=NET; if(!n||n.code!==code||!n.host) return;
        n.conns.forEach(c=>send(c,{t:"doc",v:null})); setTimeout(()=>kill(n),400);
      },
      onSnapshot(cb, err){
        if(!code){ cb(snap(null)); return ()=>{}; }
        const n=startFollow(code); n.docL.add(cb); if(err) n.errL.add(err);
        return ()=>{ n.docL.delete(cb); if(err) n.errL.delete(err); if(!n.docL.size) kill(n); };
      }
    };
  }
};
const room={
  async join(name){
    const code=String(name).replace(/^lect-/,""), n=NET&&NET.code===code?NET:null;
    let peerL=null;
    return {
      onPeers(cb){ if(!n) return ()=>{}; peerL=cb; n.peerL.add(cb); if(n.lastPeers) notifyPeers(n,n.lastPeers); else if(n.host&&n.myId) hostPeers(n); return ()=>n.peerL.delete(cb); },
      presence(obj){ if(!n||n.dead) return; n.myPres=obj;
        if(n.host){ if(n.myId){ n.pres.set(n.myId,{...obj,host:true}); hostPeers(n); } }
        else send(n.link,{t:"pres",v:obj}); },
      leave(){ if(n&&peerL) n.peerL.delete(peerL); if(n&&!n.host) kill(n); }
    };
  },
  onConnection(cb, err){ let off=false; probe().then(ok=>{ if(off) return; ok?cb(true):(err&&err()); }); return ()=>{ off=true; }; },
  connected(){ return false; }
};
window.LectP2P={
  use(name){ return name==="db"?Promise.resolve(db):name==="room"?Promise.resolve(room):Promise.reject(fail("unavailable")); },
  active:true
};
})();
