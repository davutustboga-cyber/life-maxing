// nu.ts — "wat past er nu?" — de motor achter het startscherm (v21, v27).
//
// Waarom dit bestaat: tot v20 opende de app op een lege schijf met de vraag
// "Waar ben je?" en moest je zélf weten wat je wilde doen en waar het stond.
// Alles zat achter één woordje "meer". Dat maakte een inhoudelijk rijke app
// onbruikbaar in het dagelijks leven. Vanaf v21 kiest de app zelf wat er op
// dít moment past, en zegt erbij waarom.
//
// v27 — "de voorraad groeit, het aanbod krimpt" (bouwplan v27, §3.3). Achter
// de schermen kent deze motor per dagdeel een hele voorraad kandidaten (de
// bewegingen die eerder nergens voorkwamen zitten er nu in), maar het
// startscherm toont er precies één. Welke, wordt deterministisch bepaald op
// de dag van het jaar: hij wisselt per dag, staat de hele dag stil en telt
// niets — hetzelfde principe als `visieFragment()` en
// `motivatiehoekVoorVandaag()`.
//
// Wat dit NIET doet, en bewust niet:
// - niets tellen, geen reeksen, geen "je hebt X dagen op rij..." (Wet 4);
// - nooit pushen: een suggestie is een aanbod, elk scherm eindigt buiten de
//   app (Wet 3), en "niets doen" blijft overal een geldig antwoord;
// - geen enkele suggestie op basis van gebedsregistratie — de app vraagt
//   nooit of je gebeden hebt (gebed-anker.md).
import { ochtendVandaagGedaan, avondVandaagGedaan, laatsteDagsluiting, dagVanJaar, huidigeDagSleutel } from "./ritme.js";
import { weekmomentBeschikbaar } from "./weekmoment.js";
import { ongelezenBrief } from "./maandbrief.js";
import { bewegingById } from "../data/bewegingen.js";
import { adhkar } from "../data/adhkar.js";
export function dagdeelVan(nu = new Date()) {
    const u = nu.getHours();
    if (u < 5)
        return "nacht";
    if (u < 8)
        return "vroege_ochtend";
    if (u < 12)
        return "ochtend";
    if (u < 17)
        return "middag";
    if (u < 21)
        return "avond";
    return "voor_slapen";
}
export function dagdeelGroep(dagdeel) {
    switch (dagdeel) {
        case "vroege_ochtend":
        case "ochtend":
            return "ochtend";
        case "voor_slapen":
            return "slapen";
        default:
            return dagdeel;
    }
}
export function begroeting(dagdeel) {
    switch (dagdeel) {
        case "nacht":
            return "Nog wakker";
        case "vroege_ochtend":
        case "ochtend":
            return "Goedemorgen";
        case "middag":
            return "Goedemiddag";
        case "avond":
            return "Goedenavond";
        case "voor_slapen":
            return "Bijna slapen";
    }
}
/** "woensdag 9 september" — gewone oriëntatie, geen data-analyse. */
export function datumregel(nu = new Date()) {
    return nu.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}
/** De slotstaat na een afgeronde handeling: wat er staat is klaar, en wanneer
 * de app weer iets te bieden heeft. Geen vraag, geen volgende kaart. */
export function slotRegels(groep) {
    switch (groep) {
        case "ochtend":
            return { dit: "Dat was het voor vanmorgen.", straks: "Tot vanmiddag." };
        case "middag":
            return { dit: "Dat was het voor vanmiddag.", straks: "Tot vanavond." };
        case "avond":
            return { dit: "Dat was het voor vanavond.", straks: null };
        case "slapen":
            return { dit: "Dat was het voor vandaag.", straks: "Slaap goed." };
        case "nacht":
            return { dit: "Het is laat.", straks: null };
    }
}
/** De sleutel waarmee `gedaanVandaag` een suggestie herkent. */
export function suggestieSleutel(s) {
    return `${s.soort}:${s.id ?? ""}`;
}
function duurVan(bewegingId) {
    const b = bewegingById(bewegingId);
    if (!b)
        return "";
    const [van, tot] = b.kosten.tijdMinuten;
    return van === tot ? `${van} min` : `${van}–${tot} min`;
}
/**
 * Alle bewegingen die je ooit deed: die uit de kompaslus (`gekozenDeur`) en
 * die uit de hoofdweg (`ster.bewegingId`). Alleen om één regel te kunnen
 * tonen onder een kaart — het bestand telt hier niets op.
 */
