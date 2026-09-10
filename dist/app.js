// app.ts — de volledige schermenlus S0 t/m S11, zie schermenoverzicht.md.
// Eén bestand, geen router-library: de dagelijkse lus is toch al lineair
// (S1 → S2 → S3 → S4 → (S5 → S6) → S7).
import { laadBestand, bewaarBestand, wisBestand, exporteerBestand, parseGeimporteerdBestand } from "./lib/db.js";
import { zetMeldingenAan, zetMeldingenUit } from "./lib/meldingen.js";
import { el, render, dimEnDan } from "./lib/dom.js";
import { tekenSchijf, tekenHemel, tekenSterrenbeeldModus, tekenVerschil, nauwelijksVerschoven, } from "./lib/canvas.js";
import { woordenNabij, woordById, zetEigenWoorden, zoekWoorden } from "./data/woorden.js";
import { bewegingById, bewegingen } from "./data/bewegingen.js";
import { teksten } from "./data/teksten.js";
import { bepaalZone, bepaalDeuren, registreerOnderdrukking } from "./lib/selection.js";
import { aanbodVoorStreek } from "./lib/sterrenbeeld.js";
import { vulBrievenAan, ongelezenBrief, briefOpschrift } from "./lib/maandbrief.js";
import { weekmomentBeschikbaar, schrijfWeekmoment } from "./lib/weekmoment.js";
import { perfectionismeCheckBeschikbaar, registreerPerfectionismeCheck, frictieBeschikbaar, registreerFrictieAangeboden, } from "./lib/meer.js";
import { kwaliteiten, kwaliteitById } from "./data/kwaliteiten.js";
import { huidigeDagSleutel, ochtendMomentVandaag, voorVandaagVanGisteren, } from "./lib/ritme.js";
import { dhikrById } from "./data/adhkar.js";
import { themas, themaById } from "./data/themas.js";
import { begroeting, dagdeelVan, datumregel, suggestiesVoorNu, } from "./lib/nu.js";
import { alleWoorden } from "./data/woorden.js";
import { visieBeschikbaarAlsIntro, registreerVisieIntroAangeboden, schrijfVisie, periodeLabel, visieFragment, visieFragmentZichtbaar, visieCheckInsVoor, toekomstSignaal, } from "./lib/visie.js";
let data;
/**
 * v25 — puur voor deze sessie, nooit bewaard (geen Wet-4-schending: dit is
 * geen geschiedenis, het reset bij elke herlaad). `suggestiesVoorNu()` kijkt
 * per dagdeel niet of je iets al deed — "Hoe voel je je?" mag midden op de
 * dag best twee keer, dat is het punt van een stemmingscheck. Maar zonder
 * geheugen kwam precies dezelfde kaart terug op het startscherm nádat je hem
 * net had afgerond, wat aanvoelt alsof er niets gebeurd is. Dit onthoudt
 * alleen "wat stond er net nog als hoofdkaart", zodat die daarna een keer
 * plaatsmaakt voor de volgende die past.
 */
