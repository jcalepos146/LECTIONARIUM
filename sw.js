/* Lectionarium offline support. assemble.py writes this file to the site root as sw.js, filling in the version,
   the core files and the list of data files "Save for offline use" downloads.

   The core (the page, its service code, the icons, this year's calendar) is cached when the worker installs.
   Everything else is fetched from the network first, so a new deploy is seen at once, and kept in the data cache
   so that it still opens without a connection: a service, a Bible book or an Office pack once opened is available
   offline afterwards. "Save for offline use" fetches the whole list ahead of time. */
const VERSION = /*VERSION*/"0b7d2679a3";
const CORE = /*CORE*/["./", "index.html", "service.js?v=85f4a5dc2e", "favicon.svg", "favicon-32.png", "apple-touch-icon.png"];
const SAVE = /*SAVE*/["bible/cv/s0.json", "bible/dr/s0.json", "bible/dr/s1.json", "bible/dr/s10.json", "bible/dr/s11.json", "bible/dr/s12.json", "bible/dr/s13.json", "bible/dr/s2.json", "bible/dr/s3.json", "bible/dr/s4.json", "bible/dr/s5.json", "bible/dr/s6.json", "bible/dr/s7.json", "bible/dr/s8.json", "bible/dr/s9.json", "bible/kj/s0.json", "bible/kj/s1.json", "bible/kj/s10.json", "bible/kj/s11.json", "bible/kj/s12.json", "bible/kj/s13.json", "bible/kj/s2.json", "bible/kj/s3.json", "bible/kj/s4.json", "bible/kj/s5.json", "bible/kj/s6.json", "bible/kj/s7.json", "bible/kj/s8.json", "bible/kj/s9.json", "data/ambrosian-1954.json", "data/bcp-hc.json", "data/bcp1549.json", "data/bcp1552.json", "data/bcp1559.json", "data/bcp1662.json", "data/bcp1784-psalter.json", "data/bcp1784.json", "data/bcp1928.json", "data/bcp1979-lectionary.json", "data/bcp1979.json", "data/byz-liturgy.json", "data/coptic-lectionary.json", "data/dayhours.json", "data/eastsyriac-1894.json", "data/lutheran-csb.json", "data/mercersburg.json", "data/monastic-build.json", "data/orders.json", "data/ordo-rites.json", "data/rca1882-lessons.json", "data/text-sources.json", "data/traditions.json", "days/2026.json", "days/2027.json", "days/2028.json", "days/2029.json", "days/2030.json", "bcp-office.json", "chant.json", "hymns.json", "ordo.json", "propers-1962.json", "propers-pre55.json"];
const SHELL = "lect-shell-" + VERSION, DATA = "lect-data";

self.addEventListener("install", e => {
  const y = Math.min(2030, Math.max(2026, new Date().getFullYear()));
  e.waitUntil(caches.open(SHELL).then(c => c.addAll([...CORE, `days/${y}.json`])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("lect-shell-") && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function fromNetwork(req, store) {
  const res = await fetch(req);
  if (res.ok && res.type === "basic") (await caches.open(store)).put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try { return await fromNetwork(req, DATA); }
  catch (err) {
    const hit = await caches.match(req, {ignoreSearch: req.mode === "navigate"});
    if (hit) return hit;
    if (req.mode === "navigate") { const page = await caches.match("index.html") || await caches.match("./"); if (page) return page; }
    throw err;
  }
}

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // the service code is versioned in its URL: once cached it never changes
  if (/\/service\.js$/.test(url.pathname) && url.search) {
    e.respondWith(caches.match(req).then(hit => hit || fromNetwork(req, SHELL)));
    return;
  }
  e.respondWith(networkFirst(req));
});

/* "Save for offline use": fetch every listed data file into the data cache, reporting progress on the port. */
self.addEventListener("message", e => {
  if (!e.data || e.data.type !== "save" || !e.ports[0]) return;
  const port = e.ports[0], cache = caches.open(DATA);
  let done = 0, failed = 0;
  e.waitUntil((async () => {
    const c = await cache, queue = SAVE.slice();
    const worker = async () => {
      while (queue.length) {
        const path = queue.shift();
        try { if (!(await c.match(path))) { const res = await fetch(path); if (!res.ok) throw new Error(res.status); await c.put(path, res); } }
        catch (err) { failed++; }
        done++; port.postMessage({done, failed, total: SAVE.length});
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    port.postMessage({done, failed, total: SAVE.length, finished: true});
  })());
});
