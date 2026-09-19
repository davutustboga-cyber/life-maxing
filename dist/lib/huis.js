// huis.ts — het huis als voortgang (Life Maxi 2.0, herzien in v29).
//
// De buitenkant van het huis is voor iedereen hetzelfde en verandert nooit. De
// voortgang zit BINNEN: elke kamer krijgt voorwerpen die bij zijn doel horen
// (een kaars en een zitbank in Adem & rust, een gebedsmat en een boekenkast in
// Geloof, ...) naarmate er iets gebeurt dat in die kamer thuishoort. Wat dit
// bewust NIET is:
//
//  - geen punten, geen niveaus, geen balken: er wordt nooit een getal getoond
//    (Wet 4); de app zegt hooguit "in Adem & rust staat nu een kaars";
//  - geen verval en geen dagelijkse verplichting: een kamer wordt nooit leger,
//    wie een maand niets doet komt terug in hetzelfde huis;
//  - een plafond: als alle voorwerpen staan is de kamer ingericht. Daarna groeit
//    alleen wat van jou is (je laatste zin die in de kamer hangt);
//  - Motivatie heeft geen voorwerpen om te verdienen: die kamer is vanaf het begin
//    ingericht, er voor als je hem nodig hebt.
//
// Wat telt: elke afgeronde handeling is een ster in de kamer waar hij thuishoort
// (zie kamerVanSter). Dat zijn de bestaande gegevens; er komt geen scorebestand
// bij. Bij Mijn visie telt niet het aantal keren maar wat je zelf neerlegt: elk
// deel van je visie is één voorwerp, en elk maar één keer.
//
// Bron van de waarheid blijven de sterren (`data.sterren`) en de eigen
// onderdelen van de visie; er komt geen nieuw scorebestand bij.
import { kamerVanBeweging } from "../data/kamers.js";
import { themas } from "../data/themas.js";
import { bewegingById } from "../data/bewegingen.js";
export const MAX_TRAP = 4;
/**
 * Zoveel afgeronde handelingen in een kamer vraagt het n-de voorwerp. De eerste
 * staat er meteen; daarna wordt het rustiger, en de grote voorwerpen komen na 6,
 * 15 en 36 handelingen. Nooit getoond.
 */
const OBJECT_DREMPELS = [1, 3, 6, 10, 15, 21, 28, 36];
/** Hoeveel voorwerpen elke kamer heeft. Motivatie staat er niet bij: altijd ingericht. */
export const KAMER_OBJECTEN = { adem: 8, lichaam: 8, mensen: 8, geloof: 8, visie: 5 };
/** Wat er staat, in de volgorde waarin het erbij komt. Alleen gebruikt in gewone zinnen. */
export const OBJECT_NAMEN = {
    adem: ["een kaars", "een meditatiekussen", "een zitbank", "een plant", "een zacht kleed", "een waterschaal", "een hanglamp", "gordijnen met een lichtsnoer"],
    lichaam: ["een yogamat", "een waterfles", "een klimrek", "gewichten", "wandelschoenen en een rugzak", "een bank", "een poster van de bergen", "een fiets"],
    mensen: ["een foto aan de muur", "een lichtsnoer", "een eettafel met stoelen", "een brief op tafel", "een rij lijstjes", "een bank", "kopjes thee", "een stoel voor een gast"],
    geloof: ["een gebedsmat", "een leestafeltje met een boek", "een boekenkast", "een lantaarn", "een wandpaneel met een geometrisch patroon", "een nis met licht", "een gebedsketting", "een geometrisch rooster voor het raam"],
    visie: ["je visie, ingelijst", "een wereldbol", "een spiegel", "een telescoop", "een schrift op je bureau"],
};
/** De kamers die inrichting kunnen krijgen (Motivatie niet, zie boven). */
export const INGERICHTE_KAMERS = ["visie", "adem", "geloof", "lichaam", "mensen"];
const STREEK_NAAR_KAMER = {
    lichaam: "lichaam",
    geest: "adem",
    verbinding: "mensen",
    ziel: "geloof",
};
/**
 * In welke kamer hoort een ster thuis? Eerst via de beweging (nieuwe sterren
 * hebben `bewegingId`; oudere sterren uit de kompaslus via hun moment), daarna
 * via de streek. Met de islamitische laag uit valt "ziel" terug op Adem & rust.
 */
export function kamerVanSter(ster, data) {
    const islamAan = data.instellingen.islamitischeLaag;
    const bewegingId = ster.bewegingId ??
        (ster.momentId ? data.momenten.find((m) => m.id === ster.momentId)?.gekozenDeur : undefined) ??
        undefined;
    if (bewegingId && bewegingId !== "niets-doen") {
        const b = bewegingById(bewegingId);
        const islamitisch = Boolean(b?.herkomst.some((h) => h.label === "I"));
        const kamer = kamerVanBeweging(bewegingId, themas, islamitisch);
        if (kamer && (kamer.id !== "geloof" || islamAan))
            return kamer.id;
    }
    const uitStreek = STREEK_NAAR_KAMER[ster.streek] ?? "adem";
    return uitStreek === "geloof" && !islamAan ? "adem" : uitStreek;
}
/**
 * Mijn visie krijgt zijn voorwerpen niet van sterren maar van wat je er zelf
 * neerlegt: je visie, je doel, je zin, je verlangen, de spiegel van de week. Elk
 * deel is één voorwerp, in deze vaste volgorde; elk maar één keer, dus het huis
 * wacht niet op herhaling.
 */
