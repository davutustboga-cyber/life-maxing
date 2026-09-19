// nu.ts — "wat past er nu?" — de motor achter het startscherm (v21, v27).
//
// Waarom dit bestaat: tot v20 opende de app op een lege schijf met de vraag
// "Waar ben je?" en moest je zélf weten wat je wilde doen en waar het stond.
// Alles zat achter één woordje "meer". Dat maakte een inhoudelijk rijke app
// onbruikbaar in het dagelijks leven. Vanaf v21 kiest de app zelf wat er op
// dít moment past, en zegt erbij waarom.
//
// v27 — "de voorraad groeit, het aanbod krimpt" (bouwplan v27, §3.3). Achter
// de schermen kent deze motor per dagdeel een hele voorraad kandidaten (de
// bewegingen die eerder nergens voorkwamen zitten er nu in), maar het
// startscherm toont er precies één. Welke, wordt deterministisch bepaald op
// de dag van het jaar: hij wisselt per dag, staat de hele dag stil en telt
// niets — hetzelfde principe als `visieFragment()` en
// `motivatiehoekVoorVandaag()`.
//
// Wat dit NIET doet, en bewust niet:
// - niets tellen, geen reeksen, geen "je hebt X dagen op rij..." (Wet 4);
// - nooit pushen: een suggestie is een aanbod, elk scherm eindigt buiten de
//   app (Wet 3), en "niets doen" blijft overal een geldig antwoord;
// - geen enkele suggestie op basis van gebedsregistratie — de app vraagt
//   nooit of je gebeden hebt (gebed-anker.md).

import type { LifeMaxingData } from "./types.js";
import { ochtendVandaagGedaan, avondVandaagGedaan, laatsteDagsluiting, dagVanJaar } from "./ritme.js";
import { weekmomentBeschikbaar } from "./weekmoment.js";
import { ongelezenBrief } from "./maandbrief.js";
import { bewegingById } from "../data/bewegingen.js";
import { adhkar } from "../data/adhkar.js";

export type Dagdeel = "nacht" | "vroege_ochtend" | "ochtend" | "middag" | "avond" | "voor_slapen";

/** De vijf momenten uit het dagritme (bouwplan v27, hoofdstuk 4). */
export type DagdeelGroep = "nacht" | "ochtend" | "middag" | "avond" | "slapen";

export type SuggestieSoort = "ochtend" | "avond" | "beweging" | "dhikr" | "kompas" | "week" | "brief" | "rust";

export interface Suggestie {
  soort: SuggestieSoort;
  /** beweging-id of dhikr-id; leeg bij rituelen en de kompaslus. */
  id?: string;
  titel: string;
  /** "2–5 min", of leeg als tijd niet zinnig is. */
  duur: string;
  /** Eén regel: waarom juist nu. Dit is wat het startscherm bruikbaar maakt. */
  waaromNu: string;
  /**
   * v27 — een beweging die nog nergens in je sterren of momenten voorkomt.
   * Het startscherm zegt dat in één regel; nooit als getal of als lijst. Pas
   * zodra je überhaupt al iets deed: bij een verse app is alles nieuw, en
   * dan is de regel ruis.
   */
  nieuw?: boolean;
}

export function dagdeelVan(nu: Date = new Date()): Dagdeel {
  const u = nu.getHours();
  if (u < 5) return "nacht";
  if (u < 8) return "vroege_ochtend";
  if (u < 12) return "ochtend";
  if (u < 17) return "middag";
  if (u < 21) return "avond";
  return "voor_slapen";
}

export function dagdeelGroep(dagdeel: Dagdeel): DagdeelGroep {
  switch (dagdeel) {
    case "vroege_ochtend":
    case "ochtend":
      return "ochtend";
    case "voor_slapen":
      return "slapen";
    default:
      return dagdeel;
  }
}

export function begroeting(dagdeel: Dagdeel): string {
  switch (dagdeel) {
    case "nacht":
      return "Nog wakker";
    case "vroege_ochtend":
    case "ochtend":
      return "Goedemorgen";
    case "middag":
      return "Goedemiddag";
    case "avond":
      return "Goedenavond";
    case "voor_slapen":
      return "Bijna slapen";
  }
}

/** "woensdag 9 september" — gewone oriëntatie, geen data-analyse. */
export function datumregel(nu: Date = new Date()): string {
  return nu.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
}

/** De slotstaat na een afgeronde handeling: wat er staat is klaar, en wanneer
 * de app weer iets te bieden heeft. Geen vraag, geen volgende kaart. */
