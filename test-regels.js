// test-regels.js — controleert de regels uit bewegingen.yaml, selectie.yaml en
// v2.3 die bij de eerste bouw niet zijn meegenomen.
//
// Elk blok hieronder hoort bij één bevinding uit de audit van 5 september 2026.

const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const uitkomsten = [];
function check(naam, waar, extra) {
  uitkomsten.push({ naam, ok: !!waar, extra: extra ?? '' });
}

const BASIS = 'http://localhost:8792';

function schrijfNaarIndexedDb(doc) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('life-maxing', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('bestand')) db.createObjectStore('bestand');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('bestand', 'readwrite');
      tx.objectStore('bestand').put(doc, 'het-bestand');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function leesUitIndexedDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('life-maxing', 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('bestand', 'readonly');
      const g = tx.objectStore('bestand').get('het-bestand');
      g.onsuccess = () => resolve(g.result);
      g.onerror = () => reject(g.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function leegBestand(extra = {}) {
  return Object.assign(
    {
      versie: '1.0',
      aangemaaktOp: '2026-09-01T09:00:00+02:00',
      instellingen: { islamitischeLaag: true, rustigeBeelden: false, ethischeOndergrensGezien: true },
      woordenUitbreiding: [],
      momenten: [],
      sterren: [],
      sterrenbeelden: [],
      onderdrukkingen: [],
      sterrenbeeldAanbodAfgewezen: [],
      brieven: [],
    },
    extra
  );
}

/** v21: na "Beginnen"/reload land je op het startscherm, niet meer op de
 * schijf. Deze helper loopt naar de schijf via "Hoe voel je je?" -> de
 * "nauwkeuriger aangeven"-link op de woordenlijst, zodat de rest van deze
 * testsuite (die met een exacte tik-positie werkt) ongewijzigd kan blijven. */
async function naarSchijf(page) {
  await page.click('text=Hoe voel je je?');
  await page.waitForTimeout(250);
  await page.click('text=nauwkeuriger aangeven met de cirkel');
  await page.waitForTimeout(250);
}

/** Loopt S1 → S2 → S3 door met één gekozen woord, en geeft de deurtitels terug. */
async function totDeDeuren(page, woord, tijd = 'tien minuten') {
  const canvas = await page.$('canvas.schijf-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(400);

  await page.fill('input[type=text]', woord);
  await page.waitForTimeout(200);
  const knoppen = await page.$$('.woord-knop');
  let geklikt = false;
  for (const knop of knoppen) {
    const tekst = (await knop.textContent()).trim();
    if (tekst.toLowerCase() === woord.toLowerCase()) {
      await knop.click();
      geklikt = true;
      break;
    }
  }
  if (!geklikt) throw new Error(`woord "${woord}" niet gevonden in het zoekresultaat`);
  await page.click('text=Verder');
  await page.waitForTimeout(300);
  await page.click(`text=${tijd}`);
  await page.waitForTimeout(400);
  return page.$$eval('.deur', (ns) => ns.map((n) => n.innerText.split('\n')[0].trim()));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const fouten = [];
  page.on('pageerror', (e) => fouten.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') fouten.push('CONSOLE: ' + msg.text());
  });

  await page.goto(BASIS + '/index.html');
  await page.waitForTimeout(300);
  await page.evaluate(schrijfNaarIndexedDb, leegBestand());
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);

  // ── 1. Het zoekveld doorzoekt de veertig woorden ──────────────────
  const canvas0 = await page.$('canvas.schijf-canvas');
  const box0 = await canvas0.boundingBox();
  await page.mouse.click(box0.x + box0.width * 0.5, box0.y + box0.height * 0.5);
  await page.waitForTimeout(400);
  const voorZoeken = (await page.$$('.woord-knop')).length;
  await page.fill('input[type=text]', 'uitgeput');
  await page.waitForTimeout(200);
  const naZoeken = await page.$$eval('.woord-knop', (ns) => ns.map((n) => n.textContent.trim()));
  check('Zoekveld doorzoekt de woordenlijst', naZoeken.includes('uitgeput') && naZoeken.length < voorZoeken,
    `voor: ${voorZoeken}, na: ${naZoeken.join('/')}`);

  // ── 2. past_niet_bij wordt gerespecteerd ──────────────────────────
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const deurenUitgeput = await totDeDeuren(page, 'uitgeput');
  check(
    '"uitgeput" krijgt géén tien minuten wandelen aangeboden (past_niet_bij)',
    !deurenUitgeput.some((d) => d.includes('Tien minuten wandelen')),
    deurenUitgeput.join(' | ')
  );
  check('Er staan altijd drie deuren', deurenUitgeput.length === 3, deurenUitgeput.join(' | '));
  check('"Niets doen" staat er altijd bij', deurenUitgeput.some((d) => d.includes('Niets doen')));

  // ── 3. Het herkomstlabel op S5 ────────────────────────────────────
  // v21: S5 is nu de stap-voor-stap-oefening (toonOefening) -- de
  // herkomst zit ingeklapt achter "waarom dit werkt".
  const eersteDeur = (await page.$$('.deur button'))[0];
  await eersteDeur.click();
  await page.waitForTimeout(400);
  await page.click('text=waarom dit werkt');
  await page.waitForTimeout(200);
  const labels = await page.$$eval('.herkomst-regel', (ns) => ns.map((n) => n.textContent.trim()));
  check('S5 zegt waar de beweging vandaan komt', labels.length >= 1, labels.join(' | '));
  check(
    'Het label vermengt wetenschap en geloof niet in één zin',
    labels.every((l) => !(l.includes('onderzoek naar gedaan') && l.includes('traditie'))),
    labels.join(' | ')
  );
  await page.screenshot({ path: '/tmp/rg/01-herkomst.png' });

  // ── 4. Het Verschil ───────────────────────────────────────────────
  // Loop door de resterende stappen tot de laatste ("Klaar" i.p.v. "Volgende").
  for (let i = 0; i < 8; i += 1) {
    const klaarKnop = await page.$('button.knop:has-text("Klaar")');
    if (klaarKnop) { await klaarKnop.click(); break; }
    const volgende = await page.$('button.knop:has-text("Volgende")');
    if (!volgende) break;
    await volgende.click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(400);
  const canvas2 = await page.$('canvas.schijf-canvas');
  const box2 = await canvas2.boundingBox();
  // exact het midden: dezelfde plek als de openingstik, dus nauwelijks verschil
  await page.mouse.click(box2.x + box2.width * 0.5, box2.y + box2.height * 0.5);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: '/tmp/rg/02-het-verschil.png' });
  const verschilTekst = await page.$eval('.scherm', (n) => n.innerText);
  check(
    'Nauwelijks verschoven levert de eerlijke zin op',
    verschilTekst.includes('Nauwelijks verschoven. Dat is normaal.'),
    verschilTekst.replace(/\n/g, ' | ').slice(0, 120)
  );

  // ── 5. S7 heeft geen weg terug ────────────────────────────────────
  await page.click('text=Verder');
  await page.waitForTimeout(2200);
  const s7 = await page.$eval('#app', (n) => n.innerText.trim());
  check('S7 is leeg', s7 === '', JSON.stringify(s7.slice(0, 40)));
  await page.click('.scherm', { force: true }).catch(() => {});
  await page.waitForTimeout(500);
  const naKlik = await page.$eval('#app', (n) => n.innerText.trim());
  check('Klikken op S7 brengt je niet terug naar het begin', naKlik === '', JSON.stringify(naKlik.slice(0, 40)));

  // ── 6. zelfcompassie vervangt tawakkul bij "schuldig" ─────────────
  await page.evaluate(schrijfNaarIndexedDb, leegBestand());
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const deurenSchuldig = await totDeDeuren(page, 'schuldig', 'twee minuten');
  check(
    'Bij "schuldig" komt zelfcompassie, ook met de islamitische laag aan',
    deurenSchuldig.some((d) => d.includes('Zelfcompassie')),
    deurenSchuldig.join(' | ')
  );
  check(
    'De tawakkul-route staat er dan niet naast',
    !deurenSchuldig.some((d) => d.includes('Tawakkul')),
    deurenSchuldig.join(' | ')
  );

  // ── 7. shukr is bereikbaar in zone D ──────────────────────────────
  // Eén eerdere D-keuze op dankbaarheid; dan moet de volgende keer shukr komen.
  await page.evaluate(
    schrijfNaarIndexedDb,
    leegBestand({
      momenten: [
        {
          id: 'm-d1',
          tijdstip: '2026-09-02T20:00:00+02:00',
          woorden: ['vredig'],
          tijdBeschikbaar: '2min',
          zone: 'D_verdiepen_laag',
          gekozenDeur: 'dankbaarheid-naar-persoon',
          afsluitwoorden: ['rustig'],
          verankeringszin: null,
        },
      ],
    })
  );
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const deurenD = await totDeDeuren(page, 'vredig', 'twee minuten');
  check(
    'Shukr is bereikbaar als de vorige D-keuze dankbaarheid was',
    deurenD.some((d) => d.includes('Shukr')),
    deurenD.join(' | ')
  );

  // met de islamitische laag uit mag shukr nooit verschijnen
  await page.evaluate(
    schrijfNaarIndexedDb,
    leegBestand({
      instellingen: { islamitischeLaag: false, rustigeBeelden: false, ethischeOndergrensGezien: true },
      momenten: [
        {
          id: 'm-d1',
          tijdstip: '2026-09-02T20:00:00+02:00',
          woorden: ['vredig'],
          tijdBeschikbaar: '2min',
          zone: 'D_verdiepen_laag',
          gekozenDeur: 'dankbaarheid-naar-persoon',
          afsluitwoorden: ['rustig'],
          verankeringszin: null,
        },
      ],
    })
  );
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const deurenDuit = await totDeDeuren(page, 'vredig', 'twee minuten');
  check(
    'Met de islamitische laag uit verschijnt shukr niet',
    !deurenDuit.some((d) => d.includes('Shukr')),
    deurenDuit.join(' | ')
  );

  // ── 8. Een eigen woord komt de volgende keer terug ────────────────
  await page.evaluate(schrijfNaarIndexedDb, leegBestand());
  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const canvas3 = await page.$('canvas.schijf-canvas');
  const box3 = await canvas3.boundingBox();
  await page.mouse.click(box3.x + box3.width * 0.4, box3.y + box3.height * 0.6);
  await page.waitForTimeout(400);
  await page.fill('input[type=text]', 'vastgeroest');
  await page.waitForTimeout(200);
  await page.click('text=Verder');
  await page.waitForTimeout(500);
  check('Het eigen woord wordt bevestigd', await page.$('text=Onthouden'));
  const naEigenWoord = await page.evaluate(leesUitIndexedDb);
  check(
    'Het eigen woord is bewaard met een datum',
    naEigenWoord.woordenUitbreiding.length === 1 && !!naEigenWoord.woordenUitbreiding[0].toegevoegdOp,
    JSON.stringify(naEigenWoord.woordenUitbreiding[0] || {})
  );

  await page.reload();
  await page.waitForTimeout(500);
  await naarSchijf(page);
  const canvas4 = await page.$('canvas.schijf-canvas');
  const box4 = await canvas4.boundingBox();
  await page.mouse.click(box4.x + box4.width * 0.4, box4.y + box4.height * 0.6);
  await page.waitForTimeout(400);
  await page.fill('input[type=text]', 'vastgeroest');
  await page.waitForTimeout(200);
  const terug = await page.$$eval('.woord-knop', (ns) => ns.map((n) => n.textContent.trim()));
  check('Het eigen woord staat er de volgende keer weer bij', terug.includes('vastgeroest'), terug.join('/'));

  // ── 9. Hetzelfde woord maakt geen tweede eigen woord aan ──────────
  const knop = (await page.$$('.woord-knop'))[0];
  await knop.click();
  await page.click('text=Verder');
  await page.waitForTimeout(500);
  const naTweede = await page.evaluate(leesUitIndexedDb);
  check(
    'Een bestaand woord wordt niet nog eens als eigen woord opgeslagen',
    naTweede.woordenUitbreiding.length === 1,
    'aantal: ' + naTweede.woordenUitbreiding.length
  );

  console.log('\n=== UITKOMSTEN ===');
  let gefaald = 0;
  for (const u of uitkomsten) {
    if (!u.ok) gefaald++;
    console.log((u.ok ? '  OK   ' : '  FOUT ') + u.naam + (u.extra ? '  [' + u.extra + ']' : ''));
  }
  console.log('\nFOUTEN IN CONSOLE/PAGINA:', fouten.length ? JSON.stringify(fouten, null, 2) : 'geen');
  console.log('GEFAALD:', gefaald);

  await browser.close();
  process.exit(gefaald === 0 && fouten.length === 0 ? 0 : 1);
})();
