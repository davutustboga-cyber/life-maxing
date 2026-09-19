// glyphs.ts — de getekende iconen van de app (v27 herontwerp).
//
// Eén lijnstijl overal: 24×24, streek 1.5, ronde uiteinden, `currentColor`.
// Geen unicode-symbolen of emoji als icoon; elk teken hieronder is met de hand
// getekend en hoort bij één kamer of één handeling. Alleen SVG-paden, geen
// icon-pakket, geen netwerk (v1.0 §11.4: nul verzoeken).
const OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const SLUIT = "</svg>";
const g = (binnen) => `${OPEN}${binnen}${SLUIT}`;
export const glyphs = {
    /** Vandaag — zon boven een horizon. */
    vandaag: g('<path d="M3 17h18"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="M12 6v2.2M5.6 9.6l1.6 1.4M18.4 9.6 16.8 11"/>'),
    /** Mijn visie — een horizon met een ster erboven: waar je naartoe kijkt. */
    visie: g('<path d="M2.5 16.5c3-2.2 6-3.2 9.5-3.2s6.500 1 9.500 3.200"/><path d="M12 3.500v4.200M9.900 5.600h4.200"/><path d="M7 20h10"/>'),
    /** Adem & rust — een cirkel in een cirkel, in beweging. */
    adem: g('<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.200"/>'),
    /** Lichaam — een pad tussen twee heuvels. */
    lichaam: g('<path d="M2.500 19 9 8.500l3.500 5 2.500-3L21.500 19z"/><path d="M6 19c2.500-2 4.500-2 6 0"/>'),
    /** Mensen — twee cirkels die elkaar raken. */
    mensen: g('<circle cx="9" cy="12" r="5.500"/><circle cx="15" cy="12" r="5.500"/>'),
    /** Geloof — een sikkel met een kleine ster. */
    geloof: g('<path d="M19.500 14.500A8 8 0 1 1 9.500 4.500a6.500 6.500 0 0 0 10 10Z"/><path d="m17 5 .7 1.600 1.600.7-1.600.7L17 9.600l-.7-1.600-1.600-.7 1.600-.7z"/>'),
    /** Motivatie — een vlam. */
    motivatie: g('<path d="M12 3c.5 3-3.500 4.800-3.500 9a3.500 3.500 0 0 0 7 0c0-1.500-.6-2.400-1.400-3.400C13.400 7.500 12.300 6 12 3Z"/><path d="M12 20.500a2.200 2.200 0 0 0 2.200-2.200c0-1.400-1.200-1.800-2.200-3-1 1.200-2.200 1.600-2.200 3A2.200 2.200 0 0 0 12 20.500Z"/>'),
    /** Het huis — een dak boven vier vlakken. */
    huis: g('<path d="M3 11.500 12 4l9 7.500"/><path d="M5.500 10v9.500h13V10"/><path d="M12 10v9.500M5.500 15h13"/>'),
    /** De Hemel — een vierpuntsster. */
    hemel: g('<path d="M12 3c.4 4.600 1.800 6.200 6.500 7-4.700.8-6.100 2.400-6.500 7-.4-4.600-1.800-6.200-6.500-7 4.700-.8 6.100-2.400 6.500-7Z"/>'),
    /** Instellingen — een tandwiel, klein gehouden. */
    instellingen: g('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>'),
    /** Terug. */
    terug: g('<path d="M15 5l-7 7 7 7"/>'),
    /** Vooruit / open — een dunne chevron voor rijen. */
    verder: g('<path d="M9 5l7 7-7 7"/>'),
    /** Schrijven / bewerken. */
    schrijven: g('<path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z"/><path d="m13.500 6.500 4 4"/>'),
    /** Verras me — twee kleine vonken. */
    verras: g('<path d="M9 4c.3 3.500 1.500 4.700 5 5-3.500.3-4.700 1.500-5 5-.3-3.500-1.500-4.700-5-5 3.500-.3 4.700-1.500 5-5Z"/><path d="M18 14c.2 2 .9 2.700 3 3-2.100.3-2.800 1-3 3-.2-2-.9-2.700-3-3 2.100-.3 2.800-1 3-3Z"/>'),
    /** Hoe voel je je — een hart, zonder gezicht of score. */
    gevoel: g('<path d="M12 20s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.300a4.300 4.300 0 0 1 7.500 2.500C19.500 15.400 12 20 12 20Z"/>'),
    /** Het gaat even niet — een anker: houvast. */
    houvast: g('<circle cx="12" cy="5" r="2"/><path d="M12 7v13M8.500 10.500h7M5 14c.4 3.300 3.200 6 7 6s6.600-2.700 7-6"/>'),
};
