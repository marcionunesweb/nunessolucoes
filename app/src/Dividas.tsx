import { useMemo, useState } from 'react';
import type { FinanceSettings } from './types';
import { debtMonthlyPayment, dataFutura, simularQuitacao, type EstrategiaQuitacao } from './calc';
import { formatBRL, formatNumber } from './format';
import { TabBar, type Tab } from './components/TabBar';

interface DividasProps {
  settings: FinanceSettings;
  onEditStep: (index: number) => void;
  onNavigate: (tab: Tab) => void;
}

function formatMesAno(data: Date): string {
  return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

const ESTRATEGIA_LABEL: Record<EstrategiaQuitacao, string> = {
  avalanche: 'Avalanche',
  bolaDeNeve: 'Bola de neve',
};

export function Dividas({ settings, onEditStep, onNavigate }: DividasProps) {
  const [aporteExtraStr, setAporteExtraStr] = useState('0');
  const [estrategia, setEstrategia] = useState<EstrategiaQuitacao>('avalanche');

  const aporteExtra = parseFloat(aporteExtraStr.replace(',', '.')) || 0;
  const dividas = settings.dividas;
  const parcelamentos = settings.parcelamentos;

  const avalanche = useMemo(() => simularQuitacao(dividas, aporteExtra, 'avalanche'), [dividas, aporteExtra]);
  const bolaDeNeve = useMemo(() => simularQuitacao(dividas, aporteExtra, 'bolaDeNeve'), [dividas, aporteExtra]);
  const escolhida = estrategia === 'avalanche' ? avalanche : bolaDeNeve;

  const mesesParcelamentos = parcelamentos.reduce((max, p) => Math.max(max, p.parcelasRestantes), 0);
  const mesesLiberdade = Math.max(escolhida.mesesParaQuitar, mesesParcelamentos);
  const temDividasOuParcelamentos = dividas.length > 0 || parcelamentos.length > 0;

  const diffMeses = avalanche.mesesParaQuitar - bolaDeNeve.mesesParaQuitar;
  const diffJuros = avalanche.jurosTotalPago - bolaDeNeve.jurosTotalPago;

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Dívidas</p>
      </header>

      <div className="step step--with-tabbar">
        {!temDividasOuParcelamentos && (
          <>
            <p className="step-helper">Nenhuma dívida ou parcelamento cadastrado.</p>
            <button type="button" className="btn-chip" onClick={() => onEditStep(8)}>
              Cadastrar na Fase 0
            </button>
          </>
        )}

        {temDividasOuParcelamentos && (
          <>
            <div className="hero-card">
              <p className="hero-label">Data da liberdade</p>
              <p className="hero-value">{formatMesAno(dataFutura(mesesLiberdade))}</p>
              <p className="hero-note">
                {mesesLiberdade === 0
                  ? 'Sem parcelas em aberto.'
                  : `${formatNumber(mesesLiberdade, 0)} meses até a última parcela — dívidas (estratégia ${ESTRATEGIA_LABEL[estrategia].toLowerCase()}) e parcelamentos do cartão combinados.`}
              </p>
            </div>

            {dividas.length > 0 && (
              <>
                <div className="field">
                  <label className="field-label" htmlFor="aporte-extra">
                    Aporte extra mensal nas dívidas
                  </label>
                  <div className="money-input-wrap">
                    <span className="money-prefix">R$</span>
                    <input
                      id="aporte-extra"
                      className="money-input"
                      type="number"
                      inputMode="decimal"
                      value={aporteExtraStr}
                      onChange={(e) => setAporteExtraStr(e.target.value)}
                    />
                  </div>
                </div>

                <div className="metric-row">
                  <div className="metric-card">
                    <p className="summary-label">Avalanche</p>
                    <p className="summary-value">{formatNumber(avalanche.mesesParaQuitar, 0)} m</p>
                    <p className="summary-note">{formatBRL(avalanche.jurosTotalPago)} em juros</p>
                  </div>
                  <div className="metric-card">
                    <p className="summary-label">Bola de neve</p>
                    <p className="summary-value">{formatNumber(bolaDeNeve.mesesParaQuitar, 0)} m</p>
                    <p className="summary-note">{formatBRL(bolaDeNeve.jurosTotalPago)} em juros</p>
                  </div>
                </div>

                <p className="step-helper" style={{ marginTop: -6 }}>
                  {diffJuros === 0 && diffMeses === 0
                    ? 'As duas estratégias dão no mesmo, com esse aporte extra.'
                    : diffJuros <= 0
                      ? `Avalanche economiza ${formatBRL(Math.abs(diffJuros))} em juros${diffMeses !== 0 ? ` e termina ${Math.abs(diffMeses)} meses ${diffMeses < 0 ? 'antes' : 'depois'}` : ''}. Bola de neve quita dívidas menores primeiro, o que motiva mais.`
                      : `Bola de neve custa ${formatBRL(diffJuros)} a mais em juros, mas quita a primeira dívida mais rápido — o que motiva mais.`}
                </p>

                {avalanche.inviavel && (
                  <p className="reserve-warning">
                    A parcela mínima de alguma dívida não cobre nem os juros — ela nunca quita sozinha.
                    Aumente o aporte extra ou renegocie a taxa.
                  </p>
                )}

                <div className="tipo-toggle">
                  <button
                    type="button"
                    className={`tipo-toggle-btn ${estrategia === 'avalanche' ? 'active' : ''}`}
                    onClick={() => setEstrategia('avalanche')}
                  >
                    Avalanche
                  </button>
                  <button
                    type="button"
                    className={`tipo-toggle-btn ${estrategia === 'bolaDeNeve' ? 'active' : ''}`}
                    onClick={() => setEstrategia('bolaDeNeve')}
                  >
                    Bola de neve
                  </button>
                </div>

                <div className="overview-list">
                  {escolhida.ordem.map((id, i) => {
                    const d = dividas.find((x) => x.id === id);
                    if (!d) return null;
                    const minimo = debtMonthlyPayment(d.saldo, d.taxaMensal, d.parcelasRestantes);
                    const mesQuita = escolhida.quitacaoPorDivida[id];
                    return (
                      <div className="overview-row overview-row--static" key={id}>
                        <span className="overview-row-title">
                          {i + 1}. {d.nome}
                          <span className="overview-row-sub">
                            {' '}
                            · {formatBRL(d.saldo)} a {formatNumber(d.taxaMensal)}%/mês · mín. {formatBRL(minimo)}
                          </span>
                        </span>
                        <span className="overview-row-value">
                          {mesQuita ? formatMesAno(dataFutura(mesQuita)) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {parcelamentos.length > 0 && (
              <>
                <p className="step-helper" style={{ marginTop: 24, marginBottom: 0 }}>
                  Parcelamentos no cartão
                </p>
                <div className="overview-list">
                  {[...parcelamentos]
                    .sort((a, b) => a.parcelasRestantes - b.parcelasRestantes)
                    .map((p) => (
                      <div className="overview-row overview-row--static" key={p.id}>
                        <span className="overview-row-title">
                          {p.descricao}
                          <span className="overview-row-sub"> · {formatBRL(p.valorParcela)}/mês</span>
                        </span>
                        <span className="overview-row-value">
                          {p.parcelasRestantes}x · até {formatMesAno(dataFutura(p.parcelasRestantes))}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}

            <button type="button" className="btn-chip" style={{ marginTop: 20 }} onClick={() => onEditStep(8)}>
              Editar dívidas e parcelamentos na Fase 0
            </button>
          </>
        )}
      </div>

      <TabBar active="dividas" onNavigate={onNavigate} />
    </div>
  );
}
