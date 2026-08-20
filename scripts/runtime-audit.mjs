// Runtime-audit: consolefouten, mislukte requests, LCP/CLS-indicatie,
// mobiele weergave en formuliervalidatie, tegen een lokale dist-server.
// Start eerst: npx vite preview --port 4390 (of een statische server op dist/).
import { chromium } from "playwright";
import { KERNROUTES } from "./routes-audit.mjs";

const BASIS = process.env.AUDIT_BASIS || "http://localhost:4390";
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" });

let problemen = 0;
for (const mobiel of [false, true]) {
  console.log(`\n===== ${mobiel ? "MOBIEL 390x844" : "DESKTOP 1366x900"} =====`);
  const ctx = await browser.newContext(mobiel
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }
    : { viewport: { width: 1366, height: 900 } });
  for (const route of KERNROUTES) {
    const page = await ctx.newPage();
    const fouten = [], mislukt = [];
    page.on("console", (m) => { if (m.type() === "error") fouten.push(m.text().slice(0, 120)); });
    page.on("requestfailed", (r) => mislukt.push(r.url().replace(BASIS, "").slice(0, 90)));
    const resp = await page.goto(BASIS + route, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
    const status = resp ? resp.status() : "TIMEOUT";
    await page.waitForTimeout(600);
    const metrics = await page.evaluate(() => new Promise((res) => {
      let lcp = 0, cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      const nav = performance.getEntriesByType("navigation")[0];
      setTimeout(() => res({ lcp: Math.round(lcp), cls: cls.toFixed(3), dcl: Math.round(nav?.domContentLoadedEventEnd || 0) }), 700);
    }));
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    if (status !== 200 || hscroll || fouten.length || mislukt.length || +metrics.cls > 0.02) problemen++;
    console.log(`${route}  status=${status} lcp=${metrics.lcp}ms cls=${metrics.cls} dcl=${metrics.dcl}ms${hscroll ? " HSCROLL!" : ""}${fouten.length ? " CONSOLE:" + fouten.length : ""}${mislukt.length ? " FAILEDREQ:" + mislukt.length : ""}`);
    for (const f of fouten.slice(0, 3)) console.log("    console:", f);
    for (const f of mislukt.slice(0, 3)) console.log("    failed:", f);
    await page.close();
  }
  await ctx.close();
}

console.log("\n===== FORMULIER /contact =====");
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASIS + "/contact", { waitUntil: "networkidle" });
const formulier = page.locator("form").first();
const velden = await formulier.locator("input, textarea, select").count();
const verplicht = await formulier.locator("[required]").count();
const labels = await formulier.locator("label").count();
await formulier.locator('button[type="submit"]').first().click().catch(() => {});
await page.waitForTimeout(500);
const validatie = await page.evaluate(() => {
  const inp = document.querySelector("form input:invalid, form textarea:invalid");
  return inp ? "browservalidatie actief op: " + (inp.getAttribute("name") || inp.id || inp.type) : "GEEN :invalid GEVONDEN";
});
console.log(`velden=${velden} verplicht=${verplicht} labels=${labels} | ${validatie}`);
await browser.close();
process.exit(problemen ? 1 : 0);
