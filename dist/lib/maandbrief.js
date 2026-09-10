// maandbrief.ts — De Maandbrief (v2.4 §7B, v2.5 §4.6).
//
// De brief bestaat voor het grootste deel uit de zinnen die je zelf die maand
// bij het verankeren hebt geschreven, letterlijk overgenomen. Daaromheen staan
// hooguit vier vaste verbindingszinnen (v2.5 §4.6 — geen taalmodel, en de app
// blijft volledig lokaal).
//
// Regels die hier hard in zitten:
//   - Geen enkel getal in de brief (v2.2 Wet 4, teksten.yaml). De sterkte van
//     een verschuiving staat in woorden: bijna altijd · vaak · soms · te weinig
//     om iets van te zeggen (v2.5 §5.2).
//   - Geen vergelijking met een vorige maand. Nooit "meer dan", nooit "minder
//     dan", nooit "je bent goed bezig".
//   - Een zware maand moet in de brief mogen staan als een zware maand.
//   - Een brief wordt één keer geschreven en daarna bevroren. Hij is een
//     verslag van die maand; opnieuw genereren zou hem later laten schuiven.
import { woordById } from "../data/woorden.js";
import { bewegingById } from "../data/bewegingen.js";
/**
 * Hoe vaak dezelfde beweging in één maand gedaan moet zijn voordat de brief
 * er iets over zegt. Onder deze drempel is "te weinig om iets van te zeggen"
 * verplicht (v2.5 §5.2).
 *
 * Vier. Onder vier keer is het verschil tussen "bijna altijd" en "soms" één
 * enkele avond, en dan zegt het woord meer dan het weet. Net als de drempel
 * voor een sterrenbeeld: een voorlopig getal op één plek, bedoeld om na een
 * paar maanden gebruik te toetsen.
 */
export const SPIEGEL_DREMPEL = 4;
const MAANDEN = [
    "januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december",
];
/** De vier vaste verbindingszinnen. Meer dan vier komen er niet in één brief. */
const VAST = {
    opening: "Dit is wat er was.",
    zwareMaand: "Deze maand was er vooral doorheen komen. Dat is ook wat er was.",
    verschuivingOnbekend: "Wat er verschoof, is deze maand te weinig om iets van te zeggen.",
    // {titel} en {sterkte} worden ingevuld; verder staat de zin vast. De titel
    // staat vooraan met een gedachtestreepje erachter, omdat de twaalf titels
    // uit bewegingen.yaml niet allemaal als onderwerp van een zin werken
    // ("Savoring: zestig seconden blijven verschoof je..." leest krom).
    verschuiving: "{titel} — dat verschoof je {sterkte} naar een lichtere hoek.",
};
/** v2.5 §5.2 — sterkte in woorden, nooit in getallen. */
function sterkteInWoorden(deel) {
    if (deel >= 0.8)
        return "bijna altijd";
    if (deel >= 0.6)
        return "vaak";
    if (deel >= 0.35)
        return "soms";
    return null;
}
/**
 * Vier open vragen. Er staat er één per brief; welke, wisselt met de maand,
 * zodat twaalf brieven achter elkaar niet twaalf keer dezelfde vraag stellen.
 * Geen enkele vraag stuurt aan op iets: ze vragen alleen wat er was.
 */
const VRAGEN = [
    "Wat vroeg deze maand het meest van je?",
    "Waar ging je heen als je nergens heen wilde?",
    "Wat deed je zonder erover na te denken?",
    "Wat is er gebeurd zonder dat je het merkte?",
];
export function maandSleutel(iso) {
    return iso.slice(0, 7); // "2026-08"
}
export function maandNaam(sleutel) {
    const index = Number(sleutel.slice(5, 7)) - 1;
    const naam = MAANDEN[index];
    if (!naam)
        return sleutel;
    return naam.charAt(0).toUpperCase() + naam.slice(1);
}
function toonVanMoment(moment) {
    if (moment.eigenWoord)
        return moment.eigenWoord.toon;
    const tonen = moment.woorden
        .map((id) => woordById(id)?.toon)
        .filter((t) => typeof t === "number");
    if (tonen.length === 0)
        return null;
    return tonen.reduce((a, b) => a + b, 0) / tonen.length;
}
function toonVanAfsluiting(moment) {
    const tonen = moment.afsluitwoorden
        .map((id) => woordById(id)?.toon)
        .filter((t) => typeof t === "number");
    if (tonen.length === 0)
        return null;
    return tonen.reduce((a, b) => a + b, 0) / tonen.length;
}
/**
 * De verschuivingszin: van de beweging die je deze maand het vaakst deed,
 * hoe vaak stond je aan het eind lichter dan aan het begin. Het tellen
 * gebeurt intern en komt nooit als getal in beeld (v2.5 §5.1).
 */
