import { emptySettings, emptyLedger, RESERVE_KINDS, type FinanceSettings, type Ledger } from './types';

const KEY = 'pfa:settings:v1';
const LEDGER_KEY = 'pfa:ledger:v1';

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

export function loadLedger(): Ledger {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return { ...emptyLedger };
    const parsed = JSON.parse(raw) as Partial<Ledger>;
    const reservas = RESERVE_KINDS.map(
      (kind) => parsed.reservas?.find((r) => r.kind === kind) ?? { kind, saldo: 0 },
    );
    return { reservas, transacoes: parsed.transacoes ?? [] };
  } catch {
    return { ...emptyLedger };
  }
}

export function saveLedger(ledger: Ledger): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Armazenamento indisponível — silencioso por ora.
  }
}

export function newId(): string {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
