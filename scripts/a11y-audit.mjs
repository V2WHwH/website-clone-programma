// Toegankelijkheids- en UX-heuristieken: koppenvolgorde, naamloze
// links/knoppen, main-landmark, zichtbare focus, tikdoelen, reduced motion.
import { chromium } from "playwright";
import { KERNROUTES } from "./routes-audit.mjs";

const BASIS = process.env.AUDIT_BASIS || "http://localhost:4390";
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" });
let problemen = 0;

const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
for (const route of KERNROUTES) {
  await page.goto(BASIS + route, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const uit = [];
    const koppen = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
    for (let i = 1; i < koppen.length; i++) if (koppen[i] - koppen[i - 1] > 1) { uit.push(`kopsprong h${koppen[i - 1]}->h${koppen[i]}`); break; }
    let naamloos = 0;
    for (const el of document.querySelectorAll("a,button")) {
      const naam = (el.getAttribute("aria-label") || el.textContent || el.querySelector("img")?.alt || "").trim();
      if (!naam) naamloos++;
    }
    if (naamloos) uit.push(`${naamloos} links/knoppen zonder naam`);
    if (!document.querySelector("main")) uit.push("geen <main>");
    let it = 0;
    for (const f of document.querySelectorAll("iframe")) if (!f.title) it++;
    if (it) uit.push(`${it} iframe zonder title`);
    return uit;
  });
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "TAB LANDT NERGENS";
    const st = getComputedStyle(el);
    const zichtbaar = st.outlineStyle !== "none" || st.boxShadow !== "none";
    return `${el.tagName.toLowerCase()}${zichtbaar ? "" : " FOCUS ONZICHTBAAR"}`;
  });
  if (r.length || focus.includes("NERGENS") || focus.includes("ONZICHTBAAR")) problemen++;
  console.log(`${route}: ${r.length ? r.join("; ") : "ok"} | eerste tab: ${focus}`);
}

const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
for (const route of KERNROUTES.slice(0, 4)) {
  await mob.goto(BASIS + route, { waitUntil: "networkidle" });
  const klein = await mob.evaluate(() => {
    let n = 0;
    const voorbeelden = [];
    // WCAG 2.2, SC 2.5.8 Target Size (Minimum) kent een uitzondering
    // "Inline": een doel dat in een zin staat, of waarvan de maat wordt
    // bepaald door de regelhoogte van de omringende tekst, hoeft de 24 px
    // niet te halen. Zonder die uitzondering keurt deze controle elke
    // gewone tekstlink in een alinea af, en dat is strenger dan de norm.
    const inZin = (el) => {
      const ouder = el.parentElement;
      if (!ouder) return false;
      const omheen = (ouder.textContent || "").replace(el.textContent || "", "").trim();
      return omheen.length > 0;
    };
    for (const el of document.querySelectorAll("a,button")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0 || b.top > 2500) continue;
      if (inZin(el)) continue;
      if ((el.textContent || "").trim().length > 0 && b.height < 24) {
        n++;
        if (voorbeelden.length < 3) voorbeelden.push((el.textContent || "").trim().slice(0, 30) + ` (${Math.round(b.width)}x${Math.round(b.height)})`);
      }
    }
    return { n, voorbeelden };
  });
  if (klein.n) problemen++;
  console.log(`mobiel ${route}: ${klein.n} kleine tikdoelen ${klein.voorbeelden.join(" | ")}`);
}

const rm = await browser.newContext({ reducedMotion: "reduce" });
const rp = await rm.newPage();
await rp.goto(BASIS + "/", { waitUntil: "networkidle" });
await rp.waitForTimeout(800);
const video = await rp.evaluate(() => {
  const v = document.querySelector("video");
  return v ? { autoplay: v.autoplay, paused: v.paused } : null;
});
if (video && video.autoplay && !video.paused) {
  problemen++;
  console.log("reduced motion: herovideo speelt nog, hoort gepauzeerd te zijn");
} else {
  console.log("reduced motion, herovideo:", JSON.stringify(video));
}
await browser.close();
process.exit(problemen ? 1 : 0);
