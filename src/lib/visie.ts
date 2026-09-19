// visie.ts — De Visie (v22): een zelfgeschreven "toekomst in het nu" bij
// onboarding, in drie delen (wie ik ben, wat ik heb, waar ik sta over een
// gekozen periode), tegenwoordige tijd. Zie het plan: mentale contrastering
// (Oettingen) laat zien dat een wens alleen visualiseren de inspanning kan
// verlágen — deze app dwingt daarom nergens een dagelijkse "herhaal je
// visie"-ritueel af, en de brug naar een concreet doel (Doel, met obstakel
// en plan) blijft altijd een vrije keuze, nooit een automatische stap.
//
// `?? standaard` overal hieronder: net als data.brieven ?? [] elders (zie
// meer.ts) — een ouder opgeslagen of geïmporteerd bestand kent deze v22-
// velden nog niet, en `db.ts` se merge is shallow (spreidt `instellingen`
// als geheel), dus zonder deze val zou een oud bestand hier crashen op
// "cannot read property of undefined" in plaats van gewoon de standaard te
// gebruiken.

import type { Dagdeel } from "./nu.js";
import type { LifeMaxingData, Visie, VisiePeriode } from "./types.js";

export const VISIE_CHECKINS_STANDAARD = { ochtend: true, middag: true, avond: true };

export function visieCheckInsVoor(data: LifeMaxingData): { ochtend: boolean; middag: boolean; avond: boolean } {
  return data.instellingen.visieCheckIns ?? VISIE_CHECKINS_STANDAARD;
}

/** Beschikbaar zolang de eenmalige onboarding-uitnodiging nog niet is
 * aangeboden (geaccepteerd of overgeslagen, dat maakt niet uit) — zelfde
 * eenmalig-aanbod-patroon als sterrenbeeldAanbodAfgewezen (v2.4 §9). */
export function visieBeschikbaarAlsIntro(data: LifeMaxingData): boolean {
  return !(data.instellingen.visieIntroAangeboden ?? false);
}

export function registreerVisieIntroAangeboden(data: LifeMaxingData): void {
  data.instellingen.visieIntroAangeboden = true;
}

export function schrijfVisie(
  periode: VisiePeriode,
  wieIkBen: string,
  watIkHeb: string,
  waarIkSta: string,
  bestaand: Visie | null,
  nu: Date = new Date()
): Visie {
  return {
    periode,
    wieIkBen: wieIkBen.trim(),
    watIkHeb: watIkHeb.trim(),
    waarIkSta: waarIkSta.trim(),
    geschrevenOp: bestaand?.geschrevenOp ?? nu.toISOString(),
    laatstGewijzigdOp: nu.toISOString(),
  };
}

export function periodeLabel(periode: VisiePeriode): string {
  switch (periode) {
    case "3_maanden":
      return "drie maanden";
    case "1_jaar":
      return "een jaar";
    case "5_jaar":
      return "vijf jaar";
  }
}

/**
 * v27 — de zeven delen van de vijfjaarsvisie, in leesvolgorde. Elk deel begint
 * met een stam in de ik-vorm die je zelf afmaakt; de app schrijft nooit een
 * tekst voor (de placeholders zijn voorbeelden van de vorm, niet van de
 * inhoud). Het geloof-deel bestaat alleen met de islamitische laag aan.
 */
export type VisieDeelVeld = "wieIkBen" | "hoeIkLeef" | "geloof" | "lichaamEnRust" | "relaties" | "watIkHeb" | "waarIkSta";

export interface VisieDeelDef {
  veld: VisieDeelVeld;
  stam: string;
  placeholder: string;
  islamitisch?: boolean;
}

export const VISIE_DELEN: VisieDeelDef[] = [
  { veld: "wieIkBen", stam: "Ik ben iemand die", placeholder: "rustig blijft onder druk, en doet wat ik zeg." },
  { veld: "hoeIkLeef", stam: "Ik leef mijn dagen met", placeholder: "een vast ritme: vroeg op, buiten in het licht, en tijd voor de mensen die ertoe doen." },
  {
    veld: "geloof",
    stam: "Mijn geloof en mijn band met Allah",
    placeholder: "zijn een rustig anker in mijn dag. Ik ben er trouw aan, ook op gewone dagen.",
    islamitisch: true,
  },
  { veld: "lichaamEnRust", stam: "Ik zorg voor mijn lichaam en mijn rust door", placeholder: "elke dag iets te bewegen, goed te slapen en mijn lichaam te vertrouwen." },
  { veld: "relaties", stam: "De mensen om mij heen", placeholder: "kennen mij en ik ken hen. Ik ben er voor hen en ik laat hen dichtbij komen." },
  { veld: "watIkHeb", stam: "Wat ik heb opgebouwd", placeholder: "is werk dat me iets doet, een thuis waar het rustig is en een leven dat bij me past." },
  { veld: "waarIkSta", stam: "Ik ben geworden wie ik altijd wilde zijn", placeholder: "doordat ik elke dag kleine keuzes maakte die bij mij passen." },
];

