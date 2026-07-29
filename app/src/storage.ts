import { emptySettings, type FinanceSettings } from './types';

const KEY = 'pfa:settings:v1';

export function loadSettings(): FinanceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...emptySettings };
    const parsed = JSON.parse(raw) as Partial<FinanceSettings>;
    return { ...emptySettings, ...parsed };
  } catch {
    return { ...emptySettings };
  }
}

export function saveSettings(settings: FinanceSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Armazenamento indisponível (modo privado, quota cheia etc).
    // Silencioso por ora — a Fase 0 ainda não depende de sync.
  }
}

export function newId(): string {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
