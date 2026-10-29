// Draait alle studio-tests na elkaar. Een test die faalt krijgt één tweede
// kans: sommige controles meten tijd (overgangen van een paar honderd
// milliseconden) en een drukke testmachine kan daar een keer naast zitten.
// Faalt hij twee keer, dan is het echt.
const { spawnSync } = require('child_process');
const path = require('path');

const TESTS = ['rooktest', 'kliktest', 'playlisttest', 'muziektest', 'streamtest', 'toetsenbordtest', 'layouttest',
  'kerntest', 'scenetest', 'verhuistest', 'beeldtest', '3dtest', 'sensortest', 'instellingentest'];
const alleen = process.argv.slice(2);
const uitslag = [];
for (const t of TESTS.filter((x) => !alleen.length || alleen.includes(x))) {
  let poging = 0, gelukt = false, regel = '';
  while (!gelukt && poging < 2) {
    poging++;
    console.log(`\n=== ${t}${poging > 1 ? ' (tweede poging)' : ''}`);
    const r = spawnSync(process.execPath, [path.join(__dirname, t + '.js')], { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
    process.stdout.write(r.stdout || '');
    regel = ((r.stdout || '').match(/(OK|FOUT)\s*:\s*\d+\/\d+/g) || []).pop() || `afgebroken (code ${r.status})`;
    gelukt = r.status === 0;
  }
  uitslag.push({ t, gelukt, regel, poging });
}
console.log('\n=== Samenvatting');
for (const u of uitslag) console.log(`${u.gelukt ? '✓' : '✗'} ${u.t.padEnd(16)} ${u.regel}${u.poging > 1 ? '  (na tweede poging)' : ''}`);
process.exit(uitslag.every((u) => u.gelukt) ? 0 : 1);
