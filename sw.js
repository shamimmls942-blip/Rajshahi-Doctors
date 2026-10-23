// অফলাইন + অটো-আপডেট। নেট থাকলে সবসময় নতুন ভার্সন; না থাকলে ক্যাশ।
const CACHE = "rajshahi-v7";
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
    );
    return;
  }
  if (u.origin !== self.location.origin) return;
  const fromCache = () =>
    caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./") : undefined));
  const net = fetch(req, { cache: "no-store" }).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
    return res;
  });
  // পেজ (navigate) এ ১৫ সেকেন্ড পর্যন্ত নতুন ভার্সনের জন্য অপেক্ষা; অন্য ফাইলে ৮ সেকেন্ড
  const wait = req.mode === "navigate" ? 4000 : 6000;
  const slow = new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), wait));
  e.respondWith(
    Promise.race([net, slow]).catch(() =>
      fromCache().then((r) => r || net.catch(() => Response.error()))
    )
  );
});
