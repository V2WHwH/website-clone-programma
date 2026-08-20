import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [naam, w, h, mob] of [["mobiel", 390, 844, true], ["desktop", 1440, 900, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 3 : 1 });
  const p = await ctx.newPage();
  const fouten = [];
  p.on("console", (m) => m.type() === "error" && fouten.push(m.text().slice(0, 140)));
  await p.goto("http://localhost:4392/", { waitUntil: "load" });
  await p.waitForTimeout(4000);
  const st = await p.evaluate(() => {
    const v = document.querySelector("video");
    const img = document.querySelector("section img");
    return {
      videoBron: v?.currentSrc?.split("/").pop() || null,
      speelt: v ? !v.paused : null,
      videoTijd: v?.currentTime ?? null,
      videoOpacity: v ? getComputedStyle(v).opacity : null,
      posterGebruikt: img?.currentSrc?.split("/").pop() || null,
    };
  });
  console.log(naam, JSON.stringify(st), "consolefouten:", fouten.length ? fouten : "geen");
  await p.screenshot({ path: `/tmp/hero-${naam}.jpg`, type: "jpeg", quality: 70 });
  await ctx.close();
}
await b.close();