let laatstGekozenSuggestie = null;
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
async function bewaren() {
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
function toonMelding(tekst, soort = "neutraal") {
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
    const scherm = el("div", { class: "scherm" }, [
        el("p", { class: "vraag" }, [teksten.eerstOpening.vraag]),
        el("p", { class: "zacht" }, [teksten.kompas.schijfUitleg]),
        kompasVeld(canvas),
        el("p", { class: "zacht" }, [teksten.kompas.schijfUitkomst]),
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
        onKlaar: () => setTimeout(() => toonS2(), 220),
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
    const nabij = viaSchijf ? woordenNabij(tikPositie.energie, tikPositie.toon, 10) : alleWoorden();
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
        const lijst = eigenWoordTekst.trim() ? treffers : nabij;
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
            grid,
            zoekInvoer,
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
function verlaatHuidigMoment() {
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
function toonS4(openWaarom = new Set()) {
    if (!huidigMoment)
        return toonThuis();
    const zone = huidigMoment.zone;
    const deuren = bepaalDeuren(zone, huidigMoment.tijdBeschikbaar, data, data.instellingen.islamitischeLaag, huidigMoment.woorden);
    function kiesDeur(id) {
        if (!huidigMoment)
            return;
        huidigMoment.gekozenDeur = id;
        void bewaren();
        if (id === "niets-doen") {
            render([
                el("div", { class: "scherm" }, [
                    el("p", { class: "vraag" }, [teksten.deuren.nietsDoen.bijKiezen]),
                ]),
            ]);
            setTimeout(() => toonS7(), 1600);
        }
        else {
            toonS5(id);
        }
    }
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
        setTimeout(() => toonS1(huidigeTikPositie), 1400);
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
            terugKnop(() => toonS3()),
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
    toonOefening(bewegingId, {
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
        data.sterren.push({
            id: nieuwId("s"),
            momentId: huidigMoment.id,
            streek,
            datum: new Date().toISOString().slice(0, 10),
            zin: zin || null,
        });
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
        onKlaar: () => setTimeout(toonHetVerschil, 250),
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
function toonS7() {
    render([el("div", { class: "scherm", style: "min-height:60vh;width:100%;" }, [])]);
    dimEnDan(() => {
        toonThuis();
    });
}
// ── S8 — De Hemel ─────────────────────────────────────────────────────
// `netGetekend` laat het zojuist gemaakte sterrenbeeld één keer opkomen
// (v2.4 §11: draw-on van ±700 ms, daarna nooit meer animatie).
function toonS8(netGetekend = null) {
    if (data.sterren.length === 0) {
        render([
            el("div", { class: "scherm" }, [
                terugKnop(() => toonTerugkijken()),
                el("p", { class: "regel" }, [teksten.deHemel.legeHemel]),
            ]),
        ]);
        return;
    }
    const canvas = el("canvas", { class: "hemel-canvas" });
    const zinRegel = el("p", { class: "zacht" }, [""]);
    const aanbodStreek = netGetekend ? null : aanbodVoorStreek(data);
    const onderkant = el("div", { class: "hemel-onder" }, [zinRegel]);
    render([el("div", { class: "scherm" }, [terugKnop(() => toonTerugkijken()), canvas, onderkant])]);
    const stop = tekenHemel(canvas, data.sterren, (ster) => {
        zinRegel.textContent = ster.zin ?? "";
    }, {
        sterrenbeelden: data.sterrenbeelden,
        nieuwSterrenbeeldId: netGetekend,
        rustig: data.instellingen.rustigeBeelden,
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
    render([el("div", { class: "scherm" }, [canvas, el("div", { class: "hemel-onder" }, [uitleg, knoppen])])]);
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
function toonS12(brief, vanuitArchief) {
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
function toonS13() {
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
function toonS14Intro() {
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
function toonS15Onderbreker() {
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
    toonOefening(bewegingId, {
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
function toonS17PerfectionismeCheck() {
    function eindigen() {
        setTimeout(() => toonS7(), 1200);
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
function toonS18Frictie() {
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
function toonS19Normaliseren() {
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
    toonOefening(bewegingId, {
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
function toonS20WieIkWord() {
    const veld = el("textarea", { placeholder: teksten.wieIkWord.placeholder });
    veld.value = data.wieIkWord ?? "";
    const melding = el("p", { class: "zacht" }, [""]);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonTerugkijken()),
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
function toonS21Kwaliteiten() {
    const islamAan = data.instellingen.islamitischeLaag;
    const lijst = el("div", { class: "woorden-grid" });
    function vulLijst() {
        const huidig = data.verlangenVanDePeriode?.kwaliteitId ?? null;
        lijst.replaceChildren(...kwaliteiten.map((k) => el("button", {
            class: "woord-knop",
            "aria-pressed": huidig === k.id,
            onclick: () => {
                data.verlangenVanDePeriode = { kwaliteitId: k.id, sinds: new Date().toISOString() };
                void bewaren();
                vulLijst();
            },
        }, [islamAan && k.islamNaam ? `${k.naam} (${k.islamNaam})` : k.naam])));
    }
    vulLijst();
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonTerugkijken()),
            el("p", { class: "vraag" }, [teksten.kwaliteiten.vraag]),
            el("p", { class: "zacht" }, [teksten.kwaliteiten.onderschrift]),
            lijst,
        ]),
    ]);
}
// ── S22 — Ochtend: Richting ──────────────────────────────────────────────
// v2.md §9.1 punt 6, v2.3 §2.4 "Het Ritme". De boog met gebedstijden-
// inkepingen staat hier (nog) niet: die vereist `adhan-js`, dat in deze
// omgeving niet te installeren was (geen npm-registry-toegang) — zie
// Fase-3-Bouw-status.md v20. Deze tekstuele versie van S22 is functioneel
// wel compleet: intentie, kerntaak, het gekozen verlangen in beeld.
function toonS22Ochtend() {
    const intentieVeld = el("input", { type: "text", placeholder: teksten.ochtend.intentiePlaceholder });
    const kerntaakVeld = el("textarea", { placeholder: teksten.ochtend.kerntaakPlaceholder });
    const kwaliteit = data.verlangenVanDePeriode ? kwaliteitById(data.verlangenVanDePeriode.kwaliteitId) : null;
    const islamAan = data.instellingen.islamitischeLaag;
    // v22: hetzelfde lichte fragment als op het startscherm, alleen als de
    // ochtend-toggle aan staat.
    const fragment = data.visie && visieCheckInsVoor(data).ochtend ? visieFragment(data.visie, new Date()) : null;
    function klaar() {
        data.ochtendMomenten = data.ochtendMomenten ?? [];
        data.ochtendMomenten.push({
            id: nieuwId("o"),
            datum: huidigeDagSleutel(),
            intentie: intentieVeld.value.trim() || null,
            kerntaak: kerntaakVeld.value.trim() || null,
        });
        void bewaren();
        toonS7();
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
        ? [data.visie.wieIkBen, data.visie.watIkHeb, data.visie.waarIkSta].filter((r) => r.trim().length > 0)
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
function toonS23AvondSluiten() {
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
        if (data.instellingen.islamitischeLaag) {
            toonDhikr("ayat-al-kursi", () => toonS7(), () => toonS7());
        }
        else {
            toonS7();
        }
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
function toonVisieIntro() {
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.visie.introKop]),
            el("div", { class: "regels" }, teksten.visie.introRegels.map((r) => el("p", { class: "regel" }, [r]))),
            el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [teksten.visie.introHerkomst])]),
            el("button", { class: "knop", onclick: () => toonVisiePeriode() }, [teksten.visie.beginnen]),
            el("button", {
                class: "knop-klein",
                onclick: () => {
                    registreerVisieIntroAangeboden(data);
                    void bewaren();
                    toonThuis();
                },
            }, [teksten.visie.latereKeer]),
        ]),
    ]);
}
function toonVisiePeriode() {
    const periodes = ["3_maanden", "1_jaar", "5_jaar"];
    let gekozen = data.visie?.periode ?? null;
    const grid = el("div", { class: "woorden-grid" });
    function vulGrid() {
        grid.replaceChildren(...periodes.map((p) => el("button", {
            class: "woord-knop",
            "aria-pressed": gekozen === p,
            onclick: () => {
                gekozen = p;
                vulGrid();
            },
        }, [periodeLabel(p)])));
    }
    vulGrid();
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.visie.periodeVraag]),
            el("p", { class: "zacht" }, [teksten.visie.periodeOnderschrift]),
            grid,
            el("button", {
                class: "knop",
                onclick: () => {
                    if (!gekozen)
                        return;
                    toonVisieDeel(gekozen, 0, { wieIkBen: "", watIkHeb: "", waarIkSta: "" });
                },
            }, [teksten.visie.verder]),
            el("button", { class: "knop-klein", onclick: () => toonThuis() }, [teksten.visie.latereKeer]),
        ]),
    ]);
}
/** De drie vragen, één gedeelde functie — index 0/1/2, met de stip-rij uit
 * toonOefening() als voortgang. Elk deel is individueel over te slaan (mag
 * leeg blijven, zelfde geest als elders in de app); de herschrijfhulp is
 * een hint, nooit een blokkade. */
function toonVisieDeel(periode, index, onderweg) {
    const stappen = [
        {
            veld: "wieIkBen",
            vraag: teksten.visie.stapWieIkBenVraag,
            onderschrift: teksten.visie.stapWieIkBenOnderschrift,
            placeholder: teksten.visie.stapWieIkBenPlaceholder,
        },
        {
            veld: "watIkHeb",
            vraag: teksten.visie.stapWatIkHebVraag,
            onderschrift: teksten.visie.stapWatIkHebOnderschrift,
            placeholder: teksten.visie.stapWatIkHebPlaceholder,
        },
        {
            veld: "waarIkSta",
            vraag: `${teksten.visie.stapWaarIkStaVraagPrefix} ${periodeLabel(periode)}?`,
            onderschrift: teksten.visie.stapWaarIkStaOnderschrift,
            placeholder: teksten.visie.stapWaarIkStaPlaceholder,
        },
    ];
    const stap = stappen[index];
    const veld = el("textarea", { placeholder: stap.placeholder });
    veld.value = onderweg[stap.veld];
    const hint = el("p", { class: "zacht" }, [""]);
    function verversHint() {
        const signaal = toekomstSignaal(veld.value);
        hint.textContent = signaal ?? "";
    }
    verversHint();
    veld.addEventListener("input", verversHint);
    function verder(tekst) {
        const volgende = { ...onderweg, [stap.veld]: tekst.trim() };
        if (index < stappen.length - 1) {
            toonVisieDeel(periode, index + 1, volgende);
        }
        else {
            toonVisieKlaar(periode, volgende);
        }
    }
    render([
        el("div", { class: "scherm" }, [
            index > 0
                ? terugKnop(() => {
                    const huidig = { ...onderweg, [stap.veld]: veld.value.trim() };
                    toonVisieDeel(periode, index - 1, huidig);
                })
                : terugKnop(() => toonVisiePeriode()),
            el("div", { class: "stip-rij" }, stappen.map((_, i) => el("span", { class: `stip${i <= index ? " vol" : ""}` }))),
            el("p", { class: "vraag" }, [stap.vraag]),
            el("p", { class: "zacht" }, [stap.onderschrift]),
            veld,
            hint,
            el("button", { class: "knop", onclick: () => verder(veld.value) }, [
                teksten.visie.verder,
            ]),
            el("button", { class: "knop-klein", onclick: () => verder("") }, [teksten.visie.slaOver]),
        ]),
    ]);
}
function toonVisieKlaar(periode, onderweg) {
    data.visie = schrijfVisie(periode, onderweg.wieIkBen, onderweg.watIkHeb, onderweg.waarIkSta, data.visie);
    registreerVisieIntroAangeboden(data);
    void bewaren();
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.visie.klaarKop]),
            el("p", { class: "regel" }, [teksten.visie.klaarRegel]),
            el("button", { class: "knop", onclick: () => toonThuis() }, [teksten.visie.naarDeApp]),
            el("button", { class: "knop-klein", onclick: () => toonS24Wish() }, [teksten.visie.klaarNaarDoel]),
        ]),
    ]);
}
/** Leesscherm + toegang tot herschrijven, bereikbaar via Terugkijken. */
function toonVisieBekijken() {
    if (!data.visie) {
        render([
            el("div", { class: "scherm" }, [
                terugKnop(() => toonTerugkijken()),
                el("p", { class: "vraag" }, [teksten.visie.bekijkGeenVisie]),
                el("button", { class: "knop", onclick: () => toonVisiePeriode() }, [teksten.visie.bekijkSchrijf]),
            ]),
        ]);
        return;
    }
    const visie = data.visie;
    const regels = [visie.wieIkBen, visie.watIkHeb, visie.waarIkSta].filter((r) => r.trim().length > 0);
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonTerugkijken()),
            el("p", { class: "vraag" }, [`${teksten.visie.introKop} — ${periodeLabel(visie.periode)}`]),
            el("div", { class: "herkomst" }, regels.map((r) => el("p", { class: "herkomst-regel" }, [r]))),
            el("button", {
                class: "knop",
                onclick: () => toonVisieDeel(visie.periode, 0, {
                    wieIkBen: visie.wieIkBen,
                    watIkHeb: visie.watIkHeb,
                    waarIkSta: visie.waarIkSta,
                }),
            }, [teksten.visie.herschrijven]),
        ]),
    ]);
}
// Kleine, consistente lijnstijl-iconen (24×24, currentColor) — geen los
// icon-pakket nodig voor drie tekens. "Nu" = een puls (nadruk op dit moment),
// "Doen" = een play-vorm (actie), "Terugkijken" = een terugdraaiende pijl.
const NAV_ICOON = {
    nu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>',
    doen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M8 5.5v13l11-6.5z"/></svg>',
    terugkijken: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 9a8 8 0 1 1 1.1 9.1"/><path d="M4.5 4v5.2h5.2"/></svg>',
};
function navBalk(actief) {
    const item = (tab, label, actie) => el("button", { class: `nav-item${actief === tab ? " actief" : ""}`, onclick: actie }, [
        el("span", { class: "nav-icoon", html: NAV_ICOON[tab] }, []),
        el("span", { class: "nav-label" }, [label]),
    ]);
    return el("nav", { class: "nav-balk" }, [
        item("nu", "Nu", () => toonThuis()),
        item("doen", "Doen", () => toonDoen()),
        item("terugkijken", "Terugkijken", () => toonTerugkijken()),
    ]);
}
const TERUG_ICOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
/** Eén consistent terug-pijltje linksboven — vervangt overal een los
 * tekstlinkje ("← terug", "Terug"), soms onderaan het scherm. Altijd het
 * eerste element van het scherm, altijd hetzelfde icoon. */
