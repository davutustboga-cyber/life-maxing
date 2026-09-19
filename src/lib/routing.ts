// routing.ts — "wat heb je nu nodig?" (Life Maxi 2.0).
//
// Een gekozen gevoel is een aanwijzing voor een mogelijke behoefte, geen
// diagnose. Dit bestand vertaalt een gevoel + het moment van de dag + de
// beschikbare tijd naar één voorstel mét de reden erbij, en laat de gebruiker
// altijd de keuze.
//
// Bewust GEEN nieuw beslismodel: de vertaling loopt via de bestaande,
// geteste selectielogica (selection.ts: zone bepalen, dan `bepaalDeuren`
// met alle veiligheidsregels: "nooit"-lijsten, `pastNietBij`, duur, onderdrukking
// en "dit klopt niet"). Elk gevoel is een woord uit woorden.ts, dus dezelfde
// motor die de kompaslus aandrijft. Zo blijft het begrijpelijk, uitlegbaar en
// zonder ondoorzichtige AI-beslissing; uitbreiden kan later door gevoelens of
// regels toe te voegen.
//
// Wat dit niet doet: niets bijhouden (geen "je voelde je vaak moe"), niets
// als trend tonen, en nooit een oefening opdringen. Het voorstel is een
// aanbod; "niets doen" blijft altijd een van de drie deuren (selectie.yaml).

import type { LifeMaxingData, Tijd, Zone } from "./types.js";
import { bepaalZone, bepaalDeuren } from "./selection.js";
import { bewegingById } from "../data/bewegingen.js";
import { dagdeelVan, suggestiesVoorNu, type Suggestie } from "./nu.js";
import { kamerVanBeweging, type Kamer } from "../data/kamers.js";
import { themas } from "../data/themas.js";
import { visieDelen } from "./visie.js";
import { adhkar } from "../data/adhkar.js";

export interface Gevoel {
  id: string;
  label: string;
  /** woorden.ts-id's; leeg = geen woord (zie `geenIdee`, `anders`). */
  woorden: string[];
  /** Hoe het in de zin klinkt: "Je gaf aan dat je je {zin} voelt." */
  zin: string;
}

/**
 * Negen keuzes, in gewone taal. Alle woorden staan al in de kompaslus
 * (woorden.ts), dus dezelfde betekenis en dezelfde zone-indeling. "Geen idee"
 * en "Anders" hebben geen woord: de eerste valt terug op wat bij dit moment
 * van de dag past, de tweede opent de Schijf.
 */
export const GEVOELENS: Gevoel[] = [
  { id: "moe", label: "Moe", woorden: ["moe"], zin: "moe" },
  { id: "gestrest", label: "Gestrest", woorden: ["gespannen"], zin: "gespannen" },
  { id: "onrustig", label: "Onrustig", woorden: ["onrustig"], zin: "onrustig" },
  { id: "boos", label: "Boos", woorden: ["boos"], zin: "boos" },
  { id: "verdrietig", label: "Verdrietig", woorden: ["verdrietig"], zin: "verdrietig" },
  { id: "alleen", label: "Alleen", woorden: ["eenzaam"], zin: "alleen" },
  { id: "rustig", label: "Rustig", woorden: ["rustig"], zin: "rustig" },
  { id: "gemotiveerd", label: "Gemotiveerd", woorden: ["gemotiveerd"], zin: "gemotiveerd" },
  { id: "geen-idee", label: "Geen idee", woorden: [], zin: "" },
];

export function gevoelById(id: string): Gevoel | undefined {
  return GEVOELENS.find((g) => g.id === id);
}

export interface Advies {
  gevoel: Gevoel;
  tijd: Tijd;
  zone: Zone | null;
  /** De drie deuren zoals de selectielogica ze bepaalt (twee bewegingen + "niets-doen"). */
  deuren: string[];
  /** Het voorstel: bovenaan, met de reden. */
  primair: Suggestie;
  /** De tweede deur, als alternatief. */
  alternatief: Suggestie | null;
  kamer: Kamer | null;
  /** Wat je zelf schreef dat hierbij past (uit je visie), of null. */
  visieRegel: string | null;
}

