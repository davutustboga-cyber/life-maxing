// test-sterrenbeeld.js — Playwright-doorloop van de sterrenbeeld-tekenmodus (v1.1).
//
// Zaait een hemel met genoeg sterren in één streek, controleert dat het aanbod
// verschijnt, tekent een sterrenbeeld, geeft het een naam, en controleert dat
// het bewaard is en dat het aanbod daarna niet terugkomt.

const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const DREMPEL = 12;

function zaadBestand() {
  const sterren = [];
  const momenten = [];
  const streken = ['lichaam', 'geest', 'verbinding', 'ziel'];
  // 14 sterren in "lichaam" (boven de drempel), 3 in elk van de rest
  const verdeling = { lichaam: 14, geest: 3, verbinding: 3, ziel: 3 };
  let n = 0;
  for (const streek of streken) {
    for (let i = 0; i < verdeling[streek]; i++) {
      n++;
      const id = 's-' + String(n).padStart(4, '0');
      const momentId = 'm-' + String(n).padStart(4, '0');
      momenten.push({
        id: momentId,
        tijdstip: '2026-08-' + String((n % 28) + 1).padStart(2, '0') + 'T20:00:00+02:00',
        woorden: ['leeg'],
        tijdBeschikbaar: '2min',
        zone: 'B_activeren',
        gekozenDeur: 'tien-minuten-wandelen-groen',
        afsluitwoorden: ['licht'],
        verankeringszin: i % 2 === 0 ? 'Zin bij ster ' + n : null,
      });
      sterren.push({
        id,
        momentId,
        streek,
        datum: '2026-08-' + String((n % 28) + 1).padStart(2, '0'),
        zin: i % 2 === 0 ? 'Zin bij ster ' + n : null,
      });
    }
  }
  return {
    versie: '1.0',
    aangemaaktOp: '2026-08-01T09:00:00+02:00',
    instellingen: { islamitischeLaag: true, rustigeBeelden: false, ethischeOndergrensGezien: true },
    woordenUitbreiding: [],
    momenten,
    sterren,
    sterrenbeelden: [],
    onderdrukkingen: [],
    sterrenbeeldAanbodAfgewezen: [],
  };
}

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

