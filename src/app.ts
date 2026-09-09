// app.ts — de volledige schermenlus S0 t/m S11, zie schermenoverzicht.md.
// Eén bestand, geen router-library: de dagelijkse lus is toch al lineair
// (S1 → S2 → S3 → S4 → (S5 → S6) → S7).

import type { LifeMaxingData, Maandbrief, Moment, Streek, Tijd, VisiePeriode, Zone } from "./lib/types.js";
import { laadBestand, bewaarBestand, wisBestand, exporteerBestand, parseGeimporteerdBestand } from "./lib/db.js";
import { el, render, dimEnDan } from "./lib/dom.js";
import {
  tekenSchijf,
  tekenHemel,
  tekenSterrenbeeldModus,
  tekenVerschil,
  nauwelijksVerschoven,
} from "./lib/canvas.js";
import { woordenNabij, woordById, zetEigenWoorden, zoekWoorden } from "./data/woorden.js";
import { bewegingById, bewegingen } from "./data/bewegingen.js";
import { teksten } from "./data/teksten.js";
import { bepaalZone, bepaalDeuren, registreerOnderdrukking } from "./lib/selection.js";
import { aanbodVoorStreek } from "./lib/sterrenbeeld.js";
import { vulBrievenAan, ongelezenBrief, briefOpschrift } from "./lib/maandbrief.js";
import { weekmomentBeschikbaar, schrijfWeekmoment } from "./lib/weekmoment.js";
import {
  perfectionismeCheckBeschikbaar,
  registreerPerfectionismeCheck,
  frictieBeschikbaar,
  registreerFrictieAangeboden,
} from "./lib/meer.js";
import { kwaliteiten, kwaliteitById } from "./data/kwaliteiten.js";
import { huidigeDagSleutel, ochtendVandaagGedaan, avondVandaagGedaan } from "./lib/ritme.js";
import { adhkar, dhikrById } from "./data/adhkar.js";
import { themas, themaById } from "./data/themas.js";
import { begroeting, dagdeelVan, datumregel, suggestiesVoorNu, type Suggestie } from "./lib/nu.js";
import { alleWoorden } from "./data/woorden.js";
import {
  visieBeschikbaarAlsIntro,
  registreerVisieIntroAangeboden,
  schrijfVisie,
  periodeLabel,
  visieFragment,
  visieFragmentZichtbaar,
  visieCheckInsVoor,
  toekomstSignaal,
} from "./lib/visie.js";

let data: LifeMaxingData;

// state voor het moment dat nu wordt opgebouwd
let huidigeTikPositie: { energie: number; toon: number } | null = null;
let huidigMoment: Moment | null = null;

function nieuwId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * v22 — een knop die bij een leeg veld niets zou doen, ziet er nu ook zo
 * uit (.knop:disabled), in plaats van dat je erop tikt en er zichtbaar
 * niets gebeurt. Werkt meteen bij een vooringevulde waarde (herschrijven).
 */
function koppelDisabled(veld: HTMLTextAreaElement | HTMLInputElement, knop: HTMLButtonElement): void {
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
function stapKop(titel: string, index: number, totaal: number): ReturnType<typeof el>[] {
  return [
    el("p", { class: "stap-label" }, [`${titel} · stap ${index} van ${totaal}`]),
    el(
      "div",
      { class: "stip-rij" },
      Array.from({ length: totaal }, (_, i) => el("span", { class: `stip${i < index ? " vol" : ""}` }))
    ),
  ];
}

async function bewaren(): Promise<void> {
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
function toonMelding(tekst: string, soort: "neutraal" | "succes" | "fout" = "neutraal"): void {
  const bestaand = document.querySelector(".melding");
  if (bestaand) bestaand.remove();
  const klasse = soort === "neutraal" ? "melding zacht" : `melding zacht melding--${soort}`;
  const regel = el("p", { class: klasse }, [tekst]);
  document.body.append(regel);
  setTimeout(() => regel.remove(), 6000);
}

export async function startApp(): Promise<void> {
  data = await laadBestand();
  // teksten.yaml belooft dat een eigen woord er de volgende keer weer bij
  // staat; daarvoor moet de woordenlijst ze kennen.
  zetEigenWoorden(data.woordenUitbreiding);
  // v2.5 §3, met nadruk: zonder deze aanvraag mag de telefoon het bestand
  // weggooien bij schijfdruk. Best effort — een weigering is geen fout.
  void navigator.storage?.persist?.().catch(() => undefined);
  // De brieven van afgesloten maanden worden bij het openen geschreven en
  // daarna bevroren (v2.4 §7B). De lopende maand krijgt er nooit een.
  if (vulBrievenAan(data)) await bewaren();
  if (!data.instellingen.ethischeOndergrensGezien) {
    toonS0();
  } else if (visieBeschikbaarAlsIntro(data)) {
    // v22: eenmalig aangeboden — bij gloednieuwe gebruikers vlak na S0, bij
    // bestaande gebruikers die de app bijwerken de eerste keer dat ze hem
    // weer openen. Daarna nooit meer vanzelf (Wet 5); altijd bereikbaar via
    // Terugkijken → "mijn visie".
    toonVisieIntro();
  } else {
    // v21: de app opent op het startscherm dat zelf zegt wat er nu past,
    // niet meer op een lege schijf zonder uitleg.
    toonThuis();
  }
}

// ── S0 — Ethische ondergrens ──────────────────────────────────────────
function toonS0(): void {
  render([
    el("div", { class: "scherm" }, [
      el(
        "div",
        { class: "regels" },
        teksten.eerstOpening.regels.map((r) => el("p", { class: "regel" }, [r]))
      ),
      el("button", {
        class: "knop",
        onclick: async () => {
          data.aangemaaktOp = new Date().toISOString();
          data.instellingen.ethischeOndergrensGezien = true;
          await bewaren();
          if (visieBeschikbaarAlsIntro(data)) toonVisieIntro();
          else toonThuis();
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
function kompasVeld(canvas: HTMLCanvasElement): ReturnType<typeof el> {
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
function toonS1(beginPositie: { energie: number; toon: number } | null = null): void {
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

  tekenSchijf(
    canvas,
    (energie, toon) => {
      // tijdens het slepen: alleen de positie bijhouden, zodat de lichtvorm
      // meebeweegt en je kunt voelen waar je staat
      huidigeTikPositie = { energie, toon };
    },
    {
      rustig: data.instellingen.rustigeBeelden,
      beginPositie,
      onKlaar: () => setTimeout(() => toonS2(), 220),
    }
  );
}

// ── S2 — Woordkeuze ────────────────────────────────────────────────────
function toonS2(): void {
  // v21: kom je hier zonder schijfpositie (de gewone weg sinds het
  // startscherm), dan toont dit scherm de hele woordenlijst en wordt je
  // plek op het kompas afgeleid uit de woorden die je kiest -- die hebben
  // elk hun eigen energie/toon in woorden.ts. Wie het preciezer wil
  // aangeven, opent alsnog de schijf via S1.
  const viaSchijf = huidigeTikPositie !== null;
  const tikPositie = huidigeTikPositie ?? { energie: 0, toon: 0 };
  const nabij = viaSchijf ? woordenNabij(tikPositie.energie, tikPositie.toon, 10) : alleWoorden();
  const gekozen = new Set<string>();
  let eigenWoordTekst = "";

  function verder(): void {
    if (gekozen.size === 0 && !eigenWoordTekst.trim()) return;

    const woordIds = [...gekozen];
    // Zonder schijf: het gemiddelde van de gekozen woorden is je positie.
    const gekozenWoorden = woordIds
      .map((wid) => woordById(wid))
      .filter((w): w is NonNullable<ReturnType<typeof woordById>> => Boolean(w));
    const positie =
      viaSchijf || gekozenWoorden.length === 0
        ? tikPositie
        : {
            energie: gekozenWoorden.reduce((t, w) => t + w.energie, 0) / gekozenWoorden.length,
            toon: gekozenWoorden.reduce((t, w) => t + w.toon, 0) / gekozenWoorden.length,
          };
    const getypt = eigenWoordTekst.trim();
    // Een eigen woord ontstaat alleen als je niets uit de lijst koos én je
    // tekst niet gewoon een van de bestaande woorden is. Anders zou zoeken
    // op "moe" een tweede "moe" aanmaken.
    const bestaatAl = zoekWoorden(getypt).some(
      (w) => w.woord.toLowerCase() === getypt.toLowerCase()
    );
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
    if (woordIds.length === 0) return;

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

  function verversVerderKnop(): void {
    (verderKnop as HTMLButtonElement).disabled = gekozen.size === 0 && !eigenWoordTekst.trim();
  }

  function vulGrid(): void {
    // Zonder tekst: de woorden bij je tikpositie. Met tekst: de hele lijst
    // doorzocht (schermenoverzicht.md S2).
    const treffers = zoekWoorden(eigenWoordTekst);
    const lijst = eigenWoordTekst.trim() ? treffers : nabij;
    grid.replaceChildren(
      ...lijst.map((w) =>
        el(
          "button",
          {
            class: "woord-knop",
            "aria-pressed": gekozen.has(w.id),
            onclick: (e: Event) => {
              if (gekozen.has(w.id)) gekozen.delete(w.id);
              else if (gekozen.size < 2) gekozen.add(w.id);
              (e.currentTarget as HTMLElement).setAttribute("aria-pressed", String(gekozen.has(w.id)));
              verversVerderKnop();
            },
          },
          [w.woord]
        )
      )
    );
  }
  vulGrid();
  verversVerderKnop();

  const zoekInvoer = el("input", {
    type: "text",
    placeholder: teksten.kompas.zoekveldPlaceholder,
    oninput: (e: Event) => {
      eigenWoordTekst = (e.target as HTMLInputElement).value;
      vulGrid();
      verversVerderKnop();
    },
  });

  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.kompas.openingsvraag]),
      grid,
      zoekInvoer,
      verderKnop,
      viaSchijf
        ? null
        : el("button", { class: "knop-klein", onclick: () => toonS1(tikPositie) }, ["nauwkeuriger aangeven met de cirkel"]),
    ]),
  ]);
}

// ── S3 — Tijdvraag ────────────────────────────────────────────────────
function toonS3(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.kompas.tijdvraag]),
      el(
        "div",
        { class: "tijd-opties" },
        teksten.kompas.tijdOpties.map((opt) =>
          el(
            "button",
            {
              class: "knop",
              onclick: () => {
                if (huidigMoment) huidigMoment.tijdBeschikbaar = opt.waarde as Tijd;
                void bewaren();
                toonS4();
              },
            },
            [opt.label]
          )
        )
      ),
    ]),
  ]);
}

