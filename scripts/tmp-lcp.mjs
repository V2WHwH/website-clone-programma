import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto("http://localhost:4392/", { waitUntil: "load" });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => new Promise((res) => {
  new PerformanceObserver((l) => {
    const e = l.getEntries().at(-1);
    res({ tijd: Math.round(e.startTime), url: e.url || "(tekst)", tag: e.element?.tagName, klasse: (e.element?.className||"").slice(0,60), tekst: (e.element?.textContent||"").slice(0,70) });
  }).observe({ type: "largest-contentful-paint", buffered: true });
  setTimeout(() => res({ tijd: -1 }), 3000);
}));
console.log(JSON.stringify(r, null, 1));
await b.close();
