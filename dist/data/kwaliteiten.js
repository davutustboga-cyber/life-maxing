// kwaliteiten.ts — gespiegeld aan de React-versie (v20). Zie daar voor de
// volledige toelichting.
export const kwaliteiten = [
    { id: "rust", naam: "Rust", islamNaam: "sakīna", islamUitleg: "de rust die neerdaalt" },
    { id: "kracht", naam: "Kracht, volhouden", islamNaam: "ṣabr", islamUitleg: "geduldig volhouden, niet passief ondergaan" },
    { id: "vertrouwen", naam: "Vertrouwen", islamNaam: "tawakkul", islamUitleg: "de oorzaken doen, de uitkomst overgeven" },
    { id: "dankbaarheid", naam: "Dankbaarheid", islamNaam: "shukr" },
    { id: "verbinding", naam: "Liefde, verbinding", islamNaam: "raḥma, mawadda" },
    { id: "moed", naam: "Moed" },
    { id: "richting", naam: "Helderheid, richting", islamNaam: "niyyah, muḥāsaba" },
    { id: "opnieuw-beginnen", naam: "Opnieuw beginnen", islamNaam: "tawba" },
    { id: "karakter", naam: "Karakter", islamNaam: "akhlāq" },
];
export function kwaliteitById(id) {
    return kwaliteiten.find((k) => k.id === id);
}
