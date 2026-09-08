import { startApp } from "./app.js";
void startApp();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {
            // best effort — de app werkt ook zonder offline-cache, alleen dan
            // niet zonder netwerk bij een herbezoek
        });
    });
}
