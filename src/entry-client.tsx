import { hydrateRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/global.css";

// Normaal staat de site in de webroot. Draait hij als demo onder een
// submap (GitHub Pages), dan zet scripts/submap-klaarzetten.mjs dat pad in
// het html-element; de router rekent daar dan mee, zodat klikken binnen de
// site niet naar een niet-bestaand adres in de webroot springt.
const basispad = document.documentElement.dataset.basispad || undefined;

// De demo in één bestand (scripts/demo-eenbestand.mjs) heeft geen server
// achter zich: daar bestaat alleen de startpagina en zijn alle andere
// pagina's adressen die geen bestand hebben. Met een adres achter een
// hekje blijft alles binnen dat ene bestand werken, ook als je het gewoon
// vanaf je schijf opent. De echte site gebruikt gewone adressen.
const demo = document.documentElement.dataset.demo === "1";
const Router = demo ? HashRouter : BrowserRouter;

hydrateRoot(document.getElementById("root")!, (
  <Router basename={demo ? undefined : basispad}>
    <App />
  </Router>
), {
  onRecoverableError: (err, info) => {
    console.warn("HYDRATIEFOUT:", (err as Error).message?.slice(0, 120), "STACK:", (info as { componentStack?: string })?.componentStack?.split("\n").slice(0, 6).join(" > "));
  },
});
