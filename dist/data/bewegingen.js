// bewegingen.ts — vertaling van bewegingen.yaml. De lange onderbouwing staat
// in het bronbestand en in het projectarchief; hier de herschreven,
// bronteken-vrije versie die de app wél laat zien — de concrete reden
// waarom dít precies helpt, niet de generieke "hier is onderzoek naar
// gedaan" (6 sept 2026, na verzoek om voor- en nadelen zichtbaar te maken).
//
// v1.1 (8 sept 2026): de zeven bewegingen uit Onderzoek-W14-W19.md zijn
// hieronder ingebouwd — zie het aparte blok vlak boven de sluit-`]`.
export const bewegingen = [
    {
        id: "adem-lange-uitademing",
        titel: "Ademen met lange uitademing",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "algemeen — kalmerend",
        kosten: { tijdMinuten: [2, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Eén minuut: vier tellen in, zes tellen uit.",
        script: "Adem een paar keer wat langer uit dan in. Vier tellen in, zes tellen uit. Twee minuten, niet langer.",
        herkomst: [
            {
                label: "W",
                // Natuurcorrectie/bewijsklasse-fixes (Audit-5-september-2026.md,
                // "twee notities gebruiken medische mechanismetaal die v2.1 §5 en
                // v2.3 §4 verbieden"): deze regel noemde eerder hartslag/bloeddruk.
                // Herschreven naar wat het onderzoek eerlijk draagt: een bescheiden
                // maar consistent, voelbaar effect — geen fysiologisch mechanisme.
                regel: "Rustig ademen met een langere uitademing heeft een bescheiden maar consistent, direct voelbaar kalmerend effect, in meerdere gecontroleerde onderzoeken teruggevonden — en scoorde in een directe vergelijking op stemming beter dan even lang mediteren.",
            },
        ],
        pastBij: ["gespannen", "gejaagd", "overprikkeld", "paniekerig", "onrustig", "rusteloos"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "vijf-minuten-naar-buiten",
        titel: "Vijf minuten naar buiten",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "buiten, licht en natuur",
        kosten: { tijdMinuten: [2, 10], energie: "laag", drempel: "klein" },
        minimumversie: "Voordeur uit, om het blok. Twee minuten.",
        script: "Naar buiten, vijf minuten. Geen doel, geen route. Terugkomen mag zodra het genoeg is.",
        herkomst: [
            {
                label: "W",
                // Natuurcorrectie (6 sept 2026, bewegingen.yaml): v2.2 §6.3
                // Correctie 1 kwam terug op de eigen v1.0-claim — in een grotere
                // netwerk-meta-analyse presteerden natuurgerichte interventies niet
                // significant beter dan controle. Die eerlijke nuance stond hier
                // eerder niet, en de zin noemde bovendien een verboden medisch
                // mechanisme (amygdala/"hersengebied dat stress verwerkt" — v2.1
                // §5, v2.3 §4). Beide gerepareerd.
                regel: "Een korte tijd in het groen hangt in losse onderzoeken samen met minder acute angst en minder piekeren, het sterkst vlak na afloop. Eerlijk gezegd: in een grotere vergelijking van welzijnsinterventies deed natuur het niet aantoonbaar beter dan een gewone controlegroep — prettig, goedkoop en risicoloos, maar niet de sterkste hefboom hier. Bewegen (zie de wandeling hieronder) is dat wel.",
            },
        ],
        pastBij: ["gespannen", "gejaagd", "overprikkeld", "rusteloos", "leeg", "lusteloos", "dof", "piekerend", "malend"],
        pastNietBij: ["uitgeput"],
        nooitAanbiedenAls: [],
    },
    {
        id: "uitschrijven-zonder-filter",
        titel: "Uitschrijven zonder filter",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [3, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Drie minuten, ongelezen, daarna weg of scheuren.",
        script: "Schrijf drie minuten op wat er zit, precies zoals het is. Niemand leest het. Daarna mag je het weggooien.",
        herkomst: [
            {
                label: "W",
                regel: "Iets in woorden vastleggen vermindert in herhaald onderzoek de lichamelijke onrust die een gevoel met zich meebrengt — het werkt het best als je erna ook kiest wat je ermee doet, niet als eindpunt op zich.",
            },
        ],
        pastBij: ["boos", "gespannen", "gejaagd", "overprikkeld", "verdrietig"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "tien-minuten-wandelen-groen",
        titel: "Tien minuten wandelen, liefst groen",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "bewegen",
        kosten: { tijdMinuten: [10, 20], energie: "midden", drempel: "klein" },
        minimumversie: "Vijf minuten, rond het blok, stevig tempo.",
        script: "Tien minuten wandelen. Stevig tempo, geen doel. Een park of een straat met bomen als dat kan — hoeft niet.",
        herkomst: [
            {
                label: "W",
                // Natuurcorrectie (6 sept 2026, bewegingen.yaml): deze regel
                // beweerde dat "in het groen" apart nog iets extra's doet tegen
                // piekeren — dat is precies de claim die v2.2 §6.3 Correctie 1
                // terugdraait (natuurgerichte interventies niet significant beter
                // dan controle in een grotere meta-analyse). Bewegen zelf blijft
                // het sterke effect; "liefst groen" is nu een voorkeur, geen
                // apart bewezen extra.
                regel: "Bewegen heeft een van de weinige onderzoekseffecten die betrouwbaar en behoorlijk fors opgaan tegen somberheid en angst — een van de krachtigste dingen in deze hele bibliotheek. Of het specifiek in het groen doen daar nog iets bovenop doet, is minder hard bewijs: in een grotere vergelijking deed natuur het niet aantoonbaar beter dan een controlegroep. \"Liefst groen\" is dus een voorkeur, geen voorwaarde.",
            },
        ],
        pastBij: ["leeg", "lusteloos", "somber", "dof", "moe", "piekerend", "malend", "verward"],
        pastNietBij: ["uitgeput", "op"],
        nooitAanbiedenAls: ["drie_zware_dagen_en_richting"],
    },
    {
        id: "bericht-sturen",
        titel: "Iemand een bericht sturen",
        soort: "nu",
        streek: "verbinding",
        domeinLabel: "verbinding",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén zin, aan één persoon, nu.",
        script: "Stuur iemand één zin. Hoe het gaat, of gewoon dat je aan hem of haar denkt. Meer hoeft niet.",
        herkomst: [
            {
                label: "W",
                regel: "Iets goeds doen voor een ander verhoogt aantoonbaar je eigen welbevinden — in een groot gecontroleerd onderzoek verlaagde vriendelijkheid naar anderen toe depressie, angst én eenzaamheid, via het gevoel van verbondenheid.",
            },
        ],
        pastBij: ["leeg", "eenzaam", "somber", "lusteloos", "dankbaar"],
        pastNietBij: ["boos", "overprikkeld"],
        nooitAanbiedenAls: ["net_overprikkeld_of_sociaal_uitgeput"],
    },
    {
        id: "benoemen-en-parkeren",
        titel: "Benoemen en parkeren",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [3, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Schrijf op wat er rondspookt. Kies één moment vandaag om erop terug te komen.",
        script: "Schrijf op wat er blijft rondspoken — kort, geen analyse. Kies dan een moment vandaag waarop je het weer oppakt. Tot dan mag het hier blijven liggen.",
        herkomst: [
            {
                label: "W",
                regel: "Ergens anders naar leren kijken werkt over allerlei culturen heen beter dan een gevoel wegduwen — maar pas als de eerste onrust al wat gezakt is, en dat is precies waarom dit hier pas als tweede stap komt.",
            },
        ],
        pastBij: ["piekerend", "malend", "onzeker", "besluiteloos", "wantrouwend", "verward"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "zelfcompassie-na-misstap",
        titel: "Zelfcompassie na een misstap",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén zin: wat zou je tegen een vriend zeggen die dit overkwam?",
        script: "Wat is er precies gebeurd — in feiten, niet in oordeel? En wat zou je tegen een vriend zeggen die je dit vertelde?",
        herkomst: [
            {
                label: "W",
                regel: "Mild zijn voor jezelf na een misstap verlaagt zelfkritiek met een middelgroot effect, en werkt in onderzoek beter dan streng voor jezelf zijn.",
            },
            {
                label: "I",
                regel: "Sluit aan bij tawba: opnieuw beginnen zonder jezelf te veroordelen — apart van de wetenschappelijke reden hierboven, nooit ermee vermengd.",
            },
        ],
        pastBij: ["schuldig", "zelfkritisch", "somber", "verdrietig"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "tawakkul-route",
        titel: "Tawakkul-route bij piekeren",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "zingeving en geloof",
        kosten: { tijdMinuten: [1, 2], energie: "laag", drempel: "klein" },
        minimumversie: "Eén regel lezen, één moment stil.",
        script: "Wat lag binnen jouw macht, heb je gedaan of ga je nog doen. De rest is niet aan jou. Eén moment om dat te laten landen.",
        herkomst: [
            {
                label: "I",
                regel: "Overgave na inspanning: doen wat binnen je macht ligt, en de uitkomst loslaten — nooit als vervanging van actie, alleen als aanvulling erop.",
            },
            {
                label: "W",
                regel: "Bij mensen die tawakkul al beoefenen, hangt een grotere mate ervan samen met minder angst en somberheid; een bredere blik op religieuze overgave aan een hogere macht in het algemeen vindt hetzelfde patroon. Dit is samenhang uit onderzoek bij anderen, geen bewezen effect — de app belooft dus niet dat dit jouw angst vermindert.",
            },
        ],
        pastBij: ["piekerend", "malend", "onzeker", "machteloos"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "savoring-zestig-seconden",
        titel: "Savoring: zestig seconden blijven",
        soort: "nu",
        streek: "geest",
        domeinLabel: "algemeen — verdiepend",
        kosten: { tijdMinuten: [1, 2], energie: "laag", drempel: "klein" },
        minimumversie: "Dertig seconden: waar voel je het, en wat maakt het goed?",
        script: "Blijf hier nog even. Waar in je lijf voel je dit? Wat maakt het precies goed? Een minuut is genoeg.",
        herkomst: [
            {
                label: "W",
                regel: "Bewust een minuut blijven stilstaan bij iets goeds bouwt in onderzoek merkbaar duurzamere veerkracht op — een van de best herhaalde bevindingen binnen de positieve psychologie.",
            },
        ],
        pastBij: ["rustig", "tevreden", "vredig", "licht", "ontspannen", "dankbaar"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "dankbaarheid-naar-persoon",
        titel: "Dankbaarheid uitspreken naar een persoon",
        soort: "nu",
        streek: "verbinding",
        domeinLabel: "verbinding",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén zin naar één persoon: waarvoor ben je hem of haar dankbaar?",
        script: "Aan wie denk je nu met dankbaarheid? Zeg het hem of haar — één zin, nu, niet 'ooit nog eens'.",
        herkomst: [
            {
                label: "W",
                regel: "Dankbaarheid uiten hangt in onderzoek over allerlei culturen samen met meer welbevinden, en specifiek met minder somberheid en angst.",
            },
            {
                label: "I",
                regel: "Sluit aan bij shukr — dankbaarheid als aanbidding, niet alleen als techniek voor een beter gevoel. Zie de aparte beweging hieronder voor die islamitische vorm; dit hier is de seculiere variant, gericht op een concreet persoon.",
            },
        ],
        pastBij: ["dankbaar", "tevreden", "vredig", "blij"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "vijftien-minuten-moeilijke-ding",
        titel: "Vijftien minuten aan het moeilijke ding",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "groei en richting",
        kosten: { tijdMinuten: [5, 15], energie: "hoog", drempel: "groot" },
        minimumversie: "Vijf minuten, en dan mag je stoppen — echt.",
        script: "Dit is het moment waarop dit haalbaar is. Vijftien minuten aan het ding dat je uitstelt. Na vijf minuten mag je stoppen als je wilt.",
        herkomst: [
            {
                label: "W",
                regel: "Weer in contact komen met iets dat je uitstelt is een van de sterkst onderbouwde manieren om neerslachtigheid te doorbreken — het voelt zelden meteen prettig, en dat is hier ook niet het doel.",
            },
        ],
        pastBij: ["gemotiveerd", "vol", "trots", "hoopvol", "blij", "rustig"],
        pastNietBij: ["leeg", "uitgeput", "overprikkeld"],
        nooitAanbiedenAls: ["drie_zware_dagen_en_richting"],
    },
    {
        id: "shukr-drie-dingen",
        titel: "Shukr: dankbaarheid als aanbidding",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "zingeving en geloof",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén ding, kort.",
        script: "Drie dingen, klein of groot, waar je dankbaar voor bent. Geen uitleg nodig.",
        herkomst: [
            {
                label: "I",
                regel: "Dankbaarheid als vorm van aanbidding, niet als techniek voor een beter gevoel — dit staat los van de wetenschappelijke dankbaarheidsbron bij de andere beweging hierboven, en wordt er nooit mee vermengd.",
            },
        ],
        pastBij: ["dankbaar", "vredig", "rustig", "licht", "verdrietig"],
        pastNietBij: [],
        nooitAanbiedenAls: ["direct_na_iets_pijnlijks"],
    },
    // ═════════════════════════════════════════════════════════════════
    // v1.1-BLOK — de zeven bewegingen uit v2.2 §11, ingebouwd 8 september
    // 2026 na uitvoering van de onderzoekssporen W14–W19. Volledige
    // onderbouwing met bewijsklassen en grenzen: Onderzoek-W14-W19.md en
    // content/bewegingen.yaml. Hun plek in de selectie staat in
    // selectie.ts / selection.ts (§v1.1).
    // ═════════════════════════════════════════════════════════════════
    {
        id: "afstand-nemen-van-jezelf",
        titel: "Afstand nemen van jezelf",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén zin, met je eigen naam erin in plaats van 'ik'.",
        script: "Stel jezelf de vraag met je eigen naam erin, alsof je hem aan iemand anders stelt. Waar gaat dit eigenlijk over? Voelt dat te gek? Neem dan de tijd in plaats van de naam: hoe kijk je hier over een jaar op terug?",
        herkomst: [
            {
                label: "W",
                regel: "Je eigen naam gebruiken in plaats van 'ik' verlaagt aantoonbaar de spanning bij iets lastigs, en is een van de goedkoopste vormen van afstand nemen die er zijn — bijna moeiteloos. Bij schuld en schaamte werkt het duidelijk minder goed.",
            },
        ],
        pastBij: ["piekerend", "malend", "onzeker", "besluiteloos", "verward", "gespannen", "gejaagd"],
        pastNietBij: ["schuldig", "zelfkritisch", "dankbaar", "tevreden", "vredig", "licht", "blij", "trots", "vol"],
        nooitAanbiedenAls: [],
    },
    {
        id: "vergeven-eerste-stap",
        titel: "Vergeven, de eerste stap",
        soort: "nu",
        streek: "verbinding",
        domeinLabel: "verbinding",
        kosten: { tijdMinuten: [5, 10], energie: "midden", drempel: "groot" },
        minimumversie: "Twee regels: wat er gebeurd is, en wat het je gekost heeft. Meer hoeft nu niet.",
        script: "Schrijf op wat er gebeurd is — in feiten. Dan wat het je gekost heeft. En dan één zin: wat zou het schelen als je dit niet meer meedroeg? Dit gaat niet over contact opnemen en niet over goedpraten. Niet vergeven mag ook.",
        herkomst: [
            {
                label: "W",
                regel: "Vergevingsoefeningen verhogen vergeving en verbeteren somberheid, angst en hoop, over ruim vijftig onderzoeken heen — al werkten in datzelfde onderzoek langere programma's van uren tot weken beter. Wat hier staat is de eerste stap daaruit, niet het hele programma.",
            },
            {
                label: "I",
                regel: "Sluit aan bij ʿafw: kwijtschelden zonder dat de ander erom vraagt en zonder het onrecht goed te praten — apart van de wetenschappelijke reden hierboven, nooit ermee vermengd.",
            },
        ],
        pastBij: ["wantrouwend", "malend", "piekerend", "verdrietig", "onzeker"],
        pastNietBij: ["boos", "geirriteerd", "paniekerig", "overprikkeld", "uitgeput", "op"],
        nooitAanbiedenAls: [],
    },
    {
        id: "omhoogkijken",
        titel: "Even omhoogkijken",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "buiten, licht en natuur",
        kosten: { tijdMinuten: [2, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Voordeur uit, hoofd omhoog, één minuut.",
        script: "Ga even naar buiten en kijk omhoog. Helder of bewolkt maakt niet uit — het gaat om het omhoogkijken. Kan dat niet: een beeld van iets weids op je scherm doet hetzelfde werk.",
        herkomst: [
            {
                label: "W",
                regel: "Een korte ontzagoefening verlaagde in onderzoek stress en somberheid en verhoogde welbevinden — maar had geen enkel aantoonbaar effect op angst, en het bekende 'kleine zelf'-gevoel bleek in vervolgonderzoek maar inconsistent op te treden.",
            },
            {
                label: "I",
                regel: "Sluit aan bij tafakkur: kijken naar wat gemaakt is als vorm van bezinning — apart van de wetenschappelijke reden hierboven, nooit ermee vermengd.",
            },
        ],
        pastBij: ["rusteloos", "onrustig", "dof", "lusteloos", "leeg", "rustig", "vredig", "dankbaar", "hoopvol"],
        pastNietBij: ["paniekerig", "gespannen", "overprikkeld"],
        nooitAanbiedenAls: [],
    },
    {
        id: "aanname-omdraaien",
        titel: "De aanname omdraaien",
        soort: "nu",
        streek: "verbinding",
        domeinLabel: "verbinding",
        kosten: { tijdMinuten: [3, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Eén naam, één zin: wat neem je aan dat die persoon van je vindt?",
        script: "Denk aan één iemand. Wat neem je aan dat hij of zij van jou vindt? En hoe zeker weet je dat eigenlijk? Eén ronde is genoeg — laat het hier, of stuur die persoon iets.",
        herkomst: [
            {
                label: "W",
                regel: "Vertekende sociale gedachten aanpakken kwam in vergelijkend onderzoek naar voren als de sterkste van vier aanpakken tegen eenzaamheid — al berust dat op maar drie kleine studies. Van de zeven nieuwe bewegingen is dit de zwakst onderbouwde.",
            },
        ],
        pastBij: ["eenzaam", "onzeker", "wantrouwend", "somber"],
        pastNietBij: ["boos", "overprikkeld", "paniekerig"],
        nooitAanbiedenAls: ["net_overprikkeld_of_sociaal_uitgeput"],
    },
    {
        id: "wandelen-met-een-vraag",
        titel: "Wandelen met één vraag",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "bewegen",
        kosten: { tijdMinuten: [10, 20], energie: "midden", drempel: "klein" },
        minimumversie: "Vijf minuten lopen met één vraag in je hoofd. Een antwoord hoeft niet.",
        script: "Neem één vraag mee naar buiten en loop ermee. Niet erover redeneren — gewoon lopen, en de vraag laten meelopen. Het lopen doet het meeste werk.",
        herkomst: [
            {
                label: "W",
                regel: "Beweging gecombineerd met een psychologische oefening verslaat beweging alleen, met een groot effect op somberheid over achttien onderzoeken heen. Eerlijke nuance: de combinatie deed het niet aantoonbaar beter dan de psychologische oefening alléén — het lopen doet hier het werk, de vraag lift mee.",
            },
        ],
        pastBij: ["piekerend", "malend", "besluiteloos", "verward", "onzeker", "lusteloos", "dof", "somber"],
        pastNietBij: ["uitgeput", "op", "overprikkeld"],
        nooitAanbiedenAls: [],
    },
    {
        id: "lopen-met-dhikr",
        titel: "Lopen met dhikr",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "zingeving en geloof",
        kosten: { tijdMinuten: [10, 20], energie: "midden", drempel: "klein" },
        minimumversie: "Vijf minuten lopen, één zin die meeloopt.",
        script: "Loop, en laat één zin meelopen op je adem. Geen aantal, geen doel. Merk je dat je alleen nog aan het lopen bent, dan is dat ook goed.",
        herkomst: [
            {
                label: "W",
                regel: "Alleen over het lopen: beweging blijft een van de best onderbouwde hefbomen in deze bibliotheek, en gekoppeld aan iets anders werkt het beter dan beweging alleen. Wat er tijdens het lopen in je hoofd omgaat is in dit onderzoek nooit dhikr geweest — die koppeling is niet onderzocht.",
            },
            {
                label: "I",
                regel: "Dhikr als herinnering, meelopend op de adem, zonder aantal en zonder doel — apart van de wetenschappelijke reden hierboven, nooit ermee vermengd.",
            },
        ],
        pastBij: ["onrustig", "piekerend", "malend", "leeg", "lusteloos", "dankbaar", "hoopvol", "vredig"],
        pastNietBij: ["uitgeput", "op", "overprikkeld"],
        nooitAanbiedenAls: [],
    },
    {
        id: "bewegen-met-een-beeld",
        titel: "Bewegen met een beeld",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "groei en richting",
        kosten: { tijdMinuten: [10, 20], energie: "hoog", drempel: "groot" },
        minimumversie: "Vijf minuten bewegen met één beeld van wie je aan het worden bent.",
        script: "Beweeg — lopen, fietsen, de trap op. Houd één beeld vast van wie je aan het worden bent, en één ding dat daarbij in de weg staat. Het bewegen draagt het, niet andersom.",
        herkomst: [
            {
                label: "W",
                regel: "Beweging gekoppeld aan een psychologische oefening verslaat beweging alleen, en het beeldwerk hier — een beeld van wat je wilt naast het obstakel dat ertussen staat — is dezelfde oefening als in het weekmoment, maar dan lopend. Die twee zijn nooit samen onderzocht: de losse delen staan stevig, de combinatie is een redenering.",
            },
        ],
        pastBij: ["gemotiveerd", "vol", "hoopvol", "trots", "blij", "rustig"],
        pastNietBij: ["leeg", "uitgeput", "op", "overprikkeld", "somber", "niets"],
        nooitAanbiedenAls: ["drie_zware_dagen_en_richting"],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v1.2 (8 sept 2026): twee bewegingen uit Onderzoek-Dopamine-Ochtend.md.
    // Beide alleen bereikbaar via selectie.yaml §v1.2 (B_activeren, bij2min).
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "korte-koude-douche",
        titel: "Een korte koude douche",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "activering — koude blootstelling",
        kosten: { tijdMinuten: [1, 3], energie: "midden", drempel: "groot" },
        minimumversie: "Tien seconden koud water aan het einde van je gewone douche.",
        script: "Zet aan het einde van je douche het water even helemaal koud. Blijf staan tot je ademhaling weer rustig wordt, dan pas eruit.",
        herkomst: [
            {
                label: "W",
                regel: "Eén kleine studie vond na een uur onderdompeling in koud water een sterke stijging van dopamine en adrenaline in het bloed, die uren aanhield. Belangrijke kanttekening: dat is bloed, niet je hersenen — het is vooral een teken dat je lichaam in de actiestand schiet, geen bewijs voor een beloningsgevoel. Een grotere studie naar koud douchen vond minder ziekteverzuim, maar niet minder vaak ziek worden — het effect zat in energie en volhouden, niet in een meetbare gezondheidsuitkomst.",
            },
        ],
        pastBij: ["leeg", "lusteloos", "dof", "moe", "somber"],
        pastNietBij: ["uitgeput", "op", "overprikkeld", "paniekerig", "gespannen", "gejaagd"],
        nooitAanbiedenAls: [],
        medischeGrens: [
            "Niet bij hart- en vaatziekten, bij zwangerschap, of als je bloeddruk niet onder controle is — bij twijfel: niet doen, of eerst een arts.",
            "Begin klein: aan het einde van een gewone douche, niet met een volledige onderdompeling.",
        ],
    },
    {
        id: "ochtendlicht-zien",
        titel: "Ochtendlicht zien",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "slaap en herstel — ritme",
        kosten: { tijdMinuten: [2, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Eén minuut voor het raam, gordijnen open.",
        script: "Ga binnen het eerste uur na het wakker worden even naar buiten, of voor een raam zonder zonnebril. Geen minimum aantal minuten — het gaat om het moment, niet om de duur.",
        herkomst: [
            {
                label: "W",
                regel: "Licht vroeg op de dag helpt je interne klok vroeger te lopen, wat 's avonds makkelijker inslapen geeft — dat is stevig onderzocht. Minder stevig: dat het je die ochtend zelf al vrolijker maakt. Dat belooft deze beweging dan ook niet.",
            },
        ],
        pastBij: ["lusteloos", "dof", "moe", "somber", "leeg"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v1.3 (9 sept 2026): muhasabah-twee-vragen, uit Onderzoek-I2-Muhasabah-en-
    // Waswas.md. Alleen bereikbaar via selectie.yaml §v1.3 (D_verdiepen_laag).
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "muhasabah-twee-vragen",
        titel: "Muhasabah: twee vragen terugkijken",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "zingeving en geloof",
        kosten: { tijdMinuten: [2, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén vraag: wat ging vandaag goed?",
        script: "Twee vragen, kort. Wat ging vandaag goed, in lijn met wie je wilt zijn? En is er één klein ding dat je morgen anders zou doen? Wat nu door je hoofd gaat maar dat je niet uitspreekt of erop handelt, telt niet mee — dat is een oud onderscheid, geen nieuw excuus.",
        herkomst: [
            {
                label: "I",
                regel: "Kort bij jezelf te rade gaan aan het einde van de dag — niet als zelfkritiek maar als zuivering, en uitdrukkelijk begrensd tot twee vragen, nooit een uitputtende lijst van tekortkomingen.",
            },
        ],
        pastBij: ["rustig", "vredig", "tevreden", "dankbaar"],
        pastNietBij: [
            "piekerend",
            "malend",
            "onzeker",
            "schuldig",
            "zelfkritisch",
            "besluiteloos",
            "wantrouwend",
            "verward",
            "gespannen",
            "gejaagd",
            "overprikkeld",
            "paniekerig",
            "somber",
            "verdrietig",
            "machteloos",
        ],
        nooitAanbiedenAls: ["direct_na_iets_pijnlijks"],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v1.4 (9 sept 2026): sayyid-al-istighfar, uit Onderzoek-I3-Dua-en-Dhikr.md.
    // Alleen bereikbaar via selectie.yaml §v1.4 (C_ordenen en D_verdiepen_laag).
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "sayyid-al-istighfar",
        titel: "Sayyid al-Istighfar",
        soort: "nu",
        streek: "ziel",
        domeinLabel: "zingeving en geloof",
        kosten: { tijdMinuten: [1, 2], energie: "laag", drempel: "klein" },
        minimumversie: "De betekenis lezen is genoeg als het Arabisch niet lukt.",
        script: "Eén smeekbede, in je eigen tempo — Arabisch als dat lukt, anders de betekenis: 'O Allah, U bent mijn Heer, er is geen god dan U... Ik erken mijn zonde. Vergeef mij, want niemand vergeeft zonden behalve U.' Eén keer is genoeg.",
        herkomst: [
            {
                label: "I",
                regel: "De 'heer der vergevingsverzoeken': één vaste, afgeronde smeekbede om vergeving — geen open zelfonderzoek, dus breder inzetbaar dan muhasabah, ook naast stilstaan bij een misstap.",
            },
        ],
        pastBij: ["schuldig", "zelfkritisch", "somber", "verdrietig", "rustig", "vredig"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v25 (10 sept 2026): drie getimede ademhalingen naast de bestaande "Ademen
    // met lange uitademing" (die blijft ongewijzigd staan) -- toonBeweging() in
    // app.ts herkent deze drie id's en toont er een echte, seconde-voor-seconde
    // meelopende cirkel bij in plaats van de gewone stap-lezer.
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "box-ademhaling",
        titel: "Box-ademhaling (4-4-4-4)",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "algemeen — kalmerend, op een vaste tel",
        kosten: { tijdMinuten: [2, 4], energie: "laag", drempel: "klein" },
        minimumversie: "Twee rondes is al genoeg om te voelen wat het doet.",
        script: "Vier tellen in, vier tellen vasthouden, vier tellen uit, vier tellen vasthouden. Het scherm telt vanzelf mee.",
        herkomst: [
            {
                label: "W",
                regel: "Ademen op een vast, gelijkmatig ritme met korte pauzes na in- en uitademen wordt veel gebruikt om snel te kalmeren onder druk, onder meer in training voor hulpverleners. Het bouwt voort op hetzelfde effect als rustiger, trager ademen in het algemeen — hard bewijs voor precies déze 4-4-4-4-verhouding is dunner dan voor een langere uitademing alleen (zie 'Ademen met lange uitademing').",
            },
        ],
        pastBij: ["gespannen", "gejaagd", "overprikkeld", "paniekerig", "onrustig", "rusteloos"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "fysiologische-zucht",
        titel: "De fysiologische zucht",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "algemeen — snel kalmerend",
        kosten: { tijdMinuten: [1, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén keer is al genoeg om te voelen wat het doet.",
        script: "Twee keer achter elkaar inademen door je neus — een gewone teug, en daarbovenop nog een klein slokje lucht. Dan lang en langzaam uitademen door je mond.",
        herkomst: [
            {
                label: "W",
                regel: "Twee korte inademingen na elkaar, gevolgd door een lange, langzame uitademing, verlaagde in een gecontroleerd onderzoek de spanning sneller dan gewoon rustig ademen of mindfulness — al bij één keer, en het effect was sterker naarmate mensen het vaker herhaalden over een paar weken.",
            },
        ],
        pastBij: ["gespannen", "gejaagd", "overprikkeld", "paniekerig", "onrustig", "rusteloos", "machteloos"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "2-3-4-5-ademhaling",
        titel: "2-3-4-5-ademhaling",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "algemeen — kalmerend, op een vaste tel",
        kosten: { tijdMinuten: [2, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Twee of drie rondes is al genoeg.",
        script: "Twee tellen in, drie tellen vasthouden, vier tellen uit, vijf tellen vasthouden.",
        herkomst: [
            {
                label: "P",
                regel: "Bouwt voort op hetzelfde effect als een langere uitademing (zie 'Ademen met lange uitademing'), met een oplopende telling die voor sommigen makkelijker vast te houden is dan vrij ademen. Dit precieze ritme zelf is niet apart onderzocht.",
            },
        ],
        pastBij: ["gespannen", "gejaagd", "onrustig", "rusteloos", "piekerend"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v25: grounding (uit een overweldigd gevoel stappen via je zintuigen/lichaam)
    // en cognitieve defusie (anders naar een vastzittende gedachte kijken, uit de
    // ACT-traditie) — twee losse categorieën die er nog niet waren.
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "vijf-zintuigen-grounding",
        titel: "Vijf, vier, drie, twee, één",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [2, 5], energie: "laag", drempel: "klein" },
        minimumversie: "Al bij twee of drie zintuigen kan het genoeg zijn.",
        script: "Noem, hardop of in je hoofd: vijf dingen die je ziet. Vier dingen die je voelt — je kleren, de stoel, de lucht. Drie dingen die je hoort. Twee dingen die je ruikt. Eén ding dat je proeft.",
        herkomst: [
            {
                label: "W",
                regel: "Aandacht sturen naar wat je nu concreet waarneemt via je zintuigen is een veelgebruikte, goed verdraagbare manier om uit piekeren of een overweldigd gevoel te stappen — het onderbreekt de aandacht die anders bij de gedachte zelf zou blijven hangen.",
            },
        ],
        pastBij: ["paniekerig", "overprikkeld", "verward", "piekerend", "malend", "gejaagd"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "voeten-op-de-grond",
        titel: "Voeten op de grond",
        soort: "nu",
        streek: "lichaam",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [1, 2], energie: "laag", drempel: "klein" },
        minimumversie: "Dertig seconden is genoeg.",
        script: "Ga zitten of staan. Voel je voeten echt op de grond — het gewicht, de temperatuur, de druk. Duw ze een paar tellen tegen de vloer. Adem gewoon door.",
        herkomst: [
            {
                label: "W",
                regel: "Aandacht bewust naar lichamelijke waarneming verplaatsen — het contact met de grond — is een basisvorm van grounding die snel uitvoerbaar is en breed gebruikt wordt bij een overweldigd gevoel, vooral in combinatie met de zintuigenoefening hierboven.",
            },
        ],
        pastBij: ["paniekerig", "overprikkeld", "verward", "gejaagd", "onrustig"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "gedachte-in-woorden",
        titel: "Ik heb de gedachte dat...",
        soort: "nu",
        streek: "geest",
        domeinLabel: "hoofd leegmaken",
        kosten: { tijdMinuten: [1, 3], energie: "laag", drempel: "klein" },
        minimumversie: "Eén keer hardop of opschrijven is genoeg.",
        script: "Neem de gedachte die blijft hangen. Zeg of schrijf hem opnieuw, maar begin met: 'Ik heb de gedachte dat...'. Dan nog een keer: 'Ik merk dat ik de gedachte heb dat...'. Niets aan de gedachte zelf veranderen — alleen hoe je ernaar kijkt.",
        herkomst: [
            {
                label: "W",
                regel: "Een gedachte herformuleren als iets dat je opmerkt, in plaats van als een feit, vermindert aantoonbaar hoe geloofwaardig en onaangenaam die gedachte aanvoelt — zonder de inhoud ervan te bestrijden of weg te duwen.",
            },
        ],
        pastBij: ["piekerend", "malend", "zelfkritisch", "onzeker", "verward", "wantrouwend"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    {
        id: "gedachte-een-vorm-geven",
        titel: "Geef de gedachte een vorm",
        soort: "nu",
        streek: "geest",
        domeinLabel: "hoofd leegmaken",
        kosten: { tijdMinuten: [2, 4], energie: "laag", drempel: "klein" },
        minimumversie: "Eén zin is genoeg: 'Dit is mijn gedachte, niet ik.'",
        script: "Stel je de gedachte voor als iets buiten jezelf — een wolk die voorbijdrijft, een blaadje op water, een zin op een lopende band. Je hoeft hem niet te geloven of te bestrijden, alleen te zien voorbijgaan.",
        herkomst: [
            {
                label: "W",
                regel: "Een gedachte visueel voorstellen als iets dat langsdrijft, in plaats van iets dat je bent, is een kernoefening uit cognitieve-defusietraining en vermindert hoe vast gedachten blijven zitten — werkt het best als losse oefening op een rustig moment, niet als noodgreep midden in een crisis.",
            },
        ],
        pastBij: ["piekerend", "malend", "verward", "onzeker", "besluiteloos"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
    // ──────────────────────────────────────────────────────────────────────────────
    // v25: een bewuste dopamine-reset. Geen les-in-verveling-toon, gewoon een
    // eerlijk aftellend scherm — toonBeweging() herkent dit id en laat eerst een
    // duur kiezen (5/10/15 min) voor de aftelling begint.
    // ──────────────────────────────────────────────────────────────────────────────
    {
        id: "prikkels-loslaten",
        titel: "Even helemaal niets",
        soort: "nu",
        streek: "geest",
        domeinLabel: "prikkels en aandacht",
        kosten: { tijdMinuten: [5, 15], energie: "laag", drempel: "midden" },
        minimumversie: "Vijf minuten is genoeg om te beginnen.",
        script: "Zet een tijd. Doe niets: geen telefoon, geen muziek, geen lezen. Kijk naar iets stils — een muur, het plafond, buiten. Verveling die opkomt hoeft niet weg.",
        herkomst: [
            {
                label: "W",
                regel: "Aanhoudende korte prikkels, vooral van een scherm, maken langzame, rustige aandacht lastiger vast te houden. Jezelf bewust en herhaald blootstellen aan verveling zonder een prikkel te pakken, hangt samen met minder verlangen naar diezelfde snelle prikkels en meer verdragen van niets-doen. Het is ongemakkelijk vóór het went — dat ongemak is het punt, niet een teken dat het niet werkt.",
            },
        ],
        pastBij: ["leeg", "lusteloos", "rusteloos", "overprikkeld", "niets", "op"],
        pastNietBij: [],
        nooitAanbiedenAls: [],
    },
];
export function bewegingById(id) {
    return bewegingen.find((b) => b.id === id);
}
