import { startApp } from "./app.js";
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
