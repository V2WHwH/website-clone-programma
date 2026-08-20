import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/site/Header";
import { Footer } from "./components/site/Footer";
import { ROUTES } from "./routes";
import { titelVoorPad } from "./seo/head";

export function App() {
  const locatie = useLocation();

  // bij client-side navigatie: titel bijwerken en naar boven scrollen
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);
  useEffect(() => {
    document.title = titelVoorPad(locatie.pathname);
    if (locatie.hash) {
      document.querySelector(locatie.hash)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [locatie.pathname, locatie.hash]);

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main id="inhoud" className="flex-1">
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.pad} path={r.pad} element={r.element} />
          ))}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
