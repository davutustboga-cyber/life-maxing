// app.ts — de volledige schermenlus S0 t/m S11, zie schermenoverzicht.md.
// Eén bestand, geen router-library: de dagelijkse lus is toch al lineair
// (S1 → S2 → S3 → S4 → (S5 → S6) → S7).
import { laadBestand, bewaarBestand, wisBestand, exporteerBestand, parseGeimporteerdBestand } from "./lib/db.js";
import { el, render, dimEnDan } from "./lib/dom.js";
import { tekenSchijf, tekenHemel, tekenSterrenbeeldModus, tekenVerschil, nauwelijksVerschoven, } from "./lib/canvas.js";
import { woordenNabij, zetEigenWoorden, zoekWoorden } from "./data/woorden.js";
import { bewegingById, bewegingen } from "./data/bewegingen.js";
import { teksten } from "./data/teksten.js";
import { bepaalZone, bepaalDeuren, registreerOnderdrukking } from "./lib/selection.js";
import { aanbodVoorStreek } from "./lib/sterrenbeeld.js";
import { vulBrievenAan, ongelezenBrief, briefOpschrift } from "./lib/maandbrief.js";
import { weekmomentBeschikbaar, schrijfWeekmoment } from "./lib/weekmoment.js";
import { perfectionismeCheckBeschikbaar, registreerPerfectionismeCheck, frictieBeschikbaar, registreerFrictieAangeboden, } from "./lib/meer.js";
let data;
// state voor het moment dat nu wordt opgebouwd
let huidigeTikPositie = null;
let huidigMoment = null;
function nieuwId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
async function bewaren() {
    const gelukt = await bewaarBestand(data);
    if (!gelukt) {
        // teksten.yaml → lege_staten.storage_vol_of_geweigerd. Die tekst bestond
        // wel maar werd nooit getoond; stil falen is het ergste wat een app die
        // "dit bestand is alles" belooft kan doen.
        toonMelding(teksten.legeStaten.storageVolOfGeweigerd);
    }
}
/** Eén rustige regel onderaan het scherm, die vanzelf weer weggaat. */
function toonMelding(tekst) {
    const bestaand = document.querySelector(".melding");
    if (bestaand)
        bestaand.remove();
    const regel = el("p", { class: "melding zacht" }, [tekst]);
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
    else {
        toonS1();
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
                    toonS1();
                },
            }, [teksten.eerstOpening.knop]),
            el("button", { class: "knop-klein", onclick: () => toonS11() }, ["Ik heb al een bestand"]),
        ]),
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
        canvas,
        el("button", { class: "knop-klein", onclick: () => toonS15Onderbreker() }, [teksten.onderbreker.toegangKnoptekst]),
        el("button", { class: "knop-klein", onclick: () => toonS16Meer() }, ["meer"]),
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
    const positie = huidigeTikPositie ?? { energie: 0, toon: 0 };
    const nabij = woordenNabij(positie.energie, positie.toon, 10);
    const gekozen = new Set();
    let eigenWoordTekst = "";
    function verder() {
        if (gekozen.size === 0 && !eigenWoordTekst.trim())
            return;
        const woordIds = [...gekozen];
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
            },
        }, [w.woord])));
    }
    vulGrid();
    const zoekInvoer = el("input", {
        type: "text",
        placeholder: teksten.kompas.zoekveldPlaceholder,
        oninput: (e) => {
            eigenWoordTekst = e.target.value;
            vulGrid();
        },
    });
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.kompas.openingsvraag]),
            grid,
            zoekInvoer,
            el("button", { class: "knop", onclick: verder }, ["Verder"]),
        ]),
    ]);
}
// ── S3 — Tijdvraag ────────────────────────────────────────────────────
function toonS3() {
    render([
        el("div", { class: "scherm" }, [
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
function toonS4() {
    if (!huidigMoment)
        return toonS1();
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
        return el("div", { class: "deur" }, [
            el("button", { class: "knop-klein", style: "all:unset;cursor:pointer;text-align:left;color:inherit;font-size:1.05rem;", onclick: () => kiesDeur(id) }, [
                beweging.titel,
            ]),
            el("span", { class: "deur-onderschrift" }, [`${beweging.kosten.tijdMinuten[0]}–${beweging.kosten.tijdMinuten[1]} min`]),
            el("button", { class: "lengte-link", onclick: () => ditKloptNiet(id) }, [teksten.deuren.ditKloptNiet.knoptekst]),
        ]);
    });
    render([el("div", { class: "scherm" }, [el("div", { class: "deuren" }, kaarten)])]);
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
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [beweging.script]),
            el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
            timerVisual(bewegingId),
            // De belofte uit S0 waargemaakt: per label één eigen regel, nooit
            // samengevoegd. Hier en niet op S4, want daar moeten de drie deuren
            // gelijk ogen (selectie.yaml → niets_doen.ontwerpregel).
            el("div", { class: "herkomst" }, beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel]))),
            el("button", { class: "knop", onclick: () => toonS6(beweging.streek) }, ["Klaar"]),
        ]),
    ]);
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
            canvas,
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
function toonS7() {
    // v2.5 §6.1 onderdeel 9 en v2.3 §3.1: het dimmen is de belangrijkste
    // animatie van de app, want hij stuurt je weg. `dimEnDan` bestond al maar
    // werd nergens aangeroepen. Er is bewust geen knop en geen klikvlak terug
    // naar het begin (schermenoverzicht.md S7, Wet 3) — je sluit de app zelf.
    render([el("div", { class: "scherm", style: "min-height:60vh;width:100%;" }, [])]);
    dimEnDan(() => {
        /* het scherm blijft leeg; de app doet niets meer tot je hem opnieuw opent */
    });
}
// ── S8 — De Hemel ─────────────────────────────────────────────────────
// `netGetekend` laat het zojuist gemaakte sterrenbeeld één keer opkomen
// (v2.4 §11: draw-on van ±700 ms, daarna nooit meer animatie).
function toonS8(netGetekend = null) {
    if (data.sterren.length === 0) {
        render([
            el("div", { class: "scherm" }, [
                el("p", { class: "regel" }, [teksten.deHemel.legeHemel]),
                el("button", { class: "knop-klein", onclick: () => toonS16Meer() }, ["Terug"]),
            ]),
        ]);
        return;
    }
    const canvas = el("canvas", { class: "hemel-canvas" });
    const zinRegel = el("p", { class: "zacht" }, [""]);
    const aanbodStreek = netGetekend ? null : aanbodVoorStreek(data);
    const onderkant = el("div", { class: "hemel-onder" }, [
        zinRegel,
        el("button", { class: "knop-klein", onclick: () => toonS16Meer() }, ["Terug"]),
    ]);
    render([el("div", { class: "scherm" }, [canvas, onderkant])]);
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
            el("h1", { class: "brief-opschrift" }, [opschrift]),
            el("div", { class: "brief-tekst" }, rest.map((alinea) => el("p", {}, [alinea]))),
            el("button", {
                class: "knop-klein",
                onclick: () => (vanuitArchief ? toonS13() : toonS7()),
            }, [vanuitArchief ? teksten.deBrief.terugNaarBrieven : teksten.deBrief.sluiten]),
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
            el("div", { class: "brieven-lijst" }, brieven.map((brief) => el("button", { class: "brief-regel", onclick: () => toonS12(brief, true) }, [
                briefOpschrift(brief, brieven),
            ]))),
            el("button", { class: "knop-klein", onclick: () => toonS16Meer() }, ["Terug"]),
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
            el("button", { class: "knop-klein", onclick: () => toonS1() }, [teksten.weekmoment.intro.nuNiet]),
        ]),
    ]);
}
function toonS14Beeld() {
    const veld = el("textarea", { placeholder: teksten.weekmoment.beeld.placeholder });
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.weekmoment.beeld.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => toonS14Werkelijkheid(veld.value),
            }, ["Verder"]),
        ]),
    ]);
}
function toonS14Werkelijkheid(beeld) {
    const veld = el("textarea", { placeholder: teksten.weekmoment.werkelijkheid.placeholder });
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.weekmoment.werkelijkheid.vraag]),
            veld,
            el("button", {
                class: "knop",
                onclick: () => toonS14Plan(beeld, veld.value),
            }, ["Verder"]),
        ]),
    ]);
}
function toonS14Plan(beeld, werkelijkheid) {
    const veld = el("textarea", { placeholder: teksten.weekmoment.plan.placeholder });
    render([
        el("div", { class: "scherm" }, [
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
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.weekmoment.actie.vraag]),
            el("div", { class: "brieven-lijst" }, bewegingen.map((b) => el("button", {
                class: "brief-regel",
                onclick: () => {
                    data.weekmomenten = [
                        ...(data.weekmomenten ?? []),
                        schrijfWeekmoment(beeld, werkelijkheid, plan, b.id),
                    ];
                    void bewaren();
                    toonS14Afsluiting(plan, b.id);
                },
            }, [b.titel]))),
        ]),
    ]);
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
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [teksten.onderbreker.andersDoenVraag]),
            el("div", { class: "brieven-lijst" }, bewegingen.map((b) => el("button", { class: "brief-regel", onclick: () => toonS15Beweging(b.id) }, [b.titel]))),
        ]),
    ]);
}
// Toont dezelfde beweging als S5 (script, minimumversie, herkomst), maar
// sluit direct af via S7 in plaats van door te gaan naar S6 — er is hier
// geen moment en geen zone om aan te verankeren, en dat hoeft ook niet:
// dit is een onderbreking, geen sessie.
function toonS15Beweging(bewegingId) {
    const beweging = bewegingById(bewegingId);
    if (!beweging)
        return toonS7();
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, [beweging.script]),
            el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
            timerVisual(bewegingId),
            el("div", { class: "herkomst" }, beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel]))),
            el("button", { class: "knop", onclick: () => toonS7() }, ["Klaar"]),
        ]),
    ]);
}
// ── S16 — Meer ────────────────────────────────────────────────────────
// v1.1-meer.md, 6 september 2026: het ene, stille toegangspunt (v2.2 Wet 5,
// v2.4 Wet 10.3). Puur navigatie, geen eigen vraag of uitleg. Elk item alleen
// zichtbaar als het nu relevant is — geen badge, geen teller, geen "3 nieuwe
// dingen" (dat zou zelf weer een tellend element zijn, Wet 4).
function toonS16Meer() {
    const brief = ongelezenBrief(data);
    render([
        el("div", { class: "scherm" }, [
            el("button", { class: "knop-klein", onclick: () => toonS8() }, [teksten.deHemel.toegangKnoptekst]),
            brief
                ? el("button", { class: "knop-klein", onclick: () => toonS12(brief, false) }, [
                    teksten.deBrief.aankondiging,
                ])
                : (data.brieven ?? []).length > 0
                    ? el("button", { class: "knop-klein", onclick: () => toonS13() }, [teksten.deBrief.archiefKnoptekst])
                    : null,
            weekmomentBeschikbaar(data)
                ? el("button", { class: "knop-klein", onclick: () => toonS14Intro() }, [teksten.weekmoment.toegangKnoptekst])
                : null,
            frictieBeschikbaar(data)
                ? el("button", { class: "knop-klein", onclick: () => toonS18Frictie() }, [teksten.meer.frictieKnoptekst])
                : null,
            perfectionismeCheckBeschikbaar(data)
                ? el("button", { class: "knop-klein", onclick: () => toonS17PerfectionismeCheck() }, [
                    teksten.meer.perfectionismeKnoptekst,
                ])
                : null,
            el("button", { class: "knop-klein", onclick: () => toonS10() }, [teksten.meer.instellingenKnoptekst]),
            el("button", { class: "knop-klein", onclick: () => toonS1() }, [teksten.meer.terug]),
        ]),
    ]);
}
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
    render([
        el("div", { class: "scherm" }, [
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
            el("button", {
                class: "knop",
                onclick: () => {
                    exporteerBestand(data);
                    meldingTekst.textContent = teksten.instellingen.exportGelukt;
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
            el("button", { class: "knop-klein", onclick: () => toonS1() }, ["Terug"]),
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
            return;
        }
        data = geimporteerd;
        await bewaren();
        toonS1();
    });
    render([
        el("div", { class: "scherm" }, [
            el("p", { class: "vraag" }, ["Bestand kiezen"]),
            invoer,
            melding,
            el("button", { class: "knop-klein", onclick: () => toonS0() }, ["Terug"]),
        ]),
    ]);
}
// toegangspunt voor instellingen vanaf elk scherm (kleine, vaste ingang)
export function naarInstellingen() {
    toonS10();
}
