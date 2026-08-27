// G1/G2 — guest landing: destination visible BEFORE any camera permission, then join
// exchanges the invite for a guest grant and hands over to the shared session page.
import { $, api } from './client.js';

const params = new URLSearchParams(location.search);
const token = params.get('t') ?? '';

interface Preview {
  orgName: string;
  passwordRequired: boolean;
  expiresAt: string;
  destinations: { id: string; name: string; kind: string; state: string }[];
}

async function load(): Promise<void> {
  if (params.get('done') === '1') {
    $('title').textContent = 'Thanks for presenting';
    $('orgLine').textContent = 'You can close this tab.';
    $('joinBtn').style.display = 'none';
    return;
  }
  try {
    const p = await api<Preview>('/join/preview', { body: { token }, token: '' });
    $('orgLine').textContent = `Invited by ${p.orgName}`;
    $('dests').innerHTML = p.destinations
      .map(
        (d) => `<div class="dev" style="cursor:default; margin-bottom:8px;">
          <h3>${d.name}</h3><div class="meta">${d.kind}</div>
          <div class="state ${d.state}">${d.state.toUpperCase()}</div></div>`,
      )
      .join('');
    $('expiry').textContent = `LINK VALID UNTIL ${new Date(p.expiresAt).toLocaleString()}`;
    if (p.passwordRequired) $('f-pw').style.display = '';
  } catch (e) {
    $('title').textContent = 'This invite is no longer valid';
    $('orgLine').textContent = (e as Error).message;
    $('joinBtn').style.display = 'none';
  }
}

$('joinBtn').addEventListener('click', async () => {
  const msg = $('msg');
  msg.textContent = '';
  try {
    const r = await api<{ access: string; deviceIds: string[] }>('/join', {
      body: {
        token,
        name: ($('name') as HTMLInputElement).value,
        password: ($('pw') as HTMLInputElement).value || undefined,
      },
      token: '',
    });
    sessionStorage.setItem('hw_guest', JSON.stringify(r));
    location.href = `/session.html?d=${r.deviceIds.join(',')}`;
  } catch (e) {
    msg.textContent = (e as Error).message;
  }
});

void load();