function visieDelen(data) {
    return [
        Boolean(data.visie && [data.visie.wieIkBen, data.visie.watIkHeb, data.visie.waarIkSta].some((t) => t.trim())),
        Boolean(data.doel),
        Boolean(data.wieIkWord),
        Boolean(data.verlangenVanDePeriode),
        (data.weekmomenten ?? []).length > 0,
    ];
}
/**
 * Per kamer welke voorwerpen er staan (waar/onwaar, in vaste volgorde). Dit is
 * de bron voor het tekenen van de kamer. Motivatie is altijd ingericht.
 */
export function objectenAan(data) {
    const aantal = {};
    for (const ster of data.sterren ?? []) {
        const k = kamerVanSter(ster, data);
        aantal[k] = (aantal[k] ?? 0) + 1;
    }
    const uit = {};
    for (const k of INGERICHTE_KAMERS) {
        if (k === "visie") {
            uit[k] = visieDelen(data);
        }
        else {
            const n = OBJECT_DREMPELS.filter((d) => (aantal[k] ?? 0) >= d).length;
            uit[k] = Array.from({ length: KAMER_OBJECTEN[k] }, (_, i) => i < n);
        }
    }
    uit.motivatie = Array.from({ length: 6 }, () => true);
    return uit;
}
/** Hoeveel voorwerpen er in elke kamer staan. Alleen om te vergelijken met de vorige keer. */
export function objectAantallen(data) {
    const uit = {};
    for (const [k, aan] of Object.entries(objectenAan(data)))
        if (k !== "motivatie")
            uit[k] = aan.filter(Boolean).length;
    return uit;
}
/** Per kamer hoe ver hij is ingericht (0–4). Voor de lamp boven de deur en de zin op de kamer. */
export function trappen(data) {
    const uit = {};
    for (const [k, n] of Object.entries(objectAantallen(data)))
        uit[k] = Math.min(MAX_TRAP, Math.ceil((MAX_TRAP * n) / KAMER_OBJECTEN[k]));
    return uit;
}
/** Eén zin per trap. Kwalitatief; nooit een getal. */
export function trapZin(trap) {
    switch (trap) {
        case 0:
            return "Hier is het nog stil.";
        case 1:
            return "Er brandt licht.";
        case 2:
            return "Er staat iets neer.";
        case 3:
            return "Het begint een plek te worden.";
        default:
            return "Ingericht.";
    }
}
/** De melding als er iets is bijgekomen, in gewone taal: wat er staat, en waar. */
export function nieuwObjectZin(kamer, kamerNaam, nummer) {
    const naam = OBJECT_NAMEN[kamer]?.[nummer];
    return naam ? `In ${kamerNaam} staat nu ${naam}.` : `In ${kamerNaam} is iets bijgekomen.`;
}
/**
 * Welke kamers hebben meer voorwerpen dan de laatste keer dat je ze zag? `nummer`
 * is het nieuwste voorwerp. De eerste keer (of na een update, `huisGezien ===
 * null`) wordt alles stil vastgelegd: een bestaand bestand hoeft niet in één
 * keer vijf meldingen te krijgen over wat er al was.
 */
export function nieuweObjecten(data) {
    if (!data.huisGezien)
        return [];
    const nu = objectAantallen(data);
    const aan = objectenAan(data);
    const uit = [];
    for (const k of INGERICHTE_KAMERS) {
        const gezien = data.huisGezien[k] ?? 0;
        if ((nu[k] ?? 0) <= gezien)
            continue;
        // Het nieuwste voorwerp: bij Mijn visie het eerste dat er nu is en er nog niet was.
        const nummer = k === "visie" ? aan[k].findIndex((v, i) => v && i >= gezien) : nu[k] - 1;
        uit.push({ kamer: k, nummer: Math.max(0, nummer) });
    }
    return uit;
}
export function markeerHuisGezien(data) {
    data.huisGezien = objectAantallen(data);
}
/** De laatste zin die je schreef bij iets uit deze kamer — jouw eigen woorden, op de muur. */
export function laatsteZinInKamer(data, kamer) {
    const eigen = (data.sterren ?? [])
        .filter((s) => s.zin?.trim() && kamerVanSter(s, data) === kamer)
        .sort((a, b) => (a.datum ?? "").localeCompare(b.datum ?? ""));
    const laatste = eigen[eigen.length - 1];
    return laatste ? { datum: laatste.datum, zin: laatste.zin.trim() } : null;
}
