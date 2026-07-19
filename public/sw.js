// public/sw.js
// Service Worker sederhana buat Fresqa.
// Fungsinya: nyimpen file statis (JS, CSS, icon) di cache browser,
// biar pas dibuka lagi (terutama di HP lewat "Add to Home Screen")
// loadingnya lebih cepat dan tetap bisa buka app walau internet lemot.
//
// CATATAN: karena data produk/order Fresqa selalu ambil langsung dari
// Supabase (butuh koneksi internet), app ini BUKAN full "offline app".
// Yang di-cache cuma tampilan/asset-nya, bukan data.

const CACHE_NAME = "fresqa-cache-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Cuma tangani request GET biasa (bukan ke API Supabase / POST)
  if (request.method !== "GET" || request.url.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Kalau berhasil ambil dari internet, simpan salinan terbaru ke cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Kalau internet lagi nggak ada, coba ambil dari cache
        return caches.match(request);
      })
  );
});
