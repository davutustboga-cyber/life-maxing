// kamers.ts — het huis: de hal (Vandaag) en de kamers (v27 herontwerp).
//
// De app is opgebouwd als een huis. Je komt binnen in de hal, die zegt wat er
// vandaag past en waar je naartoe leeft; van daaruit loop je een kamer in. Elke
// kamer heeft één doel, één kleur van licht en één eigen vorm — niet negen
// keer dezelfde lijst kaarten:
//
//   Mijn visie   een leesbare, persoonlijke tekst (je vijfjaarsvisie)
//   Adem & rust  instrumenten die met je meeademen
//   Lichaam      drie praktische handelingen, zonder meten
//   Mensen       vier zinnen die je kunt doen
//   Geloof       dhikr, verhalen van de profeten, reflectie
//   Motivatie    een ondersteunende plek, niet het midden van de app
//
// De flows zelf (oefeningen, Dag sluiten, WOOP, De Hemel) blijven in app.ts;
// dit bestand bepaalt hoe je er naartoe loopt en hoe het huis eruitziet.
//
// Wat hier NIET gebeurt, en bewust niet: niets wordt geteld of als prestatie
// getoond (Wet 4); niets dringt aan (Wet 5); de Onderbreker en de herstelroute
// blijven altijd bereikbaar (Wet 8) en stateless.
import { el, render, dimEnDan } from "./lib/dom.js";
import { buitenSvg, dagtijdVan } from "./lib/huisWereld.js";
import { halSvg, HAL_DEUREN, deurMidden } from "./lib/huisHal.js";
import { kamerSceneSvg } from "./lib/kamerScene.js";
import { trappen, trapZin, objectenAan, nieuweObjecten, nieuwObjectZin, OBJECT_NAMEN, markeerHuisGezien, laatsteZinInKamer, } from "./lib/huis.js";
import { GEVOELENS, adviesVoor, visieRegelVoorKamer, eersteStapVoorKamer } from "./lib/routing.js";
import { glyphs } from "./lib/glyphs.js";
import { kamers, kamerById, kamerVanBeweging } from "./data/kamers.js";
import { themas, themaById } from "./data/themas.js";
import { bewegingById } from "./data/bewegingen.js";
import { adhkar, dhikrById } from "./data/adhkar.js";
import { teksten } from "./data/teksten.js";
import { profetenVerhalen, motivatiehoekVoorVandaag } from "./data/motivatiehoek.js";
import { begroeting, dagdeelVan, dagdeelGroep, datumregel, slotRegels, dagAanbod, alVandaagGedaan, eigenZinVanEerder, verrasMe, } from "./lib/nu.js";
import { huidigeDagSleutel, dagVanJaar, dagdeelAfgerond, ochtendMomentVandaag, voorVandaagVanGisteren, } from "./lib/ritme.js";
import { VISIE_DELEN, visieDelen, visieFragment, visieFragmentZichtbaar, visieTeksten, schrijfVisieDelen, periodeLabel, toekomstSignaal, registreerVisieIntroAangeboden, } from "./lib/visie.js";
import { weekmomentBeschikbaar } from "./lib/weekmoment.js";
import { ongelezenBrief } from "./lib/maandbrief.js";
import { perfectionismeCheckBeschikbaar, frictieBeschikbaar } from "./lib/meer.js";
import { data, bewaren, ruimSessieOp, extraIsGevraagd, vraagExtra, voerSuggestieUit, duurTekst, terugKnop, toonBeweging, toonVrijeAfronding, toonDhikr, startKompasLus, toonS24Richting, toonS20WieIkWord, toonS21Kwaliteiten, toonS14Intro, toonS8, toonS7, toonS10, toonS12, toonS13, toonS15Onderbreker, toonS17PerfectionismeCheck, toonS18Frictie, toonS19Normaliseren, toonMelding, zichtbareBewegingen, startMomentUitCheckIn, } from "./app.js";
function glyph(naam, klasse = "") {
    return el("span", { class: `glyph ${klasse}`.trim(), "aria-hidden": "true", html: glyphs[naam] }, []);
}
/** Eén rij in een lijst zonder kaders: titel, een regel eronder, dunne chevron. */
function rij(titel, onder, actie) {
    return el("button", { class: "rij", onclick: actie }, [
        el("span", { class: "rij-tekst" }, [el("span", { class: "rij-titel" }, [titel]), onder ? el("span", { class: "rij-onder" }, [onder]) : null]),
        glyph("verder", "rij-pijl"),
    ]);
}
/** De bovenrand van een kamer: terug naar de hal, en rechts optioneel één handeling. */
function kamerBalk(opTerug, rechts) {
    return el("div", { class: "kamer-balk" }, [terugKnop(opTerug), rechts ?? null]);
}
function kamerKop(kamer, titel = kamer.naam, regel = kamer.doel) {
    return el("header", { class: "kamer-kop" }, [
        el("h1", { class: "kamer-titel" }, [titel]),
        regel ? el("p", { class: "kamer-doel" }, [regel]) : null,
    ]);
}
/** Het scherm-omhulsel van een kamer: zet de sfeer (data-kamer) en de indeling. */
function kamerScherm(id, kinderen, extra = "") {
    return el("div", { class: `scherm scherm-app scherm-kamer ${extra}`.trim(), "data-kamer": id }, kinderen);
}
function islamAan() {
    return data.instellingen.islamitischeLaag;
}
/** De kamer van binnen, met de voorwerpen die er nu staan. */
function kamerScene(id, nieuw = null) {
    const aan = objectenAan(data)[id] ?? [];
    return el("figure", { class: "kamer-scene", html: kamerSceneSvg(id, aan, nieuw) }, []);
}
/**
 * Twee lagen per kamer, bewust gescheiden:
 *   de kamer zelf (toonKamerBinnen)   ontdekken, rust, zien wat je hebt opgebouwd
 *   de activiteiten (toonKamer)       oefeningen, opdrachten, theorie, reflectie
 * "Terug" uit de activiteiten gaat naar de kamer als je daar vandaan kwam
 * ("kamer"), en anders naar Vandaag ("thuis"). Vandaag zet dit altijd terug.
 */
let kamerHerkomst = "thuis";
let laatsteKamer = null;
function terugNaarHerkomst() {
    if (kamerHerkomst === "kamer" && laatsteKamer)
        toonKamerBinnen(laatsteKamer);
    else
        toonThuis();
}
/** Alle deuren blijven zichtbaar; Geloof met de laag uit is gedimd en opent een uitleg met een aan-knop. */
function zichtbareKamers() {
    return kamers;
}
/** Naar de hal, of via "terug" naar een kamer: kort vloeiend, zonder animatie te forceren. */
export function toonKamer(id) {
    if (kamerById(id))
        laatsteKamer = id;
    switch (id) {
        case "visie":
            return toonKamerVisie();
        case "adem":
            return toonKamerAdem();
        case "lichaam":
            return toonKamerLichaam();
        case "mensen":
            return toonKamerMensen();
        case "geloof":
            return toonKamerGeloof();
        case "motivatie":
            return toonKamerMotivatie();
        default:
            return toonThuis();
    }
}
// ── De hal: Vandaag ────────────────────────────────────────────────────
function kamerVanSuggestie(s) {
    switch (s.soort) {
        case "beweging": {
            const b = s.id ? bewegingById(s.id) : undefined;
            const islam = Boolean(b?.herkomst.some((h) => h.label === "I"));
            return s.id ? kamerVanBeweging(s.id, themas, islam) : null;
        }
        case "dhikr":
            return kamerById("geloof") ?? null;
        case "kompas":
            return kamerById("adem") ?? null;
        case "week":
            return kamerById("visie") ?? null;
        default:
            return null;
    }
}
function slotBlok(groep) {
    const r = slotRegels(groep);
    return el("div", { class: "slot-blok" }, [
        el("p", { class: "slot-dit" }, [r.dit]),
        r.straks ? el("p", { class: "slot-straks" }, [r.straks]) : null,
    ]);
}
/**
 * De visie op de hal (bouwplan: "de visie is de persoonlijke richting"). Een
 * groot, rustig stuk tekst — één deel van je vijfjaarsvisie, per dag een ander
 * — met licht erachter. Geen kaart, geen knop-look; het is een plek waar je
 * naartoe kijkt en waar je op kunt tikken. Zonder visie een uitnodiging.
 */