function zoneZin(zone: Zone): string {
  switch (zone) {
    case "A_kalmeren":
      return "die helpt om even te laten zakken";
    case "B_activeren":
      return "die je zachtjes op gang brengt";
    case "C_ordenen":
      return "die het uit je hoofd haalt";
    case "D_verdiepen_laag":
      return "die aandacht geeft aan wat goed is";
    case "E_verdiepen_hoog":
      return "die je energie ergens goed voor gebruikt";
  }
}

/** Welk deel van jouw visie hoort bij een kamer? (De kamer Mensen ↔ "de mensen om mij heen", enz.) */
function visieVeldVoorKamer(kamerId: string): "lichaamEnRust" | "geloof" | "relaties" | "hoeIkLeef" | null {
  switch (kamerId) {
    case "lichaam":
    case "adem":
      return "lichaamEnRust";
    case "geloof":
      return "geloof";
    case "mensen":
      return "relaties";
    default:
      return null;
  }
}

/** Eén regel uit je eigen visie die bij deze kamer past: "Je schreef: …". */
export function visieRegelVoorKamer(data: LifeMaxingData, kamerId: string): string | null {
  if (!data.visie) return null;
  const veld = visieVeldVoorKamer(kamerId);
  if (!veld) return null;
  const deel = visieDelen(data.visie, data.instellingen.islamitischeLaag).find((d) => d.def.veld === veld);
  return deel ? `Je schreef: ${deel.def.stam} ${deel.tekst}` : null;
}

function bewegingVoorstel(id: string, reden: string): Suggestie | null {
  const b = bewegingById(id);
  if (!b) return null;
  const [van, tot] = b.kosten.tijdMinuten;
  return { soort: "beweging", id, titel: b.titel, duur: van === tot ? `${van} min` : `${van}–${tot} min`, waaromNu: reden };
}

/**
 * Het voorstel voor een gevoel. `nu` maakt het testbaar; `tijd` is de
 * beschikbare tijd die de gebruiker (optioneel) aangaf, standaard kort.
 */
export function adviesVoor(gevoelId: string, tijd: Tijd, data: LifeMaxingData, nu: Date = new Date()): Advies | null {
  const gevoel = gevoelById(gevoelId);
  if (!gevoel) return null;
  const islam = data.instellingen.islamitischeLaag;

  // "Geen idee": geen aanname over hoe je je voelt; het voorstel volgt het moment van de dag.
  if (gevoel.woorden.length === 0) {
    const dagVoorstel = suggestiesVoorNu(data, nu).find((s) => s.soort !== "rust");
    if (!dagVoorstel) return null;
    const kamer = dagVoorstel.id
      ? kamerVanBeweging(dagVoorstel.id, themas, Boolean(bewegingById(dagVoorstel.id)?.herkomst.some((h) => h.label === "I")))
      : null;
    return {
      gevoel,
      tijd,
      zone: null,
      deuren: [],
      primair: {
        ...dagVoorstel,
        waaromNu: `Je wist het niet precies — dat mag. ${dagVoorstel.waaromNu}`,
      },
      alternatief: null,
      kamer,
      visieRegel: kamer ? visieRegelVoorKamer(data, kamer.id) : null,
    };
  }

  let zone = bepaalZone(gevoel.woorden);
  // 's Avonds laat zet "moe" je niet aan het werk (geen koude douche om 23:00).
  const laat = ["nacht", "voor_slapen"].includes(dagdeelVan(nu));
  if (laat && zone === "B_activeren") zone = "A_kalmeren";

  const deuren = bepaalDeuren(zone, tijd, data, islam, gevoel.woorden);
  const bewegingIds = deuren.filter((id) => id !== "niets-doen");
  const eerste = bewegingIds[0];
  const tweede = bewegingIds[1];
  const eersteB = eerste ? bewegingById(eerste) : undefined;
  if (!eerste || !eersteB) return null;

  const reden = `Je gaf aan dat je je ${gevoel.zin} voelt. ${eersteB.titel} is een kleine stap ${zoneZin(zone)}. Kort kan ook: ${eersteB.minimumversie.charAt(0).toLowerCase()}${eersteB.minimumversie.slice(1)}`;
  const kamer = kamerVanBeweging(eerste, themas, eersteB.herkomst.some((h) => h.label === "I"));
  return {
    gevoel,
    tijd,
    zone,
    deuren,
    primair: bewegingVoorstel(eerste, reden)!,
    alternatief: tweede ? bewegingVoorstel(tweede, `Of, als je liever iets anders doet: ${bewegingById(tweede)?.minimumversie ?? ""}`) : null,
    kamer,
    visieRegel: kamer ? visieRegelVoorKamer(data, kamer.id) : null,
  };
}

