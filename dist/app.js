// app.ts — de volledige schermenlus S0 t/m S11, zie schermenoverzicht.md.
// Eén bestand, geen router-library: de dagelijkse lus is toch al lineair
// (S1 → S2 → S3 → S4 → (S5 → S6) → S7).
import { laadBestand, bewaarBestand, wisBestand, exporteerBestand, parseGeimporteerdBestand } from "./lib/db.js";
import { zetMeldingenAan, zetMeldingenUit } from "./lib/meldingen.js";
import { el, render, dimEnDan, naVertraging } from "./lib/dom.js";
import { tekenSchijf, tekenHemel, tekenSterrenbeeldModus, tekenVerschil, nauwelijksVerschoven, } from "./lib/canvas.js";
import { toonThuis, toonVisieIntro, toonDoen, toonTerugkijken, toonKamer, toonCheckIn, toonAvondRoutine, toonHuisOplichten, } from "./kamers.js";
import { kamerVanSter, markeerHuisGezien } from "./lib/huis.js";
import { kamerVanBeweging } from "./data/kamers.js";
import { woordenNabij, woordById, zetEigenWoorden, zoekWoorden } from "./data/woorden.js";
import { bewegingById, bewegingen } from "./data/bewegingen.js";
import { teksten } from "./data/teksten.js";
import { bepaalZone, bepaalDeuren, registreerOnderdrukking } from "./lib/selection.js";
import { aanbodVoorStreek } from "./lib/sterrenbeeld.js";
import { vulBrievenAan, ongelezenBrief, briefOpschrift } from "./lib/maandbrief.js";
import { schrijfWeekmoment } from "./lib/weekmoment.js";
import { registreerPerfectionismeCheck, registreerFrictieAangeboden, } from "./lib/meer.js";
import { kwaliteiten, kwaliteitById } from "./data/kwaliteiten.js";
import { huidigeDagSleutel, registreerGedaan, } from "./lib/ritme.js";
import { dhikrById } from "./data/adhkar.js";
import { themas, } from "./data/themas.js";
import { dagdeelVan, dagdeelGroep, suggestieSleutel, } from "./lib/nu.js";
import { alleWoorden } from "./data/woorden.js";
import { visieDelen } from "./lib/visie.js";
import { visieBeschikbaarAlsIntro, visieFragment, visieCheckInsVoor, } from "./lib/visie.js";
export let data;
/**
 * v27 — puur UI-staat voor deze sessie, nooit bewaard: welke suggestie van het
 * startscherm je nu doorloopt. Pas als die echt is afgerond (toonS7 of een
 * "terug naar start" na de afronding) schrijft `rondLopendeAf()` hem weg in
 * `data.gedaanVandaag`. Kom je via terug op het startscherm (toonThuis), dan
 * telt het niet als gedaan. Dit vervangt de geheugenvariabele
 * `laatstGekozenSuggestie` van v25, die bij elke herlaad van de PWA wiste.
 */
let lopendeSuggestie = null;
/**
 * v27 — "toch nog iets doen": heb je in dit dagdeel al iets gedaan, dan sluit
 * het startscherm af. Vraag je er zelf om, dan komt er één volgende. Pull,
 * geen push; verdwijnt weer zodra je iets nieuws afrondt.
 */
let extraGevraagd = null;
/**
 * v27 (W5) — de ster die zojuist ontstond, zodat het afsluiten (toonS7) niet
 * naar zwart dimt maar naar je hemel, met die ene ster die oplicht. Puur UI-
 * staat: wordt bij gebruik meteen leeggemaakt. De Onderbreker en de
 * herstelroute maken nooit een ster en blijven dus gewoon naar zwart dimmen.
 */
let zojuistGemaakteSter = null;
/** De hal roept dit aan zodra hij opent: een lopende suggestie die je niet afrondde telt niet. */
export function ruimSessieOp() {
    lopendeSuggestie = null;
    zojuistGemaakteSter = null;
}
export function extraIsGevraagd(sleutel) {
    return extraGevraagd === sleutel;
}
export function vraagExtra(sleutel) {
    extraGevraagd = sleutel;
}
function rondLopendeAf() {
    if (!lopendeSuggestie)
        return;
    registreerGedaan(data, lopendeSuggestie.dagdeel, lopendeSuggestie.sleutel);
    lopendeSuggestie = null;
    extraGevraagd = null;
    void bewaren();
}
/**
 * v25 — toonS10() zet bij een mislukte aanmelding voor meldingen een
 * boodschap op een tekst-element en roept daarna toonS10() opnieuw aan om
 * de knop terug te zetten. render() vervangt daarbij de hele boom, dus dat
 * element (en de net gezette tekst) verdwijnt meteen weer mee. Deze
 * variabele overleeft de her-render wel: toonS10() leest 'm bij elke
 * opbouw opnieuw uit, in plaats van een tekst te zetten op een element dat
 * al niet meer bestaat.
 */
let laatsteMeldingenFout = null;
// state voor het moment dat nu wordt opgebouwd
let huidigeTikPositie = null;
let huidigMoment = null;
function nieuwId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
/**
 * v22 — een knop die bij een leeg veld niets zou doen, ziet er nu ook zo
 * uit (.knop:disabled), in plaats van dat je erop tikt en er zichtbaar
 * niets gebeurt. Werkt meteen bij een vooringevulde waarde (herschrijven).
 */
function koppelDisabled(veld, knop) {
    const controleer = () => {
        knop.disabled = !veld.value.trim();
    };
    controleer();
    veld.addEventListener("input", controleer);
}
/**
 * v23 — een herbruikbaar oriëntatiepatroon voor elke flow van meer dan twee
 * stappen (de WOOP-flow, de dag sluiten): een label ("stap 2 van 5") en
 * dezelfde stippenrij die de losse oefeningen al gebruikten. Dit telt niets
 * over je gebruik (Wet 4 blijft ongemoeid) — het toont alleen waar je bent
 * binnen het scherm dat je nu al doorloopt.
 */
function stapKop(titel, index, totaal) {
    return [
        el("p", { class: "stap-label" }, [`${titel} · stap ${index} van ${totaal}`]),
        el("div", { class: "stip-rij" }, Array.from({ length: totaal }, (_, i) => el("span", { class: `stip${i < index ? " vol" : ""}` }))),
    ];
}
export async function bewaren() {
    const gelukt = await bewaarBestand(data);
    if (!gelukt) {
        // teksten.yaml → lege_staten.storage_vol_of_geweigerd. Die tekst bestond
        // wel maar werd nooit getoond; stil falen is het ergste wat een app die
        // "dit bestand is alles" belooft kan doen.
        toonMelding(teksten.legeStaten.storageVolOfGeweigerd, "fout");
    }
}
/**
 * Eén rustige regel onderaan het scherm, die vanzelf weer weggaat. Drie
 * varianten (style.css): neutraal (default), "succes" (moss) en "fout"
 * (ember) — spaarzaam, alleen de rand en de tekstkleur veranderen, nooit
 * een groot gekleurd vlak.
 */
export function toonMelding(tekst, soort = "neutraal") {
    const bestaand = document.querySelector(".melding");
    if (bestaand)
        bestaand.remove();
    const klasse = soort === "neutraal" ? "melding zacht" : `melding zacht melding--${soort}`;
    const regel = el("p", { class: klasse }, [tekst]);
    document.body.append(regel);
    setTimeout(() => regel.remove(), 6000);
}
export async function startApp() {
    data = await laadBestand();
    // "Rustige beelden" zet ook de bewegende achtergronden van de kamers stil.
    document.body.classList.toggle("rustig", data.instellingen.rustigeBeelden);
    // teksten.yaml belooft dat een eigen woord er de volgende keer weer bij
    // staat; daarvoor moet de woordenlijst ze kennen.
    zetEigenWoorden(data.woordenUitbreiding);
    // v2.5 §3, met nadruk: zonder deze aanvraag mag de telefoon het bestand
    // weggooien bij schijfdruk. Best effort — een weigering is geen fout.
    void navigator.storage?.persist?.().catch(() => undefined);
    // De brieven van afgesloten maanden worden bij het openen geschreven en
    // daarna bevroren (v2.4 §7B). De lopende maand krijgt er nooit een.
    if (vulBrievenAan(data))
        await bewaren();
    // Life Maxing 2.0: een bestaand bestand hoeft niet te melden wat er al stond.
    if (data.huisGezien === null) {
        markeerHuisGezien(data);
        await bewaren();
    }
    if (!data.instellingen.ethischeOndergrensGezien) {
        toonS0();
    }
    else if (visieBeschikbaarAlsIntro(data)) {
        // v22: eenmalig aangeboden — bij gloednieuwe gebruikers vlak na S0, bij
        // bestaande gebruikers die de app bijwerken de eerste keer dat ze hem
        // weer openen. Daarna nooit meer vanzelf (Wet 5); altijd bereikbaar via
        // Terugkijken → "mijn visie".
        toonVisieIntro();
    }
    else {
        // v21: de app opent op het startscherm dat zelf zegt wat er nu past,
        // niet meer op een lege schijf zonder uitleg.
        toonThuis();
    }
}
// ── S0 — Ethische ondergrens ──────────────────────────────────────────
function toonS0() {
    render([
        el("div", { class: "scherm" }, [
            el("div", { class: "regels" }, teksten.eerstOpening.regels.map((r) => el("p", { class: "regel" }, [r]))),
            el("button", {
                class: "knop",
                onclick: async () => {
                    data.aangemaaktOp = new Date().toISOString();
                    data.instellingen.ethischeOndergrensGezien = true;
                    await bewaren();
                    if (visieBeschikbaarAlsIntro(data))
                        toonVisieIntro();
                    else
                        toonThuis();
                },
            }, [teksten.eerstOpening.knop]),
            el("button", { class: "knop-klein", onclick: () => toonS11() }, ["Ik heb al een bestand"]),
        ]),
    ]);
}
/**
 * v22 — De Schijf uitgelegd: labels rond het instrument (niet erop — de
 * cirkel zelf blijft "zonder assen, zonder cijfers"). Gedeeld door S1 en
 * S23 (Avond), de twee plekken waar de kale schijf staat.
 */
function kompasVeld(canvas) {
    return el("div", { class: "kompas-veld" }, [
        el("span", { class: "kompas-as-verticaal" }, [teksten.kompas.asBoven]),
        canvas,
        el("span", { class: "kompas-as-horizontaal" }, [
            el("span", {}, [teksten.kompas.asLinks]),
            el("span", {}, [teksten.kompas.asRechts]),
        ]),
        el("span", { class: "kompas-as-verticaal" }, [teksten.kompas.asOnder]),
    ]);
}
// ── S1 — Het Kompas (De Schijf) ───────────────────────────────────────
function toonS1(beginPositie = null) {
    // Na "dit klopt niet" komt de vorige positie mee terug, zodat je hem kunt
    // verzetten in plaats van opnieuw beginnen (teksten.yaml → dit_klopt_niet).
    huidigeTikPositie = beginPositie;
    huidigMoment = null;
    const canvas = el("canvas", { class: "schijf-canvas" });
    // v1.1-meer.md, 6 september 2026: S1 toont voortaan alleen De Schijf, de
    // kompasvraag, en twee knoppen. De Onderbreker blijft hier als enige
    // uitzondering (v2.2 Wet 8 punt 1 — het openen van de app ís de
    // onderbreker-handeling zelf); al het andere (De Hemel, de brief, het
    // weekmoment, instellingen, Frictie, de perfectionisme-check) zit voortaan
    // achter "meer" (S16), het ene stille toegangspunt dat Wet 5 en Wet 10.3
    // altijd al vroegen.
    const scherm = el("div", { class: "scherm", "data-kamer": "adem" }, [
        el("p", { class: "vraag" }, [teksten.eerstOpening.vraag]),
        el("p", { class: "zacht" }, [teksten.kompas.schijfUitleg]),
        kompasVeld(canvas),
        el("p", { class: "zacht" }, [teksten.kompas.schijfUitkomst]),
        // v27 (W6) — De Schijf is weer de voordeur van de kompaslus; de woorden
        // staan eronder als alternatief voor wie liever benoemt dan aanwijst.
        el("button", {
            class: "knop-klein",
            onclick: () => {
                huidigeTikPositie = null;
                toonS2();
            },
        }, ["liever woorden kiezen"]),
        el("button", { class: "knop-klein", onclick: () => toonS15Onderbreker() }, [teksten.onderbreker.toegangKnoptekst]),
        el("button", { class: "knop-klein", onclick: () => toonThuis() }, ["terug naar start"]),
    ]);
    render([scherm]);
    tekenSchijf(canvas, (energie, toon) => {
        // tijdens het slepen: alleen de positie bijhouden, zodat de lichtvorm
        // meebeweegt en je kunt voelen waar je staat
        huidigeTikPositie = { energie, toon };
    }, {
        rustig: data.instellingen.rustigeBeelden,
        beginPositie,
        onKlaar: () => naVertraging(220, () => toonS2()),
    });
}
// ── S2 — Woordkeuze ────────────────────────────────────────────────────
function toonS2() {
    // v21: kom je hier zonder schijfpositie (de gewone weg sinds het
    // startscherm), dan toont dit scherm de hele woordenlijst en wordt je
    // plek op het kompas afgeleid uit de woorden die je kiest -- die hebben
    // elk hun eigen energie/toon in woorden.ts. Wie het preciezer wil
    // aangeven, opent alsnog de schijf via S1.
    const viaSchijf = huidigeTikPositie !== null;
    const tikPositie = huidigeTikPositie ?? { energie: 0, toon: 0 };
    // v27 (W6) — ongeveer twaalf woorden rond waar je tikte, met "alle woorden"
    // eronder (het patroon van "de hele bibliotheek" elders). Zonder schijf
    // staat de hele lijst er, maar het zoekveld staat nu erboven.
    const nabij = viaSchijf ? woordenNabij(tikPositie.energie, tikPositie.toon, 12) : alleWoorden();
    let alleTonen = !viaSchijf;
    const gekozen = new Set();
    let eigenWoordTekst = "";
    function verder() {
        if (gekozen.size === 0 && !eigenWoordTekst.trim())
            return;
        const woordIds = [...gekozen];
        // Zonder schijf: het gemiddelde van de gekozen woorden is je positie.
        const gekozenWoorden = woordIds
            .map((wid) => woordById(wid))
            .filter((w) => Boolean(w));
        const positie = viaSchijf || gekozenWoorden.length === 0
            ? tikPositie
            : {
                energie: gekozenWoorden.reduce((t, w) => t + w.energie, 0) / gekozenWoorden.length,
                toon: gekozenWoorden.reduce((t, w) => t + w.toon, 0) / gekozenWoorden.length,
            };
        const getypt = eigenWoordTekst.trim();
        // Een eigen woord ontstaat alleen als je niets uit de lijst koos én je
        // tekst niet gewoon een van de bestaande woorden is. Anders zou zoeken
        // op "moe" een tweede "moe" aanmaken.
        const bestaatAl = zoekWoorden(getypt).some((w) => w.woord.toLowerCase() === getypt.toLowerCase());
        if (getypt && woordIds.length === 0 && !bestaatAl) {
            const id = `uw-${getypt.toLowerCase().replace(/\s+/g, "_")}`;
            data.woordenUitbreiding.push({
                id,
                woord: getypt,
                energie: positie.energie,
                toon: positie.toon,
                toegevoegdOp: new Date().toISOString(),
            });
            zetEigenWoorden(data.woordenUitbreiding);
            toonMelding(teksten.kompas.eigenWoordBevestiging);
            woordIds.push(id);
        }
        if (woordIds.length === 0)
            return;
        huidigMoment = {
            id: nieuwId("m"),
            tijdstip: new Date().toISOString(),
            woorden: woordIds,
            tijdBeschikbaar: "10min_of_meer",
            zone: bepaalZone(woordIds, positie),
            gekozenDeur: null,
            afsluitwoorden: [],
            verankeringszin: null,
        };
        data.momenten.push(huidigMoment);
        void bewaren();
        toonS3();
    }
    const grid = el("div", { class: "woorden-grid" });
    const verderKnop = el("button", { class: "knop", onclick: verder, disabled: true }, ["Verder"]);
    function verversVerderKnop() {
        verderKnop.disabled = gekozen.size === 0 && !eigenWoordTekst.trim();
    }
    function vulGrid() {
        // Zonder tekst: de woorden bij je tikpositie. Met tekst: de hele lijst
        // doorzocht (schermenoverzicht.md S2).
        const treffers = zoekWoorden(eigenWoordTekst);
        const lijst = eigenWoordTekst.trim() ? treffers : alleTonen ? alleWoorden() : nabij;
        grid.replaceChildren(...lijst.map((w) => el("button", {
            class: "woord-knop",
            "aria-pressed": gekozen.has(w.id),
            onclick: (e) => {
                if (gekozen.has(w.id))
                    gekozen.delete(w.id);
                else if (gekozen.size < 2)
                    gekozen.add(w.id);
                e.currentTarget.setAttribute("aria-pressed", String(gekozen.has(w.id)));
                verversVerderKnop();
            },
        }, [w.woord])));
    }
    vulGrid();
    verversVerderKnop();
    const alleWoordenKnop = el("button", {
        class: "knop-klein",
        onclick: () => {
            alleTonen = true;
            vulGrid();
            alleWoordenKnop.remove();
        },
    }, ["alle woorden"]);
    const zoekInvoer = el("input", {
        type: "text",
        placeholder: teksten.kompas.zoekveldPlaceholder,
        oninput: (e) => {
            eigenWoordTekst = e.target.value;
            vulGrid();
            verversVerderKnop();
        },
    });
    render([
        el("div", { class: "scherm" }, [
            // v25 — de kompaslus had van S2 tot S6 geen enkele weg terug: wie hem
            // eenmaal begon kon alleen nog afmaken of de app sluiten. Elk scherm
            // in de lus heeft nu hetzelfde terug-pijltje als de rest van de app.
            terugKnop(() => toonThuis()),
            el("p", { class: "vraag" }, [teksten.kompas.openingsvraag]),
            // v25 — de lijst laat maximaal twee woorden kiezen; een derde aantikken
            // deed simpelweg niets, zonder dat de app ooit zei waarom.
            el("p", { class: "zacht" }, [teksten.kompas.woordenOnderschrift]),
            zoekInvoer,
            grid,
            viaSchijf ? alleWoordenKnop : null,
            verderKnop,
            viaSchijf
                ? null
                : el("button", { class: "knop-klein", onclick: () => toonS1(tikPositie) }, ["nauwkeuriger aangeven met de cirkel"]),
        ]),
    ]);
}
/** v25 — het lopende moment weer uit het bestand halen. Nodig zodra je
 * binnen de kompaslus teruggaat naar de woordkeuze: het moment wordt in S2
 * al weggeschreven, en zonder dit zou een tweede keuze een tweede moment
 * achterlaten (en daarmee de Maandbrief laten dubbeltellen). Zelfde
 * opruiming als "dit klopt niet" al deed. */
