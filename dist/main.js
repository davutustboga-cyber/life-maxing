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
    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const uitNa = rustig ? 550 : 1550;
    const wegNa = rustig ? 850 : 1950;
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
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(() => {
            // best effort — de app werkt ook zonder offline-cache, alleen dan
            // niet zonder netwerk bij een herbezoek
        });
    });
}
