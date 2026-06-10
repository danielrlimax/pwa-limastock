const CACHE_NAME = "limastock-pwa-v1";

const STATIC_CACHE_URLS = [
  "/",
  "/login",
  "/dashboard",
  "/scanner",
  "/produtos",
  "/estoque",
  "/vendas",
  "/configuracoes",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS).catch(() => undefined);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/api")) {
    return;
  }

  if (url.hostname.includes("onrender.com")) {
    return;
  }

  if (url.pathname.startsWith("/_next")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((networkResponse) => {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });

            return networkResponse;
          })
        );
      })
    );

    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.match("/offline");
      })
  );
});