function terugKnop(actie) {
    return el("button", { class: "terug-knop", onclick: actie, "aria-label": "Terug", html: TERUG_ICOON }, []);
}
function duurTekst(bewegingId) {
    const b = bewegingById(bewegingId);
    if (!b)
        return "";
    const [van, tot] = b.kosten.tijdMinuten;
    return van === tot ? `${van} min` : `${van}–${tot} min`;
}
function rijKnop(titel, onder, actie) {
    return el("button", { class: "rij-knop", onclick: actie }, [
        el("span", { class: "rij-tekst" }, [
            el("span", { class: "rij-titel" }, [titel]),
            el("span", { class: "rij-onder" }, [onder]),
        ]),
        el("span", { class: "rij-chevron", "aria-hidden": "true" }, ["›"]),
    ]);
}
const EQ_METER_HTML = "<span></span><span></span><span></span><span></span>";
function kaartPrimair(s) {
    return el("button", { class: "kaart kaart-primair", onclick: () => voerSuggestieUit(s) }, [
        el("span", { class: "kaart-label-rij" }, [
            el("span", { class: "kaart-label" }, ["Dit past nu"]),
            el("span", { class: "eq-meter", "aria-hidden": "true", html: EQ_METER_HTML }, []),
        ]),
        el("span", { class: "kaart-titel" }, [s.titel]),
        s.duur ? el("span", { class: "kaart-duur" }, [s.duur]) : null,
        el("span", { class: "kaart-waarom" }, [s.waaromNu]),
        el("span", { class: "kaart-actie" }, ["Doen →"]),
    ]);
}
/**
 * v25 — wat er staat als er op dit moment niets nieuws meer te "doen" valt
 * (je deed net de enige suggestie die er was). In plaats van diezelfde kaart
 * gewoon nog eens te tonen — wat aanvoelt alsof er niets gebeurd is — komt
 * hier iets dat verder kijkt dan het huidige moment: je eigen visie, of de
 * uitnodiging om er een te schrijven. Geen lege plek, geen herhaling.
 */
