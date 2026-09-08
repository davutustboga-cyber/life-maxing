// teksten.ts — vertaling van teksten.yaml. Elke zin die de app zegt.
// Waar teksten.yaml `null` zegt, staat hier expliciet `null` — dat is
// een ontwerpbeslissing (geen tekst), geen ontbrekend veld.
export const teksten = {
    eerstOpening: {
        regels: [
            "Dit is geen therapeut, geen arts en geen geleerde.",
            "Wat hier staat is soms wetenschap, soms geloof, soms een eigen idee — en dat wordt altijd apart gezegd.",
            "Bij iets ernstigs is dit niet waar je moet zijn. Verderop staat waar wel.",
            "Deze app hoopt dat je hem op een dag minder nodig hebt.",
        ],
        knop: "Beginnen",
        vraag: "Waar ben je?",
    },
    kompas: {
        openingsvraag: "Waar ben je?",
        zoekveldPlaceholder: "of typ je eigen woord",
        eigenWoordBevestiging: "Onthouden. Dit woord staat er de volgende keer ook bij.",
        tijdvraag: "Hoeveel tijd heb je nu?",
        tijdOpties: [
            { label: "twee minuten", waarde: "2min" },
            { label: "tien minuten", waarde: "10min_of_meer" },
            { label: "meer dan dat", waarde: "10min_of_meer" },
            { label: "geen idee", waarde: "10min_of_meer" },
        ],
    },
    deuren: {
        nietsDoen: { titel: "Niets doen", onderschrift: "Dat is ook een antwoord.", bijKiezen: "Goed. Tot een volgende keer." },
        ditKloptNiet: { knoptekst: "dit klopt niet", appAntwoord: "Goed. Waar zit je dan wel?" },
        afsluitvraag: "Waar ben je nu?",
    },
    hetVerschil: {
        // v2.3 §2.2, letterlijk. De enige zin die bij Het Verschil hoort — en
        // alleen als er nauwelijks iets verschoof. Bij een grote verschuiving
        // zegt de app niets, want dan zou het een compliment worden.
        nauwelijks: "Nauwelijks verschoven. Dat is normaal.",
    },
    afsluiten: {
        laatsteRegel: null,
    },
    deHemel: {
        toegangKnoptekst: "laat me zien wat ik al gedaan heb",
        legeHemel: "Hier komt te staan wat je doet. Nu is het nog stil, en dat is precies wat een begin is.",
        sterrenbeeldAanbod: {
            tekst: "Hier zit inmiddels een vorm in. Wil je er lijnen tussen trekken en er een naam aan geven?",
            bijJa: "Ja",
            bijNeeKnop: "Nu niet",
            bijNee: "Kan altijd nog.",
        },
        tekenmodus: {
            uitleg: "Tik de sterren aan die bij elkaar horen.",
            ongedaan: "laatste lijn weg",
            klaar: "Klaar",
            naamvraag: "Hoe heet dit?",
            naamPlaceholder: "een naam, of laat leeg",
            bewaren: "Bewaren",
            stoppen: "Toch niet",
        },
    },
    herkomst: {
        // S0 belooft: "soms wetenschap, soms geloof, soms een eigen idee — en dat
        // wordt altijd apart gezegd." Dit is die aparte zegging. Eén regel per
        // label, nooit samengevoegd: een beweging die W én I draagt krijgt twee
        // regels onder elkaar, want vermengen is precies wat niet mag.
        W: "Hier is onderzoek naar gedaan.",
        I: "Dit komt uit de islamitische traditie, niet uit onderzoek.",
        P: "Dit is een eigen idee, geen onderzoek.",
    },
    weekmoment: {
        // v2.0 §9.1 punt 8 (het weekmoment), Pijler 5 (de beeldoefening) en §5.4
        // ("de kop die jij herkent"). Nooit los van werkelijkheid en plan.
        toegangKnoptekst: "de spiegel van de week",
        intro: {
            kop: "Je frequentie verhogen",
            uitleg: "Waar je aandacht naartoe gaat en in welke innerlijke staat je verkeert, verandert wat je opmerkt, hoe je dingen uitlegt, wat je kiest en hoe je reageert — en dat verandert over tijd je leven. Wat wij hier níét beweren: dat gedachten rechtstreeks de fysieke wereld sturen.",
            begin: "Beginnen",
            nuNiet: "Nu niet",
        },
        herkomst: {
            W: "Je toekomstbeeld levendig voor je zien is krachtig — en het werkt aantoonbaar beter wanneer je er meteen bij benoemt wat er nu in de weg staat en wat je dan precies doet. Alleen dromen kost eerder energie dan dat het geeft.",
            P: "\"Je frequentie verhogen\" is jouw eigen taal voor dit alles. Wij gebruiken hem, en vertalen hem hieronder naar wat we kunnen onderbouwen.",
        },
        beeld: {
            vraag: "Over een jaar, op een gewone dag. Je voelt je zoals je wil. Waar ben je? Wat doe je? Hoe praat je tegen jezelf?",
            placeholder: "neem er even de tijd voor",
        },
        werkelijkheid: {
            vraag: "En nu eerlijk: wat staat er in jou tussen vandaag en dat beeld? Eén ding.",
            placeholder: "wat er echt in de weg staat",
        },
        plan: {
            vraag: "Als dat gebeurt, wat doe je dan?",
            placeholder: "als [dat], dan [dit]",
        },
        actie: {
            vraag: "Kies iets uit je bibliotheek dat dit deze week waarmaakt — in het echte leven, niet in de app.",
        },
        // v2.0 §5.5, "de schuldval, expliciet afgesloten" — "de belangrijkste zin
        // in het hele hoofdstuk. Zonder haar wordt een manifestatie-app op een
        // slechte dag een aanklacht." Met de islamitische laag staat hij in haar
        // eigen kader (tawakkul), want daar is hij het sterkst; met de laag uit
        // blijft de kern overeind, zonder het woord dat er niet bij hoort.
        schuldval: "Je doet de oorzaken; de uitkomst is niet aan jou. Als iets niet komt, betekent dat niet dat je niet genoeg geloofde. Dat is niet hoe het werkt, en het is ook niet wat tawakkul betekent.",
        schuldvalNeutraal: "Je doet de oorzaken; de uitkomst is niet aan jou. Als iets niet komt, betekent dat niet dat je niet genoeg je best deed.",
        samenvattingKop: "Deze week",
        klaar: "Klaar",
    },
    deBrief: {
        // v2.4 §7B. Geen enkele van deze zinnen beoordeelt hoe het ging.
        aankondiging: "er ligt een brief",
        archiefKnoptekst: "de brieven",
        sluiten: "sluiten",
        terugNaarBrieven: "de andere brieven",
    },
    onderbreker: {
        // v2.2 §3, Wet 8 ("Doomscrolling aanpakken zonder zelf verslavend te
        // worden") en v2.1 §3.F. Altijd bereikbaar, want scrollen kondigt zich
        // niet aan. Geen enkel veld hiervan wordt bewaard — "hij houdt niet bij
        // hoe vaak dit gebeurt" (v2.2 §3) — dus dit hele scherm schrijft nooit
        // naar het datamodel.
        toegangKnoptekst: "ik zit vast in mijn telefoon",
        vraag: "Wat zocht je?",
        placeholder: "hoeft niet — mag ook leeg blijven",
        bewustDoor: "Ik ga bewust door",
        andersDoen: "Ik doe iets anders",
        herkomst: {
            // Twee aparte W-regels, bewust niet samengevoegd tot één alinea: de
            // eerste is het "waarom stoppen" (6 sept 2026, op verzoek om de
            // nadelen zichtbaar te maken), de tweede blijft het bestaande
            // "waarom minderen — niet stoppen — werkt" (v2.2 §3).
            nadelen: "Langer doomscrollen hangt samen met een somberder stemming, meer piekeren en — vlak voor het slapen — een slechtere nachtrust. Het overprikkelt ook je aandacht, waardoor rustigere, echte dingen daarna juist moeilijker aanvoelen om aan te beginnen.",
            W: "Helemaal stoppen werkt zelden en houdt zelden stand — minderen doet dat beter. Bewust kiezen in plaats van wegzakken, met één concrete andere handeling klaar, liet in gecontroleerd onderzoek een echte afname van problematisch schermgebruik zien die weken standhield.",
        },
        tijdVraag: "Hoeveel tijd geef je jezelf?",
        tijdOpties: ["vijf minuten", "tien minuten", "een kwartier"],
        tijdBevestiging: "Goed. {tijd}. Daarna mag je zelf weer kiezen.",
        doorgaan: "Doorgaan",
        andersDoenVraag: "Kies iets anders om nu te doen.",
    },
    meer: {
        // S16 — het ene, stille toegangspunt (v2.2 Wet 5, v2.4 Wet 10.3). Puur
        // navigatie, geen eigen vraag of uitleg — de knoppen spreken voor zich.
        instellingenKnoptekst: "instellingen",
        frictieKnoptekst: "frictie buiten de app",
        perfectionismeKnoptekst: "voelt dit nog als hulp?",
        terug: "Terug",
    },
    perfectionismeCheck: {
        // S17, v2.2 Wet 7, laatste punt. Eén vraag, geen vervolgvraag over
        // waarom — dat zou zelf het soort uitpluizen zijn dat Wet 6 en Wet 7
        // allebei uitsluiten.
        vraag: "Voelt deze app als hulp, of als nog iets waar je aan moet voldoen?",
        alsHulp: "Als hulp",
        alsHulpAntwoord: "Goed om te weten.",
        alsVerplichting: "Als iets waar ik aan moet voldoen",
        aanbod: "Dan kan de spiegel van de week uit — dat is één moment minder.",
        aanbodJa: "Ja, maak hem kleiner",
        aanbodNee: "Nee, laat maar zo",
        aanbodJaBevestiging: "Uitgezet. In instellingen kan hij weer aan.",
        aanbodNeeBevestiging: "Goed.",
    },
    frictie: {
        // S18, v2.2 Wet 8, punt 2. Niet-aanklikbaar: de app voert er niets van
        // uit en onthoudt alleen dát het aanbod deze maand gedaan is.
        kop: "Frictie buiten de app",
        intro: "Niet in de app, maar eromheen: vier manieren om jezelf iets meer wrijving te geven voordat het scrollen begint.",
        suggesties: [
            "Meldingen uit voor de apps waar je het meest in verdwaalt.",
            "Die apps van je beginscherm af — een tik verder is soms al genoeg.",
            "Je telefoon 's avonds ergens anders neerleggen dan naast je bed.",
            "Het scherm in grijstinten zetten.",
        ],
        herkomst: {
            W: "Een kleine drempel tussen jou en een gewoonte vermindert hoe vaak je hem uitvoert — niet via wilskracht, maar doordat die extra stap de automatische reflex onderbreekt.",
        },
        gezien: "Gezien",
    },
    grenzen: {
        aanhoudendeSlaapproblemen: "Als dit al langer speelt: dit is een plek voor een huisarts, niet voor een app.",
    },
    instellingen: {
        islamitischeLaag: {
            label: "De islamitische laag",
            onderschrift: "Zet de bewegingen en teksten met een [I]-label aan of uit. In hun geheel — geen aparte knoppen per onderdeel.",
        },
        rustigeBeelden: {
            label: "Rustige beelden",
            onderschrift: "Zet animatie uit, los van je systeeminstelling.",
        },
        weekmoment: {
            label: "De spiegel van de week",
            onderschrift: "Eén keer per week: de beeldoefening en een eigen keuze voor de week.",
        },
        allesMeenemenEnStoppen: {
            label: "Alles meenemen en stoppen",
        },
        exportGelukt: "Bewaard. Dit bestand is alles.",
    },
    legeStaten: {
        storageVolOfGeweigerd: "Er is nu geen ruimte om dit te bewaren op je toestel. Probeer het opnieuw, of maak een export.",
        importMislukt: "Dit bestand kon niet gelezen worden. Er is niets veranderd aan wat je al had.",
    },
    foutmeldingen: {
        algemeen: "Er ging iets mis. Er is niets verloren — probeer het opnieuw.",
    },
};
