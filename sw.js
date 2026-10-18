// Álomház – az app maga offline is induljon. Az adatokat a Firebase saját gyorsítótára kezeli.
const CACHE = 'alomhaz-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'];
const CDN = ['www.gstatic.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const ours = u.origin === location.origin;
  const cdn = CDN.includes(u.hostname) && (u.hostname !== 'www.gstatic.com' || u.pathname.startsWith('/firebasejs/'));
  if (!ours && !cdn) return; // adatbázis- és belépési hívásokhoz nem nyúlunk
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(ours ? new Request(e.request.url, { cache: 'no-store', credentials: 'same-origin' }) : e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return ours ? (net.then(r => r || hit)) : (hit || net);
  }));
});
