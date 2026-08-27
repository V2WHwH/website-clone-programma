// Shared browser API client. The access token lives in memory + localStorage (MVP);
// a 401 triggers one refresh attempt via the httpOnly cookie before giving up.
export interface Session {
  access: string;
  user?: { id: string; email: string; name: string };
  org?: { id: string; name: string; role: string };
}

const KEY = 'hw_session';

export function saveSession(s: Session): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function loadSession(): Session | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : undefined;
  } catch {
    return undefined;
  }
}
export function clearSession(): void {
  localStorage.removeItem(KEY);
}

async function refresh(): Promise<Session | undefined> {
  const r = await fetch('/api/v1/auth/refresh', { method: 'POST' });
  if (!r.ok) return undefined;
  const s = (await r.json()) as Session;
  saveSession(s);
  return s;
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const doFetch = async (token?: string) =>
    fetch(`/api/v1${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

  let token = opts.token ?? loadSession()?.access;
  let r = await doFetch(token);
  if (r.status === 401 && !opts.token) {
    const s = await refresh();
    if (s) {
      token = s.access;
      r = await doFetch(token);
    }
  }
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
  return data;
}

export const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export function requireLogin(): Session {
  const s = loadSession();
  if (!s) {
    location.href = '/login.html';
    throw new Error('redirecting to login');
  }
  return s;
}