function visieHero() {
    const fragment = data.visie ? visieFragment(data.visie, new Date(), islamAan()) : null;
    if (!fragment) {
        return el("button", { class: "visie-hero visie-hero--leeg", "data-kamer": "visie", onclick: () => toonVisieSchrijven() }, [
            el("span", { class: "visie-hero-zin" }, [teksten.visie.introKop]),
            el("span", { class: "visie-hero-onder" }, [teksten.visie.heroUitnodiging, glyph("schrijven")]),
        ]);
    }
    return el("button", { class: "visie-hero", "data-kamer": "visie", onclick: () => toonKamerVisie() }, [
        el("span", { class: "visie-hero-zin" }, [`${fragment.label} ${fragment.tekst}`]),
        el("span", { class: "visie-hero-onder" }, [`Over ${periodeLabel(data.visie.periode)}`, glyph("verder")]),
    ]);
}
export function toonThuis() {
    kamerHerkomst = "thuis";
    ruimSessieOp();
    const nu = new Date();
    const dagdeel = dagdeelVan(nu);
    const groep = dagdeelGroep(dagdeel);
    // Eén duidelijke kern (met hooguit één korte aanvulling); wat daarna kan komt
    // pas als je er zelf om vraagt (zie lib/nu.ts, dagAanbod).
    const dag = dagAanbod(data, nu);
    const rust = dag.rust;
    const kandidaten = [...dag.kern, ...dag.extra];
    const afgerond = dagdeelAfgerond(data, groep, nu) || dag.kern.length === 0;
    const extraSleutel = `${huidigeDagSleutel(nu)}|${groep}`;
    const nacht = groep === "nacht";
    const toonSlot = !nacht && (afgerond ? !extraIsGevraagd(extraSleutel) || kandidaten.length === 0 : kandidaten.length === 0);
    const aanbod = nacht || toonSlot ? null : (kandidaten[0] ?? null);
    const kanNogIets = !nacht && toonSlot && kandidaten.length > 0;
    // De korte aanvulling staat onder de kern, maar niet meer als je al iets deed
    // in dit dagdeel: dan is het aan jou of je nog iets wil.
    const daarna = aanbod && !afgerond && dag.kern.length === 2 && aanbod === dag.kern[0] ? dag.kern[1] : null;
    // Eén stille regel onder de visie: wat je gisteravond voor vandaag schreef,
    // je kerntaak, of één van je eigen eerdere zinnen. Nooit meer dan één. Is er
    // in het huis iets bijgekomen sinds je het voor het laatst zag, dan gaat die
    // ene zin voor (één keer, daarna is hij gezien).
    let stilleRegel = null;
    const trapNu = trappen(data);
    const huisNieuw = nieuweObjecten(data);
    if (huisNieuw.length > 0) {
        const eerste = huisNieuw[0];
        const k = kamerById(eerste.kamer);
        if (k)
            stilleRegel = nieuwObjectZin(eerste.kamer, k.naam, eerste.nummer);
        markeerHuisGezien(data);
        void bewaren();
    }
    else if (rust) {
        stilleRegel = `${rust.titel}. ${rust.waaromNu}`;
    }
    else {
        const voorVandaag = groep === "ochtend" ? voorVandaagVanGisteren(data, nu) : null;
        const kerntaak = groep === "middag" || groep === "avond" ? ochtendMomentVandaag(data, nu)?.kerntaak?.trim() || null : null;
        if (voorVandaag)
            stilleRegel = `${teksten.nuRegels.voorMorgen}: ${voorVandaag}`;
        else if (kerntaak)
            stilleRegel = `${teksten.nuRegels.kerntaak}: ${kerntaak}`;
        else {
            const eigen = dagVanJaar(nu) % 3 === 0 ? eigenZinVanEerder(data, nu) : null;
            if (eigen)
                stilleRegel = eigen;
            else if (data.visie && visieFragmentZichtbaar(data, dagdeel)) {
                // De visie staat al bovenaan; alleen 's ochtends/'s middags nog een tweede deel.
                const f = visieFragment(data.visie, new Date(nu.getTime() + 86400000), islamAan());
                const hero = visieFragment(data.visie, nu, islamAan());
                if (f && hero && f.tekst !== hero.tekst)
                    stilleRegel = `${f.label} ${f.tekst}`;
            }
        }
    }
    render([
        el("div", { class: "scherm scherm-app scherm-hal", "data-kamer": "vandaag" }, [
            el("header", { class: "hal-kop" }, [
                el("div", { class: "hal-groet" }, [
                    el("h1", { class: "hal-titel" }, [begroeting(dagdeel)]),
                    el("p", { class: "hal-datum" }, [datumregel(nu)]),
                ]),
                el("div", { class: "hal-tekens" }, [
                    el("button", { class: "teken", "aria-label": "Je huis", onclick: () => toonHuis() }, [glyph("huis")]),
                    el("button", { class: "teken", "aria-label": "Meer", onclick: () => toonMeer() }, [glyph("instellingen")]),
                ]),
            ]),
            visieHero(),
            stilleRegel ? el("p", { class: "opmerking" }, [stilleRegel]) : null,
            vandaagPaneel(aanbod, toonSlot ? groep : null, kanNogIets, extraSleutel, daarna),
            el("nav", { class: "kamerdeuren", "aria-label": "De kamers" }, zichtbareKamers().map((k, i) => {
                const deur = el("button", { class: `kamerdeur${k.islamitisch && !islamAan() ? " kamerdeur--uit" : ""}`, "data-kamer": k.id, "aria-haspopup": "dialog", onclick: (e) => toonKamerBlad(k, e.currentTarget) }, [
                    glyph(k.glyph, "kamerdeur-glyph"),
                    el("span", { class: "kamerdeur-naam" }, [k.naam]),
                ]);
                deur.style.setProperty("--i", String(i));
                // De deur licht mee met hoe ver de kamer is ingericht (Motivatie is altijd aan).
                deur.style.setProperty("--trap", String(k.id === "motivatie" ? 3 : (trapNu[k.id] ?? 0)));
                return deur;
            })),
        ]),
    ]);
}
/**
 * "Vandaag" is één paneel, geen los blok met drie losse links eronder. Bovenaan
 * het voorstel van dit moment (of, als er niets meer te doen is, de rustige
 * slotregel); onderaan, in hetzelfde licht, de drie manieren om zelf te sturen:
 * zeggen hoe je je voelt (de eerste, dus iets groter), je laten verrassen, en
 * "het gaat even niet". De onderbreker blijft daarmee één tik bereikbaar (wet 8).
 */
function vandaagPaneel(aanbod, slotVoor, kanNogIets, extraSleutel, daarna = null) {
    const kamer = aanbod ? kamerVanSuggestie(aanbod) : null;
    const meta = aanbod ? [kamer?.naam, aanbod.duur].filter(Boolean).join(" · ") : "";
    const kern = aanbod
        ? el("button", { class: "vandaag-kern", onclick: () => voerSuggestieUit(aanbod) }, [
            el("span", { class: "nu-titel" }, [aanbod.titel]),
            el("span", { class: "nu-waarom" }, [aanbod.waaromNu]),
            aanbod.nieuw ? el("span", { class: "nu-nieuw" }, [teksten.nuRegels.nieuw]) : null,
            el("span", { class: "nu-voet" }, [
                el("span", { class: "nu-meta" }, [kamer ? glyph(kamer.glyph) : null, meta || "Vandaag"]),
                el("span", { class: "nu-actie" }, ["Beginnen", glyph("verder")]),
            ]),
        ])
        : slotVoor || kanNogIets
            ? el("div", { class: "vandaag-kern vandaag-kern--stil" }, [
                slotVoor ? slotBlok(slotVoor) : null,
                kanNogIets
                    ? el("button", {
                        class: "knop-klein",
                        onclick: () => {
                            vraagExtra(extraSleutel);
                            toonThuis();
                        },
                    }, ["Ik wil nog iets extra doen"])
                    : null,
            ])
            : null;
    const dockKnop = (soort, naam, tekst, actie) => el("button", { class: `dock-knop dock-knop--${soort}`, onclick: actie }, [
        el("span", { class: "dock-teken" }, [glyph(naam)]),
        el("span", { class: "dock-naam" }, [tekst]),
    ]);
    const daarnaRij = daarna
        ? el("button", { class: "vandaag-daarna", onclick: () => voerSuggestieUit(daarna) }, [
            el("span", { class: "daarna-label" }, ["Daarna", el("span", { class: "daarna-wil" }, [", als je wil"])]),
            el("span", { class: "daarna-titel" }, [daarna.titel]),
            el("span", { class: "daarna-duur" }, [daarna.duur]),
        ])
        : null;
    return el("section", { class: `vandaag${kern ? "" : " vandaag--alleen"}`, "data-kamer": kamer?.id ?? "vandaag", "aria-label": "Vandaag" }, [
        kern,
        daarnaRij,
        el("div", { class: "vandaag-dock" }, [
            dockKnop("gevoel", "gevoel", "Hoe voel je je?", () => toonCheckIn("vrij")),
            dockKnop("verras", "verras", "Verras me", () => toonVerrasMe()),
            dockKnop("steun", "houvast", "Het gaat even niet", () => toonHetGaatEvenNiet()),
        ]),
    ]);
}
/**
 * "Het gaat even niet" vat De Onderbreker en de herstelroute samen. Wet 8 (de
 * Onderbreker altijd bereikbaar) blijft gehaald: één tik vanaf de hal. Beide
 * routes blijven stateless.
 */
