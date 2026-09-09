// nu.ts — "wat past er nu?" — de motor achter het startscherm (v21).
//
// Waarom dit bestaat: tot v20 opende de app op een lege schijf met de vraag
// "Waar ben je?" en moest je zélf weten wat je wilde doen en waar het stond.
// Alles zat achter één woordje "meer". Dat maakte een inhoudelijk rijke app
// onbruikbaar in het dagelijks leven. Vanaf v21 kiest de app zelf wat er op
// dít moment past, en zegt erbij waarom.
//
// Wat dit NIET doet, en bewust niet:
// - niets tellen, geen reeksen, geen "je hebt X dagen op rij..." (Wet 4);
// - nooit pushen: een suggestie is een aanbod, elk scherm eindigt buiten de
//   app (Wet 3), en "niets doen" blijft overal een geldig antwoord;
// - geen enkele suggestie op basis van gebedsregistratie — de app vraagt
//   nooit of je gebeden hebt (gebed-anker.md).

import type { LifeMaxingData } from "./types.js";
import { ochtendVandaagGedaan, avondVandaagGedaan } from "./ritme.js";
import { weekmomentBeschikbaar } from "./weekmoment.js";
import { ongelezenBrief } from "./maandbrief.js";
import { bewegingById } from "../data/bewegingen.js";
import { adhkar } from "../data/adhkar.js";

export type Dagdeel = "nacht" | "vroege_ochtend" | "ochtend" | "middag" | "avond" | "voor_slapen";

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

/** "woensdag 9 september · 21:14" — gewone oriëntatie, geen data-analyse. */
export function datumregel(nu: Date = new Date()): string {
  const dag = nu.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
  const tijd = nu.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
  return `${dag} · ${tijd}`;
}

function duurVan(bewegingId: string): string {
  const b = bewegingById(bewegingId);
  if (!b) return "";
  const [van, tot] = b.kosten.tijdMinuten;
  return van === tot ? `${van} min` : `${van}–${tot} min`;
}

function bewegingSuggestie(id: string, waaromNu: string): Suggestie | null {
  const b = bewegingById(id);
  if (!b) return null;
  return { soort: "beweging", id, titel: b.titel, duur: duurVan(id), waaromNu };
}

function dhikrSuggestie(id: string): Suggestie | null {
  const d = adhkar.find((a) => a.id === id);
  if (!d) return null;
  return { soort: "dhikr", id, titel: d.titel, duur: "1–2 min", waaromNu: d.waaromNu };
}

/**
 * De volledige lijst voor dit moment, belangrijkste eerst. Het startscherm
 * toont de eerste groot en de rest eronder als gewone regels.
 */
export function suggestiesVoorNu(data: LifeMaxingData, nu: Date = new Date()): Suggestie[] {
  const dagdeel = dagdeelVan(nu);
  const islam = data.instellingen.islamitischeLaag;
  const lijst: (Suggestie | null)[] = [];

  switch (dagdeel) {
    case "vroege_ochtend":
    case "ochtend":
      if (!ochtendVandaagGedaan(data)) {
        lijst.push({
          soort: "ochtend",
          titel: "Richting voor vandaag",
          duur: "1 min",
          waaromNu: "Eén zin en één kerntaak, voor de dag je meesleept.",
        });
      }
      lijst.push(bewegingSuggestie("ochtendlicht-zien", "Licht in het eerste uur zet je dag- en slaapritme."));
      if (islam) lijst.push(dhikrSuggestie("subhan-allahi-wa-bihamdihi"));
      lijst.push(bewegingSuggestie("vijf-minuten-naar-buiten", "Kort naar buiten werkt het beste vroeg op de dag."));
      break;

    case "middag":
      lijst.push({
        soort: "kompas",
        titel: "Hoe voel je je?",
        duur: "2 min",
        waaromNu: "Midden op de dag is dit meestal waar je iets aan hebt.",
      });
      lijst.push(bewegingSuggestie("tien-minuten-wandelen-groen", "Even weg van het scherm, halverwege de dag."));
      lijst.push(
        bewegingSuggestie("vijftien-minuten-moeilijke-ding", "Als er iets blijft liggen: nu is er nog dag over.")
      );
      break;

    case "avond":
      if (!avondVandaagGedaan(data)) {
        lijst.push({
          soort: "avond",
          titel: "Dag sluiten",
          duur: "3 min",
          waaromNu: "Terwijl de dag nog vers is, maar af.",
        });
      }
      if (islam) lijst.push(bewegingSuggestie("muhasabah-twee-vragen", "Twee vragen terugkijken hoort bij dit uur."));
      lijst.push(bewegingSuggestie("dankbaarheid-naar-persoon", "Avond is het makkelijkste moment om iemand te bereiken."));
      if (weekmomentBeschikbaar(data)) {
        lijst.push({
          soort: "week",
          titel: "De spiegel van de week",
          duur: "10 min",
          waaromNu: "Deze week nog niet gedaan.",
        });
      }
      break;

    case "voor_slapen":
      if (islam) lijst.push(dhikrSuggestie("ayat-al-kursi"));
      if (!avondVandaagGedaan(data)) {
        lijst.push({
          soort: "avond",
          titel: "Dag sluiten",
          duur: "3 min",
          waaromNu: "Nog niet gedaan vandaag — kan ook kort.",
        });
      }
      lijst.push(bewegingSuggestie("adem-lange-uitademing", "Rustiger ademen vlak voor het slapen scheelt."));
      break;

    case "nacht":
      lijst.push({
        soort: "rust",
        titel: "Het is laat",
        duur: "",
        waaromNu: "Slapen is nu waarschijnlijk het beste wat er is. De app loopt niet weg.",
      });
      lijst.push(bewegingSuggestie("adem-lange-uitademing", "Als je wakker ligt: langer uitademen, niets forceren."));
      if (islam) lijst.push(dhikrSuggestie("ayat-al-kursi"));
      break;
  }

  // Een ongelezen brief gaat altijd mee, ongeacht het uur — hij komt maar
  // één keer per maand en verdwijnt niet vanzelf.
  if (ongelezenBrief(data)) {
    lijst.push({
      soort: "brief",
      titel: "Er ligt een brief",
      duur: "3 min",
      waaromNu: "Je eigen zinnen van vorige maand, teruggelezen.",
    });
  }

  return lijst.filter((s): s is Suggestie => s !== null);
}
