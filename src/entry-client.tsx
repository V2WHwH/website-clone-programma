import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/global.css";

// Normaal staat de site in de webroot. Draait hij als demo onder een
// submap (GitHub Pages), dan zet scripts/submap-klaarzetten.mjs dat pad in
// het html-element; de router rekent daar dan mee, zodat klikken binnen de
// site niet naar een niet-bestaand adres in de webroot springt.
const basispad = document.documentElement.dataset.basispad || undefined;

hydrateRoot(document.getElementById("root")!, (
  <BrowserRouter basename={basispad}>
    <App />
  </BrowserRouter>
), {
  onRecoverableError: (err, info) => {
    console.warn("HYDRATIEFOUT:", (err as Error).message?.slice(0, 120), "STACK:", (info as { componentStack?: string })?.componentStack?.split("\n").slice(0, 6).join(" > "));
  },
});
