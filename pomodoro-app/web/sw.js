const CACHE_NAME = 'pomodoro-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles.css',
  './src/timer.js',
  './src/tasks.js',
  './src/stats.js',
  './src/storage.js',
  './src/renderer.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
