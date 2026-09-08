# Life Maxing — broncode v1

Dit is de eerste gebouwde versie van de app, gebaseerd op alle content- en
ontwerpbestanden uit Fase 1 en Fase 2 (`woorden.yaml`, `bewegingen.yaml`,
`selectie.yaml`, `teksten.yaml`, `veiligheid.md`, `schermenoverzicht.md`,
`datamodel.md`).

## Belangrijk: één afwijking van v2.5 §3

v2.5 schreef React, Vite, TypeScript en Dexie voor. De bouwomgeving waarin
dit gebouwd is, had geen toegang tot de npm-registry (waar die pakketten
vandaan komen) en ook niet tot Google Fonts (voor Instrument Serif /
Hanken Grotesk). Daarom is dit gebouwd als een **afhankelijkheidsvrije
TypeScript/JavaScript-app**: geen React, geen Vite, geen Dexie — alleen
de ingebouwde browser-API's (ES modules, IndexedDB) en de TypeScript-
compiler zelf. Functioneel verandert dit niets: hetzelfde datamodel,
dezelfde twaalf schermen, dezelfde selectielogica. Het is zelfs iets
dichter bij de eigen filosofie van het project (zo min mogelijk, zo min
kwetsbaar) dan een framework had gebracht. Fonts vallen terug op
systeemfonts (zie hieronder).

## Structuur

```
src/
  data/          — woorden.ts, bewegingen.ts, selectie.ts, teksten.ts
                   (directe vertaling van de content-YAML's)
  lib/
    types.ts     — het datamodel (datamodel.md)
    db.ts        — IndexedDB-laag, "één bestand"-principe
    selection.ts — de volledige selectielogica (selectie.yaml)
    canvas.ts    — De Schijf (kompas) en De Hemel (sterrenveld)
    dom.ts       — kleine DOM-helper, geen framework
  app.ts         — de twaalf schermen S0–S11 (schermenoverzicht.md)
  main.ts        — opstartpunt, registreert de service worker
public/
  index.html, style.css, manifest.json, service-worker.js, icons/
dist/            — het gebouwde resultaat (klaar om te hosten)
```

## Bouwen

```
tsc -p tsconfig.json     # compileert src/ naar dist/
cp -r public/* dist/     # kopieert de statische bestanden erbij
```

`dist/` is daarna een volledig zelfstandige map — geen build-server nodig
om hem te draaien, alleen om hem opnieuw te genereren na een wijziging.

## Lokaal testen

```
cd dist && python3 -m http.server 8080
```

en dan `http://localhost:8080` openen.

## Op je iPhone zetten (gratis, zonder App Store)

Een PWA moet één keer over `https://` bereikbaar zijn geweest voordat je
hem aan je beginscherm kunt toevoegen — daarna werkt hij volledig
offline (de service worker cachet alles, en de app doet daarna nul
netwerkverzoeken, precies zoals v1.0 §11.4 vereist). De map `dist/` is
alles wat je hoeft te hosten. Drie gratis manieren, geen account met
kosten:

1. **GitHub Pages** — maak een gratis GitHub-account, zet de inhoud van
   `dist/` in een repository, zet Pages aan in de instellingen. Je
   krijgt een `https://jouwnaam.github.io/...`-adres.
2. **Cloudflare Pages** — sleep de `dist/`-map naar hun gratis
   "Direct Upload"-flow, geen repository nodig.
3. **Netlify Drop** (`app.netlify.com/drop`) — sleep de `dist/`-map naar
   de pagina, klaar. Ook geen account strikt nodig voor een eenmalige
   deploy.

Zodra je het adres in Safari opent: deelknop → "Zet op beginscherm".
Vanaf dan is het een app-icoon, en heeft de app je computer of dit
account niet meer nodig.

Voor de dagelijkse herinnering: zie `melding-instellen.md` (iOS
Shortcuts, al eerder geleverd).

## Fonts

Instrument Serif en Hanken Grotesk (de oorspronkelijke Nachtwaarde-
typografie) konden hier niet gedownload worden. `public/style.css` heeft
bovenaan een uitgecommentarieerde `@font-face`-sectie klaarstaan — voeg
de bestanden toe aan `public/fonts/` en zet die twee regels aan om de
echte typografie te krijgen. Tot die tijd gebruikt de app een rustige
systeemfont-stack die dezelfde sfeer benadert.

## Crisiskaart verwijderd (bewuste keuze, 5 september 2026)

