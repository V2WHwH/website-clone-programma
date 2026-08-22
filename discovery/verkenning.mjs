// Haalt referentiesites op en legt vast hoe ze eruitzien: de HTML plus
// schermafdrukken op een aantal scrollposities. Die reeks laat zien of een
// achtergrond blijft staan terwijl de tekst eroverheen schuift, en hoe de
// opbouw van boven naar beneden loopt.
//
// Draait in een GitHub-runner: de bouwomgeving hier mag deze domeinen niet
// bereiken (het egress-beleid weigert ze).
//
// Invoer: discovery/verken-urls.txt, één adres per regel (# is commentaar).
// Uitvoer: discovery/referenties/<naam>-<n>.jpg en <naam>.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const UIT = "discovery/referenties";
mkdirSync(UIT, { recursive: true });

const adressen = readFileSync("discovery/verken-urls.txt", "utf8")
  .split("\n").map((r) => r.trim()).filter((r) => r && !r.startsWith("#"));

const browser = await chromium.launch();
for (const adres of adressen) {
  const naam = adres.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "-").replace(/-+$/, "");
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const pagina = await ctx.newPage();
    await pagina.goto(adres, { waitUntil: "networkidle", timeout: 45000 });
    await pagina.waitForTimeout(2500);
    writeFileSync(`${UIT}/${naam}.html`, await pagina.content());

    // Zes standen over de hele pagina. Bij een vaste achtergrond zie je in
    // die reeks dezelfde grond terug met steeds andere tekst eroverheen.
    for (let i = 0; i < 6; i++) {
      await pagina.evaluate((n) => window.scrollTo({ top: n * window.innerHeight * 0.9, behavior: "instant" }), i);
      await pagina.waitForTimeout(1400);
      await pagina.screenshot({ path: `${UIT}/${naam}-${i}.jpg`, quality: 62, type: "jpeg" });
    }
    console.log(`${naam}: klaar`);
    await ctx.close();
  } catch (e) {
    console.log(`MISLUKT ${naam}: ${e.message}`);
  }
}
await browser.close();
