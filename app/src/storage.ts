import { emptySettings, RESERVE_KINDS, type FinanceSettings, type Ledger } from './types';

const KEY = 'pfa:settings:v1';
const LEDGER_KEY = 'pfa:ledger:v1';

function normalizeSettings(parsed: Partial<FinanceSettings> | null | undefined): FinanceSettings {
  return { ...emptySettings, ...(parsed ?? {}) };
}

function normalizeLedger(parsed: Partial<Ledger> | null | undefined): Ledger {
  const reservas = RESERVE_KINDS.map(
    (kind) => parsed?.reservas?.find((r) => r.kind === kind) ?? { kind, saldo: 0 },
  );
  return { reservas, transacoes: parsed?.transacoes ?? [] };
}

export function loadSettings(): FinanceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return normalizeSettings(null);
    return normalizeSettings(JSON.parse(raw) as Partial<FinanceSettings>);
  } catch {
    return normalizeSettings(null);
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
    if (!raw) return normalizeLedger(null);
    return normalizeLedger(JSON.parse(raw) as Partial<Ledger>);
  } catch {
    return normalizeLedger(null);
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

/**
 * Backup manual — enquanto não existe sync de verdade, exportar/importar
 * um arquivo é o jeito de levar os dados de um aparelho para o outro.
 */
export interface ExportPayload {
  version: 1;
  exportedAt: string;
  settings: FinanceSettings;
  ledger: Ledger;
}

export function buildExportPayload(settings: FinanceSettings, ledger: Ledger): ExportPayload {
  return { version: 1, exportedAt: new Date().toISOString(), settings, ledger };
}

export interface ImportResult {
  settings: FinanceSettings;
  ledger: Ledger;
  exportedAt?: string;
}

export function parseImportPayload(raw: string): ImportResult | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ExportPayload> | null;
    if (!parsed || typeof parsed !== 'object' || !parsed.settings || !parsed.ledger) return null;
    return {
      settings: normalizeSettings(parsed.settings),
      ledger: normalizeLedger(parsed.ledger),
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined,
    };
  } catch {
    return null;
  }
}
