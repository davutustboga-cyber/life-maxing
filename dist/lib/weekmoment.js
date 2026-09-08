// weekmoment.ts — Het Weekmoment / De Spiegel (v2.0 §9.1 punt 8, Pijler 5,
// v2.2 §11: "Spiegel: één keer per week, vier zinnen, uitschakelbaar").
//
// Dit is de beeldoefening: mentale contrastering / WOOP. Drie delen, nooit
// alleen het eerste — "elke visualisatie-oefening in de app heeft drie
// delen: beeld (levendig, met alle zintuigen), werkelijkheid (wat staat er
// nu écht in de weg), plan (als X, dan Y). Nooit alleen het eerste deel."
// (Masterplan.md, Pijler 5). Dit onderwerp — wat jij "manifesteren" noemt —
// stond al uitgebreid in v1.0, v2.0 §5 en v2.2 §6.4, maar zat nooit in een
// van de twaalf gebouwde bewegingen: het leefde alleen in "het weekmoment",
// en dat viel bij de bouw van v1 buiten de negen dingen uit v2.5 §6.1 en is
// daarna, anders dan het sterrenbeeld en de Maandbrief, nooit meer opgepakt.
//
// De oefening eindigt altijd met een eigen keuze uit de bewegingsbibliotheek
// — iets wat je deze week in het echte leven doet, niet in de app. Geen
// algoritme dat een beweging "aanbeveelt" op basis van de werkelijkheid die
// je intypte: dat zou een ongeteste combinatie-claim zijn (v2.2 §11, spoor
// W19, nog niet onderzocht). De keuze blijft van jou; de app biedt alleen de
// bibliotheek aan.
/**
 * ISO-weeksleutel, "2026-W36". Nooit als los getal getoond — alleen gebruikt
 * om te bepalen of je deze week al bij de spiegel bent geweest.
 */
export function weekSleutel(nu = new Date()) {
    const datum = new Date(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()));
    const dagNr = (datum.getUTCDay() + 6) % 7; // maandag = 0
    datum.setUTCDate(datum.getUTCDate() - dagNr + 3); // donderdag van deze week
    const eersteDonderdag = new Date(Date.UTC(datum.getUTCFullYear(), 0, 4));
    const weekNr = 1 +
        Math.round(((datum.getTime() - eersteDonderdag.getTime()) / 86400000 -
            3 +
            ((eersteDonderdag.getUTCDay() + 6) % 7)) /
            7);
    return `${datum.getUTCFullYear()}-W${String(weekNr).padStart(2, "0")}`;
}
/**
 * Beschikbaar als het weekmoment aan staat en er nog geen bevroren
 * weekmoment voor de huidige week staat. Geen drempel op aantal momenten
 * die week — v2.2 §11 zegt "één keer per week", niet "als je genoeg deed".
 */
export function weekmomentBeschikbaar(data, nu = new Date()) {
    if (!data.instellingen.weekmomentAan)
        return false;
    const sleutel = weekSleutel(nu);
    return !(data.weekmomenten ?? []).some((w) => w.week === sleutel);
}
export function schrijfWeekmoment(beeld, werkelijkheid, plan, gekozenBewegingId, nu = new Date()) {
    return {
        id: `wk-${weekSleutel(nu)}-${Date.now().toString(36)}`,
        week: weekSleutel(nu),
        aangemaaktOp: nu.toISOString(),
        beeld: beeld.trim(),
        werkelijkheid: werkelijkheid.trim(),
        plan: plan.trim(),
        gekozenBewegingId,
    };
}
