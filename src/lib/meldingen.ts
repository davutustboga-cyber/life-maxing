// meldingen.ts — een melding per dagdeel (ochtend/middag/avond), ook als de
// app dicht staat.
//
// Web Push kan nergens ter wereld afgeleverd worden zonder iets buiten het
// toestel: de browser stuurt het bericht pas door als iets, op het juiste
// moment, de pushdienst aanroept. Dat "iets" is hier een minimale, losse
// server (Supabase, gratis laag) — niet de app zelf. Die server kent precies
// twee dingen per toestel: een technisch push-adres (geen naam, geen account)
// en de gekozen tijdstippen. Nooit iets uit het bestand in db.ts — geen
// sterren, geen visie, geen enkele tekst die je opschreef.
//
// `zetMeldingenAan`/`zetMeldingenUit` zijn de enige twee aanroepen naar
// buiten die deze app ooit doet (v1.0 §11.4 gold tot nu toe als "nul
// netwerkverzoeken" — dit is de ene, expliciete, door de gebruiker zelf
// aangevraagde uitzondering).

export interface MeldingenTijden {
  ochtend: string | null;
  middag: string | null;
  avond: string | null;
}

const VAPID_PUBLIC_KEY =
  "BDQn6Yks6hiA1WbR5x0yp2J8MCEFTal_tan49mzzT775AsO2hyFzuwyAlXCmtFRJCUBLp3G8tjk5mTkh1QuTfmQ";
const ABONNEER_URL = "https://ksatpgclqfdyvinslrjk.supabase.co/functions/v1/abonneren";

export function meldingenOndersteund(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function meldingenGeblokkeerd(): boolean {
  return meldingenOndersteund() && Notification.permission === "denied";
}

function urlBase64NaarUint8Array(base64Url: string): Uint8Array {
  const marge = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + marge).replace(/-/g, "+").replace(/_/g, "/");
  const ruw = atob(base64);
  const bytes = new Uint8Array(ruw.length);
  for (let i = 0; i < ruw.length; i++) bytes[i] = ruw.charCodeAt(i);
  return bytes;
}

/** {ochtend:"08:00", middag:null, avond:"21:00"} -> {ochtend:"08:00", avond:"21:00"}
 * — de server slaat alleen de dagdelen op die je echt aanzette. */
function naarServerFormaat(tijden: MeldingenTijden): Record<string, string> {
  const resultaat: Record<string, string> = {};
  if (tijden.ochtend) resultaat.ochtend = tijden.ochtend;
  if (tijden.middag) resultaat.middag = tijden.middag;
  if (tijden.avond) resultaat.avond = tijden.avond;
  return resultaat;
}

/** Vraagt toestemming, abonneert op push, en registreert de gekozen
 * tijdstippen + adres bij de server (dit vervangt steeds de volledige set
 * voor dit toestel — stuur dus altijd alle drie dagdelen mee, niet alleen
 * het dagdeel dat net veranderde). Geeft bij weigering of falen een reden
 * terug, nooit een uitzondering die de rest van het scherm zou breken. */
export async function zetMeldingenAan(tijden: MeldingenTijden): Promise<{ ok: boolean; reden?: string }> {
  if (!meldingenOndersteund()) return { ok: false, reden: "niet_ondersteund" };

  try {
    const toestemming = await Notification.requestPermission();
    if (toestemming !== "granted") return { ok: false, reden: "geweigerd" };

    const registratie = await navigator.serviceWorker.ready;
    let subscription = await registratie.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registratie.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64NaarUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const tijdzone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Brussels";
    const res = await fetch(ABONNEER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), tijden: naarServerFormaat(tijden), tijdzone }),
    });
    if (!res.ok) return { ok: false, reden: "server" };
    return { ok: true };
  } catch {
    return { ok: false, reden: "onbekend" };
  }
}

/** Meldt volledig af bij de server én lokaal — voor wanneer alle drie
 * dagdelen uit staan. Beide kanten, zodat er ook op de server meteen niets
 * meer geregistreerd staat in plaats van pas na een mislukte verzendpoging. */
export async function zetMeldingenUit(): Promise<void> {
  if (!meldingenOndersteund()) return;
  try {
    const registratie = await navigator.serviceWorker.ready;
    const subscription = await registratie.pushManager.getSubscription();
    if (!subscription) return;
    await fetch(ABONNEER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), tijden: {} }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    /* best effort — een mislukte afmelding mag de instelling zelf niet blokkeren */
  }
}