// ── S4 — De Drie Deuren ───────────────────────────────────────────────
function toonS4(): void {
  if (!huidigMoment) return toonThuis();
  const zone: Zone = huidigMoment.zone;
  const deuren = bepaalDeuren(
    zone,
    huidigMoment.tijdBeschikbaar,
    data,
    data.instellingen.islamitischeLaag,
    huidigMoment.woorden
  );

  function kiesDeur(id: string): void {
    if (!huidigMoment) return;
    huidigMoment.gekozenDeur = id;
    void bewaren();
    if (id === "niets-doen") {
      render([
        el("div", { class: "scherm" }, [
          el("p", { class: "vraag" }, [teksten.deuren.nietsDoen.bijKiezen]),
        ]),
      ]);
      setTimeout(() => toonS7(), 1600);
    } else {
      toonS5(id);
    }
  }

  function ditKloptNiet(bewegingId: string): void {
    registreerOnderdrukking(data, bewegingId, "dit_klopt_niet");
    // verwijder het lopende moment: het telt niet als afgeronde keuze
    if (huidigMoment) {
      const idx = data.momenten.indexOf(huidigMoment);
      if (idx >= 0) data.momenten.splice(idx, 1);
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
      return el(
        "button",
        { class: "deur", onclick: () => kiesDeur(id) },
        [
          el("span", {}, [teksten.deuren.nietsDoen.titel]),
          el("span", { class: "deur-onderschrift" }, [teksten.deuren.nietsDoen.onderschrift]),
        ]
      );
    }
    const beweging = bewegingById(id);
    if (!beweging) return el("div", {}, []);
    return el("div", { class: "deur" }, [
      el("button", { class: "deur-titel", onclick: () => kiesDeur(id) }, [beweging.titel]),
      el("span", { class: "deur-onderschrift" }, [`${beweging.kosten.tijdMinuten[0]}–${beweging.kosten.tijdMinuten[1]} min`]),
      el("button", { class: "lengte-link", onclick: () => ditKloptNiet(id) }, [teksten.deuren.ditKloptNiet.knoptekst]),
    ]);
  });

  render([
    el("div", { class: "scherm" }, [
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
function timerVisual(bewegingId: string): ReturnType<typeof el> | null {
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

function toonS5(bewegingId: string): void {
  const beweging = bewegingById(bewegingId);
  if (!beweging) return toonS7();
  // v21: dezelfde inhoud als voorheen, maar stap voor stap in plaats van
  // als een muur tekst -- en met de onderbouwing ingeklapt (toonOefening).
  toonOefening(bewegingId, {
    opKlaar: () => toonS6(beweging.streek),
    opTerug: () => toonS4(),
  });
}

// ── S6 — Verankeren ───────────────────────────────────────────────────
function toonS6(streek: Streek): void {
  const canvas = el("canvas", { class: "schijf-canvas" });
  let afsluitpositie: { energie: number; toon: number } | null = null;
  const tekstveld = el("textarea", { placeholder: "wat deed je, of wat merkte je? (mag leeg blijven)" });

  function afronden(): void {
    if (!huidigMoment) return toonS7();
    const zin = (tekstveld as HTMLTextAreaElement).value.trim();
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
  let stopSchijf: (() => void) | null = null;
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

  function toonHetVerschil(): void {
    const van = huidigeTikPositie;
    const naar = afsluitpositie;
    if (verschilGetoond || !van || !naar) return;
    verschilGetoond = true;
    stopSchijf?.();
    tekenVerschil(canvas, van, naar, data.instellingen.rustigeBeelden);
    if (nauwelijksVerschoven(van, naar)) {
      verschilRegel.textContent = teksten.hetVerschil.nauwelijks;
    }
  }

  stopSchijf = tekenSchijf(
    canvas,
    (energie, toon) => {
      afsluitpositie = { energie, toon };
    },
    {
      rustig: data.instellingen.rustigeBeelden,
      // Het Verschil verschijnt pas als je loslaat, niet tijdens het slepen.
      onKlaar: () => setTimeout(toonHetVerschil, 250),
    }
  );
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
function toonS7(): void {
  render([el("div", { class: "scherm", style: "min-height:60vh;width:100%;" }, [])]);
  dimEnDan(() => {
    toonThuis();
  });
}

// ── S8 — De Hemel ─────────────────────────────────────────────────────
// `netGetekend` laat het zojuist gemaakte sterrenbeeld één keer opkomen
// (v2.4 §11: draw-on van ±700 ms, daarna nooit meer animatie).
function toonS8(netGetekend: string | null = null): void {
  if (data.sterren.length === 0) {
    render([
      el("div", { class: "scherm" }, [
        el("p", { class: "regel" }, [teksten.deHemel.legeHemel]),
        el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, ["Terug"]),
      ]),
    ]);
    return;
  }

  const canvas = el("canvas", { class: "hemel-canvas" });
  const zinRegel = el("p", { class: "zacht" }, [""]);
  const aanbodStreek = netGetekend ? null : aanbodVoorStreek(data);

  const onderkant = el("div", { class: "hemel-onder" }, [
    zinRegel,
    el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, ["Terug"]),
  ]);

  render([el("div", { class: "scherm" }, [canvas, onderkant])]);

  const stop = tekenHemel(
    canvas,
    data.sterren,
    (ster) => {
      zinRegel.textContent = ster.zin ?? "";
    },
    {
      sterrenbeelden: data.sterrenbeelden,
      nieuwSterrenbeeldId: netGetekend,
      rustig: data.instellingen.rustigeBeelden,
    }
  );

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
            aanbod.replaceChildren(
              el("p", { class: "zacht" }, [teksten.deHemel.sterrenbeeldAanbod.bijNee])
            );
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
function toonS8Tekenmodus(streek: Streek): void {
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

  const modus = tekenSterrenbeeldModus(
    canvas,
    data.sterren,
    streek,
    (pad) => {
      // Eén lijn vraagt twee sterren; pas dan is er iets om te bewaren.
      ongedaanKnop.hidden = pad.length === 0;
      klaarKnop.hidden = pad.length < 2;
    },
    data.instellingen.rustigeBeelden
  );

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
function toonS8Naamgeven(streek: Streek, sterIds: string[]): void {
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
        naam: (veld as HTMLInputElement).value.trim(),
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
  (veld as HTMLInputElement).focus();
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
function toonS12(brief: Maandbrief, vanuitArchief: boolean): void {
  if (!brief.gelezen) {
    brief.gelezen = true;
    void bewaren();
  }

  const [opschrift, ...rest] = [briefOpschrift(brief, data.brieven ?? []), ...brief.alineas];

  render([
    el("div", { class: "scherm brief-scherm" }, [
      el("h1", { class: "brief-opschrift" }, [opschrift]),
      el(
        "div",
        { class: "brief-tekst" },
        rest.map((alinea) => el("p", {}, [alinea]))
      ),
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
function toonS13(): void {
  const brieven = data.brieven ?? [];
  render([
    el("div", { class: "scherm" }, [
      el(
        "div",
        { class: "brieven-lijst" },
        brieven.map((brief) =>
          el("button", { class: "brief-regel", onclick: () => toonS12(brief, true) }, [
            briefOpschrift(brief, brieven),
          ])
        )
      ),
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, ["Terug"]),
    ]),
  ]);
}

// ── S14 — Het Weekmoment (De Spiegel) ─────────────────────────────────
// v2.0 §9.1 punt 8, Pijler 5. De beeldoefening: beeld, werkelijkheid, plan —
// nooit alleen het eerste deel — en aan het eind een eigen keuze uit de
// bibliotheek: iets wat je deze week in het echte leven doet, niet in de
// app. Op eigen initiatief bereikbaar vanaf S1, zoals De Hemel en de brief
// (v2.2 Wet 5): geen automatische pop-up, geen badge, geen aandringen.
function toonS14Intro(): void {
  render([
    el("div", { class: "scherm" }, [
      el("h1", { class: "brief-opschrift" }, [teksten.weekmoment.intro.kop]),
      el("p", { class: "vraag" }, [teksten.weekmoment.intro.uitleg]),
      el(
        "div",
        { class: "herkomst" },
        [teksten.weekmoment.herkomst.W, teksten.weekmoment.herkomst.P].map((regel) =>
          el("p", { class: "herkomst-regel" }, [regel])
        )
      ),
      el("button", { class: "knop", onclick: () => toonS14Beeld() }, [teksten.weekmoment.intro.begin]),
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.weekmoment.intro.nuNiet]),
    ]),
  ]);
}

function toonS14Beeld(): void {
  const veld = el("textarea", { placeholder: teksten.weekmoment.beeld.placeholder });
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.weekmoment.beeld.vraag]),
      veld,
      el("button", {
        class: "knop",
        onclick: () => toonS14Werkelijkheid((veld as HTMLTextAreaElement).value),
      }, ["Verder"]),
    ]),
  ]);
}

function toonS14Werkelijkheid(beeld: string): void {
  const veld = el("textarea", { placeholder: teksten.weekmoment.werkelijkheid.placeholder });
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.weekmoment.werkelijkheid.vraag]),
      veld,
      el("button", {
        class: "knop",
        onclick: () => toonS14Plan(beeld, (veld as HTMLTextAreaElement).value),
      }, ["Verder"]),
    ]),
  ]);
}