function eerderGedaan(data) {
    const ids = new Set();
    for (const m of data.momenten ?? [])
        if (m.gekozenDeur && m.gekozenDeur !== "niets-doen")
            ids.add(m.gekozenDeur);
    for (const s of data.sterren ?? [])
        if (s.bewegingId)
            ids.add(s.bewegingId);
    return ids;
}
function bewegingSuggestie(id, waaromNu, gedaan) {
    const b = bewegingById(id);
    if (!b)
        return null;
    return { soort: "beweging", id, titel: b.titel, duur: duurVan(id), waaromNu, nieuw: gedaan.size > 0 && !gedaan.has(id) };
}
function dhikrSuggestie(id) {
    const d = adhkar.find((a) => a.id === id);
    if (!d)
        return null;
    return { soort: "dhikr", id, titel: d.titel, duur: "1–2 min", waaromNu: d.waaromNu };
}
/**
 * Een voorraad kandidaten, deterministisch gedraaid op de dag van het jaar:
 * vandaag staat er één vooraan, morgen een andere. De rest volgt in vaste
 * volgorde — die dient alleen voor "toch nog iets doen".
 */
function draaiOpDag(pool, nu) {
    const lijst = pool.filter((s) => s !== null);
    if (lijst.length === 0)
        return lijst;
    const start = dagVanJaar(nu) % lijst.length;
    return [...lijst.slice(start), ...lijst.slice(0, start)];
}
/**
 * Alles wat je vandaag al deed, als sleutels (`soort:id`). Twee bronnen: wat
 * het startscherm zelf als gedaan vastlegde (`gedaanVandaag`) én de sterren van
 * vandaag, want een oefening die je vanuit een kamer deed telt evengoed. Alleen
 * om te weten wat je niet nog eens hoeft voor te stellen; niets wordt geteld.
 */
function gedaanVandaagSleutels(data, nu) {
    const sleutels = new Set();
    const dag = huidigeDagSleutel(nu);
    const record = data.gedaanVandaag;
    if (record && record.datum === dag)
        for (const i of record.items)
            sleutels.add(i.sleutel);
    for (const ster of data.sterren ?? []) {
        if (ster.datum !== dag)
            continue;
        const id = ster.bewegingId ?? (ster.momentId ? data.momenten.find((m) => m.id === ster.momentId)?.gekozenDeur : undefined);
        if (id && id !== "niets-doen")
            sleutels.add(`beweging:${id}`);
    }
    if (ochtendVandaagGedaan(data, nu))
        sleutels.add("ochtend:");
    if (avondVandaagGedaan(data, nu))
        sleutels.add("avond:");
    return sleutels;
}
/** Deed je dit vandaag al? Sleutel is `soort:id`, zoals `suggestieSleutel`. */
export function alVandaagGedaan(data, sleutel, nu = new Date()) {
    return gedaanVandaagSleutels(data, nu).has(sleutel);
}
/** Wat telt als "vandaag al buiten geweest, of licht gezien": één van deze is genoeg. */
const BUITEN_IDS = [
    "ochtendlicht-zien",
    "vijf-minuten-naar-buiten",
    "tien-minuten-wandelen-groen",
    "wandelen-met-een-vraag",
    "lopen-met-dhikr",
];
/** Hooguit zoveel extra's achter elkaar, en alleen op verzoek. */
const MAX_EXTRA = 2;
/**
 * Het aanbod voor dit moment. Rekening houdend met het uur, wat je vandaag al
 * deed (dan komt het niet nog eens), wat je gisteravond zelf aanvinkte, en hoe
 * ver je bent in het dagdeel. Elk dagdeel kiest wat er op dít moment het meest
 * toe doet, en houdt het klein:
 *
 *  ochtend  daglicht zien (het stevigst onderzochte wat een ochtend kan doen),
 *           dan je richting voor de dag; een glas water komt als klein extraatje.
 *  middag   geen tweede ochtendroutine: naar buiten als dat nog niet gebeurd is,
 *           anders even stilstaan bij hoe het gaat, en een kleine pauze.
 *  avond    de dag rustig sluiten; na half acht komt het scherm zachter erbij.
 *  slapen   vertragen: de dag kort sluiten, of ademen / Ayat al-Kursi als dat al
 *           gebeurd is. Niets erbij dat nog moet.
 *  nacht    niets, alleen de opmerking dat slapen nu het beste is.
 *
 * `metGedaan` laat wat je vandaag al deed weer meedoen. Dat wil alleen wie een
 * voorstel zoekt zonder uit te sluiten dat het al gebeurde ("geen idee" in de
 * gevoelscheck).
 */
