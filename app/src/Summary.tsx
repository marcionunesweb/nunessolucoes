import type { FinanceSettings, Reserve } from './types';
import { STEP_LABELS } from './stepsMeta';
import { formatBRL, formatNumber } from './format';
import { computeSnapshot, semaforoAutonomia, semaforoComprometido } from './calc';
import { TabBar, type Tab } from './components/TabBar';
import { ImportExport } from './components/ImportExport';
import type { ImportResult } from './storage';

interface SummaryProps {
  settings: FinanceSettings;
  reservas: Reserve[];
  onEditStep: (index: number) => void;
  onNavigate: (tab: Tab) => void;
  onExport: () => void;
  onImport: (payload: ImportResult) => void;
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
    case 16:
      return { text: `${settings.recorrentes.length} fixo(s)`, pending: false };
    default:
      return { text: '', pending: false };
  }
}

export function Summary({ settings, reservas, onEditStep, onNavigate, onExport, onImport }: SummaryProps) {
  const s = computeSnapshot(settings, reservas);
  const rendaFixaCobreTudo = s.rendaFixaTotal >= s.custoEssencial && s.custoEssencial > 0;
  const compromissoCor = semaforoComprometido(s.rendaComprometidaPct);
  const autonomiaCor = semaforoAutonomia(s.autonomiaMeses, s.metaAutonomiaMeses);

  const somaCascata =
    (settings.cascataDoacaoPct ?? 0) + (settings.cascataProvisoesPct ?? 0) + (settings.cascataReservasPct ?? 0);

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Fase 0 · Resumo</p>
      </header>

      <div className="step step--with-tabbar">
        <h1 className="step-title">É isso que o app vai usar</h1>
        <p className="step-helper">
          Calculado a partir do que você preencheu. Ainda não substitui lançamentos reais — é a
          fotografia inicial.
        </p>

        <button type="button" className="btn-chip" style={{ marginBottom: 16 }} onClick={() => onEditStep(0)}>
          Editar Fase 0 inteira
        </button>

        <div className="summary-card">
          <p className="summary-label">Meta variável do mês</p>
          <p className="summary-value">{formatBRL(s.metaVariavel)}</p>
          <p className="summary-note">
            {rendaFixaCobreTudo
              ? 'Sua renda fixa já cobre o custo essencial sozinha.'
              : 'É quanto sua renda variável precisa faturar para fechar o mês.'}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Renda comprometida (dívidas + cartão)</p>
          <p className={`summary-value ${compromissoCor}`}>{formatNumber(s.rendaComprometidaPct)}%</p>
          <p className="summary-note">
            {formatBRL(s.compromissoMensal)}/mês em parcelas, sobre {formatBRL(s.rendaTotalMedia)} de renda
            média. {compromissoCor === 'vermelho' && 'Acima de 30% — faixa crítica.'}
            {compromissoCor === 'amarelo' && 'Entre 20% e 30% — atenção.'}
            {compromissoCor === 'verde' && 'Abaixo de 20% — ok.'}
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Autonomia atual</p>
          <p className={`summary-value ${autonomiaCor}`}>{formatNumber(s.autonomiaMeses)} meses</p>
          <p className="summary-note">
            Meta: {formatNumber(s.metaAutonomiaMeses, 0)} meses. Baseado no que já está guardado em
            emergência + colchão ({formatBRL(s.reservaEmergencia + s.reservaColchao)}) — use Lançar
            para começar a alimentar essas reservas.
          </p>
        </div>

        <div className="summary-card">
          <p className="summary-label">Rateio mensal de custos anuais</p>
          <p className="summary-value">{formatBRL(s.rateioAnualMensal)}</p>
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

        <ImportExport onExport={onExport} onImport={onImport} />
      </div>

      <TabBar active="summary" onNavigate={onNavigate} />
    </div>
  );
}