function toonS14Plan(beeld: string, werkelijkheid: string): void {
  const veld = el("textarea", { placeholder: teksten.weekmoment.plan.placeholder });
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.weekmoment.plan.vraag]),
      veld,
      el("button", {
        class: "knop",
        onclick: () => toonS14Actie(beeld, werkelijkheid, (veld as HTMLTextAreaElement).value),
      }, ["Verder"]),
    ]),
  ]);
}

// Geen algoritme dat hier iets "aanbeveelt" op basis van de werkelijkheid die
// je intypte — een combinatie beweging+reflectie is spoor W19 (v2.2 §10.2),
// nog niet onderzocht. De hele bibliotheek, jouw keuze.
function toonS14Actie(beeld: string, werkelijkheid: string, plan: string): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.weekmoment.actie.vraag]),
      el(
        "div",
        { class: "brieven-lijst" },
        bewegingen.map((b) =>
          el("button", {
            class: "brief-regel",
            onclick: () => {
              data.weekmomenten = [
                ...(data.weekmomenten ?? []),
                schrijfWeekmoment(beeld, werkelijkheid, plan, b.id),
              ];
              void bewaren();
              toonS14Afsluiting(plan, b.id);
            },
          }, [b.titel])
        )
      ),
    ]),
  ]);
}

function toonS14Afsluiting(plan: string, bewegingId: string): void {
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
      el(
        "div",
        { class: "herkomst" },
        [el("p", { class: "herkomst-regel" }, [schuldval])]
      ),
      el("button", { class: "knop-klein", onclick: () => toonS7() }, [teksten.weekmoment.klaar]),
    ]),
  ]);
}

// ── S15 — De Onderbreker ──────────────────────────────────────────────
// v2.2 §3, Wet 8. Altijd bereikbaar vanaf S1 — scrollen kondigt zich niet
// aan. Schrijft nooit naar het datamodel: "hij houdt niet bij hoe vaak dit
// gebeurt". Geen crisiscontrole, geen Kompas, geen zone — dit moet in
// dertig seconden kunnen, niet door de hele dagelijkse lus heen.
function toonS15Onderbreker(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.onderbreker.vraag]),
      el("textarea", { placeholder: teksten.onderbreker.placeholder }),
      el(
        "div",
        { class: "herkomst" },
        [
          el("p", { class: "herkomst-regel" }, [teksten.onderbreker.herkomst.nadelen]),
          el("p", { class: "herkomst-regel" }, [teksten.onderbreker.herkomst.W]),
        ]
      ),
      el("button", { class: "knop", onclick: () => toonS15BewustDoor() }, [teksten.onderbreker.bewustDoor]),
      el("button", { class: "knop-klein", onclick: () => toonS15AndersDoen() }, [teksten.onderbreker.andersDoen]),
    ]),
  ]);
}

// "Bewust doorgaan" is geen belofte die de app kan afdwingen — een PWA kan
// een andere app niet blokkeren. Het is een eigen intentie, hardop gezegd.
function toonS15BewustDoor(): void {
  const kies = (tijd: string) => {
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
      el(
        "div",
        { class: "deuren" },
        teksten.onderbreker.tijdOpties.map((tijd) =>
          el("button", { class: "knop-klein", onclick: () => kies(tijd) }, [tijd])
        )
      ),
    ]),
  ]);
}

// "Iets anders doen" (v2.2 §3, punt 3: "vervanging, niet onthouding" — de
// onderbreker biedt altijd één concrete andere handeling aan). Dezelfde
// volledige bibliotheek als het weekmoment, om dezelfde reden: geen
// algoritme dat hier iets kiest, de keuze blijft van jou.
function toonS15AndersDoen(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.onderbreker.andersDoenVraag]),
      el(
        "div",
        { class: "brieven-lijst" },
        bewegingen.map((b) =>
          el("button", { class: "brief-regel", onclick: () => toonS15Beweging(b.id) }, [b.titel])
        )
      ),
    ]),
  ]);
}

// Toont dezelfde beweging als S5 (script, minimumversie, herkomst), maar
// sluit direct af via S7 in plaats van door te gaan naar S6 — er is hier
// geen moment en geen zone om aan te verankeren, en dat hoeft ook niet:
// dit is een onderbreking, geen sessie.
function toonS15Beweging(bewegingId: string): void {
  const beweging = bewegingById(bewegingId);
  if (!beweging) return toonS7();
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [beweging.script]),
      el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
      timerVisual(bewegingId),
      el(
        "div",
        { class: "herkomst" },
        beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel]))
      ),
      beweging.medischeGrens
        ? el(
            "div",
            { class: "herkomst" },
            beweging.medischeGrens.map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel]))
          )
        : null,
      el("button", { class: "knop", onclick: () => toonS7() }, ["Klaar"]),
    ]),
  ]);
}