// ── De eerste stap per kamer ────────────────────────────────────────────
//
// Elke kamer moet zeggen "begin hier". Dat is een kleine, vaste voorraad per
// kamer met een reden erbij; welke er vandaag vooraan staat, wisselt per dag
// (dagVanJaar), en wat je vandaag al deed valt af.

interface KamerStap {
  id: string;
  soort: "beweging" | "dhikr";
  reden: string;
}

export const KAMER_STAPPEN: Record<string, KamerStap[]> = {
  adem: [
    { id: "adem-lange-uitademing", soort: "beweging", reden: "De eenvoudigste manier om even te laten zakken: vier tellen in, zes uit." },
    { id: "box-ademhaling", soort: "beweging", reden: "Een vaste tel geeft je hoofd iets om aan vast te houden." },
    { id: "fysiologische-zucht", soort: "beweging", reden: "Twee korte inademingen en een lange uitademing, als je het snel nodig hebt." },
    { id: "vijf-zintuigen-grounding", soort: "beweging", reden: "Terug uit je hoofd, in wat er nu is." },
  ],
  lichaam: [
    { id: "vijf-minuten-naar-buiten", soort: "beweging", reden: "Vijf minuten buiten is genoeg om je lichaam weer iets te laten doen." },
    { id: "tien-minuten-wandelen-groen", soort: "beweging", reden: "Even lopen, liefst groen. Dat hoeft niet ver." },
    { id: "ochtendlicht-zien", soort: "beweging", reden: "Licht in het eerste uur zet je dag- en slaapritme." },
    { id: "voeten-op-de-grond", soort: "beweging", reden: "Dertig seconden voelen dat je er staat." },
  ],
  mensen: [
    { id: "bericht-sturen", soort: "beweging", reden: "Eén bericht is klein en het maakt de dag anders." },
    { id: "dankbaarheid-naar-persoon", soort: "beweging", reden: "Zeggen dat je dankbaar bent kost niets en blijft hangen." },
    { id: "aanname-omdraaien", soort: "beweging", reden: "Als er iets scheef zit: kijk of je aanname klopt." },
  ],
  geloof: [
    { id: "subhan-allahi-wa-bihamdihi", soort: "dhikr", reden: "Kort genoeg om te doen terwijl je iets anders opstart." },
    { id: "shukr-drie-dingen", soort: "beweging", reden: "Drie dingen waar je dankbaar voor bent." },
    { id: "omhoogkijken", soort: "beweging", reden: "Even omhoog kijken, en weer verder." },
    { id: "muhasabah-twee-vragen", soort: "beweging", reden: "Twee vragen om de dag terug te kijken." },
  ],
};

/** De eerste stap van deze kamer voor vandaag, met de reden erbij. */
export function eersteStapVoorKamer(
  kamerId: string,
  data: LifeMaxingData,
  isGedaan: (sleutel: string) => boolean,
  dagIndex: number
): Suggestie | null {
  const lijst = (KAMER_STAPPEN[kamerId] ?? []).filter((s) => kamerId !== "geloof" || data.instellingen.islamitischeLaag);
  const kandidaten = lijst.filter((s) => !isGedaan(`${s.soort}:${s.id}`));
  const bron = kandidaten.length ? kandidaten : lijst;
  if (bron.length === 0) return null;
  const stap = bron[dagIndex % bron.length];
  if (stap.soort === "dhikr") {
    return { soort: "dhikr", id: stap.id, titel: adhkar.find((a) => a.id === stap.id)?.titel ?? stap.id, duur: "1–2 min", waaromNu: stap.reden };
  }
  return bewegingVoorstel(stap.id, stap.reden);
}
