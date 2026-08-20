import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/global.css";

hydrateRoot(document.getElementById("root")!, (
  <BrowserRouter>
    <App />
  </BrowserRouter>
), {
  onRecoverableError: (err, info) => {
    console.warn("HYDRATIEFOUT:", (err as Error).message?.slice(0, 120), "STACK:", (info as { componentStack?: string })?.componentStack?.split("\n").slice(0, 6).join(" > "));
  },
});