// ── S16 — Meer ────────────────────────────────────────────────────────
// v1.1-meer.md, 6 september 2026: het ene, stille toegangspunt (v2.2 Wet 5,
// v2.4 Wet 10.3). Puur navigatie, geen eigen vraag of uitleg. Elk item alleen
// zichtbaar als het nu relevant is — geen badge, geen teller, geen "3 nieuwe
// dingen" (dat zou zelf weer een tellend element zijn, Wet 4).
function toonS16Meer(): void {
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
      el("button", { class: "knop-klein", onclick: () => toonS21Kwaliteiten() }, [teksten.kwaliteiten.toegangKnoptekst]),
      el("button", { class: "knop-klein", onclick: () => toonS20WieIkWord() }, [teksten.wieIkWord.toegangKnoptekst]),
      el("button", { class: "knop-klein", onclick: () => toonS19Normaliseren() }, [teksten.herstelroute.toegangKnoptekst]),
      !ochtendVandaagGedaan(data)
        ? el("button", { class: "knop-klein", onclick: () => toonS22Ochtend() }, [teksten.ochtend.toegangKnoptekst])
        : null,
      !avondVandaagGedaan(data)
        ? el("button", { class: "knop-klein", onclick: () => toonS23AvondSluiten() }, [teksten.avondSluiten.toegangKnoptekst])
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
function toonS17PerfectionismeCheck(): void {
  function eindigen(): void {
    setTimeout(() => toonS7(), 1200);
  }

  function toonAfsluitregel(tekst: string): void {
    render([el("div", { class: "scherm" }, [el("p", { class: "vraag" }, [tekst])])]);
    eindigen();
  }

  function alsHulp(): void {
    registreerPerfectionismeCheck(data, "als_hulp");
    void bewaren();
    toonAfsluitregel(teksten.perfectionismeCheck.alsHulpAntwoord);
  }

  function alsVerplichting(): void {
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
function toonS18Frictie(): void {
  render([
    el("div", { class: "scherm" }, [
      el("h1", { class: "brief-opschrift" }, [teksten.frictie.kop]),
      el("p", { class: "vraag" }, [teksten.frictie.intro]),
      el(
        "div",
        { class: "regels" },
        teksten.frictie.suggesties.map((s) => el("p", { class: "regel" }, [s]))
      ),
      el(
        "div",
        { class: "herkomst" },
        [el("p", { class: "herkomst-regel" }, [teksten.frictie.herkomst.W])]
      ),
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
function toonS19Normaliseren(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.herstelroute.normaliseren]),
      el("button", { class: "knop", onclick: () => toonS19KleinsteStap() }, [teksten.herstelroute.verder]),
    ]),
  ]);
}

function toonS19KleinsteStap(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.herstelroute.kleinsteStapVraag]),
      el(
        "div",
        { class: "brieven-lijst" },
        bewegingen.map((b) => el("button", { class: "brief-regel", onclick: () => toonS19Beweging(b.id) }, [b.titel]))
      ),
      el("button", { class: "knop-klein", onclick: () => toonS19Verder() }, [teksten.herstelroute.geenStapNu]),
    ]),
  ]);
}

function toonS19Beweging(bewegingId: string): void {
  const beweging = bewegingById(bewegingId);
  if (!beweging) return toonS19Verder();
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [beweging.script]),
      el("p", { class: "zacht" }, [`Kort kan ook: ${beweging.minimumversie}`]),
      timerVisual(bewegingId),
      el(
        "div",
        { class: "herkomst" },
        beweging.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel]))
      ),
      beweging.medischeGrens
        ? el(
            "div",
            { class: "herkomst" },
            beweging.medischeGrens.map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel]))
          )
        : null,
      el("button", { class: "knop", onclick: () => toonS19Verder() }, ["Klaar"]),
    ]),
  ]);
}

function toonS19Verder(): void {
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
function toonS20WieIkWord(): void {
  const veld = el("textarea", { placeholder: teksten.wieIkWord.placeholder });
  (veld as HTMLTextAreaElement).value = data.wieIkWord ?? "";
  const melding = el("p", { class: "zacht" }, [""]);
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.wieIkWord.vraag]),
      veld,
      el("button", {
        class: "knop",
        onclick: () => {
          data.wieIkWord = (veld as HTMLTextAreaElement).value.trim() || null;
          void bewaren();
          melding.textContent = teksten.wieIkWord.bewaard;
        },
      }, [teksten.wieIkWord.bewaren]),
      melding,
      el("button", { class: "knop-klein", onclick: () => toonS8() }, [teksten.wieIkWord.bewijslijst]),
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.wieIkWord.terug]),
    ]),
  ]);
}

// ── S21 — Kwaliteiten ("verlangen van de periode") ──────────────────────
// v2.md §9.1 punt 9, Masterplan-v2.md §7.3. Het enige echte MVP-gat
// (Onderzoek-I6-Hal-Maqam.md, Audit-MVP-Scope-9-september-2026.md).
// Islamitische naam alleen zichtbaar met de laag aan. Geen vaste cadans.
function toonS21Kwaliteiten(): void {
  const islamAan = data.instellingen.islamitischeLaag;
  const lijst = el("div", { class: "woorden-grid" });

  function vulLijst(): void {
    const huidig = data.verlangenVanDePeriode?.kwaliteitId ?? null;
    lijst.replaceChildren(
      ...kwaliteiten.map((k) =>
        el(
          "button",
          {
            class: "woord-knop",
            "aria-pressed": huidig === k.id,
            onclick: () => {
              data.verlangenVanDePeriode = { kwaliteitId: k.id, sinds: new Date().toISOString() };
              void bewaren();
              vulLijst();
            },
          },
          [islamAan && k.islamNaam ? `${k.naam} (${k.islamNaam})` : k.naam]
        )
      )
    );
  }
  vulLijst();

  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.kwaliteiten.vraag]),
      el("p", { class: "zacht" }, [teksten.kwaliteiten.onderschrift]),
      lijst,
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.kwaliteiten.terug]),
    ]),
  ]);
}

