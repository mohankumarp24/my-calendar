const CACHE_PREFIX = "psgim-calendar-";
const CACHE_NAME = CACHE_PREFIX + "v4";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// Only clear this app's old caches. The timetable lives on the same
// github.io origin, so deleting every other cache would wipe its offline copy.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the page so updates land immediately when online;
// falls back to the cached copy offline. Icons/manifest stay cache-first.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isHTML = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then(c => c || caches.match("./")))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
