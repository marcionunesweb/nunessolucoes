import type { FinanceSettings, Reserve } from './types';
import { computeSnapshot, semaforoAutonomia, semaforoComprometido } from './calc';
import { formatBRL, formatNumber } from './format';
import { TabBar, type Tab } from './components/TabBar';

interface HojeProps {
  settings: FinanceSettings;
  reservas: Reserve[];
  onAskToBuy: () => void;
  onNavigate: (tab: Tab) => void;
}

export function Hoje({ settings, reservas, onAskToBuy, onNavigate }: HojeProps) {
  const s = computeSnapshot(settings, reservas);
  const autonomiaCor = semaforoAutonomia(s.autonomiaMeses, s.metaAutonomiaMeses);
  const comprometidoCor = semaforoComprometido(s.rendaComprometidaPct);
  const livreRealNegativo = s.livreReal < 0;
  const semReservas = s.reservaEmergencia + s.reservaColchao === 0;

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Hoje</p>
      </header>

      <div className="step step--with-tabbar">
        <div className="hero-card">
          <p className="hero-label">Livre Real</p>
          <p className={`hero-value ${livreRealNegativo ? 'vermelho' : ''}`}>{formatBRL(s.livreReal)}</p>
          <p className="hero-note">
            Saldo das contas, já descontados os fixos que ainda vão vencer este mês
            {s.fixosAVencer > 0 ? ` (${formatBRL(s.fixosAVencer)})` : ''}, parcelas de dívidas, parcelas
            do cartão e o rateio mensal de custos anuais.
          </p>
        </div>

        <div className="metric-row">
          <div className="metric-card">
            <p className="summary-label">Autonomia</p>
            <p className={`summary-value ${autonomiaCor}`}>{formatNumber(s.autonomiaMeses)} m</p>
            <p className="summary-note">meta {formatNumber(s.metaAutonomiaMeses, 0)} m</p>
          </div>
          <div className="metric-card">
            <p className="summary-label">Renda comprometida</p>
            <p className={`summary-value ${comprometidoCor}`}>{formatNumber(s.rendaComprometidaPct)}%</p>
            <p className="summary-note">dívidas + cartão</p>
          </div>
        </div>

        {semReservas && (
          <p className="hero-note" style={{ marginTop: -6, marginBottom: 16 }}>
            Emergência e colchão ainda estão zeradas — use <strong>Lançar</strong> para registrar
            receitas e começar a alimentá-las pela cascata de entrada.
          </p>
        )}

        <div className="summary-card">
          <p className="summary-label">Meta variável do mês</p>
          <p className="summary-value">{formatBRL(s.metaVariavel)}</p>
          <p className="summary-note">quanto a renda variável precisa faturar para fechar o mês</p>
        </div>

        <button type="button" className="btn btn-primary ask-btn" onClick={onAskToBuy}>
          Posso comprar algo?
        </button>
      </div>

      <TabBar active="hoje" onNavigate={onNavigate} />
    </div>
  );
}
