// Het huur/koop-signaal komt uit de leveringstekst van het product zelf.
// Zo staat er op een kaart of in een hero nooit iets wat de pagina niet ook
// uitlegt, en hoeft er geen los veld te worden bijgehouden dat na een
// tekstwijziging stilletjes onwaar wordt.
export function leveringLabel(levering: string): string | null {
  const huur = /te huur|verhuur/i.test(levering);
  const koop = /te koop|koopoplossing|aankoop/i.test(levering);
  if (huur && koop) return "Te koop en te huur";
  if (huur) return "Te huur";
  if (koop) return "Te koop";
  return null;
}
