// selection.ts — de volledige selectielogica uit selectie.yaml, als pure
// functies. Niets hier telt iets op dat ooit als score getoond wordt.
import { woordById } from "../data/woorden.js";
import { zones, zoneConfig, nooitPerZone, ONDERDRUKKING_DAGEN, } from "../data/selectie.js";
import { bewegingById } from "../data/bewegingen.js";
function avg(nums) {
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}
/** STAP 1 + 2 — bepaal de zone voor een gekozen set woorden (of een eigen
 * getypte positie zonder vaste coördinaten). */
export function bepaalZone(woordIds, eigenPositie) {
    const gekozenWoorden = woordIds.map(woordById).filter((w) => !!w);
    // STAP 1: ordenend heeft altijd voorrang
    if (gekozenWoorden.some((w) => w.ordenend)) {
        return "C_ordenen";
    }
    // STAP 2: dichtstbijzijnde zone, euclidisch
    let energie;
    let toon;
    if (gekozenWoorden.length > 0) {
        energie = avg(gekozenWoorden.map((w) => w.energie));
        toon = avg(gekozenWoorden.map((w) => w.toon));
    }
    else if (eigenPositie) {
        energie = eigenPositie.energie;
        toon = eigenPositie.toon;
    }
    else {
        energie = 0;
        toon = 0;
    }
    let dichtstbijzijnde = zones[0];
    let kleinsteAfstand = Infinity;
    for (const zone of zones) {
        const d = (zone.zwaartepunt.energie - energie) ** 2 + (zone.zwaartepunt.toon - toon) ** 2;
        if (d < kleinsteAfstand) {
            kleinsteAfstand = d;
            dichtstbijzijnde = zone;
        }
    }
    return dichtstbijzijnde.id;
}
function isOnderdrukt(bewegingId, onderdrukkingen) {
    return onderdrukkingen.some((o) => o.bewegingId === bewegingId && new Date() < new Date(o.totDatum));
}
function drieZwareDagenEnRichting(momenten) {
    const laatste3 = momenten.slice(-3);
    if (laatste3.length < 3)
        return false;
    return laatste3.every((m) => m.zone === "A_kalmeren" || m.zone === "B_activeren");
}
/**
 * bewegingen.yaml → nooit_aanbieden_als: "net_overprikkeld_of_sociaal_uitgeput"
 * (veiligheid.md §4: "sociale bewegingen worden nooit aangeboden direct na een
 * moment dat als overprikkeld of sociaal uitgeput is geregistreerd").
 *
 * "Sociaal uitgeput" bestaat niet als woord in woorden.yaml. Ingevuld als
 * `overprikkeld` of `uitgeput` in het vorige moment — dat laatste is een
 * invulling, geen citaat, en hoort bevestigd te worden.
 */
function netOverprikkeldOfUitgeput(momenten) {
    const vorige = momenten[momenten.length - 1];
    if (!vorige)
        return false;
    return vorige.woorden.some((id) => id === "overprikkeld" || id === "uitgeput");
}
/**
 * bewegingen.yaml → shukr-drie-dingen.nooit_aanbieden_als:
 * "direct_na_iets_pijnlijks". Die regel is nergens uitgeschreven, dus hier
 * ingevuld als: het vorige moment bevatte een woord uit de zwaarste groep
 * (woorden.yaml `zwaarsteGroep`, dat precies daarvoor bestaat). Ook dit is
 * een invulling die bevestigd hoort te worden.
 */
function directNaIetsPijnlijks(momenten) {
    const vorige = momenten[momenten.length - 1];
    if (!vorige)
        return false;
    return vorige.woorden.some((id) => woordById(id)?.zwaarsteGroep === true);
}
/**
 * Lost één deur-slot op tot een concrete beweging-id.
 *
 * Een vaste id komt terug zoals hij is. Een rotatie (selectie.yaml §v1.1:
 * "roteert", "wisselt") filtert eerst de opties die nu niet mogen meedoen
 * (islamitische laag uit, of geen van de vereiste woorden gekozen), en kiest
 * dan de eerstvolgende na de laatst gekozen optie uit dezelfde rotatie —
 * rondlopend, dus nooit twee keer op rij dezelfde, en bij een 3-weg-rotatie
 * komt elke optie op zijn beurt (niet alleen "niet dezelfde als de vorige").
 * De geschiedenis wordt over alle momenten bekeken (zoals de bestaande
 * D_verdiepen_laag-wisseling in v1 al deed), niet alleen de vorige zone-
 * bezoek — dat is een bewuste, eenvoudige keuze, geen verborgen teller.
 */
function lostSlotOp(slot, data, islamitischeLaag, woordIds) {
    if (typeof slot === "string")
        return slot;
    const gekozenWoorden = new Set(woordIds);
    const ochtend = new Date().getHours() < 12;
    const geldigeOpties = slot.filter((optie) => {
        if (optie.vereistIslamitischeLaag && !islamitischeLaag)
            return false;
        if (optie.vereistWoord && !optie.vereistWoord.some((w) => gekozenWoorden.has(w)))
            return false;
        // v1.2: ochtendlicht-zien is de eerste beweging die alleen op een deel
        // van de dag zinvol is — zie selectie.yaml §v1.2. Lokale kloktijd, geen
        // netwerk, geen vraag aan de gebruiker.
        if (optie.vereistDagvenster === "ochtend" && !ochtend)
            return false;
        return true;
    });
    if (geldigeOpties.length === 0)
        return slot[0].id; // kan niet gebeuren zolang elke rotatie een ongeclausuleerde optie heeft
    if (geldigeOpties.length === 1)
        return geldigeOpties[0].id;
    const idsInRotatie = new Set(slot.map((o) => o.id));
    const vorigeKeuzes = data.momenten
        .map((m) => m.gekozenDeur)
        .filter((id) => !!id && idsInRotatie.has(id));
    const laatste = vorigeKeuzes[vorigeKeuzes.length - 1];
    const idx = geldigeOpties.findIndex((o) => o.id === laatste);
    const volgende = idx === -1 ? geldigeOpties[0] : geldigeOpties[(idx + 1) % geldigeOpties.length];
    return volgende.id;
}
/** STAP 3 + 4 — bepaalt de drie deuren voor een zone: altijd twee
 * bewegingen plus "niets-doen", met onderdrukking, tijd, de woorden van dit
 * moment en de genoemde regels meegewogen. */
