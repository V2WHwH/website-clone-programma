// S1 — destination selection + pairing claim + invite creation.
import { $, api, clearSession, requireLogin } from './client.js';

interface Device {
  id: string;
  name: string;
  kind: string;
  state: string;
  location: string | null;
}

const s = requireLogin();
$('who').textContent = `${s.user?.name ?? ''} · ${s.org?.name ?? ''} · ${s.org?.role ?? ''}`;
$('rcvUrl').textContent = `${location.origin}/receiver.html`;
$('logout').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST', body: {} }).catch(() => undefined);
  clearSession();
  location.href = '/login.html';
});

const selected = new Set<string>();

function renderDevices(devices: Device[]): void {
  const grid = $('devices');
  grid.innerHTML = '';
  for (const d of devices) {
    const el = document.createElement('div');
    el.className = `dev ${d.state !== 'online' ? 'offline' : ''} ${selected.has(d.id) ? 'sel' : ''}`;
    el.innerHTML = `
      <span class="check">${selected.has(d.id) ? '✓' : ''}</span>
      <h3>${d.name}</h3>
      <div class="meta">${d.kind}${d.location ? ' · ' + d.location : ''}</div>
      <div class="state ${d.state}">${d.state.toUpperCase()}</div>`;
    if (d.state === 'online') {
      el.addEventListener('click', () => {
        if (selected.has(d.id)) selected.delete(d.id);
        else selected.add(d.id);
        void load();
      });
    } else {
      selected.delete(d.id);
    }
    grid.appendChild(el);
  }
  $('selCount').textContent = String(selected.size);
  ($('continue') as HTMLButtonElement).disabled = selected.size === 0;
}

async function load(): Promise<void> {
  try {
    const r = await api<{ devices: Device[] }>('/devices');
    renderDevices(r.devices);
  } catch (e) {
    $('msg').textContent = (e as Error).message;
  }
}

$('continue').addEventListener('click', () => {
  location.href = `/session.html?d=${[...selected].join(',')}`;
});

$('pairClaim').addEventListener('click', async () => {
  const out = $('pairMsg');
  out.className = 'msg';
  out.textContent = '';
  try {
    await api('/devices/claim', {
      body: {
        code: ($('pairCode') as HTMLInputElement).value,
        name: ($('pairName') as HTMLInputElement).value,
        kind: ($('pairKind') as HTMLSelectElement).value,
      },
    });
    out.className = 'msg ok';
    out.textContent = 'Paired. The display authenticates itself within seconds.';
    void load();
  } catch (e) {
    out.textContent = (e as Error).message;
  }
});

$('invCreate').addEventListener('click', async () => {
  const out = $('invOut');
  out.textContent = '';
  try {
    if (selected.size === 0) throw new Error('select at least one destination first');
    const usesRaw = ($('invUses') as HTMLSelectElement).value;
    const r = await api<{ path: string }>('/invites', {
      body: {
        deviceIds: [...selected],
        ttlHours: Number(($('invTtl') as HTMLInputElement).value || 24),
        maxUses: usesRaw === '' ? null : Number(usesRaw),
        password: ($('invPw') as HTMLInputElement).value || undefined,
      },
    });
    out.textContent = `${location.origin}${r.path}`;
  } catch (e) {
    out.textContent = (e as Error).message;
  }
});

void load();
setInterval(load, 5000); // live online/offline state