export function verlaatHuidigMoment() {
    if (!huidigMoment)
        return;
    const idx = data.momenten.indexOf(huidigMoment);
    if (idx >= 0)
        data.momenten.splice(idx, 1);
    huidigMoment = null;
    void bewaren();
}
// ── S3 — Tijdvraag ────────────────────────────────────────────────────
function toonS3() {
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => {
                verlaatHuidigMoment();
                toonS2();
            }),
            el("p", { class: "vraag" }, [teksten.kompas.tijdvraag]),
            el("div", { class: "tijd-opties" }, teksten.kompas.tijdOpties.map((opt) => el("button", {
                class: "knop",
                onclick: () => {
                    if (huidigMoment)
                        huidigMoment.tijdBeschikbaar = opt.waarde;
                    void bewaren();
                    toonS4();
                },
            }, [opt.label]))),
        ]),
    ]);
}
// ── S4 — De Drie Deuren ───────────────────────────────────────────────
/**
 * Een deur kiezen voor het lopende moment: de gemeenschappelijke stap van De
 * Drie Deuren (S4) en van het voorstel na de gevoelscheck-in. Zet de gekozen
 * deur op het moment en gaat door naar de oefening (of, bij "niets doen", naar
 * het afsluiten) — dus ook het voorstel van de check-in loopt via S5 → S6 en
 * laat dezelfde ster achter als de kompaslus.
 */
export function kiesDeurNu(id) {
    if (!huidigMoment)
        return;
    huidigMoment.gekozenDeur = id;
    void bewaren();
    if (id === "niets-doen") {
        render([
            el("div", { class: "scherm" }, [el("p", { class: "vraag" }, [teksten.deuren.nietsDoen.bijKiezen])]),
        ]);
        naVertraging(1600, () => toonS7());
    }
    else {
        toonS5(id);
    }
}
/**
 * Waar S4 naartoe teruggaat: standaard de tijdvraag (S3), maar komt je hier
 * via de gevoelscheck-in, dan naar het voorstel. Alleen UI-staat.
 */
let s4Terug = null;
/**
 * De gevoelscheck-in maakt bij een keuze hetzelfde soort moment als de
 * kompaslus (woorden, zone, tijd), zodat de rotatie in de selectie, de
 * Maandbrief en de verankering ongewijzigd blijven werken. `deurId` is een
 * bewegingId, "niets-doen", of "andere" (dan opent De Drie Deuren).
 */
export function startMomentUitCheckIn(woordIds, zone, tijd, deurId, terug) {
    huidigeTikPositie = null;
    huidigMoment = {
        id: nieuwId("m"),
        tijdstip: new Date().toISOString(),
        woorden: woordIds,
        tijdBeschikbaar: tijd,
        zone,
        gekozenDeur: null,
        afsluitwoorden: [],
        verankeringszin: null,
    };
    data.momenten.push(huidigMoment);
    void bewaren();
    s4Terug = terug;
    if (deurId === "andere")
        toonS4();
    else
        kiesDeurNu(deurId);
}
export function toonS4(openWaarom = new Set()) {
    if (!huidigMoment)
        return toonThuis();
    const zone = huidigMoment.zone;
    const deuren = bepaalDeuren(zone, huidigMoment.tijdBeschikbaar, data, data.instellingen.islamitischeLaag, huidigMoment.woorden);
    const kiesDeur = kiesDeurNu;
    function ditKloptNiet(bewegingId) {
        registreerOnderdrukking(data, bewegingId, "dit_klopt_niet");
        // verwijder het lopende moment: het telt niet als afgeronde keuze
        if (huidigMoment) {
            const idx = data.momenten.indexOf(huidigMoment);
            if (idx >= 0)
                data.momenten.splice(idx, 1);
        }
        void bewaren();
        render([
            el("div", { class: "scherm" }, [el("p", { class: "vraag" }, [teksten.deuren.ditKloptNiet.appAntwoord])]),
        ]);
        // teksten.yaml: "opent het kompas opnieuw op dezelfde plek, klaar om te
        // verzetten" — niet op een leeg scherm, want dan verzet je niets maar
        // begin je opnieuw.
        naVertraging(1400, () => toonS1(huidigeTikPositie));
    }
    const kaarten = deuren.map((id) => {
        if (id === "niets-doen") {
            return el("button", { class: "deur", onclick: () => kiesDeur(id) }, [
                el("span", {}, [teksten.deuren.nietsDoen.titel]),
                el("span", { class: "deur-onderschrift" }, [teksten.deuren.nietsDoen.onderschrift]),
            ]);
        }
        const beweging = bewegingById(id);
        if (!beweging)
            return el("div", {}, []);
        // v25 — de concrete onderbouwing was op dít scherm nergens te zien: je
        // koos op titel en minuten, en kreeg de reden pas ná je keuze. Terwijl
        // dit precies het scherm is waar de app zegt "misschien helpt dit,
        // omdat…". Ingeklapt, zoals in de oefening zelf, zodat de drie deuren
        // gelijk in grootte en typografie blijven (selectie.yaml → niets_doen).
        const open = openWaarom.has(id);
        return el("div", { class: "deur" }, [
            el("button", { class: "deur-titel", onclick: () => kiesDeur(id) }, [beweging.titel]),
            el("span", { class: "deur-onderschrift" }, [`${beweging.kosten.tijdMinuten[0]}–${beweging.kosten.tijdMinuten[1]} min`]),
            el("div", { class: "deur-links" }, [
                el("button", {
                    class: "lengte-link",
                    onclick: () => {
                        const volgende = new Set(openWaarom);
                        if (open)
                            volgende.delete(id);
                        else
                            volgende.add(id);
                        toonS4(volgende);
                    },
                }, [open ? "waarom dit werkt −" : "waarom dit werkt +"]),
                el("button", { class: "lengte-link", onclick: () => ditKloptNiet(id) }, [
                    teksten.deuren.ditKloptNiet.knoptekst,
                ]),
            ]),
            open
                ? el("div", { class: "herkomst" }, [
                    ...beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel])),
                    ...(beweging.medischeGrens ?? []).map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel])),
                ])
                : null,
        ]);
    });
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => {
                if (s4Terug) {
                    const terug = s4Terug;
                    s4Terug = null;
                    verlaatHuidigMoment();
                    terug();
                }
                else {
                    toonS3();
                }
            }),
            el("p", { class: "vraag" }, [teksten.deuren.kop]),
            el("p", { class: "zacht" }, [teksten.deuren.onderschrift]),
            el("div", { class: "deuren" }, kaarten),
        ]),
    ]);
}
// ── S5 — Beweging uitvoeren ───────────────────────────────────────────
// v2.3 §2.8 / schermenoverzicht.md S5: "waar relevant een eenvoudige
// timer... geen voortgangsbalk met percentage, wel een rustige visuele
// indicatie." Alleen deze twee bewegingen — de vorm draagt de instructie,
// geen tekst en geen aftelling erbij. `.rustig` (CSS) zet de animatie uit,
// net als de systeeminstelling via prefers-reduced-motion.
function timerVisual(bewegingId) {
    if (bewegingId === "adem-lange-uitademing") {
        return el("div", {
            class: `timer-visual ademvorm${data.instellingen.rustigeBeelden ? " rustig" : ""}`,
        });
    }
    if (bewegingId === "savoring-zestig-seconden") {
        return el("div", {
            class: `timer-visual lichtpunt${data.instellingen.rustigeBeelden ? " rustig" : ""}`,
        });
    }
    return null;
}
function toonS5(bewegingId) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return toonS7();
    // v21: dezelfde inhoud als voorheen, maar stap voor stap in plaats van
    // als een muur tekst -- en met de onderbouwing ingeklapt (toonOefening).
    toonBeweging(bewegingId, {
        opKlaar: () => toonS6(beweging.streek),
        opTerug: () => toonS4(),
    });
}
// ── S6 — Verankeren ───────────────────────────────────────────────────
function toonS6(streek) {
    const canvas = el("canvas", { class: "schijf-canvas" });
    let afsluitpositie = null;
    const tekstveld = el("textarea", { placeholder: "wat deed je, of wat merkte je? (mag leeg blijven)" });
    function afronden() {
        if (!huidigMoment)
            return toonS7();
        const zin = tekstveld.value.trim();
        huidigMoment.verankeringszin = zin || null;
        if (afsluitpositie) {
            // afsluitwoorden zijn puur beschrijvend, geen score — dichtstbijzijnde woorden
            huidigMoment.afsluitwoorden = woordenNabij(afsluitpositie.energie, afsluitpositie.toon, 1).map((w) => w.id);
        }
        const nieuweSter = {
            id: nieuwId("s"),
            momentId: huidigMoment.id,
            streek,
            datum: new Date().toISOString().slice(0, 10),
            zin: zin || null,
        };
        data.sterren.push(nieuweSter);
        zojuistGemaakteSter = nieuweSter;
        void bewaren();
        toonS7();
    }
    // Het Verschil (v2.3 §2.2): zodra je je nieuwe plek hebt gekozen, toont
    // dezelfde schijf de twee punten met een dunne boog ertussen. Eén keer, in
    // ongeveer een seconde. Verschoof er nauwelijks iets, dan zegt de app dat
    // eerlijk in plaats van er een prestatie van te maken.
    const verschilRegel = el("p", { class: "zacht" }, [""]);
    let stopSchijf = null;
    let verschilGetoond = false;
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.deuren.afsluitvraag]),
            // v25 — dit was het enige kompas-scherm zonder de aslabels en de
            // uitleg: een kale cirkel met de vraag "waar ben je nu?" erboven en
            // niets dat zei wat boven, onder, links en rechts betekenen. S1 en
            // "Dag sluiten" gebruikten kompasVeld() al.
            el("p", { class: "zacht" }, [teksten.kompas.schijfUitleg]),
            kompasVeld(canvas),
            verschilRegel,
            tekstveld,
            el("button", { class: "knop", onclick: afronden }, ["Verder"]),
        ]),
    ]);
    function toonHetVerschil() {
        const van = huidigeTikPositie;
        const naar = afsluitpositie;
        if (verschilGetoond || !van || !naar)
            return;
        verschilGetoond = true;
        stopSchijf?.();
        tekenVerschil(canvas, van, naar, data.instellingen.rustigeBeelden);
        if (nauwelijksVerschoven(van, naar)) {
            verschilRegel.textContent = teksten.hetVerschil.nauwelijks;
        }
    }
    stopSchijf = tekenSchijf(canvas, (energie, toon) => {
        afsluitpositie = { energie, toon };
    }, {
        rustig: data.instellingen.rustigeBeelden,
        // Het Verschil verschijnt pas als je loslaat, niet tijdens het slepen.
        onKlaar: () => naVertraging(250, toonHetVerschil),
    });
}
// ── S7 — Afsluiten ────────────────────────────────────────────────────
// v2.5 §6.1 onderdeel 9 / v2.3 §3.1: het dimmen blijft de belangrijkste
// animatie van de app -- een rustig moment dat een handeling afsluit. Tot
// v23 bleef het scherm daarna permanent leeg (Wet 3: "je sluit de app
// zelf"), wat vóór v21 bij het oude S1-first-ontwerp hoorde. Sinds v21 is
// de app een doorlopende metgezel met een vaste navigatie (Nu/Doen/
// Terugkijken) -- een blijvend leeg scherm na elke afgeronde actie voelt
// dan niet als rust maar als een vastgelopen app. Op uitdrukkelijk verzoek
// gefixt: na het dimmen ga je terug naar het startscherm, niet naar niets.
export function toonS7() {
    rondLopendeAf();
    const nieuweSter = zojuistGemaakteSter;
    zojuistGemaakteSter = null;
    const kamerVanNieuweSter = nieuweSter ? kamerVanSter(nieuweSter, data) : null;
    const systeemRust = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // v27 (W5) — na een handeling die een ster opleverde dimt het scherm niet
    // naar zwart maar naar je hemel. Uit bij rustige beelden en bij reduced
    // motion; de Onderbreker en de herstelroute (geen ster) blijven zoals ze waren.
    if (kamerVanNieuweSter && !data.instellingen.rustigeBeelden && !systeemRust)
        return toonHuisOplichten(kamerVanNieuweSter);
    render([el("div", { class: "scherm", style: "min-height:60vh;width:100%;" }, [])]);
    dimEnDan(() => {
        toonThuis();
    });
}
// ── S8 — De Hemel ─────────────────────────────────────────────────────
// `netGetekend` laat het zojuist gemaakte sterrenbeeld één keer opkomen
// (v2.4 §11: draw-on van ±700 ms, daarna nooit meer animatie).
function tellingRegelTekst() {
    const nSterren = data.sterren.length;
    const nBeelden = data.sterrenbeelden.length;
    const sterWoord = nSterren === 1 ? "ster" : "sterren";
    if (nBeelden === 0)
        return `${nSterren} ${sterWoord}`;
    const beeldWoord = nBeelden === 1 ? "sterrenbeeld" : "sterrenbeelden";
    return `${nSterren} ${sterWoord} · ${nBeelden} ${beeldWoord}`;
}
/** De nieuwste ster met de datum van vandaag, of null. */
function sterVanVandaag() {
    const vandaag = huidigeDagSleutel();
    const van = data.sterren.filter((st) => st.datum === vandaag);
    return van.length ? van[van.length - 1] : null;
}
const STREEK_NAAM = {
    lichaam: "Lichaam",
    geest: "Geest",
    verbinding: "Verbinding",
    ziel: "Ziel",
};
/**
 * Wat er bij een aangetikte ster staat: de datum, wat je toen deed, en je
 * eigen zin. "Wat je deed" komt uit `ster.bewegingId` (nieuwe sterren) of via
 * het moment (oudere sterren uit de kompaslus); ontbreekt dat, dan de streek.
 */
