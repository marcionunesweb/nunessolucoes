import type { Debt, FinanceSettings, Reserve, ReserveKind, Transaction } from './types';

export type Semaforo = 'verde' | 'amarelo' | 'vermelho';

export function debtMonthlyPayment(saldo: number, taxaMensalPct: number, parcelas: number): number {
  if (parcelas <= 0) return 0;
  const i = taxaMensalPct / 100;
  if (i === 0) return saldo / parcelas;
  const pmt = (saldo * i) / (1 - Math.pow(1 + i, -parcelas));
  return Number.isFinite(pmt) ? pmt : 0;
}

/**
 * Delta que um lançamento já registrado aplicou na conta em que caiu:
 * negativo para despesa, o líquido (após a cascata) para receita.
 */
export function efeitoNaConta(t: Transaction): number {
  if (t.tipo === 'despesa') return -t.valor;
  const totalCascata = Object.values(t.cascata ?? {}).reduce((sum, v) => sum + (v ?? 0), 0);
  return t.valor - totalCascata;
}

export function reserveSaldo(reservas: Reserve[], kind: ReserveKind): number {
  return reservas.find((r) => r.kind === kind)?.saldo ?? 0;
}

/**
 * Desfaz o efeito de uma receita nas reservas — usado ao excluir um
 * lançamento que já tinha passado pela cascata de entrada.
 */
export function reverterCascataDoLedger(reservas: Reserve[], t: Transaction): Reserve[] {
  if (t.tipo !== 'receita' || !t.cascata) return reservas;
  let next = reservas;
  for (const [kind, valor] of Object.entries(t.cascata)) {
    next = withReserveDelta(next, kind as ReserveKind, -(valor ?? 0));
  }
  return next;
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
  fixosAVencer: number;
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
 * Fixos com dia de vencimento ainda não passado neste mês — depois do dia,
 * o app assume que já foi pago (via Lançar) e não desconta de novo.
 */
export function fixosAVencerNoMes(recorrentes: FinanceSettings['recorrentes'], hoje: Date = new Date()): number {
  const diaAtual = hoje.getDate();
  return recorrentes.filter((r) => r.diaVencimento >= diaAtual).reduce((sum, r) => sum + r.valor, 0);
}

/**
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
  const fixosAVencer = fixosAVencerNoMes(settings.recorrentes);

  const livreReal = saldoTotalContas - fixosAVencer - parcelaDividasMes - parcelaCartaoMes - rateioAnualMensal;

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
    fixosAVencer,
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

/**
 * Quitação de dívidas (PLANO.md §12). Simula mês a mês: todas as dívidas
 * recebem ao menos a parcela mínima, e o aporte extra — somado ao mínimo
 * das dívidas já quitadas — vai inteiro para a próxima da fila de
 * prioridade. Avalanche prioriza maior taxa; bola de neve, menor saldo.
 * Limite de 600 meses (50 anos) evita loop infinito em cenário inviável.
 */
export type EstrategiaQuitacao = 'avalanche' | 'bolaDeNeve';

export interface QuitacaoResultado {
  ordem: string[];
  mesesParaQuitar: number;
  jurosTotalPago: number;
  quitacaoPorDivida: Record<string, number>; // id -> mês em que zera
  inviavel: boolean; // parcela mínima não cobre nem os juros de alguma dívida
}

const LIMITE_MESES = 600;

export function ordemEstrategia(dividas: Debt[], estrategia: EstrategiaQuitacao): string[] {
  const copia = [...dividas];
  if (estrategia === 'avalanche') {
    copia.sort((a, b) => b.taxaMensal - a.taxaMensal);
  } else {
    copia.sort((a, b) => a.saldo - b.saldo);
  }
  return copia.map((d) => d.id);
}

export function simularQuitacao(dividas: Debt[], aporteExtra: number, estrategia: EstrategiaQuitacao): QuitacaoResultado {
  const ordem = ordemEstrategia(dividas, estrategia);
  const estado = dividas.map((d) => ({
    id: d.id,
    saldo: d.saldo,
    taxa: d.taxaMensal / 100,
    minimo: debtMonthlyPayment(d.saldo, d.taxaMensal, d.parcelasRestantes),
  }));

  const inviavel = estado.some((d) => d.saldo > 0 && d.minimo <= d.saldo * d.taxa);
  const quitacaoPorDivida: Record<string, number> = {};
  let jurosTotalPago = 0;
  let mes = 0;

  if (estado.length === 0) {
    return { ordem, mesesParaQuitar: 0, jurosTotalPago: 0, quitacaoPorDivida, inviavel: false };
  }

  while (estado.some((d) => d.saldo > 0.01) && mes < LIMITE_MESES && !inviavel) {
    mes++;
    for (const d of estado) {
      if (d.saldo <= 0) continue;
      const juros = d.saldo * d.taxa;
      jurosTotalPago += juros;
      d.saldo += juros;
      const pagamento = Math.min(d.minimo, d.saldo);
      d.saldo -= pagamento;
    }

    const minimoLiberado = estado.filter((d) => d.saldo <= 0).reduce((sum, d) => sum + d.minimo, 0);
    let extraDisponivel = aporteExtra + minimoLiberado;
    for (const id of ordem) {
      if (extraDisponivel <= 0) break;
      const d = estado.find((x) => x.id === id);
      if (!d || d.saldo <= 0) continue;
      const pagamento = Math.min(extraDisponivel, d.saldo);
      d.saldo -= pagamento;
      extraDisponivel -= pagamento;
    }

    for (const d of estado) {
      if (d.saldo <= 0.01 && !(d.id in quitacaoPorDivida)) quitacaoPorDivida[d.id] = mes;
    }
  }

  return { ordem, mesesParaQuitar: mes, jurosTotalPago, quitacaoPorDivida, inviavel };
}

export function dataFutura(mesesAFrente: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.round(mesesAFrente));
  return d;
}