export function slotRegels(groep: DagdeelGroep): { dit: string; straks: string | null } {
  switch (groep) {
    case "ochtend":
      return { dit: "Dat was het voor vanmorgen.", straks: "Tot vanmiddag." };
    case "middag":
      return { dit: "Dat was het voor vanmiddag.", straks: "Tot vanavond." };
    case "avond":
      return { dit: "Dat was het voor vanavond.", straks: null };
    case "slapen":
      return { dit: "Dat was het voor vandaag.", straks: "Slaap goed." };
    case "nacht":
      return { dit: "Het is laat.", straks: null };
  }
}

/** De sleutel waarmee `gedaanVandaag` een suggestie herkent. */
export function suggestieSleutel(s: Pick<Suggestie, "soort" | "id">): string {
  return `${s.soort}:${s.id ?? ""}`;
}

function duurVan(bewegingId: string): string {
  const b = bewegingById(bewegingId);
  if (!b) return "";
  const [van, tot] = b.kosten.tijdMinuten;
  return van === tot ? `${van} min` : `${van}–${tot} min`;
}

/**
 * Alle bewegingen die je ooit deed: die uit de kompaslus (`gekozenDeur`) en
 * die uit de hoofdweg (`ster.bewegingId`). Alleen om één regel te kunnen
 * tonen onder een kaart — het bestand telt hier niets op.
 */
function eerderGedaan(data: LifeMaxingData): Set<string> {
  const ids = new Set<string>();
  for (const m of data.momenten ?? []) if (m.gekozenDeur && m.gekozenDeur !== "niets-doen") ids.add(m.gekozenDeur);
  for (const s of data.sterren ?? []) if (s.bewegingId) ids.add(s.bewegingId);
  return ids;
}

function bewegingSuggestie(id: string, waaromNu: string, gedaan: Set<string>): Suggestie | null {
  const b = bewegingById(id);
  if (!b) return null;
  return { soort: "beweging", id, titel: b.titel, duur: duurVan(id), waaromNu, nieuw: gedaan.size > 0 && !gedaan.has(id) };
}

function dhikrSuggestie(id: string): Suggestie | null {
  const d = adhkar.find((a) => a.id === id);
  if (!d) return null;
  return { soort: "dhikr", id, titel: d.titel, duur: "1–2 min", waaromNu: d.waaromNu };
}

/**
 * Een voorraad kandidaten, deterministisch gedraaid op de dag van het jaar:
 * vandaag staat er één vooraan, morgen een andere. De rest volgt in vaste
 * volgorde — die dient alleen voor "toch nog iets doen".
 */
function draaiOpDag(pool: (Suggestie | null)[], nu: Date): Suggestie[] {
  const lijst = pool.filter((s): s is Suggestie => s !== null);
  if (lijst.length === 0) return lijst;
  const start = dagVanJaar(nu) % lijst.length;
  return [...lijst.slice(start), ...lijst.slice(0, start)];
}

/**
 * De volledige lijst voor dit moment, belangrijkste eerst. Het startscherm
 * toont alleen de eerste die je vandaag nog niet deed; de rest dient als
 * "toch nog iets doen".
 *
 * Volgorde (bouwplan v27, §4): iets wekelijks of maandelijks vervangt het
 * dagelijkse aanbod — dus de spiegel van de week (zondagavond) gaat vóór Dag
 * sluiten, en een ongelezen brief gaat vóór de bewegingen van de dag. Een
 * vast ritueel (Richting, Dag sluiten) blijft vóór de brief staan, zodat een
 * ongelezen brief die dagelijkse rituelen niet wekenlang kan wegdrukken.
 */