export type VisieTeksten = Record<VisieDeelVeld, string>;

/** De delen die jij hebt ingevuld, in leesvolgorde (met de laag uit zonder geloof). */
export function visieDelen(visie: Visie, islamAan: boolean): { def: VisieDeelDef; tekst: string }[] {
  return VISIE_DELEN.filter((d) => !d.islamitisch || islamAan)
    .map((def) => ({ def, tekst: ((visie[def.veld] as string | undefined) ?? "").trim() }))
    .filter((d) => d.tekst.length > 0);
}

export function visieTeksten(visie: Visie | null): VisieTeksten {
  const uit = {} as VisieTeksten;
  for (const d of VISIE_DELEN) uit[d.veld] = ((visie?.[d.veld] as string | undefined) ?? "").trim();
  return uit;
}

/** Schrijft de vijfjaarsvisie (of past hem aan). Geen geschiedenis (Wet 4). */
export function schrijfVisieDelen(teksten: Partial<VisieTeksten>, bestaand: Visie | null, nu: Date = new Date()): Visie {
  const nieuw: Visie = {
    periode: bestaand?.periode ?? "5_jaar",
    wieIkBen: "",
    watIkHeb: "",
    waarIkSta: "",
    geschrevenOp: bestaand?.geschrevenOp ?? nu.toISOString(),
    laatstGewijzigdOp: nu.toISOString(),
  };
  for (const d of VISIE_DELEN) nieuw[d.veld] = (teksten[d.veld] ?? "").trim();
  return nieuw;
}

/**
 * Eén van de ingevulde delen, deterministisch gewisseld per dag (dag-van-het-
 * jaar) zodat het niet bij elke open van de app wisselt — dat zou als
 * willekeurig geknipper voelen — maar de hele dag door wel hetzelfde
 * fragment blijft. Nooit de hele visie in één regel; de volle tekst staat in
 * de kamer "Mijn visie" en 's avonds bij Dag sluiten.
 */
export function visieFragment(
  visie: Visie,
  nu: Date = new Date(),
  islamAan = true
): { label: string; tekst: string } | null {
  const delen = visieDelen(visie, islamAan).map((d) => ({ label: d.def.stam, tekst: d.tekst }));
  if (delen.length === 0) return null;
  const dagVanJaar = Math.floor(
    (Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) - Date.UTC(nu.getFullYear(), 0, 0)) / 86400000
  );
  return delen[dagVanJaar % delen.length];
}

/** Alleen ochtend en middag krijgen het lichte fragment op het startscherm
 * — de avond krijgt het volledige leesblok in toonS23AvondSluiten zelf. */
export function visieFragmentZichtbaar(data: LifeMaxingData, dagdeel: Dagdeel): boolean {
  if (!data.visie) return false;
  const checkIns = visieCheckInsVoor(data);
  if (dagdeel === "ochtend" || dagdeel === "vroege_ochtend") return checkIns.ochtend;
  if (dagdeel === "middag") return checkIns.middag;
  return false;
}

// ── De herschrijfhulp ────────────────────────────────────────────────────
// Puur lokale regex, geen netwerk/AI-call (past bij v1.0 §11.4, nul
// netwerkverzoeken). Signaleert veelvoorkomende toekomende/voorwaardelijke
// vormen en geeft één zachte, concrete suggestie — nooit blokkerend: de
// "Verder"-knop werkt ook als de hint er staat.
const TOEKOMST_SIGNALEN: { patroon: RegExp; suggestie: string }[] = [
  { patroon: /\bik wil worden\b/i, suggestie: 'Dat is nog een wens. Probeer "ik ben" in plaats van "ik wil worden".' },
  { patroon: /\bga ik\b|\bik ga\b/i, suggestie: 'Probeer een zin die al gebeurt, bv. "ik beweeg" in plaats van "ik ga bewegen".' },
  { patroon: /\bik zal\b/i, suggestie: 'Probeer de tegenwoordige tijd: "ik ben" of "ik heb" in plaats van "ik zal".' },
  { patroon: /\bik hoop\b|\bik hoop dat\b/i, suggestie: "Schrijf het alsof het al zo is, niet als een hoop." },
  { patroon: /\bzou willen\b|\bzou moeten\b/i, suggestie: 'Maak er een zin van in het nu: "ik ben" of "ik heb", niet "zou willen".' },
  { patroon: /\booit\b|\bop een dag\b|\bin de toekomst\b|\buiteindelijk\b/i, suggestie: 'Laat "ooit" of "op een dag" weg — schrijf alsof het nu al zo is.' },
  { patroon: /\bik wil\b/i, suggestie: 'Dat is nog een wens. Wat zou de zin zijn als het al zo was?' },
];

export function toekomstSignaal(tekst: string): string | null {
  for (const { patroon, suggestie } of TOEKOMST_SIGNALEN) {
    if (patroon.test(tekst)) return suggestie;
  }
  return null;
}
