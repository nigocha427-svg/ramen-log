// アプリ本体をキャッシュして、電波が弱い店内でも起動できるようにする
const CACHE = 'ramen-log-v5';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-180.png',
  'icon.svg',
  'mascot.svg',
  'face.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 店舗検索APIと地図タイルは常にネットワークから
  if (url.hostname === 'api.openpoiapi.com' || url.hostname === 'cyberjapandata.gsi.go.jp') return;
  // アプリ本体はネット優先・失敗したらキャッシュ（更新がすぐ反映されるように）
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
