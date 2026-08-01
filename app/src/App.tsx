import { useEffect, useState, type ReactNode } from 'react';
import type { FinanceSettings, Ledger, Recurring, TransactionType } from './types';
import { emptySettings, emptyLedger } from './types';
import {
  loadSettings,
  saveSettings,
  loadLedger,
  saveLedger,
  newId,
  buildExportPayload,
  type ImportResult,
} from './storage';
import { aplicarCascata, aplicarCascataAoLedger, efeitoNaConta } from './calc';
import { SERVER_MODE, me, getSetupStatus, getData, putData, logout } from './api';
import { Wizard } from './Wizard';
import { Summary } from './Summary';
import { Hoje } from './Hoje';
import { Perguntar } from './Perguntar';
import { Lancar } from './Lancar';
import { Reservas } from './Reservas';
import { Dividas } from './Dividas';
import { Login } from './Login';
import { TOTAL_STEPS } from './stepsMeta';
import type { Tab } from './components/TabBar';

type Screen = 'wizard' | Tab;

type AuthState =
  | { kind: 'checking' }
  | { kind: 'needs-setup' }
  | { kind: 'needs-login' }
  | { kind: 'loading-data' }
  | { kind: 'ready' };

function jaConfigurado(settings: FinanceSettings): boolean {
  return settings.custoEssencial != null;
}

// Lançar a mesma despesa fixa em meses diferentes atualiza o fixo existente
// em vez de duplicá-lo — senão o Livre Real descontaria o mesmo aluguel 2x.
function upsertRecorrente(recorrentes: Recurring[], nome: string, valor: number, diaVencimento: number): Recurring[] {
  const nomeNorm = nome.trim().toLowerCase();
  const idx = recorrentes.findIndex((r) => r.nome.trim().toLowerCase() === nomeNorm);
  if (idx === -1) return [...recorrentes, { id: newId(), nome, valor, diaVencimento }];
  const next = [...recorrentes];
  next[idx] = { ...next[idx], valor, diaVencimento };
  return next;
}

