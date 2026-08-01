import type { FinanceSettings, Ledger } from './types';
import { normalizeSettings, normalizeLedger } from './storage';

export const SERVER_MODE = import.meta.env.VITE_SERVER_MODE === 'true';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'unknown_error' }));
    throw new ApiError(res.status, body.error ?? 'unknown_error');
  }
  return res.json() as Promise<T>;
}

export function getSetupStatus(): Promise<{ needsSetup: boolean }> {
  return request('/setup-status');
}

export function setup(email: string, password: string): Promise<{ email: string }> {
  return request('/setup', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function login(email: string, password: string): Promise<{ email: string }> {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function logout(): Promise<void> {
  await request('/logout', { method: 'POST' });
}

export async function me(): Promise<{ email: string } | null> {
  try {
    return await request('/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function getData(): Promise<{ settings: FinanceSettings; ledger: Ledger }> {
  const raw = await request<{ settings: FinanceSettings | null; ledger: Ledger | null }>('/data');
  return { settings: normalizeSettings(raw.settings), ledger: normalizeLedger(raw.ledger) };
}

export function putData(settings: FinanceSettings, ledger: Ledger): Promise<void> {
  return request('/data', { method: 'PUT', body: JSON.stringify({ settings, ledger }) }).then(() => undefined);
}