function sterKaartTekst(ster) {
    const [j, m, d] = ster.datum.split("-").map(Number);
    const datum = j && m && d ? new Date(j, m - 1, d).toLocaleDateString("nl-BE", { day: "numeric", month: "long" }) : "";
    let wat = ster.bewegingId ? bewegingById(ster.bewegingId)?.titel : undefined;
    if (!wat && ster.momentId) {
        const deur = data.momenten.find((mo) => mo.id === ster.momentId)?.gekozenDeur;
        if (deur && deur !== "niets-doen")
            wat = bewegingById(deur)?.titel;
    }
    return {
        meta: [datum, wat ?? STREEK_NAAM[ster.streek]].filter(Boolean).join(" · "),
        zin: ster.zin?.trim() || null,
    };
}
export function toonS8(netGetekend = null) {
    const canvas = el("canvas", { class: "hemel-canvas" });
    if (data.sterren.length === 0) {
        render([
            el("div", { class: "scherm scherm-hemel", "data-kamer": "hemel" }, [
                terugKnop(() => toonThuis()),
                canvas,
                el("div", { class: "hemel-onder" }, [el("p", { class: "regel" }, [teksten.deHemel.legeHemel])]),
            ]),
        ]);
        // Ook een lege hemel krijgt de sfeer — atmosfeer en achtergrondsterren,
        // gewoon zonder eigen sterren en zonder tik-interactie. Wat komen gaat
        // vast krijgen, in plaats van een zwart vlak met tekst erop.
        tekenHemel(canvas, [], () => { }, { rustig: data.instellingen.rustigeBeelden });
        return;
    }
    // v27 (W7) — aantikken geeft nu een klein kaartje: datum · wat je deed · je
    // zin. Vroeger verscheen er alleen een regeltje, en alleen als je toen een
    // zin schreef — vaak dus niets.
    const zinRegel = el("div", { class: "hemel-zin" }, []);
    const tellingRegel = el("p", { class: "hemel-telling" }, [tellingRegelTekst()]);
    const aanbodStreek = netGetekend ? null : aanbodVoorStreek(data);
    const onderkant = el("div", { class: "hemel-onder" }, [tellingRegel, zinRegel]);
    render([el("div", { class: "scherm scherm-hemel", "data-kamer": "hemel" }, [terugKnop(() => toonThuis()), canvas, onderkant])]);
    const stop = tekenHemel(canvas, data.sterren, (ster) => {
        const kaart = sterKaartTekst(ster);
        zinRegel.replaceChildren(el("p", { class: "hemel-kaart-meta" }, [kaart.meta]));
        if (kaart.zin)
            zinRegel.append(el("p", { class: "hemel-kaart-zin" }, [kaart.zin]));
        // Eén korte, zachte opkomst per tik in plaats van een instant
        // tekstwissel — klasse eraf en meteen weer aan dwingt de animatie
        // ook te herstarten als je een volgende ster met dezelfde tekst tikt.
        zinRegel.classList.remove("hemel-zin--in");
        void zinRegel.offsetWidth;
        zinRegel.classList.add("hemel-zin--in");
    }, {
        sterrenbeelden: data.sterrenbeelden,
        nieuwSterrenbeeldId: netGetekend,
        rustig: data.instellingen.rustigeBeelden,
        // De ster van vandaag licht bij binnenkomst kort op.
        oplichtSterId: sterVanVandaag()?.id ?? null,
    });
    // Het aanbod komt ná de hemel zelf, als een vraag onderaan — nooit als
    // pop-up, nooit voor het beeld (Wet 5: de app dringt niet aan).
    if (aanbodStreek) {
        const aanbod = el("div", { class: "aanbod" }, [
            el("p", { class: "regel" }, [teksten.deHemel.sterrenbeeldAanbod.tekst]),
            el("div", { class: "aanbod-knoppen" }, [
                el("button", {
                    class: "knop",
                    onclick: () => {
                        stop();
                        toonS8Tekenmodus(aanbodStreek);
                    },
                }, [teksten.deHemel.sterrenbeeldAanbod.bijJa]),
                el("button", {
                    class: "knop-klein",
                    onclick: async () => {
                        data.sterrenbeeldAanbodAfgewezen = [
                            ...(data.sterrenbeeldAanbodAfgewezen ?? []),
                            aanbodStreek,
                        ];
                        await bewaren();
                        aanbod.replaceChildren(el("p", { class: "zacht" }, [teksten.deHemel.sterrenbeeldAanbod.bijNee]));
                    },
                }, [teksten.deHemel.sterrenbeeldAanbod.bijNeeKnop]),
            ]),
        ]);
        onderkant.prepend(aanbod);
    }
}
// ── S8, tekenmodus — sterrenbeeld tekenen (v1.1) ──────────────────────
// Geen apart scherm: dezelfde hemel, dezelfde sterposities, alleen de
// streek in kwestie is aantikbaar (schermenoverzicht.md S8, overgangen).
function toonS8Tekenmodus(streek) {
    const canvas = el("canvas", { class: "hemel-canvas" });
    const uitleg = el("p", { class: "zacht" }, [teksten.deHemel.tekenmodus.uitleg]);
    const ongedaanKnop = el("button", { class: "knop-klein", hidden: "hidden" }, [
        teksten.deHemel.tekenmodus.ongedaan,
    ]);
    const klaarKnop = el("button", { class: "knop", hidden: "hidden" }, [
        teksten.deHemel.tekenmodus.klaar,
    ]);
    const stoppenKnop = el("button", { class: "knop-klein" }, [
        teksten.deHemel.tekenmodus.stoppen,
    ]);
    const knoppen = el("div", { class: "aanbod-knoppen" }, [ongedaanKnop, klaarKnop, stoppenKnop]);
    render([el("div", { class: "scherm scherm-hemel", "data-kamer": "hemel" }, [canvas, el("div", { class: "hemel-onder" }, [uitleg, knoppen])])]);
    const modus = tekenSterrenbeeldModus(canvas, data.sterren, streek, (pad) => {
        // Eén lijn vraagt twee sterren; pas dan is er iets om te bewaren.
        ongedaanKnop.hidden = pad.length === 0;
        klaarKnop.hidden = pad.length < 2;
    }, data.instellingen.rustigeBeelden);
    ongedaanKnop.addEventListener("click", () => modus.ongedaanMaken());
    stoppenKnop.addEventListener("click", () => {
        modus.stop();
        toonS8();
    });
    klaarKnop.addEventListener("click", () => {
        const pad = modus.pad();
        modus.stop();
        toonS8Naamgeven(streek, pad);
    });
}
// ── S8, naamgeven — de tweede helft van het aanbod ────────────────────
function toonS8Naamgeven(streek, sterIds) {
    const veld = el("input", {
        type: "text",
        class: "naam-veld",
        placeholder: teksten.deHemel.tekenmodus.naamPlaceholder,
        maxlength: 60,
    });
    async function bewarenSterrenbeeld() {
        data.sterrenbeelden = [
            ...data.sterrenbeelden,
            {
                id: nieuwId("sb"),
                streek,
                naam: veld.value.trim(),
                sterIds,
                aangemaaktOp: new Date().toISOString(),
            },
        ];
        await bewaren();
        toonS8(data.sterrenbeelden[data.sterrenbeelden.length - 1].id);
    }
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.deHemel.tekenmodus.naamvraag]),
            veld,
            el("button", { class: "knop", onclick: () => void bewarenSterrenbeeld() }, [
                teksten.deHemel.tekenmodus.bewaren,
            ]),
        ]),
    ]);
    veld.focus();
}
// ── S12 — De Maandbrief ───────────────────────────────────────────────
// v2.4 §11: puur typografie, eerste regel serif, de rest sans, op de gewone
// achtergrond. Geen illustratie, geen icoon, geen animatie. De brief is de
// enige plek in de app waar tekst het hele scherm mag hebben.
//
// `vanuitArchief` bepaalt waar "sluiten" heen gaat: een brief die je zelf uit
// het archief opende brengt je terug naar dat archief (twaalf brieven achter
// elkaar lezen is het eigenlijke product), maar de brief van de maand eindigt
// zoals alles in deze app eindigt — met sluiten (v2.4 §9, "geen vervolgscherm").
export function toonS12(brief, vanuitArchief) {
    if (!brief.gelezen) {
        brief.gelezen = true;
        void bewaren();
    }
    const [opschrift, ...rest] = [briefOpschrift(brief, data.brieven ?? []), ...brief.alineas];
    render([
        el("div", { class: "scherm brief-scherm" }, [
            vanuitArchief ? terugKnop(() => toonS13()) : null,
            el("h1", { class: "brief-opschrift" }, [opschrift]),
            el("div", { class: "brief-tekst" }, rest.map((alinea) => el("p", {}, [alinea]))),
            vanuitArchief
                ? null
                : el("button", { class: "knop-klein", onclick: () => toonS7() }, [teksten.deBrief.sluiten]),
        ]),
    ]);
}
// ── S13 — De brieven ──────────────────────────────────────────────────
// Het archief. Alleen opschriften, oudste bovenaan — geen samenvatting, geen
// aantal, geen zoekveld (v2.5 §5.3 en §5.4: brieven worden nooit gearchiveerd
// of gewist, en er valt niets te filteren).
export function toonS13() {
    const brieven = data.brieven ?? [];
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonTerugkijken()),
            el("div", { class: "brieven-lijst" }, brieven.map((brief) => el("button", { class: "brief-regel", onclick: () => toonS12(brief, true) }, [
                briefOpschrift(brief, brieven),
            ]))),
        ]),
    ]);
}
// ── S14 — Het Weekmoment (De Spiegel) ─────────────────────────────────
// v2.0 §9.1 punt 8, Pijler 5. De beeldoefening: beeld, werkelijkheid, plan —
// nooit alleen het eerste deel — en aan het eind een eigen keuze uit de
// bibliotheek: iets wat je deze week in het echte leven doet, niet in de
// app. Op eigen initiatief bereikbaar vanaf S1, zoals De Hemel en de brief
// (v2.2 Wet 5): geen automatische pop-up, geen badge, geen aandringen.
export function toonS14Intro() {
    render([
        el("div", { class: "scherm" }, [
            el("h1", { class: "brief-opschrift" }, [teksten.weekmoment.intro.kop]),
            el("p", { class: "vraag" }, [teksten.weekmoment.intro.uitleg]),
            el("div", { class: "herkomst" }, [teksten.weekmoment.herkomst.W, teksten.weekmoment.herkomst.P].map((regel) => el("p", { class: "herkomst-regel" }, [regel]))),
            el("button", { class: "knop", onclick: () => toonS14Beeld() }, [teksten.weekmoment.intro.begin]),
            el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.weekmoment.intro.nuNiet]),
        ]),
    ]);
}
// v25 — de spiegel liep over vier schermen zonder stap-aanduiding, zonder
// terugknop en zonder dat je tekst bleef staan als je terugging: de WOOP-flow
// en "Dag sluiten" kregen dat alle drie wel. Dezelfde drie dingen nu ook hier.
function toonS14Beeld(beeld = "") {
    const veld = el("textarea", { placeholder: teksten.weekmoment.beeld.placeholder });
    veld.value = beeld;
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS14Intro()),
            ...stapKop(teksten.weekmoment.stapLabel, 1, 4),
            el("p", { class: "vraag" }, [teksten.weekmoment.beeld.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => toonS14Werkelijkheid(veld.value),
            }, ["Verder"]),
        ]),
    ]);
}
function toonS14Werkelijkheid(beeld, werkelijkheid = "") {
    const veld = el("textarea", { placeholder: teksten.weekmoment.werkelijkheid.placeholder });
    veld.value = werkelijkheid;
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS14Beeld(beeld)),
            ...stapKop(teksten.weekmoment.stapLabel, 2, 4),
            el("p", { class: "vraag" }, [teksten.weekmoment.werkelijkheid.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => toonS14Plan(beeld, veld.value),
            }, ["Verder"]),
        ]),
    ]);
}
function toonS14Plan(beeld, werkelijkheid, plan = "") {
    const veld = el("textarea", { placeholder: teksten.weekmoment.plan.placeholder });
    veld.value = plan;
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS14Werkelijkheid(beeld, werkelijkheid)),
            ...stapKop(teksten.weekmoment.stapLabel, 3, 4),
            el("p", { class: "vraag" }, [teksten.weekmoment.plan.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => toonS14Actie(beeld, werkelijkheid, veld.value),
            }, ["Verder"]),
        ]),
    ]);
}
// Geen algoritme dat hier iets "aanbeveelt" op basis van de werkelijkheid die
// je intypte — een combinatie beweging+reflectie is spoor W19 (v2.2 §10.2),
// nog niet onderzocht. De hele bibliotheek, jouw keuze.
function toonS14Actie(beeld, werkelijkheid, plan) {
    // v25 — dezelfde vrije keuze uit de héle bibliotheek (v2.2 §11: geen
    // algoritme dat hier iets aanbeveelt), maar nu gegroepeerd per domein en
    // met duur en minimumversie erbij, in plaats van drieëntwintig titels
    // achter elkaar zonder enige oriëntatie.
    toonBewegingBibliotheek({
        vraag: teksten.weekmoment.actie.vraag,
        kort: [],
        alleenBibliotheek: true,
        opTerug: () => toonS14Plan(beeld, werkelijkheid, plan),
        kies: (id) => {
            data.weekmomenten = [...(data.weekmomenten ?? []), schrijfWeekmoment(beeld, werkelijkheid, plan, id)];
            void bewaren();
            toonS14Afsluiting(plan, id);
        },
    });
}
function toonS14Afsluiting(plan, bewegingId) {
    const beweging = bewegingById(bewegingId);
    const schuldval = data.instellingen.islamitischeLaag
        ? teksten.weekmoment.schuldval
        : teksten.weekmoment.schuldvalNeutraal;
    render([
        el("div", { class: "scherm brief-scherm" }, [
            el("h1", { class: "brief-opschrift" }, [teksten.weekmoment.samenvattingKop]),
            el("div", { class: "brief-tekst" }, [
                beweging ? el("p", {}, [beweging.titel]) : null,
                plan.trim() ? el("p", { class: "zacht" }, [plan.trim()]) : null,
            ]),
            el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [schuldval])]),
            el("button", { class: "knop-klein", onclick: () => toonS7() }, [teksten.weekmoment.klaar]),
        ]),
    ]);
}
// ── S15 — De Onderbreker ──────────────────────────────────────────────
// v2.2 §3, Wet 8. Altijd bereikbaar vanaf S1 — scrollen kondigt zich niet
// aan. Schrijft nooit naar het datamodel: "hij houdt niet bij hoe vaak dit
// gebeurt". Geen crisiscontrole, geen Kompas, geen zone — dit moet in
// dertig seconden kunnen, niet door de hele dagelijkse lus heen.
export function toonS15Onderbreker() {
    // Stateless (Wet 8): wat je hier doet telt nooit als "gedaan vandaag".
    lopendeSuggestie = null;
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.onderbreker.vraag]),
            el("textarea", { placeholder: teksten.onderbreker.placeholder }),
            el("div", { class: "herkomst" }, [
                el("p", { class: "herkomst-regel" }, [teksten.onderbreker.herkomst.nadelen]),
                el("p", { class: "herkomst-regel" }, [teksten.onderbreker.herkomst.W]),
            ]),
            // v25 — het als-dan-plan uit de WOOP-flow stond na het opschrijven
            // nergens meer in de app: je maakte het één keer en zag het daarna
            // alleen terug als je er zelf naartoe navigeerde. Een
            // implementatie-intentie werkt juist doordat je hem tegenkomt op het
            // moment van wrijving — en dit ís dat moment.
            data.doel
                ? el("div", { class: "herkomst" }, [
                    el("p", { class: "herkomst-regel" }, [
                        `${teksten.nuRegels.plan}: als ${data.doel.planAls}, dan ${data.doel.planDan}.`,
                    ]),
                ])
                : null,
            el("button", { class: "knop", onclick: () => toonS15BewustDoor() }, [teksten.onderbreker.bewustDoor]),
            el("button", { class: "knop-klein", onclick: () => toonS15AndersDoen() }, [teksten.onderbreker.andersDoen]),
        ]),
    ]);
}
// "Bewust doorgaan" is geen belofte die de app kan afdwingen — een PWA kan
// een andere app niet blokkeren. Het is een eigen intentie, hardop gezegd.
function toonS15BewustDoor() {
    const kies = (tijd) => {
        render([
            el("div", { class: "scherm" }, [
                el("p", { class: "vraag" }, [teksten.onderbreker.tijdBevestiging.replace("{tijd}", tijd)]),
                el("button", { class: "knop", onclick: () => toonS7() }, [teksten.onderbreker.doorgaan]),
            ]),
        ]);
    };
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.onderbreker.tijdVraag]),
            el("div", { class: "deuren" }, teksten.onderbreker.tijdOpties.map((tijd) => el("button", { class: "knop-klein", onclick: () => kies(tijd) }, [tijd]))),
        ]),
    ]);
}
// "Iets anders doen" (v2.2 §3, punt 3: "vervanging, niet onthouding" — de
// onderbreker biedt altijd één concrete andere handeling aan). Dezelfde
// volledige bibliotheek als het weekmoment, om dezelfde reden: geen
// algoritme dat hier iets kiest, de keuze blijft van jou.
function toonS15AndersDoen() {
    toonBewegingKeuze({
        vraag: teksten.onderbreker.andersDoenVraag,
        kort: KORT_ONDERBREKER,
        kies: (id) => toonS15Beweging(id),
        opTerug: () => toonS15Onderbreker(),
    });
}
// Toont dezelfde beweging als S5 (script, minimumversie, herkomst), maar
// sluit direct af via S7 in plaats van door te gaan naar S6 — er is hier
// geen moment en geen zone om aan te verankeren, en dat hoeft ook niet:
// dit is een onderbreking, geen sessie.
function toonS15Beweging(bewegingId) {
    // v25 — dit scherm toonde het hele script, de minimumversie, de herkomst
    // en de medische grens tegelijk: precies de muur tekst die v21 op S5 al
    // had opgeruimd, alleen niet hier. Nu dezelfde stap-voor-stap-lezer als
    // overal elders. Blijft stateless (Wet 8): geen moment, geen ster.
    toonBeweging(bewegingId, {
        opKlaar: () => toonS7(),
        opTerug: () => toonS15AndersDoen(),
    });
}
// ── S16 — Meer (verwijderd in v25) ───────────────────────────────────
// Dit scherm was het stille toegangspunt uit v1.1-meer.md. Sinds v21 doet de
// vaste navigatiebalk (Nu · Doen · Terugkijken) dat werk, en werd S16 door
// niets meer aangeroepen: dode code die bij elke volgende ronde opnieuw moest
// worden meegelezen. De teksten (`teksten.meer.*`) blijven staan — de
// perfectionisme-check en Frictie gebruiken die nog.
// ── S17 — De perfectionisme-check ─────────────────────────────────────
// v2.2 Wet 7, laatste punt. Eén vraag, geen vervolgvraag over waarom — dat
// zou zelf het soort uitpluizen zijn dat Wet 6 en Wet 7 allebei uitsluiten.
// Hooguit één per kalendermaand (meer.ts). Elk pad eindigt in S7.
export function toonS17PerfectionismeCheck() {
    function eindigen() {
        naVertraging(1200, () => toonS7());
    }
    function toonAfsluitregel(tekst) {
        render([el("div", { class: "scherm" }, [el("p", { class: "vraag" }, [tekst])])]);
        eindigen();
    }
    function alsHulp() {
        registreerPerfectionismeCheck(data, "als_hulp");
        void bewaren();
        toonAfsluitregel(teksten.perfectionismeCheck.alsHulpAntwoord);
    }
    function alsVerplichting() {
        registreerPerfectionismeCheck(data, "als_verplichting");
        void bewaren();
        render([
            el("div", { class: "scherm" }, [
                el("p", { class: "vraag" }, [teksten.perfectionismeCheck.aanbod]),
                el("button", {
                    class: "knop",
                    onclick: async () => {
                        data.instellingen.weekmomentAan = false;
                        await bewaren();
                        toonAfsluitregel(teksten.perfectionismeCheck.aanbodJaBevestiging);
                    },
                }, [teksten.perfectionismeCheck.aanbodJa]),
                el("button", { class: "knop-klein", onclick: () => toonAfsluitregel(teksten.perfectionismeCheck.aanbodNeeBevestiging) }, [
                    teksten.perfectionismeCheck.aanbodNee,
                ]),
            ]),
        ]);
    }
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.perfectionismeCheck.vraag]),
            el("button", { class: "knop", onclick: alsHulp }, [teksten.perfectionismeCheck.alsHulp]),
            el("button", { class: "knop-klein", onclick: alsVerplichting }, [teksten.perfectionismeCheck.alsVerplichting]),
        ]),
    ]);
}
// ── S18 — Frictie in de wereld ────────────────────────────────────────
// v2.2 Wet 8, punt 2. Vier concrete, niet-aanklikbare suggesties — de app
// voert er niets van uit. Onthoudt alleen dát het aanbod deze maand gedaan
// is, nooit welke suggestie gekozen is of of hij is uitgevoerd (meer.ts).
export function toonS18Frictie() {
    render([
        el("div", { class: "scherm" }, [
            el("h1", { class: "brief-opschrift" }, [teksten.frictie.kop]),
            el("p", { class: "vraag" }, [teksten.frictie.intro]),
            el("div", { class: "regels" }, teksten.frictie.suggesties.map((s) => el("p", { class: "regel" }, [s]))),
            el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [teksten.frictie.herkomst.W])]),
            el("button", {
                class: "knop",
                onclick: () => {
                    registreerFrictieAangeboden(data);
                    void bewaren();
                    toonS7();
                },
            }, [teksten.frictie.gezien]),
        ]),
    ]);
}
// ── S19 — De herstelroute ("ik ben eruit gevallen") ────────────────────
// v2.md §9.1 punt 12: "60 seconden: normaliseren, kleinste stap, verder."
// Gespiegeld aan de React-versie (v20). Schrijft, net als De Onderbreker,
// bewust niets naar het datamodel (Wet 4: geen teller van hoe vaak je
// "eruit valt").
export function toonS19Normaliseren() {
    // Stateless (Wet 4): de herstelroute houdt niets bij.
    lopendeSuggestie = null;
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.herstelroute.normaliseren]),
            el("button", { class: "knop", onclick: () => toonS19KleinsteStap() }, [teksten.herstelroute.verder]),
        ]),
    ]);
}
function toonS19KleinsteStap() {
    toonBewegingKeuze({
        vraag: teksten.herstelroute.kleinsteStapVraag,
        kort: KORT_HERSTEL,
        kies: (id) => toonS19Beweging(id),
        opTerug: () => toonS19Normaliseren(),
        extra: () => el("button", { class: "knop-klein", onclick: () => toonS19Verder() }, [teksten.herstelroute.geenStapNu]),
    });
}
function toonS19Beweging(bewegingId) {
    // v25 — zelfde reparatie als bij De Onderbreker: stap voor stap in plaats
    // van alles tegelijk. Blijft stateless (Wet 4, geen teller van hoe vaak je
    // "eruit valt").
    toonBeweging(bewegingId, {
        opKlaar: () => toonS19Verder(),
        opTerug: () => toonS19KleinsteStap(),
    });
}
function toonS19Verder() {
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.herstelroute.verderTekst]),
            el("button", { class: "knop", onclick: () => toonS7() }, [teksten.herstelroute.klaar]),
        ]),
    ]);
}
// ── S20 — "Wie ik word" ─────────────────────────────────────────────────
// v2.md §9.1 punt 10. Eén zelfgeschreven zin, altijd overschrijfbaar. De
// bewijslijst-functie bestaat al als De Hemel (S8); hier alleen een link.
export function toonS20WieIkWord() {
    const veld = el("textarea", { placeholder: teksten.wieIkWord.placeholder });
    veld.value = data.wieIkWord ?? "";
    const melding = el("p", { class: "zacht" }, [""]);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonKamer("visie")),
            el("p", { class: "vraag" }, [teksten.wieIkWord.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => {
                    data.wieIkWord = veld.value.trim() || null;
                    void bewaren();
                    melding.textContent = teksten.wieIkWord.bewaard;
                },
            }, [teksten.wieIkWord.bewaren]),
            melding,
            el("button", { class: "knop-klein", onclick: () => toonS8() }, [teksten.wieIkWord.bewijslijst]),
        ]),
    ]);
}
// ── S21 — Kwaliteiten ("verlangen van de periode") ──────────────────────
// v2.md §9.1 punt 9, Masterplan-v2.md §7.3. Het enige echte MVP-gat
// (Onderzoek-I6-Hal-Maqam.md, Audit-MVP-Scope-9-september-2026.md).
// Islamitische naam alleen zichtbaar met de laag aan. Geen vaste cadans.
export function toonS21Kwaliteiten() {
    const islamAan = data.instellingen.islamitischeLaag;
    const n = kwaliteiten.length;
    const opgeslagen = () => data.verlangenVanDePeriode?.kwaliteitId ?? null;
    // Wat je nu aanwijst; nog niet bewaard tot je "Dit is het" tikt. Zo kun je
    // rondkijken zonder dat elke tik je periode overschrijft.
    let keuze = opgeslagen();
    const midden = el("div", { class: "kwaliteit-midden" }, []);
    const bevestig = el("button", { class: "knop" }, ["Dit is het"]);
    // v27 (W6) — een ring waarop je één kwaliteit kiest, in plaats van een
    // raster met chips. Eén keer per periode, dus het mag iets voorstellen.
    const punten = kwaliteiten.map((k, i) => {
        const hoek = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const punt = el("button", {
            class: "kwaliteit-punt",
            "aria-label": islamAan && k.islamNaam ? `${k.naam} (${k.islamNaam})` : k.naam,
            "data-id": k.id,
            onclick: () => {
                keuze = k.id;
                teken();
            },
        }, [el("span", { class: "kwaliteit-stip" }, [])]);
        punt.style.setProperty("--x", `${50 + 44 * Math.cos(hoek)}%`);
        punt.style.setProperty("--y", `${50 + 44 * Math.sin(hoek)}%`);
        return punt;
    });
    function teken() {
        const k = keuze ? kwaliteitById(keuze) : undefined;
        midden.replaceChildren(k
            ? el("p", { class: "kwaliteit-naam" }, [k.naam])
            : el("p", { class: "kwaliteit-hint" }, ["Tik een punt aan."]));
        if (k && islamAan && k.islamNaam) {
            midden.append(el("p", { class: "kwaliteit-islam" }, [k.islamUitleg ? `${k.islamNaam} — ${k.islamUitleg}` : k.islamNaam]));
        }
        for (const punt of punten) {
            const id = punt.getAttribute("data-id");
            punt.setAttribute("aria-pressed", String(id === keuze));
            punt.classList.toggle("bewaard", id === opgeslagen());
        }
        const alBewaard = keuze !== null && keuze === opgeslagen();
        bevestig.disabled = keuze === null || alBewaard;
        bevestig.textContent = alBewaard ? "Dit is je verlangen nu" : "Dit is het";
    }
    bevestig.addEventListener("click", () => {
        if (!keuze)
            return;
        data.verlangenVanDePeriode = { kwaliteitId: keuze, sinds: new Date().toISOString() };
        void bewaren();
        teken();
    });
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonKamer("visie")),
            el("p", { class: "vraag" }, [teksten.kwaliteiten.vraag]),
            el("p", { class: "zacht" }, [teksten.kwaliteiten.onderschrift]),
            el("div", { class: "kwaliteit-ring" }, [midden, ...punten]),
            bevestig,
        ]),
    ]);
    teken();
}
// ── S22 — Ochtend: Richting ──────────────────────────────────────────────
// v2.md §9.1 punt 6, v2.3 §2.4 "Het Ritme". De boog met gebedstijden-
// inkepingen staat hier (nog) niet: die vereist `adhan-js`, dat in deze
// omgeving niet te installeren was (geen npm-registry-toegang) — zie
// Fase-3-Bouw-status.md v20. Deze tekstuele versie van S22 is functioneel
// wel compleet: intentie, kerntaak, het gekozen verlangen in beeld.
export function toonS22Ochtend() {
    const intentieVeld = el("input", { type: "text", placeholder: teksten.ochtend.intentiePlaceholder });
    const kerntaakVeld = el("textarea", { placeholder: teksten.ochtend.kerntaakPlaceholder });
    const kwaliteit = data.verlangenVanDePeriode ? kwaliteitById(data.verlangenVanDePeriode.kwaliteitId) : null;
    const islamAan = data.instellingen.islamitischeLaag;
    // v22: hetzelfde lichte fragment als op het startscherm, alleen als de
    // ochtend-toggle aan staat.
    const fragment = data.visie && visieCheckInsVoor(data).ochtend ? visieFragment(data.visie, new Date(), data.instellingen.islamitischeLaag) : null;
    function klaar() {
        data.ochtendMomenten = data.ochtendMomenten ?? [];
        data.ochtendMomenten.push({
            id: nieuwId("o"),
            datum: huidigeDagSleutel(),
            intentie: intentieVeld.value.trim() || null,
            kerntaak: kerntaakVeld.value.trim() || null,
        });
        void bewaren();
        // Life Maxing 2.0 — na je intentie mag je zeggen hoe je je voelt, dan komt er
        // een voorstel voor de ochtend. Overslaan kan altijd (dan gewoon afsluiten).
        toonCheckIn("ochtend");
    }
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonThuis()),
            el("h1", { class: "brief-opschrift" }, [teksten.ochtend.kop]),
            fragment ? el("p", { class: "opmerking" }, [`${fragment.label}: ${fragment.tekst}`]) : null,
            kwaliteit
                ? el("p", { class: "zacht" }, [
                    islamAan && kwaliteit.islamNaam ? `${kwaliteit.naam} (${kwaliteit.islamNaam})` : kwaliteit.naam,
                ])
                : el("div", {}, [
                    el("span", { class: "zacht" }, [teksten.ochtend.geenVerlangen + " "]),
                    el("button", { class: "knop-klein", onclick: () => toonS21Kwaliteiten() }, [teksten.ochtend.kiesVerlangen]),
                ]),
            el("p", { class: "vraag" }, [teksten.ochtend.intentieVraag]),
            intentieVeld,
            el("p", { class: "vraag" }, [teksten.ochtend.kerntaakVraag]),
            kerntaakVeld,
            el("button", { class: "knop", onclick: klaar }, [teksten.ochtend.klaar]),
        ]),
    ]);
}
function avondVisieBlok() {
    // v22: 's avonds de volledige visie teruglezen (geen invoer, alleen
    // lezen) — het enige dagdeel met de volle tekst, zie het plan.
    const visieRegels = data.visie
        ? visieDelen(data.visie, data.instellingen.islamitischeLaag).map((d) => `${d.def.stam} ${d.tekst}`)
        : [];
    if (!data.visie || !visieCheckInsVoor(data).avond || visieRegels.length === 0)
        return null;
    return el("div", { class: "herkomst" }, visieRegels.map((r) => el("p", { class: "herkomst-regel" }, [r])));
}
/** Schrijft de tussentijdse "Dag sluiten"-invoer weg zodat niets verloren
 * gaat als de app hier wordt gesloten — zie ConceptDagsluiting in types.ts. */
