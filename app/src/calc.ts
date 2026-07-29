import type { FinanceSettings } from './types';

export type Semaforo = 'verde' | 'amarelo' | 'vermelho';

export function debtMonthlyPayment(saldo: number, taxaMensalPct: number, parcelas: number): number {
  if (parcelas <= 0) return 0;
  const i = taxaMensalPct / 100;
  if (i === 0) return saldo / parcelas;
  const pmt = (saldo * i) / (1 - Math.pow(1 + i, -parcelas));
  return Number.isFinite(pmt) ? pmt : 0;
}

export interface Snapshot {
  custoEssencial: number;
  rendaFixaTotal: number;
  rendaTotalMedia: number;
  metaVariavel: number;
  parcelaDividasMes: number;
  parcelaCartaoMes: number;
  compromissoMensal: number;
  rendaComprometidaPct: number;
  saldoTotalContas: number;
  rateioAnualMensal: number;
  livreReal: number;
  autonomiaMeses: number;
  metaAutonomiaMeses: number;
  taxaHorariaAlvo: number;
}

/**
 * Fase 0 ainda não tem lançamentos nem reservas separadas do saldo corrente,
 * então Livre Real e Autonomia usam o saldo total das contas como base —
 * ficam mais precisos quando fixos do mês e reservas passarem a ser
 * rastreados separadamente.
 */
export function computeSnapshot(settings: FinanceSettings): Snapshot {
  const custoEssencial = settings.custoEssencial ?? 0;
  const rendaFixaTotal = (settings.rendaFixa1 ?? 0) + (settings.rendaFixa2 ?? 0);
  const rendaTotalMedia = rendaFixaTotal + (settings.mediaVariavel ?? 0);
  const metaVariavel = Math.max(custoEssencial - rendaFixaTotal, 0);

  const parcelaDividasMes = settings.dividas.reduce(
    (sum, d) => sum + debtMonthlyPayment(d.saldo, d.taxaMensal, d.parcelasRestantes),
    0,
  );
  const parcelaCartaoMes = settings.parcelamentos.reduce((sum, p) => sum + p.valorParcela, 0);
  const compromissoMensal = parcelaDividasMes + parcelaCartaoMes;
  const rendaComprometidaPct = rendaTotalMedia > 0 ? (compromissoMensal / rendaTotalMedia) * 100 : 0;

  const saldoTotalContas = settings.contas.reduce((sum, c) => sum + c.saldo, 0);
  const rateioAnualMensal = settings.custosAnuais.reduce((sum, c) => sum + c.valorAnual, 0) / 12;

  const livreReal = saldoTotalContas - parcelaDividasMes - parcelaCartaoMes - rateioAnualMensal;
  const autonomiaMeses = custoEssencial > 0 ? saldoTotalContas / custoEssencial : 0;
  const metaAutonomiaMeses = settings.metaEmergenciaMeses ?? 6;

  return {
    custoEssencial,
    rendaFixaTotal,
    rendaTotalMedia,
    metaVariavel,
    parcelaDividasMes,
    parcelaCartaoMes,
    compromissoMensal,
    rendaComprometidaPct,
    saldoTotalContas,
    rateioAnualMensal,
    livreReal,
    autonomiaMeses,
    metaAutonomiaMeses,
    taxaHorariaAlvo: settings.taxaHorariaAlvo ?? 0,
  };
}

export function semaforoAutonomia(atual: number, meta: number): Semaforo {
  if (meta <= 0) return 'verde';
  if (atual < meta / 2) return 'vermelho';
  if (atual < meta) return 'amarelo';
  return 'verde';
}

export function semaforoComprometido(pct: number): Semaforo {
  if (pct > 30) return 'vermelho';
  if (pct >= 20) return 'amarelo';
  return 'verde';
}

export function tempoDeTrabalho(valor: number, taxaHorariaAlvo: number): { horas: number; dias: number } {
  const horas = taxaHorariaAlvo > 0 ? valor / taxaHorariaAlvo : 0;
  return { horas, dias: horas / 8 };
}
