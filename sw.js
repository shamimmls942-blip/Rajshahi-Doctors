// অফলাইন + অটো-আপডেট। নেট থাকলে সবসময় নতুন ভার্সন; না থাকলে ক্যাশ।
const CACHE = "rajshahi-v8";
const PRE = ["./", "manifest.json", "icon-192.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req)
            .then((r) => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; })
            .catch(() => hit || Response.error());
          return hit || net;
        })
      )
