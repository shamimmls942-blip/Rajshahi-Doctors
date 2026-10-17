// অফলাইন + অটো-আপডেট: আগে নেট থেকে নতুন ভার্সন, না পেলে (অফলাইন/ধীর নেট) সংরক্ষিত কপি।
const CACHE = "rajshahi-v3";
const PRE = ["./", "manifest.json", "icon-192.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRE.map((u) => c.add(u).catch(() => {}))))
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
  if (new URL(req.url).origin !== self.location.origin) return; // Firebase ইত্যাদিতে হাত দেবে না
  const fromCache = () =>
    caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("./") : undefined));
  const net = fetch(req, { cache: "no-store" }).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
    return res;
  });
  const slow = new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 4000));
  e.respondWith(
    Promise.race([net, slow]).catch(() =>
      fromCache().then((r) => r || net.catch(() => Response.error()))
    )
  );
});
