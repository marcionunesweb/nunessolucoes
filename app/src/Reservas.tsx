import { useState } from 'react';
import type { FinanceSettings, Reserve, ReserveKind } from './types';
import { RESERVE_LABELS } from './types';
import { reserveSaldo, withReserveDelta } from './calc';
import { formatBRL, formatNumber } from './format';
import { TabBar, type Tab } from './components/TabBar';

interface ReservasProps {
  settings: FinanceSettings;
  reservas: Reserve[];
  onChangeReservas: (reservas: Reserve[]) => void;
  onNavigate: (tab: Tab) => void;
}

function metaDe(kind: ReserveKind, settings: FinanceSettings): number | null {
  switch (kind) {
    case 'emergencia':
      return (settings.metaEmergenciaMeses ?? 6) * (settings.custoEssencial ?? 0);
    case 'oportunidade':
      return settings.metaOportunidadeValor ?? null;
    case 'doacao':
      return settings.metaDoacaoValor ?? null;
    case 'provisao': {
      const anual = settings.custosAnuais.reduce((sum, c) => sum + c.valorAnual, 0);
      return anual > 0 ? anual : null;
    }
    case 'colchao':
      return null;
  }
}

function notaDe(kind: ReserveKind, saldo: number, settings: FinanceSettings): string {
  if (kind === 'colchao') {
    const custoEssencial = settings.custoEssencial ?? 0;
    const meses = custoEssencial > 0 ? saldo / custoEssencial : 0;
    return `Cobre ${formatNumber(meses)} meses adicionais de custo essencial se um mês faltar.`;
  }
  if (kind === 'emergencia') return 'Junto com o colchão, define sua Autonomia em Hoje.';
  if (kind === 'oportunidade') return 'É daqui que sai um "sim" sem culpa.';
  if (kind === 'doacao') return 'Separado no ato da entrada, não no fim do mês.';
  return 'Para pagar custos anuais (IPVA, seguro, impostos) sem surpresa.';
}

interface CardProps {
  kind: ReserveKind;
  saldo: number;
  meta: number | null;
  nota: string;
  onAportar: (valor: number) => void;
  onSacar: (valor: number, motivo: string) => void;
}

function ReserveCard({ kind, saldo, meta, nota, onAportar, onSacar }: CardProps) {
  const [valorStr, setValorStr] = useState('');
  const [motivo, setMotivo] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const valor = parseFloat(valorStr.replace(',', '.')) || 0;
  const pct = meta && meta > 0 ? Math.min(Math.max((saldo / meta) * 100, 0), 100) : null;
  const saqueExcedeSaldo = valor > saldo;

  function reset() {
    setValorStr('');
    setMotivo('');
    setConfirmando(false);
  }

  function handleAportar() {
    if (valor <= 0) return;
    onAportar(valor);
    reset();
  }

  function handleSacarClick() {
    if (valor <= 0 || !motivo.trim() || saqueExcedeSaldo) return;
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    onSacar(valor, motivo.trim());
    reset();
  }

  return (
    <div className="summary-card">
      <p className="summary-label">{RESERVE_LABELS[kind]}</p>
      <p className="summary-value">{formatBRL(saldo)}</p>
      {pct != null && (
        <>
          <div className="progress-track" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="summary-note">
            {formatNumber(pct, 0)}% da meta de {formatBRL(meta ?? 0)}
          </p>
        </>
      )}
      <p className="summary-note">{nota}</p>

      <div className="reserve-form">
        <input
          className="plain-input numeric reserve-form-input"
          type="number"
          inputMode="decimal"
          placeholder="R$ 0,00"
          value={valorStr}
          onChange={(e) => {
            setValorStr(e.target.value);
            setConfirmando(false);
          }}
        />
        <button type="button" className="btn-chip" onClick={handleAportar} disabled={valor <= 0}>
          Aportar
        </button>
      </div>

      <div className="reserve-form">
        <input
          className="plain-input reserve-form-input"
          type="text"
          placeholder="Motivo do saque"
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setConfirmando(false);
          }}
        />
        <button
          type="button"
          className="btn-chip btn-chip-danger"
          onClick={handleSacarClick}
          disabled={valor <= 0 || !motivo.trim() || saqueExcedeSaldo}
        >
          {confirmando ? 'Confirmar' : 'Sacar'}
        </button>
      </div>
      {saqueExcedeSaldo && <p className="reserve-warning">Só há {formatBRL(saldo)} disponível aqui.</p>}
    </div>
  );
}

export function Reservas({ settings, reservas, onChangeReservas, onNavigate }: ReservasProps) {
  const kinds: ReserveKind[] = ['emergencia', 'colchao', 'oportunidade', 'doacao', 'provisao'];

  function aportar(kind: ReserveKind, valor: number) {
    onChangeReservas(withReserveDelta(reservas, kind, valor));
  }

  function sacar(kind: ReserveKind, valor: number) {
    onChangeReservas(withReserveDelta(reservas, kind, -valor));
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Reservas</p>
      </header>

      <div className="step step--with-tabbar">
        <p className="step-helper">
          Cada uma tem um propósito próprio. Um aporte manual soma direto; um saque pede motivo e
          confirmação — a reserva de emergência não é para decisões rápidas.
        </p>

        {kinds.map((kind) => (
          <ReserveCard
            key={kind}
            kind={kind}
            saldo={reserveSaldo(reservas, kind)}
            meta={metaDe(kind, settings)}
            nota={notaDe(kind, reserveSaldo(reservas, kind), settings)}
            onAportar={(valor) => aportar(kind, valor)}
            onSacar={(valor) => sacar(kind, valor)}
          />
        ))}
      </div>

      <TabBar active="reservas" onNavigate={onNavigate} />
    </div>
  );
}
