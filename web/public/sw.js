/* Service worker Nizhamiyyah Edu.
   - Aset build (/_next/static) dan gambar: disimpan, jadi aplikasi terbuka instan.
   - Halaman publik: ambil dari jaringan dulu, pakai salinan terakhir kalau offline.
   - Halaman pribadi (dashboard, admin, login, api) tidak pernah disimpan.
   - Tanpa jaringan dan tanpa salinan: tampilkan halaman /offline. */
const VERSION = "nz-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const IMAGE_CACHE = `${VERSION}-images`;

// Scope = basePath aplikasi (mis. "/web/"), jadi semua jalur dihitung dari sini.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const OFFLINE_URL = `${BASE}/offline`;
const PRECACHE = [OFFLINE_URL, `${BASE}/icon-192.png`, `${BASE}/icon-512.png`, `${BASE}/icon-maskable.svg`];
const PRIVATE = ["/dashboard", "/admin", "/api", "/masuk", "/dev"].map((p) => BASE + p);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

// Halaman meminta versi baru dipasang setelah user menekan "Muat ulang".
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isPrivate = (path) => PRIVATE.some((p) => path === p || path.startsWith(p + "/"));

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function pageRequest(event) {
  const { request } = event;
  const path = new URL(request.url).pathname;
  try {
    const preload = await event.preloadResponse;
    const res = preload || (await fetch(request));
    if (res.ok && !isPrivate(path) && !res.redirected) {
      const copy = res.clone();
      event.waitUntil(caches.open(PAGE_CACHE).then((c) => c.put(request, copy)).then(() => trim(PAGE_CACHE, 30)));
    }
    return res;
  } catch {
    if (!isPrivate(path)) {
      const cached = await caches.match(request, { ignoreSearch: false });
      if (cached) return cached;
    }
    return (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const copy = res.clone();
    caches.open(cacheName).then((c) => c.put(request, copy));
  }
  return res;
}

async function staleWhileRevalidate(event, cacheName) {
  const { request } = event;
  const cached = await caches.match(request);
  const network = fetch(request).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(cacheName).then((c) => c.put(request, copy)).then(() => trim(cacheName, 80));
    }
    return res;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // YouTube, Google, Mayar: biarkan browser.
  if (!url.pathname.startsWith(BASE + "/") && url.pathname !== BASE) return;

  if (request.mode === "navigate") {
    event.respondWith(pageRequest(event));
    return;
  }
  // Permintaan data React Server Components saat pindah halaman: selalu ke jaringan.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;
  if (isPrivate(url.pathname)) return;

  if (url.pathname.startsWith(`${BASE}/_next/static/`)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (request.destination === "image" || request.destination === "font" || url.pathname.startsWith(`${BASE}/_next/image`)) {
    event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE));
  }
});