export function suggestiesVoorNu(data: LifeMaxingData, nu: Date = new Date()): Suggestie[] {
  const dagdeel = dagdeelVan(nu);
  const islam = data.instellingen.islamitischeLaag;
  const gedaan = eerderGedaan(data);
  const beweging = (id: string, waarom: string) => bewegingSuggestie(id, waarom, gedaan);

  const vast: Suggestie[] = []; // wekelijks en vaste rituelen
  let pool: (Suggestie | null)[] = [];

  switch (dagdeel) {
    case "vroege_ochtend":
    case "ochtend": {
      if (!ochtendVandaagGedaan(data)) {
        vast.push({
          soort: "ochtend",
          titel: "Richting voor vandaag",
          duur: "1 min",
          waaromNu: "Eén zin en één kerntaak, voor de dag je meesleept.",
        });
      }
      // v25 — je hebt gisteravond zelf aangevinkt wat er meespeelde. Dat
      // maakt het verschil tussen een generieke suggestie en een die ergens
      // over gaat. Bewust één dag terug, en alleen in de reden-regel: geen
      // trend, geen score, geen "drie dagen op rij" (Wet 4).
      const chips = new Set(laatsteDagsluiting(data, nu)?.chips ?? []);
      pool = [
        beweging(
          "ochtendlicht-zien",
          chips.has("slecht_geslapen")
            ? "Je sloot gisteren af met slecht geslapen — licht in het eerste uur zet je ritme weer op zijn plek."
            : "Licht in het eerste uur zet je dag- en slaapritme."
        ),
        beweging(
          "vijf-minuten-naar-buiten",
          chips.has("niet_buiten_geweest") || chips.has("niet_bewogen")
            ? "Gisteren kwam je er niet aan toe — vroeg op de dag is dit het makkelijkst."
            : "Kort naar buiten werkt het beste vroeg op de dag."
        ),
        islam ? dhikrSuggestie("subhan-allahi-wa-bihamdihi") : null,
        beweging("voeten-op-de-grond", "Even voelen dat je er staat, voor de dag begint."),
        beweging("savoring-zestig-seconden", "Eén ding echt opmerken voor het drukker wordt."),
      ];
      break;
    }

    case "middag":
      pool = [
        {
          soort: "kompas",
          titel: "Hoe voel je je?",
          duur: "2 min",
          waaromNu: "Midden op de dag is dit meestal waar je iets aan hebt.",
        },
        beweging("tien-minuten-wandelen-groen", "Even weg van het scherm, halverwege de dag."),
        beweging("vijftien-minuten-moeilijke-ding", "Als er iets blijft liggen: nu is er nog dag over."),
        beweging("vijf-zintuigen-grounding", "Even uit je hoofd en terug in wat er nu is."),
        beweging("box-ademhaling", "Halverwege de dag: een paar rondes op een vaste tel."),
        beweging("prikkels-loslaten", "Een paar minuten zonder scherm, nu de dag op gang is."),
      ];
      break;

    case "avond": {
      // De spiegel van de week is wekelijks en vervangt Dag sluiten op één
      // avond — niet ernaast. Zondagavond; wie hem dan mist, vindt hem onder
      // Terugkijken zolang de week nog loopt.
      if (nu.getDay() === 0 && weekmomentBeschikbaar(data, nu)) {
        vast.push({
          soort: "week",
          titel: "De spiegel van de week",
          duur: "10 min",
          waaromNu: "Deze week nog niet gedaan.",
        });
      }
      if (!avondVandaagGedaan(data)) {
        vast.push({
          soort: "avond",
          titel: "Dag sluiten",
          duur: "3 min",
          waaromNu: "Terwijl de dag nog vers is, maar af.",
        });
      }
      pool = [
        islam ? beweging("muhasabah-twee-vragen", "Twee vragen terugkijken hoort bij dit uur.") : null,
        beweging("dankbaarheid-naar-persoon", "Avond is het makkelijkste moment om iemand te bereiken."),
        beweging("gedachte-in-woorden", "Blijft er iets malen? Zeg het eens anders."),
        beweging("gedachte-een-vorm-geven", "Een gedachte die blijft hangen, laat je even voorbijdrijven."),
        beweging("savoring-zestig-seconden", "Eén ding van vandaag nog een keer echt proeven."),
      ];
      break;
    }

    case "voor_slapen": {
      // Ayat al-Kursi hoort als allerlaatste vóór het slapen (adhkar.ts,
      // "wanneer": "voor het slapen"). Is de dag al gesloten, dan staat de
      // dhikr vooraan; anders komt Dag sluiten eerst en volgt de dhikr
      // vanzelf (zie toonS23Stap5VoorMorgen).
      const avondAlGedaan = avondVandaagGedaan(data);
      if (islam && avondAlGedaan) {
        const d = dhikrSuggestie("ayat-al-kursi");
        if (d) vast.push(d);
      }
      if (!avondAlGedaan) {
        vast.push({
          soort: "avond",
          titel: "Dag sluiten",
          duur: "3 min",
          waaromNu: "Nog niet gedaan vandaag — kan ook kort.",
        });
      }
      pool = [
        beweging("adem-lange-uitademing", "Rustiger ademen vlak voor het slapen scheelt."),
        beweging("2-3-4-5-ademhaling", "Een langzame tel die je hoofd iets te doen geeft, vlak voor het slapen."),
        beweging("fysiologische-zucht", "Eén of twee zuchten, en dan slapen."),
        islam && !avondAlGedaan ? dhikrSuggestie("ayat-al-kursi") : null,
      ];
      break;
    }

    case "nacht":
      // Bouwplan v27, §4: "Nacht — de app biedt niets aan." Alleen de
      // opmerking; de bewegingen blijven onder Doen bereikbaar.
      return [
        {
          soort: "rust",
          titel: "Het is laat",
          duur: "",
          waaromNu: "Slapen is nu waarschijnlijk het beste wat er is. De app loopt niet weg.",
        },
      ];
  }

  const dagelijks = draaiOpDag(pool, nu);
  const lijst: Suggestie[] = [...vast];
  // Een ongelezen brief komt maar één keer per maand en verdwijnt niet
  // vanzelf; hij vervangt de aanrader van de dag (maar niet het vaste ritueel).
  if (ongelezenBrief(data)) {
    lijst.push({
      soort: "brief",
      titel: "Er ligt een brief",
      duur: "3 min",
      waaromNu: "Je eigen zinnen van vorige maand, teruggelezen.",
    });
  }
  lijst.push(...dagelijks);
  return lijst;
}

