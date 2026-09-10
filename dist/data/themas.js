// themas.ts — de bibliotheek in gewone taal (v21).
//
// Tot v20 was de bibliotheek één platte lijst van drieëntwintig titels, en
// alleen bereikbaar via De Onderbreker of het weekmoment. Dat is te veel om
// uit te kiezen en te weinig om je te oriënteren. Hier staan dezelfde
// bewegingen gegroepeerd zoals je ze zoekt: naar wat je nú nodig hebt.
//
// Een beweging mag in meer dan één thema staan — "afstand nemen van jezelf"
// hoort net zo goed bij rust als bij je hoofd leegmaken. De volgorde binnen
// een thema is van klein naar groot: de laagste drempel bovenaan.
export const themas = [
    {
        id: "rust",
        titel: "Rust vinden",
        onderschrift: "Als je gespannen, gejaagd of overprikkeld bent.",
        bewegingIds: [
            "adem-lange-uitademing",
            "fysiologische-zucht",
            "box-ademhaling",
            "2-3-4-5-ademhaling",
            "benoemen-en-parkeren",
            "afstand-nemen-van-jezelf",
            "tawakkul-route",
        ],
    },
    {
        id: "lichaam",
        titel: "Lichaam en bewegen",
        onderschrift: "Als stilzitten niet meer helpt.",
        bewegingIds: [
            "vijf-minuten-naar-buiten",
            "tien-minuten-wandelen-groen",
            "wandelen-met-een-vraag",
            "korte-koude-douche",
            "bewegen-met-een-beeld",
        ],
    },
    {
        id: "hoofd",
        titel: "Hoofd leegmaken",
        onderschrift: "Als het maalt, piekert of te vol zit.",
        bewegingIds: [
            "uitschrijven-zonder-filter",
            "benoemen-en-parkeren",
            "aanname-omdraaien",
            "afstand-nemen-van-jezelf",
            "gedachte-in-woorden",
            "gedachte-een-vorm-geven",
            "vijf-zintuigen-grounding",
            "voeten-op-de-grond",
        ],
    },
    {
        id: "verbinding",
        titel: "Mensen",
        onderschrift: "Als je alleen zit, of iets scheef staat met iemand.",
        bewegingIds: ["bericht-sturen", "dankbaarheid-naar-persoon", "aanname-omdraaien", "vergeven-eerste-stap"],
    },
    {
        id: "geloof",
        titel: "Geloof en zingeving",
        onderschrift: "Wat de dag ergens aan vastmaakt.",
        islamitisch: true,
        bewegingIds: [
            "shukr-drie-dingen",
            "sayyid-al-istighfar",
            "muhasabah-twee-vragen",
            "tawakkul-route",
            "lopen-met-dhikr",
            "omhoogkijken",
        ],
        dhikrIds: ["ayat-al-kursi", "sayyid-al-istighfar-tekst", "subhan-allahi-wa-bihamdihi"],
    },
    {
        id: "slaap",
        titel: "Slaap en ritme",
        onderschrift: "Wat je dag- en nachtritme op zijn plek houdt.",
        bewegingIds: ["ochtendlicht-zien", "adem-lange-uitademing", "vijf-minuten-naar-buiten"],
    },
    {
        id: "doorzetten",
        titel: "Aanpakken",
        onderschrift: "Als er iets blijft liggen, of je jezelf hard aanpakt.",
        bewegingIds: ["vijftien-minuten-moeilijke-ding", "zelfcompassie-na-misstap", "savoring-zestig-seconden"],
    },
    {
        // v21, spoor W6: geen losse bewegingen, maar een eigen flow (de
        // WOOP-vragen) -- toonDoen() herkent dit aan de lege bewegingIds en
        // opent de flow direct in plaats van een lijstje. Zie teksten.doelen.
        id: "richting",
        titel: "Richting en doelen",
        onderschrift: "Als je iets wil bereiken en niet weet waar te beginnen.",
        bewegingIds: [],
    },
    {
        id: "reset",
        titel: "Prikkels resetten",
        onderschrift: "Als je hoofd overprikkeld is van schermen en stilzitten niet meer lukt.",
        bewegingIds: ["prikkels-loslaten", "vijf-zintuigen-grounding"],
    },
];
export function themaById(id) {
    return themas.find((t) => t.id === id);
}
