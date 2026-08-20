// Screenshots van de huidige site en de drie designreferenties, desktop en
// mobiel. Draait in de GitHub Actions-runner met Playwright.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const DOELEN = [
  ["v2w-home", "https://www.vision2watch.nl/"],
  ["v2w-producten", "https://www.vision2watch.nl/producten"],
  ["v2w-projecten", "https://www.vision2watch.nl/blog"],
  ["v2w-interactieve-vloer", "https://www.vision2watch.nl/product/interactieve-vloer"],
  ["ref-firstimpression", "https://firstimpression.nl/"],
  ["ref-fplus", "https://fplus.ai/en"],
  ["ref-bam", "https://bamlab.ch/en/"],
];
const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["mobiel", 390, 844],
];

mkdirSync("discovery/screenshots", { recursive: true });
const browser = await chromium.launch();

for (const [naam, url] of DOELEN) {
  for (const [vp, w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "nl-NL" });
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(3500);
      // lazyload triggeren
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 150));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `discovery/screenshots/${naam}-${vp}.jpg`, fullPage: true, quality: 55, type: "jpeg" });
      console.log(`ok: ${naam}-${vp}`);
    } catch (e) {
      console.log(`FOUT ${naam}-${vp}: ${e.message}`);
    }
    await ctx.close();
  }
}
await browser.close();
