// kamers.ts — het huis (v27 herontwerp).
//
// De app is geen lijst van functies maar een huis: een hal (Vandaag) waar je
// binnenkomt, en een paar kamers met elk een eigen doel en een eigen sfeer.
// Elke kamer heeft één kleur van licht (zie style.css, `[data-kamer]`); de rest
// van het ontwerp is gedeeld, zodat het één huis blijft en geen zes apps.
//
// Bewust weinig kamers: zes deuren op de hal. De Hemel (terugkijken) en
// "Meer" (instellingen) zijn geen kamers maar staan als twee kleine tekens in
// de kop van de hal.

import type { GlyphNaam } from "../lib/glyphs.js";

export type KamerId = "vandaag" | "visie" | "adem" | "lichaam" | "mensen" | "geloof" | "motivatie" | "hemel";

export interface Kamer {
  id: KamerId;
  naam: string;
  /** Eén regel: waar deze kamer voor is. */
  doel: string;
  glyph: GlyphNaam;
  /** Alleen zichtbaar met de islamitische laag aan (in hun geheel). */
  islamitisch?: boolean;
  /** Thema's uit themas.ts waarvan de bewegingen in deze kamer wonen. */
  themaIds: string[];
}

/** De deuren op de hal, in vaste volgorde. */
export const kamers: Kamer[] = [
  {
    id: "visie",
    naam: "Mijn visie",
    doel: "Wie je over vijf jaar bent.",
    glyph: "visie",
    themaIds: ["richting", "doorzetten"],
  },
  {
    id: "adem",
    naam: "Adem & rust",
    doel: "Even laten zakken.",
    glyph: "adem",
    themaIds: ["rust", "hoofd", "reset"],
  },
  {
    id: "lichaam",
    naam: "Lichaam",
    doel: "Klein, praktisch, zonder meten.",
    glyph: "lichaam",
    themaIds: ["lichaam", "slaap"],
  },
  {
    id: "mensen",
    naam: "Mensen",
    doel: "Een stap naar iemand toe.",
    glyph: "mensen",
    themaIds: ["verbinding"],
  },
  {
    id: "geloof",
    naam: "Geloof",
    doel: "Rust en verbinding met Allah.",
    glyph: "geloof",
    islamitisch: true,
    themaIds: ["geloof"],
  },
  {
    id: "motivatie",
    naam: "Motivatie",
    doel: "Voor als je even niets meer hebt.",
    glyph: "motivatie",
    themaIds: [],
  },
];

export function kamerById(id: string): Kamer | undefined {
  return kamers.find((k) => k.id === id);
}

/**
 * In welke kamer woont een beweging? Zo kan het startscherm zeggen "uit Adem &
 * rust" bij een aanbeveling: aanbevelingen komen uit alle kamers. Een
 * [I]-beweging woont altijd in Geloof; verder telt de eerste kamer waarvan een
 * thema de beweging bevat.
 */
export function kamerVanBeweging(
  bewegingId: string,
  themas: { id: string; bewegingIds: string[] }[],
  isIslamitisch: boolean
): Kamer | null {
  if (isIslamitisch) return kamerById("geloof") ?? null;
  for (const kamer of kamers) {
    if (kamer.islamitisch) continue;
    for (const themaId of kamer.themaIds) {
      const thema = themas.find((t) => t.id === themaId);
      if (thema?.bewegingIds.includes(bewegingId)) return kamer;
    }
  }
  return null;
}
