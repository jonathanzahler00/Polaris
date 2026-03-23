const CACHE_NAME = "polaris-v4";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: precache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch: network-first for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API routes: network only (don't cache dynamic data)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Static assets (images, fonts, css, js): cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return new Response("", { status: 408 });
        }
      })()
    );
    return;
  }

  // Pages: network-first with offline fallback
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Show offline page for navigation requests
        if (request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        return new Response("Offline", { status: 503 });
      }
    })()
  );
});

// Push notifications (e.g. daily reminder from cron)
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Polaris";
  const body = data.body || "Set your daily focus before the day takes over.";
  const url = data.url || "/?alarm=true";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      vibrate: [100, 50, 100],
      tag: "polaris-daily-reminder",
      requireInteraction: true,
      data: { url },
    })
  );
});

// Notification click - Open with alarm modal
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/?alarm=true";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

      // Find an existing app window, focus it, then navigate to the target URL
      for (const client of allClients) {
        if (!client.url.startsWith(self.location.origin)) continue;
        if ("focus" in client) await client.focus();
        if ("navigate" in client) await client.navigate(url);
        return;
      }

      // No existing window — open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});

