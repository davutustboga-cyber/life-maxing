// test-nu-en-verankeren.js — v25.
//
// Deze suite dekt de vijf dingen die in de ronde van 10 september 2026 zijn
// gerepareerd of toegevoegd, en die geen van de bestaande suites raakte:
//
//   1. De canvassen tekenen werkelijk iets (De Schijf op S1, S6 en Dag
//      sluiten; De Hemel). Dat was de zwaarste bevinding: sinds de View
//      Transitions-ronde werd elk canvas gemeten vóórdat het in de pagina
//      stond, kreeg het breedte nul, en bleef het als zwart vlak staan.
//   2. Een tik direct ná een schermwissel komt aan bij het element eronder.
//      De overgangslaag slokte die op.
//   3. Een oefening vanaf "Doen" laat een ster achter, met de regel die je
//      erbij schreef. Tot v25 legde de hele hoofdweg door de app niets vast.
//   4. De Onderbreker en de herstelroute bieden een kort lijstje in plaats
//      van drieëntwintig titels, en respecteren de islamitische laag.
//   5. Wat je zelf opschreef komt terug: "iets kleins voor morgen" 's
//      ochtends, de kerntaak later op de dag, het als-dan-plan bij De
//      Onderbreker. En de kompaslus heeft overal een weg terug.

