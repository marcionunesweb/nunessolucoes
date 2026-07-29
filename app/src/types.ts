/**
 * Modelo de dados da Fase 0 — os números levantados no PLANO.md (§18)
 * antes de qualquer lançamento existir. Tudo aqui é configuração,
 * não movimento de dinheiro.
 */

export interface Debt {
  id: string;
  nome: string;
  saldo: number;
  taxaMensal: number; // % ao mês
  parcelasRestantes: number;
}

export interface Installment {
  id: string;
  descricao: string;
  valorParcela: number;
  parcelasRestantes: number;
}

export interface Account {
  id: string;
  nome: string;
  saldo: number;
}

export interface AnnualCost {
  id: string;
  nome: string;
  valorAnual: number;
}

export interface FinanceSettings {
  // 1-8: números únicos
  custoEssencial: number | null;
  rendaFixa1: number | null;
  rendaFixa2: number | null;
  mediaVariavel: number | null;
  horasTrabalhadas: number | null;
  taxaHorariaAlvo: number | null;
  proLabore: number | null;
  repassePessoal: number | null;

  // 9-11, 16: listas
  dividas: Debt[];
  parcelamentos: Installment[];
  contas: Account[];
  custosAnuais: AnnualCost[];

  // 12: gasto pessoal
  pctPessoal: number | null; // % da renda realizada, gasto livre sem pergunta

  // 13: meta de autonomia
  metaEmergenciaMeses: number | null; // meses de custo essencial cobertos

  // 14: saldos-alvo das reservas (R$)
  metaOportunidadeValor: number | null;
  metaDoacaoValor: number | null;

  // 15: percentuais da cascata de entrada (aplicados a cada receita recebida)
  cascataDoacaoPct: number | null;
  cascataProvisoesPct: number | null;
  cascataReservasPct: number | null; // cobre emergência + oportunidade + colchão
}

/**
 * Ledger — reservas e lançamentos reais. Separado da Fase 0 porque isso é
 * movimento de dinheiro, não configuração: cresce a cada uso do app.
 */

export type ReserveKind = 'emergencia' | 'oportunidade' | 'doacao' | 'colchao' | 'provisao';

export const RESERVE_KINDS: ReserveKind[] = ['emergencia', 'oportunidade', 'doacao', 'colchao', 'provisao'];

export const RESERVE_LABELS: Record<ReserveKind, string> = {
  emergencia: 'Emergência',
  oportunidade: 'Oportunidade',
  doacao: 'Doação',
  colchao: 'Colchão de sobras',
  provisao: 'Provisões',
};

export interface Reserve {
  kind: ReserveKind;
  saldo: number;
}

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  data: string; // ISO
  tipo: TransactionType;
  valor: number;
  categoria: string;
  contaId: string;
  // Presente só em receitas: quanto da entrada foi para cada reserva.
  cascata?: Partial<Record<ReserveKind, number>>;
}

export interface Ledger {
  reservas: Reserve[];
  transacoes: Transaction[];
}

export const emptyLedger: Ledger = {
  reservas: RESERVE_KINDS.map((kind) => ({ kind, saldo: 0 })),
  transacoes: [],
};

export const emptySettings: FinanceSettings = {
  custoEssencial: null,
  rendaFixa1: null,
  rendaFixa2: null,
  mediaVariavel: null,
  horasTrabalhadas: null,
  taxaHorariaAlvo: null,
  proLabore: null,
  repassePessoal: null,
  dividas: [],
  parcelamentos: [],
  contas: [],
  custosAnuais: [],
  pctPessoal: 6,
  metaEmergenciaMeses: 6,
  metaOportunidadeValor: null,
  metaDoacaoValor: null,
  cascataDoacaoPct: 10,
  cascataProvisoesPct: 5,
  cascataReservasPct: 15,
};
