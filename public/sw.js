const CACHE = "dormpath-v3";
const PRECACHE = ["/", "/domi-loader.png", "/domi-app-icon.png", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest", "/domi.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE)),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    u.origin !== self.location.origin ||
    u.pathname.startsWith("/.netlify/")
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
    return;
  }
  if (
    u.pathname.startsWith("/assets/") ||
    ["/domi.png", "/domi-loader.png", "/domi-app-icon.png", "/icon-192.png", "/icon-512.png"].includes(u.pathname)
  )
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(event.request, copy));
            }
            return res;
          }),
      ),
    );
});