const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const BASIS = 'http://localhost:8792';
const uitkomsten = [];
function check(naam, waar, extra) {
  uitkomsten.push({ naam, ok: !!waar, extra: extra ?? '' });
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
      const g = db.transaction('bestand', 'readonly').objectStore('bestand').get('het-bestand');
      g.onsuccess = () => resolve(g.result);
      g.onerror = () => reject(g.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function bestand(extra = {}) {
  return Object.assign(
    {
      versie: '1.0',
      aangemaaktOp: '2026-08-01T09:00:00+02:00',
      instellingen: {
        islamitischeLaag: true,
        rustigeBeelden: false,
        ethischeOndergrensGezien: true,
        weekmomentAan: true,
        visieCheckIns: { ochtend: true, middag: true, avond: true },
        visieIntroAangeboden: true,
      },
      woordenUitbreiding: [],
      momenten: [],
      sterren: [],
      sterrenbeelden: [],
      onderdrukkingen: [],
      sterrenbeeldAanbodAfgewezen: [],
      brieven: [],
      weekmomenten: [],
      perfectionismeChecks: [],
      frictieAangebodenMaanden: [],
      wieIkWord: null,
      verlangenVanDePeriode: null,
      ochtendMomenten: [],
      dagsluitingen: [],
      doel: null,
      visie: null,
      conceptDoel: null,
      conceptDagsluiting: null,
    },
    extra
  );
}

function dagSleutel(offsetDagen = 0) {
  const d = new Date(Date.now() - offsetDagen * 86400000);
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

/** Hoeveel van dit canvas is werkelijk beschreven? Nul betekent: er staat een
 * zwart vlak waar het instrument hoort. */
function canvasGevuld(selector) {
  const c = document.querySelector(selector);
  if (!c) return { gevonden: false };
  const ctx = c.getContext('2d');
  if (!c.width || !c.height) return { gevonden: true, breedte: c.width, pixels: 0 };
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let gevuld = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) gevuld++;
  return { gevonden: true, breedte: c.width, pixels: gevuld };
}

async function nieuwePagina(browser, doc, klok) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'nl-BE',
    timezoneId: 'Europe/Brussels',
  });
  const page = await ctx.newPage();
  const fouten = [];
  page.on('pageerror', (e) => fouten.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') fouten.push('CONSOLE: ' + m.text());
  });
  if (klok) await page.clock.install({ time: new Date(klok) });
  await page.goto(BASIS + '/index.html');
  await page.waitForTimeout(300);
  if (doc) {
    await page.evaluate(schrijfNaarIndexedDb, doc);
    await page.reload();
    await page.waitForTimeout(500);
  }
  return { ctx, page, fouten };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const alleFouten = [];

  // ── 1. De Schijf tekent op S1 ─────────────────────────────────────
  {
    const { ctx, page, fouten } = await nieuwePagina(browser, bestand(), '2026-09-10T12:30:00');
    await page.locator('text=Hoe voel je je?').first().click();
    await page.waitForTimeout(300);
    check('S2 heeft een weg terug', await page.$('.terug-knop'));
    await page.click('text=nauwkeuriger aangeven met de cirkel');
    await page.waitForTimeout(400);
    const schijf = await page.evaluate(canvasGevuld, 'canvas.schijf-canvas');
    check(
      'De Schijf tekent werkelijk iets op S1',
      schijf.gevonden && schijf.breedte > 0 && schijf.pixels > 1000,
      JSON.stringify(schijf)
    );

    // ── 2. Een tik direct na de schermwissel komt aan ───────────────
    const box = await (await page.$('canvas.schijf-canvas')).boundingBox();
    const raak = await page.evaluate(
      ([x, y]) => {
        const e = document.elementFromPoint(x, y);
        return e ? e.tagName.toLowerCase() : 'niets';
      },
      [box.x + box.width / 2, box.y + box.height / 2]
    );
    check('Een tik midden op De Schijf komt bij het canvas uit', raak === 'canvas', raak);

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    check('Loslaten op de schijf gaat door naar de woorden', await page.$('.woord-knop'));
    const wk = await page.$$('.woord-knop');
    await wk[0].click();
    await page.click('text=Verder');
    await page.waitForTimeout(300);
    check('S3 (tijdvraag) heeft een weg terug', await page.$('.terug-knop'));
    await page.click('text=tien minuten');
    await page.waitForTimeout(400);
    check('S4 (de deuren) heeft een weg terug', await page.$('.terug-knop'));
    const waaromKnop = await page.$('text=waarom dit werkt +');
    check('De deuren laten zich uitleggen vóór je kiest', waaromKnop);
    if (waaromKnop) {
      await waaromKnop.click();
      await page.waitForTimeout(300);
      const regels = await page.$$eval('.deur .herkomst-regel', (ns) => ns.map((n) => n.textContent.trim()));
      check('De onderbouwing staat er dan echt', regels.length > 0 && regels[0].length > 30, regels[0] || '');
    }
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 3. Een oefening vanaf "Doen" laat een ster achter ─────────────
  {
    const { ctx, page, fouten } = await nieuwePagina(browser, bestand(), '2026-09-10T12:30:00');
    await page.locator('.nav-item').nth(1).click();
    await page.waitForTimeout(300);
    await page.click('text=Rust vinden');
    await page.waitForTimeout(300);
    await page.click('text=Ademen met lange uitademing');
    await page.waitForTimeout(300);
    for (let i = 0; i < 8; i++) {
      const volgende = await page.$('button:has-text("Volgende")');
      if (!volgende) break;
      await volgende.click();
      await page.waitForTimeout(150);
    }
    const klaar = await page.$('button:has-text("Klaar")');
    if (klaar) await klaar.click();
    await page.waitForTimeout(400);
    const veld = await page.$('textarea');
    check('Na een oefening vanaf "Doen" staat er een plek voor één regel', veld);
    if (veld) await veld.fill('Twee minuten, en het zakte.');
    await page.click('button:has-text("Sluiten")');
    await page.waitForTimeout(2200);
    const doc = await page.evaluate(leesUitIndexedDb);
    check(
      'Er is een ster bewaard, met de regel die je schreef',
      doc.sterren.length === 1 && doc.sterren[0].zin === 'Twee minuten, en het zakte.',
      JSON.stringify(doc.sterren)
    );
    check(
      'De ster staat in de streek van de beweging en telt niets mee',
      doc.sterren[0] && doc.sterren[0].streek === 'lichaam' && doc.momenten.length === 0,
      JSON.stringify({ streek: doc.sterren[0] && doc.sterren[0].streek, momenten: doc.momenten.length })
    );
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 4. De Hemel tekent, en het korte lijstje bij De Onderbreker ───
  {
    const sterren = Array.from({ length: 6 }, (_, i) => ({
      id: `s-${i}`,
      momentId: null,
      streek: 'lichaam',
      datum: dagSleutel(i + 1),
      zin: i === 0 ? 'Een regel van toen.' : null,
    }));
    const { ctx, page, fouten } = await nieuwePagina(
      browser,
      bestand({
        sterren,
        doel: {
          wish: 'eerder beginnen',
          outcome: 'rustiger ochtend',
          obstacleTekst: 'ik pak mijn telefoon in bed',
          planAls: 'ik mijn telefoon in bed pak',
          planDan: 'zet ik hem in de gang en sta ik op',
          sinds: '2026-09-01T09:00:00+02:00',
        },
      }),
      '2026-09-10T12:30:00'
    );
    await page.locator('.nav-item').nth(2).click();
    await page.waitForTimeout(300);
    await page.click('text=Wat je al deed');
    await page.waitForTimeout(600);
    const hemel = await page.evaluate(canvasGevuld, 'canvas.hemel-canvas');
    check(
      'De Hemel tekent werkelijk sterren',
      hemel.gevonden && hemel.breedte > 0 && hemel.pixels > 200,
      JSON.stringify(hemel)
    );

    // De Hemel is een "één-ding-per-scherm"-scherm en heeft geen
    // navigatiebalk: eerst met het terug-pijltje naar Terugkijken.
    await page.click('.terug-knop');
    await page.waitForTimeout(400);
    await page.locator('.nav-item').nth(0).click();
    await page.waitForTimeout(400);
    const thuis = await page.$eval('#app', (n) => n.innerText);
    const aantalKompas = (thuis.match(/Hoe voel je je\?/g) || []).length;
    check('"Hoe voel je je?" staat er niet twee keer op', aantalKompas <= 1, `aantal: ${aantalKompas}`);

    await page.click('text=Ik zit vast in mijn telefoon');
    await page.waitForTimeout(400);
    const onderbrekerTekst = await page.$eval('#app', (n) => n.innerText);
    check(
      'De Onderbreker toont je eigen als-dan-plan',
      onderbrekerTekst.includes('zet ik hem in de gang'),
      onderbrekerTekst.slice(0, 80).replace(/\n/g, ' | ')
    );
    await page.click('text=Ik doe iets anders');
    await page.waitForTimeout(400);
    const kaarten = await page.$$eval('.kaart', (ns) => ns.length);
    check('Het korte lijstje is kort (niet drieëntwintig titels)', kaarten > 2 && kaarten <= 8, `kaarten: ${kaarten}`);
    check('De hele bibliotheek blijft één tik weg', await page.$('text=de hele bibliotheek'));
    await page.click('text=de hele bibliotheek');
    await page.waitForTimeout(400);
    const alle = await page.$$eval('.kaart', (ns) => ns.length);
    const koppen = await page.$$eval('.sectie-kop', (ns) => ns.map((n) => n.textContent.trim()));
    check('De hele bibliotheek staat er, gegroepeerd per domein', alle >= 20 && koppen.length >= 6, `${alle} kaarten / ${koppen.length} groepen`);
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 5. Met de islamitische laag uit blijft die laag ook hier uit ──
  {
    const doc = bestand();
    doc.instellingen.islamitischeLaag = false;
    const { ctx, page, fouten } = await nieuwePagina(browser, doc, '2026-09-10T12:30:00');
    await page.click('text=Ik ben eruit gevallen');
    await page.waitForTimeout(300);
    await page.click('text=Verder');
    await page.waitForTimeout(400);
    await page.click('text=de hele bibliotheek');
    await page.waitForTimeout(400);
    const tekst = await page.$eval('#app', (n) => n.innerText);
    check(
      'Zonder de islamitische laag komen de islamitische bewegingen hier niet voor',
      !tekst.includes('Shukr') && !tekst.includes('Sayyid') && !tekst.includes('Muhasabah') && !tekst.includes('dhikr'),
      tekst.slice(0, 60).replace(/\n/g, ' | ')
    );
    check('"geen stap nu" blijft bereikbaar', await page.$('text=geen stap nu'));
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 6. Wat je zelf opschreef komt terug ───────────────────────────
  {
    const doc = bestand({
      dagsluitingen: [
        {
          id: 'd-1',
          datum: dagSleutel(1),
          positie: null,
          chips: ['slecht_geslapen'],
          dankbaarheid: null,
          zin: null,
          voorMorgen: 'eerst tien minuten wandelen, dan pas de telefoon',
        },
      ],
    });
    const { ctx, page, fouten } = await nieuwePagina(browser, doc, '2026-09-10T07:30:00');
    const ochtend = await page.$eval('#app', (n) => n.innerText);
    check(
      "'Iets kleins voor morgen' komt de volgende ochtend terug",
      ochtend.includes('eerst tien minuten wandelen'),
      ochtend.slice(0, 120).replace(/\n/g, ' | ')
    );
    check(
      'Wat je gisteravond aanvinkte staat in de reden waarom dit nu past',
      ochtend.includes('slecht geslapen'),
      ochtend.slice(0, 200).replace(/\n/g, ' | ')
    );
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 7. De kerntaak van vanmorgen, later op de dag ─────────────────
  {
    const doc = bestand({
      ochtendMomenten: [
        { id: 'o-1', datum: dagSleutel(0), intentie: 'rustig blijven', kerntaak: 'het hoofdstuk afmaken' },
      ],
    });
    const { ctx, page, fouten } = await nieuwePagina(browser, doc, '2026-09-10T14:30:00');
    const middag = await page.$eval('#app', (n) => n.innerText);
    check(
      'De kerntaak van vanmorgen staat er later op de dag nog',
      middag.includes('het hoofdstuk afmaken'),
      middag.slice(0, 140).replace(/\n/g, ' | ')
    );
    alleFouten.push(...fouten);
    await ctx.close();
  }

  // ── 8. Dag sluiten: het kompas staat er en tekent ─────────────────
  {
    const { ctx, page, fouten } = await nieuwePagina(browser, bestand(), '2026-09-10T21:40:00');
    await page.click('.kaart-primair');
    await page.waitForTimeout(600);
    const schijf = await page.evaluate(canvasGevuld, 'canvas.schijf-canvas');
    check(
      'Dag sluiten stap 1 tekent De Schijf, niet een zwart vlak',
      schijf.gevonden && schijf.breedte > 0 && schijf.pixels > 1000,
      JSON.stringify(schijf)
    );
    const labels = await page.$$eval('.kompas-as-verticaal, .kompas-as-horizontaal', (ns) => ns.length);
    check('De aslabels staan om de schijf', labels >= 2, `labels: ${labels}`);
    alleFouten.push(...fouten);
    await ctx.close();
  }

  console.log('\n=== UITKOMSTEN ===');
  let gefaald = 0;
  for (const u of uitkomsten) {
    if (!u.ok) gefaald++;
    console.log(`  ${u.ok ? 'OK  ' : 'FOUT'} ${u.naam}${u.extra ? `  [${u.extra}]` : ''}`);
  }
  console.log('\nFOUTEN IN CONSOLE/PAGINA:', alleFouten.length ? alleFouten : 'geen');
  console.log(`GEFAALD: ${gefaald}`);
  await browser.close();
  process.exit(gefaald === 0 && alleFouten.length === 0 ? 0 : 1);
})();
