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
  /**
   * bewegingen.yaml → grenzen.medisch. Alleen gevuld bij een beweging met
   * een reëel fysiek risico (voorlopig alleen korte-koude-douche — de
   * eerste in de bibliotheek). Staat op S5/S15 vast onder het script, elke
   * keer, in dezelfde typografie als de herkomstregels — geen apart
   * waarschuwingsscherm, geen eenmalige acceptatieklik (veiligheid.md §4,
   * "koude blootstelling").
   */
  medischeGrens?: string[];
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
    /**
     * v22 — per dagdeel uit- te zetten of het visie-fragment/-blok
     * verschijnt. Geen tijdstip-instelling (geen tijdpicker): dit volgt de
     * bestaande dagdeel-grenzen uit lib/nu.ts. Standaard alle drie aan.
     */
    visieCheckIns: { ochtend: boolean; middag: boolean; avond: boolean };
    /**
     * v22 — of de eenmalige visie-onboarding al is aangeboden (geaccepteerd
     * of overgeslagen, maakt niet uit). Zonder dit veld zou toonVisieIntro
     * bij elke app-open terugkomen voor wie hem oversloeg — precies het
     * soort aandringen dat Wet 5 verbiedt.
     */
    visieIntroAangeboden: boolean;
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
  /**
   * S20, "Wie ik word" (v2.md §9.1 punt 10). Eén zelfgeschreven zin, altijd
   * overschrijfbaar — geen geschiedenis. De bewijslijst-functie zelf zit al
   * in De Hemel (S8); dit veld is puur de losse zin ernaast. Gespiegeld aan
   * de React-versie (v20).
   */
  wieIkWord: string | null;
  /**
   * S21, "Verlangen van de periode" (v2.md §9.1 punt 9, Masterplan-v2.md
   * §7.3). Islamitische naam alleen zichtbaar met de laag aan. Geen vaste
   * cadans. Gespiegeld aan de React-versie (v20).
   */
  verlangenVanDePeriode: { kwaliteitId: string; sinds: string } | null;
  /** S22, Ochtend — Richting (v2.md §9.1 punt 6, v2.3 §2.4 "Het Ritme"). */
  ochtendMomenten: OchtendMoment[];
  /** S23, Avond — Dag sluiten (v2.md §9.1 punt 7, v2.3 §2.5 "De Grond"). */
  dagsluitingen: DagSluiting[];
  /**
   * v21, spoor W6 -- de WOOP-flow (Wish/Outcome/Obstacle/Plan). Net als
   * wieIkWord altijd overschrijfbaar, geen geschiedenis (Wet 4): dit is
   * waar je nu naartoe werkt, niet een logboek van eerdere doelen.
   */
  doel: Doel | null;
  /** v22 — De Visie, zie de interface hierboven. */
  visie: Visie | null;
  /**
   * v24 — tussentijdse voortgang van de WOOP-flow (S24) en Dag sluiten
   * (S23). Beide flows lopen over meerdere schermen; tot v23 stond alles
   * alleen in een JS-object in het geheugen en werd pas op de allerlaatste
   * stap bewaard — de app of het toestel sluiten halverwege verloor dan
   * alles wat je al had ingevuld. Nu wordt na elke stap dit concept
   * bijgewerkt én bewaard, en bij het opnieuw openen van de flow vooringe-
   * vuld teruggegeven. Bij een succesvol afgeronde flow wordt het concept
   * meteen weer op `null` gezet — dit is nooit een tweede geschiedenis,
   * alleen een vangnet tegen dataverlies onderweg.
   */
  conceptDoel: ConceptDoel | null;
  conceptDagsluiting: ConceptDagsluiting | null;
}

export interface ConceptDoel {
  wish: string;
  outcome: string;
  obstacleTekst: string;
  planDan: string;
}

export interface ConceptDagsluiting {
  positie: { energie: number; toon: number } | null;
  chips: string[];
  dankbaarheid: string;
  zin: string;
  voorMorgen: string;
}

export interface Doel {
  wish: string;
  outcome: string;
  obstacleTekst: string;
  planAls: string;
  planDan: string;
  sinds: string;
}

export type VisiePeriode = "3_maanden" | "1_jaar" | "5_jaar";

/**
 * De Visie (v22, bij onboarding): een zelfgeschreven "toekomst in het nu" —
 * drie delen, tegenwoordige tijd. Net als wieIkWord/doel altijd overschrijf-
 * baar, geen geschiedenis (Wet 4). Bewust geen "manifestatie-belofte" op
 * zich: puur een identiteitsbeeld, zoals wieIkWord dat ook al mag zijn
 * zonder obstakel — de brug naar een concreet doel (met obstakel + plan,
 * v21 se Doel) staat los, als vrijblijvende link na het schrijven.
 */
export interface Visie {
  periode: VisiePeriode;
  wieIkBen: string;
  watIkHeb: string;
  waarIkSta: string;
  geschrevenOp: string;
  laatstGewijzigdOp: string;
}

export interface OchtendMoment {
  id: string;
  datum: string;
  intentie: string | null;
  kerntaak: string | null;
}

export interface DagSluiting {
  id: string;
  datum: string;
  positie: { energie: number; toon: number } | null;
  chips: string[];
  dankbaarheid: string | null;
  zin: string | null;
  /**
   * v22 — "iets kleins voor morgen": één concreet, vooruitkijkend puntje,
   * los van `zin` (terugkijkend). Scullin e.a. 2018: een korte, concrete
   * to-do voor morgen vlak voor het slapen verkort de inslaaptijd; dat is
   * een ander mechanisme dan terugkijken/dankbaarheid, dus een eigen veld.
   */
  voorMorgen: string | null;
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
      visieCheckIns: { ochtend: true, middag: true, avond: true },
      visieIntroAangeboden: false,
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
    wieIkWord: null,
    verlangenVanDePeriode: null,
    ochtendMomenten: [],
    dagsluitingen: [],
    doel: null,
    visie: null,
    conceptDoel: null,
    conceptDagsluiting: null,
  };
}
