// ritme.ts — gespiegeld aan de React-versie (v20). Zie daar voor de
// volledige toelichting van Het Ritme (§2.4) en De Grond (§2.5).

import type { DagSluiting, GedaanVandaag, LifeMaxingData } from "./types.js";

export function huidigeDagSleutel(nu: Date = new Date()): string {
  const tz = new Date(nu.getTime() - nu.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

/**
 * v27 — de dag van het jaar (1–366), lokale kalenderdag. Hetzelfde principe
 * als `visieFragment()` en `motivatiehoekVoorVandaag()`: een deterministische
 * keuze per dag wisselt van dag tot dag, staat de hele dag stil en telt niets.
 */
export function dagVanJaar(nu: Date = new Date()): number {
  return Math.floor((Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) - Date.UTC(nu.getFullYear(), 0, 0)) / 86400000);
}

export function ochtendVandaagGedaan(data: LifeMaxingData, nu: Date = new Date()): boolean {
  const vandaag = huidigeDagSleutel(nu);
  return (data.ochtendMomenten ?? []).some((o) => o.datum === vandaag);
}

export function avondVandaagGedaan(data: LifeMaxingData, nu: Date = new Date()): boolean {
  const vandaag = huidigeDagSleutel(nu);
  return (data.dagsluitingen ?? []).some((d) => d.datum === vandaag);
}

const ONTBREKENDE_GROND_CHIPS = ["slecht_geslapen", "niet_bewogen", "niet_buiten_geweest", "veel_alleen"];

export function onrustScore(d: DagSluiting): number {
  if (d.chips.includes("goede_dag")) return 0;
  const ontbrekend = d.chips.filter((c) => ONTBREKENDE_GROND_CHIPS.includes(c)).length;
  return Math.min(1, ontbrekend / ONTBREKENDE_GROND_CHIPS.length);
}

export function recenteDagsluitingen(data: LifeMaxingData, n = 14): DagSluiting[] {
  return [...(data.dagsluitingen ?? [])].sort((a, b) => a.datum.localeCompare(b.datum)).slice(-n);
}

/**
 * v25 — de dagsluiting van gisteren (of, is die er niet, van vandaag).
 *
 * Waarom: `suggestiesVoorNu()` keek tot nu toe alleen op de klok, terwijl het
 * bestand al wist wat je gisteravond zelf had aangevinkt ("slecht geslapen",
 * "niet buiten geweest"). Dat is precies de context die een ochtendsuggestie
 * bruikbaar maakt in plaats van generiek. Bewust hooguit één dag terug: dit
 * is context voor nu, geen trend en geen geschiedenis (Wet 4).
 */
export function laatsteDagsluiting(data: LifeMaxingData, nu: Date = new Date()): DagSluiting | null {
  const gisteren = new Date(nu.getTime() - 86400000);
  const sleutels = new Set([huidigeDagSleutel(gisteren), huidigeDagSleutel(nu)]);
  const gevonden = (data.dagsluitingen ?? []).filter((d) => sleutels.has(d.datum));
  if (gevonden.length === 0) return null;
  return gevonden.sort((a, b) => a.datum.localeCompare(b.datum))[gevonden.length - 1];
}

/** v25 — het ochtendmoment van vandaag, om de kerntaak later op de dag terug
 * te kunnen geven. Tot nu toe werd hij gevraagd en nooit meer getoond. */
export function ochtendMomentVandaag(data: LifeMaxingData, nu: Date = new Date()) {
  const vandaag = huidigeDagSleutel(nu);
  return (data.ochtendMomenten ?? []).find((o) => o.datum === vandaag) ?? null;
}

/** v25 — het "iets kleins voor morgen" dat je gisteravond opschreef. Scullin
 * e.a. 2018 is de reden dat dit veld bestaat; zonder het 's ochtends terug te
 * geven was het een veld dat niemand ooit terugzag. */
export function voorVandaagVanGisteren(data: LifeMaxingData, nu: Date = new Date()): string | null {
  const gisteren = huidigeDagSleutel(new Date(nu.getTime() - 86400000));
  const d = (data.dagsluitingen ?? []).find((x) => x.datum === gisteren);
  const tekst = d?.voorMorgen?.trim();
  return tekst ? tekst : null;
}

// ── v27 — wat je vandaag al deed ─────────────────────────────────────────
// Zie `GedaanVandaag` in types.ts. Een dag-vlag, geen geschiedenis: de
// record van gisteren telt niet mee en wordt bij de eerstvolgende schrijfactie
// gewoon vervangen.

function vandaagRecord(data: LifeMaxingData, nu: Date): GedaanVandaag | null {
  const r = data.gedaanVandaag;
  return r && r.datum === huidigeDagSleutel(nu) ? r : null;
}

function schrijfbaarRecord(data: LifeMaxingData, nu: Date): GedaanVandaag {
  const r = vandaagRecord(data, nu);
  if (r) return r;
  const nieuw: GedaanVandaag = { datum: huidigeDagSleutel(nu), aflevering: false, items: [] };
  data.gedaanVandaag = nieuw;
  return nieuw;
}

export function registreerGedaan(data: LifeMaxingData, dagdeel: string, sleutel: string, nu: Date = new Date()): void {
  const r = schrijfbaarRecord(data, nu);
  if (!r.items.some((i) => i.dagdeel === dagdeel && i.sleutel === sleutel)) r.items.push({ dagdeel, sleutel });
}

export function registreerAflevering(data: LifeMaxingData, nu: Date = new Date()): void {
  schrijfbaarRecord(data, nu).aflevering = true;
}

export function afleveringGelezen(data: LifeMaxingData, nu: Date = new Date()): boolean {
  return vandaagRecord(data, nu)?.aflevering ?? false;
}

/** Heb je in dit dagdeel al iets gedaan? Dan sluit het startscherm af. */
export function dagdeelAfgerond(data: LifeMaxingData, dagdeel: string, nu: Date = new Date()): boolean {
  return (vandaagRecord(data, nu)?.items ?? []).some((i) => i.dagdeel === dagdeel);
}

export function vandaagAlGedaan(data: LifeMaxingData, sleutel: string, nu: Date = new Date()): boolean {
  return (vandaagRecord(data, nu)?.items ?? []).some((i) => i.sleutel === sleutel);
}
