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
      return "3 maanden";
    case "1_jaar":
      return "1 jaar";
    case "5_jaar":
      return "5 jaar";
  }
}

/**
 * Eén van de drie delen, deterministisch gewisseld per dag (dag-van-het-
 * jaar) zodat het niet bij elke open van de app wisselt — dat zou als
 * willekeurig geknipper voelen — maar de hele dag door wel hetzelfde
 * fragment blijft. Nooit de hele visie in één regel: dat zou het
 * ochtend/middag-moment zwaarder maken dan bedoeld (dat is het avondmoment).
 */
export function visieFragment(visie: Visie, nu: Date = new Date()): { label: string; tekst: string } | null {
  const delen: { label: string; tekst: string }[] = [
    { label: "Wie je bent", tekst: visie.wieIkBen },
    { label: "Wat je hebt", tekst: visie.watIkHeb },
    { label: `Waar je staat, over ${periodeLabel(visie.periode)}`, tekst: visie.waarIkSta },
  ].filter((d) => d.tekst.trim().length > 0);
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
