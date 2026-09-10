import { startApp } from "./app.js";
/**
 * De openingsanimatie (index.html, `#intro`) — eenmalig per verse sessie,
 * nooit opnieuw bij een gewone herlaad binnen dezelfde tab. `sessionStorage`
 * i.p.v. een teller in het bestand zelf: dit is geen gebruiksgegeven (Wet
 * 4), puur een UI-vlag die met de tab verdwijnt.
 */
function toonIntro() {
    const el = document.getElementById("intro");
    if (!el)
        return;
    const SLEUTEL = "life-maxing-intro-getoond";
    let al_getoond = true;
    try {
        al_getoond = sessionStorage.getItem(SLEUTEL) === "1";
        if (!al_getoond)
            sessionStorage.setItem(SLEUTEL, "1");
    }
    catch {
        // privénavigatie o.i.d. — dan toont de intro gewoon elke keer, geen harde afhankelijkheid
        al_getoond = false;
    }
    if (al_getoond) {
        el.remove();
        return;
    }
    // v25 — stond eerst op 1550ms (voelde te snel voorbij), toen op 5000ms
    // (voelde net te lang). 3500ms blijft "pakken" zonder te lang te duren.
    // Reduced motion blijft bewust korter (geen animatie om naar te kijken,
    // dan is langer wachten alleen maar een wachttijd).
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const uitNa = rustig ? 900 : 3500;
    const wegNa = rustig ? 1200 : 4050;
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
        if (herladenAlBezig)
            return;
        herladenAlBezig = true;
        window.location.reload();
    });
    let registratie = null;
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
        if (document.visibilityState === "visible")
            registratie?.update().catch(() => { });
    });
    window.addEventListener("pageshow", () => {
        registratie?.update().catch(() => { });
    });
}