function bewaarConceptDagsluiting(state) {
    data.conceptDagsluiting = {
        positie: state.positie,
        chips: [...state.chips],
        dankbaarheid: state.dankbaarheid,
        zin: state.zin,
        voorMorgen: state.voorMorgen,
    };
    void bewaren();
}
export function toonS23AvondSluiten() {
    const concept = data.conceptDagsluiting;
    toonS23Stap1Kompas(concept
        ? {
            positie: concept.positie,
            chips: new Set(concept.chips),
            dankbaarheid: concept.dankbaarheid,
            zin: concept.zin,
            voorMorgen: concept.voorMorgen,
        }
        : { positie: null, chips: new Set(), dankbaarheid: "", zin: "", voorMorgen: "" });
}
function toonS23Stap1Kompas(state) {
    const canvas = el("canvas", { class: "schijf-canvas" });
    const visieBlok = avondVisieBlok();
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonThuis()),
            ...stapKop(teksten.avondSluiten.kop, 1, 5),
            visieBlok ? el("div", {}, [el("p", { class: "vraag" }, [teksten.avondSluiten.visieKop]), visieBlok]) : null,
            el("p", { class: "vraag" }, [teksten.avondSluiten.kompasVraag]),
            el("p", { class: "zacht" }, [teksten.kompas.schijfUitleg]),
            kompasVeld(canvas),
            el("button", {
                class: "knop",
                onclick: () => { bewaarConceptDagsluiting(state); toonS23Stap2Chips(state); },
            }, ["Volgende"]),
        ]),
    ]);
    tekenSchijf(canvas, (energie, toon) => {
        state.positie = { energie, toon };
    }, { rustig: data.instellingen.rustigeBeelden, beginPositie: state.positie });
}
function toonS23Stap2Chips(state) {
    const chipsGrid = el("div", { class: "woorden-grid" });
    function vulChips() {
        chipsGrid.replaceChildren(...teksten.avondSluiten.chips.map((c) => el("button", {
            class: "woord-knop",
            "aria-pressed": state.chips.has(c.id),
            onclick: () => {
                if (state.chips.has(c.id))
                    state.chips.delete(c.id);
                else
                    state.chips.add(c.id);
                vulChips();
            },
        }, [c.label])));
    }
    vulChips();
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS23Stap1Kompas(state)),
            ...stapKop(teksten.avondSluiten.kop, 2, 5),
            el("p", { class: "vraag" }, [teksten.avondSluiten.chipsVraag]),
            chipsGrid,
            el("button", {
                class: "knop",
                onclick: () => { bewaarConceptDagsluiting(state); toonS23Stap3Dank(state); },
            }, ["Volgende"]),
        ]),
    ]);
}
function toonS23Stap3Dank(state) {
    const veld = el("textarea", { placeholder: teksten.avondSluiten.dankbaarheidPlaceholder });
    veld.value = state.dankbaarheid;
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => { state.dankbaarheid = veld.value; toonS23Stap2Chips(state); }),
            ...stapKop(teksten.avondSluiten.kop, 3, 5),
            el("p", { class: "vraag" }, [teksten.avondSluiten.dankbaarheidVraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => {
                    state.dankbaarheid = veld.value;
                    bewaarConceptDagsluiting(state);
                    toonS23Stap4Zin(state);
                },
            }, ["Volgende"]),
        ]),
    ]);
}
function toonS23Stap4Zin(state) {
    const veld = el("textarea", { placeholder: teksten.avondSluiten.zinPlaceholder });
    veld.value = state.zin;
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => { state.zin = veld.value; toonS23Stap3Dank(state); }),
            ...stapKop(teksten.avondSluiten.kop, 4, 5),
            el("p", { class: "vraag" }, [teksten.avondSluiten.zinVraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => {
                    state.zin = veld.value;
                    bewaarConceptDagsluiting(state);
                    toonS23Stap5VoorMorgen(state);
                },
            }, ["Volgende"]),
        ]),
    ]);
}
function toonS23Stap5VoorMorgen(state) {
    const veld = el("textarea", { placeholder: teksten.avondSluiten.voorMorgenPlaceholder });
    veld.value = state.voorMorgen;
    function klaar() {
        state.voorMorgen = veld.value;
        data.dagsluitingen = data.dagsluitingen ?? [];
        data.dagsluitingen.push({
            id: nieuwId("d"),
            datum: huidigeDagSleutel(),
            positie: state.positie,
            chips: [...state.chips],
            dankbaarheid: state.dankbaarheid.trim() || null,
            zin: state.zin.trim() || null,
            voorMorgen: state.voorMorgen.trim() || null,
        });
        data.conceptDagsluiting = null;
        void bewaren();
        // Ayat al-Kursi hoort vlak voor het slapen, als allerlaatste — dus na
        // het sluiten van de dag, niet ernaast als los alternatief (adhkar.ts:
        // "wanneer": "voor het slapen"). Alleen met de islamitische laag aan;
        // zonder die laag dimt de app direct, zoals voorheen.
        toonAvondRoutine();
    }
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => { state.voorMorgen = veld.value; toonS23Stap4Zin(state); }),
            ...stapKop(teksten.avondSluiten.kop, 5, 5),
            el("p", { class: "vraag" }, [teksten.avondSluiten.voorMorgenVraag]),
            veld,
            el("button", { class: "knop", onclick: klaar }, [teksten.avondSluiten.klaar]),
        ]),
    ]);
}
// ══════════════════════════════════════════════════════════════════════
// v22 — De Visie: een zelfgeschreven "toekomst in het nu" bij onboarding.
// Zie het plan (serialized-toasting-iverson.md): mentale contrastering
// (Oettingen) laat zien dat een wens alleen visualiseren de inspanning kan
// verlágen. Dit blijft daarom een identiteitsbeeld (zoals wieIkWord), nooit
// een dagelijks herhaalritueel — het fragment op Nu/Ochtend wisselt, en de
// brug naar een concreet doel (Doel, met obstakel en plan) is een vrije
// link, geen automatische stap. Volledig optioneel: elk scherm hieronder
// heeft een uitgang die niets vastlegt.
// ══════════════════════════════════════════════════════════════════════
// ── Hulpjes voor de schermen ─────────────────────────────────────────
const TERUG_ICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
/** Eén consistent terug-pijltje linksboven — vervangt overal een los
 * tekstlinkje ("← terug", "Terug"), soms onderaan het scherm. Altijd het
 * eerste element van het scherm, altijd hetzelfde icoon. */