// ── S22 — Ochtend: Richting ──────────────────────────────────────────────
// v2.md §9.1 punt 6, v2.3 §2.4 "Het Ritme". De boog met gebedstijden-
// inkepingen staat hier (nog) niet: die vereist `adhan-js`, dat in deze
// omgeving niet te installeren was (geen npm-registry-toegang) — zie
// Fase-3-Bouw-status.md v20. Deze tekstuele versie van S22 is functioneel
// wel compleet: intentie, kerntaak, het gekozen verlangen in beeld.
function toonS22Ochtend(): void {
  const intentieVeld = el("input", { type: "text", placeholder: teksten.ochtend.intentiePlaceholder });
  const kerntaakVeld = el("textarea", { placeholder: teksten.ochtend.kerntaakPlaceholder });
  const kwaliteit = data.verlangenVanDePeriode ? kwaliteitById(data.verlangenVanDePeriode.kwaliteitId) : null;
  const islamAan = data.instellingen.islamitischeLaag;
  // v22: hetzelfde lichte fragment als op het startscherm, alleen als de
  // ochtend-toggle aan staat.
  const fragment =
    data.visie && visieCheckInsVoor(data).ochtend ? visieFragment(data.visie, new Date()) : null;

  function klaar(): void {
    data.ochtendMomenten = data.ochtendMomenten ?? [];
    data.ochtendMomenten.push({
      id: nieuwId("o"),
      datum: huidigeDagSleutel(),
      intentie: (intentieVeld as HTMLInputElement).value.trim() || null,
      kerntaak: (kerntaakVeld as HTMLTextAreaElement).value.trim() || null,
    });
    void bewaren();
    toonS7();
  }

  render([
    el("div", { class: "scherm" }, [
      el("button", { class: "terug-knop", onclick: () => toonThuis() }, ["← terug"]),
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

// ── S23 — Avond: Dag sluiten ──────────────────────────────────────────────
// v2.md §9.1 punt 7, v2.3 §2.5 "De Grond". De chips zijn de enige plek waar
// de grondbewegingen worden vastgelegd (`ritme.ts`); geen apart scherm leest
// ze terug als lijst of getal.
//
// v23 — dit scherm toonde tot nu toe vijf vragen tegelijk op één lange
// pagina, zonder enige terugknop: precies de stapeling die "niet te veel
// tegelijk laten zien" vraagt te vermijden. Dezelfde inhoud, nu één vraag
// per scherm, met dezelfde stip-rij als de WOOP-flow — en overal een weg
// terug. Alleen de laatste stap bewaart daadwerkelijk.
interface AvondState {
  positie: { energie: number; toon: number } | null;
  chips: Set<string>;
  dankbaarheid: string;
  zin: string;
  voorMorgen: string;
}

function avondVisieBlok(): ReturnType<typeof el> | null {
  // v22: 's avonds de volledige visie teruglezen (geen invoer, alleen
  // lezen) — het enige dagdeel met de volle tekst, zie het plan.
  const visieRegels = data.visie
    ? [data.visie.wieIkBen, data.visie.watIkHeb, data.visie.waarIkSta].filter((r) => r.trim().length > 0)
    : [];
  if (!data.visie || !visieCheckInsVoor(data).avond || visieRegels.length === 0) return null;
  return el("div", { class: "herkomst" }, visieRegels.map((r) => el("p", { class: "herkomst-regel" }, [r])));
}

function toonS23AvondSluiten(): void {
  toonS23Stap1Kompas({ positie: null, chips: new Set<string>(), dankbaarheid: "", zin: "", voorMorgen: "" });
}

function toonS23Stap1Kompas(state: AvondState): void {
  const canvas = el("canvas", { class: "schijf-canvas" });
  const visieBlok = avondVisieBlok();

  render([
    el("div", { class: "scherm" }, [
      el("button", { class: "terug-knop", onclick: () => toonThuis() }, ["← terug"]),
      ...stapKop(teksten.avondSluiten.kop, 1, 5),
      visieBlok ? el("div", {}, [el("p", { class: "vraag" }, [teksten.avondSluiten.visieKop]), visieBlok]) : null,
      el("p", { class: "vraag" }, [teksten.avondSluiten.kompasVraag]),
      el("p", { class: "zacht" }, [teksten.kompas.schijfUitleg]),
      kompasVeld(canvas),
      el("button", { class: "knop", onclick: () => toonS23Stap2Chips(state) }, ["Volgende"]),
    ]),
  ]);

  tekenSchijf(
    canvas,
    (energie, toon) => {
      state.positie = { energie, toon };
    },
    { rustig: data.instellingen.rustigeBeelden, beginPositie: state.positie }
  );
}

function toonS23Stap2Chips(state: AvondState): void {
  const chipsGrid = el("div", { class: "woorden-grid" });

  function vulChips(): void {
    chipsGrid.replaceChildren(
      ...teksten.avondSluiten.chips.map((c) =>
        el(
          "button",
          {
            class: "woord-knop",
            "aria-pressed": state.chips.has(c.id),
            onclick: () => {
              if (state.chips.has(c.id)) state.chips.delete(c.id);
              else state.chips.add(c.id);
              vulChips();
            },
          },
          [c.label]
        )
      )
    );
  }
  vulChips();

  render([
    el("div", { class: "scherm" }, [
      el("button", { class: "terug-knop", onclick: () => toonS23Stap1Kompas(state) }, ["← terug"]),
      ...stapKop(teksten.avondSluiten.kop, 2, 5),
      el("p", { class: "vraag" }, [teksten.avondSluiten.chipsVraag]),
      chipsGrid,
      el("button", { class: "knop", onclick: () => toonS23Stap3Dank(state) }, ["Volgende"]),
    ]),
  ]);
}

function toonS23Stap3Dank(state: AvondState): void {
  const veld = el("textarea", { placeholder: teksten.avondSluiten.dankbaarheidPlaceholder }) as HTMLTextAreaElement;
  veld.value = state.dankbaarheid;

  render([
    el("div", { class: "scherm" }, [
      el(
        "button",
        { class: "terug-knop", onclick: () => { state.dankbaarheid = veld.value; toonS23Stap2Chips(state); } },
        ["← terug"]
      ),
      ...stapKop(teksten.avondSluiten.kop, 3, 5),
      el("p", { class: "vraag" }, [teksten.avondSluiten.dankbaarheidVraag]),
      veld,
      el(
        "button",
        { class: "knop", onclick: () => { state.dankbaarheid = veld.value; toonS23Stap4Zin(state); } },
        ["Volgende"]
      ),
    ]),
  ]);
}

function toonS23Stap4Zin(state: AvondState): void {
  const veld = el("textarea", { placeholder: teksten.avondSluiten.zinPlaceholder }) as HTMLTextAreaElement;
  veld.value = state.zin;

  render([
    el("div", { class: "scherm" }, [
      el(
        "button",
        { class: "terug-knop", onclick: () => { state.zin = veld.value; toonS23Stap3Dank(state); } },
        ["← terug"]
      ),
      ...stapKop(teksten.avondSluiten.kop, 4, 5),
      el("p", { class: "vraag" }, [teksten.avondSluiten.zinVraag]),
      veld,
      el(
        "button",
        { class: "knop", onclick: () => { state.zin = veld.value; toonS23Stap5VoorMorgen(state); } },
        ["Volgende"]
      ),
    ]),
  ]);
}

function toonS23Stap5VoorMorgen(state: AvondState): void {
  const veld = el("textarea", { placeholder: teksten.avondSluiten.voorMorgenPlaceholder }) as HTMLTextAreaElement;
  veld.value = state.voorMorgen;

  function klaar(): void {
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
    void bewaren();
    // Ayat al-Kursi hoort vlak voor het slapen, als allerlaatste — dus na
    // het sluiten van de dag, niet ernaast als los alternatief (adhkar.ts:
    // "wanneer": "voor het slapen"). Alleen met de islamitische laag aan;
    // zonder die laag dimt de app direct, zoals voorheen.
    if (data.instellingen.islamitischeLaag) {
      toonDhikr("ayat-al-kursi", () => toonS7(), () => toonS7());
    } else {
      toonS7();
    }
  }

  render([
    el("div", { class: "scherm" }, [
      el(
        "button",
        { class: "terug-knop", onclick: () => { state.voorMorgen = veld.value; toonS23Stap4Zin(state); } },
        ["← terug"]
      ),
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

function toonVisieIntro(): void {
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.visie.introKop]),
      el(
        "div",
        { class: "regels" },
        teksten.visie.introRegels.map((r) => el("p", { class: "regel" }, [r]))
      ),
      el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [teksten.visie.introHerkomst])]),
      el(
        "button",
        { class: "knop", onclick: () => toonVisiePeriode() },
        [teksten.visie.beginnen]
      ),
      el(
        "button",
        {
          class: "knop-klein",
          onclick: () => {
            registreerVisieIntroAangeboden(data);
            void bewaren();
            toonThuis();
          },
        },
        [teksten.visie.latereKeer]
      ),
    ]),
  ]);
}

function toonVisiePeriode(): void {
  const periodes: VisiePeriode[] = ["3_maanden", "1_jaar", "5_jaar"];
  let gekozen: VisiePeriode | null = data.visie?.periode ?? null;
  const grid = el("div", { class: "woorden-grid" });

  function vulGrid(): void {
    grid.replaceChildren(
      ...periodes.map((p) =>
        el(
          "button",
          {
            class: "woord-knop",
            "aria-pressed": gekozen === p,
            onclick: () => {
              gekozen = p;
              vulGrid();
            },
          },
          [periodeLabel(p)]
        )
      )
    );
  }
  vulGrid();

  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.visie.periodeVraag]),
      el("p", { class: "zacht" }, [teksten.visie.periodeOnderschrift]),
      grid,
      el(
        "button",
        {
          class: "knop",
          onclick: () => {
            if (!gekozen) return;
            toonVisieDeel(gekozen, 0, { wieIkBen: "", watIkHeb: "", waarIkSta: "" });
          },
        },
        [teksten.visie.verder]
      ),
      el("button", { class: "knop-klein", onclick: () => toonThuis() }, [teksten.visie.latereKeer]),
    ]),
  ]);
}

interface VisieOnderweg {
  wieIkBen: string;
  watIkHeb: string;
  waarIkSta: string;
}

/** De drie vragen, één gedeelde functie — index 0/1/2, met de stip-rij uit
 * toonOefening() als voortgang. Elk deel is individueel over te slaan (mag
 * leeg blijven, zelfde geest als elders in de app); de herschrijfhulp is
 * een hint, nooit een blokkade. */