`veiligheid.md` beschreef een crisiskaart: bij herhaalde zware momenten
zou de app automatisch een zachte melding tonen met een hulplijst
(Zelfmoordlijn, Tele-Onthaal, Awel, noodnummer). Deze functie — inclusief
de onderliggende detectielogica (de crisisregel uit `selectie.yaml` stap
0) en de handmatige toegang via "Het gaat niet goed" in de instellingen —
is op uitdrukkelijk verzoek volledig verwijderd, omdat de app alleen
door de bouwer en hooguit één andere persoon gebruikt gaat worden. `S9`
uit `schermenoverzicht.md` bestaat dus niet meer in de gebouwde app, en
`crisiskaartLog` is uit het datamodel gehaald. `veiligheid.md` zelf blijft
ongewijzigd in de projectdocumenten staan als historisch ontwerpdocument.

## Wat werkt, geverifieerd met een geautomatiseerde doorloop (Playwright)

S0 → S1 (De Schijf) → S2 (woordkeuze) → S3 (tijdvraag) → S4 (drie deuren,
zone-afhankelijk) → S5 (beweging) → S6 (verankeren, met ster) → S7
(afsluiten, stil scherm) → S8 (De Hemel, ster zichtbaar en aantikbaar) →
S10 (instellingen, toggles werken, geen crisis-gerelateerde knop meer).
Geen console- of paginafouten tijdens de volledige doorloop.

## Nog open (bewust, zie ook openpunten.md en datamodel.md §5)

- Sterrenbeeld-tekenmodus (v1.1) — het aanbod-moment is voorbereid in de
  data, de tekeninteractie zelf nog niet gebouwd.
- "Waar ben je?" (locatiegebonden bewegingen) — pas relevant vanaf v1.1.
- Optie A vs. B uit datamodel.md §5 (elke beweging geeft een ster, ook
  zonder tekst) is gebouwd als optie A, zoals daar aanbevolen — dit is
  een bewust te herzien punt na een paar weken gebruik.

## v1.1 — Sterrenbeelden

De tekenmodus uit `schermenoverzicht.md` (S8, overgangen) is gebouwd:

- Heeft een streek **twaalf sterren** of meer (`src/lib/sterrenbeeld.ts`,
  `STERRENBEELD_DREMPEL`), dan komt onderaan De Hemel eenmalig het aanbod uit
  `teksten.yaml → de_hemel.sterrenbeeld_aanbod`.
- "Ja" opent de tekenmodus in hetzelfde scherm: alleen de sterren van die
  streek zijn aantikbaar, elke tik verbindt met de vorige, "laatste lijn weg"
  maakt er één ongedaan.
- Daarna een naam (mag leeg blijven), en het sterrenbeeld wordt bewaard in
  `sterrenbeelden[]`. Het tekent zich één keer op in ±700 ms en beweegt daarna
  nooit meer (v2.4 §11).
- "Nu niet" wordt onthouden in het nieuwe interne veld
  `sterrenbeeldAanbodAfgewezen[]`, zodat het aanbod voor die streek nooit
  terugkomt (v2.4 §9).

Oudere exportbestanden zonder dat veld worden gewoon ingelezen; `db.ts` vult
ontbrekende velden aan met de lege standaard.

Tests: `node test-sterrenbeeld.js` (zestien controles over aanbod, tekenen,
ongedaan maken, benoemen, bewaren en het niet-terugkeren van het aanbod).

**Meegenomen reparatie.** De sterposities werden berekend uit een zaad dat voor
opeenvolgende ster-id's bijna dezelfde eerste waarde gaf, waardoor alle sterren
van een streek in één verticale kolom stonden. De hemel gebruikt nu een R2-reeks
met eigen jitter per ster; de sterren staan daardoor verspreid over hun streek.
Bestaande sterren verhuizen daardoor eenmalig naar een nieuwe plek.

## De Maandbrief

`src/lib/maandbrief.ts`. Bij het openen van de app krijgt elke afgesloten maand
waarin je de app hebt gebruikt eenmalig een brief; de lopende maand nooit. De
brief wordt daarna **bevroren** — hij is een verslag van die maand, en opnieuw
genereren zou hem later laten schuiven.

Opbouw (v2.4 §7B, v2.5 §4.6 — geen taalmodel):

1. `"Dit is wat er was."`, of bij een maand zonder geschreven zinnen
   `"Deze maand was er vooral doorheen komen. Dat is ook wat er was."`
2. Hooguit vier van je eigen verankeringszinnen, letterlijk, gespreid over de
   maand — niet de "beste" en niet de laatste vier.
3. Eén verschuivingszin: van de beweging die je die maand het vaakst deed, hoe
   vaak je aan het eind lichter stond dan aan het begin. Sterkte in woorden
   (`bijna altijd · vaak · soms`), nooit in getallen. Onder
   `SPIEGEL_DREMPEL` (vier keer dezelfde beweging) is
   `"te weinig om iets van te zeggen"` verplicht.
