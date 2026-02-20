const CACHE_NAME = "ht-cache-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/",
  "/protected",
  "/protected/transcribe",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Install — precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — network-first for API/dynamic, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API requests
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // For navigation requests, try network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // For static assets, cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});

// Handle share target POSTs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.pathname === "/protected/transcribe"
  ) {
    event.respondWith(Response.redirect("/protected/transcribe?shared=1", 303));
    event.waitUntil(
      (async () => {
        const data = await event.request.formData();
        const files = data.getAll("audio");
        const client = await self.clients.get(event.resultingClientId);
        if (client && files.length > 0) {
          // Post the file to the client
          client.postMessage({
            type: "share-target",
            files: files,
          });
        }
      })()
    );
  }
});
