// motivatiehoek.ts — content voor de Motivatiehoek (het "Geen motivatie"-
// noodanker op het startscherm, zie toonMotivatiequote/... in app.ts).
//
// Quote, profetenverhaal en reality check draaien elk in hun EIGEN, apart
// getelde cyclus (zie motivatiehoekVoorVandaag) in plaats van als vast trio
// dat samen herhaalt. Reden: er bestaan realistisch maar ~100-150 losse,
// écht met Qur'an/hadith te onderbouwen momenten in de levens van de
// profeten — lang niet 365. Verzinnen om dat aantal te forceren zou precies
// ingaan tegen de eigen bronseis van dit onderdeel. Met afzonderlijke
// cycli (nu bv. 12/34/20) herhaalt de combinatie van alle drie pas na het
// kleinste-veelvoud van die lengtes — al bij deze eerste, nog groeiende
// batch honderden dagen — zonder ergens een verhaal te moeten fabriceren.
// Nieuwe content toevoegen is dus altijd gewoon: een item aan de juiste
// lijst toevoegen, met een echte bron.
// ── Quotes ────────────────────────────────────────────────────────────
// Elke quote is gecontroleerd op toeschrijving. Enkele veelgedeelde
// "motivatiequotes" bleken bij controle niet van de genoemde persoon te
// zijn (o.a. een aan Boeddha/Seneca en een aan C.S. Lewis toegeschreven
// citaat) en zijn daarom bewust niet opgenomen.
export const motivatieQuotes = [
    {
        tekst: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.",
        auteur: "Bruce Lee",
        bron: "Veelvuldig geciteerd, gekoppeld aan zijn trainingsfilosofie",
    },
    {
        tekst: "I don't stop when I'm tired. I stop when I'm done.",
        auteur: "David Goggins",
        bron: "Can't Hurt Me",
    },
    {
        tekst: "Discipline equals freedom.",
        auteur: "Jocko Willink",
        bron: "Extreme Ownership",
    },
    {
        tekst: "I've failed over and over and over again in my life. And that is why I succeed.",
        auteur: "Michael Jordan",
        bron: "Nike 'Failure' Commercial (1997)",
    },
    {
        tekst: "The impediment to action advances action. What stands in the way becomes the way.",
        auteur: "Marcus Aurelius",
        bron: "Meditations (Boek 5, 20)",
    },
    {
        tekst: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
        auteur: "Muhammad Ali",
        bron: "Interviews, vroege jaren '70",
    },
    {
        tekst: "A champion is defined not by their wins but by how they can recover when they fall.",
        auteur: "Serena Williams",
        bron: "Interviews en publieke uitspraken",
    },
    {
        tekst: "Job's not finished.",
        auteur: "Kobe Bryant",
        bron: "Persconferentie, NBA Finals, 7 juni 2009",
    },
    {
        tekst: "Everybody has a plan until they get hit for the first time.",
        auteur: "Mike Tyson",
        bron: "Interview, 1987",
    },
    {
        tekst: "It is not the critic who counts... The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
        auteur: "Theodore Roosevelt",
        bron: "\"Citizenship in a Republic\", toespraak aan de Sorbonne, 1910",
    },
    {
        tekst: "Talent without work is nothing, and work without talent is nothing. They have to work together at the same time.",
        auteur: "Cristiano Ronaldo",
        bron: "Whoop-podcast",
    },
    {
        tekst: "All you have to do is try. And to me, the worst kind of defeat is not failure per se. It's the decision not to try.",
        auteur: "Novak Djokovic",
        bron: "Interview",
    },
    {
        tekst: "If you know the enemy and know yourself, you need not fear the result of a hundred battles.",
        auteur: "Sun Tzu",
        bron: "De Kunst van het Oorlogvoeren, hoofdstuk 3",
    },
    {
        tekst: "Men are disturbed not by things, but by the views which they take of them.",
        auteur: "Epictetus",
        bron: "Enchiridion, hoofdstuk 5",
    },
    {
        tekst: "You have power over your mind – not outside events. Realize this, and you will find strength.",
        auteur: "Marcus Aurelius",
        bron: "Meditations (Boek 4)",
    },
    {
        tekst: "The moment you give up is the moment you let someone else win.",
        auteur: "Kobe Bryant",
        bron: "Veelvuldig geciteerde uitspraak",
    },
    {
        tekst: "There will be obstacles. There will be doubters. There will be mistakes. But with hard work, with belief, with confidence and trust in yourself and those around you, there are no limits.",
        auteur: "Michael Phelps",
        bron: "No Limits: The Will to Succeed",
    },
    {
        tekst: "I learned that courage was not the absence of fear, but the triumph over it.",
        auteur: "Nelson Mandela",
        bron: "Long Walk to Freedom (1995)",
    },
    {
        tekst: "I don't want to be remembered as the girl who was shot. I want to be remembered as the girl who stood up.",
        auteur: "Malala Yousafzai",
        bron: "Publieke uitspraken, 2013",
    },
];
// ── Profetenverhalen ─────────────────────────────────────────────────
// Uitsluitend momenten uit het leven van een profeet (nabi/rasoel) zoals
// beschreven in de Qur'an of authentieke hadith — geen andere historische
// figuren. Bron staat bij elk verhaal; waar de exacte ayah-reeks onzeker
// was, staat er bewust alleen de surahnaam in plaats van een gegokt
// versnummer.
export const profetenVerhalen = [
    {
        profeet: "Nuh عليه السلام",
        titel: "Negenhonderdvijftig jaar",
        tekst: "Stel je voor dat je negenhonderdvijftig jaar lang elke dag opstaat om dezelfde boodschap te verkondigen. Elke dag word je uitgelachen, genegeerd en vernederd door de mensen om je heen.\n\nNuh عليه السلام deed dit niet voor één decennium, niet voor een eeuw, maar voor 950 jaar. Zijn geduld was niet afhankelijk van snelle resultaten of onmiddellijk succes. Zijn geduld was geworteld in pure gehoorzaamheid. Hij deed zijn werk, dag in dag uit, ongeacht de uitkomst, totdat Allah het bevel gaf om de ark te bouwen.",
        bronnen: ["Qur'an 29:14"],
        thema: "Volharding zonder direct resultaat",
    },
    {
        profeet: "Nuh عليه السلام",
        titel: "Zijn eigen zoon die niet meeging",
        tekst: "Terwijl de ark wegvoer en de vloed alles overspoelde, zag Nuh عليه السلام zijn eigen zoon nog buiten staan, apart van de rest. Hij riep hem, smekend: \"Mijn zoon, kom aan boord met ons, wees niet bij de ongelovigen.\" Zijn zoon antwoordde dat hij naar een berg zou vluchten om zichzelf te redden.\n\nEen golf kwam tussen hen in en zijn zoon verdronk. Nuh smeekte daarna tot Allah, zijn verdriet nauwelijks verhullend — en kreeg als antwoord dat ware familie niet alleen bloed is, maar geloof en daden. Zelfs een profeet kon iemand die hij liefhad niet redden tegen diens eigen keuze in.",
        bronnen: ["Qur'an 11:42-46"],
        thema: "Iemand verliezen die je niet kon redden",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De dag in Ta'if",
        tekst: "Na het verlies van zijn geliefde vrouw Khadija en zijn oom Abu Talib, reisde de Profeet ﷺ te voet naar Ta'if om steun te zoeken. In plaats van hulp kreeg hij stenen. Hij werd de stad uitgedreven, bloedend tot in zijn sandalen.\n\nFysiek uitgeput en emotioneel gebroken zocht hij beschutting in een boomgaard. Hij gaf niet op. Hij klaagde niet over de mensen. Hij hief zijn handen en beklaagde zich alleen over zijn eigen zwakte bij Allah. Zelfs toen de Engel van de Bergen hem de optie gaf om de stad te verwoesten, koos hij voor genade en hoopte hij op hun nageslacht.",
        bronnen: ["Sahih al-Bukhari 3231", "Seerah Ibn Hisham"],
        thema: "Pijn verdragen en focus behouden",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De grot van Thawr",
        tekst: "Op de vlucht voor moordenaars school de Profeet ﷺ met Abu Bakr drie dagen in een kleine grot bij Mekka. De achtervolgers stonden op een gegeven moment letterlijk voor de ingang — Abu Bakr fluisterde in doodsangst dat als één van hen naar beneden keek, ze gezien zouden worden.\n\nDe Profeet ﷺ antwoordde met een rust die niets te maken had met de situatie zelf: \"Wat denk je van twee mensen wier derde Allah is?\" Een spin had inmiddels een web over de ingang gesponnen en duiven hadden er een nest gebouwd — voor de achtervolgers reden genoeg om door te lopen. Qur'an 9:40 noemt dit moment met naam: Allah zond Zijn rust (sakina) over hem neer.",
        bronnen: ["Qur'an 9:40", "Sahih al-Bukhari"],
        thema: "Rust vinden in onzekerheid",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Het jaar van verdriet",
        tekst: "In één en hetzelfde jaar verloor de Profeet ﷺ zijn vrouw Khadija — zijn eerste gelovige, zijn steun door de zwaarste jaren — én zijn oom Abu Talib, die hem beschermde zonder ooit zelf moslim te worden. De mensen om hem heen noemden dit letterlijk \"het jaar van verdriet\" ('Aam al-Huzn).\n\nEr was geen tijd om op adem te komen zoals het misschien had gemogen. Twee onherstelbare verliezen, kort na elkaar, zonder dat de druk op hem afnam. Hij bleef zijn taak dragen, ook toen er niemand meer over was om hem persoonlijk te dragen.",
        bronnen: ["Seerah Ibn Hisham", "Seerah Ibn Kathir"],
        thema: "Dubbel verlies dragen zonder erin te blijven hangen",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De eerste openbaring in Hira",
        tekst: "Op zijn veertigste trok Muhammad ﷺ zich al jaren terug in de grot van Hira om na te denken. Toen de engel Jibril voor het eerst verscheen en \"Lees!\" beval, antwoordde hij naar waarheid: \"Ik kan niet lezen.\" Jibril omhelsde hem daarop met kracht, drie keer, tot het pijn deed.\n\nDoodsbang rende hij naar huis, bevend, en vroeg zijn vrouw Khadija om hem te bedekken. Hij was ervan overtuigd dat er iets vreselijks met hem gebeurde. Khadija stelde hem gerust met een nuchtere opsomming van zijn karakter — hij hielp de armen, sprak de waarheid, droeg andermans lasten — en bracht hem naar haar neef Waraqa, een geleerde, die bevestigde wat er zojuist gebeurd was.",
        bronnen: ["Sahih al-Bukhari 3"],
        thema: "Overweldigd zijn door iets groters dan jezelf",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De blokkade van Shi'b Abi Talib",
        tekst: "Drie jaar lang sloot heel Mekka de hele stam van de Profeet ﷺ — moslim en niet-moslim — buiten. Geen huwelijk, geen handel, geen voedsel dat de vallei nog mocht bereiken. Er wordt overgeleverd dat mensen bladeren moesten koken om iets in hun maag te krijgen.\n\nEr was geen vooruitzicht op een einde. Geen datum, geen garantie. Toch bogen de moslims niet mee met wat de Quraysh eisten. Pas na drie jaar, toen het contract dat aan de Ka'ba hing grotendeels door houtworm was aangevreten, werd de blokkade opgeheven.",
        bronnen: ["Seerah Ibn Hisham", "Ibn Sa'd, Kitab al-Tabaqat"],
        thema: "Volhouden onder collectieve druk",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Twee stenen om de buik",
        tekst: "Tijdens het graven van de gracht rond Medina, ter verdediging tegen een leger van duizenden, hadden de metgezellen dagenlang bijna niets gegeten. Uit pure honger bonden ze een steen om hun buik om het knagende gevoel te onderdrukken.\n\nToen ze dit aan de Profeet ﷺ lieten zien, tilde hij zijn eigen kleed op — hij droeg er twee. Hij groef mee, dag na dag, met hetzelfde gebrek als iedereen om hem heen, zonder ergens een uitzondering voor zichzelf te maken.",
        bronnen: ["Sahih al-Bukhari 4101"],
        thema: "Honger lijden en toch blijven werken",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Een verdrag dat oneerlijk aanvoelde",
        tekst: "Bij Hudaybiyyah stemde de Profeet ﷺ in met voorwaarden die zijn eigen metgezellen als vernederend ervoeren: dit jaar geen bedevaart, en een moslim die overloopt naar Mekka wordt niet teruggegeven — andersom wel. Omar bin al-Khattab was zo ontdaan dat hij de beslissing bijna in twijfel trok.\n\nDe Profeet ﷺ tekende toch. Geen twee jaar later bleek dit verdrag — dat als verlies aanvoelde — juist de opening waardoor de boodschap zich sneller verspreidde dan in alle jaren van open conflict daarvoor. Surah Al-Fath noemt het expliciet \"een duidelijke overwinning.\"",
        bronnen: ["Qur'an, Surah Al-Fath (48)", "Seerah Ibn Hisham"],
        thema: "Een moeilijk compromis accepteren zonder je principes te verliezen",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Vergeving bij de verovering van Mekka",
        tekst: "Na jaren van vervolging, oorlog en verlies liep de Profeet ﷺ Mekka binnen zonder één klap uit te delen. De mensen die hem hadden verjaagd, die zijn dierbaren hadden gedood, stonden nu machteloos voor hem.\n\nHij herhaalde vrijwel letterlijk de woorden die Yusuf عليه السلام eeuwen eerder tegen zijn eigen broers sprak: \"Geen verwijt treft jullie vandaag.\" Zelfs mensen die rechtstreeks betrokken waren bij de dood van zijn naasten kregen vergeving. Macht werd hier gebruikt om te vergeven, niet om af te rekenen.",
        bronnen: ["Seerah Ibn Hisham", "Qur'an 12:92 (de woorden die hij aanhaalde)"],
        thema: "Macht hebben en toch geen wraak nemen",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Julaybib",
        tekst: "Julaybib had geen aanzien en geen familie van naam, en werd door de mensen om hem heen amper opgemerkt. Toen de Profeet ﷺ hem voordroeg voor een huwelijk met een jonge vrouw uit een gerespecteerd gezin, aarzelden haar ouders — tot de vrouw zelf zei dat ze de keuze van de Profeet ﷺ vertrouwde.\n\nJulaybib sneuvelde kort daarna in een veldslag, tussen zeven gedode vijanden. De Profeet ﷺ vond zijn lichaam zelf, legde het in zijn eigen armen en zei driemaal: \"Hij is van mij, en ik ben van hem.\" Iemand die vrijwel niemand had opgemerkt, werd door de Profeet ﷺ zelf gedragen.",
        bronnen: ["Sahih Muslim"],
        thema: "Waarde zien waar de wereld die niet ziet",
    },
    {
        profeet: "Ibrahim عليه السلام",
        titel: "Het vuur van Namrud",
        tekst: "Ibrahim عليه السلام werd in een gigantisch vuur gegooid, simpelweg omdat hij de waarheid sprak tegen een tirannieke koning. Terwijl hij in de lucht vloog, richting zijn schijnbare einde, kwam de engel Jibril naar hem toe en vroeg of hij hulp nodig had.\n\nIbrahim's antwoord was ultieme overgave en vertrouwen: \"Van jou? Nee. Allah is mij voldoende, en Hij is de beste Beschermer.\" Het vuur werd koel en vreedzaam voor hem. Hij raakte niet in paniek; zijn hart was verankerd in tawakkul.",
        bronnen: ["Qur'an 21:68-69", "Tafsir Ibn Kathir"],
        thema: "Ultiem vertrouwen (Tawakkul)",
    },
    {
        profeet: "Ibrahim عليه السلام",
        titel: "De afgoden breken",
        tekst: "Als jongeman, omringd door een samenleving die stenen afgoden aanbad — inclusief zijn eigen vader — begon Ibrahim عليه السلام vragen te stellen die niemand durfde stellen. Op een dag, terwijl iedereen weg was voor een feest, sloeg hij alle afgoden aan diggelen behalve de grootste, en hing zijn bijl om diens nek.\n\nToen de mensen woedend terugkwamen en hem confronteerden, antwoordde hij kalm: \"Vraag het toch aan die grootste, als ze kunnen spreken.\" Zijn eigen logica, tegen hen gebruikt, liet hen zonder weerwoord — hun woede was het enige antwoord dat ze nog overhadden.",
        bronnen: ["Qur'an 21:51-67"],
        thema: "Alleen staan tegenover wat iedereen gelooft",
    },
    {
        profeet: "Ibrahim عليه السلام",
        titel: "De Ka'ba bouwen",
        tekst: "Op hoge leeftijd bouwde Ibrahim عليه السلام samen met zijn zoon Ismail عليه السلام de fundering van de Ka'ba, steen voor steen, in de kale vallei van Mekka. Geen van beiden wist wat ervan zou worden, of iemand ooit zou komen.\n\nHun gebed tijdens het bouwen was niet trots, maar onzeker en nederig: \"Onze Heer, aanvaard dit van ons. U bent de Alhorende, de Alwetende.\" Ze bouwden iets groters dan zichzelf, met de bereidheid dat het misschien nooit iets zou worden — en lieten het resultaat volledig aan Allah over.",
        bronnen: ["Qur'an 2:127"],
        thema: "Iets opbouwen zonder garantie dat het blijft",
    },
    {
        profeet: "Ibrahim عليه السلام en Ismail عليه السلام",
        titel: "Bereid zijn om het zwaarste te offeren",
        tekst: "In een droom kreeg Ibrahim عليه السلام de opdracht om zijn eigen zoon te offeren. Hij vertelde het Ismail عليه السلام zelf, eerlijk, zonder het te verbergen — en vroeg wat hij ervan vond. Ismail, nog een kind, antwoordde: \"Vader, doe wat je bevolen is. U zult mij, met de wil van Allah, standvastig vinden.\"\n\nBeiden legden zich neer bij wat gevraagd werd, tot het uiterste. Op het moment dat het mes zou vallen, greep Allah in en verving Ismail door een ram. Het offer was nooit het doel — de bereidheid om het te brengen, dat was de test.",
        bronnen: ["Qur'an 37:102-107"],
        thema: "Het zwaarste overwegen en toch gehoorzamen",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "Van de put naar de gevangenis",
        tekst: "Verraden door zijn eigen broers, in een donkere put gegooid, verkocht als slaaf, en vervolgens onterecht in de gevangenis gegooid na valse beschuldigingen. Yusuf عليه السلام verloor jaren van zijn leven in duisternis.\n\nMaar in de gevangenis werd hij niet bitter. Hij bleef zijn karakter behouden, legde dromen uit, en hield vast aan zijn principes. Allah was hem aan het voorbereiden, niet aan het bestraffen. Uiteindelijk werd precies dat geduld in de gevangenis de sleutel tot zijn heerschappij over Egypte.",
        bronnen: ["Qur'an, Surah Yusuf (12)"],
        thema: "Falen en tegenslag als voorbereiding",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "De droom en de jaloezie van zijn broers",
        tekst: "Als kind vertelde Yusuf عليه السلام zijn vader over een droom: elf sterren, de zon en de maan bogen voor hem neer. Zijn vader Ya'qub waarschuwde hem meteen om dit niet met zijn broers te delen — hun jaloezie was al voelbaar, simpelweg omdat hun vader zoveel van Yusuf hield.\n\nDe broers gooiden hem uiteindelijk in een put en logen tegen hun vader dat een wolf hem had opgegeten, met vals bloed op zijn hemd als bewijs. Ya'qub geloofde het verhaal niet volledig, maar droeg zijn verdriet met wat de Qur'an \"mooi geduld\" noemt — hij bleef vertrouwen zonder te weten hoe het verder zou gaan.",
        bronnen: ["Qur'an 12:4-18"],
        thema: "Anders zijn zonder je ervoor te verontschuldigen",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "Nee zeggen tegen wat makkelijk zou zijn",
        tekst: "Als jonge, aantrekkelijke man in het huis van een machtige Egyptenaar werd Yusuf عليه السلام verleid door de vrouw van zijn meester. Hij weigerde, ondanks de druk, ondanks haar macht over zijn positie. Toen de waarheid dreigde te draaien tegen hem — ondanks zijn onschuld — zei hij liever: \"Mijn Heer, de gevangenis is mij liever dan waartoe zij mij oproepen.\"\n\nHij koos bewust voor onrecht en opsluiting boven een makkelijke uitweg die tegen zijn principes inging. Jaren in de gevangenis volgden — niet omdat hij fout had gehandeld, maar juist omdat hij dat niet had gedaan.",
        bronnen: ["Qur'an 12:23-33"],
        thema: "Nee zeggen tegen wat makkelijk zou zijn",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "Dromen uitleggen zonder er iets voor terug te krijgen",
        tekst: "In de gevangenis legde Yusuf عليه السلام de dromen uit van twee medegevangenen, zonder daar iets voor terug te krijgen. Aan één van hen vroeg hij: vertel de koning over mij zodra je vrijkomt. De man vergat het — jarenlang.\n\nPas toen de koning zelf een raadselachtige droom had, herinnerde de man zich Yusuf weer. Toen de koning hem wilde vrijlaten, weigerde Yusuf zomaar naar buiten te lopen: hij eiste eerst dat zijn onschuld publiekelijk werd onderzocht en erkend. Hij wilde geen stiekeme vrijlating — hij wilde gerechtigheid, ook al had hij daar jaren op moeten wachten.",
        bronnen: ["Qur'an 12:36-42, 50"],
        thema: "Je gave blijven gebruiken zonder er iets voor terug te krijgen",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "De hereniging en het terugkerende zicht",
        tekst: "Jaren later stonden Yusuf's eigen broers, zonder het te beseffen, tegenover de machtigste man van Egypte — hun eigen broer die ze ooit in een put hadden gegooid. Hij had nu alle macht om hen te straffen. In plaats daarvan zei hij: \"Geen verwijt treft jullie vandaag. Moge Allah jullie vergeven.\"\n\nHij stuurde zijn hemd mee naar zijn vader Ya'qub, die inmiddels blind was geworden van jarenlang huilen om zijn verloren zoon. Zodra de geur van het hemd zijn vader bereikte, keerde zijn zicht terug — het geduld van jaren werd in één moment beantwoord.",
        bronnen: ["Qur'an 12:88-96"],
        thema: "Vergeven wanneer je alle macht hebt om het niet te doen",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "De zee en het leger",
        tekst: "Musa عليه السلام stond met zijn volk vast voor de onmetelijke Rode Zee. Achter hen naderde de grootste militaire macht van die tijd: het leger van Fir'aun. Het volk raakte in paniek: \"Wij worden zeker ingehaald!\"\n\nMaar Musa's perspectief was onbreekbaar. Hij zei: \"Absoluut niet! Mijn Heer is met mij; Hij zal mij leiden.\" Pas nádat hij dit rotsvaste geloof uitsprak in een onmogelijke situatie, kreeg hij de opdracht om met zijn staf op het water te slaan. Het obstakel werd de uitweg.",
        bronnen: ["Qur'an 26:61-63"],
        thema: "Moed wanneer de uitkomst onzichtbaar is",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "Baby Musa op de rivier",
        tekst: "Uit angst voor Fir'aun, die alle pasgeboren jongens liet doden, kreeg de moeder van Musa عليه السلام een onmogelijke opdracht: leg je baby in een mand en laat hem de rivier op drijven. Geen enkele garantie, geen controle over wat er zou gebeuren.\n\nHet kind belandde, van alle plekken, in het paleis van Fir'aun zelf — opgevoed door de man die zijn dood had bevolen. Zijn zus volgde de mand langs de oever en regelde, zonder dat het paleis het doorhad, dat zijn eigen moeder als voedster werd aangesteld. Wat als verlies begon, eindigde in bescherming op de meest onwaarschijnlijke plek.",
        bronnen: ["Qur'an 28:7-13"],
        thema: "Loslaten wat je niet kan controleren",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "De brandende struik",
        tekst: "Op de vlucht, vermoeid, zag Musa عليه السلام in de verte een vuur en liep erheen voor warmte. In plaats van vuur trof hij een Stem: \"Ik ben Allah, er is geen god dan Ik.\" Hij kreeg een opdracht die alles overtrof wat hij ooit had verwacht: ga naar Fir'aun, de machtigste man van zijn tijd.\n\nMusa's eerste reactie was geen zelfvertrouwen, maar angst en onzekerheid over zijn eigen spraak. Hij vroeg letterlijk om hulp — zijn broer Harun erbij — voordat hij ja zei. De opdracht werd niet kleiner gemaakt omdat hij bang was; wel kreeg hij steun om hem aan te kunnen.",
        bronnen: ["Qur'an, Surah Ta-Ha (20), vers 9-14"],
        thema: "Een taak op je nemen die je bang maakt",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "De tovenaars van Fir'aun",
        tekst: "Fir'aun riep zijn beste tovenaars op om Musa عليه السلام publiekelijk te vernederen. Ze wierpen hun staven en touwen, en het leek alsof heel het volk het zag bewegen als slangen. Toen wierp Musa zijn staf — en die verslond alles wat zij hadden gemaakt.\n\nDe tovenaars, mensen die hun hele leven aan illusie hadden besteed, herkenden onmiddellijk het verschil tussen een truc en waarheid. Ze vielen ter plekke neer in aanbidding — wetend dat Fir'aun hen zou laten martelen voor deze keuze. Hij dreigde met kruisiging en verminking. Ze kozen alsnog voor wat ze zojuist hadden gezien, ongeacht de prijs.",
        bronnen: ["Qur'an, Surah Ta-Ha (20), vers 56-73"],
        thema: "Waarheid herkennen, ook als het je alles kost",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "Khidr — geduld met wat je niet begrijpt",
        tekst: "Musa عليه السلام vroeg om een reis te maken met een dienaar van Allah die kennis had die hij zelf niet had. De voorwaarde was duidelijk: geen vragen stellen, wat er ook gebeurt. Drie keer zag Musa iets gebeuren dat onrechtvaardig leek — een boot beschadigd, een jongen gedood, een muur zomaar herbouwd zonder betaling — en drie keer kon hij zijn vragen niet inhouden.\n\nAan het einde legde Khidr uit: de boot werd beschadigd om haar bemanning te redden van een koning die elk werkend schip in beslag nam; de jongen zou zijn ouders later verdriet hebben aangedaan; de muur beschermde een schat voor twee weeskinderen. Wat oneerlijk leek, was bescherming die pas achteraf zichtbaar werd.",
        bronnen: ["Qur'an, Surah Al-Kahf (18), vers 60-82"],
        thema: "Vertrouwen zonder de uitleg te kennen",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "Het gouden kalf",
        tekst: "Terwijl Musa عليه السلام veertig dagen op de berg was om de openbaring te ontvangen, maakte zijn volk — dat net wonderbaarlijk uit Egypte was gered — een gouden kalf en aanbad het. Toen hij terugkwam en zag wat er gebeurd was, gooide hij in woede de tabletten neer en trok zijn eigen broer Harun hardhandig aan zijn baard.\n\nHarun legde uit dat hij het volk had gewaarschuwd, maar bang was voor verdeeldheid als hij te hard optrad in Musa's afwezigheid. Musa's woede kwam niet voort uit ongeduld met tegenslag, maar uit hoeveel het hem kon schelen dat zijn volk zo snel afdwaalde van wat ze net hadden meegemaakt.",
        bronnen: ["Qur'an, Surah Ta-Ha (20), vers 83-98"],
        thema: "Terugkomen bij mensen die het spoor bijster raakten",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "Vluchten naar Madyan",
        tekst: "Na een confrontatie in Egypte moest Musa عليه السلام alleen vluchten, zonder bezittingen, zonder plan, de woestijn in. Uitgeput kwam hij aan bij een waterput in Madyan, waar hij twee vrouwen zag wachten omdat ze niet tussen de mannen door konden om hun vee te laten drinken.\n\nZonder iets terug te verwachten hielp hij hen. Diezelfde avond bad hij, letterlijk: \"Mijn Heer, ik heb dringend behoefte aan het goede dat U mij zendt.\" Uit die ene kleine daad van hulp, op zijn laagste punt, ontstond een nieuw thuis, een huwelijk en uiteindelijk de weg terug naar zijn missie.",
        bronnen: ["Qur'an, Surah Al-Qasas (28), vers 22-28"],
        thema: "Opnieuw beginnen met niets",
    },
    {
        profeet: "Ayyub عليه السلام",
        titel: "Het verlies van alles",
        tekst: "Ayyub عليه السلام was rijk, had een groot gezin en een perfecte gezondheid. Binnen korte tijd verloor hij zijn rijkdom, stierven zijn kinderen, en werd hij getroffen door een slopende ziekte waardoor zelfs zijn vrienden hem verlieten.\n\nHij leed in stilte voor jaren. Zelfs toen zijn vrouw hem vroeg om Allah om genezing te smeken, vond hij zichzelf te bescheiden om dat direct te doen, gezien de vele jaren van gezondheid die hij daarvoor had genoten. Pas toen de pijn ondragelijk werd, riep hij: \"Tegenspoed heeft mij getroffen, en U bent de Meest Barmhartige der barmhartigen.\"",
        bronnen: ["Qur'an 21:83-84", "Qur'an 38:41-44"],
        thema: "Sabr (geduld) in extreme fysieke/mentale pijn",
    },
    {
        profeet: "Yunus عليه السلام",
        titel: "Duisternis in duisternis",
        tekst: "Yunus عليه السلام verliet zijn volk in frustratie voordat Allah hem daar toestemming voor gaf. Hij belandde op een schip, werd overboord gegooid in een woeste zee, en opgeslokt door een walvis.\n\nHij bevond zich in drievoudige duisternis: de duisternis van de nacht, de duisternis van de oceaan, en de duisternis van de buik van de walvis. In plaats van de omstandigheden de schuld te geven, nam hij onmiddellijk volledige verantwoordelijkheid: \"Er is geen god dan U, Verheven bent U. Waarlijk, ik behoorde tot de onrechtplegers.\" Die erkenning brak zijn gevangenis open.",
        bronnen: ["Qur'an 21:87"],
        thema: "Extreme verantwoordelijkheid nemen",
    },
    {
        profeet: "Dawud عليه السلام",
        titel: "Klein tegenover een reus",
        tekst: "Het leger van Talut was al gedecimeerd voordat de strijd goed en wel begon — velen hadden zich teruggetrokken uit angst voor het leger van Jalut. Onder wie overbleven was een jonge, onopvallende Dawud عليه السلام, die niemand als serieuze kans zag tegen een reus die het hele leger vreesde.\n\n\"Hoeveel keer heeft een kleine groep, met de wil van Allah, een grote groep verslagen,\" zeiden de weinigen die wel geloofden. Dawud versloeg Jalut, en Allah gaf hem daarna koningschap en wijsheid. Niemand had op hem gerekend — hijzelf ging toch.",
        bronnen: ["Qur'an 2:249-251"],
        thema: "Klein zijn tegenover een reus, en toch gaan",
    },
    {
        profeet: "Sulaiman عليه السلام",
        titel: "Bilqis en de hop",
        tekst: "Sulaiman عليه السلام, met macht over mens, dier en wind, merkte op een dag dat de hop-vogel afwezig was uit zijn leger. In plaats van dit zomaar te negeren dreigde hij de vogel serieus te straffen — tot de hop terugkwam met nieuws: een koningin, Bilqis, regeerde een machtig rijk en aanbad de zon.\n\nSulaiman stuurde geen leger, maar een brief. Toen Bilqis zelf naar zijn paleis kwam en zag wat hij had opgebouwd, herkende ze de waarheid en gaf haar eigen troon op. Over al zijn macht zei Sulaiman zelf: \"Dit is de gunst van mijn Heer, om mij te beproeven of ik dankbaar zal zijn.\"",
        bronnen: ["Qur'an, Surah An-Naml (27), vers 20-44"],
        thema: "Macht gebruiken met nederigheid, niet met arrogantie",
    },
    {
        profeet: "Isa عليه السلام",
        titel: "Het pasgeboren getuigenis",
        tekst: "Maryam عليها السلام trok zich terug, alleen, ver van haar volk, om te bevallen van Isa عليه السلام — zonder man, wetend wat mensen zouden denken en zeggen. In haar pijn wenste ze dat ze allang vergeten en verdwenen was in plaats van dit onder ogen te moeten komen.\n\nToen ze met de baby terugkeerde naar haar volk en beschuldigd werd, wees ze — op Allah's aanwijzing — simpelweg naar het kind. Isa, nog maar een baby, sprak: \"Ik ben werkelijk een dienaar van Allah...\" en verdedigde zijn moeders eer voordat hij ook maar kon lopen. Haar geduld in het ergste moment werd op het exacte juiste moment beantwoord.",
        bronnen: ["Qur'an, Surah Maryam (19), vers 16-33"],
        thema: "Alleen staan tegenover beschuldiging die je niet verdient",
    },
    {
        profeet: "Zakariya عليه السلام en Yahya عليه السلام",
        titel: "Een kind op hoge leeftijd",
        tekst: "Zakariya عليه السلام was oud, zijn vrouw onvruchtbaar, en toch bleef hij jarenlang in stilte bidden om een kind — niet uit koppigheid, maar omdat hij niemand had om zijn erfenis van kennis en geloof aan door te geven. Op hoge leeftijd, toen het menselijk gezien onmogelijk leek, vroeg hij het nog één keer.\n\nHet antwoord kwam: een zoon, Yahya عليه السلام. Zakariya, verrast door zijn eigen verhoorde gebed, vroeg om een teken. Hij kreeg er een: drie dagen niet kunnen spreken, ondanks dat hij fysiek gezond was — een stilte die hem dwong om puur in dankbaarheid te blijven in plaats van in woorden.",
        bronnen: ["Qur'an, Surah Maryam (19), vers 2-15"],
        thema: "Blijven vragen, ook als het al lang onwaarschijnlijk lijkt",
    },
    {
        profeet: "Adam عليه السلام",
        titel: "De vergeving na de fout",
        tekst: "Adam عليه السلام en Hawwa kregen één instructie in het paradijs: kom niet in de buurt van deze ene boom. Ze faalden — niet uit rebellie, maar omdat ze misleid werden. Het gevolg was zwaar: verlies van hun plek in het paradijs.\n\nMaar Adam bleef niet hangen in schuld of wanhoop. Allah zelf leerde hem de woorden om berouw mee te tonen, en accepteerde dat berouw meteen. De eerste mens maakte de eerste fout — en kreeg ook meteen het eerste bewijs dat een fout nooit het einde van het verhaal is, zolang je terugkeert.",
        bronnen: ["Qur'an 2:35-37"],
        thema: "Een fout maken en toch niet verloren zijn",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De bedoeïen in de moskee",
        tekst: "Een bedoeïen liep de moskee van de Profeet ﷺ binnen en urineerde zomaar in een hoek. De aanwezigen sprongen op om hem hardhandig tegen te houden.\n\nDe Profeet ﷺ greep in — niet om de man harder aan te pakken, maar om hem juist met rust te laten tot hij klaar was. Pas daarna liet hij het schoonmaken. \"Jullie zijn gestuurd om het makkelijk te maken, niet om het moeilijk te maken,\" zei hij. Zachtheid, precies op het moment waarop de meeste mensen hard zouden worden.",
        bronnen: ["Sahih al-Bukhari 6128"],
        thema: "Geduld en zachtheid bij andermans fout",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De afscheidsrede",
        tekst: "Op de berg Arafat, aan het einde van zijn leven, sprak de Profeet ﷺ tot meer dan honderdduizend mensen — de grootste menigte die hij ooit had toegesproken. Hij wist, en velen om hem heen voelden het ook, dat dit zijn laatste boodschap zou worden.\n\nGeen nieuwe wetten, geen laatste geheimen — alleen het belangrijkste nog één keer, hardop, zodat niemand het kon missen: gelijkheid van mensen ongeacht afkomst, de rechten van vrouwen, het verbod op woeker, de heiligheid van andermans leven en bezit. Hij sloot af met de vraag of hij de boodschap had overgebracht, en liet honderdduizend mensen ja antwoorden — als getuigen.",
        bronnen: ["Sahih Muslim", "Sunan Ibn Majah", "Musnad Ahmad"],
        thema: "Het belangrijkste nog één keer zeggen voor het te laat is",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "Het verlies van zijn zoon Ibrahim",
        tekst: "Toen zijn jonge zoon Ibrahim op sterven lag, hield de Profeet ﷺ hem in zijn armen. Zijn ogen vulden zich met tranen. Een metgezel, verbaasd dat juist hij huilde, vroeg ernaar.\n\n\"Dit is barmhartigheid,\" antwoordde hij, en huilde nog meer. \"Het oog weent, het hart is bedroefd, en we zeggen alleen wat onze Heer behaagt. Waarlijk, om jouw heengaan, Ibrahim, zijn we bedroefd.\" Verdriet voelen en het uiten was voor hem geen tegenstelling met overgave aan Allah — het een sloot het ander niet uit.",
        bronnen: ["Sahih al-Bukhari 1303"],
        thema: "Verdriet voelen zonder je overgave te verliezen",
    },
    {
        profeet: "Muhammad ﷺ",
        titel: "De nachtelijke reis",
        tekst: "In het jaar na het zwaarste verlies van zijn leven — Khadija en Abu Talib in hetzelfde jaar, gevolgd door de vernedering in Ta'if — kreeg de Profeet ﷺ een nacht die niets meer met zijn omstandigheden op aarde te maken had. Hij werd in één nacht meegenomen van Mekka naar Jeruzalem, en van daar omhoog, ver voorbij wat een mens normaal kan bevatten.\n\nToen hij terugkeerde en het vertelde, geloofden velen hem niet en maakten hem belachelijk. Precies in het jaar dat zijn leven er het zwartst uitzag van buitenaf, kreeg hij van binnenuit het duidelijkste teken dat hij niet vergeten was.",
        bronnen: ["Qur'an 17:1"],
        thema: "Op je zwaarste moment iets onverwachts ontvangen",
    },
    {
        profeet: "Ibrahim عليه السلام en Hajar عليها السلام",
        titel: "Alleen achtergelaten in de woestijn",
        tekst: "Ibrahim عليه السلام bracht Hajar عليها السلام en hun baby Ismail عليه السلام naar een kale vallei zonder mensen en zonder water, met alleen wat dadels en een waterzak. Toen hij wegliep, volgde ze hem en vroeg: \"Is het Allah die je dit opdraagt?\" Hij zei: \"Ja.\" Zij antwoordde: \"Dan zal Hij ons niet verloren laten gaan.\"\n\nToen het water opraakte en haar baby van dorst huilde, rende ze wanhopig zeven keer heen en weer tussen de heuvels Safa en Marwa, op zoek naar hulp of water — tot ze onder de voeten van haar kind een bron zag opborrelen. Die bron, Zamzam, stroomt tot op de dag van vandaag.",
        bronnen: ["Sahih al-Bukhari 3364"],
        thema: "Vertrouwen zonder te weten hoe het goed komt",
    },
    {
        profeet: "Ibrahim عليه السلام",
        titel: "Het debat met de koning",
        tekst: "Namrud, de machtigste koning van zijn tijd, beweerde tegenover Ibrahim عليه السلام dat hij zelf leven en dood kon geven — hij liet gewoon de ene gevangene vrij en de andere doden, en noemde dat zijn bewijs.\n\nIbrahim antwoordde niet met woede, maar met één simpel verzoek: \"Allah laat de zon opkomen in het oosten. Laat jij haar dan maar eens in het westen opkomen.\" De koning, met alle macht die hij had, kon er niets tegenin brengen. Soms is de sterkste weerlegging geen felle discussie, maar één vraag die niemand kan beantwoorden.",
        bronnen: ["Qur'an 2:258"],
        thema: "Een tiran weerleggen zonder woede",
    },
    {
        profeet: "Musa عليه السلام",
        titel: "Recht voor Fir'aun staan",
        tekst: "Musa عليه السلام en zijn broer Harun kregen de opdracht om naar Fir'aun te gaan — de machtigste, meest gevreesde man van hun tijd, dezelfde man in wiens paleis Musa was opgegroeid en voor wie hij ooit moest vluchten. De boodschap die ze moesten brengen was ongehoord: laat een volledig volk van slaven gaan.\n\n\"Wees niet bang,\" kreeg Musa te horen voordat hij ging, \"Ik ben met jullie, Ik hoor en Ik zie.\" Hij ging het paleis binnen met niets dan die belofte, tegenover een man die zichzelf god noemde.",
        bronnen: ["Qur'an, Surah Ta-Ha (20), vers 47-48"],
        thema: "De machtigste man van je tijd recht aankijken",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "Verkocht voor bijna niets",
        tekst: "Nadat zijn broers hem in de put hadden gegooid, kwam er een karavaan langs die water kwam halen. Ze haalden Yusuf عليه السلام omhoog en, zonder dat hij er iets over te zeggen had, verkochten zijn eigen broers hem voor een handvol munten — een schamel bedrag, alsof hij niets waard was.\n\nOp het moment dat zijn waarde door de mensen om hem heen op het laagste punt werd gezet, begon voor Yusuf feitelijk de weg die uiteindelijk naar het bestuur van heel Egypte zou leiden. Wat anderen als waardeloos bestempelden, was dat allerminst.",
        bronnen: ["Qur'an 12:19-20"],
        thema: "Op je laagste punt afgeschreven worden door anderen",
    },
    {
        profeet: "Yusuf عليه السلام",
        titel: "Zichzelf aanbieden voor verantwoordelijkheid",
        tekst: "Na jaren van onterechte gevangenschap en nadat zijn onschuld eindelijk erkend was, deed Yusuf عليه السلام iets opmerkelijks: hij wachtte niet af tot hem iets werd aangeboden. Hij vroeg de koning zelf: \"Stel mij aan over de schatkamers van het land; ik ben een goede bewaarder, kundig.\"\n\nNa alles wat hem was aangedaan, koos hij ervoor zich aan te bieden voor een van de zwaarste verantwoordelijkheden van het land, met vertrouwen in zijn eigen kunnen — niet uit trots, maar omdat hij wist wat hij kon bijdragen na jaren van voorbereiding die niemand anders had gezien.",
        bronnen: ["Qur'an 12:54-57"],
        thema: "Verantwoordelijkheid opeisen na jaren onderdrukking",
    },
    {
        profeet: "Adam عليه السلام",
        titel: "De namen geleerd",
        tekst: "Voordat Adam عليه السلام ook maar iets had gedaan om het te verdienen, leerde Allah hem de namen van alle dingen — kennis die zelfs de engelen niet hadden. Toen aan de engelen gevraagd werd om die namen te noemen, konden ze het niet.\n\nAdam wel. Zijn waardigheid kwam niet voort uit een prestatie die hij had geleverd, maar uit wat hem simpelweg was meegegeven bij zijn schepping. Soms is waarde iets wat je al hebt, nog voor je iets hebt bewezen.",
        bronnen: ["Qur'an 2:31-33"],
        thema: "Waardigheid krijgen voor je iets hebt bewezen",
    },
    {
        profeet: "Isa عليه السلام",
        titel: "De tafel uit de hemel",
        tekst: "De discipelen van Isa عليه السلام vroegen hem om een tafel vol voedsel uit de hemel te laten neerdalen — als bevestiging, als iets om hun hart gerust te stellen. Isa bad erom, met de voorwaarde dat het een feestdag zou worden voor wie erna kwam en een teken van Allah.\n\nAllah waarschuwde er meteen bij: wie hierna nog ongelovig zou zijn, zou zwaar gestraft worden zoals niemand anders. Een teken vragen is makkelijk; het teken dat je vervolgens krijgt, brengt ook een verantwoordelijkheid met zich mee die je niet meer kunt teruggeven.",
        bronnen: ["Qur'an 5:112-115"],
        thema: "Vragen om een teken, en de verantwoordelijkheid die daarbij hoort",
    },
    {
        profeet: "Lut عليه السلام",
        titel: "Machteloos willen beschermen",
        tekst: "Toen er vreemdelingen — engelen, al wist Lut عليه السلام dat niet — bij hem aankwamen in een stad vol onrecht, voelde hij meteen de dreiging voor hen aankomen. Hij zei, radeloos: \"Was ik maar sterk genoeg tegen jullie, of kon ik me maar bij een machtige steunpilaar aansluiten.\"\n\nHij kon zijn gasten niet met eigen kracht beschermen. Pas daarna werd hem verteld wie ze werkelijk waren en dat hij zich geen zorgen meer hoefde te maken. Zijn wanhoop om iemand te beschermen die hij niet kon beschermen, was op zichzelf al oprecht — ook al lag de uitkomst uiteindelijk niet in zijn handen.",
        bronnen: ["Qur'an 11:77-80"],
        thema: "Je verantwoordelijk voelen voor wie je niet kan beschermen",
    },
    {
        profeet: "Nuh عليه السلام",
        titel: "Uitgelachen tijdens het bouwen",
        tekst: "Terwijl Nuh عليه السلام de ark bouwde — ver van enige zee, op droog land, op bevel van Allah — liepen de mensen van zijn volk voorbij en lachten hem uit. Een boot bouwen zonder water in de buurt moet als pure waanzin hebben geleken.\n\n\"Als jullie ons nu bespotten,\" antwoordde hij, \"zullen wij jullie ooit bespotten zoals jullie ons nu bespotten.\" Hij stopte niet met bouwen om de spot te laten ophouden. Het gelijk kwam er niet door zijn woorden, maar door gewoon door te gaan tot het klaar was.",
        bronnen: ["Qur'an 11:38"],
        thema: "Doorwerken terwijl mensen je uitlachen",
    },
    {
        profeet: "Ayyub عليه السلام",
        titel: "Een belofte houden zonder wreed te worden",
        tekst: "In een moeilijk moment had Ayyub عليه السلام gezworen zijn vrouw honderd slagen te geven voor iets wat ze had gedaan — verward door zijn eigen beproeving, terwijl zij hem juist al die jaren trouw had verzorgd. Hij wilde zijn woord houden, maar wilde haar ook geen pijn doen die ze niet verdiende.\n\nAllah gaf hem een uitweg: neem een bundel van honderd dunne twijgjes samen, en sla haar daarmee één keer, zacht. De eed was gehouden, zonder dat er wreedheid nodig was. Een belofte aan jezelf hoeft je principes niet boven mededogen te zetten.",
        bronnen: ["Qur'an 38:44"],
        thema: "Een belofte houden zonder wreed te worden",
    },
    {
        profeet: "Dawud عليه السلام",
        titel: "Vasten om de andere dag",
        tekst: "Ondanks zijn koningschap, zijn rijkdom en zijn stem waarmee volgens de overlevering zelfs bergen meezongen, koos Dawud عليه السلام voor een vorm van aanbidding die vol te houden was: de ene dag vasten, de andere dag niet. Geen uitputtende extremen, geen dagelijkse overbelasting.\n\n\"De meest geliefde vasten bij Allah is de vasten van Dawud,\" zei de Profeet ﷺ later over hem. Niet de zwaarste vorm van toewijding werd geprezen, maar de vorm die vol te houden was — jaar na jaar, zonder uit te doven.",
        bronnen: ["Sahih al-Bukhari 3420"],
        thema: "Een ritme kiezen dat je kan volhouden, niet het zwaarste",
    },
    {
        profeet: "Sulaiman عليه السلام en Dawud عليه السلام",
        titel: "Het oordeel over het kind",
        tekst: "Twee vrouwen kwamen bij Dawud عليه السلام met een geschil: een wolf had het kind van de een meegenomen, en nu twistten ze over wie de moeder was van het kind dat overbleef. Dawud oordeelde in het voordeel van de oudste vrouw.\n\nDe zaak kwam ook bij zijn zoon Sulaiman عليه السلام terecht, die met een ander idee kwam: \"Breng een mes, dan snijden we het kind doormidden, zodat jullie allebei een helft krijgen.\" De jongste vrouw riep meteen: \"Nee, doe het niet — geef het kind maar aan haar!\" Aan die reactie alleen al herkende Sulaiman wie de echte moeder was. Soms zie je de waarheid niet door harder te oordelen, maar door te kijken wie het meeste opoffert.",
        bronnen: ["Sahih al-Bukhari 3427"],
        thema: "Wijsheid die verder kijkt dan het voor de hand liggende",
    },
];
// ── Reality checks ───────────────────────────────────────────────────
// Doel is dankbaarheid en perspectief, niet "je klaagt voor niets" — zie
// v2 §motivatiehoek. Geen enkele optie hier mag voelen als een verplichte
// positieve conclusie; "niets specifiek" of "ik weet het niet" is bewust
// af en toe een geldige keuze.
export const realityChecks = [
    {
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
    {
        tekst: "Je obstakels voelen nu waarschijnlijk onoverkomelijk. Dat mag. Pijn is echt. Maar we vergeten vaak hoe zacht onze realiteit in werkelijkheid is.",
        interactie: {
            soort: "open",
            vraag: "Noem één comfortabel ding in je leven dat je nu als vanzelfsprekend beschouwt, maar wat een absolute luxe is in de menselijke geschiedenis.",
            placeholder: "Bijv: Schoon stromend water, een warm bed...",
        },
    },
    {
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
    {
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
    {
        tekst: "Je staart je nu misschien blind op een muur. Je ziet geen uitweg. Maar soms hoef je de uitweg niet te zien, alleen maar de volgende stap te zetten.",
        interactie: {
            soort: "open",
            vraag: "Wat is de absolute kleinste stap die je vandaag nog wél kunt zetten?",
            placeholder: "Ik ga nu...",
        },
    },
    {
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
    {
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
    {
        tekst: "Als het even niet goed voelt, is het makkelijk om alleen te zien wat er ontbreekt. Maar er zijn ook mensen die er gewoon zijn, zonder dat je erom hoeft te vragen.",
        interactie: {
            soort: "keuze",
            vraag: "Wie stond er de afgelopen tijd voor je klaar, ook al heb je het niet hardop gezegd?",
            opties: [
                "Iemand uit mijn familie",
                "Een vriend",
                "Iemand die ik nog niet had bedankt",
                "Niemand specifiek — en dat mag ook een eerlijk antwoord zijn",
            ],
        },
    },
    {
        tekst: "Slapen voelt als niets doen, dus we waarderen het zelden. Maar je lichaam repareert zichzelf elke nacht, zonder dat je er iets voor hoeft te doen.",
        interactie: {
            soort: "open",
            vraag: "Wanneer heb je voor het laatst echt uitgerust wakker geworden?",
            placeholder: "Dat was...",
        },
    },
    {
        tekst: "Ergens op dit moment heeft iemand geen idee waar zijn volgende maaltijd vandaan komt. Jij waarschijnlijk wel.",
        interactie: {
            soort: "keuze",
            vraag: "Wat heb je vandaag gegeten of gedronken zonder erbij na te denken?",
            opties: [
                "Schoon water uit de kraan",
                "Een warme maaltijd",
                "Iets dat ik gewoon lekker vond",
                "Genoeg, zonder erover te twijfelen",
            ],
        },
    },
    {
        tekst: "Kunnen lezen, iets kunnen opzoeken, iets kunnen leren — het voelt vanzelfsprekend zodra je het al kan.",
        interactie: {
            soort: "enkel",
            vraag: "Welke kennis of vaardigheid die je nu hebt, had je vroeger graag gekregen?",
            opties: [
                "Kunnen lezen en schrijven",
                "Een taal die ik nu spreek",
                "Iets wat ik mezelf heb aangeleerd",
                "Iets dat iemand mij geduldig heeft uitgelegd",
            ],
        },
    },
    {
        tekst: "We rennen vaak door onze omgeving zonder haar echt te zien.",
        interactie: {
            soort: "open",
            vraag: "Wanneer heb je voor het laatst bewust buiten stilgestaan, zonder telefoon?",
            placeholder: "Dat was...",
        },
    },
    {
        tekst: "Je hebt bijna alle kennis van de mensheid in je zak zitten. Dat is zo normaal geworden dat we het amper nog zien als iets bijzonders.",
        interactie: {
            soort: "keuze",
            vraag: "Wat heeft technologie je deze week makkelijker gemaakt, zonder dat je het opmerkte?",
            opties: [
                "Contact houden met iemand ver weg",
                "Iets kunnen opzoeken binnen seconden",
                "Sneller ergens komen",
                "Iets kunnen regelen zonder de deur uit te gaan",
            ],
        },
    },
    {
        tekst: "Niet elke fout krijgt een herkansing. Vandaag wel — dat is geen garantie voor morgen, wel voor nu.",
        interactie: {
            soort: "open",
            vraag: "Waar heb je onlangs een tweede kans gekregen die je niet vanzelfsprekend had moeten krijgen?",
            placeholder: "Bij...",
        },
    },
    {
        tekst: "Een plek hebben om naartoe te gaan met wat je bezighoudt — letterlijk of figuurlijk — is niet overal en voor iedereen vanzelfsprekend.",
        interactie: {
            soort: "enkel",
            vraag: "Wat geeft jou het meest houvast als het even tegenzit?",
            opties: [
                "Mijn geloof",
                "Mensen om mij heen",
                "Een gewoonte die me rust geeft",
                "Ik weet het nu even niet, en dat mag",
            ],
        },
    },
    {
        tekst: "We wachten vaak op \"het juiste moment\" alsof tijd onbeperkt is. Vandaag is in ieder geval geen moment dat je nog krijgt.",
        interactie: {
            soort: "open",
            vraag: "Wat zou je vandaag anders doen als je wist hoeveel tijd je nog echt hebt?",
            placeholder: "Ik zou...",
        },
    },
    {
        tekst: "Ergens vannacht kon iemand niet slapen van onveiligheid. De meesten van ons hebben daar vandaag niet één seconde bij stilgestaan.",
        interactie: {
            soort: "keuze",
            vraag: "Wat vind je vanzelfsprekend aan de plek waar je vannacht slaapt?",
            opties: [
                "Een deur die op slot kan",
                "Geen angst voor geluiden buiten",
                "Een dak dat niet lekt",
                "Dat ik er gewoon mag zijn",
            ],
        },
    },
    {
        tekst: "Eenzaamheid voelt alsof niemand er is. Maar \"niemand die het nu weet\" is niet hetzelfde als \"niemand\".",
        interactie: {
            soort: "open",
            vraag: "Wie zou het echt kunnen schelen als je dit weekend zou verdwijnen van de kaart?",
            placeholder: "Waarschijnlijk...",
        },
    },
    {
        tekst: "Niet iedereen die gisteren ging slapen, werd vanochtend wakker. Jij wel.",
        interactie: {
            soort: "keuze",
            vraag: "Wat ga je vandaag anders doen, nu je weet dat dit geen vanzelfsprekendheid was?",
            opties: [
                "Iemand een bericht sturen die ik lang niet heb gesproken",
                "Iets doen dat ik al weken uitstel",
                "Gewoon even stilstaan, meer niet",
                "Niets speciaals — vandaag gewoon goed leven",
            ],
        },
    },
    {
        tekst: "Pijn en ongemak vragen altijd om aandacht. De momenten waarop je lichaam gewoon meewerkt, vragen daar nooit om — dus die zie je bijna nooit.",
        interactie: {
            soort: "enkel",
            vraag: "Welke simpele beweging kan je vandaag nog steeds gewoon maken, zonder erbij na te denken?",
            opties: [
                "Opstaan uit bed",
                "Een trap oplopen",
                "Iets optillen",
                "Diep ademhalen",
            ],
        },
    },
    {
        tekst: "Een groep mensen om je heen hebben die weet wie je bent, is niet overal vanzelfsprekend.",
        interactie: {
            soort: "open",
            vraag: "Bij welke groep mensen voel jij je het meest jezelf?",
            placeholder: "Bij...",
        },
    },
    {
        tekst: "Kunnen zeggen wat je denkt, hardop, zonder daar meteen problemen van te krijgen, is een vrijheid die niet overal bestaat.",
        interactie: {
            soort: "enkel",
            vraag: "Waar zou je vandaag iets kunnen zeggen dat je nu inslikt?",
            opties: [
                "Tegen iemand thuis",
                "Op mijn werk of school",
                "Tegen mezelf, in mijn hoofd",
                "Nergens — en dat is ook een antwoord",
            ],
        },
    },
    {
        tekst: "We kijken vaak vooruit naar wat nog moet gebeuren. Maar er is ook al iets gebeurd dat de moeite waard was.",
        interactie: {
            soort: "open",
            vraag: "Wat is een herinnering die je nog steeds blij maakt als je eraan denkt?",
            placeholder: "Die keer dat...",
        },
    },
    {
        tekst: "Een moment zonder herrie in je hoofd voelt zeldzaam. Maar het is er vaker dan je denkt — je ziet het alleen niet als \"iets\".",
        interactie: {
            soort: "keuze",
            vraag: "Wanneer was je hoofd voor het laatst even helemaal stil?",
            opties: [
                "Net voor ik in slaap viel",
                "Tijdens iets waar ik in opging",
                "Buiten, ergens onderweg",
                "Ik weet het even niet, en dat mag",
            ],
        },
    },
    {
        tekst: "We meten onszelf vaak af tegen waar we nog naartoe moeten. Maar er is ook een afstand die je al hebt afgelegd.",
        interactie: {
            soort: "open",
            vraag: "Waarin ben je dit jaar al veranderd, ook al merk je het zelf amper?",
            placeholder: "Ik ben...",
        },
    },
    {
        tekst: "Sociale media laat je vooral zien wat je nog niet hebt. Bijna nooit wat je al wel hebt.",
        interactie: {
            soort: "enkel",
            vraag: "Met wie vergelijk je jezelf het meest, en wat kost dat je?",
            opties: [
                "Iemand die ik ken",
                "Iemand die ik alleen online volg",
                "Een oudere versie van mezelf",
                "Ik doe dit eigenlijk niet zo vaak",
            ],
        },
    },
    {
        tekst: "Niet elke fase van je leven hoeft hetzelfde te voelen als de vorige. Waar je nu in zit, mag ook gewoon zijn wat het is.",
        interactie: {
            soort: "open",
            vraag: "Wat is fijn aan precies deze periode van je leven, ook al is het niet perfect?",
            placeholder: "Op dit moment...",
        },
    },
    {
        tekst: "Iets kwijtraken doet pijn, en die pijn hoeft niet weg te gaan om verder te kunnen. Maar er is vaak ook iets dat is gebleven.",
        interactie: {
            soort: "open",
            vraag: "Wat heeft iemand of iets dat je kwijt bent je toch achtergelaten, dat nog steeds bij je is?",
            placeholder: "Wat is gebleven...",
        },
    },
    {
        tekst: "De grote dingen in het leven gebeuren zelden. De kleine, prettige dingen gebeuren bijna elke dag — als je ze opmerkt.",
        interactie: {
            soort: "keuze",
            vraag: "Wat was vandaag een klein moment dat gewoon prettig was?",
            opties: [
                "Iets dat ik at of dronk",
                "Een lied of geluid",
                "Even niks moeten",
                "Een berichtje van iemand",
            ],
        },
    },
    {
        tekst: "De dingen die het meest de moeite waard zijn, kosten vaak niets. We waarderen ze daarom soms het minst.",
        interactie: {
            soort: "enkel",
            vraag: "Wat heb je vandaag gratis gekregen dat je normaal niet als een cadeau ziet?",
            opties: [
                "Zonlicht of frisse lucht",
                "Een gesprek",
                "Muziek",
                "Stilte",
            ],
        },
    },
    {
        tekst: "Iets kunnen dat voor jou vanzelfsprekend voelt, is voor iemand anders misschien een droom.",
        interactie: {
            soort: "open",
            vraag: "Wat kan jij dat je zelf niet meer bijzonder vindt, maar dat het wel is?",
            placeholder: "Ik kan...",
        },
    },
    {
        tekst: "Niet iedereen die je hielp opgroeien, deed dat perfect. Maar er was waarschijnlijk wel íémand die er was.",
        interactie: {
            soort: "open",
            vraag: "Wie heeft, ondanks alles, wel zijn best voor je gedaan?",
            placeholder: "...",
        },
    },
    {
        tekst: "Een plek hebben waar je de deur achter je dicht kan doen en jezelf kan zijn, is niet overal en voor iedereen vanzelfsprekend.",
        interactie: {
            soort: "keuze",
            vraag: "Waar voel jij je het meest jezelf?",
            opties: [
                "Thuis, letterlijk",
                "Bij bepaalde mensen",
                "Ergens buiten",
                "Nog niet echt ergens, en dat mag ook",
            ],
        },
    },
    {
        tekst: "Zomaar ergens naartoe kunnen gaan wanneer je wil, is een vrijheid die niet iedereen heeft.",
        interactie: {
            soort: "open",
            vraag: "Waar zou je nu naartoe kunnen lopen of rijden, gewoon omdat je het kan?",
            placeholder: "Ik zou kunnen...",
        },
    },
    {
        tekst: "Schoonheid is er vaak gewoon, ook op een gewone dag — we lopen er meestal langs zonder te kijken.",
        interactie: {
            soort: "open",
            vraag: "Wat was het laatste mooie dat je hebt gezien zonder ernaar te zoeken?",
            placeholder: "Dat was...",
        },
    },
    {
        tekst: "Je leest dit nu, met aandacht, uit vrije keuze. Dat is al meer dan veel mensen op dit moment vergund is.",
        interactie: {
            soort: "enkel",
            vraag: "Wat ga je met de rest van vandaag doen, nu je hier even stil hebt gestaan?",
            opties: [
                "Gewoon verder, iets lichter",
                "Iets goedmaken of oppakken",
                "Niets veranderen — het was al goed genoeg",
                "Ik weet het nog niet, en dat mag",
            ],
        },
    },
];
export function dagVanHetJaar(datum = new Date()) {
    const start = Date.UTC(datum.getFullYear(), 0, 0);
    const huidig = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate());
    return Math.floor((huidig - start) / 86400000);
}
/** Elk onderdeel schuift onafhankelijk door zijn eigen lijst — zie de
 * uitleg boven aan dit bestand voor waarom dat geen vast trio is. */
export function motivatiehoekVoorVandaag(datum = new Date()) {
    const dagIndex = dagVanHetJaar(datum) - 1;
    return {
        quote: motivatieQuotes[dagIndex % motivatieQuotes.length],
        verhaal: profetenVerhalen[dagIndex % profetenVerhalen.length],
        realityCheck: realityChecks[dagIndex % realityChecks.length],
    };
}
