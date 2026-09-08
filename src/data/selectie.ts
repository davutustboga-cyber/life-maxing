// selectie.ts — vertaling van selectie.yaml. Zie dat bestand voor de volledige
// toelichting per regel.
//
// v1.1 (8 september 2026): de zeven nieuwe bewegingen kregen een zone via
// selectie.yaml §v1.1. Dat blok voegt op meerdere plekken een rotatie tussen
// twee of drie deuren toe (in plaats van één vaste tweede deur), en op twee
// plekken een woord-afhankelijke vervanging. Beide vormen staan hieronder als
// data; de uitvoering staat in selection.ts.

import type { Tijd, Zone } from "../lib/types.js";

export interface ZoneDef {
  id: Zone;
  naam: string;
  zwaartepunt: { energie: number; toon: number };
}

export const zones: ZoneDef[] = [
  { id: "A_kalmeren", naam: "Kalmeren", zwaartepunt: { energie: 0.66, toon: -0.53 } },
  { id: "B_activeren", naam: "Activeren", zwaartepunt: { energie: -0.65, toon: -0.58 } },
  { id: "C_ordenen", naam: "Ordenen", zwaartepunt: { energie: 0.09, toon: -0.47 } },
  { id: "D_verdiepen_laag", naam: "Verdiepen (rust)", zwaartepunt: { energie: -0.37, toon: 0.63 } },
  { id: "E_verdiepen_hoog", naam: "Verdiepen (elan)", zwaartepunt: { energie: 0.57, toon: 0.69 } },
];

/** Eén rotatie-optie: een deur-id, eventueel alleen geldig met de
 * islamitische laag aan, en/of alleen geldig als één van de gekozen woorden
 * in `vereistWoord` staat (selectie.yaml §v1.1: "komt alleen in de wisseling
 * als een van de gekozen woorden ..."). Zonder voorwaarden is de optie altijd
 * geldig. */
export interface RotatieOptie {
  id: string;
  vereistIslamitischeLaag?: boolean;
  vereistWoord?: string[];
}

/** Eén slot (eerste of tweede deur) is óf een vaste id, óf een rotatie over
 * twee of meer opties — nooit twee keer op rij dezelfde, zie
 * `volgendeInRotatie` in selection.ts. */
export type DeurSlot = string | RotatieOptie[];

interface TijdConfig {
  eerste: DeurSlot;
  tweede: DeurSlot;
}

/** Eén woord-afhankelijke vervanging van de tweede deur (selectie.yaml
 * §v1.1, C_ordenen). `nooitBijTijd` sluit de vervanging uit voor een tijd
 * (vergeven-eerste-stap mag nooit bij 2 minuten). */
export interface Vervanging {
  bijWoord: string[];
  vervangtDoor: string;
  nooitBijTijd?: Tijd[];
}

interface ZoneConfig {
  bij2min: TijdConfig;
  bij10minOfMeer: TijdConfig;
  /** alleen C_ordenen: bij2min hangt af van de islamitische-laag-instelling
   * in plaats van van een enkele vaste eerste/tweede. */
  islamitischeLaagAanBij2min?: TijdConfig;
  islamitischeLaagUitBij2min?: TijdConfig;
  vervangingen?: Vervanging[];
}