function toonVisieDeel(periode: VisiePeriode, index: number, onderweg: VisieOnderweg): void {
  const stappen: { veld: keyof VisieOnderweg; vraag: string; onderschrift: string; placeholder: string }[] = [
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
  (veld as HTMLTextAreaElement).value = onderweg[stap.veld];
  const hint = el("p", { class: "zacht" }, [""]);

  function verversHint(): void {
    const signaal = toekomstSignaal((veld as HTMLTextAreaElement).value);
    hint.textContent = signaal ?? "";
  }
  verversHint();
  veld.addEventListener("input", verversHint);

  function verder(tekst: string): void {
    const volgende: VisieOnderweg = { ...onderweg, [stap.veld]: tekst.trim() };
    if (index < stappen.length - 1) {
      toonVisieDeel(periode, index + 1, volgende);
    } else {
      toonVisieKlaar(periode, volgende);
    }
  }

  render([
    el("div", { class: "scherm" }, [
      el(
        "div",
        { class: "stip-rij" },
        stappen.map((_, i) => el("span", { class: `stip${i <= index ? " vol" : ""}` }))
      ),
      el("p", { class: "vraag" }, [stap.vraag]),
      el("p", { class: "zacht" }, [stap.onderschrift]),
      veld,
      hint,
      el("button", { class: "knop", onclick: () => verder((veld as HTMLTextAreaElement).value) }, [
        teksten.visie.verder,
      ]),
      el("button", { class: "knop-klein", onclick: () => verder("") }, [teksten.visie.slaOver]),
      index > 0
        ? el(
            "button",
            {
              class: "knop-klein",
              onclick: () => {
                const huidig: VisieOnderweg = { ...onderweg, [stap.veld]: (veld as HTMLTextAreaElement).value.trim() };
                toonVisieDeel(periode, index - 1, huidig);
              },
            },
            [teksten.visie.terug]
          )
        : el("button", { class: "knop-klein", onclick: () => toonVisiePeriode() }, [teksten.visie.terug]),
    ]),
  ]);
}

function toonVisieKlaar(periode: VisiePeriode, onderweg: VisieOnderweg): void {
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
function toonVisieBekijken(): void {
  if (!data.visie) {
    render([
      el("div", { class: "scherm" }, [
        el("p", { class: "vraag" }, [teksten.visie.bekijkGeenVisie]),
        el("button", { class: "knop", onclick: () => toonVisiePeriode() }, [teksten.visie.bekijkSchrijf]),
        el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.visie.terug]),
      ]),
    ]);
    return;
  }
  const visie = data.visie;
  const regels = [visie.wieIkBen, visie.watIkHeb, visie.waarIkSta].filter((r) => r.trim().length > 0);
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [`${teksten.visie.introKop} — ${periodeLabel(visie.periode)}`]),
      el(
        "div",
        { class: "herkomst" },
        regels.map((r) => el("p", { class: "herkomst-regel" }, [r]))
      ),
      el(
        "button",
        {
          class: "knop",
          onclick: () =>
            toonVisieDeel(visie.periode, 0, {
              wieIkBen: visie.wieIkBen,
              watIkHeb: visie.watIkHeb,
              waarIkSta: visie.waarIkSta,
            }),
        },
        [teksten.visie.herschrijven]
      ),
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, [teksten.visie.terug]),
    ]),
  ]);
}

// ══════════════════════════════════════════════════════════════════════
// v21 — De nieuwe schil: Nu · Doen · Terugkijken
//
// Waarom deze verbouwing (9 september 2026, op eigen verzoek): tot v20 opende
// de app op een lege schijf met de vraag "Waar ben je?", zonder assen, zonder
// instructie, en zat álles achter één woordje "meer". De inhoud klopte, de
// opbouw niet — je moest zelf weten wat je wilde en waar het stond. Vanaf v21
// opent de app op een startscherm dat zelf zegt wat er op dít moment past
// (lib/nu.ts), met een vaste navigatie eronder.
//
// Wat níét verandert: er wordt nog steeds niets geteld, geen reeksen, geen
// badges, geen meldingen die aandringen (Wet 4), en elk moment mag nog altijd
// buiten de app eindigen (Wet 3). Alleen: je hoeft niet meer te raden.
// ══════════════════════════════════════════════════════════════════════

type Tab = "nu" | "doen" | "terugkijken";

function navBalk(actief: Tab): ReturnType<typeof el> {
  const item = (tab: Tab, label: string, actie: () => void) =>
    el("button", { class: `nav-item${actief === tab ? " actief" : ""}`, onclick: actie }, [label]);
  return el("nav", { class: "nav-balk" }, [
    item("nu", "Nu", () => toonThuis()),
    item("doen", "Doen", () => toonDoen()),
    item("terugkijken", "Terugkijken", () => toonTerugkijken()),
  ]);
}

function duurTekst(bewegingId: string): string {
  const b = bewegingById(bewegingId);
  if (!b) return "";
  const [van, tot] = b.kosten.tijdMinuten;
  return van === tot ? `${van} min` : `${van}–${tot} min`;
}

function rijKnop(titel: string, onder: string, actie: () => void): ReturnType<typeof el> {
  return el("button", { class: "rij-knop", onclick: actie }, [
    el("span", { class: "rij-titel" }, [titel]),
    el("span", { class: "rij-onder" }, [onder]),
  ]);
}

function kaartPrimair(s: Suggestie): ReturnType<typeof el> {
  return el("button", { class: "kaart kaart-primair", onclick: () => voerSuggestieUit(s) }, [
    el("span", { class: "kaart-label" }, ["Dit past nu"]),
    el("span", { class: "kaart-titel" }, [s.titel]),
    s.duur ? el("span", { class: "kaart-duur" }, [s.duur]) : null,
    el("span", { class: "kaart-waarom" }, [s.waaromNu]),
    el("span", { class: "kaart-actie" }, ["Doen →"]),
  ]);
}

function kaartKlein(s: Suggestie): ReturnType<typeof el> {
  return el("button", { class: "kaart kaart-klein", onclick: () => voerSuggestieUit(s) }, [
    el("span", { class: "kaart-titel-klein" }, [s.titel]),
    el("span", { class: "kaart-meta" }, [s.duur ? `${s.duur} · ${s.waaromNu}` : s.waaromNu]),
  ]);
}

function voerSuggestieUit(s: Suggestie): void {
  switch (s.soort) {
    case "ochtend":
      return toonS22Ochtend();
    case "avond":
      return toonS23AvondSluiten();
    case "beweging":
      if (s.id) toonOefening(s.id, { opKlaar: () => toonKlaar(), opTerug: () => toonThuis() });
      return;
    case "dhikr":
      if (s.id) toonDhikr(s.id, () => toonThuis());
      return;
    case "kompas":
      return startKompasLus();
    case "week":
      return toonS14Intro();
    case "brief": {
      const b = ongelezenBrief(data);
      if (b) toonS12(b, false);
      return;
    }
    case "rust":
      return;
  }
}

// ── Het startscherm ───────────────────────────────────────────────────
function toonThuis(): void {
  const nu = new Date();
  const dagdeel = dagdeelVan(nu);
  const suggesties = suggestiesVoorNu(data, nu);
  // "Het is laat" is geen actie maar een opmerking — die krijgt geen knop.
  const eersteActie = suggesties.find((s) => s.soort !== "rust") ?? null;
  const opmerking = suggesties.find((s) => s.soort === "rust") ?? null;
  const verder = suggesties.filter((s) => s !== eersteActie && s.soort !== "rust");
  // v22: het lichte visie-fragment, alleen ochtend/middag (de avond krijgt
  // het volledige leesblok in toonS23AvondSluiten) en alleen als de
  // bijhorende toggle aan staat.
  const fragment = data.visie && visieFragmentZichtbaar(data, dagdeel) ? visieFragment(data.visie, nu) : null;

  render([
    el("div", { class: "scherm scherm-app" }, [
      el("header", { class: "thuis-kop" }, [
        el("h1", { class: "thuis-groet" }, [begroeting(dagdeel)]),
        el("p", { class: "thuis-datum" }, [datumregel(nu)]),
      ]),
      opmerking ? el("p", { class: "opmerking" }, [`${opmerking.titel}. ${opmerking.waaromNu}`]) : null,
      fragment ? el("p", { class: "opmerking" }, [`${fragment.label}: ${fragment.tekst}`]) : null,
      eersteActie ? kaartPrimair(eersteActie) : null,
      verder.length ? el("p", { class: "sectie-kop" }, ["Past nu ook"]) : null,
      ...verder.map(kaartKlein),
      el("p", { class: "sectie-kop" }, ["Of begin hier"]),
      rijKnop("Hoe voel je je?", "Een woord kiezen, dan drie opties. 2 min.", () => startKompasLus()),
      rijKnop("Ik ben eruit gevallen", "Terug beginnen zonder het groot te maken.", () => toonS19Normaliseren()),
      rijKnop("Ik zit vast in mijn telefoon", "Onderbreken zonder jezelf iets te verbieden.", () => toonS15Onderbreker()),
      navBalk("nu"),
    ]),
  ]);
}

// ── Doen — de bibliotheek, per thema ──────────────────────────────────
function toonDoen(): void {
  const islamAan = data.instellingen.islamitischeLaag;
  render([
    el("div", { class: "scherm scherm-app" }, [
      el("h1", { class: "tab-kop" }, ["Doen"]),
      el("p", { class: "zacht" }, ["Kies waar je nu iets aan hebt."]),
      ...themas
        .filter((t) => !t.islamitisch || islamAan)
        .map((t) =>
          el(
            "button",
            {
              class: "kaart kaart-klein",
              onclick: () => (t.bewegingIds.length === 0 && !t.dhikrIds ? toonS24Richting() : toonThema(t.id)),
            },
            [
              el("span", { class: "kaart-titel-klein" }, [t.titel]),
              el("span", { class: "kaart-meta" }, [t.onderschrift]),
            ]
          )
        ),
      navBalk("doen"),
    ]),
  ]);
}

