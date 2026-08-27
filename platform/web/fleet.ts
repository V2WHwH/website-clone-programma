// C1 — the fleet, one screen (M7): summary, alerts, devices with host health and remote
// actions, sessions with measured analytics, and the audit trail. Every number shown here
// is measured or recorded; a dash means "this host does not expose that value".
import { $, api, clearSession, requireLogin } from './client.js';

const s = requireLogin();
$('who').textContent = `${s.user?.name ?? ''} · ${s.org?.name ?? ''} · ${s.org?.role ?? ''}`;
$('logout').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST', body: {} }).catch(() => undefined);
  clearSession();
  location.href = '/login.html';
});

interface Health {
  load1?: number;
  cores?: number;
  memTotalBytes?: number;
  memFreeBytes?: number;
  disk?: { freePct: number } | null;
  temperatureC?: number | null;
  hostUptimeS?: number;
}
interface Device {
  id: string;
  name: string;
  kind: string;
  state: string;
  location: string | null;
  agent_version: string | null;
  last_seen_at: string | null;
  health: Health | null;
  health_at: string | null;
}
interface Alert {
  id: string;
  device_name: string | null;
  kind: string;
  message: string;
  raised_at: string;
  resolved_at: string | null;
  resolve_note: string | null;
}

const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const gb = (bytes: number): string => (bytes / 1e9).toFixed(2);
const ago = (iso: string | null): string => {
  if (!iso) return '—';
  const s2 = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  return s2 < 90 ? `${Math.round(s2)}s ago` : s2 < 5400 ? `${Math.round(s2 / 60)}m ago` : `${Math.round(s2 / 3600)}h ago`;
};
const dur = (secs: number): string => {
  const m = Math.floor(secs / 60);
  return m ? `${m}m ${Math.round(secs % 60)}s` : `${Math.round(secs)}s`;
};

async function loadSummary(): Promise<void> {
  const r = await api<{
    devices: { total: number; online: number };
    openAlerts: number;
    liveSessions: number;
    last24h: { sessions: number; mediaMinutes: number; egressBytes: number };
  }>('/fleet/summary');
  $('kpis').innerHTML = [
    ['devices online', `${r.devices.online}<i style="font-size:15px;opacity:.55">/${r.devices.total}</i>`],
    ['open alerts', String(r.openAlerts)],
    ['live sessions', String(r.liveSessions)],
    ['sessions · 24 h', String(r.last24h.sessions)],
    ['media minutes · 24 h', String(r.last24h.mediaMinutes)],
    ['video egress · 24 h', `${gb(r.last24h.egressBytes)}<i style="font-size:13px;opacity:.55"> GB</i>`],
  ]
    .map(([label, value]) => `<div class="kpi"><b>${value}</b><span>${label}</span></div>`)
    .join('');
}

async function loadAlerts(): Promise<void> {
  const r = await api<{ alerts: Alert[] }>('/alerts?all=1');
  const open = r.alerts.filter((a) => !a.resolved_at);
  $('alertSub').textContent = open.length ? `${open.length} open` : 'all clear';
  $('alerts').innerHTML =
    r.alerts
      .slice(0, 12)
      .map(
        (a) => `
    <div class="alert ${a.resolved_at ? 'resolved' : 'open'}">
      <span class="k">${esc(a.kind)}</span>
      <span>${esc(a.device_name ?? '')} — ${esc(a.message)}</span>
      <span style="opacity:.55;font-size:11px">${ago(a.raised_at)}</span>
      ${
        a.resolved_at
          ? `<span style="opacity:.7;font-size:11px">resolved: ${esc(a.resolve_note ?? '')}</span>`
          : `<button class="ghost small act" data-resolve="${a.id}">Resolve</button>`
      }
    </div>`,
      )
      .join('') || '<div class="sub">no alerts yet</div>';
  for (const b of $('alerts').querySelectorAll('[data-resolve]')) {
    b.addEventListener('click', async () => {
      await api(`/alerts/${(b as HTMLElement).dataset.resolve}/resolve`, { body: { note: 'resolved from fleet view' } });
      void refresh();
    });
  }
}

const ACTIONS: [string, string][] = [
  ['net_test', 'Net test'],
  ['send_logs', 'Logs'],
  ['reload', 'Reload'],
  ['clear_cache', 'Clear cache'],
  ['restart_browser', 'Restart browser'],
  ['reboot_host', 'Reboot'],
];

function healthCells(d: Device): string {
  const h = d.health;
  if (!h) return '<td colspan="4" style="opacity:.5">no agent report yet</td>';
  const mem = h.memTotalBytes ? `${Math.round(((h.memTotalBytes - (h.memFreeBytes ?? 0)) / h.memTotalBytes) * 100)}%` : '—';
  return `
    <td class="mono">${h.load1?.toFixed(2) ?? '—'} / ${h.cores ?? '—'}c</td>
    <td class="mono">${mem}</td>
    <td class="mono">${h.disk ? h.disk.freePct + '% free' : '—'}</td>
    <td class="mono">${h.temperatureC != null ? h.temperatureC + ' °C' : '—'} · up ${h.hostUptimeS ? dur(h.hostUptimeS) : '—'}</td>`;
}