function verschuivingszin(momenten) {
    const perBeweging = new Map();
    for (const m of momenten) {
        const id = m.gekozenDeur;
        if (!id || id === "niets-doen")
            continue;
        const voor = toonVanMoment(m);
        const na = toonVanAfsluiting(m);
        if (voor === null || na === null)
            continue;
        const rij = perBeweging.get(id) ?? { totaal: 0, lichter: 0 };
        rij.totaal += 1;
        if (na > voor + 0.05)
            rij.lichter += 1;
        perBeweging.set(id, rij);
    }
    let beste = null;
    for (const [id, rij] of perBeweging) {
        if (rij.totaal < SPIEGEL_DREMPEL)
            continue;
        if (!beste || rij.totaal > beste.totaal)
            beste = { id, ...rij };
    }
    if (!beste)
        return VAST.verschuivingOnbekend;
    const sterkte = sterkteInWoorden(beste.lichter / beste.totaal);
    if (!sterkte)
        return VAST.verschuivingOnbekend;
    const titel = bewegingById(beste.id)?.titel;
    if (!titel)
        return VAST.verschuivingOnbekend;
    return VAST.verschuiving.replace("{titel}", titel).replace("{sterkte}", sterkte);
}
/**
 * Kiest hooguit vier eigen zinnen, gespreid over de maand — niet de "beste"
 * (dat zou een oordeel zijn) en niet de laatste vier (dat zou de maand tot
 * zijn staart terugbrengen).
 */
function eigenZinnen(momenten) {
    const zinnen = momenten
        .slice()
        .sort((a, b) => a.tijdstip.localeCompare(b.tijdstip))
        .map((m) => m.verankeringszin)
        .filter((z) => typeof z === "string" && z.trim().length > 0);
    if (zinnen.length <= 4)
        return zinnen;
    const gekozen = [];
    for (let i = 0; i < 4; i++) {
        gekozen.push(zinnen[Math.round((i * (zinnen.length - 1)) / 3)]);
    }
    return [...new Set(gekozen)];
}
export function schrijfBrief(maand, momenten) {
    const zinnen = eigenZinnen(momenten);
    const alineas = [];
    // 1. Wat er was — jouw eigen zinnen, letterlijk, achter elkaar in één
    // alinea. Elk op een eigen regel zou een opsomming worden, en die verbiedt
    // v2.4 §7B ("lopende tekst, geen opsomming").
    alineas.push(zinnen.length > 0 ? VAST.opening : VAST.zwareMaand);
    if (zinnen.length > 0)
        alineas.push(zinnen.join(" "));
    // 2. Eén ding dat lijkt te zijn verschoven.
    alineas.push(verschuivingszin(momenten));
    // 3. Eén open vraag om mee verder te leven.
    const maandIndex = Number(maand.slice(5, 7)) - 1;
    alineas.push(VRAGEN[maandIndex % VRAGEN.length]);
    return {
        id: `br-${maand}`,
        maand,
        aangemaaktOp: new Date().toISOString(),
        alineas,
        gelezen: false,
    };
}
/**
 * Schrijft de brieven voor alle afgesloten maanden waarin je er was en die er
 * nog geen hebben. Draait bij het openen van de app; de lopende maand krijgt
 * nooit een brief, want die is nog niet gebeurd.
 *
 * Geeft terug of er iets bij is gekomen, zodat de aanroeper weet of hij moet
 * bewaren.
 */
export function vulBrievenAan(data, nu = new Date()) {
    const huidigeMaand = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`;
    const bestaand = new Set((data.brieven ?? []).map((b) => b.maand));
    const perMaand = new Map();
    for (const m of data.momenten) {
        const sleutel = maandSleutel(m.tijdstip);
        if (sleutel >= huidigeMaand)
            continue;
        if (bestaand.has(sleutel))
            continue;
        const lijst = perMaand.get(sleutel) ?? [];
        lijst.push(m);
        perMaand.set(sleutel, lijst);
    }
    if (perMaand.size === 0)
        return false;
    const nieuwe = [...perMaand.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([maand, momenten]) => schrijfBrief(maand, momenten));
    data.brieven = [...(data.brieven ?? []), ...nieuwe].sort((a, b) => a.maand.localeCompare(b.maand));
    return true;
}
export function ongelezenBrief(data) {
    const ongelezen = (data.brieven ?? []).filter((b) => !b.gelezen);
    return ongelezen.length > 0 ? ongelezen[0] : null;
}
/**
 * Het opschrift van een brief: alleen de maandnaam. Het jaartal komt er pas
 * bij zodra dezelfde maandnaam twee keer in het archief staat — dan draagt
 * het informatie, en daarvoor niet.
 */
export function briefOpschrift(brief, alle) {
    const naam = maandNaam(brief.maand);
    const dubbel = alle.filter((b) => maandNaam(b.maand) === naam).length > 1;
    return dubbel ? `${naam} ${brief.maand.slice(0, 4)}` : naam;
}
