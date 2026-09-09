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
