/* 오늘의 숙제 - 서비스워커
   앱을 홈 화면에 설치할 수 있게 해주고, 오프라인일 때도 마지막으로 받은 화면을 보여줌.
   버전을 올리면(예: v2) 예전 캐시를 지우고 최신 파일을 다시 받아옴. */
const CACHE_VERSION = "today-homework-v1";
const APP_SHELL = [
  "오늘의숙제.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* 온라인이면 최신 파일을 받아오고(그리고 캐시 갱신), 오프라인이면 캐시된 화면을 보여줌 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("오늘의숙제.html")))
  );
});
