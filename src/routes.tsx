import type { ReactElement } from "react";
import { Home } from "./pages/Home";
import { Producten } from "./pages/Producten";
import { ProductDetail } from "./pages/ProductDetail";
import { Toepassingen } from "./pages/Toepassingen";
import { SectorDetail } from "./pages/SectorDetail";
import { Projecten } from "./pages/Projecten";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Diensten } from "./pages/Diensten";
import { Kennisbank } from "./pages/Kennisbank";
import { ArtikelDetail } from "./pages/ArtikelDetail";
import { OverOns } from "./pages/OverOns";
import { Contact } from "./pages/Contact";
import { Prijslijst } from "./pages/Prijslijst";
import { Bedankt } from "./pages/Bedankt";
import { Privacy } from "./pages/Privacy";
import { Voorwaarden } from "./pages/Voorwaarden";
import { NietGevonden } from "./pages/NietGevonden";
import { PRODUCTEN } from "./content/nl/producten";
import { PROJECTEN } from "./content/nl/projecten";
import { SECTOREN } from "./content/nl/sectoren";
import { ARTIKELEN } from "./content/nl/kennisbank";

export const ROUTES: { pad: string; element: ReactElement }[] = [
  { pad: "/", element: <Home /> },
  { pad: "/producten", element: <Producten /> },
  { pad: "/producten/:slug", element: <ProductDetail /> },
  { pad: "/toepassingen", element: <Toepassingen /> },
  { pad: "/toepassingen/:slug", element: <SectorDetail /> },
  { pad: "/projecten", element: <Projecten /> },
  { pad: "/projecten/:slug", element: <ProjectDetail /> },
  { pad: "/diensten", element: <Diensten /> },
  { pad: "/kennisbank", element: <Kennisbank /> },
  { pad: "/kennisbank/:slug", element: <ArtikelDetail /> },
  { pad: "/over-ons", element: <OverOns /> },
  { pad: "/contact", element: <Contact /> },
  { pad: "/prijslijst", element: <Prijslijst /> },
  { pad: "/bedankt", element: <Bedankt /> },
  { pad: "/privacy", element: <Privacy /> },
  { pad: "/algemene-voorwaarden", element: <Voorwaarden /> },
  { pad: "*", element: <NietGevonden /> },
];

// Alle concrete routes voor de prerender-stap en de sitemap: één bron.
export function alleRoutes(): string[] {
  return [
    "/",
    "/producten",
    ...PRODUCTEN.map((p) => `/producten/${p.slug}`),
    "/toepassingen",
    ...SECTOREN.map((s) => `/toepassingen/${s.slug}`),
    "/projecten",
    ...PROJECTEN.map((p) => `/projecten/${p.slug}`),
    "/diensten",
    "/kennisbank",
    ...ARTIKELEN.map((a) => `/kennisbank/${a.slug}`),
    "/over-ons",
    "/contact",
    "/prijslijst",
    "/bedankt",
    "/privacy",
    "/algemene-voorwaarden",
    "/404",
  ];
}