function toonHetGaatEvenNiet() {
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": "vandaag" }, [
            kamerBalk(() => toonThuis()),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, ["Het gaat even niet"]),
                el("p", { class: "kamer-doel" }, ["Kies wat het meest lijkt op nu."]),
            ]),
            el("div", { class: "rij-lijst" }, [
                rij("Ik zit vast in mijn telefoon", "Onderbreken zonder jezelf iets te verbieden.", () => toonS15Onderbreker()),
                rij("Ik ben eruit gevallen", "Terug beginnen zonder het groot te maken.", () => toonS19Normaliseren()),
            ]),
        ]),
    ]);
}
/** "Verras me": de app kiest één beweging, met één regel waarom. Zonder geheugen. */
function toonVerrasMe(vast, uitsluiten = []) {
    const s = vast ?? verrasMe(data, zichtbareBewegingen(), uitsluiten);
    if (!s || !s.id)
        return toonThuis();
    const id = s.id;
    const kamer = kamerVanSuggestie(s);
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": kamer?.id ?? "vandaag" }, [
            kamerBalk(() => toonThuis()),
            el("button", {
                class: "nu-paneel",
                onclick: () => toonBeweging(id, { opKlaar: () => toonVrijeAfronding(id), opTerug: () => toonVerrasMe(s, uitsluiten) }),
            }, [
                el("span", { class: "nu-titel" }, [s.titel]),
                el("span", { class: "nu-waarom" }, [s.waaromNu]),
                el("span", { class: "nu-voet" }, [
                    el("span", { class: "nu-meta" }, [kamer ? glyph(kamer.glyph) : null, [kamer?.naam, s.duur].filter(Boolean).join(" · ")]),
                    el("span", { class: "nu-actie" }, ["Beginnen", glyph("verder")]),
                ]),
            ]),
            el("button", { class: "knop-klein", onclick: () => toonVerrasMe(undefined, [...uitsluiten, id]) }, ["nog één"]),
        ]),
    ]);
}
// ── Lijsten met bewegingen (per thema) ─────────────────────────────────
function bewegingRij(b, opTerug) {
    return rij(b.titel, `${duurTekst(b.id)} · ${b.minimumversie}`, () => toonBeweging(b.id, { opKlaar: () => toonVrijeAfronding(b.id), opTerug }));
}
/** Alle bewegingen van één thema als rustige lijst, in de sfeer van de kamer. */
function toonThemaLijst(themaId, kamerId) {
    const t = themaById(themaId);
    if (!t)
        return toonKamer(kamerId);
    const opTerug = () => toonThemaLijst(themaId, kamerId);
    const items = [];
    for (const bid of t.bewegingIds) {
        const b = bewegingById(bid);
        if (b)
            items.push(bewegingRij(b, opTerug));
    }
    if (islamAan() && t.dhikrIds) {
        for (const did of t.dhikrIds) {
            const d = dhikrById(did);
            if (d)
                items.push(rij(d.titel, d.wanneer, () => toonDhikr(did, opTerug)));
        }
    }
    render([
        kamerScherm(kamerId, [
            kamerBalk(() => toonKamer(kamerId)),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, [t.titel]),
                el("p", { class: "kamer-doel" }, [t.doet]),
            ]),
            el("div", { class: "rij-lijst" }, items),
        ]),
    ]);
}
// ── Mijn visie ─────────────────────────────────────────────────────────
/** De eerste keer: een uitnodiging, eenmalig aangeboden (Wet 5), nooit herhaald. */
export function toonVisieIntro() {
    render([
        el("div", { class: "scherm scherm-app scherm-kamer scherm-midden", "data-kamer": "visie" }, [
            el("h1", { class: "visie-titel visie-titel--groot" }, [teksten.visie.introKop]),
            el("div", { class: "visie-uitleg" }, teksten.visie.introRegels.map((r) => el("p", {}, [r]))),
            el("p", { class: "visie-herkomst" }, [teksten.visie.introHerkomst]),
            el("button", { class: "knop", onclick: () => toonVisieSchrijven() }, [teksten.visie.beginnen]),
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
/**
 * De schrijfruimte: alle zeven delen op één rustige pagina, elk met een stam
 * in de ik-vorm die je zelf afmaakt. Niets is verplicht, alles is later aan te
 * passen. De herschrijfhulp (toekomstSignaal) is een zachte hint, nooit een
 * blokkade. `focus` opent direct bij het deel dat je wilde aanpassen.
 */
export function toonVisieSchrijven(focus) {
    const delen = VISIE_DELEN.filter((d) => !d.islamitisch || islamAan());
    const huidig = visieTeksten(data.visie);
    const velden = new Map();
    const hint = el("p", { class: "visie-hint" }, [""]);
    const bewaarKnop = el("button", { class: "knop" }, ["Bewaren"]);
    const groei = (ta) => {
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
    };
    const verversKnop = () => {
        bewaarKnop.disabled = ![...velden.values()].some((v) => v.value.trim().length > 0);
    };
    const blokken = delen.map((d) => {
        const ta = el("textarea", { placeholder: d.placeholder, rows: "2", "aria-label": d.stam });
        ta.value = huidig[d.veld];
        velden.set(d.veld, ta);
        ta.addEventListener("input", () => {
            groei(ta);
            hint.textContent = toekomstSignaal(ta.value) ?? "";
            verversKnop();
        });
        ta.addEventListener("focus", () => {
            hint.textContent = toekomstSignaal(ta.value) ?? "";
        });
        return el("label", { class: "schrijf-deel" }, [el("span", { class: "schrijf-stam" }, [d.stam]), ta]);
    });
    bewaarKnop.addEventListener("click", () => {
        const waarden = {};
        for (const [veld, ta] of velden)
            waarden[veld] = ta.value;
        // Delen die niet getoond werden (geloof met de laag uit) blijven zoals ze waren.
        for (const d of VISIE_DELEN)
            if (!velden.has(d.veld))
                waarden[d.veld] = huidig[d.veld];
        data.visie = schrijfVisieDelen(waarden, data.visie);
        registreerVisieIntroAangeboden(data);
        void bewaren();
        toonMelding(teksten.visie.bewaard);
        toonKamerVisie();
    });
    render([
        el("div", { class: "scherm scherm-app scherm-kamer scherm-schrijven", "data-kamer": "visie" }, [
            kamerBalk(() => (data.visie ? toonKamerVisie() : toonThuis())),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, [teksten.visie.schrijfKop]),
                el("p", { class: "kamer-doel" }, [teksten.visie.schrijfRegel]),
            ]),
            ...blokken,
            hint,
            el("div", { class: "schrijf-voet" }, [bewaarKnop]),
        ]),
    ]);
    for (const ta of velden.values())
        groei(ta);
    verversKnop();
    const doel = focus ? velden.get(focus) : undefined;
    if (doel) {
        doel.focus({ preventScroll: true });
        doel.scrollIntoView({ block: "center" });
        doel.setSelectionRange(doel.value.length, doel.value.length);
    }
}
/** De kamer zelf: je vijfjaarsvisie, gelezen als één rustige tekst. */
export function toonKamerVisie() {
    const visie = data.visie;
    const delen = visie ? visieDelen(visie, islamAan()) : [];
    const kamer = kamerById("visie");
    const verder = el("div", { class: "rij-lijst visie-verder" }, [
        rij("Van visie naar een doel", "Wat wil je eerst, en wat staat er in de weg?", () => toonS24Richting()),
        rij("Wie ik word", "Eén zin die je kunt bijstellen.", () => toonS20WieIkWord()),
        rij("Verlangen van deze periode", "De kwaliteit waar je nu op mikt.", () => toonS21Kwaliteiten()),
        weekmomentBeschikbaar(data) ? rij("De spiegel van de week", "Beeld, obstakel, plan. 10 min.", () => toonS14Intro()) : null,
        rij("Aanpakken", "Als er iets blijft liggen.", () => toonThemaLijst("doorzetten", "visie")),
    ]);
    if (!visie || delen.length === 0) {
        render([
            kamerScherm("visie", [
                kamerBalk(terugNaarHerkomst),
                el("h1", { class: "visie-titel visie-titel--groot" }, [teksten.visie.introKop]),
                el("div", { class: "visie-uitleg" }, teksten.visie.introRegels.map((r) => el("p", {}, [r]))),
                el("p", { class: "visie-herkomst" }, [teksten.visie.introHerkomst]),
                el("button", { class: "knop", onclick: () => toonVisieSchrijven() }, [teksten.visie.bekijkSchrijf]),
                verder,
            ]),
        ]);
        return;
    }
    const geschreven = new Date(visie.geschrevenOp).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
    render([
        kamerScherm("visie", [
            kamerBalk(terugNaarHerkomst, el("button", { class: "tekst-knop", onclick: () => toonVisieSchrijven() }, [glyph("schrijven"), "Bewerken"])),
            el("header", { class: "visie-kop" }, [
                el("h1", { class: "visie-titel" }, [`Ik, over ${periodeLabel(visie.periode)}`]),
                el("p", { class: "visie-datum" }, [`Geschreven op ${geschreven}`]),
            ]),
            el("article", { class: "visie-tekst" }, delen.map((d, i) => {
                const deel = el("button", {
                    class: "visie-deel",
                    "aria-label": `${d.def.stam} ${d.tekst} — aanpassen`,
                    onclick: () => toonVisieSchrijven(d.def.veld),
                }, [el("span", { class: "visie-stam" }, [d.def.stam]), " ", el("span", { class: "visie-inhoud" }, [d.tekst])]);
                deel.style.setProperty("--i", String(i));
                return deel;
            })),
            verder,
            kamerVoet(),
        ]),
    ]);
    void kamer;
}
// ── Adem & rust ────────────────────────────────────────────────────────
const ADEM_ORBS = [
    { id: "adem-lange-uitademing", naam: "Lang uit", ritme: "4 in · 6 uit" },
    { id: "box-ademhaling", naam: "Box", ritme: "4 · 4 · 4 · 4" },
    { id: "fysiologische-zucht", naam: "Zucht", ritme: "twee in · lang uit" },
    { id: "2-3-4-5-ademhaling", naam: "Oplopend", ritme: "2 · 3 · 4 · 5" },
];
function toonKamerAdem() {
    const kamer = kamerById("adem");
    const terug = () => toonKamerAdem();
    const orbs = ADEM_ORBS.map((o, i) => {
        const orb = el("button", {
            class: "orb",
            onclick: () => toonBeweging(o.id, { opKlaar: () => toonVrijeAfronding(o.id), opTerug: terug }),
        }, [
            el("span", { class: "orb-cirkel", "aria-hidden": "true" }, []),
            el("span", { class: "orb-naam" }, [o.naam]),
            el("span", { class: "orb-ritme" }, [o.ritme]),
        ]);
        orb.style.setProperty("--i", String(i));
        return orb;
    });
    const b = (id, titel, onder) => rij(titel, onder, () => toonBeweging(id, { opKlaar: () => toonVrijeAfronding(id), opTerug: terug }));
    render([
        kamerScherm("adem", [
            kamerBalk(terugNaarHerkomst),
            kamerKop(kamer, "Adem & rust", "Kies een ritme. Het scherm telt voor je."),
            ...kamerStart("adem"),
            el("div", { class: "orbs" }, orbs),
            el("div", { class: "rij-lijst" }, [
                rij("Hoe voel je je?", "Kies een gevoel; ik stel iets voor.", () => toonCheckIn("vrij")),
                rij("De schijf", "Wijs aan waar je bent, dan drie opties.", () => startKompasLus()),
                b("vijf-zintuigen-grounding", "Vijf, vier, drie, twee, één", "Tel af met wat je opmerkt."),
                b("voeten-op-de-grond", "Voeten op de grond", "Dertig seconden is genoeg."),
                b("prikkels-loslaten", "Even helemaal niets", "Vijf minuten zonder prikkel."),
                rij("Hoofd leegmaken", "Als het maalt of piekert.", () => toonThemaLijst("hoofd", "adem")),
                rij("Alles voor rust", "De hele lijst.", () => toonThemaLijst("rust", "adem")),
            ]),
            kamerVoet(),
        ]),
    ]);
}
// ── Lichaam ────────────────────────────────────────────────────────────
const LICHAAM_VANDAAG = {
    ochtend: ["ochtendlicht-zien", "vijf-minuten-naar-buiten", "glas-water", "voeten-op-de-grond"],
    middag: ["vijf-minuten-naar-buiten", "even-opstaan-bewegen", "tien-minuten-wandelen-groen", "wandelen-met-een-vraag", "bewegen-met-een-beeld"],
    avond: ["vijf-minuten-naar-buiten", "adem-lange-uitademing"],
    slapen: ["adem-lange-uitademing", "scherm-zachter-voor-bed", "2-3-4-5-ademhaling"],
    nacht: ["adem-lange-uitademing"],
};
function toonKamerLichaam() {
    const kamer = kamerById("lichaam");
    const groep = dagdeelGroep(dagdeelVan());
    const alle = (LICHAAM_VANDAAG[groep] ?? []).map((id) => bewegingById(id)).filter((b) => Boolean(b));
    // Wat je vandaag al deed komt niet nog eens; is alles gedaan, dan mag het weer.
    const nieuwPool = alle.filter((b) => !alVandaagGedaan(data, `beweging:${b.id}`));
    const pool = nieuwPool.length ? nieuwPool : alle;
    const vandaag = pool.length ? pool[dagVanJaar(new Date()) % pool.length] : null;
    const terug = () => toonKamerLichaam();
    render([
        kamerScherm("lichaam", [
            kamerBalk(terugNaarHerkomst),
            kamerKop(kamer, "Lichaam", kamer.doel),
            ...kamerStart("lichaam", false),
            el("p", { class: "kamer-principe" }, [
                "Je lichaam hoeft niet gemeten te worden om het te kunnen vertrouwen. Hier staat alleen wat je kunt doen, klein en praktisch.",
            ]),
            vandaag
                ? el("button", {
                    class: "band band--vandaag",
                    onclick: () => toonBeweging(vandaag.id, { opKlaar: () => toonVrijeAfronding(vandaag.id), opTerug: terug }),
                }, [
                    el("span", { class: "band-tekst" }, [
                        el("span", { class: "band-titel" }, [vandaag.titel]),
                        el("span", { class: "band-onder" }, [`Vandaag voor je lichaam · ${duurTekst(vandaag.id)}`]),
                    ]),
                    glyph("verder", "band-pijl"),
                ])
                : null,
            el("button", { class: "band", onclick: () => toonThemaLijst("lichaam", "lichaam") }, [
                el("span", { class: "band-tekst" }, [
                    el("span", { class: "band-titel" }, ["Naar buiten en bewegen"]),
                    el("span", { class: "band-onder" }, ["Als stilzitten niet meer helpt."]),
                ]),
                glyph("verder", "band-pijl"),
            ]),
            el("button", { class: "band", onclick: () => toonThemaLijst("slaap", "lichaam") }, [
                el("span", { class: "band-tekst" }, [
                    el("span", { class: "band-titel" }, ["Slaap en ritme"]),
                    el("span", { class: "band-onder" }, ["Wat je dag en nacht op hun plek houdt."]),
                ]),
                glyph("verder", "band-pijl"),
            ]),
            kamerVoet(),
        ]),
    ]);
}
// ── Mensen ─────────────────────────────────────────────────────────────
const MENSEN_ZINNEN = [
    { id: "bericht-sturen", zin: "Stuur iemand een bericht." },
    { id: "dankbaarheid-naar-persoon", zin: "Zeg iemand dat je dankbaar bent." },
    { id: "aanname-omdraaien", zin: "Draai een aanname om." },
    { id: "vergeven-eerste-stap", zin: "Zet een eerste stap naar vergeven." },
];
function toonKamerMensen() {
    const kamer = kamerById("mensen");
    const terug = () => toonKamerMensen();
    render([
        kamerScherm("mensen", [
            kamerBalk(terugNaarHerkomst),
            kamerKop(kamer),
            ...kamerStart("mensen"),
            el("div", { class: "zinnen" }, MENSEN_ZINNEN.map((z, i) => {
                const b = bewegingById(z.id);
                const knop = el("button", { class: "zin", onclick: () => toonBeweging(z.id, { opKlaar: () => toonVrijeAfronding(z.id), opTerug: terug }) }, [el("span", { class: "zin-tekst" }, [z.zin]), el("span", { class: "zin-onder" }, [b ? duurTekst(z.id) : ""])]);
                knop.style.setProperty("--i", String(i));
                return knop;
            })),
            kamerVoet(),
        ]),
    ]);
}
// ── Geloof ─────────────────────────────────────────────────────────────
// ── Geloof ─────────────────────────────────────────────────────────────
// Een volwaardige ruimte, niet één kaartje: de dhikr voor dit moment, het
// verhaal van vandaag, de avondroutine, de bibliotheek van de profeten (per
// profeet), smeekbeden, reflectie en waar je op mikt (met de islamitische
// namen). Alleen wat er al was, met zijn eigen bron; niets verzonnen. De
// groene sfeer is die van deze kamer ([data-kamer="geloof"] in style.css).
// De app vraagt nooit of je gebeden hebt (gebed-anker: geen registratie).
const GELOOF_VOOR_NU = {
    ochtend: "subhan-allahi-wa-bihamdihi",
    middag: "subhan-allahi-wa-bihamdihi",
    avond: "subhan-allahi-wa-bihamdihi",
    slapen: "ayat-al-kursi",
    nacht: "ayat-al-kursi",
};
/** Met de laag uit blijft de deur zichtbaar, zodat je hem kunt aanzetten. */
function toonGeloofUit() {
    render([
        kamerScherm("geloof", [
            kamerBalk(terugNaarHerkomst),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, ["Geloof"]),
                el("p", { class: "kamer-doel" }, ["De islamitische ruimte staat uit."]),
            ]),
            el("p", { class: "kamer-principe" }, [
                "Hier staan dhikr en smeekbeden, de verhalen van de profeten, de avondroutine en reflectie. Zet de ruimte aan om ze te zien; je kunt hem altijd weer uitzetten bij Meer → Instellingen.",
            ]),
            el("button", {
                class: "knop",
                onclick: () => {
                    data.instellingen.islamitischeLaag = true;
                    void bewaren();
                    toonKamerGeloof();
                },
            }, ["Zet de islamitische ruimte aan"]),
        ]),
    ]);
}
export function toonKamerGeloof() {
    if (!islamAan())
        return toonGeloofUit();
    const kamer = kamerById("geloof");
    const groep = dagdeelGroep(dagdeelVan());
    const dhikr = dhikrById(GELOOF_VOOR_NU[groep] ?? "ayat-al-kursi");
    const terug = () => toonKamerGeloof();
    const dag = motivatiehoekVoorVandaag();
    render([
        kamerScherm("geloof", [
            kamerBalk(terugNaarHerkomst),
            kamerKop(kamer),
            ...kamerStart("geloof", false),
            dhikr
                ? el("button", { class: "geloof-nu", onclick: () => toonDhikr(dhikr.id, terug, terug) }, [
                    el("span", { class: "geloof-wanneer" }, [`Voor nu · ${dhikr.wanneer}`]),
                    el("span", { class: "arabisch geloof-arabisch", dir: "rtl", lang: "ar" }, [dhikr.arabisch]),
                    el("span", { class: "geloof-translit" }, [dhikr.transliteratie]),
                    el("span", { class: "geloof-vertaling" }, [dhikr.vertaling]),
                ])
                : null,
            // Het verhaal van vandaag: een eigen paneel, niet een rij tussen andere rijen.
            el("button", {
                class: "geloof-verhaal",
                onclick: () => toonVerhaalLezer(dag.verhaal, terug, "geloof", () => toonProfeetVerhalen(dag.verhaal.profeet, terug)),
            }, [
                el("span", { class: "geloof-verhaal-kop" }, ["Verhaal van vandaag"]),
                el("span", { class: "geloof-verhaal-titel" }, [dag.verhaal.titel]),
                el("span", { class: "geloof-verhaal-profeet" }, [dag.verhaal.profeet]),
                el("span", { class: "geloof-verhaal-thema" }, [dag.verhaal.thema]),
            ]),
            el("div", { class: "rij-lijst" }, [
                rij("Avondroutine", "Ayat al-Kursi, Sayyid al-Istighfar en meer — niets verplicht.", () => toonAvondRoutine()),
                rij("Verhalen van de profeten", "Per profeet, met de bron erbij.", () => toonProfetenLijst()),
                rij("Smeekbeden en dhikr", "Tekst, uitspraak en betekenis.", () => toonDhikrLijst()),
                rij("Reflectie", "Terugkijken, dankbaarheid, vertrouwen.", () => toonThemaLijst("geloof", "geloof")),
                rij("Waar je op mikt", "De kwaliteit van deze periode, met de islamitische naam.", () => toonS21Kwaliteiten()),
            ]),
            kamerVoet(),
        ]),
    ]);
}
function toonDhikrLijst() {
    render([
        kamerScherm("geloof", [
            kamerBalk(() => toonKamerGeloof()),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, ["Smeekbeden en dhikr"]),
                el("p", { class: "kamer-doel" }, ["Met tekst, uitspraak, betekenis en bron."]),
            ]),
            el("div", { class: "rij-lijst" }, adhkar.map((d) => rij(d.titel, d.wanneer, () => toonDhikr(d.id, () => toonDhikrLijst(), () => toonDhikrLijst())))),
        ]),
    ]);
}
/** Eerst de profeten (een korte lijst), dan hun verhalen: geen muur van vijftig titels. */
function toonProfetenLijst() {
    const groepen = new Map();
    for (const v of profetenVerhalen) {
        const lijst = groepen.get(v.profeet) ?? [];
        lijst.push(v);
        groepen.set(v.profeet, lijst);
    }
    const rijen = [...groepen.entries()].map(([profeet, lijst]) => rij(profeet, lijst.length === 1 ? "1 verhaal" : `${lijst.length} verhalen`, () => toonProfeetVerhalen(profeet, () => toonProfetenLijst())));
    render([
        kamerScherm("geloof", [
            kamerBalk(() => toonKamerGeloof()),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, ["Verhalen van de profeten"]),
                el("p", { class: "kamer-doel" }, ["Kies een profeet. Elk verhaal heeft zijn bron erbij."]),
            ]),
            el("div", { class: "rij-lijst" }, rijen),
        ]),
    ]);
}
function toonProfeetVerhalen(profeet, opTerug) {
    const lijst = profetenVerhalen.filter((v) => v.profeet === profeet);
    const hier = () => toonProfeetVerhalen(profeet, opTerug);
    render([
        kamerScherm("geloof", [
            kamerBalk(opTerug),
            el("header", { class: "kamer-kop" }, [el("h1", { class: "kamer-titel kamer-titel--klein" }, [profeet])]),
            el("div", { class: "rij-lijst" }, lijst.map((v, i) => rij(v.titel, v.thema, () => toonVerhaalLezer(v, hier, "geloof", i < lijst.length - 1 ? () => toonVerhaalLezer(lijst[i + 1], hier, "geloof") : undefined)))),
        ]),
    ]);
}
/** Eén verhaal, links uitgelijnd, in leesbreedte; de bron staat eronder. */
function toonVerhaalLezer(v, opTerug, kamer, volgende, volgendeTekst) {
    render([
        el("div", { class: "scherm scherm-app scherm-kamer scherm-lezen", "data-kamer": kamer }, [
            kamerBalk(opTerug),
            el("article", { class: "verhaal" }, [
                el("h1", { class: "verhaal-titel" }, [v.titel]),
                el("p", { class: "verhaal-profeet" }, [v.profeet]),
                ...v.tekst.split("\n\n").map((p) => el("p", { class: "verhaal-alinea" }, [p])),
                el("p", { class: "verhaal-bron" }, [v.bronnen.join(" • ")]),
            ]),
            volgende ? el("button", { class: "knop", onclick: volgende }, [volgendeTekst ?? teksten.motivatiehoek.verder]) : null,
            el("button", { class: "knop-klein", onclick: opTerug }, ["terug"]),
        ]),
    ]);
}
// ── Motivatie ──────────────────────────────────────────────────────────
// Een ondersteunende plek, geen middelpunt: hij staat niet op de hal, dringt
// niets op en heeft geen streak. Er is elke dag één zin, één verhaal en één
// stilstaan-vraag (vooraf opgenomen, geen AI); daarna een deur naar buiten.
function toonKamerMotivatie() {
    const kamer = kamerById("motivatie");
    const dag = motivatiehoekVoorVandaag();
    const start = islamAan() ? () => toonMotivatieVerhaal(dag) : () => toonMotivatieCheck(dag);
    render([
        kamerScherm("motivatie", [
            kamerBalk(terugNaarHerkomst),
            kamerKop(kamer, "Motivatie", "Voor als je even niets meer hebt. Niet voor elke dag."),
            el("blockquote", { class: "quote" }, [
                el("p", { class: "quote-tekst" }, [`“${dag.quote.tekst}”`]),
                el("p", { class: "quote-auteur" }, [dag.quote.auteur]),
            ]),
            // De visie blijft de richting; de motivatie is er ondersteunend naast.
            data.visie
                ? el("button", { class: "kamer-visieregel kamer-visieregel--knop", onclick: () => toonKamerVisie() }, [
                    visieRegelVoorMotivatie() ?? "Herlees je visie.",
                ])
                : null,
            // Het verhaal van een profeet is het hart van deze kamer (zoals in de
            // eerste versie): groot, in het groen van de islamitische ruimte, en het
            // begin van de vaste route verhaal → stilstaan → een deur naar buiten.
            islamAan()
                ? el("button", { class: "geloof-verhaal geloof-verhaal--groot", "data-kamer": "geloof", onclick: start }, [
                    el("span", { class: "geloof-verhaal-kop" }, ["Het verhaal van vandaag"]),
                    el("span", { class: "geloof-verhaal-titel" }, [dag.verhaal.titel]),
                    el("span", { class: "geloof-verhaal-profeet" }, [dag.verhaal.profeet]),
                    el("span", { class: "geloof-verhaal-thema" }, [dag.verhaal.thema]),
                    el("span", { class: "nu-actie geloof-verhaal-actie" }, ["Lees het verhaal", glyph("verder")]),
                ])
                : null,
            el("div", { class: "rij-lijst" }, [
                rij("Sta even stil", "Een korte vraag over wat je hebt.", () => toonMotivatieCheck(dag)),
                islamAan() ? rij("Meer verhalen van de profeten", "In Geloof, per profeet.", () => toonProfetenLijst()) : null,
            ]),
            kamerVoet(),
        ]),
    ]);
}
/** Eén deel van je visie onder het citaat: waar je naartoe leeft, ook als je even niets hebt. */
function visieRegelVoorMotivatie() {
    if (!data.visie)
        return null;
    const f = visieFragment(data.visie, new Date(), islamAan());
    return f ? `Waar je naartoe leeft: ${f.label} ${f.tekst}` : null;
}
function toonMotivatieVerhaal(dag) {
    toonVerhaalLezer(dag.verhaal, () => toonKamerMotivatie(), "motivatie", () => toonMotivatieCheck(dag));
}
function toonMotivatieCheck(dag) {
    const i = dag.realityCheck.interactie;
    let interactie;
    if (i.soort === "open") {
        interactie = el("textarea", { placeholder: i.placeholder, rows: "3", class: "aflevering-veld" });
    }
    else {
        interactie = el("div", { class: "aflevering-opties" }, i.opties.map((optie) => el("button", {
            class: "woord-knop reality-optie",
            onclick: (e) => {
                const btn = e.currentTarget;
                if (i.soort === "enkel") {
                    const ouder = btn.parentElement;
                    if (ouder)
                        Array.from(ouder.children).forEach((c) => c.setAttribute("aria-pressed", "false"));
                }
                btn.setAttribute("aria-pressed", btn.getAttribute("aria-pressed") === "true" ? "false" : "true");
            },
        }, [optie])));
    }
    render([
        el("div", { class: "scherm scherm-app scherm-kamer scherm-lezen", "data-kamer": "motivatie" }, [
            kamerBalk(() => (islamAan() ? toonMotivatieVerhaal(dag) : toonKamerMotivatie())),
            el("p", { class: "aflevering-stilstaan" }, [dag.realityCheck.tekst]),
            el("p", { class: "kamer-doel" }, [i.vraag]),
            interactie,
            el("p", { class: "aflevering-eerlijk" }, [teksten.motivatiehoek.alleenVoorNu]),
            el("button", { class: "knop", onclick: () => toonMotivatieSlot() }, [teksten.motivatiehoek.klaar]),
        ]),
    ]);
}
const MOTIVATIE_DEUREN = [
    "vijf-minuten-naar-buiten",
    "tien-minuten-wandelen-groen",
    "bericht-sturen",
    "adem-lange-uitademing",
    "dankbaarheid-naar-persoon",
    "savoring-zestig-seconden",
    "vijftien-minuten-moeilijke-ding",
];
/** Het slot: één concrete beweging als deur naar buiten, dan terug naar je dag. */
function toonMotivatieSlot() {
    const zichtbaar = zichtbareBewegingen();
    const deuren = MOTIVATIE_DEUREN.map((id) => zichtbaar.find((b) => b.id === id)).filter((b) => Boolean(b));
    const deur = deuren.length ? deuren[dagVanJaar(new Date()) % deuren.length] : null;
    render([
        el("div", { class: "scherm scherm-app scherm-kamer scherm-midden", "data-kamer": "motivatie" }, [
            el("p", { class: "kamer-titel" }, [teksten.motivatiehoek.slot]),
            deur
                ? el("button", {
                    class: "nu-paneel",
                    onclick: () => toonBeweging(deur.id, { opKlaar: () => toonVrijeAfronding(deur.id), opTerug: () => toonMotivatieSlot() }),
                }, [
                    el("span", { class: "nu-titel" }, [deur.titel]),
                    el("span", { class: "nu-waarom" }, [deur.minimumversie]),
                    el("span", { class: "nu-voet" }, [
                        el("span", { class: "nu-meta" }, [`Nu doen · ${duurTekst(deur.id)}`]),
                        el("span", { class: "nu-actie" }, ["Beginnen", glyph("verder")]),
                    ]),
                ])
                : null,
            el("button", { class: "knop-klein", onclick: () => toonS7() }, [teksten.motivatiehoek.klaar]),
        ]),
    ]);
}
// ── Structuur die elke kamer deelt ──────────────────────────────────────
// Elke kamer beantwoordt dezelfde zes vragen, ook al ziet hij er anders uit:
// waar ben ik (titel), waar is het voor (doel), wat is de eerste stap ("Begin
// hier", met reden), wat is er verder (de eigen vorm van de kamer), hoe is het
// hier gesteld (één stille regel: je laatste zin of "hier is het nog stil"),
// en hoe kom ik terug (de voet).
function datumKort(iso) {
    const [j, m, d] = iso.split("-").map(Number);
    return j && m && d ? new Date(j, m - 1, d).toLocaleDateString("nl-BE", { day: "numeric", month: "long" }) : iso;
}
function beginHier(stap, kamerId) {
    const terug = () => toonKamer(kamerId);
    const start = () => {
        if (!stap.id)
            return;
        if (stap.soort === "dhikr")
            toonDhikr(stap.id, terug, terug);
        else
            toonBeweging(stap.id, { opKlaar: () => toonVrijeAfronding(stap.id), opTerug: terug });
    };
    return el("button", { class: "nu-paneel nu-paneel--begin", onclick: start }, [
        el("span", { class: "nu-titel" }, [stap.titel]),
        el("span", { class: "nu-waarom" }, [stap.waaromNu]),
        el("span", { class: "nu-voet" }, [
            el("span", { class: "nu-meta" }, [`Begin hier · ${stap.duur}`]),
            el("span", { class: "nu-actie" }, ["Beginnen", glyph("verder")]),
        ]),
    ]);
}
/** Status van de kamer + (optioneel) de eerste stap + wat je in je visie schreef dat hierbij past. */
function kamerStart(id, metStap = true) {
    const trap = trappen(data)[id] ?? 0;
    const zin = laatsteZinInKamer(data, id);
    const status = zin ? `${datumKort(zin.datum)} — je schreef: “${zin.zin}”` : trapZin(trap);
    const stap = metStap ? eersteStapVoorKamer(id, data, (s) => alVandaagGedaan(data, s), dagVanJaar(new Date())) : null;
    const visieRegel = visieRegelVoorKamer(data, id);
    return [
        el("p", { class: "kamer-status" }, [status]),
        stap ? beginHier(stap, id) : null,
        visieRegel ? el("p", { class: "kamer-visieregel" }, [visieRegel]) : null,
    ];
}
function kamerVoet() {
    return el("button", { class: "knop-klein kamer-voet", onclick: terugNaarHerkomst }, [kamerHerkomst === "kamer" ? "Terug naar de kamer" : "Terug naar je dag"]);
}
const CHECKIN_KOP = {
    ochtend: { titel: "Hoe voel je je nu?", regel: "Dan stel ik voor wat vanochtend past. Overslaan mag." },
    middag: { titel: "Even stilstaan. Hoe gaat het?", regel: "Kies wat het meest lijkt. Er is geen goed of fout." },
    avond: { titel: "Hoe voel je je nu?", regel: "Kies wat het meest lijkt. Je hoeft niets uit te leggen." },
    vrij: { titel: "Hoe voel je je?", regel: "Kies wat het meest lijkt. Je hoeft niets uit te leggen." },
};
export function toonCheckIn(context = "vrij") {
    const kop = CHECKIN_KOP[context];
    const gaTerug = () => toonThuis();
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": "vandaag" }, [
            kamerBalk(gaTerug),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, [kop.titel]),
                el("p", { class: "kamer-doel" }, [kop.regel]),
            ]),
            el("div", { class: "gevoelens" }, GEVOELENS.map((g, i) => {
                const knop = el("button", { class: "gevoel-knop", onclick: () => toonCheckInAdvies(g.id, "2min", context) }, [g.label]);
                knop.style.setProperty("--i", String(i));
                return knop;
            })),
            el("div", { class: "rij-lijst" }, [
                rij("Anders, of nauwkeuriger", "Wijs het aan op de schijf of kies woorden.", () => startKompasLus()),
            ]),
            context === "ochtend"
                ? el("button", { class: "knop-klein", onclick: () => toonS7() }, ["sla over"])
                : null,
        ]),
    ]);
}
function toonCheckInAdvies(gevoelId, tijd, context) {
    const advies = adviesVoor(gevoelId, tijd, data);
    if (!advies)
        return toonCheckIn(context);
    const { gevoel, primair, alternatief, kamer, zone } = advies;
    const terug = () => toonCheckInAdvies(gevoelId, tijd, context);
    const metWoorden = gevoel.woorden.length > 0 && zone !== null;
    const start = (s) => {
        if (metWoorden && s.soort === "beweging" && s.id && zone) {
            startMomentUitCheckIn(gevoel.woorden, zone, tijd, s.id, terug);
        }
        else {
            voerSuggestieUit(s);
        }
    };
    const tijdKeuze = metWoorden
        ? el("div", { class: "tijd-keuze", role: "group", "aria-label": "Hoeveel tijd heb je?" }, [
            ["2min", "10min_of_meer"].map((t) => el("button", {
                class: "tijd-pil",
                "aria-pressed": String(t === tijd),
                onclick: () => toonCheckInAdvies(gevoelId, t, context),
            }, [t === "2min" ? "Even · 2 min" : "Ruim · 10+ min"])),
        ].flat())
        : null;
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": kamer?.id ?? "vandaag" }, [
            kamerBalk(() => toonCheckIn(context)),
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, [gevoel.zin ? `Je voelt je ${gevoel.zin}` : "Dit past bij dit moment"]),
                el("p", { class: "kamer-doel" }, ["Een voorstel. Jij kiest."]),
            ]),
            el("button", { class: "nu-paneel", onclick: () => start(primair) }, [
                el("span", { class: "nu-titel" }, [primair.titel]),
                el("span", { class: "nu-waarom" }, [primair.waaromNu]),
                advies.visieRegel ? el("span", { class: "nu-nieuw" }, [advies.visieRegel]) : null,
                el("span", { class: "nu-voet" }, [
                    el("span", { class: "nu-meta" }, [kamer ? glyph(kamer.glyph) : null, [kamer?.naam, primair.duur].filter(Boolean).join(" · ")]),
                    el("span", { class: "nu-actie" }, ["Beginnen", glyph("verder")]),
                ]),
            ]),
            tijdKeuze,
            el("div", { class: "rij-lijst" }, [
                alternatief && alternatief.id ? rij(alternatief.titel, alternatief.waaromNu, () => start(alternatief)) : null,
                metWoorden && zone
                    ? rij("Andere opties bekijken", "De drie deuren, met “niets doen” erbij.", () => startMomentUitCheckIn(gevoel.woorden, zone, tijd, "andere", terug))
                    : null,
                rij("Zelf een kamer kiezen", "Loop het huis in.", () => toonThuis()),
            ]),
            metWoorden && zone
                ? el("button", { class: "knop-klein", onclick: () => startMomentUitCheckIn(gevoel.woorden, zone, tijd, "niets-doen", terug) }, ["liever niets doen"])
                : null,
        ]),
    ]);
}
// ── Avondroutine ───────────────────────────────────────────────────────
// Na Dag sluiten: een rustig moment, niets verplicht. Alleen wat er al was
// (adhkar met hun eigen "wanneer", en de lange uitademing); niets verzonnen.
export function toonAvondRoutine() {
    const islam = islamAan();
    const terug = () => toonAvondRoutine();
    const items = [];
    if (islam) {
        // Ayat al-Kursi eerst: hoort vlak voor het slapen (adhkar.ts, "wanneer").
        for (const id of ["ayat-al-kursi", "sayyid-al-istighfar-tekst", "subhan-allahi-wa-bihamdihi"]) {
            const d = dhikrById(id);
            if (d)
                items.push(rij(d.titel, d.wanneer, () => toonDhikr(id, terug, terug)));
        }
    }
    items.push(rij("Rustig ademen", "Vier tellen in, zes uit.", () => toonBeweging("adem-lange-uitademing", { opKlaar: () => toonVrijeAfronding("adem-lange-uitademing"), opTerug: terug })));
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": islam ? "geloof" : "adem" }, [
            el("header", { class: "kamer-kop" }, [
                el("h1", { class: "kamer-titel" }, [islam ? "Neem even tijd voor je avondroutine." : "De dag is gesloten."]),
                el("p", { class: "kamer-doel" }, [
                    islam ? "Kies wat je wil. Niets is verplicht." : "Nog even rustig ademen kan, en dan mag je slapen.",
                ]),
            ]),
            el("div", { class: "rij-lijst" }, items),
            el("button", { class: "knop", onclick: () => toonS7() }, ["Klaar — slaap goed"]),
        ]),
    ]);
}
// ── Vandaag → een kamer kiezen: een kort blad ───────────────────────────
// Een deur op Vandaag opent niet de kamer en ook niet meteen de lijst met
// activiteiten, maar een kort blad op dezelfde plek: wat deze kamer is, hoe het
// er nu voor staat, en twee keuzes. Vandaag blijft dus Vandaag; er komt geen
// extra scherm bij. Het blad sluit met een tik naast het blad of met Escape.
function toonKamerBlad(k, opener) {
    const scherm = opener.closest(".scherm");
    if (!scherm || scherm.querySelector(".kamer-blad-laag"))
        return;
    const opToets = (e) => {
        if (e.key === "Escape")
            sluit();
        // Het blad is modaal: Tab blijft binnen de twee keuzes.
        if (e.key === "Tab") {
            const keuzes = [...laag.querySelectorAll(".kamer-blad button")];
            const eerste = keuzes[0];
            const laatste = keuzes[keuzes.length - 1];
            if (e.shiftKey && document.activeElement === eerste) {
                e.preventDefault();
                laatste.focus();
            }
            else if (!e.shiftKey && document.activeElement === laatste) {
                e.preventDefault();
                eerste.focus();
            }
        }
    };
    const ruim = () => document.removeEventListener("keydown", opToets);
    const sluit = () => {
        ruim();
        laag.classList.remove("is-open");
        window.setTimeout(() => laag.remove(), 240);
        opener.focus({ preventScroll: true });
    };
    const primair = el("button", {
        class: "knop",
        onclick: () => {
            ruim();
            kamerHerkomst = "thuis";
            toonKamer(k.id);
        },
    }, ["Naar de activiteiten"]);
    const laag = el("div", { class: "kamer-blad-laag" }, [
        el("button", { class: "blad-achter", "aria-label": "Sluiten", tabindex: "-1", onclick: sluit }, []),
        el("div", { class: "kamer-blad", role: "dialog", "aria-modal": "true", "aria-label": k.naam, "data-kamer": k.id }, [
            el("span", { class: "blad-greep", "aria-hidden": "true" }, []),
            glyph(k.glyph, "blad-glyph"),
            el("h2", { class: "blad-naam" }, [k.naam]),
            el("p", { class: "blad-doel" }, [k.doel]),
            el("p", { class: "blad-status" }, [kamerStatusRegel(k.id)]),
            primair,
            el("button", {
                class: "knop-klein",
                onclick: () => {
                    ruim();
                    toonHuis("hal");
                },
            }, ["Bekijk de kamer in je huis"]),
        ]),
    ]);
    scherm.append(laag);
    document.addEventListener("keydown", opToets);
    requestAnimationFrame(() => {
        laag.classList.add("is-open");
        primair.focus({ preventScroll: true });
    });
}
// ── De kamer zelf: alleen het interieur ─────────────────────────────────
// Je komt hier uit de hal van je huis. Je ziet de ruimte met wat je hebt
// opgebouwd, een korte regel over hoe het er staat, en één stille knop om
// verder te werken. Geen lijst met oefeningen, geen theorie, geen opdrachten.
// De kamer heeft geen camerastaat: hij opent altijd hetzelfde.
function lijstZin(delen) {
    if (delen.length <= 1)
        return delen.join("");
    return `${delen.slice(0, -1).join(", ")} en ${delen[delen.length - 1]}`;
}
/**
 * De kamer vult het hele scherm, zonder zwarte randen en zonder vervorming.
 *
 * De tekening is onbegrensd (wand en vloer lopen door); alleen de viewBox
 * bepaalt wat je ziet. Die wordt hier steeds berekend uit de werkelijke maat van
 * het vak en de hoogte van het tekstpaneel eronder, dus bij elk scherm
 * (klein of groot toestel, portrait of landscape, met of zonder browserbalk) en
 * bij elke verandering van grootte:
 *   - de schaal is de grootste waarmee de kamer (INHOUD eenheden hoog en 360
 *     breed) nog past tussen de kop en het tekstpaneel;
 *   - blijft er hoogte over (een lange, smalle telefoon), dan wordt dat extra
 *     plafond (55%) en vloer (45%, onder het tekstpaneel), niet uitgerekt;
 *   - blijft er breedte over (desktop, landscape), dan loopt de wand door naar
 *     de zijkanten.
 * Geen 100vh: het vak is een vaste laag (`inset: 0`) en volgt dus de zichtbare
 * ruimte van iOS Safari, ook als de adresbalk in- of uitklapt.
 */
