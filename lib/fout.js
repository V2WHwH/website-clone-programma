// Een fout waarvan de melding naar de gebruiker mag (de foutafhandeling in
// server.js geeft andere meldingen nooit letterlijk door).
'use strict';

module.exports = function fout(status, message) {
  return Object.assign(new Error(message), { status, publiek: true });
};