4. Eén open vraag, wisselend per maand.

Toegang: op S1 staat `"er ligt een brief"` zolang er een ongelezen brief is, en
daarna `"de brieven"` (het archief). Een nieuwe brief eindigt met `sluiten` →
het afsluitscherm; een brief uit het archief keert terug naar het archief, want
twaalf brieven achter elkaar lezen is waar dit voor gebouwd is.

De melding zelf hoort niet in de app: die zet je via iOS Opdrachten
(`content/melding-instellen.md`).

Tests: `node test-maandbrief.js` (vijfentwintig controles, inclusief "geen
enkel cijfer in de brief" en "geen woord van de verboden lijst").

## Audit van 5 september 2026 — wat er alsnog is gebouwd

Na het opleveren van de Maandbrief zijn het masterplan en de contentbestanden
naast de code gelegd. Dat leverde een reeks regels op die wél waren ontworpen
maar niet gebouwd. Die zitten er nu in:

**Selectielogica** (`src/lib/selection.ts`, `src/data/selectie.ts`)

- `past_niet_bij` per beweging wordt gerespecteerd. Tot nu toe kreeg iemand die
  "uitgeput" koos gewoon "tien minuten wandelen" aangeboden, terwijl
  `bewegingen.yaml` dat daar uitdrukkelijk verbiedt.
- `past_bij` bepaalt de volgorde van de twee deuren — het sluit niets uit.
- De afwisselregel van zone D werkt: de tweede deur wisselt tussen
  `dankbaarheid-naar-persoon` en `shukr-drie-dingen`. Shukr was daarvóór in de
  hele app onbereikbaar — één van de twaalf bewegingen, en één van de drie met
  een [I]-label.
- `zelfcompassie-na-misstap` vervangt de tawakkul-route bij de woorden
  "schuldig" en "zelfkritisch", ongeacht de instelling: het woord bepaalt.
- De regels `net_overprikkeld_of_sociaal_uitgeput` en `direct_na_iets_pijnlijks`
  worden toegepast. Let op: die twee zijn nergens uitgeschreven; de invulling
  staat met een comment in de code en hoort bevestigd te worden.

**Beeldtaal** (`src/lib/canvas.ts`, `public/style.css`)

- De zes kleurtokens uit v2.3 §1.2 staan in `style.css`; de grond is nu de
  blauwgrijze nacht `#0E1420` in plaats van een neutraal bijna-zwart.
- **De Warmte**: de lichtvorm in De Schijf zit op je vinger en verandert van
  kleur, grootte, scherpte en beweging met waar je staat — de vier staten uit
  v2.3 §2.1, vloeiend gemengd. Geen geheugen (v2.4 §6.1).
- De messing ticks verschijnen alleen terwijl je sleept.
- De schijf gaat pas door bij lóslaten, niet bij aanraken. Anders zag je de
  lichtvorm nooit.
- **Het Verschil** (v2.3 §2.2): na een beweging twee punten met een dunne boog,
  in ±1 seconde getekend. Bij nauwelijks verschil: "Nauwelijks verschoven. Dat
  is normaal."
- `rustigeBeelden` én `prefers-reduced-motion` zetten nu ook de canvas-animaties
  stil, en alles staat stil als het scherm niet zichtbaar is (v2.3 §3.3/§3.4).

**Beloftes die de app deed maar niet nakwam**

- Het herkomstlabel staat op S5: per label één eigen regel, nooit samengevoegd.
  S0 belooft "soms wetenschap, soms geloof, soms een eigen idee — en dat wordt
  altijd apart gezegd"; dat werd nergens gezegd.
- Het zoekveld in S2 doorzoekt de veertig woorden. Het maakte van elke invoer
  meteen een eigen woord.
- Een eigen woord komt de volgende keer terug (`zetEigenWoorden`), krijgt een
  `toegevoegdOp`, en de bevestiging "Onthouden" verschijnt.
- "dit klopt niet" opent het kompas op dezelfde plek in plaats van leeg.
- Een mislukte opslag wordt getoond in plaats van alleen naar de console gelogd.
- S7 dimt echt (`dimEnDan` bestond maar werd nergens aangeroepen) en heeft geen
  klikvlak meer terug naar het begin — Wet 3.
- `navigator.storage.persist()` wordt aangevraagd bij de eerste start (v2.5 §3).
- De service worker precachet nu alle modules, niet alleen `main.js`.

Tests: `node test-regels.js` (zeventien controles over deze punten).