function koppelKamerpassing(scene, voet) {
    const svg = scene.querySelector("svg");
    if (!svg)
        return;
    const INHOUD = 250; // van y = -10 (lampen) tot y = 240 (kleden op de vloer)
    const KOP = 56; // de terugknop bovenaan
    const pas = () => {
        const cw = scene.clientWidth;
        const ch = scene.clientHeight;
        if (!cw || !ch)
            return;
        const overlay = getComputedStyle(voet).position === "absolute";
        const voetH = overlay ? voet.offsetHeight : 0;
        const vrij = Math.max(80, ch - voetH - KOP);
        const u = Math.min(cw / 360, vrij / INHOUD);
        const vw = cw / u;
        const vh = ch / u;
        const extra = Math.max(0, vrij - INHOUD * u);
        const y0 = -10 - (KOP + extra * 0.55) / u;
        svg.setAttribute("viewBox", `${((360 - vw) / 2).toFixed(1)} ${y0.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
    };
    const ro = new ResizeObserver(() => {
        if (!scene.isConnected)
            return ro.disconnect();
        pas();
    });
    ro.observe(scene);
    ro.observe(voet);
    pas();
}
export function toonKamerBinnen(id) {
    const kamer = kamerById(id);
    if (!kamer)
        return toonThuis();
    laatsteKamer = id;
    const aan = objectenAan(data)[id] ?? [];
    const uit = Boolean(kamer.islamitisch && !islamAan());
    const recent = (OBJECT_NAMEN[id] ?? []).filter((_, i) => aan[i]).slice(-3);
    const scene = el("figure", { class: "binnen-scene", html: kamerSceneSvg(id, aan, null, "0 -60 360 320") }, []);
    const voet = el("div", { class: "binnen-voet" }, [
        el("div", { class: "binnen-tekst" }, [
            el("h1", { class: "binnen-naam" }, [kamer.naam]),
            el("p", { class: "binnen-doel" }, [kamer.doel]),
            id === "motivatie" ? null : el("p", { class: "binnen-status" }, [uit ? "De islamitische ruimte staat uit." : kamerStatusRegel(id)]),
            !uit && recent.length ? el("p", { class: "binnen-recent" }, [`Het laatst erbij: ${lijstZin(recent)}.`]) : null,
            el("button", {
                class: "knop binnen-actie",
                onclick: () => {
                    kamerHerkomst = "kamer";
                    toonKamer(id);
                },
            }, ["Werk verder aan deze kamer"]),
        ]),
    ]);
    render([
        el("div", { class: "scherm scherm-binnen", "data-kamer": id }, [
            scene,
            el("div", { class: "binnen-kop" }, [terugKnop(() => toonHuis("hal"))]),
            voet,
        ]),
    ]);
    koppelKamerpassing(scene, voet);
}
function kamerStatusRegel(id) {
    const k = kamerById(id);
    if (!k)
        return "";
    if (id === "motivatie")
        return k.doel;
    const zin = laatsteZinInKamer(data, id);
    return zin ? `“${zin.zin}”` : trapZin(trappen(data)[id] ?? 0);
}
function rustigeBeelden() {
    return (data.instellingen.rustigeBeelden ||
        (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
}
/** Parallax: de lagen schuiven licht ten opzichte van elkaar met je vinger of muis, en zakken zacht terug. */
function koppelParallax(wereld) {
    if (rustigeBeelden())
        return;
    let doelX = 0, doelY = 0, nuX = 0, nuY = 0, raf = 0;
    const loop = () => {
        if (!wereld.isConnected) {
            raf = 0;
            return;
        }
        nuX += (doelX - nuX) * 0.09;
        nuY += (doelY - nuY) * 0.09;
        wereld.style.setProperty("--px", nuX.toFixed(3));
        wereld.style.setProperty("--py", nuY.toFixed(3));
        raf = Math.abs(doelX - nuX) > 0.003 || Math.abs(doelY - nuY) > 0.003 ? requestAnimationFrame(loop) : 0;
    };
    const richt = (e) => {
        const r = wereld.getBoundingClientRect();
        doelX = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        doelY = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        if (!raf)
            raf = requestAnimationFrame(loop);
    };
    const rust = () => { doelX = 0; doelY = 0; if (!raf)
        raf = requestAnimationFrame(loop); };
    wereld.addEventListener("pointermove", richt);
    wereld.addEventListener("pointerleave", rust);
    wereld.addEventListener("pointerup", rust);
}
function luchtLaag() {
    return el("div", { class: "wereld-lucht", "aria-hidden": "true" }, [
        el("span", { class: "lucht-lichaam" }, []),
        el("span", { class: "lucht-wolk lucht-wolk--1" }, []),
        el("span", { class: "lucht-wolk lucht-wolk--2" }, []),
        el("span", { class: "lucht-wolk lucht-wolk--3" }, []),
    ]);
}
/** De hal: de tekening met zes echte deuren erbovenop. */
function bouwHal(nieuw, opKies) {
    const trapNu = trappen(data);
    const vak = el("div", { class: "hal-vak", html: halSvg() }, []);
    for (const d of HAL_DEUREN) {
        const k = kamerById(d.kamer);
        if (!k)
            continue;
        const uit = Boolean(k.islamitisch && !islamAan());
        const nieuwHier = nieuw.has(d.kamer);
        const knop = el("button", {
            class: `hal-deur${uit ? " hal-deur--uit" : ""}${nieuwHier ? " hal-deur--nieuw" : ""}`,
            "data-kamer": d.kamer,
            "aria-label": nieuwHier ? `${k.naam}, er staat iets nieuws` : k.naam,
            onclick: () => opKies(d.kamer, knop),
        }, [
            el("span", { class: "deur-licht", "aria-hidden": "true" }, []),
            el("span", { class: "deur-blad" }, [glyph(k.glyph, "deur-glyph"), el("span", { class: "deur-naam" }, [k.naam])]),
        ]);
        knop.style.left = `${d.x}%`;
        knop.style.top = `${d.y}%`;
        knop.style.width = `${d.b}%`;
        knop.style.height = `${d.h}%`;
        knop.style.setProperty("--trap", String(k.id === "motivatie" ? 3 : (trapNu[k.id] ?? 0)));
        vak.append(knop);
    }
    return el("div", { class: "wereld-hal" }, [el("div", { class: "hal-camera" }, [vak])]);
}
export function toonHuis(start = "buiten") {
    // Wat er sinds de vorige keer is bijgekomen: één keer benoemd, dan gezien.
    const nieuw = new Map(nieuweObjecten(data).map((n) => [n.kamer, n.nummer]));
    markeerHuisGezien(data);
    void bewaren();
    const buiten = el("div", { class: "wereld-buiten", html: buitenSvg() }, []);
    const hal = bouwHal(nieuw, (id, deur) => naarKamer(id, deur));
    const wereld = el("div", { class: "wereld", "data-tijd": dagtijdVan(), "data-ruimte": start, "data-zoom": "uit" }, [luchtLaag(), buiten, hal]);
    koppelParallax(wereld);
    const sheet = el("div", { class: "huis-sheet" }, []);
    const koptitel = el("span", { class: "huis-titel" }, ["Je huis"]);
    // ── camera ──
    const cam = { ruimte: start, zoom: false };
    let timer = 0;
    let geopend = null;
    const pas = () => {
        wereld.dataset.ruimte = cam.ruimte;
        wereld.dataset.zoom = cam.zoom ? "deur" : "uit";
        koptitel.textContent = cam.ruimte === "hal" ? "Binnen" : "Je huis";
        const eerste = [...nieuw.entries()][0];
        const k = eerste ? kamerById(eerste[0]) : null;
        if (cam.ruimte === "buiten") {
            sheet.replaceChildren(el("p", { class: "sheet-regel" }, ["Dit is jouw huis. Wat je doet, groeit binnen."]), el("button", { class: "knop", onclick: naarBinnen }, ["Naar binnen"]));
        }
        else {
            sheet.replaceChildren(el("p", { class: "sheet-regel" }, [k && eerste ? nieuwObjectZin(k.id, k.naam, eerste[1]) : "Kies een kamer."]), el("button", { class: "knop-klein", onclick: naarBuiten }, ["naar buiten"]));
        }
        sheet.classList.remove("huis-sheet--in");
        void sheet.offsetWidth;
        sheet.classList.add("huis-sheet--in");
    };
    const stabiel = () => {
        window.clearTimeout(timer);
        cam.zoom = false;
        wereld.dataset.zoom = "uit";
        geopend?.classList.remove("is-open");
        geopend = null;
    };
    function naarBinnen() {
        stabiel();
        cam.ruimte = "hal";
        pas();
    }
    function naarBuiten() {
        stabiel();
        cam.ruimte = "buiten";
        pas();
    }
    function naarKamer(id, deur) {
        if (cam.zoom)
            return;
        const m = deurMidden(id);
        wereld.style.setProperty("--cx", `${m.x.toFixed(1)}%`);
        wereld.style.setProperty("--cy", `${m.y.toFixed(1)}%`);
        cam.zoom = true;
        geopend = deur;
        deur.classList.add("is-open");
        wereld.dataset.zoom = "deur";
        timer = window.setTimeout(() => {
            if (wereld.isConnected)
                toonKamerBinnen(id);
        }, rustigeBeelden() ? 0 : 560);
    }
    // Na een sluimerstand of "terug" uit de cache: nooit ingezoomd blijven staan.
    const herstel = () => {
        if (!wereld.isConnected)
            return window.removeEventListener("pageshow", herstel);
        stabiel();
        pas();
    };
    window.addEventListener("pageshow", herstel);
    buiten.addEventListener("click", (e) => {
        if (e.target?.closest?.('[data-hv="binnen"]'))
            naarBinnen();
    });
    buiten.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target?.closest?.('[data-hv="binnen"]')) {
            e.preventDefault();
            naarBinnen();
        }
    });
    const terug = () => {
        if (cam.zoom)
            return stabiel();
        if (cam.ruimte === "hal")
            return naarBuiten();
        toonThuis();
    };
    render([
        el("div", { class: "scherm scherm-huis", "data-kamer": "hemel" }, [
            wereld,
            el("header", { class: "huis-kop" }, [
                terugKnop(terug),
                koptitel,
                el("button", { class: "tekst-knop", onclick: () => toonS8() }, [glyph("hemel"), "Sterrenhemel"]),
            ]),
            sheet,
        ]),
    ]);
    pas();
}
/**
 * Na een handeling die iets opleverde: het scherm dimt naar de kamer waar het
 * thuishoort, en het nieuwe voorwerp komt er langzaam bij. Een tik slaat het
 * over; uit bij rustige beelden. Bij een handeling die niets nieuws oplevert
 * blijft het bij een rustige bevestiging.
 */
export function toonHuisOplichten(kamerId) {
    const kamer = kamerById(kamerId);
    const nieuw = nieuweObjecten(data).find((n) => n.kamer === kamerId);
    const zin = kamer ? (nieuw ? nieuwObjectZin(kamerId, kamer.naam, nieuw.nummer) : `Bewaard in ${kamer.naam}.`) : "Bewaard.";
    markeerHuisGezien(data);
    void bewaren();
    let klaar = false;
    let timer = 0;
    const gaVerder = () => {
        if (klaar)
            return;
        klaar = true;
        window.clearTimeout(timer);
        dimEnDan(() => toonThuis());
    };
    render([
        el("div", { class: "scherm scherm-app scherm-oplichten", "data-kamer": kamerId, onclick: gaVerder }, [
            kamerScene(kamerId, nieuw ? nieuw.nummer : null),
            el("p", { class: "oplicht-zin" }, [zin]),
        ]),
    ]);
    timer = window.setTimeout(gaVerder, 4200);
}
// ── Meer (De Hemel, brieven, instellingen) ─────────────────────────────
export function toonMeer() {
    const brief = ongelezenBrief(data);
    const heeftBrieven = (data.brieven ?? []).length > 0;
    const appZelf = [
        perfectionismeCheckBeschikbaar(data)
            ? rij("Voelt dit nog als hulp?", "Eén vraag, hooguit één keer per maand.", () => toonS17PerfectionismeCheck())
            : null,
        // Frictie komt nooit in dezelfde maand als een ongelezen brief.
        frictieBeschikbaar(data) && !brief
            ? rij("Frictie buiten de app", "Vier manieren om minder te scrollen.", () => toonS18Frictie())
            : null,
    ].filter(Boolean);
    render([
        el("div", { class: "scherm scherm-app scherm-kamer", "data-kamer": "vandaag" }, [
            kamerBalk(() => toonThuis()),
            el("header", { class: "kamer-kop" }, [el("h1", { class: "kamer-titel" }, ["Meer"])]),
            el("div", { class: "rij-lijst" }, [
                rij("Je huis", "Van buiten, en de kamers van binnen.", () => toonHuis()),
                rij("De sterrenhemel", "De sterren die je onderweg verzamelde, met je eigen zinnen.", () => toonS8()),
                brief
                    ? rij("Er ligt een brief", "Je eigen zinnen van vorige maand.", () => toonS12(brief, false))
                    : heeftBrieven
                        ? rij("Je brieven", "Alles wat je al eerder las.", () => toonS13())
                        : null,
                ...appZelf,
                rij("Instellingen", "De islamitische laag, rustige beelden, meldingen, export.", () => toonS10()),
            ]),
        ]),
    ]);
}
/** Alias voor de schermen in app.ts die "terug" naar het overzicht wilden. */
export const toonTerugkijken = toonMeer;
export function toonDoen() {
    toonKamerVisie();
}
/** Voor de tests en de ster-afronding: alle kamers, in volgorde. */
export { kamers };