function App() {
  const [settings, setSettings] = useState<FinanceSettings>(() => (SERVER_MODE ? emptySettings : loadSettings()));
  const [ledger, setLedger] = useState<Ledger>(() => (SERVER_MODE ? emptyLedger : loadLedger()));
  const [screen, setScreen] = useState<Screen>(() =>
    SERVER_MODE ? 'hoje' : jaConfigurado(loadSettings()) ? 'hoje' : 'wizard',
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [editReturnTo, setEditReturnTo] = useState<Tab | null>(null);
  const [authState, setAuthState] = useState<AuthState>(() => (SERVER_MODE ? { kind: 'checking' } : { kind: 'ready' }));
  const [saveError, setSaveError] = useState(false);

  async function loadAfterAuth() {
    setAuthState({ kind: 'loading-data' });
    const data = await getData();
    setSettings(data.settings);
    setLedger(data.ledger);
    setScreen(jaConfigurado(data.settings) ? 'hoje' : 'wizard');
    setAuthState({ kind: 'ready' });
  }

  useEffect(() => {
    if (!SERVER_MODE) return;
    (async () => {
      const user = await me();
      if (user) {
        await loadAfterAuth();
      } else {
        const status = await getSetupStatus();
        setAuthState({ kind: status.needsSetup ? 'needs-setup' : 'needs-login' });
      }
    })();
  }, []);

  useEffect(() => {
    if (SERVER_MODE) return;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (SERVER_MODE) return;
    saveLedger(ledger);
  }, [ledger]);

  useEffect(() => {
    if (!SERVER_MODE || authState.kind !== 'ready') return;
    const t = setTimeout(() => {
      putData(settings, ledger)
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true));
    }, 600);
    return () => clearTimeout(t);
  }, [settings, ledger, authState.kind]);

  async function handleLogout() {
    await logout().catch(() => {});
    setSettings(emptySettings);
    setLedger(emptyLedger);
    setAuthState({ kind: 'needs-login' });
  }

  function handleChange(patch: Partial<FinanceSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setScreen(editReturnTo ?? 'summary');
      setEditReturnTo(null);
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleEditStep(index: number, from: Tab) {
    setStepIndex(index);
    setEditReturnTo(from);
    setScreen('wizard');
  }

  function handleSaveAndReturn() {
    if (!editReturnTo) return;
    setScreen(editReturnTo);
    setEditReturnTo(null);
  }

  function handleNavigate(tab: Tab) {
    setScreen(tab);
  }

  function handleLancar(input: {
    tipo: TransactionType;
    valor: number;
    categoria: string;
    contaId: string;
    fixo: boolean;
    diaVencimento?: number;
  }) {
    const id = newId();
    const data = new Date().toISOString();

    if (input.tipo === 'despesa') {
      setSettings((prev) => ({
        ...prev,
        contas: prev.contas.map((c) => (c.id === input.contaId ? { ...c, saldo: c.saldo - input.valor } : c)),
        recorrentes:
          input.fixo && input.diaVencimento
            ? upsertRecorrente(prev.recorrentes, input.categoria, input.valor, input.diaVencimento)
            : prev.recorrentes,
      }));
      setLedger((prev) => ({
        ...prev,
        transacoes: [
          {
            id,
            data,
            tipo: 'despesa',
            valor: input.valor,
            categoria: input.categoria,
            contaId: input.contaId,
            fixo: input.fixo,
          },
          ...prev.transacoes,
        ],
      }));
      return;
    }

    const resultado = aplicarCascata(input.valor, settings, ledger.reservas);
    setSettings((prev) => ({
      ...prev,
      contas: prev.contas.map((c) => (c.id === input.contaId ? { ...c, saldo: c.saldo + resultado.liquido } : c)),
    }));
    setLedger((prev) => ({
      reservas: aplicarCascataAoLedger(prev.reservas, resultado),
      transacoes: [
        {
          id,
          data,
          tipo: 'receita',
          valor: input.valor,
          categoria: input.categoria,
          contaId: input.contaId,
          fixo: input.fixo,
          cascata: {
            doacao: resultado.doacao,
            provisao: resultado.provisao,
            emergencia: resultado.emergencia,
            oportunidade: resultado.oportunidade,
            colchao: resultado.colchao,
          },
        },
        ...prev.transacoes,
      ],
    }));
  }

  function handleEditarContaTransacao(transacaoId: string, novaContaId: string) {
    const t = ledger.transacoes.find((x) => x.id === transacaoId);
    if (!t || t.contaId === novaContaId) return;
    const efeito = efeitoNaConta(t);
    setSettings((prev) => ({
      ...prev,
      contas: prev.contas.map((c) => {
        if (c.id === t.contaId) return { ...c, saldo: c.saldo - efeito };
        if (c.id === novaContaId) return { ...c, saldo: c.saldo + efeito };
        return c;
      }),
    }));
    setLedger((prev) => ({
      ...prev,
      transacoes: prev.transacoes.map((x) => (x.id === transacaoId ? { ...x, contaId: novaContaId } : x)),
    }));
  }

  function handleExport() {
    const payload = buildExportPayload(settings, ledger);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assistente-financeiro-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(payload: ImportResult) {
    setSettings(payload.settings);
    setLedger(payload.ledger);
    setScreen(jaConfigurado(payload.settings) ? 'hoje' : 'wizard');
  }

  if (SERVER_MODE && (authState.kind === 'checking' || authState.kind === 'loading-data')) {
    return (
      <div className="app">
        <div className="step">
          <p className="step-helper">Carregando…</p>
        </div>
      </div>
    );
  }

  if (SERVER_MODE && (authState.kind === 'needs-setup' || authState.kind === 'needs-login')) {
    return <Login needsSetup={authState.kind === 'needs-setup'} onAuthenticated={loadAfterAuth} />;
  }

  let content: ReactNode;

  if (screen === 'wizard') {
    content = (
      <Wizard
        settings={settings}
        onChange={handleChange}
        index={stepIndex}
        onBack={handleBack}
        onNext={handleNext}
        editMode={editReturnTo != null}
        onSaveAndReturn={handleSaveAndReturn}
      />
    );
  } else if (screen === 'summary') {
    content = (
      <Summary
        settings={settings}
        reservas={ledger.reservas}
        onEditStep={(i) => handleEditStep(i, 'summary')}
        onNavigate={handleNavigate}
        onExport={handleExport}
        onImport={handleImport}
        onLogout={SERVER_MODE ? handleLogout : undefined}
      />
    );
  } else if (screen === 'perguntar') {
    content = <Perguntar settings={settings} reservas={ledger.reservas} onNavigate={handleNavigate} />;
  } else if (screen === 'lancar') {
    content = (
      <Lancar
        settings={settings}
        reservas={ledger.reservas}
        transacoes={ledger.transacoes}
        onLancar={handleLancar}
        onEditarConta={handleEditarContaTransacao}
        onNavigate={handleNavigate}
      />
    );
  } else if (screen === 'reservas') {
    content = (
      <Reservas
        settings={settings}
        reservas={ledger.reservas}
        onChangeReservas={(reservas) => setLedger((prev) => ({ ...prev, reservas }))}
        onNavigate={handleNavigate}
      />
    );
  } else if (screen === 'dividas') {
    content = (
      <Dividas settings={settings} onEditStep={(i) => handleEditStep(i, 'dividas')} onNavigate={handleNavigate} />
    );
  } else {
    content = (
      <Hoje
        settings={settings}
        reservas={ledger.reservas}
        onAskToBuy={() => setScreen('perguntar')}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <>
      {SERVER_MODE && saveError && (
        <div className="save-error-banner">Não deu para salvar no servidor — verifique sua conexão.</div>
      )}
      {content}
    </>
  );
}

export default App;
