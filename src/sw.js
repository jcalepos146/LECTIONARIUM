/* Lectionarium offline support. assemble.py writes this file to the site root as sw.js, filling in the version,
   the core files and the list of data files "Save for offline use" downloads.

   The core (the page, its service code, the icons, this year's calendar) is cached when the worker installs.
   Everything else is fetched from the network first, so a new deploy is seen at once, and kept in the data cache
   so that it still opens without a connection: a service, a Bible book or an Office pack once opened is available
   offline afterwards. "Save for offline use" fetches the whole list ahead of time. */
const VERSION = /*VERSION*/"dev";
const CORE = /*CORE*/[];
const SAVE = /*SAVE*/[];
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