export function terugKnop(actie) {
    return el("button", { class: "terug-knop", onclick: actie, "aria-label": "Terug", html: TERUG_ICOON }, []);
}
export function voerSuggestieUit(s) {
    // "rust" ("Het is laat") heeft geen actie. De andere suggesties worden pas
    // als gedaan geregistreerd zodra je ze afrondt (rondLopendeAf).
    if (s.soort !== "rust") {
        lopendeSuggestie = { dagdeel: dagdeelGroep(dagdeelVan()), sleutel: suggestieSleutel(s) };
    }
    switch (s.soort) {
        case "ochtend":
            return toonS22Ochtend();
        case "avond":
            return toonS23AvondSluiten();
        case "beweging": {
            if (!s.id)
                return;
            // De begeleiding leidt je naar de juiste kamer: de oefening opent in de
            // sfeer van die kamer en "terug" brengt je daar, niet in de hal.
            const kamer = kamerVanBeweging(s.id, themas, Boolean(bewegingById(s.id)?.herkomst.some((h) => h.label === "I")));
            if (kamer)
                document.body.dataset.kamer = kamer.id;
            toonBeweging(s.id, { opKlaar: () => toonVrijeAfronding(s.id), opTerug: () => (kamer ? toonKamer(kamer.id) : toonThuis()) });
            return;
        }
        case "dhikr":
            if (s.id) {
                document.body.dataset.kamer = "geloof";
                toonDhikr(s.id, () => toonKamer("geloof"));
            }
            return;
        case "kompas":
            return toonCheckIn("middag");
        case "week":
            return toonS14Intro();
        case "brief": {
            const b = ongelezenBrief(data);
            if (b)
                toonS12(b, false);
            return;
        }
        case "rust":
            return;
    }
}
export function duurTekst(bewegingId) {
    const b = bewegingById(bewegingId);
    if (!b)
        return "";
    const [van, tot] = b.kosten.tijdMinuten;
    return van === tot ? `${van} min` : `${van}–${tot} min`;
}
function stappenVan(script) {
    const delen = script
        .split(/(?<=[.!?])\s+/)
        .map((d) => d.trim())
        .filter(Boolean);
    const stappen = [];
    for (const deel of delen) {
        const vorige = stappen[stappen.length - 1];
        // Losse flarden ("Twee minuten, niet langer.") plakken aan de vorige stap
        // vast; een stap moet een handeling zijn, geen halve zin.
        if (vorige && vorige.length < 32)
            stappen[stappen.length - 1] = `${vorige} ${deel}`;
        else
            stappen.push(deel);
    }
    return stappen.length > 0 ? stappen : [script];
}
/**
 * v27 (W2.3) — de medische grens van een beweging, elke keer zichtbaar
 * (veiligheid.md §4: niet weggeklapt). Gedeeld door alle weergaven van een
 * oefening. Tot v26 kenden alleen de gewone lezer (`toonOefening`) dit; de
 * ademhalings-pacer en "Even helemaal niets" toonden het veld nooit, ook niet
 * als het ingevuld was.
 */
