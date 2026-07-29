import type { FinanceSettings } from './types';
import { STEP_LABELS } from './stepsMeta';
import { formatBRL, formatNumber } from './format';

interface SummaryProps {
  settings: FinanceSettings;
  onEditStep: (index: number) => void;
}

function debtMonthlyPayment(saldo: number, taxaMensalPct: number, parcelas: number): number {
  if (parcelas <= 0) return 0;
  const i = taxaMensalPct / 100;
  if (i === 0) return saldo / parcelas;
  const pmt = (saldo * i) / (1 - Math.pow(1 + i, -parcelas));
  return Number.isFinite(pmt) ? pmt : 0;
}

function stepPreview(settings: FinanceSettings, index: number): { text: string; pending: boolean } {
  switch (index) {
    case 0:
      return settings.custoEssencial != null
        ? { text: formatBRL(settings.custoEssencial), pending: false }
        : { text: 'pendente', pending: true };
    case 1:
      return { text: formatBRL(settings.rendaFixa1 ?? 0), pending: false };
    case 2:
      return { text: formatBRL(settings.rendaFixa2 ?? 0), pending: false };
    case 3:
      return { text: formatBRL(settings.mediaVariavel ?? 0), pending: false };
    case 4:
      return { text: `${formatNumber(settings.horasTrabalhadas ?? 0, 0)} h`, pending: false };
    case 5:
      return { text: `${formatBRL(settings.taxaHorariaAlvo ?? 0)}/h`, pending: false };
    case 6:
      return { text: formatBRL(settings.proLabore ?? 0), pending: false };
    case 7:
      return { text: formatBRL(settings.repassePessoal ?? 0), pending: false };
    case 8:
      return { text: `${settings.dividas.length} cadastrada(s)`, pending: false };
    case 9:
      return { text: `${settings.parcelamentos.length} ativo(s)`, pending: false };
    case 10:
      return { text: `${settings.contas.length} conta(s)`, pending: false };
    case 11:
      return { text: `${settings.pctPessoal ?? 6}%`, pending: false };
    case 12:
      return { text: `${settings.metaEmergenciaMeses ?? 6} meses`, pending: false };
    case 13:
      return {
        text: `${formatBRL(settings.metaOportunidadeValor ?? 0)} / ${formatBRL(settings.metaDoacaoValor ?? 0)}`,
        pending: false,
      };
    case 14:
      return {
        text: `${settings.cascataDoacaoPct ?? 0}% · ${settings.cascataProvisoesPct ?? 0}% · ${settings.cascataReservasPct ?? 0}%`,
        pending: false,
      };
    case 15:
      return { text: `${settings.custosAnuais.length} custo(s)`, pending: false };
    default:
      return { text: '', pending: false };
  }
}