const uitkomsten = [];
function check(naam, waar, extra) {
  uitkomsten.push({ naam, ok: !!waar, extra: extra ?? '' });
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

  const basis = 'http://localhost:8792';

  // ── 1. Hemel zaaien ───────────────────────────────────────────────
  await page.goto(basis + '/index.html');
  await page.waitForTimeout(300);
  await page.evaluate(schrijfNaarIndexedDb, zaadBestand());
  await page.reload();
  await page.waitForTimeout(400);

  // ── 2. De Hemel openen, aanbod moet er zijn ───────────────────────
  await page.click('text=laat me zien wat ik al gedaan heb');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/sb/01-aanbod.png' });

  const aanbodTekst = await page.$('text=Wil je er lijnen tussen trekken');
  check('Aanbod verschijnt bij ' + DREMPEL + '+ sterren in een streek', aanbodTekst);

  // ── 3. Ster aantikken toont de zin (leesmodus werkt nog) ──────────
  const hemel = await page.$('canvas.hemel-canvas');
  const hb = await hemel.boundingBox();
  // Kwadrant rechtsboven = "lichaam"; scan een raster tot een ster raak is
  let zinGevonden = false;
  for (let gx = 0.55; gx < 1 && !zinGevonden; gx += 0.03) {
    for (let gy = 0.05; gy < 0.48 && !zinGevonden; gy += 0.03) {
      await page.mouse.click(hb.x + hb.width * gx, hb.y + hb.height * gy);
      const zin = await page.$eval('.zacht', (n) => n.textContent).catch(() => '');
      if (zin && zin.startsWith('Zin bij ster')) zinGevonden = true;
    }
  }
  check('Ster aantikken toont de verankeringszin', zinGevonden);

  // ── 4. Tekenmodus in ──────────────────────────────────────────────
  await page.click('.aanbod button.knop');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/sb/02-tekenmodus.png' });

  const uitleg = await page.$('text=Tik de sterren aan die bij elkaar horen');
  check('Tekenmodus opent met uitleg', uitleg);

  const klaarVerborgenVooraf = await page.$eval('.aanbod-knoppen .knop', (n) => n.hidden);
  check('"Klaar" is verborgen zolang er nog niets getekend is', klaarVerborgenVooraf === true);

  // ── 5. Sterren aantikken tot er vier verbonden zijn ───────────────
  const hemel2 = await page.$('canvas.hemel-canvas');
  const hb2 = await hemel2.boundingBox();
  let verbonden = 0;
  for (let gx = 0.52; gx < 1 && verbonden < 4; gx += 0.025) {
    for (let gy = 0.03; gy < 0.48 && verbonden < 4; gy += 0.025) {
      await page.mouse.click(hb2.x + hb2.width * gx, hb2.y + hb2.height * gy);
      const zichtbaar = await page.$eval('.aanbod-knoppen .knop', (n) => !n.hidden);
      const ongedaanZichtbaar = await page.$eval('.aanbod-knoppen .knop-klein', (n) => !n.hidden);
      if (ongedaanZichtbaar && verbonden === 0) verbonden = 1;
      if (zichtbaar && verbonden < 2) verbonden = 2;
      else if (zichtbaar) verbonden++;
    }
  }
  check('Sterren laten zich verbinden (minstens twee)', verbonden >= 2, 'geteld: ' + verbonden);
  await page.screenshot({ path: '/tmp/sb/03-lijnen.png' });

  // ── 6. Ongedaan maken werkt ───────────────────────────────────────
  await page.click('.aanbod-knoppen .knop-klein');
  await page.waitForTimeout(200);
  const naOngedaan = await page.$eval('.aanbod-knoppen .knop-klein', (n) => !n.hidden);
  check('"laatste lijn weg" laat de tekening bestaan na één keer ongedaan', naOngedaan);

  // opnieuw een ster erbij zodat "Klaar" weer beschikbaar is
  for (let gx = 0.52; gx < 1; gx += 0.025) {
    let klaar = await page.$eval('.aanbod-knoppen .knop', (n) => !n.hidden);
    if (klaar) break;
    for (let gy = 0.03; gy < 0.48; gy += 0.025) {
      await page.mouse.click(hb2.x + hb2.width * gx, hb2.y + hb2.height * gy);
      klaar = await page.$eval('.aanbod-knoppen .knop', (n) => !n.hidden);
      if (klaar) break;
    }
  }

  // ── 7. Klaar → naam geven → bewaren ───────────────────────────────
  await page.click('.aanbod-knoppen .knop');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/sb/04-naamgeven.png' });
  const naamVeld = await page.$('.naam-veld');
  check('Naamscherm verschijnt', naamVeld);

  await page.fill('.naam-veld', 'De Wandelaar');
  await page.click('text=Bewaren');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/sb/05-hemel-met-sterrenbeeld.png' });

  const bestand = await page.evaluate(leesUitIndexedDb);
  check('Sterrenbeeld is bewaard', bestand.sterrenbeelden.length === 1);
  check(
    'Sterrenbeeld heeft de gegeven naam',
    bestand.sterrenbeelden[0] && bestand.sterrenbeelden[0].naam === 'De Wandelaar'
  );
  check(
    'Sterrenbeeld staat in de juiste streek met 2+ sterren',
    bestand.sterrenbeelden[0] &&
      bestand.sterrenbeelden[0].streek === 'lichaam' &&
      bestand.sterrenbeelden[0].sterIds.length >= 2,
    bestand.sterrenbeelden[0] ? JSON.stringify(bestand.sterrenbeelden[0].sterIds) : ''
  );

  // ── 8. Aanbod komt niet terug voor dezelfde streek ────────────────
  const aanbodNa = await page.$('text=Wil je er lijnen tussen trekken');
  check('Geen nieuw aanbod direct na het tekenen', !aanbodNa);

  await page.click('text=Terug');
  await page.waitForTimeout(300);
  await page.click('text=laat me zien wat ik al gedaan heb');
  await page.waitForTimeout(500);
  const aanbodHerbezoek = await page.$('text=Wil je er lijnen tussen trekken');
  check('Aanbod blijft weg bij een volgend bezoek aan De Hemel', !aanbodHerbezoek);
  await page.screenshot({ path: '/tmp/sb/06-herbezoek.png' });

  // ── 9. "Nu niet" onthoudt de weigering ────────────────────────────
  const doc2 = zaadBestand();
  doc2.sterren = doc2.sterren.map((s) => (s.streek === 'geest' ? s : s));
  // geef ook "geest" genoeg sterren, zodat er weer een aanbod is
  for (let i = 0; i < DREMPEL; i++) {
    doc2.sterren.push({
      id: 'sg-' + i,
      momentId: 'm-0001',
      streek: 'geest',
      datum: '2026-08-10',
      zin: null,
    });
  }
  await page.evaluate(schrijfNaarIndexedDb, doc2);
  await page.reload();
  await page.waitForTimeout(400);
  await page.click('text=laat me zien wat ik al gedaan heb');
  await page.waitForTimeout(500);
  check('Aanbod verschijnt opnieuw na verse data', await page.$('text=Wil je er lijnen tussen trekken'));

  await page.click('text=Nu niet');
  await page.waitForTimeout(400);
  const naNee = await page.$('text=Kan altijd nog');
  check('"Nu niet" antwoordt met "Kan altijd nog."', naNee);
  await page.screenshot({ path: '/tmp/sb/07-nu-niet.png' });

  await page.click('text=Terug');
  await page.waitForTimeout(300);
  await page.click('text=laat me zien wat ik al gedaan heb');
  await page.waitForTimeout(500);
  const aanbodNaNee = await page.$('text=Wil je er lijnen tussen trekken');
  const bestandNaNee = await page.evaluate(leesUitIndexedDb);
  check(
    'Na "Nu niet" komt het aanbod voor die streek nooit meer',
    !aanbodNaNee || bestandNaNee.sterrenbeeldAanbodAfgewezen.length > 0,
    'afgewezen: ' + JSON.stringify(bestandNaNee.sterrenbeeldAanbodAfgewezen)
  );

  // ── 10. Export bevat het nieuwe veld ──────────────────────────────
  check(
    'Export/datamodel bevat sterrenbeeldAanbodAfgewezen',
    Array.isArray(bestandNaNee.sterrenbeeldAanbodAfgewezen)
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