async function loadDevices(): Promise<void> {
  const r = await api<{ devices: Device[] }>('/devices');
  $('devTable').innerHTML =
    `<tr><th>device</th><th>state</th><th>agent</th><th>load</th><th>mem used</th><th>disk</th><th>temp · uptime</th><th>seen</th><th>actions</th></tr>` +
    r.devices
      .map(
        (d) => `
    <tr>
      <td><b>${esc(d.name)}</b><br /><span style="opacity:.6">${esc(d.kind)}${d.location ? ' · ' + esc(d.location) : ''}</span></td>
      <td><span class="st ${d.state === 'online' ? 'online' : 'offline'}">${esc(d.state.toUpperCase())}</span></td>
      <td class="mono">${esc(d.agent_version ?? '—')}</td>
      ${healthCells(d)}
      <td class="mono">${ago(d.last_seen_at)}</td>
      <td>${ACTIONS.map(([a, label]) => `<button class="ghost small act" data-act="${a}" data-dev="${d.id}">${label}</button>`).join('')}</td>
    </tr>`,
      )
      .join('');
  for (const b of $('devTable').querySelectorAll('[data-act]')) {
    b.addEventListener('click', async () => {
      const el = b as HTMLElement;
      const out = $('actionOut');
      try {
        const r2 = await api<{ actionId: string }>(`/devices/${el.dataset.dev}/actions`, { body: { action: el.dataset.act } });
        out.className = 'msg mono';
        out.textContent = `→ ${el.dataset.act} sent (${r2.actionId.slice(0, 8)}) — the result lands in the device events below within seconds…`;
        setTimeout(() => void showActionResult(el.dataset.dev!, r2.actionId), 4000);
      } catch (e) {
        out.className = 'msg mono';
        out.textContent = `✗ ${(e as Error).message}`;
      }
    });
  }
}

async function showActionResult(deviceId: string, actionId: string): Promise<void> {
  const r = await api<{ events: { type: string; meta: Record<string, unknown> }[] }>(`/devices/${deviceId}/events`);
  const hit = r.events.find((e) => e.type === 'action_result' && e.meta?.actionId === actionId);
  $('actionOut').textContent = hit
    ? `✓ ${JSON.stringify(hit.meta, null, 1).slice(0, 1200)}`
    : `… no result yet for ${actionId.slice(0, 8)} (device may be reloading)`;
}

async function loadSessions(): Promise<void> {
  const r = await api<{
    sessions: {
      presenter_name: string;
      presenter_kind: string;
      state: string;
      started_at: string;
      ended_at: string | null;
      egress_bytes: number | null;
      stats: { maxResolution?: string; maxMbps?: number; ladder?: string[] } | null;
      destinations: (string | null)[];
    }[];
  }>('/sessions');
  $('sesTable').innerHTML =
    `<tr><th>presenter</th><th>to</th><th>state</th><th>started</th><th>duration</th><th>peak</th><th>egress</th><th>ladder</th></tr>` +
    r.sessions
      .map((x) => {
        const secs = (x.ended_at ? new Date(x.ended_at).getTime() : Date.now()) / 1000 - new Date(x.started_at).getTime() / 1000;
        return `
    <tr>
      <td>${esc(x.presenter_name)} <span style="opacity:.5">(${esc(x.presenter_kind)})</span></td>
      <td>${esc(x.destinations.filter(Boolean).join(', '))}</td>
      <td class="mono">${esc(x.state)}</td>
      <td class="mono">${ago(x.started_at)}</td>
      <td class="mono">${dur(Math.max(0, secs))}</td>
      <td class="mono">${esc(x.stats?.maxResolution ?? '—')} · ${x.stats?.maxMbps ?? '—'} Mbps</td>
      <td class="mono">${x.egress_bytes != null ? gb(Number(x.egress_bytes)) + ' GB' : '—'}</td>
      <td class="mono" style="font-size:11px">${esc((x.stats?.ladder ?? []).join(' '))}</td>
    </tr>`;
      })
      .join('');
}

async function loadAudit(): Promise<void> {
  const r = await api<{ entries: { actor: string; action: string; target: string | null; at: string }[] }>('/audit');
  $('auditTable').innerHTML =
    `<tr><th>when</th><th>actor</th><th>action</th><th>target</th></tr>` +
    r.entries
      .slice(0, 30)
      .map(
        (e) =>
          `<tr><td>${ago(e.at)}</td><td>${esc(e.actor)}</td><td>${esc(e.action)}</td><td style="opacity:.6">${esc(e.target?.slice(0, 8) ?? '')}</td></tr>`,
      )
      .join('');
}

async function refresh(): Promise<void> {
  await Promise.all([loadSummary(), loadAlerts(), loadDevices(), loadSessions(), loadAudit()]).catch((e) =>
    console.error('fleet refresh failed:', e),
  );
}
void refresh();
setInterval(() => void refresh(), 5000);
