import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { bouwHead } from "./seo/head";
import { alleRoutes } from "./routes";

// Aangeroepen door scripts/prerender.mjs voor elke route.
export function render(pad: string): { html: string; head: string } {
  const html = renderToString(
    <StaticRouter location={pad}>
      <App />
    </StaticRouter>
  );
  return { html, head: bouwHead(pad) };
}

// De prerender-stap leest de routelijst uit dezelfde bron als de app.
export function routes(): string[] {
  return alleRoutes();
}