function grensBlok(b) {
    if (!b.medischeGrens || b.medischeGrens.length === 0)
        return null;
    return el("div", { class: "herkomst" }, b.medischeGrens.map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel])));
}
/**
 * "waarom dit werkt +" dat open- en dichtklapt zonder het scherm opnieuw op te
 * bouwen. Nodig bij de pacer: een nieuwe render() zou de lopende cirkel en de
 * timers afbreken (zie toonAdemPacer). Geeft de knop en het blok terug.
 */
function waaromInPlace(b) {
    const blok = el("div", { class: "herkomst" }, b.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel])));
    blok.hidden = true;
    const knop = el("button", { class: "knop-klein" }, ["waarom dit werkt +"]);
    knop.addEventListener("click", () => {
        blok.hidden = !blok.hidden;
        knop.textContent = blok.hidden ? "waarom dit werkt +" : "waarom dit werkt −";
    });
    return [knop, blok];
}
const GETIMEDE_ADEMHALING = {
    // v27 — "Ademen met lange uitademing" telt nu ook mee (4 in, 6 uit): de
    // adem-kamer begeleidt elk ritme visueel in plaats van als tekststappen.
    "adem-lange-uitademing": [
        { label: "Adem in", seconden: 4 },
        { label: "Adem lang uit", seconden: 6 },
    ],
    "box-ademhaling": [
        { label: "Adem in", seconden: 4 },
        { label: "Houd vast", seconden: 4 },
        { label: "Adem uit", seconden: 4 },
        { label: "Houd vast", seconden: 4 },
    ],
    "fysiologische-zucht": [
        { label: "Adem in", seconden: 2 },
        { label: "Nog een klein beetje in", seconden: 1 },
        { label: "Adem lang uit", seconden: 6 },
    ],
    "2-3-4-5-ademhaling": [
        { label: "Adem in", seconden: 2 },
        { label: "Houd vast", seconden: 3 },
        { label: "Adem uit", seconden: 4 },
        { label: "Houd vast", seconden: 5 },
    ],
};
const ADEM_RONDES = 5;
function ademRichting(label) {
    const l = label.toLowerCase();
    if (l.includes("in"))
        return "in";
    if (l.includes("uit"))
        return "uit";
    return "vast";
}
/** De cirkel groeit tot hier bij "in" en krimpt tot hier bij "uit"; hij blijft zo altijd binnen zijn eigen vak. */
const ADEM_SCHAAL = { klein: 0.6, groot: 1 };
/**
 * De ademoefening: één ding beweegt, en de tekst staat stil.
 *
 * Opbouw van het scherm (van boven naar beneden, vaste plekken):
 *   titel · ronde · [ het vak met de cirkel en het aftellende getal erin ] ·
 *   de fase ("Adem in") · wat erna komt · pauze · klaar
 * De cirkel schaalt alleen binnen zijn eigen vierkante vak; de fasetekst staat
 * daaronder op een vaste plek en wordt nooit door de cirkel geraakt. Het getal
 * zit in het midden van de cirkel, die nooit kleiner wordt dan 60% van het vak,
 * dus ook het getal staat altijd op de cirkel.
 *
 * Tijd: één interval van 100 ms rekent met `performance.now()` (verstreken
 * milliseconden in deze fase) in plaats van te tellen; daardoor kan de oefening
 * pauzeren, hervatten en na een achtergrond-pauze niet uit de pas lopen. De
 * cirkel zelf loopt op één CSS-transitie per fase (lineair, precies zo lang als
 * de fase), dus de beweging is de tijd. Bij pauze bevriezen we de cirkel op de
 * berekende maat; bij hervatten loopt hij de rest van de fase uit. Eén render()
 * bij het openen, daarna alleen directe updates, zodat lopende transities
 * nooit worden afgebroken.
 */
function toonAdemPacer(bewegingId, patroon, opties) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return opties.opKlaar();
    const rustig = data.instellingen.rustigeBeelden ||
        (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let faseIndex = 0;
    let ronde = 1;
    let gestopt = false;
    let gepauzeerd = false;
    let verstreken = 0; // ms in de huidige fase
    let vanVerstreken = 0; // verstreken op het moment dat de huidige beweging begon
    let vanSchaal = ADEM_SCHAAL.klein;
    let naarSchaal = ADEM_SCHAAL.klein;
    let laatsteTik = 0;
    let timer;
    const cirkelEl = el("div", { class: "adem-cirkel", "aria-hidden": "true" });
    const getalEl = el("span", { class: "adem-getal", "aria-hidden": "true" }, [""]);
    const stageEl = el("div", { class: `adem-stage${rustig ? " rustig" : ""}`, "data-fase": "vast", "data-vol": "0" }, [
        el("span", { class: "adem-ring", "aria-hidden": "true" }),
        el("span", { class: "adem-gloed", "aria-hidden": "true" }),
        cirkelEl,
        getalEl,
    ]);
    const labelEl = el("p", { class: "adem-label", "aria-live": "polite" }, [""]);
    const volgendeEl = el("p", { class: "adem-volgende" }, [""]);
    const rondeEl = el("p", { class: "zacht adem-ronde" }, [""]);
    const pauzeEl = el("button", { class: "knop-klein adem-pauze", onclick: () => (gepauzeerd ? hervat() : pauzeer()) }, [
        "Pauzeer",
    ]);
    const duurVan = (i) => patroon[i].seconden * 1000;
    function schaalNu() {
        const rest = duurVan(faseIndex) - vanVerstreken;
        const f = rest <= 0 ? 1 : Math.min(1, Math.max(0, (verstreken - vanVerstreken) / rest));
        return vanSchaal + (naarSchaal - vanSchaal) * f;
    }
    /** Zet de cirkel op een maat en laat hem in `ms` naar `doel` lopen. */
    function beweeg(doel, ms) {
        cirkelEl.style.transitionDuration = "0ms";
        cirkelEl.style.transform = `scale(${vanSchaal})`;
        void cirkelEl.offsetWidth; // begin de transitie vanaf deze maat, niet vanaf een oude
        cirkelEl.style.transitionDuration = rustig ? "0ms" : `${Math.max(0, ms)}ms`;
        cirkelEl.style.transform = `scale(${doel})`;
    }
    function stop() {
        gestopt = true;
        if (timer !== undefined)
            window.clearInterval(timer);
        document.removeEventListener("visibilitychange", opZichtbaarheid);
    }
    function opZichtbaarheid() {
        if (document.hidden)
            pauzeer();
    }
    function toonFase() {
        const fase = patroon[faseIndex];
        const richting = ademRichting(fase.label);
        const volgende = patroon[(faseIndex + 1) % patroon.length];
        labelEl.textContent = fase.label;
        // Wat er straks komt, zodat een korte "houd vast" niet als een pauze voelt.
        volgendeEl.textContent = `Daarna: ${volgende.label.toLowerCase()}`;
        labelEl.classList.remove("adem-label--wissel");
        void labelEl.offsetWidth;
        labelEl.classList.add("adem-label--wissel");
        rondeEl.textContent = `Ronde ${ronde} van ${ADEM_RONDES}`;
        getalEl.textContent = String(fase.seconden);
        stageEl.dataset.fase = richting;
        if (richting === "in")
            naarSchaal = ADEM_SCHAAL.groot;
        else if (richting === "uit")
            naarSchaal = ADEM_SCHAAL.klein;
        // "vast": geen wijziging, de cirkel blijft precies zo groot als hij was.
        stageEl.dataset.vol = naarSchaal === ADEM_SCHAAL.groot ? "1" : "0";
    }
    function startFase() {
        if (gestopt)
            return;
        verstreken = 0;
        vanVerstreken = 0;
        vanSchaal = naarSchaal;
        toonFase();
        beweeg(naarSchaal, duurVan(faseIndex));
    }
    function volgendeFase() {
        faseIndex++;
        if (faseIndex >= patroon.length) {
            faseIndex = 0;
            ronde++;
            if (ronde > ADEM_RONDES) {
                stop();
                opties.opKlaar();
                return;
            }
        }
        startFase();
    }
    function tik() {
        if (gestopt)
            return;
        if (!cirkelEl.isConnected)
            return stop(); // het scherm is al weg
        const nu = performance.now();
        verstreken += Math.min(nu - laatsteTik, 400); // een geblokkeerde tik telt niet als tijd
        laatsteTik = nu;
        const duur = duurVan(faseIndex);
        if (verstreken >= duur)
            return volgendeFase();
        getalEl.textContent = String(Math.ceil((duur - verstreken) / 1000));
    }
    function loop() {
        laatsteTik = performance.now();
        timer = window.setInterval(tik, 100);
    }
    function pauzeer() {
        if (gestopt || gepauzeerd)
            return;
        gepauzeerd = true;
        if (timer !== undefined)
            window.clearInterval(timer);
        vanSchaal = schaalNu();
        vanVerstreken = verstreken;
        cirkelEl.style.transitionDuration = "0ms";
        cirkelEl.style.transform = `scale(${vanSchaal})`;
        stageEl.dataset.pauze = "1";
        pauzeEl.textContent = "Ga verder";
    }
    function hervat() {
        if (gestopt || !gepauzeerd)
            return;
        gepauzeerd = false;
        delete stageEl.dataset.pauze;
        pauzeEl.textContent = "Pauzeer";
        beweeg(naarSchaal, duurVan(faseIndex) - verstreken);
        loop();
    }
    render([
        el("div", { class: "scherm scherm-adem", "data-kamer": "adem" }, [
            terugKnop(() => {
                stop();
                (opties.opTerug ?? toonThuis)();
            }),
            el("p", { class: "oefening-titel" }, [beweging.titel]),
            rondeEl,
            stageEl,
            labelEl,
            volgendeEl,
            pauzeEl,
            el("button", {
                class: "knop",
                onclick: () => {
                    stop();
                    opties.opKlaar();
                },
            }, [opties.klaarTekst ?? "Klaar"]),
            grensBlok(beweging),
            ...waaromInPlace(beweging),
        ]),
    ]);
    // Begin klein, zonder overgang, en loop dan de eerste fase in.
    cirkelEl.style.transform = `scale(${ADEM_SCHAAL.klein})`;
    document.addEventListener("visibilitychange", opZichtbaarheid);
    startFase();
    loop();
}
/** "Even helemaal niets" — een zelfgekozen duur, dan alleen een aftellend
 * getal. Geen stappen, geen tekst onderweg: het scherm zelf mag ook stil
 * zijn. Stateless zoals De Onderbreker (Wet 4/8): er wordt niets bewaard
 * over hoe vaak of hoe lang. */
function toonPrikkelsLoslaten(opties) {
    const beweging = bewegingById("prikkels-loslaten");
    if (!beweging)
        return opties.opKlaar();
    let waaromOpen = false;
    function kiesScherm() {
        render([
            el("div", { class: "scherm" }, [
                terugKnop(() => (opties.opTerug ?? toonThuis)()),
                el("p", { class: "oefening-titel" }, [beweging.titel]),
                el("p", { class: "vraag" }, ["Hoe lang?"]),
                el("p", { class: "zacht" }, [beweging.script]),
                el("div", { class: "tijd-opties" }, [5, 10, 15].map((minuten) => el("button", { class: "knop", onclick: () => telAf(minuten) }, [`${minuten} minuten`]))),
                el("button", { class: "knop-klein", onclick: () => { waaromOpen = !waaromOpen; kiesScherm(); } }, [waaromOpen ? "waarom dit werkt −" : "waarom dit werkt +"]),
                waaromOpen
                    ? el("div", { class: "herkomst" }, beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel])))
                    : null,
                grensBlok(beweging),
            ]),
        ]);
    }
    function telAf(minuten) {
        let resterend = minuten * 60;
        const cijferEl = el("p", { class: "adem-pacer-getal" }, [""]);
        let timerId;
        function stop() {
            if (timerId !== undefined)
                window.clearInterval(timerId);
        }
        function bijwerken() {
            const m = Math.floor(resterend / 60);
            const s = resterend % 60;
            cijferEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
        }
        render([
            el("div", { class: "scherm" }, [
                terugKnop(() => {
                    stop();
                    kiesScherm();
                }),
                el("p", { class: "oefening-titel" }, [beweging.titel]),
                el("p", { class: "vraag" }, ["Niets hoeft."]),
                cijferEl,
                el("button", {
                    class: "knop",
                    onclick: () => {
                        stop();
                        opties.opKlaar();
                    },
                }, [opties.klaarTekst ?? "Klaar"]),
                grensBlok(beweging),
            ]),
        ]);
        bijwerken();
        timerId = window.setInterval(() => {
            if (!cijferEl.isConnected)
                return stop(); // het scherm is al weg
            resterend--;
            if (resterend <= 0) {
                stop();
                opties.opKlaar();
                return;
            }
            bijwerken();
        }, 1000);
    }
    kiesScherm();
}
// ── Vijf, vier, drie, twee, één — een instrument dat met je meetelt ─────
// v27 (W6.2) — de oefening telt letterlijk af (5-4-3-2-1), dus hij hoort geen
// tekstblok te zijn maar een cirkel waarop je bij elk ding tikt dat je opmerkt.
// Het getal in het midden loopt terug, de ring vult zich. Stateless: er wordt
// niets geteld of bewaard behalve wat je op dit ene scherm doet.
const ZINTUIGEN = [
    { n: 5, tekst: "Vijf dingen die je ziet." },
    { n: 4, tekst: "Vier dingen die je voelt — je kleren, de stoel, de lucht." },
    { n: 3, tekst: "Drie dingen die je hoort." },
    { n: 2, tekst: "Twee dingen die je ruikt." },
    { n: 1, tekst: "Eén ding dat je proeft." },
];
function telringSvg(n) {
    const r = 70;
    const gap = n === 1 ? 0 : 0.16; // radialen tussen de bogen
    const stuk = (2 * Math.PI) / n;
    let bogen = "";
    for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + i * stuk + gap / 2;
        const a1 = -Math.PI / 2 + (i + 1) * stuk - gap / 2 - (n === 1 ? 0.0001 : 0);
        const x0 = 80 + r * Math.cos(a0);
        const y0 = 80 + r * Math.sin(a0);
        const x1 = 80 + r * Math.cos(a1);
        const y1 = 80 + r * Math.sin(a1);
        const groot = a1 - a0 > Math.PI ? 1 : 0;
        bogen += `<path class="telring-boog" d="M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${groot} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}"/>`;
    }
    return `<svg viewBox="0 0 160 160" aria-hidden="true">${bogen}</svg>`;
}
function toonZintuigenTeller(opties) {
    const gevonden = bewegingById("vijf-zintuigen-grounding");
    if (!gevonden)
        return opties.opKlaar();
    const beweging = gevonden;
    let fase = 0;
    function teken() {
        const stap = ZINTUIGEN[fase];
        let geteld = 0;
        let klaarMelding = false;
        const getal = el("span", { class: "telring-getal" }, [String(stap.n)]);
        const ring = el("button", {
            class: "telring",
            "aria-label": `${stap.tekst} Tik bij elk ding dat je opmerkt.`,
            onclick: () => {
                if (geteld >= stap.n || klaarMelding)
                    return;
                const bogen = ring.querySelectorAll(".telring-boog");
                bogen[geteld]?.classList.add("vol");
                geteld += 1;
                getal.textContent = String(stap.n - geteld);
                if (geteld >= stap.n) {
                    klaarMelding = true;
                    // Even laten landen, dan naar het volgende zintuig — of klaar.
                    naVertraging(650, () => {
                        if (fase === ZINTUIGEN.length - 1)
                            return opties.opKlaar();
                        fase += 1;
                        teken();
                    });
                }
            },
        }, [el("span", { class: "telring-svg", html: telringSvg(stap.n) }, []), getal]);
        render([
            el("div", { class: "scherm scherm-app scherm-midden" }, [
                terugKnop(() => {
                    if (fase > 0) {
                        fase -= 1;
                        teken();
                    }
                    else {
                        (opties.opTerug ?? toonThuis)();
                    }
                }),
                el("p", { class: "oefening-titel" }, [beweging.titel]),
                el("div", { class: "stip-rij" }, ZINTUIGEN.map((_, i) => el("span", { class: `stip${i <= fase ? " vol" : ""}` }))),
                el("p", { class: "vraag" }, [stap.tekst]),
                ring,
                el("p", { class: "zacht" }, ["Tik op de cirkel bij elk ding dat je opmerkt."]),
                el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
                grensBlok(beweging),
                ...waaromInPlace(beweging),
                el("button", { class: "knop-klein", onclick: () => opties.opKlaar() }, [opties.klaarTekst ?? "Klaar"]),
            ]),
        ]);
    }
    teken();
}
/** Eén ingang voor elke beweging: kiest zelf de juiste weergave (getimede
 * ademhaling, de stille aftel-oefening, of anders de gewone stap-voor-stap-
 * lezer) in plaats van dat elke aanroeper dat zelf moet weten. */
