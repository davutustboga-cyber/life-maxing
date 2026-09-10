// service-worker.js — netwerk-eerst voor de app zelf.
//
// v12 — de kern van dit bestand is omgedraaid. Tot v11 was alles
// "cache-eerst": elk bestand kwam uit de cache zodra het er ooit in stond,
// en alleen een nieuwe CACHE_NAAM (met de hand opgehoogd bij elke deploy)
// verving die cache. Dat werkte niet — meerdere design-rondes kwamen nooit
// zichtbaar aan omdat de cache-naam niet bij elke wijziging werd opgehoogd,
// en zelfs mét een ophoging duurde het tot een tweede herlaad voor de
// gebruiker het verschil zag. Nu: alleen de bestanden die per ontwerp nooit
// veranderen zonder ook van bestandsnaam te wisselen (fonts, iconen,
// manifest) blijven cache-eerst. Alles wat wél verandert bij elke
// design/code-wijziging (index.html, style.css, elke .js-module) is nu
// netwerk-eerst: met verbinding krijg je altijd de nieuwste versie, zonder
// verbinding val je terug op wat al gecachet is. Nul netwerkverzoeken naar
// buiten blijft staan (v1.0 §11.4) — dit is en blijft alleen verkeer met de
// eigen server.

const CACHE_NAAM = "life-maxing-shell-v1";

const STABIELE_PADEN = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/fonts/InstrumentSerif-Regular.woff2",
  "/fonts/HankenGrotesk-Regular.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAAM)
      .then((cache) => cache.addAll(STABIELE_PADEN.map((p) => "." + p)))
      .catch(() => {})
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
  const url = new URL(event.request.url);
  const isStabiel = STABIELE_PADEN.some((pad) => url.pathname.endsWith(pad));

  if (isStabiel) {
    // Cache-eerst: deze bestanden veranderen nooit zonder ook hun eigen pad
    // te veranderen, dus stale-cache is hier geen risico.
    event.respondWith(caches.match(event.request).then((match) => match || fetch(event.request)));
    return;
  }

  // Netwerk-eerst voor de rest van de app. Elke lading met verbinding haalt
  // de nieuwste versie op en legt die meteen in de cache; alleen zonder
  // verbinding (of een falende fetch) valt dit terug op wat er al lag.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const kopie = response.clone();
        caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