function kaartVisieFallback() {
    if (data.visie) {
        const fragment = visieFragment(data.visie, new Date());
        return el("button", { class: "kaart kaart-primair", onclick: () => toonVisieBekijken() }, [
            el("span", { class: "kaart-label-rij" }, [
                el("span", { class: "kaart-label" }, ["Even verder denken"]),
                el("span", { class: "eq-meter", "aria-hidden": "true", html: EQ_METER_HTML }, []),
            ]),
            el("span", { class: "kaart-titel" }, ["Waar je naartoe leeft"]),
            el("span", { class: "kaart-waarom" }, [
                fragment ? `${fragment.label}: ${fragment.tekst}` : "Lees nog eens terug wat je opschreef.",
            ]),
            el("span", { class: "kaart-actie" }, ["Teruglezen →"]),
        ]);
    }
    return el("button", { class: "kaart kaart-primair", onclick: () => toonVisiePeriode() }, [
        el("span", { class: "kaart-label-rij" }, [
            el("span", { class: "kaart-label" }, ["Even verder denken"]),
            el("span", { class: "eq-meter", "aria-hidden": "true", html: EQ_METER_HTML }, []),
        ]),
        el("span", { class: "kaart-titel" }, ["Wie wil je worden?"]),
        el("span", { class: "kaart-waarom" }, [
            "Denk aan over een paar maanden, een jaar, vijf jaar — en schrijf het nu al op, alsof het al zo is.",
        ]),
        el("span", { class: "kaart-actie" }, ["Beginnen →"]),
    ]);
}
function kaartKlein(s) {
    return el("button", { class: "kaart kaart-klein", onclick: () => voerSuggestieUit(s) }, [
        el("span", { class: "kaart-titel-klein" }, [s.titel]),
        el("span", { class: "kaart-meta" }, [s.duur ? `${s.duur} · ${s.waaromNu}` : s.waaromNu]),
    ]);
}
function voerSuggestieUit(s) {
    // "rust" ("Het is laat") heeft geen actie en verdringt dus ook nooit de
    // volgende hoofdkaart.
    if (s.soort !== "rust")
        laatstGekozenSuggestie = { soort: s.soort, id: s.id };
    switch (s.soort) {
        case "ochtend":
            return toonS22Ochtend();
        case "avond":
            return toonS23AvondSluiten();
        case "beweging":
            if (s.id)
                toonOefening(s.id, { opKlaar: () => toonVrijeAfronding(s.id), opTerug: () => toonThuis() });
            return;
        case "dhikr":
            if (s.id)
                toonDhikr(s.id, () => toonThuis());
            return;
        case "kompas":
            return startKompasLus();
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
// ── Het startscherm ───────────────────────────────────────────────────
function toonThuis() {
    const nu = new Date();
    const dagdeel = dagdeelVan(nu);
    const suggesties = suggestiesVoorNu(data, nu);
    // "Het is laat" is geen actie maar een opmerking — die krijgt geen knop.
    const opmerking = suggesties.find((s) => s.soort === "rust") ?? null;
    const kandidaten = suggesties.filter((s) => s.soort !== "rust");
    // v25 — sla de kaart over die je net als hoofdkaart deed, zodat je na het
    // afronden ervan niet exact diezelfde kaart terugziet (zie
    // laatstGekozenSuggestie hierboven). Is er niets anders over, dan komt de
    // visie-kaart in de plaats — nooit een lege plek waar de hoofdkaart stond.
    const nietZojuistGedaan = (s) => !(laatstGekozenSuggestie && s.soort === laatstGekozenSuggestie.soort && s.id === laatstGekozenSuggestie.id);
    const eersteActie = kandidaten.find(nietZojuistGedaan) ?? null;
    const verder = kandidaten.filter((s) => s !== eersteActie);
    // v22: het lichte visie-fragment, alleen ochtend/middag (de avond krijgt
    // het volledige leesblok in toonS23AvondSluiten) en alleen als de
    // bijhorende toggle aan staat.
    const fragment = data.visie && visieFragmentZichtbaar(data, dagdeel) ? visieFragment(data.visie, nu) : null;
    // v25 — twee velden die de app zelf vraagt en daarna nooit meer toonde.
    // "Iets kleins voor morgen" bestaat precies om je het de volgende ochtend
    // terug te geven (dat is het hele mechanisme achter dat veld), en een
    // kerntaak die je 's ochtends opschrijft heeft alleen zin als je hem
    // later op de dag nog een keer ziet. Eén stille regel, geen kaart, geen
    // afvinkvakje, geen herinnering die aandringt.
    const voorVandaag = dagdeel === "vroege_ochtend" || dagdeel === "ochtend" ? voorVandaagVanGisteren(data, nu) : null;
    const kerntaakVandaag = dagdeel === "middag" || dagdeel === "avond"
        ? ochtendMomentVandaag(data, nu)?.kerntaak?.trim() || null
        : null;
    // De vaste ingang "Hoe voel je je?" stond er 's middags twee keer: één keer
    // als hoofdsuggestie en één keer als vaste regel eronder.
    const kompasAlBoven = suggesties.some((sg) => sg.soort === "kompas");
    render([
        el("div", { class: "scherm scherm-app" }, [
            el("header", { class: "thuis-kop" }, [
                el("p", { class: "merk-kicker" }, ["Life Maxing"]),
                el("h1", { class: "thuis-groet" }, [begroeting(dagdeel)]),
                el("p", { class: "thuis-datum" }, [datumregel(nu)]),
            ]),
            opmerking ? el("p", { class: "opmerking" }, [`${opmerking.titel}. ${opmerking.waaromNu}`]) : null,
            voorVandaag ? el("p", { class: "opmerking" }, [`${teksten.nuRegels.voorMorgen}: ${voorVandaag}`]) : null,
            kerntaakVandaag ? el("p", { class: "opmerking" }, [`${teksten.nuRegels.kerntaak}: ${kerntaakVandaag}`]) : null,
            fragment ? el("p", { class: "opmerking" }, [`${fragment.label}: ${fragment.tekst}`]) : null,
            eersteActie ? kaartPrimair(eersteActie) : kaartVisieFallback(),
            verder.length ? el("p", { class: "sectie-kop" }, ["Past nu ook"]) : null,
            ...verder.map(kaartKlein),
            el("p", { class: "sectie-kop" }, ["Of begin hier"]),
            kompasAlBoven
                ? null
                : rijKnop("Hoe voel je je?", "Een woord kiezen, dan drie opties. 2 min.", () => startKompasLus()),
            rijKnop("Ik ben eruit gevallen", "Terug beginnen zonder het groot te maken.", () => toonS19Normaliseren()),
            rijKnop("Ik zit vast in mijn telefoon", "Onderbreken zonder jezelf iets te verbieden.", () => toonS15Onderbreker()),
            navBalk("nu"),
        ]),
    ]);
}
// ── Doen — de bibliotheek, per thema ──────────────────────────────────
function toonDoen() {
    const islamAan = data.instellingen.islamitischeLaag;
    render([
        el("div", { class: "scherm scherm-app" }, [
            el("h1", { class: "tab-kop" }, ["Doen"]),
            el("p", { class: "zacht" }, ["Kies waar je nu iets aan hebt."]),
            ...themas
                .filter((t) => !t.islamitisch || islamAan)
                .map((t) => el("button", {
                class: "kaart kaart-klein",
                onclick: () => (t.bewegingIds.length === 0 && !t.dhikrIds ? toonS24Richting() : toonThema(t.id)),
            }, [
                el("span", { class: "kaart-titel-klein" }, [t.titel]),
                el("span", { class: "kaart-meta" }, [t.onderschrift]),
            ])),
            navBalk("doen"),
        ]),
    ]);
}
function toonThema(id) {
    const t = themaById(id);
    if (!t)
        return toonDoen();
    // Wat nú past wordt binnen het thema gemarkeerd — hetzelfde oordeel als op
    // het startscherm, zodat de timing overal doorwerkt en niet alleen op "Nu".
    const nuIds = new Set(suggestiesVoorNu(data)
        .map((s) => s.id)
        .filter((x) => Boolean(x)));
    const islamAan = data.instellingen.islamitischeLaag;
    const items = [];
    for (const bid of t.bewegingIds) {
        const b = bewegingById(bid);
        if (!b)
            continue;
        const past = nuIds.has(bid);
        items.push(el("button", {
            class: `kaart kaart-klein${past ? " past-nu" : ""}`,
            onclick: () => toonOefening(bid, { opKlaar: () => toonVrijeAfronding(bid), opTerug: () => toonThema(id) }),
        }, [
            el("span", { class: "kaart-titel-klein" }, [b.titel]),
            el("span", { class: "kaart-meta" }, [past ? `${duurTekst(bid)} · past nu` : duurTekst(bid)]),
        ]));
    }
    if (islamAan && t.dhikrIds) {
        for (const did of t.dhikrIds) {
            const d = dhikrById(did);
            if (!d)
                continue;
            const past = nuIds.has(did);
            items.push(el("button", { class: `kaart kaart-klein${past ? " past-nu" : ""}`, onclick: () => toonDhikr(did, () => toonThema(id)) }, [
                el("span", { class: "kaart-titel-klein" }, [d.titel]),
                el("span", { class: "kaart-meta" }, [past ? `${d.wanneer} · past nu` : d.wanneer]),
            ]));
        }
    }
    render([
        el("div", { class: "scherm scherm-app" }, [
            terugKnop(() => toonDoen()),
            el("h1", { class: "tab-kop" }, [t.titel]),
            el("p", { class: "zacht" }, [t.onderschrift]),
            ...items,
            navBalk("doen"),
        ]),
    ]);
}
// ── Terugkijken ───────────────────────────────────────────────────────
function toonTerugkijken() {
    const brief = ongelezenBrief(data);
    const heeftBrieven = (data.brieven ?? []).length > 0;
    render([
        el("div", { class: "scherm scherm-app" }, [
            el("h1", { class: "tab-kop" }, ["Terugkijken"]),
            rijKnop("Wat je al deed", "De sterren die je onderweg verzamelde.", () => toonS8()),
            brief
                ? rijKnop("Er ligt een brief", "Je eigen zinnen van vorige maand.", () => toonS12(brief, false))
                : heeftBrieven
                    ? rijKnop("Je brieven", "Alles wat je al eerder las.", () => toonS13())
                    : null,
            weekmomentBeschikbaar(data)
                ? rijKnop("De spiegel van de week", "Beeld, obstakel, plan. 10 min.", () => toonS14Intro())
                : null,
            rijKnop("Mijn visie", data.visie ? "Herlezen of herschrijven." : "Waar je naartoe leeft, in het nu geschreven.", () => toonVisieBekijken()),
            rijKnop("Wie ik word", "Je eigen zin, wanneer je hem wil bijstellen.", () => toonS20WieIkWord()),
            rijKnop("Verlangen van deze periode", "De kwaliteit waar je nu op mikt.", () => toonS21Kwaliteiten()),
            perfectionismeCheckBeschikbaar(data)
                ? rijKnop("Voelt dit nog als hulp?", "Eén vraag, hooguit één keer per maand.", () => toonS17PerfectionismeCheck())
                : null,
            frictieBeschikbaar(data)
                ? rijKnop("Frictie buiten de app", "Vier manieren om minder te scrollen.", () => toonS18Frictie())
                : null,
            rijKnop("Instellingen", "De islamitische laag, rustige beelden, export.", () => toonS10()),
            navBalk("terugkijken"),
        ]),
    ]);
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
                beweging.medischeGrens
                    ? el("div", { class: "herkomst" }, beweging.medischeGrens.map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel])))
                    : null,
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
function zichtbareBewegingen() {
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
function toonVrijeAfronding(bewegingId) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return toonS7();
    const veld = el("textarea", { placeholder: teksten.vrijeAfronding.placeholder });
    function bewaarSter() {
        data.sterren.push({
            id: nieuwId("s"),
            momentId: null,
            streek: beweging.streek,
            datum: huidigeDagSleutel(),
            zin: veld.value.trim() || null,
        });
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
            el("button", { class: "knop-klein", onclick: () => { bewaarSter(); toonThuis(); } }, [
                teksten.vrijeAfronding.naarStart,
            ]),
        ]),
    ]);
}
// ── Dhikr-lezer ───────────────────────────────────────────────────────
// adhkar.md, ontwerpregel: de app toont de tekst en de betekenis, nooit een
// aantal — ook niet wanneer het aantal letterlijk in de bron staat.
function toonDhikr(id, opTerug, opKlaar = toonKlaar) {
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
function toonS24Richting() {
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
function toonS24Wish() {
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
            setTimeout(() => toonDoen(), 900);
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
            el("button", { class: "knop-klein", onclick: () => toonThuis() }, ["Terug naar start"]),
        ]),
    ]);
}
// ── De kompaslus, nu met woorden eerst ────────────────────────────────
// Tot v20 begon deze lus op de schijf: een lege cirkel zonder assen of
// uitleg. Vanaf v21 begin je bij de woorden (twee tikken) en is de schijf
// een optie voor wie het preciezer wil aangeven.
function startKompasLus() {
    huidigeTikPositie = null;
    huidigMoment = null;
    toonS2();
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
    // v25 — dagelijkse melding, ook als de app dicht staat. Leunt op een
    // losse, minimale server (lib/meldingen.ts legt uit waarom dat voor web
    // push niet anders kan) -- de enige netwerkaanroep die deze app ooit doet,
    // en alleen wanneer je dit hier zelf aanzet.
    const meldingenAan = !!data.instellingen.meldingenTijd;
    const meldingenFout = el("p", { class: laatsteMeldingenFout ? "zacht zacht--fout" : "zacht" }, [laatsteMeldingenFout ?? ""]);
    const meldingenSectie = [
        el("p", { class: "sectie-kop" }, ["Meldingen"]),
        switchRij("Dagelijkse melding", "Ook als de app gesloten is. Vraagt eenmalig toestemming van je toestel.", meldingenAan, async (v) => {
            if (v) {
                const tijd = data.instellingen.meldingenTijd ?? "21:00";
                const resultaat = await zetMeldingenAan(tijd);
                if (resultaat.ok) {
                    data.instellingen.meldingenTijd = tijd;
                    await bewaren();
                    laatsteMeldingenFout = null;
                }
                else {
                    laatsteMeldingenFout =
                        resultaat.reden === "geweigerd"
                            ? "Je toestel weigerde toestemming. Zet dit aan bij de meldingeninstellingen van je toestel of browser voor deze app, en probeer het hier opnieuw."
                            : resultaat.reden === "niet_ondersteund"
                                ? "Meldingen worden niet ondersteund in deze browser."
                                : "Dit lukte nu niet. Probeer het later opnieuw.";
                }
            }
            else {
                await zetMeldingenUit();
                data.instellingen.meldingenTijd = null;
                await bewaren();
                laatsteMeldingenFout = null;
            }
            toonS10();
        }),
        meldingenAan
            ? el("div", { class: "toggle-rij" }, [
                el("div", { class: "toggle-tekst" }, [
                    el("span", {}, ["Tijdstip"]),
                    el("span", { class: "zacht" }, ["Wanneer je de melding wil krijgen."]),
                ]),
                el("input", {
                    type: "time",
                    value: data.instellingen.meldingenTijd,
                    onchange: async (e) => {
                        const nieuweTijd = e.target.value;
                        if (!nieuweTijd)
                            return;
                        const resultaat = await zetMeldingenAan(nieuweTijd);
                        if (resultaat.ok) {
                            data.instellingen.meldingenTijd = nieuweTijd;
                            await bewaren();
                        }
                    },
                }),
            ])
            : null,
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
                onclick: async () => {
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
function toonS11() {
    const melding = el("p", { class: "zacht" }, [""]);
    const invoer = el("input", { type: "file", accept: "application/json" });
    invoer.addEventListener("change", async () => {
        const bestand = invoer.files?.[0];
        if (!bestand)
            return;
        const tekst = await bestand.text();
        const geimporteerd = parseGeimporteerdBestand(tekst);
        if (!geimporteerd) {
            melding.textContent = teksten.legeStaten.importMislukt;
            melding.classList.add("zacht--fout");
            return;
        }
        data = geimporteerd;
        await bewaren();
        toonThuis();
    });
    render([
        el("div", { class: "scherm" }, [
            terugKnop(() => toonS0()),
            el("p", { class: "vraag" }, ["Bestand kiezen"]),
            invoer,
            melding,
        ]),
    ]);
}
