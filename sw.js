/* sw.js — offline shell + notification plumbing.
   NETWORK-FIRST: always try the live server, fall back to cache
   when offline. This keeps the installed phone in sync with the
   repo instead of serving stale code forever. */

const CACHE = "osp-shell-v3";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/timewords.js",
  "./js/store.js",
  "./js/unlock.js",
  "./js/overlays.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

/* Tapping a masked notification opens the app — which locks it,
   which demands a reason. The loop closes. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return clients.openWindow("./");
    })
  );
});
