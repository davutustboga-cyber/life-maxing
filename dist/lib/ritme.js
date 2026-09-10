// ritme.ts — gespiegeld aan de React-versie (v20). Zie daar voor de
// volledige toelichting van Het Ritme (§2.4) en De Grond (§2.5).
export function huidigeDagSleutel(nu = new Date()) {
    const tz = new Date(nu.getTime() - nu.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
}
export function ochtendVandaagGedaan(data) {
    const vandaag = huidigeDagSleutel();
    return (data.ochtendMomenten ?? []).some((o) => o.datum === vandaag);
}
export function avondVandaagGedaan(data) {
    const vandaag = huidigeDagSleutel();
    return (data.dagsluitingen ?? []).some((d) => d.datum === vandaag);
}
const ONTBREKENDE_GROND_CHIPS = ["slecht_geslapen", "niet_bewogen", "niet_buiten_geweest", "veel_alleen"];
export function onrustScore(d) {
    if (d.chips.includes("goede_dag"))
        return 0;
    const ontbrekend = d.chips.filter((c) => ONTBREKENDE_GROND_CHIPS.includes(c)).length;
    return Math.min(1, ontbrekend / ONTBREKENDE_GROND_CHIPS.length);
}
export function recenteDagsluitingen(data, n = 14) {
    return [...(data.dagsluitingen ?? [])].sort((a, b) => a.datum.localeCompare(b.datum)).slice(-n);
}
/**
 * v25 — de dagsluiting van gisteren (of, is die er niet, van vandaag).
 *
 * Waarom: `suggestiesVoorNu()` keek tot nu toe alleen op de klok, terwijl het
 * bestand al wist wat je gisteravond zelf had aangevinkt ("slecht geslapen",
 * "niet buiten geweest"). Dat is precies de context die een ochtendsuggestie
 * bruikbaar maakt in plaats van generiek. Bewust hooguit één dag terug: dit
 * is context voor nu, geen trend en geen geschiedenis (Wet 4).
 */
export function laatsteDagsluiting(data, nu = new Date()) {
    const gisteren = new Date(nu.getTime() - 86400000);
    const sleutels = new Set([huidigeDagSleutel(gisteren), huidigeDagSleutel(nu)]);
    const gevonden = (data.dagsluitingen ?? []).filter((d) => sleutels.has(d.datum));
    if (gevonden.length === 0)
        return null;
    return gevonden.sort((a, b) => a.datum.localeCompare(b.datum))[gevonden.length - 1];
}
/** v25 — het ochtendmoment van vandaag, om de kerntaak later op de dag terug
 * te kunnen geven. Tot nu toe werd hij gevraagd en nooit meer getoond. */
export function ochtendMomentVandaag(data, nu = new Date()) {
    const vandaag = huidigeDagSleutel(nu);
    return (data.ochtendMomenten ?? []).find((o) => o.datum === vandaag) ?? null;
}
/** v25 — het "iets kleins voor morgen" dat je gisteravond opschreef. Scullin
 * e.a. 2018 is de reden dat dit veld bestaat; zonder het 's ochtends terug te
 * geven was het een veld dat niemand ooit terugzag. */
export function voorVandaagVanGisteren(data, nu = new Date()) {
    const gisteren = huidigeDagSleutel(new Date(nu.getTime() - 86400000));
    const d = (data.dagsluitingen ?? []).find((x) => x.datum === gisteren);
    const tekst = d?.voorMorgen?.trim();
    return tekst ? tekst : null;
}