export function toonBeweging(bewegingId, opties) {
    if (bewegingId === "prikkels-loslaten")
        return toonPrikkelsLoslaten(opties);
    if (bewegingId === "vijf-zintuigen-grounding")
        return toonZintuigenTeller(opties);
    const patroon = GETIMEDE_ADEMHALING[bewegingId];
    if (patroon)
        return toonAdemPacer(bewegingId, patroon, opties);
    return toonOefening(bewegingId, opties);
}
function toonOefening(bewegingId, opties) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return opties.opKlaar();
    const stappen = stappenVan(beweging.script);
    let index = 0;
    let waaromOpen = false;
    function teken() {
        const laatste = index === stappen.length - 1;
        render([
            // v25 — `scherm-app` lijnt van bovenaf uit en houdt onderaan ruimte
            // vrij voor de navigatiebalk. Dat is goed voor de drie tabs, maar een
            // oefening heeft vier korte regels en géén navigatiebalk: die stond
            // daardoor bovenin geplakt met een half leeg scherm eronder.
            // `scherm-midden` zet die twee dingen recht.
            el("div", { class: "scherm scherm-app scherm-midden" }, [
                terugKnop(() => (opties.opTerug ?? toonThuis)()),
                el("p", { class: "oefening-titel" }, [beweging.titel]),
                el("div", { class: "stip-rij" }, stappen.map((_, i) => el("span", { class: `stip${i <= index ? " vol" : ""}` }))),
                el("p", { class: "vraag" }, [stappen[index]]),
                laatste ? timerVisual(bewegingId) : null,
                el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
                // veiligheid.md §4: een medische grens staat er elke keer bij, op elke
                // stap — niet weggeklapt achter "waarom dit werkt".
                grensBlok(beweging),
                el("button", {
                    class: "knop",
                    onclick: () => {
                        if (laatste)
                            return opties.opKlaar();
                        index += 1;
                        teken();
                    },
                }, [laatste ? (opties.klaarTekst ?? "Klaar") : "Volgende"]),
                el("button", {
                    class: "knop-klein",
                    onclick: () => {
                        waaromOpen = !waaromOpen;
                        teken();
                    },
                }, [waaromOpen ? "waarom dit werkt −" : "waarom dit werkt +"]),
                waaromOpen
                    ? el("div", { class: "herkomst" }, beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel])))
                    : null,
            ]),
        ]);
    }
    teken();
}
// ── v25 — kiezen uit de bibliotheek, zonder muur van titels ───────────
//
// De Onderbreker, de herstelroute en het weekmoment toonden alle drie
// dezelfde platte lijst van drieëntwintig titels: in briefletter, zonder
// duur, zonder groepering, zonder weg terug — en met de islamitische laag
// uít stonden de islamitische bewegingen er evengoed tussen (S10 en
// themas.ts filteren die wel). Juist op die drie momenten (vastzitten in je
// telefoon, eruit gevallen zijn, het eind van een reflectie) is een lijst
// van drieëntwintig het probleem en niet de oplossing.
//
// Wat hier níét gebeurt: kiezen op basis van wat je hebt ingetypt. De korte
// lijstjes hieronder staan per plek met de hand vast, met de reden erbij, en
// de hele bibliotheek blijft altijd één tik weg. Er wordt niets geteld en
// niets onthouden.
/** Met de islamitische laag uit vallen de [I]-bewegingen weg, net als het
 * hele thema "Geloof en zingeving" in de Doen-tab. */
export function zichtbareBewegingen() {
    const islamAan = data.instellingen.islamitischeLaag;
    return bewegingen.filter((b) => islamAan || !b.herkomst.some((h) => h.label === "I"));
}
/**
 * De Onderbreker, Wet 8 punt 3: "vervanging, niet onthouding". Wat hier moet
 * staan, moet het kunnen opnemen tégen doorscrollen — dus iets dat je van het
 * scherm áf krijgt, en het liefst iets met je lichaam.
 */
const KORT_ONDERBREKER = [
    "vijf-minuten-naar-buiten",
    "adem-lange-uitademing",
    "bericht-sturen",
    "uitschrijven-zonder-filter",
    "tien-minuten-wandelen-groen",
    "voeten-op-de-grond",
    "sayyid-al-istighfar",
];
/**
 * De herstelroute vraagt letterlijk om "de kleinste stap" — dus alleen wat in
 * één of twee minuten klaar kan zijn, en niets met een grote drempel.
 */
const KORT_HERSTEL = [
    "savoring-zestig-seconden",
    "adem-lange-uitademing",
    "benoemen-en-parkeren",
    "bericht-sturen",
    "vijf-minuten-naar-buiten",
    "vijf-zintuigen-grounding",
    "voeten-op-de-grond",
    "sayyid-al-istighfar",
];
function bewegingKaart(b, kies) {
    return el("button", { class: "kaart kaart-klein", onclick: () => kies(b.id) }, [
        el("span", { class: "kaart-titel-klein" }, [b.titel]),
        el("span", { class: "kaart-meta" }, [`${duurTekst(b.id)} · ${b.minimumversie}`]),
    ]);
}
/** Het korte lijstje, met de hele bibliotheek eronder. */
function toonBewegingKeuze(opties) {
    const zichtbaar = zichtbareBewegingen();
    const kort = opties.kort
        .map((id) => zichtbaar.find((b) => b.id === id))
        .filter((b) => Boolean(b));
    render([
        el("div", { class: "scherm scherm-app" }, [
            terugKnop(opties.opTerug),
            el("p", { class: "vraag" }, [opties.vraag]),
            el("p", { class: "sectie-kop" }, [teksten.keuze.kortKop]),
            ...kort.map((b) => bewegingKaart(b, opties.kies)),
            el("button", { class: "knop-klein", onclick: () => toonBewegingBibliotheek(opties) }, [
                teksten.keuze.alles,
            ]),
            opties.extra ? opties.extra() : null,
        ]),
    ]);
}
/** De hele bibliotheek, gegroepeerd zoals de Doen-tab hem groepeert — acht
 * domeinen in gewone taal in plaats van drieëntwintig losse titels. */
function toonBewegingBibliotheek(opties) {
    const islamAan = data.instellingen.islamitischeLaag;
    const gezien = new Set();
    const groepen = [];
    for (const t of themas.filter((t) => !t.islamitisch || islamAan)) {
        const items = t.bewegingIds
            .filter((id) => !gezien.has(id))
            .map((id) => bewegingById(id))
            .filter((b) => Boolean(b));
        if (items.length === 0)
            continue;
        for (const b of items)
            gezien.add(b.id);
        groepen.push(el("p", { class: "sectie-kop" }, [t.titel]));
        for (const b of items)
            groepen.push(bewegingKaart(b, opties.kies));
    }
    render([
        el("div", { class: "scherm scherm-app" }, [
            terugKnop(() => (opties.alleenBibliotheek ? opties.opTerug() : toonBewegingKeuze(opties))),
            el("p", { class: "vraag" }, [opties.vraag]),
            ...groepen,
            opties.extra ? opties.extra() : null,
        ]),
    ]);
}
// ── v25 — de afronding van een oefening buiten de kompaslus ────────────
//
// Tot nu toe eindigde een oefening die je vanaf "Nu" of "Doen" begon in
// toonKlaar(): "Klaar." en verder niets. Er werd niets bewaard — geen zin,
// geen ster. Sinds v21 is dat de hoofdweg door de app, en die liet dus
// niets achter: De Hemel bleef leeg, een sterrenbeeld kon nooit ontstaan, en
// de Maandbrief had geen enkele zin om over te schrijven. Alleen de
// kompaslus (S6) verankerde nog.
//
// Dit is daarmee geen nieuwe functie maar een bestaande regel die op de
// nieuwe hoofdweg nooit is meegekomen: datamodel.md §5 koos uitdrukkelijk
// optie A — "elke beweging geeft een ster, ook zonder tekst".
//
// De Onderbreker en de herstelroute blijven wél stateless: die twee mogen
// per Wet 8 respectievelijk Wet 4 uitdrukkelijk niets bijhouden, en dat
// blijft zo.
export function toonVrijeAfronding(bewegingId) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return toonS7();
    const veld = el("textarea", { placeholder: teksten.vrijeAfronding.placeholder });
    function bewaarSter() {
        const nieuweSter = {
            id: nieuwId("s"),
            momentId: null,
            streek: beweging.streek,
            datum: huidigeDagSleutel(),
            zin: veld.value.trim() || null,
            bewegingId: beweging.id,
        };
        data.sterren.push(nieuweSter);
        zojuistGemaakteSter = nieuweSter;
        void bewaren();
    }
    render([
        el("div", { class: "scherm scherm-app scherm-midden" }, [
            el("p", { class: "vraag" }, [teksten.vrijeAfronding.kop]),
            el("p", { class: "zacht" }, [teksten.vrijeAfronding.uitleg]),
            veld,
            el("button", { class: "knop", onclick: () => { bewaarSter(); toonS7(); } }, [
                teksten.vrijeAfronding.sluiten,
            ]),
            el("button", { class: "knop-klein", onclick: () => { bewaarSter(); rondLopendeAf(); toonThuis(); } }, [
                teksten.vrijeAfronding.naarStart,
            ]),
        ]),
    ]);
}
// ── Dhikr-lezer ───────────────────────────────────────────────────────
// adhkar.md, ontwerpregel: de app toont de tekst en de betekenis, nooit een
// aantal — ook niet wanneer het aantal letterlijk in de bron staat.
export function toonDhikr(id, opTerug, opKlaar = toonKlaar) {
    const d = dhikrById(id);
    if (!d)
        return toonThuis();
    let bronOpen = false;
    function teken() {
        render([
            el("div", { class: "scherm scherm-app scherm-midden" }, [
                terugKnop(opTerug),
                el("p", { class: "oefening-titel" }, [d.titel]),
                el("p", { class: "zacht" }, [d.wanneer]),
                el("p", { class: "arabisch", dir: "rtl", lang: "ar" }, [d.arabisch]),
                el("p", { class: "translit" }, [d.transliteratie]),
                el("p", { class: "vertaling" }, [d.vertaling]),
                el("button", { class: "knop", onclick: opKlaar }, ["Klaar"]),
                el("button", {
                    class: "knop-klein",
                    onclick: () => {
                        bronOpen = !bronOpen;
                        teken();
                    },
                }, [bronOpen ? "waar dit vandaan komt −" : "waar dit vandaan komt +"]),
                bronOpen ? el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [d.bron])]) : null,
            ]),
        ]);
    }
    teken();
}
// ── Afsluiten met een keuze ───────────────────────────────────────────
// Wet 3 ("elk moment eindigt buiten de app") blijft de eerste optie: sluiten
// dimt het scherm en laat je gaan. Maar wie nog even bezig is, hoeft daar
// niet uitgegooid te worden — dat was in v20 de enige uitgang.
// ── S24 — Richting en doelen (de WOOP-flow) ────────────────────────────
// v21, spoor W6 (Onderzoek-W6-Doelen-en-Verbeelding.md). Vier vragen --
// Wish, Outcome, Obstacle, Plan -- mental contrasting draagt het grootste
// deel van het bewijs; de Obstacle-stap wordt daarom nooit overgeslagen,
// ook niet als knop "verder zonder". De verbeeldingsstap ertussenin is wel
// vrijblijvend: lezen en verdergaan, niets in te vullen.
export function toonS24Richting() {
    const bestaand = data.doel;
    if (!bestaand)
        return toonS24Wish();
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonDoen()),
            el("p", { class: "vraag" }, [teksten.doelen.bekijkKop]),
            el("div", { class: "herkomst" }, [
                el("p", { class: "herkomst-regel" }, [bestaand.wish]),
                el("p", { class: "herkomst-regel" }, [bestaand.outcome]),
                el("p", { class: "herkomst-regel" }, [`Als ${bestaand.obstacleTekst}, dan ${bestaand.planDan}.`]),
            ]),
            el("button", { class: "knop", onclick: () => toonS24Wish() }, [teksten.doelen.opnieuw]),
        ]),
    ]);
}
/** Schrijft de tussentijdse WOOP-invoer weg zodat niets verloren gaat als de
 * app hier wordt gesloten — zie ConceptDoel in types.ts. */
