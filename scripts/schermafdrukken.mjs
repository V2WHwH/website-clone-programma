// Visuele QA: schermafdrukken van kernpagina's op de gevraagde breedtes.
// Vereist een draaiende statische server op AUDIT_BASIS (zie package.json).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASIS = process.env.AUDIT_BASIS || "http://localhost:4390";
const UIT = process.env.SCHERM_UIT || "/tmp/schermen";
const PAGINAS = process.env.SCHERM_PAGINAS
  ? process.env.SCHERM_PAGINAS.split(",")
  : ["/", "/producten", "/producten/interactieve-vloer", "/toepassingen/beurzen-en-events", "/projecten", "/projecten/werken-bij-defensie", "/kennisbank/wat-is-een-interactieve-vloer", "/diensten", "/over-ons", "/contact", "/prijslijst"];
const BREEDTES = (process.env.SCHERM_BREEDTES || "375,430,768,1024,1440,1920").split(",").map(Number);

mkdirSync(UIT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" });

for (const b of BREEDTES) {
  const ctx = await browser.newContext({ viewport: { width: b, height: 900 }, deviceScaleFactor: 1 });
  for (const pad of PAGINAS) {
    const page = await ctx.newPage();
    await page.goto(BASIS + pad, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(400);
    await page.evaluate(
      () =>
        new Promise((res) => {
          let y = 0;
          const t = setInterval(() => {
            y += 700;
            window.scrollTo({ top: y, behavior: "instant" });
            if (y > document.body.scrollHeight) {
              clearInterval(t);
              window.scrollTo({ top: 0, behavior: "instant" });
              res(undefined);
            }
          }, 90);
        })
    );
    await page.waitForTimeout(800);
    const naam = (pad === "/" ? "home" : pad.slice(1).replace(/\//g, "_")) + `-${b}.jpg`;
    await page.screenshot({ path: `${UIT}/${naam}`, fullPage: true, type: "jpeg", quality: 55 });
    await page.close();
  }
  await ctx.close();
  console.log(`breedte ${b} klaar`);
}
await browser.close();
