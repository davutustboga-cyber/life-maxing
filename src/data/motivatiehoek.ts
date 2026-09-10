export type RealityCheckInteractie =
  | { soort: "keuze"; vraag: string; opties: string[] }
  | { soort: "open"; vraag: string; placeholder: string }
  | { soort: "enkel"; vraag: string; opties: string[] };

export interface MotivatiehoekDag {
  dag: number;
  quote: {
    tekst: string;
    auteur: string;
    bron?: string;
  };
  verhaal: {
    profeet: string;
    titel: string;
    tekst: string;
    bronnen: string[];
    thema: string;
  };
  realityCheck: {
    tekst: string;
    interactie: RealityCheckInteractie;
  };
}

export const motivatiehoekDagen: MotivatiehoekDag[] = [
  {
    dag: 1,
    quote: {
      tekst: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.",
      auteur: "Bruce Lee",
      bron: "Veelvuldig geciteerd, gekoppeld aan zijn trainingsfilosofie",
    },
    verhaal: {
      profeet: "Nuh عليه السلام",
      titel: "Negenhonderdvijftig jaar",
      tekst: "Stel je voor dat je negenhonderdvijftig jaar lang elke dag opstaat om dezelfde boodschap te verkondigen. Elke dag word je uitgelachen, genegeerd en vernederd door de mensen om je heen.\n\nNuh عليه السلام deed dit niet voor één decennium, niet voor een eeuw, maar voor 950 jaar. Zijn geduld was niet afhankelijk van snelle resultaten of onmiddellijk succes. Zijn geduld was geworteld in pure gehoorzaamheid. Hij deed zijn werk, dag in dag uit, ongeacht de uitkomst, totdat Allah het bevel gaf om de ark te bouwen.",
      bronnen: ["Qur'an 29:14"],
      thema: "Volharding zonder direct resultaat",
    },
    realityCheck: {
      tekst: "We raken vaak gefrustreerd als we na een week of een maand nog geen resultaat zien van onze inspanningen. Maar heb je de basis eigenlijk wel op orde?",
      interactie: {
        soort: "keuze",
        vraag: "Wat heb je vandaag zonder na te denken gekregen?",
        opties: [
          "Gezondheid om überhaupt te kunnen werken",
          "Een veilige plek om te falen",
          "Tijd die ik vandaag nog kan gebruiken",
          "Zicht en gehoor",
        ],
      },
    },
  },
  {
    dag: 2,
    quote: {
      tekst: "I don't stop when I'm tired. I stop when I'm done.",
      auteur: "David Goggins",
      bron: "Can't Hurt Me",
    },
    verhaal: {
      profeet: "Muhammad ﷺ",
      titel: "De dag in Ta'if",
      tekst: "Na het verlies van zijn geliefde vrouw Khadija en zijn oom Abu Talib, reisde de Profeet ﷺ te voet naar Ta'if om steun te zoeken. In plaats van hulp kreeg hij stenen. Hij werd de stad uitgedreven, bloedend tot in zijn sandalen.\n\nFysiek uitgeput en emotioneel gebroken zocht hij beschutting in een boomgaard. Hij gaf niet op. Hij klaagde niet over de mensen. Hij hief zijn handen en beklaagde zich alleen over zijn eigen zwakte bij Allah. Zelfs toen de Engel van de Bergen hem de optie gaf om de stad te verwoesten, koos hij voor genade en hoopte hij op hun nageslacht.",
      bronnen: ["Sahih al-Bukhari 3231", "Seerah Ibn Hisham"],
      thema: "Pijn verdragen en focus behouden",
    },
    realityCheck: {
      tekst: "Je obstakels voelen nu waarschijnlijk onoverkomelijk. Dat mag. Pijn is echt. Maar we vergeten vaak hoe zacht onze realiteit in werkelijkheid is.",
      interactie: {
        soort: "open",
        vraag: "Noem één comfortabel ding in je leven dat je nu als vanzelfsprekend beschouwt, maar wat een absolute luxe is in de menselijke geschiedenis.",
        placeholder: "Bijv: Schoon stromend water, een warm bed...",
      },
    },
  },
  {
    dag: 3,
    quote: {
      tekst: "Discipline equals freedom.",
      auteur: "Jocko Willink",
      bron: "Extreme Ownership",
    },
    verhaal: {
      profeet: "Ibrahim عليه السلام",
      titel: "Het vuur van Namrud",
      tekst: "Ibrahim عليه السلام werd gekatapulteerd in een gigantisch vuur, simpelweg omdat hij de waarheid sprak tegen een tirannieke koning. Terwijl hij in de lucht vloog, richting zijn schijnbare einde, kwam de engel Jibril naar hem toe en vroeg of hij hulp nodig had.\n\nIbrahim's antwoord was ultieme discipline en vertrouwen: \"Van jou? Nee. Allah is mij voldoende, en Hij is de beste Beschermer.\" Het vuur werd koel en vreedzaam voor hem. Hij raakte niet in paniek; zijn hart was verankerd in tawakkul.",
      bronnen: ["Qur'an 21:68-69", "Tafsir Ibn Kathir"],
      thema: "Ultiem vertrouwen (Tawakkul)",
    },
    realityCheck: {
      tekst: "We klagen vaak over een gebrek aan vrijheid, terwijl we de discipline missen om onszelf te bevrijden van onze eigen slechte gewoontes.",
      interactie: {
        soort: "enkel",
        vraag: "Wat houdt je op dit moment het meest gevangen?",
        opties: [
          "Mijn uitstelgedrag",
          "Mijn schermtijd",
          "Angst voor de mening van anderen",
          "Gebrek aan een duidelijk plan",
        ],
      },
    },
  },
  {
    dag: 4,
    quote: {
      tekst: "I've failed over and over and over again in my life. And that is why I succeed.",
      auteur: "Michael Jordan",
      bron: "Nike 'Failure' Commercial (1997)",
    },
    verhaal: {
      profeet: "Yusuf عليه السلام",
      titel: "Van de put naar de gevangenis",
      tekst: "Verraden door zijn eigen broers, in een donkere put gegooid, verkocht als slaaf, en vervolgens onterecht in de gevangenis gegooid na valse beschuldigingen. Yusuf عليه السلام verloor jaren van zijn leven in duisternis.\n\nMaar in de gevangenis werd hij niet bitter. Hij bleef zijn karakter behouden, legde dromen uit, en hield vast aan zijn principes. Allah was hem aan het voorbereiden, niet aan het bestraffen. Uiteindelijk werd precies dat geduld in de gevangenis de sleutel tot zijn heerschappij over Egypte.",
      bronnen: ["Qur'an, Surah Yusuf (12)"],
      thema: "Falen en tegenslag als voorbereiding",
    },
    realityCheck: {
      tekst: "Duisternis voelt vaak als het einde, maar soms is het de incubatietijd die je nodig hebt om te rijpen. Je beproeving mag bestaan, maar kijk ook naar je bescherming.",
      interactie: {
        soort: "keuze",
        vraag: "Welke vormen van bescherming heb je vandaag om je heen?",
        opties: [
          "Een dak boven mijn hoofd",
          "Mensen die om mij geven, ook al zie ik ze even niet",
          "Toegang tot kennis en oplossingen",
          "De mogelijkheid om morgen opnieuw te proberen",
        ],
      },
    },
  },
  {
    dag: 5,
    quote: {
      tekst: "The impediment to action advances action. What stands in the way becomes the way.",
      auteur: "Marcus Aurelius",
      bron: "Meditations (Boek 5, 20)",
    },
    verhaal: {
      profeet: "Musa عليه السلام",
      titel: "De zee en het leger",
      tekst: "Musa عليه السلام stond met zijn volk vast voor de onmetelijke Rode Zee. Achter hen naderde de grootste militaire macht van die tijd: het leger van Fir'aun. Het volk raakte in paniek: \"Wij worden zeker ingehaald!\"\n\nMaar Musa's perspectief was onbreekbaar. Hij zei: \"Absoluut niet! Mijn Heer is met mij; Hij zal mij leiden.\" Pas nádat hij dit rotsvaste geloof uitsprak in een onmogelijke situatie, kreeg hij de opdracht om met zijn staf op het water te slaan. Het obstakel werd de uitweg.",
      bronnen: ["Qur'an 26:61-63"],
      thema: "Moed wanneer de uitkomst onzichtbaar is",
    },
    realityCheck: {
      tekst: "Je staart je nu misschien blind op een muur. Je ziet geen uitweg. Maar soms hoef je de uitweg niet te zien, alleen maar de volgende stap te zetten.",
      interactie: {
        soort: "open",
        vraag: "Wat is de absolute kleinste stap die je vandaag nog wél kunt zetten?",
        placeholder: "Ik ga nu...",
      },
    },
  },
  {
    dag: 6,
    quote: {
      tekst: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
      auteur: "Muhammad Ali",
      bron: "Interviews, vroege jaren '70",
    },
    verhaal: {
      profeet: "Ayyub عليه السلام",
      titel: "Het verlies van alles",
      tekst: "Ayyub عليه السلام was rijk, had een groot gezin en een perfecte gezondheid. Binnen korte tijd verloor hij zijn rijkdom, stierven zijn kinderen, en werd hij getroffen door een slopende ziekte waardoor zelfs zijn vrienden hem verlieten.\n\nHij leed in stilte voor jaren. Zelfs toen zijn vrouw hem vroeg om Allah om genezing te smeken, vond hij zichzelf te bescheiden om dat direct te doen, gezien de vele jaren van gezondheid die hij daarvoor had genoten. Pas toen de pijn ondragelijk werd, riep hij: \"Tegenspoed heeft mij getroffen, en U bent de Meest Barmhartige der barmhartigen.\"",
      bronnen: ["Qur'an 21:83-84", "Qur'an 38:41-44"],
      thema: "Sabr (geduld) in extreme fysieke/mentale pijn",
    },
    realityCheck: {
      tekst: "Pijn is vermoeiend en we willen er het liefst voor weglopen. Maar kijk naar het voertuig waarmee je deze pijn ervaart.",
      interactie: {
        soort: "keuze",
        vraag: "Wat functioneert er vandaag onmerkbaar perfect aan je lichaam?",
        opties: [
          "Mijn ademhaling gaat vanzelf",
          "Mijn hart pompt zonder dat ik het hoef te besturen",
          "Mijn ogen vertalen licht in dit beeld",
          "Mijn benen kunnen mijn gewicht dragen",
        ],
      },
    },
  },
  {
    dag: 7,
    quote: {
      tekst: "A champion is defined not by their wins but by how they can recover when they fall.",
      auteur: "Serena Williams",
      bron: "Interviews en publieke uitspraken",
    },
    verhaal: {
      profeet: "Yunus عليه السلام",
      titel: "Duisternis in duisternis",
      tekst: "Yunus عليه السلام verliet zijn volk in frustratie voordat Allah hem daar toestemming voor gaf. Hij belandde op een schip, werd overboord gegooid in een woeste zee, en opgeslokt door een walvis.\n\nHij bevond zich in drievoudige duisternis: de duisternis van de nacht, de duisternis van de oceaan, en de duisternis van de buik van de walvis. In plaats van de omstandigheden de schuld te geven, nam hij onmiddellijk volledige verantwoordelijkheid: \"Er is geen god dan U, Verheven bent U. Waarlijk, ik behoorde tot de onrechtplegers.\" Die erkenning brak zijn gevangenis open.",
      bronnen: ["Qur'an 21:87"],
      thema: "Extreme verantwoordelijkheid nemen",
    },
    realityCheck: {
      tekst: "We voelen ons vaak slachtoffer van onze omstandigheden. Maar we hebben nog steeds adem, en daarmee de kans om de koers te wijzigen.",
      interactie: {
        soort: "enkel",
        vraag: "Welke verantwoordelijkheid vermijd je op dit moment?",
        opties: [
          "Mijn eigen gezondheid/lichaam",
          "Mijn tijdbeheer",
          "De manier waarop ik met mijn emoties omga",
          "Het werk dat ik uitstel",
        ],
      },
    },
  }
];

export function dagVanHetJaar(datum: Date = new Date()): number {
  const start = Date.UTC(datum.getFullYear(), 0, 0);
  const huidig = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate());
  return Math.floor((huidig - start) / 86400000);
}

export function motivatiehoekVoorVandaag(datum: Date = new Date()): MotivatiehoekDag {
  const dagIndex = (dagVanHetJaar(datum) - 1) % motivatiehoekDagen.length;
  return motivatiehoekDagen[dagIndex];
}