export function Summary({ settings, onEditStep }: SummaryProps) {
  const custoEssencial = settings.custoEssencial ?? 0;
  const rendaFixaTotal = (settings.rendaFixa1 ?? 0) + (settings.rendaFixa2 ?? 0);
  const rendaTotalMedia = rendaFixaTotal + (settings.mediaVariavel ?? 0);

  const metaVariavel = Math.max(custoEssencial - rendaFixaTotal, 0);
  const rendaFixaCobreTudo = rendaFixaTotal >= custoEssencial && custoEssencial > 0;

  const parcelaDividasMes = settings.dividas.reduce(
    (sum, d) => sum + debtMonthlyPayment(d.saldo, d.taxaMensal, d.parcelasRestantes),
    0,
  );
  const parcelaCartaoMes = settings.parcelamentos.reduce((sum, p) => sum + p.valorParcela, 0);
  const compromissoMensal = parcelaDividasMes + parcelaCartaoMes;
  const rendaComprometidaPct = rendaTotalMedia > 0 ? (compromissoMensal / rendaTotalMedia) * 100 : 0;

  let compromissoCor: 'verde' | 'amarelo' | 'vermelho' = 'verde';
  if (rendaComprometidaPct > 30) compromissoCor = 'vermelho';
  else if (rendaComprometidaPct >= 20) compromissoCor = 'amarelo';

  const saldoTotalContas = settings.contas.reduce((sum, c) => sum + c.saldo, 0);
  const autonomiaAtual = custoEssencial > 0 ? saldoTotalContas / custoEssencial : 0;
  const metaAutonomia = settings.metaEmergenciaMeses ?? 6;

  let autonomiaCor: 'verde' | 'amarelo' | 'vermelho' = 'verde';
  if (autonomiaAtual < metaAutonomia / 2) autonomiaCor = 'vermelho';
  else if (autonomiaAtual < metaAutonomia) autonomiaCor = 'amarelo';

  const rateioAnualMensal = settings.custosAnuais.reduce((sum, c) => sum + c.valorAnual, 0) / 12;

  const somaCascata =
    (settings.cascataDoacaoPct ?? 0) + (settings.cascataProvisoesPct ?? 0) + (settings.cascataReservasPct ?? 0);

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Fase 0 · Resumo</p>
      </header>

      <div className="step">
        <h1 className="step-title">É isso que o app vai usar</h1>
        <p className="step-helper">
          Calculado a partir do que você preencheu. Ainda não substitui lançamentos reais — é a
          fotografia inicial.
        </p>

        <div className="summary-card">
          <p className="summary-label">Meta variável do mês</p>
          <p className="summary-value">{formatBRL(metaVariavel)}</p>
          <p className="summary-note">
            {rendaFixaCobreTudo
              ? 'Sua renda fixa já cobre o custo essencial sozinha.'
              : 'É quanto sua renda variável precisa faturar para fechar o mês.'}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Renda comprometida (dívidas + cartão)</p>
          <p className={`summary-value ${compromissoCor}`}>{formatNumber(rendaComprometidaPct)}%</p>
          <p className="summary-note">
            {formatBRL(compromissoMensal)}/mês em parcelas, sobre {formatBRL(rendaTotalMedia)} de renda
            média. {compromissoCor === 'vermelho' && 'Acima de 30% — faixa crítica.'}
            {compromissoCor === 'amarelo' && 'Entre 20% e 30% — atenção.'}
            {compromissoCor === 'verde' && 'Abaixo de 20% — ok.'}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Autonomia atual (estimativa provisória)</p>
          <p className={`summary-value ${autonomiaCor}`}>{formatNumber(autonomiaAtual)} meses</p>
          <p className="summary-note">
            Meta: {metaAutonomia} meses. Baseado no saldo total das contas ({formatBRL(saldoTotalContas)}
            ) — vai ficar mais precisa quando emergência e colchão forem reservas separadas do saldo
            corrente.
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Rateio mensal de custos anuais</p>
          <p className="summary-value">{formatBRL(rateioAnualMensal)}</p>
          <p className="summary-note">Já deve ser descontado do Livre Real todo mês.</p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Cascata de entrada</p>
          <p className={`summary-value ${somaCascata > 100 ? 'vermelho' : ''}`}>
            {somaCascata}% <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-dim)' }}>reservado</span>
          </p>
          <p className="summary-note">
            {somaCascata > 100
              ? 'Passa de 100% — ajuste os percentuais.'
              : `${100 - somaCascata}% sobra para o mês corrente.`}
          </p>
        </div>

        <p className="step-helper" style={{ marginTop: 8, marginBottom: 0 }}>
          Revisar qualquer resposta:
        </p>
        <div className="overview-list">
          {STEP_LABELS.map((label, i) => {
            const preview = stepPreview(settings, i);
            return (
              <button className="overview-row" type="button" key={label} onClick={() => onEditStep(i)}>
                <span className="overview-row-title">{label}</span>
                <span className={`overview-row-value ${preview.pending ? 'pending' : ''}`}>
                  {preview.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
