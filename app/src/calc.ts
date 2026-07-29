import type { FinanceSettings, Reserve, ReserveKind } from './types';

export type Semaforo = 'verde' | 'amarelo' | 'vermelho';

export function debtMonthlyPayment(saldo: number, taxaMensalPct: number, parcelas: number): number {
  if (parcelas <= 0) return 0;
  const i = taxaMensalPct / 100;
  if (i === 0) return saldo / parcelas;
  const pmt = (saldo * i) / (1 - Math.pow(1 + i, -parcelas));
  return Number.isFinite(pmt) ? pmt : 0;
}

export function reserveSaldo(reservas: Reserve[], kind: ReserveKind): number {
  return reservas.find((r) => r.kind === kind)?.saldo ?? 0;
}

export function withReserveDelta(reservas: Reserve[], kind: ReserveKind, delta: number): Reserve[] {
  return reservas.map((r) => (r.kind === kind ? { ...r, saldo: r.saldo + delta } : r));
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
  reservaEmergencia: number;
  reservaColchao: number;
  reservaOportunidade: number;
  reservaDoacao: number;
  reservaProvisao: number;
  autonomiaMeses: number;
  metaAutonomiaMeses: number;
  taxaHorariaAlvo: number;
}

/**
 * Fase 0 ainda não tem fixos do mês com data de vencimento, então Livre Real
 * desconta parcelas de dívidas, parcelas do cartão e o rateio de custos
 * anuais, mas não fixos avulsos — isso entra quando recorrências existirem.
 * Autonomia usa emergência + colchão de verdade (não mais o saldo em conta),
 * porque é para isso que essas duas reservas existem.
 */
export function computeSnapshot(settings: FinanceSettings, reservas: Reserve[]): Snapshot {
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

  const reservaEmergencia = reserveSaldo(reservas, 'emergencia');
  const reservaColchao = reserveSaldo(reservas, 'colchao');
  const reservaOportunidade = reserveSaldo(reservas, 'oportunidade');
  const reservaDoacao = reserveSaldo(reservas, 'doacao');
  const reservaProvisao = reserveSaldo(reservas, 'provisao');

  const autonomiaMeses = custoEssencial > 0 ? (reservaEmergencia + reservaColchao) / custoEssencial : 0;
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
    reservaEmergencia,
    reservaColchao,
    reservaOportunidade,
    reservaDoacao,
    reservaProvisao,
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

/**
 * Cascata de entrada (PLANO.md §10): toda receita é fatiada antes de virar
 * mês corrente. O bloco "reservas" prioriza a emergência até ela bater a
 * meta (em meses de custo essencial); o que sobrar divide meio a meio entre
 * oportunidade e colchão.
 */
export interface CascataResultado {
  doacao: number;
  provisao: number;
  emergencia: number;
  oportunidade: number;
  colchao: number;
  liquido: number;
}

export function aplicarCascata(valor: number, settings: FinanceSettings, reservas: Reserve[]): CascataResultado {
  const doacao = (valor * (settings.cascataDoacaoPct ?? 0)) / 100;
  const provisao = (valor * (settings.cascataProvisoesPct ?? 0)) / 100;
  const blocoReservas = (valor * (settings.cascataReservasPct ?? 0)) / 100;

  const metaEmergenciaValor = (settings.metaEmergenciaMeses ?? 6) * (settings.custoEssencial ?? 0);
  const faltaEmergencia = Math.max(metaEmergenciaValor - reserveSaldo(reservas, 'emergencia'), 0);

  const emergencia = Math.min(blocoReservas, faltaEmergencia);
  const restanteReservas = blocoReservas - emergencia;
  const oportunidade = restanteReservas / 2;
  const colchao = restanteReservas / 2;

  const liquido = valor - doacao - provisao - blocoReservas;

  return { doacao, provisao, emergencia, oportunidade, colchao, liquido };
}

export function aplicarCascataAoLedger(reservas: Reserve[], resultado: CascataResultado): Reserve[] {
  let next = reservas;
  next = withReserveDelta(next, 'doacao', resultado.doacao);
  next = withReserveDelta(next, 'provisao', resultado.provisao);
  next = withReserveDelta(next, 'emergencia', resultado.emergencia);
  next = withReserveDelta(next, 'oportunidade', resultado.oportunidade);
  next = withReserveDelta(next, 'colchao', resultado.colchao);
  return next;
}