// ─────────────────────────────────────────────────────────────────────────
// selectie.yaml → selectie_per_zone + selectie_per_zone_v1_1, samengevoegd.
// ─────────────────────────────────────────────────────────────────────────
export const zoneConfig: Record<Zone, ZoneConfig> = {
  A_kalmeren: {
    // v1.1: bij 2 min wisselt de tweede deur tussen uitschrijven-zonder-filter
    // en afstand-nemen-van-jezelf. adem-lange-uitademing blijft altijd eerst.
    bij2min: {
      eerste: "adem-lange-uitademing",
      tweede: [{ id: "uitschrijven-zonder-filter" }, { id: "afstand-nemen-van-jezelf" }],
    },
    // Bij 10 min of meer verandert er niets in v1.1.
    bij10minOfMeer: { eerste: "adem-lange-uitademing", tweede: "vijf-minuten-naar-buiten" },
  },

  B_activeren: {
    // v1.1: aanname-omdraaien komt alleen in de wisseling mee als een van de
    // gekozen woorden eenzaam, onzeker of wantrouwend is — anders blijft
    // bericht-sturen vast staan (geen rotatie).
    bij2min: {
      eerste: "vijf-minuten-naar-buiten",
      tweede: [
        { id: "bericht-sturen" },
        { id: "aanname-omdraaien", vereistWoord: ["eenzaam", "onzeker", "wantrouwend"] },
      ],
    },
    // v1.1: de eerste deur roteert nu over drie wandel-/loopvarianten;
    // lopen-met-dhikr doet alleen mee met de islamitische laag aan. Wat een
    // eventueel ontbrekende ruimte om te lopen betreft: bericht-sturen als
    // tweede deur vraagt dat nooit (Fase-3-Bouw-status.md, "veilige deur" —
    // de bestaande drie-deurenwet lost dit al op, geen aparte "waar ben
    // je?"-vraag nodig).
    bij10minOfMeer: {
      eerste: [
        { id: "tien-minuten-wandelen-groen" },
        { id: "wandelen-met-een-vraag" },
        { id: "lopen-met-dhikr", vereistIslamitischeLaag: true },
      ],
      tweede: "bericht-sturen",
    },
  },

  C_ordenen: {
    // De platte bij2min hieronder wordt nooit gebruikt (C_ordenen kiest
    // altijd via islamitischeLaagAanBij2min / islamitischeLaagUitBij2min) —
    // hij staat er alleen omdat TijdConfig verplicht is voor het type.
    bij2min: { eerste: "benoemen-en-parkeren", tweede: "tawakkul-route" },
    bij10minOfMeer: {
      // v1.1: bij 10 min of meer wordt lopen de eerste deur; de tweede
      // wisselt tussen benoemen-en-parkeren en afstand-nemen-van-jezelf.
      eerste: "wandelen-met-een-vraag",
      tweede: [{ id: "benoemen-en-parkeren" }, { id: "afstand-nemen-van-jezelf" }],
    },
    islamitischeLaagAanBij2min: {
      eerste: "benoemen-en-parkeren",
      tweede: [{ id: "tawakkul-route" }, { id: "afstand-nemen-van-jezelf" }],
    },
    islamitischeLaagUitBij2min: {
      eerste: "benoemen-en-parkeren",
      tweede: [{ id: "afstand-nemen-van-jezelf" }, { id: "zelfcompassie-na-misstap" }],
    },
    vervangingen: [
      // Ongewijzigd principe uit v1, nu uitgebreid: het woord bepaalt, niet
      // de instelling. Geldt bij 2 min (tawakkul-route of
      // afstand-nemen-van-jezelf) én bij 10 min of meer
      // (afstand-nemen-van-jezelf).
      { bijWoord: ["schuldig", "zelfkritisch"], vervangtDoor: "zelfcompassie-na-misstap" },
      // v1.1: vergeven-eerste-stap vervangt de tweede deur bij wantrouwend of
      // verdrietig — nooit bij 2 min, alleen bij 10 min of meer. Deze regel
      // wordt alleen toegepast als de vorige (schuldig/zelfkritisch) niet al
      // heeft vervangen — zie selection.ts.
      { bijWoord: ["wantrouwend", "verdrietig"], vervangtDoor: "vergeven-eerste-stap", nooitBijTijd: ["2min"] },
    ],
  },

  D_verdiepen_laag: {
    // v1.1: omhoogkijken erbij als derde optie in de rotatie van de tweede
    // deur; shukr-drie-dingen blijft alleen meedoen met de islamitische laag
    // aan. Savoring blijft altijd eerst.
    bij2min: {
      eerste: "savoring-zestig-seconden",
      tweede: [
        { id: "dankbaarheid-naar-persoon" },
        { id: "shukr-drie-dingen", vereistIslamitischeLaag: true },
        { id: "omhoogkijken" },
      ],
    },
    bij10minOfMeer: {
      eerste: "savoring-zestig-seconden",
      tweede: [
        { id: "dankbaarheid-naar-persoon" },
        { id: "shukr-drie-dingen", vereistIslamitischeLaag: true },
        { id: "omhoogkijken" },
      ],
    },
  },

  E_verdiepen_hoog: {
    // v1.1: de eerste deur wisselt tussen vijftien-minuten-moeilijke-ding en
    // bewegen-met-een-beeld; dankbaarheid-naar-persoon blijft de vaste
    // tweede deur (vraagt geen ruimte om te bewegen — "veilige deur").
    bij2min: {
      eerste: [{ id: "vijftien-minuten-moeilijke-ding" }, { id: "bewegen-met-een-beeld" }],
      tweede: "dankbaarheid-naar-persoon",
    },
    bij10minOfMeer: {
      eerste: [{ id: "vijftien-minuten-moeilijke-ding" }, { id: "bewegen-met-een-beeld" }],
      tweede: "dankbaarheid-naar-persoon",
    },
  },
};

/** selectie.yaml → "nooit"-lijsten, uitgebreid met de v1.1-toevoegingen per
 * zone (selectie.yaml §v1.1, elke zone se `nooit` / `nooit_erbij`). */
export const nooitPerZone: Record<Zone, string[]> = {
  A_kalmeren: [
    "bericht-sturen",
    "vijftien-minuten-moeilijke-ding",
    "dankbaarheid-naar-persoon",
    "vergeven-eerste-stap",
    "omhoogkijken",
    "aanname-omdraaien",
    "wandelen-met-een-vraag",
    "lopen-met-dhikr",
    "bewegen-met-een-beeld",
  ],
  B_activeren: [
    "savoring-zestig-seconden",
    "shukr-drie-dingen",
    "vijftien-minuten-moeilijke-ding",
    "bewegen-met-een-beeld",
    "omhoogkijken",
    "vergeven-eerste-stap",
  ],
  C_ordenen: [
    "dankbaarheid-naar-persoon",
    "shukr-drie-dingen",
    "vijftien-minuten-moeilijke-ding",
    "bewegen-met-een-beeld",
    "omhoogkijken",
  ],
  D_verdiepen_laag: [
    "vijftien-minuten-moeilijke-ding",
    "tien-minuten-wandelen-groen",
    "wandelen-met-een-vraag",
    "lopen-met-dhikr",
    "bewegen-met-een-beeld",
    "vergeven-eerste-stap",
    "afstand-nemen-van-jezelf",
  ],
  E_verdiepen_hoog: [
    "adem-lange-uitademing",
    "uitschrijven-zonder-filter",
    "benoemen-en-parkeren",
    "afstand-nemen-van-jezelf",
    "vergeven-eerste-stap",
    "aanname-omdraaien",
  ],
};

export const ONDERDRUKKING_DAGEN = 7;
