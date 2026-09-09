// service-worker.js — alleen offline-cache van de eigen bestanden.
// Geen push, geen achtergrondsynchronisatie, geen netwerkverzoek naar
// buiten (v1.0 §11.4, nul netwerkverzoeken).

const CACHE_NAAM = "life-maxing-v11";
// Alle modules staan erbij: "volledig offline" mag niet afhangen van de vraag
// of de eerste lading toevallig alles heeft opgehaald. v7: lib/meer.js
// (S16/S17/S18) ontbrak sinds de meer-menu-bouw (v12) — nooit toegevoegd
// aan deze lijst, dus nooit voorgecached — en de twee zelfgehoste
// font-bestanden zijn nieuw. v8: lib/visie.js (De Visie) toegevoegd. v9:
// Kompas-uitleg, schermovergang en duidelijkere knoppen (style.css/app.ts).
const BESTANDEN = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./main.js",
  "./app.js",
  "./lib/canvas.js",
  "./lib/db.js",
  "./lib/dom.js",
  "./lib/maandbrief.js",
  "./lib/meer.js",
  "./lib/nu.js",
  "./lib/ritme.js",
  "./lib/selection.js",
  "./lib/sterrenbeeld.js",
  "./lib/visie.js",
  "./lib/weekmoment.js",
  "./lib/types.js",
  "./data/adhkar.js",
  "./data/bewegingen.js",
  "./data/kwaliteiten.js",
  "./data/selectie.js",
  "./data/teksten.js",
  "./data/themas.js",
  "./data/woorden.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./fonts/InstrumentSerif-Regular.woff2",
  "./fonts/HankenGrotesk-Regular.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(BESTANDEN)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE_NAAM).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((match) => {
      if (match) return match;
      return fetch(event.request)
        .then((response) => {
          const kopie = response.clone();
          caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
          return response;
        })
        // "as Response" (TypeScript-syntax) stond hier in een bestand dat
        // ongecompileerd rechtstreeks als JavaScript wordt geserveerd —
        // een SyntaxError bij het parsen van de service worker, dus de
        // registratie faalde stil. `match` kan hier `undefined` zijn (geen
        // eerdere cache-hit én de fetch faalde); dat geeft een afgewezen
        // fetch-promise, precies zoals zonder deze catch, zonder de foutieve
        // syntax.
        .catch(() => match);
    })
  );
});
