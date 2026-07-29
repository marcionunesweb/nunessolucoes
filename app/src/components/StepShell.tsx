import type { ReactNode } from 'react';

interface StepShellProps {
  index: number; // 0-based
  total: number;
  title: string;
  helper?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onSkip?: () => void;
}

export function StepShell({
  index,
  total,
  title,
  helper,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled,
  onSkip,
}: StepShellProps) {
  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Fase 0 · Configuração</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="progress-label">
          {index + 1} de {total}
        </p>
      </header>

      <div className="step">
        <h1 className="step-title">{title}</h1>
        {helper && <div className="step-helper">{helper}</div>}

        {children}

        <div className="step-footer">
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack} type="button">
              Voltar
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={onNext}
            disabled={nextDisabled}
            type="button"
            style={nextDisabled ? { opacity: 0.5 } : undefined}
          >
            {nextLabel}
          </button>
        </div>
        {onSkip && (
          <button className="btn btn-skip" onClick={onSkip} type="button">
            Não sei ainda / pular
          </button>
        )}
      </div>
    </div>
  );
}
