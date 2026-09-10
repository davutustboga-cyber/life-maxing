// db.ts — "één bestand", zie datamodel.md §1. IndexedDB is hier alleen de
// runtime-container voor precies één document; er zijn geen losse tabellen.
import { leegBestand } from "./types.js";
const DB_NAAM = "life-maxing";
const STORE_NAAM = "bestand";
const DOC_KEY = "het-bestand";
const DB_VERSIE = 1;
function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAAM, DB_VERSIE);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAAM)) {
                db.createObjectStore(STORE_NAAM);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
export async function laadBestand() {
    try {
        const db = await openDb();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAAM, "readonly");
            const store = tx.objectStore(STORE_NAAM);
            const req = store.get(DOC_KEY);
            req.onsuccess = () => {
                resolve(req.result ?? leegBestand());
            };
            req.onerror = () => reject(req.error);
        });
    }
    catch {
        return leegBestand();
    }
}
export async function bewaarBestand(data) {
    try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAAM, "readwrite");
            const store = tx.objectStore(STORE_NAAM);
            const req = store.put(data, DOC_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
        return true;
    }
    catch {
        return false;
    }
}
export async function wisBestand() {
    try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAAM, "readwrite");
            const req = tx.objectStore(STORE_NAAM).delete(DOC_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    catch {
        /* best effort */
    }
}
/** Exporteert het huidige bestand als downloadbaar JSON-bestand. */
export function exporteerBestand(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const datum = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `life-maxing-${datum}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
/** Leest en valideert een geïmporteerd bestand minimaal. */
export function parseGeimporteerdBestand(tekst) {
    try {
        const data = JSON.parse(tekst);
        if (typeof data === "object" &&
            data !== null &&
            typeof data.versie === "string" &&
            Array.isArray(data.momenten) &&
            Array.isArray(data.sterren)) {
            // vul ontbrekende velden aan met de lege standaard, voor het geval
            // een ouder exportbestand een later toegevoegd veld mist
            return { ...leegBestand(), ...data };
        }
        return null;
    }
    catch {
        return null;
    }
}