export function bepaalDeuren(zone, tijd, data, islamitischeLaag, woordIds = []) {
    const config = zoneConfig[zone];
    const tijdConfig = zone === "C_ordenen" && tijd === "2min"
        ? islamitischeLaag
            ? config.islamitischeLaagAanBij2min
            : config.islamitischeLaagUitBij2min
        : tijd === "2min"
            ? config.bij2min
            : config.bij10minOfMeer;
    const eerste = lostSlotOp(tijdConfig.eerste, data, islamitischeLaag, woordIds);
    let tweede = lostSlotOp(tijdConfig.tweede, data, islamitischeLaag, woordIds);
    // selectie.yaml §v1.1 → C_ordenen.vervangingen: het woord bepaalt, niet
    // (alleen) de instelling of de rotatie. schuldig/zelfkritisch gaat voor —
    // pas als die niet van toepassing is, kan wantrouwend/verdrietig (alleen
    // bij 10 min of meer) de tweede deur nog vervangen door vergeven-eerste-stap.
    if (zone === "C_ordenen" && config.vervangingen) {
        for (const vervanging of config.vervangingen) {
            if (vervanging.nooitBijTijd?.includes(tijd))
                continue;
            if (woordIds.some((id) => vervanging.bijWoord.includes(id))) {
                // v1.4: vervangtDoor is sinds selectie.ts §v1.4 een volwaardig
                // DeurSlot — dus ook een rotatie (schuldig/zelfkritisch roteert nu
                // tussen zelfcompassie-na-misstap en sayyid-al-istighfar) in plaats
                // van altijd naar dezelfde vaste string te wijzen.
                tweede = lostSlotOp(vervanging.vervangtDoor, data, islamitischeLaag, woordIds);
                break;
            }
        }
    }
    const kandidaten = [eerste, tweede];
    const nooit = new Set(nooitPerZone[zone]);
    const sessieDeuren = new Set(data.momenten.slice(-1).map((m) => m.gekozenDeur).filter(Boolean));
    const gekozenWoorden = new Set(woordIds);
    const geldig = kandidaten.filter((id) => {
        if (nooit.has(id))
            return false;
        if (isOnderdrukt(id, data.onderdrukkingen))
            return false;
        if (sessieDeuren.has(id))
            return false;
        const beweging = bewegingById(id);
        if (!beweging)
            return false;
        // bewegingen.yaml → past_niet_bij: dit is de regel die "tien minuten
        // wandelen" aanbood aan iemand die "uitgeput" had gekozen.
        if (beweging.pastNietBij.some((w) => gekozenWoorden.has(w)))
            return false;
        // duur mag nooit langer zijn dan gevraagd
        if (tijd === "2min" && beweging.kosten.tijdMinuten[0] > 5)
            return false;
        for (const regel of beweging.nooitAanbiedenAls) {
            if (regel === "drie_zware_dagen_en_richting" && drieZwareDagenEnRichting(data.momenten))
                return false;
            if (regel === "net_overprikkeld_of_sociaal_uitgeput" && netOverprikkeldOfUitgeput(data.momenten))
                return false;
            if (regel === "direct_na_iets_pijnlijks" && directNaIetsPijnlijks(data.momenten))
                return false;
        }
        return true;
    });
    // Aanvullen tot twee deuren. De terugvaloptie moet zelf ook door alle regels
    // heen — anders komt via de achterdeur alsnog iets binnen dat niet past.
    const fallbacks = [
        "savoring-zestig-seconden",
        "benoemen-en-parkeren",
        "adem-lange-uitademing",
        "uitschrijven-zonder-filter",
    ];
    while (geldig.length < 2) {
        const extra = fallbacks.find((f) => {
            if (geldig.includes(f) || nooit.has(f))
                return false;
            const beweging = bewegingById(f);
            if (!beweging)
                return false;
            if (beweging.pastNietBij.some((w) => gekozenWoorden.has(w)))
                return false;
            if (tijd === "2min" && beweging.kosten.tijdMinuten[0] > 5)
                return false;
            return true;
        });
        if (!extra)
            break;
        geldig.push(extra);
    }
    // bewegingen.yaml → past_bij: wat bij je woorden past, staat vooraan. Dit
    // ordent alleen; het sluit niets uit, want de drie deuren blijven gelijk
    // in grootte en typografie (selectie.yaml → niets_doen.ontwerpregel).
    geldig.sort((a, b) => {
        const past = (id) => bewegingById(id).pastBij.filter((w) => gekozenWoorden.has(w)).length;
        return past(b) - past(a);
    });
    return [...geldig.slice(0, 2), "niets-doen"];
}
export function registreerOnderdrukking(data, bewegingId, reden) {
    const tot = new Date();
    tot.setDate(tot.getDate() + ONDERDRUKKING_DAGEN);
    data.onderdrukkingen.push({
        bewegingId,
        totDatum: tot.toISOString().slice(0, 10),
        reden,
    });
}