export function dagAanbod(data, nu = new Date(), metGedaan = false) {
    const dagdeel = dagdeelVan(nu);
    if (dagdeel === "nacht") {
        // Bouwplan v27, §4: "Nacht — de app biedt niets aan." Alleen de opmerking;
        // de bewegingen blijven onder Doen bereikbaar.
        return {
            rust: {
                soort: "rust",
                titel: "Het is laat",
                duur: "",
                waaromNu: "Slapen is nu waarschijnlijk het beste wat er is. De app loopt niet weg.",
            },
            kern: [],
            extra: [],
        };
    }
    const groep = dagdeelGroep(dagdeel);
    const islam = data.instellingen.islamitischeLaag;
    const eerder = eerderGedaan(data);
    const gedaan = gedaanVandaagSleutels(data, nu);
    const heeft = (soort, id = "") => gedaan.has(`${soort}:${id}`);
    const beweging = (id, waarom) => bewegingSuggestie(id, waarom, eerder);
    const buiten = BUITEN_IDS.some((id) => heeft("beweging", id));
    const chips = new Set(laatsteDagsluiting(data, nu)?.chips ?? []);
    const uur = nu.getHours() + nu.getMinutes() / 60;
    const gisterenNietBuiten = chips.has("niet_buiten_geweest") || chips.has("niet_bewogen");
    let kern = [];
    let vooraan = []; // eerste extra's, in vaste volgorde
    let pool = []; // daarna, per dag gedraaid
    switch (groep) {
        case "ochtend": {
            const richtingGedaan = heeft("ochtend");
            const licht = beweging("ochtendlicht-zien", chips.has("slecht_geslapen")
                ? "Je sloot gisteren af met slecht geslapen. Daglicht vroeg op de dag kan je ritme weer op zijn plek helpen — één minuut voor het raam is al goed."
                : uur >= 10
                    ? "Ook later op de ochtend doet daglicht je ritme goed, buiten of voor een raam. Eén minuut is genoeg."
                    : "Dit kan een fijne manier zijn om je ochtend te beginnen: even daglicht zien, buiten of voor een raam. De telefoon mag nog even wachten.");
            const richting = richtingGedaan
                ? null
                : {
                    soort: "ochtend",
                    titel: "Richting voor vandaag",
                    duur: "1 min",
                    waaromNu: "Eén zin en één kerntaak, om rustig te weten waar je de dag mee begint.",
                };
            const water = beweging("glas-water", "Na een nacht heb je een paar uur niets gedronken. Een glas water is een zacht begin.");
            if (!buiten)
                kern = [licht, richting ?? water];
            else if (richting)
                kern = [richting, water];
            // Zijn licht en richting al gedaan, dan is de ochtend af: alleen nog kleine extra's.
            vooraan = kern.includes(water) ? [] : [water];
            pool = [
                beweging("voeten-op-de-grond", "Even voelen dat je er staat, voor de dag begint."),
                beweging("savoring-zestig-seconden", "Eén ding echt opmerken voor het drukker wordt."),
                islam ? dhikrSuggestie("subhan-allahi-wa-bihamdihi") : null,
                beweging("even-opstaan-bewegen", "Een paar minuten je lichaam wakker maken, zonder er iets van te maken."),
            ];
            break;
        }
        case "middag": {
            const kompasGedaan = heeft("kompas");
            const bewogen = buiten || heeft("beweging", "even-opstaan-bewegen") || heeft("beweging", "bewegen-met-een-beeld");
            const naarBuiten = beweging("vijf-minuten-naar-buiten", gisterenNietBuiten
                ? "Gisteren kwam je er niet aan toe. Misschien is het nu goed om even naar buiten te gaan — ook vijf minuten telt."
                : uur >= 16
                    ? "Als het nog licht is, kan het goed doen om even naar buiten te gaan. Ook vijf minuten telt."
                    : "Misschien is het nu goed om even naar buiten te gaan — zeker als je al een tijd hebt gezeten.");
            const kompas = kompasGedaan
                ? null
                : { soort: "kompas", titel: "Hoe voel je je?", duur: "2 min", waaromNu: "Even stilstaan bij hoe het gaat. Je hoeft niets uit te leggen." };
            // Een korte mentale pauze, per dag een andere.
            const pauze = draaiOpDag([
                beweging("box-ademhaling", "Een korte pauze voor je hoofd: een paar rondes op een vaste tel."),
                beweging("vijf-zintuigen-grounding", "Even uit je hoofd en terug in wat er nu is."),
            ], nu)[0] ?? null;
            if (!buiten)
                kern = [naarBuiten, kompas ?? pauze];
            else if (kompas)
                kern = [kompas, pauze];
            vooraan = [
                bewogen ? null : beweging("even-opstaan-bewegen", "Als je al een tijd hebt gezeten: even rechtop, rekken, een rondje lopen."),
            ];
            pool = [
                beweging("prikkels-loslaten", "Een paar minuten zonder scherm: een moment om zelf te kiezen waar je aandacht heen gaat."),
                beweging("vijftien-minuten-moeilijke-ding", "Als er iets blijft liggen: nu is er nog dag over, en klein beginnen is genoeg."),
                buiten ? null : beweging("tien-minuten-wandelen-groen", "Wat langer lopen mag ook, als je er ruimte voor hebt."),
            ];
            break;
        }
        case "avond": {
            const laat = uur >= 19.5;
            // De spiegel van de week is wekelijks en vervangt Dag sluiten op één
            // avond — niet ernaast. Zondagavond; wie hem dan mist, vindt hem onder
            // Terugkijken zolang de week nog loopt.
            const week = nu.getDay() === 0 && weekmomentBeschikbaar(data, nu);
            const sluiten = heeft("avond")
                ? null
                : {
                    soort: "avond",
                    titel: "Dag sluiten",
                    duur: "3 min",
                    waaromNu: "Een rustig moment om de dag af te ronden, als je daar zin in hebt.",
                };
            const scherm = beweging("scherm-zachter-voor-bed", "Zet je scherm op nachtstand en kies iets rustigs. Nog fijner: de telefoon straks ergens anders neerleggen.");
            if (week) {
                kern = [{ soort: "week", titel: "De spiegel van de week", duur: "10 min", waaromNu: "Deze week nog niet gedaan." }];
                vooraan = [sluiten];
            }
            else {
                kern = [sluiten, laat ? scherm : null];
                vooraan = [laat ? null : buiten ? null : beweging("vijf-minuten-naar-buiten", "Als het nog licht is: even naar buiten, voor de avond begint.")];
            }
            pool = [
                laat && !kern.includes(scherm) ? scherm : null,
                beweging("adem-lange-uitademing", "Rustiger ademen maakt de avond zachter."),
                islam ? beweging("muhasabah-twee-vragen", "Twee vragen terugkijken hoort bij dit uur.") : null,
                beweging("dankbaarheid-naar-persoon", "De avond is het makkelijkste moment om iemand te bereiken."),
                beweging("gedachte-in-woorden", "Blijft er iets malen? Zeg het eens anders."),
                beweging("savoring-zestig-seconden", "Eén ding van vandaag nog een keer echt proeven."),
            ];
            break;
        }
        case "slapen": {
            // Ayat al-Kursi hoort als allerlaatste vóór het slapen (adhkar.ts,
            // "wanneer": "voor het slapen"). Is de dag al gesloten, dan staat de
            // dhikr vooraan; anders komt Dag sluiten eerst en volgt de dhikr
            // vanzelf (zie toonS23Stap5VoorMorgen).
            const gesloten = heeft("avond");
            const ademen = beweging("adem-lange-uitademing", "Rustiger ademen vlak voor het slapen scheelt.");
            const scherm = beweging("scherm-zachter-voor-bed", "Je zit nu op je scherm: zet hem op nachtstand en leg hem daarna weg, liefst niet naast je bed.");
            const ayat = islam ? dhikrSuggestie("ayat-al-kursi") : null;
            if (!gesloten) {
                kern = [{ soort: "avond", titel: "Dag sluiten", duur: "3 min", waaromNu: "Als je wil, sluit je de dag kort af. Meer hoeft er niet." }];
                vooraan = [scherm, ayat];
            }
            else {
                // Ayat al-Kursi hoort als allerlaatste: er komt dus niets "daarna" achter.
                // Zonder de islamitische laag sluit het scherm zachter de avond af.
                kern = islam && ayat ? [ayat] : [ademen, scherm];
                vooraan = islam ? [scherm, ademen] : [];
            }
            pool = [
                beweging("2-3-4-5-ademhaling", "Een langzame tel die je hoofd iets te doen geeft, vlak voor het slapen."),
                beweging("fysiologische-zucht", "Eén of twee zuchten, en dan slapen."),
            ];
            break;
        }
    }
    const kernRuw = kern.filter((s) => s !== null);
    const rest = [...vooraan, ...draaiOpDag(pool, nu)].filter((s) => s !== null);
    // Een ongelezen brief komt maar één keer per maand en verdwijnt niet vanzelf.
    // Is er nog ruimte in de kern, dan staat hij daar (na het vaste ritueel), anders
    // vooraan bij wat er extra kan.
    if (ongelezenBrief(data)) {
        const brief = {
            soort: "brief",
            titel: "Er ligt een brief",
            duur: "3 min",
            waaromNu: "Je eigen zinnen van vorige maand, teruggelezen.",
        };
        if (kernRuw.length < 2)
            kernRuw.push(brief);
        else
            rest.unshift(brief);
    }
    const zichtbaar = (s) => metGedaan || !heeft(s.soort, s.id ?? "");
    const gezien = new Set();
    const uniek = (s) => {
        const sleutel = suggestieSleutel(s);
        if (gezien.has(sleutel))
            return false;
        gezien.add(sleutel);
        return true;
    };
    const kernLijst = kernRuw.filter(zichtbaar).filter(uniek).slice(0, 2);
    const extraLijst = rest.filter(zichtbaar).filter(uniek).slice(0, MAX_EXTRA);
    return { rust: null, kern: kernLijst, extra: extraLijst };
}
/**
 * De volledige lijst voor dit moment, belangrijkste eerst: de kern (één, met
 * hooguit één aanvulling), dan de extra's. Voor wie één voorstel zoekt zonder
 * het startscherm (de gevoelscheck bij "geen idee"). Het startscherm zelf gebruikt
 * `dagAanbod`, want dat weet welke van deze de kern is.
 */