function toonThema(id: string): void {
  const t = themaById(id);
  if (!t) return toonDoen();
  // Wat nú past wordt binnen het thema gemarkeerd — hetzelfde oordeel als op
  // het startscherm, zodat de timing overal doorwerkt en niet alleen op "Nu".
  const nuIds = new Set(
    suggestiesVoorNu(data)
      .map((s) => s.id)
      .filter((x): x is string => Boolean(x))
  );
  const islamAan = data.instellingen.islamitischeLaag;

  const items: (ReturnType<typeof el> | null)[] = [];
  for (const bid of t.bewegingIds) {
    const b = bewegingById(bid);
    if (!b) continue;
    const past = nuIds.has(bid);
    items.push(
      el(
        "button",
        {
          class: `kaart kaart-klein${past ? " past-nu" : ""}`,
          onclick: () => toonOefening(bid, { opKlaar: () => toonKlaar(), opTerug: () => toonThema(id) }),
        },
        [
          el("span", { class: "kaart-titel-klein" }, [b.titel]),
          el("span", { class: "kaart-meta" }, [past ? `${duurTekst(bid)} · past nu` : duurTekst(bid)]),
        ]
      )
    );
  }
  if (islamAan && t.dhikrIds) {
    for (const did of t.dhikrIds) {
      const d = dhikrById(did);
      if (!d) continue;
      const past = nuIds.has(did);
      items.push(
        el(
          "button",
          { class: `kaart kaart-klein${past ? " past-nu" : ""}`, onclick: () => toonDhikr(did, () => toonThema(id)) },
          [
            el("span", { class: "kaart-titel-klein" }, [d.titel]),
            el("span", { class: "kaart-meta" }, [past ? `${d.wanneer} · past nu` : d.wanneer]),
          ]
        )
      );
    }
  }

  render([
    el("div", { class: "scherm scherm-app" }, [
      el("button", { class: "terug-knop", onclick: () => toonDoen() }, ["← Doen"]),
      el("h1", { class: "tab-kop" }, [t.titel]),
      el("p", { class: "zacht" }, [t.onderschrift]),
      ...items,
      navBalk("doen"),
    ]),
  ]);
}

// ── Terugkijken ───────────────────────────────────────────────────────
function toonTerugkijken(): void {
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
      rijKnop(
        "Mijn visie",
        data.visie ? "Herlezen of herschrijven." : "Waar je naartoe leeft, in het nu geschreven.",
        () => toonVisieBekijken()
      ),
      rijKnop("Wie ik word", "Je eigen zin, wanneer je hem wil bijstellen.", () => toonS20WieIkWord()),
      rijKnop("Verlangen van deze periode", "De kwaliteit waar je nu op mikt.", () => toonS21Kwaliteiten()),
      perfectionismeCheckBeschikbaar(data)
        ? rijKnop("Voelt dit nog als hulp?", "Eén vraag, hooguit één keer per maand.", () =>
            toonS17PerfectionismeCheck()
          )
        : null,
      frictieBeschikbaar(data)
        ? rijKnop("Frictie buiten de app", "Vier manieren om minder te scrollen.", () => toonS18Frictie())
        : null,
      rijKnop("Instellingen", "De islamitische laag, rustige beelden, export.", () => toonS10()),
      navBalk("terugkijken"),
    ]),
  ]);
}

// ── De oefening, stap voor stap ───────────────────────────────────────
// Vervangt de muur tekst die S5 en S15 tot v20 toonden: één stap tegelijk,
// met stipjes zodat je ziet hoe lang het nog duurt, en de onderbouwing
// ("waarom dit werkt") ingeklapt in plaats van er permanent boven.
interface OefeningOpties {
  opKlaar: () => void;
  opTerug?: () => void;
  klaarTekst?: string;
}

function stappenVan(script: string): string[] {
  const delen = script
    .split(/(?<=[.!?])\s+/)
    .map((d) => d.trim())
    .filter(Boolean);
  const stappen: string[] = [];
  for (const deel of delen) {
    const vorige = stappen[stappen.length - 1];
    // Losse flarden ("Twee minuten, niet langer.") plakken aan de vorige stap
    // vast; een stap moet een handeling zijn, geen halve zin.
    if (vorige && vorige.length < 32) stappen[stappen.length - 1] = `${vorige} ${deel}`;
    else stappen.push(deel);
  }
  return stappen.length > 0 ? stappen : [script];
}

function toonOefening(bewegingId: string, opties: OefeningOpties): void {
  const beweging = bewegingById(bewegingId);
  if (!beweging) return opties.opKlaar();
  const stappen = stappenVan(beweging.script);
  let index = 0;
  let waaromOpen = false;

  function teken(): void {
    const laatste = index === stappen.length - 1;
    render([
      el("div", { class: "scherm scherm-app" }, [
        el("button", { class: "terug-knop", onclick: () => (opties.opTerug ?? toonThuis)() }, ["← terug"]),
        el("p", { class: "oefening-titel" }, [beweging!.titel]),
        el(
          "div",
          { class: "stip-rij" },
          stappen.map((_, i) => el("span", { class: `stip${i <= index ? " vol" : ""}` }))
        ),
        el("p", { class: "vraag" }, [stappen[index]]),
        laatste ? timerVisual(bewegingId) : null,
        el("p", { class: "zacht" }, [`Kort kan ook: ${beweging!.minimumversie}`]),
        // veiligheid.md §4: een medische grens staat er elke keer bij, op elke
        // stap — niet weggeklapt achter "waarom dit werkt".
        beweging!.medischeGrens
          ? el(
              "div",
              { class: "herkomst" },
              beweging!.medischeGrens.map((regel) => el("p", { class: "herkomst-regel herkomst-regel--grens" }, [regel]))
            )
          : null,
        el(
          "button",
          {
            class: "knop",
            onclick: () => {
              if (laatste) return opties.opKlaar();
              index += 1;
              teken();
            },
          },
          [laatste ? (opties.klaarTekst ?? "Klaar") : "Volgende"]
        ),
        el(
          "button",
          {
            class: "knop-klein",
            onclick: () => {
              waaromOpen = !waaromOpen;
              teken();
            },
          },
          [waaromOpen ? "waarom dit werkt −" : "waarom dit werkt +"]
        ),
        waaromOpen
          ? el(
              "div",
              { class: "herkomst" },
              beweging!.herkomst.map((h) => el("p", { class: "herkomst-regel" }, [h.regel]))
            )
          : null,
      ]),
    ]);
  }
  teken();
}

