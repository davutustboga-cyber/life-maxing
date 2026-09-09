// sterrenbeeld.ts — wanneer De Hemel het sterrenbeeld-aanbod doet, en aan welke
// streek. Eén product­regel, één plek, zodat de drempel met één getal te
// verzetten is.
//
// openpunten.md punt 1 liet de drempel bewust open: "hoeveel sterren een streek
// nodig heeft voordat de app het aanbod doet" was niet te bepalen zonder data.
// Hier staat de eerste keuze, expliciet als voorlopig gemarkeerd:
//
//   Twaalf sterren in één streek. Bij een paar keer per week de lus doorlopen
//   levert dat ongeveer één aanbod per streek per kwartaal — wat aansluit bij
//   v2.4 §9 ("enkele keren per jaar") zonder dat het jaren duurt voor de eerste
//   verschijnt. Te laag en het moment stelt niets voor; te hoog en het komt
//   nooit. Verzet dit getal na een paar maanden gebruik als het niet klopt; het
//   is een getal, geen ontwerp.

                                                               

export const STERRENBEELD_DREMPEL = 12;

export const STREKEN           = ["lichaam", "geest", "verbinding", "ziel"];

export function sterrenVanStreek(sterren        , streek        )         {
  return sterren.filter((s) => s.streek === streek);
}

/**
 * De streek waarvoor nu een aanbod mag komen, of null. Voorwaarden (v2.4 §9):
 * genoeg sterren, nog geen sterrenbeeld in die streek, en het aanbod is daar
 * niet eerder afgeslagen. Bij meerdere kandidaten: de volste streek, en per
 * bezoek maar één aanbod — nooit twee vragen achter elkaar.
 */
export function aanbodVoorStreek(data                )                {
  const afgewezen = data.sterrenbeeldAanbodAfgewezen ?? [];
  const kandidaten = STREKEN.filter((streek) => {
    if (afgewezen.includes(streek)) return false;
    if (data.sterrenbeelden.some((sb) => sb.streek === streek)) return false;
    return sterrenVanStreek(data.sterren, streek).length >= STERRENBEELD_DREMPEL;
  });
  if (kandidaten.length === 0) return null;
  kandidaten.sort(
    (a, b) => sterrenVanStreek(data.sterren, b).length - sterrenVanStreek(data.sterren, a).length
  );
  return kandidaten[0];
}


//# sourceURL=src/lib/sterrenbeeld.ts