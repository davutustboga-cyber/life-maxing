// types.ts — gedeelde types, gespiegeld aan datamodel.md en de content/*.yaml bestanden.

export type Streek = "lichaam" | "geest" | "verbinding" | "ziel";
export type Soort = "nu" | "grond" | "richting";
export type Energie = "laag" | "midden" | "hoog" | "geen";
export type Drempel = "klein" | "midden" | "groot" | "geen";
export type Zone = "A_kalmeren" | "B_activeren" | "C_ordenen" | "D_verdiepen_laag" | "E_verdiepen_hoog";
export type Tijd = "2min" | "10min_of_meer";

export interface Woord {
  id: string;
  woord: string;
  energie: number; // -1..1
  toon: number; // -1..1
  ordenend?: boolean;
  zwaarsteGroep?: boolean;
  /** alleen bij eigen getypte woorden (datamodel.md → woorden_uitbreiding). */
  toegevoegdOp?: string;
}

export interface Kosten {
  tijdMinuten: [number, number];
  energie: Energie;
  drempel: Drempel;
}

export interface Beweging {
  id: string;
  titel: string;
  soort: Soort;
  streek: Streek;
  domeinLabel: string;
  kosten: Kosten;
  minimumversie: string;
  script: string;
  /**
   * Herkomst per label: "W" (onderzoek), "I" (islamitische traditie), "P"
   * (een eigen idee). S0 belooft dat dit "altijd apart gezegd" wordt, dus S5
   * toont per label een eigen regel — nooit samengevoegd tot één zin.
   *
   * `regel` is de specifieke reden waarom dít precies helpt (uit de
   * `notitie` in bewegingen.yaml, herschreven zonder brontekens naar de
   * spreekstijl van de app) — niet de generieke "hier is onderzoek naar
   * gedaan". Zonder dit was de concrete onderbouwing altijd al geschreven,
   * maar nooit zichtbaar: alleen het label kwam in de app terecht.
   */
  herkomst: { label: "W" | "I" | "P"; regel: string }[];
  /** woord-id's waar deze beweging bij past (bewegingen.yaml → past_bij). */
  pastBij: string[];
  /** woord-id's waarbij hij nooit mag verschijnen (past_niet_bij). */
  pastNietBij: string[];
  /** genoemde regels uit selectie.yaml (nooit_aanbieden_als). */
  nooitAanbiedenAls: string[];
}

export interface Moment {
  id: string;
  tijdstip: string; // ISO
  woorden: string[]; // woord-ids
  eigenWoord?: { woord: string; energie: number; toon: number };
  tijdBeschikbaar: Tijd;
  zone: Zone;
  gekozenDeur: string | null; // beweging-id | "niets-doen" | null
  afsluitwoorden: string[];
  verankeringszin: string | null;
}

export interface Ster {
  id: string;
  momentId: string;
  streek: Streek;
  datum: string;
  zin: string | null;
}

export interface Sterrenbeeld {
  id: string;
  streek: Streek;
  naam: string;
  sterIds: string[];
  aangemaaktOp: string;
}

export interface Maandbrief {
  id: string;
  maand: string; // "2026-08" — maandsleutel, nooit als getal getoond
  aangemaaktOp: string;
  /** De brief zoals hij geschreven is, bevroren. Eerste regel is het opschrift. */
  alineas: string[];
  gelezen: boolean;
}

/**
 * Het Weekmoment — De Spiegel (v2.0 §9.1 punt 8, v2.2 §11: "Spiegel: één keer
 * per week, vier zinnen, uitschakelbaar"). De beeldoefening (mentale
 * contrastering / WOOP, Pijler 5): beeld, werkelijkheid, plan — nooit alleen
 * het eerste deel. Bevroren zodra geschreven, net als een Maandbrief.
 */
export interface Weekmoment {
  id: string;
  week: string; // ISO-weeksleutel, "2026-W36" — nooit als getal getoond
  aangemaaktOp: string;
  beeld: string;
  werkelijkheid: string;
  plan: string;
  /** de beweging die je als "dit doe ik deze week, in het echte leven" koos */
  gekozenBewegingId: string;
}

export interface Onderdrukking {
  bewegingId: string;
  totDatum: string; // YYYY-MM-DD
  reden: "dit_klopt_niet" | "drie_keer_genegeerd";
}

/**
 * De perfectionisme-check (S17, v2.2 Wet 7 laatste punt). Hooguit één per
 * kalendermaand, nooit een trend of geschiedenis getoond — dit veld bestaat
 * alleen om "al deze maand gedaan" te kunnen bepalen.
 */
export interface PerfectionismeCheck {
  maand: string; // "2026-09" — maandsleutel, nooit als getal getoond
  antwoord: "als_hulp" | "als_verplichting";
}

export interface LifeMaxingData {
  versie: string;
  aangemaaktOp: string | null;
  instellingen: {
    islamitischeLaag: boolean;
    rustigeBeelden: boolean;
    ethischeOndergrensGezien: boolean;
    /** v2.2 §11: het weekmoment is uitschakelbaar. Standaard aan. */
    weekmomentAan: boolean;
  };
  woordenUitbreiding: Woord[];
  momenten: Moment[];
  sterren: Ster[];
  sterrenbeelden: Sterrenbeeld[];
  onderdrukkingen: Onderdrukking[];
  /**
   * Intern, nooit getoond (zoals `onderdrukkingen`, datamodel.md §2): streken
   * waarvoor het sterrenbeeld-aanbod is afgeslagen. v2.4 §9 — "eenmalig aanbod
   * per streek; nooit herhaald bij weigeren". Zonder dit veld zou het aanbod
   * bij elke opening van De Hemel opnieuw komen, en dat is precies het soort
   * aandringen dat Wet 5 verbiedt.
   */
  sterrenbeeldAanbodAfgewezen: Streek[];
  /**
   * De maandbrieven (v2.4 §7B). Worden één keer geschreven en daarna nooit
   * meer aangepast, en volgens v2.5 §5.3 nooit gearchiveerd of gewist.
   */
  brieven: Maandbrief[];
  /** De weekmomenten (v2.2 §11). Bevroren zodra geschreven, zoals een brief. */
  weekmomenten: Weekmoment[];
  /** S17, de perfectionisme-check. Hooguit één item per kalendermaand. */
  perfectionismeChecks: PerfectionismeCheck[];
  /**
   * S18, Frictie in de wereld (v2.2 Wet 8, punt 2). Alleen maandsleutels
   * ("2026-09") — bewust nooit welke suggestie gekozen is of uitgevoerd,
   * v2.2 Wet 8: "hij houdt niet bij hoe vaak dit gebeurt".
   */
  frictieAangebodenMaanden: string[];
}

export function leegBestand(): LifeMaxingData {
  return {
    versie: "1.0",
    aangemaaktOp: null,
    instellingen: {
      islamitischeLaag: true,
      rustigeBeelden: false,
      ethischeOndergrensGezien: false,
      weekmomentAan: true,
    },
    woordenUitbreiding: [],
    momenten: [],
    sterren: [],
    sterrenbeelden: [],
    onderdrukkingen: [],
    sterrenbeeldAanbodAfgewezen: [],
    brieven: [],
    weekmomenten: [],
    perfectionismeChecks: [],
    frictieAangebodenMaanden: [],
  };
}
