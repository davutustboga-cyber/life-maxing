// adhkar.ts — de geverifieerde adhkar uit content/adhkar.md, nu mét
// tijdvenster. Dat tijdvenster is precies het gat dat adhkar.md zelf
// benoemde: "Tijdstip-afhankelijk — het model heeft nog geen tijdstip-veld
// ... Deze tekst staat hier geverifieerd klaar, nog niet als beweging
// gebouwd." Sinds v21 bestaat dat veld wel (lib/nu.ts).
//
// Ontwerpregel uit adhkar.md, onverkort overgenomen: **geen enkel aantal uit
// de bron wordt getoond**, ook niet als het letterlijk in de hadith staat
// (Wet 4, en Onderzoek-I2: een zichtbaar aantal lokt waswas uit). De app
// toont de tekst en de betekenis, nooit een teller.
//
// Bronregel: geen tekst zonder controleerbare vindplaats.

import type { Dagdeel } from "../lib/nu.js";

export interface Dhikr {
  id: string;
  titel: string;
  /** Wanneer dit past, in gewone taal — verschijnt op het startscherm. */
  wanneer: string;
  /** De dagdelen waarin de app dit uit zichzelf aanbiedt. */
  dagdelen: Dagdeel[];
  arabisch: string;
  transliteratie: string;
  vertaling: string;
  bron: string;
  /** Eén regel: waarom juist nu. Nooit een belofte, nooit een aansporing. */
  waaromNu: string;
}

export const adhkar: Dhikr[] = [
  {
    id: "ayat-al-kursi",
    titel: "Ayat al-Kursi",
    wanneer: "voor het slapen",
    dagdelen: ["voor_slapen", "nacht"],
    arabisch:
      "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    transliteratie:
      "Allahu la ilaha illa huwa, al-hayyu-l-qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard, man dhal-ladhi yashfa'u 'indahu illa bi-idhnih, ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bishay'im-min 'ilmihi illa bima sha'a, wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifdhuhuma, wa huwal-'aliyyul-'adhim.",
    vertaling:
      "Allah — er is geen god dan Hij, de Levende, de Onderhouder van alles. Sluimer noch slaap overmant Hem. Van Hem is wat in de hemelen en wat op de aarde is. Wie kan bij Hem bemiddelen zonder Zijn toestemming? Hij weet wat vóór hen is en wat na hen komt, en zij omvatten niets van Zijn kennis dan wat Hij wil. Zijn troon strekt zich uit over de hemelen en de aarde, en het behoeden ervan vermoeit Hem niet. En Hij is de Verhevene, de Geweldige.",
    bron: "Koran 2:255. De praktijk voor het slapengaan: Sahih al-Bukhari 5010. Nederlandse werkvertaling, geen erkende Koranvertaling geraadpleegd.",
    waaromNu: "De overlevering koppelt dit aan het moment vlak voor je gaat slapen.",
  },
  {
    id: "sayyid-al-istighfar-tekst",
    titel: "Sayyid al-Istighfar",
    wanneer: "dag en nacht",
    dagdelen: ["ochtend", "avond", "voor_slapen"],
    arabisch:
      "اللَّهُمَّ أَنْتَ رَبِّي، لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَىَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
    transliteratie:
      "Allahumma anta rabbi, la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi, faghfir li, fa innahu la yaghfiru adh-dhunuba illa anta.",
    vertaling:
      "O Allah, U bent mijn Heer, er is geen god dan U. U heeft mij geschapen en ik ben Uw dienaar, en ik houd mij aan Uw verbond en belofte zo goed ik kan. Ik zoek bescherming bij U tegen het kwaad dat ik heb gedaan. Ik erken Uw gunsten aan mij, en ik erken mijn zonde. Vergeef mij dan, want niemand vergeeft zonden behalve U.",
    bron: "Sahih al-Bukhari 6306, overgeleverd door Shaddad ibn Aws. Gradering: sahih.",
    waaromNu: "De overlevering noemt hier geen vast uur — dag zowel als nacht.",
  },
  {
    id: "subhan-allahi-wa-bihamdihi",
    titel: "Subhan Allahi wa bihamdihi",
    wanneer: "ochtend of avond",
    dagdelen: ["vroege_ochtend", "ochtend", "avond"],
    arabisch: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteratie: "Subhana-llahi wa bihamdihi",
    vertaling: "Verheven is Allah, en Hem komt alle lof toe.",
    bron: "Sahih al-Bukhari 6405. Gradering: sahih. (Het aantal uit de bron wordt hier bewust niet getoond.)",
    waaromNu: "Kort genoeg om te doen terwijl je iets anders aan het opstarten bent.",
  },
];

export function dhikrById(id: string): Dhikr | undefined {
  return adhkar.find((d) => d.id === id);
}