export function suggestiesVoorNu(data, nu = new Date(), metGedaan = false) {
    const a = dagAanbod(data, nu, metGedaan);
    return a.rust ? [a.rust] : [...a.kern, ...a.extra];
}
/**
 * v27 (bouwplan §6.3) — één van je eigen eerdere zinnen, teruggegeven op een
 * gewone dag: "4 september — je schreef: …". Deterministisch per dag gekozen
 * (dus geen geknipper), uit de zinnen die je zelf schreef bij het verankeren,
 * de vrije afronding en Dag sluiten. Niets wordt verzonnen of bewerkt; het is
 * jouw eigen materiaal, en het groeit vanzelf mee.
 */
export function eigenZinVanEerder(data, nu = new Date()) {
    const vandaag = new Date(nu.getTime() - nu.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const bronnen = [];
    for (const s of data.sterren ?? [])
        if (s.zin?.trim())
            bronnen.push({ datum: s.datum, zin: s.zin.trim() });
    for (const d of data.dagsluitingen ?? [])
        if (d.zin?.trim())
            bronnen.push({ datum: d.datum, zin: d.zin.trim() });
    const eerder = bronnen
        .filter((b) => b.datum < vandaag && /^\d{4}-\d{2}-\d{2}$/.test(b.datum))
        .sort((a, b) => a.datum.localeCompare(b.datum) || a.zin.localeCompare(b.zin));
    if (eerder.length === 0)
        return null;
    const gekozen = eerder[dagVanJaar(nu) % eerder.length];
    const [j, m, d] = gekozen.datum.split("-").map(Number);
    const datumTekst = new Date(j, m - 1, d).toLocaleDateString("nl-BE", { day: "numeric", month: "long" });
    return `${datumTekst} — je schreef: "${gekozen.zin}"`;
}
/**
 * v27 (bouwplan §6.5) — "Verras me": voor wie er nooit aan denkt om zelf iets
 * te kiezen. De app kiest, met één regel waarom. Willekeurig per aanroep en
 * zonder geheugen (geen teller, geen "je zag deze al"), behalve dat een
 * beweging die je nog nooit deed daar de voorkeur krijgt. `uitsluiten` zijn de
 * ids die de vorige keer al kwamen, zodat "nog één" niet dezelfde geeft.
 */
export function verrasMe(data, zichtbaar, uitsluiten = [], nu = new Date()) {
    const gedaan = eerderGedaan(data);
    const laat = ["nacht", "voor_slapen"].includes(dagdeelVan(nu));
    let kandidaten = zichtbaar
        .map((b) => bewegingById(b.id))
        .filter((b) => Boolean(b))
        // Een koude douche is geen suggestie voor 's avonds laat.
        .filter((b) => !(laat && b.id === "korte-koude-douche"))
        // Licht in het eerste uur heeft alleen 's ochtends zin.
        .filter((b) => !(nu.getHours() >= 12 && b.id === "ochtendlicht-zien"))
        // Het scherm zachter zetten past pas als de avond op gang komt.
        .filter((b) => !(nu.getHours() < 19 && nu.getHours() >= 5 && b.id === "scherm-zachter-voor-bed"))
        .filter((b) => !uitsluiten.includes(b.id));
    if (kandidaten.length === 0)
        kandidaten = zichtbaar.map((b) => bewegingById(b.id)).filter((b) => Boolean(b));
    if (kandidaten.length === 0)
        return null;
    const nieuwe = gedaan.size > 0 ? kandidaten.filter((b) => !gedaan.has(b.id)) : [];
    const bron = nieuwe.length > 0 ? nieuwe : kandidaten;
    const b = bron[Math.floor(Math.random() * bron.length)];
    const woorden = b.pastBij.slice(0, 2);
    const waarom = nieuwe.includes(b)
        ? "Deze heb je nog niet eerder geprobeerd."
        : woorden.length === 2
            ? `Past als je je ${woorden[0]} of ${woorden[1]} voelt.`
            : woorden.length === 1
                ? `Past als je je ${woorden[0]} voelt.`
                : `Kort kan ook: ${b.minimumversie}`;
    return { soort: "beweging", id: b.id, titel: b.titel, duur: duurVan(b.id), waaromNu: waarom };
}
