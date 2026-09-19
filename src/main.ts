import { startApp } from "./app.js";

/**
 * De openingsanimatie (index.html, `#intro`) — eenmalig per verse sessie,
 * nooit opnieuw bij een gewone herlaad binnen dezelfde tab. `sessionStorage`
 * i.p.v. een teller in het bestand zelf: dit is geen gebruiksgegeven (Wet
 * 4), puur een UI-vlag die met de tab verdwijnt.
 */
function toonIntro(): void {
  const el = document.getElementById("intro");
  if (!el) return;

  // v27 (W8) — de intro duurde 3,5 s bij elke verse sessie en dus meerdere
  // keren per dag; in een app waarvan de eerste wet "houd het kort" is, was
  // dat de langste wachttijd die de app kende. Nu alleen de eerste keer per
  // dag, en korter. Een UI-vlag met de datum, geen gebruiksgegeven (Wet 4).
  const SLEUTEL = "life-maxing-intro-dag";
  const vandaag = new Date().toISOString().slice(0, 10);
  let alGetoond = false;
  try {
    alGetoond = localStorage.getItem(SLEUTEL) === vandaag;
    if (!alGetoond) localStorage.setItem(SLEUTEL, vandaag);
  } catch {
    // privénavigatie o.i.d. — dan toont de intro gewoon, geen harde afhankelijkheid
    alGetoond = false;
  }

  if (alGetoond) {
    el.remove();
    return;
  }

  // Reduced motion blijft bewust korter (geen animatie om naar te kijken).
  const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const uitNa = rustig ? 600 : 1500;
  const wegNa = rustig ? 900 : 2050;
  setTimeout(() => el.classList.add("intro--uit"), uitNa);
  setTimeout(() => el.remove(), wegNa);
}

toonIntro();
void startApp();

if ("serviceWorker" in navigator) {
  // Zodra een nieuwe service worker het overneemt (een nieuwe deploy die
  // skipWaiting + clients.claim gebruikt, zie service-worker.js), is de
  // huidige pagina nog opgebouwd uit de oude bestanden. Eén stille herlaad
  // hierop, in plaats van dat je zelf de cache moet legen of de app opnieuw
  // moet installeren om een wijziging te zien.
  let herladenAlBezig = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (herladenAlBezig) return;
    herladenAlBezig = true;
    window.location.reload();
  });

  let registratie: ServiceWorkerRegistration | null = null;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        registratie = reg;
      })
      .catch(() => {
        // best effort — de app werkt ook zonder offline-cache, alleen dan
        // niet zonder netwerk bij een herbezoek
      });
  });

  // Als thuisschermapp geeft iOS een heropend, geschorst tabblad terug in
  // plaats van een echte nieuwe paginalading — "load" hierboven vuurt dan
  // niet opnieuw, en zonder deze aanroep controleert Safari zelf soms
  // dagenlang niet of er een nieuwe service-worker.js klaarstaat. Elke keer
  // dat het scherm weer zichtbaar wordt, dwingen we die controle zelf af.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") registratie?.update().catch(() => {});
  });
  window.addEventListener("pageshow", () => {
    registratie?.update().catch(() => {});
  });
}