/**
 * v27 (bouwplan §6.3) — één van je eigen eerdere zinnen, teruggegeven op een
 * gewone dag: "4 september — je schreef: …". Deterministisch per dag gekozen
 * (dus geen geknipper), uit de zinnen die je zelf schreef bij het verankeren,
 * de vrije afronding en Dag sluiten. Niets wordt verzonnen of bewerkt; het is
 * jouw eigen materiaal, en het groeit vanzelf mee.
 */
export function eigenZinVanEerder(data: LifeMaxingData, nu: Date = new Date()): string | null {
  const vandaag = new Date(nu.getTime() - nu.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const bronnen: { datum: string; zin: string }[] = [];
  for (const s of data.sterren ?? []) if (s.zin?.trim()) bronnen.push({ datum: s.datum, zin: s.zin.trim() });
  for (const d of data.dagsluitingen ?? []) if (d.zin?.trim()) bronnen.push({ datum: d.datum, zin: d.zin.trim() });
  const eerder = bronnen
    .filter((b) => b.datum < vandaag && /^\d{4}-\d{2}-\d{2}$/.test(b.datum))
    .sort((a, b) => a.datum.localeCompare(b.datum) || a.zin.localeCompare(b.zin));
  if (eerder.length === 0) return null;
  const gekozen = eerder[dagVanJaar(nu) % eerder.length];
  const [j, m, d] = gekozen.datum.split("-").map(Number);
  const datumTekst = new Date(j, m - 1, d).toLocaleDateString("nl-BE", { day: "numeric", month: "long" });
  return `${datumTekst} — je schreef: "${gekozen.zin}"`;
}

/**
 * v27 (bouwplan §6.5) — "Verras me": voor wie er nooit aan denkt om zelf iets
 * te kiezen. De app kiest, met één regel waarom. Willekeurig per aanroep en
 * zonder geheugen (geen teller, geen "je zag deze al"), behalve dat een
 * beweging die je nog nooit deed daar de voorkeur krijgt. `uitsluiten` zijn de
 * ids die de vorige keer al kwamen, zodat "nog één" niet dezelfde geeft.
 */
export function verrasMe(
  data: LifeMaxingData,
  zichtbaar: { id: string }[],
  uitsluiten: string[] = [],
  nu: Date = new Date()
): Suggestie | null {
  const gedaan = eerderGedaan(data);
  const laat = ["nacht", "voor_slapen"].includes(dagdeelVan(nu));
  let kandidaten = zichtbaar
    .map((b) => bewegingById(b.id))
    .filter((b): b is NonNullable<ReturnType<typeof bewegingById>> => Boolean(b))
    // Een koude douche is geen suggestie voor 's avonds laat.
    .filter((b) => !(laat && b.id === "korte-koude-douche"))
    // Licht in het eerste uur heeft alleen 's ochtends zin.
    .filter((b) => !(nu.getHours() >= 12 && b.id === "ochtendlicht-zien"))
    .filter((b) => !uitsluiten.includes(b.id));
  if (kandidaten.length === 0) kandidaten = zichtbaar.map((b) => bewegingById(b.id)).filter((b): b is NonNullable<ReturnType<typeof bewegingById>> => Boolean(b));
  if (kandidaten.length === 0) return null;

  const nieuwe = gedaan.size > 0 ? kandidaten.filter((b) => !gedaan.has(b.id)) : [];
  const bron = nieuwe.length > 0 ? nieuwe : kandidaten;
  const b = bron[Math.floor(Math.random() * bron.length)];

  const woorden = b.pastBij.slice(0, 2);
  const waarom = nieuwe.includes(b)
    ? "Deze heb je nog niet eerder geprobeerd."
    : woorden.length === 2
      ? `Past als je je ${woorden[0]} of ${woorden[1]} voelt.`
      : woorden.length === 1
        ? `Past als je je ${woorden[0]} voelt.`
        : `Kort kan ook: ${b.minimumversie}`;
  return { soort: "beweging", id: b.id, titel: b.titel, duur: duurVan(b.id), waaromNu: waarom };
}
