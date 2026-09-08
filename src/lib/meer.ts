// meer.ts — de twee maandelijkse reflecties achter "meer" (S16):
// de perfectionisme-check (S17) en Frictie in de wereld (S18).
// content/v1.1-meer.md: "hooguit één keer per kalendermaand, op eigen
// initiatief bereikbaar, en de app komt er nooit ongevraagd op terug."
//
// `?? []` bij elk veld hieronder is bewust, niet slordig: `laadBestand()`
// (db.ts) geeft een ouder opgeslagen bestand terug zoals het is, zonder het
// aan te vullen met `leegBestand()`-standaarden — hetzelfde patroon als
// `data.brieven ?? []` en `data.weekmomenten` elders in app.ts al gebruiken
// voor velden die na de eerste versie zijn toegevoegd.

import type { LifeMaxingData } from "./types.js";

/** "2026-09" — maandsleutel, nooit als getal getoond (v2.5 §5.2-conventie). */
export function huidigeMaandSleutel(nu: Date = new Date()): string {
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`;
}

export function perfectionismeCheckBeschikbaar(data: LifeMaxingData): boolean {
  const maand = huidigeMaandSleutel();
  return !(data.perfectionismeChecks ?? []).some((c) => c.maand === maand);
}

export function registreerPerfectionismeCheck(
  data: LifeMaxingData,
  antwoord: "als_hulp" | "als_verplichting"
): void {
  data.perfectionismeChecks = [...(data.perfectionismeChecks ?? []), { maand: huidigeMaandSleutel(), antwoord }];
}

export function frictieBeschikbaar(data: LifeMaxingData): boolean {
  const maand = huidigeMaandSleutel();
  return !(data.frictieAangebodenMaanden ?? []).includes(maand);
}

/** Registreert alleen dát het aanbod deze maand getoond is — nooit welke
 * suggestie gekozen is of of hij is uitgevoerd (v2.2 Wet 8). */
export function registreerFrictieAangeboden(data: LifeMaxingData): void {
  const maand = huidigeMaandSleutel();
  if (!(data.frictieAangebodenMaanden ?? []).includes(maand)) {
    data.frictieAangebodenMaanden = [...(data.frictieAangebodenMaanden ?? []), maand];
  }
}