// ── Dhikr-lezer ───────────────────────────────────────────────────────
// adhkar.md, ontwerpregel: de app toont de tekst en de betekenis, nooit een
// aantal — ook niet wanneer het aantal letterlijk in de bron staat.
function toonDhikr(id: string, opTerug: () => void, opKlaar: () => void = toonKlaar): void {
  const d = dhikrById(id);
  if (!d) return toonThuis();
  let bronOpen = false;

  function teken(): void {
    render([
      el("div", { class: "scherm scherm-app" }, [
        el("button", { class: "terug-knop", onclick: opTerug }, ["← terug"]),
        el("p", { class: "oefening-titel" }, [d!.titel]),
        el("p", { class: "zacht" }, [d!.wanneer]),
        el("p", { class: "arabisch", dir: "rtl", lang: "ar" }, [d!.arabisch]),
        el("p", { class: "translit" }, [d!.transliteratie]),
        el("p", { class: "vertaling" }, [d!.vertaling]),
        el("button", { class: "knop", onclick: opKlaar }, ["Klaar"]),
        el(
          "button",
          {
            class: "knop-klein",
            onclick: () => {
              bronOpen = !bronOpen;
              teken();
            },
          },
          [bronOpen ? "waar dit vandaan komt −" : "waar dit vandaan komt +"]
        ),
        bronOpen ? el("div", { class: "herkomst" }, [el("p", { class: "herkomst-regel" }, [d!.bron])]) : null,
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
function toonS24Richting(): void {
  const bestaand = data.doel;
  if (!bestaand) return toonS24Wish();
  render([
    el("div", { class: "scherm" }, [
      el("p", { class: "vraag" }, [teksten.doelen.bekijkKop]),
      el("div", { class: "herkomst" }, [
        el("p", { class: "herkomst-regel" }, [bestaand.wish]),
        el("p", { class: "herkomst-regel" }, [bestaand.outcome]),
        el("p", { class: "herkomst-regel" }, [`Als ${bestaand.obstacleTekst}, dan ${bestaand.planDan}.`]),
      ]),
      el("button", { class: "knop", onclick: () => toonS24Wish() }, [teksten.doelen.opnieuw]),
      el("button", { class: "knop-klein", onclick: () => toonDoen() }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonS24Wish(): void {
  const veld = el("textarea", { placeholder: teksten.doelen.wishPlaceholder }) as HTMLTextAreaElement;
  veld.value = data.doel?.wish ?? "";
  const knop = el("button", {
    class: "knop",
    onclick: () => toonS24Outcome(veld.value.trim()),
  }, [teksten.doelen.klaar]) as HTMLButtonElement;
  koppelDisabled(veld, knop);

  render([
    el("div", { class: "scherm" }, [
      ...stapKop(teksten.doelen.toegangTitel, 1, 5),
      el("p", { class: "vraag" }, [teksten.doelen.wishVraag]),
      el("p", { class: "zacht" }, [teksten.doelen.wishOnderschrift]),
      veld,
      knop,
      el("button", { class: "knop-klein", onclick: () => toonDoen() }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonS24Outcome(wish: string): void {
  const veld = el("textarea", { placeholder: teksten.doelen.outcomePlaceholder }) as HTMLTextAreaElement;
  veld.value = data.doel?.outcome ?? "";
  const knop = el("button", {
    class: "knop",
    onclick: () => toonS24Verbeelding(wish, veld.value.trim()),
  }, [teksten.doelen.klaar]) as HTMLButtonElement;
  koppelDisabled(veld, knop);

  render([
    el("div", { class: "scherm" }, [
      ...stapKop(teksten.doelen.toegangTitel, 2, 5),
      el("p", { class: "vraag" }, [teksten.doelen.outcomeVraag]),
      el("p", { class: "zacht" }, [teksten.doelen.outcomeOnderschrift]),
      veld,
      knop,
      el("button", { class: "knop-klein", onclick: () => toonS24Wish() }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonS24Verbeelding(wish: string, outcome: string): void {
  render([
    el("div", { class: "scherm" }, [
      ...stapKop(teksten.doelen.toegangTitel, 3, 5),
      el("p", { class: "vraag" }, [teksten.doelen.verbeeldingKop]),
      el("p", { class: "regel" }, [teksten.doelen.verbeeldingTekst]),
      el("button", { class: "knop", onclick: () => toonS24Obstacle(wish, outcome) }, [teksten.doelen.klaar]),
      el("button", { class: "knop-klein", onclick: () => toonS24Outcome(wish) }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonS24Obstacle(wish: string, outcome: string): void {
  const veld = el("textarea", { placeholder: teksten.doelen.obstaclePlaceholder }) as HTMLTextAreaElement;
  veld.value = data.doel?.obstacleTekst ?? "";
  const knop = el("button", {
    class: "knop",
    onclick: () => toonS24Plan(wish, outcome, veld.value.trim()),
  }, [teksten.doelen.klaar]) as HTMLButtonElement;
  koppelDisabled(veld, knop);

  render([
    el("div", { class: "scherm" }, [
      ...stapKop(teksten.doelen.toegangTitel, 4, 5),
      el("p", { class: "vraag" }, [teksten.doelen.obstacleVraag]),
      el("p", { class: "zacht" }, [teksten.doelen.obstacleOnderschrift]),
      veld,
      knop,
      el("button", { class: "knop-klein", onclick: () => toonS24Outcome(wish) }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonS24Plan(wish: string, outcome: string, obstacle: string): void {
  const alsVeld = el("input", { type: "text", value: obstacle, readonly: true });
  const danVeld = el("input", { type: "text", placeholder: teksten.doelen.planDanPlaceholder }) as HTMLInputElement;
  danVeld.value = data.doel?.planDan ?? "";
  const melding = el("p", { class: "zacht" }, [""]);
  const knop = el("button", {
    class: "knop",
    onclick: () => {
      const dan = danVeld.value.trim();
      if (!dan) return;
      data.doel = {
        wish,
        outcome,
        obstacleTekst: obstacle,
        planAls: obstacle,
        planDan: dan,
        sinds: new Date().toISOString(),
      };
      void bewaren();
      melding.textContent = teksten.doelen.bewaard;
      setTimeout(() => toonDoen(), 900);
    },
  }, [teksten.doelen.bewaren]) as HTMLButtonElement;
  koppelDisabled(danVeld, knop);

  render([
    el("div", { class: "scherm" }, [
      ...stapKop(teksten.doelen.toegangTitel, 5, 5),
      el("p", { class: "vraag" }, [teksten.doelen.planVraag]),
      el("p", { class: "zacht" }, [teksten.doelen.planAlsLabel]),
      alsVeld,
      el("p", { class: "zacht" }, [teksten.doelen.planDanLabel]),
      danVeld,
      knop,
      melding,
      el("button", { class: "knop-klein", onclick: () => toonS24Obstacle(wish, outcome) }, [teksten.doelen.terug]),
    ]),
  ]);
}

function toonKlaar(): void {
  render([
    el("div", { class: "scherm scherm-app" }, [
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
function startKompasLus(): void {
  huidigeTikPositie = null;
  huidigMoment = null;
  toonS2();
}

// ── S10 — Instellingen ────────────────────────────────────────────────
export function toonS10(): void {
  function switchRij(label: string, onderschrift: string, waarde: boolean, onchange: (v: boolean) => void) {
    return el("div", { class: "toggle-rij" }, [
      el("div", { class: "toggle-tekst" }, [
        el("span", {}, [label]),
        el("span", { class: "zacht" }, [onderschrift]),
      ]),
      el("label", { class: "switch" }, [
        el("input", {
          type: "checkbox",
          checked: waarde,
          onchange: (e: Event) => onchange((e.target as HTMLInputElement).checked),
        }),
        el("span", { class: "switch-schuif" }),
      ]),
    ]);
  }

  const meldingTekst = el("p", { class: "zacht" }, [""]);

  render([
    el("div", { class: "scherm" }, [
      switchRij(
        teksten.instellingen.islamitischeLaag.label,
        teksten.instellingen.islamitischeLaag.onderschrift,
        data.instellingen.islamitischeLaag,
        async (v) => {
          data.instellingen.islamitischeLaag = v;
          await bewaren();
        }
      ),
      switchRij(
        teksten.instellingen.rustigeBeelden.label,
        teksten.instellingen.rustigeBeelden.onderschrift,
        data.instellingen.rustigeBeelden,
        async (v) => {
          data.instellingen.rustigeBeelden = v;
          await bewaren();
        }
      ),
      switchRij(
        teksten.instellingen.weekmoment.label,
        teksten.instellingen.weekmoment.onderschrift,
        data.instellingen.weekmomentAan,
        async (v) => {
          data.instellingen.weekmomentAan = v;
          await bewaren();
        }
      ),
      el("p", { class: "sectie-kop" }, [teksten.instellingen.visieMomentenKop]),
      el("p", { class: "zacht" }, [teksten.instellingen.visieMomentenOnderschrift]),
      switchRij(
        teksten.instellingen.visieOchtend.label,
        teksten.instellingen.visieOchtend.onderschrift,
        visieCheckInsVoor(data).ochtend,
        async (v) => {
          data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), ochtend: v };
          await bewaren();
        }
      ),
      switchRij(
        teksten.instellingen.visieMiddag.label,
        teksten.instellingen.visieMiddag.onderschrift,
        visieCheckInsVoor(data).middag,
        async (v) => {
          data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), middag: v };
          await bewaren();
        }
      ),
      switchRij(
        teksten.instellingen.visieAvond.label,
        teksten.instellingen.visieAvond.onderschrift,
        visieCheckInsVoor(data).avond,
        async (v) => {
          data.instellingen.visieCheckIns = { ...visieCheckInsVoor(data), avond: v };
          await bewaren();
        }
      ),
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
      el("button", { class: "knop-klein", onclick: () => toonTerugkijken() }, ["Terug"]),
    ]),
  ]);
}

// ── S11 — Import ──────────────────────────────────────────────────────
function toonS11(): void {
  const melding = el("p", { class: "zacht" }, [""]);
  const invoer = el("input", { type: "file", accept: "application/json" });

  invoer.addEventListener("change", async () => {
    const bestand = (invoer as HTMLInputElement).files?.[0];
    if (!bestand) return;
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
      el("p", { class: "vraag" }, ["Bestand kiezen"]),
      invoer,
      melding,
      el("button", { class: "knop-klein", onclick: () => toonS0() }, ["Terug"]),
    ]),
  ]);
}

// toegangspunt voor instellingen vanaf elk scherm (kleine, vaste ingang)
export function naarInstellingen(): void {
  toonS10();
}