function bewaarConceptDoel(veld) {
    data.conceptDoel = { wish: "", outcome: "", obstacleTekst: "", planDan: "", ...data.conceptDoel, ...veld };
    void bewaren();
}
export function toonS24Wish() {
    const concept = data.conceptDoel;
    const veld = el("textarea", { placeholder: teksten.doelen.wishPlaceholder });
    veld.value = concept?.wish ?? data.doel?.wish ?? "";
    const knop = el("button", {
        class: "knop",
        onclick: () => {
            const wish = veld.value.trim();
            bewaarConceptDoel({ wish });
            toonS24Outcome(wish);
        },
    }, [teksten.doelen.klaar]);
    koppelDisabled(veld, knop);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonDoen()),
            ...stapKop(teksten.doelen.toegangTitel, 1, 5),
            el("p", { class: "vraag" }, [teksten.doelen.wishVraag]),
            el("p", { class: "zacht" }, [teksten.doelen.wishOnderschrift]),
            veld,
            knop,
        ]),
    ]);
}
function toonS24Outcome(wish) {
    const veld = el("textarea", { placeholder: teksten.doelen.outcomePlaceholder });
    veld.value = data.conceptDoel?.outcome ?? data.doel?.outcome ?? "";
    const knop = el("button", {
        class: "knop",
        onclick: () => {
            const outcome = veld.value.trim();
            bewaarConceptDoel({ outcome });
            toonS24Verbeelding(wish, outcome);
        },
    }, [teksten.doelen.klaar]);
    koppelDisabled(veld, knop);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS24Wish()),
            ...stapKop(teksten.doelen.toegangTitel, 2, 5),
            el("p", { class: "vraag" }, [teksten.doelen.outcomeVraag]),
            el("p", { class: "zacht" }, [teksten.doelen.outcomeOnderschrift]),
            veld,
            knop,
        ]),
    ]);
}
function toonS24Verbeelding(wish, outcome) {
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS24Outcome(wish)),
            ...stapKop(teksten.doelen.toegangTitel, 3, 5),
            el("p", { class: "vraag" }, [teksten.doelen.verbeeldingKop]),
            el("p", { class: "regel" }, [teksten.doelen.verbeeldingTekst]),
            el("button", { class: "knop", onclick: () => toonS24Obstacle(wish, outcome) }, [teksten.doelen.klaar]),
        ]),
    ]);
}
function toonS24Obstacle(wish, outcome) {
    const veld = el("textarea", { placeholder: teksten.doelen.obstaclePlaceholder });
    veld.value = data.conceptDoel?.obstacleTekst ?? data.doel?.obstacleTekst ?? "";
    const knop = el("button", {
        class: "knop",
        onclick: () => {
            const obstacle = veld.value.trim();
            bewaarConceptDoel({ obstacleTekst: obstacle });
            toonS24Plan(wish, outcome, obstacle);
        },
    }, [teksten.doelen.klaar]);
    koppelDisabled(veld, knop);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS24Outcome(wish)),
            ...stapKop(teksten.doelen.toegangTitel, 4, 5),
            el("p", { class: "vraag" }, [teksten.doelen.obstacleVraag]),
            el("p", { class: "zacht" }, [teksten.doelen.obstacleOnderschrift]),
            veld,
            knop,
        ]),
    ]);
}
function toonS24Plan(wish, outcome, obstacle) {
    const alsVeld = el("input", { type: "text", value: obstacle, readonly: true });
    const danVeld = el("input", { type: "text", placeholder: teksten.doelen.planDanPlaceholder });
    danVeld.value = data.conceptDoel?.planDan ?? data.doel?.planDan ?? "";
    danVeld.addEventListener("input", () => bewaarConceptDoel({ planDan: danVeld.value }));
    const melding = el("p", { class: "zacht" }, [""]);
    const knop = el("button", {
        class: "knop",
        onclick: () => {
            const dan = danVeld.value.trim();
            if (!dan)
                return;
            data.doel = {
                wish,
                outcome,
                obstacleTekst: obstacle,
                planAls: obstacle,
                planDan: dan,
                sinds: new Date().toISOString(),
            };
            data.conceptDoel = null;
            void bewaren();
            melding.textContent = teksten.doelen.bewaard;
            naVertraging(900, () => toonDoen());
        },
    }, [teksten.doelen.bewaren]);
    koppelDisabled(danVeld, knop);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS24Obstacle(wish, outcome)),
            ...stapKop(teksten.doelen.toegangTitel, 5, 5),
            el("p", { class: "vraag" }, [teksten.doelen.planVraag]),
            el("p", { class: "zacht" }, [teksten.doelen.planAlsLabel]),
            alsVeld,
            el("p", { class: "zacht" }, [teksten.doelen.planDanLabel]),
            danVeld,
            knop,
            melding,
        ]),
    ]);
}
function toonKlaar() {
    render([
        el("div", { class: "scherm scherm-app scherm-midden" }, [
            el("p", { class: "vraag" }, ["Klaar."]),
            el("button", { class: "knop", onclick: () => toonS7() }, ["Sluiten"]),
            el("button", { class: "knop-klein", onclick: () => { rondLopendeAf(); toonThuis(); } }, ["Terug naar start"]),
        ]),
    ]);
}
// ── De kompaslus: de Schijf eerst, woorden als alternatief ─────────────
// Tot v20 begon deze lus op de schijf: een lege cirkel zonder assen of
// uitleg. In v21 schoof de schijf naar achter; sinds v27 is hij weer de
// voordeur, nu mét aslabels en uitleg, en staan de woorden eronder.
export function startKompasLus() {
    s4Terug = null;
    huidigeTikPositie = null;
    huidigMoment = null;
    // v27 (W6): de Schijf eerst, woorden als alternatief eronder. In v21 was de
    // schijf naar achter geschoven omdat hij toen een kale cirkel zonder uitleg
    // was; die reden is weg (aslabels en uitleg staan er nu omheen).
    toonS1();
}
// ── S10 — Instellingen ────────────────────────────────────────────────
export function toonS10() {
    function switchRij(label, onderschrift, waarde, onchange) {
        return el("div", { class: "toggle-rij" }, [
            el("div", { class: "toggle-tekst" }, [
                el("span", {}, [label]),
                el("span", { class: "zacht" }, [onderschrift]),
            ]),
            el("label", { class: "switch" }, [
                el("input", {
                    type: "checkbox",
                    checked: waarde,
                    onchange: (e) => onchange(e.target.checked),
                }),
                el("span", { class: "switch-schuif" }),
            ]),
        ]);
    }
    const meldingTekst = el("p", { class: "zacht" }, [""]);
    // v25 — een melding per dagdeel, ook als de app dicht staat. Leunt op een
    // losse, minimale server (lib/meldingen.ts legt uit waarom dat voor web
    // push niet anders kan) -- de enige netwerkaanroep die deze app ooit doet,
    // en alleen wanneer je dit hier zelf aanzet.
    function meldingenUitleg(reden) {
        return reden === "geweigerd"
            ? "Je toestel weigerde toestemming. Zet dit aan bij de meldingeninstellingen van je toestel of browser voor deze app, en probeer het hier opnieuw."
            : reden === "niet_ondersteund"
                ? "Meldingen worden niet ondersteund in deze browser."
                : "Dit lukte nu niet. Probeer het later opnieuw.";
    }
    function meldingDagdeelRijen(dagdeel, label, standaardTijd) {
        const huidigeTijd = data.instellingen.meldingenTijden[dagdeel];
        return [
            switchRij(label, "Ook als de app gesloten is.", !!huidigeTijd, async (v) => {
                const nieuw = { ...data.instellingen.meldingenTijden, [dagdeel]: v ? standaardTijd : null };
                const alleUit = !nieuw.ochtend && !nieuw.middag && !nieuw.avond;
                if (alleUit) {
                    await zetMeldingenUit();
                    data.instellingen.meldingenTijden = nieuw;
                    await bewaren();
                    laatsteMeldingenFout = null;
                }
                else {
                    const resultaat = await zetMeldingenAan(nieuw);
                    if (resultaat.ok) {
                        data.instellingen.meldingenTijden = nieuw;
                        await bewaren();
                        laatsteMeldingenFout = null;
                    }
                    else {
                        laatsteMeldingenFout = meldingenUitleg(resultaat.reden);
                    }
                }
                toonS10();
            }),
            huidigeTijd
                ? el("div", { class: "toggle-rij" }, [
                    el("div", { class: "toggle-tekst" }, [
                        el("span", {}, ["Tijdstip"]),
                        el("span", { class: "zacht" }, ["Wanneer je deze melding wil krijgen."]),
                    ]),
                    el("input", {
                        type: "time",
                        value: huidigeTijd,
                        onchange: async (e) => {
                            const nieuweTijd = e.target.value;
                            if (!nieuweTijd)
                                return;
                            const nieuw = { ...data.instellingen.meldingenTijden, [dagdeel]: nieuweTijd };
                            const resultaat = await zetMeldingenAan(nieuw);
                            if (resultaat.ok) {
                                data.instellingen.meldingenTijden = nieuw;
                                await bewaren();
                            }
                        },
                    }),
                ])
                : null,
        ];
    }
    const meldingenFout = el("p", { class: laatsteMeldingenFout ? "zacht zacht--fout" : "zacht" }, [laatsteMeldingenFout ?? ""]);
    const meldingenSectie = [
        el("p", { class: "sectie-kop" }, ["Meldingen"]),
        el("p", { class: "zacht" }, ["Een rustige melding per dagdeel, ook als de app dicht staat."]),
        ...meldingDagdeelRijen("ochtend", "Ochtend", "08:00"),
        ...meldingDagdeelRijen("middag", "Middag", "13:00"),
        ...meldingDagdeelRijen("avond", "Avond", "20:00"),
        meldingenFout,
    ];
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonTerugkijken()),
            switchRij(teksten.instellingen.islamitischeLaag.label, teksten.instellingen.islamitischeLaag.onderschrift, data.instellingen.islamitischeLaag, async (v) => {
                data.instellingen.islamitischeLaag = v;
                await bewaren();
            }),
            switchRij(teksten.instellingen.rustigeBeelden.label, teksten.instellingen.rustigeBeelden.onderschrift, data.instellingen.rustigeBeelden, async (v) => {
                data.instellingen.rustigeBeelden = v;
                document.body.classList.toggle("rustig", v);
                await bewaren();
            }),
            switchRij(teksten.instellingen.weekmoment.label, teksten.instellingen.weekmoment.onderschrift, data.instellingen.weekmomentAan, async (v) => {
                data.instellingen.weekmomentAan = v;
                await bewaren();
            }),
            el("p", { class: "sectie-kop" }, [teksten.instellingen.visieMomentenKop]),
            el("p", { class: "zacht" }, [teksten.instellingen.visieMomentenOnderschrift]),
            switchRij(teksten.instellingen.visieOchtend.label, teksten.instellingen.visieOchtend.onderschrift, visieCheckInsVoor(data).ochtend, async (v) => {
                data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), ochtend: v };
                await bewaren();
            }),
            switchRij(teksten.instellingen.visieMiddag.label, teksten.instellingen.visieMiddag.onderschrift, visieCheckInsVoor(data).middag, async (v) => {
                data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), middag: v };
                await bewaren();
            }),
            switchRij(teksten.instellingen.visieAvond.label, teksten.instellingen.visieAvond.onderschrift, visieCheckInsVoor(data).avond, async (v) => {
                data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), avond: v };
                await bewaren();
            }),
            ...meldingenSectie,
            el("button", {
                class: "knop",
                onclick: () => {
                    exporteerBestand(data);
                    meldingTekst.textContent = teksten.instellingen.exportGelukt;
                    meldingTekst.classList.add("zacht--succes");
                },
            }, ["Exporteren"]),
            meldingTekst,
            el("button", {
                class: "knop-klein",
                onclick: async (e) => {
                    // Dit wist alles. De export gaat vooraf, maar een download kan (vooral op
                    // een iPhone-beginschermapp) stil mislukken: daarom eerst een tweede tik.
                    const knop = e.currentTarget;
                    if (knop.dataset.zeker !== "1") {
                        const oud = knop.textContent;
                        knop.dataset.zeker = "1";
                        knop.textContent = "Zeker weten? Tik nog een keer: alles wordt gewist.";
                        window.setTimeout(() => {
                            knop.dataset.zeker = "";
                            knop.textContent = oud;
                        }, 6000);
                        return;
                    }
                    exporteerBestand(data);
                    await wisBestand();
                    data = await laadBestand();
                    toonS0();
                },
            }, [teksten.instellingen.allesMeenemenEnStoppen.label]),
        ]),
    ]);
}
// ── S11 — Import ──────────────────────────────────────────────────────
/** "1 ster", "2 sterren". */
function telWoord(n, enkel, meer) {
    return `${n} ${n === 1 ? enkel : meer}`;
}
function toonS11() {
    const melding = el("p", { class: "zacht" }, [""]);
    const invoer = el("input", { type: "file", accept: "application/json" });
    const bevestiging = el("div", { class: "import-bevestiging" }, []);
    invoer.addEventListener("change", async () => {
        const bestand = invoer.files?.[0];
        if (!bestand)
            return;
        bevestiging.replaceChildren();
        melding.textContent = "";
        melding.classList.remove("zacht--fout");
        let tekst = "";
        try {
            tekst = await bestand.text();
        }
        catch {
            tekst = "";
        }
        const geimporteerd = parseGeimporteerdBestand(tekst);
        if (!geimporteerd) {
            melding.textContent = teksten.legeStaten.importMislukt;
            melding.classList.add("zacht--fout");
            return;
        }
        // Een geldig bestand is nog niet het juiste bestand: eerst laten zien wat er
        // vervangen wordt, en pas op een tweede keuze doorvoeren.
        bevestiging.append(el("p", { class: "zacht" }, [
            `Dit bestand bevat ${telWoord(geimporteerd.sterren.length, "ster", "sterren")} en ${telWoord(geimporteerd.momenten.length, "moment", "momenten")}. ` +
                `Je huidige gegevens (${telWoord(data.sterren.length, "ster", "sterren")}, ${telWoord(data.momenten.length, "moment", "momenten")}) worden hiermee vervangen.`,
        ]), el("button", { class: "knop-klein", onclick: () => exporteerBestand(data) }, ["Eerst mijn huidige gegevens exporteren"]), el("button", {
            class: "knop",
            onclick: async () => {
                data = geimporteerd;
                await bewaren();
                toonThuis();
            },
        }, ["Vervang mijn gegevens"]), el("button", {
            class: "knop-klein",
            onclick: () => {
                bevestiging.replaceChildren();
                invoer.value = "";
            },
        }, ["Annuleren"]));
    });
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS0()),
            el("p", { class: "vraag" }, ["Bestand kiezen"]),
            invoer,
            melding,
            bevestiging,
        ]),
    ]);
}
